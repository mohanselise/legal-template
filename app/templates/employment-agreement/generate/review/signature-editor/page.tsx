'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PDFSignatureEditor } from '@/components/pdf-signature-editor';
import { Loader2, AlertCircle } from 'lucide-react';

interface SignatureField {
  id: string;
  type: 'signature' | 'text' | 'date';
  signatoryIndex: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface ContractData {
  document: any;
  formData: any;
}

interface SignatoryInfo {
  name: string;
  email: string;
  title?: string;
  phone: string;
  role: string;
  order: number;
}

function SignatureEditorContent() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [signatories, setSignatories] = useState<SignatoryInfo[]>([]);
  const [initialFields, setInitialFields] = useState<SignatureField[]>([]);

  useEffect(() => {
    // Get PDF and contract data from sessionStorage
    const storedPdfBase64 = sessionStorage.getItem('signature-editor-pdf');
    const storedDataJson = sessionStorage.getItem('signature-editor-data');

    if (!storedPdfBase64 || !storedDataJson) {
      setError('No document data found. Please start the signature process again.');
      setIsLoadingPdf(false);
      return;
    }

    try {
      const data: ContractData = JSON.parse(storedDataJson);
      console.log('📦 Loaded contract data from sessionStorage:', {
        documentTitle: data.document?.metadata?.title,
        employerName: data.document?.parties?.employer?.legalName,
        employeeName: data.document?.parties?.employee?.legalName,
        companyRepName: data.formData?.companyRepName,
        companyRepEmail: data.formData?.companyRepEmail,
        employeeEmail: data.formData?.employeeEmail,
      });
      setContractData(data);

      // Create signatories from formData (source of truth for signatory contact info)
      if (data.document?.parties && data.formData) {
        const sigs: SignatoryInfo[] = [
          {
            name: data.formData.companyRepName || data.document.parties.employer.legalName,
            email: data.formData.companyRepEmail || '',
            title: data.formData.companyRepTitle || '',
            phone: data.formData.companyRepPhone || '',
            role: 'Company Representative',
            order: 1,
          },
          {
            name: data.document.parties.employee.legalName,
            email: data.formData.employeeEmail || '',
            phone: data.formData.employeePhone || '',
            role: 'Employee',
            order: 2,
          },
        ];
        console.log('👥 Created signatories:', sigs);
        setSignatories(sigs);
        
        // Generate smart field placements immediately
        generateSmartFieldPlacements(sigs);
      }

      console.log('📄 Loading PDF from sessionStorage');
      loadPdfFromBase64(storedPdfBase64);
    } catch (err) {
      console.error('Error loading contract data:', err);
      setError('Invalid contract data. Please start the signature process again.');
      setIsLoadingPdf(false);
    }
  }, []);

  const loadPdfFromBase64 = (base64: string) => {
    setIsLoadingPdf(true);
    setError(null);

    try {
      // Convert base64 to blob
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      console.log('✅ PDF loaded from base64 data');
    } catch (err) {
      console.error('Error loading PDF from base64:', err);
      setError('Failed to load document preview. Please try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const generateSmartFieldPlacements = (sigs: SignatoryInfo[]) => {
    if (!contractData) return;

    // First, try to load metadata from sessionStorage
    const metadataJson = sessionStorage.getItem('signature-field-metadata');
    
    if (metadataJson) {
      try {
        const metadata = JSON.parse(metadataJson);
        console.log('📍 Using PDF-embedded signature field metadata:', metadata);
        
        // Convert metadata to our field format
        const fields = metadata.map((field: any, index: number) => ({
          id: field.id,
          type: field.type,
          signatoryIndex: field.party === 'employer' ? 0 : 1,
          pageNumber: field.pageNumber,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          label: field.label,
        }));
        
        setInitialFields(fields);
        return;
      } catch (error) {
        console.warn('Failed to parse signature field metadata, using fallback:', error);
      }
    }

    // Fallback: Use hardcoded coordinates if metadata not available
    console.log('⚠️  No metadata found, using fallback coordinates');
    
    const fields: SignatureField[] = [];
    const lastPage = 1; // Will be updated when PDF loads
    
    // Fallback coordinates (original hardcoded values)
    const employerX = 165;
    const employerSigY = 230;
    const employerNameY = 258;
    const employerTitleY = 286;
    const employerDateY = 314;
    
    // EMPLOYER fields
    fields.push({
      id: 'employer-signature',
      type: 'signature',
      signatoryIndex: 0,
      pageNumber: lastPage,
      x: employerX,
      y: employerSigY,
      width: 200,
      height: 35,
      label: `${sigs[0].name} - Signature`,
    });
    
    fields.push({
      id: 'employer-name',
      type: 'text',
      signatoryIndex: 0,
      pageNumber: lastPage,
      x: employerX,
      y: employerNameY,
      width: 200,
      height: 28,
      label: `${sigs[0].name}`,
    });
    
    fields.push({
      id: 'employer-title',
      type: 'text',
      signatoryIndex: 0,
      pageNumber: lastPage,
      x: employerX,
      y: employerTitleY,
      width: 200,
      height: 28,
      label: `${sigs[0].title || 'Title'}`,
    });
    
    fields.push({
      id: 'employer-date',
      type: 'date',
      signatoryIndex: 0,
      pageNumber: lastPage,
      x: employerX,
      y: employerDateY,
      width: 140,
      height: 28,
      label: 'Date',
    });
    
    // EMPLOYEE fields
    const employeeX = 165;
    const employeeSigY = 431;
    const employeeDateY = 459;
    
    fields.push({
      id: 'employee-signature',
      type: 'signature',
      signatoryIndex: 1,
      pageNumber: lastPage,
      x: employeeX,
      y: employeeSigY,
      width: 200,
      height: 35,
      label: `${sigs[1].name} - Signature`,
    });
    
    fields.push({
      id: 'employee-date',
      type: 'date',
      signatoryIndex: 1,
      pageNumber: lastPage,
      x: employeeX,
      y: employeeDateY,
      width: 140,
      height: 28,
      label: 'Date',
    });
    
    console.log('📍 Smart fields placed (fallback mode):', fields);
    setInitialFields(fields);
  };

  const handleConfirm = async (fields: SignatureField[]) => {
    if (!contractData || !signatories.length) return;

    setIsSending(true);

    try {
      // Prepare signatories from formData (source of truth for signatory contact info)
      const signatoryList: SignatoryInfo[] = [
        {
          name: contractData.formData.companyRepName || contractData.document.parties.employer.legalName,
          email: contractData.formData.companyRepEmail || '',
          title: contractData.formData.companyRepTitle || '',
          phone: contractData.formData.companyRepPhone || '',
          role: 'Company Representative',
          order: 0,
        },
        {
          name: contractData.document.parties.employee.legalName,
          email: contractData.formData.employeeEmail || '',
          phone: contractData.formData.employeePhone || '',
          role: 'Employee',
          order: 1,
        },
      ];

      // Step 1: Prepare contract (upload + create draft)
      const prepareResponse = await fetch('/api/signature/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: contractData.document,
          formData: contractData.formData,
          signatories: signatoryList,
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || 'Failed to prepare contract');
      }

      const preparedData = await prepareResponse.json();

      // Step 2: Rollout contract with signature fields
      const rolloutResponse = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: preparedData.documentId,
          fileId: preparedData.fileId,
          signatories: signatoryList,
          signatureFields: fields,
        }),
      });

      if (!rolloutResponse.ok) {
        const errorData = await rolloutResponse.json();
        throw new Error(errorData.error || 'Failed to send invitations');
      }

      // Clean up blob URL and sessionStorage
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      sessionStorage.removeItem('signature-editor-pdf');
      sessionStorage.removeItem('signature-editor-data');
      sessionStorage.removeItem('signature-fields');

      // Show success and redirect
      showSuccessModal(preparedData);
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invitations. Please try again.');
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    // Clean up blob URL and sessionStorage
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    sessionStorage.removeItem('signature-editor-pdf');
    sessionStorage.removeItem('signature-editor-data');
    router.push('/templates/employment-agreement/generate/review');
  };

  const showSuccessModal = (data: { documentId: string; trackingId: string; fileId: string }) => {
    // Create a beautiful modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-10 max-w-md mx-4 shadow-2xl border-2 border-[hsl(var(--border))] animate-slide-up">
        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="font-heading text-2xl font-bold text-[hsl(var(--fg))] mb-3">Invitations Sent!</h3>
          <p class="font-body text-[hsl(var(--brand-muted))] text-base leading-relaxed mb-6">
            Signature invitations have been sent to all parties via SELISE Signature.
          </p>
          <div class="bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] rounded-xl p-4 mb-6 text-left">
            <p class="font-body text-sm font-semibold text-[hsl(var(--brand-primary))] mb-2">Tracking ID:</p>
            <code class="font-body text-xs text-[hsl(var(--fg))] break-all">${data.trackingId}</code>
          </div>
          <button onclick="window.location.href='/templates/employment-agreement';"
            class="w-full py-4 bg-[hsl(var(--brand-primary))] text-white rounded-xl font-bold text-base shadow-md hover:shadow-xl hover:bg-[hsl(222,89%,45%)] transition-all">
            Done
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Clear saved data
    localStorage.removeItem('employment-agreement-conversation');
    try {
      const { clearEmploymentAgreementReview } = require('../../reviewStorage');
      clearEmploymentAgreementReview();
    } catch (e) {
      // Ignore if module not found
      console.log('Note: reviewStorage module not found, skipping clear');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))] p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-red-900 mb-3">Error Loading Editor</h2>
          <p className="font-body text-red-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/templates/employment-agreement/generate/review')}
            className="font-body text-sm text-red-600 hover:text-red-800 font-semibold underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingPdf || !pdfUrl || !contractData || signatories.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--bg))]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[hsl(var(--brand-border))] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[hsl(var(--selise-blue))] animate-pulse" />
          </div>
        </div>
        <h2 className="font-heading text-2xl font-bold text-[hsl(var(--fg))] mb-2">
          Loading Document Editor
        </h2>
        <p className="font-body text-[hsl(var(--brand-muted))] text-center max-w-md">
          Preparing your document for signature field placement...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen">
        <PDFSignatureEditor
          pdfUrl={pdfUrl}
          signatories={signatories}
          initialFields={initialFields}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>

      {/* Loading overlay when sending */}
      {isSending && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-[hsl(var(--brand-border))] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[hsl(var(--selise-blue))] animate-pulse" />
            </div>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[hsl(var(--fg))] mb-2">
            Sending Contract
          </h2>
          <p className="font-body text-[hsl(var(--brand-muted))] text-center max-w-md mb-4">
            Uploading document and sending signature invitations...
          </p>
          <div className="space-y-2 bg-white rounded-xl p-6 border-2 border-[hsl(var(--border))]">
            {[
              'Uploading PDF to secure storage',
              'Creating signature workflow',
              'Positioning signature fields',
              'Sending invitation emails'
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-[hsl(var(--brand-muted))] text-sm font-medium"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
                }}
              >
                <div className="w-2 h-2 bg-[hsl(var(--selise-blue))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                <span className="font-body">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default function SignatureEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--selise-blue))]" />
        </div>
      }
    >
      <SignatureEditorContent />
    </Suspense>
  );
}
