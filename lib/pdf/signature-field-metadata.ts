/**
 * Signature Field Metadata
 * 
 * This file defines the exact coordinates for signature fields in the generated PDF.
 * These coordinates are used during PDF generation and field placement.
 * 
 * Coordinate System:
 * - Origin: Top-left corner of the page
 * - X increases → (left to right)
 * - Y increases ↓ (top to bottom)
 * - Units: Points (pt) where 72pt = 1 inch
 * 
 * Page Dimensions (US Letter):
 * - Width: 612pt (8.5 inches)
 * - Height: 792pt (11 inches)
 * - Margins: 72pt (1 inch) on all sides
 * - Content area: 468pt × 648pt
 */

export interface SignatureFieldMetadata {
  id: string;
  type: 'signature' | 'text' | 'date';
  party: 'employer' | 'employee';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number; // Usually the last page
}

/**
 * Calculate the Y position for signature section
 * This should match the actual position in the PDF template
 */
export const SIGNATURE_SECTION_START_Y = 600; // Start of signature section from top

/**
 * Signature field layout configuration
 * These values match the PDF generation in EmploymentAgreementPDF.tsx
 */
export const SIGNATURE_LAYOUT = {
  // Page settings
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,
  MARGIN: 72,
  
  // Signature section positioning
  SECTION_START_Y: 600, // Y position where signature section starts
  
  // Employer signature block
  EMPLOYER: {
    X: 100, // Left-aligned within content area
    LABEL_Y: 615, // "EMPLOYER:" label
    PARTY_NAME_Y: 625, // Company name
    BY_LABEL_Y: 640, // "By:" label
    BY_LINE_Y: 645, // Signature line for "By:"
    NAME_LABEL_Y: 660, // "Name:" label
    NAME_LINE_Y: 665, // Line for name
    TITLE_LABEL_Y: 680, // "Title:" label
    TITLE_LINE_Y: 685, // Line for title
    DATE_LABEL_Y: 700, // "Date:" label
    DATE_LINE_Y: 705, // Line for date
  },
  
  // Employee signature block
  EMPLOYEE: {
    X: 100, // Left-aligned within content area
    LABEL_Y: 730, // "EMPLOYEE:" label
    PARTY_NAME_Y: 740, // Employee name
    SIG_LABEL_Y: 755, // "Signature:" label
    SIG_LINE_Y: 760, // Signature line
    DATE_LABEL_Y: 775, // "Date:" label
    DATE_LINE_Y: 780, // Line for date
  },
  
  // Field dimensions
  FIELD: {
    SIGNATURE_WIDTH: 200,
    SIGNATURE_HEIGHT: 40,
    TEXT_WIDTH: 200,
    TEXT_HEIGHT: 30,
    DATE_WIDTH: 140,
    DATE_HEIGHT: 30,
  },
};

/**
 * Generate signature field metadata for a document
 * This returns the exact positions where fields should be placed
 */
export function generateSignatureFieldMetadata(
  employerName: string,
  employeeName: string,
  numPages: number
): SignatureFieldMetadata[] {
  const lastPage = numPages;
  
  return [
    // EMPLOYER FIELDS
    {
      id: 'employer-signature',
      type: 'signature',
      party: 'employer',
      label: `${employerName} - Signature`,
      x: SIGNATURE_LAYOUT.EMPLOYER.X,
      y: SIGNATURE_LAYOUT.EMPLOYER.BY_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.SIGNATURE_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.SIGNATURE_HEIGHT,
      pageNumber: lastPage,
    },
    {
      id: 'employer-name',
      type: 'text',
      party: 'employer',
      label: 'Name',
      x: SIGNATURE_LAYOUT.EMPLOYER.X,
      y: SIGNATURE_LAYOUT.EMPLOYER.NAME_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.TEXT_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.TEXT_HEIGHT,
      pageNumber: lastPage,
    },
    {
      id: 'employer-title',
      type: 'text',
      party: 'employer',
      label: 'Title',
      x: SIGNATURE_LAYOUT.EMPLOYER.X,
      y: SIGNATURE_LAYOUT.EMPLOYER.TITLE_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.TEXT_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.TEXT_HEIGHT,
      pageNumber: lastPage,
    },
    {
      id: 'employer-date',
      type: 'date',
      party: 'employer',
      label: 'Date',
      x: SIGNATURE_LAYOUT.EMPLOYER.X,
      y: SIGNATURE_LAYOUT.EMPLOYER.DATE_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.DATE_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.DATE_HEIGHT,
      pageNumber: lastPage,
    },
    
    // EMPLOYEE FIELDS
    {
      id: 'employee-signature',
      type: 'signature',
      party: 'employee',
      label: `${employeeName} - Signature`,
      x: SIGNATURE_LAYOUT.EMPLOYEE.X,
      y: SIGNATURE_LAYOUT.EMPLOYEE.SIG_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.SIGNATURE_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.SIGNATURE_HEIGHT,
      pageNumber: lastPage,
    },
    {
      id: 'employee-date',
      type: 'date',
      party: 'employee',
      label: 'Date',
      x: SIGNATURE_LAYOUT.EMPLOYEE.X,
      y: SIGNATURE_LAYOUT.EMPLOYEE.DATE_LINE_Y,
      width: SIGNATURE_LAYOUT.FIELD.DATE_WIDTH,
      height: SIGNATURE_LAYOUT.FIELD.DATE_HEIGHT,
      pageNumber: lastPage,
    },
  ];
}

/**
 * Embed metadata as a JSON string in the PDF
 * This can be stored in the PDF's metadata or as a hidden annotation
 */
export function createMetadataPayload(fields: SignatureFieldMetadata[]): string {
  return JSON.stringify({
    version: '1.0',
    generatedAt: new Date().toISOString(),
    signatureFields: fields,
  });
}

/**
 * Parse metadata from PDF
 */
export function parseMetadataPayload(payload: string): SignatureFieldMetadata[] | null {
  try {
    const data = JSON.parse(payload);
    return data.signatureFields || null;
  } catch (error) {
    console.error('Failed to parse signature field metadata:', error);
    return null;
  }
}
