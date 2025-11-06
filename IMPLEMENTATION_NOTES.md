# Employment Agreement Generator - Implementation Notes

## Overview

This implementation provides a complete multi-step form wizard for generating employment agreements with AI-powered document generation and export capabilities.

## Features Implemented

### ✅ Multi-Step Form Wizard (Option A)
- **Step 1: Basic Information** - Company and employee details, position information
- **Step 2: Compensation & Benefits** - Salary, bonuses, equity, and benefits package
- **Step 3: Work Terms** - Location, schedule, probation, and notice periods
- **Step 4: Legal Terms** - Confidentiality, IP, non-compete, dispute resolution
- **Step 5: Review & Generate** - Preview and action buttons

### ✅ User Experience Features
- **Progress Stepper** - Visual indicator showing current step and progress
- **Form Validation** - Real-time validation with helpful error messages using Zod
- **Auto-save to localStorage** - Prevents data loss on page refresh or accidental close
- **Live Preview Panel** - Shows document details as user fills the form
- **Responsive Design** - Split-screen layout on desktop, stacked on mobile

### ✅ Document Generation
- **OpenAI Integration** - Uses GPT-4 to generate professional employment agreements
- **Structured Prompts** - Comprehensive prompt engineering for consistent output
- **Context-Aware** - Generates only relevant clauses based on user selections

### ✅ Export & Signature Options
- **Primary CTA: Send via SELISE Signature** (placeholder API)
  - Prominent button with visual emphasis
  - Mock implementation ready for real API integration
- **Secondary: Download DOCX**
  - Uses `docx` library to generate Microsoft Word documents
  - Properly formatted with headings, sections, and signature blocks

## File Structure

```
app/
  templates/
    employment-agreement/
      generate/
        _components/
          StepBasicInfo.tsx       # Step 1 form
          StepCompensation.tsx    # Step 2 form
          StepWorkTerms.tsx       # Step 3 form
          StepLegalTerms.tsx      # Step 4 form
          PreviewPanel.tsx        # Live preview sidebar
          ActionButtons.tsx       # Send/Download buttons
          FormWizard.tsx          # Main wizard controller
        schema.ts                 # Zod validation schema
        page.tsx                  # Route page

  api/
    templates/
      employment-agreement/
        generate/
          route.ts               # OpenAI document generation endpoint
    documents/
      generate-docx/
        route.ts                 # DOCX file generation endpoint
    signature/
      send/
        route.ts                 # SELISE Signature placeholder API

lib/
  openai.ts                      # OpenAI client and prompts
  document-generator.ts          # DOCX generation utilities
```

## Setup Instructions

### 1. Install Dependencies
Already installed via pnpm:
- `openai` - OpenAI API client
- `docx` - Microsoft Word document generation
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod integration for react-hook-form

### 2. Environment Variables
Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Required variables:
- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com)

Optional (placeholder):
- `SELISE_SIGNATURE_API_KEY` - SELISE Signature API key (when available)
- `SELISE_SIGNATURE_API_URL` - SELISE Signature API URL (when available)

### 3. Run Development Server

```bash
pnpm dev
```

Navigate to: `http://localhost:3000/templates/employment-agreement/generate`

## API Endpoints

### POST `/api/templates/employment-agreement/generate`
Generates employment agreement using OpenAI GPT-4.

**Request Body:**
```json
{
  "companyName": "string",
  "employeeName": "string",
  "jobTitle": "string",
  ... // all form fields
}
```

**Response:**
```json
{
  "document": "string", // generated agreement text
  "metadata": {
    "companyName": "string",
    "employeeName": "string",
    "jobTitle": "string",
    "generatedAt": "ISO date string"
  },
  "usage": { // OpenAI token usage
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  }
}
```

### POST `/api/documents/generate-docx`
Generates a DOCX file from the agreement text.

**Request Body:**
```json
{
  "document": "string",
  "formData": { /* all form fields */ }
}
```

**Response:** Binary DOCX file download

### POST `/api/signature/send`
Placeholder endpoint for SELISE Signature integration.

**Request Body:**
```json
{
  "document": "string",
  "formData": { /* all form fields */ },
  "signatories": [
    { "name": "string", "email": "string" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "trackingId": "string",
  "signatureUrl": "string",
  "signatories": [...],
  "expiresAt": "ISO date string"
}
```

## Next Steps / TODO

### SELISE Signature Integration
Replace the placeholder implementation in [`app/api/signature/send/route.ts`](app/api/signature/send/route.ts) with actual SELISE Signature API calls:

1. Get API documentation from SELISE
2. Install any required SDK or use fetch/axios
3. Update environment variables
4. Implement actual API calls:
   - Create signature request
   - Upload document
   - Add signatories
   - Get tracking/status URL
5. Add webhook handler for signature completion notifications

### Database Integration (Optional)
If you want to store generated agreements:

1. Create database schema (see CLAUDE.md for suggested structure)
2. Save generated documents to `templates` table
3. Store signature tracking in `render_jobs` table
4. Add audit logging to `audit_events` table

### Additional Enhancements
- [ ] Add PDF export option (using `pdf-lib` or `puppeteer`)
- [ ] Email delivery of generated documents
- [ ] Template variations (executive, contractor, part-time)
- [ ] Multi-language support
- [ ] Integration with HR systems (BambooHR, Workday, etc.)
- [ ] Advanced clause library with customization
- [ ] Legal compliance checks based on jurisdiction
- [ ] Electronic signature within the app (if not using SELISE)

## Testing

### Manual Testing Checklist
- [ ] Navigate through all 5 steps without errors
- [ ] Validate required field enforcement
- [ ] Test form validation (invalid email, missing fields)
- [ ] Verify auto-save functionality (refresh page mid-form)
- [ ] Generate a complete document
- [ ] Download DOCX file and verify formatting
- [ ] Test "Send to SELISE Signature" mock response
- [ ] Test responsive design on mobile/tablet
- [ ] Verify preview panel updates correctly

### Test with Various Scenarios
1. **Minimal form** - Only required fields
2. **Full form** - All fields including optional ones
3. **With non-compete** - Enable non-compete clauses
4. **Remote position** - Test remote work arrangement
5. **Hourly employee** - Test hourly vs. annual salary

## Known Limitations

1. **OpenAI API Key Required** - You must have a valid OpenAI API key with GPT-4 access
2. **SELISE Signature** - Currently a placeholder/mock implementation
3. **Legal Disclaimer** - Generated documents should be reviewed by legal professionals
4. **Jurisdiction-Specific** - May need customization for different legal jurisdictions
5. **No User Authentication** - Currently no login/user management

## Performance Considerations

- OpenAI API calls take 3-10 seconds depending on document complexity
- DOCX generation is fast (< 1 second)
- Form data stored in localStorage (limited to ~5-10MB per domain)
- Consider adding loading states and progress indicators

## Security Notes

- Never commit `.env.local` to version control
- OpenAI API calls are server-side only (API key not exposed to client)
- Validate and sanitize all user inputs
- Consider rate limiting API endpoints in production
- Add authentication before deploying to production

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- localStorage support required for auto-save

## Questions or Issues?

Refer to:
- [CLAUDE.md](CLAUDE.md) - Project guidelines and conventions
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
