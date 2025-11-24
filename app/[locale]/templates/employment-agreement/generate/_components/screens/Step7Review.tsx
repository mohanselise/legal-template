'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, AlertCircle, CheckCircle2, Edit3, AlertTriangle, Info, Building2, User, Briefcase, Clock, DollarSign } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateAgainstIntelligence } from '@/lib/validation/smart-validation';

export function Step7Review() {
  const t = useTranslations('employmentAgreement.step7');
  const tCommon = useTranslations('common');
  const tStep6 = useTranslations('employmentAgreement.step6');
  const { formData, enrichment, goToStep } = useSmartForm();

  // Helper to convert salary to annual for comparison
  const convertToAnnualSalary = (amount: number, frequency: string): number => {
    const workHoursPerYear = 2080;
    const workWeeksPerYear = 52;
    switch (frequency?.toLowerCase()) {
      case 'hourly': return amount * workHoursPerYear;
      case 'weekly': return amount * workWeeksPerYear;
      case 'bi-weekly': return amount * (workWeeksPerYear / 2);
      case 'monthly': return amount * 12;
      case 'annual':
      default: return amount;
    }
  };

  const validationWarnings = useMemo(
    () => validateAgainstIntelligence(formData, enrichment),
    [formData, enrichment]
  );

  const errors = validationWarnings.filter((w) => w.severity === 'error');
  const warnings = validationWarnings.filter((w) => w.severity === 'warning');
  const suggestions = validationWarnings.filter((w) => w.severity === 'info');

  const customizations: string[] = [];
  const marketStandards = enrichment.marketStandards;

  if (marketStandards) {
    const salary = parseFloat(formData.salaryAmount || '0');
    if (enrichment.jobTitleData?.typicalSalaryRange) {
      const userCurrency = formData.salaryCurrency || 'USD';
      const marketCurrency = enrichment.jobTitleData.typicalSalaryRange.currency;

      if (userCurrency === marketCurrency) {
        const annualSalary = convertToAnnualSalary(salary, formData.salaryPeriod || 'annual');
        const median = enrichment.jobTitleData.typicalSalaryRange.median;
        const diff = ((annualSalary - median) / median) * 100;
        if (Math.abs(diff) > 10) {
          customizations.push(
            `Salary: ${diff > 0 ? '+' : ''}${diff.toFixed(0)}% ${diff > 0 ? tCommon('above') : tCommon('below')} market median`
          );
        }
      }
    }

    // PTO comparison removed - benefits step has been removed from the flow

    if (formData.workArrangement && formData.workArrangement !== marketStandards.workArrangement) {
      const tWork = useTranslations('employmentAgreement.step3Work');
      const workArrangementLabel = formData.workArrangement === 'on-site' ? tWork('onSite') : 
                                   formData.workArrangement === 'remote' ? tWork('remote') : 
                                   formData.workArrangement === 'hybrid' ? tWork('hybrid') : formData.workArrangement;
      const standardLabel = marketStandards.workArrangement === 'on-site' ? tWork('onSite') : 
                            marketStandards.workArrangement === 'remote' ? tWork('remote') : 
                            marketStandards.workArrangement === 'hybrid' ? tWork('hybrid') : marketStandards.workArrangement;
      customizations.push(
        `${tWork('workArrangement')}: ${workArrangementLabel} (${tWork('standard')}: ${standardLabel})`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          {t('title')}
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Parties Card */}
        <div className="relative p-6 rounded-xl border bg-card space-y-4 group hover:border-[hsl(var(--brand-primary))]/30 transition-colors">
          {/* Checkmark indicator */}
          {formData.companyName && formData.employeeName && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <p className="font-semibold text-base">{t('parties')}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('company')}</p>
              <p className="font-medium text-base">{formData.companyName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee')}</p>
              <p className="font-medium text-base">{formData.employeeName || '—'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(0)} className="text-sm text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/10">
            <Edit3 className="w-4 h-4 mr-1.5" />
            {t('edit')}
          </Button>
        </div>

        {/* Position Card */}
        <div className="relative p-6 rounded-xl border bg-card space-y-4 group hover:border-[hsl(var(--brand-primary))]/30 transition-colors">
          {formData.jobTitle && formData.startDate && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <p className="font-semibold text-base">{t('position')}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('title')}</p>
              <p className="font-medium text-base">{formData.jobTitle || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('startDate')}</p>
              <p className="font-medium text-base">{formData.startDate || '—'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(1)} className="text-sm text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/10">
            <Edit3 className="w-4 h-4 mr-1.5" />
            {t('edit')}
          </Button>
        </div>

        {/* Work Details Card */}
        <div className="relative p-6 rounded-xl border bg-card space-y-4 group hover:border-[hsl(var(--brand-primary))]/30 transition-colors">
          {formData.workArrangement && formData.workHoursPerWeek && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <p className="font-semibold text-base">{t('workDetails')}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('arrangement')}</p>
              <p className="font-medium text-base capitalize">{formData.workArrangement || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('hoursPerWeek')}</p>
              <p className="font-medium text-base">{formData.workHoursPerWeek || '—'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(3)} className="text-sm text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/10">
            <Edit3 className="w-4 h-4 mr-1.5" />
            {t('edit')}
          </Button>
        </div>

        {/* Compensation Card */}
        <div className="relative p-6 rounded-xl border bg-card space-y-4 group hover:border-[hsl(var(--brand-primary))]/30 transition-colors">
          {formData.salaryCurrency && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <p className="font-semibold text-base">{t('compensation')}</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('baseSalary')}</p>
              <p className="font-medium text-base">
                {formData.salaryCurrency} {formData.salaryAmount ? parseFloat(formData.salaryAmount).toLocaleString() : '—'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(4)} className="text-sm text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/10">
            <Edit3 className="w-4 h-4 mr-1.5" />
            {t('edit')}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            {t('criticalIssues', { count: errors.length, plural: errors.length === 1 ? t('issue') : t('issues') })}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-2 mt-2">
              {errors.map((error, i) => (
                <li key={i}>
                  <strong>{error.message}</strong>
                  {error.suggestion && (
                    <div className="text-xs mt-1 ml-5 text-[hsl(var(--muted-foreground))]">{error.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {t('warnings', { count: warnings.length, plural: warnings.length === 1 ? t('warning') : t('warningsPlural') })}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-[hsl(var(--brand-muted))]">
              {warnings.map((warning, i) => (
                <li key={i}>
                  {warning.message}
                  {warning.suggestion && (
                    <div className="text-xs mt-1 ml-5 text-[hsl(var(--muted-foreground))]">{warning.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {suggestions.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <Info className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {t('suggestions', { count: suggestions.length, plural: suggestions.length === 1 ? t('suggestion') : t('suggestionsPlural') })}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-[hsl(var(--brand-muted))]">
              {suggestions.map((suggestion, i) => (
                <li key={i}>
                  {suggestion.message}
                  {suggestion.suggestion && (
                    <div className="text-xs mt-1 ml-5 text-[hsl(var(--muted-foreground))]">{suggestion.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {customizations.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {t('customizationsDetected', { count: customizations.length, plural: customizations.length > 1 ? 's' : '' })}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              {customizations.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {customizations.length === 0 && marketStandards && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertDescription className="text-sm">
            {t('allTermsAlign')}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[hsl(var(--fg))]">{t('protectionClausesIncluded')}</p>
        <div className="flex flex-wrap gap-2">
          {formData.includeConfidentiality && (
            <Badge variant="outline" className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
              {tStep6('confidentiality')}
            </Badge>
          )}
          {formData.includeIpAssignment && (
            <Badge variant="outline" className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
              {tStep6('ipAssignment')}
            </Badge>
          )}
          {formData.includeNonCompete && (
            <Badge variant="outline" className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
              {tStep6('nonCompete')}
            </Badge>
          )}
          {formData.includeNonSolicitation && (
            <Badge variant="outline" className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
              {tStep6('nonSolicitation')}
            </Badge>
          )}
          {!formData.includeConfidentiality &&
            !formData.includeIpAssignment &&
            !formData.includeNonCompete &&
            !formData.includeNonSolicitation && (
              <span className="text-sm text-muted-foreground">{t('noneSelected')}</span>
            )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 text-sm text-[hsl(var(--brand-muted))]">
        {t('allSet')}
      </div>
    </div>
  );
}
