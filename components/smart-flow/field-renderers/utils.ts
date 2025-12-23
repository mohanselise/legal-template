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

/**
 * Get default currency based on user's locale
 * Maps locale/country codes to currencies, falls back to CHF
 */
export function getDefaultCurrency(locale?: string): string {
  // Try to use browser's locale if not provided
  const userLocale = locale || (typeof window !== 'undefined' ? navigator.language : 'en-US');
  
  // Map common country codes to currencies
  const countryToCurrency: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'CH': 'CHF',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'PT': 'EUR',
    'IE': 'EUR',
    'FI': 'EUR',
    'GR': 'EUR',
    'LU': 'EUR',
    'JP': 'JPY',
    'CN': 'CNY',
    'IN': 'INR',
    'AU': 'AUD',
    'CA': 'CAD',
    'SG': 'SGD',
    'HK': 'HKD',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'CZ': 'CZK',
    'AE': 'AED',
    'SA': 'SAR',
    'BR': 'BRL',
    'MX': 'MXN',
  };
  
  try {
    // Extract country code from locale (e.g., "en-US" -> "US", "de-CH" -> "CH")
    const localeParts = userLocale.split('-');
    if (localeParts.length > 1) {
      const countryCode = localeParts[localeParts.length - 1].toUpperCase();
      const currency = countryToCurrency[countryCode];
      if (currency) {
        return currency;
      }
    }
    
    // Also try underscore separator (e.g., "en_US")
    const localePartsUnderscore = userLocale.split('_');
    if (localePartsUnderscore.length > 1) {
      const countryCode = localePartsUnderscore[localePartsUnderscore.length - 1].toUpperCase();
      const currency = countryToCurrency[countryCode];
      if (currency) {
        return currency;
      }
    }
    
    // Try to use Intl API if available (for more accurate detection)
    if (typeof Intl !== 'undefined' && Intl.Locale) {
      try {
        const localeObj = new Intl.Locale(userLocale);
        const region = localeObj.region;
        if (region) {
          const currency = countryToCurrency[region.toUpperCase()];
          if (currency) {
            return currency;
          }
        }
      } catch {
        // Intl.Locale might not be available in all browsers
      }
    }
  } catch (error) {
    // Fall through to default
    console.debug('Failed to detect currency from locale:', error);
  }
  
  // Fallback to CHF (Swiss Franc) as default
  return 'CHF';
}
