import { NextRequest, NextResponse } from 'next/server';
import { generateEmploymentAgreementDocx } from '@/lib/document-generator';

export async function POST(request: NextRequest) {
  try {
    const { document, formData } = await request.json();

    if (!document || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: document and formData' },
        { status: 400 }
      );
    }

    // Generate DOCX buffer
    const docxBuffer = await generateEmploymentAgreementDocx({
      document,
      formData,
    });

    // Return the DOCX file
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(docxBuffer);
    const sanitizedEmployeeName = sanitizeForFilename(formData.employeeName);
    const filename = `Employment_Agreement_${sanitizedEmployeeName}.docx`;

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX document', details: error instanceof Error ? error.message : 'Unknown error' },
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
