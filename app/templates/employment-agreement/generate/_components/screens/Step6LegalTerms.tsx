'use client';

import React from 'react';
import { Scale, Zap } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Step6LegalTerms() {
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
          <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
            Legal terms
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            Protective clauses and jurisdiction
          </p>
        </div>
      </div>

      {/* Jurisdiction */}
      <SmartInput
        label="Governing law"
        name="governingLaw"
        value={formData.governingLaw || ''}
        onChange={(value) => updateFormData({ governingLaw: value })}
        placeholder="State of California, United States"
        required
        helpText="Which jurisdiction's law governs this agreement"
        suggestion={
          jurisdictionData
            ? {
                value: jurisdictionData.state
                  ? `${jurisdictionData.state}, ${jurisdictionData.country}`
                  : jurisdictionData.country,
                reason: 'Based on company location',
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
        <Label className="text-sm font-medium">Standard protection clauses</Label>

        {/* Confidentiality */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium text-sm">Confidentiality (NDA)</p>
            <p className="text-xs text-muted-foreground">Protects company information</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={marketStandards?.confidentialityRequired ? 'default' : 'outline'}>
              {marketStandards?.confidentialityRequired ? 'Required' : 'Optional'}
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
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium text-sm">IP Assignment</p>
            <p className="text-xs text-muted-foreground">Company owns work product</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={marketStandards?.ipAssignmentRequired ? 'default' : 'outline'}>
              {marketStandards?.ipAssignmentRequired ? 'Recommended' : 'Optional'}
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
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium text-sm">Non-compete</p>
            <p className="text-xs text-muted-foreground">
              {marketStandards?.nonCompeteEnforceable
                ? 'Enforceable in this jurisdiction'
                : 'Not enforceable in this jurisdiction'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={marketStandards?.nonCompeteEnforceable ? 'outline' : 'secondary'}>
              {marketStandards?.nonCompeteEnforceable ? 'Allowed' : 'Not enforceable'}
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
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium text-sm">Non-solicitation</p>
            <p className="text-xs text-muted-foreground">Prevents poaching employees/clients</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={marketStandards?.nonSolicitationCommon ? 'default' : 'outline'}>
              {marketStandards?.nonSolicitationCommon ? 'Common' : 'Optional'}
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
          label="Notice period"
          name="noticePeriod"
          value={formData.noticePeriod || ''}
          onChange={(value) => updateFormData({ noticePeriod: value })}
          placeholder={`${marketStandards.noticePeriodDays} days`}
          helpText="Required notice period for termination"
          suggestion={{
            value: `${marketStandards.noticePeriodDays} days`,
            reason: `Required in ${jurisdictionName}`,
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
