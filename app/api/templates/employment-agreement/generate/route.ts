import { NextRequest, NextResponse } from 'next/server';
import { openai, EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Build a detailed prompt from the form data
    const userPrompt = buildPromptFromFormData(formData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent legal text
      max_tokens: 4000,
    });

    const document = completion.choices[0]?.message?.content || '';

    if (!document) {
      throw new Error('No content generated');
    }

    // Extract metadata for future use
    const metadata = {
      companyName: formData.companyName,
      employeeName: formData.employeeName,
      jobTitle: formData.jobTitle,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      document,
      metadata,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Error generating employment agreement:', error);
    return NextResponse.json(
      { error: 'Failed to generate document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildPromptFromFormData(data: any): string {
  let prompt = `Generate a comprehensive employment agreement with the following details:\n\n`;

  // Basic Information
  prompt += `## Parties\n`;
  prompt += `Employer: ${data.companyName}\n`;
  prompt += `Address: ${data.companyAddress}, ${data.companyState}, ${data.companyCountry}\n\n`;
  prompt += `Employee: ${data.employeeName}\n`;
  prompt += `Address: ${data.employeeAddress}\n`;
  prompt += `Email: ${data.employeeEmail}\n`;
  if (data.employeePhone) prompt += `Phone: ${data.employeePhone}\n`;
  prompt += `\n`;

  // Position Details
  prompt += `## Position\n`;
  prompt += `Job Title: ${data.jobTitle}\n`;
  if (data.department) prompt += `Department: ${data.department}\n`;
  if (data.reportsTo) prompt += `Reports To: ${data.reportsTo}\n`;
  prompt += `Employment Type: ${data.employmentType}\n`;
  prompt += `Start Date: ${data.startDate}\n\n`;

  // Compensation
  prompt += `## Compensation\n`;
  prompt += `Base Salary: ${data.salaryCurrency} ${data.salaryAmount} (${data.salaryPeriod})\n`;
  if (data.bonusStructure) prompt += `Bonus Structure: ${data.bonusStructure}\n`;
  if (data.equityOffered) prompt += `Equity: ${data.equityOffered}\n`;
  prompt += `\n`;

  // Benefits
  prompt += `## Benefits\n`;
  const benefits = [];
  if (data.healthInsurance) benefits.push('Health Insurance');
  if (data.dentalInsurance) benefits.push('Dental Insurance');
  if (data.visionInsurance) benefits.push('Vision Insurance');
  if (data.retirementPlan) benefits.push('Retirement Plan');
  if (benefits.length > 0) prompt += `Insurance/Retirement: ${benefits.join(', ')}\n`;
  if (data.paidTimeOff) prompt += `Paid Time Off: ${data.paidTimeOff}\n`;
  if (data.sickLeave) prompt += `Sick Leave: ${data.sickLeave}\n`;
  if (data.otherBenefits) prompt += `Other Benefits: ${data.otherBenefits}\n`;
  prompt += `\n`;

  // Work Terms
  prompt += `## Work Terms\n`;
  prompt += `Work Location: ${data.workLocation}\n`;
  prompt += `Work Arrangement: ${data.workArrangement}\n`;
  prompt += `Hours Per Week: ${data.workHoursPerWeek}\n`;
  if (data.workSchedule) prompt += `Schedule: ${data.workSchedule}\n`;
  prompt += `Overtime Eligible: ${data.overtimeEligible ? 'Yes' : 'No'}\n`;
  if (data.probationPeriod) prompt += `Probation Period: ${data.probationPeriod}\n`;
  if (data.noticePeriod) prompt += `Notice Period: ${data.noticePeriod}\n`;
  prompt += `\n`;

  // Legal Terms
  prompt += `## Legal Terms\n`;
  if (data.includeConfidentiality) {
    prompt += `Include: Confidentiality and Non-Disclosure Agreement\n`;
  }
  if (data.includeIpAssignment) {
    prompt += `Include: Intellectual Property Assignment Clause\n`;
  }
  if (data.includeNonCompete) {
    prompt += `Include: Non-Compete Agreement\n`;
    if (data.nonCompeteDuration) prompt += `  Duration: ${data.nonCompeteDuration}\n`;
    if (data.nonCompeteRadius) prompt += `  Geographic Scope: ${data.nonCompeteRadius}\n`;
  }
  if (data.includeNonSolicitation) {
    prompt += `Include: Non-Solicitation Agreement\n`;
    if (data.nonSolicitationDuration) prompt += `  Duration: ${data.nonSolicitationDuration}\n`;
  }
  prompt += `Dispute Resolution: ${data.disputeResolution}\n`;
  prompt += `Governing Law: ${data.governingLaw}\n`;
  prompt += `\n`;

  // Additional Terms
  if (data.additionalClauses) {
    prompt += `## Additional Clauses\n${data.additionalClauses}\n\n`;
  }
  if (data.specialProvisions) {
    prompt += `## Special Provisions\n${data.specialProvisions}\n\n`;
  }

  prompt += `\nPlease generate a complete, professional employment agreement incorporating all of the above information. Format it as a formal legal document with proper sections, numbered clauses, and signature blocks.`;

  return prompt;
}
