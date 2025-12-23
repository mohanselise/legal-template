/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve template variables in a string
 * Supports {{variableName}} and {{variableName|fallback text}} syntax
 * Looks up values from formData first, then enrichmentContext
 * Falls back to provided fallback text, or shows the variable name if not found
 */
export function resolveTemplateVariables(
  template: string | null | undefined,
  formData?: Record<string, unknown>,
  enrichmentContext?: Record<string, unknown>
): string {
  if (!template) return "";
  
  // Match all {{variableName}} or {{variableName|fallback text}} patterns
  return template.replace(/\{\{([^}|]+)(?:\|([^}]*))?\}\}/g, (match, variableName, fallbackText) => {
    const trimmedName = variableName.trim();
    const fallback = fallbackText !== undefined && fallbackText.trim() !== "" 
      ? fallbackText.trim() 
      : `[${trimmedName}]`;
    
    // Try to get value from formData first
    if (formData) {
      const formValue = getNestedValue(formData, trimmedName);
      if (formValue !== undefined && formValue !== null && formValue !== "") {
        return String(formValue);
      }
    }
    
    // Try to get value from enrichmentContext
    if (enrichmentContext) {
      const contextValue = getNestedValue(enrichmentContext, trimmedName);
      if (contextValue !== undefined && contextValue !== null && contextValue !== "") {
        return String(contextValue);
      }
    }
    
    // Fallback: use provided fallback text or default placeholder
    return fallback;
  });
}

/**
 * Get the suggested value for an input placeholder
 */
export function getSuggestionPlaceholder(
  suggestionKey: string | null | undefined,
  enrichmentContext?: Record<string, unknown>,
  fallbackPlaceholder?: string | null
): string {
  if (!suggestionKey || !enrichmentContext) return fallbackPlaceholder || "";
  
  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);
  if (suggestedValue !== undefined && suggestedValue !== null) {
    return String(suggestedValue);
  }
  
  return fallbackPlaceholder || "";
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(countryCode?: string, number?: string): string {
  if (!number) return "";
  const cleanNumber = number.replace(/\D/g, "");
  if (countryCode) {
    return `${countryCode} ${cleanNumber}`;
  }
  return cleanNumber;
}

/**
 * Format a currency amount for display
 */
export function formatCurrencyAmount(amount?: number | string, currency?: string): string {
  if (amount === undefined || amount === null || amount === "") return "";
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "";
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formatted = formatter.format(numAmount);
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Format an address for display (single line)
 */
export function formatAddressSingleLine(address: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(", ");
}

/**
 * Parse a composite field value from storage
 * Handles both string (JSON) and object formats
 */
export function parseCompositeValue<T>(value: unknown, defaultValue: T): T {
  if (!value) return defaultValue;
  
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  
  if (typeof value === "object") {
    return value as T;
  }
  
  return defaultValue;
}
