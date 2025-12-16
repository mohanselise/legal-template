/**
 * Generic Legal Document PDF Renderer
 * 
 * Renders any LegalDocument to PDF format using @react-pdf/renderer.
 * This component works with the block-based document schema and supports
 * any template type (employment agreements, NDAs, etc.).
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';
import { BlockRenderer } from './components/BlockRenderer';
import { SignaturePage } from './components/SignaturePage';

// ==========================================
// STYLES
// ==========================================

/**
 * Professional Legal Document Styles
 * DocuSign-inspired clean design with proper legal formatting
 */
const styles = StyleSheet.create({
  page: {
    size: 'LETTER', // US Letter (8.5" x 11")
    padding: 72, // 1 inch margins
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 32,
    paddingBottom: 12,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  title: {
    fontSize: 18,
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
    fontFamily: 'Helvetica',
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

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format date string for display in document
 */
const formatDate = (dateString: string): string => {
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

// ==========================================
// COMPONENT
// ==========================================

export interface LegalDocumentPDFProps {
  /** The legal document to render */
  document: LegalDocument;
  /** Optional document ID for tracking */
  docId?: string;
  /** Whether to include signature page (default: true) */
  includeSignaturePage?: boolean;
  /** Custom page size (default: 'LETTER') */
  pageSize?: 'LETTER' | 'A4' | 'LEGAL';
}

/**
 * Generic Legal Document PDF Component
 * 
 * Renders a LegalDocument to PDF format with:
 * - Professional header with document title
 * - Effective date
 * - Block-based content rendering
 * - Signature page (optional)
 * - Page numbers in footer
 */
export const LegalDocumentPDF: React.FC<LegalDocumentPDFProps> = ({
  document,
  docId,
  includeSignaturePage = true,
  pageSize = 'LETTER',
}) => {
  // Validate document has required fields
  if (!document?.metadata?.title || !document?.content) {
    return (
      <Document>
        <Page size={pageSize} style={styles.page}>
          <Text>Invalid document format. Please regenerate the document.</Text>
        </Page>
      </Document>
    );
  }

  // Check if we should include signatures in the document flow
  const hasSignatories = includeSignaturePage && document.signatories && document.signatories.length > 0;

  return (
    <Document>
      {/* Single Document with content and signatures flowing together */}
      <Page size={pageSize} style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{document.metadata.title}</Text>
        </View>

        {/* Effective Date */}
        {document.metadata.effectiveDate && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.effectiveDate}>
              {document.metadata.effectiveDateLabel || 'Effective Date:'} {formatDate(document.metadata.effectiveDate)}
            </Text>
          </View>
        )}

        {/* Main Content Blocks */}
        {document.content.map((block, index) => (
          <BlockRenderer key={block.id || index} block={block} level={0} />
        ))}

        {/* Signature Section - flows naturally after content, breaks to new page if needed */}
        {hasSignatories && (
          <View break style={{ marginTop: 40 }}>
            <SignaturePage signatories={document.signatories!} />
          </View>
        )}

        {/* Footer on all pages */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <Text>{document.metadata.title}</Text>
            <Text render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} of ${totalPages}`
            )} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default LegalDocumentPDF;

