/**
 * Employment Agreement Schema - Re-exports from shared template library
 * 
 * This file re-exports from the centralized template configuration
 * for backward compatibility with existing imports.
 */

export { 
  employmentAgreementSchema, 
  employmentAgreementDefaultValues as defaultValues,
  type EmploymentAgreementFormData,
} from '@/lib/templates/employment-agreement';
