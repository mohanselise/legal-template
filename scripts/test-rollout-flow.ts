#!/usr/bin/env tsx

/**
 * SELISE Signature - Complete Rollout Flow Test
 *
 * This script tests the full workflow:
 * 1. Prepare Contract
 * 2. Wait for preparation_success
 * 3. Rollout Contract (with signature fields)
 * 4. Wait for rollout_success
 * 5. Debug all events
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
const ROLLOUT_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract';
const GET_EVENTS_API = 'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents';

// Test signatories
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
  console.log('\n🚀 SELISE Signature - Complete Rollout Flow Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!SELISE_CLIENT_ID || !SELISE_CLIENT_SECRET) {
    console.error('❌ Missing SELISE credentials in .env.local');
    process.exit(1);
  }

  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating...');
    const accessToken = await getAccessToken();
    console.log('✅ Authenticated\n');

    // Step 2: Upload PDF
    console.log('📤 Step 2: Uploading PDF...');
    const testFilePath = join(process.cwd(), 'test-pdf.pdf');
    const fileBuffer = await readFile(testFilePath);
    const fileId = await uploadPdf(accessToken, fileBuffer);
    console.log(`✅ Uploaded (FileId: ${fileId})\n`);

    // Step 3: Prepare Contract
    console.log('📝 Step 3: Preparing contract...');
    const documentId = await prepareContract(accessToken, fileId);
    console.log(`✅ Prepared (DocumentId: ${documentId})\n`);

    // Step 3.5: Wait for preparation_success
    console.log('⏳ Step 3.5: Waiting for preparation_success...');
    const prepared = await waitForPreparationSuccess(accessToken, documentId);
    console.log(prepared ? '✅ Preparation confirmed\n' : '⚠️  Timeout, proceeding anyway\n');

    // Step 4: Rollout with signature fields
    console.log('🚀 Step 4: Rolling out contract...');
    await rolloutContract(accessToken, documentId, fileId);
    console.log('✅ Rollout API succeeded\n');

    // Step 4.5: Wait for rollout_success
    console.log('⏳ Step 4.5: Waiting for rollout_success...');
    const rolledOut = await waitForRolloutSuccess(accessToken, documentId);
    console.log(rolledOut ? '✅ Rollout confirmed\n' : '⚠️  No rollout_success event\n');

    // Step 5: Debug all events
    console.log('🔍 Step 5: Fetching ALL events...');
    const allEvents = await getAllEvents(accessToken, documentId);
    console.log('📦 Events:', JSON.stringify(allEvents, null, 2), '\n');

    if (Array.isArray(allEvents)) {
      const statuses = allEvents.map((e: any) => e.Status).filter(Boolean);
      console.log('📋 Event types found:', [...new Set(statuses)].join(', '));
    }

    console.log('\n✅ Test complete!');
    console.log(`   DocumentId: ${documentId}`);
    console.log('   Portal: https://selise.app/e-signature/contracts/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(IDENTITY_API, {
    method: 'POST',
    headers: {
      'Origin': 'https://selise.app',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SELISE_CLIENT_ID!,
      client_secret: SELISE_CLIENT_SECRET!,
    }).toString(),
  });

  if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

async function uploadPdf(accessToken: string, fileBuffer: Buffer): Promise<string> {
  const fileId = crypto.randomUUID();
  const fileName = `Test_Agreement_${Date.now()}.pdf`;

  const preSignResponse = await fetch(STORAGE_API, {
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
      Tags: '["File","Test"]',
      AccessModifier: 'Private',
    }),
  });

  if (!preSignResponse.ok) throw new Error('Upload init failed');
  const { UploadUrl, FileId } = await preSignResponse.json();

  const uploadResponse = await fetch(UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/pdf',
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!uploadResponse.ok) throw new Error('Blob upload failed');
  return FileId;
}

async function prepareContract(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(PREPARE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      TrackingId: crypto.randomUUID(),
      Title: 'Test Employment Agreement',
      ContractType: 0,
      ReturnDocument: true,
      ReceiveRolloutEmail: true,
      SignatureClass: 0,
      Language: 'en-US',
      LandingPageType: 0,
      ReminderPulse: 168,
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
      RedirectUrl: 'http://localhost:3000',
    }),
  });

  if (!response.ok) throw new Error(`Prepare failed: ${response.status}`);
  const result = await response.json();
  return result.Result?.DocumentId || result.DocumentId;
}

async function waitForPreparationSuccess(accessToken: string, documentId: string): Promise<boolean> {
  for (let i = 1; i <= 10; i++) {
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ DocumentId: documentId }),
    });

    if (response.ok) {
      const events = await response.json();
      const found = Array.isArray(events) && events.some(
        (e: any) => e.Status === 'preparation_success' && e.Success === true
      );
      if (found) return true;
    }

    if (i < 10) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

async function rolloutContract(accessToken: string, documentId: string, fileId: string): Promise<void> {
  const stampCoordinates = [
    {
      FileId: fileId,
      Width: 180,
      Height: 60,
      PageNumber: 0,
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
      FontDetails: { FontName: 'Arial', FontSize: 12 },
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
      FontDetails: { FontName: 'Arial', FontSize: 12 },
    },
  ];

  const rolloutPayload = {
    DocumentId: documentId,
    StampCoordinates: stampCoordinates,
    TextFieldCoordinates: [],
    StampPostInfoCoordinates: stampPostInfoCoordinates,
  };

  console.log('  📤 Request payload:');
  console.log(JSON.stringify(rolloutPayload, null, 2));
  console.log('');

  const response = await fetch(ROLLOUT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(rolloutPayload),
  });

  const text = await response.clone().text();

  console.log('  📥 Response:');
  console.log(`     Status: ${response.status} ${response.statusText}`);
  console.log(`     Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
  console.log(`     Body: ${text}`);

  if (text) {
    try {
      const parsed = JSON.parse(text);
      console.log('  📦 Parsed response:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('  ⚠️  Response is not valid JSON');
    }
  }
  console.log('');

  if (!response.ok) throw new Error(`Rollout failed: ${response.status}`);
}

async function waitForRolloutSuccess(accessToken: string, documentId: string): Promise<boolean> {
  for (let i = 1; i <= 10; i++) {
    console.log(`  🔍 Attempt ${i}/10: Checking for rollout_success...`);
    
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ DocumentId: documentId }),
    });

    // Get raw response text first (clone to avoid consuming the stream)
    const text = await response.clone().text();

    console.log(`  📥 Exact Server Response:`);
    console.log(`     Status: ${response.status} ${response.statusText}`);
    console.log(`     Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    console.log(`     Raw Body: ${text}`);
    console.log('');

    if (text) {
      try {
        const events = JSON.parse(text);
        console.log(`  📦 Parsed JSON:`);
        console.log(JSON.stringify(events, null, 2));
        console.log('');
        
        const found = Array.isArray(events) && events.some(
          (e: any) => e.Status === 'rollout_success'
        );
        if (found) {
          console.log(`  ✅ Found rollout_success event!`);
          return true;
        }
      } catch {
        console.log(`  ⚠️  Response is not valid JSON`);
      }
    }

    if (i < 10) {
      console.log(`  ⏳ Waiting 5 seconds before next attempt...\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
}

async function getAllEvents(accessToken: string, documentId: string): Promise<any> {
  const response = await fetch(GET_EVENTS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ DocumentId: documentId }),
  });

  return response.ok ? await response.json() : null;
}

main().catch(console.error);
