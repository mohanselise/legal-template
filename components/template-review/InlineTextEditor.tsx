"use client";

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { X, Check, Loader2, Type, FileText, List, Heading } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InlineTextEditorProps {
  /** Initial text value */
  initialText: string;
  /** Whether the dialog is open */
  open: boolean;
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
    case "effectiveDate":
      return { label: "Effective Date", Icon: Type };
    default:
      return { label: "Text", Icon: Type };
  }
}

export function InlineTextEditor({
  initialText,
  open,
  onSave,
  onCancel,
  isSaving = false,
  blockType,
  isTitle = false,
}: InlineTextEditorProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { label: blockLabel, Icon: BlockIcon } = getBlockLabel(blockType, isTitle);

  // Auto-resize function - calculates height based on content
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Temporarily set height to 0 to get accurate scrollHeight
    textarea.style.height = "0px";
    const scrollHeight = textarea.scrollHeight;
    
    // Calculate bounds
    const minHeight = isTitle ? 80 : 150;
    const maxHeight = Math.min(window.innerHeight * 0.6, 600); // 60% of viewport or 600px max
    
    // Set final height
    const finalHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${finalHeight}px`;
  }, [isTitle]);

  // Reset text when dialog opens/closes or initialText changes
  useEffect(() => {
    if (open) {
      setText(initialText);
    }
  }, [open, initialText]);

  // Auto-focus and resize when dialog opens
  useEffect(() => {
    if (!open) return;
    
    // Use multiple timeouts to ensure resize happens after render
    const timers = [
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
          resizeTextarea();
        }
      }, 50),
      // Second resize to catch any layout shifts
      setTimeout(() => resizeTextarea(), 150),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [open, initialText, resizeTextarea]);

  // Resize when text changes
  useEffect(() => {
    if (open) {
      resizeTextarea();
    }
  }, [text, open, resizeTextarea]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[1200px] w-[95vw] max-h-[85vh] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <BlockIcon className="w-4 h-4 text-[hsl(var(--selise-blue))]" />
            </div>
            <span>Edit {blockLabel}</span>
          </DialogTitle>
          <DialogDescription>
            {blockType === "effectiveDate" ? (
              <>
                Edit the label and date value. Format: "Label: value" (e.g., "Effective Date: January 15, 2024" or "Commencement Date: Upon Signature"). Press <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Esc</kbd> to cancel or <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Ctrl+Enter</kbd> to save.
              </>
            ) : (
              <>
                Make your changes below. Press <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Esc</kbd> to cancel or <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[10px]">Ctrl+Enter</kbd> to save.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-auto flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="w-full resize-none border border-[hsl(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--selise-blue))] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-[height] duration-100"
            placeholder={`Edit ${blockLabel.toLowerCase()}...`}
            style={{
              fontFamily: "inherit",
              lineHeight: 1.7,
              fontSize: 15,
              fontWeight: isTitle ? 600 : 400,
              overflowY: "auto",
            }}
          />
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || text.trim() === initialText.trim()}
            className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
