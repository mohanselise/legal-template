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

  // Salary validation (convert annual ranges to selected frequency)
  let salaryValidation: ValidationWarning | undefined;
  if (salaryAmount > 0 && jobTitleData?.typicalSalaryRange) {
    const range = jobTitleData.typicalSalaryRange;
    const convertedMin = convertAnnualSalary(range.min, payFrequency);
    const convertedMax = convertAnnualSalary(range.max, payFrequency);
    const convertedMedian = convertAnnualSalary(range.median, payFrequency);

    if (salaryAmount < convertedMin) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'warning',
        message: `Below typical range for ${formData.jobTitle}`,
        suggestion: `Typical range: ${range.currency}${convertedMin.toLocaleString()} - ${range.currency}${convertedMax.toLocaleString()}`,
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Market Benchmark for {formData.jobTitle}
              </p>
              <p className="text-xs text-blue-700 mb-3">
                {payFrequency === 'annual' ? 'Annual' : payFrequency === 'bi-weekly' ? 'Bi-weekly' : payFrequency === 'monthly' ? 'Monthly' : payFrequency === 'weekly' ? 'Weekly' : 'Hourly'} rates
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-blue-700">Min</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {formatSalary(convertAnnualSalary(jobTitleData.typicalSalaryRange.min, payFrequency), payFrequency)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Median</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {formatSalary(convertAnnualSalary(jobTitleData.typicalSalaryRange.median, payFrequency), payFrequency)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Max</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {formatSalary(convertAnnualSalary(jobTitleData.typicalSalaryRange.max, payFrequency), payFrequency)}
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
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
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
