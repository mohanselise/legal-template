import { z } from 'zod';

/**
 * Validation schemas for AI-generated jurisdiction intelligence
 * Ensures AI responses are valid and safe to use
 */

// ISO 3166-1 alpha-2 country codes (comprehensive list)
const VALID_COUNTRY_CODES = [
  // North America
  'US', 'CA', 'MX',
  // Europe
  'GB', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI',
  'IE', 'PL', 'CZ', 'HU', 'RO', 'GR', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE',
  'IS', 'LU', 'MT', 'CY',
  // Asia Pacific
  'AU', 'NZ', 'JP', 'CN', 'IN', 'SG', 'HK', 'KR', 'TW', 'MY', 'TH', 'ID', 'PH',
  'VN', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA', 'BN', 'MO',
  // Middle East
  'AE', 'SA', 'IL', 'TR', 'IR', 'IQ', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM', 'YE',
  // Africa
  'ZA', 'EG', 'NG', 'KE', 'GH', 'TZ', 'UG', 'ET', 'MA', 'DZ', 'TN', 'AO', 'ZM',
  'ZW', 'BW', 'NA', 'MZ', 'SD', 'SN', 'CI', 'CM', 'RW',
  // South America
  'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR',
  // Central America & Caribbean
  'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'BZ', 'JM', 'TT', 'BS', 'BB', 'DO', 'CU',
  'HT', 'PR',
] as const;

// ISO 4217 currency codes (major currencies)
const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'INR', 'RUB', 'BRL', 'ZAR',
  'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 'AED',
  'COP', 'SAR', 'MYR', 'RON', 'ARS', 'VND', 'PKR', 'EGP', 'NGN', 'BDT',
] as const;

// US state codes for validation
const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', // District of Columbia
] as const;

// Canadian province codes
const CA_PROVINCE_CODES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
] as const;

export const jurisdictionIntelligenceSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  countryCode: z.enum(VALID_COUNTRY_CODES, {
    errorMap: () => ({ message: 'Invalid country code. Must be a valid ISO 3166-1 alpha-2 code.' })
  }),
  state: z.string().optional(),
  city: z.string().optional(),

  // Labor market norms
  standardWorkWeek: z.number().min(20).max(70).default(40),
  standardWorkDays: z.string().min(1).default('Monday-Friday'),
  typicalPayFrequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'annual']),

  // Legal defaults
  minimumWage: z.number().min(0).optional(),
  currency: z.enum(VALID_CURRENCIES, {
    errorMap: () => ({ message: 'Invalid currency code. Must be a valid ISO 4217 code.' })
  }),
  currencySymbol: z.string().min(1).max(5).optional(),
  overtimeThreshold: z.number().min(0).max(100).optional(),

  // Common practices
  typicalPTO: z.number().min(0).max(60).default(15),
  probationPeriodCommon: z.boolean(),
  probationDurationMonths: z.number().min(0).max(12).optional(),

  // Legal requirements
  requiresWrittenContract: z.boolean(),
  atWillEmployment: z.boolean(),
  noticePeriodsRequired: z.boolean(),
  defaultNoticePeriodDays: z.number().min(0).max(180).optional(),

  confidence: z.enum(['high', 'medium', 'low']),
}).refine(
  (data) => {
    // Validate US states
    if (data.countryCode === 'US' && data.state) {
      const stateUpper = data.state.toUpperCase();
      return US_STATE_CODES.includes(stateUpper as typeof US_STATE_CODES[number]);
    }
    return true;
  },
  {
    message: 'Invalid US state code. Must be a valid 2-letter state abbreviation.',
    path: ['state'],
  }
).refine(
  (data) => {
    // Validate Canadian provinces
    if (data.countryCode === 'CA' && data.state) {
      const provinceUpper = data.state.toUpperCase();
      return CA_PROVINCE_CODES.includes(provinceUpper as typeof CA_PROVINCE_CODES[number]);
    }
    return true;
  },
  {
    message: 'Invalid Canadian province code. Must be a valid 2-letter province abbreviation.',
    path: ['state'],
  }
);

export const companyIntelligenceSchema = z.object({
  industryDetected: z.string().optional(),
  companySizeEstimate: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  websiteFound: z.string().optional(),
  description: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const companyAnalysisResponseSchema = z.object({
  jurisdiction: jurisdictionIntelligenceSchema,
  company: companyIntelligenceSchema,
});

/**
 * Validates and sanitizes jurisdiction intelligence from AI
 * Throws ZodError if validation fails
 */
export function validateJurisdictionResponse(data: unknown) {
  return companyAnalysisResponseSchema.parse(data);
}

/**
 * Validates and sanitizes, but returns null instead of throwing
 * Useful for graceful degradation
 */
export function safeValidateJurisdictionResponse(data: unknown) {
  const result = companyAnalysisResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Enhanced error logging for debugging
  console.error('❌ Jurisdiction validation failed');
  console.error('Raw data received:', JSON.stringify(data, null, 2));
  console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
  console.error('Specific issues:', result.error.issues);

  return null;
}

/**
 * Extract user-friendly error messages from Zod validation errors
 */
export function getValidationErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Validation failed';
  }

  const zodError = error as { issues?: Array<{ path: string[]; message: string }> };
  if (!zodError.issues || zodError.issues.length === 0) {
    return 'Invalid data format';
  }

  // Group errors by field
  const fieldErrors = zodError.issues.map((issue) => {
    const field = issue.path.join('.') || 'data';
    return `${field}: ${issue.message}`;
  });

  // Return first 3 errors to keep message concise
  const errorList = fieldErrors.slice(0, 3).join('; ');
  const hasMore = fieldErrors.length > 3 ? ` (+${fieldErrors.length - 3} more)` : '';

  return `${errorList}${hasMore}`;
}

/**
 * Additional sanity checks for US states
 */
export function validateUSState(state: string, countryCode: string): boolean {
  if (countryCode !== 'US') return true;

  // Allow full state names or abbreviations
  const stateUpper = state.toUpperCase();
  return US_STATE_CODES.includes(stateUpper as typeof US_STATE_CODES[number]);
}

/**
 * Additional sanity checks for Canadian provinces
 */
export function validateCAProvince(province: string, countryCode: string): boolean {
  if (countryCode !== 'CA') return true;

  const provinceUpper = province.toUpperCase();
  return CA_PROVINCE_CODES.includes(provinceUpper as typeof CA_PROVINCE_CODES[number]);
}

// Export type inference
export type ValidatedJurisdictionResponse = z.infer<typeof companyAnalysisResponseSchema>;
export type ValidatedJurisdiction = z.infer<typeof jurisdictionIntelligenceSchema>;
export type ValidatedCompany = z.infer<typeof companyIntelligenceSchema>;
