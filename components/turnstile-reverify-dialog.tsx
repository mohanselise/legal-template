'use client';

import React, { useState } from 'react';
import { Turnstile } from 'next-turnstile';
import { AlertTriangle, Check } from 'lucide-react';
import { setTurnstileToken } from '@/lib/turnstile-token-manager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface TurnstileReverifyDialogProps {
  open: boolean;
  onVerified: (token: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function TurnstileReverifyDialog({
  open,
  onVerified,
  onCancel,
  title = 'Verification Expired',
  description = 'Your verification has expired. Please verify again to continue.',
}: TurnstileReverifyDialogProps) {
  const [turnstileToken, setTurnstileTokenState] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'success' | 'error' | 'expired' | 'required'>('required');

  const handleVerify = (token: string) => {
    setTurnstileTokenState(token);
    setTurnstileStatus('success');
  };

  // Auto-close and verify when token is received
  React.useEffect(() => {
    if (turnstileStatus === 'success' && turnstileToken) {
      // Store token using token manager (imported function)
      setTurnstileToken(turnstileToken);
      // Small delay to ensure token is stored, then auto-close
      const timer = setTimeout(() => {
        onVerified(turnstileToken);
        // Reset state for next time
        setTurnstileTokenState(null);
        setTurnstileStatus('required');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turnstileStatus, turnstileToken, onVerified]);

  const handleConfirm = () => {
    if (turnstileStatus === 'success' && turnstileToken) {
      // Store token using token manager
      setTurnstileToken(turnstileToken);
      onVerified(turnstileToken);
      // Reset state for next time
      setTurnstileTokenState(null);
      setTurnstileStatus('required');
    }
  };

  const handleCancel = () => {
    setTurnstileTokenState(null);
    setTurnstileStatus('required');
    onCancel?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="flex flex-col items-center gap-4">
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <>
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  retry="auto"
                  refreshExpired="auto"
                  sandbox={false} // Using production keys
                  onError={() => {
                    setTurnstileStatus('error');
                    setTurnstileTokenState(null);
                  }}
                  onExpire={() => {
                    setTurnstileStatus('expired');
                    setTurnstileTokenState(null);
                  }}
                  onLoad={() => {
                    setTurnstileStatus('required');
                  }}
                  onVerify={(token) => {
                    handleVerify(token);
                  }}
                />
                {turnstileStatus === 'success' && turnstileToken && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <Check className="h-4 w-4" />
                    <span>Verification complete</span>
                  </div>
                )}
                {turnstileStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Verification failed. Please try again.</span>
                  </div>
                )}
                {turnstileStatus === 'expired' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Verification expired. Please verify again.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-800 font-medium mb-1">
                  Turnstile configuration missing
                </p>
                <p className="text-xs text-amber-700">
                  Please set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> in your environment variables.
                </p>
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          {turnstileStatus === 'success' && turnstileToken ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 w-full justify-center py-2">
              <Check className="h-4 w-4" />
              <span>Verification complete. Continuing...</span>
            </div>
          ) : (
            <>
              {onCancel && (
                <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
              )}
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={turnstileStatus !== 'success' || !turnstileToken}
                className="min-w-[120px]"
              >
                Continue
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

