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
  pageRef: React.RefObject<HTMLDivElement> | null;
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
  
  // Use refs to access latest values in global event handlers
  const fieldsRef = useRef(fields);
  const onFieldsChangeRef = useRef(onFieldsChange);
  const isDraggingRef = useRef(isDragging);
  const isResizingRef = useRef(isResizing);
  const selectedFieldRef = useRef(selectedField);
  const dragStartRef = useRef(dragStart);
  const resizeStateRef = useRef(resizeState);
  
  useEffect(() => {
    fieldsRef.current = fields;
    onFieldsChangeRef.current = onFieldsChange;
    isDraggingRef.current = isDragging;
    isResizingRef.current = isResizing;
    selectedFieldRef.current = selectedField;
    dragStartRef.current = dragStart;
    resizeStateRef.current = resizeState;
  }, [fields, onFieldsChange, isDragging, isResizing, selectedField, dragStart, resizeState]);

  const handleFieldMouseDown = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(false);
    setResizeState(null);
    onSelectField(fieldId);
    setIsDragging(true);
    const field = fields.find((f) => f.id === fieldId);
    if (field && pageRef && pageRef.current) {
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
    if (!pageRef || !pageRef.current) return;

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

  // Add global mouse event listeners for smooth dragging
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!pageRef || !pageRef.current) return;

      const currentResizeState = resizeStateRef.current;
      const currentIsResizing = isResizingRef.current;
      const currentIsDragging = isDraggingRef.current;
      const currentSelectedField = selectedFieldRef.current;
      const currentDragStart = dragStartRef.current;

      if (currentIsResizing && currentResizeState) {
        const rect = pageRef.current.getBoundingClientRect();
        const deltaXPixels = event.clientX - currentResizeState.startX;
        const deltaYPixels = event.clientY - currentResizeState.startY;
        const deltaX = deltaXPixels / scale;
        const deltaY = deltaYPixels / scale;
        
        const field = fieldsRef.current.find((f) => f.id === currentResizeState.fieldId);
        if (!field) return;

        const minSize = getMinimumDimensions(field.type);

        onFieldsChangeRef.current(
          fieldsRef.current.map((f) =>
            f.id === currentResizeState.fieldId
              ? {
                  ...f,
                  width: Math.max(minSize.width, currentResizeState.initialWidth + deltaX),
                  height: Math.max(minSize.height, currentResizeState.initialHeight + deltaY),
                }
              : f
          )
        );
        return;
      }

      if (currentIsDragging && currentSelectedField && currentDragStart) {
        const rect = pageRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const x = (mouseX - currentDragStart.x) / scale;
        const y = (mouseY - currentDragStart.y) / scale;

        const field = fieldsRef.current.find((f) => f.id === currentSelectedField);
        if (!field) return;
        
        const maxX = 612 - field.width;
        const maxY = 792 - field.height;

        onFieldsChangeRef.current(
          fieldsRef.current.map((f) =>
            f.id === currentSelectedField
              ? {
                  ...f,
                  x: Math.max(0, Math.min(x, maxX)),
                  y: Math.max(0, Math.min(y, maxY)),
                }
              : f
          )
        );
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, scale]);

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
    if (selectedField === fieldId) {
      onSelectField(null);
    }
  };

  // Filter fields for current page
  const pageFields = fields.filter((f) => f.pageNumber === currentPage);

  // Debug logging
  if (fields.length > 0 && pageFields.length === 0) {
    console.log(`[SignatureFieldOverlay] Page ${currentPage}: Found ${fields.length} total fields, but none for this page. Field page numbers:`, fields.map(f => f.pageNumber));
  }

  // Debug: Log field positions for current page
  useEffect(() => {
    if (pageFields.length > 0 && currentPage === pageFields[0]?.pageNumber) {
      console.log(`[SignatureFieldOverlay] Rendering ${pageFields.length} fields on page ${currentPage}:`, 
        pageFields.map(f => ({
          id: f.id,
          type: f.type,
          position: `(${f.x.toFixed(1)}, ${f.y.toFixed(1)})`,
          size: `${f.width.toFixed(1)}×${f.height.toFixed(1)}`,
          screenPosition: `(${(f.x * scale).toFixed(1)}px, ${(f.y * scale).toFixed(1)}px)`
        }))
      );
    }
  }, [pageFields, currentPage, scale]);

  if (pageFields.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 10, pointerEvents: isDragging || isResizing ? 'auto' : 'none' }}
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
              left: `${field.x * scale}px`,
              top: `${field.y * scale}px`,
              width: `${field.width * scale}px`,
              height: `${field.height * scale}px`,
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
              className={`absolute inset-0 rounded border-2 transition-all flex items-center justify-center ${
                isDragging ? 'cursor-grabbing' : 'cursor-move'
              }`}
              style={{
                borderColor: accentColor,
                borderStyle: isSelected ? 'solid' : 'dashed',
                borderWidth: isSelected ? '2px' : '2px',
                backgroundColor: applyAlpha(
                  accentColor,
                  isSelected ? 0.2 : isHovered ? 0.15 : 0.1
                ),
                boxShadow: isSelected
                  ? `0 4px 12px ${applyAlpha(accentColor, 0.4)}, 0 0 0 2px ${applyAlpha(accentColor, 0.2)}`
                  : isHovered
                  ? `0 2px 8px ${applyAlpha(accentColor, 0.3)}`
                  : 'none',
              }}
            >
              <div className="flex flex-col items-center justify-center px-2 text-center leading-tight">
                <span
                  className="text-[10px] font-semibold tracking-wide uppercase"
                  style={{ color: accentColor }}
                >
                  {field.type === 'signature' ? 'Signature' : 'Date'}
                </span>
                <span className="text-[9px] text-slate-600 mt-0.5">{nameLine}</span>
              </div>

              {isSelected && (
                <div
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <Move className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {isSelected && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteField(field.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-10"
                  title="Delete field"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded cursor-nwse-resize shadow-md z-10"
                  style={{ borderColor: accentColor }}
                  onMouseDown={(e) => handleResizeMouseDown(field.id, e)}
                  title="Resize"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

