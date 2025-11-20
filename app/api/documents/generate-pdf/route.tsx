import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EmploymentAgreementPDF } from '@/lib/pdf/EmploymentAgreementPDF';
import { generateSignatureFieldMetadata, createMetadataPayload } from '@/lib/pdf/signature-field-metadata';
import type { LegalDocument, SignatoryData } from '@/app/api/templates/employment-agreement/schema';

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
    // Fallback to 5 pages if content length is not available (though it should be)
    const contentBlockCount = (document as LegalDocument).content?.length || 0;
    const estimatedPages = Math.ceil(contentBlockCount / 2) + 2; // Rough estimate: 2 blocks per page + cover/sig
    
    // Get names for metadata
    // Try to get from signatories first, then metadata/formData
    let employerName = formData.companyName || 'Company';
    let employeeName = formData.employeeName || 'Employee';
    
    const legalDoc = document as LegalDocument;
    if (legalDoc.signatories) {
      const empSignatory = legalDoc.signatories.find(s => s.party === 'employer');
      const employeeSignatory = legalDoc.signatories.find(s => s.party === 'employee');
      
      if (empSignatory?.name) employerName = empSignatory.name;
      if (employeeSignatory?.name) employeeName = employeeSignatory.name;
    }

    // Generate signature field metadata
    const signatureFields = generateSignatureFieldMetadata(
      employerName,
      employeeName,
      estimatedPages
    );

    // Extract signatory information from formData (Step 3 of SmartFlow)
    // OR from the document signatories if available (preferred)
    let signatories = [];
    
    if (legalDoc.signatories && Array.isArray(legalDoc.signatories)) {
       signatories = legalDoc.signatories.map(s => ({
         party: s.party,
         name: s.name,
         email: s.email || (s.party === 'employer' ? formData.companyRepEmail : formData.employeeEmail) || '',
         role: s.title || (s.party === 'employer' ? 'Authorized Representative' : 'Employee'),
         ...(s.phone && { phone: s.phone })
       }));
    } else {
      // Fallback for legacy or missing signatories
      signatories = [
        {
          party: 'employer' as const,
          name: formData.companyRepName || employerName,
          email: formData.companyRepEmail || '',
          role: formData.companyRepTitle || 'Authorized Representative',
          ...(formData.companyRepPhone && { phone: formData.companyRepPhone }),
        },
        {
          party: 'employee' as const,
          name: employeeName,
          email: formData.employeeEmail || '',
          role: formData.jobTitle || 'Employee',
          ...(formData.employeePhone && { phone: formData.employeePhone }),
        },
      ];
    }

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
    const sanitizedEmployeeName = sanitizeForFilename(employeeName);
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
