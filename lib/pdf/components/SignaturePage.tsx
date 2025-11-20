import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { SignatoryData } from '@/app/api/templates/employment-agreement/schema';

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingHorizontal: 50,
  },
  header: {
    marginBottom: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#444',
  },
  
  // Signature Blocks Container
  signaturesContainer: {
    flexDirection: 'column',
    gap: 40,
  },
  
  // Individual Signature Block
  signatureBlock: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
  },
  partyLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af', // Blue-800
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  partyTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#64748b', // Slate-500
    marginBottom: 15,
  },
  
  // The area where the overlay will go
  signatureArea: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  
  // Visual placeholders for the fields (helpful for users to know where to sign)
  fieldPlaceholder: {
    flex: 1,
  },
  line: {
    borderBottom: '1pt solid #000',
    marginTop: 30,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
  
  // Date field specific
  datePlaceholder: {
    width: 120,
  },
});

interface SignaturePageProps {
  signatories: SignatoryData[];
}

export const SignaturePage: React.FC<SignaturePageProps> = ({ signatories }) => {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Signatures</Text>
        <Text style={styles.subtitle}>
          IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
        </Text>
      </View>

      <View style={styles.signaturesContainer}>
        {signatories.map((signatory, index) => (
          <View key={index} style={styles.signatureBlock} wrap={false}>
            <Text style={styles.partyLabel}>
              {signatory.party === 'employer' ? 'EMPLOYER' : 'EMPLOYEE'}
            </Text>
            
            <Text style={styles.partyName}>{signatory.name}</Text>
            {signatory.title && (
              <Text style={styles.partyTitle}>{signatory.title}</Text>
            )}

            <View style={styles.signatureArea}>
              {/* Signature Field */}
              <View style={styles.fieldPlaceholder}>
                <View style={styles.line} />
                <Text style={styles.fieldLabel}>Signature</Text>
              </View>

              {/* Date Field */}
              <View style={styles.datePlaceholder}>
                <View style={styles.line} />
                <Text style={styles.fieldLabel}>Date</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

