import { NextRequest, NextResponse } from 'next/server';

/**
 * Get PDF file from SELISE Storage for preview
 */
export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'FileId is required' },
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
    console.log('🔐 Authenticating with SELISE Identity API...');
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
      console.error('❌ Authentication failed:', errorText);
      throw new Error(`Authentication failed: ${tokenResponse.status}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('✅ Access token received');

    // Step 2: Get file metadata (includes secure download URL)
    console.log('📥 Getting file info for FileId:', fileId);
    const getFileUrl = `https://selise.app/api/storageservice/v100/StorageService/StorageQuery/GetFile?FileId=${fileId}`;
    console.log('🔍 Request URL:', getFileUrl);
    console.log('🔍 Request method: POST');
    console.log('🔍 Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token.substring(0, 20)}...`,
    });
    console.log('🔍 Request body:', '(empty string)');

    const getFileResponse = await fetch(getFileUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: '',
    });

    const responseText = await getFileResponse.clone().text();
    console.log('🔍 GetFile response status:', getFileResponse.status, getFileResponse.statusText);
    console.log('🔍 GetFile response headers:', Object.fromEntries(getFileResponse.headers.entries()));
    console.log('🔍 GetFile response body:', responseText);

    if (!getFileResponse.ok) {
      console.error('❌ Failed to get file info. Full response:', responseText);
      throw new Error(`Failed to get file info: ${getFileResponse.status} - ${responseText}`);
    }

    const fileInfo = JSON.parse(responseText);
    const downloadUrl = fileInfo.Url;

    if (!downloadUrl) {
      console.error('❌ No download URL in response:', fileInfo);
      throw new Error('No download URL returned from GetFile API');
    }

    console.log('✅ File info received with download URL');

    // Step 3: Download the file using the secure URL
    console.log('☁️  Downloading file from secure storage...');
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!fileResponse.ok) {
      console.error('❌ Failed to download file:', fileResponse.status);
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    console.log(`✅ File downloaded (${fileBuffer.byteLength} bytes)`);

    // Step 4: Return the PDF file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
