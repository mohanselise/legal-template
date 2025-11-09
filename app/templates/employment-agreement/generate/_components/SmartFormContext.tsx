'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { EmploymentAgreementFormData } from '../schema';
import {
  EnrichmentState,
  JurisdictionIntelligence,
  CompanyIntelligence,
  JobTitleAnalysis,
  MarketStandards,
} from '@/lib/types/smart-form';

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
}

const SmartFormContext = createContext<SmartFormContextType | undefined>(undefined);

const STORAGE_KEY = 'employment-agreement-smart-flow-v1';
const TOTAL_STEPS = 7;

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

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  const updateFormData = useCallback((updates: Partial<EmploymentAgreementFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...updates }));
  }, []);

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

    try {
      const response = await fetch('/api/intelligence/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, companyAddress }),
      });

      if (!response.ok) {
        const fallbackMessage =
          response.status === 422
            ? 'Address is too vague. Please provide a complete address including city and country.'
            : `Failed to analyze company (status ${response.status})`;

        const message = await parseErrorMessage(response, fallbackMessage);
        throw new Error(message);
      }

      const data = await response.json();

      setEnrichment((prev) => ({
        ...prev,
        jurisdictionLoading: false,
        companyLoading: false,
        jurisdictionData: data.jurisdiction as JurisdictionIntelligence,
        companyData: data.company as CompanyIntelligence,
        jurisdictionError: undefined,
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
        const payFrequencyMap: Record<string, string> = {
          'weekly': 'weekly',
          'bi-weekly': 'bi-weekly',
          'monthly': 'monthly',
          'annual': 'annual',
        };
        const mappedFrequency = payFrequencyMap[data.jurisdiction.typicalPayFrequency];
        if (mappedFrequency) {
          updates.salaryPeriod = mappedFrequency as any;
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
      const message =
        error instanceof Error
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

  const generateMarketStandards = useCallback(async () => {
    if (!enrichment.jurisdictionData) {
      console.warn('Cannot generate market standards without jurisdiction data');
      return;
    }

    try {
      const response = await fetch('/api/intelligence/market-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction: enrichment.jurisdictionData,
          jobTitle: enrichment.jobTitleData,
          industry: enrichment.companyData?.industryDetected,
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
  }, [enrichment.jurisdictionData, enrichment.jobTitleData, enrichment.companyData]);

  const applyMarketStandards = useCallback(
    (standards: MarketStandards) => {
      // Only fill in non-critical fields that don't override user input
      // Critical fields like salaryAmount, companyName, employeeName, etc. are NEVER auto-filled
      const updates: Partial<EmploymentAgreementFormData> = {};

      // Work arrangement (only if not already set)
      if (!formData.workArrangement) {
        updates.workArrangement = standards.workArrangement;
      }

      // Work hours (only if not already set)
      if (!formData.workHoursPerWeek) {
        updates.workHoursPerWeek = standards.workHoursPerWeek.toString();
      }

      // Payment frequency (only if not already set)
      if (!formData.salaryPeriod || formData.salaryPeriod === 'annual') {
        updates.salaryPeriod = standards.payFrequency === 'annual' ? 'annual' : standards.payFrequency;
      }

      // Currency (only if not already set or is default USD)
      if (!formData.salaryCurrency || formData.salaryCurrency === 'USD') {
        updates.salaryCurrency = standards.currency;
      }

      // PTO days (only if not already set)
      if (!formData.paidTimeOff) {
        updates.paidTimeOff = standards.ptodays.toString();
      }

      // Legal clauses - always apply standards
      updates.includeConfidentiality = standards.confidentialityRequired;
      updates.includeIpAssignment = standards.ipAssignmentRequired;
      updates.includeNonCompete = standards.nonCompeteEnforceable;
      updates.includeNonSolicitation = standards.nonSolicitationCommon;

      // Probation period (only if not already set)
      if (standards.probationPeriodMonths && !formData.probationPeriod) {
        updates.probationPeriod = `${standards.probationPeriodMonths} months`;
      }

      // Notice period (only if not already set)
      if (standards.noticePeriodDays && !formData.noticePeriod) {
        updates.noticePeriod = `${standards.noticePeriodDays} days`;
      }

      updateFormData(updates);
    },
    [updateFormData, formData]
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

  const saveProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        formData,
        currentStep,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [formData, currentStep]);

  const loadProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setFormDataState(state.formData || {});
        setCurrentStep(state.currentStep || 0);
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
