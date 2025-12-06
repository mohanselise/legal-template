# AI Legal Document Generation Prompt

## OUTPUT FORMAT

Return a JSON object with this structure:

```json
{
  "metadata": {
    "title": "string",           // required
    "effectiveDate": "string",   // required (region-specific date format)
    "documentType": "string",    // required
    "jurisdiction": "string",    // optional
    "generatedAt": "string"      // required (ISO 8601 timestamp)
  },
  "content": [ /* Article blocks */ ],
  "signatories": [ /* Signatory objects */ ]
}
```

## SIGNATORIES (REQUIRED)

Include ALL parties who will sign. Each signatory:

```json
{
  "party": "string",    // required; descriptive camelCase identifier (avoid generic "other")
  "name": "string",     // required; full legal name
  "email": "string",    // required; email address
  "title": "string",    // optional; job title or role
  "role": "string",     // optional; display role for signature block
  "company": "string",  // optional; company or organization name
  "phone": "string",    // optional; phone number
  "address": "string"   // optional; signatory address
}
```

**Rules:**
- Extract from provided form data.
- Use meaningful `party` values (avoid generic "other").
- Do NOT use placeholders.

## BLOCK TYPES

### Hierarchy
```
article → section → content blocks (paragraph, list, definition, table)
```

### Article
```json
{ "type": "article", "props": { "title": "string", "number": "string" }, "children": [] }
```

### Section
```json
{ "type": "section", "props": { "title": "string|null", "number": "string" }, "children": [] }
```

### Paragraph
```json
{ "type": "paragraph", "text": "string" }
```

### List
```json
{
  "type": "list",
  "props": { "ordered": boolean },
  "children": [
    { "type": "list_item", "props": { "marker": "string" }, "text": "string" }
  ]
}
```

### Definition
```json
{
  "type": "definition",
  "children": [
    { "type": "definition_item", "props": { "term": "string" }, "text": "string" }
  ]
}
```

### Table
```json
{
  "type": "table",
  "children": [
    {
      "type": "table_row",
      "props": { "header": boolean },
      "children": [
        { "type": "table_cell", "text": "string" }
      ]
    }
  ]
}
```

## RULES

**DO:**
- Use EXACT data from user input.
- Include ALL signatories.
- Make the document elaborate: fully articulate clauses and explanations; avoid terse or fragmentary wording unless the user explicitly requests brevity.
- Use jurisdiction-appropriate language and formatting.
- Number articles/sections sequentially.
- Define key terms before using them.

**DO NOT:**
- Use placeholders ("[NAME]", "TBD", "XXX").
- Skip the signatories array.
- Use unlisted block types.
- Nest deeper than 3 levels.

## SCHEMA REFERENCE

```json
{
  "metadata": {
    "title": "string",
    "effectiveDate": "string",
    "documentType": "string",
    "jurisdiction": "string",
    "generatedAt": "string"
  },
  "content": [
    {
      "type": "article",
      "props": { "title": "string", "number": "string" },
      "children": [
        {
          "type": "section",
          "props": { "title": "string|null", "number": "string" },
          "children": [
            { "type": "paragraph", "text": "string" },
            { "type": "list", "props": { "ordered": "boolean" }, "children": [
              { "type": "list_item", "props": { "marker": "string" }, "text": "string" }
            ]},
            { "type": "definition", "children": [
              { "type": "definition_item", "props": { "term": "string" }, "text": "string" }
            ]},
            { "type": "table", "children": [
              { "type": "table_row", "props": { "header": "boolean" }, "children": [
                { "type": "table_cell", "text": "string" }
              ]}
            ]}
          ]
        }
      ]
    }
  ],
  "signatories": [
    {
      "party": "string",
      "name": "string",
      "email": "string",
      "title": "string",
      "role": "string",
      "company": "string",
      "phone": "string",
      "address": "string"
    }
  ]
}
```
