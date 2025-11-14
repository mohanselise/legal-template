'use client';

export type PayFrequency = 'hourly' | 'weekly' | 'bi-weekly' | 'monthly' | 'annual';

const WORK_HOURS_PER_YEAR = 2080; // 40 hours * 52 weeks
const WORK_WEEKS_PER_YEAR = 52;

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

export function formatSalary(amount: number, frequency: PayFrequency): string {
  if (frequency === 'hourly') {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return Math.round(amount).toLocaleString();
}

export function formatSalaryForStorage(amount: number, frequency: PayFrequency): string {
  if (!Number.isFinite(amount)) {
    return '';
  }

  if (frequency === 'hourly') {
    return amount.toFixed(2);
  }

  return Math.round(amount).toString();
}

export function convertCurrency(amount: number, fromCurrency?: string, toCurrency?: string): number {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return amount;
  }

  const ratesToUSD: Record<string, number> = {
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

  const fromRate = ratesToUSD[fromCurrency] ?? 1;
  const toRate = ratesToUSD[toCurrency] ?? 1;

  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

/**
 * Validate that a salary amount is reasonable for the given frequency
 * Returns true if valid, false if suspicious (likely user error or wrong frequency)
 */
export function validateSalaryRange(amount: number, frequency: PayFrequency, currency: string): {
  valid: boolean;
  warning?: string;
} {
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

  // Maximum threshold: $10M/year (catches frequency mistakes like entering annual as monthly)
  if (annualUSD > 10000000) {
    return {
      valid: false,
      warning: `Salary seems unusually high (${formatSalary(annualUSD, 'annual')} USD/year). Did you select the correct pay frequency?`,
    };
  }

  // Hourly rate sanity check (if entered as hourly)
  if (frequency === 'hourly' && (amount < 5 || amount > 500)) {
    return {
      valid: false,
      warning: `Hourly rate of ${currency} ${formatSalary(amount, 'hourly')} seems unusual. Please verify.`,
    };
  }

  return { valid: true };
}
