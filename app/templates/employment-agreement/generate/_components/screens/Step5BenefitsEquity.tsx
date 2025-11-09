'use client';

import React from 'react';
import { Gift, Zap, AlertCircle } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Step5BenefitsEquity() {
  const { formData, updateFormData, enrichment, applyMarketStandards, nextStep } = useSmartForm();

  const marketStandards = enrichment.marketStandards;
  const jobTitleData = enrichment.jobTitleData;
  const jurisdictionName = enrichment.jurisdictionData?.country || 'market';

  // Check if equity section should be shown
  const shouldShowEquity = jobTitleData?.equityTypical ||
    ['senior', 'lead', 'director', 'vp', 'c-level'].includes(jobTitleData?.seniorityLevel || '');

  const handleUseMarketStandard = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <Gift className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
            Benefits & equity
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            Additional compensation and perks
          </p>
        </div>
      </div>

      {/* Equity section (conditional) */}
      {shouldShowEquity ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-semibold text-purple-900 mb-1">
              💡 Equity is typical for this role
            </p>
            {jobTitleData?.typicalEquityRange && (
              <p className="text-xs text-purple-700">
                Typical range: {jobTitleData.typicalEquityRange.min}% - {jobTitleData.typicalEquityRange.max}%
              </p>
            )}
          </div>

          <SmartInput
            label="Equity offered (optional)"
            name="equityOffered"
            value={formData.equityOffered || ''}
            onChange={(value) => updateFormData({ equityOffered: value })}
            placeholder="0.25% in stock options"
            helpText="Describe equity grant (e.g., stock options, RSUs, percentage)"
          />

          {jobTitleData?.signOnBonusCommon && (
            <SmartInput
              label="Sign-on bonus (optional)"
              name="signOnBonus"
              value={formData.signOnBonus || ''}
              onChange={(value) => updateFormData({ signOnBonus: value })}
              placeholder="$10,000"
              helpText="One-time signing bonus, if applicable"
            />
          )}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Equity compensation is less common for this role. You can skip this section or add if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Benefits */}
      <div className="space-y-5">
        <SmartInput
          label="Paid time off (PTO)"
          name="paidTimeOff"
          value={formData.paidTimeOff || ''}
          onChange={(value) => updateFormData({ paidTimeOff: value })}
          placeholder="20"
          helpText="Number of PTO days per year"
          suggestion={
            marketStandards
              ? {
                  value: marketStandards.ptodays.toString(),
                  reason: `Standard in ${jurisdictionName}`,
                  confidence: 'high',
                  source: 'jurisdiction',
                }
              : undefined
          }
          onApplySuggestion={() => {
            if (marketStandards) {
              updateFormData({ paidTimeOff: marketStandards.ptodays.toString() });
            }
          }}
        />

        {marketStandards?.sickLeaveDays && (
          <SmartInput
            label="Sick leave"
            name="sickLeave"
            value={formData.sickLeave || ''}
            onChange={(value) => updateFormData({ sickLeave: value })}
            placeholder={marketStandards.sickLeaveDays.toString()}
            helpText="Sick leave days per year"
            suggestion={{
              value: marketStandards.sickLeaveDays.toString(),
              reason: `Statutory requirement in ${jurisdictionName}`,
              confidence: 'high',
              source: 'legal-requirement',
            }}
            onApplySuggestion={() => {
              updateFormData({ sickLeave: marketStandards.sickLeaveDays!.toString() });
            }}
          />
        )}
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => nextStep()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip benefits details →
        </button>
      </div>
    </div>
  );
}
