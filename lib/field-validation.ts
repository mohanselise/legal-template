/**
 * Field Validation System
 * 
 * Provides comprehensive validation rules for all field types,
 * including composite fields (party, address, phone, currency).
 */

import type { FieldType } from "./db";
import type { AddressValue, PartyValue, PhoneValue, CurrencyValue } from "@/components/smart-flow/field-renderers/types";

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fieldErrors?: Record<string, string>; // For composite fields
}

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
  phone: /^[+]?[\d\s\-()]{7,}$/,
  postalCode: {
    CH: /^\d{4}$/,
    DE: /^\d{5}$/,
    AT: /^\d{4}$/,
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    FR: /^\d{5}$/,
    default: /^[\dA-Z\s-]{3,10}$/i,
  },
};

// ============================================================================
// FIELD-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Validate email field
 */
function validateEmail(value: unknown, required: boolean): ValidationResult {
  if (!value || value === "") {
    return required 
      ? { valid: false, error: "Email is required" }
      : { valid: true };
  }
  
  if (typeof value !== "string") {
    return { valid: false, error: "Invalid email format" };
  }
  
  if (!VALIDATION_PATTERNS.email.test(value)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true };
}

/**
 * Validate URL field
 */
function validateUrl(value: unknown, required: boolean): ValidationResult {
  if (!value || value === "") {
    return required 
      ? { valid: false, error: "URL is required" }
      : { valid: true };
  }
  
  if (typeof value !== "string") {
    return { valid: false, error: "Invalid URL format" };
  }
  
  // Try to construct a URL to validate
  try {
    new URL(value.startsWith("http") ? value : `https://${value}`);
    return { valid: true };
  } catch {
    return { valid: false, error: "Please enter a valid URL (e.g., https://example.com)" };
  }
}

/**
 * Validate percentage field (0-100)
 */
function validatePercentage(value: unknown, required: boolean): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return required 
      ? { valid: false, error: "Percentage is required" }
      : { valid: true };
  }
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (typeof num !== "number" || isNaN(num)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  
  if (num < 0) {
    return { valid: false, error: "Percentage cannot be negative" };
  }
  
  if (num > 100) {
    return { valid: false, error: "Percentage cannot exceed 100%" };
  }
  
  return { valid: true };
}

/**
 * Validate phone field (composite)
 */
function validatePhone(value: unknown, required: boolean): ValidationResult {
  const phone = parsePhoneValue(value);
  
  if (!phone.number || phone.number.trim() === "") {
    return required 
      ? { valid: false, error: "Phone number is required" }
      : { valid: true };
  }
  
  // Remove non-digit characters for length check
  const digitsOnly = phone.number.replace(/\D/g, "");
  
  if (digitsOnly.length < 7) {
    return { valid: false, error: "Phone number is too short (minimum 7 digits)" };
  }
  
  if (digitsOnly.length > 15) {
    return { valid: false, error: "Phone number is too long (maximum 15 digits)" };
  }
  
  return { valid: true };
}

/**
 * Validate currency field (composite)
 */
function validateCurrency(value: unknown, required: boolean): ValidationResult {
  const currency = parseCurrencyValue(value);
  
  if (currency.amount === undefined || currency.amount === null || currency.amount === "") {
    return required 
      ? { valid: false, error: "Amount is required" }
      : { valid: true };
  }
  
  const amount = typeof currency.amount === "string" 
    ? parseFloat(currency.amount) 
    : currency.amount;
  
  if (isNaN(amount)) {
    return { valid: false, error: "Please enter a valid amount" };
  }
  
  if (amount < 0) {
    return { valid: false, error: "Amount cannot be negative" };
  }
  
  if (!currency.currency) {
    return { valid: false, error: "Please select a currency" };
  }
  
  return { valid: true };
}

/**
 * Validate address field (composite)
 */
function validateAddress(value: unknown, required: boolean): ValidationResult {
  const address = parseAddressValue(value);
  const fieldErrors: Record<string, string> = {};
  
  if (required) {
    // Check required address fields
    if (!address.street || address.street.trim() === "") {
      fieldErrors.street = "Street address is required";
    }
    if (!address.city || address.city.trim() === "") {
      fieldErrors.city = "City is required";
    }
    if (!address.country || address.country.trim() === "") {
      fieldErrors.country = "Country is required";
    }
  }
  
  // Validate postal code format if provided
  if (address.postalCode && address.country) {
    const pattern = VALIDATION_PATTERNS.postalCode[address.country as keyof typeof VALIDATION_PATTERNS.postalCode] 
      || VALIDATION_PATTERNS.postalCode.default;
    
    if (!pattern.test(address.postalCode)) {
      fieldErrors.postalCode = "Invalid postal code format";
    }
  }
  
  if (Object.keys(fieldErrors).length > 0) {
    return { 
      valid: false, 
      error: "Please complete all required address fields",
      fieldErrors 
    };
  }
  
  return { valid: true };
}

/**
 * Validate party field (composite: name + address)
 */
function validateParty(value: unknown, required: boolean): ValidationResult {
  const party = parsePartyValue(value);
  const fieldErrors: Record<string, string> = {};
  
  if (required) {
    // Name is always required for party
    if (!party.name || party.name.trim() === "") {
      fieldErrors.name = "Name is required";
    }
    
    // Address fields
    if (!party.street || party.street.trim() === "") {
      fieldErrors.street = "Street address is required";
    }
    if (!party.city || party.city.trim() === "") {
      fieldErrors.city = "City is required";
    }
    if (!party.country || party.country.trim() === "") {
      fieldErrors.country = "Country is required";
    }
  }
  
  // Validate postal code format if provided
  if (party.postalCode && party.country) {
    const pattern = VALIDATION_PATTERNS.postalCode[party.country as keyof typeof VALIDATION_PATTERNS.postalCode] 
      || VALIDATION_PATTERNS.postalCode.default;
    
    if (!pattern.test(party.postalCode)) {
      fieldErrors.postalCode = "Invalid postal code format";
    }
  }
  
  if (Object.keys(fieldErrors).length > 0) {
    return { 
      valid: false, 
      error: "Please complete all required fields",
      fieldErrors 
    };
  }
  
  return { valid: true };
}

/**
 * Validate text field
 */
function validateText(value: unknown, required: boolean, minLength?: number, maxLength?: number): ValidationResult {
  if (!value || value === "") {
    return required 
      ? { valid: false, error: "This field is required" }
      : { valid: true };
  }
  
  if (typeof value !== "string") {
    return { valid: false, error: "Invalid text format" };
  }
  
  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, error: `Minimum ${minLength} characters required` };
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, error: `Maximum ${maxLength} characters allowed` };
  }
  
  return { valid: true };
}

/**
 * Validate number field
 */
function validateNumber(value: unknown, required: boolean, min?: number, max?: number): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return required 
      ? { valid: false, error: "This field is required" }
      : { valid: true };
  }
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (typeof num !== "number" || isNaN(num)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `Minimum value is ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `Maximum value is ${max}` };
  }
  
  return { valid: true };
}

/**
 * Validate date field
 */
function validateDate(value: unknown, required: boolean): ValidationResult {
  if (!value || value === "") {
    return required 
      ? { valid: false, error: "Date is required" }
      : { valid: true };
  }
  
  if (typeof value !== "string") {
    return { valid: false, error: "Invalid date format" };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Please enter a valid date" };
  }
  
  return { valid: true };
}

/**
 * Validate select field
 */
function validateSelect(value: unknown, required: boolean, options?: string[]): ValidationResult {
  if (!value || value === "") {
    return required 
      ? { valid: false, error: "Please select an option" }
      : { valid: true };
  }
  
  if (options && options.length > 0 && !options.includes(value as string)) {
    return { valid: false, error: "Please select a valid option" };
  }
  
  return { valid: true };
}

/**
 * Validate checkbox field
 */
function validateCheckbox(value: unknown, required: boolean): ValidationResult {
  if (required && !value) {
    return { valid: false, error: "This checkbox must be checked" };
  }
  
  return { valid: true };
}

// ============================================================================
// VALUE PARSERS (for composite fields)
// ============================================================================

function parsePhoneValue(value: unknown): PhoneValue {
  if (!value) return { countryCode: "+41", number: "" };
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as PhoneValue;
    } catch {
      return { countryCode: "+41", number: value };
    }
  }
  return value as PhoneValue;
}

function parseCurrencyValue(value: unknown): CurrencyValue {
  if (!value) return { amount: "", currency: "CHF" };
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as CurrencyValue;
    } catch {
      return { amount: value, currency: "CHF" };
    }
  }
  return value as CurrencyValue;
}

function parseAddressValue(value: unknown): AddressValue {
  if (!value) return { street: "", city: "", state: "", postalCode: "", country: "CH" };
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as AddressValue;
    } catch {
      return { street: value, city: "", state: "", postalCode: "", country: "CH" };
    }
  }
  return value as AddressValue;
}

function parsePartyValue(value: unknown): PartyValue {
  if (!value) return { name: "", street: "", city: "", state: "", postalCode: "", country: "CH" };
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as PartyValue;
    } catch {
      return { name: value, street: "", city: "", state: "", postalCode: "", country: "CH" };
    }
  }
  return value as PartyValue;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export interface FieldValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
}

/**
 * Validate a field value based on its type
 */
export function validateField(
  fieldType: FieldType,
  value: unknown,
  options: FieldValidationOptions = {}
): ValidationResult {
  const { required = false, minLength, maxLength, min, max, options: selectOptions } = options;
  
  switch (fieldType) {
    case "text":
      return validateText(value, required, minLength, maxLength);
    
    case "email":
      return validateEmail(value, required);
    
    case "date":
      return validateDate(value, required);
    
    case "number":
      return validateNumber(value, required, min, max);
    
    case "checkbox":
      return validateCheckbox(value, required);
    
    case "select":
      return validateSelect(value, required, selectOptions);
    
    case "textarea":
      return validateText(value, required, minLength, maxLength);
    
    case "phone":
      return validatePhone(value, required);
    
    case "address":
      return validateAddress(value, required);
    
    case "party":
      return validateParty(value, required);
    
    case "currency":
      return validateCurrency(value, required);
    
    case "percentage":
      return validatePercentage(value, required);
    
    case "url":
      return validateUrl(value, required);
    
    default:
      // Unknown field type - just check required
      if (required && !value) {
        return { valid: false, error: "This field is required" };
      }
      return { valid: true };
  }
}

/**
 * Validate multiple fields at once
 */
export function validateFields(
  fields: Array<{
    name: string;
    type: FieldType;
    value: unknown;
    required?: boolean;
    options?: string[];
  }>
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();
  
  for (const field of fields) {
    results.set(
      field.name,
      validateField(field.type, field.value, {
        required: field.required,
        options: field.options,
      })
    );
  }
  
  return results;
}

/**
 * Check if all fields in a validation result map are valid
 */
export function allFieldsValid(results: Map<string, ValidationResult>): boolean {
  for (const result of results.values()) {
    if (!result.valid) return false;
  }
  return true;
}

/**
 * Get all error messages from a validation result map
 */
export function getValidationErrors(results: Map<string, ValidationResult>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [name, result] of results.entries()) {
    if (!result.valid && result.error) {
      errors[name] = result.error;
    }
  }
  
  return errors;
}
