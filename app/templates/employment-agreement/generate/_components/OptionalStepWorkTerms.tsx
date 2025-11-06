'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementOptionalFormData } from '../schema-optional';

interface OptionalStepWorkTermsProps {
  form: UseFormReturn<EmploymentAgreementOptionalFormData>;
}

export function OptionalStepWorkTerms({ form }: OptionalStepWorkTermsProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Work Terms</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          All fields are optional. Define work arrangements as needed.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="employmentType" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Employment Type
          </label>
          <select
            id="employmentType"
            {...register('employmentType')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
          >
            <option value="">Select...</option>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>

        <div>
          <label htmlFor="workArrangement" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Work Arrangement
          </label>
          <select
            id="workArrangement"
            {...register('workArrangement')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
          >
            <option value="">Select...</option>
            <option value="on-site">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label htmlFor="workHoursPerWeek" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Work Hours Per Week
          </label>
          <input
            id="workHoursPerWeek"
            type="text"
            {...register('workHoursPerWeek')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        <div>
          <label htmlFor="workSchedule" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Work Schedule
          </label>
          <input
            id="workSchedule"
            type="text"
            {...register('workSchedule')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        <div className="flex items-center pt-2">
          <input
            id="overtimeEligible"
            type="checkbox"
            {...register('overtimeEligible')}
            className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="overtimeEligible" className="ml-3 text-sm text-[hsl(var(--fg))]">
            Eligible for Overtime
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <label htmlFor="probationPeriod" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Probation Period
            </label>
            <input
              id="probationPeriod"
              type="text"
              {...register('probationPeriod')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              placeholder="Empty"
            />
          </div>

          <div>
            <label htmlFor="noticePeriod" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Notice Period
            </label>
            <input
              id="noticePeriod"
              type="text"
              {...register('noticePeriod')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              placeholder="Empty"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
