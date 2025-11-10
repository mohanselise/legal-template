'use client';

import React, { useState, useMemo } from 'react';
import { FileText, AlertCircle, CheckCircle2, Edit3, AlertTriangle, Info } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { saveEmploymentAgreementReview } from '../../reviewStorage';
import { validateAgainstIntelligence } from '@/lib/validation/smart-validation';

interface Step7ReviewProps {
  onStartGeneration?: () => void;
}

export function Step7Review({ onStartGeneration }: Step7ReviewProps) {
  const { formData, enrichment, goToStep } = useSmartForm();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // Validate form data against intelligence
  const validationWarnings = useMemo(
    () => validateAgainstIntelligence(formData, enrichment),
    [formData, enrichment]
  );

  // Separate by severity
  const errors = validationWarnings.filter((w) => w.severity === 'error');
  const warnings = validationWarnings.filter((w) => w.severity === 'warning');
  const suggestions = validationWarnings.filter((w) => w.severity === 'info');

  const handleGenerate = async () => {
    // If parent provides onStartGeneration, use it (triggers loading screen)
    if (onStartGeneration) {
      onStartGeneration();
      return;
    }

    // Fallback: traditional immediate generation
    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          enrichment: {
            jurisdiction: enrichment.jurisdictionData,
            company: enrichment.companyData,
            jobTitle: enrichment.jobTitleData,
            marketStandards: enrichment.marketStandards,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const result = await response.json();
      const persisted = saveEmploymentAgreementReview({
        document: result.document,
        formData,
        storedAt: new Date().toISOString(),
      });

      if (persisted) {
        router.push('/templates/employment-agreement/generate/review');
        return;
      }

      const params = new URLSearchParams({
        document: JSON.stringify(result.document),
        data: JSON.stringify(formData),
      });
      router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate agreement. Please try again.');
      setIsGenerating(false);
    }
  };

  // Helper to convert salary to annual for comparison
  const convertToAnnualSalary = (amount: number, frequency: string): number => {
    const workHoursPerYear = 2080;
    const workWeeksPerYear = 52;
    switch (frequency?.toLowerCase()) {
      case 'hourly': return amount * workHoursPerYear;
      case 'weekly': return amount * workWeeksPerYear;
      case 'bi-weekly': return amount * (workWeeksPerYear / 2);
      case 'monthly': return amount * 12;
      case 'annual':
      default: return amount;
    }
  };

  // Detect customizations
  const customizations: string[] = [];
  const marketStandards = enrichment.marketStandards;

  if (marketStandards) {
    const salary = parseFloat(formData.salaryAmount || '0');
    if (enrichment.jobTitleData?.typicalSalaryRange) {
      const userCurrency = formData.salaryCurrency || 'USD';
      const marketCurrency = enrichment.jobTitleData.typicalSalaryRange.currency;

      // Only compare if currencies match
      if (userCurrency === marketCurrency) {
        // Convert user's salary to annual for comparison (market data is always annual)
        const annualSalary = convertToAnnualSalary(salary, formData.salaryPeriod || 'annual');
        const median = enrichment.jobTitleData.typicalSalaryRange.median;
        const diff = ((annualSalary - median) / median) * 100;
        if (Math.abs(diff) > 10) {
          customizations.push(
            `Salary: ${diff > 0 ? '+' : ''}${diff.toFixed(0)}% ${diff > 0 ? 'above' : 'below'} market median`
          );
        }
      }
    }

    if (formData.paidTimeOff && parseInt(formData.paidTimeOff) !== marketStandards.ptodays) {
      const diff = parseInt(formData.paidTimeOff) - marketStandards.ptodays;
      customizations.push(
        `PTO: ${Math.abs(diff)} days ${diff > 0 ? 'more' : 'less'} than standard`
      );
    }

    if (formData.workArrangement && formData.workArrangement !== marketStandards.workArrangement) {
      customizations.push(
        `Work arrangement: ${formData.workArrangement} (standard: ${marketStandards.workArrangement})`
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
          Review & generate
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Final check before creating your agreement
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company & Employee */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <p className="font-semibold text-sm">Parties</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="font-medium">{formData.companyName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employee</p>
              <p className="font-medium">{formData.employeeName || '—'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(0)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        {/* Position */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <p className="font-semibold text-sm">Position</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="font-medium">{formData.jobTitle || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium">{formData.startDate || '—'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(1)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        {/* Work Arrangement */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <p className="font-semibold text-sm">Work Details</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Arrangement</p>
              <p className="font-medium capitalize">{formData.workArrangement || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hours/week</p>
              <p className="font-medium">{formData.workHoursPerWeek || '—'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(2)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        {/* Compensation */}
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <p className="font-semibold text-sm">Compensation</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Base Salary</p>
              <p className="font-medium">
                {formData.salaryCurrency} {formData.salaryAmount ? parseFloat(formData.salaryAmount).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PTO Days</p>
              <p className="font-medium">{formData.paidTimeOff || '—'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(3)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Validation Errors (critical issues) */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            {errors.length} critical {errors.length === 1 ? 'issue' : 'issues'} detected
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-2 mt-2">
              {errors.map((error, i) => (
                <li key={i}>
                  <strong>{error.message}</strong>
                  {error.suggestion && (
                    <div className="text-xs mt-1 ml-5 opacity-90">{error.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-[hsl(var(--brand-muted))]">
              {warnings.map((warning, i) => (
                <li key={i}>
                  {warning.message}
                  {warning.suggestion && (
                    <div className="text-xs mt-1 ml-5 opacity-75">{warning.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <Info className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-[hsl(var(--brand-muted))]">
              {suggestions.map((suggestion, i) => (
                <li key={i}>
                  {suggestion.message}
                  {suggestion.suggestion && (
                    <div className="text-xs mt-1 ml-5 opacity-75">{suggestion.suggestion}</div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Customizations detected */}
      {customizations.length > 0 && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertTitle className="text-sm font-semibold text-[hsl(var(--fg))]">
            {customizations.length} customization{customizations.length > 1 ? 's' : ''} detected
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              {customizations.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* All standard */}
      {customizations.length === 0 && marketStandards && (
        <Alert className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          <AlertDescription className="text-sm">
            All terms align with market standards for this role and jurisdiction.
          </AlertDescription>
        </Alert>
      )}

      {/* Protection clauses summary */}
      <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[hsl(var(--fg))]">Protection Clauses Included</p>
        <div className="flex flex-wrap gap-2">
          {formData.includeConfidentiality && (
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              Confidentiality
            </Badge>
          )}
          {formData.includeIpAssignment && (
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              IP Assignment
            </Badge>
          )}
          {formData.includeNonCompete && (
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              Non-compete
            </Badge>
          )}
          {formData.includeNonSolicitation && (
            <Badge
              variant="outline"
              className="border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]"
            >
              Non-solicitation
            </Badge>
          )}
          {!formData.includeConfidentiality &&
            !formData.includeIpAssignment &&
            !formData.includeNonCompete &&
            !formData.includeNonSolicitation && (
              <span className="text-sm text-muted-foreground">None selected</span>
            )}
        </div>
      </div>

      {/* Generate button */}
      <div className="pt-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-6 text-lg font-semibold"
          size="lg"
        >
          {isGenerating ? 'Generating your agreement...' : 'Generate Employment Agreement'}
        </Button>
      </div>
    </div>
  );
}
