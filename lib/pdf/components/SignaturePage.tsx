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
  partyTitle: {
    position: 'absolute',
    top: SIG_PAGE_LAYOUT.TITLE_Y,
    left: SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#64748b',
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

// Party type display name mapping
const PARTY_LABELS: Record<string, string> = {
  employer: 'EMPLOYER',
  employee: 'EMPLOYEE',
  witness: 'WITNESS',
  guarantor: 'GUARANTOR',
  contractor: 'CONTRACTOR',
  client: 'CLIENT',
  vendor: 'VENDOR',
  disclosingParty: 'DISCLOSING PARTY',
  receivingParty: 'RECEIVING PARTY',
  disclosing_party: 'DISCLOSING PARTY',
  receiving_party: 'RECEIVING PARTY',
  other: 'SIGNATORY',
};

export const SignaturePage: React.FC<SignaturePageProps> = ({ signatories }) => {
  const getPartyLabel = (signatory: SignatoryData) => {
    // Check known party types first
    const knownLabel = PARTY_LABELS[signatory.party?.toLowerCase()];
    if (knownLabel && knownLabel !== 'SIGNATORY') {
      return knownLabel;
    }

    // Use party as-is if it looks like a valid label
    const upperParty = signatory.party?.toUpperCase();
    if (upperParty && upperParty !== 'OTHER' && upperParty.length > 1) {
      // Convert camelCase/snake_case to TITLE CASE
      return upperParty
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .toUpperCase();
    }

    // Fall back to title/role
    if (signatory.title && signatory.title.trim().length > 0) {
      return signatory.title.trim().toUpperCase();
    }

    if (signatory.role && signatory.role.trim().length > 0) {
      return signatory.role.trim().toUpperCase();
    }

    return 'SIGNATORY';
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
            <Text style={styles.partyLabel}>
              {getPartyLabel(signatory)}
            </Text>
            
            <Text style={styles.partyName}>{signatory.name}</Text>
            {(signatory.title || signatory.company) && (
              <Text style={styles.partyTitle}>
                {[signatory.title, signatory.company].filter(Boolean).join(' • ')}
              </Text>
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
