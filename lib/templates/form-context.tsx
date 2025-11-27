'use client';

/**
 * Generic Template Form Context
 * 
 * Provides a reusable form context that works with any template configuration.
 * Handles form state, navigation, persistence, enrichment, and background generation.
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  useRef,
  type ReactNode 
} from 'react';
import type { ZodType } from 'zod';
import type {
  EnrichmentState,
  EnrichmentConfig,
  BackgroundGenerationState,
  BackgroundGenerationResult,
  GenerationConfig,
} from './types';
import type {
  JurisdictionIntelligence,
  CompanyIntelligence,
  JobTitleAnalysis,
  MarketStandards,
} from '@/lib/types/smart-form';
import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';

// ==========================================
// TYPES
// ==========================================

type BackgroundCancellationReason = 'form-updated' | 'navigation' | 'consumed' | 'manual';

interface TemplateFormContextType<TFormData> {
  // Template info
  templateId: string;
  
  // Form data
  formData: Partial<TFormData>;
  updateFormData: (updates: Partial<TFormData>) => void;
  setFormData: (data: Partial<TFormData>) => void;

  // Enrichment state
  enrichment: EnrichmentState;

  // Enrichment actions
  analyzeCompany: (companyName: string, companyAddress: string) => Promise<void>;
  analyzeCompanyAndRole: (
    companyName: string,
    companyAddress: string,
    jobTitle: string,
    jobResponsibilities?: string
  ) => Promise<void>;
  analyzeJobTitle: (
    jobTitle: string,
    location?: string,
    companyIndustry?: string,
    companyAddress?: string
  ) => Promise<void>;
  generateMarketStandards: () => Promise<void>;
  applyMarketStandards?: (standards: MarketStandards, formData: Partial<TFormData>) => Partial<TFormData>;

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
  backgroundGeneration: BackgroundGenerationState<TFormData>;
  startBackgroundGeneration: () => Promise<void>;
  cancelBackgroundGeneration: (reason?: BackgroundCancellationReason) => void;
  computeSnapshotHash: (data: Partial<TFormData>) => string;
  awaitBackgroundGeneration: (
    snapshotHash: string,
    timeoutMs?: number
  ) => Promise<BackgroundGenerationResult<TFormData> | null>;
  getBackgroundGenerationState: () => BackgroundGenerationState<TFormData>;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

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

function stableStringify<T>(data: T): string {
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

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
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
    // Ignore JSON parsing failures
  }

  return fallback;
}

// ==========================================
// CONTEXT CREATION
// ==========================================

const TemplateFormContext = createContext<TemplateFormContextType<any> | undefined>(undefined);

// ==========================================
// PROVIDER PROPS
// ==========================================

interface TemplateFormProviderProps<TFormData> {
  children: ReactNode;
  /** Template identifier */
  templateId: string;
  /** Zod schema for validation */
  schema: ZodType<TFormData>;
  /** Default form values */
  defaultValues: Partial<TFormData>;
  /** Total number of steps */
  totalSteps: number;
  /** Storage key for localStorage */
  storageKey: string;
  /** Enrichment configuration */
  enrichmentConfig?: EnrichmentConfig;
  /** Generation configuration */
  generationConfig: GenerationConfig<TFormData>;
  /** Custom market standards application logic */
  applyMarketStandards?: (standards: MarketStandards, formData: Partial<TFormData>) => Partial<TFormData>;
  /** Turnstile reverify dialog component */
  TurnstileDialog?: React.ComponentType<{
    open: boolean;
    onVerified: (token: string) => void;
    onCancel: () => void;
    title?: string;
    description?: string;
  }>;
}

// ==========================================
// PROVIDER IMPLEMENTATION
// ==========================================

export function TemplateFormProvider<TFormData extends Record<string, unknown>>({
  children,
  templateId,
  schema,
  defaultValues,
  totalSteps,
  storageKey,
  enrichmentConfig,
  generationConfig,
  applyMarketStandards: customApplyMarketStandards,
  TurnstileDialog,
}: TemplateFormProviderProps<TFormData>) {
  // Form state
  const [formData, setFormDataState] = useState<Partial<TFormData>>(defaultValues);
  
  // Enrichment state
  const [enrichment, setEnrichment] = useState<EnrichmentState>({
    jurisdictionLoading: false,
    companyLoading: false,
    jobTitleLoading: false,
  });

  // Navigation state
  const [currentStep, setCurrentStep] = useState(0);

  // Background generation state
  const [backgroundGeneration, setBackgroundGeneration] = useState<BackgroundGenerationState<TFormData>>({
    status: 'idle',
  });

  // Market standards tracking
  const [marketStandardsInputHash, setMarketStandardsInputHash] = useState<string | undefined>();
  const [hasGeneratedStandards, setHasGeneratedStandards] = useState(false);

  // Turnstile dialog state
  const [showReverifyDialog, setShowReverifyDialog] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<(() => Promise<BackgroundGenerationResult<TFormData> | null>) | null>(null);

  // Refs for background generation
  const backgroundControllerRef = useRef<AbortController | null>(null);
  const backgroundStateRef = useRef<BackgroundGenerationState<TFormData>>({ status: 'idle' });
  const backgroundPromiseRef = useRef<Promise<BackgroundGenerationResult<TFormData> | null> | null>(null);
  const enrichmentRef = useRef<EnrichmentState>(enrichment);

  // Keep refs in sync
  useEffect(() => {
    backgroundStateRef.current = backgroundGeneration;
  }, [backgroundGeneration]);

  useEffect(() => {
    enrichmentRef.current = enrichment;
  }, [enrichment]);

  // ==========================================
  // HASH COMPUTATION
  // ==========================================

  const computeSnapshotHash = useCallback((data: Partial<TFormData>): string => {
    return stableStringify(data);
  }, []);

  // ==========================================
  // BACKGROUND GENERATION
  // ==========================================

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

        const nextStatus = 
          reason === 'consumed' || reason === 'manual' || reason === 'form-updated' 
            ? 'idle' 
            : 'stale';

        return {
          status: nextStatus,
          snapshotHash: nextStatus === 'idle' ? undefined : prev.snapshotHash,
          startedAt: nextStatus === 'idle' ? undefined : prev.startedAt,
          completedAt: nextStatus === 'idle' ? undefined : prev.completedAt,
          result: nextStatus === 'idle' ? undefined : prev.result,
          error: nextStatus === 'idle' ? undefined : prev.error,
          staleReason: nextStatus === 'stale' ? reason : undefined,
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

    const runGeneration = async (): Promise<BackgroundGenerationResult<TFormData> | null> => {
      try {
        // Get Turnstile token
        const { getTurnstileToken } = await import('@/lib/turnstile-token-manager');
        const turnstileToken = getTurnstileToken();

        if (!turnstileToken) {
          throw new Error('Turnstile verification token not found or expired.');
        }

        // Prepare payload using config or default
        const payload = generationConfig.preparePayload
          ? generationConfig.preparePayload(formData, enrichmentRef.current)
          : { formData, enrichment: enrichmentRef.current };

        const response = await fetch(generationConfig.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            turnstileToken,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> | null = null;
          try {
            errorData = await response.json();
          } catch {
            // Ignore
          }
          
          const message = errorData?.error as string || 
            await parseErrorMessage(response, 'Failed to generate document.');
          
          // Check for token expiration
          const isTokenExpiration = errorData?.['is-token-expiration'] === true;
          const errorCodes = (errorData?.['error-codes'] as string[]) || [];
          const isTokenExpirationError = 
            isTokenExpiration ||
            errorCodes.includes('timeout-or-duplicate') ||
            errorCodes.includes('invalid-input-response');
          
          const isServerConfigError = 
            errorCodes.includes('invalid-input-secret') ||
            message.toLowerCase().includes('server configuration');
          
          if (isTokenExpirationError && response.status === 400 && !isServerConfigError) {
            setPendingGeneration(() => runGeneration);
            setShowReverifyDialog(true);
            return null;
          }
          
          throw new Error(message);
        }

        const apiResult = await response.json() as { document: LegalDocument; metadata?: unknown; usage?: unknown };
        const result: BackgroundGenerationResult<TFormData> = {
          document: apiResult.document,
          metadata: apiResult.metadata as LegalDocument['metadata'],
          usage: apiResult.usage,
          formDataSnapshot,
        };

        setBackgroundGeneration((prev) => {
          if (controller.signal.aborted) {
            return prev;
          }

          if (prev.snapshotHash !== snapshotHash) {
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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';

        setBackgroundGeneration({
          status: 'error',
          snapshotHash,
          startedAt,
          error: errorMessage,
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
  }, [computeSnapshotHash, formData, generationConfig]);

  const awaitBackgroundGeneration = useCallback(
    async (snapshotHash: string, timeoutMs = 300000): Promise<BackgroundGenerationResult<TFormData> | null> => {
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

  const getBackgroundGenerationState = useCallback(() => {
    return backgroundStateRef.current;
  }, []);

  // ==========================================
  // FORM DATA MANAGEMENT
  // ==========================================

  const updateFormData = useCallback((updates: Partial<TFormData>) => {
    setFormDataState((prev) => {
      const next = { ...prev, ...updates };
      const current = backgroundStateRef.current;

      if (current.status !== 'idle' && current.snapshotHash) {
        const prevHash = computeSnapshotHash(prev);
        const nextHash = computeSnapshotHash(next);

        if (nextHash !== current.snapshotHash && prevHash !== nextHash) {
          cancelBackgroundGeneration('form-updated');
        }
      }

      return next;
    });
  }, [cancelBackgroundGeneration, computeSnapshotHash]);

  const setFormData = useCallback((data: Partial<TFormData>) => {
    setFormDataState(data);
  }, []);

  // ==========================================
  // ENRICHMENT ACTIONS
  // ==========================================

  const analyzeCompany = useCallback(async (companyName: string, companyAddress: string) => {
    if (!enrichmentConfig?.company && !enrichmentConfig?.jurisdiction) {
      return;
    }

    setEnrichment((prev) => ({
      ...prev,
      jurisdictionLoading: true,
      companyLoading: true,
      jurisdictionError: undefined,
      companyError: undefined,
    }));

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
        const message = await parseErrorMessage(response, 'Failed to analyze company');
        throw new Error(message);
      }

      const data = await response.json();

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jurisdictionData: data.jurisdiction as JurisdictionIntelligence,
        companyData: data.company as CompanyIntelligence,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze company';

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jurisdictionError: message,
        companyError: message,
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  }, [enrichmentConfig]);

  const analyzeCompanyAndRole = useCallback(async (
    companyName: string,
    companyAddress: string,
    jobTitle: string,
    jobResponsibilities?: string
  ) => {
    if (!enrichmentConfig?.company && !enrichmentConfig?.jurisdiction && !enrichmentConfig?.jobTitle) {
      return;
    }

    setEnrichment((prev) => ({
      ...prev,
      jurisdictionLoading: true,
      companyLoading: true,
      jobTitleLoading: true,
      jurisdictionError: undefined,
      companyError: undefined,
      jobTitleError: undefined,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/intelligence/company-and-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyName, 
          companyAddress, 
          jobTitle, 
          jobResponsibilities 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'Failed to analyze company and role');
        throw new Error(message);
      }

      const data = await response.json();

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jobTitleLoading: false,
        jurisdictionData: data.jurisdiction as JurisdictionIntelligence,
        companyData: data.company as CompanyIntelligence,
        jobTitleData: data.jobTitle as JobTitleAnalysis,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze';

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jobTitleLoading: false,
        jurisdictionError: message,
        companyError: message,
        jobTitleError: message,
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  }, [enrichmentConfig]);

  const analyzeJobTitle = useCallback(async (
    jobTitle: string,
    location?: string,
    companyIndustry?: string,
    companyAddress?: string
  ) => {
    if (!enrichmentConfig?.jobTitle) {
      return;
    }

    setEnrichment((prev) => ({
      ...prev,
      jobTitleLoading: true,
      jobTitleError: undefined,
    }));

    try {
      const response = await fetch('/api/intelligence/job-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          location,
          companyIndustry,
          companyAddress,
        }),
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'Failed to analyze job title');
        throw new Error(message);
      }

      const data: JobTitleAnalysis = await response.json();

      setEnrichment((prev) => ({
        ...prev,
        jobTitleLoading: false,
        jobTitleData: data,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze job title';

      setEnrichment((prev) => ({
        ...prev,
        jobTitleLoading: false,
        jobTitleError: message,
      }));
    }
  }, [enrichmentConfig]);

  const generateMarketStandards = useCallback(async () => {
    if (!enrichmentConfig?.marketStandards) {
      return;
    }

    const currentEnrichment = enrichmentRef.current;
    const jurisdiction = currentEnrichment.jurisdictionData;

    if (!jurisdiction) {
      return;
    }

    try {
      const response = await fetch('/api/intelligence/market-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction,
          jobTitle: currentEnrichment.jobTitleData,
          industry: currentEnrichment.companyData?.industryDetected,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate market standards');
      }

      const standards: MarketStandards = await response.json();

      setEnrichment((prev) => ({
        ...prev,
        marketStandards: standards,
      }));
    } catch (error) {
      console.error('Market standards generation failed:', error);
    }
  }, [enrichmentConfig]);

  // ==========================================
  // MARKET STANDARDS AUTO-GENERATION
  // ==========================================

  useEffect(() => {
    if (!enrichmentConfig?.marketStandards) return;

    const inputHash = JSON.stringify({
      countryCode: enrichment.jurisdictionData?.countryCode,
      state: enrichment.jurisdictionData?.state,
      industry: enrichment.companyData?.industryDetected,
    });

    if (marketStandardsInputHash === undefined) {
      setMarketStandardsInputHash(inputHash);
      return;
    }

    if (marketStandardsInputHash === inputHash) {
      return;
    }

    if (enrichment.marketStandards) {
      setEnrichment((prev) => ({
        ...prev,
        marketStandards: undefined,
      }));
    }

    setMarketStandardsInputHash(inputHash);
  }, [
    enrichment.jurisdictionData?.countryCode,
    enrichment.jurisdictionData?.state,
    enrichment.companyData?.industryDetected,
    enrichmentConfig?.marketStandards,
    marketStandardsInputHash,
    enrichment.marketStandards,
  ]);

  useEffect(() => {
    if (!enrichmentConfig?.marketStandards) return;

    const hasJurisdiction = Boolean(enrichment.jurisdictionData?.country);
    const hasStandards = Boolean(enrichment.marketStandards);

    if (hasJurisdiction && !hasGeneratedStandards && !hasStandards) {
      setHasGeneratedStandards(true);
      generateMarketStandards();
    }
  }, [
    enrichment.jurisdictionData?.country,
    hasGeneratedStandards,
    enrichment.marketStandards,
    enrichmentConfig?.marketStandards,
    generateMarketStandards,
  ]);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // ==========================================
  // PERSISTENCE
  // ==========================================

  const saveProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        formData,
        currentStep,
        enrichment: {
          jurisdictionData: enrichment.jurisdictionData,
          companyData: enrichment.companyData,
          jobTitleData: enrichment.jobTitleData,
          marketStandards: enrichment.marketStandards,
        },
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [formData, currentStep, enrichment, storageKey]);

  const loadProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        setFormDataState(state.formData || defaultValues);
        setCurrentStep(state.currentStep || 0);

        if (state.enrichment) {
          setEnrichment((prev) => ({
            ...prev,
            jurisdictionData: state.enrichment.jurisdictionData,
            companyData: state.enrichment.companyData,
            jobTitleData: state.enrichment.jobTitleData,
            marketStandards: state.enrichment.marketStandards,
            jurisdictionLoading: false,
            companyLoading: false,
            jobTitleLoading: false,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, [storageKey, defaultValues]);

  const clearProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, [storageKey]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, currentStep, saveProgress]);

  // ==========================================
  // TURNSTILE HANDLERS
  // ==========================================

  const handleTokenReverified = useCallback((newToken: string) => {
    setShowReverifyDialog(false);
    
    if (pendingGeneration) {
      const retryFn = pendingGeneration;
      setPendingGeneration(null);
      
      setTimeout(() => {
        retryFn().catch((error) => {
          console.error('Retry after re-verification failed:', error);
          setBackgroundGeneration((prev) => ({
            ...prev,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to retry generation',
          }));
        });
      }, 100);
    }
  }, [pendingGeneration]);

  const handleReverifyCancel = useCallback(() => {
    setShowReverifyDialog(false);
    setPendingGeneration(null);
    if (backgroundControllerRef.current) {
      backgroundControllerRef.current.abort();
    }
    setBackgroundGeneration((prev) => ({
      ...prev,
      status: 'error',
      error: 'Generation cancelled: verification required',
    }));
  }, []);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value: TemplateFormContextType<TFormData> = {
    templateId,
    formData,
    updateFormData,
    setFormData,
    enrichment,
    analyzeCompany,
    analyzeCompanyAndRole,
    analyzeJobTitle,
    generateMarketStandards,
    applyMarketStandards: customApplyMarketStandards,
    currentStep,
    totalSteps,
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

  return (
    <TemplateFormContext.Provider value={value}>
      {children}
      {TurnstileDialog && (
        <TurnstileDialog
          open={showReverifyDialog}
          onVerified={handleTokenReverified}
          onCancel={handleReverifyCancel}
          title="Verification Required"
          description="Your verification has expired. Please verify again to continue."
        />
      )}
    </TemplateFormContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

/**
 * Hook to access the template form context
 * Must be used within a TemplateFormProvider
 */
export function useTemplateForm<TFormData = Record<string, unknown>>(): TemplateFormContextType<TFormData> {
  const context = useContext(TemplateFormContext);
  
  if (!context) {
    throw new Error('useTemplateForm must be used within a TemplateFormProvider');
  }
  
  return context as TemplateFormContextType<TFormData>;
}

/**
 * Type-safe hook creator for specific templates
 * 
 * Usage:
 * ```ts
 * const useEmploymentForm = createTemplateFormHook<EmploymentAgreementFormData>();
 * ```
 */
export function createTemplateFormHook<TFormData>() {
  return function useTypedTemplateForm(): TemplateFormContextType<TFormData> {
    return useTemplateForm<TFormData>();
  };
}

