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

export function Step4Compensation() {
  const { formData, updateFormData, enrichment, applyMarketStandards } = useSmartForm();

  const marketStandards = enrichment.marketStandards;
  const jobTitleData = enrichment.jobTitleData;
  const jurisdictionName =
    enrichment.jurisdictionData?.state ||
    enrichment.jurisdictionData?.country ||
    'market';

  const salaryAmount = parseFloat(formData.salaryAmount || '0');

  // Salary validation
  let salaryValidation: ValidationWarning | undefined;
  if (salaryAmount > 0 && jobTitleData?.typicalSalaryRange) {
    const range = jobTitleData.typicalSalaryRange;
    if (salaryAmount < range.min) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'warning',
        message: `Below typical range for ${formData.jobTitle}`,
        suggestion: `Typical range: ${range.currency}${range.min.toLocaleString()} - ${range.currency}${range.max.toLocaleString()}`,
      };
    } else if (salaryAmount > range.max * 1.5) {
      salaryValidation = {
        field: 'salaryAmount',
        severity: 'info',
        message: 'Significantly above market median',
        suggestion: 'Ensure this aligns with your compensation philosophy',
      };
    } else if (salaryAmount >= range.min && salaryAmount <= range.max) {
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
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Market Benchmark for {formData.jobTitle}
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-blue-700">Min</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {jobTitleData.typicalSalaryRange.min.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Median</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {jobTitleData.typicalSalaryRange.median.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Max</p>
                  <p className="font-semibold text-blue-900">
                    {jobTitleData.typicalSalaryRange.currency}
                    {jobTitleData.typicalSalaryRange.max.toLocaleString()}
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
