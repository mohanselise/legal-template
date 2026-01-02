'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Signature,
  Calendar,
  Trash2,
  User,
  Briefcase,
  Send,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  MousePointer2,
  Move,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SIG_PAGE_LAYOUT, getSignatureBlockPosition } from '@/lib/pdf/signature-layout';

// Dynamic imports for react-pdf to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  import('react-pdf').then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

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

interface Signatory {
  name: string;
  email: string;
  role: string;
  order: number;
  color: string;
}

interface PDFSignatureEditorProps {
  pdfUrl: string;
  signatories: Array<{
    name: string;
    email: string;
    role: string;
    order: number;
  }>;
  initialFields?: SignatureField[];
  onConfirm: (fields: SignatureField[]) => Promise<void>;
  onCancel: () => void;
}

// Distinct colors for each party (SELISE brand-compliant)
const PARTY_COLORS = {
  employer: '#0066B2', // SELISE Blue - for employer/company
  employee: '#2A4D14', // Poly Green - for employee
};

const SIGNATORY_COLORS = [
  PARTY_COLORS.employer, // First signatory = employer (blue)
  PARTY_COLORS.employee, // Second signatory = employee (green)
  '#7c3aed', // Purple for third (if needed)
  '#dc2626', // Red for fourth (if needed)
];

type FieldTypeConfig = {
  type: 'signature' | 'date';
  label: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
};

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: 'signature' as const, label: 'Signature', icon: Signature, defaultWidth: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH, defaultHeight: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT, color: '#facc15' },
  { type: 'date' as const, label: 'Date Signed', icon: Calendar, defaultWidth: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH, defaultHeight: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT, color: '#38bdf8' },
];

const applyAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const resolveFieldVisual = (type: SignatureField['type']): FieldTypeConfig => {
  const config = FIELD_TYPES.find((field) => field.type === type);

  if (config) {
    return config;
  }

  if (type === 'date') {
    return {
      type: 'date',
      label: 'Date Signed',
      icon: Calendar,
      defaultWidth: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
      defaultHeight: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
      color: '#38bdf8',
    };
  }

  return {
    type: 'signature',
    label: 'Signature',
    icon: Signature,
    defaultWidth: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
    defaultHeight: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
    color: '#facc15',
  };
};

const getMinimumDimensions = (type: SignatureField['type']) => {
  switch (type) {
    case 'signature':
      return { width: 140, height: 48 };
    case 'date':
      return { width: 110, height: 34 };
    case 'text':
    default:
      return { width: 140, height: 34 };
  }
};

export function PDFSignatureEditor({
  pdfUrl,
  signatories: rawSignatories,
  initialFields = [],
  onConfirm,
  onCancel
}: PDFSignatureEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState(0);
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'date'>('signature');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<{
    fieldId: string;
    fieldType: SignatureField['type'];
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAutoPlacedMessage, setShowAutoPlacedMessage] = useState(false);

  // Add colors to signatories - with safety check
  const signatories: Signatory[] = (rawSignatories || []).map((s, i) => ({
    ...s,
    color: SIGNATORY_COLORS[i % SIGNATORY_COLORS.length],
  }));

  // Initialize default fields on last page
  useEffect(() => {
    if (numPages > 0 && fields.length === 0) {
      // Use initialFields if provided (already in correct format from page)
      if (initialFields.length > 0) {
        setFields(initialFields);
        setCurrentPage(numPages);

        // Show auto-placed message
        setShowAutoPlacedMessage(true);
        setTimeout(() => setShowAutoPlacedMessage(false), 5000);
        return;
      }

      // Fallback to default field generation
      const defaultFields: SignatureField[] = [];
      const lastPage = numPages;

      signatories.forEach((sig, index) => {
        const blockTop = getSignatureBlockPosition(index);
        const MARGIN_LEFT = SIG_PAGE_LAYOUT.MARGIN_X;

        // Signature Position
        const sigX = MARGIN_LEFT + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET;
        const sigY = blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET;
        
        // Date Position
        const dateX = MARGIN_LEFT + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET;
        const dateY = blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET;

        defaultFields.push(
          {
            id: `sig-${index}-signature`,
            type: 'signature',
            signatoryIndex: index,
            pageNumber: lastPage,
            x: sigX,
            y: sigY,
            width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
            height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
            label: `${sig.name} - Signature`,
          },
          {
            id: `sig-${index}-date`,
            type: 'date',
            signatoryIndex: index,
            pageNumber: lastPage,
            x: dateX,
            y: dateY,
            width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
            height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
            label: `${sig.name} - Date`,
          }
        );
      });

      setFields(defaultFields);
      setCurrentPage(lastPage);
    }
  }, [numPages, signatories, fields.length, initialFields]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current || isDragging || isResizing) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const fieldType = resolveFieldVisual(selectedFieldType);

    const newField: SignatureField = {
      id: `field-${Date.now()}-${Math.random()}`,
      type: selectedFieldType,
      signatoryIndex: selectedSignatoryIndex,
      pageNumber: currentPage,
      x: x - fieldType.defaultWidth / 2,
      y: y - fieldType.defaultHeight / 2,
      width: fieldType.defaultWidth,
      height: fieldType.defaultHeight,
      label: `${signatories[selectedSignatoryIndex].name} - ${fieldType.label}`,
    };

    setFields((prevFields) => [...prevFields, newField]);
  };

  const handleFieldMouseDown = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(false);
    setResizeState(null);
    setSelectedField(fieldId);
    setIsDragging(true);
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setDragStart({ x: event.clientX - field.x * scale, y: event.clientY - field.y * scale });
    }
  };

  const handleResizeMouseDown = (
    fieldId: string,
    fieldType: SignatureField['type'],
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    setSelectedField(fieldId);
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(true);
    setResizeState({
      fieldId,
      fieldType,
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: field.width,
      initialHeight: field.height,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing && resizeState && pageRef.current) {
      const deltaX = (event.clientX - resizeState.startX) / scale;
      const deltaY = (event.clientY - resizeState.startY) / scale;
      const minSize = getMinimumDimensions(resizeState.fieldType);

      setFields((prevFields) =>
        prevFields.map((field) =>
          field.id === resizeState.fieldId
            ? {
                ...field,
                width: Math.max(minSize.width, resizeState.initialWidth + deltaX),
                height: Math.max(minSize.height, resizeState.initialHeight + deltaY),
              }
            : field
        )
      );
      return;
    }

    if (!isDragging || !selectedField || !dragStart || !pageRef.current) return;

    const x = (event.clientX - dragStart.x) / scale;
    const y = (event.clientY - dragStart.y) / scale;

    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === selectedField
          ? { ...field, x, y }
          : field
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeState(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleResetFields = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeState(null);
    setSelectedField(null);
    setFields([]);
    // Re-trigger default field generation
    if (numPages > 0) {
      const defaultFields: SignatureField[] = [];
      const lastPage = numPages;

      signatories.forEach((sig, index) => {
        const blockTop = getSignatureBlockPosition(index);
        const MARGIN_LEFT = SIG_PAGE_LAYOUT.MARGIN_X;

        // Signature Position
        const sigX = MARGIN_LEFT + SIG_PAGE_LAYOUT.SIG_BOX_X_OFFSET;
        const sigY = blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET;
        
        // Date Position
        const dateX = MARGIN_LEFT + SIG_PAGE_LAYOUT.DATE_BOX_X_OFFSET;
        const dateY = blockTop + SIG_PAGE_LAYOUT.SIG_BOX_Y_OFFSET;

        defaultFields.push(
          {
            id: `sig-${index}-signature-reset`,
            type: 'signature',
            signatoryIndex: index,
            pageNumber: lastPage,
            x: sigX,
            y: sigY,
            width: SIG_PAGE_LAYOUT.SIG_BOX_WIDTH,
            height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
            label: `${sig.name} - Signature`,
          },
          {
            id: `sig-${index}-date-reset`,
            type: 'date',
            signatoryIndex: index,
            pageNumber: lastPage,
            x: dateX,
            y: dateY,
            width: SIG_PAGE_LAYOUT.DATE_BOX_WIDTH,
            height: SIG_PAGE_LAYOUT.SIG_BOX_HEIGHT,
            label: `${sig.name} - Date`,
          }
        );
      });

      setFields(defaultFields);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(fields);
    } catch (error) {
      console.error('Error confirming fields:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsByPage = fields.reduce((acc, field) => {
    if (!acc[field.pageNumber]) acc[field.pageNumber] = [];
    acc[field.pageNumber].push(field);
    return acc;
  }, {} as Record<number, SignatureField[]>);

  const hasFieldsOnPage = (page: number) => fieldsByPage[page]?.length > 0;

  // Field validation
  const getValidationStatus = () => {
    const missingFields: string[] = [];
    signatories.forEach((sig, idx) => {
      const sigFields = fields.filter(f => f.signatoryIndex === idx);
      const hasSignature = sigFields.some(f => f.type === 'signature');
      if (!hasSignature) {
        missingFields.push(`${sig.name} - Missing signature field`);
      }
    });
    return { isValid: missingFields.length === 0, missingFields };
  };

  const validation = getValidationStatus();

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Tools Panel (narrower for more PDF space) */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-lg text-gray-900 mb-1">
            Place Signature Fields
          </h2>
          <p className="text-xs text-gray-500">
            Fields auto-placed - drag to adjust
          </p>
        </div>

        {/* Signatories */}
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Signature Parties</h3>
          <div className="space-y-2">
            {signatories.map((sig, index) => {
              const fieldCount = fields.filter(f => f.signatoryIndex === index).length;
              const hasSignature = fields.some(f => f.signatoryIndex === index && f.type === 'signature');
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSignatoryIndex(index)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                    selectedSignatoryIndex === index
                      ? 'border-current shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedSignatoryIndex === index ? `${sig.color}10` : 'white',
                    borderColor: selectedSignatoryIndex === index ? sig.color : undefined,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                    style={{ backgroundColor: sig.color }}
                  >
                    {index === 0 ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-xs text-gray-900 truncate">{sig.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {index === 0 ? '🏢 Employer' : '👤 Employee'} · {sig.role}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!hasSignature && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Missing signature field" />
                    )}
                    {fieldCount > 0 && (
                      <div className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {fieldCount}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Field Types */}
        <div className="p-5 border-b border-gray-200 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <MousePointer2 className="w-3.5 h-3.5" />
            Field Types
          </h3>
          <div className="space-y-1.5">
            {FIELD_TYPES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setSelectedFieldType(type)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  selectedFieldType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-xs text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">Click to place</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1">✨ Auto-placed fields</p>
              <p className="text-blue-800">Drag to adjust • Add more • Delete unwanted</p>
            </div>
          </div>
        </div>

        {/* Validation Summary & Actions */}
        <div className="p-5 border-t border-gray-200 space-y-3">
          {/* Validation Status */}
          {!validation.isValid && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-900 mb-1">Missing Required Fields</p>
                  <ul className="text-sm text-amber-800 space-y-0.5">
                    {validation.missingFields.map((msg, idx) => (
                      <li key={idx}>• {msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validation.isValid && fields.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-green-900">All required fields placed</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleResetFields}
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Fields
          </Button>
          <div className="text-[10px] text-center text-gray-500">
            <strong className="text-gray-900">{fields.length}</strong> field{fields.length !== 1 ? 's' : ''} added
          </div>
        </div>
      </div>

      {/* Main Content - PDF Viewer */}
    <div className="flex-1 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">{/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">
                {currentPage}
              </span>
              <span className="text-sm text-gray-500">of</span>
              <span className="text-sm font-semibold text-gray-900">
                {numPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="h-8"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Page Thumbnails */}
          {numPages > 1 && (
            <div className="flex items-center gap-1 ml-2">
              {Array.from({ length: Math.min(numPages, 10) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : hasFieldsOnPage(page)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`Page ${page}${hasFieldsOnPage(page) ? ' (has fields)' : ''}`}
                >
                  {page}
                </button>
              ))}
              {numPages > 10 && (
                <span className="text-xs text-gray-500 ml-1">+{numPages - 10}</span>
              )}
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            disabled={scale <= 0.5}
            className="h-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1.5 bg-gray-100 rounded-lg min-w-[70px] text-center">
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            disabled={scale >= 2}
            className="h-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(1)}
            className="h-8 text-xs"
          >
            Fit
          </Button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-8 relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Auto-placed notification */}
        {showAutoPlacedMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold">Fields Auto-Placed!</p>
                <p className="text-sm text-green-100">Drag to adjust positions if needed</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div
            ref={pageRef}
            className="relative inline-block bg-white shadow-lg cursor-crosshair"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
            onClick={handlePageClick}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-20 bg-white">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading document...</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
              />
            </Document>

            {/* Signature Fields Overlay */}
            {fields
              .filter(field => field.pageNumber === currentPage)
              .map(field => {
                const signatory = signatories[field.signatoryIndex];
                const fieldType = resolveFieldVisual(field.type);
                const isSelected = selectedField === field.id;
                const isHovered = hoveredField === field.id;
                const accentColor = signatory.color || fieldType.color;
                const nameLine = signatory.name || 'Signatory';
                const secondaryLine =
                  field.type === 'signature'
                    ? signatory.role || 'Authorized Signature'
                    : 'Signature Date';

                return (
                  <div
                    key={field.id}
                    className={`absolute group transition-all ${
                      isSelected
                        ? 'z-50'
                        : isHovered
                        ? 'z-40'
                        : 'z-30'
                    }`}
                    style={{
                      left: field.x * scale,
                      top: field.y * scale,
                      width: field.width * scale,
                      height: field.height * scale,
                      overflow: 'visible',
                    }}
                    onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
                    onMouseEnter={() => setHoveredField(field.id)}
                    onMouseLeave={() => setHoveredField(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedField(field.id);
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-lg border-2 transition-all cursor-move flex items-center justify-center"
                      style={{
                        borderColor: accentColor,
                        backgroundColor: applyAlpha(
                          accentColor,
                          isSelected || isHovered ? 0.25 : 0.15
                        ),
                        boxShadow: isSelected
                          ? `0 16px 24px -12px ${applyAlpha(accentColor, 0.55)}`
                          : `0 10px 24px -18px rgba(15, 23, 42, 0.45)`,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center px-3 text-center leading-tight">
                        <span
                          className="text-[11px] font-semibold tracking-wide uppercase"
                          style={{ color: accentColor }}
                        >
                          {fieldType.label}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          ({nameLine})
                        </span>
                      </div>

                      {(isHovered || isSelected) && (
                        <div
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Move className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 text-center pointer-events-none whitespace-nowrap">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {nameLine}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {secondaryLine}
                      </div>
                    </div>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                        className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isHovered && !isSelected && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                        Click to select • Drag to move
                      </div>
                    )}

                    {(isHovered || isSelected) && (
                      <div
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-slate-400 rounded cursor-nwse-resize shadow-sm"
                        onMouseDown={(e) => handleResizeMouseDown(field.id, field.type, e)}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">{fields.length}</span>
              <span className="text-gray-600">field{fields.length !== 1 ? 's' : ''} added</span>
            </div>
            
            {fields.length > 0 && (
              <div className="h-4 w-px bg-gray-300" />
            )}
            
            {fields.length > 0 && (
              <div className="flex items-center gap-2">
                {signatories.map((sig, idx) => {
                  const count = fields.filter(f => f.signatoryIndex === idx).length;
                  if (count === 0) return null;
                  return (
                    <div
                      key={sig.email}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${sig.color}15`,
                        color: sig.color,
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sig.color }}
                      />
                      <span>{sig.name.split(' ')[0]}: {count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !validation.isValid}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={!validation.isValid ? 'Please add all required signature fields' : ''}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send for Signature
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
