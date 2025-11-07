/**
 * JSON Schema for Employment Agreement
 * This structure ensures consistent, well-formatted legal documents
 */

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
  documentType: 'employment-agreement';
  jurisdiction?: string;
  generatedAt: string;
}

export interface Parties {
  employer: Party;
  employee: Party;
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

export interface Article {
  number: number;
  title: string;
  sections: Section[];
}

export interface Section {
  number?: string; // e.g., "4.1", "4.2" or null for unnumbered
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
  marker?: string; // e.g., "a.", "i.", "1."
  content: string;
  subItems?: ListItem[];
}

export interface DefinitionItem {
  number?: string; // Optional subsection number like "1.1", "1.2"
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

// Example structure for validation
export const EMPLOYMENT_AGREEMENT_TEMPLATE: EmploymentAgreement = {
  metadata: {
    title: 'Employment Agreement',
    effectiveDate: '2025-01-01',
    documentType: 'employment-agreement',
    generatedAt: new Date().toISOString(),
  },
  parties: {
    employer: {
      legalName: 'Company Name',
      address: {
        street: '123 Business St',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'Country',
      },
      designatedTitle: 'EMPLOYER',
    },
    employee: {
      legalName: 'Employee Name',
      address: {
        street: '456 Home St',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'Country',
      },
      email: 'employee@example.com',
      designatedTitle: 'EMPLOYEE',
    },
  },
  recitals: [
    'WHEREAS, EMPLOYER is engaged in...',
    'WHEREAS, EMPLOYER desires to employ EMPLOYEE...',
    'NOW, THEREFORE, in consideration of...',
  ],
  articles: [
    {
      number: 1,
      title: 'DEFINITIONS',
      sections: [
        {
          content: [
            {
              type: 'definition',
              content: [
                { term: 'AGREEMENT', definition: 'This Employment Agreement...' },
                { term: 'EMPLOYER', definition: 'The company as defined above...' },
              ],
            },
          ],
        },
      ],
    },
  ],
  signatures: [
    {
      party: 'employer',
      partyName: 'Company Name',
      fields: [
        { label: 'By', type: 'signature' },
        { label: 'Name', type: 'name' },
        { label: 'Title', type: 'title' },
        { label: 'Date', type: 'date' },
      ],
    },
    {
      party: 'employee',
      partyName: 'Employee Name',
      fields: [
        { label: 'Signature', type: 'signature' },
        { label: 'Date', type: 'date' },
      ],
    },
  ],
};
