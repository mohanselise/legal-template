/**
 * Address formatting utilities with jurisdiction-specific formats
 */

export interface StructuredAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  raw?: string; // Original input address (optional for backward compatibility)
}

/**
 * Format address according to jurisdiction-specific standards
 * Based on ISO 3166-1 alpha-2 country codes
 */
export function formatAddressByJurisdiction(
  address: StructuredAddress,
  countryCode?: string
): string {
  const code = (countryCode || address.countryCode || '').toUpperCase();
  const parts: string[] = [];

  // Street address
  if (address.street) {
    parts.push(address.street);
  }

  // City, State, Postal Code - format varies by country
  const cityStatePostal = formatCityStatePostal(address, code);
  if (cityStatePostal) {
    parts.push(cityStatePostal);
  }

  // Country
  if (address.country) {
    parts.push(address.country);
  }

  return parts.filter(Boolean).join(', ');
}

/**
 * Format city, state, and postal code according to country standards
 */
function formatCityStatePostal(
  address: StructuredAddress,
  countryCode: string
): string | null {
  const { city, state, postalCode } = address;
  const parts: string[] = [];

  switch (countryCode) {
    // United States: "City, State ZIP"
    case 'US':
      if (city && state && postalCode) {
        return `${city}, ${state} ${postalCode}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (city && postalCode) {
        return `${city} ${postalCode}`;
      } else if (city) {
        return city;
      }
      break;

    // United Kingdom: "City, Postcode"
    case 'GB':
      if (city && postalCode) {
        return `${city}, ${postalCode}`;
      } else if (city) {
        return city;
      } else if (postalCode) {
        return postalCode;
      }
      break;

    // Canada: "City, Province Postal Code"
    case 'CA':
      if (city && state && postalCode) {
        return `${city}, ${state} ${postalCode}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (city) {
        return city;
      }
      break;

    // Switzerland, Germany, Austria: "Postal Code City"
    case 'CH':
    case 'DE':
    case 'AT':
      if (postalCode && city) {
        return `${postalCode} ${city}`;
      } else if (city) {
        return city;
      } else if (postalCode) {
        return postalCode;
      }
      break;

    // France: "Postal Code City"
    case 'FR':
      if (postalCode && city) {
        return `${postalCode} ${city}`;
      } else if (city) {
        return city;
      }
      break;

    // Australia, New Zealand: "City State Postcode"
    case 'AU':
    case 'NZ':
      if (city && state && postalCode) {
        return `${city} ${state} ${postalCode}`;
      } else if (city && postalCode) {
        return `${city} ${postalCode}`;
      } else if (city) {
        return city;
      }
      break;

    // India: "City, State Postal Code"
    case 'IN':
      if (city && state && postalCode) {
        return `${city}, ${state} ${postalCode}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (city) {
        return city;
      }
      break;

    // Singapore: "Postal Code"
    case 'SG':
      if (city && postalCode) {
        return `${city} ${postalCode}`;
      } else if (city) {
        return city;
      } else if (postalCode) {
        return postalCode;
      }
      break;

    // Japan: "Postal Code City"
    case 'JP':
      if (postalCode && city) {
        return `${postalCode} ${city}`;
      } else if (city) {
        return city;
      }
      break;

    // Default: "City, State Postal Code" or variations
    default:
      if (city && state && postalCode) {
        return `${city}, ${state} ${postalCode}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (city && postalCode) {
        return `${city} ${postalCode}`;
      } else if (city) {
        return city;
      } else if (state) {
        return state;
      } else if (postalCode) {
        return postalCode;
      }
      break;
  }

  return null;
}

/**
 * Parse address string into structured components (fallback parsing)
 * This is a simple regex-based parser for common formats
 */
export function parseAddressString(address: string): Partial<StructuredAddress> {
  if (!address || typeof address !== 'string') {
    return { raw: address || '' };
  }

  const trimmed = address.trim();
  const result: Partial<StructuredAddress> = { raw: trimmed };

  // Common patterns
  // US format: "123 Main St, City, State ZIP, Country"
  const usPattern = /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:,\s*(.+))?$/i;
  const usMatch = trimmed.match(usPattern);
  if (usMatch) {
    result.street = usMatch[1].trim();
    result.city = usMatch[2].trim();
    result.state = usMatch[3].trim();
    result.postalCode = usMatch[4].trim();
    if (usMatch[5]) {
      result.country = usMatch[5].trim();
    }
    return result;
  }

  // UK format: "123 Main St, City, Postcode, Country"
  const ukPattern = /^(.+?),\s*(.+?),\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})(?:,\s*(.+))?$/i;
  const ukMatch = trimmed.match(ukPattern);
  if (ukMatch) {
    result.street = ukMatch[1].trim();
    result.city = ukMatch[2].trim();
    result.postalCode = ukMatch[3].trim().replace(/\s+/g, ' ');
    if (ukMatch[4]) {
      result.country = ukMatch[4].trim();
    }
    return result;
  }

  // Generic: Try to extract last part as country, second-to-last as postal code
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    result.street = parts[0];
    if (parts.length >= 3) {
      result.city = parts[1];
      // Try to detect postal code in remaining parts
      const remaining = parts.slice(2);
      const postalCodeIndex = remaining.findIndex(p => /^\d{4,6}[A-Z]?$|^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(p));
      if (postalCodeIndex >= 0) {
        result.postalCode = remaining[postalCodeIndex];
        result.state = remaining.slice(0, postalCodeIndex).join(', ') || undefined;
        result.country = remaining.slice(postalCodeIndex + 1).join(', ') || undefined;
      } else {
        result.state = remaining.slice(0, -1).join(', ') || undefined;
        result.country = remaining[remaining.length - 1] || undefined;
      }
    }
  }

  return result;
}

/**
 * Extract structured address from Nominatim autocomplete response
 */
export function extractAddressFromNominatim(nominatimResult: {
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}): StructuredAddress {
  const addr = nominatimResult.address || {};
  
  return {
    raw: nominatimResult.display_name,
    street: [addr.house_number, addr.road].filter(Boolean).join(' ') || undefined,
    city: addr.city || addr.town || addr.village || undefined,
    state: addr.state || undefined,
    postalCode: addr.postcode || undefined,
    country: addr.country || undefined,
    countryCode: addr.country_code?.toUpperCase() || undefined,
  };
}

