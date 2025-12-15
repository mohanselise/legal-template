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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { SignatureFieldOverlay, type SignatureField } from "@/app/[locale]/templates/employment-agreement/generate/review/_components/SignatureFieldOverlay";
import { SignatureFieldMiniMap } from "@/app/[locale]/templates/employment-agreement/generate/review/_components/SignatureFieldMiniMap";
import { generateSignatureFieldMetadata } from "@/lib/pdf/signature-field-metadata";
import { ensureAdditionalSignatoryArray } from "@/lib/templates/signatory-fields";
import type { SignatoryEntry } from "@/lib/templates/signatory-config";
import { InlineTextEditor } from "./InlineTextEditor";
import { findBlockByText, updateBlockText, type TextBlockMapping } from "@/lib/pdf/text-block-mapper";
import { Edit2 } from "lucide-react";

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

// Color palette for signatories (aligned with brand tokens)
const SIGNATORY_COLORS = [
  "hsl(var(--selise-blue))",
  "hsl(var(--poly-green))",
  "hsl(var(--mauveine))",
  "hsl(var(--destructive))",
];

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

  const addSignatory = ({
    name,
    email,
    role,
  }: {
    name: string;
    email: string;
    role?: string;
  }) => {
    if (!name || !email) return;
    signatories.push({
      name,
      email,
      role: role || "Signatory",
      color: SIGNATORY_COLORS[signatories.length % SIGNATORY_COLORS.length],
    });
  };

  // 2. NEW Signatory Screen format (formData.signatories array from SignatoryScreenRenderer)
  if (Array.isArray(formData.signatories) && formData.signatories.length > 0) {
    (formData.signatories as SignatoryEntry[]).forEach((entry) => {
      addSignatory({
        name: entry.name,
        email: entry.email,
        role: entry.title || entry.partyType,
      });
    });
    return signatories;
  }

  // 3. Form builder signatory screen fields (party, name, email, title, phone)
  if (formData.name && formData.email) {
    addSignatory({
      name: formData.name as string,
      email: formData.email as string,
      role: (formData.title as string) || (formData.party as string),
    });
  }

  const additionalEntries = ensureAdditionalSignatoryArray(formData.additionalSignatories);
  additionalEntries.forEach((entry) => {
    addSignatory({
      name: entry.name,
      email: entry.email,
      role: entry.title || entry.party,
    });
  });

  if (signatories.length > 0) {
    return signatories;
  }

  // 3. Check for numbered signatory pattern (signatory_1_name, signatory_2_name, etc.)
  let signatoryIndex = 1;
  while (formData[`signatory_${signatoryIndex}_name`]) {
    addSignatory({
      name: formData[`signatory_${signatoryIndex}_name`] as string,
      email: (formData[`signatory_${signatoryIndex}_email`] as string) || "",
      role:
        (formData[`signatory_${signatoryIndex}_title`] as string) ||
        (formData[`signatory_${signatoryIndex}_party`] as string),
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

// Helper function to check if effectiveDate is a valid date
function isValidEffectiveDate(effectiveDate: string | undefined): boolean {
  if (!effectiveDate) return false;
  
  // Check if it's a text value like "Upon Signature"
  const textValues = ['upon signature', 'upon signing', 'upon execution', 'date of signature', 'date of signing'];
  if (textValues.includes(effectiveDate.toLowerCase().trim())) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(effectiveDate);
  return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
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
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Signature field overlay state
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [apiSignatureFields, setApiSignatureFields] = useState<any[] | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState(0);
  const [selectedFieldType, setSelectedFieldType] = useState<"signature" | "date">("signature");

  // Text editing state
  const [editableDocument, setEditableDocument] = useState<LegalDocument>(document);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TextBlockMapping | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const signatories = extractSignatories(editableDocument, formData);

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Add CSS for text layer hover effect
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
      return;
    }
    
    try {
      const style = document.createElement('style');
      style.textContent = `
        .react-pdf__Page__textContent span {
          cursor: pointer !important;
          transition: background-color 0.2s ease;
        }
        .react-pdf__Page__textContent span:hover {
          background-color: hsl(var(--selise-blue) / 0.1) !important;
          border-radius: 2px;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (typeof document !== 'undefined' && document.head && document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    } catch (error) {
      console.warn('Failed to add text layer hover styles:', error);
    }
  }, []);

  // Update editable document when prop changes
  useEffect(() => {
    setEditableDocument(document);
    setHasUnsavedChanges(false);
  }, [document]);

  // Generate PDF preview on mount
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      generatePdfPreview();
    }
  }, []);

  // Regenerate PDF when document is edited (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current && hasUnsavedChanges) {
      generatePdfPreview(editableDocument);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableDocument]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Update signature field page numbers when PDF page count is known
  // This ensures fields are always on the last page, even if they were
  // initialized with an estimated page count from the API
  useEffect(() => {
    if (numPages && numPages > 0 && signatureFields.length > 0) {
      const lastPage = numPages;
      const needsUpdate = signatureFields.some(f => f.pageNumber !== lastPage);
      if (needsUpdate) {
        console.log('Updating signature field page numbers to last page:', lastPage);
        const updatedFields = signatureFields.map(f => ({
          ...f,
          pageNumber: lastPage
        }));
        setSignatureFields(updatedFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, apiSignatureFields]);

  const generatePdfPreview = async (documentToUse: LegalDocument = editableDocument) => {
    setIsLoadingPdf(true);
    try {
      // Revoke old URL if it exists
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }

      const response = await fetch("/api/documents/generate-pdf?metadata=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: documentToUse,
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
          party: sig.role || `signatory_${idx}`, // Use role as party type or generate a unique one
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
      // Use signatoryIndex from field if available, otherwise infer from position
      const signatoryIndex = field.signatoryIndex ?? (field.party === "employer" ? 0 : 1);

      // Ensure pageNumber matches actual PDF page count
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
    setShowDownloadPrompt(false);
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
          party: docSignatory?.party || sig.role || `signatory_${idx}`,
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
          numPages, // Send page count for accurate signature field placement
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
    // Don't interfere with signature field selection
    if (selectedField) {
      setSelectedField(null);
      return;
    }

    // Don't handle clicks if already editing
    if (isEditing) return;

    // Check if click is on text layer
    const target = event.target as HTMLElement;
    const textLayer = target.closest('.react-pdf__Page__textContent');
    
    if (!textLayer) return;

    // Get the clicked text - try multiple strategies
    const selection = window.getSelection();
    let clickedText = '';
    
    if (selection && selection.toString().trim()) {
      // User selected text - use selection
      clickedText = selection.toString().trim();
    } else {
      // User clicked on a text element - try to get surrounding text
      const textElement = target.closest('span');
      if (textElement) {
        // Get text from the span and nearby siblings for better matching
        const parent = textElement.parentElement;
        if (parent) {
          // Try to get a larger context (current span + siblings)
          const siblings = Array.from(parent.children);
          const currentIndex = siblings.indexOf(textElement);
          const contextStart = Math.max(0, currentIndex - 1);
          const contextEnd = Math.min(siblings.length, currentIndex + 2);
          const contextSpans = siblings.slice(contextStart, contextEnd);
          clickedText = contextSpans
            .map(span => span.textContent?.trim() || '')
            .join(' ')
            .trim();
        }
        
        // Fallback to just the clicked element's text
        if (!clickedText) {
          clickedText = textElement.textContent?.trim() || '';
        }
      }
    }

    // Need at least 3 characters to match
    if (!clickedText || clickedText.length < 3) return;

    // Find the matching block (prioritizes paragraphs and leaf nodes)
    const blockMapping = findBlockByText(clickedText, editableDocument);
    
    if (!blockMapping) {
      console.log('Could not find matching block for text:', clickedText.substring(0, 50));
      return;
    }

    // Log what we found for debugging
    console.log('Found block to edit:', {
      type: blockMapping.type,
      isLeaf: blockMapping.isLeaf,
      isTitle: blockMapping.isTitle,
      textPreview: blockMapping.text.substring(0, 50),
    });

    // Set editing state and open dialog
    setEditingBlock(blockMapping);
    setIsEditing(true);
  };

  const handleSaveEdit = async (newText: string) => {
    if (!editingBlock) return;

    setIsSavingEdit(true);
    try {
      // Update the document - pass isTitle flag for article/section titles
      const updated = updateBlockText(
        editableDocument, 
        editingBlock.blockPath, 
        newText,
        editingBlock.isTitle
      );
      setEditableDocument(updated);
      setHasUnsavedChanges(true);
      
      // Close editor
      setIsEditing(false);
      setEditingBlock(null);
      
      // PDF will regenerate automatically via useEffect
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save edit. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingBlock(null);
  };

  if (isPreparingContract) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))] px-4">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-[hsl(var(--border))] rounded-full" />
          <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] flex items-center justify-center shadow-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[hsl(var(--fg))] mb-2">Preparing Contract</h2>
        <p className="text-base text-[hsl(var(--globe-grey))]">Setting up your document for signature...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))] text-[hsl(var(--fg))]">
      {/* Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/85 backdrop-blur-xl"
      >
        <div className="px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--warning))/0.15] text-[hsl(var(--warning))] text-[11px] font-semibold uppercase tracking-wide">
                      <Edit2 className="w-3 h-3" />
                      Edited
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--success))/0.15] text-[hsl(var(--poly-green))] text-[11px] font-semibold uppercase tracking-wide">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready to review
                    </span>
                  )}
                  {signatories.length > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--globe-grey))] text-[11px] font-semibold">
                      {signatories.length} signator{signatories.length === 1 ? "y" : "ies"}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold leading-tight">{templateTitle}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--globe-grey))]">
                  <div className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{document.metadata.title}</span>
                  </div>
                  {isValidEffectiveDate(document.metadata.effectiveDate) && (
                    <div className="inline-flex items-center gap-1">
                      <span className="font-semibold text-[hsl(var(--fg))]">Effective:</span>
                      <span>{new Date(document.metadata.effectiveDate!).toLocaleDateString()}</span>
                    </div>
                  )}
                  {numPages && (
                    <div className="inline-flex items-center gap-1">
                      <span className="font-semibold text-[hsl(var(--fg))]">Pages:</span>
                      <span>
                        {numPages} {numPages === 1 ? "page" : "pages"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {signatureFields.length > 0 && (
                <Button
                  onClick={handleSendToSignature}
                  className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] shadow-md"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signature
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDownloadPrompt(true)}
                className="border-[hsl(var(--border))] text-[hsl(var(--globe-grey))]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 sm:px-6 pb-10 pt-4">
        {/* PDF Preview Area */}
        <div className="flex-1 flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] shadow-lg">
          {/* PDF Controls */}
          <div className="border-b border-[hsl(var(--border))] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
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
              <div className="flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))] shadow-sm">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-1.5 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[hsl(var(--fg))] min-w-[3.5rem] text-center px-2">
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
              <div className="hidden sm:flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))] shadow-sm">
                <button
                  onClick={handleFitWidth}
                  className="px-3 py-1.5 text-xs font-semibold text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="Fit Width"
                >
                  Fit Width
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-3 py-1.5 text-xs font-semibold text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="100%"
                >
                  100%
                </button>
              </div>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-md hover:bg-[hsl(var(--muted))] transition-colors shadow-sm"
                title={sidebarOpen ? "Hide Details" : "Show Details"}
              >
                {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div ref={containerRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-[hsl(var(--muted))]/40 rounded-b-2xl">
            {isLoadingPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--selise-blue))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--fg))] text-sm font-medium">Loading preview…</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--globe-grey))]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--bg))] border border-[hsl(var(--border))] px-3 py-1 font-semibold">
                    <Edit2 className="w-3 h-3" />
                    Click any text to edit
                  </span>
                  {hasUnsavedChanges && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))/0.15] text-[hsl(var(--warning))] px-3 py-1 font-semibold">
                      Unsaved changes
                    </span>
                  )}
                  {signatureFields.length > 0 && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--muted))]">
                        <span className="h-2 w-2 rounded-full bg-[hsl(var(--selise-blue))]" />
                        Primary signer
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--muted))]">
                        <span className="h-2 w-2 rounded-full bg-[hsl(var(--poly-green))]" />
                        Counterparty
                      </span>
                    </>
                  )}
                </div>

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
                      <p className="text-[hsl(var(--destructive))] font-semibold">Failed to load PDF</p>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {numPages &&
                      Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                        <div
                          key={page}
                          data-page-number={page}
                          ref={(el) => {
                            if (el) {
                              pageRefs.current.set(page, el);
                            } else {
                              pageRefs.current.delete(page);
                            }
                          }}
                          className="bg-white shadow-xl mx-auto relative rounded-lg"
                          style={{
                            width: 612 * scale,
                            height: 792 * scale,
                          }}
                          onClick={handlePageClick}
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
                              pageRef={null}
                              pageElement={pageRefs.current.get(page) || null}
                              onFieldsChange={handleSignatureFieldsChange}
                              selectedField={selectedField}
                              onSelectField={setSelectedField}
                              selectedSignatoryIndex={selectedSignatoryIndex}
                              selectedFieldType={selectedFieldType}
                              onPageClick={handlePageClick}
                            />
                          )}
                          {page !== 1 && (
                            <div className="pointer-events-none absolute top-3 right-3 text-[hsl(var(--globe-grey))] text-xs font-medium tracking-tight text-right">
                              {templateTitle}
                            </div>
                          )}
                          {numPages && (
                            <div className="pointer-events-none absolute bottom-3 right-3 text-[hsl(var(--globe-grey))] text-xs font-semibold tracking-tight">
                              Page {page} of {numPages}
                            </div>
                          )}
                          
                          {/* Text Editor Dialog - rendered once, not per page */}
                          {page === 1 && (
                            <InlineTextEditor
                              initialText={editingBlock?.text || ""}
                              open={isEditing}
                              onSave={handleSaveEdit}
                              onCancel={handleCancelEdit}
                              isSaving={isSavingEdit}
                              blockType={editingBlock?.type}
                              isTitle={editingBlock?.isTitle}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </Document>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--globe-grey))] font-medium">No PDF available</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="relative lg:w-96 w-full lg:max-w-sm border border-[hsl(var(--border))] bg-[hsl(var(--bg))] rounded-2xl shadow-xl lg:shadow-lg lg:sticky lg:top-16 lg:self-start z-50 lg:z-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-6rem)] pb-28 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[hsl(var(--border))] [&::-webkit-scrollbar-track]:bg-transparent">
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
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[hsl(var(--fg))] text-sm">Signature Fields</h3>
                    <span className="text-xs font-semibold text-[hsl(var(--globe-grey))]">
                      {signatureFields.length} placed
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Drag, resize, or tap a field to adjust the signing experience.
                  </p>
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
                  {isValidEffectiveDate(document.metadata.effectiveDate) && (
                    <div className="pb-3 border-b border-[hsl(var(--border))]">
                      <dt className="text-[hsl(var(--globe-grey))] text-xs mb-1">Effective Date</dt>
                      <dd className="font-medium text-[hsl(var(--fg))] text-sm">
                        {new Date(document.metadata.effectiveDate!).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
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
                        className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[hsl(var(--fg))]">{sig.name}</p>
                            {sig.role && (
                              <p className="text-xs text-[hsl(var(--globe-grey))]">{sig.role}</p>
                            )}
                            {sig.email && (
                              <p className="text-xs text-[hsl(var(--globe-grey))]">{sig.email}</p>
                            )}
                          </div>
                          <span
                            className="mt-1 inline-flex h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: sig.color }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="border-t border-[hsl(var(--border))] pt-6">
                <LegalDisclaimer />
              </div>
            </div>

            {/* Sticky actions */}
            <div className="fixed inset-x-0 bottom-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-4 sm:px-6 py-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)] lg:sticky lg:bottom-0 lg:left-auto lg:right-auto lg:px-6 lg:rounded-b-2xl">
              <div className="space-y-3">
                {signatureFields.length > 0 && (
                  <Button
                    onClick={handleSendToSignature}
                    className="w-full bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </Button>
                )}
                <Button
                  onClick={() => setShowDownloadPrompt(true)}
                  variant="outline"
                  className="w-full text-[hsl(var(--globe-grey))]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <Dialog open={showDownloadPrompt} onOpenChange={setShowDownloadPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send with SELISE Signature (recommended)</DialogTitle>
            <DialogDescription>
              Enjoy legally compliant e-signatures with a full audit trail, Swiss-grade privacy, and a
              safe, trackable workflow. Avoid version sprawl and keep signers aligned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-[hsl(var(--fg))]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5" />
              <div>
                <p className="font-semibold text-[hsl(var(--fg))]">Legal compliance & audit trail</p>
                <p className="text-[hsl(var(--globe-grey))]">Time-stamped steps and evidence for every signer.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5" />
              <div>
                <p className="font-semibold text-[hsl(var(--fg))]">Swiss privacy and safety first</p>
                <p className="text-[hsl(var(--globe-grey))]">Data handled with Swiss-grade security standards.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5" />
              <div>
                <p className="font-semibold text-[hsl(var(--fg))]">No more version chasing</p>
                <p className="text-[hsl(var(--globe-grey))]">One source of truth—track, remind, and complete faster.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleSendToSignature}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] w-full sm:w-auto"
              disabled={signatureFields.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Send with SELISE Signature
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto text-[hsl(var(--globe-grey))]"
            >
              Download PDF anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
