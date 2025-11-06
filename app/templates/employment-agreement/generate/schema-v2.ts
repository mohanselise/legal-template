import { z } from 'zod';

// Flexible schema for conversational form
export const conversationalSchema = z.object({
  // Company Information
  companyName: z.string().min(1, 'Please enter your company name'),
  companyAddress: z.string().optional(),
  companyState: z.string().optional(),
  companyCountry: z.string().optional(),

  // Employee Information - Optional
  hasEmployeeInfo: z.boolean(),
  employeeName: z.string().optional(),
  employeeEmail: z.union([z.string().email(), z.literal('')]).optional(),
  employeeAddress: z.string().optional(),
  employeePhone: z.string().optional(),

  // Position
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().optional(),
  hasReportsTo: z.boolean(),
  reportsTo: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  employmentType: z.enum(['full-time', 'part-time', 'contract']),

  // Compensation
  salaryAmount: z.string().min(1, 'Salary amount is required'),
  salaryCurrency: z.string(),
  salaryPeriod: z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly', 'annual']),

  hasBonus: z.boolean(),
  bonusStructure: z.string().optional(),

  hasEquity: z.boolean(),
  equityOffered: z.string().optional(),

  // Benefits
  hasBenefits: z.boolean(),
  healthInsurance: z.boolean(),
  dentalInsurance: z.boolean(),
  visionInsurance: z.boolean(),
  retirementPlan: z.boolean(),
  paidTimeOff: z.string().optional(),
  sickLeave: z.string().optional(),
  otherBenefits: z.string().optional(),

  // Work Terms
  workLocation: z.string().min(1, 'Work location is required'),
  workArrangement: z.enum(['on-site', 'remote', 'hybrid']),
  workHoursPerWeek: z.string(),
  workSchedule: z.string().optional(),
  overtimeEligible: z.boolean(),

  hasProbation: z.boolean(),
  probationPeriod: z.string().optional(),
  noticePeriod: z.string(),

  // Legal Terms
  includeConfidentiality: z.boolean(),
  includeIpAssignment: z.boolean(),

  includeNonCompete: z.boolean(),
  nonCompeteDuration: z.string().optional(),
  nonCompeteRadius: z.string().optional(),

  includeNonSolicitation: z.boolean(),
  nonSolicitationDuration: z.string().optional(),

  disputeResolution: z.enum(['arbitration', 'mediation', 'court']),
  governingLaw: z.string().min(1, 'Governing law is required'),

  // Additional
  hasAdditionalClauses: z.boolean(),
  additionalClauses: z.string().optional(),
  specialProvisions: z.string().optional(),
});

export type ConversationalFormData = z.infer<typeof conversationalSchema>;

export const conversationalDefaults: Partial<ConversationalFormData> = {
  salaryCurrency: 'USD',
  salaryPeriod: 'annual',
  employmentType: 'full-time',
  workArrangement: 'on-site',
  workHoursPerWeek: '40',
  noticePeriod: '2 weeks',
  hasEmployeeInfo: false,
  hasReportsTo: false,
  hasBonus: false,
  hasEquity: false,
  hasBenefits: false,
  hasProbation: false,
  includeConfidentiality: true,
  includeIpAssignment: true,
  includeNonCompete: false,
  includeNonSolicitation: false,
  disputeResolution: 'arbitration',
  hasAdditionalClauses: false,
};
