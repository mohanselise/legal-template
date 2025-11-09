/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji
 *
 * This uses Unicode regional indicator symbols (U+1F1E6 - U+1F1FF)
 * Each country code letter is converted to its corresponding regional indicator
 *
 * Examples:
 * - "US" → 🇺🇸
 * - "GB" → 🇬🇧
 * - "IN" → 🇮🇳
 * - "SG" → 🇸🇬
 *
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g., "US", "GB", "DE")
 * @returns Flag emoji or empty string if invalid
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }

  const codeUpper = countryCode.toUpperCase();

  // Regional indicator symbol base: U+1F1E6 (🇦) corresponds to 'A'
  const REGIONAL_INDICATOR_BASE = 0x1F1E6;
  const A_CHAR_CODE = 'A'.charCodeAt(0);

  try {
    const firstChar = codeUpper.charCodeAt(0) - A_CHAR_CODE + REGIONAL_INDICATOR_BASE;
    const secondChar = codeUpper.charCodeAt(1) - A_CHAR_CODE + REGIONAL_INDICATOR_BASE;

    return String.fromCodePoint(firstChar, secondChar);
  } catch {
    // Invalid country code
    return '';
  }
}

/**
 * Get flag emoji with fallback to a globe emoji
 */
export function getFlagEmojiWithFallback(countryCode: string | undefined): string {
  if (!countryCode) return '🌍';
  const flag = getFlagEmoji(countryCode);
  return flag || '🌍';
}

/**
 * Common country code to name mapping for display
 * Not exhaustive, but covers most common jurisdictions
 */
export const COUNTRY_NAMES: Record<string, string> = {
  // North America
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',

  // Europe
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  PT: 'Portugal',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  PL: 'Poland',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  GR: 'Greece',

  // Asia Pacific
  AU: 'Australia',
  NZ: 'New Zealand',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  SG: 'Singapore',
  HK: 'Hong Kong',
  KR: 'South Korea',
  TW: 'Taiwan',
  MY: 'Malaysia',
  TH: 'Thailand',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',

  // Middle East
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  TR: 'Turkey',

  // Africa
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',

  // South America
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
};

/**
 * Get country name from code, or return the code if unknown
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}
