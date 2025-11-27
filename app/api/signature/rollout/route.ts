import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';
import { SIG_PAGE_LAYOUT, getSignatureBlockPosition } from '@/lib/pdf/signature-layout';

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
const PREPARE_API =
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract';
const ROLLOUT_API =
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract';
const GET_EVENTS_API =
  'https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents';

export async function POST(request: NextRequest) {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting Two-Step Signature Workflow');
    console.log('   Step 1: Prepare Contract (create draft with signatories)');
    console.log('   Step 2: Wait for preparation_success event');
    console.log('   Step 3: Rollout Contract (configure signature fields & send invitations)');
    console.log('   Step 4: Wait for rollout_success event');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const payload = await request.json();
    const document = payload.document as LegalDocument | undefined;
    const { formData, signatories, signatureFields, pdfBase64, templateSlug, templateTitle, numPages } = payload;

    if (!document || !formData || !Array.isArray(signatories)) {
      return NextResponse.json(
        {
          error:
            'Missing required payload. Expected document, formData, and signatories.',
        },
        { status: 400 }
      );
    }

    // Log signature fields received from client
    if (Array.isArray(signatureFields) && signatureFields.length > 0) {
      console.log('📋 Received signature fields from client with exact overlay coordinates:', {
        totalFields: signatureFields.length,
        fields: signatureFields.map((field: SignatureField) => ({
          id: field.id,
          type: field.type,
          signatoryIndex: field.signatoryIndex,
          pageNumber: field.pageNumber,
          position: `(${field.x}, ${field.y})`,
          size: `${field.width}×${field.height}`,
        })),
      });
    } else {
      console.log('⚠️  No signature fields provided, will use default positions');
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

    // Use provided PDF or generate new one
    let pdfBuffer: Buffer;
    if (pdfBase64) {
      console.log('📄 Using pre-generated PDF from client (no regeneration needed)…');
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
      console.log(`✅ PDF received (${pdfBuffer.length} bytes)\n`);
    } else {
      console.log('📄 Generating PDF for contract (fallback)…');
      pdfBuffer = await generatePdfBuffer(
        request,
        document,
        formData
      );
      console.log(`✅ PDF generated (${pdfBuffer.length} bytes)\n`);
    }

    // Upload to storage
    console.log('☁️  Uploading PDF to SELISE Storage…');
    const { fileId, fileName } = await uploadPdfToStorage(
      token,
      pdfBuffer,
      document,
      templateSlug
    );
    console.log(`✅ Uploaded to storage as ${fileName} (FileId: ${fileId})\n`);

    // Build prepare payload
    const origin = request.nextUrl.origin;

    const { prepareCommand, stampCoordinates, textFieldCoordinates, stampPostInfoCoordinates } =
      buildPreparePayload({
        fileId,
        document,
        signatories,
        signatureFields,
        origin,
        templateSlug,
        templateTitle,
        numPages,
      });

    console.log('🧾 PrepareCommand:', JSON.stringify(prepareCommand, null, 2));

    // Step 1: Prepare Contract
    console.log('\n🚀 Step 1: Calling PrepareContract API…');
    const documentId = await prepareContract(token, prepareCommand);
    console.log(`✅ Contract prepared successfully`);
    console.log(`   DocumentId: ${documentId}`);
    console.log(`   TrackingId: ${prepareCommand.TrackingId}`);

    // Step 2: Wait for preparation_success event
    console.log('\n⏳ Step 2: Waiting for preparation_success event…');
    const prepared = await waitForPreparationSuccess(token, documentId);
    if (!prepared) {
      throw new Error('Contract preparation failed or timed out');
    }
    console.log('✅ Preparation confirmed by API events');

    // Step 3: Rollout Contract with signature field coordinates
    console.log('\n🚀 Step 3: Calling RolloutContract API…');
    console.log('📋 Rollout payload:', JSON.stringify({
      StampCoordinates: stampCoordinates,
      TextFieldCoordinates: textFieldCoordinates,
      StampPostInfoCoordinates: stampPostInfoCoordinates,
    }, null, 2));

    await rolloutContract(token, documentId, {
      stampCoordinates,
      textFieldCoordinates,
      stampPostInfoCoordinates,
    });
    console.log('✅ Rollout API call completed');

    const trackingId = prepareCommand.TrackingId;

    // Step 4: Wait for rollout_success event
    console.log('\n⏳ Step 4: Waiting for rollout_success event…');
    const events = await waitForRolloutSuccess(token, documentId);
    console.log('📦 Final events:', JSON.stringify(events, null, 2));

    // Check if rollout actually succeeded
    if (Array.isArray(events)) {
      const rolloutEvent = events.find(
        (e: any) => e.Status === 'rollout_success' || e.Status === 'rollout_failed'
      );

      if (rolloutEvent?.Status === 'rollout_failed') {
        console.error('❌ Rollout failed:', rolloutEvent);
        return NextResponse.json(
          {
            error: 'Contract was prepared but rollout failed',
            details: 'The document was created but invitation emails were not sent.',
            documentId,
            trackingId,
            events,
          },
          { status: 500 }
        );
      }

      if (rolloutEvent?.Status === 'rollout_success') {
        console.log('✅ Rollout confirmed by API events');
      } else {
        console.warn(
          '⚠️  No rollout event detected after polling. Document may still be processing.'
        );
        console.warn(
          '   Check SELISE portal: https://selise.app/e-signature/contracts/'
        );
      }
    }

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
  document: LegalDocument,
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
  document: LegalDocument,
  templateSlug?: string
) {
  const fileId = randomUUID();
  
  // Get signatory name for filename - try first signatory or fallback
  const firstSignatoryName =
    document?.signatories?.[0]?.name ||
    'Document';
  const sanitizedName = String(firstSignatoryName)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Use document title or template slug for the filename prefix
  const documentType = document?.metadata?.title?.replace(/\s+/g, '_') || 
                       templateSlug?.replace(/-/g, '_') || 
                       'Legal_Document';
  const fileName = `${documentType}_${sanitizedName}_${Date.now()}.pdf`;
  
  // Create tag based on template slug
  const tag = templateSlug ? templateSlug.replace(/-/g, '') : 'LegalDocument';

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
      Tags: `["File","${tag}"]`,
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

function buildPreparePayload({
  fileId,
  document,
  signatories,
  signatureFields,
  origin,
  templateSlug,
  templateTitle,
  numPages,
}: {
  fileId: string;
  document: LegalDocument;
  signatories: SignatoryInput[];
  signatureFields?: SignatureField[];
  origin: string;
  templateSlug?: string;
  templateTitle?: string;
  numPages?: number;
}) {
  const trackingId = randomUUID();
  
  // Build title from document metadata, template title, or first signatory
  const documentTitle = document?.metadata?.title || templateTitle || 'Legal Document';
  const firstSignatoryName = signatories[0]?.name || 'Document';
  const title = `${documentTitle} - ${firstSignatoryName}`;

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
    console.log(`📍 Using ${signatureFields.length} signature fields from client overlay`);
    signatureFields.forEach((field) => {
      const signatory = signatoryMeta[field.signatoryIndex];
      if (!signatory) {
        console.warn(`⚠️  Signatory at index ${field.signatoryIndex} not found for field ${field.id}`);
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
        console.log(`  ✓ Signature field: ${signatory.name} at (${field.x}, ${field.y}) on page ${pageNumber}`);
      } else if (field.type === 'date') {
        // Use SAME coordinate treatment as signature fields (no conversion)
        stampPostInfoCoordinates.push({
          ...common,
          EntityName: 'AuditLog',
          PropertyName: '{StampTime}',
          FontDetails: {
            FontName: 'Arial',
            FontSize: 12,
          },
        });
        console.log(`  ✓ Date field: ${signatory.name} at PDF coords (${field.x}, ${field.y}) -> API coords (${common.X}, ${common.Y}) [same as signature] on page ${pageNumber}`);
      } else if (field.type === 'text') {
        textFieldCoordinates.push({
          ...common,
          Value: signatory.name,
        });
        console.log(`  ✓ Text field: ${signatory.name} at (${field.x}, ${field.y}) on page ${pageNumber}`);
      }
    });
  }

  if (stampCoordinates.length === 0 && signatoryMeta.length > 0) {
    console.log('⚠️  No signature fields provided, falling back to default positions');
    
    // DPI scaling: SELISE expects 96 DPI pixels, SIG_PAGE_LAYOUT uses 72 DPI PDF points
    const DPI_SCALE = 96 / 72;
    const MARGIN_LEFT = SIG_PAGE_LAYOUT.MARGIN_X;
    
    // Get page count from parameter if provided, otherwise default to 0 (first page)
    // The client should send numPages for accurate placement
    const lastPageIndex = typeof numPages === 'number' && numPages > 0
      ? numPages - 1  // Convert 1-indexed to 0-indexed
      : 0;
    
    console.log(`   Using page ${lastPageIndex} (0-indexed) for signature fields`);

    signatoryMeta.forEach((signatory, index) => {
      const blockTop = getSignatureBlockPosition(index);
      
      // Signature Position - apply DPI scaling for SELISE
      const sigX = Math.round((MARGIN_LEFT + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET) * DPI_SCALE);
      const sigY = Math.round((blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET) * DPI_SCALE);
      const sigWidth = Math.round(SIG_PAGE_LAYOUT.SIG_BOX_WIDTH * DPI_SCALE);
      const sigHeight = Math.round(SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT * DPI_SCALE);
      
      // Date Position - apply SAME treatment as signature (DPI scaling only, no conversion)
      const dateX = Math.round((MARGIN_LEFT + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET) * DPI_SCALE);
      const dateY = Math.round((blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET) * DPI_SCALE);
      const dateWidth = Math.round(SIG_PAGE_LAYOUT.DATE_BOX_WIDTH * DPI_SCALE);
      const dateHeight = Math.round(SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT * DPI_SCALE);

      // Add Signature Field
      stampCoordinates.push({
        FileId: fileId,
        Width: sigWidth,
        Height: sigHeight,
        PageNumber: lastPageIndex,
        X: sigX,
        Y: sigY,
        SignatoryEmail: signatory.email,
        SignatureImageFileId: null,
        CoordinateId: randomUUID(),
        SignatoryGroupId: null,
        Order: signatory.resolvedOrder,
        SignatoryId: null,
        SignatoryName: signatory.name || 'Signatory',
      });

      // Add Date Field (same coordinate treatment as signature)
      stampPostInfoCoordinates.push({
        FileId: fileId,
        Width: dateWidth,
        Height: dateHeight,
        PageNumber: lastPageIndex,
        X: dateX,
        Y: dateY,
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

  // Use templateSlug for redirect URL, or fall back to document type
  const redirectPath = templateSlug || document?.metadata?.documentType || 'templates';
  
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
    RedirectUrl: `${origin}/templates/${redirectPath}`,
  };

  return {
    prepareCommand,
    stampCoordinates,
    textFieldCoordinates,
    stampPostInfoCoordinates,
  };
}

/**
 * Step 1: Prepare contract with signatories
 */
async function prepareContract(
  accessToken: string,
  prepareCommand: any
): Promise<string> {
  const response = await fetch(PREPARE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(prepareCommand),
  });

  const prepareResponseText = await response.clone().text();
  console.log('🔍 PrepareContract response status:', response.status, response.statusText);
  console.log('🔍 PrepareContract response body:', prepareResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(
      `PrepareContract failed: ${response.status} ${response.statusText}\n${prepareResponseText}`
    );
  }

  const result = JSON.parse(prepareResponseText);

  // The API returns DocumentId nested in Result object
  const documentId = result.Result?.DocumentId || result.DocumentId;

  if (!documentId) {
    throw new Error(`No DocumentId in PrepareContract response: ${prepareResponseText}`);
  }

  // Validate DocumentId format (should be a valid GUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(documentId)) {
    throw new Error(`Invalid DocumentId format: ${documentId}`);
  }

  return documentId;
}

/**
 * Step 2: Wait for preparation_success event
 */
async function waitForPreparationSuccess(
  accessToken: string,
  documentId: string
): Promise<boolean> {
  const maxAttempts = 10;
  const delayMs = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(GET_EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
        Type: 'DocumentStatus',
        Status: 'preparation_success',
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  GetEvents check failed (attempt ${attempt}/${maxAttempts}):`, response.status);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return false;
    }

    const events = await response.json();

    if (Array.isArray(events) && events.length > 0) {
      const prepSuccessEvent = events.find(
        (e: { Status?: string; Success?: boolean }) =>
          e.Status === 'preparation_success' && e.Success === true
      );

      if (prepSuccessEvent) {
        console.log(`   ✓ Found preparation_success event (attempt ${attempt})`);
        return true;
      }
    }

    if (attempt < maxAttempts) {
      console.log(`   ⌛ Waiting for preparation_success (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Step 3: Rollout contract with signature field coordinates
 */
async function rolloutContract(
  accessToken: string,
  documentId: string,
  coordinates: {
    stampCoordinates: any[];
    textFieldCoordinates: any[];
    stampPostInfoCoordinates: any[];
  }
): Promise<void> {
  const response = await fetch(ROLLOUT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      DocumentId: documentId,
      StampCoordinates: coordinates.stampCoordinates,
      TextFieldCoordinates: coordinates.textFieldCoordinates,
      StampPostInfoCoordinates: coordinates.stampPostInfoCoordinates,
    }),
  });

  const rolloutResponseText = await response.clone().text();
  console.log('🔍 RolloutContract response status:', response.status, response.statusText);
  console.log('🔍 RolloutContract response body:', rolloutResponseText || '(empty body)');

  if (!response.ok) {
    throw new Error(
      `RolloutContract failed: ${response.status} ${response.statusText}\n${rolloutResponseText}`
    );
  }

  console.log('✅ RolloutContract succeeded');
}

/**
 * Step 4: Wait for rollout_success event
 */
async function waitForRolloutSuccess(accessToken: string, documentId: string) {
  const maxAttempts = 10; // Poll for up to 50 seconds
  const delayMs = 5000; // 5 second delay between attempts
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

    // Check if we have rollout_success or rollout_failed event
    if (Array.isArray(parsed)) {
      const hasRolloutEvent = parsed.some(
        (event: any) =>
          event.Status === 'rollout_success' || event.Status === 'rollout_failed'
      );

      if (hasRolloutEvent) {
        console.log('✅ Rollout event detected, stopping poll');
        return parsed;
      }

      // If no rollout event yet, keep polling
      if (attempt < maxAttempts) {
        console.log(
          `⏳ No rollout event yet (${parsed.length} events), waiting ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }

    return parsed;
  }

  return lastParsed;
}

