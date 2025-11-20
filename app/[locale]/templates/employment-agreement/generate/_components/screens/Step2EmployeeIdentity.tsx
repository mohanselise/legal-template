'use client';

import React, { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { User } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { useReverseGeocode } from '@/lib/hooks/useReverseGeocode';
import { parseAddressString } from '@/lib/utils/address-formatting';
import type { StructuredAddress } from '@/lib/utils/address-formatting';

export function Step2EmployeeIdentity() {
  const t = useTranslations('employmentAgreement.step2');
  const { formData, updateFormData, enrichment } = useSmartForm();
  const { geocode, loading: geocodingLoading } = useReverseGeocode();

  const canContinue =
    formData.employeeName && formData.employeeAddress && formData.startDate;

  // Handle structured address from autocomplete selection
  const handleAddressStructuredSelect = useCallback((address: string, structured: StructuredAddress) => {
    updateFormData({
      employeeAddress: address,
      // Store structured address components (optional fields, won't break schema)
      employeeAddressStructured: structured as any,
    });
  }, [updateFormData]);

  // Handle manual address entry - try reverse geocoding on blur (silent attempt)
  const handleAddressBlur = useCallback(async (address: string) => {
    // Only attempt if we don't already have structured data
    if (formData.employeeAddressStructured) {
      return; // Already have structured data, skip
    }

    if (!address || address.trim().length < 5) {
      return; // Too short, skip
    }

    try {
      // Attempt reverse geocoding
      const structured = await geocode(address);
      if (structured) {
        updateFormData({
          employeeAddressStructured: structured as any,
        });
        return; // Success, we're done
      }
    } catch (error) {
      // Silently fail - this is just an attempt
      console.debug('Auto-geocoding failed for employee address:', error);
    }

    // Fallback: try simple parsing
    try {
      const parsed = parseAddressString(address);
      if (parsed.street || parsed.city) {
        updateFormData({
          employeeAddressStructured: parsed as any,
        });
      }
    } catch (error) {
      // Silently fail - parsing also failed, that's okay
      console.debug('Address parsing failed for employee address:', error);
    }
  }, [formData.employeeAddressStructured, geocode, updateFormData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          {t('title')}
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          {t('subtitle')}
        </p>
      </div>

      {/* Background analysis in progress */}
      {(enrichment.jurisdictionLoading || enrichment.companyLoading || enrichment.jobTitleLoading) && (
        <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-[hsl(var(--brand-muted))]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--brand-primary))]" />
            {t('stillAnalyzing')}
          </p>
        </div>
      )}

      {/* Analysis complete - show summary */}
      {!enrichment.jurisdictionLoading && !enrichment.companyLoading && !enrichment.jobTitleLoading && enrichment.jurisdictionData && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
            {t('analysisComplete', {
              country: enrichment.jurisdictionData.country,
              industry: enrichment.companyData?.industryDetected ? ` • ${enrichment.companyData.industryDetected}` : '',
              department: enrichment.jobTitleData?.department ? ` • ${enrichment.jobTitleData.department}` : ''
            })}
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <SmartInput
          label={t('employeeFullName')}
          name="employeeName"
          value={formData.employeeName || ''}
          onChange={(value) => updateFormData({ employeeName: value })}
          placeholder="Jane Smith"
          required
          helpText={t('employeeFullNameHelp')}
        />

        <SmartInput
          label={t('employeeAddress')}
          name="employeeAddress"
          value={formData.employeeAddress || ''}
          onChange={(value) => {
            updateFormData({ employeeAddress: value });
            // Clear structured data when user edits manually
            if (formData.employeeAddressStructured) {
              updateFormData({ employeeAddressStructured: undefined as any });
            }
          }}
          placeholder="456 Oak Avenue, Apt 3B, Austin, TX 78701, USA"
          required
          helpText={t('employeeAddressHelp')}
          enableAddressAutocomplete={true}
          autocompleteType="address"
          loading={geocodingLoading}
          onAddressStructuredSelect={handleAddressStructuredSelect}
          onAddressSelect={(address) => {
            // Fallback if structured select not available
            updateFormData({ employeeAddress: address });
          }}
          onAddressBlur={handleAddressBlur}
        />

        <SmartInput
          label={t('reportsTo')}
          name="reportsTo"
          value={formData.reportsTo || ''}
          onChange={(value) => updateFormData({ reportsTo: value })}
          placeholder="John Doe, VP of Engineering"
          helpText={t('reportsToHelp')}
        />

        <SmartInput
          label={t('startDate')}
          name="startDate"
          type="date"
          value={formData.startDate || ''}
          onChange={(value) => updateFormData({ startDate: value })}
          required
          helpText={t('startDateHelp')}
        />
      </div>
    </div>
  );
}
