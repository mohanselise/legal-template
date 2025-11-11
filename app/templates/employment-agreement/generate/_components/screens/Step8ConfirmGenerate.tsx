'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import type { BackgroundGenerationResult } from '../SmartFormContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { saveEmploymentAgreementReview } from '../../reviewStorage';

interface Step8ConfirmGenerateProps {
  onStartGeneration?: (task: () => Promise<BackgroundGenerationResult | null>) => void;
}

export function Step8ConfirmGenerate({ onStartGeneration }: Step8ConfirmGenerateProps) {
  const {
    formData,
    backgroundGeneration,
    cancelBackgroundGeneration,
    computeSnapshotHash,
    awaitBackgroundGeneration,
    startBackgroundGeneration,
    getBackgroundGenerationState,
  } = useSmartForm();
  const router = useRouter();

  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [acknowledgeAi, setAcknowledgeAi] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const formSnapshotHash = useMemo(
    () => computeSnapshotHash(formData),
    [computeSnapshotHash, formData]
  );

  useEffect(() => {
    setAcceptedDisclaimer(false);
    setAcknowledgeAi(false);
    setIsHumanVerified(false);
    setVerificationToken(null);
  }, [formSnapshotHash]);

  const backgroundMatches = backgroundGeneration.snapshotHash === formSnapshotHash;
  const backgroundReady =
    backgroundMatches &&
    backgroundGeneration.status === 'ready' &&
    Boolean(backgroundGeneration.result);
  const backgroundPending = backgroundMatches && backgroundGeneration.status === 'pending';
  const backgroundErrored = backgroundMatches && backgroundGeneration.status === 'error';
  const backgroundStale =
    !backgroundMatches &&
    Boolean(backgroundGeneration.snapshotHash) &&
    backgroundGeneration.status !== 'idle';

  const pendingActions: string[] = [];
  if (!acceptedDisclaimer) pendingActions.push('Accept legal disclaimer');
  if (!acknowledgeAi) pendingActions.push('Confirm AI review');
  if (!isHumanVerified) pendingActions.push('Verify you are human');
  const showPendingActions = pendingActions.length > 0;

  const shouldAutoPrefetch =
    formSnapshotHash &&
    (backgroundGeneration.status === 'idle' ||
      backgroundStale ||
      (!backgroundGeneration.snapshotHash && backgroundGeneration.status !== 'pending'));

  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoPrefetch || prefetchedRef.current) {
      return;
    }

    prefetchedRef.current = true;
    const promise = startBackgroundGeneration();
    promise
      .catch(() => {
        // error state handled via context status; no-op here
      })
      .finally(() => {
        prefetchedRef.current = false;
      });
  }, [shouldAutoPrefetch, startBackgroundGeneration]);

  const backgroundStatusMeta = useMemo(() => {
    if (backgroundReady && backgroundGeneration.result) {
      return {
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        title: 'Draft ready to review',
        description: 'We already prepared this agreement in the background. Once you complete the items below, we will open it instantly.',
      };
    }
    if (backgroundPending) {
      return {
        tone: 'border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]',
        icon: <Clock className="h-5 w-5 text-[hsl(var(--brand-primary))]" />,
        title: 'Preparing your draft',
        description: 'We are refreshing the agreement behind the scenes. Confirm these details while it finishes.',
      };
    }
    if (backgroundErrored) {
      return {
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        title: 'We will try again',
        description: 'The background draft ran into an issue. We will generate a fresh copy when you continue.',
      };
    }
    if (backgroundStale) {
      return {
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        title: 'Draft updating',
        description: 'We noticed new details. Hang tight while we refresh the agreement automatically.',
      };
    }
    return null;
  }, [backgroundReady, backgroundGeneration.result, backgroundPending, backgroundErrored, backgroundStale]);

  const handleHumanVerification = () => {
    setIsHumanVerified(true);
    setVerificationToken('placeholder-turnstile-token');
  };

  const resetHumanVerification = () => {
    setIsHumanVerified(false);
    setVerificationToken(null);
  };

  const navigateWithResult = (result: BackgroundGenerationResult) => {
    const persisted = saveEmploymentAgreementReview({
      document: result.document,
      formData: result.formDataSnapshot,
      storedAt: new Date().toISOString(),
    });

    if (persisted) {
      router.push('/templates/employment-agreement/generate/review');
      return;
    }

    const params = new URLSearchParams({
      document: JSON.stringify(result.document),
      data: JSON.stringify(result.formDataSnapshot),
    });
    router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
  };

  const handleGenerate = async () => {
    if (!acceptedDisclaimer || !acknowledgeAi || !verificationToken) {
      return;
    }

    const snapshotHash = formSnapshotHash;
    
    // This function will be called repeatedly by the polling mechanism
    // It returns the result when ready, or throws if not ready yet
    const checkBackgroundStatus = async (): Promise<BackgroundGenerationResult | null> => {
      if (!snapshotHash) {
        throw new Error('We could not verify your latest answers. Please return to the Legal step and try again.');
      }

      // Get the LATEST state from the ref (not stale component state)
      const currentBgState = getBackgroundGenerationState();
      const stateMatches = currentBgState.snapshotHash === snapshotHash;
      const isReady = stateMatches && currentBgState.status === 'ready' && Boolean(currentBgState.result);

      // Debug logging (only on first few checks)
      if (Math.random() < 0.1) { // Log 10% of checks to avoid spam
        console.log('[Status Check]', {
          status: currentBgState.status,
          stateMatches,
          isReady,
          hasResult: Boolean(currentBgState.result),
        });
      }

      // Check if result is already ready
      if (isReady && currentBgState.result) {
        console.log('✅ [Status Check] Result is ready!');
        cancelBackgroundGeneration('consumed');
        return currentBgState.result;
      }

      // If not started or errored, start it
      if (
        currentBgState.status === 'idle' ||
        currentBgState.status === 'error' ||
        !stateMatches ||
        currentBgState.status === 'stale'
      ) {
        // Start background generation (non-blocking)
        if (currentBgState.status === 'idle') {
          console.log('🚀 [Status Check] Starting background generation...');
        }
        startBackgroundGeneration().catch(() => {
          // Error will be caught by polling mechanism
        });
        throw new Error('Generation starting...');
      }

      // If pending, check if it's ready now
      if (currentBgState.status === 'pending') {
        const awaited = await awaitBackgroundGeneration(snapshotHash, 100); // Short timeout for polling
        if (awaited && awaited.document) {
          console.log('✅ [Status Check] Result retrieved from await!');
          cancelBackgroundGeneration('consumed');
          return awaited;
        }
        throw new Error('Still generating...');
      }

      throw new Error('Unexpected state');
    };

    if (onStartGeneration) {
      // Pass the status checker to the parent component for polling
      onStartGeneration(checkBackgroundStatus);
      return;
    }

    // Fallback: direct navigation (shouldn't happen in SmartFlowV2)
    try {
      // Try to get result with longer timeout
      const awaited = await awaitBackgroundGeneration(snapshotHash, 60000);
      if (awaited && awaited.document) {
        cancelBackgroundGeneration('consumed');
        navigateWithResult(awaited);
      } else {
        throw new Error('Failed to generate agreement. Please try again.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to open your draft. Please return to the Legal step and try again.'
      );
    }
  };

  const buttonLabel = backgroundReady
    ? 'Review Your Agreement'
    : backgroundPending
      ? 'Continue to Review'
      : 'Generate Employment Agreement';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))]">
          Before we generate
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Confirm these quick items while your draft finishes preparing.
        </p>
      </div>

      {backgroundStatusMeta && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${backgroundStatusMeta.tone}`}>
          <div className="mt-1">{backgroundStatusMeta.icon}</div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{backgroundStatusMeta.title}</p>
            <p className="text-sm">{backgroundStatusMeta.description}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition ${
            acceptedDisclaimer
              ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05]'
              : 'border-[hsl(var(--brand-border))] bg-white'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={acceptedDisclaimer}
            onChange={(event) => setAcceptedDisclaimer(event.target.checked)}
          />
          <span>
            These templates are provided for informational purposes only and do not constitute legal advice.
          </span>
        </label>

        <label
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition ${
            acknowledgeAi
              ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05]'
              : 'border-[hsl(var(--brand-border))] bg-white'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={acknowledgeAi}
            onChange={(event) => setAcknowledgeAi(event.target.checked)}
          />
          <span>
            I understand this agreement was generated by AI and I will review the contract carefully before use.
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-[hsl(var(--brand-border))] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--fg))]">Human verification</p>
            <p className="text-xs text-[hsl(var(--brand-muted))]">
              Cloudflare Turnstile will live here to confirm you&apos;re a person.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isHumanVerified ? (
              <>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetHumanVerification}
                >
                  Reset
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleHumanVerification}
              >
                Verify I am human (placeholder)
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          TODO: swap this placeholder for the Cloudflare Turnstile widget.
        </p>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleGenerate}
          disabled={!acceptedDisclaimer || !acknowledgeAi || !verificationToken}
          className="w-full py-6 text-lg font-semibold"
          size="lg"
        >
          {buttonLabel}
        </Button>
        {showPendingActions && (
          <p className="mt-3 text-xs text-muted-foreground">
            Complete before continuing: {pendingActions.join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
