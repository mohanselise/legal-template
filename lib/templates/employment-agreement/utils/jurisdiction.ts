/**
 * Jurisdiction utilities for employment agreements
 * 
 * Handles formatting and display of jurisdiction information
 * based on country-specific labor law considerations.
 */

import type { JurisdictionIntelligence } from '@/lib/types/smart-form';

/**
 * Countries where state/province labor laws vary significantly
 * and should be shown prominently
 */
const STATE_CENTRIC_COUNTRIES = ['US', 'CA'];

/**
 * Countries with some state variation but less than US/CA
 */
const PARTIAL_STATE_COUNTRIES = ['DE', 'AU', 'CH'];

/**
 * Get human-friendly jurisdiction name for display
 * Handles federal countries where state-level laws matter vs. country-level laws
 */
export function getJurisdictionDisplayName(
  jurisdictionData: JurisdictionIntelligence | undefined
): string {
  if (!jurisdictionData) return 'market';

  const { countryCode, state, country } = jurisdictionData;

  // For US/Canada, state is primary (state labor laws vary significantly)
  if (STATE_CENTRIC_COUNTRIES.includes(countryCode) && state) {
    return state;
  }

  // For federal countries with significant state variation, show both
  if (PARTIAL_STATE_COUNTRIES.includes(countryCode) && state) {
    return `${state}, ${country}`;
  }

  // For all other countries, just show country name
  return country;
}

/**
 * Get concise jurisdiction name for labels (shorter version)
 */
export function getJurisdictionShortName(
  jurisdictionData: JurisdictionIntelligence | undefined
): string {
  if (!jurisdictionData) return 'market';

  const { countryCode, state, country } = jurisdictionData;

  // For US/Canada, state is sufficient
  if (STATE_CENTRIC_COUNTRIES.includes(countryCode) && state) {
    return state;
  }

  // For other countries, country name is sufficient
  return country;
}

/**
 * Get the governing law string for the contract
 */
export function getGoverningLawString(
  jurisdictionData: JurisdictionIntelligence | undefined
): string {
  if (!jurisdictionData) return '';

  const { state, country } = jurisdictionData;

  if (state && country) {
    return `${state}, ${country}`;
  }
  
  return country || '';
}

/**
 * Check if non-compete clauses are typically enforceable in this jurisdiction
 */
export function isNonCompeteEnforceable(
  jurisdictionData: JurisdictionIntelligence | undefined
): boolean {
  if (!jurisdictionData) return false;

  const { countryCode, state } = jurisdictionData;

  // US states with non-compete restrictions
  const nonCompeteBannedStates = [
    'California', 'CA',
    'North Dakota', 'ND',
    'Oklahoma', 'OK',
    'Minnesota', 'MN',
  ];

  if (countryCode === 'US' && state) {
    return !nonCompeteBannedStates.includes(state);
  }

  // Many European countries restrict non-competes
  const nonCompeteRestrictedCountries = ['DE', 'FR', 'NL', 'IT'];
  if (nonCompeteRestrictedCountries.includes(countryCode)) {
    return false;
  }

  return true;
}

/**
 * Get typical notice period for the jurisdiction (in days)
 */
export function getTypicalNoticePeriod(
  jurisdictionData: JurisdictionIntelligence | undefined
): number {
  if (!jurisdictionData) return 14; // Default 2 weeks

  const { countryCode, defaultNoticePeriodDays } = jurisdictionData;

  // Use the data from enrichment if available
  if (defaultNoticePeriodDays) {
    return defaultNoticePeriodDays;
  }

  // Fallback defaults by country
  const countryDefaults: Record<string, number> = {
    US: 14,    // 2 weeks (at-will typical)
    CA: 14,    // 2 weeks
    GB: 30,    // 1 month
    DE: 30,    // 1 month (increases with tenure)
    FR: 30,    // 1 month
    CH: 30,    // 1 month
    AU: 14,    // 2 weeks
    IN: 30,    // 1 month
    SG: 30,    // 1 month
  };

  return countryDefaults[countryCode] || 14;
}

/**
 * Check if the jurisdiction requires written employment contracts
 */
export function requiresWrittenContract(
  jurisdictionData: JurisdictionIntelligence | undefined
): boolean {
  if (!jurisdictionData) return false;
  
  return jurisdictionData.requiresWrittenContract ?? false;
}

/**
 * Check if at-will employment is the norm in this jurisdiction
 */
export function isAtWillJurisdiction(
  jurisdictionData: JurisdictionIntelligence | undefined
): boolean {
  if (!jurisdictionData) return false;
  
  return jurisdictionData.atWillEmployment ?? false;
}

