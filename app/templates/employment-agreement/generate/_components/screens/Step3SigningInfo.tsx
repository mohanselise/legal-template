'use client';

import React from 'react';
import { PenLine } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';

export function Step3SigningInfo() {
  const { formData, updateFormData } = useSmartForm();

  const emailsMatch = 
    formData.employeeEmail &&
    formData.companyRepEmail &&
    formData.employeeEmail.trim().toLowerCase() === formData.companyRepEmail.trim().toLowerCase();

  const canContinue =
    formData.employeeEmail &&
    formData.companyRepName &&
    formData.companyRepTitle &&
    formData.companyRepEmail &&
    !emailsMatch;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <PenLine className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          Signing information
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Who will sign this agreement?
        </p>
      </div>

      {/* Company Representative Section */}
      <div className="space-y-5">
        <div className="pb-2 border-b border-[hsl(var(--brand-border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
            Company Representative
          </h3>
          <p className="text-sm text-[hsl(var(--brand-muted))]">
            The authorized person who will sign on behalf of {formData.companyName || 'the company'}
          </p>
        </div>

        <SmartInput
          label="Representative name"
          name="companyRepName"
          value={formData.companyRepName || ''}
          onChange={(value) => updateFormData({ companyRepName: value })}
          placeholder="John Doe"
          required
          helpText="Full name of the company representative"
        />

        <SmartInput
          label="Representative title/role"
          name="companyRepTitle"
          value={formData.companyRepTitle || ''}
          onChange={(value) => updateFormData({ companyRepTitle: value })}
          placeholder="CEO, HR Director, etc."
          required
          helpText="Their official title or role in the company"
        />

        <SmartInput
          label="Representative email"
          name="companyRepEmail"
          type="email"
          value={formData.companyRepEmail || ''}
          onChange={(value) => updateFormData({ companyRepEmail: value })}
          placeholder="john.doe@company.com"
          required
          helpText="Email address to receive the signature request"
          validation={emailsMatch ? {
            field: 'companyRepEmail',
            severity: 'error',
            message: 'Employee and employer emails cannot be the same',
            suggestion: 'Please use different email addresses for the employee and company representative'
          } : undefined}
        />

        <SmartInput
          label="Representative phone (optional)"
          name="companyRepPhone"
          type="tel"
          value={formData.companyRepPhone || ''}
          onChange={(value) => updateFormData({ companyRepPhone: value })}
          placeholder="+1 (555) 123-4567"
          helpText="Phone number for notifications"
        />
      </div>

      {/* Employee Section */}
      <div className="space-y-5 pt-4">
        <div className="pb-2 border-b border-[hsl(var(--brand-border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
            Employee Information
          </h3>
          <p className="text-sm text-[hsl(var(--brand-muted))]">
            Contact details for {formData.employeeName || 'the employee'}
          </p>
        </div>

        <SmartInput
          label="Employee email"
          name="employeeEmail"
          type="email"
          value={formData.employeeEmail || ''}
          onChange={(value) => updateFormData({ employeeEmail: value })}
          placeholder="jane.smith@email.com"
          required
          helpText="Email address to receive the signature request"
          validation={emailsMatch ? {
            field: 'employeeEmail',
            severity: 'error',
            message: 'Employee and employer emails cannot be the same',
            suggestion: 'Please use different email addresses for the employee and company representative'
          } : undefined}
        />

        <SmartInput
          label="Employee phone (optional)"
          name="employeePhone"
          type="tel"
          value={formData.employeePhone || ''}
          onChange={(value) => updateFormData({ employeePhone: value })}
          placeholder="+1 (555) 987-6543"
          helpText="Phone number for notifications"
        />
      </div>

      {/* Info callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 text-sm">
        <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
          <strong className="font-semibold">📧 Signature Process:</strong> Both parties will receive an email with a link to electronically sign the agreement once it&apos;s generated.
        </p>
      </div>
    </div>
  );
}
