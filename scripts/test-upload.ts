#!/usr/bin/env tsx

/**
 * Test script to verify SELISE Storage API upload functionality
 *
 * This script:
 * 1. Authenticates with SELISE Identity API
 * 2. Requests a pre-signed upload URL
 * 3. Uploads test.docx to SELISE Storage
 * 4. Verifies the upload was successful
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

async function main() {
  console.log('🚀 SELISE Document Upload Test\n');

  // Validate environment variables
  if (!SELISE_CLIENT_ID || !SELISE_CLIENT_SECRET) {
    console.error('❌ Missing SELISE credentials in .env.local');
    console.error('   Required: SELISE_CLIENT_ID, SELISE_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    // Step 1: Authenticate with SELISE
    console.log('📝 Step 1: Authenticating with SELISE Identity API...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token received (valid for 7 minutes)\n');

    // Step 2: Read the test DOCX file
    console.log('📄 Step 2: Reading test.docx...');
    const testFilePath = join(process.cwd(), 'test.docx');
    const fileBuffer = await readFile(testFilePath);
    console.log(`✅ File loaded: ${fileBuffer.length} bytes\n`);

    // Step 3: Request pre-signed upload URL
    console.log('🔗 Step 3: Requesting pre-signed upload URL...');
    const { uploadUrl, fileId } = await getPreSignedUploadUrl(accessToken);
    console.log('✅ Pre-signed URL obtained');
    console.log(`   FileId: ${fileId}\n`);

    // Step 4: Upload the file to Azure Blob Storage
    console.log('☁️  Step 4: Uploading file to SELISE Storage...');
    await uploadFileToBlob(uploadUrl, fileBuffer);
    console.log('✅ File uploaded successfully!\n');

    // Success summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ SUCCESS! Document upload test completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 FileId: ${fileId}`);
    console.log('💡 This FileId can be used to reference the uploaded document');
    console.log('   in SELISE Signature API calls.');

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
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
 * Request pre-signed upload URL from SELISE Storage API
 */
async function getPreSignedUploadUrl(accessToken: string): Promise<{ uploadUrl: string; fileId: string }> {
  const fileId = crypto.randomUUID();
  const fileName = `test_upload_${Date.now()}.docx`;

  const payload = {
    ItemId: fileId,
    MetaData: '{}',
    Name: fileName,
    ParentDirectoryId: '',
    Tags: '["File", "Test"]',
    AccessModifier: 'Private',
  };

  const response = await fetch(STORAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload URL request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();

  if (!data.UploadUrl || !data.FileId) {
    throw new Error('Missing UploadUrl or FileId in response');
  }

  return {
    uploadUrl: data.UploadUrl,
    fileId: data.FileId,
  };
}

/**
 * Upload file to Azure Blob Storage using pre-signed URL
 */
async function uploadFileToBlob(uploadUrl: string, fileBuffer: Buffer): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    body: fileBuffer as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Blob upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
}

// Run the test
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
