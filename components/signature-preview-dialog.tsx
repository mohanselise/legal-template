'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send, FileText, CheckCircle2, User, Briefcase } from 'lucide-react';

interface SignaturePreviewDialogProps {
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
  onConfirmSend: () => Promise<void>;
}

export function SignaturePreviewDialog({
  open,
  onOpenChange,
  trackingId,
  title,
  signatories,
  onConfirmSend,
}: SignaturePreviewDialogProps) {
  const [isSending, setIsSending] = useState(false);

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      await onConfirmSend();
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('Failed to send contract. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-white/20 dark:border-gray-700/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-white bg-linear-to-r from-green-600 to-emerald-600 -mx-6 -mt-6 px-6 py-5 rounded-t-xl mb-2 shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8" />
            Document Ready for Signature
          </DialogTitle>
          <DialogDescription className="text-lg pt-3 text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
            Your document has been prepared and signature fields have been positioned. Review the details below before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Info */}
          <div className="bg-linear-to-br from-blue-50/80 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/30 backdrop-blur-sm rounded-xl border-2 border-blue-300/60 dark:border-blue-600/40 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white drop-shadow-sm">
                Document Information
              </h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600 dark:text-gray-400 font-medium mb-1">Document Title</dt>
                <dd className="text-base font-semibold text-gray-900 dark:text-white">{title}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 font-medium mb-1">Tracking ID</dt>
                <dd className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded">{trackingId}</dd>
              </div>
            </dl>
          </div>

          {/* Signatories */}
          <div className="bg-linear-to-br from-green-50/80 to-emerald-100/60 dark:from-green-950/40 dark:to-emerald-900/30 backdrop-blur-sm rounded-xl border-2 border-green-300/60 dark:border-green-600/40 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-linear-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white drop-shadow-sm">
                Signing Order
              </h3>
            </div>
            <div className="space-y-3">
              {signatories.map((signatory, index) => (
                <div key={signatory.email} className="flex items-start gap-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-green-200/60 dark:border-green-700/40">
                  <div className="shrink-0 w-8 h-8 bg-linear-to-br from-green-600 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {signatory.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {index === 0 ? (
                        <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                      <p className="font-bold text-gray-900 dark:text-white">{signatory.name}</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{signatory.email}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{signatory.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Field Positions */}
          <div className="bg-linear-to-br from-purple-50/80 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/30 backdrop-blur-sm rounded-xl border-2 border-purple-300/60 dark:border-purple-600/40 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">
              📍 Signature Fields Positioned
            </h3>
            <p className="text-base text-gray-800 dark:text-gray-100 leading-relaxed">
              Signature boxes, name fields, and date stamps have been automatically placed on the last page of your document. Each signatory will sign in their designated area.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-linear-to-br from-blue-100/80 to-sky-100/70 dark:from-blue-900/50 dark:to-sky-900/40 backdrop-blur-sm border-2 border-blue-400/60 dark:border-blue-500/50 rounded-xl p-5 shadow-lg">
            <p className="text-base font-semibold text-blue-900 dark:text-blue-50 leading-relaxed flex items-start gap-3 drop-shadow-sm mb-3">
              <span className="text-2xl shrink-0 mt-0.5">📧</span>
              <span className="font-bold">What happens next?</span>
            </p>
            <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100 ml-11">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                Each signatory will receive an email with a secure signing link
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                They will sign in the order specified above
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                You&apos;ll receive notifications as each person signs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                The final signed document will be available for download
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="text-base font-semibold h-12 px-6 border-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSend}
            disabled={isSending}
            className="bg-linear-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-white hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-to))] text-base font-bold h-12 px-8 shadow-lg hover:shadow-xl transition-all"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Invitations...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send for Signature
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
