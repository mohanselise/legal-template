'use client';

/**
 * Shared Enrichment Feedback Component
 * 
 * Displays AI analysis results and loading states for enrichment data.
 */

import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getFlagEmoji } from '@/lib/utils/flag-emoji';
import type { EnrichmentState } from '../types';

interface EnrichmentFeedbackProps {
  /** Current enrichment state */
  enrichment: EnrichmentState;
  /** Show jurisdiction detection results */
  showJurisdiction?: boolean;
  /** Show company analysis results */
  showCompany?: boolean;
  /** Show job title analysis results */
  showJobTitle?: boolean;
  /** Loading message override */
  loadingMessage?: string;
}

export function EnrichmentFeedback({
  enrichment,
  showJurisdiction = true,
  showCompany = true,
  showJobTitle = false,
  loadingMessage = 'Analyzing in background...',
}: EnrichmentFeedbackProps) {
  const isLoading = enrichment.jurisdictionLoading || 
                    enrichment.companyLoading || 
                    enrichment.jobTitleLoading;

  const hasError = enrichment.jurisdictionError || 
                   enrichment.companyError || 
                   enrichment.jobTitleError;

  // Loading state
  if (isLoading) {
    return (
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
              {loadingMessage}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
              Detecting jurisdiction, company details, and relevant requirements
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    const errorMessage = enrichment.jurisdictionError || 
                        enrichment.companyError || 
                        enrichment.jobTitleError;
    
    return (
      <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 text-sm text-[hsl(var(--brand-muted))] shadow-sm">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
          <span>
            {errorMessage}
            {' '}You can continue with manual entry.
          </span>
        </p>
      </div>
    );
  }

  const results: React.ReactNode[] = [];

  // Jurisdiction result
  if (showJurisdiction && enrichment.jurisdictionData) {
    results.push(
      <div 
        key="jurisdiction"
        className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getFlagEmoji(enrichment.jurisdictionData.countryCode)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[hsl(var(--fg))]">
              Jurisdiction detected: {enrichment.jurisdictionData.country}
              {enrichment.jurisdictionData.state && `, ${enrichment.jurisdictionData.state}`}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
              We&apos;ll apply local standards and legal requirements automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Company result
  if (showCompany && enrichment.companyData?.industryDetected) {
    results.push(
      <div 
        key="company"
        className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-3 text-sm text-[hsl(var(--brand-muted))] shadow-sm"
      >
        <p>
          <strong className="font-semibold text-[hsl(var(--brand-primary))]">Industry:</strong>{' '}
          {enrichment.companyData.industryDetected}
        </p>
      </div>
    );
  }

  // Job title result
  if (showJobTitle && enrichment.jobTitleData) {
    results.push(
      <div 
        key="jobTitle"
        className="space-y-3 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
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
    );
  }

  if (results.length === 0) {
    return null;
  }

  return <div className="space-y-3">{results}</div>;
}

