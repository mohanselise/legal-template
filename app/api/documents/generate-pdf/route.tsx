import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EmploymentAgreementPDF } from '@/lib/pdf/EmploymentAgreementPDF';

export async function POST(request: NextRequest) {
  try {
    const { document, formData } = await request.json();

    if (!document || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: document and formData' },
        { status: 400 }
      );
    }

    // Generate a unique document ID
    const docId = `DOC-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    // Generate PDF buffer using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <EmploymentAgreementPDF document={document} docId={docId} />
    );

    // Return the PDF file
    const sanitizedEmployeeName = sanitizeForFilename(
      document.parties?.employee?.legalName || formData.employeeName
    );
    const filename = `Employment_Agreement_${sanitizedEmployeeName}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

const FILENAME_FALLBACK = 'Employment_Agreement';

function sanitizeForFilename(name: unknown): string {
  if (!name || typeof name !== 'string') {
    return FILENAME_FALLBACK;
  }

  // Strip potentially dangerous characters and collapse whitespace.
  const sanitized = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  if (!sanitized) {
    return FILENAME_FALLBACK;
  }

  // Guard against excessively long filenames.
  return sanitized.slice(0, 100);
}
