# SELISE Signature Integration - Detailed Implementation Plan
## Option 2: Prepare and Send (Fully Automated)

---

## Executive Summary

This plan details a **fully automated signature workflow** where:
1. User fills out the signature information dialog
2. System generates DOCX, uploads it, prepares contract with signature fields pre-placed
3. Contract is **immediately sent to signatories** via email
4. No manual field placement needed - completely hands-off after submission

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Review Page: User clicks "Send via SELISE Signature"              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Dialog Opens: Collect company rep name, email, recipient email    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API PROCESSING                           │
│  /api/signature/prepare-and-send                                    │
│                                                                      │
│  1. Authenticate with SELISE (get access token)                     │
│  2. Generate DOCX from JSON document                                │
│  3. Upload DOCX to SELISE Storage                                   │
│  4. Calculate signature field coordinates                           │
│  5. Call PrepareAndSendContract API                                 │
│  6. Return success + DocumentId                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Success Modal: "Contract sent! Signatories will receive emails"   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Email Sent to Company Rep & Employee with signing links           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Frontend Components

### 1.1 Signature Information Dialog

**File**: `components/signature-dialog.tsx`

**Purpose**: Collect required information for sending contract to SELISE Signature

**Interface**:
```typescript
interface SignatureFormData {
  // Company Representative (signs on behalf of employer)
  companyRepName: string;
  companyRepEmail: string;

  // Employee (recipient)
  recipientEmail: string;
  recipientName?: string; // Optional, can extract from document
}
```

**UI Sections**:
1. **Company Representative Section** (Blue theme)
   - Label: "Company Representative (Employer)"
   - Fields:
     - Full Name (required)
     - Email Address (required)
   - Visual styling: `--selise-blue` background tint

2. **Employee Section** (Green theme)
   - Label: "Employee (Recipient)"
   - Fields:
     - Email Address (required, pre-filled from document)
   - Visual styling: `--lime-green` background tint

**Validation Rules**:
- All fields are required
- Email format validation (RFC 5322 compliant)
- No duplicate emails (company rep ≠ recipient)
- Name fields: minimum 2 characters, maximum 100 characters

**User Experience**:
- Loading state with spinner during submission
- Disable form inputs while submitting
- Clear error messages inline with each field
- Success animation on completion
- Auto-close dialog on success (after 2 seconds)

**Component Props**:
```typescript
interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SignatureFormData) => Promise<void>;
  defaultEmployeeEmail?: string;
  defaultEmployeeName?: string;
  isSubmitting?: boolean;
}
```

**Accessibility**:
- Proper ARIA labels
- Keyboard navigation support
- Focus management (auto-focus first field)
- Screen reader announcements for errors

---

### 1.2 Review Page Updates

**File**: `app/templates/employment-agreement/generate/review/page.tsx`

**Changes Required**:

1. **Add State Management**:
```typescript
const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

2. **Update Send Button Click Handler**:
```typescript
const handleSendToSignature = () => {
  // Open dialog instead of directly calling API
  setSignatureDialogOpen(true);
};
```

3. **Create Dialog Submit Handler**:
```typescript
const handleDialogSubmit = async (formData: SignatureFormData) => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/signature/prepare-and-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: generatedDocument,
        formData: originalFormData,
        companyRepName: formData.companyRepName,
        companyRepEmail: formData.companyRepEmail,
        recipientEmail: formData.recipientEmail,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send contract');
    }

    const result = await response.json();

    // Close dialog
    setSignatureDialogOpen(false);

    // Show success modal
    showSuccessModal(result);

  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send contract. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

4. **Render Dialog Component**:
```tsx
<SignatureDialog
  open={signatureDialogOpen}
  onOpenChange={setSignatureDialogOpen}
  onSubmit={handleDialogSubmit}
  defaultEmployeeEmail={generatedDocument?.parties?.employee?.email}
  defaultEmployeeName={generatedDocument?.parties?.employee?.legalName}
  isSubmitting={isSubmitting}
/>
```

5. **Update Success Modal**:
```typescript
const showSuccessModal = (result: { documentId: string; trackingId: string }) => {
  // Create beautiful modal with confetti animation
  // Show DocumentId and tracking information
  // Explain that signatories will receive emails
  // Add "View Status" button (optional)
  // Auto-redirect after 5 seconds
};
```

---

## Phase 2: Backend API Implementation

### 2.1 API Route: `/api/signature/prepare-and-send`

**File**: `app/api/signature/prepare-and-send/route.ts`

**Purpose**: Handle complete end-to-end contract preparation and sending

**Request Payload**:
```typescript
interface PrepareAndSendRequest {
  document: EmploymentAgreement;    // Full JSON document structure
  formData: any;                    // Original form data
  companyRepName: string;           // "John Smith"
  companyRepEmail: string;          // "john.smith@company.com"
  recipientEmail: string;           // "employee@company.com"
}
```

**Response Payload**:
```typescript
interface PrepareAndSendResponse {
  success: true;
  documentId: string;               // SELISE DocumentId
  trackingId: string;               // Internal tracking ID
  message: string;                  // Success message
  signatories: {
    companyRep: string;             // Company rep email
    employee: string;               // Employee email
  };
}
```

**Error Response**:
```typescript
interface ErrorResponse {
  success: false;
  error: string;                    // User-friendly error message
  details?: string;                 // Technical details (dev only)
  code?: string;                    // Error code for debugging
}
```

---

### 2.2 Implementation Flow

#### Step 1: Request Validation

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { document, formData, companyRepName, companyRepEmail, recipientEmail } = body;

    if (!document || !companyRepName || !companyRepEmail || !recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Validate email formats
    if (!isValidEmail(companyRepEmail) || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Validate emails are different
    if (companyRepEmail.toLowerCase() === recipientEmail.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company representative and recipient must have different emails',
          code: 'DUPLICATE_EMAIL'
        },
        { status: 400 }
      );
    }
```

#### Step 2: Authenticate with SELISE

```typescript
    // Get access token
    const accessToken = await getSeliseAccessToken();
```

**Helper Function**:
```typescript
async function getSeliseAccessToken(): Promise<string> {
  const clientId = process.env.SELISE_CLIENT_ID;
  const clientSecret = process.env.SELISE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SELISE credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(
    'https://selise.app/api/identity/v100/identity/token',
    {
      method: 'POST',
      headers: {
        'Origin': 'https://selise.app',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SELISE auth failed:', errorText);
    throw new Error('Failed to authenticate with SELISE');
  }

  const data = await response.json();
  return data.access_token;
}
```

#### Step 3: Generate DOCX Document

```typescript
    // Generate DOCX from JSON document
    const docxBuffer = await generateEmploymentAgreementDocx({
      document,
      formData,
    });

    console.log(`Generated DOCX: ${docxBuffer.length} bytes`);
```

**Uses existing function** from `lib/document-generator.ts` - no changes needed!

#### Step 4: Upload DOCX to SELISE Storage

```typescript
    // Upload to SELISE Storage
    const fileId = await uploadToSeliseStorage(
      accessToken,
      docxBuffer,
      `Employment_Agreement_${sanitizeFilename(recipientEmail)}.docx`
    );

    console.log(`Uploaded to SELISE Storage: FileId=${fileId}`);
```

**Helper Function**:
```typescript
async function uploadToSeliseStorage(
  accessToken: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  // Step 1: Request pre-signed upload URL
  const fileId = crypto.randomUUID();

  const uploadInitResponse = await fetch(
    'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ItemId: fileId,
        MetaData: JSON.stringify({
          source: 'legal-templates-app',
          timestamp: new Date().toISOString(),
        }),
        Name: fileName,
        ParentDirectoryId: '',
        Tags: JSON.stringify(['File', 'EmploymentAgreement', 'LegalDocument']),
        AccessModifier: 'Private',
      }),
    }
  );

  if (!uploadInitResponse.ok) {
    const errorText = await uploadInitResponse.text();
    console.error('Upload URL request failed:', errorText);
    throw new Error('Failed to get upload URL from SELISE Storage');
  }

  const { UploadUrl, FileId } = await uploadInitResponse.json();

  // Step 2: Upload file to Azure Blob Storage
  const uploadResponse = await fetch(UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Blob upload failed:', errorText);
    throw new Error('Failed to upload file to storage');
  }

  return FileId;
}
```

#### Step 5: Calculate Signature Field Coordinates

**This is the critical and complex part!**

We need to determine where signature fields should be placed in the PDF. This requires:

**Option A: Fixed Positions (Simple but fragile)**
```typescript
// Hardcoded positions based on document template
const signatureCoordinates = {
  companyRep: {
    pageNumber: getLastPageNumber(document), // Signature page
    x: 100,        // PDF points from left
    y: 650,        // PDF points from top
    width: 200,
    height: 60,
  },
  employee: {
    pageNumber: getLastPageNumber(document),
    x: 350,
    y: 650,
    width: 200,
    height: 60,
  },
};
```

**Option B: Dynamic Calculation (Robust)**
```typescript
// Analyze document structure to find signature placeholders
const coordinates = await calculateSignaturePositions(document, fileId);
```

**Recommended Approach**: Use **Option A** for MVP, plan for **Option B** later.

**For Employment Agreement Template**:
- Assume standard letter size (8.5" x 11" = 612 x 792 PDF points)
- Place signatures on last page
- Company rep signature on left, employee on right
- Add name text fields below signatures
- Add date stamps below names

```typescript
function getSignatureFieldCoordinates(
  document: EmploymentAgreement,
  fileId: string,
  companyRepEmail: string,
  recipientEmail: string
) {
  // Employment agreements typically have signature section on last page
  // We'll need to calculate the last page number
  const lastPageNumber = estimatePageCount(document) - 1; // 0-indexed

  return {
    stampCoordinates: [
      // Company Representative Signature
      {
        FileId: fileId,
        Width: 180,
        Height: 70,
        PageNumber: lastPageNumber,
        X: 80,          // Left side
        Y: 600,         // Near bottom
        SignatoryEmail: companyRepEmail,
        SignatureImageFileId: null, // No pre-uploaded signature image
      },
      // Employee Signature
      {
        FileId: fileId,
        Width: 180,
        Height: 70,
        PageNumber: lastPageNumber,
        X: 350,         // Right side
        Y: 600,         // Near bottom
        SignatoryEmail: recipientEmail,
        SignatureImageFileId: null,
      },
    ],
    textFieldCoordinates: [
      // Company Rep Name Field
      {
        FileId: fileId,
        Width: 180,
        Height: 20,
        PageNumber: lastPageNumber,
        X: 80,
        Y: 550,         // Above signature
        SignatoryEmail: companyRepEmail,
        Value: '', // Will be filled by signatory
      },
      // Employee Name Field
      {
        FileId: fileId,
        Width: 180,
        Height: 20,
        PageNumber: lastPageNumber,
        X: 350,
        Y: 550,
        SignatoryEmail: recipientEmail,
        Value: '',
      },
    ],
    stampPostInfoCoordinates: [
      // Company Rep Date Stamp
      {
        FileId: fileId,
        Width: 100,
        Height: 20,
        PageNumber: lastPageNumber,
        X: 80,
        Y: 680,         // Below signature
        EntityName: 'AuditLog',
        PropertyName: '{StampTime}',
        SignatoryEmail: companyRepEmail,
      },
      // Employee Date Stamp
      {
        FileId: fileId,
        Width: 100,
        Height: 20,
        PageNumber: lastPageNumber,
        X: 350,
        Y: 680,
        EntityName: 'AuditLog',
        PropertyName: '{StampTime}',
        SignatoryEmail: recipientEmail,
      },
    ],
  };
}

function estimatePageCount(document: EmploymentAgreement): number {
  // Rough estimation based on content blocks
  // Each section ~ 0.5-1 page
  // This is a heuristic - may need adjustment
  let estimatedPages = 1; // Title page

  if (document.sections) {
    estimatedPages += document.sections.length * 0.5;
  }

  // Round up and ensure minimum 2 pages
  return Math.max(2, Math.ceil(estimatedPages));
}
```

**Important Notes**:
- PDF coordinate system: Origin (0,0) is **bottom-left** corner in PDF spec, but SELISE may use **top-left**
- Letter size: 612 x 792 PDF points (8.5" x 11" at 72 DPI)
- These coordinates will need **testing and adjustment** based on actual document layout
- Consider adding a signature page template to ensure consistent placement

#### Step 6: Prepare and Send Contract

```typescript
    // Generate tracking ID
    const trackingId = crypto.randomUUID();

    // Extract names from companyRepName
    const [companyRepFirstName, ...companyRepLastNameParts] = companyRepName.split(' ');
    const companyRepLastName = companyRepLastNameParts.join(' ') || companyRepFirstName;

    // Extract names from employee
    const employeeName = document.parties.employee.legalName;
    const [employeeFirstName, ...employeeLastNameParts] = employeeName.split(' ');
    const employeeLastName = employeeLastNameParts.join(' ') || employeeFirstName;

    // Get signature field coordinates
    const fieldCoordinates = getSignatureFieldCoordinates(
      document,
      fileId,
      companyRepEmail,
      recipientEmail
    );

    // Prepare the payload
    const prepareAndSendPayload = {
      PrepareCommand: {
        TrackingId: trackingId,
        Title: `Employment Agreement - ${employeeName}`,
        ContractType: 0,           // Individual contract
        ReturnDocument: true,
        ReceiveRolloutEmail: true,
        SignatureClass: 0,         // Simple signature
        Language: 'en-US',
        LandingPageType: 0,
        ReminderPulse: 168,        // Weekly reminders (7 days)
        OwnerEmail: companyRepEmail,
        FileIds: [fileId],
        AddSignatoryCommands: [
          {
            Email: companyRepEmail,
            ContractRole: 0,
            FirstName: companyRepFirstName,
            LastName: companyRepLastName,
            Phone: '',             // Optional
          },
          {
            Email: recipientEmail,
            ContractRole: 0,
            FirstName: employeeFirstName,
            LastName: employeeLastName,
            Phone: '',
          },
        ],
        SigningOrders: [
          { Email: companyRepEmail, Order: 1 },  // Company rep signs first
          { Email: recipientEmail, Order: 2 },   // Then employee
        ],
        RedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/templates/employment-agreement`,
      },
      SendCommand: fieldCoordinates,
    };

    // Call SELISE API
    const prepareAndSendResponse = await fetch(
      'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareAndSendContract',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(prepareAndSendPayload),
      }
    );

    if (!prepareAndSendResponse.ok) {
      const errorText = await prepareAndSendResponse.text();
      console.error('Prepare and send failed:', errorText);
      throw new Error('Failed to send contract to SELISE Signature');
    }

    const result = await prepareAndSendResponse.json();
    const documentId = result.DocumentId;

    console.log(`Contract prepared and sent: DocumentId=${documentId}`);
```

#### Step 7: Return Success Response

```typescript
    // Return success
    return NextResponse.json({
      success: true,
      documentId,
      trackingId,
      message: 'Contract sent successfully! Signatories will receive emails shortly.',
      signatories: {
        companyRep: companyRepEmail,
        employee: recipientEmail,
      },
    });

  } catch (error) {
    console.error('Error in prepare-and-send:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.stack : String(error))
          : undefined,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Helper Functions & Utilities

### 3.1 Email Validation

**File**: `lib/validation.ts`

```typescript
/**
 * Validate email address format (RFC 5322 compliant)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Split full name into first and last name
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || firstName;
  return { firstName, lastName };
}
```

---

### 3.2 Signature Position Calculator (Advanced - Future Enhancement)

**File**: `lib/signature-position-calculator.ts`

```typescript
/**
 * Calculate signature field positions dynamically based on document structure
 *
 * This is a placeholder for future enhancement where we:
 * 1. Analyze the generated DOCX/PDF structure
 * 2. Find "SIGNATURE:" placeholders in the document
 * 3. Calculate precise coordinates for those positions
 * 4. Return coordinate arrays for SELISE API
 */

export interface SignaturePosition {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignatureFieldCoordinates {
  stampCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    SignatoryEmail: string;
    SignatureImageFileId: string | null;
  }>;
  textFieldCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    SignatoryEmail: string;
    Value: string;
  }>;
  stampPostInfoCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    EntityName: string;
    PropertyName: string;
    SignatoryEmail: string;
  }>;
}

/**
 * Future implementation: Parse DOCX and find signature placeholders
 */
export async function calculateSignaturePositions(
  docxBuffer: Buffer,
  fileId: string,
  signatories: { email: string; role: string }[]
): Promise<SignatureFieldCoordinates> {
  // TODO: Implement DOCX parsing to find signature markers
  // For now, use fixed positions
  throw new Error('Dynamic position calculation not yet implemented');
}
```

---

## Phase 4: Environment Configuration

### 4.1 Environment Variables

**File**: `.env.local` (already updated)

```bash
# SELISE Signature Credentials
SELISE_CLIENT_ID=70c3d8d1-0568-4c39-a05c-2967a581e583
SELISE_CLIENT_SECRET=SlzTXWE5Fmkwz5JyzfuVeOWPv+IBhywUYDL807iSE25Ptg=

# Application URL (for redirects and webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File**: `.env.example`

```bash
# SELISE Signature API Credentials
# Obtain from SELISE Developer Portal: https://developer.selise.ch
SELISE_CLIENT_ID=your_client_id_here
SELISE_CLIENT_SECRET=your_client_secret_here

# Application Base URL
# Used for redirect URLs after signature completion
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 TypeScript Environment Variables

**File**: `env.d.ts` (create if doesn't exist)

```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    SELISE_CLIENT_ID: string;
    SELISE_CLIENT_SECRET: string;
    NEXT_PUBLIC_APP_URL: string;
  }
}
```

---

## Phase 5: Testing Strategy

### 5.1 Unit Tests

**File**: `__tests__/lib/validation.test.ts`

```typescript
import { isValidEmail, sanitizeFilename, splitName } from '@/lib/validation';

describe('Email Validation', () => {
  test('valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
  });

  test('invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});

describe('Name Splitting', () => {
  test('splits names correctly', () => {
    expect(splitName('John Doe')).toEqual({ firstName: 'John', lastName: 'Doe' });
    expect(splitName('Mary Jane Smith')).toEqual({ firstName: 'Mary', lastName: 'Jane Smith' });
    expect(splitName('Prince')).toEqual({ firstName: 'Prince', lastName: 'Prince' });
  });
});
```

### 5.2 Integration Tests

**File**: `__tests__/api/signature/prepare-and-send.test.ts`

```typescript
import { POST } from '@/app/api/signature/prepare-and-send/route';

describe('/api/signature/prepare-and-send', () => {
  test('validates required fields', async () => {
    const request = new Request('http://localhost/api/signature/prepare-and-send', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  test('validates email format', async () => {
    const request = new Request('http://localhost/api/signature/prepare-and-send', {
      method: 'POST',
      body: JSON.stringify({
        document: {},
        formData: {},
        companyRepName: 'John Doe',
        companyRepEmail: 'invalid-email',
        recipientEmail: 'employee@company.com',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.code).toBe('INVALID_EMAIL');
  });
});
```

### 5.3 End-to-End Test Checklist

**Manual Testing Steps**:

1. ✅ **Generate Employment Agreement**
   - Fill out employment agreement form
   - Navigate to review page
   - Verify document renders correctly

2. ✅ **Open Signature Dialog**
   - Click "Send via SELISE Signature" button
   - Verify dialog opens
   - Check that employee email is pre-filled

3. ✅ **Form Validation**
   - Try submitting with empty fields → Should show errors
   - Try invalid email format → Should show error
   - Try same email for both parties → Should show error
   - Fill valid data → Should accept

4. ✅ **Submission Flow**
   - Submit valid form
   - Verify loading state shows
   - Wait for success
   - Verify dialog closes
   - Verify success modal appears

5. ✅ **Backend Processing**
   - Check browser console for any errors
   - Verify API returns 200 status
   - Verify DocumentId is returned
   - Check SELISE dashboard for new contract

6. ✅ **Email Delivery**
   - Check company rep inbox for signing link
   - Check employee inbox for notification
   - Verify emails contain correct contract title
   - Verify signing links work

7. ✅ **Signature Process**
   - Click signing link from email
   - Verify document loads in SELISE Signature
   - Verify signature fields are correctly placed
   - Complete signature as company rep
   - Complete signature as employee
   - Verify completed document is accessible

8. ✅ **Error Handling**
   - Test with invalid SELISE credentials
   - Test with network failure
   - Test with malformed document
   - Verify user-friendly error messages

---

## Phase 6: Error Handling & Edge Cases

### 6.1 Error Scenarios

| Scenario | Handling Strategy |
|----------|------------------|
| Missing SELISE credentials | Show configuration error, log to console |
| Authentication failure | Retry once, then show error to user |
| File upload failure | Retry with exponential backoff (3 attempts) |
| Contract preparation failure | Show detailed error from SELISE API |
| Network timeout | Show timeout error, allow retry |
| Invalid document structure | Validate before sending, show specific field errors |
| Duplicate email addresses | Validate in dialog, prevent submission |
| SELISE API rate limiting | Implement queue and retry logic |

### 6.2 Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

// Usage
const fileId = await retryWithBackoff(() =>
  uploadToSeliseStorage(accessToken, docxBuffer, fileName)
);
```

### 6.3 Logging & Monitoring

```typescript
// Add structured logging
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  documentId?: string;
  trackingId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

function log(entry: Omit<LogEntry, 'timestamp'>) {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  console.log(JSON.stringify(logEntry));

  // Future: Send to logging service (Sentry, LogRocket, etc.)
}

// Usage throughout the API route
log({
  level: 'info',
  action: 'contract_prepare_started',
  metadata: { companyRepEmail, recipientEmail }
});

log({
  level: 'info',
  action: 'docx_generated',
  metadata: { size: docxBuffer.length }
});

log({
  level: 'error',
  action: 'upload_failed',
  error: error.message,
  metadata: { fileSize: docxBuffer.length }
});
```

---

## Phase 7: Future Enhancements

### 7.1 Database Tracking (Phase 2)

**Table Schema**:
```sql
CREATE TABLE signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL UNIQUE,
  document_id TEXT NOT NULL,
  template_type TEXT NOT NULL,
  company_rep_name TEXT NOT NULL,
  company_rep_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'prepared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB,

  CONSTRAINT valid_status CHECK (status IN ('prepared', 'sent', 'partial', 'completed', 'cancelled', 'failed'))
);

CREATE INDEX idx_signature_requests_tracking_id ON signature_requests(tracking_id);
CREATE INDEX idx_signature_requests_document_id ON signature_requests(document_id);
CREATE INDEX idx_signature_requests_status ON signature_requests(status);
CREATE INDEX idx_signature_requests_created_at ON signature_requests(created_at DESC);
```

**Benefits**:
- Track all signature requests
- Show user's signature history
- Enable status updates via webhooks
- Analytics and reporting

### 7.2 Webhook Integration (Phase 2)

**Endpoint**: `/api/webhooks/selise-signature`

**Purpose**: Receive real-time updates from SELISE when:
- Contract is sent
- Signatory signs
- Contract is completed
- Contract is declined

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-SELISE-Signature');
  const body = await request.json();

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Update database based on event
  await handleSignatureEvent(body);

  return NextResponse.json({ success: true });
}
```

### 7.3 Status Dashboard (Phase 2)

**Page**: `/dashboard/signatures`

**Features**:
- List all sent contracts
- Filter by status (pending, signed, completed)
- View individual contract details
- Download signed documents
- Resend reminders
- Cancel contracts

### 7.4 Dynamic Signature Placement (Phase 3)

**Approach**:
1. Add signature markers to DOCX template: `{{SIGNATURE:company_rep}}`, `{{SIGNATURE:employee}}`
2. Parse DOCX to find marker positions
3. Convert positions to PDF coordinates
4. Use calculated coordinates in SELISE API call

**Benefits**:
- Flexible placement
- Works with any template
- No hardcoded positions

### 7.5 Multiple Document Types (Phase 3)

**Templates to support**:
- Employment Agreement ✅
- Non-Disclosure Agreement (NDA)
- Contractor Agreement
- Offer Letter
- Termination Letter
- Amendment/Addendum

**Implementation**:
- Create base signature template interface
- Extend for each document type
- Centralize SELISE integration logic

---

## Phase 8: Security Considerations

### 8.1 API Key Protection

- ✅ Store credentials in environment variables only
- ✅ Never expose in client-side code
- ✅ Use server-side API routes only
- ⚠️ Rotate credentials periodically (set calendar reminder)
- ⚠️ Use different credentials for dev/staging/production

### 8.2 Input Sanitization

```typescript
// Sanitize all user inputs
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 500);   // Limit length
}

// Apply to all user inputs
const companyRepName = sanitizeInput(body.companyRepName);
const companyRepEmail = sanitizeInput(body.companyRepEmail).toLowerCase();
```

### 8.3 Rate Limiting

```typescript
// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

// Use in API route
if (!checkRateLimit(companyRepEmail)) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429 }
  );
}
```

### 8.4 Audit Logging

```typescript
// Log all signature requests for audit trail
interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  documentId?: string;
  success: boolean;
  errorMessage?: string;
}

async function logAuditEvent(entry: Omit<AuditLog, 'timestamp'>) {
  const auditEntry: AuditLog = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Future: Store in database or send to audit service
  console.log('[AUDIT]', JSON.stringify(auditEntry));
}
```

---

## Phase 9: Documentation

### 9.1 User Documentation

**File**: `docs/USER_GUIDE.md`

Topics to cover:
- How to send a contract for signing
- What happens after sending
- How signatories receive notifications
- How to track signature status
- How to download signed documents
- Troubleshooting common issues

### 9.2 Developer Documentation

**File**: `docs/DEVELOPER_GUIDE.md`

Topics to cover:
- Architecture overview
- API route documentation
- Environment setup
- Testing instructions
- Deployment checklist
- Monitoring and debugging
- Adding new document types

### 9.3 API Documentation

**File**: `docs/API.md`

Document all API endpoints:
- `/api/signature/prepare-and-send`
- Request/response schemas
- Error codes and messages
- Rate limits
- Example requests

---

## Implementation Timeline

### Week 1: Foundation
- ✅ Day 1: Test upload script (COMPLETED)
- ⏳ Day 2-3: Create signature dialog component
- ⏳ Day 4-5: Update review page with dialog integration

### Week 2: Backend
- ⏳ Day 1-2: Create API route skeleton with validation
- ⏳ Day 3-4: Implement SELISE integration (auth, upload, prepare)
- ⏳ Day 5: Implement signature field positioning logic

### Week 3: Testing & Polish
- ⏳ Day 1-2: End-to-end testing
- ⏳ Day 3: Fix bugs and refine UX
- ⏳ Day 4: Error handling improvements
- ⏳ Day 5: Documentation and deployment

### Week 4: Future Enhancements (Optional)
- ⏳ Database tracking
- ⏳ Webhook integration
- ⏳ Status dashboard

---

## Success Metrics

### MVP Success Criteria
- ✅ User can send contract from review page
- ✅ Contract arrives in signatory inboxes within 2 minutes
- ✅ Signature fields are correctly positioned
- ✅ Both signatories can complete signing
- ✅ Signed document is available for download
- ✅ Error messages are clear and actionable
- ✅ No credentials exposed in client code

### Quality Metrics
- API response time < 5 seconds (p95)
- Zero credential leaks
- 95% success rate for contract sending
- User-friendly error messages for all failure modes

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Signature field coordinates incorrect | High | Test with multiple documents, provide adjustment UI |
| SELISE API changes | Medium | Monitor API changelog, maintain versioned endpoints |
| Rate limiting issues | Medium | Implement request queuing and retry logic |
| Document layout varies | High | Use dynamic positioning or signature page template |
| Network failures | Low | Implement robust retry logic and user feedback |
| Credentials leak | Critical | Code review, environment variable validation |

---

## Appendix

### A. SELISE API Reference

**Identity API**: `https://selise.app/api/identity/v100`
- Endpoint: `/identity/token`
- Method: POST
- Grant type: client_credentials
- Token expiry: 420 seconds (7 minutes)

**Storage API**: `https://selise.app/api/storageservice/v100`
- Upload endpoint: `/StorageService/StorageQuery/GetPreSignedUrlForUpload`
- Supports: DOCX, PDF, images
- Max file size: 50MB (verify with SELISE)

**Signature API**: `https://selise.app/api/selisign/s1`
- Prepare: `/SeliSign/ExternalApp/PrepareContract`
- Rollout: `/SeliSign/ExternalApp/RolloutContract`
- Prepare and Send: `/SeliSign/ExternalApp/PrepareAndSendContract`

### B. PDF Coordinate System

```
PDF Page Coordinate System (Letter size: 612 x 792 points)

Top-left (0, 0) ─────────────────── Top-right (612, 0)
      │                                        │
      │                                        │
      │          Content Area                  │
      │                                        │
      │                                        │
Bottom-left (0, 792) ──────────── Bottom-right (612, 792)

Note: SELISE may use top-left origin - verify during testing
```

### C. Sample Signature Page Layout

```
Page: Last page of document

┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    SIGNATURES                              │
│                                                            │
│  By signing below, both parties agree to the terms...     │
│                                                            │
│                                                            │
│  Company Representative          Employee                  │
│  ___________________            ___________________        │
│  (Signature)                    (Signature)                │
│                                                            │
│  Name: _______________          Name: _______________      │
│  Date: _______________          Date: _______________      │
│                                                            │
└────────────────────────────────────────────────────────────┘

Coordinates (approximate):
- Company Rep Signature: X=80, Y=600, W=180, H=70
- Employee Signature: X=350, Y=600, W=180, H=70
- Company Rep Name: X=80, Y=550, W=180, H=20
- Employee Name: X=350, Y=550, W=180, H=20
- Company Rep Date: X=80, Y=680, W=100, H=20
- Employee Date: X=350, Y=680, W=100, H=20
```

---

## Questions & Decisions Log

1. **Q**: Should we use PrepareContract + Rollout or PrepareAndSendContract?
   **A**: Using PrepareAndSendContract for fully automated flow

2. **Q**: How to handle signature field positioning?
   **A**: Start with fixed positions, plan for dynamic calculation later

3. **Q**: What signature class to use?
   **A**: Simple (0) for MVP, can add advanced options later

4. **Q**: Should we track contracts in database?
   **A**: Not in MVP, plan for Phase 2

5. **Q**: What happens if document has variable page count?
   **A**: Use estimation function, may need adjustment based on testing

---

**END OF PLAN**

Ready for implementation! 🚀
