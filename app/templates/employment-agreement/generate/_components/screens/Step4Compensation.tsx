'use client';

import React from 'react';
import { DollarSign, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ValidationWarning } from '@/lib/types/smart-form';

const PAY_FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Hourly', regions: ['US'] },
  { value: 'weekly', label: 'Weekly', regions: ['US'] },
  { value: 'bi-weekly', label: 'Bi-weekly', regions: ['US', 'CA'] },
  { value: 'monthly', label: 'Monthly', regions: ['GB', 'CH', 'DE', 'FR'] },
  { value: 'annual', label: 'Annual', regions: ['all'] },
];

// Convert annual salary to the selected pay frequency
function convertAnnualSalary(annualAmount: number, frequency: string): number {
  const workHoursPerYear = 2080; // Standard 40 hours/week * 52 weeks
  const workWeeksPerYear = 52;

  switch (frequency) {
    case 'hourly':
      return parseFloat((annualAmount / workHoursPerYear).toFixed(2));
    case 'weekly':
      return Math.round(annualAmount / workWeeksPerYear);
    case 'bi-weekly':
      return Math.round(annualAmount / (workWeeksPerYear / 2));
    case 'monthly':
      return Math.round(annualAmount / 12);
    case 'annual':
    default:
      return Math.round(annualAmount);
  }
}

// Format salary based on frequency (show decimals for hourly)
function formatSalary(amount: number, frequency: string): string {
  if (frequency === 'hourly') {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return amount.toLocaleString();
}

// Simple currency conversion (approximate rates)
// This is for rough comparison only - rates are approximate
function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;

  // Approximate exchange rates to USD (base currency)
  const ratesToUSD: Record<string, number> = {
    'USD': 1,
    'EUR': 1.08,
    'GBP': 1.27,
    'CAD': 0.74,
    'AUD': 0.66,
    'INR': 0.012,
    'BDT': 0.0091, // Bangladesh Taka
    'CNY': 0.14,
    'JPY': 0.0067,
    'SGD': 0.74,
    'CHF': 1.13,
    'MXN': 0.059,
    'BRL': 0.20,
    'ZAR': 0.055,
    'AED': 0.27, // UAE Dirham
    'NZD': 0.61,
  };

  const fromRate = ratesToUSD[fromCurrency] || 1;
  const toRate = ratesToUSD[toCurrency] || 1;

  // Convert: amount -> USD -> target currency
  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

export function Step4Compensation() {
  const { formData, updateFormData, enrichment, applyMarketStandards } = useSmartForm();

  const marketStandards = enrichment.marketStandards;
  const jobTitleData = enrichment.jobTitleData;
  const jurisdictionName =
    enrichment.jurisdictionData?.state ||
    enrichment.jurisdictionData?.country ||
    'market';

  const salaryAmount = parseFloat(formData.salaryAmount || '0');
  const payFrequency = formData.salaryPeriod || 'annual';

  // Salary validation (convert annual ranges to selected frequency and currency)
  let salaryValidation: ValidationWarning | undefined;
  if (salaryAmount > 0 && jobTitleData?.typicalSalaryRange) {
    const range = jobTitleData.typicalSalaryRange;
    const userCurrency = formData.salaryCurrency || 'USD';
    const marketCurrency = range.currency;

    // Convert market ranges to user's currency
    const convertedMin = convertAnnualSalary(
      convertCurrency(range.min, marketCurrency, userCurrency),
      payFrequency
    );
    const convertedMax = convertAnnualSalary(
      convertCurrency(range.max, marketCurrency, userCurrency),
      payFrequency
    );
    const convertedMedian = convertAnnualSalary(
      convertCurrency(range.median, marketCurrency, userCurrency),
      payFrequency
    );

    const currencyNote = userCurrency !== marketCurrency ? ' (converted)' : '';

    if (salaryAmount < convertedMin) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'warning',
        message: `Below typical range for ${formData.jobTitle}`,
        suggestion: `Typical range: ${userCurrency} ${convertedMin.toLocaleString()} - ${convertedMax.toLocaleString()}${currencyNote}`,
      };
    } else if (salaryAmount > convertedMax * 1.5) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'info',
        message: 'Significantly above market median',
        suggestion: 'Ensure this aligns with your compensation philosophy',
      };
    } else if (salaryAmount >= convertedMin && salaryAmount <= convertedMax) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'info',
        message: '✓ Within typical market range',
      };
    }
  }

  const handleUseMarketStandard = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
    }
  };

  const canContinue = formData.salaryAmount && formData.salaryCurrency;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <DollarSign className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
            Compensation
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            Base salary and pay structure
          </p>
        </div>
      </div>

      {/* Market benchmarking card */}
      {jobTitleData?.typicalSalaryRange && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <div className="flex-1">
              <p className="mb-1 text-sm font-semibold text-[hsl(var(--fg))]">
                Market Benchmark for {formData.jobTitle}
              </p>
              <p className="mb-3 text-xs text-[hsl(var(--brand-muted))]">
                {payFrequency === 'annual' ? 'Annual' : payFrequency === 'bi-weekly' ? 'Bi-weekly' : payFrequency === 'monthly' ? 'Monthly' : payFrequency === 'weekly' ? 'Weekly' : 'Hourly'} rates
                {formData.salaryCurrency && formData.salaryCurrency !== jobTitleData.typicalSalaryRange.currency && (
                  <span className="ml-1">(converted to {formData.salaryCurrency})</span>
                )}
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[hsl(var(--brand-muted))]">Min</p>
                  <p className="font-semibold text-[hsl(var(--fg))]">
                    {formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency}
                    {' '}
                    {formatSalary(
                      convertAnnualSalary(
                        convertCurrency(
                          jobTitleData.typicalSalaryRange.min,
                          jobTitleData.typicalSalaryRange.currency,
                          formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency
                        ),
                        payFrequency
                      ),
                      payFrequency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[hsl(var(--brand-muted))]">Median</p>
                  <p className="font-semibold text-[hsl(var(--fg))]">
                    {formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency}
                    {' '}
                    {formatSalary(
                      convertAnnualSalary(
                        convertCurrency(
                          jobTitleData.typicalSalaryRange.median,
                          jobTitleData.typicalSalaryRange.currency,
                          formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency
                        ),
                        payFrequency
                      ),
                      payFrequency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[hsl(var(--brand-muted))]">Max</p>
                  <p className="font-semibold text-[hsl(var(--fg))]">
                    {formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency}
                    {' '}
                    {formatSalary(
                      convertAnnualSalary(
                        convertCurrency(
                          jobTitleData.typicalSalaryRange.max,
                          jobTitleData.typicalSalaryRange.currency,
                          formData.salaryCurrency || jobTitleData.typicalSalaryRange.currency
                        ),
                        payFrequency
                      ),
                      payFrequency
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SmartInput
              label="Base salary"
              name="salaryAmount"
              type="number"
              value={formData.salaryAmount || ''}
              onChange={(value) => updateFormData({ salaryAmount: value })}
              placeholder="120000"
              required
              validation={salaryValidation}
            />
          </div>
          <div>
            <SmartInput
              label="Currency"
              name="salaryCurrency"
              value={formData.salaryCurrency || 'USD'}
              onChange={(value) => updateFormData({ salaryCurrency: value })}
              placeholder="USD"
              required
              suggestion={
                enrichment.jurisdictionData
                  ? {
                      value: enrichment.jurisdictionData.currency,
                      reason: `Standard currency in ${jurisdictionName}`,
                      confidence: 'high',
                      source: 'jurisdiction',
                    }
                  : undefined
              }
              onApplySuggestion={() => {
                if (enrichment.jurisdictionData) {
                  updateFormData({
                    salaryCurrency: enrichment.jurisdictionData.currency,
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Pay Frequency */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Pay frequency
            <span className="text-destructive ml-1">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PAY_FREQUENCY_OPTIONS.map((option) => {
              const isSelected = formData.salaryPeriod === option.value;
              const isRecommended = marketStandards?.payFrequency === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateFormData({ salaryPeriod: option.value as any })}
                  className={cn(
                    'relative px-3 py-2 rounded-lg border-2 transition-all text-sm',
                    'hover:border-[hsl(var(--brand-primary))]',
                    isSelected
                      ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05]'
                      : 'border-[hsl(var(--border))]'
                  )}
                >
                  {isRecommended && (
                    <Badge
                      variant="outline"
                      className="absolute -top-2 right-2 border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] px-2 text-[10px] text-[hsl(var(--brand-muted))]"
                    >
                      Recommended
                    </Badge>
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
          {marketStandards && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 {marketStandards.payFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly'} pay is standard in {jurisdictionName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
