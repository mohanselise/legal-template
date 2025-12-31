/**
 * JSON Schema for Employment Agreement
 * This structure ensures consistent, well-formatted legal documents
 */

// ==========================================
// NEW BLOCK-BASED SCHEMA
// ==========================================

export type BlockType = 
  | 'document'      // Root container
  | 'article'       // Level 1 container (e.g., "Article 1")
  | 'section'       // Level 2 container (e.g., "1.1")
  | 'paragraph'     // Standard text
  | 'list'          // Ordered/Unordered lists
  | 'list_item'     // Individual list items
  | 'definition'    // Term/Definition pairs
  | 'definition_item' // Individual definition item
  | 'table'         // Simple tabular data
  | 'table_row'     // Table row
  | 'table_cell'    // Table cell
  | 'page_break';   // Explicit control

export interface DocumentBlock {
  type: BlockType;
  id?: string;
  props?: Record<string, any>; // Flexible attributes (title, number, style, etc.)
  children?: DocumentBlock[];
  text?: string; // For leaf nodes like paragraph, table_cell
}

/**
 * Configuration for AI-controlled signature page content
 * Allows jurisdiction-appropriate attestation language and labels
 */
export interface SignaturePageConfig {
  /** Section title (default: "Signatures") */
  title?: string;
  /** Attestation clause (default: "IN WITNESS WHEREOF...") */
  attestationClause?: string;
  /** Signature field label (default: "Signature") */
  signatureLabel?: string;
  /** Date field label (default: "Date") */
  dateLabel?: string;
}

/**
 * Letterhead configuration for document background
 */
export interface LetterheadConfig {
  /** Base64 encoded image data URL */
  imageDataUrl: string;
  /** Page width in points (72 DPI) */
  pageWidth: number;
  /** Page height in points (72 DPI) */
  pageHeight: number;
  /** Content area where text should be placed */
  contentArea: {
    /** Left margin in points */
    x: number;
    /** Top margin in points */
    y: number;
    /** Content width in points */
    width: number;
    /** Content height in points */
    height: number;
  };
}

export interface LegalDocument {
  metadata: DocumentMetadata;
  content: DocumentBlock[]; // The main body content (Articles, Sections, etc.)
  signatories: SignatoryData[]; // Data for the signature page
  /** Optional AI-controlled signature page configuration */
  signaturePageConfig?: SignaturePageConfig;
  /** Optional letterhead configuration for document background */
  letterhead?: LetterheadConfig;
}

/**
 * Signatory data for signature pages
 * The AI should extract this from form data and return appropriate signatories
 * based on the document type and parties involved.
 */
export interface SignatoryData {
  /** 
   * Party type - flexible string to support any document type:
   * - Employment: 'employer', 'employee'
   * - NDA: 'disclosingParty', 'receivingParty'
   * - Contract: 'client', 'vendor', 'contractor'
   * - Generic: 'witness', 'guarantor', 'other'
   */
  party: string;
  /** Full legal name of the signatory */
  name: string;
  /** Title or role (e.g., "CEO", "Software Engineer") */
  title?: string;
  /** Display role for the signature block */
  role?: string;
  /** Email address for signature notification */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Company or organization name */
  company?: string;
  /** Signatory's address */
  address?: string;
}

// ==========================================
// LEGACY SCHEMA (Kept for transition)
// ==========================================

export interface EmploymentAgreement {
  metadata: DocumentMetadata;
  parties: Parties;
  recitals: string[];
  articles: Article[];
  signatures: SignatureBlock[];
}

export interface DocumentMetadata {
  title: string;
  effectiveDate: string;
  effectiveDateLabel?: string; // Optional label (defaults to "Effective Date:" if not provided)
  documentType: string; // Flexible document type (e.g., 'employment-agreement', 'nda', 'contract')
  jurisdiction?: string;
  generatedAt: string;
  /** Date format locale for rendering (e.g., "en-US", "en-GB", "de-DE") */
  dateLocale?: string;
  /** Page number format template (e.g., "Page {page} of {total}", "Seite {page} von {total}") */
  pageNumberFormat?: string;
}

export interface Parties {
  employer: Party;
  employee: Party;
  // ...
}

export interface Party {
  legalName: string;
  address: Address;
  email?: string;
  phone?: string;
  designatedTitle?: string; // e.g., "EMPLOYER", "EMPLOYEE"
  additionalInfo?: {
    industry?: string;
    website?: string;
    contactPerson?: string;
  };
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Legacy structures
export interface Article {
  number: number;
  title: string;
  sections: Section[];
}

export interface Section {
  number?: string;
  title?: string;
  content: ContentBlock[];
}

export interface ContentBlock {
  type: 'paragraph' | 'list' | 'definition' | 'table' | 'clause';
  content: string | ListItem[] | DefinitionItem[] | TableRow[];
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    indent?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

export interface ListItem {
  marker?: string;
  content: string;
  subItems?: ListItem[];
}

export interface DefinitionItem {
  number?: string;
  term: string;
  definition: string;
}

export interface TableRow {
  cells: string[];
}

export interface SignatureBlock {
  party: 'employer' | 'employee';
  partyName: string;
  fields: SignatureField[];
}

export interface SignatureField {
  label: string;
  type: 'signature' | 'name' | 'title' | 'date';
  value?: string;
}
