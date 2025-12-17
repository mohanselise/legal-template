/**
 * Field Type Intelligence Layer
 * 
 * This module provides intelligent field type detection and suggestion
 * based on field names, labels, and context. It helps the AI Configurator
 * make better decisions about which field types to use.
 */

import type { FieldType } from "./db";

// ============================================================================
// FIELD TYPE PATTERNS
// ============================================================================

interface FieldPattern {
  fieldType: FieldType;
  namePatterns: RegExp[];
  labelPatterns?: RegExp[];
  contextPatterns?: string[];
  priority: number; // Higher = more specific, checked first
  description: string;
  subFields?: string[]; // For composite fields
  defaultOptions?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
}

/**
 * Field patterns ordered by priority (most specific first)
 * The AI should use these patterns to determine the best field type
 */
export const FIELD_PATTERNS: FieldPattern[] = [
  // ============================================================================
  // COMPOSITE FIELDS (highest priority - most specific)
  // ============================================================================
  {
    fieldType: "party",
    namePatterns: [
      /^(employer|employee|contractor|vendor|client|customer|party|company|organization|business|firm|entity)$/i,
      /(employer|employee|contractor|vendor|client|customer)Info$/i,
      /(company|organization|business|firm|entity)(Info|Details)?$/i,
      /^party[A-Z]/i,
      /partyInfo$/i,
    ],
    labelPatterns: [
      /employer\s*(information|details)?/i,
      /employee\s*(information|details)?/i,
      /company\s*(information|details)?/i,
      /business\s*(information|details)?/i,
      /organization\s*(information|details)?/i,
      /contractor\s*(information|details)?/i,
      /client\s*(information|details)?/i,
      /vendor\s*(information|details)?/i,
      /party\s*[a-z]?\s*(information|details)?/i,
    ],
    contextPatterns: ["party", "signatory", "contract", "agreement"],
    priority: 100,
    description: "Name + full address composite for businesses/persons (Google Places ready)",
    subFields: ["name", "street", "city", "state", "postalCode", "country", "placeId"],
  },
  {
    fieldType: "address",
    namePatterns: [
      /address$/i,
      /^(mailing|billing|shipping|registered|business|home|work|office|physical|postal)Address$/i,
      /location$/i,
    ],
    labelPatterns: [
      /address/i,
      /location/i,
      /where.*located/i,
    ],
    contextPatterns: ["mailing", "billing", "shipping", "registered", "business", "location"],
    priority: 95,
    description: "Composite address field (street, city, state, postal, country)",
    subFields: ["street", "city", "state", "postalCode", "country"],
  },
  {
    fieldType: "currency",
    namePatterns: [
      /salary$/i,
      /^(annual|monthly|weekly|hourly|base|total)Salary$/i,
      /compensation$/i,
      /^(total)?Compensation$/i,
      /wage$/i,
      /^(hourly|daily|weekly)?Wage$/i,
      /amount$/i,
      /^(payment|fee|cost|price|budget|bonus|commission|rate)Amount?$/i,
      /payment$/i,
      /fee$/i,
      /price$/i,
      /cost$/i,
      /budget$/i,
      /bonus$/i,
      /commission$/i,
      /stipend$/i,
      /allowance$/i,
      /reimbursement$/i,
    ],
    labelPatterns: [
      /salary/i,
      /compensation/i,
      /wage/i,
      /payment/i,
      /fee/i,
      /price/i,
      /cost/i,
      /budget/i,
      /bonus/i,
      /commission/i,
      /stipend/i,
      /allowance/i,
      /reimbursement/i,
      /amount.*\$/i,
      /\$.*amount/i,
    ],
    contextPatterns: ["payment", "cost", "budget", "financial", "monetary", "money"],
    priority: 90,
    description: "Amount + currency selector (CHF, EUR, USD, etc.)",
    subFields: ["amount", "currency"],
  },
  {
    fieldType: "phone",
    namePatterns: [
      /phone$/i,
      /^(mobile|cell|work|home|office|business|contact|emergency|primary|secondary)?Phone$/i,
      /telephone$/i,
      /tel$/i,
      /mobile$/i,
      /cellphone$/i,
      /fax$/i,
    ],
    labelPatterns: [
      /phone/i,
      /telephone/i,
      /mobile/i,
      /cell/i,
      /fax/i,
      /contact.*number/i,
    ],
    contextPatterns: ["contact", "communication", "call"],
    priority: 85,
    description: "Phone with country code selector",
    subFields: ["countryCode", "number"],
    validation: { format: "international" },
  },

  // ============================================================================
  // SPECIALIZED SIMPLE FIELDS (medium priority)
  // ============================================================================
  {
    fieldType: "percentage",
    namePatterns: [
      /percent(age)?$/i,
      /rate$/i,
      /^(bonus|commission|tax|discount|interest|markup|margin|vat|vesting)?Rate$/i,
      /ratio$/i,
      /share$/i,
      /^equity(Percentage|Share)?$/i,
      /ownership$/i,
    ],
    labelPatterns: [
      /percent/i,
      /rate\s*\(%\)/i,
      /\%/,
      /ratio/i,
      /share.*%/i,
    ],
    contextPatterns: ["percentage", "rate", "ratio", "proportion"],
    priority: 80,
    description: "0-100 percentage with % display",
    validation: { min: 0, max: 100 },
  },
  {
    fieldType: "url",
    namePatterns: [
      /url$/i,
      /^(website|web|homepage|link|linkedin|github|portfolio|social)?Url$/i,
      /website$/i,
      /link$/i,
      /homepage$/i,
    ],
    labelPatterns: [
      /url/i,
      /website/i,
      /web.*address/i,
      /link/i,
      /homepage/i,
      /linkedin/i,
      /github/i,
      /portfolio/i,
    ],
    contextPatterns: ["web", "online", "internet", "link"],
    priority: 75,
    description: "URL with validation and preview link",
    validation: { pattern: "^https?://.+" },
  },
  {
    fieldType: "textarea",
    namePatterns: [
      /description$/i,
      /^(job|role|position|project|task|company)?Description$/i,
      /notes$/i,
      /details$/i,
      /comments$/i,
      /remarks$/i,
      /summary$/i,
      /overview$/i,
      /reason$/i,
      /explanation$/i,
      /justification$/i,
      /terms$/i,
      /conditions$/i,
      /responsibilities$/i,
      /duties$/i,
      /requirements$/i,
      /qualifications$/i,
      /scope$/i,
      /additionalInfo$/i,
      /otherInfo$/i,
      /specialInstructions$/i,
    ],
    labelPatterns: [
      /description/i,
      /notes/i,
      /details/i,
      /comments/i,
      /remarks/i,
      /summary/i,
      /overview/i,
      /reason/i,
      /explanation/i,
      /responsibilities/i,
      /duties/i,
      /requirements/i,
      /terms.*conditions/i,
      /additional.*information/i,
      /special.*instructions/i,
    ],
    contextPatterns: ["long text", "multi-line", "paragraph", "detailed"],
    priority: 70,
    description: "Multi-line text input for longer content",
  },

  // ============================================================================
  // BASIC FIELDS (lower priority - fallbacks)
  // ============================================================================
  {
    fieldType: "email",
    namePatterns: [
      /email$/i,
      /^(work|personal|business|contact|primary|secondary)?Email$/i,
      /e-?mail$/i,
    ],
    labelPatterns: [
      /e-?mail/i,
    ],
    contextPatterns: ["contact", "communication"],
    priority: 60,
    description: "Email with validation",
    validation: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
  },
  {
    fieldType: "date",
    namePatterns: [
      /date$/i,
      /^(start|end|birth|hire|termination|effective|expiry|expiration|deadline|due|signing)?Date$/i,
      /dateOf/i,
      /startedAt$/i,
      /endedAt$/i,
      /createdAt$/i,
      /updatedAt$/i,
    ],
    labelPatterns: [
      /date/i,
      /when/i,
      /deadline/i,
      /due/i,
    ],
    contextPatterns: ["when", "time", "schedule", "deadline"],
    priority: 55,
    description: "Date picker",
  },
  {
    fieldType: "number",
    namePatterns: [
      /^(num|count|quantity|age|years|months|days|hours|duration|period|term|notice|probation)/i,
      /Count$/i,
      /Number$/i,
      /Quantity$/i,
      /^age$/i,
      /years$/i,
      /months$/i,
      /days$/i,
      /hours$/i,
      /minutes$/i,
      /duration$/i,
      /period$/i,
      /term$/i,
      /notice$/i,
    ],
    labelPatterns: [
      /number of/i,
      /how many/i,
      /quantity/i,
      /count/i,
      /duration/i,
      /period/i,
      /\d+\s*(days|months|years|hours)/i,
    ],
    contextPatterns: ["count", "quantity", "amount", "numeric"],
    priority: 50,
    description: "Numeric input",
  },
  {
    fieldType: "checkbox",
    namePatterns: [
      /^(is|has|can|should|will|include|enable|allow|require|confirm|agree|accept)/i,
      /Enabled$/i,
      /Allowed$/i,
      /Required$/i,
      /Confirmed$/i,
      /Agreed$/i,
      /Accepted$/i,
      /Active$/i,
    ],
    labelPatterns: [
      /^(is|has|can|should|will|do you|does|did)/i,
      /agree/i,
      /confirm/i,
      /accept/i,
      /include/i,
      /enable/i,
      /allow/i,
      /\?$/,
    ],
    contextPatterns: ["yes/no", "boolean", "toggle", "option"],
    priority: 45,
    description: "Yes/No checkbox",
  },
  {
    fieldType: "multiselect",
    namePatterns: [
      /^(multiple|multi|many|several|various|selected)?(Types?|Options?|Choices?|Categories?|Skills?|Languages?|Interests?|Hobbies?|Features?|Benefits?|Services?|Products?)$/i,
      /^(skills|languages|interests|hobbies|features|benefits|services|products|tags|labels)$/i,
      /^(select|choose|pick).*multiple/i,
    ],
    labelPatterns: [
      /select.*multiple/i,
      /choose.*multiple/i,
      /pick.*multiple/i,
      /select all/i,
      /multiple.*select/i,
      /multiple.*choice/i,
      /all that apply/i,
      /check all/i,
    ],
    contextPatterns: ["multiple", "many", "several", "all that apply", "check all"],
    priority: 42,
    description: "Multiple options selection (checkboxes)",
  },
  {
    fieldType: "select",
    namePatterns: [
      /type$/i,
      /^(employment|contract|agreement|party|payment|currency|country|state|status|category|level|tier)?Type$/i,
      /status$/i,
      /category$/i,
      /level$/i,
      /tier$/i,
      /mode$/i,
      /frequency$/i,
      /method$/i,
    ],
    labelPatterns: [
      /select/i,
      /choose/i,
      /pick/i,
      /type of/i,
      /category/i,
      /status/i,
      /level/i,
    ],
    contextPatterns: ["options", "choices", "selection", "dropdown"],
    priority: 40,
    description: "Dropdown with predefined options",
  },
  {
    fieldType: "text",
    namePatterns: [
      /name$/i,
      /^(first|last|full|legal|display|preferred|nick|maiden)?Name$/i,
      /title$/i,
      /^(job|position|role)?Title$/i,
      /id$/i,
      /code$/i,
      /reference$/i,
    ],
    labelPatterns: [
      /name/i,
      /title/i,
      /id/i,
      /code/i,
      /reference/i,
    ],
    contextPatterns: ["identifier", "label", "short text"],
    priority: 10,
    description: "Single-line text input",
  },
];

// ============================================================================
// FIELD TYPE SUGGESTION
// ============================================================================

export interface FieldTypeSuggestion {
  fieldType: FieldType;
  confidence: "high" | "medium" | "low";
  reason: string;
  pattern: FieldPattern;
  alternatives?: FieldType[];
}

/**
 * Suggest the best field type based on field name and/or label
 */
export function suggestFieldType(
  fieldName: string,
  fieldLabel?: string,
  context?: string
): FieldTypeSuggestion {
  // Sort patterns by priority (highest first)
  const sortedPatterns = [...FIELD_PATTERNS].sort((a, b) => b.priority - a.priority);
  
  for (const pattern of sortedPatterns) {
    let matched = false;
    let matchType = "";
    
    // Check name patterns
    for (const regex of pattern.namePatterns) {
      if (regex.test(fieldName)) {
        matched = true;
        matchType = "name";
        break;
      }
    }
    
    // Check label patterns if not matched by name
    if (!matched && fieldLabel && pattern.labelPatterns) {
      for (const regex of pattern.labelPatterns) {
        if (regex.test(fieldLabel)) {
          matched = true;
          matchType = "label";
          break;
        }
      }
    }
    
    // Check context patterns
    if (!matched && context && pattern.contextPatterns) {
      const contextLower = context.toLowerCase();
      for (const contextPattern of pattern.contextPatterns) {
        if (contextLower.includes(contextPattern.toLowerCase())) {
          matched = true;
          matchType = "context";
          break;
        }
      }
    }
    
    if (matched) {
      // Determine confidence based on match type and priority
      let confidence: "high" | "medium" | "low" = "medium";
      if (matchType === "name" && pattern.priority >= 70) {
        confidence = "high";
      } else if (matchType === "name") {
        confidence = "medium";
      } else if (matchType === "label") {
        confidence = "medium";
      } else {
        confidence = "low";
      }
      
      return {
        fieldType: pattern.fieldType,
        confidence,
        reason: `Matched ${matchType} pattern: ${pattern.description}`,
        pattern,
        alternatives: getAlternativeTypes(pattern.fieldType),
      };
    }
  }
  
  // Default to text
  return {
    fieldType: "text",
    confidence: "low",
    reason: "No specific pattern matched, defaulting to text",
    pattern: FIELD_PATTERNS.find(p => p.fieldType === "text")!,
    alternatives: ["textarea", "select"],
  };
}

/**
 * Get alternative field types for a given type
 */
function getAlternativeTypes(fieldType: FieldType): FieldType[] {
  const alternatives: Record<FieldType, FieldType[]> = {
    text: ["textarea", "select"],
    email: ["text"],
    date: ["text"],
    number: ["text", "percentage", "currency"],
    checkbox: ["select"],
    select: ["text", "checkbox", "multiselect"],
    multiselect: ["select", "text"],
    textarea: ["text"],
    phone: ["text"],
    address: ["textarea", "party"],
    party: ["address", "text"],
    currency: ["number", "text"],
    percentage: ["number", "text"],
    url: ["text"],
  };
  
  return alternatives[fieldType] || ["text"];
}

/**
 * Batch suggest field types for multiple fields
 */
export function suggestFieldTypes(
  fields: Array<{ name: string; label?: string }>
): Map<string, FieldTypeSuggestion> {
  const suggestions = new Map<string, FieldTypeSuggestion>();
  
  for (const field of fields) {
    suggestions.set(field.name, suggestFieldType(field.name, field.label));
  }
  
  return suggestions;
}

// ============================================================================
// AI PROMPT GENERATION
// ============================================================================

/**
 * Generate field type guidance for AI prompts
 * This creates a concise reference for the AI to use when deciding field types
 */
export function generateFieldTypeGuide(): string {
  const guide = `
## FIELD TYPE DECISION GUIDE

ALWAYS use the most specific field type. Here's when to use each:

### COMPOSITE FIELDS (Use for complex data)

| Type | When to Use | Data Structure |
|------|-------------|----------------|
| party | Business/person with address (employer, employee, contractor, vendor) | { name, street, city, state, postalCode, country } |
| address | Physical address without name | { street, city, state, postalCode, country } |
| currency | Money amounts (salary, fees, prices, payments) | { amount, currency } |
| phone | Phone numbers | { countryCode, number } |

### SPECIALIZED FIELDS

| Type | When to Use | Example Field Names |
|------|-------------|---------------------|
| percentage | Rates, percentages (0-100) | bonusRate, commissionPercent, equityShare |
| url | Website links | website, linkedinUrl, portfolioLink |
| textarea | Multi-line descriptions | jobDescription, responsibilities, notes |
| email | Email addresses | contactEmail, workEmail |
| date | Dates | startDate, endDate, birthDate |

### BASIC FIELDS (Use as fallback)

| Type | When to Use |
|------|-------------|
| text | Short text: names, titles, IDs |
| number | Counts, quantities, durations (not money!) |
| checkbox | Yes/No questions, toggles |
| select | Fixed options (provide options array) |
| multiselect | Multiple options (checkboxes, stores array) |

### CRITICAL RULES

1. **NEVER use "text" for addresses** → Use "party" or "address"
2. **NEVER use "number" for money** → Use "currency"
3. **NEVER use "text" for phones** → Use "phone"
4. **NEVER use "text" for long descriptions** → Use "textarea"
5. **Use "party" for any entity** that needs name + address (employer, employee, etc.)
`;

  return guide.trim();
}

/**
 * Generate examples for the AI prompt
 */
export function generateFieldExamples(): string {
  return `
## FIELD TYPE EXAMPLES

### CORRECT Usage:

\`\`\`json
// For employer/company information
{ "name": "employer", "type": "party", "label": "Employer Information" }

// For employee details
{ "name": "employee", "type": "party", "label": "Employee Information" }

// For salary
{ "name": "annualSalary", "type": "currency", "label": "Annual Salary" }

// For bonus rate
{ "name": "bonusPercentage", "type": "percentage", "label": "Annual Bonus %" }

// For contact phone
{ "name": "contactPhone", "type": "phone", "label": "Phone Number" }

// For job description
{ "name": "jobDescription", "type": "textarea", "label": "Job Description" }

// For company website
{ "name": "companyWebsite", "type": "url", "label": "Company Website" }

// For work location (address only, no name)
{ "name": "workLocation", "type": "address", "label": "Work Location" }
\`\`\`

### INCORRECT Usage (avoid these):

\`\`\`json
// WRONG: Using text for company info
{ "name": "companyName", "type": "text" }
{ "name": "companyAddress", "type": "text" }
// CORRECT: Use party to capture both
{ "name": "company", "type": "party", "label": "Company Information" }

// WRONG: Using number for salary
{ "name": "salary", "type": "number" }
// CORRECT: Use currency
{ "name": "salary", "type": "currency" }

// WRONG: Using text for phone
{ "name": "phone", "type": "text" }
// CORRECT: Use phone
{ "name": "phone", "type": "phone" }
\`\`\`
`.trim();
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a field value based on its type
 */
export function validateFieldValue(
  fieldType: FieldType,
  value: unknown,
  required: boolean
): { valid: boolean; error?: string } {
  // Check required
  if (required && (value === undefined || value === null || value === "")) {
    return { valid: false, error: "This field is required" };
  }
  
  // Skip validation for empty non-required fields
  if (!required && (value === undefined || value === null || value === "")) {
    return { valid: true };
  }
  
  switch (fieldType) {
    case "email": {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === "string" && !emailPattern.test(value)) {
        return { valid: false, error: "Please enter a valid email address" };
      }
      break;
    }
    
    case "url": {
      if (typeof value === "string") {
        try {
          new URL(value.startsWith("http") ? value : `https://${value}`);
        } catch {
          return { valid: false, error: "Please enter a valid URL" };
        }
      }
      break;
    }
    
    case "percentage": {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (typeof num === "number" && (num < 0 || num > 100)) {
        return { valid: false, error: "Percentage must be between 0 and 100" };
      }
      break;
    }
    
    case "phone": {
      if (typeof value === "object" && value !== null) {
        const phone = value as { number?: string };
        if (phone.number && phone.number.replace(/\D/g, "").length < 7) {
          return { valid: false, error: "Please enter a valid phone number" };
        }
      }
      break;
    }
    
    case "currency": {
      if (typeof value === "object" && value !== null) {
        const currency = value as { amount?: number | string };
        const amount = typeof currency.amount === "string" 
          ? parseFloat(currency.amount) 
          : currency.amount;
        if (amount !== undefined && amount < 0) {
          return { valid: false, error: "Amount cannot be negative" };
        }
      }
      break;
    }
  }
  
  return { valid: true };
}
