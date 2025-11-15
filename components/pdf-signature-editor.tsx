'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Signature,
  Type,
  Calendar,
  Trash2,
  User,
  Briefcase,
  Send,
  RotateCcw
} from 'lucide-react';

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
  onConfirm: (fields: SignatureField[]) => Promise<void>;
  onCancel: () => void;
}

const SIGNATORY_COLORS = [
  'hsl(206, 100%, 35%)', // SELISE Blue for first signatory
  'hsl(93, 46%, 19%)',   // Poly Green for second signatory
  'hsl(281, 79%, 35%)',  // Mauveine for third signatory
  'hsl(38, 92%, 50%)',   // Warning color for fourth
];

const FIELD_TYPES = [
  { type: 'signature' as const, label: 'Signature', icon: Signature, defaultWidth: 180, defaultHeight: 60 },
  { type: 'text' as const, label: 'Name', icon: Type, defaultWidth: 180, defaultHeight: 30 },
  { type: 'date' as const, label: 'Date', icon: Calendar, defaultWidth: 120, defaultHeight: 25 },
];

export function PDFSignatureEditor({
  pdfUrl,
  signatories: rawSignatories,
  onConfirm,
  onCancel
}: PDFSignatureEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState(0);
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'text' | 'date'>('signature');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Add colors to signatories - with safety check
  const signatories: Signatory[] = (rawSignatories || []).map((s, i) => ({
    ...s,
    color: SIGNATORY_COLORS[i % SIGNATORY_COLORS.length],
  }));

  // Initialize default fields on last page
  useEffect(() => {
    if (numPages > 0 && fields.length === 0) {
      const defaultFields: SignatureField[] = [];
      const lastPage = numPages;

      signatories.forEach((sig, index) => {
        const xOffset = index === 0 ? 80 : 350;
        const baseY = 600;

        // Signature field
        defaultFields.push({
          id: `sig-${index}-signature`,
          type: 'signature',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY,
          width: 180,
          height: 60,
          label: `${sig.name} - Signature`,
        });

        // Name field
        defaultFields.push({
          id: `sig-${index}-name`,
          type: 'text',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY - 60,
          width: 180,
          height: 30,
          label: `${sig.name} - Name`,
        });

        // Date field
        defaultFields.push({
          id: `sig-${index}-date`,
          type: 'date',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY + 70,
          width: 120,
          height: 25,
          label: `${sig.name} - Date`,
        });
      });

      setFields(defaultFields);
      setCurrentPage(lastPage);
    }
  }, [numPages, signatories, fields.length]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current || isDragging) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const fieldType = FIELD_TYPES.find(f => f.type === selectedFieldType);
    if (!fieldType) return;

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

    setFields([...fields, newField]);
  };

  const handleFieldMouseDown = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedField(fieldId);
    setIsDragging(true);
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setDragStart({ x: event.clientX - field.x * scale, y: event.clientY - field.y * scale });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedField || !dragStart || !pageRef.current) return;

    const x = (event.clientX - dragStart.x) / scale;
    const y = (event.clientY - dragStart.y) / scale;

    setFields(fields.map(field =>
      field.id === selectedField
        ? { ...field, x, y }
        : field
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleResetFields = () => {
    setFields([]);
    // Re-trigger default field generation
    if (numPages > 0) {
      const defaultFields: SignatureField[] = [];
      const lastPage = numPages;

      signatories.forEach((sig, index) => {
        const xOffset = index === 0 ? 80 : 350;
        const baseY = 600;

        defaultFields.push({
          id: `sig-${index}-signature-reset`,
          type: 'signature',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY,
          width: 180,
          height: 60,
          label: `${sig.name} - Signature`,
        });

        defaultFields.push({
          id: `sig-${index}-name-reset`,
          type: 'text',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY - 60,
          width: 180,
          height: 30,
          label: `${sig.name} - Name`,
        });

        defaultFields.push({
          id: `sig-${index}-date-reset`,
          type: 'date',
          signatoryIndex: index,
          pageNumber: lastPage,
          x: xOffset,
          y: baseY + 70,
          width: 120,
          height: 25,
          label: `${sig.name} - Date`,
        });
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

  const getFieldIcon = (type: SignatureField['type']) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    return fieldType?.icon || Signature;
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--bg))]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[hsl(var(--border))] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[hsl(var(--fg))]">
              Position Signature Fields
            </h2>
            <p className="font-body text-sm text-[hsl(var(--brand-muted))] mt-1">
              Click to add fields or drag to reposition them
            </p>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-body text-sm font-semibold">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-[hsl(var(--border))] mx-2" />

            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="font-body text-sm font-semibold w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              disabled={scale >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Field Type Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-body text-sm font-semibold text-[hsl(var(--fg))]">
            Add Field:
          </span>
          {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedFieldType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedFieldType === type
                  ? 'border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))] text-white'
                  : 'border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--brand-surface))]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-body text-sm font-semibold">{label}</span>
            </button>
          ))}

          <div className="w-px h-6 bg-[hsl(var(--border))] mx-2" />

          {/* Signatory Selector */}
          <span className="font-body text-sm font-semibold text-[hsl(var(--fg))]">
            For:
          </span>
          {signatories.map((sig, index) => (
            <button
              key={sig.email}
              onClick={() => setSelectedSignatoryIndex(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedSignatoryIndex === index
                  ? 'border-current text-white'
                  : 'border-[hsl(var(--border))] hover:border-current'
              }`}
              style={{
                backgroundColor: selectedSignatoryIndex === index ? sig.color : 'transparent',
                borderColor: sig.color,
                color: selectedSignatoryIndex === index ? 'white' : sig.color,
              }}
            >
              {index === 0 ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
              <span className="font-body text-sm font-semibold">{sig.name}</span>
            </button>
          ))}

          <div className="w-px h-6 bg-[hsl(var(--border))] mx-2" />

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFields}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-[hsl(var(--brand-surface))] p-8">
        <div className="max-w-5xl mx-auto">
          <div
            ref={pageRef}
            className="relative inline-block bg-white shadow-2xl cursor-crosshair"
            onClick={handlePageClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--selise-blue))]" />
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Signature Fields Overlay */}
            {fields
              .filter(field => field.pageNumber === currentPage)
              .map(field => {
                const signatory = signatories[field.signatoryIndex];
                const Icon = getFieldIcon(field.type);
                const isSelected = selectedField === field.id;

                return (
                  <div
                    key={field.id}
                    className={`absolute cursor-move border-2 rounded transition-all ${
                      isSelected
                        ? 'ring-4 ring-opacity-50'
                        : 'hover:ring-2 ring-opacity-30'
                    }`}
                    style={{
                      left: field.x * scale,
                      top: field.y * scale,
                      width: field.width * scale,
                      height: field.height * scale,
                      borderColor: signatory.color,
                      backgroundColor: `${signatory.color}33`,
                      ['--tw-ring-color' as string]: signatory.color,
                    }}
                    onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedField(field.id);
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2 text-white font-bold text-xs p-2"
                      style={{ backgroundColor: `${signatory.color}dd` }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{field.label}</span>
                    </div>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t-2 border-[hsl(var(--border))] p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="font-body text-sm text-[hsl(var(--brand-muted))]">
            <strong className="text-[hsl(var(--fg))]">{fields.length}</strong> signature field(s) positioned
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || fields.length === 0}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--sky-blue))] text-white font-bold px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
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
  );
}
