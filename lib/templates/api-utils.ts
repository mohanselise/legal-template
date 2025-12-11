/**
 * Shared API Utilities for Template Generation
 * 
 * Common functionality used across all template generation API routes:
 * - Turnstile validation
 * - Request parsing
 * - Error handling
 * - Response formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateTurnstileToken } from 'next-turnstile';
import type { EnrichmentState } from './types';

// ==========================================
// TYPES
// ==========================================

export interface GenerationRequestBody<TFormData = Record<string, unknown>> {
  formData: TFormData;
  enrichment?: {
    jurisdiction?: unknown;
    company?: unknown;
    jobTitle?: unknown;
    marketStandards?: unknown;
  };
  background?: boolean;
  acceptedLegalDisclaimer?: boolean;
  understandAiContent?: boolean;
  turnstileToken?: string;
}

export interface GenerationResponse<TDocument = unknown> {
  document: TDocument;
  metadata?: unknown;
  usage?: unknown;
}

export interface ApiError {
  error: string;
  details?: string;
  'error-codes'?: string[];
  'is-token-expiration'?: boolean;
}

// ==========================================
// TURNSTILE VALIDATION
// ==========================================

export interface TurnstileValidationResult {
  success: boolean;
  error?: ApiError;
}

/**
 * Validate Turnstile token for bot protection
 */
export async function validateTurnstile(
  token: string | undefined
): Promise<TurnstileValidationResult> {
  // Check if token is provided
  if (!token || typeof token !== 'string' || !token.trim()) {
    return {
      success: false,
      error: {
        error: 'Human verification is required before generating the document.',
        details: 'Please complete the Turnstile verification.',
      },
    };
  }

  // Check for secret key
  const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

  if (!TURNSTILE_SECRET_KEY) {
    console.error('⚠️ [API] TURNSTILE_SECRET_KEY is not set');
    return {
      success: false,
      error: {
        error: 'Server configuration error: Turnstile secret key not set',
      },
    };
  }

  try {
    const validationResponse = await validateTurnstileToken({
      token,
      secretKey: TURNSTILE_SECRET_KEY,
      sandbox: false,
    });

    if (!validationResponse.success) {
      const errorCodes = (validationResponse as any)['error-codes'] || [];
      console.error('[API] Turnstile validation failed:', errorCodes);

      let errorMessage = 'Human verification failed. Please verify again.';
      let isTokenExpiration = false;

      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'Your verification has expired. Please verify again.';
        isTokenExpiration = true;
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Invalid verification. Please try again.';
        isTokenExpiration = true;
      } else if (errorCodes.includes('invalid-input-secret')) {
        errorMessage = 'Server configuration error. Please contact support.';
      }

      return {
        success: false,
        error: {
          error: errorMessage,
          'error-codes': errorCodes,
          'is-token-expiration': isTokenExpiration,
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[API] Turnstile validation error:', error);
    return {
      success: false,
      error: {
        error: 'Verification failed. Please try again.',
      },
    };
  }
}

// ==========================================
// REQUEST PARSING
// ==========================================

/**
 * Parse and validate the generation request body
 */
export async function parseGenerationRequest<TFormData>(
  request: NextRequest
): Promise<{ data: GenerationRequestBody<TFormData> } | { error: ApiError }> {
  try {
    const body = await request.json();

    if (!body.formData || typeof body.formData !== 'object') {
      return {
        error: {
          error: 'Missing form data for document generation.',
        },
      };
    }

    return { data: body as GenerationRequestBody<TFormData> };
  } catch (error) {
    return {
      error: {
        error: 'Invalid request body.',
        details: 'Could not parse JSON.',
      },
    };
  }
}

// ==========================================
// RESPONSE HELPERS
// ==========================================

/**
 * Create a success response with the generated document
 */
export function successResponse<TDocument>(
  data: GenerationResponse<TDocument>
): NextResponse {
  return NextResponse.json(data);
}

/**
 * Create an error response
 */
export function errorResponse(
  error: ApiError,
  status: number = 400
): NextResponse {
  return NextResponse.json(error, { status });
}

/**
 * Create a server error response
 */
export function serverError(
  message: string = 'An unexpected error occurred.'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

// ==========================================
// LOGGING
// ==========================================

/**
 * Log API request start
 */
export function logRequestStart(templateId: string): number {
  const startTime = Date.now();
  console.log(`🚀 [${templateId}] Request received at:`, new Date().toISOString());
  return startTime;
}

/**
 * Log API request completion
 */
export function logRequestComplete(templateId: string, startTime: number): void {
  const duration = Date.now() - startTime;
  console.log(`✅ [${templateId}] Request completed in ${duration}ms`);
}

/**
 * Log API error
 */
export function logError(templateId: string, error: unknown): void {
  console.error(`❌ [${templateId}] Error:`, error);
}

// ==========================================
// ENRICHMENT EXTRACTION
// ==========================================

/**
 * Extract enrichment data from request body
 */
export function extractEnrichment(
  enrichment?: GenerationRequestBody['enrichment']
): EnrichmentState {
  return {
    jurisdictionLoading: false,
    jurisdictionData: enrichment?.jurisdiction as unknown,
    companyLoading: false,
    companyData: enrichment?.company as unknown,
    jobTitleLoading: false,
    jobTitleData: enrichment?.jobTitle as unknown,
    marketStandards: enrichment?.marketStandards as unknown,
  };
}
