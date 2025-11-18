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
 * Calculate exact signature field positions based on PDF structure
 * These calculations match the styles in EmploymentAgreementPDF.tsx
 * 
 * Positions are calculated from the BOTTOM of the page (792pt) for reliability,
 * since the signature section is always positioned at the bottom regardless of
 * the amount of content above it.
 */
function calculateSignatureFieldPositions() {
  // Page settings
  const PAGE_PADDING = 72; // Page padding on all sides
  const PAGE_HEIGHT = 792; // US Letter page height
  const CONTENT_WIDTH = 612 - PAGE_PADDING * 2; // 468pt
  
  // Signature section styles
  const SIGNATURE_SECTION_MARGIN_TOP = 40;
  const SIGNATURE_SECTION_PADDING_TOP = 20;
  
  // Witness clause
  const WITNESS_CLAUSE_FONT_SIZE = 10;
  const WITNESS_CLAUSE_LINE_HEIGHT = 1.5;
  const WITNESS_CLAUSE_HEIGHT = WITNESS_CLAUSE_FONT_SIZE * WITNESS_CLAUSE_LINE_HEIGHT; // ~15pt
  const WITNESS_CLAUSE_MARGIN_BOTTOM = 20;
  const WITNESS_CLAUSE_TOTAL = WITNESS_CLAUSE_HEIGHT + WITNESS_CLAUSE_MARGIN_BOTTOM; // ~35pt
  
  // Signature block
  const SIGNATURE_BLOCK_PADDING = 12;
  const SIGNATURE_BLOCK_MARGIN_BOTTOM = 20;
  
  // Party label
  const PARTY_LABEL_FONT_SIZE = 9;
  const PARTY_LABEL_MARGIN_BOTTOM = 8;
  const PARTY_LABEL_PADDING_BOTTOM = 8;
  const PARTY_LABEL_TOTAL = PARTY_LABEL_FONT_SIZE + PARTY_LABEL_MARGIN_BOTTOM + PARTY_LABEL_PADDING_BOTTOM; // ~25pt
  
  // Party name
  const PARTY_NAME_FONT_SIZE = 12;
  const PARTY_NAME_MARGIN_TOP = 8;
  const PARTY_NAME_MARGIN_BOTTOM = 12;
  const PARTY_NAME_TOTAL = PARTY_NAME_FONT_SIZE + PARTY_NAME_MARGIN_TOP + PARTY_NAME_MARGIN_BOTTOM; // ~32pt
  
  // Role
  const ROLE_FONT_SIZE = 10;
  const ROLE_MARGIN_TOP = 4;
  const ROLE_TOTAL = ROLE_FONT_SIZE + ROLE_MARGIN_TOP; // ~14pt
  
  // Field dimensions based on manually adjusted positions
  const dateFieldWidth = 140;
  const dateFieldHeight = 36;
  
  // Employer signature field (smaller)
  const employerSignatureFieldWidth = 196;
  const employerSignatureFieldHeight = 48;
  const employerSignatureX = 164;
  
  // Employee signature field (larger)
  const employeeSignatureFieldWidth = 240;
  const employeeSignatureFieldHeight = 58;
  const employeeSignatureX = 136;
  
  // Date field X positions (both align to 387pt)
  const dateX = 387;
  
  // Calculate Y positions from BOTTOM of page (792pt total height)
  // Based on manually adjusted positions:
  // - Employee signature Y: 556pt from top = 792 - 556 = 236pt from bottom
  // - Employee date Y: 575pt from top = 792 - 575 = 217pt from bottom
  // - Employer signature Y: 301pt from top = 792 - 301 = 491pt from bottom
  // - Employer date Y: 314pt from top = 792 - 314 = 478pt from bottom
  
  // Employee signature field Y (from bottom)
  const employeeSignatureYFromBottom = 236; // 792 - 556
  const employeeSignatureY = PAGE_HEIGHT - employeeSignatureYFromBottom; // 556
  
  // Employee date Y (from bottom)
  const employeeDateYFromBottom = 217; // 792 - 575
  const employeeDateY = PAGE_HEIGHT - employeeDateYFromBottom; // 575
  
  // Employer signature field Y (from bottom)
  const employerSignatureYFromBottom = 491; // 792 - 301
  const employerSignatureY = PAGE_HEIGHT - employerSignatureYFromBottom; // 301
  
  // Employer date Y (from bottom)
  const employerDateYFromBottom = 478; // 792 - 314
  const employerDateY = PAGE_HEIGHT - employerDateYFromBottom; // 314
  
  return {
    EMPLOYER: {
      SIGNATURE: {
        x: employerSignatureX, // 164pt
        y: employerSignatureY, // 301pt from top (491pt from bottom)
        width: employerSignatureFieldWidth, // 196pt
        height: employerSignatureFieldHeight, // 48pt
      },
      DATE: {
        x: dateX, // 387pt
        y: employerDateY, // 314pt from top (478pt from bottom)
        width: dateFieldWidth, // 140pt
        height: dateFieldHeight, // 36pt
      },
    },
    EMPLOYEE: {
      SIGNATURE: {
        x: employeeSignatureX, // 136pt
        y: employeeSignatureY, // 556pt from top (236pt from bottom)
        width: employeeSignatureFieldWidth, // 240pt
        height: employeeSignatureFieldHeight, // 58pt
      },
      DATE: {
        x: dateX, // 387pt
        y: employeeDateY, // 575pt from top (217pt from bottom)
        width: dateFieldWidth, // 140pt
        height: dateFieldHeight, // 36pt
      },
    },
  };
}

/**
 * Signature field layout configuration
 * These values are calculated to match the PDF generation in EmploymentAgreementPDF.tsx
 */
export const SIGNATURE_LAYOUT = (() => {
  const calculated = calculateSignatureFieldPositions();
  return {
    // Page settings
    PAGE_WIDTH: 612,
    PAGE_HEIGHT: 792,
    MARGIN: 72,
    EMPLOYER: calculated.EMPLOYER,
    EMPLOYEE: calculated.EMPLOYEE,
  };
})();

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
  const layout = SIGNATURE_LAYOUT;

  const fields = [
    // EMPLOYER FIELDS
    {
      id: 'employer-signature',
      type: 'signature' as const,
      party: 'employer' as const,
      label: `${employerName} - Signature`,
      x: layout.EMPLOYER.SIGNATURE.x,
      y: layout.EMPLOYER.SIGNATURE.y,
      width: layout.EMPLOYER.SIGNATURE.width,
      height: layout.EMPLOYER.SIGNATURE.height,
      pageNumber: lastPage,
    },
    {
      id: 'employer-date',
      type: 'date' as const,
      party: 'employer' as const,
      label: 'Date',
      x: layout.EMPLOYER.DATE.x,
      y: layout.EMPLOYER.DATE.y,
      width: layout.EMPLOYER.DATE.width,
      height: layout.EMPLOYER.DATE.height,
      pageNumber: lastPage,
    },

    // EMPLOYEE FIELDS
    {
      id: 'employee-signature',
      type: 'signature' as const,
      party: 'employee' as const,
      label: `${employeeName} - Signature`,
      x: layout.EMPLOYEE.SIGNATURE.x,
      y: layout.EMPLOYEE.SIGNATURE.y,
      width: layout.EMPLOYEE.SIGNATURE.width,
      height: layout.EMPLOYEE.SIGNATURE.height,
      pageNumber: lastPage,
    },
    {
      id: 'employee-date',
      type: 'date' as const,
      party: 'employee' as const,
      label: 'Date',
      x: layout.EMPLOYEE.DATE.x,
      y: layout.EMPLOYEE.DATE.y,
      width: layout.EMPLOYEE.DATE.width,
      height: layout.EMPLOYEE.DATE.height,
      pageNumber: lastPage,
    },
  ];

  // Debug logging
  console.log('[generateSignatureFieldMetadata] Generated fields:', {
    pageCount: numPages,
    lastPage,
    positions: fields.map(f => ({
      id: f.id,
      type: f.type,
      party: f.party,
      position: `(${f.x}, ${f.y})`,
      size: `${f.width}×${f.height}`,
    })),
    layout: {
      employerSignature: layout.EMPLOYER.SIGNATURE,
      employerDate: layout.EMPLOYER.DATE,
      employeeSignature: layout.EMPLOYEE.SIGNATURE,
      employeeDate: layout.EMPLOYEE.DATE,
    },
  });

  return fields;
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
