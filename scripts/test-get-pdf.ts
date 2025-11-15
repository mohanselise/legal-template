/**
 * Test script for SELISE Signature API - Upload and Download PDF
 * 
 * This script tests uploading a PDF to SELISE Storage and then downloading it.
 * 
 * Steps:
 * 1. Get access token from SELISE Identity Service
 * 2. Upload "Non-Disclosure Agreement.pdf" to storage
 * 3. Download the uploaded file using GetFile API
 * 
 * Usage: npx tsx scripts/test-get-pdf.ts
 *        or
 *        pnpm tsx scripts/test-get-pdf.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION - Hardcoded for easy sharing and testing
// ============================================================================

// SELISE Signature Credentials
const SELISE_CLIENT_ID = '70c3d8d1-0568-4c39-a05c-2967a581e583';
const SELISE_CLIENT_SECRET = 'SlzTXWE5Fmkwz5JyzfuVeOWPv+IBhywUYDL807iSE25Ptg=';

// API endpoints
const IDENTITY_API = 'https://selise.app/api/identity/v100/identity/token';
const STORAGE_BASE_URL = 'https://selise.app/api/storageservice/v100';
const PRESIGNED_UPLOAD_API = `${STORAGE_BASE_URL}/StorageService/StorageQuery/GetPreSignedUrlForUpload`;

// File to upload
const PDF_FILENAME = 'Non-Disclosure Agreement.pdf';

// ============================================================================

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FileInfo {
  FileId: string;
  FileName: string;
  FileExtension: string;
  FileSize: number;
  FileUrl?: string;
  Url?: string;
  CreatedDate: string;
  ModifiedDate: string;
}

interface PreSignedUploadResponse {
  UploadUrl: string;
  FileId: string;
}

/**
 * Step 1: Get access token from SELISE Identity Service
 */
async function getAccessToken(): Promise<string> {
  console.log('\n--- Step 1: Getting Access Token ---');
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SELISE_CLIENT_ID,
    client_secret: SELISE_CLIENT_SECRET,
    scope: 'storageservice_api selisign_api',
  });

  try {
    const response = await fetch(IDENTITY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://selise.app',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: TokenResponse = await response.json();
    console.log('✓ Access token obtained successfully');
    console.log(`  Token expires in: ${data.expires_in} seconds`);
    
    return data.access_token;
  } catch (error) {
    console.error('✗ Failed to get access token:', error);
    throw error;
  }
}

/**
 * Step 2: Upload PDF file to storage
 */
async function uploadFile(accessToken: string, filePath: string): Promise<{ fileId: string; fileName: string; fileSize: number }> {
  console.log('\n--- Step 2: Uploading PDF File ---');
  console.log(`  File: ${PDF_FILENAME}`);
  
  try {
    // Read the file
    const fileBuffer = readFileSync(filePath);
    const fileSize = fileBuffer.length;
    console.log(`  File size: ${fileSize} bytes`);
    
    // Step 2a: Get pre-signed upload URL
    const fileId = crypto.randomUUID();
    const fileName = `${PDF_FILENAME.replace('.pdf', '')}_${Date.now()}.pdf`;
    
    console.log(`\n  Requesting pre-signed upload URL...`);
    const payload = {
      ItemId: fileId,
      MetaData: '{}',
      Name: fileName,
      ParentDirectoryId: '',
      Tags: '["PDF", "Test"]',
      AccessModifier: 'Private',
    };
    
    const preSignedResponse = await fetch(PRESIGNED_UPLOAD_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!preSignedResponse.ok) {
      const errorText = await preSignedResponse.text();
      throw new Error(`Pre-signed URL request failed: ${preSignedResponse.status} ${preSignedResponse.statusText} - ${errorText}`);
    }

    const preSignedData: PreSignedUploadResponse = await preSignedResponse.json();
    console.log(`  ✓ Pre-signed URL obtained`);
    
    // Step 2b: Upload to Azure Blob Storage
    console.log(`\n  Uploading to Azure Blob Storage...`);
    const uploadResponse = await fetch(preSignedData.UploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/pdf',
      },
      body: fileBuffer as unknown as BodyInit,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Blob upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    console.log(`✓ File uploaded successfully`);
    console.log(`\n📄 File ID: ${preSignedData.FileId}`);
    console.log(`  File Name: ${fileName}`);
    console.log(`  File Size: ${fileSize} bytes`);
    
    return {
      fileId: preSignedData.FileId,
      fileName: fileName,
      fileSize: fileSize,
    };
  } catch (error) {
    console.error('✗ Failed to upload file:', error);
    throw error;
  }
}

/**
 * Step 3: Get PDF download URL from Storage Service
 */
async function getPdfDownloadUrl(accessToken: string, fileId: string): Promise<FileInfo> {
  console.log('\n--- Step 3: Getting PDF Download URL ---');
  console.log(`  FileId: ${fileId}`);
  
  // Based on the documentation, GetFile should work without Verb parameter
  const getFileUrl = `${STORAGE_BASE_URL}/StorageService/StorageQuery/GetFile?FileId=${fileId}`;
  
  console.log('\nAttempting GetFile API call...');
  
  try {
    const response = await fetch(getFileUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.log(`  ✗ Failed with ${response.status}: ${responseText}`);
      throw new Error(`GetFile failed: ${response.status} - ${responseText}`);
    }

    const data: FileInfo = JSON.parse(responseText);
    console.log(`  ✓ Success!`);
    console.log(`\nGetFile Response:`);
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('  ✗ Error getting PDF download URL:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('=== SELISE Signature API - Upload and Download PDF Test ===');
  console.log('This test will:');
  console.log('1. Get access token');
  console.log('2. Upload "Non-Disclosure Agreement.pdf"');
  console.log('3. Download the uploaded file using GetFile API\n');
  
  try {
    // Step 1: Get access token
    const accessToken = await getAccessToken();
    
    // Step 2: Upload PDF file
    const pdfPath = join(process.cwd(), PDF_FILENAME);
    console.log(`\nLooking for PDF at: ${pdfPath}`);
    
    const uploadResponse = await uploadFile(accessToken, pdfPath);
    
    // Step 3: Get PDF download URL
    const fileInfo = await getPdfDownloadUrl(accessToken, uploadResponse.fileId);
    
    const downloadUrl = fileInfo.Url || fileInfo.FileUrl;
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log(`\nFile Name: ${uploadResponse.fileName}`);
    console.log(`File ID: ${uploadResponse.fileId}`);
    console.log(`File Size: ${uploadResponse.fileSize} bytes`);
    
    if (downloadUrl) {
      console.log('\nDownload URL:');
      console.log(downloadUrl);
      console.log('\nYou can now open this URL in a browser to download the PDF.');
    } else {
      console.log('\n⚠️  No download URL found in response');
    }
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the test
main();
