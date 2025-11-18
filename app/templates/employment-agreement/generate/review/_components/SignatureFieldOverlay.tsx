'use client';

import { useState, useRef, useEffect } from 'react';
import { Move, Trash2, Signature, Calendar } from 'lucide-react';
import { SIGNATURE_LAYOUT, SIGNATURE_FIELD_DEFAULTS } from '@/lib/pdf/signature-field-metadata';

export interface SignatureField {
  id: string;
  type: 'signature' | 'date';
  signatoryIndex: number; // 0 = employer, 1 = employee
  pageNumber: number; // 1-indexed
  x: number; // PDF points
  y: number; // PDF points
  width: number; // PDF points
  height: number; // PDF points
  label?: string;
}

interface Signatory {
  name: string;
  email: string;
  role: string;
  color: string;
}

interface SignatureFieldOverlayProps {
  fields: SignatureField[];
  signatories: Signatory[];
  currentPage: number;
  scale: number;
  pageRef: React.RefObject<HTMLDivElement>;
  onFieldsChange: (fields: SignatureField[]) => void;
  selectedField: string | null;
  onSelectField: (fieldId: string | null) => void;
  selectedSignatoryIndex: number;
  selectedFieldType: 'signature' | 'date';
  onPageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const PARTY_COLORS = {
  employer: '#0066B2', // SELISE Blue
  employee: '#2A4D14', // Poly Green
};

const SIGNATORY_COLORS = [
  PARTY_COLORS.employer,
  PARTY_COLORS.employee,
  '#7c3aed', // Purple for third
  '#dc2626', // Red for fourth
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

const getMinimumDimensions = (type: SignatureField['type']) => {
  switch (type) {
    case 'signature':
      return { width: 140, height: 48 };
    case 'date':
      return { width: 110, height: 34 };
    default:
      return { width: 140, height: 34 };
  }
};

export function SignatureFieldOverlay({
  fields,
  signatories,
  currentPage,
  scale,
  pageRef,
  onFieldsChange,
  selectedField,
  onSelectField,
  selectedSignatoryIndex,
  selectedFieldType,
  onPageClick,
}: SignatureFieldOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<{
    fieldId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const handleFieldMouseDown = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(false);
    setResizeState(null);
    onSelectField(fieldId);
    setIsDragging(true);
    const field = fields.find((f) => f.id === fieldId);
    if (field && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      // Calculate offset from mouse position to field top-left corner
      // Field position in screen pixels: field.x * scale, field.y * scale
      const fieldScreenX = field.x * scale;
      const fieldScreenY = field.y * scale;
      setDragStart({
        x: event.clientX - rect.left - fieldScreenX,
        y: event.clientY - rect.top - fieldScreenY,
      });
    }
  };

  const handleResizeMouseDown = (
    fieldId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    onSelectField(fieldId);
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(true);
    setResizeState({
      fieldId,
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: field.width,
      initialHeight: field.height,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;

    if (isResizing && resizeState) {
      // Convert pixel delta to PDF points (divide by scale)
      const deltaXPixels = event.clientX - resizeState.startX;
      const deltaYPixels = event.clientY - resizeState.startY;
      const deltaX = deltaXPixels / scale;
      const deltaY = deltaYPixels / scale;
      
      const field = fields.find((f) => f.id === resizeState.fieldId);
      if (!field) return;

      const minSize = getMinimumDimensions(field.type);

      onFieldsChange(
        fields.map((f) =>
          f.id === resizeState.fieldId
            ? {
                ...f,
                width: Math.max(minSize.width, resizeState.initialWidth + deltaX),
                height: Math.max(minSize.height, resizeState.initialHeight + deltaY),
              }
            : f
        )
      );
      return;
    }

    if (!isDragging || !selectedField || !dragStart) return;

    const rect = pageRef.current.getBoundingClientRect();
    
    // Get mouse position relative to page container
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert screen pixels to PDF points (divide by scale)
    const x = (mouseX - dragStart.x) / scale;
    const y = (mouseY - dragStart.y) / scale;

    // Ensure fields stay within page bounds (612pt × 792pt)
    const field = fields.find((f) => f.id === selectedField);
    if (!field) return;
    
    const maxX = 612 - field.width;
    const maxY = 792 - field.height;

    onFieldsChange(
      fields.map((f) =>
        f.id === selectedField
          ? {
              ...f,
              x: Math.max(0, Math.min(x, maxX)),
              y: Math.max(0, Math.min(y, maxY)),
            }
          : f
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
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
    if (selectedField === fieldId) {
      onSelectField(null);
    }
  };

  // Filter fields for current page
  const pageFields = fields.filter((f) => f.pageNumber === currentPage);

  // Debug logging
  useEffect(() => {
    console.log('SignatureFieldOverlay render:', {
      totalFields: fields.length,
      pageFields: pageFields.length,
      currentPage,
      fields: fields.map(f => ({ id: f.id, page: f.pageNumber, type: f.type }))
    });
  }, [fields, currentPage, pageFields.length]);

  if (pageFields.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onPageClick}
    >
      {pageFields.map((field) => {
        const signatory = signatories[field.signatoryIndex];
        const isSelected = selectedField === field.id;
        const isHovered = hoveredField === field.id;
        const accentColor = signatory?.color || SIGNATORY_COLORS[field.signatoryIndex] || '#0066B2';
        const nameLine = signatory?.name || 'Signatory';
        const secondaryLine =
          field.type === 'signature'
            ? signatory?.role || 'Authorized Signature'
            : 'Signature Date';

        return (
          <div
            key={field.id}
            className={`absolute group transition-all pointer-events-auto ${
              isSelected ? 'z-50' : isHovered ? 'z-40' : 'z-30'
            }`}
            style={{
              left: `${(field.x / 612) * (612 * scale)}px`,
              top: `${(field.y / 792) * (792 * scale)}px`,
              width: `${(field.width / 612) * (612 * scale)}px`,
              height: `${(field.height / 792) * (792 * scale)}px`,
              overflow: 'visible',
            }}
            onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
            onMouseEnter={() => setHoveredField(field.id)}
            onMouseLeave={() => setHoveredField(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(field.id);
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
                  {field.type === 'signature' ? 'Signature' : 'Date'}
                </span>
                <span className="text-[11px] text-slate-600">({nameLine})</span>
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
              <div className="text-[11px] font-semibold text-slate-800">{nameLine}</div>
              <div className="text-[10px] text-slate-500">{secondaryLine}</div>
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
                onMouseDown={(e) => handleResizeMouseDown(field.id, e)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

