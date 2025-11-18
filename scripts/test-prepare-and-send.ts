#!/usr/bin/env tsx

/**
 * SELISE Signature - Aggregated Rollout Test (PrepareAndSendContract)
 *
 * This script performs the COMPLETE automated workflow:
 * 1. Authenticates with SELISE Identity API
 * 2. Uploads test.docx to SELISE Storage
 * 3. Prepares contract with signatories AND places signature fields
 * 4. Immediately sends contract to signatories via email
 *
 * After running this script, the signatories will receive emails with signing links.
 * NO manual field placement needed - fully automated!
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
const PREPARE_AND_SEND_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareAndSendContract';

// Test signatories (you can change these to real emails for testing)
const COMPANY_REP = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'mohan@sohanuzzaman.com',
  phone: '+1234567890',
};

const EMPLOYEE = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'mohan.kst.hp@gmail.com',
  phone: '',
};

// Signature field coordinates (assuming last page of document)
// These are positioned for a standard letter-size page (612 x 792 PDF points)
const SIGNATURE_POSITIONS = {
  lastPage: 0, // We'll use page 0 for testing (first page)

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
  console.log('🚀 SELISE Signature - Aggregated Rollout Test (Fully Automated)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Validate environment variables
  if (!SELISE_CLIENT_ID || !SELISE_CLIENT_SECRET) {
    console.error('❌ Missing SELISE credentials in .env.local');
    console.error('   Required: SELISE_CLIENT_ID, SELISE_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('📋 Test Configuration:');
  console.log('   Document: test.docx');
  console.log(`   Company Rep: ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} <${COMPANY_REP.email}>`);
  console.log(`   Employee: ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} <${EMPLOYEE.email}>`);
  console.log('   Workflow: FULLY AUTOMATED (PrepareAndSendContract API)');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating with SELISE Identity API...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token received\n');

    // Step 2: Upload document
    console.log('📤 Step 2: Uploading test.docx to SELISE Storage...');
    const testFilePath = join(process.cwd(), 'test.docx');
    const fileBuffer = await readFile(testFilePath);
    console.log(`   File size: ${fileBuffer.length} bytes`);

    const fileId = await uploadToSeliseStorage(accessToken, fileBuffer);
    console.log(`✅ File uploaded successfully`);
    console.log(`   FileId: ${fileId}\n`);

    // Step 3: Prepare AND Send contract (single API call!)
    console.log('📝 Step 3: Preparing contract AND placing signature fields...');
    console.log('   → Setting up signatories');
    console.log('   → Placing signature stamps');
    console.log('   → Adding name text fields');
    console.log('   → Adding date stamps');
    console.log('   → Sending to signatories...\n');

    const result = await prepareAndSendContract(accessToken, fileId);
    console.log('✅ Contract prepared and sent successfully!\n');

    // Output results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Contract has been SENT to signatories\n');
    console.log('📋 Contract Details:');
    console.log(`   Document ID: ${result.documentId}`);
    console.log(`   Tracking ID: ${result.trackingId}`);
    console.log(`   Title: ${result.title}\n`);

    console.log('👥 Signatories (in signing order):');
    console.log(`   1️⃣  ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} (${COMPANY_REP.email})`);
    console.log(`       Role: Company Representative (signs first)`);
    console.log(`   2️⃣  ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} (${EMPLOYEE.email})`);
    console.log(`       Role: Employee (signs after company rep)\n`);

    console.log('📍 Signature Field Positions:');
    console.log(`   Company Rep: Page ${SIGNATURE_POSITIONS.lastPage}, X=${SIGNATURE_POSITIONS.companyRep.signature.x}, Y=${SIGNATURE_POSITIONS.companyRep.signature.y}`);
    console.log(`   Employee:    Page ${SIGNATURE_POSITIONS.lastPage}, X=${SIGNATURE_POSITIONS.employee.signature.x}, Y=${SIGNATURE_POSITIONS.employee.signature.y}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 What Happens Next:\n');
    console.log('   1. Both signatories will receive emails shortly');
    console.log('   2. Company rep (John) will get signing link first');
    console.log('   3. After John signs, Jane will receive her signing link');
    console.log('   4. After both sign, contract is completed!\n');

    console.log('💡 Check Your Email:');
    console.log(`   → ${COMPANY_REP.email}`);
    console.log(`   → ${EMPLOYEE.email}\n`);

    console.log('🔗 You can also view the contract in SELISE Signature dashboard:');
    console.log(`   https://signature.selise.app/e-signature/contracts\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token request failed: ${response.status} ${response.statusText}\n${errorText}`);
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
  const fileName = `Test_Employment_Agreement_${Date.now()}.docx`;

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

  if (!uploadInitResponse.ok) {
    const errorText = await uploadInitResponse.text();
    throw new Error(`Upload URL request failed: ${uploadInitResponse.status} ${uploadInitResponse.statusText}\n${errorText}`);
  }

  const { UploadUrl, FileId } = await uploadInitResponse.json();

  // Step 2: Upload file to Azure Blob Storage
  const uploadResponse = await fetch(UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Length': fileBuffer.length.toString(),
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Blob upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
  }

  return FileId;
}

/**
 * Prepare and send contract with SELISE Signature API (Aggregated Rollout)
 */
async function prepareAndSendContract(
  accessToken: string,
  fileId: string
): Promise<{
  documentId: string;
  trackingId: string;
  title: string;
}> {
  const trackingId = crypto.randomUUID();
  const title = `Test Employment Agreement - ${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`;

  const prepareAndSendPayload = {
    PrepareCommand: {
      TrackingId: trackingId,
      Title: title,
      ContractType: 0,           // 0 = individual, 1 = organizational
      ReturnDocument: true,
      ReceiveRolloutEmail: true,
      SignatureClass: 0,         // 0 = Simple signature
      Language: 'en-US',
      LandingPageType: 0,
      ReminderPulse: 168,        // 168 hours = 7 days (weekly reminders)
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
        { Email: COMPANY_REP.email, Order: 1 },  // Company rep signs first
        { Email: EMPLOYEE.email, Order: 2 },     // Employee signs second
      ],
      RedirectUrl: 'http://localhost:3000/templates/employment-agreement',
    },
    SendCommand: {
      // Signature stamps (visual signature boxes)
      StampCoordinates: [
        // Company Representative Signature
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.companyRep.signature.width,
          Height: SIGNATURE_POSITIONS.companyRep.signature.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.companyRep.signature.x,
          Y: SIGNATURE_POSITIONS.companyRep.signature.y,
          SignatoryEmail: COMPANY_REP.email,
          SignatureImageFileId: null, // No pre-uploaded signature image
        },
        // Employee Signature
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.employee.signature.width,
          Height: SIGNATURE_POSITIONS.employee.signature.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.employee.signature.x,
          Y: SIGNATURE_POSITIONS.employee.signature.y,
          SignatoryEmail: EMPLOYEE.email,
          SignatureImageFileId: null,
        },
      ],

      // Text fields (for names)
      TextFieldCoordinates: [
        // Company Rep Name Field
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.companyRep.nameField.width,
          Height: SIGNATURE_POSITIONS.companyRep.nameField.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.companyRep.nameField.x,
          Y: SIGNATURE_POSITIONS.companyRep.nameField.y,
          SignatoryEmail: COMPANY_REP.email,
          Value: `${COMPANY_REP.firstName} ${COMPANY_REP.lastName}`,
        },
        // Employee Name Field
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.employee.nameField.width,
          Height: SIGNATURE_POSITIONS.employee.nameField.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.employee.nameField.x,
          Y: SIGNATURE_POSITIONS.employee.nameField.y,
          SignatoryEmail: EMPLOYEE.email,
          Value: `${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`,
        },
      ],

      // Date stamps (automatically filled on signing)
      StampPostInfoCoordinates: [
        // Company Rep Date Stamp
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.companyRep.dateStamp.width,
          Height: SIGNATURE_POSITIONS.companyRep.dateStamp.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.companyRep.dateStamp.x,
          Y: SIGNATURE_POSITIONS.companyRep.dateStamp.y,
          EntityName: 'AuditLog',
          PropertyName: '{StampTime}',
          SignatoryEmail: COMPANY_REP.email,
        },
        // Employee Date Stamp
        {
          FileId: fileId,
          Width: SIGNATURE_POSITIONS.employee.dateStamp.width,
          Height: SIGNATURE_POSITIONS.employee.dateStamp.height,
          PageNumber: SIGNATURE_POSITIONS.lastPage,
          X: SIGNATURE_POSITIONS.employee.dateStamp.x,
          Y: SIGNATURE_POSITIONS.employee.dateStamp.y,
          EntityName: 'AuditLog',
          PropertyName: '{StampTime}',
          SignatoryEmail: EMPLOYEE.email,
        },
      ],
    },
  };

  const response = await fetch(PREPARE_AND_SEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(prepareAndSendPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prepare and send failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = await response.json();

  // The API returns DocumentId nested in Result object
  const documentId = result.Result?.DocumentId || result.DocumentId;

  if (!documentId) {
    throw new Error(`No DocumentId in response. Got: ${JSON.stringify(result)}`);
  }

  return {
    documentId,
    trackingId,
    title,
  };
}

// Run the test
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
