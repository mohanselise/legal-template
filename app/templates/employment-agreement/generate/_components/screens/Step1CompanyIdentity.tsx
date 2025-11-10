'use client';

import React from 'react';
import { AlertTriangle, Building2 } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { getFlagEmoji } from '@/lib/utils/flag-emoji';

export function Step1CompanyIdentity() {
  const { formData, updateFormData, enrichment } = useSmartForm();

  const canContinue = formData.companyName && formData.companyAddress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
          Let&apos;s start with the company
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Tell us about the employer
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
          loading={enrichment.jurisdictionLoading}
          enableAddressAutocomplete={true}
          autocompleteType="address"
          searchQuery={formData.companyName}
        />
      </div>

      {/* Jurisdiction detection feedback */}
      {enrichment.jurisdictionData && (
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
      {enrichment.companyData?.industryDetected && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 text-sm text-[hsl(var(--brand-muted))] shadow-sm">
          <p>
            <strong className="font-semibold text-[hsl(var(--brand-primary))]">Industry:</strong> {enrichment.companyData.industryDetected}
          </p>
        </div>
      )}

      {/* Error state */}
      {enrichment.jurisdictionError && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 text-sm text-[hsl(var(--brand-muted))] shadow-sm">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
            <span>
              Smart suggestions are currently unavailable. You can continue with manual entry.
            </span>
          </p>
        </div>
      )}

      {/* Help text */}
      {!canContinue && (
        <p className="text-sm text-muted-foreground">
          Once you provide these details, we&apos;ll automatically analyze the jurisdiction
          and prepare smart defaults for the rest of the form.
        </p>
      )}
    </div>
  );
}
