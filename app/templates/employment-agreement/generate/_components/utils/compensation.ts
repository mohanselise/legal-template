/**
 * Compensation Utilities - Re-exports from shared template library
 * 
 * This file re-exports from the centralized template configuration
 * for backward compatibility with existing imports.
 */

'use client';

export {
  convertAnnualSalary,
  convertSalaryToAnnual,
  formatSalary,
  formatSalaryForStorage,
  convertCurrency,
  validateSalaryRange,
  type PayFrequency,
} from '@/lib/templates/employment-agreement';
