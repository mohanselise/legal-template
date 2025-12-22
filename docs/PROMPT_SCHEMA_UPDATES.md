# Prompt Schema Updates for Jurisdiction-Aware Content

This document describes the schema additions that enable AI-controlled, jurisdiction-appropriate content in generated legal documents.

## Overview

The PDF renderer no longer hardcodes content like "ARTICLE", "IN WITNESS WHEREOF", etc. Instead, the AI controls all display content based on the jurisdiction, while the renderer handles only structure and styling.

**Principle:** Renderer handles structure, rendering, and integrity. AI handles all content decisions.

---

## New Schema Fields

### 1. Article Title Format

The `props.title` for article blocks must now include the complete display text with the jurisdiction-appropriate label.

**Before (old format - still supported for backward compatibility):**
```json
{ 
  "type": "article", 
  "props": { "title": "Parties", "number": "1" }, 
  "children": [...] 
}
```
Renderer would add: "ARTICLE 1: Parties"

**After (new format - recommended):**
```json
{ 
  "type": "article", 
  "props": { "title": "CLAUSE 1: Parties", "number": "1" }, 
  "children": [...] 
}
```
Renderer displays exactly: "CLAUSE 1: Parties"

**Jurisdiction Examples:**
- **UK/Commonwealth/Hong Kong:** `"CLAUSE 1: Parties"`, `"CLAUSE 2: Definitions"`, etc.
- **US jurisdictions:** `"ARTICLE 1: Parties"` or `"SECTION 1: Parties"`
- **EU/Civil Law:** `"Article 1: Parties"` (Title case, not uppercase)

---

### 2. Signature Page Configuration

Add `signaturePageConfig` to the document root for jurisdiction-appropriate signature page content.

```json
{
  "metadata": { ... },
  "content": [ ... ],
  "signatories": [ ... ],
  "signaturePageConfig": {
    "title": "string",              // Section title (default: "Signatures")
    "attestationClause": "string",  // Attestation text (default: "IN WITNESS WHEREOF...")
    "signatureLabel": "string",     // Field label (default: "Signature")
    "dateLabel": "string"           // Field label (default: "Date")
  }
}
```

**Jurisdiction Examples:**

**US:**
```json
{
  "signaturePageConfig": {
    "title": "Signatures",
    "attestationClause": "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.",
    "signatureLabel": "Signature",
    "dateLabel": "Date"
  }
}
```

**UK:**
```json
{
  "signaturePageConfig": {
    "title": "Execution",
    "attestationClause": "This Agreement has been executed as a deed and is delivered and takes effect on the date stated at the beginning of it.",
    "signatureLabel": "Signature",
    "dateLabel": "Date"
  }
}
```

**Germany:**
```json
{
  "signaturePageConfig": {
    "title": "Unterschriften",
    "attestationClause": "Die Parteien haben diese Vereinbarung zum oben genannten Datum unterzeichnet.",
    "signatureLabel": "Unterschrift",
    "dateLabel": "Datum"
  }
}
```

**No Attestation (minimal style):**
```json
{
  "signaturePageConfig": {
    "title": "Signatures",
    "attestationClause": null
  }
}
```

---

### 3. Metadata Additions

Add these optional fields to `metadata` for locale-specific formatting:

```json
{
  "metadata": {
    "title": "Non-Disclosure Agreement",
    "effectiveDate": "2025-01-15",
    "effectiveDateLabel": "Effective Date:",
    "documentType": "nda",
    "jurisdiction": "United Kingdom",
    "generatedAt": "2025-01-15T10:30:00Z",
    "dateLocale": "en-GB",
    "pageNumberFormat": "Page {page} of {total}"
  }
}
```

**dateLocale:** Controls date formatting in the document
- `"en-US"` → "January 15, 2025"
- `"en-GB"` → "15 January 2025"
- `"de-DE"` → "15. Januar 2025"

**pageNumberFormat:** Template for page numbers
- Default: `"Page {page} of {total}"`
- German: `"Seite {page} von {total}"`
- French: `"Page {page} sur {total}"`

---

## Prompt Instructions to Add

Add this section to your system prompt in the admin dashboard:

```markdown
## JURISDICTION-AWARE CONTENT

### Article/Clause Titles

The `props.title` for article blocks MUST include the complete display text with the jurisdiction-appropriate label:

- **UK/Commonwealth/Hong Kong:** "CLAUSE 1: [Title]", "CLAUSE 2: [Title]", etc.
- **US jurisdictions:** "ARTICLE 1: [Title]" or "SECTION 1: [Title]"
- **EU/Civil Law:** "Article 1: [Title]" (Title case, not uppercase)

The `props.number` should contain just the number (e.g., "1", "2") for semantic purposes.

### Signature Page Configuration (Optional but Recommended)

For jurisdiction-appropriate signature pages, include:

{
  "signaturePageConfig": {
    "title": "string",              // e.g., "Signatures", "Execution", "Unterschriften"
    "attestationClause": "string",  // e.g., "IN WITNESS WHEREOF..." (US) or "Executed as a deed..." (UK)
    "signatureLabel": "string",     // e.g., "Signature", "Unterschrift"
    "dateLabel": "string"           // e.g., "Date", "Datum"
  }
}

### Metadata Locale Settings

Include locale-specific formatting in metadata:

{
  "metadata": {
    ...
    "dateLocale": "en-GB",  // For UK date format
    "pageNumberFormat": "Page {page} of {total}"
  }
}
```

---

## Backward Compatibility

The renderer includes fallback logic for existing documents:

1. **Article titles:** If `props.title` doesn't contain a recognized prefix pattern (ARTICLE/CLAUSE/SECTION), the renderer falls back to the legacy format: `ARTICLE {number}: {title}`

2. **Signature page:** If `signaturePageConfig` is not provided, defaults are used:
   - title: "Signatures"
   - attestationClause: "IN WITNESS WHEREOF..."
   - signatureLabel: "Signature"
   - dateLabel: "Date"

3. **Date locale:** If `dateLocale` is not provided, defaults to `"en-US"`

4. **Page number format:** If `pageNumberFormat` is not provided, defaults to `"Page {page} of {total}"`

---

## Files Modified

| File | Change |
|------|--------|
| `lib/pdf/components/BlockRenderer.tsx` | Uses `props.title` directly with backward compat fallback |
| `lib/pdf/components/SignaturePage.tsx` | Accepts `config` prop for all text content |
| `lib/pdf/LegalDocumentPDF.tsx` | Passes `signaturePageConfig`, uses `dateLocale` and `pageNumberFormat` |
| `app/api/templates/employment-agreement/schema.ts` | Added `SignaturePageConfig` interface, `dateLocale`, `pageNumberFormat` to metadata |
