import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { SignatoryData } from '@/app/api/templates/employment-agreement/schema';
import { SIG_PAGE_LAYOUT, getSignatureBlockPosition, CONTENT_WIDTH } from '../signature-layout';

const styles = StyleSheet.create({
  page: {
    position: 'relative', // Allows absolute positioning of children
  },
  header: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.HEADER_Y,
    left: SIG_PAGE_LAYOUT.MARGIN_X,
    width: CONTENT_WIDTH,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#444',
    textAlign: 'center',
  },
  
  // Elements within a block (aligned with signature fields)
  partyLabel: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.LABEL_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    textTransform: 'uppercase',
  },
  partyName: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.NAME_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  partyDetails: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.DETAILS_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
  partyDetailLine: {
    marginBottom: 4,
  },
  
  // Visual Lines (centered horizontally)
  sigLine: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.LINE_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
    borderBottom: '1pt solid #000',
  },
  dateLine: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.LINE_Y,
    left: SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
    width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
    borderBottom: '1pt solid #000',
  },
  fieldLabelSig: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.FIELD_LABEL_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
  fieldLabelDate: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.FIELD_LABEL_Y,
    left: SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
});

interface SignaturePageProps {
  signatories: SignatoryData[];
}

export const SignaturePage: React.FC<SignaturePageProps> = ({ signatories }) => {
  /**
   * Format any party type string for display
   * Converts camelCase, snake_case, kebab-case → TITLE CASE
   * 
   * Examples:
   *   "disclosingParty" → "DISCLOSING PARTY"
   *   "receiving_party" → "RECEIVING PARTY"
   *   "service-provider" → "SERVICE PROVIDER"
   *   "EMPLOYER" → "EMPLOYER"
   */
  const formatPartyType = (party: string): string => {
    return party
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → camel Case
      .replace(/[_-]/g, ' ')                 // snake_case/kebab-case → spaces
      .toUpperCase()
      .trim();
  };

  /**
   * Check if a value is generic/empty and should be skipped
   */
  const isGeneric = (val: string | undefined): boolean =>
    !val || val.trim().length === 0 || val.trim().toLowerCase() === 'other';

  /**
   * Get the display label for a signatory's party type
   * Uses AI-provided party type directly, with smart fallbacks
   * Priority: formatted party → title → role → company → empty (hide label)
   */
  const getPartyLabel = (signatory: SignatoryData): string => {
    const party = signatory.party?.trim();
    
    // 1. Use the party type from AI (skip generic "other")
    if (!isGeneric(party)) {
      return formatPartyType(party!);
    }

    // 2. Fall back to title if meaningful (skip "other")
    if (!isGeneric(signatory.title)) {
      return signatory.title!.trim().toUpperCase();
    }

    // 3. Fall back to role if meaningful (skip "other")
    if (!isGeneric(signatory.role)) {
      return signatory.role!.trim().toUpperCase();
    }

    // 4. Fall back to company name
    if (signatory.company && signatory.company.trim().length > 0) {
      return `FOR ${signatory.company.trim().toUpperCase()}`;
    }

    // 5. Return empty - hide label if no meaningful info
    return '';
  };

  /**
   * Build the detail lines to show under the signatory name
   * Shows: title/role, company, email (if available and appropriate)
   */
  const getDetailLines = (signatory: SignatoryData): string[] => {
    const lines: string[] = [];
    
    // Line 1: Title and/or Company
    const titleCompanyParts: string[] = [];
    if (signatory.title && signatory.title.trim()) {
      titleCompanyParts.push(signatory.title.trim());
    }
    if (signatory.company && signatory.company.trim()) {
      titleCompanyParts.push(signatory.company.trim());
    }
    if (titleCompanyParts.length > 0) {
      lines.push(titleCompanyParts.join(' • '));
    }

    // Line 2: Address (if available)
    if (signatory.address && signatory.address.trim()) {
      lines.push(signatory.address.trim());
    }

    // Line 3: Email (useful for identification)
    if (signatory.email && signatory.email.trim()) {
      lines.push(signatory.email.trim());
    }

    return lines;
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Signatures</Text>
        <Text style={styles.subtitle}>
          IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
        </Text>
      </View>

      {/* Absolute Positioned Signature Blocks */}
      {signatories.map((signatory, index) => {
        const blockTop = getSignatureBlockPosition(index);
        const detailLines = getDetailLines(signatory);
        
        return (
          <View 
            key={index} 
            style={{
              position: 'absolute',
              top: blockTop,
              left: SIG_PAGE_LAYOUT.MARGIN_X,
              width: CONTENT_WIDTH,
              height: SIG_PAGE_LAYOUT.BLOCK_HEIGHT,
            }}
          >
            {/* Party Type Label (e.g., EMPLOYER, DISCLOSING PARTY) - only render if meaningful */}
            {getPartyLabel(signatory) && (
              <Text style={styles.partyLabel}>
                {getPartyLabel(signatory)}
              </Text>
            )}
            
            {/* Signatory Name */}
            <Text style={styles.partyName}>{signatory.name}</Text>
            
            {/* Additional Details (title, company, email, etc.) */}
            {detailLines.length > 0 && (
              <View style={styles.partyDetails}>
                {detailLines.map((line, lineIndex) => (
                  <Text key={lineIndex} style={styles.partyDetailLine}>
                    {line}
                  </Text>
                ))}
              </View>
            )}

            {/* Visual Signature Line */}
            <View style={styles.sigLine} />
            <Text style={styles.fieldLabelSig}>Signature</Text>

            {/* Visual Date Line */}
            <View style={styles.dateLine} />
            <Text style={styles.fieldLabelDate}>Date</Text>
          </View>
        );
      })}
    </View>
  );
};
