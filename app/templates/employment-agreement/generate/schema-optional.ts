import { z } from 'zod';

/**
 * Optional schema for employment agreement - all fields are optional
 * Users can fill in as much or as little as they want
 */
export const employmentAgreementOptionalSchema = z.object({
  // Employer Section
  companyName: z.string().optional(),
  companyIndustry: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().optional(),
  companyState: z.string().optional(),
  companyPostalCode: z.string().optional(),
  companyCountry: z.string().optional(),
  companyContactName: z.string().optional(),
  companyContactTitle: z.string().optional(),
  companyContactEmail: z.string().optional(),
  companyContactPhone: z.string().optional(),

  // Employee Section
  employeeName: z.string().optional(),
  employeeEmail: z.string().optional(),
  employeePhone: z.string().optional(),
  employeeAddress: z.string().optional(),
  employeeCity: z.string().optional(),
  employeeState: z.string().optional(),
  employeePostalCode: z.string().optional(),
  employeeCountry: z.string().optional(),

  // Basics Section
  jobTitle: z.string().optional(),
  level: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  workLocation: z.string().optional(),

  // Compensation Section
  salaryAmount: z.string().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly', 'annual']).optional(),
  bonusStructure: z.string().optional(),
  equityOffered: z.string().optional(),
  signOnBonus: z.string().optional(),

  // Benefits Section
  healthInsurance: z.boolean().optional(),
  dentalInsurance: z.boolean().optional(),
  visionInsurance: z.boolean().optional(),
  retirementPlan: z.boolean().optional(),
  paidTimeOff: z.string().optional(),
  sickLeave: z.string().optional(),
  parentalLeave: z.string().optional(),
  otherBenefits: z.string().optional(),

  // Work Terms Section
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary']).optional(),
  workArrangement: z.enum(['on-site', 'remote', 'hybrid']).optional(),
  workHoursPerWeek: z.string().optional(),
  workSchedule: z.string().optional(),
  overtimeEligible: z.boolean().optional(),
  probationPeriod: z.string().optional(),
  noticePeriod: z.string().optional(),
  reportsTo: z.string().optional(),

  // Legal Terms Section
  includeConfidentiality: z.boolean().optional(),
  includeIpAssignment: z.boolean().optional(),
  includeNonCompete: z.boolean().optional(),
  nonCompeteDuration: z.string().optional(),
  nonCompeteRadius: z.string().optional(),
  includeNonSolicitation: z.boolean().optional(),
  nonSolicitationDuration: z.string().optional(),
  disputeResolution: z.enum(['arbitration', 'mediation', 'court', 'negotiation']).optional(),
  governingLaw: z.string().optional(),

  // Additional
  additionalClauses: z.string().optional(),
  specialProvisions: z.string().optional(),
});

export type EmploymentAgreementOptionalFormData = z.infer<typeof employmentAgreementOptionalSchema>;

// Default values - all optional
export const optionalDefaultValues: Partial<EmploymentAgreementOptionalFormData> = {
  salaryCurrency: 'USD',
  salaryPeriod: 'annual',
  employmentType: 'full-time',
  workArrangement: 'on-site',
  healthInsurance: false,
  dentalInsurance: false,
  visionInsurance: false,
  retirementPlan: false,
  overtimeEligible: false,
  includeNonCompete: false,
  includeNonSolicitation: false,
  includeConfidentiality: true,
  includeIpAssignment: true,
  disputeResolution: 'arbitration',
};
