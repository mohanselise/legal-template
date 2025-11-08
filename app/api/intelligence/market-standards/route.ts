import { NextRequest, NextResponse } from 'next/server';
import {
  JurisdictionIntelligence,
  JobTitleAnalysis,
  MarketStandards,
} from '@/lib/types/smart-form';

interface MarketStandardsRequest {
  jurisdiction: JurisdictionIntelligence;
  jobTitle?: JobTitleAnalysis;
  industry?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MarketStandardsRequest = await request.json();
    const { jurisdiction, jobTitle, industry } = body;

    if (!jurisdiction) {
      return NextResponse.json(
        { error: 'Jurisdiction data is required' },
        { status: 400 }
      );
    }

    // Generate market standards by combining jurisdiction norms with job-specific expectations
    const standards: MarketStandards = {
      // Work arrangement - tech/remote-friendly roles vs traditional
      workArrangement: determineWorkArrangement(jobTitle, industry, jurisdiction),

      // Work schedule from jurisdiction
      workHoursPerWeek: jurisdiction.standardWorkWeek,
      workDays: jurisdiction.standardWorkDays,

      // Pay frequency from jurisdiction
      payFrequency: jurisdiction.typicalPayFrequency,
      currency: jurisdiction.currency,

      // Benefits
      ptodays: jurisdiction.typicalPTO,
      sickLeaveDays: determineSickLeave(jurisdiction),
      healthInsurance: determineHealthInsurance(jurisdiction),
      retirementPlan: determineRetirementPlan(jurisdiction),

      // Legal terms
      probationPeriodMonths: jurisdiction.probationPeriodCommon
        ? jurisdiction.probationDurationMonths
        : undefined,
      noticePeriodDays: jurisdiction.noticePeriodsRequired
        ? jurisdiction.defaultNoticePeriodDays
        : undefined,

      // Protection clauses
      confidentialityRequired: true, // Always recommended
      ipAssignmentRequired: shouldRequireIP(jobTitle, industry),
      nonCompeteEnforceable: isNonCompeteEnforceable(jurisdiction),
      nonSolicitationCommon: isNonSolicitationCommon(jurisdiction, jobTitle),

      source: 'combined',
      confidence: jurisdiction.confidence,
    };

    return NextResponse.json(standards);
  } catch (error) {
    console.error('Market standards API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate market standards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function determineWorkArrangement(
  jobTitle?: JobTitleAnalysis,
  industry?: string,
  jurisdiction?: JurisdictionIntelligence
): 'remote' | 'hybrid' | 'on-site' {
  // Tech industry default: hybrid
  if (industry?.toLowerCase().includes('tech') || industry?.toLowerCase().includes('software')) {
    return 'hybrid';
  }

  // Engineering, Product, Design roles: hybrid
  if (jobTitle?.department && ['Engineering', 'Product', 'Design'].includes(jobTitle.department)) {
    return 'hybrid';
  }

  // Default to on-site for most industries
  return 'on-site';
}

function determineSickLeave(jurisdiction: JurisdictionIntelligence): number | undefined {
  // Some jurisdictions have statutory sick leave
  switch (jurisdiction.countryCode) {
    case 'GB': // UK
      return 28; // Statutory sick pay
    case 'DE': // Germany
      return 30; // Up to 6 weeks paid
    case 'AU': // Australia
      return 10; // 10 days per year
    case 'US': // US - varies by state
      return undefined; // No federal requirement, varies by company
    default:
      return undefined;
  }
}

function determineHealthInsurance(jurisdiction: JurisdictionIntelligence): boolean {
  // US companies typically provide health insurance
  if (jurisdiction.countryCode === 'US') {
    return true;
  }
  // Countries with universal healthcare: less common as benefit
  return false;
}

function determineRetirementPlan(jurisdiction: JurisdictionIntelligence): boolean {
  switch (jurisdiction.countryCode) {
    case 'US': // 401(k) common
      return true;
    case 'GB': // Pension auto-enrollment
      return true;
    case 'AU': // Superannuation required
      return true;
    default:
      return false;
  }
}

function shouldRequireIP(jobTitle?: JobTitleAnalysis, industry?: string): boolean {
  // Always require for tech/software roles
  if (industry?.toLowerCase().includes('tech') || industry?.toLowerCase().includes('software')) {
    return true;
  }

  // Require for creative, engineering, product roles
  if (jobTitle?.department && ['Engineering', 'Product', 'Design'].includes(jobTitle.department)) {
    return true;
  }

  // Default: yes for most roles (recommended protection)
  return true;
}

function isNonCompeteEnforceable(jurisdiction: JurisdictionIntelligence): boolean {
  switch (jurisdiction.countryCode) {
    case 'US':
      // Varies by state
      const bannedStates = ['CA', 'ND', 'OK']; // California, North Dakota, Oklahoma
      if (jurisdiction.state && bannedStates.includes(jurisdiction.state)) {
        return false;
      }
      return true; // Generally enforceable in most states with limitations
    case 'GB':
      return true; // Enforceable if reasonable
    case 'DE':
      return false; // Generally unenforceable
    case 'CH':
      return true; // Enforceable in Switzerland
    default:
      return false; // Conservative default
  }
}

function isNonSolicitationCommon(
  jurisdiction: JurisdictionIntelligence,
  jobTitle?: JobTitleAnalysis
): boolean {
  // Common for sales, client-facing roles
  if (jobTitle?.department === 'Sales') {
    return true;
  }

  // Common for senior roles
  if (jobTitle?.seniorityLevel && ['director', 'vp', 'c-level'].includes(jobTitle.seniorityLevel)) {
    return true;
  }

  // Generally common in US and UK
  if (['US', 'GB', 'CH'].includes(jurisdiction.countryCode)) {
    return true;
  }

  return false;
}
