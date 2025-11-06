'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementOptionalFormData } from '../schema-optional';

interface OptionalStepBasicsProps {
  form: UseFormReturn<EmploymentAgreementOptionalFormData>;
}

export function OptionalStepBasics({ form }: OptionalStepBasicsProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Basics</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          All fields are optional. Fill in what you know now.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Employer Details</h3>
            <p className="text-xs text-[hsl(var(--brand-muted))]">
              Provide the organization information that should appear in the agreement header.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Legal Name
              </label>
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyIndustry" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Industry
              </label>
              <input
                id="companyIndustry"
                type="text"
                {...register('companyIndustry')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Website
              </label>
              <input
                id="companyWebsite"
                type="text"
                {...register('companyWebsite')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Street Address
              </label>
              <input
                id="companyAddress"
                type="text"
                {...register('companyAddress')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyCity" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                City
              </label>
              <input
                id="companyCity"
                type="text"
                {...register('companyCity')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyState" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                State / Province
              </label>
              <input
                id="companyState"
                type="text"
                {...register('companyState')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyPostalCode" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Postal Code
              </label>
              <input
                id="companyPostalCode"
                type="text"
                {...register('companyPostalCode')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyCountry" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Country
              </label>
              <input
                id="companyCountry"
                type="text"
                {...register('companyCountry')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyContactName" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Primary Contact
              </label>
              <input
                id="companyContactName"
                type="text"
                {...register('companyContactName')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyContactTitle" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Contact Title
              </label>
              <input
                id="companyContactTitle"
                type="text"
                {...register('companyContactTitle')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyContactEmail" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Contact Email
              </label>
              <input
                id="companyContactEmail"
                type="email"
                {...register('companyContactEmail')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="companyContactPhone" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Contact Phone
              </label>
              <input
                id="companyContactPhone"
                type="text"
                {...register('companyContactPhone')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Employee Details</h3>
            <p className="text-xs text-[hsl(var(--brand-muted))]">
              Capture how the employee should appear in the agreement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Full Legal Name
              </label>
              <input
                id="employeeName"
                type="text"
                {...register('employeeName')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeeEmail" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Email
              </label>
              <input
                id="employeeEmail"
                type="email"
                {...register('employeeEmail')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeePhone" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Phone
              </label>
              <input
                id="employeePhone"
                type="text"
                {...register('employeePhone')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="employeeAddress" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Street Address
              </label>
              <input
                id="employeeAddress"
                type="text"
                {...register('employeeAddress')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeeCity" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                City
              </label>
              <input
                id="employeeCity"
                type="text"
                {...register('employeeCity')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeeState" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                State / Province
              </label>
              <input
                id="employeeState"
                type="text"
                {...register('employeeState')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeePostalCode" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Postal Code
              </label>
              <input
                id="employeePostalCode"
                type="text"
                {...register('employeePostalCode')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="employeeCountry" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Country
              </label>
              <input
                id="employeeCountry"
                type="text"
                {...register('employeeCountry')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Role & Key Dates</h3>
            <p className="text-xs text-[hsl(var(--brand-muted))]">
              These details drive the position and summary sections.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                {...register('jobTitle')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Level / Band
              </label>
              <input
                id="level"
                type="text"
                {...register('level')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Department / Team
              </label>
              <input
                id="department"
                type="text"
                {...register('department')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="reportsTo" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Reports To
              </label>
              <input
                id="reportsTo"
                type="text"
                {...register('reportsTo')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              />
            </div>
            <div>
              <label htmlFor="workLocation" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
                Primary Work Location
              </label>
              <input
                id="workLocation"
                type="text"
                {...register('workLocation')}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
                placeholder="Empty"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
