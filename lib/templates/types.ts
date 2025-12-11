/**
 * Core types for the multi-template architecture
 * 
 * This module defines the interfaces and types used across all legal document templates.
 * Templates implement these interfaces to plug into the shared form infrastructure.
 */

import type { ComponentType } from 'react';
import type { z, ZodType } from 'zod';
import type { LucideIcon } from 'lucide-react';
import type { LegalDocument, SignatoryData } from '@/app/api/templates/employment-agreement/schema';
import type {
  JurisdictionIntelligence,
  CompanyIntelligence,
  JobTitleAnalysis,
  MarketStandards
} from '@/lib/types/smart-form';

// ==========================================
// TEMPLATE METADATA
// ==========================================

/**
 * Template metadata for display and routing
 */
export interface TemplateMeta {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  available: boolean;
  href: string;
  popular?: boolean;
  /** SEO keywords for the template */
  keywords?: string[];
  /** Estimated time to complete in minutes */
  estimatedMinutes?: number;
}

// ==========================================
// STEP CONFIGURATION
// ==========================================

/**
 * Props passed to all step components
 */
export interface StepProps<TFormData = Record<string, unknown>> {
  /** Current form data */
  formData: Partial<TFormData>;
  /** Update form data */
  updateFormData: (updates: Partial<TFormData>) => void;
  /** AI enrichment state */
  enrichment?: EnrichmentState;
  /** Callback for final step to start generation */
  onStartGeneration?: (task: () => Promise<BackgroundGenerationResult | null>) => void;
}

/**
 * Configuration for a single step in the form wizard
 */
export interface StepConfig<TFormData = Record<string, unknown>> {
  /** Unique identifier for the step */
  id: string;
  /** Display title for the step */
  title: string;
  /** React component to render for this step */
  component: ComponentType<StepProps<TFormData>>;
  /** Validation function - returns true if step is complete */
  validation?: (data: Partial<TFormData>, enrichment?: EnrichmentState) => boolean;
  /** Whether this step should show the "Use Market Standard" button */
  showMarketStandard?: boolean;
  /** Description/subtitle for the step header */
  description?: string;
}

// ==========================================
// ENRICHMENT CONFIGURATION
// ==========================================

/**
 * Enrichment state for AI-powered form assistance
 * Shared across templates that opt-in to enrichment features
 */
export interface EnrichmentState {
  // Jurisdiction detection (applicable to most contracts)
  jurisdictionLoading: boolean;
  jurisdictionData?: JurisdictionIntelligence;
  jurisdictionError?: string;

  // Company analysis (B2B contracts)
  companyLoading: boolean;
  companyData?: CompanyIntelligence;
  companyError?: string;

  // Job title analysis (employment-specific)
  jobTitleLoading: boolean;
  jobTitleData?: JobTitleAnalysis;
  jobTitleError?: string;

  // Market standards (template-specific variants)
  marketStandards?: MarketStandards;
}

/**
 * Configuration for which enrichment features a template uses
 */
export interface EnrichmentConfig {
  /** Enable jurisdiction detection based on address */
  jurisdiction?: boolean;
  /** Enable company/organization analysis */
  company?: boolean;
  /** Enable job title analysis (employment-specific) */
  jobTitle?: boolean;
  /** Market standards variant to use, or false to disable */
  marketStandards?: 'employment' | 'nda' | 'generic' | false;
}

// ==========================================
// GENERATION CONFIGURATION
// ==========================================

/**
 * Result of background document generation
 */
export interface BackgroundGenerationResult<TFormData = Record<string, unknown>> {
  document: LegalDocument;
  metadata?: LegalDocument['metadata'];
  usage?: unknown;
  formDataSnapshot: Partial<TFormData>;
}

/**
 * Status of background generation
 */
export type BackgroundGenerationStatus = 'idle' | 'pending' | 'ready' | 'stale' | 'error';

/**
 * Full state of background generation
 */
export interface BackgroundGenerationState<TFormData = Record<string, unknown>> {
  status: BackgroundGenerationStatus;
  snapshotHash?: string;
  startedAt?: string;
  completedAt?: string;
  result?: BackgroundGenerationResult<TFormData>;
  error?: string;
  staleReason?: string;
}

/**
 * Generation function type
 */
export type GeneratorFunction<TFormData> = (
  formData: Partial<TFormData>,
  enrichment?: EnrichmentState
) => Promise<LegalDocument>;

/**
 * Configuration for document generation
 */
export interface GenerationConfig<TFormData = Record<string, unknown>> {
  /** API endpoint for generation */
  endpoint: string;
  /** Transform form data before sending to API */
  preparePayload?: (formData: Partial<TFormData>, enrichment?: EnrichmentState) => Record<string, unknown>;
  /** Stages to show during generation loading screen */
  stages?: GenerationStage[];
}

/**
 * A single stage shown during document generation
 */
export interface GenerationStage {
  title: string;
  description: string;
  progress: number;
  duration: number;
}

// ==========================================
// TEMPLATE CONFIGURATION
// ==========================================

/**
 * Complete configuration for a legal document template
 * 
 * @template TFormData - The Zod-inferred form data type for this template
 */
export interface TemplateConfig<TFormData = Record<string, unknown>> {
  /** Unique template identifier (e.g., 'employment-agreement', 'nda') */
  id: string;

  /** Display metadata */
  meta: TemplateMeta;

  /** Zod schema for form validation */
  schema: ZodType<TFormData>;

  /** Default values for the form */
  defaultValues: Partial<TFormData>;

  /** Step definitions for the wizard */
  steps: StepConfig<TFormData>[];

  /** AI enrichment configuration */
  enrichment?: EnrichmentConfig;

  /** Document generation configuration */
  generation: GenerationConfig<TFormData>;

  /** Storage key for localStorage persistence */
  storageKey: string;

  /** Transform form data to signatories for PDF */
  getSignatories?: (formData: Partial<TFormData>) => SignatoryData[];
}

// ==========================================
// PARTY TYPES (Shared across templates)
// ==========================================

/**
 * Common party types used across different contract types
 */
export type PartyRole =
  | 'employer'
  | 'employee'
  | 'company'
  | 'individual'
  | 'disclosing_party'
  | 'receiving_party'
  | 'founder'
  | 'investor'
  | 'controller'
  | 'processor'
  | 'assignor'
  | 'assignee'
  | 'licensor'
  | 'licensee'
  | 'other';

/**
 * Generic party information used across templates
 */
export interface PartyInfo {
  role: PartyRole;
  legalName: string;
  address: string;
  addressStructured?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  };
  email?: string;
  phone?: string;
  representativeName?: string;
  representativeTitle?: string;
  representativeEmail?: string;
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Helper type for step validation functions
 */
export type StepValidator<TFormData> = (
  data: Partial<TFormData>,
  enrichment?: EnrichmentState
) => boolean;

/**
 * Validation result with optional field-level errors
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
  warnings?: Record<string, string>;
}

