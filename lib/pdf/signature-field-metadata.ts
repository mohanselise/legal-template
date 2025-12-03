import { SIG_PAGE_LAYOUT, getSignatureBlockPosition } from './signature-layout';

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
}

export function generateSignatureFieldMetadata(
  signatories: SignatoryInfo[],
  numPages: number
): SignatureFieldMetadata[] {
  const lastPage = numPages;

  return signatories.flatMap((signatory, index) => {
    const blockTop = getSignatureBlockPosition(index);
    
    // Absolute X position relative to page
    const blockLeft = SIG_PAGE_LAYOUT.MARGIN_X;
    
    const signatureField: SignatureFieldMetadata = {
      id: `sig-${index}-${signatory.party}`,
      type: 'signature',
      party: signatory.party,
      label: `${signatory.name} - Signature`,
      pageNumber: lastPage,
      signatoryIndex: index,
      x: blockLeft + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
      y: blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET,
      width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
      height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    };

    const dateField: SignatureFieldMetadata = {
      id: `date-${index}-${signatory.party}`,
      type: 'date',
      party: signatory.party,
      label: 'Date',
      pageNumber: lastPage,
      signatoryIndex: index,
      x: blockLeft + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
      y: blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET, // Same Y as signature box start
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
