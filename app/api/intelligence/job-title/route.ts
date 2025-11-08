import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { JobTitleAnalysis } from '@/lib/types/smart-form';

interface JobTitleAnalysisRequest {
  jobTitle: string;
  location?: string;
  companyIndustry?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JobTitleAnalysisRequest = await request.json();
    const { jobTitle, location, companyIndustry } = body;

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      );
    }

    // Use GPT-4o-mini for fast job title analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in job classifications, compensation benchmarking, and HR practices.
Analyze the job title and provide detailed insights about seniority, compensation, and typical benefits.

IMPORTANT: Return ONLY valid JSON matching this exact structure. No markdown, no code blocks.

{
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

Seniority classification:
- entry: Junior, Associate, Entry-level (0-2 years)
- mid: Mid-level, no prefix (2-5 years)
- senior: Senior (5-8 years)
- lead: Lead, Principal, Staff (8-12 years)
- director: Director, Head of (10+ years)
- vp: VP, SVP (15+ years)
- c-level: C-suite, Founder, President

Exempt status (US FLSA):
- exempt: Most white-collar roles earning >$35,568/year (salaried, no overtime)
- non-exempt: Hourly roles, some junior roles (eligible for overtime)
- unclear: Ambiguous or jurisdiction-dependent

Equity typical by role:
- Entry/Mid engineers: 0.01-0.1% at startups, often none at large companies
- Senior/Lead engineers: 0.05-0.25% at startups
- Directors: 0.1-0.5%
- VPs: 0.25-1%
- C-level: 1-5%

Sign-on bonus common for:
- Senior+ engineering, product, design
- All sales roles
- Director+ any department
- Competitive hires

Adjust salary for location if provided.
US tech hubs (SF, NYC, Seattle): +30-50% premium
Europe: Lower base, higher benefits
Asia-Pacific: Varies widely`,
        },
        {
          role: 'user',
          content: `Job Title: ${jobTitle}${location ? `\nLocation: ${location}` : ''}${companyIndustry ? `\nIndustry: ${companyIndustry}` : ''}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    const parsed: JobTitleAnalysis = JSON.parse(result);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Job title analysis API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze job title',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
