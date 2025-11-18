#!/usr/bin/env tsx

/**
 * SELISE Signature - Prepare + Rollout Test (Automatic Send)
 *
 * This script performs the automated workflow:
 * 1. Authenticates with SELISE Identity API
 * 2. Uploads test-pdf.pdf to SELISE Storage
 * 3. Prepares contract with signatories (Prepare API)
 * 4. Places signature fields (Rollout API)
 * 5. Sends the contract automatically and fetches document events
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
const PREPARE_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract';
const GET_EVENTS_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents';
const ROLL_OUT_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract';

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

// Signature field coordinates
const SIGNATURE_POSITIONS = {
  lastPage: 0, // Page 0 for testing

  companyRep: {
    signature: { x: 80, y: 600, width: 180, height: 70 },
    nameField: { x: 80, y: 550, width: 180, height: 25 },
    dateStamp: { x: 80, y: 680, width: 120, height: 20 },
  },

  employee: {
    signature: { x: 350, y: 600, width: 180, height: 70 },
    nameField: { x: 350, y: 550, width: 180, height: 25 },
    dateStamp: { x: 350, y: 680, width: 120, height: 20 },
  },
};

async function main() {
  console.log('🚀 SELISE Signature - Prepare + Rollout Test (Review Before Sending)\n');
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
  console.log('   Workflow: Prepare → Rollout → Auto Send');
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

    console.log('📐 Step 4: Rolling out with signature fields...');
    await rolloutContract(accessToken, prepareResult.documentId, fileId);
    console.log('✅ Rollout completed and invitations sent\n');

    console.log('📊 Step 5: Fetching document events...');
    const events = await getDocumentEvents(accessToken, prepareResult.documentId);
    console.log('📦 GetEvents response:', JSON.stringify(events, null, 2));

    // Output results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Contract prepared, rolled out, and invitations sent\n');
    console.log('📋 Contract Details:');
    console.log(`   Document ID: ${prepareResult.documentId}`);
    console.log(`   Tracking ID: ${prepareResult.trackingId}`);
    console.log(`   Title: ${prepareResult.title}\n`);

    console.log('👥 Signatories (in signing order):');
    console.log(`   1️⃣  ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} (${COMPANY_REP.email})`);
    console.log(`       Role: Contract Owner (signs first)`);
    console.log(`   2️⃣  ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} (${EMPLOYEE.email})`);
    console.log(`       Role: Employee (signs after owner)\n`);

    console.log('🧭 Signature Field Positions (auto-placed):');
    console.log(`   Owner signature: Page ${SIGNATURE_POSITIONS.lastPage}, X=${SIGNATURE_POSITIONS.companyRep.signature.x}, Y=${SIGNATURE_POSITIONS.companyRep.signature.y}`);
    console.log(`   Employee signature: Page ${SIGNATURE_POSITIONS.lastPage}, X=${SIGNATURE_POSITIONS.employee.signature.x}, Y=${SIGNATURE_POSITIONS.employee.signature.y}`);
    console.log('   Names and timestamps positioned near respective signatures\n');

    console.log('🚀 Contract has been sent to signatories. No manual review step required.\n');

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
 * Rollout contract with signature fields and send to signatories
 */
async function rolloutContract(accessToken: string, documentId: string, fileId: string): Promise<void> {
  // Validate DocumentId before attempting rollout
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(documentId)) {
    throw new Error(`Invalid DocumentId format for rollout: ${documentId}`);
  }

  console.log(`🔍 Rolling out DocumentId: ${documentId}`);

  const stampCoordinates = [
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.companyRep.signature.width,
      Height: SIGNATURE_POSITIONS.companyRep.signature.height,
      X: SIGNATURE_POSITIONS.companyRep.signature.x,
      Y: SIGNATURE_POSITIONS.companyRep.signature.y,
      SignatoryEmail: COMPANY_REP.email,
    },
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.employee.signature.width,
      Height: SIGNATURE_POSITIONS.employee.signature.height,
      X: SIGNATURE_POSITIONS.employee.signature.x,
      Y: SIGNATURE_POSITIONS.employee.signature.y,
      SignatoryEmail: EMPLOYEE.email,
    },
  ];

  const textFieldCoordinates = [
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.companyRep.nameField.width,
      Height: SIGNATURE_POSITIONS.companyRep.nameField.height,
      X: SIGNATURE_POSITIONS.companyRep.nameField.x,
      Y: SIGNATURE_POSITIONS.companyRep.nameField.y,
      SignatoryEmail: COMPANY_REP.email,
      Value: `${COMPANY_REP.firstName} ${COMPANY_REP.lastName}`,
    },
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.employee.nameField.width,
      Height: SIGNATURE_POSITIONS.employee.nameField.height,
      X: SIGNATURE_POSITIONS.employee.nameField.x,
      Y: SIGNATURE_POSITIONS.employee.nameField.y,
      SignatoryEmail: EMPLOYEE.email,
      Value: `${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`,
    },
  ];

  const stampPostInfoCoordinates = [
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.companyRep.dateStamp.width,
      Height: SIGNATURE_POSITIONS.companyRep.dateStamp.height,
      X: SIGNATURE_POSITIONS.companyRep.dateStamp.x,
      Y: SIGNATURE_POSITIONS.companyRep.dateStamp.y,
      EntityName: 'AuditLog',
      PropertyName: '{StampTime}',
      SignatoryEmail: COMPANY_REP.email,
    },
    {
      FileId: fileId,
      PageNumber: SIGNATURE_POSITIONS.lastPage,
      Width: SIGNATURE_POSITIONS.employee.dateStamp.width,
      Height: SIGNATURE_POSITIONS.employee.dateStamp.height,
      X: SIGNATURE_POSITIONS.employee.dateStamp.x,
      Y: SIGNATURE_POSITIONS.employee.dateStamp.y,
      EntityName: 'AuditLog',
      PropertyName: '{StampTime}',
      SignatoryEmail: EMPLOYEE.email,
    },
  ];

  const rolloutPayload = {
    DocumentId: documentId,
    StampCoordinates: stampCoordinates,
    TextFieldCoordinates: textFieldCoordinates,
    StampPostInfoCoordinates: stampPostInfoCoordinates,
  };

  const response = await fetch(ROLL_OUT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(rolloutPayload),
  });

  const rolloutResponseText = await response.clone().text();
  console.log('🔍 Rollout API response status:', response.status, response.statusText);
  console.log('🔍 Rollout API response body:', rolloutResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(`Rollout failed: ${response.status} ${response.statusText}\n${rolloutResponseText}`);
  }
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

async function getDocumentEvents(accessToken: string, documentId: string): Promise<unknown> {
  const maxAttempts = 5;
  const delayMs = 5000;
  let lastParsed: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
      }),
    });

    const eventsResponseText = await response.clone().text();
    console.log(`🔍 GetEvents attempt ${attempt}/${maxAttempts} status:`, response.status, response.statusText);
    console.log('🔍 GetEvents attempt body:', eventsResponseText || '(empty body)');

    if (!response.ok) {
      throw new Error(`GetEvents failed: ${response.status} ${response.statusText}\n${eventsResponseText}`);
    }

    const parsed = eventsResponseText ? JSON.parse(eventsResponseText) : null;
    lastParsed = parsed;

    const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
    if (isEmptyArray && attempt < maxAttempts) {
      console.log(`⌛ No events yet; waiting ${delayMs / 1000}s before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    return parsed;
  }

  return lastParsed;
}

// Run the test
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
