import { NextRequest, NextResponse } from 'next/server';

/**
 * Rollout contract with signature fields and send to signatories
 */
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

export async function POST(request: NextRequest) {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📐 Starting Rollout Process');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { documentId, fileId, signatories, signatureFields } = await request.json();

    console.log('📋 Rollout Request Details:');
    console.log(`   DocumentId: ${documentId}`);
    console.log(`   FileId: ${fileId}`);
    console.log(`   Signatories: ${signatories?.length || 0}`);
    console.log(`   Signature Fields: ${signatureFields?.length || 0}`);

    if (!documentId || !fileId || !signatories) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate DocumentId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      console.error('❌ Invalid DocumentId format:', documentId);
      return NextResponse.json(
        { error: `Invalid DocumentId format: ${documentId}` },
        { status: 400 }
      );
    }

    // Validate environment variables
    const clientId = process.env.SELISE_CLIENT_ID;
    const clientSecret = process.env.SELISE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ SELISE credentials not configured');
      return NextResponse.json(
        { error: 'SELISE credentials not configured' },
        { status: 500 }
      );
    }

    // Get access token
    console.log('🔐 Step 1: Authenticating with SELISE Identity API...');
    const tokenResponse = await fetch('https://selise.app/api/identity/v100/identity/token', {
      method: 'POST',
      headers: {
        'Origin': 'https://selise.app',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    const tokenResponseText = await tokenResponse.clone().text();
    console.log('🔍 Identity API response status:', tokenResponse.status, tokenResponse.statusText);
    console.log('🔍 Identity API response body:', tokenResponseText || '(empty body)');

    if (!tokenResponse.ok) {
      console.error('❌ Authentication failed:', tokenResponseText);
      throw new Error(`Authentication failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const { access_token } = JSON.parse(tokenResponseText);
    console.log('✅ Access token received');

    // Process signature fields - use custom fields if provided, otherwise use defaults
    console.log('\n📐 Step 2: Processing signature field positions...');

    let stampCoordinates: Array<{
      FileId: string;
      PageNumber: number;
      Width: number;
      Height: number;
      X: number;
      Y: number;
      SignatoryEmail: string;
    }> = [];

    let textFieldCoordinates: Array<{
      FileId: string;
      PageNumber: number;
      Width: number;
      Height: number;
      X: number;
      Y: number;
      SignatoryEmail: string;
      Value: string;
    }> = [];

    let stampPostInfoCoordinates: Array<{
      FileId: string;
      PageNumber: number;
      Width: number;
      Height: number;
      X: number;
      Y: number;
      EntityName: string;
      PropertyName: string;
      SignatoryEmail: string;
    }> = [];

    if (signatureFields && signatureFields.length > 0) {
      // Use custom signature fields from the editor
      console.log(`   Using ${signatureFields.length} custom signature fields`);

      const fields = signatureFields as SignatureField[];

      // Group fields by signatory
      fields.forEach((field: SignatureField) => {
        const signatory = signatories[field.signatoryIndex];
        if (!signatory) return;

        console.log(`   Field: ${field.type} for ${signatory.email} on page ${field.pageNumber}`);

        if (field.type === 'signature') {
          stampCoordinates.push({
            FileId: fileId,
            PageNumber: field.pageNumber - 1, // PDF.js is 1-indexed, API is 0-indexed
            Width: field.width,
            Height: field.height,
            X: field.x,
            Y: field.y,
            SignatoryEmail: signatory.email,
          });
        } else if (field.type === 'text') {
          textFieldCoordinates.push({
            FileId: fileId,
            PageNumber: field.pageNumber - 1,
            Width: field.width,
            Height: field.height,
            X: field.x,
            Y: field.y,
            SignatoryEmail: signatory.email,
            Value: signatory.name,
          });
        } else if (field.type === 'date') {
          stampPostInfoCoordinates.push({
            FileId: fileId,
            PageNumber: field.pageNumber - 1,
            Width: field.width,
            Height: field.height,
            X: field.x,
            Y: field.y,
            EntityName: 'AuditLog',
            PropertyName: '{StampTime}',
            SignatoryEmail: signatory.email,
          });
        }
      });
    } else {
      // Use default positions (last page)
      console.log('   Using default signature field positions');
      const defaultPositions = {
        lastPage: 0,
        companyRep: {
          signature: { x: 80, y: 600, width: 180, height: 70 },
          nameField: { x: 80, y: 550, width: 180, height: 25 },
          dateStamp: { x: 80, y: 680, width: 120, height: 20 },
        },
        employee: {
          signature: { x: 350, y: 600, width: 180, height: 70 },
          nameField: { x: 350, y: 550, width: 180, height: 25 },
          dateStamp: { x: 350, y: 680, width: 120, height: 20 },
        },
      };

      console.log(`   Page: ${defaultPositions.lastPage}`);
      console.log(`   Signature 1: X=${defaultPositions.companyRep.signature.x}, Y=${defaultPositions.companyRep.signature.y}`);
      console.log(`   Signature 2: X=${defaultPositions.employee.signature.x}, Y=${defaultPositions.employee.signature.y}`);

      // Build stamp coordinates (signature boxes)
      stampCoordinates = signatories.map((s: { email: string }, index: number) => {
        const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
        console.log(`   Signature ${index + 1}: ${s.email}`);
        return {
          FileId: fileId,
          PageNumber: defaultPositions.lastPage,
          Width: position.signature.width,
          Height: position.signature.height,
          X: position.signature.x,
          Y: position.signature.y,
          SignatoryEmail: s.email,
        };
      });

      // Build text field coordinates (name fields)
      textFieldCoordinates = signatories.map((s: { email: string; name: string }, index: number) => {
        const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
        console.log(`   Name field ${index + 1}: ${s.name}`);
        return {
          FileId: fileId,
          PageNumber: defaultPositions.lastPage,
          Width: position.nameField.width,
          Height: position.nameField.height,
          X: position.nameField.x,
          Y: position.nameField.y,
          SignatoryEmail: s.email,
          Value: s.name,
        };
      });

      // Build stamp post info coordinates (date stamps)
      stampPostInfoCoordinates = signatories.map((s: { email: string }, index: number) => {
        const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
        console.log(`   Date stamp ${index + 1}: ${s.email}`);
        return {
          FileId: fileId,
          PageNumber: defaultPositions.lastPage,
          Width: position.dateStamp.width,
          Height: position.dateStamp.height,
          X: position.dateStamp.x,
          Y: position.dateStamp.y,
          EntityName: 'AuditLog',
          PropertyName: '{StampTime}',
          SignatoryEmail: s.email,
        };
      });
    }

    console.log('\n📝 Step 3: Field summary:');
    console.log(`   Signature fields: ${stampCoordinates.length}`);
    console.log(`   Text fields: ${textFieldCoordinates.length}`);
    console.log(`   Date fields: ${stampPostInfoCoordinates.length}`);

    // Rollout contract
    console.log('\n🚀 Step 4: Calling Rollout API...');
    console.log(`   DocumentId: ${documentId}`);
    console.log(`   FileId: ${fileId}`);
    console.log(`   StampCoordinates: ${stampCoordinates.length}`);
    console.log(`   TextFieldCoordinates: ${textFieldCoordinates.length}`);
    console.log(`   StampPostInfoCoordinates: ${stampPostInfoCoordinates.length}`);

    const rolloutPayload = {
      DocumentId: documentId,
      StampCoordinates: stampCoordinates,
      TextFieldCoordinates: textFieldCoordinates,
      StampPostInfoCoordinates: stampPostInfoCoordinates,
    };

    console.log('\n🔍 Rollout Payload:');
    console.log(JSON.stringify(rolloutPayload, null, 2));

    const rolloutResponse = await fetch('https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify(rolloutPayload),
    });

    const rolloutResponseText = await rolloutResponse.clone().text();
    console.log('\n🔍 Rollout API response status:', rolloutResponse.status, rolloutResponse.statusText);
    console.log('🔍 Rollout API response body:', rolloutResponseText || '(empty body)');

    if (!rolloutResponse.ok) {
      console.error('❌ Rollout failed:', rolloutResponseText);
      throw new Error(`Rollout failed: ${rolloutResponse.status} ${rolloutResponse.statusText}\n${rolloutResponseText}`);
    }

    // Parse and display rollout response details
    let rolloutData = null;
    try {
      rolloutData = rolloutResponseText ? JSON.parse(rolloutResponseText) : null;
      console.log('\n✅ Rollout completed successfully!');
      console.log('📧 Invitation emails should be sent to signatories');
      console.log('\n📦 Rollout Response Details:');
      console.log(JSON.stringify(rolloutData, null, 2));
    } catch {
      console.log('✅ Rollout completed successfully!');
      console.log('📧 Invitation emails should be sent to signatories');
      console.log('⚠️  Response body could not be parsed as JSON');
    }

    // Get document events to verify
    console.log('\n📊 Step 5: Fetching document events...');
    const events = await getDocumentEvents(access_token, documentId);
    console.log('📦 GetEvents response:', JSON.stringify(events, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Contract rolled out and invitations sent',
      documentId,
      events,
    });
  } catch (error) {
    console.error('\n❌ Error rolling out contract:', error);
    return NextResponse.json(
      {
        error: 'Failed to rollout contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getDocumentEvents(accessToken: string, documentId: string): Promise<unknown> {
  const maxAttempts = 5;
  const delayMs = 3000;
  let lastParsed: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch('https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
      }),
    });

    const eventsResponseText = await response.clone().text();
    console.log(`🔍 GetEvents attempt ${attempt}/${maxAttempts} status:`, response.status, response.statusText);
    console.log('🔍 GetEvents attempt body:', eventsResponseText || '(empty body)');

    if (!response.ok) {
      console.warn(`⚠️  GetEvents failed (attempt ${attempt}/${maxAttempts}):`, response.status);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return { error: `GetEvents failed: ${response.status}` };
    }

    const parsed = eventsResponseText ? JSON.parse(eventsResponseText) : null;
    lastParsed = parsed;

    const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
    if (isEmptyArray && attempt < maxAttempts) {
      console.log(`⌛ No events yet; waiting ${delayMs / 1000}s before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    return parsed;
  }

  return lastParsed;
}
