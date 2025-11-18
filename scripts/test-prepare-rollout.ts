#!/usr/bin/env tsx

/**
 * SELISE Signature - Prepare + Preview Test
 *
 * This script performs the automated workflow:
 * 1. Authenticates with SELISE Identity API
 * 2. Uploads test-pdf.pdf to SELISE Storage
 * 3. Prepares contract with signatories (Prepare API)
 * 4. Gets the PDF download URL for preview (instead of sending)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const SELISE_CLIENT_ID = process.env.SELISE_CLIENT_ID;
const SELISE_CLIENT_SECRET = process.env.SELISE_CLIENT_SECRET;

// SELISE API endpoints
const IDENTITY_API = 'https://selise.app/api/identity/v100/identity/token';
const STORAGE_API = 'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload';
const GET_FILE_API = 'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetFile';
const PREPARE_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract';
const ROLLOUT_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract';
const GET_EVENTS_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents';

// Test signatories (you can change these)
const COMPANY_REP = {
  firstName: 'Mohan',
  lastName: 'Sohanuzzaman',
  email: 'mohan@sohanuzzaman.com',
  phone: '+1234567890',
};

const EMPLOYEE = {
  firstName: 'Mohan',
  lastName: 'Kst',
  email: 'mohan.kst.hp@gmail.com',
  phone: '',
};

async function main() {
  console.log('🚀 SELISE Signature - Prepare + Preview Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Validate environment variables
  if (!SELISE_CLIENT_ID || !SELISE_CLIENT_SECRET) {
    console.error('❌ Missing SELISE credentials in .env.local');
    console.error('   Required: SELISE_CLIENT_ID, SELISE_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('📋 Test Configuration:');
  console.log('   Document: test-pdf.pdf');
  console.log(`   Company Rep: ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} <${COMPANY_REP.email}>`);
  console.log(`   Employee: ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} <${EMPLOYEE.email}>`);
  console.log('   Workflow: Prepare → Wait → Rollout → Wait → Verify');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating with SELISE Identity API...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token received\n');

    // Step 2: Upload document
    console.log('📤 Step 2: Uploading test-pdf.pdf to SELISE Storage...');
    const testFilePath = join(process.cwd(), 'test-pdf.pdf');
    const fileBuffer = await readFile(testFilePath);
    console.log(`   File size: ${fileBuffer.length} bytes`);

    const fileId = await uploadToSeliseStorage(accessToken, fileBuffer);
    console.log(`✅ File uploaded successfully`);
    console.log(`   FileId: ${fileId}\n`);

    // Step 3: Prepare contract (creates draft with signatories)
    console.log('📝 Step 3: Preparing contract draft...');
    console.log('   → Setting up signatories');
    console.log('   → Configuring signing order');
    console.log('   → Setting signature class (Simple)');

    const prepareResult = await prepareContract(accessToken, fileId);
    console.log(`✅ Contract prepared`);
    console.log(`   DocumentId: ${prepareResult.documentId}\n`);

    // Step 3.5: Wait for preparation_success event
    console.log('⏳ Step 3.5: Waiting for preparation_success event...');
    const prepSuccessEvent = await waitForPreparationSuccess(accessToken, prepareResult.documentId);
    if (prepSuccessEvent) {
      console.log('✅ Preparation confirmed by API events\n');
    } else {
      console.warn('⚠️  No preparation_success event found, proceeding anyway...\n');
    }

    // Step 4: Get PDF download URL for preview
    console.log('� Step 4: Getting PDF download URL...');
    const pdfUrl = await getPdfDownloadUrl(accessToken, fileId);
    console.log('✅ PDF download URL retrieved\n');

    // Output results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Contract prepared and ready for preview\n');
    console.log('📋 Contract Details:');
    console.log(`   Document ID: ${prepareResult.documentId}`);
    console.log(`   Tracking ID: ${prepareResult.trackingId}`);
    console.log(`   Title: ${prepareResult.title}`);
    console.log(`   File ID: ${fileId}\n`);

    console.log('👥 Signatories (in signing order):');
    console.log(`   1️⃣  ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} (${COMPANY_REP.email})`);
    console.log(`       Role: Contract Owner (will sign first)`);
    console.log(`   2️⃣  ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} (${EMPLOYEE.email})`);
    console.log(`       Role: Employee (will sign after owner)\n`);

    console.log('📄 PDF Preview URL:');
    console.log(`   ${pdfUrl}\n`);
    console.log('   ⚠️  Note: This URL requires authentication with the same Bearer token');
    console.log('   ⚠️  You can use this URL to download/preview the PDF before sending for signatures\n');

    console.log('� Contract is prepared but NOT sent to signatories.');
    console.log('   To send for signatures, call the RolloutContract API with signature field coordinates.\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(`\n   Stack trace:\n${error.stack}`);
      }
    } else {
      console.error(`   Unknown error:`, error);
    }
    process.exit(1);
  }
}

/**
 * Get access token from SELISE Identity API
 */
async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SELISE_CLIENT_ID!,
    client_secret: SELISE_CLIENT_SECRET!,
  });

  const response = await fetch(IDENTITY_API, {
    method: 'POST',
    headers: {
      'Origin': 'https://selise.app',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const identityResponseText = await response.clone().text();
  console.log('🔍 Identity API response status:', response.status, response.statusText);
  console.log('🔍 Identity API response body:', identityResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${response.statusText}\n${identityResponseText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access_token in response');
  }

  return data.access_token;
}

/**
 * Upload DOCX file to SELISE Storage
 */
async function uploadToSeliseStorage(
  accessToken: string,
  fileBuffer: Buffer
): Promise<string> {
  const fileId = crypto.randomUUID();
  const fileName = `Test_Employment_Agreement_${Date.now()}.pdf`;

  // Step 1: Request pre-signed upload URL
  const uploadInitResponse = await fetch(STORAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ItemId: fileId,
      MetaData: '{}',
      Name: fileName,
      ParentDirectoryId: '',
      Tags: '["File", "Test", "EmploymentAgreement"]',
      AccessModifier: 'Private',
    }),
  });

  const preSignResponseText = await uploadInitResponse.clone().text();
  console.log('🔍 Storage pre-sign response status:', uploadInitResponse.status, uploadInitResponse.statusText);
  console.log('🔍 Storage pre-sign response body:', preSignResponseText || '(empty body)');

  if (!uploadInitResponse.ok) {
    throw new Error(`Upload URL request failed: ${uploadInitResponse.status} ${uploadInitResponse.statusText}\n${preSignResponseText}`);
  }

  const { UploadUrl, FileId } = await uploadInitResponse.json();

  // Step 2: Upload file to Azure Blob Storage
  const uploadResponse = await fetch(UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/pdf',
      'Content-Length': fileBuffer.length.toString(),
    },
    body: new Uint8Array(fileBuffer),
  });

  const blobUploadResponseText = await uploadResponse.clone().text();
  console.log('🔍 Blob upload response status:', uploadResponse.status, uploadResponse.statusText);
  console.log('🔍 Blob upload response body:', blobUploadResponseText || '(empty body)');

  if (!uploadResponse.ok) {
    throw new Error(`Blob upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${blobUploadResponseText}`);
  }

  return FileId;
}

/**
 * Prepare contract with SELISE Signature API
 */
async function prepareContract(
  accessToken: string,
  fileId: string
): Promise<{
  documentId: string;
  trackingId: string;
  title: string;
}> {
  const trackingId = crypto.randomUUID();
  const title = `Test Employment Agreement - ${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`;

  const preparePayload = {
    TrackingId: trackingId,
    Title: title,
    ContractType: 0,           // 0 = individual
    ReturnDocument: true,
    ReceiveRolloutEmail: true,
    SignatureClass: 0,         // 0 = Simple signature
    Language: 'en-US',
    LandingPageType: 0,        // 0 = Prepare page
    ReminderPulse: 168,        // 7 days
    OwnerEmail: COMPANY_REP.email,
    FileIds: [fileId],
    AddSignatoryCommands: [
      {
        Email: COMPANY_REP.email,
        ContractRole: 0,
        FirstName: COMPANY_REP.firstName,
        LastName: COMPANY_REP.lastName,
        Phone: COMPANY_REP.phone,
      },
      {
        Email: EMPLOYEE.email,
        ContractRole: 0,
        FirstName: EMPLOYEE.firstName,
        LastName: EMPLOYEE.lastName,
        Phone: EMPLOYEE.phone,
      },
    ],
    SigningOrders: [
      { Email: COMPANY_REP.email, Order: 1 },
      { Email: EMPLOYEE.email, Order: 2 },
    ],
    RedirectUrl: 'http://localhost:3000/templates/employment-agreement',
  };

  const response = await fetch(PREPARE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preparePayload),
  });

  const prepareResponseText = await response.clone().text();
  console.log('🔍 Prepare API response status:', response.status, response.statusText);
  console.log('🔍 Prepare API response body:', prepareResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(`Prepare contract failed: ${response.status} ${response.statusText}\n${prepareResponseText}`);
  }

  const result = await response.json();

  // The API returns DocumentId nested in Result object
  const documentId = result.Result?.DocumentId || result.DocumentId;

  if (!documentId) {
    throw new Error(`No DocumentId in response. Got: ${JSON.stringify(result)}`);
  }

  // Validate DocumentId format (should be a valid GUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(documentId)) {
    throw new Error(`Invalid DocumentId format: ${documentId}`);
  }

  console.log(`🔍 Extracted DocumentId: ${documentId}`);

  return {
    documentId,
    trackingId,
    title,
  };
}

/**
 * Get PDF download URL for preview
 */
async function getPdfDownloadUrl(accessToken: string, fileId: string): Promise<string> {
  console.log(`🔍 Fetching file metadata for FileId: ${fileId}`);

  const response = await fetch(`${GET_FILE_API}?FileId=${fileId}&Verb=READ`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: '',
  });

  const fileResponseText = await response.clone().text();
  console.log('🔍 GetFile API response status:', response.status, response.statusText);
  console.log('🔍 GetFile API response body:', fileResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(`GetFile failed: ${response.status} ${response.statusText}\n${fileResponseText}`);
  }

  const fileInfo = await response.json();
  
  if (!fileInfo.Url) {
    throw new Error(`No download URL in file metadata. Got: ${JSON.stringify(fileInfo)}`);
  }

  console.log('✅ File metadata retrieved');
  console.log(`   File Name: ${fileInfo.Name || 'N/A'}`);
  console.log(`   File Size: ${fileInfo.Size || 'N/A'} bytes`);
  console.log(`   Content Type: ${fileInfo.ContentType || 'N/A'}`);

  return fileInfo.Url;
}

/**
 * Wait for preparation_success event before proceeding to rollout
 */
async function waitForPreparationSuccess(
  accessToken: string,
  documentId: string
): Promise<boolean> {
  const maxAttempts = 10;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(GET_EVENTS_API, {
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
    });

    if (!response.ok) {
      console.warn(`⚠️  GetEvents check failed (attempt ${attempt}/${maxAttempts}):`, response.status);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return false;
    }

    const events = await response.json();

    if (Array.isArray(events) && events.length > 0) {
      const prepSuccessEvent = events.find(
        (e: { Status?: string; Success?: boolean }) =>
          e.Status === 'preparation_success' && e.Success === true
      );

      if (prepSuccessEvent) {
        console.log(`   ✓ Found preparation_success event (attempt ${attempt})`);
        return true;
      }
    }

    if (attempt < maxAttempts) {
      console.log(`   ⌛ Waiting for preparation_success (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Rollout contract with signature field coordinates
 */
async function rolloutContract(
  accessToken: string,
  documentId: string,
  fileId: string
): Promise<void> {
  // Default signature field positions (same as in route.ts)
  const stampCoordinates = [
    {
      FileId: fileId,
      Width: 180,
      Height: 60,
      PageNumber: 0, // First page
      X: 72,
      Y: 650,
      SignatoryEmail: COMPANY_REP.email,
      SignatureImageFileId: null,
      CoordinateId: crypto.randomUUID(),
      SignatoryGroupId: null,
      Order: 1,
      SignatoryId: null,
      SignatoryName: `${COMPANY_REP.firstName} ${COMPANY_REP.lastName}`,
    },
    {
      FileId: fileId,
      Width: 180,
      Height: 60,
      PageNumber: 0,
      X: 72,
      Y: 500,
      SignatoryEmail: EMPLOYEE.email,
      SignatureImageFileId: null,
      CoordinateId: crypto.randomUUID(),
      SignatoryGroupId: null,
      Order: 2,
      SignatoryId: null,
      SignatoryName: `${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`,
    },
  ];

  const stampPostInfoCoordinates = [
    {
      FileId: fileId,
      Width: 120,
      Height: 25,
      PageNumber: 0,
      X: 300,
      Y: 650,
      EntityName: 'AuditLog',
      PropertyName: '{StampTime}',
      SignatoryEmail: COMPANY_REP.email,
      CoordinateId: crypto.randomUUID(),
      SignatoryGroupId: null,
      Order: 1,
      SignatoryId: null,
      FontDetails: {
        FontName: 'Arial',
        FontSize: 12,
      },
    },
    {
      FileId: fileId,
      Width: 120,
      Height: 25,
      PageNumber: 0,
      X: 300,
      Y: 500,
      EntityName: 'AuditLog',
      PropertyName: '{StampTime}',
      SignatoryEmail: EMPLOYEE.email,
      CoordinateId: crypto.randomUUID(),
      SignatoryGroupId: null,
      Order: 2,
      SignatoryId: null,
      FontDetails: {
        FontName: 'Arial',
        FontSize: 12,
      },
    },
  ];

  const response = await fetch(ROLLOUT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      DocumentId: documentId,
      StampCoordinates: stampCoordinates,
      TextFieldCoordinates: [],
      StampPostInfoCoordinates: stampPostInfoCoordinates,
    }),
  });

  const rolloutResponseText = await response.clone().text();
  console.log('🔍 RolloutContract response status:', response.status, response.statusText);
  console.log('🔍 RolloutContract response body:', rolloutResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(
      `RolloutContract failed: ${response.status} ${response.statusText}\n${rolloutResponseText}`
    );
  }
}

/**
 * Wait for rollout_success event
 */
async function waitForRolloutSuccess(
  accessToken: string,
  documentId: string
): Promise<boolean> {
  const maxAttempts = 10;
  const delayMs = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  GetEvents check failed (attempt ${attempt}/${maxAttempts}):`, response.status);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return false;
    }

    const events = await response.json();
    console.log(`🔍 GetEvents attempt ${attempt}/${maxAttempts}:`, JSON.stringify(events, null, 2));

    if (Array.isArray(events) && events.length > 0) {
      const rolloutEvent = events.find(
        (e: { Status?: string; Success?: boolean }) =>
          e.Status === 'rollout_success' && e.Success === true
      );

      if (rolloutEvent) {
        console.log(`   ✓ Found rollout_success event (attempt ${attempt})`);
        return true;
      }

      // Check for rollout_failed
      const failedEvent = events.find(
        (e: { Status?: string }) => e.Status === 'rollout_failed'
      );
      if (failedEvent) {
        console.error('   ❌ Found rollout_failed event:', failedEvent);
        return false;
      }
    }

    if (attempt < maxAttempts) {
      console.log(`   ⌛ Waiting for rollout_success (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Get ALL events without any filters (for debugging)
 */
async function getAllEvents(accessToken: string, documentId: string): Promise<any> {
  const response = await fetch(GET_EVENTS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      DocumentId: documentId,
    }),
  });

  const eventsText = await response.clone().text();
  console.log('🔍 GetAllEvents response status:', response.status, response.statusText);

  if (!response.ok) {
    console.error('Failed to get events:', eventsText);
    return null;
  }

  return JSON.parse(eventsText);
}

// Run the test
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
