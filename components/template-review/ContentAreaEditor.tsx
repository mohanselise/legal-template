"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ContentArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ContentAreaEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialContentArea: ContentArea;
  onContentAreaChange: (area: ContentArea) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Default 1-inch margin (approximately 12% of page width for standard letter size)
const DEFAULT_HORIZONTAL_MARGIN_PERCENT = 0.12;

export function ContentAreaEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  initialContentArea,
  onContentAreaChange,
  onConfirm,
  onCancel,
}: ContentAreaEditorProps) {
  // Fixed horizontal margins (1-inch default)
  const fixedX = Math.round(imageWidth * DEFAULT_HORIZONTAL_MARGIN_PERCENT);
  const fixedWidth = Math.round(imageWidth * (1 - 2 * DEFAULT_HORIZONTAL_MARGIN_PERCENT));
  
  // Only y and height are adjustable
  const [contentArea, setContentArea] = useState<ContentArea>({
    x: fixedX,
    y: initialContentArea.y,
    width: fixedWidth,
    height: initialContentArea.height,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale to fit image in container
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      // Use fixed max dimensions to ensure the preview fits within the modal
      const maxWidth = 600; // Max width for preview
      const maxHeight = 500; // Max height for preview
      const scaleX = maxWidth / imageWidth;
      const scaleY = maxHeight / imageHeight;
      setScale(Math.min(scaleX, scaleY, 1)); // Don't scale up, fit within bounds
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [imageWidth, imageHeight]);

  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  const scaledArea = {
    x: contentArea.x * scale,
    y: contentArea.y * scale,
    width: contentArea.width * scale,
    height: contentArea.height * scale,
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle || 'move');
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const px = (e.clientX - rect.left) / scale;
      const py = (e.clientY - rect.top) / scale;
      setDragStart({
        x: px - contentArea.x,
        y: py - contentArea.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragHandle(null);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMoveGlobal = (e: MouseEvent) => {
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (!dragStart || !dragHandle) return;

        let newArea = { ...contentArea };

        // Only allow vertical adjustments - x and width are fixed
        if (dragHandle === 'n') {
          // Adjust top edge
          const newY = Math.max(0, Math.min(y, contentArea.y + contentArea.height - 50));
          newArea.height = contentArea.y + contentArea.height - newY;
          newArea.y = newY;
        } else if (dragHandle === 's') {
          // Adjust bottom edge
          newArea.height = Math.max(50, Math.min(y - contentArea.y, imageHeight - contentArea.y));
        }
        // Note: 'move', corner handles, and horizontal handles are disabled

        setContentArea(newArea);
        onContentAreaChange(newArea);
      };

      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, dragHandle, contentArea, scale, imageWidth, imageHeight, onContentAreaChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Drag the top or bottom edge to adjust the content area. This excludes your letterhead header and footer from the document text area.
      </div>
      
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))]/20 p-5 overflow-hidden flex items-center justify-center"
        style={{ minHeight: '400px', maxHeight: '550px' }}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={imageContainerRef}
          className="relative mx-auto"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <img
            src={imageUrl}
            alt="Letterhead preview"
            className="block"
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          />
          
          {/* Content area overlay - no move cursor since horizontal position is fixed */}
          <div
            className="absolute border-2 border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10"
            style={{
              left: scaledArea.x,
              top: scaledArea.y,
              width: scaledArea.width,
              height: scaledArea.height,
            }}
          >
            {/* Only top and bottom edge handles for vertical adjustment */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ns-resize flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'n');
              }}
            >
              <div className="w-8 h-0.5 bg-white rounded" />
            </div>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ns-resize flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 's');
              }}
            >
              <div className="w-8 h-0.5 bg-white rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="text-muted-foreground">
          Content Area: Top {Math.round(contentArea.y)}px, Bottom {Math.round(imageHeight - contentArea.y - contentArea.height)}px excluded
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

