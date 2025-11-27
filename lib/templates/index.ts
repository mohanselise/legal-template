/**
 * Template System Exports
 * 
 * Central export point for the multi-template architecture.
 */

// Core types
export type {
  TemplateMeta,
  StepProps,
  StepConfig,
  EnrichmentState,
  EnrichmentConfig,
  BackgroundGenerationResult,
  BackgroundGenerationStatus,
  BackgroundGenerationState,
  GeneratorFunction,
  GenerationConfig,
  GenerationStage,
  TemplateConfig,
  PartyRole,
  PartyInfo,
  StepValidator,
  ValidationResult,
} from './types';

// Generic form context
export { 
  TemplateFormProvider, 
  useTemplateForm,
  createTemplateFormHook,
} from './form-context';

// Shared UI components
export {
  StepHeader,
  StepSection,
  ReviewCard,
  InfoCallout,
  EnrichmentFeedback,
  ConfirmStep,
} from './shared-components';

// Template initialization
export { 
  initializeTemplates, 
  isInitialized,
  resetInitialization,
} from './init';

// API utilities
export {
  validateTurnstile,
  parseGenerationRequest,
  successResponse,
  errorResponse,
  serverError,
  logRequestStart,
  logRequestComplete,
  logError,
  extractEnrichment,
} from './api-utils';
export type {
  GenerationRequestBody,
  GenerationResponse,
  ApiError,
  TurnstileValidationResult,
} from './api-utils';

// Base schemas and types
export {
  // Address schemas
  structuredAddressSchema,
  addressStringSchema,
  // Party schemas
  basePartySchema,
  partyWithRepresentativeSchema,
  companyPartySchema,
  individualPartySchema,
  // Signing schemas
  signingInfoSchema,
  // Date schemas
  dateSchema,
  optionalDateSchema,
  futureDateSchema,
  // Duration schemas
  durationUnitSchema,
  durationSchema,
  durationStringSchema,
  // Legal clause schemas
  legalClausesSchema,
  disputeResolutionSchema,
  governingLawSchema,
  // Currency schemas
  currencyCodeSchema,
  payFrequencySchema,
  monetaryAmountSchema,
  // Common field schemas
  emailOrEmptySchema,
  urlOrEmptySchema,
  phoneSchema,
  // Schema helpers
  createPartySchema,
  mergeSchemas,
} from './base-schema';

export type {
  BaseParty,
  PartyWithRepresentative,
  CompanyParty,
  IndividualParty,
  SigningInfo,
  Duration,
  LegalClauses,
  GoverningLaw,
  MonetaryAmount,
} from './base-schema';

// Registry functions
export {
  registerTemplate,
  registerTemplateMeta,
  unregisterTemplate,
  clearRegistry,
  getTemplate,
  getTemplateOrThrow,
  getTemplateMeta,
  isTemplateAvailable,
  isTemplateRegistered,
  getAllTemplates,
  getAvailableTemplates,
  getAllTemplateMeta,
  getAvailableTemplateMeta,
  getUpcomingTemplateMeta,
  getTemplateIds,
  isValidTemplateId,
  getStaticTemplateParams,
  isTemplateConfig,
} from './registry';

export type { InferFormData } from './registry';

