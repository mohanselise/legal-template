import { NextRequest, NextResponse } from 'next/server';
import { openrouter, JURISDICTION_MODEL } from '@/lib/openrouter';
import { CompanyIntelligence, JurisdictionIntelligence, JobTitleAnalysis } from '@/lib/types/smart-form';
import { safeValidateJurisdictionResponse, getValidationErrorMessage } from '@/lib/validation/jurisdiction-schema';

interface CompanyAndRoleRequest {
  companyName: string;
  companyAddress: string;
  jobTitle: string;
  jobResponsibilities?: string;
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
    .slice(0, 2000); // Increased for job responsibilities
}

export async function POST(request: NextRequest) {
  try {
    const body: CompanyAndRoleRequest = await request.json();
    let { companyName, companyAddress, jobTitle, jobResponsibilities } = body;

    if (!companyName || !companyAddress || !jobTitle) {
      return NextResponse.json(
        { error: 'Company name, address, and job title are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs before sending to AI
    companyName = sanitizeInput(companyName);
    companyAddress = sanitizeInput(companyAddress);
    jobTitle = sanitizeInput(jobTitle);
    jobResponsibilities = jobResponsibilities ? sanitizeInput(jobResponsibilities) : undefined;

    // Validate sanitized inputs aren't empty
    if (!companyName || !companyAddress || !jobTitle) {
      return NextResponse.json(
        { error: 'Invalid input after sanitization' },
        { status: 400 }
      );
    }

    // Use OpenRouter with llama-4-scout for jurisdiction and market standards detection
    const completion = await openrouter.chat.completions.create({
      model: JURISDICTION_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a global employment law expert with comprehensive knowledge of labor regulations, market practices, job classifications, and compensation benchmarking.

TASK: Analyze the provided company, location, and job role to return comprehensive intelligence including jurisdiction data, company insights, and job/compensation analysis in a single response.

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
  },

CRITICAL: companySizeEstimate MUST be exactly one of these values (no variations):
- "startup" - Early stage, pre-Series A, <50 employees
- "small" - 50-200 employees
- "medium" - 200-1000 employees  
- "large" - 1000-5000 employees
- "enterprise" - 5000+ employees

NEVER use combined values like "small to medium" or "medium-large". Pick the single best match.
  "jobTitle": {
    "jobTitle": "normalized job title",
    "department": "Engineering|Sales|Marketing|Product|Design|Operations|Finance|HR|Legal|Executive|Other",
    "seniorityLevel": "entry|mid|senior|lead|director|vp|c-level",
    "exemptStatus": "exempt|non-exempt|unclear",
    "typicalSalaryRange": {
      "min": 80000,
      "max": 120000,
      "median": 100000,
      "currency": "USD"
    },
    "equityTypical": true,
    "typicalEquityRange": {
      "min": 0.01,
      "max": 0.25
    },
    "signOnBonusCommon": true,
    "performanceBonusCommon": true,
    "typicalBonusPercent": 10,
    "confidence": "high"
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

JOB TITLE ANALYSIS GUIDELINES:

1. SENIORITY CLASSIFICATION:
   - entry: Junior, Associate, Entry-level (0-2 years)
   - mid: Mid-level, no prefix (2-5 years)
   - senior: Senior (5-8 years)
   - lead: Lead, Principal, Staff (8-12 years)
   - director: Director, Head of (10+ years)
   - vp: VP, SVP (15+ years)
   - c-level: C-suite, Founder, President

2. EXEMPT STATUS (US FLSA):
   - exempt: Most white-collar roles earning >$35,568/year (salaried, no overtime)
   - non-exempt: Hourly roles, some junior roles (eligible for overtime)
   - unclear: Ambiguous or jurisdiction-dependent

3. SALARY BENCHMARKING:
   - Use the detected jurisdiction/location for regional calibration
   - Factor in company industry from company analysis
   - Consider job responsibilities if provided for better accuracy
   - US tech hubs (SF, NYC, Seattle): +30-50% premium
   - Europe: Lower base, higher benefits
   - Asia-Pacific: Varies widely
   - Currency: ALWAYS use USD for typicalSalaryRange

4. EQUITY & BONUSES:
   - Entry/Mid engineers: 0.01-0.1% at startups, often none at large companies
   - Senior/Lead engineers: 0.05-0.25% at startups
   - Directors: 0.1-0.5%
   - VPs: 0.25-1%
   - C-level: 1-5%
   - Sign-on bonus common for: Senior+ engineering/product/design, all sales, Director+ any dept
   - Performance bonus: common for sales (20-100%), exec (10-50%), other roles (5-20%)

5. JOB RESPONSIBILITIES INTEGRATION:
   - If job responsibilities are provided, use them to refine:
     * Seniority level assessment (management duties = higher level)
     * Salary range (specialized skills = higher range)
     * Equity expectations (leadership/strategic role = more equity)
     * Department classification (cross-functional = broader scope)

Always research the specific jurisdiction based on the address provided. Combine insights from company industry, location, and role details for accurate benchmarking.

⚠️ CRITICAL VALIDATION REQUIREMENTS - RESPONSE WILL BE REJECTED IF NOT FOLLOWED:

1. companySizeEstimate: MUST be EXACTLY one of these strings (NO variations allowed):
   "startup" | "small" | "medium" | "large" | "enterprise"
   ❌ WRONG: "small to medium", "medium-large", "Small", "SMALL"
   ✅ CORRECT: "small", "medium", "large"

2. seniorityLevel: MUST be EXACTLY one of:
   "entry" | "mid" | "senior" | "lead" | "director" | "vp" | "c-level"

3. department: MUST be EXACTLY one of:
   "Engineering" | "Sales" | "Marketing" | "Product" | "Design" | "Operations" | "Finance" | "HR" | "Legal" | "Executive" | "Other"

4. exemptStatus: MUST be EXACTLY one of:
   "exempt" | "non-exempt" | "unclear"

5. All currency fields: MUST be "USD" (uppercase)

6. All boolean fields: MUST be true or false (not "true"/"false" strings)

7. All numeric fields: MUST be actual numbers, not strings

Pick the single best match from the allowed values. Your response will be validated against a strict TypeScript schema.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Address: ${companyAddress}
Job Title: ${jobTitle}${jobResponsibilities ? `\nJob Responsibilities: ${jobResponsibilities}` : ''}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(result);

    // Validate jurisdiction data against schema
    const validationResult = safeValidateJurisdictionResponse({
      jurisdiction: parsed.jurisdiction,
      company: parsed.company,
    });

    if (!validationResult) {
      console.error('❌ Jurisdiction validation failed');
      console.error('Raw data received:', JSON.stringify({ jurisdiction: parsed.jurisdiction, company: parsed.company }, null, 2));

      const zodResult = (await import('zod')).z.object({
        jurisdiction: (await import('@/lib/validation/jurisdiction-schema')).jurisdictionIntelligenceSchema,
        company: (await import('@/lib/validation/jurisdiction-schema')).companyIntelligenceSchema,
      }).safeParse({ jurisdiction: parsed.jurisdiction, company: parsed.company });

      if (!zodResult.success) {
        console.error('Validation errors:', JSON.stringify(zodResult.error.format(), null, 2));
        console.error('Specific issues:', JSON.stringify(zodResult.error.issues, null, 2));
      }

      console.error('AI response validation failed for jurisdiction/company:', { companyName, companyAddress });

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

    // Ensure job title data has USD currency
    if (parsed.jobTitle?.typicalSalaryRange) {
      parsed.jobTitle.typicalSalaryRange.currency = 'USD';
    }

    return NextResponse.json({
      jurisdiction: validationResult.jurisdiction as JurisdictionIntelligence,
      company: validationResult.company as CompanyIntelligence,
      jobTitle: parsed.jobTitle as JobTitleAnalysis,
    });
  } catch (error) {
    console.error('Company and role intelligence API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze company and role information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
