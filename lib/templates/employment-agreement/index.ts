/**
 * Employment Agreement Template Exports
 */

// Schema and types
export { 
  employmentAgreementSchema,
  employmentAgreementDefaultValues,
  employmentAgreementStepValidation,
} from './schema';
export type { EmploymentAgreementFormData } from './schema';

// Configuration
export { 
  employmentAgreementConfig,
  employmentGenerationStages,
  employmentStepsConfig,
  getEmploymentSignatories,
  EMPLOYMENT_STEP_IDS,
  MARKET_STANDARD_STEP_INDICES,
} from './config';

// Utilities
export {
  convertAnnualSalary,
  convertSalaryToAnnual,
  formatSalary,
  formatSalaryForStorage,
  convertCurrency,
  validateSalaryRange,
  getPayFrequencyLabel,
} from './utils/compensation';
export type { PayFrequency, SalaryValidationResult } from './utils/compensation';

export {
  getJurisdictionDisplayName,
  getJurisdictionShortName,
  getGoverningLawString,
  isNonCompeteEnforceable,
  getTypicalNoticePeriod,
  requiresWrittenContract,
  isAtWillJurisdiction,
} from './utils/jurisdiction';

