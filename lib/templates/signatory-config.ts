/**
 * Signatory Screen Configuration Types (Simplified)
 * 
 * Two modes:
 * - Deterministic: Admin defines fixed signatory slots, end user fills them
 * - Dynamic: End user adds signatories as needed
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
  { value: "schoolRepresentative", label: "School Representative", description: "Official representative of the educational institution" },
  { value: "student", label: "Student", description: "The student party" },
  { value: "parent", label: "Parent/Guardian", description: "Parent or legal guardian" },
  { value: "other", label: "Other", description: "Other party type" },
] as const;

export type DefaultPartyType = typeof DEFAULT_PARTY_TYPES[number]["value"];

export interface PartyTypeConfig {
  value: string;
  label: string;
  description?: string;
}

// ============================================================================
// Auto-fill Configuration (Simplified)
// ============================================================================

/** Simple auto-fill mapping - just source field names for each target field */
export interface AutoFillConfig {
  name?: string;    // Source field name for name
  email?: string;   // Source field name for email
  title?: string;   // Source field name for title
  phone?: string;   // Source field name for phone
  company?: string; // Source field name for company
  address?: string; // Source field name for address
}

// ============================================================================
// Pre-defined Signatory Types (Simplified)
// ============================================================================

/** Pre-defined signatory slot configured by admin (simplified) */
export interface PredefinedSignatory {
  /** Unique identifier for this slot */
  id: string;
  /** Party type for this signatory */
  partyType: string;
  /** Custom label for this signatory slot (e.g., "School Representative", "Student") */
  label: string;
  /** Description shown to the end user */
  description?: string;
  /** Whether this signatory is required */
  required: boolean;
  /** Simple auto-fill configuration - map target fields to source field names */
  autoFillFrom: AutoFillConfig;
  /** Order in which this signatory appears */
  order: number;
}

// Legacy type for backward compatibility during migration
export interface SignatoryFieldMapping {
  targetField: "name" | "email" | "title" | "phone" | "company" | "address";
  sourceField: string;
  sourceScreenId?: string;
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
  /** Reference to pre-defined signatory ID (if created from predefined slot) */
  predefinedId?: string;
  /** Whether this signatory was pre-filled from form data */
  isPrefilled?: boolean;
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
// Screen Configuration (Simplified)
// ============================================================================

/** Main signatory screen configuration stored in database */
export interface SignatoryScreenConfig {
  /** Mode: deterministic (fixed slots) or dynamic (user adds) */
  mode: "deterministic" | "dynamic";

  /** Party types available for selection */
  partyTypes: PartyTypeConfig[];

  /** Signatory limits (for dynamic mode) */
  minSignatories: number;
  maxSignatories: number;

  /** Pre-defined signatories (for deterministic mode) */
  predefinedSignatories: PredefinedSignatory[];

  /** Standard fields to collect */
  collectFields: {
    name: boolean;       // Always true, can't disable
    email: boolean;      // Always true, can't disable
    title: boolean;
    phone: boolean;
    company: boolean;
    address: boolean;
  };
}

// Legacy fields for backward compatibility (kept but not used in new config)
export interface SignatoryCustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/** Default signatory screen configuration */
export const DEFAULT_SIGNATORY_CONFIG: SignatoryScreenConfig = {
  mode: "dynamic",
  
  partyTypes: DEFAULT_PARTY_TYPES.map(p => ({ 
    value: p.value, 
    label: p.label, 
    description: p.description 
  })),

  minSignatories: 2,
  maxSignatories: 10,
  
  predefinedSignatories: [],

  collectFields: {
    name: true,
    email: true,
    title: true,
    phone: false,
    company: false,
    address: false,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Migrate old field mappings to new autoFillFrom format
 */
function migrateFieldMappings(fieldMappings: SignatoryFieldMapping[] | undefined): AutoFillConfig {
  if (!fieldMappings || fieldMappings.length === 0) {
    return {};
  }
  
  const autoFillFrom: AutoFillConfig = {};
  for (const mapping of fieldMappings) {
    autoFillFrom[mapping.targetField] = mapping.sourceField;
  }
  return autoFillFrom;
}

/**
 * Migrate old predefined signatory to new format
 */
function migratePredefinedSignatory(old: any): PredefinedSignatory {
  return {
    id: old.id,
    partyType: old.partyType,
    label: old.label,
    description: old.description || "",
    required: old.required ?? true,
    autoFillFrom: old.autoFillFrom || migrateFieldMappings(old.fieldMappings),
    order: old.order ?? 0,
  };
}

/**
 * Parse signatory config from database JSON string
 */
export function parseSignatoryConfig(jsonString: string | null | undefined): SignatoryScreenConfig {
  if (!jsonString) {
    return { ...DEFAULT_SIGNATORY_CONFIG };
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Determine mode from existing data
    let mode: "deterministic" | "dynamic" = parsed.mode || "dynamic";
    if (!parsed.mode && parsed.predefinedSignatories && parsed.predefinedSignatories.length > 0) {
      mode = "deterministic";
    }
    
    // Migrate predefined signatories if needed
    const predefinedSignatories = (parsed.predefinedSignatories || []).map(migratePredefinedSignatory);
    
    return {
      mode,
      partyTypes: parsed.partyTypes || DEFAULT_SIGNATORY_CONFIG.partyTypes,
      minSignatories: parsed.minSignatories ?? DEFAULT_SIGNATORY_CONFIG.minSignatories,
      maxSignatories: parsed.maxSignatories ?? DEFAULT_SIGNATORY_CONFIG.maxSignatories,
      predefinedSignatories,
      collectFields: {
        ...DEFAULT_SIGNATORY_CONFIG.collectFields,
        ...parsed.collectFields,
        // Name and email are always required
        name: true,
        email: true,
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
  };
}

/**
 * Create a new pre-defined signatory configuration
 */
export function createPredefinedSignatory(
  partyType: string,
  label: string,
  order: number
): PredefinedSignatory {
  return {
    id: `predef_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    partyType,
    label,
    description: "",
    required: true,
    autoFillFrom: {},
    order,
  };
}

/**
 * Apply auto-fill config to pre-fill signatory data from form data
 */
export function applyAutoFill(
  signatory: SignatoryEntry,
  predefined: PredefinedSignatory,
  formData: Record<string, unknown>
): SignatoryEntry {
  const updated = { ...signatory };
  const autoFill = predefined.autoFillFrom;
  
  if (autoFill.name && formData[autoFill.name]) {
    updated.name = String(formData[autoFill.name]);
  }
  if (autoFill.email && formData[autoFill.email]) {
    updated.email = String(formData[autoFill.email]);
  }
  if (autoFill.title && formData[autoFill.title]) {
    updated.title = String(formData[autoFill.title]);
  }
  if (autoFill.phone && formData[autoFill.phone]) {
    updated.phone = String(formData[autoFill.phone]);
  }
  if (autoFill.company && formData[autoFill.company]) {
    updated.company = String(formData[autoFill.company]);
  }
  if (autoFill.address && formData[autoFill.address]) {
    updated.address = String(formData[autoFill.address]);
  }
  
  return updated;
}

// Legacy function for backward compatibility
export function applyFieldMappings(
  signatory: SignatoryEntry,
  predefined: PredefinedSignatory,
  formData: Record<string, unknown>
): SignatoryEntry {
  return applyAutoFill(signatory, predefined, formData);
}

/**
 * Initialize signatories from pre-defined configuration with auto-fill applied
 */
export function initializeFromPredefined(
  config: SignatoryScreenConfig,
  formData: Record<string, unknown>
): SignatoryEntry[] {
  if (config.mode !== "deterministic" || config.predefinedSignatories.length === 0) {
    return [];
  }

  // Sort by order and create signatories
  const sorted = [...config.predefinedSignatories].sort((a, b) => a.order - b.order);
  
  return sorted.map(predefined => {
    const signatory = createBlankSignatory(predefined.partyType);
    signatory.predefinedId = predefined.id;
    
    // Apply auto-fill to pre-fill data
    const withAutoFill = applyAutoFill(signatory, predefined, formData);
    
    // Mark as pre-filled if any data was applied
    const hasPrefilled = Object.values(predefined.autoFillFrom).some(
      sourceField => sourceField && formData[sourceField]
    );
    withAutoFill.isPrefilled = hasPrefilled;
    
    return withAutoFill;
  });
}

/**
 * Get the pre-defined signatory config for a signatory entry
 */
export function getPredefinedConfig(
  signatory: SignatoryEntry,
  config: SignatoryScreenConfig
): PredefinedSignatory | undefined {
  if (!signatory.predefinedId) return undefined;
  return config.predefinedSignatories.find(p => p.id === signatory.predefinedId);
}

/**
 * Check if a signatory can be removed
 */
export function canRemoveSignatory(
  signatory: SignatoryEntry,
  config: SignatoryScreenConfig,
  totalCount: number
): boolean {
  // In deterministic mode, required signatories cannot be removed
  if (config.mode === "deterministic") {
    const predefined = getPredefinedConfig(signatory, config);
    if (predefined?.required) return false;
  }
  
  // Check minimum count
  if (totalCount <= config.minSignatories) return false;
  
  return true;
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
  }

  // Phone validation if provided
  if (config.collectFields.phone && entry.phone) {
    const phoneClean = entry.phone.replace(/[\s\-\(\)]/g, "");
    if (phoneClean && !/^\+?[\d]{7,15}$/.test(phoneClean)) {
      errors.push({ field: "phone", message: "Please enter a valid phone number" });
    }
  }

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

  const sections: string[] = [];

  signatories.forEach((entry, index) => {
    const partyLabel = config.partyTypes.find(p => p.value === entry.partyType)?.label || entry.partyType;
    
    const parts = [
      `${index + 1}. **${entry.name}**`,
      `   - Email: ${entry.email}`,
      entry.title && `   - Title: ${entry.title}`,
      entry.phone && `   - Phone: ${entry.phone}`,
      entry.company && `   - Company: ${entry.company}`,
      `   - Party: ${partyLabel}`,
    ].filter(Boolean);

    sections.push(parts.join("\n"));
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
