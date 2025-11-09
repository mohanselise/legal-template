import type { EmploymentAgreementFormData } from '@/app/templates/employment-agreement/generate/schema';
import type { EnrichmentState, ValidationWarning } from '@/lib/types/smart-form';

/**
 * Convert salary to annual amount based on payment frequency
 */
function convertToAnnualSalary(amount: number, frequency: string): number {
  const workHoursPerYear = 2080; // Standard 40 hours/week * 52 weeks
  const workWeeksPerYear = 52;

  switch (frequency?.toLowerCase()) {
    case 'hourly':
      return amount * workHoursPerYear;
    case 'weekly':
      return amount * workWeeksPerYear;
    case 'bi-weekly':
      return amount * (workWeeksPerYear / 2);
    case 'monthly':
      return amount * 12;
    case 'annual':
    default:
      return amount;
  }
}

/**
 * Validate form data against collected intelligence to detect potential issues
 * Returns array of warnings/errors for user review
 */
export function validateAgainstIntelligence(
  formData: Partial<EmploymentAgreementFormData>,
  enrichment: EnrichmentState
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check salary against market benchmarks
  if (enrichment.jobTitleData?.typicalSalaryRange && formData.salaryAmount) {
    const salary = parseFloat(formData.salaryAmount.replace(/[^0-9.-]/g, ''));
    const userCurrency = formData.salaryCurrency || 'USD';
    const marketCurrency = enrichment.jobTitleData.typicalSalaryRange.currency;

    // Only compare if currencies match
    if (!isNaN(salary) && userCurrency === marketCurrency) {
      // Convert user's salary to annual for comparison (market data is always annual)
      const annualSalary = convertToAnnualSalary(salary, formData.salaryPeriod || 'annual');

      const median = enrichment.jobTitleData.typicalSalaryRange.median;
      const min = enrichment.jobTitleData.typicalSalaryRange.min;
      const diffPercent = ((annualSalary - median) / median) * 100;

      if (diffPercent < -30) {
        warnings.push({
          field: 'salaryAmount',
          severity: 'warning',
          message: `Salary is ${Math.abs(diffPercent).toFixed(0)}% below market median for this role`,
          suggestion: `Market median: ${marketCurrency} ${median.toLocaleString()}/year`,
        });
      } else if (annualSalary < min) {
        warnings.push({
          field: 'salaryAmount',
          severity: 'warning',
          message: `Salary is below typical minimum for ${formData.jobTitle}`,
          suggestion: `Market range: ${marketCurrency} ${min.toLocaleString()} - ${enrichment.jobTitleData.typicalSalaryRange.max.toLocaleString()}/year`,
        });
      }
    }
  }

  // Check non-compete in prohibited jurisdictions
  if (
    formData.includeNonCompete &&
    enrichment.marketStandards &&
    !enrichment.marketStandards.nonCompeteEnforceable
  ) {
    const jurisdiction =
      enrichment.jurisdictionData?.state || enrichment.jurisdictionData?.country || 'this jurisdiction';
    warnings.push({
      field: 'includeNonCompete',
      severity: 'error',
      message: `Non-compete clauses are not enforceable in ${jurisdiction}`,
      suggestion: 'Remove non-compete or consult local employment counsel. Consider non-solicitation instead.',
    });
  }

  // Check equity typical but missing
  if (
    enrichment.jobTitleData?.equityTypical &&
    !formData.equityOffered &&
    enrichment.companyData?.companySizeEstimate === 'startup'
  ) {
    warnings.push({
      field: 'equityOffered',
      severity: 'info',
      message: `Equity compensation is typical for ${formData.jobTitle} roles at startups`,
      suggestion: `Consider offering ${enrichment.jobTitleData.typicalEquityRange?.min}%-${enrichment.jobTitleData.typicalEquityRange?.max}% equity`,
    });
  }

  // Check sign-on bonus common but missing
  if (
    enrichment.jobTitleData?.signOnBonusCommon &&
    !formData.signOnBonus &&
    enrichment.jobTitleData.seniorityLevel &&
    ['senior', 'lead', 'director', 'vp', 'c-level'].includes(enrichment.jobTitleData.seniorityLevel)
  ) {
    warnings.push({
      field: 'signOnBonus',
      severity: 'info',
      message: `Sign-on bonuses are common for ${enrichment.jobTitleData.seniorityLevel} ${formData.jobTitle} roles`,
      suggestion: 'Consider adding a sign-on bonus to remain competitive',
    });
  }

  // Check PTO significantly below market
  if (enrichment.marketStandards?.ptodays && formData.paidTimeOff) {
    const pto = parseInt(formData.paidTimeOff);
    if (!isNaN(pto)) {
      const marketPto = enrichment.marketStandards.ptodays;
      const diff = marketPto - pto;

      if (diff > 5) {
        warnings.push({
          field: 'paidTimeOff',
          severity: 'warning',
          message: `PTO is ${diff} days below market standard`,
          suggestion: `Standard PTO in this market: ${marketPto} days`,
        });
      }
    }
  }

  // Check missing health insurance in US
  if (
    enrichment.jurisdictionData?.countryCode === 'US' &&
    !formData.healthInsurance &&
    formData.employmentType === 'full-time'
  ) {
    warnings.push({
      field: 'healthInsurance',
      severity: 'warning',
      message: 'Health insurance is standard for full-time US employees',
      suggestion: 'Consider adding health insurance benefits',
    });
  }

  // Check exempt status vs salary
  if (
    enrichment.jobTitleData?.exemptStatus === 'exempt' &&
    formData.salaryAmount &&
    enrichment.jurisdictionData?.minimumWage
  ) {
    const salary = parseFloat(formData.salaryAmount.replace(/[^0-9.-]/g, ''));
    const annualMinimum = enrichment.jurisdictionData.minimumWage * 2080; // ~40 hrs/week * 52 weeks
    const exemptThreshold = Math.max(annualMinimum * 2, 35568); // FLSA minimum

    if (!isNaN(salary) && formData.salaryPeriod === 'annual' && salary < exemptThreshold) {
      warnings.push({
        field: 'salaryAmount',
        severity: 'error',
        message: `Salary below exempt threshold for this role`,
        suggestion: `Exempt roles typically require minimum $${exemptThreshold.toLocaleString()}/year`,
      });
    }
  }

  return warnings;
}

/**
 * Get user-friendly description of validation severity
 */
export function getSeverityLabel(severity: ValidationWarning['severity']): string {
  switch (severity) {
    case 'error':
      return 'Critical Issue';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Suggestion';
    default:
      return 'Notice';
  }
}

/**
 * Get icon for severity level
 */
export function getSeverityIcon(severity: ValidationWarning['severity']): string {
  switch (severity) {
    case 'error':
      return '🚫';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '📋';
  }
}
