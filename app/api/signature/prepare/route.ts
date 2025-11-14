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

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token request failed:', errorText);
        throw new Error(`Authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      access_token = tokenData.access_token;

      // Step 2: Generate DOCX from document data
      const docxResponse = await fetch(`${request.nextUrl.origin}/api/documents/generate-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document, formData }),
      });

      if (!docxResponse.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const docxBlob = await docxResponse.blob();
      const docxBuffer = Buffer.from(await docxBlob.arrayBuffer());

      // Step 3: Upload to SELISE Storage
      const newFileId = crypto.randomUUID();
      const fileName = `Employment_Agreement_${document.parties.employee.legalName.replace(/\s+/g, '_')}_${Date.now()}.docx`;

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

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        console.error('Storage URL request failed:', errorText);
        throw new Error(`Storage upload failed: ${storageResponse.status}`);
      }

      const { UploadUrl, FileId } = await storageResponse.json();

      // Step 4: Upload file to Azure Blob
      const blobUploadResponse = await fetch(UploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Length': docxBuffer.length.toString(),
        },
        body: docxBuffer,
      });

      if (!blobUploadResponse.ok) {
        throw new Error(`Blob upload failed: ${blobUploadResponse.status}`);
      }

      uploadedFileId = FileId;
    }

    // Step 5: Prepare contract
    const trackingId = crypto.randomUUID();
    const title = `Employment Agreement - ${document.parties.employee.legalName}`;

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

    if (!prepareResponse.ok) {
      const errorText = await prepareResponse.text();
      console.error('Prepare contract failed:', errorText);
      throw new Error(`Prepare contract failed: ${prepareResponse.status}`);
    }

    const prepareResult = await prepareResponse.json();
    const documentId = prepareResult.Result?.DocumentId || prepareResult.DocumentId;

    if (!documentId) {
      throw new Error('No DocumentId returned from prepare API');
    }

    // Step 6: Wait for preparation success
    await waitForPreparationSuccess(access_token, documentId);

    return NextResponse.json({
      success: true,
      documentId,
      trackingId,
      fileId: uploadedFileId,
      title,
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

    if (response.ok) {
      const events = await response.json();
      if (Array.isArray(events) && events.length > 0) {
        const prepSuccessEvent = events.find(
          (e: { Status?: string; Success?: boolean }) =>
            e.Status === 'preparation_success' && e.Success === true
        );
        if (prepSuccessEvent) {
          return true;
        }
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}
