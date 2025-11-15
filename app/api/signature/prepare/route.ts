import { NextRequest, NextResponse } from 'next/server';

/**
 * Prepare contract with SELISE Signature
 * This uploads the document and creates a draft with signatories
 */
export async function POST(request: NextRequest) {
  try {
    const { document, formData, signatories, fileId, accessToken } = await request.json();

    if (!document || !formData || !signatories) {
      return NextResponse.json(
        { error: 'Missing required fields: document, formData, and signatories' },
        { status: 400 }
      );
    }

    let access_token = accessToken;
    let uploadedFileId = fileId;
    let pdfBuffer: Buffer | null = null;

    // If fileId and accessToken not provided, upload first
    if (!uploadedFileId || !access_token) {
      // Validate environment variables
      const clientId = process.env.SELISE_CLIENT_ID;
      const clientSecret = process.env.SELISE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'SELISE credentials not configured' },
          { status: 500 }
        );
      }

      // Step 1: Get access token
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

      const identityResponseText = await tokenResponse.clone().text();
      console.log('🔍 Identity API response status:', tokenResponse.status, tokenResponse.statusText);
      console.log('🔍 Identity API response body:', identityResponseText || '(empty body)');

      if (!tokenResponse.ok) {
        console.error('❌ Token request failed:', identityResponseText);
        throw new Error(`Authentication failed: ${tokenResponse.status} ${tokenResponse.statusText}\n${identityResponseText}`);
      }

      const tokenData = JSON.parse(identityResponseText);
      access_token = tokenData.access_token;
      console.log('✅ Access token received');

      // Step 2: Generate PDF from document data
      console.log('📄 Step 2: Generating PDF document...');
      const pdfResponse = await fetch(`${request.nextUrl.origin}/api/documents/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document, formData }),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }

      const pdfBlob = await pdfResponse.blob();
      pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);

      // Step 3: Upload to SELISE Storage
      console.log('📤 Step 3: Uploading to SELISE Storage...');
      const newFileId = crypto.randomUUID();
      const fileName = `Employment_Agreement_${document.parties.employee.legalName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      console.log(`   FileId: ${newFileId}`);
      console.log(`   FileName: ${fileName}`);

      const storageResponse = await fetch('https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          ItemId: newFileId,
          MetaData: '{}',
          Name: fileName,
          ParentDirectoryId: '',
          Tags: '["File", "EmploymentAgreement"]',
          AccessModifier: 'Private',
        }),
      });

      const preSignResponseText = await storageResponse.clone().text();
      console.log('🔍 Storage pre-sign response status:', storageResponse.status, storageResponse.statusText);
      console.log('🔍 Storage pre-sign response body:', preSignResponseText || '(empty body)');

      if (!storageResponse.ok) {
        console.error('❌ Storage URL request failed:', preSignResponseText);
        throw new Error(`Storage upload failed: ${storageResponse.status} ${storageResponse.statusText}\n${preSignResponseText}`);
      }

      const { UploadUrl, FileId } = JSON.parse(preSignResponseText);
      console.log('✅ Pre-signed URL received');

      // Step 4: Upload file to Azure Blob
      console.log('☁️  Step 4: Uploading to Azure Blob Storage...');
      if (!pdfBuffer) {
        throw new Error('PDF buffer is null - this should not happen');
      }
      const blobUploadResponse = await fetch(UploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length.toString(),
        },
        body: pdfBuffer as unknown as BodyInit,
      });

      const blobUploadResponseText = await blobUploadResponse.clone().text();
      console.log('🔍 Blob upload response status:', blobUploadResponse.status, blobUploadResponse.statusText);
      console.log('🔍 Blob upload response body:', blobUploadResponseText || '(empty body)');

      if (!blobUploadResponse.ok) {
        console.error('❌ Blob upload failed:', blobUploadResponseText);
        throw new Error(`Blob upload failed: ${blobUploadResponse.status} ${blobUploadResponse.statusText}\n${blobUploadResponseText}`);
      }

      uploadedFileId = FileId;
      console.log('✅ File uploaded to blob storage');
    }

    // Step 5: Prepare contract
    console.log('📝 Step 5: Preparing contract draft...');
    const trackingId = crypto.randomUUID();
    const title = `Employment Agreement - ${document.parties.employee.legalName}`;
    
    console.log(`   TrackingId: ${trackingId}`);
    console.log(`   Title: ${title}`);
    console.log(`   FileId: ${uploadedFileId}`);
    console.log(`   Owner: ${signatories[0].email}`);
    console.log(`   Signatories: ${signatories.length}`);

    const prepareResponse = await fetch('https://selise.app/api/selisign/s1/SeliSign/ExternalApp/PrepareContract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        TrackingId: trackingId,
        Title: title,
        ContractType: 0,
        ReturnDocument: true,
        ReceiveRolloutEmail: true,
        SignatureClass: 0,
        Language: 'en-US',
        LandingPageType: 0,
        ReminderPulse: 168,
        OwnerEmail: signatories[0].email,
        FileIds: [uploadedFileId],
        AddSignatoryCommands: signatories.map((s: { name: string; email: string; title?: string; phone?: string }) => {
          const nameParts = s.name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || 'N/A'; // API requires LastName, use N/A if not provided
          
          return {
            Email: s.email,
            ContractRole: 0,
            FirstName: firstName,
            LastName: lastName,
            Phone: s.phone || '',
          };
        }),
        SigningOrders: signatories.map((s: { email: string }, index: number) => ({
          Email: s.email,
          Order: index + 1,
        })),
        RedirectUrl: `${request.nextUrl.origin}/templates/employment-agreement`,
      }),
    });

    const prepareResponseText = await prepareResponse.clone().text();
    console.log('🔍 Prepare API response status:', prepareResponse.status, prepareResponse.statusText);
    console.log('🔍 Prepare API response body:', prepareResponseText || '(empty body)');

    if (!prepareResponse.ok) {
      console.error('❌ Prepare contract failed:', prepareResponseText);
      throw new Error(`Prepare contract failed: ${prepareResponse.status} ${prepareResponse.statusText}\n${prepareResponseText}`);
    }

    const prepareResult = JSON.parse(prepareResponseText);
    const documentId = prepareResult.Result?.DocumentId || prepareResult.DocumentId;

    if (!documentId) {
      console.error('❌ No DocumentId in response:', prepareResult);
      throw new Error('No DocumentId returned from prepare API');
    }

    // Validate DocumentId format (should be a valid GUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      console.error('❌ Invalid DocumentId format:', documentId);
      throw new Error(`Invalid DocumentId format: ${documentId}`);
    }

    console.log('✅ Contract prepared');
    console.log(`   DocumentId: ${documentId}`);

    // Step 6: Wait for preparation success
    console.log('⏳ Step 6: Waiting for preparation_success event...');
    await waitForPreparationSuccess(access_token, documentId);
    console.log('✅ Preparation confirmed by API events');

    console.log('\n🎉 SUCCESS! Contract preparation complete');
    console.log(`   DocumentId: ${documentId}`);
    console.log(`   TrackingId: ${trackingId}`);
    console.log(`   Title: ${title}`);

    // Return PDF as base64 for preview (if we generated it in this request)
    let pdfBase64: string | undefined;
    if (!fileId && pdfBuffer) {
      pdfBase64 = pdfBuffer.toString('base64');
      console.log(`   PDF size: ${pdfBuffer.length} bytes`);
    }

    return NextResponse.json({
      success: true,
      documentId,
      trackingId,
      fileId: uploadedFileId,
      title,
      pdfBase64, // Include PDF data for preview
      signatories: signatories.map((s: { name: string; email: string; role?: string }, index: number) => ({
        name: s.name,
        email: s.email,
        role: s.role || 'Signatory',
        order: index + 1,
      })),
    });
  } catch (error) {
    console.error('Error preparing contract:', error);
    return NextResponse.json(
      {
        error: 'Failed to prepare contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function waitForPreparationSuccess(accessToken: string, documentId: string): Promise<boolean> {
  const maxAttempts = 10;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch('https://selise.app/api/selisign/s1/SeliSign/ExternalApp/GetEvents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
        Type: 'DocumentStatus',
        Status: 'preparation_success',
      }),
    });

    const eventsResponseText = await response.clone().text();
    console.log(`🔍 GetEvents attempt ${attempt}/${maxAttempts} status:`, response.status, response.statusText);
    console.log(`🔍 GetEvents attempt ${attempt}/${maxAttempts} body:`, eventsResponseText || '(empty body)');

    if (response.ok) {
      const events = eventsResponseText ? JSON.parse(eventsResponseText) : null;
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
    }

    if (attempt < maxAttempts) {
      console.log(`   ⌛ Waiting for preparation_success (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.warn('⚠️  No preparation_success event found after max attempts');
  return false;
}
