'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Gift, Zap, AlertCircle } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Step5BenefitsEquity() {
  const t = useTranslations('employmentAgreement.step5');
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
            {t('title')}
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Equity section (conditional) */}
      {shouldShowEquity ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[hsl(var(--fg))]">
              {t('equityTypical')}
            </p>
            {jobTitleData?.typicalEquityRange && (
              <p className="text-xs text-[hsl(var(--brand-muted))]">
                {t('typicalRange', { min: jobTitleData.typicalEquityRange.min, max: jobTitleData.typicalEquityRange.max })}
              </p>
            )}
          </div>

          <SmartInput
            label={t('equityOffered')}
            name="equityOffered"
            value={formData.equityOffered || ''}
            onChange={(value) => updateFormData({ equityOffered: value })}
            placeholder="0.25% in stock options"
            helpText={t('equityOfferedHelp')}
          />

          {jobTitleData?.signOnBonusCommon && (
            <SmartInput
              label={t('signOnBonus')}
              name="signOnBonus"
              value={formData.signOnBonus || ''}
              onChange={(value) => updateFormData({ signOnBonus: value })}
              placeholder="$10,000"
              helpText={t('signOnBonusHelp')}
            />
          )}
        </div>
      ) : (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertDescription className="text-sm">
            {t('equityLessCommon')}
          </AlertDescription>
        </Alert>
      )}

      {/* Benefits */}
      <div className="space-y-5">
        <SmartInput
          label={t('paidTimeOff')}
          name="paidTimeOff"
          value={formData.paidTimeOff || ''}
          onChange={(value) => updateFormData({ paidTimeOff: value })}
          placeholder="20"
          helpText={t('paidTimeOffHelp')}
          suggestion={
            marketStandards
              ? {
                  value: marketStandards.ptodays.toString(),
                  reason: t('standardIn', { jurisdiction: jurisdictionName }),
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
          label={t('sickLeave')}
          name="sickLeave"
          value={formData.sickLeave || ''}
          onChange={(value) => updateFormData({ sickLeave: value })}
          placeholder={marketStandards.sickLeaveDays.toString()}
          helpText={t('sickLeaveHelp')}
            suggestion={{
              value: marketStandards.sickLeaveDays.toString(),
              reason: t('statutoryRequirement', { jurisdiction: jurisdictionName }),
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
          {t('skipBenefitsDetails')}
        </button>
      </div>
    </div>
  );
}
