'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementFormData } from '../schema';

interface StepLegalTermsProps {
  form: UseFormReturn<EmploymentAgreementFormData>;
}

export function StepLegalTerms({ form }: StepLegalTermsProps) {
  const { register, formState: { errors }, watch } = form;

  const includeNonCompete = watch('includeNonCompete');
  const includeNonSolicitation = watch('includeNonSolicitation');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Legal Terms & Protections</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          Define protective clauses and legal terms for the employment relationship.
        </p>
      </div>

      {/* Confidentiality & IP */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Confidentiality & Intellectual Property</h3>

        <div className="flex items-start">
          <input
            id="includeConfidentiality"
            type="checkbox"
            {...register('includeConfidentiality')}
            className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="includeConfidentiality" className="ml-3 text-sm">
            <span className="font-medium text-[hsl(var(--fg))]">Include Confidentiality Agreement</span>
            <p className="text-[hsl(var(--brand-muted))] mt-1">
              Protects sensitive business information, trade secrets, and proprietary data during and after employment.
            </p>
          </label>
        </div>

        <div className="flex items-start">
          <input
            id="includeIpAssignment"
            type="checkbox"
            {...register('includeIpAssignment')}
            className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="includeIpAssignment" className="ml-3 text-sm">
            <span className="font-medium text-[hsl(var(--fg))]">Include Intellectual Property Assignment</span>
            <p className="text-[hsl(var(--brand-muted))] mt-1">
              Ensures that work products, inventions, and creative output belong to the company.
            </p>
          </label>
        </div>
      </div>

      {/* Non-Compete */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Non-Compete Agreement</h3>

        <div className="flex items-start">
          <input
            id="includeNonCompete"
            type="checkbox"
            {...register('includeNonCompete')}
            className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="includeNonCompete" className="ml-3 text-sm">
            <span className="font-medium text-[hsl(var(--fg))]">Include Non-Compete Clause</span>
            <p className="text-[hsl(var(--brand-muted))] mt-1">
              Prevents employee from working for competitors after leaving. Note: Not enforceable in some jurisdictions (e.g., California).
            </p>
          </label>
        </div>

        {includeNonCompete && (
          <div className="ml-7 space-y-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-md">
            <div>
              <label htmlFor="nonCompeteDuration" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Duration
              </label>
              <input
                id="nonCompeteDuration"
                type="text"
                {...register('nonCompeteDuration')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
                placeholder="e.g., 12 months"
              />
              <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
                How long the restriction applies after employment ends
              </p>
            </div>

            <div>
              <label htmlFor="nonCompeteRadius" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Geographic Scope
              </label>
              <input
                id="nonCompeteRadius"
                type="text"
                {...register('nonCompeteRadius')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
                placeholder="e.g., 50 mile radius of office, State of California, United States"
              />
              <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
                Geographic area where the restriction applies
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Non-Solicitation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Non-Solicitation Agreement</h3>

        <div className="flex items-start">
          <input
            id="includeNonSolicitation"
            type="checkbox"
            {...register('includeNonSolicitation')}
            className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="includeNonSolicitation" className="ml-3 text-sm">
            <span className="font-medium text-[hsl(var(--fg))]">Include Non-Solicitation Clause</span>
            <p className="text-[hsl(var(--brand-muted))] mt-1">
              Prevents employee from poaching clients, customers, or other employees after leaving.
            </p>
          </label>
        </div>

        {includeNonSolicitation && (
          <div className="ml-7 p-4 bg-blue-50 dark:bg-gray-800 rounded-md">
            <label htmlFor="nonSolicitationDuration" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Duration
            </label>
            <input
              id="nonSolicitationDuration"
              type="text"
              {...register('nonSolicitationDuration')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="e.g., 12 months"
            />
            <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
              How long the restriction applies after employment ends
            </p>
          </div>
        )}
      </div>

      {/* Dispute Resolution */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Dispute Resolution & Governing Law</h3>

        <div>
          <label htmlFor="disputeResolution" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Dispute Resolution Method <span className="text-red-500">*</span>
          </label>
          <select
            id="disputeResolution"
            {...register('disputeResolution')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="arbitration">Binding Arbitration</option>
            <option value="mediation">Mediation</option>
            <option value="court">Court Litigation</option>
          </select>
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            How disputes will be resolved between employer and employee
          </p>
        </div>

        <div>
          <label htmlFor="governingLaw" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Governing Law <span className="text-red-500">*</span>
          </label>
          <input
            id="governingLaw"
            type="text"
            {...register('governingLaw')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., State of California"
          />
          {errors.governingLaw && (
            <p className="mt-1 text-sm text-red-600">{errors.governingLaw.message}</p>
          )}
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            Which jurisdiction's laws will govern this agreement
          </p>
        </div>
      </div>

      {/* Additional Terms */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Additional Clauses</h3>

        <div>
          <label htmlFor="additionalClauses" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Custom Clauses
          </label>
          <textarea
            id="additionalClauses"
            {...register('additionalClauses')}
            rows={4}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Add any specific clauses or terms you'd like to include in the agreement"
          />
        </div>

        <div>
          <label htmlFor="specialProvisions" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Special Provisions
          </label>
          <textarea
            id="specialProvisions"
            {...register('specialProvisions')}
            rows={3}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., relocation assistance, sign-on bonus conditions, specific reporting requirements"
          />
        </div>
      </div>
    </div>
  );
}
