# SELISE Signature API - Rollout Status Issue

**To:** Sadman Rizwan
**From:** Mohan
**Date:** 2025-11-19

---

## Issue Summary

The **Rollout API** returns `200 OK` but the rollout status event (`rollout_success` or `rollout_failed`) never appears when checking via GetEvents API.

---

## Current Workflow (Step-by-Step)

### ✅ Step 1: Get Authentication Token
**Endpoint:** `POST https://selise.app/api/identity/v100/identity/token`

**Request:**
```
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=70c3d8d1-0568-4c39-a05c-2967a581e583
client_secret=SlzTXWE5Fmkwz5JyzfuVeOWPv+IBhywUYDL807iSE25Ptg=
```

**Response:** `200 OK` with `access_token`

**Status:** ✅ **Working**

---

### ✅ Step 2: Get Pre-Signed Upload URL
**Endpoint:** `POST https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload`

**Request:**
```json
{
  "ItemId": "<random-uuid>",
  "MetaData": "{}",
  "Name": "Test_Employment_Agreement_<timestamp>.pdf",
  "ParentDirectoryId": "",
  "Tags": "[\"File\", \"Test\", \"EmploymentAgreement\"]",
  "AccessModifier": "Private"
}
```

**Response:** `200 OK` with `UploadUrl` and `FileId`

**Status:** ✅ **Working**

---

### ✅ Step 3: Upload PDF to Azure Blob Storage
**Endpoint:** `PUT <UploadUrl>` (from Step 2)

**Request:**
```
Headers:
  x-ms-blob-type: BlockBlob
  Content-Type: application/pdf

Body: <PDF binary data>
```

**Response:** `201 Created`

**Status:** ✅ **Working**

---

### ✅ Step 4: Prepare Contract
**Endpoint:** `POST https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract`

**Request:**
```json
{
  "TrackingId": "<random-uuid>",
  "Title": "Test Employment Agreement",
  "ContractType": 0,
  "ReturnDocument": true,
  "ReceiveRolloutEmail": true,
  "SignatureClass": 0,
  "Language": "en-US",
  "LandingPageType": 0,
  "ReminderPulse": 168,
  "OwnerEmail": "mohan@sohanuzzaman.com",
  "FileIds": ["<FileId from Step 2>"],
  "AddSignatoryCommands": [
    {
      "Email": "mohan@sohanuzzaman.com",
      "ContractRole": 0,
      "FirstName": "Mohan",
      "LastName": "Sohanuzzaman",
      "Phone": "+1234567890"
    },
    {
      "Email": "mohan.kst.hp@gmail.com",
      "ContractRole": 0,
      "FirstName": "Mohan",
      "LastName": "Kst",
      "Phone": ""
    }
  ],
  "SigningOrders": [
    { "Email": "mohan@sohanuzzaman.com", "Order": 1 },
    { "Email": "mohan.kst.hp@gmail.com", "Order": 2 }
  ],
  "RedirectUrl": "http://localhost:3000"
}
```

**Response:** `200 OK` with `Result.DocumentId`

**Status:** ✅ **Working** - We successfully get the DocumentId

---

### ⚠️ Step 5: Rollout Contract (ISSUE HERE)
**Endpoint:** `POST https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract`

**Request:**
```json
{
  "DocumentId": "<DocumentId from Step 4>",
  "StampCoordinates": [
    {
      "FileId": "<FileId from Step 2>",
      "Width": 180,
      "Height": 70,
      "PageNumber": 0,
      "X": 80,
      "Y": 600,
      "SignatoryEmail": "mohan@sohanuzzaman.com",
      "SignatureImageFileId": null
    },
    {
      "FileId": "<FileId from Step 2>",
      "Width": 180,
      "Height": 70,
      "PageNumber": 0,
      "X": 350,
      "Y": 600,
      "SignatoryEmail": "mohan.kst.hp@gmail.com",
      "SignatureImageFileId": null
    }
  ],
  "TextFieldCoordinates": [
    {
      "FileId": "<FileId from Step 2>",
      "Width": 180,
      "Height": 25,
      "PageNumber": 0,
      "X": 80,
      "Y": 550,
      "SignatoryEmail": "mohan@sohanuzzaman.com",
      "Value": "Mohan Sohanuzzaman"
    },
    {
      "FileId": "<FileId from Step 2>",
      "Width": 180,
      "Height": 25,
      "PageNumber": 0,
      "X": 350,
      "Y": 550,
      "SignatoryEmail": "mohan.kst.hp@gmail.com",
      "Value": "Mohan Kst"
    }
  ],
  "StampPostInfoCoordinates": [
    {
      "FileId": "<FileId from Step 2>",
      "Width": 120,
      "Height": 20,
      "PageNumber": 0,
      "X": 80,
      "Y": 680,
      "EntityName": "AuditLog",
      "PropertyName": "{StampTime}",
      "SignatoryEmail": "mohan@sohanuzzaman.com"
    },
    {
      "FileId": "<FileId from Step 2>",
      "Width": 120,
      "Height": 20,
      "PageNumber": 0,
      "X": 350,
      "Y": 680,
      "EntityName": "AuditLog",
      "PropertyName": "{StampTime}",
      "SignatoryEmail": "mohan.kst.hp@gmail.com"
    }
  ]
}
```

**Response:** `200 OK` (appears successful)

**Status:** ⚠️ **ISSUE** - Returns 200 but no rollout event appears

---

### ❌ Step 6: Check Rollout Status (THIS IS WHERE THE PROBLEM SHOWS)
**Endpoint:** `POST https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents`

**Request:**
```json
{
  "DocumentId": "<DocumentId from Step 4>",
  "Type": "DocumentStatus"
}
```

**Expected Response:**
```json
[
  {
    "Type": "DocumentStatus",
    "Status": "preparation_success",
    "Success": true,
    "Data": { "DocumentId": "..." }
  },
  {
    "Type": "DocumentStatus",
    "Status": "rollout_success",  // ← This should appear but DOESN'T
    "Success": true,
    "Data": { "DocumentId": "..." }
  }
]
```

**Actual Response:**
```json
[
  {
    "Type": "DocumentStatus",
    "Status": "preparation_success",  // ← Only this appears
    "Success": true,
    "Data": { "DocumentId": "..." }
  }
]
```

**Status:** ❌ **PROBLEM** - Never shows `rollout_success` or `rollout_failed`

---

## The Problem

1. Rollout API returns `200 OK` ✅
2. But GetEvents API **never** returns `rollout_success` or `rollout_failed` ❌
3. We've waited up to 45 seconds (5s → 15s → 45s retries) - still no rollout event
4. Only `preparation_success` event appears

---

## Questions for Backend Team

1. **Is the rollout actually being processed?** The 200 response suggests yes, but no event confirms it
2. **Should we see a `rollout_success` event?** According to the docs, yes
3. **Is there a different way to check rollout status?**
4. **Are the signature field coordinates correct?** (Based on your documentation example)
5. **Is there additional validation happening that's failing silently?**

---

## Test Script Provided

I've created a standalone test script (`test-prepare-rollout.ts`) that reproduces this issue:

- **Self-contained** - Just needs the TS file + test-pdf.pdf in same folder
- **Hardcoded credentials** - No env setup needed
- **Detailed logging** - Shows all requests/responses
- **Ready for Postman** - Easy to copy requests from the code

**To run:**
1. Copy both files to any folder
2. Run:
```bash
npx tsx test-prepare-rollout.ts
```

No `package.json` or dependencies needed - `npx` will handle everything!

---

## Next Steps

Please help us understand:
- Why rollout returns 200 but no status event appears
- How to properly verify rollout success
- If there's something wrong with our rollout request payload

Thank you!

---

**Files Attached:**
- `test-prepare-rollout.ts` - Full reproduction script
- `test-pdf.pdf` - Test document
