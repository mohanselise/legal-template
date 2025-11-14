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
} from '@/app/api/templates/employment-agreement/schema';

// You can register custom fonts here if needed:
// import { Font } from '@react-pdf/renderer';
// Font.register({ family: 'CustomFont', src: '/fonts/custom.ttf' });

// Professional Legal Document Styles
const styles = StyleSheet.create({
  page: {
    size: 'LETTER', // US Letter (8.5" x 11")
    padding: 72, // 1 inch margins
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.6,
  },
  
  // Header
  header: {
    marginBottom: 36,
    paddingBottom: 24,
    borderBottom: '3pt solid #1e3a8a', // Oxford blue
  },
  badge: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    fontSize: 8,
    fontFamily: 'Times-Bold',
    padding: '6pt 12pt',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  metadata: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Document Body
  effectiveDate: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    marginBottom: 16,
  },
  
  // Parties Section
  partiesIntro: {
    marginBottom: 16,
    textAlign: 'justify',
  },
  partyBox: {
    marginBottom: 12,
    marginLeft: 24,
    paddingLeft: 12,
    borderLeft: '3pt solid #1e40af',
  },
  partyBoxEmployee: {
    borderLeft: '3pt solid #65a30d',
  },
  partyName: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    marginBottom: 8,
    color: '#1e3a8a',
  },
  partyNameEmployee: {
    color: '#65a30d',
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
    fontSize: 14,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2pt solid #1e40af',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  recitalParagraph: {
    marginBottom: 12,
    textAlign: 'justify',
    textIndent: 24,
  },
  
  // Articles
  articleHeading: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    marginTop: 24,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '3pt solid #1e40af',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  
  // Sections
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionNumber: {
    color: '#6b7280',
  },
  
  // Content Blocks
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  paragraphIndent: {
    textIndent: 36,
  },
  
  // Definitions
  definitionContainer: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeft: '3pt solid #1e40af',
  },
  definitionTerm: {
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  definitionText: {
    textAlign: 'justify',
  },
  
  // Lists
  listItem: {
    marginBottom: 8,
    marginLeft: 36,
    flexDirection: 'row',
  },
  listNumber: {
    width: 24,
    fontFamily: 'Times-Bold',
    color: '#1e40af',
  },
  listContent: {
    flex: 1,
    textAlign: 'justify',
  },
  subListItem: {
    marginLeft: 24,
    marginTop: 6,
    flexDirection: 'row',
  },
  subListLetter: {
    width: 20,
    color: '#6b7280',
  },
  
  // Signatures
  signatureSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: '3pt solid #1e3a8a',
  },
  witnessClause: {
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    fontSize: 10,
    marginBottom: 24,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  signatureBlock: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1pt solid #d1d5db',
  },
  signaturePartyLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  signaturePartyName: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginBottom: 12,
  },
  signatureField: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    width: 80,
    color: '#6b7280',
  },
  signatureLine: {
    flex: 1,
    borderBottom: '1pt solid #1e3a8a',
    minHeight: 20,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 72,
    right: 72,
    borderTop: '1pt solid #d1d5db',
    paddingTop: 8,
    fontSize: 8,
    color: '#6b7280',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Text formatting
  bold: {
    fontFamily: 'Times-Bold',
  },
  italic: {
    fontFamily: 'Times-Italic',
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
  return new Date(dateString).toLocaleDateString('en-US', {
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
  const docId = `DOC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text>LEGAL DOCUMENT</Text>
          </View>
          <Text style={styles.title}>{employmentAgreement.metadata.title}</Text>
          <Text style={styles.metadata}>
            AI-Enhanced Draft • {formatDate(employmentAgreement.metadata.effectiveDate)} • Doc ID: {docId}
          </Text>
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

        {/* Signature Section */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.witnessClause}>
            IN WITNESS WHEREOF, the parties have executed this Agreement as of the date
            first written above.
          </Text>

          {employmentAgreement.signatures.map((signature, index) => (
            <View key={index} style={styles.signatureBlock}>
              <Text style={styles.signaturePartyLabel}>
                {signature.party === 'employer' ? 'EMPLOYER:' : 'EMPLOYEE:'}
              </Text>
              <Text style={styles.signaturePartyName}>{signature.partyName}</Text>
              {signature.fields.map((field, fieldIndex) => (
                <View key={fieldIndex} style={styles.signatureField}>
                  <Text style={styles.signatureLabel}>{field.label}:</Text>
                  <View style={styles.signatureLine} />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <Text>
              {employmentAgreement.metadata.title} • Prepared for{' '}
              {employmentAgreement.parties.employee.legalName}
            </Text>
            <Text>
              Page <Text render={({ pageNumber }) => `${pageNumber}`} /> of{' '}
              <Text render={({ totalPages }) => `${totalPages}`} />
            </Text>
          </View>
          <Text style={{ fontSize: 7, marginTop: 4, textAlign: 'center' }}>
            Generated: {formatDate(employmentAgreement.metadata.generatedAt)} • Doc ID: {docId} • Confidential & Proprietary
          </Text>
        </View>
      </Page>
    </Document>
  );
};
