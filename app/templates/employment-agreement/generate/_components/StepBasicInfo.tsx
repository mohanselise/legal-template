'use client';

import { UseFormReturn } from 'react-hook-form';
import { EmploymentAgreementFormData } from '../schema';

interface StepBasicInfoProps {
  form: UseFormReturn<EmploymentAgreementFormData>;
}

export function StepBasicInfo({ form }: StepBasicInfoProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">Basic Information</h2>
        <p className="text-[hsl(var(--brand-muted))]">
          Let's start with the essential details about the company and employee.
        </p>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Company Details</h3>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            {...register('companyName')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Acme Corporation"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="companyAddress" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Company Address <span className="text-red-500">*</span>
          </label>
          <input
            id="companyAddress"
            type="text"
            {...register('companyAddress')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="123 Main Street, Suite 100"
          />
          {errors.companyAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.companyAddress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyState" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              State/Province <span className="text-red-500">*</span>
            </label>
            <input
              id="companyState"
              type="text"
              {...register('companyState')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="California"
            />
            {errors.companyState && (
              <p className="mt-1 text-sm text-red-600">{errors.companyState.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="companyCountry" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              id="companyCountry"
              type="text"
              {...register('companyCountry')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="United States"
            />
            {errors.companyCountry && (
              <p className="mt-1 text-sm text-red-600">{errors.companyCountry.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Employee Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Employee Details</h3>

        <div>
          <label htmlFor="employeeName" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Employee Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="employeeName"
            type="text"
            {...register('employeeName')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="John Smith"
          />
          {errors.employeeName && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="employeeAddress" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Employee Address <span className="text-red-500">*</span>
          </label>
          <input
            id="employeeAddress"
            type="text"
            {...register('employeeAddress')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="456 Elm Street, Apt 2B"
          />
          {errors.employeeAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeAddress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employeeEmail" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="employeeEmail"
              type="email"
              {...register('employeeEmail')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="john@example.com"
            />
            {errors.employeeEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.employeeEmail.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="employeePhone" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Phone Number
            </label>
            <input
              id="employeePhone"
              type="tel"
              {...register('employeePhone')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Position Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Position Details</h3>

        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="jobTitle"
            type="text"
            {...register('jobTitle')}
            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Senior Software Engineer"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Department
            </label>
            <input
              id="department"
              type="text"
              {...register('department')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="Engineering"
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
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              placeholder="VP of Engineering"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              {...register('startDate')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="employmentType" className="block text-sm font-medium text-[hsl(var(--fg))] mb-1">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              id="employmentType"
              {...register('employmentType')}
              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
            </select>
            {errors.employmentType && (
              <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
