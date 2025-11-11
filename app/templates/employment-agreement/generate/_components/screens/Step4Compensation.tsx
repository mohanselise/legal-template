'use client';

import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ValidationWarning } from '@/lib/types/smart-form';
import type { EmploymentAgreementFormData } from '../../schema';
import {
  convertAnnualSalary,
  convertSalaryToAnnual,
  convertCurrency,
  formatSalary,
  formatSalaryForStorage,
  type PayFrequency,
} from '../utils/compensation';

const PAY_FREQUENCY_OPTIONS: Array<{ value: PayFrequency; label: string; regions: string[] }> = [
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
  const payFrequency = (formData.salaryPeriod || 'annual') as PayFrequency;

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

  const handleFrequencySelect = (newFrequency: PayFrequency) => {
    const currentFrequency = (formData.salaryPeriod || 'annual') as PayFrequency;
    const currentAmount = parseFloat(formData.salaryAmount || '');
    const updates: Partial<EmploymentAgreementFormData> = {
      salaryPeriod: newFrequency,
    };

    if (!Number.isNaN(currentAmount) && currentAmount > 0) {
      let annualEquivalent = convertSalaryToAnnual(currentAmount, currentFrequency);
      const converted = convertAnnualSalary(annualEquivalent, newFrequency);
      updates.salaryAmount = formatSalaryForStorage(converted, newFrequency);
    }

    updateFormData(updates);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (!newCurrency) {
      updateFormData({ salaryCurrency: '' });
      return;
    }

    const trimmedCurrency = newCurrency.toUpperCase();
    const currentAmount = parseFloat(formData.salaryAmount || '');
    const currentFrequency = (formData.salaryPeriod || 'annual') as PayFrequency;
    const currentCurrency = formData.salaryCurrency || trimmedCurrency;

    const updates: Partial<EmploymentAgreementFormData> = {
      salaryCurrency: trimmedCurrency,
    };

    if (!Number.isNaN(currentAmount) && currentAmount > 0) {
      let annualEquivalent = convertSalaryToAnnual(currentAmount, currentFrequency);
      if (currentCurrency !== trimmedCurrency) {
        annualEquivalent = convertCurrency(annualEquivalent, currentCurrency, trimmedCurrency);
      }
      const converted = convertAnnualSalary(annualEquivalent, currentFrequency);
      updates.salaryAmount = formatSalaryForStorage(converted, currentFrequency);
    }

    updateFormData(updates);
  };

  const handleUseMarketStandard = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
    }
  };

  // Allow continue if salary amount is filled (including placeholders) and currency is set
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
              value={formData.salaryCurrency || ''}
              onChange={handleCurrencyChange}
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
                  handleCurrencyChange(enrichment.jurisdictionData.currency);
                }
              }}
            />
          </div>
        </div>

        {/* Salary Placeholder Options */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Or:</span>
          <button
            type="button"
            onClick={() => {
              updateFormData({
                salaryAmount: '[TO BE DETERMINED]',
                salaryCurrency: enrichment.jurisdictionData?.currency || formData.salaryCurrency || 'USD'
              });
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))/0.05] transition-colors"
          >
            Mark as "To be determined"
          </button>
          <button
            type="button"
            onClick={() => {
              updateFormData({
                salaryAmount: '[OMITTED]',
                salaryCurrency: enrichment.jurisdictionData?.currency || formData.salaryCurrency || 'USD'
              });
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))/0.05] transition-colors"
          >
            No salary mentioned
          </button>
        </div>

        {/* Show current selection if placeholder is used */}
        {(formData.salaryAmount === '[TO BE DETERMINED]' || formData.salaryAmount === '[OMITTED]') && (
          <div className="rounded-lg border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3">
            <p className="text-sm text-[hsl(var(--brand-muted))]">
              {formData.salaryAmount === '[TO BE DETERMINED]' ? (
                <>✓ Salary will show as <strong className="text-[hsl(var(--fg))]">"[TO BE DETERMINED]"</strong> in the document</>
              ) : (
                <>✓ Salary will be <strong className="text-[hsl(var(--fg))]">omitted</strong> from the document</>
              )}
            </p>
            <button
              type="button"
              onClick={() => updateFormData({ salaryAmount: '' })}
              className="text-xs text-[hsl(var(--brand-primary))] underline decoration-dotted underline-offset-2 hover:decoration-solid mt-1"
            >
              Clear and enter amount
            </button>
          </div>
        )}

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
                  onClick={() => handleFrequencySelect(option.value)}
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
                      className="absolute -top-2.5 right-2 border-[hsl(var(--brand-primary))]/40 bg-white dark:bg-[hsl(var(--eerie-black))] px-2 text-[10px] text-[hsl(var(--brand-primary))] shadow-md font-medium"
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
