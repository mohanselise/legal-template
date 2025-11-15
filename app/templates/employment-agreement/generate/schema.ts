import { z } from 'zod';

// Form validation schema for employment agreement generation
export const employmentAgreementSchema = z.object({
  // Step 1: Basic Information
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z.string().min(1, 'Company address is required'),
  companyState: z.string().min(1, 'State/Province is required'),
  companyCountry: z.string().min(1, 'Country is required'),
  companyWebsite: z.string().optional(),

  employeeName: z.string().min(1, 'Employee name is required'),
  employeeAddress: z.string().min(1, 'Employee address is required'),
  employeeEmail: z.string().email('Valid email is required'),
  employeePhone: z.string().optional(),

  jobTitle: z.string().min(1, 'Job title is required'),
  jobResponsibilities: z.string().optional(),
  department: z.string().optional(),
  reportsTo: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  employmentType: z.enum(['full-time', 'part-time', 'contract']),

  // Step 2: Compensation & Benefits
  salaryAmount: z.string().min(1, 'Salary amount is required'),
  salaryCurrency: z.string().default('USD'),
  salaryPeriod: z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly', 'annual']),
  bonusStructure: z.string().optional(),
  equityOffered: z.string().optional(),
  signOnBonus: z.string().optional(),

  healthInsurance: z.boolean().default(false),
  dentalInsurance: z.boolean().default(false),
  visionInsurance: z.boolean().default(false),
  retirementPlan: z.boolean().default(false),
  paidTimeOff: z.string().optional(),
  sickLeave: z.string().optional(),
  otherBenefits: z.string().optional(),

  // Step 3: Work Terms
  workLocation: z.string().min(1, 'Work location is required'),
  workArrangement: z.enum(['on-site', 'remote', 'hybrid']),
  workHoursPerWeek: z.string().min(1, 'Work hours per week is required'),
  workSchedule: z.string().optional(),
  overtimeEligible: z.boolean().default(false),

  // Step 4: Legal Terms
  probationPeriod: z.string().optional(),
  noticePeriod: z.string().optional(),

  includeNonCompete: z.boolean().default(false),
  nonCompeteDuration: z.string().optional(),
  nonCompeteRadius: z.string().optional(),

  includeNonSolicitation: z.boolean().default(false),
  nonSolicitationDuration: z.string().optional(),

  includeConfidentiality: z.boolean().default(true),
  includeIpAssignment: z.boolean().default(true),

  disputeResolution: z.enum(['arbitration', 'mediation', 'court']).default('arbitration'),
  governingLaw: z.string().min(1, 'Governing law jurisdiction is required'),

  // Step 5: Additional Terms
  additionalClauses: z.string().optional(),
  specialProvisions: z.string().optional(),
});

export type EmploymentAgreementFormData = z.infer<typeof employmentAgreementSchema>;

// Default values for the form
export const defaultValues: Partial<EmploymentAgreementFormData> = {
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
