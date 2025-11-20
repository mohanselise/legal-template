import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/openrouter';

type SectionKey = 'basics' | 'compensation' | 'workTerms' | 'legalTerms';

/**
 * Progressive Document Generation API
 * Generates specific sections of the employment agreement as the user completes each form step
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔧 [Section API] Section generation request received:', new Date().toISOString());
  
  try {
    const { section, data } = await request.json();
    console.log('📋 [Section API] Generating section:', section);

    const prompt = buildSectionPrompt(section, data);
    console.log('🤖 [Section API] Calling OpenRouter for section:', section);

    const completion = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert legal drafter. Generate the requested section using exact information provided and appropriate formatting for the jurisdiction.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const sectionContent = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - startTime;
    
    console.log('✅ [Section API] Section generated in', duration, 'ms');
    console.log('📄 [Section API] Content length:', sectionContent.length);

    return NextResponse.json({
      section,
      content: sectionContent,
      usage: completion.usage,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Section API] Error after', duration, 'ms:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate section', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildSectionPrompt(section: string, data: any): string {
  const employerAddress = formatAddress(
    data.companyAddress,
    data.companyCity,
    data.companyState,
    data.companyPostalCode,
    data.companyCountry
  );
  const employeeAddress = formatAddress(
    data.employeeAddress,
    data.employeeCity,
    data.employeeState,
    data.employeePostalCode,
    data.employeeCountry
  );
  const salaryPeriodLabel = formatLabel(data.salaryPeriod) || 'year';
  const workArrangementLabel = formatLabel(data.workArrangement) || 'On-site';
  const employmentTypeLabel = formatLabel(data.employmentType) || 'Full-time';
  const companyContact = [data.companyContactName, data.companyContactTitle].filter(Boolean).join(', ');

  switch (section as SectionKey) {
    case 'basics':
      return `Generate the opening sections of an employment agreement including:

**Document Header:**
- Title: "EMPLOYMENT AGREEMENT"
- Effective Date: ${data.startDate || new Date().toISOString().split('T')[0]}

**Parties Section:**
This agreement is between:
- EMPLOYER: ${data.companyName || 'Company'}${data.companyIndustry ? `, a ${data.companyIndustry}` : ''}
  - Registered Address: ${employerAddress || '[Provide address]'}
  ${data.companyWebsite ? `- Website: ${data.companyWebsite}
  ` : ''}${companyContact ? `- Primary Contact: ${companyContact}
  ` : ''}${data.companyContactEmail ? `- Contact Email: ${data.companyContactEmail}
  ` : ''}${data.companyContactPhone ? `- Contact Phone: ${data.companyContactPhone}
  ` : ''}- EMPLOYEE: ${data.employeeName || 'Employee Name'}
  - Residential Address: ${employeeAddress || '[Provide address]'}
  ${data.employeeEmail ? `- Email: ${data.employeeEmail}
  ` : ''}${data.employeePhone ? `- Phone: ${data.employeePhone}
  ` : ''}

**Recitals (WHEREAS clauses):**
Create 2-3 brief recitals establishing:
- The employer's business operations${data.companyIndustry ? ` within the ${data.companyIndustry} sector` : ''}
- The employer's desire to employ the individual for the ${data.jobTitle || 'role'}
- The employee's acceptance of the position and agreement to the terms

Format professionally in markdown. Use defined terms (EMPLOYER, EMPLOYEE, AGREEMENT).`;

    case 'compensation': {
      const benefits: string[] = [];
      if (data.healthInsurance) benefits.push('- Health Insurance');
      if (data.dentalInsurance) benefits.push('- Dental Insurance');
      if (data.visionInsurance) benefits.push('- Vision Insurance');
      if (data.retirementPlan) benefits.push('- Retirement Plan');
      if (data.paidTimeOff) benefits.push(`- Paid Time Off: ${data.paidTimeOff}`);
      if (data.sickLeave) benefits.push(`- Sick Leave: ${data.sickLeave}`);
      if (data.otherBenefits) benefits.push(`- Additional Benefits: ${data.otherBenefits}`);
      if (benefits.length === 0) {
        benefits.push('- Outline standard benefit eligibility and enrollment.');
      }

      return `Generate the COMPENSATION AND BENEFITS article for an employment agreement:

**Base Compensation:**
- Salary: ${data.salaryCurrency || 'USD'} ${data.salaryAmount ? formatNumber(data.salaryAmount) : '[Amount]'} per ${salaryPeriodLabel}
- Payment frequency: ${derivePaymentFrequency(data.salaryPeriod)}
${data.signOnBonus ? `- Sign-On Bonus: ${data.signOnBonus}
` : ''}

${data.bonusStructure ? `**Bonus / Incentive Compensation:**
- Structure: ${data.bonusStructure}
- Clarify eligibility, calculation, and payment timing

` : ''}${data.equityOffered ? `**Equity Compensation:**
- Grant Details: ${data.equityOffered}
- Include vesting schedule, cliff, and governing plan terms

` : ''}**Benefits:**
${benefits.join('\n')}

Include numbered subsections covering base pay, bonus, equity (if applicable), benefits enrollment, review cadence, and adjustments.`;
    }

    case 'workTerms':
      return `Generate the POSITION, DUTIES, AND WORK ARRANGEMENTS article:

**Position Details:**
- Title: ${data.jobTitle || 'Job Title'}
${data.department ? `- Department / Team: ${data.department}
` : ''}${data.reportsTo ? `- Reports To: ${data.reportsTo}
` : ''}- Employment Classification: ${employmentTypeLabel}
- Start Date: ${data.startDate || 'To be determined'}
${data.probationPeriod ? `- Probationary Period: ${data.probationPeriod}
` : ''}

Provide a concise duties and responsibilities overview aligned with the role and industry.

**Work Arrangements:**
- Primary Location: ${data.workLocation || '[Location]'}
- Arrangement: ${workArrangementLabel}
- Standard Hours: ${data.workHoursPerWeek || '40'} hours per week
${data.workSchedule ? `- Typical Schedule: ${data.workSchedule}
` : ''}- Overtime Eligibility: ${data.overtimeEligible ? 'Eligible (non-exempt) — include overtime calculation.' : 'Not eligible (exempt) — confirm compliance expectations.'}

Include subsections for duties, performance expectations, workspace/equipment requirements (especially if remote/hybrid), and periodic review cadence.`;

    case 'legalTerms':
      return `Generate the LEGAL PROVISIONS article covering:

${data.includeConfidentiality ? `**Confidentiality and Non-Disclosure:**
- Provide comprehensive confidentiality obligations during and after employment.
- Define "Confidential Information" broadly and include permissible disclosures.

` : ''}${data.includeIpAssignment ? `**Intellectual Property Assignment:**
- All work product created in the scope of employment belongs to the EMPLOYER.
- Require disclosure of inventions and cooperation with IP protection.

` : ''}${data.includeNonCompete ? `**Non-Competition:**
- Duration: ${data.nonCompeteDuration || '12 months'} post-employment.
- Scope: ${data.nonCompeteRadius || 'Reasonable geographic and market scope'}.
- Ensure restrictions are narrowly tailored and enforceable.

` : ''}${data.includeNonSolicitation ? `**Non-Solicitation:**
- Duration: ${data.nonSolicitationDuration || '12 months'}.
- Cover solicitation of employees, contractors, clients, and prospects.

` : ''}**Termination:**
- Outline voluntary resignation, termination with cause, and termination without cause.
${data.noticePeriod ? `- Notice Requirements: ${data.noticePeriod}.
` : ''}- Cover final pay, benefits continuation, and return of company property.

**Dispute Resolution & Governing Law:**
- Method: ${formatLabel(data.disputeResolution) || 'Arbitration'} (provide process specifics).
- Governing Law: ${data.governingLaw || '[Jurisdiction]'}.
- Include venue, waiver of jury trial if applicable, and fee provisions.

${data.additionalClauses ? `**Additional Clauses:**
${data.additionalClauses}

` : ''}${data.specialProvisions ? `**Special Provisions:**
${data.specialProvisions}

` : ''}Conclude with standard provisions (entire agreement, amendments, severability, notices, counterparts, electronic signatures) and signature blocks for both parties with date lines.`;

    default:
      return `Generate a professional section for: ${section}`;
  }
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
      return 'Hourly, paid according to logged time';
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
