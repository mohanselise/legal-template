# SELISE Signature Production API Guide

This guide shows how to authenticate and upload files against the SELISE production services. It covers:

1. Generating an access token.
2. Uploading a file in two steps with a pre-signed URL.

## 1. Generate an Access Token

Use the Identity service to exchange your client credentials for a bearer token.

**Endpoint**
- Method: `POST`
- URL: `https://selise.app/api/identity/v100/identity/token`
- Headers:
  - `Origin: https://selise.app`
  - `Content-Type: application/x-www-form-urlencoded`
- Body (`application/x-www-form-urlencoded`):
  - `grant_type=client_credentials`
  - `client_id=<your client id>`
  - `client_secret=<your client secret>`

**JavaScript**

```js
const params = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: process.env.SELISE_CLIENT_ID,
  client_secret: process.env.SELISE_CLIENT_SECRET,
});

const response = await fetch('https://selise.app/api/identity/v100/identity/token', {
  method: 'POST',
  headers: {
    Origin: 'https://selise.app',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: params.toString(),
});

if (!response.ok) {
  throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
}

const tokenPayload = await response.json();
const accessToken = tokenPayload.access_token;
```

**Sample Response**

```json
{
  "scope": "offline_access",
  "token_type": "Bearer",
  "access_token": "<jwt>",
  "expires_in": 420
}
```

Persist the `access_token` securely; you will attach it as a bearer token on subsequent requests.

## 2. Upload a File

Uploading requires two API calls: first request a pre-signed URL, then PUT the file contents to that URL.

### Step 1: Request a Pre-Signed Upload URL

**Endpoint**
- Method: `POST`
- URL: `https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload`
- Headers:
  - `Authorization: Bearer <access token>`
  - `Content-Type: application/json`
- Body (`application/json`):
  - `ItemId`: unique identifier for the file (use a GUID/UUID).
  - `MetaData`: JSON string for optional metadata, e.g. `"{}"`.
  - `Name`: filename with extension, e.g. `"contract.pdf"`.
  - `ParentDirectoryId`: optional parent folder id (empty string for root).
  - `Tags`: JSON array string of tags, e.g. `["File"]`.
  - `AccessModifier`: `"Private"` or the desired access level.

**JavaScript**

```js
const uploadInitResponse = await fetch(
  'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ItemId: crypto.randomUUID(),
      MetaData: '{}',
      Name: 'contract.pdf',
      ParentDirectoryId: '',
      Tags: '["File"]',
      AccessModifier: 'Private',
    }),
  },
);

if (!uploadInitResponse.ok) {
  throw new Error(`Upload URL request failed: ${uploadInitResponse.status} ${uploadInitResponse.statusText}`);
}

const { UploadUrl, FileId } = await uploadInitResponse.json();
```

**Sample Response**

```json
{
  "UploadUrl": "https://<storage-account>.blob.core.windows.net/prod/.../contract.pdf?...",
  "FileId": "7ebeb40a-4eb0-45c8-b213-85c80ce9b0b4",
  "StatusCode": 0,
  "RequestUri": null,
  "ExternalError": null,
  "HttpStatusCode": 0
}
```

Keep both the `UploadUrl` and `FileId`. The URL is time-limited; the file id is how SELISE services reference the uploaded document.

### Step 2: PUT the File Contents to Storage

Use the `UploadUrl` returned in Step&nbsp;1. No authorization header is required because the URL is pre-signed.

**JavaScript**

```js
import { readFile } from 'node:fs/promises';

const fileBuffer = await readFile('/path/to/contract.pdf');

const uploadResponse = await fetch(UploadUrl, {
  method: 'PUT',
  headers: {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': 'application/pdf',
  },
  body: fileBuffer,
});

if (!uploadResponse.ok) {
  throw new Error(`Blob upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
}
```

When the PUT request succeeds, the file is stored in SELISE cloud storage and the associated `FileId` can be used in subsequent contract preparation or signing workflows.

## 3. Contract Processing

After uploading documents, use the Signature service to prepare and roll out contracts. The production base URL is `https://selise.app/api/selisign/s1`.

### Prepare a Contract

Creates a draft contract, assigns signatories, and locks in the signature experience. Run this before you place signature fields or roll out the contract.

**Endpoint**
- Method: `POST`
- URL: `https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract`
- Headers:
  - `Authorization: Bearer <access token>`
  - `Content-Type: application/json`

**JavaScript**

```js
const preparePayload = {
  TrackingId: crypto.randomUUID(),
  Title: 'Employment Agreement',
  ContractType: 0, // 0 = individual, 1 = organizational
  ReturnDocument: true,
  ReceiveRolloutEmail: true,
  SignatureClass: 0, // see signature class values below
  Language: 'en-US',
  LandingPageType: 0,
  ReminderPulse: 168,
  OwnerEmail: 'owner@example.com',
  FileIds: [
    uploadedFileId, // use the FileId from the upload step
  ],
  AddSignatoryCommands: [
    {
      Email: 'owner@example.com',
      ContractRole: 0,
      FirstName: 'Owner',
      LastName: 'Signer',
      Phone: '+41448058044',
    },
    {
      Email: 'signer@example.com',
      ContractRole: 0,
      FirstName: 'Second',
      LastName: 'Signer',
    },
  ],
  SigningOrders: [
    { Email: 'owner@example.com', Order: 1 },
    { Email: 'signer@example.com', Order: 2 },
  ],
  RedirectUrl: 'https://selise.app/e-signature/contracts/',
};

const prepareResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preparePayload),
  },
);

if (!prepareResponse.ok) {
  throw new Error(`Prepare contract failed: ${prepareResponse.status} ${prepareResponse.statusText}`);
}

const preparedContract = await prepareResponse.json();
const documentId = preparedContract.DocumentId;
```

**Signature Class values**
- `0`: Simple
- `2`: Advanced (ZertES, Switzerland)
- `3`: Qualified with Swisscom (ZertES)
- `7`: Qualified with Swisscom (eIDAS, EU)
- `9`: Advanced (eIDAS, EU)

Additional notes:
- Omit or set `SigningOrders` to `null` to let all signatories receive the contract at the same time.
- `OwnerEmail` must match a signatory email or the API returns a validation error.
- Supported languages include `en-US` and `de-DE`. Set `Language` to pick the new user's default locale.
- `ReminderPulse` accepts hour values such as `24`, `48`, `72`, or `168` to schedule reminder emails.

### Roll Out a Contract

Attach signature fields, text boxes, and other components, then send the contract to participants.

**Endpoint**
- Method: `POST`
- URL: `https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract`
- Headers:
  - `Authorization: Bearer <access token>`
  - `Content-Type`: `application/json`

**JavaScript**

```js
const rolloutPayload = {
  DocumentId: documentId, // returned from PrepareContract
  StampCoordinates: [
    {
      FileId: uploadedFileId,
      Width: 150,
      Height: 100,
      PageNumber: 0,
      X: 210.44,
      Y: 254.22,
      SignatoryEmail: 'owner@example.com',
      SignatureImageFileId: 'b9c582ec-44f1-41ec-ab21-0cb309ec8d45',
    },
  ],
  TextFieldCoordinates: [
    {
      FileId: uploadedFileId,
      Width: 128,
      Height: 27,
      PageNumber: 0,
      X: 275.27,
      Y: 202.24,
      SignatoryEmail: 'owner@example.com',
      Value: 'Owner Signer',
    },
  ],
  StampPostInfoCoordinates: [
    {
      FileId: uploadedFileId,
      Width: 128,
      Height: 27,
      PageNumber: 0,
      X: 288.04,
      Y: 247.59,
      EntityName: 'AuditLog',
      PropertyName: '{StampTime}',
      SignatoryEmail: 'owner@example.com',
    },
  ],
};

const rolloutResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(rolloutPayload),
  },
);

if (!rolloutResponse.ok) {
  throw new Error(`Rollout failed: ${rolloutResponse.status} ${rolloutResponse.statusText}`);
}
```

Once the rollout completes, signatories receive invitation emails and the contract moves into the signing workflow.

`SignatureImageFileId` references a stored signature image (upload it first if required). Coordinate properties (`X`, `Y`, `Width`, `Height`) are expressed in PDF points relative to the top-left corner of the page.

### Prepare and Send in One Call

Use the aggregated endpoint to create and roll out a contract with a single request.

**Endpoint**
- Method: `POST`
- URL: `https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareAndSendContract`
- Headers:
  - `Authorization: Bearer <access token>`
  - `Content-Type`: `application/json`

**JavaScript**

```js
const prepareAndSendPayload = {
  PrepareCommand: preparePayload,
  SendCommand: {
    StampCoordinates: rolloutPayload.StampCoordinates,
    TextFieldCoordinates: rolloutPayload.TextFieldCoordinates,
    StampPostInfoCoordinates: rolloutPayload.StampPostInfoCoordinates,
  },
};

const prepareAndSendResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareAndSendContract',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(prepareAndSendPayload),
  },
);

if (!prepareAndSendResponse.ok) {
  throw new Error(`Prepare and send failed: ${prepareAndSendResponse.status} ${prepareAndSendResponse.statusText}`);
}
```

Prefer this endpoint when you do not need to stage a draft in the UI and want a fully automated contract issuance.
