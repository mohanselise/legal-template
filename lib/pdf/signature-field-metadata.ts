import { SIG_PAGE_LAYOUT, getSignatureBlockPosition } from './signature-layout';

export interface SignatureFieldMetadata {
  id: string;
  type: 'signature' | 'text' | 'date';
  party: 'employer' | 'employee';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  signatoryIndex: number; 
}

export interface SignatoryInfo {
  party: 'employer' | 'employee';
  name: string;
  email: string;
  role?: string;
  phone?: string;
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
