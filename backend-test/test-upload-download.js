/**
 * SELISE Storage API - Upload and Download PDF Test
 * 
 * This is a standalone vanilla JavaScript test that demonstrates:
 * 1. Getting credentials (access token)
 * 2. Uploading a PDF file to SELISE Storage
 * 3. Downloading the uploaded file using GetFile API
 * 
 * Requirements:
 * - Node.js 18+ (for native fetch support)
 * - Place "Non-Disclosure Agreement.pdf" in the same folder as this script
 * 
 * Usage:
 *   node test-upload-download.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
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
// FUNCTIONS
// ============================================================================

/**
 * Step 1: Get access token from SELISE Identity Service
 */
async function getAccessToken() {
  console.log('\n=== STEP 1: Getting Access Token ===');
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SELISE_CLIENT_ID,
    client_secret: SELISE_CLIENT_SECRET,
    scope: 'storageservice_api selisign_api',
  });

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
    throw new Error(`Token request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained successfully');
  console.log(`   Token expires in: ${data.expires_in} seconds`);
  
  return data.access_token;
}

/**
 * Step 2: Upload PDF file to SELISE Storage
 */
async function uploadFile(accessToken, filePath) {
  console.log('\n=== STEP 2: Uploading PDF File ===');
  console.log(`   File: ${PDF_FILENAME}`);
  
  // Read the file
  const fileBuffer = fs.readFileSync(filePath);
  const fileSize = fileBuffer.length;
  console.log(`   File size: ${fileSize} bytes`);
  
  // Step 2a: Get pre-signed upload URL
  const fileId = crypto.randomUUID();
  const fileName = `${PDF_FILENAME.replace('.pdf', '')}_${Date.now()}.pdf`;
  
  console.log(`\n   Requesting pre-signed upload URL...`);
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
    throw new Error(`Pre-signed URL request failed: ${preSignedResponse.status} ${preSignedResponse.statusText}\n${errorText}`);
  }

  const preSignedData = await preSignedResponse.json();
  console.log(`   ✅ Pre-signed URL obtained`);
  
  // Step 2b: Upload to Azure Blob Storage
  console.log(`\n   Uploading to Azure Blob Storage...`);
  const uploadResponse = await fetch(preSignedData.UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/pdf',
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Blob upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
  }

  console.log(`✅ File uploaded successfully`);
  console.log(`\n📄 File ID: ${preSignedData.FileId}`);
  console.log(`   File Name: ${fileName}`);
  console.log(`   File Size: ${fileSize} bytes`);
  
  return {
    fileId: preSignedData.FileId,
    fileName: fileName,
    fileSize: fileSize,
  };
}

/**
 * Step 3: Get PDF download URL from Storage Service
 */
async function getPdfDownloadUrl(accessToken, fileId) {
  console.log('\n=== STEP 3: Getting PDF Download URL ===');
  console.log(`   FileId: ${fileId}`);
  
  const getFileUrl = `${STORAGE_BASE_URL}/StorageService/StorageQuery/GetFile?FileId=${fileId}`;
  
  console.log('\n   Attempting GetFile API call...');
  
  const response = await fetch(getFileUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '',
  });

  const responseText = await response.text();
  
  console.log(`\n   Response Status: ${response.status} ${response.statusText}`);
  console.log(`\n   Response Body:`);
  console.log(`   ${responseText}`);
  
  if (!response.ok) {
    throw new Error(`GetFile failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  console.log(`\n   ✅ GetFile Response (parsed):`);
  console.log(JSON.stringify(data, null, 2).split('\n').map(line => `   ${line}`).join('\n'));
  
  return data;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  SELISE Storage API - Upload and Download PDF Test            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\nThis test will:');
  console.log('  1. Get access token (credentials)');
  console.log('  2. Upload "Non-Disclosure Agreement.pdf"');
  console.log('  3. Try to download the file using GetFile API');
  
  try {
    // Step 1: Get access token
    const accessToken = await getAccessToken();
    
    // Step 2: Upload PDF file
    const pdfPath = path.join(__dirname, PDF_FILENAME);
    console.log(`\n   Looking for PDF at: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File not found: ${pdfPath}\nPlease place "Non-Disclosure Agreement.pdf" in the same folder as this script.`);
    }
    
    const uploadResponse = await uploadFile(accessToken, pdfPath);
    
    // Step 3: Get PDF download URL
    const fileInfo = await getPdfDownloadUrl(accessToken, uploadResponse.fileId);
    
    const downloadUrl = fileInfo.Url || fileInfo.FileUrl;
    
    // Success summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEST COMPLETED SUCCESSFULLY                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\n📋 Summary:`);
    console.log(`   File Name: ${uploadResponse.fileName}`);
    console.log(`   File ID: ${uploadResponse.fileId}`);
    console.log(`   File Size: ${uploadResponse.fileSize} bytes`);
    
    if (downloadUrl) {
      console.log(`\n🔗 Download URL:`);
      console.log(`   ${downloadUrl}`);
      console.log(`\n💡 You can open this URL in a browser to download the PDF.`);
    } else {
      console.log(`\n⚠️  No download URL found in response`);
      console.log(`   This might indicate an issue with the GetFile API.`);
    }
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ TEST FAILED                                                ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('\nError Details:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack Trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
main();
