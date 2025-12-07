import { NextRequest, NextResponse } from 'next/server';
import { EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from '@/lib/openai';
import { CONTRACT_GENERATION_MODEL, createCompletionWithTracking } from '@/lib/openrouter';
import { getSessionId } from '@/lib/analytics/session';
import { validateTurnstileToken } from 'next-turnstile';
import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';
import type { JurisdictionIntelligence, CompanyIntelligence, JobTitleAnalysis, MarketStandards } from '@/lib/types/smart-form';
import { formatAddressByJurisdiction, parseAddressString } from '@/lib/utils/address-formatting';
import type { StructuredAddress } from '@/lib/utils/address-formatting';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [Generate API] Request received at:', new Date().toISOString());

  try {
    console.log('📥 [Generate API] Parsing request body...');
    const body = await request.json();
    const {
      formData,
      enrichment,
      background = false,
      acceptedLegalDisclaimer,
      understandAiContent,
      turnstileToken,
    } = body;

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json(
        { error: 'Missing form data for agreement generation.' },
        { status: 400 }
      );
    }

    const isBackground = Boolean(background);

    // SECURITY: Require Turnstile token validation for ALL requests (both background and non-background)
    // This prevents bots from bypassing verification by setting background: true
    if (!turnstileToken || typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
      return NextResponse.json(
        {
          error: 'Human verification is required before generating the agreement.',
          details: 'Please complete the Turnstile verification.',
        },
        { status: 400 }
      );
    }

    // Validate Turnstile token on server for ALL requests
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
    const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!TURNSTILE_SECRET_KEY) {
      console.error('⚠️ [Generate API] TURNSTILE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Turnstile secret key not set' },
        { status: 500 }
      );
    }

    // Debug logging in development to help diagnose key mismatches
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Generate API] Turnstile keys check:');
      console.log('   Site key prefix:', TURNSTILE_SITE_KEY?.substring(0, 10) || 'NOT SET');
      console.log('   Secret key prefix:', TURNSTILE_SECRET_KEY.substring(0, 10));
      console.log('   Keys match prefix?', TURNSTILE_SITE_KEY?.substring(0, 10) === TURNSTILE_SECRET_KEY.substring(0, 10) ? '⚠️ WARNING: Keys start with same prefix - might be using site key as secret!' : 'OK');
    }

    try {
      // Log token info in development (first 20 chars only for security)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [Generate API] Validating Turnstile token:');
        console.log('   Token length:', turnstileToken.length);
        console.log('   Token prefix:', turnstileToken.substring(0, 20) + '...');
        console.log('   Secret key prefix:', TURNSTILE_SECRET_KEY.substring(0, 10) + '...');
      }

      const validationResponse = await validateTurnstileToken({
        token: turnstileToken,
        secretKey: TURNSTILE_SECRET_KEY,
        sandbox: false, // Using production keys
      });

      if (process.env.NODE_ENV === 'development') {
        const errorCodes = (validationResponse as any)['error-codes'] || (validationResponse as any).error_codes || [];
        console.log('🔍 [Generate API] Validation response:', {
          success: validationResponse.success,
          errorCodes,
          hostname: validationResponse.hostname,
        });
      }

      if (!validationResponse.success) {
        const errorCodes = (validationResponse as any)['error-codes'] || (validationResponse as any).error_codes || [];
        console.error('[Generate API] Turnstile validation failed:', errorCodes);

        // Provide more specific error messages based on error codes
        let errorMessage = 'Human verification failed. Please verify again.';
        let isTokenExpiration = false;

        if (errorCodes.includes('timeout-or-duplicate')) {
          errorMessage = 'Your verification has expired. Please verify again.';
          isTokenExpiration = true;
        } else if (errorCodes.includes('invalid-input-response')) {
          errorMessage = 'Invalid verification token. Please verify again.';
          isTokenExpiration = true;
        } else if (errorCodes.includes('invalid-input-secret')) {
          // Provide more helpful error message in development
          if (process.env.NODE_ENV === 'development') {
            errorMessage = 'Turnstile configuration error: The secret key does not match the site key. Please check your .env or .env.local file.';
            console.error('⚠️ [Generate API] TURNSTILE_SECRET_KEY appears to be invalid or does not match the site key!');
            console.error('⚠️ [Generate API] Please verify that:');
            console.error('   1. TURNSTILE_SECRET_KEY is set in your .env or .env.local file');
            console.error('   2. NEXT_PUBLIC_TURNSTILE_SITE_KEY matches the site key for this secret key');
            console.error('   3. Both keys are from the same Turnstile site (not mixing production/test keys)');
            console.error('   4. If using Cloudflare Turnstile, ensure you copied the correct secret key (not the site key)');
          } else {
            errorMessage = 'Server configuration error. Please contact support.';
            console.error('⚠️ [Generate API] TURNSTILE_SECRET_KEY appears to be invalid or does not match the site key!');
            console.error('⚠️ [Generate API] Please verify that TURNSTILE_SECRET_KEY matches the secret key for your site key.');
          }
        }

        return NextResponse.json(
          {
            error: errorMessage,
            details: errorCodes.join(', ') || 'Invalid verification token',
            'error-codes': errorCodes,
            'is-token-expiration': isTokenExpiration, // Flag to help client distinguish
          },
          { status: 400 }
        );
      }

      console.log('✅ [Generate API] Turnstile token validated successfully');
    } catch (validationError) {
      console.error('[Generate API] Turnstile validation error:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate human verification token' },
        { status: 500 }
      );
    }

    // For non-background requests, also require legal disclaimers
    if (!isBackground) {
      if (!acceptedLegalDisclaimer || !understandAiContent) {
        return NextResponse.json(
          { error: 'Please acknowledge the required legal disclaimers before generating.' },
          { status: 400 }
        );
      }
    }

    console.log('✅ [Generate API] Form data parsed successfully');
    console.log('📋 [Generate API] Company:', formData.companyName, '| Employee:', formData.employeeName);
    console.log('🛡️ [Generate API] Background request:', isBackground);
    console.log('✅ [Generate API] Turnstile token validated for', isBackground ? 'background' : 'direct', 'generation');
    if (!isBackground) {
      console.log('✅ [Generate API] Legal acknowledgments confirmed.');
    }

    // Log enrichment data availability
    if (enrichment) {
      console.log('🧠 [Generate API] Enrichment data:', {
        hasJurisdiction: !!enrichment.jurisdiction,
        hasCompany: !!enrichment.company,
        hasJobTitle: !!enrichment.jobTitle,
        hasMarketStandards: !!enrichment.marketStandards,
      });
      if (enrichment.jurisdiction) {
        console.log('🌍 [Generate API] Jurisdiction:', enrichment.jurisdiction.state || '', enrichment.jurisdiction.country);
      }
    } else {
      console.log('⚠️ [Generate API] No enrichment data provided (user may have skipped intelligence gathering)');
    }

    console.log('🔨 [Generate API] Building prompt from form data...');
    const userPrompt = buildPromptFromFormData(formData, enrichment);
    const promptLength = userPrompt.length;
    console.log('✅ [Generate API] Prompt built - Length:', promptLength, 'characters');

    // Fetch system prompt and AI model from database with fallbacks
    console.log('📋 [Generate API] Fetching system prompt and AI model from database...');
    let systemPrompt = EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON;
    let aiModel = CONTRACT_GENERATION_MODEL;
    
    try {
      const [template, aiModelSetting] = await Promise.all([
        prisma.template.findUnique({
          where: { slug: 'employment-agreement' },
          select: { systemPrompt: true },
        }),
        prisma.systemSettings.findUnique({
          where: { key: 'documentGenerationAiModel' },
        }),
      ]);
      
      if (template?.systemPrompt) {
        systemPrompt = template.systemPrompt;
        console.log('✅ [Generate API] Using custom system prompt from database');
      } else {
        console.log('ℹ️ [Generate API] Using default system prompt (no custom prompt set)');
      }
      
      if (aiModelSetting?.value) {
        aiModel = aiModelSetting.value;
        console.log('✅ [Generate API] Using AI model from settings:', aiModel);
      } else {
        console.log('ℹ️ [Generate API] Using default AI model:', aiModel);
      }
    } catch (dbError) {
      console.warn('⚠️ [Generate API] Failed to fetch settings from database, using defaults:', dbError);
    }

    console.log('🤖 [Generate API] Calling OpenRouter API with model:', aiModel);
    const apiCallStart = Date.now();

    // Get session ID for analytics
    const sessionId = await getSessionId();

    const completion = await createCompletionWithTracking({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // Enforce JSON output
      temperature: 0.3, // Lower temperature for more consistent legal text
      max_tokens: 16000, // Supports longer outputs for comprehensive legal documents
    }, {
      sessionId,
      templateSlug: 'employment-agreement',
      endpoint: '/api/templates/employment-agreement/generate',
    });
    const apiCallDuration = Date.now() - apiCallStart;
    console.log('✅ [Generate API] OpenRouter response received in', apiCallDuration, 'ms');

    const documentContent = completion.choices[0]?.message?.content || '';
    console.log('📄 [Generate API] Document content length:', documentContent.length, 'characters');
    console.log('💰 [Generate API] Tokens used:', completion.usage);

    if (!documentContent) {
      console.error('❌ [Generate API] No content generated!');
      throw new Error('No content generated');
    }

    // Parse and validate JSON
    let document: LegalDocument;
    try {
      document = JSON.parse(documentContent);
      console.log('✅ [Generate API] JSON parsed successfully');
      console.log('📊 [Generate API] Content blocks count:', document.content?.length);

      // Clean up placeholder phone numbers
      document = removePlaceholderPhoneNumbers(document, formData);
      console.log('🧹 [Generate API] Cleaned up placeholder phone numbers');
    } catch (parseError) {
      console.error('❌ [Generate API] Failed to parse JSON:', parseError);
      console.error('📄 [Generate API] Raw content:', documentContent.substring(0, 500));
      throw new Error('Invalid JSON response from AI');
    }

    const totalDuration = Date.now() - startTime;
    console.log('✨ [Generate API] Request completed successfully in', totalDuration, 'ms');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      document, // This is now a structured JSON object, not a string
      metadata: document.metadata, // Use metadata from the document
      usage: completion.usage,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('❌ [Generate API] ERROR after', totalDuration, 'ms:', error);
    console.error('❌ [Generate API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(
      { error: 'Failed to generate document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

interface EnrichmentData {
  jurisdiction?: JurisdictionIntelligence;
  company?: CompanyIntelligence;
  jobTitle?: JobTitleAnalysis;
  marketStandards?: MarketStandards;
}

/**
 * Removes phone numbers from signatories if not provided in formData.
 * This is a safety check - the model should already omit phone fields per system prompt.
 */
function removePlaceholderPhoneNumbers(
  document: LegalDocument,
  formData: any
): LegalDocument {
  if (!document.signatories || !Array.isArray(document.signatories)) {
    return document;
  }

  const employerPhoneProvided = Boolean(
    formData.companyRepPhone?.trim() || formData.companyContactPhone?.trim()
  );
  const employeePhoneProvided = Boolean(formData.employeePhone?.trim());

  document.signatories.forEach(signatory => {
    if (signatory.party === 'employer' && !employerPhoneProvided && signatory.phone) {
      delete signatory.phone;
    }
    if (signatory.party === 'employee' && !employeePhoneProvided && signatory.phone) {
      delete signatory.phone;
    }
  });

  return document;
}

function buildJurisdictionContext(formData: any, enrichment?: EnrichmentData): string {
  // If no enrichment data at all, provide basic guidance based on formData.governingLaw if available
  if (!enrichment?.jurisdiction) {
    if (formData.governingLaw) {
      let context = `# GOVERNING LAW\n\n`;
      context += `**User-specified governing law:** ${formData.governingLaw}\n`;
      context += `\nNote: Limited jurisdiction intelligence available. Apply standard employment law principles for this jurisdiction.\n`;
      context += `- Include appropriate termination provisions\n`;
      context += `- Consider statutory requirements for notice periods and benefits\n`;
      context += `- Ensure compliance with local labor law\n\n---\n\n`;
      return context;
    }
    return ''; // No jurisdiction context at all
  }

  const j = enrichment.jurisdiction;
  let context = `# JURISDICTION-SPECIFIC INTELLIGENCE & REQUIREMENTS\n\n`;
  context += `We have analyzed the jurisdiction and role to ensure legal compliance. Apply these critical requirements:\n\n`;

  // Jurisdiction basics
  context += `**Governing Jurisdiction:** ${j.state ? `${j.state}, ` : ''}${j.country} (${j.countryCode})\n`;
  context += `Apply ${j.countryCode} formatting conventions for dates, currency, addresses, and numbers.\n\n`;

  // At-will employment
  if (!j.atWillEmployment) {
    context += `⚠️ **CRITICAL - JUST CAUSE REQUIRED:** This jurisdiction does NOT recognize at-will employment.\n`;
    context += `- The agreement MUST include just cause termination provisions\n`;
    context += `- List specific grounds for cause (misconduct, breach, poor performance)\n`;
    context += `- Include procedural safeguards (warnings, opportunity to cure)\n`;
    context += `- DO NOT use at-will language like "either party may terminate at any time for any reason"\n\n`;
  } else {
    context += `✓ **At-Will Employment:** This jurisdiction recognizes at-will employment. Include clear at-will language in the Term article.\n\n`;
  }

  // Written contract requirement
  if (j.requiresWrittenContract) {
    context += `⚠️ **LEGAL REQUIREMENT:** This jurisdiction legally requires written employment contracts.\n`;
    context += `- Include explicit statement: "This written agreement is executed in compliance with [jurisdiction] employment law requirements"\n`;
    context += `- Ensure all statutory terms are clearly documented\n\n`;
  }

  // Notice periods
  if (j.noticePeriodsRequired && j.defaultNoticePeriodDays) {
    context += `⚠️ **STATUTORY NOTICE PERIOD:** Minimum ${j.defaultNoticePeriodDays} days notice is legally required.\n`;
    context += `- Include in termination provisions: "Either party shall provide at least ${j.defaultNoticePeriodDays} days written notice"\n`;
    context += `- May specify longer notice for employer convenience, but not shorter\n`;
    context += `- Address payment in lieu of notice if applicable\n\n`;
  }

  // Non-compete enforceability
  if (enrichment.marketStandards && !enrichment.marketStandards.nonCompeteEnforceable) {
    context += `🚫 **NON-COMPETE PROHIBITED:** Non-compete agreements are NOT enforceable in this jurisdiction.\n`;
    context += `- DO NOT include Article 9 (Non-Competition)\n`;
    context += `- Focus instead on strong confidentiality (Article 7) and non-solicitation (Article 10) provisions\n`;
    context += `- If user requested non-compete, replace with enhanced non-solicitation language\n\n`;
  } else if (formData.includeNonCompete) {
    context += `✓ **Non-Compete Enforceable:** Include Article 9 with reasonable scope.\n`;
    context += `- Limit to: ${formData.nonCompeteDuration || '12 months'} duration, ${formData.nonCompeteRadius || 'primary operating regions'}\n`;
    context += `- Use blue-pencil language allowing court modification\n\n`;
  }

  // Industry context
  if (enrichment.company?.industryDetected) {
    context += `**Industry Context:** ${enrichment.company.industryDetected}\n`;
    if (enrichment.company.industryDetected.toLowerCase().includes('tech') ||
      enrichment.company.industryDetected.toLowerCase().includes('software')) {
      context += `- Include comprehensive IP assignment provisions (Article 8)\n`;
      context += `- Address remote work policies and equipment in Work Schedule article\n`;
      context += `- Consider equity/stock option provisions if offered\n`;
    }
    context += `\n`;
  }

  // Job-specific context
  if (enrichment.jobTitle) {
    const jt = enrichment.jobTitle;
    context += `**Role Intelligence:**\n`;
    context += `- **Seniority:** ${jt.seniorityLevel} level (${jt.department} department)\n`;
    context += `- **FLSA Classification:** ${jt.exemptStatus}\n`;

    if (jt.exemptStatus === 'non-exempt') {
      context += `\n⚠️ **NON-EXEMPT ROLE - OVERTIME REQUIRED:**\n`;
      context += `- This role is NON-EXEMPT under FLSA\n`;
      context += `- MUST include detailed overtime compensation at 1.5x regular rate\n`;
      context += `- Specify overtime threshold (typically ${j.overtimeThreshold || 40} hours/week)\n`;
      context += `- Include timekeeping and approval procedures\n`;
      context += `- Add language: "EMPLOYEE is eligible for overtime compensation at one and one-half (1.5x) times the regular rate for all hours worked in excess of ${j.overtimeThreshold || 40} hours per week."\n\n`;
    } else if (jt.exemptStatus === 'exempt') {
      context += `\n✓ **EXEMPT ROLE:**\n`;
      context += `- This role is EXEMPT from overtime requirements\n`;
      context += `- Include language: "EMPLOYEE is classified as exempt from overtime pay requirements under applicable wage and hour laws."\n`;
      context += `- Base salary must meet minimum threshold (typically $${j.minimumWage ? (j.minimumWage * 2080).toFixed(0) : '35,568'}/year)\n\n`;
    }

    // Equity context
    if (jt.equityTypical && formData.equityOffered) {
      context += `**Equity Compensation:**\n`;
      context += `- Equity is typical for ${jt.seniorityLevel} ${jt.department} roles\n`;
      context += `- Market range: ${jt.typicalEquityRange?.min}%-${jt.typicalEquityRange?.max}%\n`;
      context += `- Include detailed vesting schedule (typically 4-year with 1-year cliff)\n`;
      context += `- Reference governing equity incentive plan\n\n`;
    }
  }

  // Pay frequency
  if (j.typicalPayFrequency) {
    const freqMap: Record<string, string> = {
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-weekly (every two weeks)',
      'monthly': 'Monthly (end of month)',
      'annual': 'Annual (paid bi-weekly)',
    };
    context += `**Payment Frequency:** Standard practice in this jurisdiction is ${freqMap[j.typicalPayFrequency] || j.typicalPayFrequency} payroll.\n\n`;
  }

  context += `---\n\n`;
  return context;
}

function buildPromptFromFormData(data: any, enrichment?: EnrichmentData): string {
  // Use structured address if available, otherwise fall back to parsing or raw string
  const employerStructured: StructuredAddress | null = data.companyAddressStructured || null;
  const employeeStructured: StructuredAddress | null = data.employeeAddressStructured || null;

  // Get jurisdiction country code for formatting
  const jurisdictionCountryCode = enrichment?.jurisdiction?.countryCode;

  let employerAddress: string;
  if (employerStructured) {
    employerAddress = formatAddressByJurisdiction(employerStructured, jurisdictionCountryCode);
  } else if (data.companyAddress) {
    // Try to parse the address string
    const parsed = parseAddressString(data.companyAddress);
    if (parsed.street || parsed.city) {
      employerAddress = formatAddressByJurisdiction(parsed as StructuredAddress, jurisdictionCountryCode);
    } else {
      // Fallback to original formatAddress function
      employerAddress = formatAddress(
        data.companyAddress,
        data.companyCity,
        data.companyState,
        data.companyPostalCode,
        data.companyCountry
      );
    }
  } else {
    employerAddress = formatAddress(
      data.companyAddress,
      data.companyCity,
      data.companyState,
      data.companyPostalCode,
      data.companyCountry
    );
  }

  let employeeAddress: string;
  if (employeeStructured) {
    employeeAddress = formatAddressByJurisdiction(employeeStructured, jurisdictionCountryCode);
  } else if (data.employeeAddress) {
    // Try to parse the address string
    const parsed = parseAddressString(data.employeeAddress);
    if (parsed.street || parsed.city) {
      employeeAddress = formatAddressByJurisdiction(parsed as StructuredAddress, jurisdictionCountryCode);
    } else {
      // Fallback to original formatAddress function
      employeeAddress = formatAddress(
        data.employeeAddress,
        data.employeeCity,
        data.employeeState,
        data.employeePostalCode,
        data.employeeCountry
      );
    }
  } else {
    employeeAddress = formatAddress(
      data.employeeAddress,
      data.employeeCity,
      data.employeeState,
      data.employeePostalCode,
      data.employeeCountry
    );
  }
  // Handle salary amount - preserve placeholder values, format numbers
  let salaryAmount = '[Amount]';
  if (data.salaryAmount) {
    if (data.salaryAmount === '[TO BE DETERMINED]' || data.salaryAmount === '[OMITTED]') {
      salaryAmount = data.salaryAmount; // Preserve placeholder as-is
    } else {
      salaryAmount = formatNumber(data.salaryAmount);
    }
  }
  const salaryPeriodLabel = formatLabel(data.salaryPeriod) || 'Annual';
  const paymentFrequency = derivePaymentFrequency(data.salaryPeriod);
  const workArrangementLabel = formatLabel(data.workArrangement) || 'On-site';
  const employmentTypeLabel = formatLabel(data.employmentType) || 'Full-time';
  const disputeResolutionLabel = formatLabel(data.disputeResolution) || 'Arbitration';
  const workArrangementNormalized = (data.workArrangement || '').toLowerCase();
  const companyContact = [data.companyContactName, data.companyContactTitle].filter(Boolean).join(', ');

  let prompt = `Draft a sophisticated, legally-sound employment agreement with the following specifications:\n\n`;

  // ADD JURISDICTION INTELLIGENCE FIRST
  const jurisdictionContext = buildJurisdictionContext(data, enrichment);
  if (jurisdictionContext) {
    prompt += jurisdictionContext;
  }

  prompt += `# PARTIES TO THE AGREEMENT\n\n`;
  prompt += `**EMPLOYER:**\n`;
  prompt += `- Legal Name: ${data.companyName || '[Company Name Required]'}\n`;
  if (data.companyIndustry) prompt += `- Industry: ${data.companyIndustry}\n`;
  prompt += `- Registered Address: ${employerAddress || '[Address]'}\n`;
  if (data.companyWebsite) prompt += `- Website: ${data.companyWebsite}\n`;
  if (companyContact) prompt += `- Primary Contact: ${companyContact}\n`;
  if (data.companyContactEmail) prompt += `- Contact Email: ${data.companyContactEmail}\n`;
  if (data.companyContactPhone) prompt += `- Contact Phone: ${data.companyContactPhone}\n`;
  prompt += `- Referred to as: "EMPLOYER" or "COMPANY"\n`;

  // Add company representative signing information
  if (data.companyRepName || data.companyRepTitle || data.companyRepEmail) {
    prompt += `\n**Authorized Company Representative (for execution):**\n`;
    if (data.companyRepName) prompt += `- Name: ${data.companyRepName}\n`;
    if (data.companyRepTitle) prompt += `- Title: ${data.companyRepTitle}\n`;
    if (data.companyRepEmail) prompt += `- Email: ${data.companyRepEmail}\n`;
    if (data.companyRepPhone) prompt += `- Phone: ${data.companyRepPhone}\n`;
  }
  prompt += `\n`;

  prompt += `**EMPLOYEE:**\n`;
  prompt += `- Full Legal Name: ${data.employeeName || '[Employee Name Required]'}\n`;
  prompt += `- Residential Address: ${employeeAddress || '[Address]'}\n`;
  prompt += `- Email: ${data.employeeEmail || '[Email]'}\n`;
  if (data.employeePhone) prompt += `- Phone: ${data.employeePhone}\n`;
  prompt += `- Referred to as: "EMPLOYEE"\n\n`;

  prompt += `**Effective Date:** ${data.startDate || new Date().toISOString().split('T')[0]}\n\n`;

  prompt += `# POSITION AND EMPLOYMENT TERMS\n\n`;
  prompt += `**Role Information:**\n`;
  prompt += `- Job Title: ${data.jobTitle || '[Job Title Required]'}\n`;
  if (data.department) prompt += `- Department / Team: ${data.department}\n`;
  if (data.reportsTo) prompt += `- Reports To: ${data.reportsTo} (title and name)\n`;
  prompt += `- Employment Classification: ${employmentTypeLabel}\n`;
  prompt += `- Start Date: ${data.startDate || 'TBD'}\n`;
  if (data.probationPeriod) prompt += `- Probationary Period: ${data.probationPeriod}\n`;
  prompt += `\n**Key Responsibilities:** Draft appropriate duties and responsibilities for a ${data.jobTitle || 'position'} role including core functions, reporting obligations, and performance expectations.\n\n`;

  prompt += `# COMPENSATION STRUCTURE\n\n`;

  // Handle different salary scenarios
  if (salaryAmount === '[OMITTED]') {
    prompt += `**Base Compensation:**\n`;
    prompt += `- Base Salary: OMIT THIS SECTION ENTIRELY from the document. Do not include any mention of base salary amount.\n`;
    prompt += `- Payment Schedule: ${paymentFrequency}\n`;
  } else {
    prompt += `**Base Compensation:**\n`;
    if (salaryAmount === '[TO BE DETERMINED]') {
      prompt += `- Base Salary: Use the exact phrase "[TO BE DETERMINED]" as the amount. Example format: "EMPLOYEE shall receive a base salary of [TO BE DETERMINED], payable ${salaryPeriodLabel.toLowerCase()}..."\n`;
    } else {
      prompt += `- Base Salary: ${data.salaryCurrency || 'USD'} ${salaryAmount} (${salaryPeriodLabel})\n`;
    }
    prompt += `- Payment Schedule: ${paymentFrequency}\n`;
  }
  if (data.signOnBonus) prompt += `- Sign-On Bonus: ${data.signOnBonus}\n`;

  if (data.bonusStructure) {
    prompt += `\n**Bonus/Incentive Compensation:**\n`;
    prompt += `- Structure: ${data.bonusStructure}\n`;
    prompt += `- Include details about eligibility, calculation method, and payment timing\n`;
  }

  if (data.equityOffered) {
    prompt += `\n**Equity Compensation:**\n`;
    prompt += `- Grant Details: ${data.equityOffered}\n`;
    prompt += `- Include vesting schedule, cliff period, and governing plan terms\n`;
  }
  prompt += `\n`;

  prompt += `# BENEFITS AND PERQUISITES\n\n`;
  const benefits: string[] = [];
  if (data.healthInsurance) benefits.push('Health/Medical Insurance');
  if (data.dentalInsurance) benefits.push('Dental Insurance');
  if (data.visionInsurance) benefits.push('Vision Insurance');
  if (data.retirementPlan) benefits.push('Retirement Plan (401k/Pension)');

  if (benefits.length > 0) {
    prompt += `**Insurance and Retirement Benefits:**\n`;
    benefits.forEach((benefit) => {
      prompt += `- ${benefit}\n`;
    });
    prompt += `\nInclude standard language about eligibility, employer contributions, enrollment timing, and governing plan documents.\n\n`;
  }

  if (data.paidTimeOff || data.sickLeave) {
    prompt += `**Time Off and Leave:**\n`;
    if (data.paidTimeOff) prompt += `- Paid Time Off (PTO): ${data.paidTimeOff}\n`;
    if (data.sickLeave) prompt += `- Sick Leave: ${data.sickLeave}\n`;
    prompt += `- Include accrual method, carryover policy, and approval process\n\n`;
  }

  if (data.otherBenefits) {
    prompt += `**Additional Benefits:**\n${data.otherBenefits}\n\n`;
  }

  prompt += `# WORK ARRANGEMENTS AND SCHEDULE\n\n`;
  prompt += `**Location and Schedule:**\n`;
  prompt += `- Primary Work Location: ${data.workLocation || '[Location]'}\n`;
  prompt += `- Work Arrangement: ${workArrangementLabel}\n`;
  if (workArrangementNormalized === 'remote' || workArrangementNormalized === 'hybrid') {
    prompt += `- Include remote/hybrid policy details (equipment, communication cadence, travel expectations)\n`;
  }
  prompt += `- Standard Work Hours: ${data.workHoursPerWeek || '40'} hours per week\n`;
  if (data.workSchedule) prompt += `- Typical Schedule: ${data.workSchedule}\n`;
  prompt += `- Overtime Eligibility: ${data.overtimeEligible ? 'Eligible (non-exempt)' : 'Not eligible (exempt)'}\n`;
  if (data.overtimeEligible) {
    prompt += `- Include overtime compensation terms at 1.5x regular rate for hours exceeding statutory thresholds\n`;
  }
  prompt += `\n`;

  prompt += `# LEGAL PROVISIONS AND RESTRICTIONS\n\n`;

  if (data.includeConfidentiality) {
    prompt += `**Confidentiality and Non-Disclosure:**\n`;
    prompt += `- Include comprehensive confidentiality obligations during and after employment\n`;
    prompt += `- Define "Confidential Information" broadly with reasonable exceptions\n`;
    prompt += `- Require return/destruction of materials upon termination\n\n`;
  }

  if (data.includeIpAssignment) {
    prompt += `**Intellectual Property Assignment:**\n`;
    prompt += `- All work product created during employment belongs to EMPLOYER\n`;
    prompt += `- Cover inventions, designs, software, trade secrets, and derivative works\n`;
    prompt += `- Include disclosure obligations and cooperation with IP protection\n\n`;
  }

  if (data.includeNonCompete) {
    prompt += `**Non-Compete Agreement:**\n`;
    prompt += `- Duration: ${data.nonCompeteDuration || '12 months'} after termination\n`;
    prompt += `- Geographic/Market Scope: ${data.nonCompeteRadius || 'Within the company’s primary operating regions'}\n`;
    prompt += `- Ensure restrictions are no broader than necessary and include blue-pencil language\n\n`;
  }

  if (data.includeNonSolicitation) {
    prompt += `**Non-Solicitation Agreement:**\n`;
    prompt += `- Duration: ${data.nonSolicitationDuration || '12 months'} after termination\n`;
    prompt += `- Prohibit solicitation of employees, contractors, clients, and prospects\n`;
    prompt += `- Cover direct and indirect solicitation and define "solicit" clearly\n\n`;
  }

  prompt += `# TERMINATION PROVISIONS\n\n`;
  if (data.noticePeriod) {
    prompt += `- Notice Period Required: ${data.noticePeriod}\n`;
  }
  prompt += `**Include provisions for:**\n`;
  prompt += `- Voluntary resignation (notice requirements, knowledge transfer, exit process)\n`;
  prompt += `- Termination with cause (define causes such as misconduct, breach, or poor performance)\n`;
  prompt += `- Termination without cause (notice, severance, and benefits continuation)\n`;
  prompt += `- Rights and obligations upon termination, including property return and post-employment covenants\n`;
  prompt += `- Final payment timing, expense reimbursement, and statutory notices\n\n`;

  prompt += `# DISPUTE RESOLUTION AND GOVERNING LAW\n\n`;
  prompt += `- Dispute Resolution Method: ${disputeResolutionLabel}\n`;
  const disputeNormalized = (data.disputeResolution || '').toLowerCase();
  if (disputeNormalized === 'arbitration') {
    prompt += `  - Include arbitration clause (e.g., AAA rules), venue, costs, and binding nature\n`;
  } else if (disputeNormalized === 'mediation') {
    prompt += `  - Include mediation requirement prior to litigation, mediator selection, and timelines\n`;
  }
  prompt += `- Governing Law: ${data.governingLaw || '[State/Country] law'}\n`;
  prompt += `- Venue and jurisdiction provisions for disputes\n`;
  prompt += `- Address waiver of jury trial and prevailing party fees if appropriate\n\n`;

  if (data.additionalClauses) {
    prompt += `# ADDITIONAL SPECIFIC CLAUSES\n\n${data.additionalClauses}\n\n`;
  }

  if (data.specialProvisions) {
    prompt += `# SPECIAL PROVISIONS\n\n${data.specialProvisions}\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `# REQUIREMENTS\n\n`;
  prompt += `- Use exact information provided above (no placeholders or dummy data)\n`;
  prompt += `- Apply ${enrichment?.jurisdiction?.countryCode || 'standard'} formatting conventions\n`;
  prompt += `- Follow the block structure schema strictly\n`;
  prompt += `- Return valid JSON only (no markdown or code blocks)\n`;

  return prompt;
}

function formatAddress(
  street?: string,
  city?: string,
  state?: string,
  postalCode?: string,
  country?: string
): string {
  return [street, [city, state].filter(Boolean).join(', '), postalCode, country]
    .filter((part) => part && String(part).trim().length > 0)
    .join(', ');
}

function formatNumber(value: string): string {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return numeric.toLocaleString();
}

function formatLabel(value?: string): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/_/g, ' ').trim();
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) =>
      segment
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join('-')
    )
    .join(' ');
}

function derivePaymentFrequency(period?: string): string {
  const normalized = period?.toLowerCase();
  switch (normalized) {
    case 'hourly':
      return 'Hourly, payable according to verified time records';
    case 'weekly':
      return 'Weekly payroll cadence';
    case 'bi-weekly':
      return 'Bi-weekly payroll cadence';
    case 'monthly':
      return 'Monthly payroll cadence';
    case 'annual':
      return 'Bi-weekly (standard for salaried annual compensation)';
    default:
      return 'Per company payroll schedule';
  }
}
