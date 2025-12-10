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
  { code: "AF", label: "Afghanistan" },
  { code: "AL", label: "Albania" },
  { code: "DZ", label: "Algeria" },
  { code: "AD", label: "Andorra" },
  { code: "AO", label: "Angola" },
  { code: "AG", label: "Antigua and Barbuda" },
  { code: "AR", label: "Argentina" },
  { code: "AM", label: "Armenia" },
  { code: "AU", label: "Australia" },
  { code: "AT", label: "Austria" },
  { code: "AZ", label: "Azerbaijan" },
  { code: "BS", label: "Bahamas" },
  { code: "BH", label: "Bahrain" },
  { code: "BD", label: "Bangladesh" },
  { code: "BB", label: "Barbados" },
  { code: "BY", label: "Belarus" },
  { code: "BE", label: "Belgium" },
  { code: "BZ", label: "Belize" },
  { code: "BJ", label: "Benin" },
  { code: "BT", label: "Bhutan" },
  { code: "BO", label: "Bolivia" },
  { code: "BA", label: "Bosnia and Herzegovina" },
  { code: "BW", label: "Botswana" },
  { code: "BR", label: "Brazil" },
  { code: "BN", label: "Brunei" },
  { code: "BG", label: "Bulgaria" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BI", label: "Burundi" },
  { code: "CV", label: "Cabo Verde" },
  { code: "KH", label: "Cambodia" },
  { code: "CM", label: "Cameroon" },
  { code: "CA", label: "Canada" },
  { code: "CF", label: "Central African Republic" },
  { code: "TD", label: "Chad" },
  { code: "CL", label: "Chile" },
  { code: "CN", label: "China" },
  { code: "CO", label: "Colombia" },
  { code: "KM", label: "Comoros" },
  { code: "CD", label: "Congo (Democratic Republic)" },
  { code: "CG", label: "Congo (Republic)" },
  { code: "CR", label: "Costa Rica" },
  { code: "HR", label: "Croatia" },
  { code: "CU", label: "Cuba" },
  { code: "CY", label: "Cyprus" },
  { code: "CZ", label: "Czech Republic" },
  { code: "DK", label: "Denmark" },
  { code: "DJ", label: "Djibouti" },
  { code: "DM", label: "Dominica" },
  { code: "DO", label: "Dominican Republic" },
  { code: "EC", label: "Ecuador" },
  { code: "EG", label: "Egypt" },
  { code: "SV", label: "El Salvador" },
  { code: "GQ", label: "Equatorial Guinea" },
  { code: "ER", label: "Eritrea" },
  { code: "EE", label: "Estonia" },
  { code: "SZ", label: "Eswatini" },
  { code: "ET", label: "Ethiopia" },
  { code: "FJ", label: "Fiji" },
  { code: "FI", label: "Finland" },
  { code: "FR", label: "France" },
  { code: "GA", label: "Gabon" },
  { code: "GM", label: "Gambia" },
  { code: "GE", label: "Georgia" },
  { code: "DE", label: "Germany" },
  { code: "GH", label: "Ghana" },
  { code: "GR", label: "Greece" },
  { code: "GD", label: "Grenada" },
  { code: "GT", label: "Guatemala" },
  { code: "GN", label: "Guinea" },
  { code: "GW", label: "Guinea-Bissau" },
  { code: "GY", label: "Guyana" },
  { code: "HT", label: "Haiti" },
  { code: "HN", label: "Honduras" },
  { code: "HU", label: "Hungary" },
  { code: "IS", label: "Iceland" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "IR", label: "Iran" },
  { code: "IQ", label: "Iraq" },
  { code: "IE", label: "Ireland" },
  { code: "IL", label: "Israel" },
  { code: "IT", label: "Italy" },
  { code: "JM", label: "Jamaica" },
  { code: "JP", label: "Japan" },
  { code: "JO", label: "Jordan" },
  { code: "KZ", label: "Kazakhstan" },
  { code: "KE", label: "Kenya" },
  { code: "KI", label: "Kiribati" },
  { code: "KP", label: "Korea (North)" },
  { code: "KR", label: "Korea (South)" },
  { code: "KW", label: "Kuwait" },
  { code: "KG", label: "Kyrgyzstan" },
  { code: "LA", label: "Laos" },
  { code: "LV", label: "Latvia" },
  { code: "LB", label: "Lebanon" },
  { code: "LS", label: "Lesotho" },
  { code: "LR", label: "Liberia" },
  { code: "LY", label: "Libya" },
  { code: "LI", label: "Liechtenstein" },
  { code: "LT", label: "Lithuania" },
  { code: "LU", label: "Luxembourg" },
  { code: "MG", label: "Madagascar" },
  { code: "MW", label: "Malawi" },
  { code: "MY", label: "Malaysia" },
  { code: "MV", label: "Maldives" },
  { code: "ML", label: "Mali" },
  { code: "MT", label: "Malta" },
  { code: "MH", label: "Marshall Islands" },
  { code: "MR", label: "Mauritania" },
  { code: "MU", label: "Mauritius" },
  { code: "MX", label: "Mexico" },
  { code: "FM", label: "Micronesia" },
  { code: "MD", label: "Moldova" },
  { code: "MC", label: "Monaco" },
  { code: "MN", label: "Mongolia" },
  { code: "ME", label: "Montenegro" },
  { code: "MA", label: "Morocco" },
  { code: "MZ", label: "Mozambique" },
  { code: "MM", label: "Myanmar" },
  { code: "NA", label: "Namibia" },
  { code: "NR", label: "Nauru" },
  { code: "NP", label: "Nepal" },
  { code: "NL", label: "Netherlands" },
  { code: "NZ", label: "New Zealand" },
  { code: "NI", label: "Nicaragua" },
  { code: "NE", label: "Niger" },
  { code: "NG", label: "Nigeria" },
  { code: "MK", label: "North Macedonia" },
  { code: "NO", label: "Norway" },
  { code: "OM", label: "Oman" },
  { code: "PK", label: "Pakistan" },
  { code: "PW", label: "Palau" },
  { code: "PA", label: "Panama" },
  { code: "PG", label: "Papua New Guinea" },
  { code: "PY", label: "Paraguay" },
  { code: "PE", label: "Peru" },
  { code: "PH", label: "Philippines" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "QA", label: "Qatar" },
  { code: "RO", label: "Romania" },
  { code: "RU", label: "Russia" },
  { code: "RW", label: "Rwanda" },
  { code: "KN", label: "Saint Kitts and Nevis" },
  { code: "LC", label: "Saint Lucia" },
  { code: "VC", label: "Saint Vincent and the Grenadines" },
  { code: "WS", label: "Samoa" },
  { code: "SM", label: "San Marino" },
  { code: "ST", label: "Sao Tome and Principe" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "SN", label: "Senegal" },
  { code: "RS", label: "Serbia" },
  { code: "SC", label: "Seychelles" },
  { code: "SL", label: "Sierra Leone" },
  { code: "SG", label: "Singapore" },
  { code: "SK", label: "Slovakia" },
  { code: "SI", label: "Slovenia" },
  { code: "SB", label: "Solomon Islands" },
  { code: "SO", label: "Somalia" },
  { code: "ZA", label: "South Africa" },
  { code: "SS", label: "South Sudan" },
  { code: "ES", label: "Spain" },
  { code: "LK", label: "Sri Lanka" },
  { code: "SD", label: "Sudan" },
  { code: "SR", label: "Suriname" },
  { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" },
  { code: "SY", label: "Syria" },
  { code: "TW", label: "Taiwan" },
  { code: "TJ", label: "Tajikistan" },
  { code: "TZ", label: "Tanzania" },
  { code: "TH", label: "Thailand" },
  { code: "TL", label: "Timor-Leste" },
  { code: "TG", label: "Togo" },
  { code: "TO", label: "Tonga" },
  { code: "TT", label: "Trinidad and Tobago" },
  { code: "TN", label: "Tunisia" },
  { code: "TR", label: "Turkey" },
  { code: "TM", label: "Turkmenistan" },
  { code: "TV", label: "Tuvalu" },
  { code: "UG", label: "Uganda" },
  { code: "UA", label: "Ukraine" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "UY", label: "Uruguay" },
  { code: "UZ", label: "Uzbekistan" },
  { code: "VU", label: "Vanuatu" },
  { code: "VA", label: "Vatican City" },
  { code: "VE", label: "Venezuela" },
  { code: "VN", label: "Vietnam" },
  { code: "YE", label: "Yemen" },
  { code: "ZM", label: "Zambia" },
  { code: "ZW", label: "Zimbabwe" },
];
