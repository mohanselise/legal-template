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
