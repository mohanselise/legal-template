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
 * Signatory contact information for sending signature requests
 */
export interface SignatoryInfo {
  party: 'employer' | 'employee';
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

/**
 * Signature field layout configuration
 * These values match the PDF generation in EmploymentAgreementPDF.tsx
 */
export const SIGNATURE_LAYOUT = {
  // Page settings
  PAGE_WIDTH: 612,
  PAGE_HEIGHT: 792,
  MARGIN: 72,

  // Signature section positioning (measured from top-left origin)
  // Updated for compacted layout (reduced margins and padding)
  EMPLOYER: {
    SIGNATURE: {
      x: 86, // Left margin + signature block padding (72 + 14)
      y: 560, // Adjusted for compacted signature section
      width: 240,
      height: 58,
    },
    DATE: {
      x: 340, // Positioned to the right of signature field
      y: 568, // Slightly below signature field top
      width: 140,
      height: 36,
    },
  },
  EMPLOYEE: {
    SIGNATURE: {
      x: 86, // Left margin + signature block padding (72 + 14)
      y: 650, // Positioned below employer signature block
      width: 240,
      height: 58,
    },
    DATE: {
      x: 340, // Positioned to the right of signature field
      y: 658, // Slightly below signature field top
      width: 140,
      height: 36,
    },
  },
};

export const SIGNATURE_FIELD_DEFAULTS = {
  SIGNATURE_HEIGHT: 58,
  SIGNATURE_WIDTH: 240,
  DATE_HEIGHT: 36,
  DATE_WIDTH: 140,
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
      x: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.x,
      y: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.y,
      width: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.width,
      height: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.height,
      pageNumber: lastPage,
    },
    {
      id: 'employer-date',
      type: 'date',
      party: 'employer',
      label: 'Date',
      x: SIGNATURE_LAYOUT.EMPLOYER.DATE.x,
      y: SIGNATURE_LAYOUT.EMPLOYER.DATE.y,
      width: SIGNATURE_LAYOUT.EMPLOYER.DATE.width,
      height: SIGNATURE_LAYOUT.EMPLOYER.DATE.height,
      pageNumber: lastPage,
    },

    // EMPLOYEE FIELDS
    {
      id: 'employee-signature',
      type: 'signature',
      party: 'employee',
      label: `${employeeName} - Signature`,
      x: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.x,
      y: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.y,
      width: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.width,
      height: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.height,
      pageNumber: lastPage,
    },
    {
      id: 'employee-date',
      type: 'date',
      party: 'employee',
      label: 'Date',
      x: SIGNATURE_LAYOUT.EMPLOYEE.DATE.x,
      y: SIGNATURE_LAYOUT.EMPLOYEE.DATE.y,
      width: SIGNATURE_LAYOUT.EMPLOYEE.DATE.width,
      height: SIGNATURE_LAYOUT.EMPLOYEE.DATE.height,
      pageNumber: lastPage,
    },
  ];
}

/**
 * Embed metadata as a JSON string in the PDF
 * This can be stored in the PDF's metadata or as a hidden annotation
 */
export function createMetadataPayload(
  fields: SignatureFieldMetadata[],
  signatories?: SignatoryInfo[]
): string {
  return JSON.stringify({
    version: '1.0',
    generatedAt: new Date().toISOString(),
    signatureFields: fields,
    signatories: signatories || [],
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
