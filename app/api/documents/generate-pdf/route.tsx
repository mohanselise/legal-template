import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EmploymentAgreementPDF } from '@/lib/pdf/EmploymentAgreementPDF';
import { generateSignatureFieldMetadata, createMetadataPayload } from '@/lib/pdf/signature-field-metadata';
import type { LegalDocument, SignatoryData } from '@/app/api/templates/employment-agreement/schema';
import { ensureAdditionalSignatoryArray } from '@/lib/templates/signatory-fields';
import type { SignatoryEntry } from '@/lib/templates/signatory-config';

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

    // 1. Prepare Signatories List (Unified Source of Truth)
    const legalDoc = document as LegalDocument;
    let signatories: any[] = [];

    // Priority 1: document.signatories (should already be set correctly from form data by generate API)
    if (legalDoc.signatories && Array.isArray(legalDoc.signatories) && legalDoc.signatories.length > 0) {
       signatories = legalDoc.signatories.map(s => ({
         party: s.party,
         name: s.name,
         email: s.email || '',
         role: s.title || s.party || 'Signatory',
         // Pass through all signatory fields for PDF rendering
         ...(s.title && { title: s.title }),
         ...(s.phone && { phone: s.phone }),
         ...(s.company && { company: s.company }),
         ...(s.address && { address: s.address }),
       }));
    }
    
    // If document doesn't have signatories, extract from form data
    if (signatories.length === 0) {
      const collected: SignatoryData[] = [];

      // Priority 2: NEW Signatory Screen format (formData.signatories array from SignatoryScreenRenderer)
      if (Array.isArray(formData.signatories) && formData.signatories.length > 0) {
        (formData.signatories as SignatoryEntry[]).forEach((entry) => {
          if (!entry.name || !entry.email) return;
          collected.push({
            party: (entry.partyType as SignatoryData['party']) || 'other',
            name: entry.name,
            email: entry.email,
            role: entry.title || entry.partyType || 'Signatory',
            title: entry.title,
            ...(entry.phone && { phone: entry.phone }),
            ...(entry.company && { company: entry.company }),
            ...(entry.address && { address: entry.address }),
          });
        });
      }
      // Priority 3: Form builder signatory screen fields (party, name, email, title, phone, company, address)
      else if (formData.name && formData.email) {
        collected.push({
          party: (formData.party as SignatoryData['party']) || 'other',
          name: formData.name as string,
          email: formData.email as string,
          role: (formData.title as string) || (formData.party as string) || 'Signatory',
          ...(formData.title && { title: formData.title as string }),
          ...(formData.phone && { phone: formData.phone as string }),
          ...(formData.company && { company: formData.company as string }),
          ...(formData.address && { address: formData.address as string }),
        });
      } else {
        // Priority 4: Check for numbered signatory pattern (signatory_1_name, signatory_2_name, etc.)
        let signatoryIndex = 1;
        while (formData[`signatory_${signatoryIndex}_name`]) {
          collected.push({
            party: (formData[`signatory_${signatoryIndex}_party`] as SignatoryData['party']) || 'other',
            name: formData[`signatory_${signatoryIndex}_name`] as string,
            email: (formData[`signatory_${signatoryIndex}_email`] as string) || '',
            role:
              (formData[`signatory_${signatoryIndex}_title`] as string) ||
              (formData[`signatory_${signatoryIndex}_party`] as string) ||
              'Signatory',
            ...(formData[`signatory_${signatoryIndex}_title`] && {
              title: formData[`signatory_${signatoryIndex}_title`] as string,
            }),
            ...(formData[`signatory_${signatoryIndex}_phone`] && {
              phone: formData[`signatory_${signatoryIndex}_phone`] as string,
            }),
            ...(formData[`signatory_${signatoryIndex}_company`] && {
              company: formData[`signatory_${signatoryIndex}_company`] as string,
            }),
            ...(formData[`signatory_${signatoryIndex}_address`] && {
              address: formData[`signatory_${signatoryIndex}_address`] as string,
            }),
          });
          signatoryIndex++;
        }
      }

      // Priority 5: Additional signatories repeater (legacy)
      const additionalEntries = ensureAdditionalSignatoryArray(formData.additionalSignatories);
      additionalEntries.forEach((entry) => {
        if (!entry.name || !entry.email) return;
        collected.push({
          party: (entry.party as SignatoryData['party']) || 'other',
          name: entry.name,
          email: entry.email,
          role: entry.title || entry.party || 'Signatory',
          ...(entry.title && { title: entry.title }),
          ...(entry.phone && { phone: entry.phone }),
        });
      });

      if (collected.length > 0) {
        signatories = collected;
      }
      
      // Priority 6: Legacy hardcoded field names (for backward compatibility)
      if (signatories.length === 0) {
        const employerName = formData.companyName || 'Company';
        const employeeName = formData.employeeName || 'Employee';
        
        // Only add employer if we have employer-related data
        if (formData.companyRepName || formData.companyRepEmail || formData.companyName) {
          signatories.push({
            party: 'employer',
            name: formData.companyRepName || employerName,
            email: formData.companyRepEmail || '',
            role: formData.companyRepTitle || 'Authorized Representative',
            ...(formData.companyRepPhone && { phone: formData.companyRepPhone }),
          });
        }
        
        // Only add employee if we have employee-related data
        if (formData.employeeName || formData.employeeEmail) {
          signatories.push({
            party: 'employee',
            name: employeeName,
            email: formData.employeeEmail || '',
            role: formData.jobTitle || 'Employee',
            ...(formData.employeePhone && { phone: formData.employeePhone }),
          });
        }
      }
    }
    
    // 2. Ensure Document has these signatories (for PDF Renderer)
    // We create a shallow copy with updated signatories to pass to the renderer
    const documentForPdf = {
        ...legalDoc,
        signatories: signatories
    };

    // 3. Generate PDF buffer using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <EmploymentAgreementPDF document={documentForPdf} docId={docId} />
    );
    
    // Calculate number of pages (approximate - can be refined)
    // For now, we'll assume signature is on last page
    const contentBlockCount = (document as LegalDocument).content?.length || 0;
    const estimatedPages = Math.ceil(contentBlockCount / 2) + 2; // Rough estimate: 2 blocks per page + cover/sig
    
    // 4. Generate signature field metadata using fixed-height block calculations
    // With fixed-height blocks, positions are deterministic and match PDF rendering exactly
    // Pass letterhead to adjust positions when letterhead content area differs from default margins
    const signatureFields = generateSignatureFieldMetadata(
      signatories,
      estimatedPages,
      legalDoc.letterhead
    );

    // Check if client wants metadata (for signature editor)
    const url = new URL(request.url);
    const includeMetadata = url.searchParams.get('metadata') === 'true';
    
    // Get names for metadata response (just for convenience)
    const employerName = signatories.find(s => s.party === 'employer')?.name || 'Company';
    const employeeName = signatories.find(s => s.party === 'employee')?.name || 'Employee';

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
