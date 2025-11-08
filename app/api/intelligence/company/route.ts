import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { CompanyIntelligence, JurisdictionIntelligence } from '@/lib/types/smart-form';

interface CompanyAnalysisRequest {
  companyName: string;
  companyAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompanyAnalysisRequest = await request.json();
    const { companyName, companyAddress } = body;

    if (!companyName || !companyAddress) {
      return NextResponse.json(
        { error: 'Company name and address are required' },
        { status: 400 }
      );
    }

    // Use GPT-4o-mini for fast, cost-effective intelligence gathering
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in employment law, labor markets, and jurisdiction-specific regulations.
Analyze the company information provided and return jurisdiction intelligence and company insights.

IMPORTANT: Return ONLY valid JSON matching the exact structure specified. No markdown, no code blocks, no additional text.

Return this exact structure:
{
  "jurisdiction": {
    "country": "full country name",
    "countryCode": "ISO 2-letter code",
    "state": "state/province if applicable",
    "city": "city if detected",
    "standardWorkWeek": 40,
    "standardWorkDays": "Monday-Friday",
    "typicalPayFrequency": "bi-weekly",
    "minimumWage": 15.50,
    "currency": "USD",
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
    "websiteFound": "example.com",
    "description": "Brief description if known",
    "confidence": "medium"
  }
}

Key jurisdiction intelligence rules:
- US: bi-weekly pay is most common, at-will employment, 40hr week, varies by state
- UK: monthly pay, written contracts required, 20-28 days PTO, notice periods required
- Switzerland: monthly pay end-of-month, 20-25 days vacation, written contracts, notice periods
- Germany: monthly pay, 20-30 days vacation, strong worker protections
- Canada: bi-weekly common, provincial differences, 10-15 days PTO
- Australia: fortnightly pay, 20 days annual leave + 10 sick days

Pay frequencies by market:
- US: bi-weekly or semi-monthly
- UK, Switzerland, Germany, France: monthly (end of month)
- Australia: fortnightly
- Canada: bi-weekly

Confidence levels:
- "high": Major city/country clearly identified
- "medium": Country identified, some details unclear
- "low": Ambiguous or insufficient information`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}\nAddress: ${companyAddress}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(result);

    return NextResponse.json({
      jurisdiction: parsed.jurisdiction as JurisdictionIntelligence,
      company: parsed.company as CompanyIntelligence,
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
