"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Check, Loader2, Type, FileText, List, Heading } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineTextEditorProps {
  /** Initial text value */
  initialText: string;
  /** Position where the editor should appear (relative to PDF page) */
  position: { x: number; y: number };
  /** Scale factor of the PDF (for positioning) */
  scale: number;
  /** Callback when user saves the edit */
  onSave: (newText: string) => Promise<void>;
  /** Callback when user cancels the edit */
  onCancel: () => void;
  /** Whether the editor is currently saving */
  isSaving?: boolean;
  /** Type of block being edited */
  blockType?: string;
  /** Whether this is a title/heading */
  isTitle?: boolean;
}

/** Get a friendly label for the block type */
function getBlockLabel(blockType?: string, isTitle?: boolean): { label: string; Icon: typeof Type } {
  if (isTitle) {
    return { label: "Heading", Icon: Heading };
  }
  
  switch (blockType) {
    case "article":
      return { label: "Article Title", Icon: Heading };
    case "section":
      return { label: "Section Title", Icon: Heading };
    case "paragraph":
      return { label: "Paragraph", Icon: FileText };
    case "list_item":
      return { label: "List Item", Icon: List };
    case "definition_item":
      return { label: "Definition", Icon: Type };
    case "table_cell":
      return { label: "Table Cell", Icon: Type };
    default:
      return { label: "Text", Icon: Type };
  }
}

export function InlineTextEditor({
  initialText,
  position,
  scale,
  onSave,
  onCancel,
  isSaving = false,
  blockType,
  isTitle = false,
}: InlineTextEditorProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { label: blockLabel, Icon: BlockIcon } = getBlockLabel(blockType, isTitle);

  // Auto-focus and select text on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      
      // Auto-resize textarea to fit content
      const resizeTextarea = () => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          const scrollHeight = textareaRef.current.scrollHeight;
          const maxHeight = 300; // Max height in pixels
          textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
      };
      
      resizeTextarea();
      textareaRef.current.addEventListener("input", resizeTextarea);
      
      return () => {
        textareaRef.current?.removeEventListener("input", resizeTextarea);
      };
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
      return;
    }
  };

  const handleSave = async () => {
    if (text.trim() !== initialText.trim() && !isSaving) {
      await onSave(text.trim());
    } else {
      onCancel();
    }
  };

  // Position the editor relative to the click position
  const editorStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x * scale}px`,
    top: `${position.y * scale}px`,
    transform: "translate(-50%, -10px)", // Center horizontally, offset slightly up
    zIndex: 1000,
    minWidth: "300px",
    maxWidth: "600px",
  };

  // Adjust position if editor would go off-screen
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedLeft = position.x * scale;
      let adjustedTop = position.y * scale;
      
      // Adjust horizontal position
      if (rect.right > viewportWidth - 20) {
        adjustedLeft = viewportWidth - rect.width - 20;
      }
      if (rect.left < 20) {
        adjustedLeft = rect.width / 2 + 20;
      }
      
      // Adjust vertical position
      if (rect.bottom > viewportHeight - 20) {
        adjustedTop = viewportHeight - rect.height - 20;
      }
      if (rect.top < 20) {
        adjustedTop = rect.height / 2 + 20;
      }
      
      if (adjustedLeft !== position.x * scale || adjustedTop !== position.y * scale) {
        containerRef.current.style.left = `${adjustedLeft}px`;
        containerRef.current.style.top = `${adjustedTop}px`;
        containerRef.current.style.transform = "translate(-50%, -10px)";
      }
    }
  }, [position, scale]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-2xl border-2 border-[hsl(var(--selise-blue))] p-4"
      style={editorStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with block type */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[hsl(var(--border))]">
        <div className="w-6 h-6 rounded bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
          <BlockIcon className="w-3.5 h-3.5 text-[hsl(var(--selise-blue))]" />
        </div>
        <span className="text-sm font-medium text-[hsl(var(--fg))]">
          Edit {blockLabel}
        </span>
      </div>
      
      <div className="flex items-start gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex-1 resize-none border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--selise-blue))] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={`Edit ${blockLabel.toLowerCase()}...`}
          rows={isTitle ? 1 : 3}
          style={{
            minHeight: isTitle ? "40px" : "60px",
            maxHeight: "300px",
            fontFamily: "inherit",
            lineHeight: "1.5",
            fontWeight: isTitle ? 600 : 400,
          }}
        />
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[hsl(var(--border))]">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="h-8"
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || text.trim() === initialText.trim()}
          className="h-8 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-2 text-xs text-[hsl(var(--globe-grey))]">
        <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Esc</kbd> to cancel •{" "}
        <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Ctrl+Enter</kbd> to save
      </div>
    </div>
  );
}
