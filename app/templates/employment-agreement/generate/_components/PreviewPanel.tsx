'use client';

import { EmploymentAgreementFormData } from '../schema';

interface PreviewPanelProps {
  formData: Partial<EmploymentAgreementFormData>;
  generatedDocument?: string;
  isGenerating?: boolean;
}

export function PreviewPanel({ formData, generatedDocument, isGenerating }: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="sticky top-4 bg-white border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))] mb-4">
          Document Preview
        </h3>
        <div className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <p className="text-sm text-[hsl(var(--brand-muted))] text-center mt-6">
            Generating your agreement...
          </p>
        </div>
      </div>
    );
  }

  if (generatedDocument) {
    return (
      <div className="sticky top-4 bg-white border border-[hsl(var(--border))] rounded-lg p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))] mb-4">
          Document Preview
        </h3>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-[hsl(var(--fg))]">
            {generatedDocument}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-4 bg-white border border-[hsl(var(--border))] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[hsl(var(--fg))] mb-4">
        Document Preview
      </h3>

      <div className="space-y-4 text-sm">
        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md">
          <p className="text-[hsl(var(--brand-muted))]">
            As you fill out the form, your employment agreement will be generated here.
          </p>
        </div>

        {formData.companyName && (
          <div>
            <h4 className="font-semibold text-[hsl(var(--fg))] mb-2">Agreement Details</h4>
            <dl className="space-y-2">
              {formData.companyName && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Company:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">{formData.companyName}</dd>
                </div>
              )}
              {formData.employeeName && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Employee:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">{formData.employeeName}</dd>
                </div>
              )}
              {formData.jobTitle && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Position:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">{formData.jobTitle}</dd>
                </div>
              )}
              {formData.salaryAmount && formData.salaryPeriod && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Compensation:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">
                    {formData.salaryCurrency} {formData.salaryAmount} / {formData.salaryPeriod}
                  </dd>
                </div>
              )}
              {formData.startDate && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Start Date:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">{formData.startDate}</dd>
                </div>
              )}
              {formData.workLocation && (
                <div>
                  <dt className="text-[hsl(var(--brand-muted))]">Location:</dt>
                  <dd className="font-medium text-[hsl(var(--fg))]">
                    {formData.workLocation} ({formData.workArrangement})
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {!formData.companyName && (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-[hsl(var(--brand-muted))]">
              Start filling out the form to see your agreement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
