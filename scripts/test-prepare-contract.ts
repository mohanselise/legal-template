#!/usr/bin/env tsx

/**
 * Complete SELISE Signature Test Script
 *
 * This script performs the full contract preparation workflow:
 * 1. Authenticates with SELISE Identity API
 * 2. Uploads test.docx to SELISE Storage
 * 3. Prepares a contract with two signatories (company rep + employee)
 * 4. Outputs the redirect URL to place signature fields
 *
 * After running this script, copy the redirect URL and open it in your browser
 * to manually place signature fields and send the contract.
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
const SIGNATURE_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract';

// Test signatories
const COMPANY_REP = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@company.com',
  phone: '+1234567890',
};

const EMPLOYEE = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@company.com',
  phone: '',
};

async function main() {
  console.log('🚀 SELISE Signature - Full Contract Preparation Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    // Step 3: Prepare contract
    console.log('📝 Step 3: Preparing contract with signatories...');
    const result = await prepareContract(accessToken, fileId);
    console.log('✅ Contract prepared successfully\n');

    // Output results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Contract is ready\n');
    console.log('📋 Contract Details:');
    console.log(`   Document ID: ${result.documentId}`);
    console.log(`   Tracking ID: ${result.trackingId}`);
    console.log(`   Title: ${result.title}\n`);

    console.log('👥 Signatories:');
    console.log(`   1. ${COMPANY_REP.firstName} ${COMPANY_REP.lastName} (${COMPANY_REP.email}) - Company Rep`);
    console.log(`   2. ${EMPLOYEE.firstName} ${EMPLOYEE.lastName} (${EMPLOYEE.email}) - Employee\n`);

    console.log('🔗 Next Steps:');
    console.log('   Copy the URL below and open it in your browser to:');
    console.log('   - Place signature fields on the document');
    console.log('   - Configure signing settings');
    console.log('   - Send the contract to signatories\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 REDIRECT URL:');
    console.log(`\n${result.redirectUrl}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Tip: The contract is in "prepared" state and waiting for you to:');
    console.log('   1. Place signature fields at desired locations');
    console.log('   2. Click "Send" to deliver it to signatories');
    console.log('   3. Signatories will receive emails with signing links\n');

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
 * Prepare contract with SELISE Signature API
 */
async function prepareContract(
  accessToken: string,
  fileId: string
): Promise<{
  documentId: string;
  trackingId: string;
  title: string;
  redirectUrl: string;
}> {
  const trackingId = crypto.randomUUID();
  const title = `Test Employment Agreement - ${EMPLOYEE.firstName} ${EMPLOYEE.lastName}`;

  const preparePayload = {
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
  };

  const response = await fetch(SIGNATURE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preparePayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prepare contract failed: ${response.status} ${response.statusText}\n${errorText}`);
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
    redirectUrl: `https://signature.selise.app/e-signature/process/contract/prepare/${documentId}`,
  };
}

// Run the test
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
