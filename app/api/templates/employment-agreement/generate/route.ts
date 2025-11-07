import { NextRequest, NextResponse } from 'next/server';
import { openai, EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from '@/lib/openai';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [Generate API] Request received at:', new Date().toISOString());

  try {
    console.log('📥 [Generate API] Parsing request body...');
    const formData = await request.json();
    console.log('✅ [Generate API] Form data parsed successfully');
    console.log('📋 [Generate API] Company:', formData.companyName, '| Employee:', formData.employeeName);

    console.log('🔨 [Generate API] Building prompt from form data...');
    const userPrompt = buildPromptFromFormData(formData);
    const promptLength = userPrompt.length;
    console.log('✅ [Generate API] Prompt built - Length:', promptLength, 'characters');

    console.log('🤖 [Generate API] Calling OpenAI API with GPT-4o (JSON mode)...');
    const apiCallStart = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // Enforce JSON output
      temperature: 0.3, // Lower temperature for more consistent legal text
      max_tokens: 16000, // GPT-4o supports longer outputs for comprehensive legal documents
    });
    const apiCallDuration = Date.now() - apiCallStart;
    console.log('✅ [Generate API] OpenAI response received in', apiCallDuration, 'ms');

    const documentContent = completion.choices[0]?.message?.content || '';
    console.log('📄 [Generate API] Document content length:', documentContent.length, 'characters');
    console.log('💰 [Generate API] Tokens used:', completion.usage);

    if (!documentContent) {
      console.error('❌ [Generate API] No content generated!');
      throw new Error('No content generated');
    }

    // Parse and validate JSON
    let document: EmploymentAgreement;
    try {
      document = JSON.parse(documentContent);
      console.log('✅ [Generate API] JSON parsed successfully');
      console.log('📊 [Generate API] Articles count:', document.articles?.length);
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

function buildPromptFromFormData(data: any): string {
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
  const salaryAmount = data.salaryAmount ? formatNumber(data.salaryAmount) : '[Amount]';
  const salaryPeriodLabel = formatLabel(data.salaryPeriod) || 'Annual';
  const paymentFrequency = derivePaymentFrequency(data.salaryPeriod);
  const workArrangementLabel = formatLabel(data.workArrangement) || 'On-site';
  const employmentTypeLabel = formatLabel(data.employmentType) || 'Full-time';
  const disputeResolutionLabel = formatLabel(data.disputeResolution) || 'Arbitration';
  const workArrangementNormalized = (data.workArrangement || '').toLowerCase();
  const companyContact = [data.companyContactName, data.companyContactTitle].filter(Boolean).join(', ');

  let prompt = `Draft a sophisticated, legally-sound employment agreement with the following specifications:\n\n`;

  prompt += `# PARTIES TO THE AGREEMENT\n\n`;
  prompt += `**EMPLOYER:**\n`;
  prompt += `- Legal Name: ${data.companyName || '[Company Name Required]'}\n`;
  if (data.companyIndustry) prompt += `- Industry: ${data.companyIndustry}\n`;
  prompt += `- Registered Address: ${employerAddress || '[Address]' }\n`;
  if (data.companyWebsite) prompt += `- Website: ${data.companyWebsite}\n`;
  if (companyContact) prompt += `- Primary Contact: ${companyContact}\n`;
  if (data.companyContactEmail) prompt += `- Contact Email: ${data.companyContactEmail}\n`;
  if (data.companyContactPhone) prompt += `- Contact Phone: ${data.companyContactPhone}\n`;
  prompt += `- Referred to as: "EMPLOYER" or "COMPANY"\n\n`;

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
  prompt += `**Base Compensation:**\n`;
  prompt += `- Base Salary: ${data.salaryCurrency || 'USD'} ${salaryAmount} (${salaryPeriodLabel})\n`;
  prompt += `- Payment Schedule: ${paymentFrequency}\n`;
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
  prompt += `# DRAFTING INSTRUCTIONS\n\n`;
  prompt += `Generate a complete, sophisticated employment agreement that:\n`;
  prompt += `1. Uses the EXACT names and details provided above (no placeholders)\n`;
  prompt += `2. Follows the comprehensive structure outlined in the system prompt\n`;
  prompt += `3. Includes properly numbered articles and sections\n`;
  prompt += `4. Contains all standard legal provisions (severability, entire agreement, amendments, force majeure, notices)\n`;
  prompt += `5. Balances protections for both employer and employee\n`;
  prompt += `6. Uses sophisticated legal language appropriate for a professional contract\n`;
  prompt += `7. Includes proper signature blocks for both parties with date lines\n`;
  prompt += `8. Is formatted in clean markdown for professional presentation\n\n`;
  prompt += `The document should be ready for attorney review and execution.`;

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
