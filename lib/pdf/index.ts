/**
 * PDF Generation Exports
 * 
 * Central export point for PDF rendering components.
 */

// Generic Legal Document PDF (preferred)
export { 
  LegalDocumentPDF, 
  type LegalDocumentPDFProps 
} from './LegalDocumentPDF';

// Employment Agreement PDF (legacy - for backward compatibility)
export { 
  EmploymentAgreementPDF, 
  type EmploymentAgreementPDFProps 
} from './EmploymentAgreementPDF';

// Block renderer components
export { BlockRenderer } from './components/BlockRenderer';
export { SignaturePage } from './components/SignaturePage';

// Signature utilities
export { 
  generateSignatureFieldMetadata,
  createMetadataPayload,
} from './signature-field-metadata';
export { 
  SIG_PAGE_LAYOUT,
  CONTENT_WIDTH,
  getSignatureBlockPosition,
} from './signature-layout';

