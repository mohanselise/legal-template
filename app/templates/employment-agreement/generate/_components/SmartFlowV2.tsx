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
import { Step3WorkArrangement } from './screens/Step3WorkArrangement';
import { Step4Compensation } from './screens/Step4Compensation';
import { Step5BenefitsEquity } from './screens/Step5BenefitsEquity';
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

const STEPS = [
  { id: 'company', title: 'Company', component: Step1CompanyIdentity },
  { id: 'employee', title: 'Employee', component: Step2EmployeeIdentity },
  { id: 'work', title: 'Work', component: Step3WorkArrangement },
  { id: 'compensation', title: 'Compensation', component: Step4Compensation },
  { id: 'benefits', title: 'Benefits', component: Step5BenefitsEquity },
  { id: 'legal', title: 'Legal', component: Step6LegalTerms },
  { id: 'review', title: 'Review', component: Step7Review },
  { id: 'confirm', title: 'Confirm', component: Step8ConfirmGenerate },
];

// Steps where "Use Market Standard" button should appear (screens 2-5)
const MARKET_STANDARD_STEPS = [2, 3, 4, 5];

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
    progress: 15,
    duration: 1800,
  },
  {
    title: 'Drafting core provisions',
    description: 'Crafting employment terms, duties, and compensation clauses with precise legal language.',
    progress: 35,
    duration: 2200,
  },
  {
    title: 'Building protective clauses',
    description: 'Generating confidentiality, IP assignment, and restrictive covenant provisions tailored to your needs.',
    progress: 55,
    duration: 2400,
  },
  {
    title: 'Structuring articles & recitals',
    description: 'Organizing sections, adding recitals, and formatting signature blocks for professional presentation.',
    progress: 75,
    duration: 2300,
  },
  {
    title: 'Quality assurance',
    description: 'Verifying defined terms, cross-references, dates, and legal consistency throughout the document.',
    progress: 92,
    duration: 2600,
  },
  {
    title: 'Finalizing document',
    description: 'Applying final formatting touches and preparing your employment agreement for review.',
    progress: 98,
    duration: 1500,
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
    analyzeCompany,
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

  const isCompensationStep = currentStep === 3; // Step 4 is index 3
  const isLegalStep = STEPS[currentStep]?.id === 'legal';
  const hasSalaryAmount = formData.salaryAmount && formData.salaryAmount.trim() !== '';

  const handleUseMarketStandard = () => {
    // Show warning if on compensation step and no salary entered
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
    // If on company step (step 0), trigger analysis in background (don't wait for it)
    if (currentStep === 0 && formData.companyName && formData.companyAddress) {
      analyzeCompany(formData.companyName, formData.companyAddress);
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
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="text-lg font-semibold mb-2">
                  Salary amount missing
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  The final agreement will be generated without salary information. Choose how you&apos;d like to proceed:
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Button
              variant="outline"
              onClick={() => setShowSalaryWarning(false)}
              className="w-full justify-start h-auto py-3 px-4 border-2 hover:border-primary hover:bg-primary/5"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-sm">← Go back and enter salary</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">Recommended for complete agreement</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleUsePlaceholder}
              className="w-full justify-start h-auto py-3 px-4 hover:bg-muted"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-sm">Add placeholder</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  Shows &quot;[TO BE DETERMINED]&quot; in document
                </div>
              </div>
            </Button>

            <Button
              variant="ghost"
              onClick={handleProceedWithoutSalary}
              className="w-full justify-start h-auto py-3 px-4 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-sm">Skip salary entirely</div>
                <div className="text-xs opacity-75 mt-0.5 truncate">
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
  const { currentStep, totalSteps, nextStep, previousStep, formData, analyzeCompany } = useSmartForm();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const generationTaskRef = useRef<(() => Promise<BackgroundGenerationResult | null>) | null>(null);

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const resetLoadingState = useCallback(() => {
    setIsGenerating(false);
    setGenerationStepIndex(0);
    setFakeProgress(0);
    generationTaskRef.current = null;
  }, []);

  const beginManualGeneration = useCallback(
    (task: () => Promise<BackgroundGenerationResult | null>) => {
      generationTaskRef.current = task;
      setGenerationStepIndex(0);
      setFakeProgress(0);
      setIsGenerating(true);
    },
    []
  );

  // Basic validation for each step
  const canContinue = (): boolean => {
    switch (currentStep) {
      case 0: // Company
        return !!(formData.companyName && formData.companyAddress);
      case 1: // Employee
        return !!(formData.employeeName && formData.employeeAddress && formData.jobTitle && formData.startDate);
      case 2: // Work
        // Work location is optional for remote workers
        const workLocationValid = formData.workArrangement === 'remote' || formData.workLocation;
        return !!(workLocationValid && formData.workHoursPerWeek);
      case 3: // Compensation
        return !!(formData.salaryAmount && formData.salaryCurrency);
      case 4: // Benefits (optional)
        return true;
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
        setShowWelcome(false);
        return;
      }
      if (e.key === 'Enter' && !showWelcome && canContinue() && currentStep < totalSteps - 1) {
        nextStep();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showWelcome, currentStep, formData, canContinue, nextStep]);

  // Loading animation for document generation
  useEffect(() => {
    if (!isGenerating) return;

    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;
    let isNavigating = false;

    const currentStage = GENERATION_STEPS[generationStepIndex];

    // Animate fake progress for this stage
    const startProgress = generationStepIndex > 0 ? GENERATION_STEPS[generationStepIndex - 1].progress : 0;
    const targetProgress = currentStage.progress;
    const increment = (targetProgress - startProgress) / (currentStage.duration / 50);

    progressInterval = setInterval(() => {
      setFakeProgress((prev) => {
        const next = prev + increment;
        if (next >= targetProgress) {
          clearInterval(progressInterval);
          return targetProgress;
        }
        return next;
      });
    }, 50);

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
  if (isGenerating) {
    const currentStage = GENERATION_STEPS[generationStepIndex];

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--bg))] px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.14),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.08),_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 space-y-4 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(var(--brand-border))] bg-background shadow-sm">
              <FileText className="h-10 w-10 text-[hsl(var(--brand-primary))]" />
            </div>
            <h2 className="text-4xl font-semibold text-[hsl(var(--fg))] md:text-5xl">
              Generating your agreement
            </h2>
            <p className="text-lg text-[hsl(var(--brand-muted))]">
              Please wait while we craft your employment agreement
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-between text-sm text-[hsl(var(--brand-muted))]">
              <span>{Math.round(fakeProgress)}% complete</span>
              <span>Step {generationStepIndex + 1} of {GENERATION_STEPS.length}</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full border border-[hsl(var(--brand-primary)/0.35)] bg-[hsl(var(--brand-primary)/0.12)] shadow-[0_1px_2px_hsla(0,0%,0%,0.08)]">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--brand-primary))]"
                initial={{ width: 0 }}
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* Moving dot indicator */}
              <motion.div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white bg-[hsl(var(--brand-primary))] shadow-[0_0_0_2px_rgba(255,255,255,0.65),0_4px_10px_hsla(206,100%,35%,0.45)]"
                animate={{ left: `${fakeProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ marginLeft: '-8px' }}
              />
            </div>
          </div>

          {/* Current Stage Info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={generationStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-[hsl(var(--brand-border))] bg-background p-8 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-border))] bg-muted">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-6 w-6 text-[hsl(var(--brand-primary))]" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-2 text-xl font-semibold text-[hsl(var(--fg))]">
                    {currentStage.title}
                  </h3>
                  <p className="leading-relaxed text-[hsl(var(--brand-muted))]">
                    {currentStage.description}
                  </p>
                </div>
              </div>

              {/* Stage checklist */}
              <div className="mt-6 space-y-2">
                {GENERATION_STEPS.map((stage, index) => {
                  const isCompleted = index < generationStepIndex;
                  const isCurrent = index === generationStepIndex;

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 text-sm transition-colors ${
                        isCompleted
                          ? 'text-[hsl(var(--brand-primary))]'
                          : isCurrent
                          ? 'text-[hsl(var(--fg))]'
                          : 'text-[hsl(var(--brand-muted))]/70'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="h-4 w-4 rounded-full border-2 border-[hsl(var(--brand-primary))]"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-[hsl(var(--brand-border))]" />
                      )}
                      <span>{stage.title}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom hint */}
          <p className="mt-8 text-center text-sm text-[hsl(var(--brand-muted))]">
            This typically takes 12-15 seconds
          </p>
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
          <h1 className="mb-6 text-5xl font-semibold text-[hsl(var(--fg))] md:text-6xl">
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
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">Before You Begin</h3>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
              <p><strong className="text-[hsl(var(--brand-primary))]">Not Legal Advice:</strong> This tool does not provide legal advice and generates documents for informational purposes only.</p>
              <p><strong className="text-[hsl(var(--brand-primary))]">AI-Generated:</strong> AI is inaccurate by nature. Content may contain errors or omissions.</p>
              <p><strong className="text-[hsl(var(--brand-primary))]">Jurisdiction:</strong> This is a Switzerland-based product that may not comply with laws in your jurisdiction.</p>
              <p><strong className="text-[hsl(var(--brand-primary))]">Review Required:</strong> Always consult a qualified legal advisor before using any generated document.</p>
            </div>
          </div>

          <button
            onClick={() => setShowWelcome(false)}
            className="inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--brand-primary-foreground))] shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
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
