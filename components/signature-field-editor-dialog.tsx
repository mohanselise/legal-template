'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PDFSignatureEditor } from './pdf-signature-editor';
import { Loader2 } from 'lucide-react';

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

interface SignatureFieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  fileId: string;
  trackingId: string;
  title: string;
  signatories: Array<{
    name: string;
    email: string;
    role: string;
    order: number;
  }>;
  onConfirmSend: (fields: SignatureField[]) => Promise<void>;
}

export function SignatureFieldEditorDialog({
  open,
  onOpenChange,
  documentId,
  fileId,
  trackingId,
  title,
  signatories,
  onConfirmSend,
}: SignatureFieldEditorDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PDF when dialog opens
  useEffect(() => {
    if (open && fileId && !pdfUrl) {
      loadPdfFromFileId(fileId);
    }
  }, [open, fileId, pdfUrl]);

  const loadPdfFromFileId = async (fileIdToLoad: string) => {
    setIsLoadingPdf(true);
    setError(null);

    try {
      // Fetch the PDF from the storage service
      const response = await fetch('/api/signature/get-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileIdToLoad }),
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load document preview. Please try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleConfirm = async (fields: SignatureField[]) => {
    try {
      await onConfirmSend(fields);
      // Clean up blob URL after successful send
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    } catch (error) {
      // Error handled by parent component
      throw error;
    }
  };

  const handleCancel = () => {
    // Clean up blob URL
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onOpenChange(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0 overflow-hidden">
        {isLoadingPdf ? (
          <div className="flex flex-col items-center justify-center h-full bg-[hsl(var(--bg))]">
            <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--selise-blue))] mb-4" />
            <p className="font-body text-[hsl(var(--brand-muted))]">Loading document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full bg-[hsl(var(--bg))] p-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md text-center">
              <p className="font-body text-red-600 font-semibold mb-4">{error}</p>
              <button
                onClick={handleCancel}
                className="font-body text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : pdfUrl ? (
          <PDFSignatureEditor
            pdfUrl={pdfUrl}
            signatories={signatories}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
