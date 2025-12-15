import { SIG_PAGE_LAYOUT, getSignatureBlockPosition, getSignaturePageNumber, calculateSignaturePages } from './signature-layout';

// Calculate signature layout positions for employer (index 0) and employee (index 1)
const employerBlockTop = getSignatureBlockPosition(0);
const employeeBlockTop = getSignatureBlockPosition(1);

export const SIGNATURE_LAYOUT = {
  EMPLOYER: {
    SIGNATURE: {
      x: SIG_PAGE_LAYOUT.MARGIN_X + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
      y: employerBlockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    },
    DATE: {
      x: SIG_PAGE_LAYOUT.MARGIN_X + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
      y: employerBlockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    },
  },
  EMPLOYEE: {
    SIGNATURE: {
      x: SIG_PAGE_LAYOUT.MARGIN_X + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
      y: employeeBlockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    },
    DATE: {
      x: SIG_PAGE_LAYOUT.MARGIN_X + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
      y: employeeBlockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    },
  },
};

export const SIGNATURE_FIELD_DEFAULTS = {
  signature: {
    width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
    height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
  },
  date: {
    width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
    height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
  },
};

export interface SignatureFieldMetadata {
  id: string;
  type: 'signature' | 'text' | 'date';
  party: string; // Flexible party type (employer, employee, disclosingParty, receivingParty, witness, etc.)
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  signatoryIndex: number; 
}

export interface SignatoryInfo {
  party: string; // Flexible party type (employer, employee, disclosingParty, receivingParty, witness, etc.)
  name: string;
  email: string;
  role?: string;
  title?: string;
  phone?: string;
  company?: string;
  address?: string;
}

/**
 * Generates signature field metadata for all signatories.
 * 
 * This function creates overlay position data that EXACTLY matches
 * the PDF rendering positions from SignaturePage.tsx because both
 * use the same getSignatureBlockPosition() function.
 * 
 * @param signatories Array of signatory info from AI-generated document
 * @param numPages Total pages in the document (content pages, signature page(s) will be added)
 * @returns Array of signature field metadata for overlay positioning
 */
export function generateSignatureFieldMetadata(
  signatories: SignatoryInfo[],
  numPages: number
): SignatureFieldMetadata[] {
  // Calculate content pages (everything before signature pages)
  // If numPages already includes signature pages, we need to adjust
  const signaturePageCount = calculateSignaturePages(signatories.length);
  const contentPages = Math.max(1, numPages - signaturePageCount);

  return signatories.flatMap((signatory, index) => {
    // Get the Y position for this signatory (handles pagination)
    const blockTop = getSignatureBlockPosition(index);
    
    // Get which page this signatory's block will appear on
    const pageNumber = getSignaturePageNumber(index, contentPages);
    
    // Absolute X position relative to page
    const blockLeft = SIG_PAGE_LAYOUT.MARGIN_X;
    
    // Create a sanitized party identifier for field IDs
    const partyId = (signatory.party || 'signatory').replace(/\s+/g, '_').toLowerCase();
    
    const signatureField: SignatureFieldMetadata = {
      id: `sig-${index}-${partyId}`,
      type: 'signature',
      party: signatory.party || 'signatory',
      label: `${signatory.name} - Signature`,
      pageNumber,
      signatoryIndex: index,
      x: blockLeft + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
      y: blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    };

    const dateField: SignatureFieldMetadata = {
      id: `date-${index}-${partyId}`,
      type: 'date',
      party: signatory.party || 'signatory',
      label: 'Date',
      pageNumber,
      signatoryIndex: index,
      x: blockLeft + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
      y: blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    };

    return [signatureField, dateField];
  });
}

export function createMetadataPayload(
  fields: SignatureFieldMetadata[],
  signatories: SignatoryInfo[]
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

/**
 * Layout constants matching SignaturePage.tsx styles
 * These values are derived from the actual StyleSheet definitions in SignaturePage.tsx
 */
const DYNAMIC_LAYOUT = {
  PAGE_PADDING: 72,           // Page margin from LegalDocumentPDF.tsx
  SECTION_MARGIN_TOP: 40,      // marginTop on signature section wrapper
  
  // Header section (from SignaturePage styles)
  HEADER_TITLE: 24,            // fontSize 14 + marginBottom 10 (approximate line height)
  HEADER_SUBTITLE: 10,         // fontSize 10 (approximate line height)
  HEADER_MARGIN_BOTTOM: 24,
  
  // Per-block layout (from SignaturePage styles)
  BLOCK_PADDING_TOP: 20,
  PARTY_LABEL: 13,             // fontSize 9 + marginBottom 4 (approximate line height)
  PARTY_NAME: 16,              // fontSize 12 + marginBottom 4 (approximate line height)
  DETAIL_LINE: 13,             // fontSize 9 + marginBottom 4 (approximate line height)
  DETAILS_MARGIN_BOTTOM: 20,
  BLOCK_MARGIN_BOTTOM: 40,
  
  // Signature row (from SignaturePage styles and SIG_PAGE_LAYOUT)
  SIG_FIELD_HEIGHT: 40,        // fieldLine height
  SIG_FIELD_WIDTH: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,  // 220
  DATE_FIELD_WIDTH: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH, // 120
  FIELD_GAP: 40,               // gap in signatureRow
};

/**
 * Count the number of detail lines for a signatory
 * Matches the logic in SignaturePage.getDetailLines()
 */
function countDetailLines(signatory: SignatoryInfo): number {
  let lines = 0;
  
  // Line 1: Title and/or Company
  if (signatory.title || signatory.company) {
    lines++;
  }
  
  // Line 2: Address
  if (signatory.address) {
    lines++;
  }
  
  // Line 3: Email
  if (signatory.email) {
    lines++;
  }
  
  return lines;
}

/**
 * Generates signature field metadata dynamically based on actual signatory content.
 * 
 * This function calculates positions by:
 * 1. Counting actual detail lines per signatory (varies based on available data)
 * 2. Calculating cumulative Y positions as we process each signatory block
 * 3. Matching the exact flow-based layout used in SignaturePage.tsx
 * 
 * @param signatories Array of signatory info with full details
 * @param numPages Total pages in the document (signature page is the last page)
 * @returns Array of signature field metadata with accurate positions
 */
export function generateDynamicSignatureFieldMetadata(
  signatories: SignatoryInfo[],
  numPages: number
): SignatureFieldMetadata[] {
  // Starting Y position on signature page (after page break)
  // This accounts for: page padding + section margin + header content
  let currentY = 
    DYNAMIC_LAYOUT.PAGE_PADDING + 
    DYNAMIC_LAYOUT.SECTION_MARGIN_TOP + 
    DYNAMIC_LAYOUT.HEADER_TITLE + 
    DYNAMIC_LAYOUT.HEADER_SUBTITLE + 
    DYNAMIC_LAYOUT.HEADER_MARGIN_BOTTOM;
  
  const fields: SignatureFieldMetadata[] = [];
  
  signatories.forEach((signatory, index) => {
    // Add block padding
    currentY += DYNAMIC_LAYOUT.BLOCK_PADDING_TOP;
    
    // Content before signature row
    // Party label (may or may not be rendered, but we account for space)
    currentY += DYNAMIC_LAYOUT.PARTY_LABEL;
    
    // Signatory name (always present)
    currentY += DYNAMIC_LAYOUT.PARTY_NAME;
    
    // Detail lines (variable based on signatory data)
    const detailLines = countDetailLines(signatory);
    if (detailLines > 0) {
      currentY += detailLines * DYNAMIC_LAYOUT.DETAIL_LINE;
      currentY += DYNAMIC_LAYOUT.DETAILS_MARGIN_BOTTOM;
    }
    
    // Now currentY is at the signature row
    const sigY = currentY;
    const partyId = (signatory.party || 'signatory').replace(/\s+/g, '_').toLowerCase();
    
    // Signature field (left side)
    fields.push({
      id: `sig-${index}-${partyId}`,
      type: 'signature',
      party: signatory.party || 'signatory',
      label: `${signatory.name} - Signature`,
      signatoryIndex: index,
      pageNumber: numPages, // Signature is on last page
      x: DYNAMIC_LAYOUT.PAGE_PADDING,
      y: sigY,
      width: DYNAMIC_LAYOUT.SIG_FIELD_WIDTH,
      height: DYNAMIC_LAYOUT.SIG_FIELD_HEIGHT,
    });
    
    // Date field (to the right of signature)
    fields.push({
      id: `date-${index}-${partyId}`,
      type: 'date',
      party: signatory.party || 'signatory',
      label: 'Date',
      signatoryIndex: index,
      pageNumber: numPages,
      x: DYNAMIC_LAYOUT.PAGE_PADDING + DYNAMIC_LAYOUT.SIG_FIELD_WIDTH + DYNAMIC_LAYOUT.FIELD_GAP,
      y: sigY,
      width: DYNAMIC_LAYOUT.DATE_FIELD_WIDTH,
      height: DYNAMIC_LAYOUT.SIG_FIELD_HEIGHT,
    });
    
    // Move past signature row and block margin for next signatory
    currentY += DYNAMIC_LAYOUT.SIG_FIELD_HEIGHT + DYNAMIC_LAYOUT.BLOCK_MARGIN_BOTTOM;
  });
  
  return fields;
}
