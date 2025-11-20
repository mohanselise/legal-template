import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { LegalDocument, EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import { BlockRenderer } from './components/BlockRenderer';
import { SignaturePage } from './components/SignaturePage';

// Professional Legal Document Styles - DocuSign-inspired clean design
const styles = StyleSheet.create({
  page: {
    size: 'LETTER', // US Letter (8.5" x 11")
    padding: 72, // 1 inch margins
    fontFamily: 'Helvetica',
    fontSize: 10.5, // Slightly smaller for more content per page
    lineHeight: 1.6, // Comfortable reading, not too loose
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 32, // Reduced whitespace
    paddingBottom: 12,
    borderBottom: '0.5pt solid #e5e7eb', // Subtle border
  },
  title: {
    fontSize: 18, // Slightly smaller, less aggressive
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#111827',
  },
  
  // Document Body
  effectiveDate: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    marginBottom: 12,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 72,
    right: 72,
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#9ca3af',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

// Type guard to distinguish between new and legacy schema
function isLegacyDocument(doc: LegalDocument | EmploymentAgreement): doc is EmploymentAgreement {
  return 'articles' in doc;
}

interface EmploymentAgreementPDFProps {
  document: LegalDocument | EmploymentAgreement;
  docId?: string;
}

const formatDate = (dateString: string) => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const EmploymentAgreementPDF: React.FC<EmploymentAgreementPDFProps> = ({
  document,
  docId,
}) => {
  
  // Handle Legacy Documents (Keep for backward compatibility if needed, or just error out)
  // For now, we'll assume we're migrating everything to the new schema
  // but providing a fallback message if old data is passed
  if (isLegacyDocument(document)) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Legacy document format is no longer supported. Please regenerate the document.</Text>
        </Page>
      </Document>
    );
  }

  // New Block-Based Renderer
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{document.metadata.title}</Text>
        </View>

        {/* Effective Date */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.effectiveDate}>
            Effective Date: {formatDate(document.metadata.effectiveDate)}
          </Text>
        </View>

        {/* Main Content Blocks */}
        {document.content.map((block, index) => (
          <BlockRenderer key={block.id || index} block={block} level={0} />
        ))}

        {/* Footer on content pages */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <Text>{document.metadata.title}</Text>
            <Text>
              Page <Text render={({ pageNumber }) => `${pageNumber}`} />
            </Text>
          </View>
        </View>
      </Page>

      {/* Signature Page - Always on a new page */}
      <Page size="LETTER" style={styles.page}>
         {/* We can reuse the same footer or a different one */}
        <SignaturePage signatories={document.signatories} />
        
        <View style={styles.footer} fixed>
           <View style={styles.footerContent}>
            <Text>{document.metadata.title}</Text>
            <Text>
              Page <Text render={({ pageNumber }) => `${pageNumber}`} />
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
