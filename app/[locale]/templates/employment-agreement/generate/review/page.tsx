'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, Edit, Download, Send, Sparkles, FileText, ZoomIn, ZoomOut, PanelRightClose, PanelRightOpen, Signature, Calendar, User, Briefcase, Trash2 } from 'lucide-react';
import type { EmploymentAgreement, LegalDocument } from '@/app/api/templates/employment-agreement/schema';
import {
  clearEmploymentAgreementReview,
  loadEmploymentAgreementReview,
} from '../reviewStorage';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { useRouter } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import { SignatureFieldOverlay, type SignatureField } from './_components/SignatureFieldOverlay';
import { SignatureFieldMiniMap } from './_components/SignatureFieldMiniMap';
import { generateSignatureFieldMetadata, type SignatureFieldMetadata } from '@/lib/pdf/signature-field-metadata';

// Loading component for PDF viewer
function PDFLoadingMessage() {
  const t = useTranslations('employmentAgreement.reviewPage');
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-[hsl(var(--brand-muted))]">{t('loadingPdf')}</div>
    </div>
  );
}

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  {
    ssr: false,
    loading: () => <PDFLoadingMessage />
  }
);
const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

type FormDataState = Record<string, unknown> | null;

// Helper to check for legacy document
function isLegacyDocument(doc: LegalDocument | EmploymentAgreement): doc is EmploymentAgreement {
  return 'parties' in doc;
}

// Helpers to extract party info safely from either schema
function getEmployerInfo(doc: LegalDocument | EmploymentAgreement | null, formData: any) {
  if (!doc) return { name: formData?.companyName || 'Company', email: formData?.companyRepEmail || '' };
  
  if (isLegacyDocument(doc)) {
    return {
      name: doc.parties.employer.legalName,
      email: doc.parties.employer.email || formData?.companyRepEmail || ''
    };
  } else {
    const sig = doc.signatories?.find(s => s.party === 'employer');
    return {
      name: sig?.name || formData?.companyName || 'Company',
      email: sig?.email || formData?.companyRepEmail || ''
    };
  }
}

function getEmployeeInfo(doc: LegalDocument | EmploymentAgreement | null, formData: any) {
  if (!doc) return { name: formData?.employeeName || 'Employee', email: formData?.employeeEmail || '' };

  if (isLegacyDocument(doc)) {
    return {
      name: doc.parties.employee.legalName,
      email: doc.parties.employee.email || formData?.employeeEmail || ''
    };
  } else {
    const sig = doc.signatories?.find(s => s.party === 'employee');
    return {
      name: sig?.name || formData?.employeeName || 'Employee',
      email: sig?.email || formData?.employeeEmail || ''
    };
  }
}

function ReviewContent() {
  const t = useTranslations('employmentAgreement.reviewPage');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataState>(null);
  const [generatedDocument, setGeneratedDocument] = useState<LegalDocument | EmploymentAgreement | null>(null);
  const [editedDocument, setEditedDocument] = useState<LegalDocument | EmploymentAgreement | null>(null);
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
  const [apiSignatureFields, setApiSignatureFields] = useState<SignatureFieldMetadata[] | null>(null);
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
        const parsedDocument: LegalDocument | EmploymentAgreement = JSON.parse(docParam);
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

  // Helper function to convert SignatureFieldMetadata to SignatureField format
  const convertMetadataToFields = (
    metadataFields: SignatureFieldMetadata[],
    actualPageCount: number
  ): SignatureField[] => {
    return metadataFields.map((field) => {
      // Convert party to signatoryIndex (0 = employer, 1 = employee)
      const signatoryIndex = field.party === 'employer' ? 0 : 1;

      // Ensure pageNumber matches actual PDF page count
      const pageNumber = Math.min(field.pageNumber, actualPageCount);

      return {
        id: field.id,
        type: field.type === 'text' ? 'signature' : field.type, // Map 'text' to 'signature'
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

  const generatePdfPreview = async (
    document: LegalDocument | EmploymentAgreement,
    formDataValue: FormDataState
  ) => {
    setIsLoadingPdf(true);
    try {
      // Request PDF with metadata to get signature field coordinates
      const response = await fetch('/api/documents/generate-pdf?metadata=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          formData: formDataValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF preview');

      const responseData = await response.json();

      if (responseData.success && responseData.pdfBase64) {
        // Convert base64 to blob
        const binaryString = atob(responseData.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);

        // Store API-provided signature fields for later use
        if (responseData.signatureFields && Array.isArray(responseData.signatureFields)) {
          console.log('✅ Received signature fields from API:', responseData.signatureFields);
          setApiSignatureFields(responseData.signatureFields);
        }
      } else {
        throw new Error('Invalid response format from PDF generation API');
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      setError('Failed to generate PDF preview. Please try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleSendToSignature = async () => {
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend || !pdfUrl || !formData) {
      alert('Document or form data is not ready. Please wait for the preview to load.');
      return;
    }

    setIsPreparingContract(true);

    try {
      // Validate that we have signature fields
      if (!signatureFields || signatureFields.length === 0) {
        throw new Error('No signature fields have been placed. Please add signature fields before sending.');
      }

      // Convert overlay fields to signature field metadata format
      // The overlay fields are already in PDF points, so we can use them directly
      // This includes any user adjustments (drag/resize) made to the fields
      const signatureFieldsForAPI = signatureFields.map((field) => {
        // Send 1-indexed page number to API (Server will convert to 0-indexed)
        const pageNumber = field.pageNumber || 1;

        // Scaling factor: 96 DPI (Screen/API) / 72 DPI (PDF) = 1.3333
        // SELISE Signature platform expects coordinates in pixels (96 DPI)
        // The overlay stores coordinates in PDF points (72 DPI)
        const DPI_SCALE = 96 / 72;

        // Apply DPI scaling to ALL field types (signature AND date)
        const x = field.x * DPI_SCALE;
        const y = field.y * DPI_SCALE;
        const width = field.width * DPI_SCALE;
        const height = field.height * DPI_SCALE;

        return {
          id: field.id,
          type: field.type, // 'signature' | 'date'
          signatoryIndex: field.signatoryIndex, // 0 = employer, 1 = employee
          pageNumber, // 1-indexed for Server
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          label: field.label || `${field.type === 'signature' ? t('signature') : t('date')}`,
        };
      });

      // Validate converted fields
      const invalidFields = signatureFieldsForAPI.filter(
        (field) =>
          typeof field.x !== 'number' ||
          typeof field.y !== 'number' ||
          typeof field.width !== 'number' ||
          typeof field.height !== 'number' ||
          field.x < 0 ||
          field.y < 0 ||
          field.width <= 0 ||
          field.height <= 0
      );

      if (invalidFields.length > 0) {
        console.error('⚠️ Invalid signature field coordinates:', invalidFields);
        throw new Error('Some signature fields have invalid coordinates. Please check and adjust the fields.');
      }

      // Extract signatories safely
      const empInfo = getEmployerInfo(documentToSend, formData);
      const emplInfo = getEmployeeInfo(documentToSend, formData);

      const signatories = [
        {
          party: 'employer' as const,
          name: (formData.companyRepName as string) || empInfo.name,
          email: (formData.companyRepEmail as string) || empInfo.email,
          role: (formData.companyRepTitle as string) || 'Authorized Representative',
          ...((formData.companyRepPhone as string) && { phone: formData.companyRepPhone as string }),
        },
        {
          party: 'employee' as const,
          name: emplInfo.name,
          email: (formData.employeeEmail as string) || emplInfo.email,
          role: (formData.jobTitle as string) || 'Employee',
          ...((formData.employeePhone as string) && { phone: formData.employeePhone as string }),
        },
      ];

      // Convert blob URL to blob, then to base64 for transmission
      console.log('📄 Reusing already-generated PDF from preview...');
      const pdfBlob = await fetch(pdfUrl).then(res => res.blob());
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      // Store session data for potential retries
      sessionStorage.setItem(
        'signature-last-payload',
        JSON.stringify({
          document: documentToSend,
          formData,
          signatories,
          signatureFields: signatureFieldsForAPI,
        })
      );

      // Log the exact coordinates being sent to the API
      console.log('✅ Sending signature fields with exact overlay coordinates (Top-Left origin):', {
        totalFields: signatureFieldsForAPI.length,
        fields: signatureFieldsForAPI.map((field) => ({
          id: field.id,
          type: field.type,
          signatoryIndex: field.signatoryIndex,
          pageNumber: field.pageNumber,
          position: `(${field.x}, ${field.y})`,
          size: `${field.width}×${field.height}`,
          label: field.label,
        })),
      });

      console.log('📨 Sending contract via aggregated rollout API…');
      const rolloutResponse = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64, // Send the already-generated PDF
          document: documentToSend,
          formData,
          signatories,
          signatureFields: signatureFieldsForAPI,
          numPages, // Send page count for accurate signature field placement
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
      
      const empInfo = getEmployeeInfo(documentToDownload, formData);
      const employeeName = empInfo.name.replace(/\s+/g, '_');
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

    // ALWAYS regenerate signature fields with actual page count
    // This ensures correct positioning regardless of letterhead/content changes
    // The API uses estimated page count which may be wrong when letterhead reduces content area
    if (generatedDocument) {
      const empInfo = getEmployerInfo(generatedDocument, formData);
      const emplInfo = getEmployeeInfo(generatedDocument, formData);

      const signatories = [
        { party: 'employer' as const, name: empInfo.name, email: empInfo.email },
        { party: 'employee' as const, name: emplInfo.name, email: emplInfo.email },
      ];

      const metadataFields = generateSignatureFieldMetadata(
        signatories,
        numPages,  // Actual page count from rendered PDF
        isLegacyDocument(generatedDocument) ? undefined : generatedDocument.letterhead
      );
      const fields = convertMetadataToFields(metadataFields, numPages);
      console.log('✅ Regenerated signature fields with actual page count:', numPages, fields);
      setSignatureFields(fields);

      // Save to sessionStorage
      const docId = generatedDocument.metadata?.generatedAt || Date.now().toString();
      saveSignatureFields(fields, docId);
    }
  };

  // Initialize signature fields when PDF and document are ready
  useEffect(() => {
    if (numPages && numPages > 0 && generatedDocument && formData) {
      if (signatureFields.length === 0) {
        // Initialize fields using priority: 1) Saved fields, 2) API-provided fields, 3) Hardcoded coordinates
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
  }, [numPages, generatedDocument, formData, apiSignatureFields]);

  // Initialize default signature fields
  // Priority: 1) Saved fields from sessionStorage, 2) API-provided fields, 3) Hardcoded coordinates
  const initializeSignatureFields = (totalPages: number) => {
    if (!generatedDocument || !formData) return;

    const docId = generatedDocument.metadata?.generatedAt || Date.now().toString();
    const storageKey = `employment-agreement-signature-fields-${docId}`;

    // Priority 1: Try to load saved fields (user-adjusted positions)
    const savedFields = sessionStorage.getItem(storageKey);
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields) as SignatureField[];
        // Update page numbers to match actual PDF page count
        const updatedFields = parsed.map(f => ({
          ...f,
          pageNumber: Math.min(f.pageNumber, totalPages)
        }));
        console.log('✅ Using saved signature fields from sessionStorage:', updatedFields);
        setSignatureFields(updatedFields);
        return;
      } catch (e) {
        console.error('Failed to parse saved signature fields:', e);
      }
    }

    // Priority 2: Use API-provided fields if available
    if (apiSignatureFields && apiSignatureFields.length > 0) {
      const convertedFields = convertMetadataToFields(apiSignatureFields, totalPages);
      console.log('✅ Using API-provided signature fields:', convertedFields);
      setSignatureFields(convertedFields);
      saveSignatureFields(convertedFields, docId);
      return;
    }

    // Priority 3: Fall back to local generation using the shared metadata generator
    // This ensures even if API failed, we use the same logic as the backend
    const empInfo = getEmployerInfo(generatedDocument, formData);
    const emplInfo = getEmployeeInfo(generatedDocument, formData);

    const signatories = [
      { party: 'employer' as const, name: empInfo.name, email: empInfo.email },
      { party: 'employee' as const, name: emplInfo.name, email: emplInfo.email },
    ];

    // Pass letterhead to adjust positions when letterhead content area differs from default margins
    const metadataFields = generateSignatureFieldMetadata(signatories, totalPages, isLegacyDocument(generatedDocument) ? undefined : generatedDocument.letterhead);
    const defaultFields = convertMetadataToFields(metadataFields, totalPages);

    console.log('⚠️ Using locally generated signature fields (fallback):', defaultFields);
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

  // Scroll to a specific page
  const scrollToPage = (page: number) => {
    setPageNumber(page);
    // Find the page element and scroll to it
    const pageElement = document.querySelector(`[data-page-number="${page}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get signatories from document
  const getSignatories = () => {
    if (!generatedDocument || !formData) return [];

    const empInfo = getEmployerInfo(generatedDocument, formData);
    const emplInfo = getEmployeeInfo(generatedDocument, formData);

    return [
      {
        name: (formData.companyRepName as string) || empInfo.name,
        email: (formData.companyRepEmail as string) || empInfo.email,
        role: (formData.companyRepTitle as string) || 'Authorized Representative',
        color: '#0066B2', // SELISE Blue
      },
      {
        name: emplInfo.name,
        email: (formData.employeeEmail as string) || emplInfo.email,
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
      <div className="fixed inset-0 bg-[hsl(var(--bg))] dark:bg-[hsl(var(--background))] z-50 flex flex-col items-center justify-center px-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[hsl(var(--selise-blue))]/5 blur-3xl dark:bg-[hsl(var(--sky-blue))]/10" />
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-[hsl(var(--sky-blue))]/5 blur-3xl dark:bg-[hsl(var(--selise-blue))]/10" />
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Main loader with icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-[hsl(var(--border))] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] flex items-center justify-center shadow-lg shadow-[hsl(var(--selise-blue))]/30">
                <Send className="w-6 h-6 text-[hsl(var(--white))]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl font-bold text-[hsl(var(--fg))] mb-3 font-heading sm:text-5xl">
            {t('preparingContract')}
          </h2>
          
          {/* Description */}
          <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10 max-w-lg mx-auto leading-relaxed">
            {t('settingUpDocument')}
          </p>

          {/* Progress steps */}
          <div className="space-y-3 bg-[hsl(var(--card))] dark:bg-[hsl(var(--card))] rounded-2xl p-8 border border-[hsl(var(--border))] shadow-xl backdrop-blur-sm max-w-md mx-auto">
            {[
              { label: t('generatingPdfDocument'), icon: '📄' },
              { label: t('configuringSignatureFields'), icon: '✍️' },
              { label: t('preparingForDelivery'), icon: '📧' },
            ].map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-4 text-[hsl(var(--fg))] text-base font-medium"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--brand-surface))] dark:bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] shrink-0">
                  <span className="text-lg">{step.icon}</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-2 h-2 bg-[hsl(var(--selise-blue))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Subtle hint */}
          <p className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            {t('usuallyTakesMoments')}
          </p>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(12px);
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="text-center space-y-6 px-6 max-w-md">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(var(--border))] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[hsl(var(--selise-blue))] animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
              {t('creatingAgreement')}
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {t('generatingDescription')}
            </p>
          </div>

          {/* Loading steps */}
          <div className="space-y-2 bg-[hsl(var(--card))] rounded-xl p-5 border border-[hsl(var(--border))]">
            {[
              t('analyzingRequirements'),
              t('draftingProvisions'),
              t('buildingStructure')
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-[hsl(var(--fg))] text-sm font-medium"
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-40 bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] shadow-sm">
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
                    {t('ready')}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-[hsl(var(--fg))] font-heading">
                  {t('employmentAgreement')}
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
        <div className="flex-1 flex flex-col bg-[hsl(var(--muted))]">
          {/* PDF Controls */}
          <div className="bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-medium text-[hsl(var(--fg))]">{t('preview')}</span>
              {numPages && (
                <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded font-medium">
                  {numPages} {numPages === 1 ? t('page') : t('pages')}
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
                  title={t('zoomOut')}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-[hsl(var(--fg))] min-w-[3.5rem] text-center px-2">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                  className="p-1.5 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('zoomIn')}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Fit Presets */}
              <div className="flex items-center border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--bg))] divide-x divide-[hsl(var(--border))]">
                <button
                  onClick={handleFitWidth}
                  className="px-2.5 py-1.5 text-sm font-medium text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title={t('fitWidth')}
                >
                  {t('fitWidth')}
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-2.5 py-1.5 text-sm font-medium text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="100%"
                >
                  100%
                </button>
              </div>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
                title={sidebarOpen ? t('hideSidebar') : t('showSidebar')}
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
                  <p className="text-[hsl(var(--fg))] text-sm font-medium">{t('loadingPreview')}</p>
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
                      <p className="text-red-600 font-semibold">{t('failedToLoadPdf')}</p>
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
                            <div className="flex items-center justify-center bg-[hsl(var(--bg))]" style={{ width: 612 * scale, height: 792 * scale }}>
                              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
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
                          <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm">
                            {t('noSignatureFieldsInitialized', { fieldCount: signatureFields.length, pageCount: numPages || 0 })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Document>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 font-medium">{t('noPdfAvailable')}</p>
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

        {/* Sidebar - Slide-in on mobile, sticky on desktop */}
        {sidebarOpen && (
          <aside className="fixed lg:relative right-0 top-0 w-full sm:w-80 border-l border-[hsl(var(--border))] bg-[hsl(var(--bg))] flex flex-col h-screen z-50 lg:z-auto lg:sticky shadow-2xl lg:shadow-none animate-in slide-in-from-right lg:animate-none">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mobile header with close button */}
              <div className="flex items-center justify-between lg:hidden pb-4 border-b border-[hsl(var(--border))]">
                <h2 className="font-heading font-semibold text-lg text-[hsl(var(--fg))]">{t('documentDetails')}</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                >
                  <PanelRightClose className="w-5 h-5" />
                </button>
              </div>

              {/* Signature Field Controls */}
              <div>
                <h3 className="font-semibold text-[hsl(var(--fg))] text-sm mb-3 font-heading">
                  {t('signatureFields')}
                </h3>

                {/* Instructions */}
                <div className="p-3 bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] rounded-lg mb-4">
                  <p className="text-sm text-[hsl(var(--fg))] leading-relaxed">
                    {t('fieldsAutomaticallyPlaced')}
                  </p>
                </div>

                {/* Field Count */}
                <div className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  <strong className="text-[hsl(var(--fg))] font-semibold">{signatureFields.length}</strong> {t('fieldsPlaced', { count: signatureFields.length, plural: signatureFields.length !== 1 ? t('fields') : t('field') })}
                </div>
              </div>

              {/* Document Overview Mini-Map */}
              {numPages && numPages > 0 && (
                <div className="border-t border-[hsl(var(--border))] pt-6">
                  <SignatureFieldMiniMap
                    numPages={numPages}
                    signatureFields={signatureFields}
                    signatories={getSignatories()}
                    currentPage={pageNumber}
                    onPageClick={scrollToPage}
                  />
                </div>
              )}

              {/* Document Details */}
              {formData && (
                <div className="border-t border-[hsl(var(--border))] pt-6">
                  <h3 className="font-semibold text-[hsl(var(--fg))] text-sm mb-3 font-heading">
                    {t('documentDetails')}
                  </h3>
                  <dl className="space-y-3 text-sm">
                    {Object.entries(formData as Record<string, unknown>)
                      .slice(0, 6)
                      .map(([key, value]) => {
                        // Get translated label for the field, fallback to formatted key
                        const fieldLabel = t(`fieldLabels.${key}` as any) || key.replace(/([A-Z])/g, ' $1').trim();
                        
                        // Format boolean values
                        let displayValue: string;
                        if (typeof value === 'boolean') {
                          displayValue = value ? tCommon('yes') : tCommon('no');
                        } else if (typeof value === 'string') {
                          displayValue = value;
                        } else {
                          displayValue = JSON.stringify(value);
                        }
                        
                        return (
                          <div key={key} className="pb-3 border-b border-[hsl(var(--border))] last:border-0">
                            <dt className="text-[hsl(var(--muted-foreground))] capitalize text-sm mb-1">
                              {fieldLabel}
                            </dt>
                            <dd className="font-medium text-[hsl(var(--fg))] text-sm break-words">
                              {displayValue}
                            </dd>
                          </div>
                        );
                      })}
                  </dl>
                  <button
                    onClick={() => router.push('/templates/employment-agreement/generate')}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[hsl(var(--selise-blue))] hover:text-[hsl(var(--oxford-blue))] font-medium text-sm py-2 hover:bg-[hsl(var(--brand-surface))] rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('editDetails')}
                  </button>
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="border-t border-[hsl(var(--border))] pt-6">
                <LegalDisclaimer variant="compact" />
              </div>
            </div>

            {/* Fixed Action Buttons at Bottom */}
            <div className="border-t border-[hsl(var(--border))] p-6 space-y-3 bg-[hsl(var(--bg))]">
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 border border-[hsl(var(--border))] text-[hsl(var(--fg))] px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-[hsl(var(--muted))] transition-all group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                {t('downloadPdf')}
              </button>
              <button
                onClick={handleSendToSignature}
                disabled={isPreparingContract}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-[hsl(var(--selise-blue))]/25 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                {t('sendForSignature')}
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
