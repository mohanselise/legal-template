import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  EmploymentAgreement,
  ContentBlock,
  ListItem,
  DefinitionItem,
  SignatureField,
} from '@/app/api/templates/employment-agreement/schema';

// You can register custom fonts here if needed:
// import { Font } from '@react-pdf/renderer';
// Font.register({ family: 'CustomFont', src: '/fonts/custom.ttf' });

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
    marginBottom: 48, // More whitespace
    paddingBottom: 16,
    borderBottom: '0.5pt solid #e5e7eb', // Subtle border
  },
  badge: {
    backgroundColor: '#f3f4f6', // Soft gray
    color: '#374151',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: '4pt 8pt',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
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
    marginBottom: 16,
  },
  
  // Parties Section
  partiesIntro: {
    marginBottom: 20,
    textAlign: 'left', // Ragged-right for better readability
  },
  partyBox: {
    marginBottom: 16,
    marginLeft: 24,
    paddingLeft: 16,
    borderLeft: '2pt solid #3b82f6', // Softer blue
    backgroundColor: '#f8fafc',
    padding: 12,
  },
  partyBoxEmployee: {
    borderLeft: '2pt solid #10b981', // Softer green
  },
  partyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  partyNameEmployee: {
    color: '#1e293b',
  },
  partyDetails: {
    fontSize: 9,
    marginBottom: 6,
  },
  partyDesignation: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 6,
  },
  andSeparator: {
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginVertical: 8,
  },
  
  // Recitals
  recitalsHeading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottom: '0.5pt solid #d1d5db',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#374151',
  },
  recitalParagraph: {
    marginBottom: 16,
    textAlign: 'left', // Ragged-right prevents rivers
    paddingLeft: 0, // No hard indent
  },

  // Articles - Strong visual hierarchy
  articleHeading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 36, // Extra space for major sections
    marginBottom: 18,
    paddingBottom: 10,
    paddingTop: 6,
    borderBottom: '1pt solid #3b82f6', // Stronger blue line for articles
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#111827', // Darkest for top-level headings
    backgroundColor: '#f8fafc', // Very subtle background
    paddingLeft: 8,
    paddingRight: 8,
  },
  
  // Sections - Enhanced for better scanning
  sectionHeading: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 24, // More space above for visual separation
    marginBottom: 12,
    color: '#1f2937', // Darker for better contrast
    paddingBottom: 4,
    borderBottom: '0.5pt solid #e5e7eb', // Subtle underline for scanning
  },
  sectionNumber: {
    color: '#3b82f6', // Blue number for visual cue
    marginRight: 8,
  },

  // Content Blocks
  paragraph: {
    marginBottom: 16, // Increased spacing between paragraphs
    textAlign: 'left', // Ragged-right for easier skimming
    lineHeight: 1.8, // Generous line spacing
  },
  paragraphIndent: {
    // Remove hard indents - use spacing instead
    marginLeft: 0,
    marginTop: 8, // Visual separation without indent
  },
  // First paragraph after heading - no extra space
  paragraphFirst: {
    marginTop: 0,
  },

  // Definitions - Highlighted for easy reference
  definitionContainer: {
    marginBottom: 16,
    padding: 12,
    borderLeft: '3pt solid #3b82f6', // Stronger left border for scanning
    backgroundColor: '#f0f9ff', // Very light blue background
    marginLeft: 12,
  },
  definitionTerm: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1e40af',
    fontSize: 11,
  },
  definitionText: {
    textAlign: 'left', // Ragged-right
    lineHeight: 1.7,
    color: '#374151',
  },
  
  // Lists - Clear hierarchy and spacing
  listItem: {
    marginBottom: 12, // More space between list items
    marginLeft: 24, // Less aggressive indent
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listNumber: {
    width: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#3b82f6', // Blue numbers for visual cue
    marginRight: 8,
  },
  listContent: {
    flex: 1,
    textAlign: 'left', // Ragged-right for lists
    lineHeight: 1.7,
  },
  subListItem: {
    marginLeft: 32, // Consistent with main list
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subListLetter: {
    width: 28,
    color: '#6b7280',
    marginRight: 8,
  },
  
  // Signatures - DocuSign-style Professional Design
  signatureSection: {
    marginTop: 60,
    paddingTop: 32,
    borderTop: '3pt solid #2563eb',
  },
  witnessClause: {
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 40,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#1e293b',
    lineHeight: 1.5,
  },
  signatureBlock: {
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#fafbfc',
    border: '1pt solid #e2e8f0',
    borderRadius: 6,
  },
  signaturePartyLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 8,
    paddingBottom: 8,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#1d4ed8',
    borderBottom: '1.5pt solid #2563eb',
  },
  signaturePartyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 18,
    color: '#0f172a',
  },
  signatureOverlayBox: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureOverlayLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    color: '#1d4ed8',
  },
  signatureOverlayName: {
    fontSize: 10,
    color: '#475569',
  },
  signatureSummary: {
    marginTop: 14,
    marginBottom: 10,
  },
  signatureSummaryName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#0f172a',
  },
  signatureSummaryRole: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },
  signatureDateRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  signatureDateBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#f1f5f9',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  signatureDateLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  signatureDatePlaceholder: {
    fontSize: 9,
    color: '#475569',
    marginTop: 4,
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

  // Text formatting
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
});

interface EmploymentAgreementPDFProps {
  document: EmploymentAgreement;
  docId?: string;
}

const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}) => {
  return [
    address.street,
    [address.city, address.state].filter(Boolean).join(', '),
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
};

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


const ContentBlockRenderer: React.FC<{
  block: ContentBlock;
  articleIndex: number;
  sectionIndex: number;
}> = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      const indent = block.formatting?.indent || 0;
      const content = typeof block.content === 'string' ? block.content : '';
      
      return (
        <Text
          style={[
            styles.paragraph,
            ...(indent > 0 ? [styles.paragraphIndent] : []),
          ]}
        >
          {content}
        </Text>
      );

    case 'definition':
      const definitions = block.content as DefinitionItem[];
      return (
        <View>
          {definitions.map((def, idx) => (
            <View key={idx} style={styles.definitionContainer}>
              <Text style={styles.definitionTerm}>
                {def.number && `${def.number} `}&ldquo;{def.term}&rdquo;
              </Text>
              <Text style={styles.definitionText}>{def.definition}</Text>
            </View>
          ))}
        </View>
      );

    case 'list':
      const items = block.content as ListItem[];
      return (
        <View>
          {items.map((item, idx) => (
            <View key={idx}>
              <View style={styles.listItem}>
                <Text style={styles.listNumber}>{idx + 1}.</Text>
                <Text style={styles.listContent}>{item.content}</Text>
              </View>
              {item.subItems && item.subItems.length > 0 && (
                <View>
                  {item.subItems.map((subItem, subIdx) => (
                    <View key={subIdx} style={styles.subListItem}>
                      <Text style={styles.subListLetter}>
                        {String.fromCharCode(97 + subIdx)}.
                      </Text>
                      <Text style={styles.listContent}>{subItem.content}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      );

    case 'clause':
      return (
        <Text style={[styles.paragraph, styles.paragraphIndent]}>
          {typeof block.content === 'string' ? block.content : ''}
        </Text>
      );

    default:
      return null;
  }
};

export const EmploymentAgreementPDF: React.FC<EmploymentAgreementPDFProps> = ({
  document: employmentAgreement,
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{employmentAgreement.metadata.title}</Text>
        </View>

        {/* Effective Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.effectiveDate}>
            Effective Date: {formatDate(employmentAgreement.metadata.effectiveDate)}
          </Text>
        </View>

        {/* Opening Paragraph with Parties */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.partiesIntro}>
            This Employment Agreement (the &ldquo;AGREEMENT&rdquo;) is entered into as of{' '}
            {formatDate(employmentAgreement.metadata.effectiveDate)}, by and between:
          </Text>

          {/* Employer */}
          <View style={styles.partyBox}>
            <Text style={styles.partyName}>
              {employmentAgreement.parties.employer.legalName}
            </Text>
            <Text style={styles.partyDetails}>
              {formatAddress(employmentAgreement.parties.employer.address)}
            </Text>
            {employmentAgreement.parties.employer.email && (
              <Text style={styles.partyDetails}>
                Email: {employmentAgreement.parties.employer.email}
              </Text>
            )}
            {employmentAgreement.parties.employer.phone && (
              <Text style={styles.partyDetails}>
                Phone: {employmentAgreement.parties.employer.phone}
              </Text>
            )}
            <Text style={styles.partyDesignation}>
              (hereinafter referred to as &ldquo;
              {employmentAgreement.parties.employer.designatedTitle || 'EMPLOYER'}&rdquo;)
            </Text>
          </View>

          <Text style={styles.andSeparator}>AND</Text>

          {/* Employee */}
          <View style={[styles.partyBox, styles.partyBoxEmployee]}>
            <Text style={[styles.partyName, styles.partyNameEmployee]}>
              {employmentAgreement.parties.employee.legalName}
            </Text>
            <Text style={styles.partyDetails}>
              {formatAddress(employmentAgreement.parties.employee.address)}
            </Text>
            {employmentAgreement.parties.employee.email && (
              <Text style={styles.partyDetails}>
                Email: {employmentAgreement.parties.employee.email}
              </Text>
            )}
            {employmentAgreement.parties.employee.phone && (
              <Text style={styles.partyDetails}>
                Phone: {employmentAgreement.parties.employee.phone}
              </Text>
            )}
            <Text style={styles.partyDesignation}>
              (hereinafter referred to as &ldquo;
              {employmentAgreement.parties.employee.designatedTitle || 'EMPLOYEE'}&rdquo;)
            </Text>
          </View>
        </View>

        {/* Recitals */}
        {employmentAgreement.recitals && employmentAgreement.recitals.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.recitalsHeading}>RECITALS</Text>
            {employmentAgreement.recitals.map((recital, index) => (
              <Text key={index} style={styles.recitalParagraph}>
                {recital}
              </Text>
            ))}
          </View>
        )}

        {/* Articles */}
        {employmentAgreement.articles.map((article, articleIndex) => (
          <View key={article.number} style={{ marginBottom: 20 }} wrap={false}>
            <Text style={styles.articleHeading}>
              ARTICLE {article.number}. {article.title}
            </Text>

            {article.sections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={{ marginBottom: 12 }}>
                {section.title && (
                  <Text style={styles.sectionHeading}>
                    {section.number && (
                      <Text style={styles.sectionNumber}>{section.number} </Text>
                    )}
                    {section.title}
                  </Text>
                )}
                {section.content.map((block, blockIndex) => (
                  <ContentBlockRenderer
                    key={blockIndex}
                    block={block}
                    articleIndex={articleIndex}
                    sectionIndex={sectionIndex}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* Signature Section - With Party Info, but no signature/date boxes */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.witnessClause}>
            IN WITNESS WHEREOF, THE PARTIES HAVE EXECUTED THIS AGREEMENT
            {'\n'}AS OF THE DATE FIRST WRITTEN ABOVE.
          </Text>

          {employmentAgreement.signatures.map((signature, index) => {
            const nameField = signature.fields.find(
              (field) => field.type === 'name'
            );
            const titleField = signature.fields.find(
              (field) => field.type === 'title'
            );
            const displayName =
              (nameField?.value && nameField.value.trim()) ||
              signature.partyName;
            const displayRole =
              (titleField?.value && titleField.value.trim()) ||
              (signature.party === 'employer'
                ? 'Authorized Signatory'
                : 'Employee');

            return (
              <View key={index} style={styles.signatureBlock}>
                <Text style={styles.signaturePartyLabel}>
                  {signature.party === 'employer' ? 'EMPLOYER' : 'EMPLOYEE'}
                </Text>

                <Text style={styles.signaturePartyName}>
                  {signature.partyName}
                </Text>

                {/* Name and Title - shown in PDF */}
                <View style={styles.signatureSummary}>
                  <Text style={styles.signatureSummaryName}>{displayName}</Text>
                  {displayRole && (
                    <Text style={styles.signatureSummaryRole}>
                      {displayRole}
                    </Text>
                  )}
                </View>

                {/* Signature and Date boxes are NOT rendered - they will be overlays */}
              </View>
            );
          })}
        </View>

        {/* Footer - Production Ready */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <Text>
              {employmentAgreement.metadata.title}
            </Text>
            <Text>
              Page <Text render={({ pageNumber }) => `${pageNumber}`} /> of{' '}
              <Text render={({ totalPages }) => `${totalPages}`} />
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
