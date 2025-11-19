'use client';

import React, { useState } from 'react';
import { AlertTriangle, Building2, Sparkles, Briefcase, Zap, Loader2 } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { getFlagEmoji } from '@/lib/utils/flag-emoji';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';

export function Step1CompanyIdentity() {
  const { formData, updateFormData, enrichment } = useSmartForm();
  const [isGeneratingResponsibilities, setIsGeneratingResponsibilities] = useState(false);
  const [responsibilitiesError, setResponsibilitiesError] = useState<string | null>(null);

  const canContinue = formData.companyName && formData.companyAddress && formData.jobTitle;
  const canGenerateResponsibilities = canContinue && !isGeneratingResponsibilities;

  const handleGenerateResponsibilities = async () => {
    if (!canGenerateResponsibilities) return;

    setIsGeneratingResponsibilities(true);
    setResponsibilitiesError(null);

    try {
      const response = await fetch('/api/ai/job-responsibilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          jobTitle: formData.jobTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate responsibilities');
      }

      const data = await response.json();
      if (data.responsibilities) {
        updateFormData({ jobResponsibilities: data.responsibilities });
      }
    } catch (error) {
      console.error('Error generating job responsibilities:', error);
      setResponsibilitiesError(
        error instanceof Error ? error.message : 'Failed to generate job responsibilities'
      );
    } finally {
      setIsGeneratingResponsibilities(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          Company & role details
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Tell us about the employer and the position
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <SmartInput
          label="Company legal name"
          name="companyName"
          value={formData.companyName || ''}
          onChange={(value) => updateFormData({ companyName: value })}
          placeholder="Acme Corporation Inc."
          required
          helpText="The full legal name of the employing entity"
        />

        <SmartInput
          label="Company address"
          name="companyAddress"
          value={formData.companyAddress || ''}
          onChange={(value) => updateFormData({ companyAddress: value })}
          placeholder="123 Main Street, Suite 500, San Francisco, CA 94105, USA"
          required
          helpText="Full address including city, state/province, and country"
          loading={enrichment.jurisdictionLoading || enrichment.companyLoading}
          enableAddressAutocomplete={true}
          autocompleteType="address"
          searchQuery={formData.companyName}
        />

        <SmartInput
          label="Job title"
          name="jobTitle"
          value={formData.jobTitle || ''}
          onChange={(value) => updateFormData({ jobTitle: value })}
          placeholder="Senior Software Engineer"
          required
          helpText="Official job title for this position"
          loading={enrichment.jobTitleLoading}
        />

        <Field className="space-y-2">
          <FieldLabel htmlFor="jobResponsibilities">
            Job responsibilities (optional)
          </FieldLabel>
          <div className="relative">
            <textarea
              id="jobResponsibilities"
              name="jobResponsibilities"
              value={formData.jobResponsibilities || ''}
              onChange={(e) => {
                updateFormData({ jobResponsibilities: e.target.value });
                setResponsibilitiesError(null); // Clear error when user edits
              }}
              placeholder="Lead development of core features, mentor junior developers, collaborate with product team on roadmap..."
              rows={4}
              disabled={isGeneratingResponsibilities}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 pr-24 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-all relative"
            />
            {/* Loading overlay */}
            {isGeneratingResponsibilities && (
              <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--brand-primary))]" />
                  <p className="text-xs text-muted-foreground font-medium">Generating suggestions...</p>
                </div>
              </div>
            )}
            {/* Smart suggestions button - morphs into spinner */}
            {canGenerateResponsibilities && (
              <div className="absolute right-2 top-2 z-30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateResponsibilities}
                  disabled={isGeneratingResponsibilities}
                  className={`
                    flex items-center justify-center
                    h-7 transition-all duration-300 ease-in-out
                    ${isGeneratingResponsibilities 
                      ? 'w-7 px-0 rounded-full min-w-0' 
                      : 'px-2.5 rounded-md w-auto'
                    }
                    text-[hsl(var(--brand-primary))] 
                    hover:text-[hsl(var(--brand-primary))] 
                    hover:bg-[hsl(var(--brand-primary)/0.1)] 
                    bg-background/80 backdrop-blur-sm 
                    border border-[hsl(var(--border))] 
                    shadow-sm
                    disabled:opacity-100
                    overflow-hidden
                  `}
                >
                  {isGeneratingResponsibilities ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      <span className="hidden sm:inline ml-1.5">Smart suggestions</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          {formData.jobResponsibilities && (
            <FieldDescription>
              Key duties and responsibilities - helps us provide better salary benchmarks
            </FieldDescription>
          )}
          {responsibilitiesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{responsibilitiesError}</span>
              </div>
            </div>
          )}
        </Field>
      </div>

      {/* Background analysis loading indicator */}
      {(enrichment.jurisdictionLoading || enrichment.companyLoading || enrichment.jobTitleLoading) && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--brand-border))] border-t-[hsl(var(--brand-primary))]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[hsl(var(--brand-primary))] animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                Analyzing in background...
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
                Detecting jurisdiction, company details, and role requirements
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Jurisdiction detection feedback */}
      {!enrichment.jurisdictionLoading && enrichment.jurisdictionData && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getFlagEmoji(enrichment.jurisdictionData.countryCode)}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                Jurisdiction detected: {enrichment.jurisdictionData.country}
                {enrichment.jurisdictionData.state && `, ${enrichment.jurisdictionData.state}`}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
                We&apos;ll apply local labor standards and legal requirements automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company intelligence (if available) */}
      {!enrichment.companyLoading && enrichment.companyData?.industryDetected && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 text-sm text-[hsl(var(--brand-muted))] shadow-sm">
          <p>
            <strong className="font-semibold text-[hsl(var(--brand-primary))]">Industry:</strong> {enrichment.companyData.industryDetected}
          </p>
        </div>
      )}

      {/* Job title analysis results */}
      {!enrichment.jobTitleLoading && enrichment.jobTitleData && (
        <div className="space-y-3 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Briefcase className="mt-0.5 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                Role Analysis
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
                >
                  {enrichment.jobTitleData.department}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs capitalize border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
                >
                  {enrichment.jobTitleData.seniorityLevel} level
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs capitalize border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
                >
                  {enrichment.jobTitleData.exemptStatus}
                </Badge>
              </div>

              {enrichment.jobTitleData.typicalSalaryRange && (
                <p className="text-xs text-[hsl(var(--brand-muted))]">
                  Typical salary range:{' '}
                  {enrichment.jobTitleData.typicalSalaryRange.currency}
                  {enrichment.jobTitleData.typicalSalaryRange.min.toLocaleString()} -{' '}
                  {enrichment.jobTitleData.typicalSalaryRange.currency}
                  {enrichment.jobTitleData.typicalSalaryRange.max.toLocaleString()}
                  {' '}(median: {enrichment.jobTitleData.typicalSalaryRange.currency}
                  {enrichment.jobTitleData.typicalSalaryRange.median.toLocaleString()})
                </p>
              )}

              {enrichment.jobTitleData.equityTypical && (
                <p className="text-xs text-[hsl(var(--brand-muted))]">
                  💡 Equity compensation is typical for this role
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {(enrichment.jurisdictionLoading || enrichment.companyLoading || enrichment.jobTitleLoading) && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-[hsl(var(--brand-muted))]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--brand-primary))]" />
            Analyzing company, jurisdiction, and role details...
          </p>
        </div>
      )}

      {/* Error state */}
      {(enrichment.jurisdictionError || enrichment.companyError || enrichment.jobTitleError) && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 text-sm text-[hsl(var(--brand-muted))] shadow-sm">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
            <span>
              {enrichment.jurisdictionError || enrichment.companyError || enrichment.jobTitleError}
              {' '}You can continue with manual entry.
            </span>
          </p>
        </div>
      )}

      {/* Help text */}
      {!canContinue && (
        <p className="text-sm text-muted-foreground">
          Once you provide these details, we&apos;ll automatically analyze the jurisdiction,
          role, and compensation benchmarks to prepare smart defaults for the rest of the form.
        </p>
      )}
    </div>
  );
}
