import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EmploymentAgreementPDF } from '@/lib/pdf/EmploymentAgreementPDF';
import { generateSignatureFieldMetadata, createMetadataPayload } from '@/lib/pdf/signature-field-metadata';

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
    
    // Calculate number of pages (approximate - can be refined)
    // For now, we'll assume signature is on last page
    const estimatedPages = Math.ceil(document.articles?.length || 5);
    
    // Generate signature field metadata
    const employerName = document.parties?.employer?.legalName || formData.companyName || 'Company';
    const employeeName = document.parties?.employee?.legalName || formData.employeeName || 'Employee';
    const signatureFields = generateSignatureFieldMetadata(
      employerName,
      employeeName,
      estimatedPages
    );

    // Extract signatory information from formData (Step 3 of SmartFlow)
    const signatories = [
      {
        party: 'employer' as const,
        name: formData.companyRepName || employerName,
        email: formData.companyRepEmail || document.parties?.employer?.email || '',
        role: formData.companyRepTitle || 'Authorized Representative',
        ...(formData.companyRepPhone && { phone: formData.companyRepPhone }),
      },
      {
        party: 'employee' as const,
        name: employeeName,
        email: formData.employeeEmail || document.parties?.employee?.email || '',
        role: formData.jobTitle || 'Employee',
        ...(formData.employeePhone && { phone: formData.employeePhone }),
      },
    ];

    // Check if client wants metadata (for signature editor)
    const url = new URL(request.url);
    const includeMetadata = url.searchParams.get('metadata') === 'true';
    
    if (includeMetadata) {
      // Return JSON with PDF and metadata
      const base64Pdf = pdfBuffer.toString('base64');
      return NextResponse.json({
        success: true,
        pdfBase64: base64Pdf,
        signatureFields,
        signatories, // Include signatory contact info
        metadata: {
          docId,
          pages: estimatedPages,
          employerName,
          employeeName,
        },
      });
    }

    // Return the PDF file (original behavior)
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
        'X-Signature-Fields': createMetadataPayload(signatureFields, signatories), // Include metadata + signatory info in header
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
