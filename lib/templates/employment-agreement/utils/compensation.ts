/**
 * Compensation utilities for employment agreements
 * 
 * Handles salary conversion between pay frequencies, currency conversion,
 * and validation of compensation amounts.
 */

export type PayFrequency = 'hourly' | 'weekly' | 'bi-weekly' | 'monthly' | 'annual';

const WORK_HOURS_PER_YEAR = 2080; // 40 hours * 52 weeks
const WORK_WEEKS_PER_YEAR = 52;

/**
 * Convert an annual salary to a different pay frequency
 */
export function convertAnnualSalary(annualAmount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case 'hourly':
      return annualAmount / WORK_HOURS_PER_YEAR;
    case 'weekly':
      return annualAmount / WORK_WEEKS_PER_YEAR;
    case 'bi-weekly':
      return annualAmount / (WORK_WEEKS_PER_YEAR / 2);
    case 'monthly':
      return annualAmount / 12;
    case 'annual':
    default:
      return annualAmount;
  }
}

/**
 * Convert any salary to its annual equivalent
 */
export function convertSalaryToAnnual(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case 'hourly':
      return amount * WORK_HOURS_PER_YEAR;
    case 'weekly':
      return amount * WORK_WEEKS_PER_YEAR;
    case 'bi-weekly':
      return amount * (WORK_WEEKS_PER_YEAR / 2);
    case 'monthly':
      return amount * 12;
    case 'annual':
    default:
      return amount;
  }
}

/**
 * Format salary for display
 */
export function formatSalary(amount: number, frequency: PayFrequency): string {
  if (frequency === 'hourly') {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return Math.round(amount).toLocaleString();
}

/**
 * Format salary for storage (numeric string)
 */
export function formatSalaryForStorage(amount: number, frequency: PayFrequency): string {
  if (!Number.isFinite(amount)) {
    return '';
  }

  if (frequency === 'hourly') {
    return amount.toFixed(2);
  }

  return Math.round(amount).toString();
}

/**
 * Approximate currency conversion rates to USD
 * Note: These are approximations. For production, use a real-time API.
 */
const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.74,
  AUD: 0.66,
  INR: 0.012,
  BDT: 0.0091,
  CNY: 0.14,
  JPY: 0.0067,
  SGD: 0.74,
  CHF: 1.13,
  MXN: 0.059,
  BRL: 0.2,
  ZAR: 0.055,
  AED: 0.27,
  NZD: 0.61,
};

/**
 * Convert between currencies (approximate)
 */
export function convertCurrency(
  amount: number, 
  fromCurrency?: string, 
  toCurrency?: string
): number {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = RATES_TO_USD[fromCurrency] ?? 1;
  const toRate = RATES_TO_USD[toCurrency] ?? 1;

  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

/**
 * Validation result for salary amounts
 */
export interface SalaryValidationResult {
  valid: boolean;
  warning?: string;
}

/**
 * Validate that a salary amount is reasonable for the given frequency
 * Returns validation result with optional warning message
 */
export function validateSalaryRange(
  amount: number, 
  frequency: PayFrequency, 
  currency: string
): SalaryValidationResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, warning: 'Salary must be a positive number' };
  }

  // Convert to annual for consistent checking
  const annualEquivalent = convertSalaryToAnnual(amount, frequency);

  // Convert to USD for universal thresholds
  const annualUSD = convertCurrency(annualEquivalent, currency, 'USD');

  // Minimum threshold: $5,000/year (catches most data entry errors)
  if (annualUSD < 5000) {
    return {
      valid: false,
      warning: `Salary seems too low (${formatSalary(annualUSD, 'annual')} USD/year). Please check the amount and frequency.`,
    };
  }

  // Maximum threshold: $10M/year (catches frequency mistakes)
  if (annualUSD > 10000000) {
    return {
      valid: false,
      warning: `Salary seems unusually high (${formatSalary(annualUSD, 'annual')} USD/year). Did you select the correct pay frequency?`,
    };
  }

  // Hourly rate sanity check
  if (frequency === 'hourly' && (amount < 5 || amount > 500)) {
    return {
      valid: false,
      warning: `Hourly rate of ${currency} ${formatSalary(amount, 'hourly')} seems unusual. Please verify.`,
    };
  }

  return { valid: true };
}

/**
 * Get the label for a pay frequency
 */
export function getPayFrequencyLabel(frequency: PayFrequency): string {
  const labels: Record<PayFrequency, string> = {
    hourly: 'per hour',
    weekly: 'per week',
    'bi-weekly': 'bi-weekly',
    monthly: 'per month',
    annual: 'per year',
  };
  return labels[frequency] || frequency;
}

