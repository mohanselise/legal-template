import { JurisdictionIntelligence } from '@/lib/types/smart-form';

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
  if (['US', 'CA'].includes(countryCode) && state) {
    return state;
  }

  // For federal countries with significant state variation, show both
  // Germany, Australia, Switzerland have some state variation but less than US/CA
  if (['DE', 'AU', 'CH'].includes(countryCode) && state) {
    // Show state + country for clarity
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
  if (['US', 'CA'].includes(countryCode) && state) {
    return state;
  }

  // For other countries, country name is sufficient
  return country;
}
