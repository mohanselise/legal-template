import { NextRequest, NextResponse } from 'next/server';

/**
 * Upload PDF to SELISE Storage (background process)
 * This starts immediately when user clicks "Send via SELISE Signature"
 */
export async function POST(request: NextRequest) {
  try {
    const { document, formData } = await request.json();

    if (!document || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: document, formData' },
        { status: 400 }
      );
    }

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

    const { access_token } = await tokenResponse.json();

    // Step 2: Generate PDF from document data
    const pdfResponse = await fetch(`${request.nextUrl.origin}/api/documents/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, formData }),
    });

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }

    const pdfBlob = await pdfResponse.blob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Step 3: Upload to SELISE Storage
    const fileId = crypto.randomUUID();
    const fileName = `Employment_Agreement_${document.parties.employee.legalName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    const storageResponse = await fetch('https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        ItemId: fileId,
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
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
      },
      body: pdfBuffer,
    });

    if (!blobUploadResponse.ok) {
      throw new Error(`Blob upload failed: ${blobUploadResponse.status}`);
    }

    return NextResponse.json({
      success: true,
      fileId: FileId,
      fileName,
      accessToken: access_token, // Return token for next step
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
