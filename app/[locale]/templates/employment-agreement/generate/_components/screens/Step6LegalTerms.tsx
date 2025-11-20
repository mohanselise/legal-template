'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Scale, Zap } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Step6LegalTerms() {
  const t = useTranslations('employmentAgreement.step6');
  const { formData, updateFormData, enrichment, applyMarketStandards } = useSmartForm();

  const marketStandards = enrichment.marketStandards;
  const jurisdictionData = enrichment.jurisdictionData;
  const jurisdictionName = jurisdictionData?.country || 'market';

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
          <Scale className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
            {t('title')}
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Jurisdiction */}
      <SmartInput
        label={t('governingLaw')}
        name="governingLaw"
        value={formData.governingLaw || ''}
        onChange={(value) => updateFormData({ governingLaw: value })}
        placeholder="State of California, United States"
        required
        helpText={t('governingLawHelp')}
        suggestion={
          jurisdictionData
            ? {
                value: jurisdictionData.state
                  ? `${jurisdictionData.state}, ${jurisdictionData.country}`
                  : jurisdictionData.country,
                reason: t('basedOnCompanyLocation'),
                confidence: 'high',
                source: 'jurisdiction',
              }
            : undefined
        }
        onApplySuggestion={() => {
          if (jurisdictionData) {
            const value = jurisdictionData.state
              ? `${jurisdictionData.state}, ${jurisdictionData.country}`
              : jurisdictionData.country;
            updateFormData({ governingLaw: value });
          }
        }}
      />

      {/* Protection Clauses */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">{t('standardProtectionClauses')}</Label>

        {/* Confidentiality */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex-1">
            <p className="font-medium text-sm">{t('confidentiality')}</p>
            <p className="text-xs text-muted-foreground">{t('confidentialityDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              {marketStandards?.confidentialityRequired ? t('required') : t('optional')}
            </Badge>
            <input
              type="checkbox"
              checked={formData.includeConfidentiality || false}
              onChange={(e) => updateFormData({ includeConfidentiality: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>
        </div>

        {/* IP Assignment */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex-1">
            <p className="font-medium text-sm">{t('ipAssignment')}</p>
            <p className="text-xs text-muted-foreground">{t('ipAssignmentDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              {marketStandards?.ipAssignmentRequired ? t('recommended') : t('optional')}
            </Badge>
            <input
              type="checkbox"
              checked={formData.includeIpAssignment || false}
              onChange={(e) => updateFormData({ includeIpAssignment: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>
        </div>

        {/* Non-compete */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex-1">
            <p className="font-medium text-sm">{t('nonCompete')}</p>
            <p className="text-xs text-muted-foreground">
              {marketStandards?.nonCompeteEnforceable
                ? t('nonCompeteEnforceable')
                : t('nonCompeteNotEnforceable')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]',
                !marketStandards?.nonCompeteEnforceable && 'opacity-70'
              )}
            >
              {marketStandards?.nonCompeteEnforceable ? t('allowed') : t('notEnforceable')}
            </Badge>
            <input
              type="checkbox"
              checked={formData.includeNonCompete || false}
              onChange={(e) => updateFormData({ includeNonCompete: e.target.checked })}
              disabled={!marketStandards?.nonCompeteEnforceable}
              className="w-5 h-5 rounded border-gray-300 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Non-solicitation */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex-1">
            <p className="font-medium text-sm">{t('nonSolicitation')}</p>
            <p className="text-xs text-muted-foreground">{t('nonSolicitationDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              {marketStandards?.nonSolicitationCommon ? t('common') : t('optional')}
            </Badge>
            <input
              type="checkbox"
              checked={formData.includeNonSolicitation || false}
              onChange={(e) => updateFormData({ includeNonSolicitation: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Notice periods */}
      {jurisdictionData?.noticePeriodsRequired && marketStandards?.noticePeriodDays && (
        <SmartInput
          label={t('noticePeriod')}
          name="noticePeriod"
          value={formData.noticePeriod || ''}
          onChange={(value) => updateFormData({ noticePeriod: value })}
          placeholder={`${marketStandards.noticePeriodDays} days`}
          helpText={t('noticePeriodHelp')}
          suggestion={{
            value: `${marketStandards.noticePeriodDays} days`,
            reason: t('requiredIn', { jurisdiction: jurisdictionName }),
            confidence: 'high',
            source: 'legal-requirement',
          }}
          onApplySuggestion={() => {
            updateFormData({ noticePeriod: `${marketStandards.noticePeriodDays} days` });
          }}
        />
      )}
    </div>
  );
}
