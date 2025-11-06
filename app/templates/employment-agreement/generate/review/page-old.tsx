'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActionButtons } from '../_components/ActionButtons';
import { Loader2, CheckCircle2, Edit, Sparkles } from 'lucide-react';

function ReviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(dataParam);
        setFormData(parsed);
      } catch (e) {
        setError('Invalid form data');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (formData && !generatedDocument && !isGenerating) {
      generateDocument();
    }
  }, [formData]);

  const generateDocument = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const data = await response.json();
      setGeneratedDocument(data.document);
    } catch (error) {
      console.error('Error generating document:', error);
      setError('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToSignature = async () => {
    try {
      const response = await fetch('/api/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument,
          formData,
          signatories: [
            { name: formData.employeeName || 'Employee', email: formData.employeeEmail || 'pending@example.com' },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to send to signature');

      const data = await response.json();

      // Show success message
      alert(`✨ Success!\n\nYour employment agreement has been sent via SELISE Signature.\n\nTracking ID: ${data.trackingId}\n\nThe signatory will receive an email with a link to review and sign the document.`);

      // Clear localStorage
      localStorage.removeItem('employment-agreement-conversation');

      // Redirect to home or dashboard
      window.location.href = '/templates/employment-agreement';
    } catch (error) {
      console.error('Error sending to signature:', error);
      alert('Failed to send document. Please try again.');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument,
          formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Employment_Agreement_${formData.employeeName?.replace(/\s+/g, '_') || 'Template'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/templates/employment-agreement/generate" className="text-[hsl(var(--brand-primary))] hover:underline">
            Go back and try again
          </a>
        </div>
      </div>
    );
  }

  if (!formData || isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[hsl(var(--brand-primary))]/30 border-t-[hsl(var(--brand-primary))] rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-8 h-8 text-[hsl(var(--brand-primary))] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(var(--fg))]">Generating Your Agreement</h2>
          <p className="text-[hsl(var(--brand-muted))]">Our AI is crafting a professional employment agreement based on your input...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Your Agreement is Ready!</h1>
          </div>
          <p className="text-blue-100">Review your employment agreement and choose how to proceed</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[hsl(var(--fg))]">Employment Agreement</h2>
                <button
                  onClick={() => window.location.href = '/templates/employment-agreement/generate'}
                  className="flex items-center gap-2 text-[hsl(var(--brand-primary))] hover:underline"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-[hsl(var(--fg))] leading-relaxed border border-[hsl(var(--border))] rounded-lg p-6 bg-gray-50 dark:bg-gray-900 max-h-[600px] overflow-y-auto">
                  {generatedDocument}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Summary Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-[hsl(var(--fg))] mb-4">Agreement Summary</h3>
                <dl className="space-y-3 text-sm">
                  {formData.companyName && (
                    <div>
                      <dt className="text-[hsl(var(--brand-muted))]">Company</dt>
                      <dd className="font-medium text-[hsl(var(--fg))]">{formData.companyName}</dd>
                    </div>
                  )}
                  {formData.employeeName && (
                    <div>
                      <dt className="text-[hsl(var(--brand-muted))]">Employee</dt>
                      <dd className="font-medium text-[hsl(var(--fg))]">{formData.employeeName}</dd>
                    </div>
                  )}
                  {formData.jobTitle && (
                    <div>
                      <dt className="text-[hsl(var(--brand-muted))]">Position</dt>
                      <dd className="font-medium text-[hsl(var(--fg))]">{formData.jobTitle}</dd>
                    </div>
                  )}
                  {formData.salaryAmount && (
                    <div>
                      <dt className="text-[hsl(var(--brand-muted))]">Compensation</dt>
                      <dd className="font-medium text-[hsl(var(--fg))]">
                        {formData.salaryCurrency} {formData.salaryAmount} / {formData.salaryPeriod}
                      </dd>
                    </div>
                  )}
                  {formData.startDate && (
                    <div>
                      <dt className="text-[hsl(var(--brand-muted))]">Start Date</dt>
                      <dd className="font-medium text-[hsl(var(--fg))]">{formData.startDate}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Action Buttons */}
              <ActionButtons
                onSendToSignature={handleSendToSignature}
                onDownloadDocx={handleDownloadDocx}
                disabled={!generatedDocument}
              />

              {/* Legal Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Legal Notice:</strong> This document is generated by AI and should be reviewed by a qualified attorney before use. Employment laws vary by jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--brand-primary))]" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
