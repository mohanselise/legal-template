'use client';

import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { saveEmploymentAgreementReview } from '../../reviewStorage';

export function Step7Review() {
  const { formData, enrichment, goToStep } = useSmartForm();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  // Detect customizations
  const customizations: string[] = [];
  const marketStandards = enrichment.marketStandards;

  if (marketStandards) {
    const salary = parseFloat(formData.salaryAmount || '0');
    if (enrichment.jobTitleData?.typicalSalaryRange) {
      const median = enrichment.jobTitleData.typicalSalaryRange.median;
      const diff = ((salary - median) / median) * 100;
      if (Math.abs(diff) > 10) {
        customizations.push(
          `Salary: ${diff > 0 ? '+' : ''}${diff.toFixed(0)}% ${diff > 0 ? 'above' : 'below'} market median`
        );
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

      {/* Customizations detected */}
      {customizations.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            {customizations.length} customization{customizations.length > 1 ? 's' : ''} detected
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              {customizations.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* All standard */}
      {customizations.length === 0 && marketStandards && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-900">
            All terms align with market standards for this role and jurisdiction.
          </AlertDescription>
        </Alert>
      )}

      {/* Protection clauses summary */}
      <div className="p-4 rounded-lg border bg-card">
        <p className="font-semibold text-sm mb-3">Protection Clauses Included</p>
        <div className="flex flex-wrap gap-2">
          {formData.includeConfidentiality && <Badge variant="secondary">Confidentiality</Badge>}
          {formData.includeIpAssignment && <Badge variant="secondary">IP Assignment</Badge>}
          {formData.includeNonCompete && <Badge variant="secondary">Non-compete</Badge>}
          {formData.includeNonSolicitation && <Badge variant="secondary">Non-solicitation</Badge>}
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
