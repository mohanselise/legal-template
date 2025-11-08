'use client';

import React, { useEffect, useState } from 'react';
import { User, Briefcase } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Badge } from '@/components/ui/badge';

export function Step2EmployeeIdentity() {
  const {
    formData,
    updateFormData,
    analyzeJobTitle,
    enrichment,
    generateMarketStandards,
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
      ).then(() => {
        // Generate market standards after job analysis completes
        generateMarketStandards();
      });
    }
  }, [
    formData.jobTitle,
    hasAnalyzedJob,
    enrichment.jobTitleLoading,
    enrichment.jurisdictionData,
    enrichment.companyData,
    analyzeJobTitle,
    generateMarketStandards,
  ]);

  const canContinue =
    formData.employeeName && formData.jobTitle && formData.startDate;

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

      {/* Background analysis indicator */}
      {enrichment.jurisdictionLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Analyzing jurisdiction requirements in the background...
          </p>
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
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Briefcase className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-purple-900">
                Role Analysis
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {enrichment.jobTitleData.department}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {enrichment.jobTitleData.seniorityLevel} level
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {enrichment.jobTitleData.exemptStatus}
                </Badge>
              </div>

              {enrichment.jobTitleData.typicalSalaryRange && (
                <p className="text-xs text-purple-700">
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
                <p className="text-xs text-purple-700">
                  💡 Equity compensation is typical for this role
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Market standards preparation */}
      {enrichment.marketStandards && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-900">
            ✓ Market standards prepared based on {enrichment.marketStandards.source}
          </p>
        </div>
      )}
    </div>
  );
}
