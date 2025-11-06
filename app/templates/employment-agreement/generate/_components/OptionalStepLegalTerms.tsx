'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementOptionalFormData } from '../schema-optional';

interface OptionalStepLegalTermsProps {
  form: UseFormReturn<EmploymentAgreementOptionalFormData>;
}

export function OptionalStepLegalTerms({ form }: OptionalStepLegalTermsProps) {
  const { register, watch, formState: { errors } } = form;
  
  const includeNonCompete = watch('includeNonCompete');
  const includeNonSolicitation = watch('includeNonSolicitation');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Legal Terms</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          All fields are optional. Add legal protections as needed.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="includeConfidentiality"
              type="checkbox"
              {...register('includeConfidentiality')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="includeConfidentiality" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Include Confidentiality Agreement
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="includeIpAssignment"
              type="checkbox"
              {...register('includeIpAssignment')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="includeIpAssignment" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Include IP Assignment Clause
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="includeNonCompete"
              type="checkbox"
              {...register('includeNonCompete')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="includeNonCompete" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Include Non-Compete Clause
            </label>
          </div>

          {includeNonCompete && (
            <div className="ml-7 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nonCompeteDuration" className="block text-xs font-medium text-[hsl(var(--fg))] mb-1">
                  Duration
                </label>
                <input
                  id="nonCompeteDuration"
                  type="text"
                  {...register('nonCompeteDuration')}
                  className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                  placeholder="e.g., 12 months"
                />
              </div>
              <div>
                <label htmlFor="nonCompeteRadius" className="block text-xs font-medium text-[hsl(var(--fg))] mb-1">
                  Radius
                </label>
                <input
                  id="nonCompeteRadius"
                  type="text"
                  {...register('nonCompeteRadius')}
                  className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                  placeholder="e.g., 50 miles"
                />
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              id="includeNonSolicitation"
              type="checkbox"
              {...register('includeNonSolicitation')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="includeNonSolicitation" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Include Non-Solicitation Clause
            </label>
          </div>

          {includeNonSolicitation && (
            <div className="ml-7">
              <label htmlFor="nonSolicitationDuration" className="block text-xs font-medium text-[hsl(var(--fg))] mb-1">
                Duration
              </label>
              <input
                id="nonSolicitationDuration"
                type="text"
                {...register('nonSolicitationDuration')}
                className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="e.g., 12 months"
              />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[hsl(var(--border))]">
          <label htmlFor="disputeResolution" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Dispute Resolution
          </label>
          <select
            id="disputeResolution"
            {...register('disputeResolution')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
          >
            <option value="">Select...</option>
            <option value="arbitration">Arbitration</option>
            <option value="mediation">Mediation</option>
            <option value="negotiation">Negotiation</option>
            <option value="court">Court</option>
          </select>
        </div>

        <div>
          <label htmlFor="governingLaw" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Governing Law
          </label>
          <input
            id="governingLaw"
            type="text"
            {...register('governingLaw')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        <div>
          <label htmlFor="additionalClauses" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Additional Clauses
          </label>
          <textarea
            id="additionalClauses"
            {...register('additionalClauses')}
            rows={3}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>
      </div>
    </div>
  );
}
