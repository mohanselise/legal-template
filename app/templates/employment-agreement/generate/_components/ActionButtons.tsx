'use client';

import { useState } from 'react';
import { Send, Download, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onSendToSignature: () => Promise<void>;
  onDownloadDocx: () => Promise<void>;
  disabled?: boolean;
}

export function ActionButtons({ onSendToSignature, onDownloadDocx, disabled }: ActionButtonsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSendToSignature();
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadDocx();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg">
        <p className="text-sm text-[hsl(var(--brand-muted))] mb-4">
          Your employment agreement is ready! Choose how you'd like to proceed:
        </p>

        {/* Primary CTA: Send to SELISE Signature */}
        <button
          onClick={handleSend}
          disabled={disabled || isSending}
          className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--brand-primary))] text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Send via SELISE Signature
            </>
          )}
        </button>

        <p className="text-xs text-[hsl(var(--brand-muted))] text-center mt-2">
          Recommended: Send directly to signatories for electronic signatures
        </p>
      </div>

      {/* Secondary CTA: Download DOCX */}
      <button
        onClick={handleDownload}
        disabled={disabled || isDownloading}
        className="w-full flex items-center justify-center gap-2 border-2 border-[hsl(var(--border))] text-[hsl(var(--fg))] px-6 py-3 rounded-lg font-semibold hover:bg-[hsl(var(--card))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Download as DOCX
          </>
        )}
      </button>
    </div>
  );
}
