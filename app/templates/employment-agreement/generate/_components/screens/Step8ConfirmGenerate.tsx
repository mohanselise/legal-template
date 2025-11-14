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
  } = useSmartForm();
  const router = useRouter();

  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [acknowledgeAi, setAcknowledgeAi] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [manualGenerating, setManualGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const formSnapshotHash = useMemo(
    () => computeSnapshotHash(formData),
    [computeSnapshotHash, formData]
  );

  useEffect(() => {
    setAcceptedDisclaimer(false);
    setAcknowledgeAi(false);
    setIsHumanVerified(false);
    setVerificationToken(null);
    setManualGenerating(false);
    setGenerationError(null);
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
  const showPendingActions = !manualGenerating && pendingActions.length > 0;

  // REMOVED auto-prefetch logic to prevent double API calls
  // Generation should only be triggered from Step 6 "Continue" button
  // This component will consume the result that was started in Step 6

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

    // Clear previous errors
    setGenerationError(null);

    const snapshotHash = formSnapshotHash;
    const resolveBackgroundDraft = async (): Promise<BackgroundGenerationResult> => {
      if (!snapshotHash) {
        throw new Error('We could not verify your latest answers. Please return to the Legal step and try again.');
      }

      console.log('[Step8] Resolving background draft. Status:', backgroundGeneration.status, 'Matches:', backgroundMatches);

      // Case 1: Background generation already completed successfully
      if (backgroundReady && backgroundGeneration.result) {
        console.log('[Step8] Using ready background result');
        const readyResult = backgroundGeneration.result;
        cancelBackgroundGeneration('consumed');
        return readyResult;
      }

      // Case 2: Background generation is still pending with matching hash - just wait for it
      if (backgroundGeneration.status === 'pending' && backgroundMatches) {
        console.log('[Step8] Background generation in progress, waiting...');
        // Just await the existing generation, don't start a new one
        const awaited = await awaitBackgroundGeneration(snapshotHash, 90000);
        if (awaited && awaited.document) {
          console.log('[Step8] Background generation completed successfully');
          cancelBackgroundGeneration('consumed');
          return awaited;
        }
        throw new Error('The draft is taking longer than expected. Please try again or contact support if this persists.');
      }

      // Case 3: No generation or stale/error state - start a new one
      if (
        backgroundGeneration.status === 'idle' ||
        backgroundGeneration.status === 'error' ||
        !backgroundMatches ||
        backgroundGeneration.status === 'stale'
      ) {
        console.log('[Step8] Starting new generation');
        try {
          await startBackgroundGeneration();
        } catch (error) {
          throw new Error(
            error instanceof Error
              ? error.message
              : 'We could not start preparing your draft. Please try again.'
          );
        }

        // Wait for the newly started generation
        console.log('[Step8] Awaiting newly started generation...');
        const awaited = await awaitBackgroundGeneration(snapshotHash, 90000);
        if (awaited && awaited.document) {
          console.log('[Step8] Background generation completed successfully');
          cancelBackgroundGeneration('consumed');
          return awaited;
        }
        throw new Error('The draft is taking longer than expected. Please try again or contact support if this persists.');
      }

      // Case 4: Fallback - this shouldn't happen
      throw new Error('Unexpected state. Please try again.');
    };

    if (onStartGeneration) {
      setManualGenerating(true);
      onStartGeneration(async () => {
        try {
          const result = await resolveBackgroundDraft();
          return result;
        } catch (error) {
          console.error('[Step8] Generation error in onStartGeneration:', error);
          // Re-throw the error so the loading screen can handle it
          // Don't set generationError here because we're not on Step8 anymore
          throw error;
        } finally {
          setManualGenerating(false);
        }
      });
      return;
    }

    setManualGenerating(true);
    try {
      const result = await resolveBackgroundDraft();
      navigateWithResult(result);
    } catch (error) {
      console.error('[Step8] Generation error:', error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Failed to open your draft. Please return to the Legal step and try again.'
      );
    } finally {
      setManualGenerating(false);
    }
  };

  const buttonLabel = manualGenerating
    ? 'Generating your agreement...'
    : backgroundReady
      ? 'Review Prefetched Draft'
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

      {generationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900 mb-1">Generation failed</p>
              <p className="text-sm text-red-800">{generationError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGenerationError(null);
                  handleGenerate();
                }}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button
          onClick={handleGenerate}
          disabled={!acceptedDisclaimer || !acknowledgeAi || !verificationToken || manualGenerating}
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
