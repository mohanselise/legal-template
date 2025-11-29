/**
 * Employment Agreement Template Configuration
 * 
 * Complete configuration for the employment agreement template,
 * including metadata, schema, steps, and generation settings.
 */

import { FileText } from 'lucide-react';
import type { TemplateConfig, GenerationStage } from '../types';
import type { z } from 'zod';
import { 
  employmentAgreementSchema, 
  employmentAgreementDefaultValues,
  employmentAgreementStepValidation,
  type EmploymentAgreementFormData 
} from './schema';
import type { SignatoryData } from '@/app/api/templates/employment-agreement/schema';

/**
 * Generation stages for the loading screen
 */
export const employmentGenerationStages: GenerationStage[] = [
  {
    title: 'Analyzing your requirements',
    description: 'Reviewing parties, role details, compensation, and employment terms to ensure completeness.',
    progress: 12,
    duration: 3200,
  },
  {
    title: 'Drafting core provisions',
    description: 'Crafting employment terms, duties, and compensation clauses with precise legal language.',
    progress: 28,
    duration: 3800,
  },
  {
    title: 'Building protective clauses',
    description: 'Generating confidentiality, IP assignment, and restrictive covenant provisions tailored to your needs.',
    progress: 45,
    duration: 4200,
  },
  {
    title: 'Structuring articles & recitals',
    description: 'Organizing sections, adding recitals, and formatting signature blocks for professional presentation.',
    progress: 62,
    duration: 4000,
  },
  {
    title: 'Generating PDF document',
    description: 'Converting the agreement to PDF format with proper formatting, signatures, and legal structure.',
    progress: 80,
    duration: 4800,
  },
  {
    title: 'Quality assurance',
    description: 'Verifying defined terms, cross-references, dates, and legal consistency throughout the document.',
    progress: 92,
    duration: 3600,
  },
  {
    title: 'Finalizing document',
    description: 'Applying final formatting touches and preparing your employment agreement for review.',
    progress: 98,
    duration: 2400,
  },
];

/**
 * Step IDs for the employment agreement form
 */
export const EMPLOYMENT_STEP_IDS = {
  COMPANY: 'company',
  EMPLOYEE: 'employee', 
  SIGNING: 'signing',
  WORK: 'work',
  COMPENSATION: 'compensation',
  LEGAL: 'legal',
  REVIEW: 'review',
  CONFIRM: 'confirm',
} as const;

/**
 * Steps configuration for employment agreement
 * Note: Components are dynamically imported in the app layer
 */
export const employmentStepsConfig = [
  { 
    id: EMPLOYMENT_STEP_IDS.COMPANY, 
    title: 'Company & Role',
    description: 'Tell us about your company and the position',
    validation: employmentAgreementStepValidation.companyRole,
    showMarketStandard: false,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.EMPLOYEE, 
    title: 'Employee',
    description: 'Employee details and start date',
    validation: employmentAgreementStepValidation.employee,
    showMarketStandard: false,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.SIGNING, 
    title: 'Signing',
    description: 'Who will sign this agreement',
    validation: employmentAgreementStepValidation.signing,
    showMarketStandard: false,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.WORK, 
    title: 'Work',
    description: 'Work arrangement and schedule',
    validation: employmentAgreementStepValidation.work,
    showMarketStandard: true,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.COMPENSATION, 
    title: 'Compensation',
    description: 'Salary and benefits',
    validation: employmentAgreementStepValidation.compensation,
    showMarketStandard: true,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.LEGAL, 
    title: 'Legal',
    description: 'Legal terms and conditions',
    validation: employmentAgreementStepValidation.legal,
    showMarketStandard: true,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.REVIEW, 
    title: 'Review',
    description: 'Review your information',
    validation: employmentAgreementStepValidation.review,
    showMarketStandard: false,
  },
  { 
    id: EMPLOYMENT_STEP_IDS.CONFIRM, 
    title: 'Confirm',
    description: 'Confirm and generate',
    showMarketStandard: false,
  },
];

/**
 * Steps that show the "Use Market Standard" button
 */
export const MARKET_STANDARD_STEP_INDICES = [3, 4, 5]; // Work, Compensation, Legal

/**
 * Extract signatories from form data for PDF generation
 */
export function getEmploymentSignatories(
  formData: Partial<EmploymentAgreementFormData>
): SignatoryData[] {
  const signatories: SignatoryData[] = [];

  // Employer signatory
  if (formData.companyRepName || formData.companyName) {
    signatories.push({
      party: 'employer',
      name: formData.companyRepName || formData.companyName || 'Employer',
      title: formData.companyRepTitle,
      email: formData.companyRepEmail,
      phone: formData.companyRepPhone,
    });
  }

  // Employee signatory
  if (formData.employeeName) {
    signatories.push({
      party: 'employee',
      name: formData.employeeName,
      title: formData.jobTitle,
      email: formData.employeeEmail,
      phone: formData.employeePhone,
    });
  }

  return signatories;
}

/**
 * Full template configuration for employment agreement
 * 
 * Note: Step components are not included here as they need to be
 * dynamically imported in the app layer to support code splitting.
 * Use `employmentStepsConfig` to get step metadata.
 */
export const employmentAgreementConfig: Omit<TemplateConfig<EmploymentAgreementFormData>, 'steps'> & {
  stepsConfig: typeof employmentStepsConfig;
} = {
  id: 'employment-agreement',
  
  meta: {
    id: 'employment-agreement',
    title: 'Employment Agreement',
    description: 'Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.',
    icon: FileText,
    available: true,
    href: '/templates/employment-agreement/generate',
    popular: true,
    keywords: [
      'employment agreement',
      'employment contract',
      'job contract template',
      'employee agreement',
      'work contract',
      'hiring agreement',
    ],
    estimatedMinutes: 5,
  },
  
  schema: employmentAgreementSchema as z.ZodType<EmploymentAgreementFormData>,
  
  defaultValues: employmentAgreementDefaultValues,
  
  stepsConfig: employmentStepsConfig,
  
  enrichment: {
    jurisdiction: true,
    company: true,
    jobTitle: true,
    marketStandards: 'employment',
  },
  
  generation: {
    endpoint: '/api/templates/employment-agreement/generate',
    stages: employmentGenerationStages,
    preparePayload: (formData, enrichment) => ({
      formData,
      enrichment: enrichment ? {
        jurisdiction: enrichment.jurisdictionData,
        company: enrichment.companyData,
        jobTitle: enrichment.jobTitleData,
        marketStandards: enrichment.marketStandards,
      } : undefined,
      acceptedLegalDisclaimer: true,
      understandAiContent: true,
      background: true,
    }),
  },
  
  storageKey: 'employment-agreement-smart-flow-v1',
  
  getSignatories: getEmploymentSignatories,
};

export default employmentAgreementConfig;

