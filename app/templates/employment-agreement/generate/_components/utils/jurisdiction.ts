/**
 * Jurisdiction Utilities - Re-exports from shared template library
 * 
 * This file re-exports from the centralized template configuration
 * for backward compatibility with existing imports.
 */

export {
  getJurisdictionDisplayName,
  getJurisdictionShortName,
  getGoverningLawString,
  isNonCompeteEnforceable,
  getTypicalNoticePeriod,
  requiresWrittenContract,
  isAtWillJurisdiction,
} from '@/lib/templates/employment-agreement';
