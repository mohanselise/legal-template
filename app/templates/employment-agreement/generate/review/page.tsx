'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, Edit, Download, Send, Sparkles, FileText, ZoomIn, ZoomOut, PanelRightClose, PanelRightOpen, Signature, Calendar, User, Briefcase, Trash2 } from 'lucide-react';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import {
  clearEmploymentAgreementReview,
  loadEmploymentAgreementReview,
} from '../reviewStorage';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SignatureFieldOverlay, type SignatureField } from './_components/SignatureFieldOverlay';
import { SIGNATURE_LAYOUT, SIGNATURE_FIELD_DEFAULTS } from '@/lib/pdf/signature-field-metadata';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center py-20"><div className="text-[hsl(var(--brand-muted))]">Loading PDF viewer...</div></div>
  }
);
const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

type FormDataState = Record<string, unknown> | null;

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataState>(null);
  const [generatedDocument, setGeneratedDocument] = useState<EmploymentAgreement | null>(null);
  const [editedDocument, setEditedDocument] = useState<EmploymentAgreement | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingContract, setIsPreparingContract] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Signature field overlay state
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState(0);
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'date'>('signature');

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Track header visibility for floating CTA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCTA(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const sessionPayload = loadEmploymentAgreementReview();
    const hasSessionDocument = Boolean(sessionPayload?.document);

    if (hasSessionDocument) {
      setGeneratedDocument(sessionPayload!.document);
      setEditedDocument(sessionPayload!.document);
      setFormData(sessionPayload!.formData);
      setIsGenerating(false);
      setError(null);
      // Generate PDF from the loaded document
      generatePdfPreview(sessionPayload!.document, sessionPayload!.formData);
      
      // Try to load saved signature fields
      const docId = sessionPayload!.document.metadata?.generatedAt || Date.now().toString();
      const storageKey = `employment-agreement-signature-fields-${docId}`;
      const savedFields = sessionStorage.getItem(storageKey);
      if (savedFields) {
        try {
          const parsed = JSON.parse(savedFields) as SignatureField[];
          setSignatureFields(parsed);
        } catch (e) {
          console.error('Failed to parse saved signature fields:', e);
        }
      }
    }

    const docParam = searchParams.get('document');
    const dataParam = searchParams.get('data');

        if (!hasSessionDocument && docParam) {
      try {
        const parsedDocument: EmploymentAgreement = JSON.parse(docParam);
        setGeneratedDocument(parsedDocument);
        setEditedDocument(parsedDocument);
        setIsGenerating(false);
        setError(null);
        console.log('✅ Document parsed successfully:', parsedDocument);
        
        // Parse formData if available and generate PDF
        let parsedFormData = null;
        if (dataParam) {
          let dataContent = dataParam;
          try {
            dataContent = decodeURIComponent(dataParam);
          } catch (err) {
            dataContent = dataParam;
          }
          try {
            parsedFormData = JSON.parse(dataContent) as Record<string, unknown>;
            setFormData(parsedFormData);
          } catch {
            console.error('Failed to parse form data');
          }
        }
        
        generatePdfPreview(parsedDocument, parsedFormData);
        
        // Try to load saved signature fields
        const docId = parsedDocument.metadata?.generatedAt || Date.now().toString();
        const storageKey = `employment-agreement-signature-fields-${docId}`;
        const savedFields = sessionStorage.getItem(storageKey);
        if (savedFields) {
          try {
            const parsed = JSON.parse(savedFields) as SignatureField[];
            setSignatureFields(parsed);
          } catch (e) {
            console.error('Failed to parse saved signature fields:', e);
          }
        }
      } catch (err) {
        console.error('❌ Failed to parse document JSON:', err);
        setError('Failed to load document. Please try generating again.');
        setIsGenerating(false);
      }
    } else if (!hasSessionDocument && !docParam) {
      setIsGenerating(false);
      setError('We could not load your generated document. Please try generating again.');
    }

    if ((!sessionPayload || !sessionPayload.formData) && dataParam) {
      let dataContent = dataParam;
      try {
        dataContent = decodeURIComponent(dataParam);
      } catch (err) {
        dataContent = dataParam;
      }

      try {
        const parsed = JSON.parse(dataContent) as Record<string, unknown>;
        setFormData(parsed);
      } catch {
        console.error('Failed to parse form data');
      }
    }
  }, [searchParams]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePdfPreview = async (
    document: EmploymentAgreement,
    formDataValue: FormDataState
  ) => {
    setIsLoadingPdf(true);
    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          formData: formDataValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF preview');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      setError('Failed to generate PDF preview. Please try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleSendToSignature = async () => {
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend) return;

    setIsPreparingContract(true);

    try {
      // Generate PDF with metadata to get signatories
      const pdfResponse = await fetch('/api/documents/generate-pdf?metadata=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend,
          formData,
        }),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }

      const responseData = await pdfResponse.json();
      
      if (!responseData.success) {
        throw new Error('PDF generation failed');
      }

      // Convert overlay fields to signature field metadata format
      // The overlay fields are already in PDF points, so we can use them directly
      const signatureFieldsForAPI = signatureFields.map((field) => ({
        id: field.id,
        type: field.type,
        signatoryIndex: field.signatoryIndex,
        pageNumber: field.pageNumber - 1, // Convert to 0-indexed for API
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        label: field.label,
      }));

      // Store session data for potential retries
      sessionStorage.setItem(
        'signature-last-payload',
        JSON.stringify({
          document: documentToSend,
          formData,
          signatories: responseData.signatories,
          signatureFields: signatureFieldsForAPI,
        })
      );

      console.log(
        '✅ Using overlay signature fields:',
        signatureFieldsForAPI
      );

      console.log('📨 Sending contract via aggregated rollout API…');
      const rolloutResponse = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend,
          formData,
          signatories: responseData.signatories,
          signatureFields: signatureFieldsForAPI,
        }),
      });

      if (!rolloutResponse.ok) {
        const errorBody = await rolloutResponse.json().catch(() => null);
        throw new Error(
          errorBody?.details ||
            errorBody?.error ||
            'Failed to send contract for signature'
        );
      }

      const rolloutResult = await rolloutResponse.json();
      console.log('✅ Contract sent successfully:', rolloutResult);

      sessionStorage.setItem(
        'signature-last-result',
        JSON.stringify(rolloutResult)
      );
      setIsPreparingContract(false);
      router.push('/templates/employment-agreement/generate/review/success');
    } catch (error) {
      console.error('Error preparing for signature:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to prepare and send document. Please try again.'
      );
      setIsPreparingContract(false);
    }
  };

  const handleDownloadPdf = async () => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToDownload = editedDocument || generatedDocument;
    if (!documentToDownload) return;

    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToDownload, // Send the edited or original document
          formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const employeeName = documentToDownload.parties.employee.legalName.replace(/\s+/g, '_');
      a.download = `Employment_Agreement_${employeeName}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Navigate to last page where signature fields are typically placed
    setPageNumber(numPages);
  };

  // Initialize signature fields when PDF and document are ready
  useEffect(() => {
    if (numPages && numPages > 0 && generatedDocument && formData) {
      if (signatureFields.length === 0) {
        console.log('Initializing signature fields for', numPages, 'pages');
        initializeSignatureFields(numPages);
      } else {
        // Update page numbers if they don't match (e.g., if PDF page count changed)
        const lastPage = numPages;
        const needsUpdate = signatureFields.some(f => f.pageNumber !== lastPage);
        if (needsUpdate) {
          console.log('Updating signature field page numbers to', lastPage);
          const updatedFields = signatureFields.map(f => ({
            ...f,
            pageNumber: lastPage
          }));
          setSignatureFields(updatedFields);
          if (generatedDocument) {
            const docId = generatedDocument.metadata?.generatedAt || Date.now().toString();
            saveSignatureFields(updatedFields, docId);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, generatedDocument, formData]);

  // Initialize default signature fields
  const initializeSignatureFields = (totalPages: number) => {
    if (!generatedDocument || !formData) return;

    const docId = generatedDocument.metadata?.generatedAt || Date.now().toString();
    const storageKey = `employment-agreement-signature-fields-${docId}`;
    
    // Try to load saved fields
    const savedFields = sessionStorage.getItem(storageKey);
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields) as SignatureField[];
        setSignatureFields(parsed);
        return;
      } catch (e) {
        console.error('Failed to parse saved signature fields:', e);
      }
    }

    // Create default fields
    const lastPage = totalPages;
    const employerName = generatedDocument.parties?.employer?.legalName || (formData.companyName as string) || 'Company';
    const employeeName = generatedDocument.parties?.employee?.legalName || (formData.employeeName as string) || 'Employee';
    
    const defaultFields: SignatureField[] = [
      // Employer signature
      {
        id: 'employer-signature',
        type: 'signature',
        signatoryIndex: 0,
        pageNumber: lastPage,
        x: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.x,
        y: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.y,
        width: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.width,
        height: SIGNATURE_LAYOUT.EMPLOYER.SIGNATURE.height,
        label: `${employerName} - Signature`,
      },
      // Employer date
      {
        id: 'employer-date',
        type: 'date',
        signatoryIndex: 0,
        pageNumber: lastPage,
        x: SIGNATURE_LAYOUT.EMPLOYER.DATE.x,
        y: SIGNATURE_LAYOUT.EMPLOYER.DATE.y,
        width: SIGNATURE_LAYOUT.EMPLOYER.DATE.width,
        height: SIGNATURE_LAYOUT.EMPLOYER.DATE.height,
        label: 'Date',
      },
      // Employee signature
      {
        id: 'employee-signature',
        type: 'signature',
        signatoryIndex: 1,
        pageNumber: lastPage,
        x: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.x,
        y: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.y,
        width: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.width,
        height: SIGNATURE_LAYOUT.EMPLOYEE.SIGNATURE.height,
        label: `${employeeName} - Signature`,
      },
      // Employee date
      {
        id: 'employee-date',
        type: 'date',
        signatoryIndex: 1,
        pageNumber: lastPage,
        x: SIGNATURE_LAYOUT.EMPLOYEE.DATE.x,
        y: SIGNATURE_LAYOUT.EMPLOYEE.DATE.y,
        width: SIGNATURE_LAYOUT.EMPLOYEE.DATE.width,
        height: SIGNATURE_LAYOUT.EMPLOYEE.DATE.height,
        label: 'Date',
      },
    ];

    console.log('Setting signature fields:', defaultFields);
    setSignatureFields(defaultFields);
    saveSignatureFields(defaultFields, docId);
  };

  // Save signature fields to sessionStorage
  const saveSignatureFields = (fields: SignatureField[], docId: string) => {
    const storageKey = `employment-agreement-signature-fields-${docId}`;
    sessionStorage.setItem(storageKey, JSON.stringify(fields));
  };

  // Handle signature fields change
  const handleSignatureFieldsChange = (fields: SignatureField[]) => {
    setSignatureFields(fields);
    if (generatedDocument) {
      const docId = generatedDocument.metadata?.generatedAt || Date.now().toString();
      saveSignatureFields(fields, docId);
    }
  };

  // Handle page click - just deselect field if clicking on empty space
  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking on the page itself (not on a field)
    if (!selectedField) return;
    setSelectedField(null);
  };

  // Get signatories from document
  const getSignatories = () => {
    if (!generatedDocument || !formData) return [];

    const employerName = generatedDocument.parties?.employer?.legalName || (formData.companyName as string) || 'Company';
    const employeeName = generatedDocument.parties?.employee?.legalName || (formData.employeeName as string) || 'Employee';

    return [
      {
        name: (formData.companyRepName as string) || employerName,
        email: (formData.companyRepEmail as string) || generatedDocument.parties?.employer?.email || '',
        role: (formData.companyRepTitle as string) || 'Authorized Representative',
        color: '#0066B2', // SELISE Blue
      },
      {
        name: employeeName,
        email: (formData.employeeEmail as string) || generatedDocument.parties?.employee?.email || '',
        role: (formData.jobTitle as string) || 'Employee',
        color: '#2A4D14', // Poly Green
      },
    ];
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 64; // Account for padding
      const pageWidthInPixels = 612; // US Letter width in points (8.5" × 72)
      setScale(containerWidth / pageWidthInPixels);
    }
  };

  const handleFitPage = () => {
    setScale(1.0);
  };

  // Show full-screen loading overlay during contract preparation
  if (isPreparingContract) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Send className="w-8 h-8 text-[hsl(var(--selise-blue))]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Preparing Your Contract
        </h2>
        <p className="text-gray-600 text-center max-w-md mb-6">
          Setting up your document for signature...
        </p>
        <div className="space-y-2 bg-gray-50 rounded-xl p-6 border border-gray-200">
          {[
            'Generating PDF document',
            'Configuring signature fields',
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 text-gray-600 text-sm font-medium"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
              }}
            >
              <div className="w-2 h-2 bg-[hsl(var(--selise-blue))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <style jsx>{`
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
        `}</style>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 px-6 max-w-md">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[hsl(var(--selise-blue))] animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Creating Your Agreement
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our AI is generating a professional employment agreement tailored to your specifications.
            </p>
          </div>

          {/* Loading steps */}
          <div className="space-y-2 bg-white rounded-xl p-5 border border-gray-200">
            {[
              'Analyzing requirements',
              'Drafting provisions',
              'Building structure'
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-gray-600 text-sm font-medium"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
                }}
              >
                <div className="w-2 h-2 bg-[hsl(var(--selise-blue))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  Employment Agreement
                </h1>
              </div>
            </div>
            
            {/* Header info only - buttons moved to sidebar */}
          </div>
        </div>
      </header>


      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* PDF Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* PDF Controls */}
          <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Preview</span>
              {numPages && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                  {numPages} {numPages === 1 ? 'page' : 'pages'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white divide-x divide-gray-300">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 min-w-[3.5rem] text-center px-2">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                  className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Fit Presets */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white divide-x divide-gray-300">
                <button
                  onClick={handleFitWidth}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Fit Width"
                >
                  Fit Width
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  title="100%"
                >
                  100%
                </button>
              </div>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div ref={containerRef} className="flex-1 overflow-auto p-6">
            {isLoadingPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--selise-blue))] mx-auto mb-3" />
                  <p className="text-gray-600 text-sm font-medium">Loading preview...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="max-w-4xl mx-auto">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--selise-blue))]" />
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center py-20">
                      <p className="text-red-600 font-semibold">Failed to load PDF. Please try again.</p>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                      <div
                        key={page}
                        ref={page === pageNumber ? pageRef : null}
                        className="bg-white shadow-lg mx-auto relative"
                        style={{
                          width: 612 * scale,
                          minHeight: 792 * scale,
                        }}
                      >
                        <Page
                          pageNumber={page}
                          scale={scale}
                          width={612}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          loading={
                            <div className="flex items-center justify-center bg-white" style={{ width: 612 * scale, height: 792 * scale }}>
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          }
                        />
                        {pdfUrl && signatureFields.length > 0 && (
                          <SignatureFieldOverlay
                            fields={signatureFields}
                            signatories={getSignatories()}
                            currentPage={page}
                            scale={scale}
                            pageRef={page === pageNumber ? pageRef : null}
                            onFieldsChange={handleSignatureFieldsChange}
                            selectedField={selectedField}
                            onSelectField={setSelectedField}
                            selectedSignatoryIndex={selectedSignatoryIndex}
                            selectedFieldType={selectedFieldType}
                            onPageClick={handlePageClick}
                          />
                        )}
                        {pdfUrl && signatureFields.length === 0 && page === (numPages || 1) && (
                          <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs">
                            No signature fields initialized. Fields: {signatureFields.length}, Pages: {numPages}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Document>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 font-medium">No PDF available</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-screen sticky top-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Signature Field Controls */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3">
                  Signature Fields
                </h3>
                
                {/* Instructions */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                  <p className="text-[10px] text-blue-900 leading-relaxed">
                    Fields are automatically placed. <strong>Drag fields to reposition</strong>, resize by dragging the corner.
                  </p>
                </div>

                {/* Field Count */}
                <div className="text-xs text-gray-600 mb-4">
                  <strong className="text-gray-900">{signatureFields.length}</strong> field{signatureFields.length !== 1 ? 's' : ''} placed
                </div>
              </div>

              {/* Document Details */}
              {formData && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">
                    Document Details
                  </h3>
                  <dl className="space-y-3 text-sm">
                    {Object.entries(formData as Record<string, unknown>)
                      .slice(0, 6)
                      .map(([key, value]) => (
                      <div key={key} className="pb-3 border-b border-gray-100 last:border-0">
                        <dt className="text-gray-500 capitalize text-xs mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-medium text-gray-900 text-sm break-words">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => router.push('/templates/employment-agreement/generate')}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[hsl(var(--selise-blue))] hover:text-[hsl(206,100%,30%)] font-medium text-sm py-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </button>
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="border-t border-gray-200 pt-6">
                <LegalDisclaimer variant="compact" />
              </div>
            </div>
            
            {/* Fixed Action Buttons at Bottom */}
            <div className="border-t border-gray-200 p-6 space-y-3 bg-white">
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Download PDF
              </button>
              <button
                onClick={handleSendToSignature}
                disabled={isPreparingContract}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-[hsl(var(--selise-blue))]/25 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                Send for Signature
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function ReviewPageV2() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--brand-primary))]" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
