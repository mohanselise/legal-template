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

export function ContentAreaEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  initialContentArea,
  onContentAreaChange,
  onConfirm,
  onCancel,
}: ContentAreaEditorProps) {
  const [contentArea, setContentArea] = useState<ContentArea>(initialContentArea);
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

        if (dragHandle === 'move') {
          newArea.x = Math.max(0, Math.min(x - dragStart.x, imageWidth - contentArea.width));
          newArea.y = Math.max(0, Math.min(y - dragStart.y, imageHeight - contentArea.height));
        } else if (dragHandle === 'nw') {
          const newX = Math.max(0, Math.min(x, contentArea.x + contentArea.width - 50));
          const newY = Math.max(0, Math.min(y, contentArea.y + contentArea.height - 50));
          newArea.width = contentArea.x + contentArea.width - newX;
          newArea.height = contentArea.y + contentArea.height - newY;
          newArea.x = newX;
          newArea.y = newY;
        } else if (dragHandle === 'ne') {
          const newY = Math.max(0, Math.min(y, contentArea.y + contentArea.height - 50));
          const newWidth = Math.max(50, Math.min(x - contentArea.x, imageWidth - contentArea.x));
          newArea.width = newWidth;
          newArea.height = contentArea.y + contentArea.height - newY;
          newArea.y = newY;
        } else if (dragHandle === 'sw') {
          const newX = Math.max(0, Math.min(x, contentArea.x + contentArea.width - 50));
          const newHeight = Math.max(50, Math.min(y - contentArea.y, imageHeight - contentArea.y));
          newArea.width = contentArea.x + contentArea.width - newX;
          newArea.height = newHeight;
          newArea.x = newX;
        } else if (dragHandle === 'se') {
          const newWidth = Math.max(50, Math.min(x - contentArea.x, imageWidth - contentArea.x));
          const newHeight = Math.max(50, Math.min(y - contentArea.y, imageHeight - contentArea.y));
          newArea.width = newWidth;
          newArea.height = newHeight;
        } else if (dragHandle === 'n') {
          const newY = Math.max(0, Math.min(y, contentArea.y + contentArea.height - 50));
          newArea.height = contentArea.y + contentArea.height - newY;
          newArea.y = newY;
        } else if (dragHandle === 's') {
          newArea.height = Math.max(50, Math.min(y - contentArea.y, imageHeight - contentArea.y));
        } else if (dragHandle === 'w') {
          const newX = Math.max(0, Math.min(x, contentArea.x + contentArea.width - 50));
          newArea.width = contentArea.x + contentArea.width - newX;
          newArea.x = newX;
        } else if (dragHandle === 'e') {
          newArea.width = Math.max(50, Math.min(x - contentArea.x, imageWidth - contentArea.x));
        }

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
        Drag the rectangle to adjust the content area. Use the corner and edge handles to resize.
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
          
          {/* Content area overlay */}
          <div
            className="absolute border-2 border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 cursor-move"
            style={{
              left: scaledArea.x,
              top: scaledArea.y,
              width: scaledArea.width,
              height: scaledArea.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Resize handles */}
            {/* Corner handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'nw');
              }}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-nesw-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'ne');
              }}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-nesw-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'sw');
              }}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'se');
              }}
            />
            
            {/* Edge handles */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ns-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'n');
              }}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ns-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 's');
              }}
            />
            <div
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ew-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'w');
              }}
            />
            <div
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-[hsl(var(--selise-blue))] border border-white rounded cursor-ew-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'e');
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="text-muted-foreground">
          Content Area: {Math.round(contentArea.x)}, {Math.round(contentArea.y)} - {Math.round(contentArea.width)} × {Math.round(contentArea.height)} px
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

