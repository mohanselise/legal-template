# SELISE Signature Integration Plan

**Status**: ✅ Working test implementation complete (`scripts/test-prepare-rollout.ts`)
**Next Step**: Implement API route `/api/signature/prepare-and-send` based on working test

## Quick Reference

| Component | Value |
|-----------|-------|
| **Test Script** | `scripts/test-prepare-rollout.ts` |
| **API Endpoint** | `/api/signature/prepare-and-send` (to be created) |
| **SELISE APIs Used** | Identity (token), Storage (upload), Signature (prepare, rollout, events) |
| **Critical Step** | ⚠️ Wait for `preparation_success` event before rollout |
| **Token Lifetime** | 7 minutes (420 seconds) - implement retry logic |
| **Signature Class** | 0 (Simple) |
| **Signing Order** | Sequential: Company Rep (Order 1) → Employee (Order 2) |

## Overview
Integrate SELISE Signature platform with the legal templates application to enable users to send generated employment agreements for digital signing directly from the review page.

**Key Achievement**: We can now automatically place signature fields and send contracts without manual intervention in the SELISE UI.

## Key Insights from Working Implementation ✅

Based on successful testing with `scripts/test-prepare-rollout.ts`, here are the critical learnings:

### 1. **Automatic Signature Placement is Possible**
- Since we generate the PDF documents ourselves, we know exactly where signature blocks should be placed
- We can calculate precise coordinates (x, y, width, height, pageNumber) for each signature field
- No need for manual placement in SELISE UI - the entire flow can be automated

### 2. **Wait for `preparation_success` Event**
- ⚠️ **CRITICAL**: After calling `PrepareContract` API, you MUST wait for the `preparation_success` event before calling `RolloutContract`
- If you attempt rollout too early, you'll get a `400 Bad Request` error: `"The specified condition was not met for 'Document Id'"`
- Polling strategy: Check every 2 seconds, max 10 attempts (20 seconds total)

### 3. **Token Expiry Handling**
- SELISE access tokens expire after 7 minutes (420 seconds)
- Implement automatic retry logic: if any API call fails with 401/token error, regenerate token and retry once
- This ensures long-running operations (prepare → wait → rollout) don't fail mid-process

### 4. **Document Flow Validation**
- Always validate DocumentId format (must be a valid GUID) before using it in subsequent API calls
- Extract DocumentId from nested response: `result.Result?.DocumentId || result.DocumentId`
- Log all intermediate steps for debugging

### 5. **Signing Order Control**
- Use `SigningOrders` array to enforce sequential signing (company rep signs first, then employee)
- Set `Order` values starting from 1 (not 0)
- All signatories in `AddSignatoryCommands` must have a corresponding `SigningOrders` entry

### 6. **Coordinate System**
- Coordinates are in PDF points from top-left corner (0,0)
- Page numbers are 0-indexed (first page = 0)
- Test with small values first, then adjust based on actual PDF layout

### 7. **Automatic Email Sending**
- Once `RolloutContract` succeeds, SELISE automatically sends email invitations to all signatories
- No additional API call needed - it's built into the rollout process
- Check for `rollout_success` event to confirm emails were sent

## User Flow

### Current State
1. User generates an employment agreement through the AI-powered form
2. User arrives at the review page with the generated document
3. User can currently:
   - Download as DOCX
   - Send via SELISE Signature (basic implementation exists)

### Target State (Updated based on working implementation)
1. User generates an employment agreement
2. User arrives at the review page and can edit the contract
3. User clicks **"Sign with SELISE Signature"** button
4. A dialog/modal opens requesting:
   - **Company Representative Information** (signs on behalf of employer)
     - Full Name
     - Email Address
     - Phone Number (optional)
   - **Employee Information** (recipient of the contract)
     - Email Address (pre-filled from generated document if available)
     - Full Name (pre-filled from document)
     - Phone Number (optional)
5. User submits the form
6. Backend process:
   - Generate PDF from the JSON document
   - Upload PDF to SELISE Storage Service
   - Prepare contract with SELISE Signature API (sets up signatories and signing order)
   - **Wait for `preparation_success` event** from SELISE
   - **Automatically place signature fields** at predetermined positions (since we generate the document, we know exactly where signatures should go)
   - Rollout the contract with signature fields positioned
7. **Optional Enhancement**: Show preview dialog allowing user to:
   - Review automatically-placed signature field positions
   - Drag and reposition signature fields if needed
   - Adjust text field positions
   - Add additional fields (initials, dates, etc.)
8. Contract is sent automatically to signatories via email
9. **Token Refresh**: If access token expires during the process, automatically retry with newly generated token
10. User receives confirmation that contract has been sent
11. Signatories receive email invitations to sign

## Technical Implementation

### 1. Frontend Components

#### A. Signature Information Dialog (`components/signature-dialog.tsx`)
**Purpose**: Collect company representative and recipient information

**Fields**:
```typescript
interface SignatureFormData {
  // Company Representative (Employer side)
  companyRepName: string;
  companyRepEmail: string;

  // Employee (Recipient)
  recipientEmail: string;
}
```

**Validation Rules**:
- All fields are required
- Email addresses must be valid format
- Company representative email should be different from recipient email (warning, not error)

**UI Design**:
- Use shadcn/ui Dialog component
- Two distinct sections:
  1. Company Representative (blue theme - `--selise-blue`)
  2. Employee/Recipient (green theme - `--lime-green`)
- Clear labels and helpful placeholder text
- Inline validation errors
- Loading state when submitting

#### B. Review Page Updates (`app/templates/employment-agreement/generate/review/page.tsx`)
**Changes Required**:

1. Add state for dialog visibility:
```typescript
const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
```

2. Update `handleSendToSignature` function:
   - Instead of directly calling API, open the dialog
   - Move API call logic to dialog's onSubmit handler

3. Import and render `SignatureDialog` component

### 2. Backend API Routes

#### A. Create New API Route: `/api/signature/prepare-and-send`
**File**: `app/api/signature/prepare-and-send/route.ts`

**Purpose**: Handle the complete automated flow of preparing, placing signature fields, and sending a contract via SELISE Signature

**Request Payload**:
```typescript
interface PrepareAndSendRequest {
  document: EmploymentAgreement;  // Full JSON document
  formData: any;                  // Original form data

  // Company Representative (signs first)
  companyRep: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  // Employee (signs second)
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  // Optional: Custom signature field positions
  signaturePositions?: {
    companyRep: {
      signature: { x: number; y: number; width: number; height: number; pageNumber: number };
      nameField: { x: number; y: number; width: number; height: number; pageNumber: number };
      dateStamp: { x: number; y: number; width: number; height: number; pageNumber: number };
    };
    employee: {
      signature: { x: number; y: number; width: number; height: number; pageNumber: number };
      nameField: { x: number; y: number; width: number; height: number; pageNumber: number };
      dateStamp: { x: number; y: number; width: number; height: number; pageNumber: number };
    };
  };
}
```

**Response**:
```typescript
interface PrepareAndSendResponse {
  success: boolean;
  documentId: string;      // SELISE DocumentId
  trackingId: string;      // For internal tracking
  fileId: string;          // Uploaded file ID
  status: 'sent' | 'failed';
  message: string;         // User-friendly status message
  events?: Array<{         // Events received from SELISE
    Type: string;
    Status: string;
    Success: boolean;
    CreateDate: string;
  }>;
}
```

**Implementation Steps**:

1. **Authenticate with SELISE (with retry on token expiry)**
   ```typescript
   async function getAccessToken(): Promise<string> {
     const tokenResponse = await fetch('https://selise.app/api/identity/v100/identity/token', {
       method: 'POST',
       headers: {
         'Origin': 'https://selise.app',
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: new URLSearchParams({
         grant_type: 'client_credentials',
         client_id: process.env.SELISE_CLIENT_ID!,
         client_secret: process.env.SELISE_CLIENT_SECRET!,
       }),
     });

     if (!tokenResponse.ok) {
       throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
     }

     const { access_token } = await tokenResponse.json();
     return access_token;
   }

   // Usage with retry wrapper
   async function withTokenRetry<T>(
     operation: (token: string) => Promise<T>
   ): Promise<T> {
     let token = await getAccessToken();
     try {
       return await operation(token);
     } catch (error) {
       // If token expired, retry once with fresh token
       if (error.message?.includes('401') || error.message?.includes('token')) {
         console.log('Token expired, retrying with fresh token...');
         token = await getAccessToken();
         return await operation(token);
       }
       throw error;
     }
   }
   ```

2. **Generate PDF from JSON Document**
   - Use existing PDF generation logic (similar to DOCX generation)
   - Convert the JSON document structure to formatted PDF
   - Libraries to consider:
     - `pdfkit` or `pdf-lib` for PDF generation
     - Or reuse DOCX generation and convert to PDF using `libreoffice` or `docx-pdf`

   ```typescript
   // Pseudo-code
   const pdfBuffer = await generatePDFFromDocument(document, formData);
   ```

3. **Upload PDF to SELISE Storage**

   **Step 3a**: Request pre-signed upload URL
   ```typescript
   const fileId = crypto.randomUUID();
   const uploadInitResponse = await fetch(
     'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${access_token}`,
       },
       body: JSON.stringify({
         ItemId: fileId,
         MetaData: '{}',
         Name: `Employment_Agreement_${Date.now()}.pdf`,
         ParentDirectoryId: '',
         Tags: '["File", "EmploymentAgreement"]',
         AccessModifier: 'Private',
       }),
     }
   );
   const { UploadUrl, FileId } = await uploadInitResponse.json();
   ```

   **Step 3b**: Upload PDF to Azure Blob Storage
   ```typescript
   await fetch(UploadUrl, {
     method: 'PUT',
     headers: {
       'x-ms-blob-type': 'BlockBlob',
       'Content-Type': 'application/pdf',
     },
     body: pdfBuffer,
   });
   ```

4. **Prepare Contract with SELISE Signature**
   ```typescript
   const trackingId = crypto.randomUUID();
   const preparePayload = {
     TrackingId: trackingId,
     Title: `Employment Agreement - ${employee.firstName} ${employee.lastName}`,
     ContractType: 0, // Individual
     ReturnDocument: true,
     ReceiveRolloutEmail: true,
     SignatureClass: 0, // Simple signature
     Language: 'en-US',
     LandingPageType: 0, // Prepare page
     ReminderPulse: 168, // 7 days (weekly reminders)
     OwnerEmail: companyRep.email,
     FileIds: [FileId],
     AddSignatoryCommands: [
       {
         Email: companyRep.email,
         ContractRole: 0,
         FirstName: companyRep.firstName,
         LastName: companyRep.lastName,
         Phone: companyRep.phone || '',
       },
       {
         Email: employee.email,
         ContractRole: 0,
         FirstName: employee.firstName,
         LastName: employee.lastName,
         Phone: employee.phone || '',
       },
     ],
     SigningOrders: [
       { Email: companyRep.email, Order: 1 },
       { Email: employee.email, Order: 2 },
     ],
     RedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/templates/employment-agreement`,
   };

   const prepareResponse = await fetch(
     'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${access_token}`,
       },
       body: JSON.stringify(preparePayload),
     }
   );

   if (!prepareResponse.ok) {
     throw new Error(`Prepare contract failed: ${prepareResponse.status}`);
   }

   const result = await prepareResponse.json();
   const documentId = result.Result?.DocumentId || result.DocumentId;

   if (!documentId) {
     throw new Error('No DocumentId in response');
   }
   ```

5. **Wait for preparation_success Event**
   ```typescript
   // Poll for preparation_success event (max 10 attempts, 2s delay)
   async function waitForPreparationSuccess(
     accessToken: string,
     documentId: string
   ): Promise<boolean> {
     const maxAttempts = 10;
     const delayMs = 2000;

     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       const eventsResponse = await fetch(
         'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents',
         {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${accessToken}`,
           },
           body: JSON.stringify({
             DocumentId: documentId,
             Type: 'DocumentStatus',
             Status: 'preparation_success',
           }),
         }
       );

       if (eventsResponse.ok) {
         const events = await eventsResponse.json();
         const prepSuccess = events.find(
           (e: any) => e.Status === 'preparation_success' && e.Success === true
         );
         if (prepSuccess) return true;
       }

       if (attempt < maxAttempts) {
         await new Promise((resolve) => setTimeout(resolve, delayMs));
       }
     }

     return false;
   }

   const prepSuccess = await waitForPreparationSuccess(access_token, documentId);
   if (!prepSuccess) {
     throw new Error('Contract preparation did not complete in time');
   }
   ```

6. **Calculate Signature Field Positions**
   ```typescript
   // Use provided positions or calculate default positions based on PDF layout
   const positions = signaturePositions || calculateDefaultPositions(document);

   // For employment agreements, we typically place signatures on the last page
   const lastPageNumber = 0; // Will be calculated based on PDF page count

   function calculateDefaultPositions(doc: EmploymentAgreement) {
     return {
       companyRep: {
         signature: { x: 80, y: 600, width: 180, height: 70, pageNumber: lastPageNumber },
         nameField: { x: 80, y: 550, width: 180, height: 25, pageNumber: lastPageNumber },
         dateStamp: { x: 80, y: 680, width: 120, height: 20, pageNumber: lastPageNumber },
       },
       employee: {
         signature: { x: 350, y: 600, width: 180, height: 70, pageNumber: lastPageNumber },
         nameField: { x: 350, y: 550, width: 180, height: 25, pageNumber: lastPageNumber },
         dateStamp: { x: 350, y: 680, width: 120, height: 20, pageNumber: lastPageNumber },
       },
     };
   }
   ```

7. **Rollout Contract with Signature Fields**
   ```typescript
   const rolloutPayload = {
     DocumentId: documentId,
     StampCoordinates: [
       {
         FileId: FileId,
         PageNumber: positions.companyRep.signature.pageNumber,
         Width: positions.companyRep.signature.width,
         Height: positions.companyRep.signature.height,
         X: positions.companyRep.signature.x,
         Y: positions.companyRep.signature.y,
         SignatoryEmail: companyRep.email,
       },
       {
         FileId: FileId,
         PageNumber: positions.employee.signature.pageNumber,
         Width: positions.employee.signature.width,
         Height: positions.employee.signature.height,
         X: positions.employee.signature.x,
         Y: positions.employee.signature.y,
         SignatoryEmail: employee.email,
       },
     ],
     TextFieldCoordinates: [
       {
         FileId: FileId,
         PageNumber: positions.companyRep.nameField.pageNumber,
         Width: positions.companyRep.nameField.width,
         Height: positions.companyRep.nameField.height,
         X: positions.companyRep.nameField.x,
         Y: positions.companyRep.nameField.y,
         SignatoryEmail: companyRep.email,
         Value: `${companyRep.firstName} ${companyRep.lastName}`,
       },
       {
         FileId: FileId,
         PageNumber: positions.employee.nameField.pageNumber,
         Width: positions.employee.nameField.width,
         Height: positions.employee.nameField.height,
         X: positions.employee.nameField.x,
         Y: positions.employee.nameField.y,
         SignatoryEmail: employee.email,
         Value: `${employee.firstName} ${employee.lastName}`,
       },
     ],
     StampPostInfoCoordinates: [
       {
         FileId: FileId,
         PageNumber: positions.companyRep.dateStamp.pageNumber,
         Width: positions.companyRep.dateStamp.width,
         Height: positions.companyRep.dateStamp.height,
         X: positions.companyRep.dateStamp.x,
         Y: positions.companyRep.dateStamp.y,
         EntityName: 'AuditLog',
         PropertyName: '{StampTime}',
         SignatoryEmail: companyRep.email,
       },
       {
         FileId: FileId,
         PageNumber: positions.employee.dateStamp.pageNumber,
         Width: positions.employee.dateStamp.width,
         Height: positions.employee.dateStamp.height,
         X: positions.employee.dateStamp.x,
         Y: positions.employee.dateStamp.y,
         EntityName: 'AuditLog',
         PropertyName: '{StampTime}',
         SignatoryEmail: employee.email,
       },
     ],
   };

   const rolloutResponse = await fetch(
     'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${access_token}`,
       },
       body: JSON.stringify(rolloutPayload),
     }
   );

   if (!rolloutResponse.ok) {
     throw new Error(`Rollout failed: ${rolloutResponse.status}`);
   }
   ```

8. **Fetch Final Events and Return Response**
   ```typescript
   // Wait briefly for rollout_success event
   await new Promise(resolve => setTimeout(resolve, 3000));

   const finalEvents = await fetch(
     'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${access_token}`,
       },
       body: JSON.stringify({ DocumentId: documentId }),
     }
   );

   const events = finalEvents.ok ? await finalEvents.json() : [];

   return Response.json({
     success: true,
     documentId: documentId,
     trackingId: trackingId,
     fileId: FileId,
     status: 'sent',
     message: 'Contract has been sent successfully. Signatories will receive email invitations.',
     events: events,
   });
   ```

**Error Handling**:
```typescript
try {
  // Wrap entire flow in token retry wrapper
  return await withTokenRetry(async (token) => {
    // ... implementation steps 2-8 ...
  });
} catch (error) {
  console.error('SELISE Signature integration error:', error);

  // Determine error type and return appropriate response
  if (error.message?.includes('Token request failed')) {
    return Response.json(
      {
        success: false,
        status: 'failed',
        message: 'Authentication failed. Please check API credentials.',
        error: error.message,
      },
      { status: 401 }
    );
  }

  if (error.message?.includes('Upload') || error.message?.includes('Blob')) {
    return Response.json(
      {
        success: false,
        status: 'failed',
        message: 'Failed to upload document. Please try again.',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (error.message?.includes('Prepare contract failed')) {
    return Response.json(
      {
        success: false,
        status: 'failed',
        message: 'Failed to prepare contract. Invalid document data.',
        error: error.message,
      },
      { status: 400 }
    );
  }

  if (error.message?.includes('Rollout failed')) {
    return Response.json(
      {
        success: false,
        status: 'failed',
        message: 'Failed to send contract. The document may not be ready for signing.',
        error: error.message,
      },
      { status: 500 }
    );
  }

  // Generic error
  return Response.json(
    {
      success: false,
      status: 'failed',
      message: 'An unexpected error occurred. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    },
    { status: 500 }
  );
}
```

### 3. Environment Variables

Add to `.env.local`:
```bash
# SELISE Signature API Credentials
SELISE_CLIENT_ID=your_client_id_here
SELISE_CLIENT_SECRET=your_client_secret_here

# Application URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add to `.env.example`:
```bash
# SELISE Signature API Credentials
SELISE_CLIENT_ID=
SELISE_CLIENT_SECRET=

# Application URL
NEXT_PUBLIC_APP_URL=
```

### 4. PDF Generation Strategy

#### Option 1: Convert JSON to PDF directly using `pdfkit`
**Pros**:
- Full control over PDF layout
- No intermediate formats

**Cons**:
- Need to build PDF layout from scratch
- More complex implementation

#### Option 2: Reuse DOCX generation + convert to PDF
**Pros**:
- Already have DOCX generation working
- Can use `docx-pdf` npm package for conversion

**Cons**:
- Requires external dependencies
- May have formatting inconsistencies

#### Option 3: Generate HTML + use Puppeteer to render PDF
**Pros**:
- Can reuse existing DocumentRenderer component
- Easy to style with CSS

**Cons**:
- Heavy dependency (Puppeteer)
- Slower generation time

**Recommendation**: Start with Option 2 (DOCX → PDF conversion) since we already have DOCX generation working.

### 5. Database Schema (Optional - For Future)

Consider tracking signature requests in database:

```sql
CREATE TABLE signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL UNIQUE,
  document_id TEXT NOT NULL, -- SELISE DocumentId
  template_type TEXT NOT NULL,
  company_rep_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL, -- 'prepared', 'sent', 'signed', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_signature_requests_tracking_id ON signature_requests(tracking_id);
CREATE INDEX idx_signature_requests_document_id ON signature_requests(document_id);
```

**Benefits**:
- Track signature status
- Audit trail
- Enable webhooks to update status
- Show user's signature history

**Implementation**: Add this in a future iteration after basic flow is working.

## Security Considerations

1. **API Credentials**:
   - Store SELISE credentials securely in environment variables
   - Never expose credentials in client-side code
   - Rotate credentials periodically

2. **Access Tokens**:
   - Cache tokens until near expiry (7 minutes)
   - Implement token refresh logic
   - Handle token expiration gracefully

3. **Input Validation**:
   - Validate all email addresses
   - Sanitize file names
   - Validate document structure before processing

4. **Rate Limiting**:
   - Implement rate limiting on API routes
   - Prevent abuse of signature requests

5. **Error Handling**:
   - Don't expose internal error details to users
   - Log errors server-side for debugging
   - Provide user-friendly error messages

## Testing Plan

### Unit Tests
1. Signature dialog validation logic
2. Email format validation
3. PDF generation function
4. API route request/response parsing

### Integration Tests
1. Full flow from dialog submit to API response
2. SELISE API authentication
3. File upload to storage
4. Contract preparation

### Manual Testing Checklist
- [ ] Dialog opens when clicking "Send for Signing"
- [ ] Form validation works correctly
- [ ] Invalid emails are rejected
- [ ] Loading states display properly
- [ ] API successfully generates PDF
- [ ] PDF uploads to SELISE Storage
- [ ] Contract prepares successfully
- [ ] Redirect URL is correct
- [ ] User lands on SELISE Signature platform
- [ ] Document appears correctly on SELISE platform
- [ ] Error messages display appropriately
- [ ] Dialog closes after successful submission

## Implementation Order

### Phase 1: Basic Flow (MVP)
1. ✅ Create signature dialog component
2. ✅ Add form validation
3. ✅ Update review page to use dialog
4. ✅ Create API route skeleton
5. ✅ Implement SELISE authentication
6. ✅ Implement PDF generation
7. ✅ Implement file upload
8. ✅ Implement contract preparation
9. ✅ Test full flow
10. ✅ Handle errors gracefully

### Phase 2: Enhancements
1. Add loading indicators
2. Improve error messages
3. Add success confirmation
4. Cache access tokens
5. Add retry logic

### Phase 3: Advanced Features
1. Database tracking
2. Webhook integration for status updates
3. Signature history page
4. Email notifications
5. Audit logs

## API Endpoints Reference

### SELISE Production Endpoints
- **Identity**: `https://selise.app/api/identity/v100`
- **Storage**: `https://selise.app/api/storageservice/v100`
- **Signature**: `https://selise.app/api/selisign/s1`
- **Secure Storage**: `https://selise.app/api/securestorage/v1`

### Application Endpoints (New)
- **POST** `/api/signature/prepare-contract` - Prepare contract for signing

## Dependencies to Install

```bash
pnpm add pdf-lib
pnpm add docx-pdf  # If using DOCX → PDF conversion
pnpm add pdfkit @types/pdfkit  # If generating PDF directly
```

## Configuration Files to Update

1. `.env.local` - Add SELISE credentials
2. `.env.example` - Add placeholder values
3. `.gitignore` - Ensure `.env.local` is ignored (already should be)

## Documentation Updates

1. Update README.md with:
   - SELISE Signature integration overview
   - Environment variable setup instructions
   - How to obtain SELISE credentials

2. Create `docs/SIGNATURE_INTEGRATION.md` with:
   - User guide for sending contracts
   - Developer guide for maintaining integration
   - Troubleshooting common issues

## Success Criteria

1. ✅ User can send employment agreement for signing from review page
2. ✅ Dialog collects required information with validation
3. ✅ PDF is generated correctly from JSON document
4. ✅ PDF uploads successfully to SELISE Storage
5. ✅ Contract prepares successfully in SELISE Signature
6. ✅ User is redirected to SELISE platform
7. ✅ Document appears correctly in SELISE Signature
8. ✅ Errors are handled gracefully with user-friendly messages

## Future Enhancements

1. **Webhook Integration**: Receive real-time updates when contracts are signed
2. **Status Dashboard**: Show status of all sent contracts
3. **Email Templates**: Custom email notifications
4. **Multiple Templates**: Support for different document types
5. **Bulk Sending**: Send multiple contracts at once
6. **Template Library**: Pre-saved signature field positions
7. **Signing in App**: Embed SELISE Signature widget in application
8. **Advanced Signatures**: Support qualified signatures (ZertES, eIDAS)
9. **Mobile Optimization**: Better mobile experience for signing
10. **Analytics**: Track signature completion rates and times

## Implementation Notes & Best Practices

### Critical Points ⚠️
1. **ALWAYS wait for `preparation_success` event** before calling `RolloutContract`
   - Failure to do so results in `400 Bad Request` with DocumentId validation error
   - Use polling with 2-second intervals, max 10 attempts

2. **Implement token retry logic** for all operations
   - Tokens expire after 7 minutes (420 seconds)
   - Any long-running flow (prepare → wait → rollout) may span beyond token lifetime
   - Retry once with fresh token on 401 errors

3. **Validate DocumentId format** before use
   - Must be a valid GUID (UUID v4 format)
   - Extract from nested response: `result.Result?.DocumentId || result.DocumentId`

### Configuration Values
- **SignatureClass: 0** = Simple signature (no identity verification required)
- **ContractType: 0** = Individual contract (not organizational)
- **ReminderPulse** values: 24, 48, 72, 168 hours (daily, every 2 days, every 3 days, weekly)
- **Signing order**: Set to `null` for simultaneous signing; use array with `Order >= 1` for sequential
- **LandingPageType: 0** = Prepare page, **1** = Add Signatory page

### Coordinate System
- Origin (0,0) is at **top-left** corner of PDF page
- Units are **PDF points** (1 point = 1/72 inch)
- Page numbers are **0-indexed** (first page = 0)
- Recommended signature field size: 150-180pt width × 70-100pt height
- Recommended text field size: 120-180pt width × 20-27pt height

### Events to Monitor
1. `preparation_success` - Contract ready for rollout
2. `rollout_success` - Contract sent, emails dispatched
3. `signatory_signed_success` - Individual signatory completed signing
4. `document_completed` - All signatories finished, contract fully executed
5. `rollout_failed` - Rollout encountered an error

### Working Test Reference
See `scripts/test-prepare-rollout.ts` for a complete, working implementation demonstrating:
- Token generation with error handling
- File upload to SELISE Storage
- Contract preparation with signatories and signing order
- Waiting for preparation_success event
- Automatic signature field placement
- Contract rollout
- Event polling and status verification

## Updated Workflow Summary

### Complete Automated Flow (Based on Working Implementation)

```
User Action: Click "Sign with SELISE Signature"
      ↓
Frontend: Show dialog to collect signatory information
      ↓
Frontend: Submit to /api/signature/prepare-and-send
      ↓
Backend Step 1: Authenticate with SELISE (get access token)
      ↓
Backend Step 2: Generate PDF from JSON document
      ↓
Backend Step 3: Upload PDF to SELISE Storage (get FileId)
      ↓
Backend Step 4: Prepare Contract (get DocumentId)
      ↓
Backend Step 5: ⚠️ WAIT for preparation_success event (poll every 2s, max 20s)
      ↓
Backend Step 6: Calculate signature field positions (automatic based on document layout)
      ↓
Backend Step 7: Rollout Contract with signature fields
      ↓
Backend Step 8: Verify rollout_success event
      ↓
Backend: Return success response with DocumentId and tracking info
      ↓
Frontend: Show success message
      ↓
SELISE: Automatically sends email invitations to signatories
      ↓
Signatories: Receive emails and sign in sequence (company rep → employee)
```

### Optional Enhancement: Manual Field Adjustment

For Phase 2, we can add an intermediate step after automatic field placement:

```
Backend Step 6: Calculate default positions
      ↓
Backend: Return preview URL with DocumentId
      ↓
Frontend: Redirect to SELISE Signature UI in "prepare" mode
      ↓
User: Reviews auto-placed fields, adjusts if needed
      ↓
User: Clicks "Send" in SELISE UI
      ↓
SELISE: Handles rollout and email sending
```

This approach gives users the option to review and adjust, but isn't required for MVP.

## Questions & Decisions

### Resolved ✅
1. ✅ **PDF Generation**: Use Option 2 (DOCX → PDF conversion) - already have DOCX working
2. ✅ **Signature Placement**: Automatic placement is feasible and tested
3. ✅ **Sequential Signing**: Use `SigningOrders` array with `Order >= 1`
4. ✅ **Token Handling**: Implement retry wrapper for automatic token refresh
5. ✅ **Event Polling**: Must wait for `preparation_success` before rollout

### Still To Decide
1. **Database Tracking**: Should we implement this in Phase 1 or defer to Phase 2?
   - Recommendation: **Defer to Phase 2** - focus on core flow first
2. **Manual Adjustment**: Should we allow users to adjust signature fields in SELISE UI?
   - Recommendation: **Make it optional** - auto-send by default, provide "review in SELISE" option
3. **Error Handling**: How verbose should error messages be to users?
   - Recommendation: **User-friendly in production, detailed in development**
4. **Token Caching**: Should we cache access tokens in memory or Redis?
   - Recommendation: **Start with no caching** - tokens are cheap to generate, caching adds complexity

## Contact & Support

- SELISE Developer Portal: [https://developer.selise.ch](https://developer.selise.ch)
- API Documentation: See `api-doc.md` in repository
- Support: Contact SELISE Support team for API credentials and issues
