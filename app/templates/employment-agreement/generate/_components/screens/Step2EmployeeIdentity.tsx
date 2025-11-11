'use client';

import React, { useEffect, useState } from 'react';
import { User, Briefcase } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Badge } from '@/components/ui/badge';
import { getFlagEmoji } from '@/lib/utils/flag-emoji';

export function Step2EmployeeIdentity() {
  const {
    formData,
    updateFormData,
    analyzeJobTitle,
    enrichment,
  } = useSmartForm();
  const [hasAnalyzedJob, setHasAnalyzedJob] = useState(false);

  // Auto-trigger job title analysis when title is filled
  useEffect(() => {
    if (formData.jobTitle && !hasAnalyzedJob && !enrichment.jobTitleLoading) {
      setHasAnalyzedJob(true);
      analyzeJobTitle(
        formData.jobTitle,
        enrichment.jurisdictionData?.city || enrichment.jurisdictionData?.country,
        enrichment.companyData?.industryDetected
      );
    }
  }, [
    formData.jobTitle,
    hasAnalyzedJob,
    enrichment.jobTitleLoading,
    enrichment.jurisdictionData,
    enrichment.companyData,
    analyzeJobTitle,
  ]);

  // Note: Market standards generation now handled by SmartFormContext
  // It triggers automatically when enrichment.jobTitleData is set

  const canContinue =
    formData.employeeName && formData.employeeAddress && formData.jobTitle && formData.startDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
          Now for the employee
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Basic information about the new hire
        </p>
      </div>

      {/* Jurisdiction detection - show when loading OR when data arrives */}
      {enrichment.jurisdictionLoading && !enrichment.jurisdictionData && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-[hsl(var(--brand-muted))]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--brand-primary))]" />
            Analyzing jurisdiction requirements in the background...
          </p>
        </div>
      )}

      {/* Show jurisdiction data when it arrives (even if user navigated away quickly) */}
      {enrichment.jurisdictionData && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-xl">{getFlagEmoji(enrichment.jurisdictionData.countryCode)}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                Jurisdiction: {enrichment.jurisdictionData.country}
                {enrichment.jurisdictionData.state && `, ${enrichment.jurisdictionData.state}`}
              </p>
              <p className="text-xs text-[hsl(var(--brand-muted))]">
                {enrichment.jurisdictionData.currency} • {enrichment.jurisdictionData.typicalPTO} days PTO • {enrichment.jurisdictionData.typicalPayFrequency} pay
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <SmartInput
          label="Employee full name"
          name="employeeName"
          value={formData.employeeName || ''}
          onChange={(value) => updateFormData({ employeeName: value })}
          placeholder="Jane Smith"
          required
          helpText="Full legal name as it should appear on the agreement"
        />

        <SmartInput
          label="Employee address"
          name="employeeAddress"
          value={formData.employeeAddress || ''}
          onChange={(value) => updateFormData({ employeeAddress: value })}
          placeholder="456 Oak Avenue, Apt 3B, Austin, TX 78701, USA"
          required
          helpText="Full residential address of the employee"
          enableAddressAutocomplete={true}
          autocompleteType="address"
        />

        <SmartInput
          label="Job title"
          name="jobTitle"
          value={formData.jobTitle || ''}
          onChange={(value) => {
            updateFormData({ jobTitle: value });
            setHasAnalyzedJob(false); // Reset to re-analyze on change
          }}
          placeholder="Senior Software Engineer"
          required
          helpText="Official job title for this position"
          loading={enrichment.jobTitleLoading}
        />

        <SmartInput
          label="Reports to (optional)"
          name="reportsTo"
          value={formData.reportsTo || ''}
          onChange={(value) => updateFormData({ reportsTo: value })}
          placeholder="John Doe, VP of Engineering"
          helpText="The name and title of the employee's direct supervisor"
        />

        <SmartInput
          label="Start date"
          name="startDate"
          type="date"
          value={formData.startDate || ''}
          onChange={(value) => updateFormData({ startDate: value })}
          required
          helpText="First day of employment"
        />
      </div>

      {/* Job title analysis results */}
      {enrichment.jobTitleData && (
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

      {/* Market standards preparation */}
      {enrichment.marketStandards && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <p className="text-sm text-[hsl(var(--brand-muted))]">
            ✓ Market standards prepared based on {enrichment.marketStandards.source}
          </p>
        </div>
      )}
    </div>
  );
}
