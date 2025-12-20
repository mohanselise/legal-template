'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, FileText, Check, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SmartFormProvider, useSmartForm } from './SmartFormContext';
import type { BackgroundGenerationResult } from './SmartFormContext';
import { saveEmploymentAgreementReview } from '../reviewStorage';
import { Step1CompanyIdentity } from './screens/Step1CompanyIdentity';
import { Step2EmployeeIdentity } from './screens/Step2EmployeeIdentity';
import { Step3SigningInfo } from './screens/Step3SigningInfo';
import { Step3WorkArrangement } from './screens/Step3WorkArrangement';
import { Step4Compensation } from './screens/Step4Compensation';
import { Step6LegalTerms } from './screens/Step6LegalTerms';
import { Step7Review } from './screens/Step7Review';
import { Step8ConfirmGenerate } from './screens/Step8ConfirmGenerate';
import { Button } from '@/components/ui/button';
import { getJurisdictionShortName } from './utils/jurisdiction';
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
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { Turnstile } from 'next-turnstile';
import { setTurnstileToken as storeTurnstileToken } from '@/lib/turnstile-token-manager';

const STEPS = [
  { id: 'company', title: 'Company & Role', component: Step1CompanyIdentity },
  { id: 'employee', title: 'Employee', component: Step2EmployeeIdentity },
  { id: 'signing', title: 'Signing', component: Step3SigningInfo },
  { id: 'work', title: 'Work', component: Step3WorkArrangement },
  { id: 'compensation', title: 'Compensation', component: Step4Compensation },
  { id: 'legal', title: 'Legal', component: Step6LegalTerms },
  { id: 'review', title: 'Review', component: Step7Review },
  { id: 'confirm', title: 'Confirm', component: Step8ConfirmGenerate },
];

// Steps where "Use Market Standard" button should appear (Work, Compensation, Legal)
const MARKET_STANDARD_STEPS = [3, 4, 5];

// Loading stages for document generation
type GenerationStage = {
  title: string;
  description: string;
  progress: number;
  duration: number;
};

const GENERATION_STEPS: GenerationStage[] = [
  {
    title: 'Analyzing your requirements',
    description: 'Reviewing parties, role details, compensation, and employment terms to ensure completeness.',
    progress: 12,
    duration: 3200,
  },
  {
    title: 'Drafting core provisions',
    description: 'Crafting employment terms, duties, and compensation clauses with precise legal language.',
    progress: 28,
    duration: 3800,
  },
  {
    title: 'Building protective clauses',
    description: 'Generating confidentiality, IP assignment, and restrictive covenant provisions tailored to your needs.',
    progress: 45,
    duration: 4200,
  },
  {
    title: 'Structuring articles & recitals',
    description: 'Organizing sections, adding recitals, and formatting signature blocks for professional presentation.',
    progress: 62,
    duration: 4000,
  },
  {
    title: 'Generating PDF document',
    description: 'Converting the agreement to PDF format with proper formatting, signatures, and legal structure.',
    progress: 80,
    duration: 4800,
  },
  {
    title: 'Quality assurance',
    description: 'Verifying defined terms, cross-references, dates, and legal consistency throughout the document.',
    progress: 92,
    duration: 3600,
  },
  {
    title: 'Finalizing document',
    description: 'Applying final formatting touches and preparing your employment agreement for review.',
    progress: 98,
    duration: 2400,
  },
];

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

function NavigationButtons({
  currentStep,
  totalSteps,
  canContinue,
  onNext,
  onPrevious,
}: NavigationButtonsProps) {
  const {
    enrichment,
    applyMarketStandards,
    formData,
    updateFormData,
    analyzeCompanyAndRole,
    startBackgroundGeneration,
  } = useSmartForm();
  const [showSalaryWarning, setShowSalaryWarning] = useState(false);
  const [isApplyingStandards, setIsApplyingStandards] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  const marketStandards = enrichment.marketStandards;
  const jurisdictionName = getJurisdictionShortName(enrichment.jurisdictionData);

  const showMarketStandardButton =
    MARKET_STANDARD_STEPS.includes(currentStep) && marketStandards;

  // Show loading placeholder if we have jurisdiction but no standards yet (still loading)
  const showLoadingPlaceholder =
    MARKET_STANDARD_STEPS.includes(currentStep) &&
    !marketStandards &&
    enrichment.jurisdictionData &&
    enrichment.jobTitleData;

  const isCompensationStep = currentStep === 4; // Step 5 (Compensation) is now index 4
  const isLegalStep = STEPS[currentStep]?.id === 'legal';
  const hasSalaryAmount = formData.salaryAmount && formData.salaryAmount.trim() !== '';
  const isPlaceholderSalary = formData.salaryAmount === '[TO BE DETERMINED]' || formData.salaryAmount === '[OMITTED]';
  const isNumericSalary = hasSalaryAmount && !isPlaceholderSalary;

  const handleUseMarketStandard = () => {
    // Show warning if on compensation step and no salary entered (and no placeholder set)
    if (isCompensationStep && !hasSalaryAmount) {
      setShowSalaryWarning(true);
      return;
    }

    if (marketStandards) {
      setIsApplyingStandards(true);
      applyMarketStandards(marketStandards);
      if (isLegalStep) {
        void startBackgroundGeneration();
      }

      // Show success feedback briefly
      setShowSuccessFeedback(true);
      setTimeout(() => {
        setShowSuccessFeedback(false);
        setIsApplyingStandards(false);
        onNext();
      }, 800);
    }
  };

  const handleProceedWithoutSalary = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
      setShowSalaryWarning(false);
      setTimeout(() => {
        onNext();
      }, 300);
    }
  };

  const handleUsePlaceholder = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
      updateFormData({ salaryAmount: '[TO BE DETERMINED]' });
      setShowSalaryWarning(false);
      setTimeout(() => {
        onNext();
      }, 300);
    }
  };

  const handleContinue = () => {
    // If on compensation step without salary, show warning dialog
    if (isCompensationStep && !hasSalaryAmount) {
      setShowSalaryWarning(true);
      return;
    }

    // If on company step (step 0), trigger combined analysis in background (don't wait for it)
    if (currentStep === 0 && formData.companyName && formData.companyAddress && formData.jobTitle) {
      analyzeCompanyAndRole(
        formData.companyName, 
        formData.companyAddress,
        formData.jobTitle,
        formData.jobResponsibilities
      );
    }
    // If on legal step (step 5), kick off background generation before moving forward
    if (isLegalStep && canContinue) {
      void startBackgroundGeneration();
    }
    // Move to next step immediately without waiting
    onNext();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
        {/* Left side - Back button */}
        {currentStep > 0 ? (
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {/* Right side - Market Standard + Continue buttons */}
        <div className="flex items-center gap-3">
          {/* Loading placeholder */}
          {showLoadingPlaceholder && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              <span>Preparing standards...</span>
            </div>
          )}

          {/* Market standard button */}
          {showMarketStandardButton && (
            <Button
              variant="ghost"
              onClick={handleUseMarketStandard}
              disabled={isApplyingStandards}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground relative"
            >
              {showSuccessFeedback ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Applied!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Use {jurisdictionName} standard
                </>
              )}
            </Button>
          )}

          {currentStep < totalSteps - 1 && (
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex items-center gap-3 px-8 py-4"
              size="lg"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Salary Warning Dialog */}
      <AlertDialog open={showSalaryWarning} onOpenChange={setShowSalaryWarning}>
        <AlertDialogContent className="max-w-md sm:max-w-lg">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <AlertDialogTitle className="text-xl font-bold text-foreground">
                  Salary amount missing
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed">
                  The final agreement will be generated without salary information. Choose how you&apos;d like to proceed:
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSalaryWarning(false)}
              className="w-full justify-start h-auto py-4 px-5 border-2 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  ← Go back and enter salary
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  Recommended for a complete agreement
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleUsePlaceholder}
              className="w-full justify-start h-auto py-4 px-5 border-2 hover:border-muted-foreground/30 hover:bg-muted/50 transition-all"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-base mb-1">Add placeholder</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  Shows &quot;[TO BE DETERMINED]&quot; in document
                </div>
              </div>
            </Button>

            <Button
              variant="ghost"
              onClick={handleProceedWithoutSalary}
              className="w-full justify-start h-auto py-4 px-5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-base mb-1">Skip salary entirely</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                  No salary mention in final document
                </div>
              </div>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SmartFlowContent() {
  const { currentStep, totalSteps, nextStep, previousStep, formData } = useSmartForm();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const generationTaskRef = useRef<(() => Promise<BackgroundGenerationResult | null>) | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'success' | 'error' | 'expired' | 'required'>('required');

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const resetLoadingState = useCallback(() => {
    setIsGenerating(false);
    setGenerationStepIndex(0);
    setFakeProgress(0);
    setGenerationError(null);
    generationTaskRef.current = null;
  }, []);

  const beginManualGeneration = useCallback(
    (task: () => Promise<BackgroundGenerationResult | null>) => {
      generationTaskRef.current = task;
      setGenerationStepIndex(0);
      setFakeProgress(0);
      setGenerationError(null);
      setIsGenerating(true);
    },
    []
  );

  // Basic validation for each step
  const canContinue = (): boolean => {
    switch (currentStep) {
      case 0: // Company & Role
        return !!(formData.companyName && formData.companyAddress && formData.jobTitle);
      case 1: // Employee
        return !!(formData.employeeName && formData.employeeAddress && formData.startDate);
      case 2: // Signing Info
        return !!(
          formData.employeeEmail &&
          formData.companyRepName &&
          formData.companyRepTitle &&
          formData.companyRepEmail &&
          formData.employeeEmail.trim().toLowerCase() !== formData.companyRepEmail.trim().toLowerCase()
        );
      case 3: // Work
        // Work location is optional for remote workers
        const workLocationValid = formData.workArrangement === 'remote' || formData.workLocation;
        return !!(workLocationValid && formData.workHoursPerWeek);
      case 4: // Compensation
        // Currency is required, but salary can be empty (will show dialog)
        return !!formData.salaryCurrency;
      case 5: // Legal
        return !!formData.governingLaw;
      case 6: // Review
        return true;
      default:
        return false;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showWelcome && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (turnstileStatus === 'success' && turnstileToken) {
          // Token already stored in onVerify callback
          setShowWelcome(false);
        }
        return;
      }
      if (e.key === 'Enter' && !showWelcome && canContinue() && currentStep < totalSteps - 1) {
        nextStep();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showWelcome, currentStep, formData, canContinue, nextStep, turnstileStatus, turnstileToken]);

  // Loading animation for document generation
  useEffect(() => {
    if (!isGenerating) return;

    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;
    let isNavigating = false;
    let startTime: number;

    const currentStage = GENERATION_STEPS[generationStepIndex];

    // Animate fake progress for this stage with non-linear easing
    const startProgress = generationStepIndex > 0 ? GENERATION_STEPS[generationStepIndex - 1].progress : 0;
    const targetProgress = currentStage.progress;
    const progressRange = targetProgress - startProgress;

    // Easing function: ease-in-out-cubic for smooth, non-linear progress
    const easeInOutCubic = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    startTime = Date.now();

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const normalizedTime = Math.min(elapsed / currentStage.duration, 1);
      const easedTime = easeInOutCubic(normalizedTime);
      const currentProgress = startProgress + (progressRange * easedTime);

      setFakeProgress(currentProgress);

      if (normalizedTime >= 1) {
        clearInterval(progressInterval);
        setFakeProgress(targetProgress);
      }
    }, 16); // ~60fps for smoother animation

    // Poll for result availability - check every 500ms
    const navigateWithResult = async (result: BackgroundGenerationResult) => {
      if (isNavigating) return;
      isNavigating = true;

      const persisted = saveEmploymentAgreementReview({
        document: result.document,
        formData: result.formDataSnapshot,
        storedAt: new Date().toISOString(),
      });

      resetLoadingState();

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

    pollInterval = setInterval(async () => {
      if (isNavigating) return;

      const task = generationTaskRef.current;
      if (!task) return;

      try {
        const result = await task();
        if (result && result.document) {
          // Result is ready! Navigate immediately, don't wait for animation
          console.log('✅ [Loading] Generation complete! Navigating to review...');
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          clearTimeout(stepTimeout);
          await navigateWithResult(result);
        }
      } catch (error) {
        // Task not ready yet or error - continue polling
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Only log if it's not a "still generating" message
        if (!errorMessage.includes('Still generating') && !errorMessage.includes('Generation starting')) {
          console.log('[Loading] Poll check:', errorMessage);
        }

        // Only show error if we're on the last animation step and it's a real error
        if (generationStepIndex >= GENERATION_STEPS.length - 1 &&
            !errorMessage.includes('Still generating') &&
            !errorMessage.includes('Generation starting')) {
          console.error('❌ [Loading] Generation error:', error);
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          clearTimeout(stepTimeout);
          alert('Failed to generate agreement. Please try again.');
          resetLoadingState();
        }
      }
    }, 500);

    // Move to next stage after duration (for visual feedback)
    stepTimeout = setTimeout(() => {
      if (!isNavigating && generationStepIndex < GENERATION_STEPS.length - 1) {
        setGenerationStepIndex((prev) => prev + 1);
      }
    }, currentStage.duration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pollInterval);
      clearTimeout(stepTimeout);
    };
  }, [isGenerating, generationStepIndex, resetLoadingState, router]);

  // Loading Screen
  if (isGenerating || generationError) {
    const currentStage = GENERATION_STEPS[generationStepIndex];

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--bg))] px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.14),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.08),_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12 space-y-5 text-center"
          >
            <motion.div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-[hsl(var(--brand-primary)/0.2)] bg-gradient-to-br from-[hsl(var(--brand-primary)/0.1)] to-[hsl(var(--brand-primary)/0.05)] shadow-lg backdrop-blur-sm"
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 10px 25px -5px hsla(var(--brand-primary)/0.1)',
                  '0 15px 35px -5px hsla(var(--brand-primary)/0.2)',
                  '0 10px 25px -5px hsla(var(--brand-primary)/0.1)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <FileText className="h-12 w-12 text-[hsl(var(--brand-primary))]" />
              </motion.div>
            </motion.div>
            <h2 className="text-4xl font-semibold text-[hsl(var(--fg))] md:text-5xl font-heading tracking-tight">
              Generating your agreement
            </h2>
            <p className="text-lg text-[hsl(var(--brand-muted))] leading-relaxed">
              Please wait while we craft your employment agreement
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between text-sm font-medium">
              <span className="text-[hsl(var(--fg))]">{Math.round(fakeProgress)}% complete</span>
              <span className="text-[hsl(var(--brand-muted))]">Step {generationStepIndex + 1} of {GENERATION_STEPS.length}</span>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full border border-[hsl(var(--brand-primary)/0.25)] bg-[hsl(var(--brand-primary)/0.08)] shadow-inner">
              {/* Animated background shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--brand-primary)/0.15)] to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              {/* Progress fill */}
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-primary))] via-[hsl(var(--brand-primary)/0.9)] to-[hsl(var(--brand-primary))] shadow-lg"
                style={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Glowing edge */}
              <motion.div
                className="absolute left-0 top-0 h-full w-2 rounded-full bg-white/60 blur-sm"
                style={{ left: `${fakeProgress}%`, marginLeft: '-4px' }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Moving dot indicator */}
              <motion.div
                className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--brand-primary))] shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_4px_12px_hsla(206,100%,35%,0.5)]"
                style={{ left: `${fakeProgress}%`, marginLeft: '-10px' }}
                animate={{
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 3px rgba(255,255,255,0.5), 0 4px 12px hsla(206,100%,35%,0.5)',
                    '0 0 0 4px rgba(255,255,255,0.6), 0 6px 16px hsla(206,100%,35%,0.6)',
                    '0 0 0 3px rgba(255,255,255,0.5), 0 4px 12px hsla(206,100%,35%,0.5)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </div>

          {/* Error Display */}
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-2 text-xl font-semibold text-red-900 font-heading">
                    Generation failed
                  </h3>
                  <p className="mb-4 leading-relaxed text-red-800">
                    {generationError}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setGenerationError(null);
                        previousStep();
                      }}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go back
                    </Button>
                    <Button
                      onClick={() => {
                        resetLoadingState();
                        // Re-trigger generation from Step 8
                        nextStep();
                      }}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Current Stage Info */}
          {!generationError && (
            <AnimatePresence mode="wait">
              <motion.div
                key={generationStepIndex}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-[hsl(var(--brand-border))] bg-gradient-to-br from-background to-[hsl(var(--brand-primary)/0.02)] p-8 shadow-lg backdrop-blur-sm"
              >
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[hsl(var(--brand-primary)/0.2)] bg-gradient-to-br from-[hsl(var(--brand-primary)/0.1)] to-[hsl(var(--brand-primary)/0.05)] shadow-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-7 w-7 text-[hsl(var(--brand-primary))]" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-2 text-xl font-semibold text-[hsl(var(--fg))] font-heading tracking-tight">
                    {currentStage.title}
                  </h3>
                  <p className="leading-relaxed text-[hsl(var(--brand-muted))] text-base">
                    {currentStage.description}
                  </p>
                </div>
              </div>

              {/* Stage checklist */}
              <div className="mt-7 space-y-3">
                {GENERATION_STEPS.map((stage, index) => {
                  const isCompleted = index < generationStepIndex;
                  const isCurrent = index === generationStepIndex;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                        isCompleted
                          ? 'text-[hsl(var(--brand-primary))]'
                          : isCurrent
                          ? 'text-[hsl(var(--fg))] font-medium'
                          : 'text-[hsl(var(--muted-foreground))]'
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white"
                        >
                          <Check className="h-3 w-3" />
                        </motion.div>
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="h-5 w-5 rounded-full border-2 border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)]"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-border)/0.3)]" />
                      )}
                      <span className={isCurrent ? 'font-medium' : ''}>{stage.title}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
          )}

          {/* Bottom hint */}
          {!generationError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-sm text-[hsl(var(--brand-muted))]"
            >
              This typically takes 25-30 seconds
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="relative min-h-screen overflow-y-auto bg-[hsl(var(--bg))] px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.18),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.1),_transparent_65%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto w-full max-w-4xl rounded-3xl border border-[hsl(var(--brand-border))] bg-background p-10 text-center shadow-xl backdrop-blur-sm"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(var(--brand-border))] bg-muted shadow-sm">
            <Sparkles className="h-10 w-10 text-[hsl(var(--brand-primary))]" />
          </div>
          <h1 className="mb-6 text-5xl font-semibold text-[hsl(var(--fg))] md:text-6xl font-heading">
            Smart Employment Agreement
          </h1>
          <p className="mb-12 text-xl leading-relaxed text-[hsl(var(--brand-muted))]">
            AI-powered form that adapts to your jurisdiction and role.
            <br />
            <span className="text-[hsl(var(--brand-muted))]">Fast, smart, and tailored to your needs.</span>
          </p>
          <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex items-center gap-3 text-base text-[hsl(var(--fg))]">
              <Check className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <span>7 smart screens</span>
            </div>
            <div className="flex items-center gap-3 text-base text-[hsl(var(--fg))]">
              <Check className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <span>Market standards applied</span>
            </div>
            <div className="flex items-center gap-3 text-base text-[hsl(var(--fg))]">
              <Check className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <span>~3-4 minutes</span>
            </div>
          </div>

          {/* Disclaimer - Before user starts */}
          <div className="mb-8 rounded-2xl border border-[hsl(var(--brand-border))] bg-muted p-6 text-left shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">Before You Begin</h3>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
              <p><strong className="text-[hsl(var(--brand-primary))]">Not Legal Advice:</strong> This tool does not provide legal advice and generates documents for informational purposes only.</p>
              <p><strong className="text-[hsl(var(--brand-primary))]">AI-Generated:</strong> AI is inaccurate by nature. Content may contain errors or omissions.</p>
              <p><strong className="text-[hsl(var(--brand-primary))]">Review Required:</strong> Always consult a qualified legal advisor before using any generated document.</p>
            </div>
          </div>

          {/* Human Verification */}
          <div className="mb-8 rounded-2xl border border-[hsl(var(--brand-border))] bg-white p-6 shadow-sm">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading mb-2">
                Verify you are human
              </h3>
              <p className="text-sm text-[hsl(var(--brand-muted))]">
                Please complete the verification below to continue
              </p>
            </div>
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <div className="flex flex-col items-center gap-4">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  retry="auto"
                  refreshExpired="auto"
                  sandbox={false} // Using production keys
                  onError={() => {
                    setTurnstileStatus('error');
                    setTurnstileToken(null);
                  }}
                  onExpire={() => {
                    setTurnstileStatus('expired');
                    setTurnstileToken(null);
                  }}
                  onLoad={() => {
                    setTurnstileStatus('required');
                  }}
                  onVerify={(token) => {
                    setTurnstileStatus('success');
                    setTurnstileToken(token); // Update local state
                    storeTurnstileToken(token); // Store with timestamp in sessionStorage
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
              </div>
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

          <button
            onClick={() => {
              if (turnstileStatus === 'success' && turnstileToken) {
                // Token already stored in onVerify callback
                setShowWelcome(false);
              }
            }}
            disabled={turnstileStatus !== 'success' || !turnstileToken}
            className="inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--brand-primary-foreground))] shadow-lg transition-transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            I Understand, Get Started
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-8 text-sm text-[hsl(var(--brand-muted))]">
            Press <kbd className="rounded border border-[hsl(var(--brand-border))] bg-background px-2 py-1">Enter</kbd> to begin
          </p>
        </motion.div>
      </div>
    );
  }

  // Main Flow
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[hsl(var(--border))] z-50">
        <motion.div
          className="h-full bg-[hsl(var(--brand-primary))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="text-sm text-[hsl(var(--brand-muted))] font-medium">
            Step {currentStep + 1} of {totalSteps}: {STEPS[currentStep].title}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Container */}
              <div className="bg-white rounded-3xl shadow-lg border border-[hsl(var(--border))] p-8 md:p-12">
                {/* Step Content */}
                {currentStep === totalSteps - 1 ? (
                  <CurrentStepComponent onStartGeneration={beginManualGeneration} />
                ) : (
                  <CurrentStepComponent />
                )}

                {/* Navigation Buttons */}
                <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  canContinue={canContinue()}
                  onNext={nextStep}
                  onPrevious={previousStep}
                />
              </div>

              {/* Hint */}
              {currentStep < totalSteps - 1 && (
                <p className="text-center mt-6 text-sm text-[hsl(var(--brand-muted))]">
                  Press <kbd className="px-2 py-1 bg-white border border-[hsl(var(--border))] rounded text-xs">Enter ↵</kbd> to continue
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Step Indicators (bottom) */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all ${
                index <= currentStep
                  ? 'bg-[hsl(var(--brand-primary))] w-12'
                  : 'bg-[hsl(var(--border))] w-8'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SmartFlowV2() {
  return (
    <SmartFormProvider>
      <SmartFlowContent />
    </SmartFormProvider>
  );
}
