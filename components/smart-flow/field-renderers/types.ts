import type { FieldType } from "@/lib/db";

export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options: string[];
  // AI Smart Suggestions
  aiSuggestionEnabled?: boolean;
  aiSuggestionKey?: string | null;
}

export interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  enrichmentContext?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

// Composite field value types
export interface AddressValue {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PartyValue extends AddressValue {
  name?: string;
  placeId?: string; // For future Google Places integration
}

export interface PhoneValue {
  countryCode?: string;
  number?: string;
}

export interface CurrencyValue {
  amount?: number | string;
  currency?: string;
}

// Common country codes for phone field
export const COUNTRY_CODES = [
  { code: "+41", country: "CH", label: "Switzerland (+41)" },
  { code: "+49", country: "DE", label: "Germany (+49)" },
  { code: "+43", country: "AT", label: "Austria (+43)" },
  { code: "+33", country: "FR", label: "France (+33)" },
  { code: "+39", country: "IT", label: "Italy (+39)" },
  { code: "+44", country: "GB", label: "UK (+44)" },
  { code: "+1", country: "US", label: "USA (+1)" },
  { code: "+31", country: "NL", label: "Netherlands (+31)" },
  { code: "+32", country: "BE", label: "Belgium (+32)" },
  { code: "+34", country: "ES", label: "Spain (+34)" },
  { code: "+351", country: "PT", label: "Portugal (+351)" },
  { code: "+46", country: "SE", label: "Sweden (+46)" },
  { code: "+47", country: "NO", label: "Norway (+47)" },
  { code: "+45", country: "DK", label: "Denmark (+45)" },
  { code: "+358", country: "FI", label: "Finland (+358)" },
  { code: "+48", country: "PL", label: "Poland (+48)" },
  { code: "+420", country: "CZ", label: "Czech Republic (+420)" },
  { code: "+91", country: "IN", label: "India (+91)" },
  { code: "+86", country: "CN", label: "China (+86)" },
  { code: "+81", country: "JP", label: "Japan (+81)" },
  { code: "+82", country: "KR", label: "South Korea (+82)" },
  { code: "+65", country: "SG", label: "Singapore (+65)" },
  { code: "+61", country: "AU", label: "Australia (+61)" },
  { code: "+64", country: "NZ", label: "New Zealand (+64)" },
  { code: "+971", country: "AE", label: "UAE (+971)" },
  { code: "+966", country: "SA", label: "Saudi Arabia (+966)" },
  { code: "+55", country: "BR", label: "Brazil (+55)" },
  { code: "+52", country: "MX", label: "Mexico (+52)" },
];

// Common currencies
export const CURRENCIES = [
  { code: "CHF", symbol: "CHF", label: "Swiss Franc (CHF)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (JPY)" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan (CNY)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (INR)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (AUD)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (CAD)" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar (HKD)" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona (SEK)" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone (NOK)" },
  { code: "DKK", symbol: "kr", label: "Danish Krone (DKK)" },
  { code: "PLN", symbol: "zł", label: "Polish Zloty (PLN)" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna (CZK)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (AED)" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal (SAR)" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real (BRL)" },
  { code: "MXN", symbol: "MX$", label: "Mexican Peso (MXN)" },
];

// Common countries for address field
export const COUNTRIES = [
  { code: "CH", label: "Switzerland" },
  { code: "DE", label: "Germany" },
  { code: "AT", label: "Austria" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "ES", label: "Spain" },
  { code: "PT", label: "Portugal" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "PL", label: "Poland" },
  { code: "CZ", label: "Czech Republic" },
  { code: "IE", label: "Ireland" },
  { code: "LU", label: "Luxembourg" },
  { code: "LI", label: "Liechtenstein" },
  { code: "IN", label: "India" },
  { code: "CN", label: "China" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "BR", label: "Brazil" },
  { code: "MX", label: "Mexico" },
  { code: "CA", label: "Canada" },
];
