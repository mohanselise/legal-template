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

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Employment_Agreement_${formData.employeeName?.replace(/\s+/g, '_')}.docx"`,
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
