import { NextRequest, NextResponse } from 'next/server';

/**
 * Rollout contract with signature fields and send to signatories
 */
export async function POST(request: NextRequest) {
  try {
    const { documentId, fileId, signatories, signaturePositions } = await request.json();

    if (!documentId || !fileId || !signatories) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Get access token
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
      throw new Error('Authentication failed');
    }

    const { access_token } = await tokenResponse.json();

    // Default signature positions (last page of document)
    const defaultPositions = signaturePositions || {
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

    // Build stamp coordinates (signature boxes)
    const stampCoordinates = signatories.map((s: { email: string }, index: number) => {
      const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
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
    const textFieldCoordinates = signatories.map((s: { email: string; name: string }, index: number) => {
      const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
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
    const stampPostInfoCoordinates = signatories.map((s: { email: string }, index: number) => {
      const position = index === 0 ? defaultPositions.companyRep : defaultPositions.employee;
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

    // Rollout contract
    const rolloutResponse = await fetch('https://selise.app/api/selisign/s1/SeliSign/ExternalApp/RolloutContract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        DocumentId: documentId,
        StampCoordinates: stampCoordinates,
        TextFieldCoordinates: textFieldCoordinates,
        StampPostInfoCoordinates: stampPostInfoCoordinates,
      }),
    });

    if (!rolloutResponse.ok) {
      const errorText = await rolloutResponse.text();
      console.error('Rollout failed:', errorText);
      throw new Error(`Rollout failed: ${rolloutResponse.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Contract rolled out and invitations sent',
      documentId,
    });
  } catch (error) {
    console.error('Error rolling out contract:', error);
    return NextResponse.json(
      {
        error: 'Failed to rollout contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
