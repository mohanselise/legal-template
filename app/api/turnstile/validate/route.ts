import { NextRequest, NextResponse } from 'next/server';
import { validateTurnstileToken } from 'next-turnstile';

export async function POST(request: NextRequest) {
  try {
    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    if (!TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Turnstile secret key not configured', success: false },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid token', success: false },
        { status: 400 }
      );
    }

    // Validate token using next-turnstile
    const validationResponse = await validateTurnstileToken({
      token,
      secretKey: TURNSTILE_SECRET_KEY,
      sandbox: false, // Using production keys
    });

    if (!validationResponse.success) {
      const errorCodes = (validationResponse as any)['error-codes'] || (validationResponse as any).error_codes || ['validation-failed'];
      console.error('[Turnstile] Validation failed:', errorCodes);
      return NextResponse.json(
        {
          success: false,
          'error-codes': errorCodes,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge_ts: validationResponse.challenge_ts,
      hostname: validationResponse.hostname,
    });
  } catch (error) {
    console.error('[Turnstile] Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during validation',
        'error-codes': ['internal-error'],
      },
      { status: 500 }
    );
  }
}

