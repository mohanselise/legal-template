/**
 * Types for AI-powered smart form system
 */

export interface JurisdictionIntelligence {
  country: string;
  countryCode: string;
  state?: string;
  city?: string;

  // Labor market norms
  standardWorkWeek: number; // hours
  standardWorkDays: string; // e.g., "Monday-Friday"
  typicalPayFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'annual';

  // Legal defaults
  minimumWage?: number;
  currency: string;
  currencySymbol: string;
  overtimeThreshold?: number;

  // Common practices
  typicalPTO: number; // days per year
  probationPeriodCommon: boolean;
  probationDurationMonths?: number;

  // Legal requirements
  requiresWrittenContract: boolean;
  atWillEmployment: boolean;
  noticePeriodsRequired: boolean;
  defaultNoticePeriodDays?: number;

  confidence: 'high' | 'medium' | 'low';
}

export interface CompanyIntelligence {
  industryDetected?: string;
  companySizeEstimate?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  websiteFound?: string;
  description?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface JobTitleAnalysis {
  jobTitle: string;
  department: string;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'director' | 'vp' | 'c-level';
  exemptStatus: 'exempt' | 'non-exempt' | 'unclear';

  // Typical compensation (for benchmarking)
  typicalSalaryRange?: {
    min: number;
    max: number;
    median: number;
    currency: string;
  };

  // Benefits expectations
  equityTypical: boolean;
  typicalEquityRange?: {
    min: number; // percentage
    max: number;
  };

  signOnBonusCommon: boolean;
  performanceBonusCommon: boolean;
  typicalBonusPercent?: number;

  confidence: 'high' | 'medium' | 'low';
}

export interface MarketStandards {
  // Work arrangement
  workArrangement: 'remote' | 'hybrid' | 'on-site';
  workHoursPerWeek: number;
  workDays: string;

  // Compensation
  payFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'annual';
  currency: string;

  // Benefits
  ptodays: number;
  sickLeaveDays?: number;
  healthInsurance: boolean;
  retirementPlan: boolean;

  // Legal
  probationPeriodMonths?: number;
  noticePeriodDays?: number;

  // Protection clauses
  confidentialityRequired: boolean;
  ipAssignmentRequired: boolean;
  nonCompeteEnforceable: boolean;
  nonSolicitationCommon: boolean;

  source: 'jurisdiction' | 'industry' | 'role' | 'combined';
  confidence: 'high' | 'medium' | 'low';
}

export interface SmartFieldSuggestion {
  value: string | number | boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'jurisdiction' | 'industry' | 'role' | 'market' | 'legal-requirement';
}

export interface ValidationWarning {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface EnrichmentState {
  // Background enrichment status
  jurisdictionLoading: boolean;
  jurisdictionData?: JurisdictionIntelligence;
  jurisdictionError?: string;

  companyLoading: boolean;
  companyData?: CompanyIntelligence;
  companyError?: string;

  jobTitleLoading: boolean;
  jobTitleData?: JobTitleAnalysis;
  jobTitleError?: string;

  marketStandards?: MarketStandards;
}

export interface SmartFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  helpText?: string;

  // Smart features
  suggestion?: SmartFieldSuggestion;
  validation?: ValidationWarning;

  // For select fields
  options?: Array<{
    value: string;
    label: string;
    recommended?: boolean;
  }>;
}
