'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementFormData } from '../schema';

interface StepCompensationProps {
  form: UseFormReturn<EmploymentAgreementFormData>;
}

export function StepCompensation({ form }: StepCompensationProps) {
  const { register, formState: { errors }, watch } = form;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Compensation & Benefits</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          Define the salary, bonuses, and benefits package for this position.
        </p>
      </div>

      {/* Salary Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Base Salary</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor="salaryAmount" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Salary Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="salaryAmount"
              type="text"
              {...register('salaryAmount')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="120000"
            />
            {errors.salaryAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.salaryAmount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="salaryCurrency" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Currency
            </label>
            <select
              id="salaryCurrency"
              {...register('salaryCurrency')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="salaryPeriod" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Payment Period <span className="text-red-500">*</span>
          </label>
          <select
            id="salaryPeriod"
            {...register('salaryPeriod')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="hourly">Hourly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          {errors.salaryPeriod && (
            <p className="mt-1 text-sm text-red-600">{errors.salaryPeriod.message}</p>
          )}
        </div>
      </div>

      {/* Additional Compensation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Additional Compensation</h3>

        <div>
          <label htmlFor="bonusStructure" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Bonus Structure
          </label>
          <textarea
            id="bonusStructure"
            {...register('bonusStructure')}
            rows={3}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., Annual performance bonus up to 15% of base salary, quarterly commission on sales targets"
          />
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            Describe any bonuses, commissions, or performance incentives
          </p>
        </div>

        <div>
          <label htmlFor="equityOffered" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Equity/Stock Options
          </label>
          <textarea
            id="equityOffered"
            {...register('equityOffered')}
            rows={2}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., 10,000 stock options with 4-year vesting schedule"
          />
          <p className="mt-1 text-xs text-[hsl(var(--brand-muted))]">
            Include details about stock options, RSUs, or other equity compensation
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Benefits Package</h3>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="healthInsurance"
              type="checkbox"
              {...register('healthInsurance')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="healthInsurance" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Health Insurance
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="dentalInsurance"
              type="checkbox"
              {...register('dentalInsurance')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="dentalInsurance" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Dental Insurance
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="visionInsurance"
              type="checkbox"
              {...register('visionInsurance')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="visionInsurance" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Vision Insurance
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="retirementPlan"
              type="checkbox"
              {...register('retirementPlan')}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            />
            <label htmlFor="retirementPlan" className="ml-3 text-sm text-[hsl(var(--fg))]">
              Retirement Plan (401k, IRA, etc.)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="paidTimeOff" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Paid Time Off
            </label>
            <input
              id="paidTimeOff"
              type="text"
              {...register('paidTimeOff')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="e.g., 20 days per year"
            />
          </div>

          <div>
            <label htmlFor="sickLeave" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Sick Leave
            </label>
            <input
              id="sickLeave"
              type="text"
              {...register('sickLeave')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="e.g., 10 days per year"
            />
          </div>
        </div>

        <div>
          <label htmlFor="otherBenefits" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Other Benefits
          </label>
          <textarea
            id="otherBenefits"
            {...register('otherBenefits')}
            rows={3}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="e.g., gym membership, education stipend, cell phone reimbursement, etc."
          />
        </div>
      </div>
    </div>
  );
}
