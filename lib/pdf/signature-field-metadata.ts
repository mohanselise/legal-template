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
 */
function calculateSignatureFieldPositions() {
  // Page settings
  const PAGE_PADDING = 72; // Page padding on all sides
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
  
  // Signature fields row
  const SIGNATURE_FIELDS_ROW_MARGIN_TOP = 10;
  
  // Calculate Y position for employer signature field
  // Start from page top, add all elements before the signature field
  const employerSignatureY = 
    PAGE_PADDING + // Page padding top
    SIGNATURE_SECTION_MARGIN_TOP + // Section margin
    SIGNATURE_SECTION_PADDING_TOP + // Section padding
    WITNESS_CLAUSE_TOTAL + // Witness clause
    SIGNATURE_BLOCK_PADDING + // Block padding top
    PARTY_LABEL_TOTAL + // Party label
    PARTY_NAME_TOTAL + // Party name
    ROLE_TOTAL + // Role
    SIGNATURE_FIELDS_ROW_MARGIN_TOP; // Row margin top
  
  // Calculate X position (left margin + block padding)
  const signatureX = PAGE_PADDING + SIGNATURE_BLOCK_PADDING; // 72 + 12 = 84pt
  
  // Calculate widths
  // Available width inside block: CONTENT_WIDTH - SIGNATURE_BLOCK_PADDING * 2 = 468 - 24 = 444pt
  // Date field width: 140pt
  // Gap between fields: 16pt (marginRight on signatureFieldBox)
  // Signature field width: 444 - 140 - 16 = 288pt
  const availableWidth = CONTENT_WIDTH - SIGNATURE_BLOCK_PADDING * 2; // 444pt
  const dateFieldWidth = 140;
  const fieldGap = 16;
  const signatureFieldWidth = availableWidth - dateFieldWidth - fieldGap; // 288pt
  
  // Date field X position
  const dateX = signatureX + signatureFieldWidth + fieldGap; // 84 + 288 + 16 = 388pt
  
  // Date field Y (aligned with signature field, accounting for height difference)
  const signatureFieldHeight = 50; // minHeight
  const dateFieldHeight = 36; // minHeight
  const dateY = employerSignatureY + (signatureFieldHeight - dateFieldHeight) / 2; // Center align
  
  // Employee signature Y (below employer block)
  // Employer block height: signatureFieldHeight + nameFieldBox (minHeight 28 + marginTop 6) + block padding bottom
  const nameFieldHeight = 28;
  const nameFieldMarginTop = 6;
  const signatureFieldsRowMarginBottom = 6;
  const employerBlockHeight = 
    SIGNATURE_FIELDS_ROW_MARGIN_TOP +
    signatureFieldHeight +
    signatureFieldsRowMarginBottom +
    nameFieldMarginTop +
    nameFieldHeight +
    SIGNATURE_BLOCK_PADDING; // ~100pt
  
  const employeeSignatureY = 
    employerSignatureY +
    employerBlockHeight +
    SIGNATURE_BLOCK_MARGIN_BOTTOM +
    SIGNATURE_BLOCK_PADDING + // Next block padding top
    PARTY_LABEL_TOTAL +
    PARTY_NAME_TOTAL +
    ROLE_TOTAL +
    SIGNATURE_FIELDS_ROW_MARGIN_TOP;
  
  const employeeDateY = employeeSignatureY + (signatureFieldHeight - dateFieldHeight) / 2;
  
  return {
    EMPLOYER: {
      SIGNATURE: {
        x: signatureX,
        y: employerSignatureY,
        width: signatureFieldWidth,
        height: signatureFieldHeight,
      },
      DATE: {
        x: dateX,
        y: dateY,
        width: dateFieldWidth,
        height: dateFieldHeight,
      },
    },
    EMPLOYEE: {
      SIGNATURE: {
        x: signatureX,
        y: employeeSignatureY,
        width: signatureFieldWidth,
        height: signatureFieldHeight,
      },
      DATE: {
        x: dateX,
        y: employeeDateY,
        width: dateFieldWidth,
        height: dateFieldHeight,
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
