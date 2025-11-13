# SELISE Signature Production API Guide

Version 2.5 · 6 October 2025  
© SELISE Group AG — Confidential

This handbook describes how to work with the SELISE Signature production APIs across identity, storage, signature, and integration services. It is intended for engineering teams onboarding to the SELISE ecosystem.

## Table of Contents
- [Introduction](#introduction)
- [Service Endpoints](#service-endpoints)
- [Generate Credentials](#generate-credentials)
- [Authentication](#authentication)
- [Files](#files)
  - [Upload File](#upload-file)
  - [Get File / Get Files](#get-file--get-files)
- [Contract Processing](#contract-processing)
  - [Prepare Contract](#prepare-contract)
  - [Roll Out Contract](#roll-out-contract)
  - [Prepare and Send Contract](#prepare-and-send-contract)
- [Contract Management](#contract-management)
  - [Withdraw Contract](#withdraw-contract)
- [Events](#events)
  - [Event Catalogue](#event-catalogue)
  - [Get Events](#get-events)
- [Signed Documents](#signed-documents)
  - [Get Signed File Maps](#get-signed-file-maps)
  - [Download Signed Files](#download-signed-files)
- [Audit Log](#audit-log)
- [Flow Demonstration](#flow-demonstration)
- [Postman Collection](#postman-collection)
- [Mail Server Configuration](#mail-server-configuration)
- [Integrations](#integrations)
  - [OneDrive / SharePoint Integration](#onedrive--sharepoint-integration)
  - [Sign from OneDrive / SharePoint](#sign-from-onedrive--sharepoint)
- [Azure AD Sync](#azure-ad-sync)

## Introduction

SELISE Signature is part of the SELISE Blocks ecosystem. It orchestrates multiple microservices—identity, storage, notification, user access management, and signature—to deliver a complete digital signing experience. This guide walks through the production-ready endpoints and workflows required to authenticate, upload documents, prepare contracts, roll them out to signatories, retrieve signed artifacts, and integrate with Microsoft 365.

## Service Endpoints

| Service                | Production Base URL                                 | Notes                              |
|------------------------|-----------------------------------------------------|------------------------------------|
| Identity Service       | `https://selise.app/api/identity/v100`             | Token issuance, client management. |
| Storage Service        | `https://selise.app/api/storageservice/v100`       | File upload, retrieval, metadata.  |
| Signature Service      | `https://selise.app/api/selisign/s1`               | Contract preparation and rollout.  |
| Secure Storage Service | `https://selise.app/api/securestorage/v1`          | Direct binary downloads.           |

> Replace any former staging URL (`https://app.selisestage.com/...`) with its production counterpart shown above.

## Generate Credentials

1. Sign in to the SELISE Developer Portal.
2. Create a new application under your organisation.
3. Generate client credentials (client id and client secret).
4. Grant the application the necessary scopes for storage and signature operations.
5. Store credentials securely—these values are required to request tokens.

## Authentication

Use the Identity service to exchange your client credentials for a bearer token.

**HTTP**
- Method: `POST`  
- URL: `https://selise.app/api/identity/v100/identity/token`
- Headers:
  - `Origin: https://selise.app`
  - `Content-Type: application/x-www-form-urlencoded`
- Body:
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

**Sample response**

```json
{
  "scope": "offline_access",
  "token_type": "Bearer",
  "access_token": "<jwt>",
  "expires_in": 420
}
```

Persist the token until expiry (typically seven minutes). Use it in the `Authorization: Bearer` header for subsequent API calls.

## Files

The storage service manages file ingestion and retrieval. All operations require a valid bearer token.

### Upload File

Uploading is a two-step process: request a pre-signed URL and then stream the file contents to that URL.

#### Step 1 — Request a pre-signed upload URL

**HTTP**
- Method: `POST`
- URL: `https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload`
- Headers:
  - `Authorization: Bearer <access token>`
  - `Content-Type: application/json`
- Body:
  - `ItemId`: unique identifier (use a GUID).
  - `MetaData`: JSON string for optional metadata (e.g. `"{}"`).
  - `Name`: filename with extension.
  - `ParentDirectoryId`: optional folder id (empty string for root).
  - `Tags`: JSON array string (e.g. `["File"]`).
  - `AccessModifier`: access level (`"Private"` by default).

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

The response contains a pre-signed Azure Blob URL (`UploadUrl`) and a storage identifier (`FileId`). Store both values.

#### Step 2 — Upload binary contents

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

When the PUT succeeds, the PDF is immediately available in SELISE storage and referenced by `FileId`.

### Get File / Get Files

Retrieve file metadata or bulk-fetch multiple files by identifier.

**GetFile**

```js
const getFileResponse = await fetch(
  'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetFile?FileId=<FILE_ID>',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '',
  },
);

const fileInfo = await getFileResponse.json();
```

**GetFiles**

```js
const getFilesResponse = await fetch(
  'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetFiles',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      FileIds: [
        '3807bc8d-0500-84a9-cecb-2607f969c102',
        'ef6ca88a-4ea0-1f98-37c1-be88c33915d4',
      ],
    }),
  },
);

const files = await getFilesResponse.json();
```

File metadata includes the secure download URL, tags, and timestamps.

## Contract Processing

All contract lifecycle operations are powered by the Signature service (`https://selise.app/api/selisign/s1`). Ensure uploaded files are available before preparing a contract.

### Prepare Contract

Creates a draft contract, assigns signatories, and sets signature settings.

```js
const preparePayload = {
  TrackingId: crypto.randomUUID(),
  Title: 'Employment Agreement',
  ContractType: 0, // 0 = individual, 1 = organisational
  ReturnDocument: true,
  ReceiveRolloutEmail: true,
  SignatureClass: 0,
  Language: 'en-US',
  LandingPageType: 0,
  ReminderPulse: 168,
  OwnerEmail: 'owner@example.com',
  FileIds: [uploadedFileId],
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

**SignatureClass options**
- `0`: Simple (That's the option we will use)

Guidance:
- Set `SigningOrders` to `null` to deliver the contract to all signatories simultaneously.
- When sequential signing is enabled, each `Order` must be greater than `0`, and every signatory in `AddSignatoryCommands` must appear exactly once.
- `OwnerEmail` must match one of the defined signatories; otherwise the API returns a validation error. If omitted, the first signatory becomes the owner by default.
- Supported language codes include `en-US` and `de-DE`; the value also becomes the default locale for first-time signers.
- `ReminderPulse` accepts hour values (24, 48, 72, 168) that control automated reminders.
- `LandingPageType` dictates the screen that opens next in SELISE (`0` = Prepare page, `1` = Add Signatory page).
- `ContractType` accepts `0` for individual contracts and `1` for organisational contracts.

### Roll Out Contract

Assign signature fields, text boxes, and post-signature placeholders, then start the signing workflow.

```js
const rolloutPayload = {
  DocumentId: documentId,
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

Coordinate values (`X`, `Y`, `Width`, `Height`) are measured in PDF points from the top-left corner of the page. `SignatureImageFileId` references an uploaded signature image if required.

Additional notes:
- `StampCoordinates` define the placement of the signature stamp or drawn signature for each signer.
- `TextFieldCoordinates` render text widgets—use them for merge fields like names, roles, or dates.
- `StampPostInfoCoordinates` pull dynamic values (for example `{StampTime}`) from system metadata and display them near the stamp.
- `SimpleImageCoordinates` accepts overlays such as initials or profile photos; set `Type` to values like `"Initial"` or `"Photo"` and ensure the referenced asset is uploaded.
- Other optional coordinate arrays (checkboxes, radio buttons, attachments) follow the same page/position schema and can be added if your workflow requires them.
- Provide at least one actionable field per required signer to guarantee they can complete the signing journey without manual editing in the UI.

### Prepare and Send Contract

Create and roll out a contract in a single request when you do not need to stage the draft.

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

Use this endpoint for fully automated flows that do not require manual placement of placeholders.

## Contract Management

### Withdraw Contract

Cancel an in-progress contract before completion. All pending invitations are invalidated and participants are notified.

```js
const withdrawResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/Commands/cancelworkflows',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      DocumentIds: ['cfe496e9-9106-4920-9c59-aac84c35eb07'],
    }),
  },
);

if (!withdrawResponse.ok) {
  throw new Error(`Withdraw contract failed: ${withdrawResponse.status} ${withdrawResponse.statusText}`);
}
```

Contracts already completed or fully signed cannot be withdrawn.

## Events

SELISE emits lifecycle events for each contract. You can poll them via API or configure webhooks in the Developer Portal to receive push notifications.

### Event Catalogue

| Status                    | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| `preparation_success`     | Document prepared successfully.                                            |
| `rollout_success`         | Document rollout completed successfully.                                   |
| `rollout_failed`          | Document rollout failed.                                                    |
| `signatory_signed_success`| Signatory completed signing.                                               |
| `signatory_signed_failed` | Signatory failed to sign.                                                   |
| `document_completed`      | All required actions finished; workflow closed.                            |
| `document_cancelled`      | Contract withdrawn or cancelled.                                           |
| `document_declined`       | Signatory declined to sign or review.                                      |

Each event payload includes metadata such as `DocumentId`, `SignatoryId`, timestamps, and deep links.

### Get Events

Query events for a document or filter by status.

```js
const getEventsResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      DocumentId: '31c8cb41-568f-4419-9fad-43d34adb7994',
      Success: true,
      Type: 'DocumentStatus',
      Status: 'rollout_success',
    }),
  },
);

const events = await getEventsResponse.json();
```

Response items include `ItemId`, `CreateDate`, and a payload describing the event.

## Signed Documents

Once a contract is signed, use the following APIs to retrieve the signed files.

### Get Signed File Maps

Provides the mapping between original and signed file IDs.

```js
const mapResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/Queries/GetSignedFileMaps?DocumentId=<DOCUMENT_ID>',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  },
);

const fileMap = await mapResponse.json();
```

The result contains `OriginalFileId` and `SignedFileId` pairs.

### Download Signed Files

1. Call `GetFile` with the signed file id from the map.
2. Use the returned secure storage URL to download the binary content.

```js
// Step 1: fetch storage metadata
const signedFileId = fileMap[0].SignedFileId;

const signedFileResponse = await fetch(
  `https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetFile?FileId=${signedFileId}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '',
  },
);

const signedFileInfo = await signedFileResponse.json();
const downloadUrl = signedFileInfo.Url;

// Step 2: download bytes from secure storage
const downloadResponse = await fetch(downloadUrl, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const signedPdf = Buffer.from(await downloadResponse.arrayBuffer());
```

Persist the binary output to your filesystem or document management system as required.

## Audit Log

After all signatories finish, fetch the audit log for compliance records.

```js
const logResponse = await fetch(
  'https://selise.app/api/selisign/s1/SeliSign/Queries/GetSignatureLog?DocumentId=<DOCUMENT_ID>',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  },
);

const logInfo = await logResponse.json();
const logFileId = logInfo.SignatureLogFileId;
```

Retrieve the audit PDF by calling `GetFile` with `logFileId`, then download via secure storage as described above.

## Flow Demonstration

Typical automation flow:
1. Upload required PDFs and signature images to the storage service.
2. Generate an access token using the Identity service.
3. Call `PrepareContract` with contract metadata and signatories.
4. Use `RolloutContract` (or `PrepareAndSendContract`) to dispatch invitations.
5. Track progress through webhook integrations or `GetEvents`.
6. Download signed documents and audit logs when complete.

## Postman Collection

A sample Postman collection is available from SELISE Support. Import it to explore each endpoint, update environment variables with production URLs, and plug in your client credentials.

## Mail Server Configuration

Configure Azure Entra ID (Azure AD) and grant Microsoft Graph permissions so SELISE can send transactional emails from your domain.

1. Open the Azure portal and navigate to **Microsoft Entra ID → App registrations**.
2. Create or select the application used for email dispatch.
3. Under **Authentication**, add the redirect URL `https://selise.app` and enable **Access tokens** and **ID tokens**.
4. In **Certificates & secrets**, create a new client secret and store the value securely.
5. Under **API permissions**, grant and consent to:
   - `Mail.ReadWrite`
   - `Mail.Send`
6. Ensure the mailbox account used for system emails has a valid Exchange Online license.
7. Provide SELISE with the client id, client secret, tenant id, and sender mailbox address.
8. Optionally replicate the configuration for staging using redirect URL `https://app.selisestage.com`.

## Integrations

### OneDrive / SharePoint Integration

Follow these steps to connect a dedicated tenant to OneDrive or SharePoint:

1. In Azure portal, choose **Microsoft Entra ID → App registrations** and create (or reuse) an app.
2. Under **Authentication**, set redirect URL `https://selise.app/e-signature/verification/onedrive` and enable **Access tokens** and **ID tokens**.
3. Generate a client secret in **Certificates & secrets**.
4. Grant delegated API permissions and consent:
   - Microsoft Graph: `Files.Read`, `Files.Read.All`, `Files.ReadWrite`, `Files.ReadWrite.All`, `Files.ReadWrite.AppFolder`, `Files.ReadWrite.Selected`, `offline_access`, `openid`, `profile`, `email`, `User.Read`
   - SharePoint: `MyFiles.Write`
5. Share the client id, client secret, and tenant id with SELISE securely.
6. Ask a tenant administrator to approve the SELISE Signature application the first time a user connects. Ensure the consent is granted on behalf of the organisation.

Once approved, OneDrive and SharePoint sites become accessible within the SELISE Signature UI.

### Sign from OneDrive / SharePoint

Enable the in-app “Sign with SELISE Signature” button that appears directly inside OneDrive or SharePoint.

1. In **App registrations**, configure redirect URL `https://selise.app/e-signature/verification/onedrivehandler`. For dedicated deployments use `https://<application_name>.selise.app/e-signature/verification/onedrivehandler`.
2. Enable **Access tokens** and **ID tokens** and save.
3. Create a client secret if one does not exist.
4. Grant delegated API permissions: `MyFiles.Write` or `Sites.Read.All` (SharePoint) in addition to the Graph scopes listed earlier.
5. Open the **Manifest** view and populate the `addIns` array with a custom file handler:

```json
{
  "id": "2a64c7d7-0ef5-49c1-9f96-199cb7e12f4c",
  "type": "FileHandler",
  "properties": [
    { "key": "version", "value": "2" },
    { "key": "fileTypeDisplayName", "value": "Sign with SELISE Signature" },
    { "key": "actionMenuDisplayName", "value": "Sign with SELISE Signature" },
    { "key": "fileTypeIcon", "value": "{\"svg\":\"https://az-cdn.selise.biz/selisecdn/cdn/arc2/arc2-logo.svg\"}" },
    { "key": "appIcon", "value": "{\"svg\":\"https://az-cdn.selise.biz/selisecdn/cdn/arc2/arc2-logo.svg\"}" },
    {
      "key": "actions",
      "value": "[{\"type\":\"custom\",\"url\":\"https://selise.app/api/arcdms/ArcDmsService/Integrations/SignWithHandler/<TENANT_ID>\",\"displayName\":\"Sign with SELISE Signature\",\"shortDisplayName\":\"Sign with SELISE Signature\",\"icon\":{\"svg\":\"https://az-cdn.selise.biz/selisecdn/cdn/arc2/arc2-logo.svg\"},\"availableOn\":{\"file\":{\"extensions\":[\".pdf\",\".doc\",\".docx\"]},\"folder\":{},\"allowMultiSelect\":true,\"web\":{}}}]"
    }
  ]
}
```

Replace `<TENANT_ID>` with your Entra tenant id and update the host for dedicated environments.

6. In **Enterprise applications**, open the registered app, go to **Properties**, and set **Visible to users?** to **Yes**.
7. Allow up to 48 hours for Microsoft 365 to refresh file handlers, or trigger a cache refresh if required.
8. Inform SELISE Support so they can whitelist your application.

## Azure AD Sync

Synchronise users and group permissions from your Entra ID tenant into SELISE Signature.

1. Create (or reuse) an app registration.
2. Configure redirect URL `https://selise.app/login/{YOUR_APP_NAME}`. For dedicated hosting use `https://<your_domain>.selise.app/login/{YOUR_APP_NAME}`.
3. Generate a client secret under **Certificates & secrets**.
4. Grant application permissions on Microsoft Graph: `GroupMember.Read.All` and `User.Read.All`, then grant admin consent.
5. Record the application (client) id, directory (tenant) id, and client secret.
6. Create groups in Entra ID corresponding to SELISE roles:
   - `{VARIABLE}_Admin`
   - `{VARIABLE}_Advanced`
   - `{VARIABLE}_Qualified`
   - `{VARIABLE}_SignOnly`
   - `{VARIABLE}_Simple`
7. Assign users to the appropriate groups. Membership can overlap; the most permissive role applies.
8. Provide SELISE with the client id, client secret, tenant id, `{VARIABLE}` value, `{YOUR_APP_NAME}`, and relevant group object ids.

Once synchronised, user permissions in SELISE Signature reflect the group assignments maintained in Entra ID.
