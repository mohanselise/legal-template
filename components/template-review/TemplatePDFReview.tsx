"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  Download,
  Send,
  FileText,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
} from "lucide-react";
import type { LegalDocument } from "@/app/api/templates/employment-agreement/schema";
import { Button } from "@/components/ui/button";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import dynamic from "next/dynamic";
import { SignatureFieldOverlay, type SignatureField } from "@/app/[locale]/templates/employment-agreement/generate/review/_components/SignatureFieldOverlay";
import { SignatureFieldMiniMap } from "@/app/[locale]/templates/employment-agreement/generate/review/_components/SignatureFieldMiniMap";
import { generateSignatureFieldMetadata } from "@/lib/pdf/signature-field-metadata";

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--selise-blue))]" />
      </div>
    ),
  }
);
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

interface TemplatePDFReviewProps {
  document: LegalDocument;
  formData: Record<string, any>;
  templateSlug: string;
  templateTitle: string;
  locale: string;
  onBack?: () => void;
}

// Color palette for signatories
const SIGNATORY_COLORS = ["#0066B2", "#2A4D14", "#791E94", "#D80032"]; // SELISE Blue, Poly Green, Mauveine, Crimson

// Helper to extract signatories from document or form data
function extractSignatories(
  document: LegalDocument,
  formData: Record<string, any>
): Array<{ name: string; email: string; role: string; color: string }> {
  const signatories: Array<{ name: string; email: string; role: string; color: string }> = [];

  // 1. First priority: document.signatories (should be set correctly from form data by generate API)
  if (document.signatories && document.signatories.length > 0) {
    document.signatories.forEach((sig, index) => {
      signatories.push({
        name: sig.name,
        email: sig.email || "",
        role: sig.title || sig.party,
        color: SIGNATORY_COLORS[index % SIGNATORY_COLORS.length],
      });
    });
    return signatories;
  }

  // If document doesn't have signatories, fall back to form data

  // 2. Form builder signatory screen fields (party, name, email, title, phone)
  if (formData.name && formData.email) {
    signatories.push({
      name: formData.name as string,
      email: formData.email as string,
      role: (formData.title as string) || (formData.party as string) || "Signatory",
      color: SIGNATORY_COLORS[0],
    });
    return signatories;
  }

  // 3. Check for numbered signatory pattern (signatory_1_name, signatory_2_name, etc.)
  let signatoryIndex = 1;
  while (formData[`signatory_${signatoryIndex}_name`]) {
    signatories.push({
      name: formData[`signatory_${signatoryIndex}_name`] as string,
      email: (formData[`signatory_${signatoryIndex}_email`] as string) || "",
      role: (formData[`signatory_${signatoryIndex}_title`] as string) || 
            (formData[`signatory_${signatoryIndex}_party`] as string) || "Signatory",
      color: SIGNATORY_COLORS[(signatoryIndex - 1) % SIGNATORY_COLORS.length],
    });
    signatoryIndex++;
  }
  if (signatories.length > 0) {
    return signatories;
  }

  // 4. Legacy hardcoded field names (for backward compatibility)
  // Company/Employer signatory
  if (formData.companyRepName || formData.companyName) {
    signatories.push({
      name: (formData.companyRepName as string) || (formData.companyName as string) || "Company",
      email: (formData.companyRepEmail as string) || (formData.companyEmail as string) || "",
      role: (formData.companyRepTitle as string) || "Authorized Representative",
      color: SIGNATORY_COLORS[0],
    });
  }

  // Employee signatory
  if (formData.employeeName) {
    signatories.push({
      name: formData.employeeName as string,
      email: (formData.employeeEmail as string) || "",
      role: (formData.jobTitle as string) || "Employee",
      color: SIGNATORY_COLORS[1],
    });
  }

  return signatories;
}

export function TemplatePDFReview({
  document,
  formData,
  templateSlug,
  templateTitle,
  locale,
  onBack,
}: TemplatePDFReviewProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPreparingContract, setIsPreparingContract] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Signature field overlay state
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [apiSignatureFields, setApiSignatureFields] = useState<any[] | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState(0);
  const [selectedFieldType, setSelectedFieldType] = useState<"signature" | "date">("signature");

  const signatories = extractSignatories(document, formData);

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Generate PDF preview on mount
  useEffect(() => {
    generatePdfPreview();
  }, []);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePdfPreview = async () => {
    setIsLoadingPdf(true);
    try {
      const response = await fetch("/api/documents/generate-pdf?metadata=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF preview");

      const responseData = await response.json();

      if (responseData.success && responseData.pdfBase64) {
        const binaryString = atob(responseData.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);

        if (responseData.signatureFields && Array.isArray(responseData.signatureFields)) {
          setApiSignatureFields(responseData.signatureFields);
        }
      } else {
        throw new Error("Invalid response format from PDF generation API");
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(numPages);

    // Initialize signature fields
    if (apiSignatureFields && apiSignatureFields.length > 0 && signatureFields.length === 0) {
      const convertedFields = convertMetadataToFields(apiSignatureFields, numPages);
      setSignatureFields(convertedFields);
    } else if (signatureFields.length === 0 && signatories.length > 0) {
      // Generate default signature fields
      const metadataFields = generateSignatureFieldMetadata(
        signatories.map((sig, idx) => ({
          party: idx === 0 ? ("employer" as const) : ("employee" as const),
          name: sig.name,
          email: sig.email,
        })),
        numPages
      );
      const defaultFields = convertMetadataToFields(metadataFields, numPages);
      setSignatureFields(defaultFields);
    }
  };

  const convertMetadataToFields = (
    metadataFields: any[],
    actualPageCount: number
  ): SignatureField[] => {
    return metadataFields.map((field) => {
      const signatoryIndex = field.party === "employer" ? 0 : 1;
      const pageNumber = Math.min(field.pageNumber, actualPageCount);

      return {
        id: field.id,
        type: field.type === "text" ? "signature" : field.type,
        signatoryIndex,
        pageNumber,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        label: field.label,
      };
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("/api/documents/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${templateSlug}_${Date.now()}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  const handleSendToSignature = async () => {
    if (!pdfUrl || !formData || signatureFields.length === 0) {
      alert("Document or signature fields are not ready. Please wait for the preview to load.");
      return;
    }

    setIsPreparingContract(true);

    try {
      // Convert points to pixels for SELISE Signature API
      // PDF uses 72 points per inch, SELISE expects 96 DPI pixels
      const DPI_SCALE = 96 / 72;
      
      const signatureFieldsForAPI = signatureFields.map((field) => {
        const pageNumber = field.pageNumber || 1;

        // Apply DPI scaling to ALL field types (signature AND date)
        const x = field.x * DPI_SCALE;
        const y = field.y * DPI_SCALE;
        const width = field.width * DPI_SCALE;
        const height = field.height * DPI_SCALE;

        return {
          id: field.id,
          type: field.type,
          signatoryIndex: field.signatoryIndex,
          pageNumber,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          label: field.label || `${field.type === "signature" ? "Signature" : "Date"}`,
        };
      });

      // Use document.signatories if available for accurate party info
      const signatoriesForAPI = signatories.map((sig, idx) => {
        // Try to get party from document.signatories first
        const docSignatory = document.signatories?.[idx];
        return {
          party: docSignatory?.party || (idx === 0 ? "employer" : "employee") as "employer" | "employee" | "witness" | "other",
          name: sig.name,
          email: sig.email,
          role: sig.role,
        };
      });

      const pdfBlob = await fetch(pdfUrl).then((res) => res.blob());
      const pdfBuffer = await pdfBlob.arrayBuffer();
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(pdfBuffer);
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      const pdfBase64 = btoa(binary);

      const rolloutResponse = await fetch("/api/signature/rollout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          document,
          formData,
          signatories: signatoriesForAPI,
          signatureFields: signatureFieldsForAPI,
          templateSlug,
          templateTitle,
        }),
      });

      if (!rolloutResponse.ok) {
        const errorBody = await rolloutResponse.json().catch(() => null);
        throw new Error(
          errorBody?.details || errorBody?.error || "Failed to send contract for signature"
        );
      }

      const rolloutResult = await rolloutResponse.json();
      
      // Store result and payload in sessionStorage for success page
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'signature-last-result',
          JSON.stringify(rolloutResult)
        );
        // Also store payload for backward compatibility
        window.sessionStorage.setItem(
          'signature-last-payload',
          JSON.stringify({
            document,
            formData,
            signatories: signatoriesForAPI,
            templateSlug,
            templateTitle,
          })
        );
      }
      
      setIsPreparingContract(false);
      router.push(`/${locale}/templates/${templateSlug}/review/success`);
    } catch (error) {
      console.error("Error preparing for signature:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to prepare and send document. Please try again."
      );
      setIsPreparingContract(false);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 64;
      const pageWidthInPixels = 612;
      setScale(containerWidth / pageWidthInPixels);
    }
  };

  const handleFitPage = () => {
    setScale(1.0);
  };

  const scrollToPage = (page: number) => {
    setPageNumber(page);
    if (typeof window !== "undefined") {
      const pageElement = window.document.querySelector(`[data-page-number="${page}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleSignatureFieldsChange = (fields: SignatureField[]) => {
    setSignatureFields(fields);
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedField) return;
    setSelectedField(null);
  };

  if (isPreparingContract) {
    return (
      <div className="fixed inset-0 bg-[hsl(var(--bg))] z-50 flex flex-col items-center justify-center px-4">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-[hsl(var(--border))] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] flex items-center justify-center shadow-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-[hsl(var(--fg))] mb-3">Preparing Contract</h2>
        <p className="text-lg text-[hsl(var(--globe-grey))]">Setting up your document for signature...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-40 bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
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
                <h1 className="text-lg font-bold text-[hsl(var(--fg))]">{templateTitle}</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* PDF Preview Area */}
        <div className="flex-1 flex flex-col bg-[hsl(var(--muted))]">
          {/* PDF Controls */}
          <div className="bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[hsl(var(--globe-grey))]" />
              <span className="text-sm font-medium text-[hsl(var(--fg))]">Preview</span>
              {numPages && (
                <span className="text-xs text-[hsl(var(--globe-grey))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded font-medium">
                  {numPages} {numPages === 1 ? "page" : "pages"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))]">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-1.5 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-[hsl(var(--fg))] min-w-[3.5rem] text-center px-2">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                  className="p-1.5 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Fit Presets */}
              <div className="flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))]">
                <button
                  onClick={handleFitWidth}
                  className="px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="Fit Width"
                >
                  Fit Width
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="100%"
                >
                  100%
                </button>
              </div>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
                title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
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
                  <p className="text-[hsl(var(--fg))] text-sm font-medium">Loading Preview...</p>
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
                      <p className="text-red-600 font-semibold">Failed to load PDF</p>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {numPages &&
                      Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                        <div
                          key={page}
                          data-page-number={page}
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
                              <div
                                className="flex items-center justify-center bg-[hsl(var(--bg))]"
                                style={{ width: 612 * scale, height: 792 * scale }}
                              >
                                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--globe-grey))]" />
                              </div>
                            }
                          />
                          {pdfUrl && signatureFields.length > 0 && (
                            <SignatureFieldOverlay
                              fields={signatureFields}
                              signatories={signatories}
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

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="fixed lg:relative right-0 top-0 w-full sm:w-80 border-l border-[hsl(var(--border))] bg-[hsl(var(--bg))] flex flex-col h-screen z-50 lg:z-auto lg:sticky shadow-2xl lg:shadow-none">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mobile header */}
              <div className="flex items-center justify-between lg:hidden pb-4 border-b border-[hsl(var(--border))]">
                <h2 className="font-semibold text-lg text-[hsl(var(--fg))]">Document Details</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                >
                  <PanelRightClose className="w-5 h-5" />
                </button>
              </div>

              {/* Signature Field Controls */}
              {signatureFields.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[hsl(var(--fg))] text-sm mb-3">Signature Fields</h3>
                  <div className="text-xs text-[hsl(var(--globe-grey))] mb-4">
                    <strong className="text-[hsl(var(--fg))] font-semibold">{signatureFields.length}</strong>{" "}
                    field{signatureFields.length !== 1 ? "s" : ""} placed
                  </div>
                </div>
              )}

              {/* Document Overview Mini-Map */}
              {numPages && numPages > 0 && signatureFields.length > 0 && (
                <div className="border-t border-[hsl(var(--border))] pt-6">
                  <SignatureFieldMiniMap
                    numPages={numPages}
                    signatureFields={signatureFields}
                    signatories={signatories}
                    currentPage={pageNumber}
                    onPageClick={scrollToPage}
                  />
                </div>
              )}

              {/* Document Details */}
              <div className="border-t border-[hsl(var(--border))] pt-6">
                <h3 className="font-semibold text-[hsl(var(--fg))] text-sm mb-3">Document Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="pb-3 border-b border-[hsl(var(--border))]">
                    <dt className="text-[hsl(var(--globe-grey))] text-xs mb-1">Title</dt>
                    <dd className="font-medium text-[hsl(var(--fg))] text-sm">
                      {document.metadata.title}
                    </dd>
                  </div>
                  <div className="pb-3 border-b border-[hsl(var(--border))]">
                    <dt className="text-[hsl(var(--globe-grey))] text-xs mb-1">Effective Date</dt>
                    <dd className="font-medium text-[hsl(var(--fg))] text-sm">
                      {new Date(document.metadata.effectiveDate).toLocaleDateString()}
                    </dd>
                  </div>
                  {document.metadata.jurisdiction && (
                    <div className="pb-3 border-b border-[hsl(var(--border))]">
                      <dt className="text-[hsl(var(--globe-grey))] text-xs mb-1">Jurisdiction</dt>
                      <dd className="font-medium text-[hsl(var(--fg))] text-sm">
                        {document.metadata.jurisdiction}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Signatories */}
              {signatories.length > 0 && (
                <div className="border-t border-[hsl(var(--border))] pt-6">
                  <h3 className="font-semibold text-[hsl(var(--fg))] text-sm mb-3">Signatories</h3>
                  <div className="space-y-3">
                    {signatories.map((sig, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                      >
                        <p className="font-medium text-[hsl(var(--fg))]">{sig.name}</p>
                        {sig.role && (
                          <p className="text-xs text-[hsl(var(--globe-grey))]">{sig.role}</p>
                        )}
                        {sig.email && (
                          <p className="text-xs text-[hsl(var(--globe-grey))]">{sig.email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-[hsl(var(--border))] pt-6 space-y-3">
                <Button
                  onClick={handleDownloadPdf}
                  className="w-full bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                {signatureFields.length > 0 && (
                  <Button
                    onClick={handleSendToSignature}
                    variant="outline"
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </Button>
                )}
              </div>

              {/* Legal Disclaimer */}
              <div className="border-t border-[hsl(var(--border))] pt-6">
                <LegalDisclaimer />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

