'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, FileText, Check, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SmartFormProvider, useSmartForm } from './SmartFormContext';
import { saveEmploymentAgreementReview } from '../reviewStorage';
import { Step1CompanyIdentity } from './screens/Step1CompanyIdentity';
import { Step2EmployeeIdentity } from './screens/Step2EmployeeIdentity';
import { Step3WorkArrangement } from './screens/Step3WorkArrangement';
import { Step4Compensation } from './screens/Step4Compensation';
import { Step5BenefitsEquity } from './screens/Step5BenefitsEquity';
import { Step6LegalTerms } from './screens/Step6LegalTerms';
import { Step7Review } from './screens/Step7Review';
import { Button } from '@/components/ui/button';
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

const STEPS = [
  { id: 'company', title: 'Company', component: Step1CompanyIdentity },
  { id: 'employee', title: 'Employee', component: Step2EmployeeIdentity },
  { id: 'work', title: 'Work', component: Step3WorkArrangement },
  { id: 'compensation', title: 'Compensation', component: Step4Compensation },
  { id: 'benefits', title: 'Benefits', component: Step5BenefitsEquity },
  { id: 'legal', title: 'Legal', component: Step6LegalTerms },
  { id: 'review', title: 'Review', component: Step7Review },
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
  const { enrichment, applyMarketStandards, formData, updateFormData } = useSmartForm();
  const [showSalaryWarning, setShowSalaryWarning] = useState(false);

  const marketStandards = enrichment.marketStandards;
  const jurisdictionName =
    enrichment.jurisdictionData?.state ||
    enrichment.jurisdictionData?.country ||
    'market';

  const showMarketStandardButton =
    MARKET_STANDARD_STEPS.includes(currentStep) && marketStandards;

  const isCompensationStep = currentStep === 3; // Step 4 is index 3
  const hasSalaryAmount = formData.salaryAmount && formData.salaryAmount.trim() !== '';

  const handleUseMarketStandard = () => {
    // Show warning if on compensation step and no salary entered
    if (isCompensationStep && !hasSalaryAmount) {
      setShowSalaryWarning(true);
      return;
    }

    if (marketStandards) {
      applyMarketStandards(marketStandards);
      // Auto-advance to next step after applying
      setTimeout(() => {
        onNext();
      }, 300);
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
          {showMarketStandardButton && (
            <Button
              variant="ghost"
              onClick={handleUseMarketStandard}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Zap className="w-4 h-4" />
              Use {jurisdictionName} standard
            </Button>
          )}

          {currentStep < totalSteps - 1 && (
            <Button
              onClick={onNext}
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
  const { currentStep, totalSteps, nextStep, previousStep, formData } = useSmartForm();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Basic validation for each step
  const canContinue = (): boolean => {
    switch (currentStep) {
      case 0: // Company
        return !!(formData.companyName && formData.companyAddress);
      case 1: // Employee
        return !!(formData.employeeName && formData.jobTitle && formData.startDate);
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

    // Move to next stage after duration
    stepTimeout = setTimeout(async () => {
      if (generationStepIndex < GENERATION_STEPS.length - 1) {
        setGenerationStepIndex((prev) => prev + 1);
      } else {
        // Generation complete - call API and navigate
        try {
          const response = await fetch('/api/templates/employment-agreement/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });

          if (!response.ok) throw new Error('Failed to generate');

          const result = await response.json();
          const persisted = saveEmploymentAgreementReview({
            document: result.document,
            formData,
            storedAt: new Date().toISOString(),
          });

          // Reset state
          setIsGenerating(false);
          setGenerationStepIndex(0);
          setFakeProgress(0);

          // Navigate to review page
          if (persisted) {
            router.push('/templates/employment-agreement/generate/review');
          } else {
            const params = new URLSearchParams({
              document: JSON.stringify(result.document),
              data: JSON.stringify(formData),
            });
            router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
          }
        } catch (error) {
          console.error('Generation error:', error);
          alert('Failed to generate agreement. Please try again.');
          setIsGenerating(false);
          setGenerationStepIndex(0);
          setFakeProgress(0);
        }
      }
    }, currentStage.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isGenerating, generationStepIndex]);

  // Loading Screen
  if (isGenerating) {
    const currentStage = GENERATION_STEPS[generationStepIndex];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] relative overflow-hidden flex items-center justify-center px-4">
        {/* Animated Background Blobs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Generating your agreement
            </h2>
            <p className="text-xl text-white/70">
              Please wait while we craft your employment agreement
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between text-sm text-white/60 mb-3">
              <span>{Math.round(fakeProgress)}% complete</span>
              <span>Step {generationStepIndex + 1} of {GENERATION_STEPS.length}</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* Moving dot indicator */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ left: `${fakeProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ marginLeft: '-10px' }}
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
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {currentStage.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
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
                      className={`flex items-center gap-3 text-sm ${
                        isCompleted
                          ? 'text-green-400'
                          : isCurrent
                          ? 'text-white'
                          : 'text-white/30'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-4 h-4 border-2 border-white rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 border-2 border-white/30 rounded-full" />
                      )}
                      <span>{stage.title}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom hint */}
          <p className="text-center mt-8 text-white/40 text-sm">
            This typically takes 12-15 seconds
          </p>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222,89%,52%)] via-[hsl(222,89%,45%)] to-[hsl(262,83%,58%)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl"
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Smart Employment Agreement
          </h1>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            AI-powered form that adapts to your jurisdiction and role.<br />
            <span className="text-white/70">Fast, smart, and tailored to your needs.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>7 smart screens</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>Market standards applied</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>~3-4 minutes</span>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="bg-white text-[hsl(222,89%,52%)] px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-3"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-8 text-white/50 text-sm">
            Press <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Enter</kbd> to begin
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
                {currentStep === 6 ? (
                  <CurrentStepComponent onStartGeneration={() => setIsGenerating(true)} />
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
