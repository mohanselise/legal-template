import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { SignatoryData, SignaturePageConfig } from '@/app/api/templates/employment-agreement/schema';
import { SIG_PAGE_LAYOUT } from '../signature-layout';

/**
 * Default configuration for signature page
 * Used when AI doesn't provide custom values
 */
const DEFAULT_SIGNATURE_CONFIG: Required<SignaturePageConfig> = {
  title: 'Signatures',
  attestationClause: 'IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.',
  signatureLabel: 'Signature',
  dateLabel: 'Date',
};

/**
 * Inline-flow signature page styles
 * Uses relative positioning so it integrates with document flow
 * and doesn't create blank pages
 */
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
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
  
  // Signature block container with FIXED HEIGHT for deterministic overlay positioning
  // The fixed height ensures overlay calculations match actual PDF rendering
  // Values must stay in sync with SIG_PAGE_LAYOUT in signature-layout.ts
  signatureBlock: {
    height: SIG_PAGE_LAYOUT.BLOCK_HEIGHT,      // Fixed height for consistent positioning
    marginBottom: SIG_PAGE_LAYOUT.BLOCK_GAP,   // Gap between blocks
    paddingTop: 20,
  },
  
  // Elements within a block
  partyLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  partyDetails: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginBottom: 20,
  },
  partyDetailLine: {
    marginBottom: 4,
  },
  
  // Signature and date row
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 40,
  },
  signatureField: {
    width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
  },
  dateField: {
    width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
  },
  fieldLine: {
    borderBottom: '1pt solid #000',
    height: 40,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
});

interface SignaturePageProps {
  signatories: SignatoryData[];
  /** Optional AI-controlled configuration for jurisdiction-appropriate content */
  config?: SignaturePageConfig;
}

export const SignaturePage: React.FC<SignaturePageProps> = ({ 
  signatories,
  config = {},
}) => {
  // Merge provided config with defaults
  const { title, attestationClause, signatureLabel, dateLabel } = {
    ...DEFAULT_SIGNATURE_CONFIG,
    ...config,
  };
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {attestationClause && (
          <Text style={styles.subtitle}>{attestationClause}</Text>
        )}
      </View>

      {/* Signature Blocks - using relative positioning for proper flow */}
      {signatories.map((signatory, index) => {
        const detailLines = getDetailLines(signatory);
        const partyLabel = getPartyLabel(signatory);
        
        return (
          <View 
            key={index} 
            style={styles.signatureBlock}
            wrap={false}
          >
            {/* Party Type Label (e.g., EMPLOYER, DISCLOSING PARTY) - only render if meaningful */}
            {partyLabel && (
              <Text style={styles.partyLabel}>
                {partyLabel}
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

            {/* Signature and Date Fields Row */}
            <View style={styles.signatureRow}>
              {/* Signature Field */}
              <View style={styles.signatureField}>
                <View style={styles.fieldLine} />
                <Text style={styles.fieldLabel}>{signatureLabel}</Text>
              </View>

              {/* Date Field */}
              <View style={styles.dateField}>
                <View style={styles.fieldLine} />
                <Text style={styles.fieldLabel}>{dateLabel}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};
