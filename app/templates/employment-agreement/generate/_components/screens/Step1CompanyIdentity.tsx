'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Zap } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';

export function Step1CompanyIdentity() {
  const { formData, updateFormData, analyzeCompany, enrichment } = useSmartForm();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Auto-trigger analysis when both company name and address are filled
  useEffect(() => {
    if (
      formData.companyName &&
      formData.companyAddress &&
      !hasAnalyzed &&
      !enrichment.jurisdictionLoading
    ) {
      setHasAnalyzed(true);
      analyzeCompany(formData.companyName, formData.companyAddress);
    }
  }, [formData.companyName, formData.companyAddress, hasAnalyzed, enrichment.jurisdictionLoading, analyzeCompany]);

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
        />
      </div>

      {/* Jurisdiction detection feedback */}
      {enrichment.jurisdictionData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl">
              {enrichment.jurisdictionData.countryCode === 'US' && '🇺🇸'}
              {enrichment.jurisdictionData.countryCode === 'GB' && '🇬🇧'}
              {enrichment.jurisdictionData.countryCode === 'CH' && '🇨🇭'}
              {enrichment.jurisdictionData.countryCode === 'DE' && '🇩🇪'}
              {enrichment.jurisdictionData.countryCode === 'CA' && '🇨🇦'}
              {enrichment.jurisdictionData.countryCode === 'AU' && '🇦🇺'}
              {enrichment.jurisdictionData.countryCode === 'FR' && '🇫🇷'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">
                Jurisdiction detected: {enrichment.jurisdictionData.country}
                {enrichment.jurisdictionData.state && `, ${enrichment.jurisdictionData.state}`}
              </p>
              <p className="text-xs text-green-700 mt-1">
                We&apos;ll apply local labor standards and legal requirements automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company intelligence (if available) */}
      {enrichment.companyData?.industryDetected && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <strong>Industry:</strong> {enrichment.companyData.industryDetected}
          </p>
        </div>
      )}

      {/* Error state */}
      {enrichment.jurisdictionError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-900">
            ⚠️ Smart suggestions unavailable. You can continue with manual entry.
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
