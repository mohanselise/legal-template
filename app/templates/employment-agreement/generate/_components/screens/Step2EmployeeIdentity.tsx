'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';

export function Step2EmployeeIdentity() {
  const { formData, updateFormData, enrichment } = useSmartForm();

  const canContinue =
    formData.employeeName && formData.employeeAddress && formData.startDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          Now for the employee
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Personal information about the new hire
        </p>
      </div>

      {/* Background analysis in progress */}
      {(enrichment.jurisdictionLoading || enrichment.companyLoading || enrichment.jobTitleLoading) && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-[hsl(var(--brand-muted))]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--brand-primary))]" />
            Still analyzing jurisdiction and role in the background...
          </p>
        </div>
      )}

      {/* Analysis complete - show summary */}
      {!enrichment.jurisdictionLoading && !enrichment.companyLoading && !enrichment.jobTitleLoading && enrichment.jurisdictionData && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
            Analysis complete: {enrichment.jurisdictionData.country}
            {enrichment.companyData?.industryDetected && ` • ${enrichment.companyData.industryDetected}`}
            {enrichment.jobTitleData?.department && ` • ${enrichment.jobTitleData.department}`}
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
    </div>
  );
}
