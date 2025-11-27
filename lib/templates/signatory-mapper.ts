/**
 * Signatory Mapper Utility
 * 
 * Maps form builder signatory screen data to the SignatoryData structure
 * used by PDF generation and SELISE Signature integration.
 */

import type { SignatoryData } from '@/app/api/templates/employment-agreement/schema';
import type { TemplateField } from '@/lib/db';

/**
 * Data from a signatory screen in the form builder
 */
export interface SignatoryScreenData {
  /** Fields defined in the signatory screen */
  fields: TemplateField[];
  /** Form values collected from the user */
  formValues: Record<string, unknown>;
}

/**
 * Standard field names expected in signatory screens
 */
export const SIGNATORY_FIELD_NAMES = {
  PARTY: 'party',
  NAME: 'name',
  EMAIL: 'email',
  TITLE: 'title',
  PHONE: 'phone',
} as const;

/**
 * Maps a single signatory screen's data to SignatoryData format
 * 
 * @param screenData - Data from a signatory screen
 * @returns SignatoryData object for PDF generation
 */
export function mapSignatoryScreenToSignatoryData(
  screenData: SignatoryScreenData
): SignatoryData {
  const getValue = (name: string): string | undefined => {
    const value = screenData.formValues[name];
    return typeof value === 'string' ? value : undefined;
  };

  const partyValue = getValue(SIGNATORY_FIELD_NAMES.PARTY);
  const validParties = ['employer', 'employee', 'witness', 'other'] as const;
  const party = validParties.includes(partyValue as typeof validParties[number])
    ? (partyValue as SignatoryData['party'])
    : 'other';

  return {
    party,
    name: getValue(SIGNATORY_FIELD_NAMES.NAME) || 'Unknown',
    email: getValue(SIGNATORY_FIELD_NAMES.EMAIL),
    title: getValue(SIGNATORY_FIELD_NAMES.TITLE),
    phone: getValue(SIGNATORY_FIELD_NAMES.PHONE),
  };
}

/**
 * Maps multiple signatory screens to an array of SignatoryData
 * 
 * @param screensData - Array of signatory screen data
 * @returns Array of SignatoryData objects for PDF generation
 */
export function mapSignatoryScreensToSignatories(
  screensData: SignatoryScreenData[]
): SignatoryData[] {
  return screensData.map(mapSignatoryScreenToSignatoryData);
}

/**
 * Extracts signatory data from form data using dynamic field mapping
 * 
 * This function handles both:
 * 1. Legacy hardcoded field names (companyRepName, employeeName, etc.)
 * 2. Dynamic signatory screen fields from the form builder
 * 
 * @param formData - Form data containing signatory information
 * @param signatoryFields - Optional array of signatory field definitions from form builder
 * @returns Array of SignatoryData objects
 */
export function extractSignatoriesFromFormData(
  formData: Record<string, unknown>,
  signatoryFields?: TemplateField[]
): SignatoryData[] {
  // If we have dynamic signatory fields from form builder, use them
  if (signatoryFields && signatoryFields.length > 0) {
    return [mapSignatoryScreenToSignatoryData({ fields: signatoryFields, formValues: formData })];
  }

  // Fallback to legacy hardcoded field mapping for backward compatibility
  const signatories: SignatoryData[] = [];

  // Employer signatory (from company info)
  const employerName = formData.companyRepName || formData.companyName;
  if (employerName && typeof employerName === 'string') {
    signatories.push({
      party: 'employer',
      name: employerName,
      email: formData.companyRepEmail as string | undefined,
      title: formData.companyRepTitle as string | undefined,
      phone: formData.companyRepPhone as string | undefined,
    });
  }

  // Employee signatory
  const employeeName = formData.employeeName;
  if (employeeName && typeof employeeName === 'string') {
    signatories.push({
      party: 'employee',
      name: employeeName,
      email: formData.employeeEmail as string | undefined,
      title: formData.jobTitle as string | undefined,
      phone: formData.employeePhone as string | undefined,
    });
  }

  return signatories;
}

/**
 * Validates that signatory data has the required fields
 * 
 * @param signatory - SignatoryData to validate
 * @returns Object with isValid flag and any validation errors
 */
export function validateSignatoryData(signatory: SignatoryData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!signatory.name || signatory.name.trim() === '' || signatory.name === 'Unknown') {
    errors.push('Name is required');
  }

  if (!signatory.email || signatory.email.trim() === '') {
    errors.push('Email is required for digital signing');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signatory.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates all signatories have required data for SELISE Signature
 * 
 * @param signatories - Array of SignatoryData to validate
 * @returns Object with overall validity and per-signatory errors
 */
export function validateSignatoriesForSigning(signatories: SignatoryData[]): {
  isValid: boolean;
  signatoryErrors: Array<{ index: number; party: string; errors: string[] }>;
} {
  if (signatories.length === 0) {
    return {
      isValid: false,
      signatoryErrors: [{ index: -1, party: 'none', errors: ['At least one signatory is required'] }],
    };
  }

  const signatoryErrors: Array<{ index: number; party: string; errors: string[] }> = [];

  signatories.forEach((signatory, index) => {
    const validation = validateSignatoryData(signatory);
    if (!validation.isValid) {
      signatoryErrors.push({
        index,
        party: signatory.party,
        errors: validation.errors,
      });
    }
  });

  return {
    isValid: signatoryErrors.length === 0,
    signatoryErrors,
  };
}

