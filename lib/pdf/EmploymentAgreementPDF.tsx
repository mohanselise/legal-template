/**
 * Employment Agreement PDF Component - Legacy Re-export
 * 
 * This file re-exports the generic LegalDocumentPDF component
 * for backward compatibility with existing imports.
 * 
 * @deprecated Use LegalDocumentPDF directly from '@/lib/pdf/LegalDocumentPDF'
 */

import React from 'react';
import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import { 
  LegalDocumentPDF, 
  type LegalDocumentPDFProps 
} from './LegalDocumentPDF';
import type { LegalDocument, EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';

// Re-export the generic component as the employment-specific name
export { LegalDocumentPDF };
export type { LegalDocumentPDFProps };

// Styles for legacy document error message
const errorStyles = StyleSheet.create({
  page: {
    padding: 72,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
});

// Type guard to distinguish between new and legacy schema
function isLegacyDocument(doc: LegalDocument | EmploymentAgreement): doc is EmploymentAgreement {
  return 'articles' in doc;
}

/**
 * Employment Agreement PDF Props
 * 
 * @deprecated Use LegalDocumentPDFProps instead
 */
export interface EmploymentAgreementPDFProps {
  document: LegalDocument | EmploymentAgreement;
  docId?: string;
}

/**
 * Employment Agreement PDF Component
 * 
 * Wrapper around LegalDocumentPDF that handles legacy document format.
 * New code should use LegalDocumentPDF directly.
 * 
 * @deprecated Use LegalDocumentPDF directly from '@/lib/pdf/LegalDocumentPDF'
 */
export const EmploymentAgreementPDF: React.FC<EmploymentAgreementPDFProps> = ({
  document,
  docId,
}) => {
  // Handle Legacy Documents
  if (isLegacyDocument(document)) {
    return (
      <Document>
        <Page style={errorStyles.page}>
          <Text>Legacy document format is no longer supported. Please regenerate the document.</Text>
        </Page>
      </Document>
    );
  }

  // Delegate to generic component
  return <LegalDocumentPDF document={document} docId={docId} />;
};
