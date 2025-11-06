'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementFormData } from '../schema';

interface StepWorkTermsProps {
  form: UseFormReturn<EmploymentAgreementFormData>;
}

export function StepWorkTerms({ form }: StepWorkTermsProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Work Terms & Schedule</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          Define where and when the employee will work.
        </p>
      </div>

      {/* Work Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Work Location</h3>

        <div>
          <label htmlFor="workLocation" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Primary Work Location <span className="text-red-500">*</span>
          </label>
          <input
            id="workLocation"
            type="text"
            {...register('workLocation')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="123 Main Street, San Francisco, CA"
          />
          {errors.workLocation && (
            <p className="mt-1 text-sm text-red-600">{errors.workLocation.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="workArrangement" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Work Arrangement <span className="text-red-500">*</span>
          </label>
          <select
            id="workArrangement"
            {...register('workArrangement')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="on-site">On-Site</option>
            <option value="remote">Fully Remote</option>
            <option value="hybrid">Hybrid (Combination)</option>
          </select>
          {errors.workArrangement && (
            <p className="mt-1 text-sm text-red-600">{errors.workArrangement.message}</p>
          )}
        </div>
      </div>

      {/* Work Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Work Schedule</h3>

        <div>
          <label htmlFor="workHoursPerWeek" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Hours Per Week <span className="text-red-500">*</span>
          </label>
          <input
            id="workHoursPerWeek"
            type="text"
            {...register('workHoursPerWeek')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="40"
          />
          {errors.workHoursPerWeek && (
            <p className="mt-1 text-sm text-red-600">{errors.workHoursPerWeek.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="workSchedule" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Work Schedule Details
          </label>
          <textarea
            id="workSchedule"
            {...register('workSchedule')}
            rows={2}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., Monday to Friday, 9:00 AM to 5:00 PM"
          />
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            Specify days of the week and typical working hours
          </p>
        </div>

        <div className="flex items-center">
          <input
            id="overtimeEligible"
            type="checkbox"
            {...register('overtimeEligible')}
            className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          />
          <label htmlFor="overtimeEligible" className="ml-3 text-sm text-[hsl(var(--fg))]">
            Eligible for overtime pay
          </label>
        </div>
      </div>

      {/* Probation & Notice Periods */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Employment Periods</h3>

        <div>
          <label htmlFor="probationPeriod" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Probation Period
          </label>
          <input
            id="probationPeriod"
            type="text"
            {...register('probationPeriod')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., 90 days"
          />
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            Initial trial period before permanent employment (optional)
          </p>
        </div>

        <div>
          <label htmlFor="noticePeriod" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Notice Period for Termination
          </label>
          <input
            id="noticePeriod"
            type="text"
            {...register('noticePeriod')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., 2 weeks"
          />
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            How much notice must be given before voluntary resignation or termination
          </p>
        </div>
      </div>
    </div>
  );
}
