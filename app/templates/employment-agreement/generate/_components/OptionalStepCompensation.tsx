'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementOptionalFormData } from '../schema-optional';

interface OptionalStepCompensationProps {
  form: UseFormReturn<EmploymentAgreementOptionalFormData>;
}

export function OptionalStepCompensation({ form }: OptionalStepCompensationProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Compensation</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          All fields are optional. Add compensation details as needed.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor="salaryAmount" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Salary Amount
            </label>
            <input
              id="salaryAmount"
              type="text"
              {...register('salaryAmount')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              placeholder="Empty"
            />
          </div>

          <div>
            <label htmlFor="salaryCurrency" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Currency
            </label>
            <select
              id="salaryCurrency"
              {...register('salaryCurrency')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
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
            Payment Period
          </label>
          <select
            id="salaryPeriod"
            {...register('salaryPeriod')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
          >
            <option value="">Select...</option>
            <option value="hourly">Hourly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <div>
          <label htmlFor="bonusStructure" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Bonus Structure
          </label>
          <textarea
            id="bonusStructure"
            {...register('bonusStructure')}
            rows={3}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        <div>
          <label htmlFor="signOnBonus" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Sign-On Bonus
          </label>
          <input
            id="signOnBonus"
            type="text"
            {...register('signOnBonus')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        <div>
          <label htmlFor="equityOffered" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Equity/Stock Options
          </label>
          <textarea
            id="equityOffered"
            {...register('equityOffered')}
            rows={2}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            placeholder="Empty"
          />
        </div>

        {/* Benefits */}
        <div className="pt-4 border-t border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--fg))] mb-3">Benefits</h3>
          
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
                Retirement Plan
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
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
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
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="otherBenefits" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Other Benefits
            </label>
            <textarea
              id="otherBenefits"
              {...register('otherBenefits')}
              rows={2}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              placeholder="Empty"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
