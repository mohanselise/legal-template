'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { EmploymentAgreementFormData } from '../schema';
import {
  EnrichmentState,
  JurisdictionIntelligence,
  CompanyIntelligence,
  JobTitleAnalysis,
  MarketStandards,
} from '@/lib/types/smart-form';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import {
  convertAnnualSalary,
  convertSalaryToAnnual,
  convertCurrency,
  formatSalaryForStorage,
  validateSalaryRange,
  type PayFrequency,
} from './utils/compensation';

type BackgroundGenerationStatus = 'idle' | 'pending' | 'ready' | 'stale' | 'error';

interface BackgroundGenerationResult {
  document: EmploymentAgreement;
  metadata?: EmploymentAgreement['metadata'];
  usage?: unknown;
  formDataSnapshot: Partial<EmploymentAgreementFormData>;
}

interface BackgroundGenerationState {
  status: BackgroundGenerationStatus;
  snapshotHash?: string;
  startedAt?: string;
  completedAt?: string;
  result?: BackgroundGenerationResult;
  error?: string;
  staleReason?: string;
}

type BackgroundCancellationReason = 'form-updated' | 'navigation' | 'consumed' | 'manual';
export type {
  BackgroundGenerationState,
  BackgroundGenerationResult,
  BackgroundCancellationReason,
};

interface SmartFormContextType {
  // Form data
  formData: Partial<EmploymentAgreementFormData>;
  updateFormData: (updates: Partial<EmploymentAgreementFormData>) => void;
  setFormData: (data: Partial<EmploymentAgreementFormData>) => void;

  // Enrichment state
  enrichment: EnrichmentState;

  // Actions
  analyzeCompany: (companyName: string, companyAddress: string) => Promise<void>;
  analyzeJobTitle: (jobTitle: string, location?: string, industry?: string) => Promise<void>;
  generateMarketStandards: () => Promise<void>;
  applyMarketStandards: (standards: MarketStandards) => void;

  // Navigation
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Persistence
  saveProgress: () => void;
  loadProgress: () => void;
  clearProgress: () => void;

  // Background generation
  backgroundGeneration: BackgroundGenerationState;
  startBackgroundGeneration: () => Promise<void>;
  cancelBackgroundGeneration: (reason?: BackgroundCancellationReason) => void;
  computeSnapshotHash: (data: Partial<EmploymentAgreementFormData>) => string;
  awaitBackgroundGeneration: (
    snapshotHash: string,
    timeoutMs?: number
  ) => Promise<BackgroundGenerationResult | null>;
  getBackgroundGenerationState: () => BackgroundGenerationState;
}

const SmartFormContext = createContext<SmartFormContextType | undefined>(undefined);

const STORAGE_KEY = 'employment-agreement-smart-flow-v1';
const TOTAL_STEPS = 8;
const BACKGROUND_DEFAULT_STATE: BackgroundGenerationState = { status: 'idle' };

function sortObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {}) as T;
  }
  return value;
}

function stableStringify(data: Partial<EmploymentAgreementFormData>): string {
  return JSON.stringify(sortObject(data || {}));
}

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
}

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();

    if (data && typeof data === 'object') {
      const parts: string[] = [];

      if (typeof data.error === 'string' && data.error.trim()) {
        parts.push(data.error.trim());
      }

      if (typeof data.details === 'string' && data.details.trim()) {
        parts.push(data.details.trim());
      }

      if (!parts.length && typeof data.message === 'string' && data.message.trim()) {
        parts.push(data.message.trim());
      }

      if (parts.length) {
        return parts.join(': ');
      }
    }
  } catch {
    // Ignore JSON parsing failures and fall back to default message
  }

  return fallback;
}

export function SmartFormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormDataState] = useState<Partial<EmploymentAgreementFormData>>({
    salaryCurrency: 'USD',
    salaryPeriod: 'annual',
    includeConfidentiality: true,
    includeIpAssignment: true,
    disputeResolution: 'arbitration',
  });

  const [enrichment, setEnrichment] = useState<EnrichmentState>({
    jurisdictionLoading: false,
    companyLoading: false,
    jobTitleLoading: false,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [backgroundGeneration, setBackgroundGeneration] = useState<BackgroundGenerationState>(
    BACKGROUND_DEFAULT_STATE
  );
  const [marketStandardsInputHash, setMarketStandardsInputHash] = useState<string | undefined>();
  const [hasGeneratedStandards, setHasGeneratedStandards] = useState(false);

  const backgroundControllerRef = useRef<AbortController | null>(null);
  const backgroundStateRef = useRef<BackgroundGenerationState>(BACKGROUND_DEFAULT_STATE);
  const backgroundPromiseRef = useRef<Promise<BackgroundGenerationResult | null> | null>(null);
  const enrichmentRef = useRef<EnrichmentState>(enrichment);

  useEffect(() => {
    backgroundStateRef.current = backgroundGeneration;
  }, [backgroundGeneration]);

  // Keep enrichment ref updated
  useEffect(() => {
    enrichmentRef.current = enrichment;
  }, [enrichment]);

  // Define generateMarketStandards early so useEffects can reference it
  const generateMarketStandards = useCallback(async () => {
    // Get latest enrichment state from ref to avoid stale closure
    const currentEnrichment = enrichmentRef.current;
    const jurisdiction = currentEnrichment.jurisdictionData;
    const jobTitle = currentEnrichment.jobTitleData;
    const industry = currentEnrichment.companyData?.industryDetected;

    if (!jurisdiction) {
      console.warn('[Market Standards] Cannot generate without jurisdiction data');
      return;
    }

    console.log('[Market Standards] Starting generation API call...');

    try {
      const response = await fetch('/api/intelligence/market-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction,
          jobTitle,
          industry,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API failed (${response.status}): ${errorText}`);
      }

      const standards: MarketStandards = await response.json();

      console.log('[Market Standards] Generation successful:', {
        workArrangement: standards.workArrangement,
        currency: standards.currency,
        ptodays: standards.ptodays,
      });

      setEnrichment((prev) => ({
        ...prev,
        marketStandards: standards,
      }));
    } catch (error) {
      console.error('[Market Standards] Generation failed:', error);
      // Don't throw - just log the error and continue
    }
  }, []); // Empty deps - reads latest state via closure

  // Detect stale market standards when inputs change
  useEffect(() => {
    const inputHash = JSON.stringify({
      countryCode: enrichment.jurisdictionData?.countryCode,
      state: enrichment.jurisdictionData?.state,
      jobTitle: formData.jobTitle,
      industry: enrichment.companyData?.industryDetected,
    });

    // Initialize hash on first run (when no hash exists yet)
    if (marketStandardsInputHash === undefined) {
      setMarketStandardsInputHash(inputHash);
      return;
    }

    // Skip if hash hasn't actually changed (avoid unnecessary updates)
    if (marketStandardsInputHash === inputHash) {
      return;
    }

    // Hash changed - check if we need to clear standards
    if (enrichment.marketStandards) {
      console.log('[Market Standards] Inputs changed, clearing stale standards', {
        old: marketStandardsInputHash,
        new: inputHash,
      });

      // Clear stale standards and update hash in same batch
      setEnrichment((prev) => ({
        ...prev,
        marketStandards: undefined,
      }));
    }

    // Always update hash when it changes (whether we cleared standards or not)
    setMarketStandardsInputHash(inputHash);
  }, [
    // Only react to input changes, NOT to marketStandards or hash updates
    enrichment.jurisdictionData?.countryCode,
    enrichment.jurisdictionData?.state,
    enrichment.companyData?.industryDetected,
    formData.jobTitle,
  ]);

  // Auto-generate market standards when prerequisites are met
  // Use specific fields instead of full objects to avoid infinite loops
  useEffect(() => {
    const hasJobTitle = Boolean(enrichment.jobTitleData?.jobTitle);
    const hasJurisdiction = Boolean(enrichment.jurisdictionData?.country);
    const hasStandards = Boolean(enrichment.marketStandards);

    if (
      hasJobTitle &&
      hasJurisdiction &&
      !hasGeneratedStandards &&
      !hasStandards
    ) {
      console.log('[Market Standards] Triggering generation with:', {
        jobTitle: enrichment.jobTitleData?.jobTitle,
        jurisdiction: enrichment.jurisdictionData?.country,
      });
      setHasGeneratedStandards(true);
      generateMarketStandards();
    }
  }, [
    // Only depend on primitive values, not objects (avoid reference changes)
    enrichment.jobTitleData?.jobTitle,
    enrichment.jurisdictionData?.country,
    hasGeneratedStandards,
    Boolean(enrichment.marketStandards),
    generateMarketStandards,
  ]);

  // Note: We don't need to reset hasGeneratedStandards when standards are cleared
  // because the auto-generation effect (above) already checks !hasStandards condition
  // and the flag prevents duplicate generation attempts

  // Define saveProgress early so auto-save effect can reference it
  const saveProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Capture enrichment at call time (not in dependencies to avoid infinite loops)
      const currentEnrichment = enrichment;

      const state = {
        formData,
        currentStep,
        enrichment: {
          jurisdictionData: currentEnrichment.jurisdictionData,
          companyData: currentEnrichment.companyData,
          jobTitleData: currentEnrichment.jobTitleData,
          marketStandards: currentEnrichment.marketStandards,
        },
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [formData, currentStep]); // Don't include enrichment - read via closure

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [formData, currentStep, saveProgress]);

  const computeSnapshotHash = useCallback((data: Partial<EmploymentAgreementFormData>) => {
    return stableStringify(data);
  }, []);

  const cancelBackgroundGeneration = useCallback(
    (reason: BackgroundCancellationReason = 'manual') => {
      if (backgroundControllerRef.current) {
        backgroundControllerRef.current.abort();
        backgroundControllerRef.current = null;
      }

      backgroundPromiseRef.current = null;

      setBackgroundGeneration((prev) => {
        if (prev.status === 'idle') {
          return prev;
        }

        const nextStatus: BackgroundGenerationStatus =
          reason === 'consumed' ? 'idle' : reason === 'manual' ? 'idle' : 'stale';

        return {
          status: nextStatus,
          snapshotHash: nextStatus === 'idle' ? undefined : prev.snapshotHash,
          startedAt: prev.startedAt,
          completedAt: prev.completedAt,
          result: nextStatus === 'idle' ? undefined : prev.result,
          error: nextStatus === 'idle' ? undefined : prev.error,
          staleReason: reason,
        };
      });
    },
    []
  );

  const startBackgroundGeneration = useCallback(async () => {
    const snapshotHash = computeSnapshotHash(formData);

    if (!snapshotHash) {
      return;
    }

    const currentState = backgroundStateRef.current;
    if (
      currentState.status === 'pending' &&
      currentState.snapshotHash === snapshotHash
    ) {
      return;
    }

    if (currentState.status === 'ready' && currentState.snapshotHash === snapshotHash) {
      return;
    }

    if (backgroundControllerRef.current) {
      backgroundControllerRef.current.abort();
    }

    const controller = new AbortController();
    backgroundControllerRef.current = controller;

    const startedAt = new Date().toISOString();

    const formDataSnapshot = { ...formData };

    setBackgroundGeneration({
      status: 'pending',
      snapshotHash,
      startedAt,
    });

    const runGeneration = async (): Promise<BackgroundGenerationResult | null> => {
      try {
        const response = await fetch('/api/templates/employment-agreement/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            enrichment: {
              jurisdiction: enrichment.jurisdictionData,
              company: enrichment.companyData,
              jobTitle: enrichment.jobTitleData,
              marketStandards: enrichment.marketStandards,
            },
            acceptedLegalDisclaimer: true,
            understandAiContent: true,
            background: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await parseErrorMessage(response, 'Failed to generate employment agreement.');
          throw new Error(message);
        }

        const apiResult = (await response.json()) as Omit<BackgroundGenerationResult, 'formDataSnapshot'>;
        const result: BackgroundGenerationResult = {
          ...apiResult,
          formDataSnapshot,
        };

        setBackgroundGeneration((prev) => {
          if (controller.signal.aborted || prev.snapshotHash !== snapshotHash) {
            return prev;
          }

          return {
            status: 'ready',
            snapshotHash,
            startedAt,
            completedAt: new Date().toISOString(),
            result,
          };
        });

        return result;
      } catch (error) {
        if (controller.signal.aborted) {
          return null;
        }

        setBackgroundGeneration({
          status: 'error',
          snapshotHash,
          startedAt,
          error: error instanceof Error ? error.message : 'Unknown error during background generation.',
        });

        throw error;
      } finally {
        if (backgroundControllerRef.current === controller) {
          backgroundControllerRef.current = null;
        }
      }
    };

    const generationPromise = runGeneration();
    backgroundPromiseRef.current = generationPromise;

    generationPromise.finally(() => {
      if (backgroundPromiseRef.current === generationPromise) {
        backgroundPromiseRef.current = null;
      }
    });

    try {
      await generationPromise;
    } catch {
      // Error state handled within runGeneration
    }
  }, [computeSnapshotHash, formData, enrichment]);

  const awaitBackgroundGeneration = useCallback(
    async (snapshotHash: string, timeoutMs = 60000): Promise<BackgroundGenerationResult | null> => {
      const current = backgroundStateRef.current;

      if (current.status === 'ready' && current.snapshotHash === snapshotHash) {
        return current.result ?? null;
      }

      if (
        current.status === 'pending' &&
        current.snapshotHash === snapshotHash &&
        backgroundPromiseRef.current
      ) {
        try {
          await promiseWithTimeout(backgroundPromiseRef.current, timeoutMs);
        } catch {
          return null;
        }

        const latest = backgroundStateRef.current;
        if (latest.status === 'ready' && latest.snapshotHash === snapshotHash) {
          return latest.result ?? null;
        }
      }

      return null;
    },
    []
  );

  const updateFormData = useCallback((updates: Partial<EmploymentAgreementFormData>) => {
    setFormDataState((prev) => {
      const next = { ...prev, ...updates };
      const current = backgroundStateRef.current;

      if (
        current.status !== 'idle' &&
        current.snapshotHash &&
        computeSnapshotHash(next) !== current.snapshotHash
      ) {
        cancelBackgroundGeneration('form-updated');
      }

      return next;
    });
  }, [cancelBackgroundGeneration, computeSnapshotHash]);

  const setFormData = useCallback((data: Partial<EmploymentAgreementFormData>) => {
    setFormDataState(data);
  }, []);

  const analyzeCompany = useCallback(async (companyName: string, companyAddress: string) => {
    setEnrichment((prev) => ({
      ...prev,
      jurisdictionLoading: true,
      companyLoading: true,
      jurisdictionError: undefined,
      companyError: undefined,
    }));

    // Create AbortController with 15 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/intelligence/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, companyAddress }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const fallbackMessage =
          response.status === 422
            ? 'Address is too vague. Please provide a complete address including city and country.'
            : `Failed to analyze company (status ${response.status})`;

        const message = await parseErrorMessage(response, fallbackMessage);
        throw new Error(message);
      }

      const data = await response.json();

      // Check confidence level and add warning for low confidence
      const jurisdictionData = data.jurisdiction as JurisdictionIntelligence;
      const lowConfidence = jurisdictionData.confidence === 'low';
      const confidenceWarning = lowConfidence
        ? 'Jurisdiction detection has low confidence. Please verify the detected location is correct.'
        : undefined;

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jurisdictionData,
        companyData: data.company as CompanyIntelligence,
        jurisdictionError: confidenceWarning,
        companyError: undefined,
      }));

      // Auto-populate fields based on jurisdiction intelligence
      const updates: Partial<EmploymentAgreementFormData> = {};

      // Currency
      if (data.jurisdiction?.currency) {
        updates.salaryCurrency = data.jurisdiction.currency;
      }

      // Pay frequency (only if still at default 'annual')
      if (data.jurisdiction?.typicalPayFrequency && formData.salaryPeriod === 'annual') {
        // Map typicalPayFrequency to salaryPeriod values
        const payFrequencyMap: Record<string, EmploymentAgreementFormData['salaryPeriod']> = {
          'weekly': 'weekly',
          'bi-weekly': 'bi-weekly',
          'monthly': 'monthly',
          'annual': 'annual',
        };
        const mappedFrequency = payFrequencyMap[data.jurisdiction.typicalPayFrequency];
        if (mappedFrequency) {
          updates.salaryPeriod = mappedFrequency;
        }
      }

      // Governing law
      if (data.jurisdiction?.state && data.jurisdiction?.country) {
        updates.governingLaw = `${data.jurisdiction.state}, ${data.jurisdiction.country}`;
      } else if (data.jurisdiction?.country) {
        updates.governingLaw = data.jurisdiction.country;
      }

      // Notice period (if required by jurisdiction)
      if (data.jurisdiction?.defaultNoticePeriodDays && !formData.noticePeriod) {
        updates.noticePeriod = `${data.jurisdiction.defaultNoticePeriodDays} days`;
      }

      // Probation period (if common in jurisdiction)
      if (data.jurisdiction?.probationDurationMonths &&
          data.jurisdiction?.probationPeriodCommon &&
          !formData.probationPeriod) {
        updates.probationPeriod = `${data.jurisdiction.probationDurationMonths} months`;
      }

      if (Object.keys(updates).length > 0) {
        updateFormData(updates);
      }
    } catch (error) {
      console.error('Company analysis failed:', error);

      // Handle timeout specifically
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const message = isTimeout
        ? 'Request timed out. Please check your connection and try again.'
        : error instanceof Error
        ? error.message
        : 'Failed to analyze company information. Please try again.';

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jurisdictionData: undefined,
        companyData: undefined,
        jurisdictionError: message,
        companyError: message,
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  }, [updateFormData]);

  const analyzeJobTitle = useCallback(
    async (jobTitle: string, location?: string, industry?: string) => {
      setEnrichment((prev) => ({
        ...prev,
        jobTitleLoading: true,
        jobTitleError: undefined,
      }));

      try {
        const response = await fetch('/api/intelligence/job-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle, location, industry }),
        });

        if (!response.ok) {
          const fallbackMessage = `Failed to analyze job title (status ${response.status})`;
          const message = await parseErrorMessage(response, fallbackMessage);
          throw new Error(message);
        }

        const data: JobTitleAnalysis = await response.json();

        setEnrichment((prev) => ({
          ...prev,
          jobTitleLoading: false,
          jobTitleData: data,
          jobTitleError: undefined,
        }));
      } catch (error) {
        console.error('Job title analysis failed:', error);

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to analyze job title. Please try again.';

        setEnrichment((prev) => ({
          ...prev,
          jobTitleLoading: false,
          jobTitleData: undefined,
          jobTitleError: message,
        }));
      }
    },
    []
  );

  const applyMarketStandards = useCallback(
    (standards: MarketStandards) => {
      const updates: Partial<EmploymentAgreementFormData> = {};

      if (!formData.workArrangement) {
        updates.workArrangement = standards.workArrangement;
      }

      if (!formData.workHoursPerWeek) {
        updates.workHoursPerWeek = standards.workHoursPerWeek.toString();
      }

      const currentFrequency = (formData.salaryPeriod || 'annual') as PayFrequency;
      const targetFrequency = standards.payFrequency || currentFrequency;
      const hasSalaryPeriod = Boolean(formData.salaryPeriod && formData.salaryPeriod !== 'annual');

      if (!formData.salaryPeriod || !hasSalaryPeriod) {
        updates.salaryPeriod = targetFrequency;
      }

      if (!formData.salaryCurrency || formData.salaryCurrency === 'USD') {
        updates.salaryCurrency = standards.currency;
      }

      const currentSalaryValue = parseFloat(formData.salaryAmount || '');
      const hasSalaryAmount = !Number.isNaN(currentSalaryValue) && currentSalaryValue > 0;
      const jobTitleRange = enrichment.jobTitleData?.typicalSalaryRange;

      const resolvedFrequency = (updates.salaryPeriod || formData.salaryPeriod || 'annual') as PayFrequency;
      const resolvedCurrency =
        updates.salaryCurrency || formData.salaryCurrency || jobTitleRange?.currency || standards.currency;

      if (hasSalaryAmount) {
        let annualEquivalent = convertSalaryToAnnual(currentSalaryValue, currentFrequency);
        const currentCurrency = formData.salaryCurrency || resolvedCurrency;
        if (currentCurrency && resolvedCurrency && currentCurrency !== resolvedCurrency) {
          annualEquivalent = convertCurrency(annualEquivalent, currentCurrency, resolvedCurrency);
        }
        const converted = convertAnnualSalary(annualEquivalent, resolvedFrequency);

        // Validate the converted salary
        const validation = validateSalaryRange(converted, resolvedFrequency, resolvedCurrency);
        if (!validation.valid) {
          console.warn('[Salary Validation]', validation.warning);
          // Still apply but log the warning - user can review in UI
        }

        updates.salaryAmount = formatSalaryForStorage(converted, resolvedFrequency);
      }
      // Note: We don't auto-fill salary amount - user must enter it explicitly or choose placeholder/skip

      if (!formData.paidTimeOff) {
        updates.paidTimeOff = standards.ptodays.toString();
      }

      // Only apply legal clause defaults if user hasn't explicitly set them
      // (preserve user intent if they've already made choices)
      if (formData.includeConfidentiality === undefined) {
        updates.includeConfidentiality = standards.confidentialityRequired;
      }
      if (formData.includeIpAssignment === undefined) {
        updates.includeIpAssignment = standards.ipAssignmentRequired;
      }
      if (formData.includeNonCompete === undefined) {
        updates.includeNonCompete = standards.nonCompeteEnforceable;
      }
      if (formData.includeNonSolicitation === undefined) {
        updates.includeNonSolicitation = standards.nonSolicitationCommon;
      }

      if (standards.probationPeriodMonths && !formData.probationPeriod) {
        updates.probationPeriod = `${standards.probationPeriodMonths} months`;
      }

      if (standards.noticePeriodDays && !formData.noticePeriod) {
        updates.noticePeriod = `${standards.noticePeriodDays} days`;
      }

      updateFormData(updates);
    },
    [updateFormData, formData, enrichment.jobTitleData]
  );

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const loadProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setFormDataState(state.formData || {});
        setCurrentStep(state.currentStep || 0);

        // Restore enrichment state if available
        if (state.enrichment) {
          setEnrichment((prev) => ({
            ...prev,
            jurisdictionData: state.enrichment.jurisdictionData,
            companyData: state.enrichment.companyData,
            jobTitleData: state.enrichment.jobTitleData,
            marketStandards: state.enrichment.marketStandards,
            // Keep loading states as false (don't restore those)
            jurisdictionLoading: false,
            companyLoading: false,
            jobTitleLoading: false,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, []);

  const clearProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, []);

  const getBackgroundGenerationState = useCallback(() => {
    return backgroundStateRef.current;
  }, []);

  const value: SmartFormContextType = {
    formData,
    updateFormData,
    setFormData,
    enrichment,
    analyzeCompany,
    analyzeJobTitle,
    generateMarketStandards,
    applyMarketStandards,
    currentStep,
    totalSteps: TOTAL_STEPS,
    goToStep,
    nextStep,
    previousStep,
    saveProgress,
    loadProgress,
    clearProgress,
    backgroundGeneration,
    startBackgroundGeneration,
    cancelBackgroundGeneration,
    computeSnapshotHash,
    awaitBackgroundGeneration,
    getBackgroundGenerationState,
  };

  return <SmartFormContext.Provider value={value}>{children}</SmartFormContext.Provider>;
}

export function useSmartForm() {
  const context = useContext(SmartFormContext);
  if (!context) {
    throw new Error('useSmartForm must be used within SmartFormProvider');
  }
  return context;
}
