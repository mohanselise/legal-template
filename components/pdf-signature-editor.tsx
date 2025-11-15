'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Signature,
  Type,
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
  CheckCircle2
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
  initialFields?: SignatureField[];
  onConfirm: (fields: SignatureField[]) => Promise<void>;
  onCancel: () => void;
}

const SIGNATORY_COLORS = [
  '#2563eb', // Professional Blue for first signatory
  '#059669', // Emerald Green for second signatory
  '#7c3aed', // Purple for third signatory
  '#dc2626', // Red for fourth
];

const FIELD_TYPES = [
  { type: 'signature' as const, label: 'Signature', icon: Signature, defaultWidth: 200, defaultHeight: 50, color: '#fbbf24' },
  { type: 'text' as const, label: 'Full Name', icon: Type, defaultWidth: 200, defaultHeight: 36, color: '#60a5fa' },
  { type: 'date' as const, label: 'Date Signed', icon: Calendar, defaultWidth: 140, defaultHeight: 36, color: '#34d399' },
];

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
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'text' | 'date'>('signature');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
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
      // Use initialFields if provided, otherwise create default
      if (initialFields.length > 0) {
        // Update page numbers to use the actual last page
        const updatedFields = initialFields.map(field => ({
          ...field,
          pageNumber: field.pageNumber === 1 ? numPages : field.pageNumber,
        }));
        setFields(updatedFields);
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
  }, [numPages, signatories, fields.length, initialFields]);

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

  const fieldsByPage = fields.reduce((acc, field) => {
    if (!acc[field.pageNumber]) acc[field.pageNumber] = [];
    acc[field.pageNumber].push(field);
    return acc;
  }, {} as Record<number, SignatureField[]>);

  const hasFieldsOnPage = (page: number) => fieldsByPage[page]?.length > 0;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Tools Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-xl text-gray-900 mb-1">
            Add Signature Fields
          </h2>
          <p className="text-sm text-gray-500">
            Click to place fields on the document
          </p>
        </div>

        {/* Signatories */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recipients</h3>
          <div className="space-y-2">
            {signatories.map((sig, index) => {
              const fieldCount = fields.filter(f => f.signatoryIndex === index).length;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSignatoryIndex(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
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
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: sig.color }}
                  >
                    {index === 0 ? <Briefcase className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-gray-900">{sig.name}</div>
                    <div className="text-xs text-gray-500">{sig.role}</div>
                  </div>
                  {fieldCount > 0 && (
                    <div className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {fieldCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field Types */}
        <div className="p-6 border-b border-gray-200 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" />
            Field Types
          </h3>
          <div className="space-y-2">
            {FIELD_TYPES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setSelectedFieldType(type)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedFieldType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">Click to place</div>
                </div>
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-1">✨ Auto-placed fields:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Fields are positioned automatically</li>
                  <li>• Drag any field to adjust</li>
                  <li>• Add more fields as needed</li>
                  <li>• Delete unwanted fields</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <Button
            onClick={handleResetFields}
            variant="outline"
            className="w-full justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Fields
          </Button>
          <div className="text-xs text-center text-gray-500">
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
                  const Icon = getFieldIcon(field.type);
                  const isSelected = selectedField === field.id;
                  const isHovered = hoveredField === field.id;
                  const fieldType = FIELD_TYPES.find(f => f.type === field.type);

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
                      }}
                      onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
                      onMouseEnter={() => setHoveredField(field.id)}
                      onMouseLeave={() => setHoveredField(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField(field.id);
                      }}
                    >
                      {/* Field Box */}
                      <div
                        className={`absolute inset-0 rounded-md border-2 transition-all cursor-move ${
                          isSelected
                            ? 'border-blue-600 shadow-lg'
                            : isHovered
                            ? 'border-blue-400 shadow-md'
                            : 'border-gray-300 shadow-sm'
                        }`}
                        style={{
                          backgroundColor: isSelected || isHovered 
                            ? `${fieldType?.color}20` 
                            : `${fieldType?.color}15`,
                          borderColor: isSelected || isHovered ? fieldType?.color : '#d1d5db',
                        }}
                      >
                        {/* Field Content */}
                        <div className="absolute inset-0 flex items-center justify-start gap-2 px-3">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ backgroundColor: fieldType?.color }}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div 
                              className="text-xs font-semibold truncate"
                              style={{ color: fieldType?.color }}
                            >
                              {field.label}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {signatory.name}
                            </div>
                          </div>
                        </div>

                        {/* Resize Handle - bottom right */}
                        {isSelected && (
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-nwse-resize" />
                        )}

                        {/* Move Icon - top left when hovered */}
                        {(isHovered || isSelected) && (
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <Move className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
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

                      {/* Field Info Tooltip */}
                      {isHovered && !isSelected && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                          Click to select • Drag to move
                        </div>
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
                disabled={isSubmitting || fields.length === 0}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-sm"
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
