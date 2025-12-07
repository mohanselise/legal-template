import { NextRequest, NextResponse } from 'next/server';
import { JURISDICTION_MODEL, createCompletionWithTracking } from '@/lib/openrouter';
import { getSessionId } from '@/lib/analytics/session';
import { CompanyIntelligence, JurisdictionIntelligence } from '@/lib/types/smart-form';
import { safeValidateJurisdictionResponse, getValidationErrorMessage } from '@/lib/validation/jurisdiction-schema';

interface CompanyAnalysisRequest {
  companyName: string;
  companyAddress: string;
}

/**
 * Sanitize user input to remove potentially malicious content
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Limit length to prevent abuse
    .slice(0, 500);
}

export async function POST(request: NextRequest) {
  try {
    const body: CompanyAnalysisRequest = await request.json();
    let { companyName, companyAddress } = body;

    if (!companyName || !companyAddress) {
      return NextResponse.json(
        { error: 'Company name and address are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs before sending to AI
    companyName = sanitizeInput(companyName);
    companyAddress = sanitizeInput(companyAddress);

    // Validate sanitized inputs aren't empty
    if (!companyName || !companyAddress) {
      return NextResponse.json(
        { error: 'Invalid company name or address after sanitization' },
        { status: 400 }
      );
    }

    // Get session ID for analytics
    const sessionId = await getSessionId();

    // Use OpenRouter with llama-4-scout for jurisdiction detection
    const completion = await createCompletionWithTracking({
      model: JURISDICTION_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a global employment law expert with comprehensive knowledge of labor regulations, market practices, and employment norms across all countries worldwide.

TASK: Analyze the provided company address and return precise jurisdiction intelligence and company insights.

LOCATION RESOLUTION RULES (HIGHEST PRIORITY):
1. The user-provided address is the source of truth. Never override it based on the company name or other assumptions.
2. Always extract country, state/province, and city directly from the address. If a field is missing, infer the most globally recognized option for that exact string.
3. For ambiguous cities or regions, select the internationally predominant location. Examples (these mappings are mandatory unless the address includes contradicting country/state information):
   - "London" → United Kingdom (England)
   - "Paris" → France
   - "Melbourne" → Australia
   - "Delhi" → India
   - "Singapore" → Singapore
4. If an address conflicts with company branding (e.g., Indian company name but address says London), the address wins—return the jurisdiction that matches the address.
5. When the address contains only a city, add the inferred country and (if relevant) primary state/region for that city.
6. NEVER return "unknown" for required fields—make the best informed inference that aligns with the address.
7. Return ONLY valid JSON matching the exact structure specified. No markdown, no code blocks, no additional text.

Return this exact structure:
{
  "jurisdiction": {
    "country": "full country name in English",
    "countryCode": "ISO 3166-1 alpha-2 code (e.g., US, GB, DE, IN, SG)",
    "state": "state/province/region if applicable (e.g., California, Ontario, Bavaria)",
    "city": "city name if detected",
    "standardWorkWeek": 40,
    "standardWorkDays": "Monday-Friday",
    "typicalPayFrequency": "bi-weekly",
    "minimumWage": 15.50,
    "currency": "ISO 4217 code (e.g., USD, EUR, GBP, INR, SGD)",
    "currencySymbol": "$",
    "overtimeThreshold": 40,
    "typicalPTO": 15,
    "probationPeriodCommon": true,
    "probationDurationMonths": 3,
    "requiresWrittenContract": false,
    "atWillEmployment": true,
    "noticePeriodsRequired": false,
    "defaultNoticePeriodDays": 14,
    "confidence": "high"
  },
  "company": {
    "industryDetected": "Technology / SaaS",
    "companySizeEstimate": "startup",
    "websiteFound": "",
    "description": "",
    "confidence": "medium"
  }
}

JURISDICTION ANALYSIS GUIDELINES:

1. COUNTRY & LOCATION DETECTION:
   - Parse the address carefully to identify country, state/province, and city
   - Use ISO 3166-1 alpha-2 codes for countryCode (always uppercase, 2 letters)
   - For US addresses: include state abbreviation (e.g., CA, NY, TX)
   - For Canadian addresses: include province (e.g., ON, BC, QC)
   - For other federal countries: include region if significant for labor law

2. WORK WEEK & SCHEDULE:
   - Research the standard work week hours for the country (typically 35-48 hours)
   - Most countries: Monday-Friday
   - Some Middle Eastern countries: Sunday-Thursday
   - Include country-specific variations

3. PAY FREQUENCY (critical for employment agreements):
   - North America: typically bi-weekly or semi-monthly
   - Europe: typically monthly (end of month)
   - Australia/NZ: fortnightly (every 2 weeks)
   - Asia: varies (monthly in Japan/Singapore, bi-weekly in Philippines)
   - Middle East: typically monthly
   - Latin America: typically bi-weekly or monthly

4. CURRENCY:
   - Always use ISO 4217 currency codes (3 uppercase letters)
   - Match currency to the country (USD for US, EUR for Eurozone, GBP for UK, etc.)
   - Include the correct currency symbol

5. PAID TIME OFF (PTO):
   - Research statutory minimum vacation days for the country
   - Examples: US (no federal minimum), UK (28 days), France (25 days), Germany (20-30 days)
   - Include typical employer practice, not just legal minimum

6. PROBATION PERIODS:
   - Common in most countries (true for most)
   - Duration varies: 1-6 months typical (3 months most common)
   - Some countries legally mandate probation periods

7. EMPLOYMENT AT-WILL:
   - Mostly a US concept (true for most US states except Montana)
   - Most other countries: false (require just cause for termination)

8. NOTICE PERIODS:
   - US: typically not legally required (at-will employment)
   - Most other countries: legally required notice periods (1 week to 3 months)
   - Varies by tenure and seniority

9. WRITTEN CONTRACTS:
   - US: typically not legally required
   - Most other countries: legally required (EU, UK, Asia, etc.)

10. CONFIDENCE SCORING:
    - "high": Clear, unambiguous country/state/city, well-known jurisdiction
    - "medium": Country clear, but state/city ambiguous or less common jurisdiction
    - "low": Insufficient or contradictory address information

EXAMPLES OF DIVERSE JURISDICTIONS:

United States (CA): bi-weekly pay, 40hr week, no federal PTO, at-will, USD, 0-15 days PTO typical
United Kingdom: monthly pay, 37.5hr week, 28 days PTO, notice required, written contract, GBP
Germany: monthly pay, 40hr week, 20-30 days PTO, strong protections, written contract, EUR
Singapore: monthly pay, 44hr week, 7-21 days PTO, written contract required, SGD
India: monthly pay, 48hr week, 12-30 days PTO, written contract common, INR
UAE (Dubai): monthly pay, 48hr week, 30 days PTO, written contract required, Sunday-Thursday, AED
Brazil: monthly pay, 44hr week, 30 days PTO, strong labor protections, BRL
Australia: fortnightly pay, 38hr week, 20 days PTO + 10 sick days, written contract, AUD
Japan: monthly pay, 40hr week, 10-20 days PTO, written contract expected, JPY
South Africa: monthly pay, 45hr week, 21 days PTO, written contract required, ZAR

Always research the specific jurisdiction based on the address provided. Use your knowledge of global employment law.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}\nAddress: ${companyAddress}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }, {
      sessionId,
      endpoint: '/api/intelligence/company',
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(result);

    // Validate AI response against schema
    const validationResult = safeValidateJurisdictionResponse(parsed);

    if (!validationResult) {
      // Validation failed - return actionable error message
      console.error('AI response validation failed for:', { companyName, companyAddress });

      // Try to parse validation result to get specific errors
      const zodResult = (await import('zod')).z.object({
        jurisdiction: (await import('@/lib/validation/jurisdiction-schema')).jurisdictionIntelligenceSchema,
        company: (await import('@/lib/validation/jurisdiction-schema')).companyIntelligenceSchema,
      }).safeParse(parsed);

      const errorDetails = !zodResult.success
        ? getValidationErrorMessage(zodResult.error)
        : 'AI response did not match expected schema';

      return NextResponse.json(
        {
          error: 'Unable to detect jurisdiction',
          details: `Please provide a more complete address with city and country. ${errorDetails}`,
        },
        { status: 422 }
      );
    }

    const validated = validationResult;

    return NextResponse.json({
      jurisdiction: validated.jurisdiction as JurisdictionIntelligence,
      company: validated.company as CompanyIntelligence,
    });
  } catch (error) {
    console.error('Company intelligence API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze company information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
