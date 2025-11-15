import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import { SIGNATURE_LAYOUT } from '@/lib/pdf/signature-field-metadata';

interface SignatureField {
  id: string;
  type: 'signature' | 'text' | 'date';
  signatoryIndex: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface SignatoryInput {
  name: string;
  email: string;
  role?: string;
  order?: number;
  phone?: string;
}

const IDENTITY_API = 'https://selise.app/api/identity/v100/identity/token';
const STORAGE_API =
  'https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload';
const PREPARE_AND_SEND_API =
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareAndSendContract';
const GET_EVENTS_API =
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents';

export async function POST(request: NextRequest) {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting aggregated prepare + send workflow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const payload = await request.json();
    const document = payload.document as EmploymentAgreement | undefined;
    const { formData, signatories, signatureFields } = payload;

    if (!document || !formData || !Array.isArray(signatories)) {
      return NextResponse.json(
        {
          error:
            'Missing required payload. Expected document, formData, and signatories.',
        },
        { status: 400 }
      );
    }

    const clientId = process.env.SELISE_CLIENT_ID;
    const clientSecret = process.env.SELISE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'SELISE credentials are not configured on the server.' },
        { status: 500 }
      );
    }

    // Acquire token
    console.log('🔐 Authenticating with SELISE Identity API…');
    const token = await getAccessToken(clientId, clientSecret);
    console.log('✅ Access token acquired\n');

    // Generate PDF from document + form data
    console.log('📄 Generating PDF for contract…');
    const pdfBuffer = await generatePdfBuffer(
      request,
      document,
      formData
    );
    console.log(`✅ PDF generated (${pdfBuffer.length} bytes)\n`);

    // Upload to storage
    console.log('☁️  Uploading PDF to SELISE Storage…');
    const { fileId, fileName } = await uploadPdfToStorage(
      token,
      pdfBuffer,
      document
    );
    console.log(`✅ Uploaded to storage as ${fileName} (FileId: ${fileId})\n`);

    // Build Prepare and Send payload
    const origin = request.nextUrl.origin;

    const { prepareCommand, sendCommand } = buildPrepareAndSendPayload({
      fileId,
      document,
      signatories,
      signatureFields,
      origin,
    });

    console.log('🧾 PrepareCommand:', JSON.stringify(prepareCommand, null, 2));
    console.log('🧾 SendCommand:', JSON.stringify(sendCommand, null, 2));

    console.log('\n🚀 Calling PrepareAndSendContract (aggregated rollout)…');
    const prepareAndSendResponse = await fetch(PREPARE_AND_SEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        PrepareCommand: prepareCommand,
        SendCommand: sendCommand,
      }),
    });

    const prepareAndSendText = await prepareAndSendResponse.clone().text();
    console.log(
      '🔍 PrepareAndSend response status:',
      prepareAndSendResponse.status,
      prepareAndSendResponse.statusText
    );
    console.log(
      '🔍 PrepareAndSend response body:',
      prepareAndSendText || '(empty body)'
    );

    if (!prepareAndSendResponse.ok) {
      throw new Error(
        `PrepareAndSend failed: ${prepareAndSendResponse.status} ${prepareAndSendResponse.statusText}\n${prepareAndSendText}`
      );
    }

    const prepareAndSendResult = prepareAndSendText
      ? JSON.parse(prepareAndSendText)
      : {};

    const documentId =
      prepareAndSendResult.Result?.DocumentId ||
      prepareAndSendResult.DocumentId;
    const trackingId =
      prepareAndSendResult.Result?.TrackingId ||
      prepareCommand.TrackingId;

    if (!documentId) {
      throw new Error(
        `PrepareAndSend succeeded but no DocumentId in response: ${prepareAndSendText}`
      );
    }

    console.log('✅ Aggregated rollout completed successfully');
    console.log(`   DocumentId: ${documentId}`);
    console.log(`   TrackingId: ${trackingId}`);

    console.log('\n📊 Fetching document events to confirm rollout…');
    const events = await getDocumentEvents(token, documentId);
    console.log('📦 GetEvents response:', JSON.stringify(events, null, 2));

    return NextResponse.json({
      success: true,
      documentId,
      trackingId,
      fileId,
      events,
    });
  } catch (error) {
    console.error('\n❌ Aggregated rollout failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to prepare and send contract',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getAccessToken(clientId: string, clientSecret: string) {
  const response = await fetch(IDENTITY_API, {
    method: 'POST',
    headers: {
      Origin: 'https://selise.app',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  const text = await response.clone().text();
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${text}`);
  }

  const data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error('No access_token in identity response');
  }

  return data.access_token as string;
}

async function generatePdfBuffer(
  request: NextRequest,
  document: EmploymentAgreement,
  formData: unknown
) {
  const response = await fetch(
    `${request.nextUrl.origin}/api/documents/generate-pdf`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, formData }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to generate PDF: ${response.status} ${response.statusText}\n${text}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadPdfToStorage(
  accessToken: string,
  pdfBuffer: Buffer,
  document: EmploymentAgreement
) {
  const fileId = randomUUID();
  const employeeName =
    document?.parties?.employee?.legalName ||
    'Employee';
  const sanitizedEmployeeName = String(employeeName)
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `Employment_Agreement_${sanitizedEmployeeName}_${Date.now()}.pdf`;

  const preSignResponse = await fetch(STORAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ItemId: fileId,
      MetaData: '{}',
      Name: fileName,
      ParentDirectoryId: '',
      Tags: '["File","EmploymentAgreement"]',
      AccessModifier: 'Private',
    }),
  });

  const preSignText = await preSignResponse.clone().text();
  if (!preSignResponse.ok) {
    throw new Error(
      `Failed to get pre-signed URL: ${preSignResponse.status} ${preSignText}`
    );
  }

  const { UploadUrl, FileId } = JSON.parse(preSignText);
  const uploadResponse = await fetch(UploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length.toString(),
    },
    body: new Uint8Array(pdfBuffer),
  });

  const uploadText = await uploadResponse.clone().text();
  if (!uploadResponse.ok) {
    throw new Error(
      `Failed to upload PDF blob: ${uploadResponse.status} ${uploadText}`
    );
  }

  return { fileId: FileId as string, fileName };
}

function buildPrepareAndSendPayload({
  fileId,
  document,
  signatories,
  signatureFields,
  origin,
}: {
  fileId: string;
  document: EmploymentAgreement;
  signatories: SignatoryInput[];
  signatureFields?: SignatureField[];
  origin: string;
}) {
  const trackingId = randomUUID();
  const employeeName =
    document?.parties?.employee?.legalName ||
    document?.metadata?.title ||
    'Employee';
  const title = `Employment Agreement - ${employeeName}`;

  const sortedSignatories = [...signatories].sort((a, b) => {
    const orderA =
      typeof a.order === 'number' && a.order > 0
        ? a.order
        : Number.MAX_SAFE_INTEGER;
    const orderB =
      typeof b.order === 'number' && b.order > 0
        ? b.order
        : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  const signatoryMeta = sortedSignatories.map((signatory, index) => {
    const fallbackOrder = index + 1;
    const resolvedOrder =
      typeof signatory.order === 'number' && signatory.order > 0
        ? signatory.order
        : fallbackOrder;
    return {
      ...signatory,
      resolvedOrder,
      name: signatory.name || `Signatory ${fallbackOrder}`,
    };
  });

  const ownerEmail = signatoryMeta[0]?.email;
  if (!ownerEmail) {
    throw new Error('Unable to determine owner email from signatories.');
  }

  const addSignatoryCommands = signatoryMeta.map((signatory) => {
    const trimmedName = signatory.name?.trim() || 'Signatory';
    const parts = trimmedName.split(/\s+/);
    const firstName = parts[0] || 'Signatory';
    const lastName =
      parts.length > 1 ? parts.slice(1).join(' ') : 'Participant';

    return {
      Email: signatory.email,
      ContractRole: 0,
      FirstName: firstName,
      LastName: lastName,
      Phone: signatory.phone || '',
    };
  });

  const signingOrders = signatoryMeta.map((signatory) => ({
    Email: signatory.email,
    Order: signatory.resolvedOrder,
  }));

  const stampCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    SignatoryEmail: string;
    SignatureImageFileId: null;
    CoordinateId: string;
    SignatoryGroupId: null;
    Order: number;
    SignatoryId: string | null;
    SignatoryName: string;
  }> = [];

  const textFieldCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    SignatoryEmail: string;
    Value: string;
  }> = [];

  const stampPostInfoCoordinates: Array<{
    FileId: string;
    Width: number;
    Height: number;
    PageNumber: number;
    X: number;
    Y: number;
    EntityName: string;
    PropertyName: string;
    SignatoryEmail: string;
    CoordinateId: string;
    SignatoryGroupId: null;
    Order: number;
    SignatoryId: string | null;
    FontDetails?: {
      FontName: string;
      FontSize: number;
    };
  }> = [];

  if (Array.isArray(signatureFields) && signatureFields.length > 0) {
    signatureFields.forEach((field) => {
      const signatory = signatoryMeta[field.signatoryIndex];
      if (!signatory) {
        return;
      }

      const pageNumber = Math.max(0, (field.pageNumber || 1) - 1);
      const providedId =
        typeof field.id === 'string' && /^[0-9a-f-]{36}$/i.test(field.id)
          ? field.id
          : randomUUID();

      const common = {
        FileId: fileId,
        PageNumber: pageNumber,
        Width: field.width,
        Height: field.height,
        X: field.x,
        Y: field.y,
        SignatoryEmail: signatory.email,
        CoordinateId: providedId,
        SignatoryGroupId: null as null,
        Order: signatory.resolvedOrder,
        SignatoryId: null as string | null,
        SignatoryName: signatory.name || 'Signatory',
      };

      if (field.type === 'signature') {
        stampCoordinates.push({
          ...common,
          SignatureImageFileId: null,
        });
      } else if (field.type === 'date') {
        stampPostInfoCoordinates.push({
          ...common,
          EntityName: 'AuditLog',
          PropertyName: '{StampTime}',
          FontDetails: {
            FontName: 'Arial',
            FontSize: 12,
          },
        });
      } else if (field.type === 'text') {
        textFieldCoordinates.push({
          ...common,
          Value: signatory.name,
        });
      }
    });
  }

  if (stampCoordinates.length === 0 && signatoryMeta.length > 0) {
    const defaultPositions = {
      companyRep: {
        signature: { x: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.x, y: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.y, width: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.width, height: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.height },
        dateStamp: { x: SIGNATURE_LAYOUT.EMPLOYER.DATE.x, y: SIGNATURE_LAYOUT.EMPLOYER.DATE.y, width: SIGNATURE_LAYOUT.EMPLOYER.DATE.width, height: SIGNATURE_LAYOUT.EMPLOYER.DATE.height },
      },
      employee: {
        signature: { x: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.x, y: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.y, width: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.width, height: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.height },
        dateStamp: { x: SIGNATURE_LAYOUT.EMPLOYEE.DATE.x, y: SIGNATURE_LAYOUT.EMPLOYEE.DATE.y, width: SIGNATURE_LAYOUT.EMPLOYEE.DATE.width, height: SIGNATURE_LAYOUT.EMPLOYEE.DATE.height },
      },
    };

    signatoryMeta.forEach((signatory, index) => {
      const layout =
        index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
      stampCoordinates.push({
        FileId: fileId,
        Width: layout.signature.width,
        Height: layout.signature.height,
        PageNumber: 0,
        X: layout.signature.x,
        Y: layout.signature.y,
        SignatoryEmail: signatory.email,
        SignatureImageFileId: null,
        CoordinateId: randomUUID(),
        SignatoryGroupId: null,
        Order: signatory.resolvedOrder,
        SignatoryId: null,
        SignatoryName: signatory.name || 'Signatory',
      });

      stampPostInfoCoordinates.push({
        FileId: fileId,
        Width: layout.dateStamp.width,
        Height: layout.dateStamp.height,
        PageNumber: 0,
        X: layout.dateStamp.x,
        Y: layout.dateStamp.y,
        EntityName: 'AuditLog',
        PropertyName: '{StampTime}',
        SignatoryEmail: signatory.email,
        CoordinateId: randomUUID(),
        SignatoryGroupId: null,
        Order: signatory.resolvedOrder,
        SignatoryId: null,
        FontDetails: {
          FontName: 'Arial',
          FontSize: 12,
        },
      });
    });
  }

  const prepareCommand = {
    TrackingId: trackingId,
    Title: title,
    ContractType: 0,
    ReturnDocument: true,
    ReceiveRolloutEmail: true,
    SignatureClass: 0,
    Language: 'en-US',
    LandingPageType: 0,
    ReminderPulse: 168,
    OwnerEmail: ownerEmail,
    FileIds: [fileId],
    AddSignatoryCommands: addSignatoryCommands,
    SigningOrders: signingOrders,
    RedirectUrl: `${origin}/templates/employment-agreement`,
  };

  const sendCommand = {
    StampCoordinates: stampCoordinates,
    TextFieldCoordinates: textFieldCoordinates,
    StampPostInfoCoordinates: stampPostInfoCoordinates,
  };

  return { prepareCommand, sendCommand };
}

async function getDocumentEvents(accessToken: string, documentId: string) {
  const maxAttempts = 5;
  const delayMs = 3000;
  let lastParsed: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ DocumentId: documentId }),
    });

    const text = await response.clone().text();
    console.log(
      `🔍 GetEvents attempt ${attempt}/${maxAttempts} status:`,
      response.status,
      response.statusText
    );
    console.log('🔍 GetEvents body:', text || '(empty body)');

    if (!response.ok) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return { error: `GetEvents failed: ${response.status}` };
    }

    const parsed = text ? JSON.parse(text) : null;
    lastParsed = parsed;

    if (Array.isArray(parsed) && parsed.length === 0 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    return parsed;
  }

  return lastParsed;
}
