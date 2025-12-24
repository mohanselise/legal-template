"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
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
import {
  trackDocumentPreviewLoaded,
  trackDocumentDownloaded,
  trackDocumentSentSelise,
  trackSignatureFieldAdded,
  trackDocumentEdited,
} from "@/lib/analytics";

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
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
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
  const [isEditingEffectiveDate, setIsEditingEffectiveDate] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Hover state for block highlighting
  const [hoveredBlock, setHoveredBlock] = useState<{
    blockMapping: TextBlockMapping | null;
    pageNumber: number;
    boundingRect: { x: number; y: number; width: number; height: number } | null;
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const signatories = extractSignatories(editableDocument, formData);

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Track container width for responsive PDF rendering
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      // Subtract padding (p-4 sm:p-6 = 16px on mobile, 24px on larger)
      const padding = width < 640 ? 32 : 48;
      setContainerWidth(width - padding);
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Note: PDF text layer hover styles are defined in globals.css

  /**
   * Finds the document block that contains the given span text.
   * Returns the block mapping and identifies which spans belong to it.
   */
  const findBlockForSpan = useCallback((
    spanText: string,
    allSpans: HTMLElement[],
    spanIndex: number
  ): { blockMapping: TextBlockMapping; matchingSpanIndices: number[] } | null => {
    if (!spanText || spanText.length < 2) return null;

    // Check for effective date patterns
    const normalizedText = spanText.toLowerCase();
    const effectiveDatePatterns = ['effective date', 'commencement date', 'start date', 'execution date', 'date:'];
    
    if (effectiveDatePatterns.some(pattern => normalizedText.includes(pattern))) {
      // Find all spans that are part of the effective date line
      // Get spans on the same line (similar Y position)
      const currentSpan = allSpans[spanIndex];
      const currentRect = currentSpan.getBoundingClientRect();
      const lineThreshold = 5; // pixels
      
      const lineSpanIndices: number[] = [];
      allSpans.forEach((span, idx) => {
        const rect = span.getBoundingClientRect();
        if (Math.abs(rect.top - currentRect.top) < lineThreshold) {
          lineSpanIndices.push(idx);
        }
      });

      return {
        blockMapping: {
          blockId: 'metadata-effectiveDate',
          blockPath: [],
          text: `${editableDocument.metadata.effectiveDateLabel || 'Effective Date:'} ${editableDocument.metadata.effectiveDate || ''}`.trim(),
          type: 'paragraph',
          isLeaf: true,
          isTitle: false,
        },
        matchingSpanIndices: lineSpanIndices,
      };
    }

    // Find matching document block
    const blockMapping = findBlockByText(spanText, editableDocument);
    if (!blockMapping) return null;

    // Now find all spans that belong to this specific block
    // Use stricter matching: span text must be a contiguous part of the block text
    const blockTextNormalized = blockMapping.text.toLowerCase().replace(/\s+/g, ' ').trim();
    const matchingSpanIndices: number[] = [];
    
    // Strategy: Find contiguous spans whose combined text matches the block
    // Start from the current span and expand outward
    let combinedText = '';
    let startIdx = spanIndex;
    let endIdx = spanIndex;
    
    // First, check if current span is in the block
    const currentSpanText = (allSpans[spanIndex].textContent || '').toLowerCase().trim();
    if (!blockTextNormalized.includes(currentSpanText) && currentSpanText.length > 3) {
      return null;
    }

    // Expand backward to find start of block
    for (let i = spanIndex; i >= 0; i--) {
      const text = (allSpans[i].textContent || '').toLowerCase().trim();
      if (!text) continue;
      
      // Check if this span's text appears in the block
      if (blockTextNormalized.includes(text) || text.length <= 3) {
        startIdx = i;
      } else {
        break;
      }
    }

    // Expand forward to find end of block
    for (let i = spanIndex; i < allSpans.length; i++) {
      const text = (allSpans[i].textContent || '').toLowerCase().trim();
      if (!text) continue;
      
      if (blockTextNormalized.includes(text) || text.length <= 3) {
        endIdx = i;
      } else {
        break;
      }
    }

    // Verify the combined text matches the block reasonably well
    for (let i = startIdx; i <= endIdx; i++) {
      const text = (allSpans[i].textContent || '').trim();
      if (text) {
        combinedText += (combinedText ? ' ' : '') + text;
        matchingSpanIndices.push(i);
      }
    }

    // Check if combined text is similar enough to block text
    const combinedNormalized = combinedText.toLowerCase().replace(/\s+/g, ' ').trim();
    const similarity = calculateSimilarity(combinedNormalized, blockTextNormalized);
    
    if (similarity < 0.3 && matchingSpanIndices.length > 5) {
      // Too different, probably wrong block - just use spans near current
      return {
        blockMapping,
        matchingSpanIndices: [spanIndex],
      };
    }

    return {
      blockMapping,
      matchingSpanIndices,
    };
  }, [editableDocument]);

  /**
   * Calculate text similarity (0-1)
   */
  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let matches = 0;
    words1.forEach(w => { if (words2.has(w)) matches++; });
    return matches / Math.max(words1.size, words2.size);
  };

  // Handle hover over PDF text to show block-level highlight
  const handleTextHover = useCallback((event: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    // Don't process hover if already editing
    if (isEditing) {
      setHoveredBlock(null);
      return;
    }

    const target = event.target as HTMLElement;
    const textLayer = target.closest('.react-pdf__Page__textContent');
    
    if (!textLayer) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setHoveredBlock(null), 100);
      return;
    }

    const textSpan = target.closest('span');
    if (!textSpan) return;

    const pageElement = pageRefs.current.get(pageNumber);
    if (!pageElement) return;

    const textLayerElement = pageElement.querySelector('.react-pdf__Page__textContent');
    if (!textLayerElement) return;

    const allSpans = Array.from(textLayerElement.querySelectorAll('span')) as HTMLElement[];
    const spanIndex = allSpans.indexOf(textSpan as HTMLElement);
    if (spanIndex === -1) return;

    const spanText = (textSpan.textContent || '').trim();
    const result = findBlockForSpan(spanText, allSpans, spanIndex);
    
    if (!result) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setHoveredBlock(null), 100);
      return;
    }

    const { blockMapping, matchingSpanIndices } = result;

    // Calculate bounding rect for matching spans only
    const pageRect = pageElement.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    matchingSpanIndices.forEach(idx => {
      const span = allSpans[idx];
      if (!span) return;
      const rect = span.getBoundingClientRect();
      const relativeX = rect.left - pageRect.left;
      const relativeY = rect.top - pageRect.top;
      
      minX = Math.min(minX, relativeX);
      minY = Math.min(minY, relativeY);
      maxX = Math.max(maxX, relativeX + rect.width);
      maxY = Math.max(maxY, relativeY + rect.height);
    });

    if (minX === Infinity) return;

    const padding = 6;
    const boundingRect = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2),
    };

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setHoveredBlock({
      blockMapping,
      pageNumber,
      boundingRect,
    });
  }, [isEditing, findBlockForSpan]);

  // Clear hover on mouse leave
  const handleTextLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHoveredBlock(null), 150);
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

        // Track document preview loaded
        trackDocumentPreviewLoaded(templateSlug);
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

      // Track document downloaded
      trackDocumentDownloaded(templateSlug);
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
      
      // Track document sent to SELISE
      trackDocumentSentSelise(templateSlug, signatoriesForAPI.length);
      
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
    if (containerRef.current && containerWidth) {
      const pageWidthInPixels = 612;
      setScale(containerWidth / pageWidthInPixels);
    }
  };

  // Calculate responsive page width
  const pageWidth = containerWidth && containerWidth < 612 
    ? containerWidth 
    : 612;
  
  // Calculate responsive page height (maintain aspect ratio)
  const pageHeight = (pageWidth / 612) * 792;

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
    const previousLength = signatureFields.length;
    setSignatureFields(fields);
    
    // Track when signature fields are added
    if (fields.length > previousLength) {
      const newField = fields[fields.length - 1];
      trackSignatureFieldAdded(templateSlug, newField.type || 'signature');
    }
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't interfere with signature field selection
    if (selectedField) {
      setSelectedField(null);
      return;
    }

    // Don't handle clicks if already editing
    if (isEditing) return;

    // If we have a hovered block, use it directly - this allows clicking anywhere in the highlight
    if (hoveredBlock && hoveredBlock.blockMapping) {
      const blockMapping = hoveredBlock.blockMapping;
      
      // Check if it's the effective date
      if (blockMapping.blockId === 'metadata-effectiveDate') {
        setIsEditingEffectiveDate(true);
      } else {
        setIsEditingEffectiveDate(false);
      }
      
      setEditingBlock(blockMapping);
      setIsEditing(true);
      setHoveredBlock(null); // Clear hover when opening editor
      return;
    }

    // Fallback: Check if click is on text layer when no hover state
    const target = event.target as HTMLElement;
    const textLayer = target.closest('.react-pdf__Page__textContent');
    
    if (!textLayer) return;

    // Get the clicked text
    const textElement = target.closest('span');
    if (!textElement) return;
    
    const clickedText = textElement.textContent?.trim() || '';
    if (!clickedText || clickedText.length < 3) return;

    // Check if clicking on effective date
    const normalizedClicked = clickedText.toLowerCase();
    const effectiveDatePatterns = ['effective date', 'commencement date', 'start date', 'execution date', 'date:'];
    
    if (effectiveDatePatterns.some(pattern => normalizedClicked.includes(pattern))) {
      const label = editableDocument.metadata.effectiveDateLabel || 'Effective Date:';
      const value = editableDocument.metadata.effectiveDate || '';
      const fullText = `${label} ${value}`.trim();
      
      setIsEditingEffectiveDate(true);
      setEditingBlock({
        blockId: 'metadata-effectiveDate',
        blockPath: [],
        text: fullText,
        type: 'paragraph',
        isLeaf: true,
        isTitle: false,
      });
      setIsEditing(true);
      return;
    }

    // Find the matching block
    const blockMapping = findBlockByText(clickedText, editableDocument);
    
    if (!blockMapping) {
      console.log('Could not find matching block for text:', clickedText.substring(0, 50));
      return;
    }

    setIsEditingEffectiveDate(false);
    setEditingBlock(blockMapping);
    setIsEditing(true);
  };

  const handleSaveEdit = async (newText: string) => {
    if (!editingBlock) return;

    setIsSavingEdit(true);
    try {
      let updated: LegalDocument;
      
      if (isEditingEffectiveDate) {
        // Parse the edited text to extract label and value
        // Format: "{label} {value}" or just "{value}" if no colon
        updated = JSON.parse(JSON.stringify(editableDocument)) as LegalDocument;
        
        const trimmedText = newText.trim();
        const colonIndex = trimmedText.indexOf(':');
        
        if (colonIndex > 0) {
          // Has a colon - split into label and value
          updated.metadata.effectiveDateLabel = trimmedText.substring(0, colonIndex + 1).trim();
          updated.metadata.effectiveDate = trimmedText.substring(colonIndex + 1).trim();
        } else {
          // No colon - assume it's just the value, keep existing label
          updated.metadata.effectiveDate = trimmedText;
          // Ensure label exists (default if not set)
          if (!updated.metadata.effectiveDateLabel) {
            updated.metadata.effectiveDateLabel = 'Effective Date:';
          }
        }
      } else {
        // Update the document - pass isTitle flag for article/section titles
        updated = updateBlockText(
          editableDocument, 
          editingBlock.blockPath, 
          newText,
          editingBlock.isTitle
        );
      }
      
      setEditableDocument(updated);
      setHasUnsavedChanges(true);
      
      // Track document edited
      const editType = isEditingEffectiveDate ? 'effective_date' : (editingBlock?.isTitle ? 'title' : 'text');
      trackDocumentEdited(templateSlug, editType);
      
      // Close editor
      setIsEditing(false);
      setIsEditingEffectiveDate(false);
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
    setIsEditingEffectiveDate(false);
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
              {/* Desktop Zoom Controls */}
              <div className="hidden md:flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))] shadow-sm">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-1.5 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[hsl(var(--fg))] min-w-14 text-center px-2">
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

              {/* Mobile Zoom Controls - Simplified */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={handleFitWidth}
                  className="px-3 py-1.5 text-xs font-semibold text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="Fit Width"
                >
                  Fit
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-3 py-1.5 text-xs font-semibold text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="100%"
                >
                  100%
                </button>
              </div>

              {/* Desktop Fit Presets */}
              <div className="hidden md:flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))] shadow-sm">
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
          <div ref={containerRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-[hsl(var(--muted))]/40 rounded-b-2xl pb-24 md:pb-6">
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
                    Hover over text to highlight, click to edit
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
                            width: pageWidth * scale,
                            height: pageHeight * scale,
                          }}
                          onClick={handlePageClick}
                          onMouseMove={(e) => handleTextHover(e, page)}
                          onMouseLeave={handleTextLeave}
                        >
                          {/* Block highlight overlay - clickable */}
                          {hoveredBlock && hoveredBlock.pageNumber === page && hoveredBlock.boundingRect && (
                            <div
                              className="absolute z-20 transition-all duration-150 ease-out cursor-pointer"
                              style={{
                                left: hoveredBlock.boundingRect.x,
                                top: hoveredBlock.boundingRect.y,
                                width: hoveredBlock.boundingRect.width,
                                height: hoveredBlock.boundingRect.height,
                                backgroundColor: 'rgba(0, 102, 178, 0.1)',
                                border: '2px solid rgba(0, 102, 178, 0.5)',
                                borderRadius: '4px',
                                boxShadow: '0 2px 12px rgba(0, 102, 178, 0.2)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePageClick(e);
                              }}
                            >
                              {/* Edit indicator tooltip */}
                              <div 
                                className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[hsl(var(--selise-blue))] text-white text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none"
                              >
                                <Edit2 className="w-3 h-3" />
                                Click to edit
                              </div>
                            </div>
                          )}
                          <Page
                            pageNumber={page}
                            scale={scale}
                            width={pageWidth}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            loading={
                              <div
                                className="flex items-center justify-center bg-[hsl(var(--bg))]"
                                style={{ width: pageWidth * scale, height: pageHeight * scale }}
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
                              pageWidth={pageWidth}
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
                              blockType={isEditingEffectiveDate ? "effectiveDate" : editingBlock?.type}
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

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-[hsl(var(--bg))] border-t border-[hsl(var(--border))] p-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)] safe-area-pb">
        <div className="flex gap-3">
          <Button
            onClick={() => setShowDownloadPrompt(true)}
            variant="outline"
            className="flex-1 border-[hsl(var(--border))] text-[hsl(var(--globe-grey))]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {signatureFields.length > 0 && (
            <Button
              onClick={handleSendToSignature}
              className="flex-1 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] shadow-md"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showDownloadPrompt} onOpenChange={setShowDownloadPrompt}>
        <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden">
          <div className="shrink-0">
            <DialogHeader>
              <DialogTitle>Send with SELISE Signature (recommended)</DialogTitle>
              <DialogDescription>
                Enjoy legally compliant e-signatures with a full audit trail, Swiss-grade privacy, and a
                safe, trackable workflow. Avoid version sprawl and keep signers aligned.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            <div className="space-y-3 text-sm text-[hsl(var(--fg))]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-[hsl(var(--fg))]">Legal compliance & audit trail</p>
                  <p className="text-[hsl(var(--globe-grey))]">Time-stamped steps and evidence for every signer.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-[hsl(var(--fg))]">Swiss privacy and safety first</p>
                  <p className="text-[hsl(var(--globe-grey))]">Data handled with Swiss-grade security standards.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--selise-blue))] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-[hsl(var(--fg))]">No more version chasing</p>
                  <p className="text-[hsl(var(--globe-grey))]">One source of truth—track, remind, and complete faster.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t border-[hsl(var(--border))] sm:flex-wrap sm:justify-start">
            <Button
              onClick={handleSendToSignature}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] w-full sm:w-auto sm:flex-1 sm:min-w-0 max-w-full whitespace-normal"
              disabled={signatureFields.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Send with SELISE
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto sm:flex-1 sm:min-w-0 max-w-full whitespace-normal text-[hsl(var(--globe-grey))]"
            >
              Download PDF anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
