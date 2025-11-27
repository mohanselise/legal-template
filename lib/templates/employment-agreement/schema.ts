/**
 * Employment Agreement Form Schema
 * 
 * Zod validation schema for the employment agreement generation form.
 * This defines all the fields collected during the multi-step wizard.
 */

import { z } from 'zod';
import type { StructuredAddress } from '@/lib/utils/address-formatting';

/**
 * Employment Agreement Form Schema
 * 
 * Organized by form step/section:
 * - Step 1: Company & Role
 * - Step 2: Employee Identity
 * - Step 3: Signing Information
 * - Step 4: Work Arrangement
 * - Step 5: Compensation & Benefits
 * - Step 6: Legal Terms
 */
export const employmentAgreementSchema = z.object({
  // ==========================================
  // STEP 1: COMPANY & ROLE
  // ==========================================
  
  // Company Information
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z.string().min(1, 'Company address is required'),
  companyAddressStructured: z.custom<StructuredAddress>().optional(),
  companyState: z.string().min(1, 'State/Province is required'),
  companyCountry: z.string().min(1, 'Country is required'),
  companyWebsite: z.string().optional(),

  // Role Information
  jobTitle: z.string().min(1, 'Job title is required'),
  jobResponsibilities: z.string().optional(),
  department: z.string().optional(),
  reportsTo: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract']),

  // ==========================================
  // STEP 2: EMPLOYEE IDENTITY
  // ==========================================
  
  employeeName: z.string().min(1, 'Employee name is required'),
  employeeAddress: z.string().min(1, 'Employee address is required'),
  employeeAddressStructured: z.custom<StructuredAddress>().optional(),
  employeeEmail: z.string().email('Valid email is required'),
  employeePhone: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),

  // ==========================================
  // STEP 3: SIGNING INFORMATION
  // ==========================================
  
  companyRepName: z.string().optional(),
  companyRepTitle: z.string().optional(),
  companyRepEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  companyRepPhone: z.string().optional(),

  // ==========================================
  // STEP 4: WORK ARRANGEMENT
  // ==========================================
  
  workLocation: z.string().min(1, 'Work location is required'),
  workArrangement: z.enum(['on-site', 'remote', 'hybrid']),
  workHoursPerWeek: z.string().min(1, 'Work hours per week is required'),
  workSchedule: z.string().optional(),
  overtimeEligible: z.boolean().default(false),

  // ==========================================
  // STEP 5: COMPENSATION & BENEFITS
  // ==========================================
  
  // Salary
  salaryAmount: z.string().min(1, 'Salary amount is required'),
  salaryCurrency: z.string().default('USD'),
  salaryPeriod: z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly', 'annual']),
  
  // Additional Compensation
  bonusStructure: z.string().optional(),
  equityOffered: z.string().optional(),
  signOnBonus: z.string().optional(),

  // Benefits
  healthInsurance: z.boolean().default(false),
  dentalInsurance: z.boolean().default(false),
  visionInsurance: z.boolean().default(false),
  retirementPlan: z.boolean().default(false),
  paidTimeOff: z.string().optional(),
  sickLeave: z.string().optional(),
  otherBenefits: z.string().optional(),

  // ==========================================
  // STEP 6: LEGAL TERMS
  // ==========================================
  
  // Probation & Notice
  probationPeriod: z.string().optional(),
  noticePeriod: z.string().optional(),

  // Non-Compete
  includeNonCompete: z.boolean().default(false),
  nonCompeteDuration: z.string().optional(),
  nonCompeteRadius: z.string().optional(),

  // Non-Solicitation
  includeNonSolicitation: z.boolean().default(false),
  nonSolicitationDuration: z.string().optional(),

  // Standard Legal Clauses
  includeConfidentiality: z.boolean().default(true),
  includeIpAssignment: z.boolean().default(true),

  // Dispute Resolution
  disputeResolution: z.enum(['arbitration', 'mediation', 'court']).default('arbitration'),
  governingLaw: z.string().min(1, 'Governing law jurisdiction is required'),

  // ==========================================
  // ADDITIONAL TERMS
  // ==========================================
  
  additionalClauses: z.string().optional(),
  specialProvisions: z.string().optional(),
});

/**
 * Inferred TypeScript type from the schema
 */
export type EmploymentAgreementFormData = z.infer<typeof employmentAgreementSchema>;

/**
 * Default values for the employment agreement form
 */
export const employmentAgreementDefaultValues: Partial<EmploymentAgreementFormData> = {
  // Compensation defaults
  salaryCurrency: 'USD',
  salaryPeriod: 'annual',
  
  // Employment type
  employmentType: 'full-time',
  
  // Work arrangement
  workArrangement: 'on-site',
  
  // Benefits (all off by default)
  healthInsurance: false,
  dentalInsurance: false,
  visionInsurance: false,
  retirementPlan: false,
  overtimeEligible: false,
  
  // Legal clauses
  includeNonCompete: false,
  includeNonSolicitation: false,
  includeConfidentiality: true,
  includeIpAssignment: true,
  
  // Dispute resolution
  disputeResolution: 'arbitration',
};

/**
 * Fields required for each step validation
 */
export const employmentAgreementStepValidation = {
  // Step 0: Company & Role
  companyRole: (data: Partial<EmploymentAgreementFormData>) => 
    !!(data.companyName && data.companyAddress && data.jobTitle),
  
  // Step 1: Employee
  employee: (data: Partial<EmploymentAgreementFormData>) =>
    !!(data.employeeName && data.employeeAddress && data.startDate),
  
  // Step 2: Signing Info
  signing: (data: Partial<EmploymentAgreementFormData>) =>
    !!(
      data.employeeEmail &&
      data.companyRepName &&
      data.companyRepTitle &&
      data.companyRepEmail &&
      data.employeeEmail.trim().toLowerCase() !== data.companyRepEmail?.trim().toLowerCase()
    ),
  
  // Step 3: Work Arrangement
  work: (data: Partial<EmploymentAgreementFormData>) => {
    const workLocationValid = data.workArrangement === 'remote' || data.workLocation;
    return !!(workLocationValid && data.workHoursPerWeek);
  },
  
  // Step 4: Compensation
  compensation: (data: Partial<EmploymentAgreementFormData>) =>
    !!data.salaryCurrency,
  
  // Step 5: Legal Terms
  legal: (data: Partial<EmploymentAgreementFormData>) =>
    !!data.governingLaw,
  
  // Step 6: Review
  review: () => true,
};

