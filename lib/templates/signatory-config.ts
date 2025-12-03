/**
 * Signatory Screen Configuration Types
 * 
 * Defines the structure for signatory screen configuration stored in the database.
 * This enables flexible, admin-configurable signatory collection screens.
 */

// ============================================================================
// Party Types
// ============================================================================

/** Default party types available for all templates */
export const DEFAULT_PARTY_TYPES = [
  { value: "disclosingParty", label: "Disclosing Party", description: "The party sharing confidential information" },
  { value: "receivingParty", label: "Receiving Party", description: "The party receiving confidential information" },
  { value: "employer", label: "Employer", description: "The employing company or entity" },
  { value: "employee", label: "Employee", description: "The individual being employed" },
  { value: "contractor", label: "Contractor", description: "Independent contractor or consultant" },
  { value: "client", label: "Client", description: "The client or customer" },
  { value: "vendor", label: "Vendor", description: "Service provider or supplier" },
  { value: "witness", label: "Witness", description: "A witness to the agreement" },
  { value: "guarantor", label: "Guarantor", description: "A guarantor or co-signer" },
  { value: "other", label: "Other", description: "Other party type" },
] as const;

export type DefaultPartyType = typeof DEFAULT_PARTY_TYPES[number]["value"];

export interface PartyTypeConfig {
  value: string;
  label: string;
  description?: string;
}

// ============================================================================
// Signatory Data Types
// ============================================================================

/** Data collected for a single signatory */
export interface SignatoryEntry {
  id: string;
  partyType: string;
  name: string;
  email: string;
  title?: string;
  phone?: string;
  company?: string;
  address?: string;
  /** Custom fields defined by admin */
  customFields?: Record<string, string>;
}

/** Validation result for a signatory */
export interface SignatoryValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

// ============================================================================
// Screen Configuration
// ============================================================================

/** Custom field definition for signatory screen */
export interface SignatoryCustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For select type
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/** Main signatory screen configuration stored in database */
export interface SignatoryScreenConfig {
  // Party configuration
  partyTypes: PartyTypeConfig[];
  allowCustomPartyType: boolean;

  // Signatory limits
  allowMultiple: boolean;
  minSignatories: number;
  maxSignatories: number;

  // Required parties (at least one signatory must be of each type)
  requiredPartyTypes: string[];

  // Standard fields to collect
  collectFields: {
    name: boolean;       // Always true, can't disable
    email: boolean;      // Always true, can't disable
    title: boolean;
    phone: boolean;
    company: boolean;
    address: boolean;
  };

  // Custom additional fields
  customFields: SignatoryCustomField[];

  // UI Configuration
  uiConfig: {
    groupByParty: boolean;           // Group signatories by party type in UI
    showPartyDescriptions: boolean;  // Show party type descriptions
    compactMode: boolean;            // Use compact card layout
    allowReordering: boolean;        // Allow drag-to-reorder signatories
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/** Default signatory screen configuration */
export const DEFAULT_SIGNATORY_CONFIG: SignatoryScreenConfig = {
  partyTypes: DEFAULT_PARTY_TYPES.slice(0, 4).map(p => ({ 
    value: p.value, 
    label: p.label, 
    description: p.description 
  })), // Default: disclosingParty, receivingParty, employer, employee
  allowCustomPartyType: false,

  allowMultiple: true,
  minSignatories: 2,
  maxSignatories: 10,

  requiredPartyTypes: [],

  collectFields: {
    name: true,
    email: true,
    title: true,
    phone: false,
    company: false,
    address: false,
  },

  customFields: [],

  uiConfig: {
    groupByParty: false,
    showPartyDescriptions: true,
    compactMode: false,
    allowReordering: true,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse signatory config from database JSON string
 */
export function parseSignatoryConfig(jsonString: string | null | undefined): SignatoryScreenConfig {
  if (!jsonString) {
    return { ...DEFAULT_SIGNATORY_CONFIG };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      ...DEFAULT_SIGNATORY_CONFIG,
      ...parsed,
      collectFields: {
        ...DEFAULT_SIGNATORY_CONFIG.collectFields,
        ...parsed.collectFields,
        // Name and email are always required
        name: true,
        email: true,
      },
      uiConfig: {
        ...DEFAULT_SIGNATORY_CONFIG.uiConfig,
        ...parsed.uiConfig,
      },
    };
  } catch (e) {
    console.error("Failed to parse signatory config:", e);
    return { ...DEFAULT_SIGNATORY_CONFIG };
  }
}

/**
 * Stringify signatory config for database storage
 */
export function stringifySignatoryConfig(config: SignatoryScreenConfig): string {
  return JSON.stringify(config);
}

/**
 * Create a blank signatory entry
 */
export function createBlankSignatory(partyType: string = "other"): SignatoryEntry {
  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    partyType,
    name: "",
    email: "",
    title: "",
    phone: "",
    company: "",
    address: "",
    customFields: {},
  };
}

/**
 * Validate a signatory entry against config
 */
export function validateSignatory(
  entry: SignatoryEntry,
  config: SignatoryScreenConfig
): SignatoryValidationResult {
  const errors: SignatoryValidationResult["errors"] = [];

  // Required: Name
  if (!entry.name?.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  // Required: Email with validation
  if (!entry.email?.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
    errors.push({ field: "email", message: "Please enter a valid email address" });
  }

  // Required: Party type
  if (!entry.partyType) {
    errors.push({ field: "partyType", message: "Party type is required" });
  } else {
    const validPartyTypes = config.partyTypes.map(p => p.value);
    if (!validPartyTypes.includes(entry.partyType) && !config.allowCustomPartyType) {
      errors.push({ field: "partyType", message: "Invalid party type" });
    }
  }

  // Optional fields based on config
  if (config.collectFields.title && !entry.title?.trim()) {
    // Title is optional even when collected
  }

  if (config.collectFields.phone && entry.phone) {
    // Basic phone validation
    const phoneClean = entry.phone.replace(/[\s\-\(\)]/g, "");
    if (phoneClean && !/^\+?[\d]{7,15}$/.test(phoneClean)) {
      errors.push({ field: "phone", message: "Please enter a valid phone number" });
    }
  }

  // Validate custom fields
  config.customFields.forEach(customField => {
    const value = entry.customFields?.[customField.name];
    if (customField.required && !value?.trim()) {
      errors.push({ field: customField.name, message: `${customField.label} is required` });
    }
    if (value && customField.validation?.pattern) {
      const regex = new RegExp(customField.validation.pattern);
      if (!regex.test(value)) {
        errors.push({ field: customField.name, message: `${customField.label} format is invalid` });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all signatories against config
 */
export function validateAllSignatories(
  signatories: SignatoryEntry[],
  config: SignatoryScreenConfig
): {
  isValid: boolean;
  globalErrors: string[];
  entryErrors: Map<string, SignatoryValidationResult>;
} {
  const globalErrors: string[] = [];
  const entryErrors = new Map<string, SignatoryValidationResult>();

  // Check minimum/maximum count
  if (signatories.length < config.minSignatories) {
    globalErrors.push(`At least ${config.minSignatories} signator${config.minSignatories === 1 ? 'y' : 'ies'} required`);
  }
  if (signatories.length > config.maxSignatories) {
    globalErrors.push(`Maximum ${config.maxSignatories} signatories allowed`);
  }

  // Check required party types
  config.requiredPartyTypes.forEach(requiredType => {
    const hasType = signatories.some(s => s.partyType === requiredType);
    if (!hasType) {
      const partyLabel = config.partyTypes.find(p => p.value === requiredType)?.label || requiredType;
      globalErrors.push(`At least one ${partyLabel} is required`);
    }
  });

  // Validate each entry
  signatories.forEach(entry => {
    const result = validateSignatory(entry, config);
    entryErrors.set(entry.id, result);
  });

  const hasEntryErrors = Array.from(entryErrors.values()).some(r => !r.isValid);

  return {
    isValid: globalErrors.length === 0 && !hasEntryErrors,
    globalErrors,
    entryErrors,
  };
}

/**
 * Format signatories for document generation prompt
 */
export function formatSignatoriesForPrompt(
  signatories: SignatoryEntry[],
  config: SignatoryScreenConfig
): string {
  if (signatories.length === 0) return "No signatories defined";

  const grouped = config.uiConfig.groupByParty
    ? groupSignatoriesByParty(signatories, config)
    : { all: signatories };

  const sections: string[] = [];

  Object.entries(grouped).forEach(([partyType, entries]) => {
    const partyLabel = config.partyTypes.find(p => p.value === partyType)?.label || partyType;
    
    if (config.uiConfig.groupByParty) {
      sections.push(`## ${partyLabel}`);
    }

    entries.forEach((entry, index) => {
      const parts = [
        `${index + 1}. **${entry.name}**`,
        `   - Email: ${entry.email}`,
        entry.title && `   - Title: ${entry.title}`,
        entry.phone && `   - Phone: ${entry.phone}`,
        entry.company && `   - Company: ${entry.company}`,
        !config.uiConfig.groupByParty && `   - Party: ${partyLabel}`,
      ].filter(Boolean);

      sections.push(parts.join("\n"));
    });
  });

  return sections.join("\n\n");
}

/**
 * Group signatories by party type
 */
export function groupSignatoriesByParty(
  signatories: SignatoryEntry[],
  config: SignatoryScreenConfig
): Record<string, SignatoryEntry[]> {
  const grouped: Record<string, SignatoryEntry[]> = {};

  // Initialize with all party types
  config.partyTypes.forEach(party => {
    grouped[party.value] = [];
  });

  // Group signatories
  signatories.forEach(sig => {
    if (!grouped[sig.partyType]) {
      grouped[sig.partyType] = [];
    }
    grouped[sig.partyType].push(sig);
  });

  // Remove empty groups
  Object.keys(grouped).forEach(key => {
    if (grouped[key].length === 0) {
      delete grouped[key];
    }
  });

  return grouped;
}

