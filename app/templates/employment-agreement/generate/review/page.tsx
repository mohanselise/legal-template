'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, Edit, Download, Send, Sparkles, FileText, ZoomIn, ZoomOut, PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import {
  clearEmploymentAgreementReview,
  loadEmploymentAgreementReview,
} from '../reviewStorage';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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
      // Generate PDF with metadata
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

      // Store session data for potential retries
      sessionStorage.setItem(
        'signature-last-payload',
        JSON.stringify({
          document: documentToSend,
          formData,
          signatories: responseData.signatories,
          signatureFields: responseData.signatureFields,
        })
      );

      console.log(
        '✅ PDF generated with signature field metadata:',
        responseData.signatureFields
      );

      console.log('📨 Sending contract via aggregated rollout API…');
      const rolloutResponse = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend,
          formData,
          signatories: responseData.signatories,
          signatureFields: responseData.signatureFields,
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
    setPageNumber(1);
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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Download
              </button>
              <button
                onClick={handleSendToSignature}
                disabled={isPreparingContract}
                className="flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-[hsl(var(--selise-blue))]/25 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                Send for Signature
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating CTA Button - Shows when header is out of view */}
      {showFloatingCTA && !isPreparingContract && (
        <>
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
            <button
              onClick={handleSendToSignature}
              className="flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white px-6 py-3.5 rounded-full font-semibold text-sm shadow-2xl hover:shadow-[hsl(var(--selise-blue))]/40 hover:scale-105 transition-all group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              Send for Signature
            </button>
          </div>
          <div className="fixed bottom-8 right-8 z-[60] animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-white text-gray-700 border-2 border-gray-300 px-5 py-3 rounded-full font-semibold text-sm shadow-xl hover:shadow-2xl hover:scale-105 hover:border-gray-400 transition-all group"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              Download
            </button>
          </div>
        </>
      )}

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
                        className="bg-white shadow-lg mx-auto"
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
          <aside className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Document Details */}
              {formData && (
                <div>
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
