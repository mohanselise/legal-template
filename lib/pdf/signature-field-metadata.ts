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
  pageNumber: number; // Always the LAST page for the new renderer
}

export interface SignatoryInfo {
  party: 'employer' | 'employee';
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

/**
 * Calculates the fixed positions for the Block-Based Renderer Signature Page.
 * These must align perfectly with `lib/pdf/components/SignaturePage.tsx`
 */
function calculateSignatureFieldPositions() {
  // Constants from SignaturePage.tsx styles & React-PDF layout
  // NOTE: React-PDF layout engine is tricky. These values are approximations
  // that need to be calibrated against the actual visual output.
  
  // Page Padding: 50pt (defined in SignaturePage.tsx)
  const PAGE_PADDING_TOP = 50;
  const PAGE_PADDING_LEFT = 50;

  // Header estimate: ~100pt height
  // (Title 14pt + margin 10pt) + (Subtitle 10pt + margin 40pt)
  const HEADER_HEIGHT = 80;
  
  const START_Y = PAGE_PADDING_TOP + HEADER_HEIGHT;

  // Block 1 (Employer)
  // Label: 9pt + 8pt margin = 17pt
  // Name: 12pt + 4pt margin = 16pt
  // Title: 10pt + 15pt margin = 25pt
  // Total Text Height: ~58pt
  // Signature Area starts after this.
  
  const BLOCK_PADDING = 10;
  const GAP_BETWEEN_BLOCKS = 40;
  
  // 1. EMPLOYER BLOCK
  const employerBlockY = START_Y;
  
  // Relative offset within the block for the signature line
  // Label (9+8) + Name (12+4) + Title (10+15) + MarginTop(10) + Line(30)
  // = ~88pt down from the start of the block content
  const signatureLineOffset = 88; 

  // Actual Y position on page
  // We need the signature BOX, not just the line. 
  // Let's place the box slightly above the line.
  const employerSigY = employerBlockY + BLOCK_PADDING + signatureLineOffset - 40; // Box starts 40pt above line
  
  const fieldWidth = 200; // Approx half width
  const fieldHeight = 50;

  // 2. EMPLOYEE BLOCK
  // Previous block height estimate: 
  // Text(58) + SigArea(50) + Padding(20) = ~130pt
  const employerBlockHeight = 180; 
  const employeeBlockY = employerBlockY + employerBlockHeight + GAP_BETWEEN_BLOCKS;
  
  const employeeSigY = employeeBlockY + BLOCK_PADDING + signatureLineOffset - 40;

  // X Coordinates (Fixed)
  const sigX = PAGE_PADDING_LEFT + BLOCK_PADDING; // Left aligned in block
  const dateX = sigX + 250; // Shifted right for date

  return {
    EMPLOYER: {
      SIGNATURE: { x: sigX, y: employerSigY, width: 200, height: 50 },
      DATE: { x: dateX, y: employerSigY, width: 120, height: 50 }
    },
    EMPLOYEE: {
      SIGNATURE: { x: sigX, y: employeeSigY, width: 200, height: 50 },
      DATE: { x: dateX, y: employeeSigY, width: 120, height: 50 }
    }
  };
}

export const SIGNATURE_LAYOUT = (() => {
  const calculated = calculateSignatureFieldPositions();
  return {
    EMPLOYER: calculated.EMPLOYER,
    EMPLOYEE: calculated.EMPLOYEE,
  };
})();

export function generateSignatureFieldMetadata(
  employerName: string,
  employeeName: string,
  numPages: number
): SignatureFieldMetadata[] {
  const lastPage = numPages; // Signature page is always the last one
  const layout = SIGNATURE_LAYOUT;

  return [
    // EMPLOYER FIELDS
    {
      id: 'employer-signature',
      type: 'signature',
      party: 'employer',
      label: `${employerName} - Signature`,
      ...layout.EMPLOYER.SIGNATURE,
      pageNumber: lastPage,
    },
    {
      id: 'employer-date',
      type: 'date',
      party: 'employer',
      label: 'Date',
      ...layout.EMPLOYER.DATE,
      pageNumber: lastPage,
    },

    // EMPLOYEE FIELDS
    {
      id: 'employee-signature',
      type: 'signature',
      party: 'employee',
      label: `${employeeName} - Signature`,
      ...layout.EMPLOYEE.SIGNATURE,
      pageNumber: lastPage,
    },
    {
      id: 'employee-date',
      type: 'date',
      party: 'employee',
      label: 'Date',
      ...layout.EMPLOYEE.DATE,
      pageNumber: lastPage,
    },
  ];
}

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

export function parseMetadataPayload(payload: string): SignatureFieldMetadata[] | null {
  try {
    const data = JSON.parse(payload);
    return data.signatureFields || null;
  } catch (error) {
    console.error('Failed to parse signature field metadata:', error);
    return null;
  }
}
