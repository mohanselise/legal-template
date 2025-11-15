# SELISE Storage API - Upload and Download Test

This folder contains a standalone test script that can be shared with backend developers to reproduce and debug the SELISE Storage API GetFile functionality.

## 📁 Contents

- `test-upload-download.js` - Standalone vanilla JavaScript test script
- `Non-Disclosure Agreement.pdf` - Sample PDF file for testing
- `README.md` - This file

## 🎯 What This Test Does

The test demonstrates the complete flow:

1. **Get Credentials** - Obtains an access token from SELISE Identity Service
2. **Upload PDF** - Uploads "Non-Disclosure Agreement.pdf" to SELISE Storage using pre-signed URL
3. **Download File** - Attempts to download the file using the GetFile API

Each step prints detailed output including:
- API requests and responses
- File ID generated during upload
- Complete GetFile API response

## 🚀 Requirements

- **Node.js 18+** (for native fetch support)
- No external dependencies required (uses only Node.js built-in modules)

## 📝 Usage

### Option 1: Run directly with Node.js

```bash
node test-upload-download.js
```

### Option 2: Copy to another machine

1. Copy the entire `backend-test` folder
2. Ensure "Non-Disclosure Agreement.pdf" is in the same folder
3. Run: `node test-upload-download.js`

## 🔑 Credentials

The test script includes hardcoded credentials:

- **Client ID**: `70c3d8d1-0568-4c39-a05c-2967a581e583`
- **Client Secret**: `SlzTXWE5Fmkwz5JyzfuVeOWPv+IBhywUYDL807iSE25Ptg=`

These credentials are embedded in the script for easy sharing with backend developers.

## 📊 Expected Output

### Successful Run

```
╔════════════════════════════════════════════════════════════════╗
║  SELISE Storage API - Upload and Download PDF Test            ║
╚════════════════════════════════════════════════════════════════╝

=== STEP 1: Getting Access Token ===
✅ Access token obtained successfully
   Token expires in: 420 seconds

=== STEP 2: Uploading PDF File ===
   File: Non-Disclosure Agreement.pdf
   File size: 51231 bytes
   
   Requesting pre-signed upload URL...
   ✅ Pre-signed URL obtained
   
   Uploading to Azure Blob Storage...
✅ File uploaded successfully

📄 File ID: [generated-uuid]
   File Name: Non-Disclosure Agreement_[timestamp].pdf
   File Size: 51231 bytes

=== STEP 3: Getting PDF Download URL ===
   FileId: [generated-uuid]
   
   Attempting GetFile API call...
   
   Response Status: 200 OK (or error status)
   
   Response Body:
   [Full API response]
```

## ❌ Current Issue

The test currently fails at Step 3 with:

```
Response Status: 401 Unauthorized
Response Body: Verb parameter is missing
```

This indicates that the GetFile API requires a `Verb` parameter that is not documented in the API specification.

## 🐛 Debugging Information

The script prints all API responses in full, making it easy to:
- See the exact error messages from the API
- Identify missing parameters or incorrect request format
- Compare with API documentation

## 📧 Sharing with Backend Developers

To share this test:

1. Zip the entire `backend-test` folder
2. Send to backend developer
3. They can extract and run: `node test-upload-download.js`

All credentials and test data are included - no additional setup required.

## 🔧 Modifying the Test

### To test with a different PDF:

1. Replace `Non-Disclosure Agreement.pdf` with your PDF file
2. Update `PDF_FILENAME` constant in the script:
   ```javascript
   const PDF_FILENAME = 'your-file.pdf';
   ```

### To use different credentials:

Update these constants at the top of `test-upload-download.js`:
```javascript
const SELISE_CLIENT_ID = 'your-client-id';
const SELISE_CLIENT_SECRET = 'your-client-secret';
```

## 📚 API Documentation Reference

Based on the provided API documentation:

```javascript
// GetFile API
fetch('https://app.selisestage.com/api/storageservice/v23/StorageService/StorageQuery/GetFile?FileId=your-file-id', {
  method: 'POST',
  headers: {
    'Authorization': 'bearer {{TOKEN}}',
    'Content-Type': 'application/json'
  },
  body: ''
});
```

The test uses this exact format but still encounters the "Verb parameter is missing" error, suggesting:
- The documentation may be incomplete
- There might be a version mismatch (we're using v100, docs show v23)
- Additional parameters may be required but not documented

## 💡 Next Steps

Questions for backend team:
1. What is the `Verb` parameter and what values are accepted?
2. Is there updated API documentation for v100?
3. Are there additional required parameters for GetFile?
4. Should we use GetFiles (plural) instead of GetFile?
