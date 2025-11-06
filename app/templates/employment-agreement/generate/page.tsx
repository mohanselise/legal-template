'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, FileText } from 'lucide-react';
import { employmentAgreementOptionalSchema, optionalDefaultValues, EmploymentAgreementOptionalFormData } from './schema-optional';
import { OptionalStepBasics } from './_components/OptionalStepBasics';
import { OptionalStepCompensation } from './_components/OptionalStepCompensation';
import { OptionalStepWorkTerms } from './_components/OptionalStepWorkTerms';
import { OptionalStepLegalTerms } from './_components/OptionalStepLegalTerms';
import { GeneratingAnimation } from './_components/GeneratingAnimation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'Basics', component: OptionalStepBasics },
  { id: 2, name: 'Compensation', component: OptionalStepCompensation },
  { id: 3, name: 'Work Terms', component: OptionalStepWorkTerms },
  { id: 4, name: 'Legal Terms', component: OptionalStepLegalTerms },
];

const STORAGE_KEY = 'employment-agreement-optional-draft';
type SectionKey = 'basics' | 'compensation' | 'workTerms' | 'legalTerms';

export default function GeneratePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    document: string;
    data: EmploymentAgreementOptionalFormData;
  } | null>(null);

  const form = useForm<EmploymentAgreementOptionalFormData>({
    resolver: zodResolver(employmentAgreementOptionalSchema),
    defaultValues: optionalDefaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, watch } = form;
  const formData = watch();

  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
  }, [form]);

  const handleNext = async () => {
    // Trigger progressive generation for the section just completed
    const sectionKey = stepIdToSectionKey(currentStep as 1 | 2 | 3 | 4);
    void generateSection(sectionKey, formData);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async (data: EmploymentAgreementOptionalFormData) => {
    flushSync(() => {
      setGenerationComplete(false);
      setPendingNavigation(null);
      setIsGenerating(true);
    });
    const startTime = Date.now();
    console.log('🎬 [Client] Starting document generation at:', new Date().toISOString());
    console.log('📤 [Client] Sending data to API...');

    try {
      const fetchStart = Date.now();
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const fetchDuration = Date.now() - fetchStart;
      console.log('📨 [Client] API response received in', fetchDuration, 'ms');

      if (!response.ok) {
        console.error('❌ [Client] API returned error status:', response.status);
        throw new Error('Failed to generate document');
      }

      console.log('🔄 [Client] Parsing response JSON...');
      const result = await response.json();
      console.log('✅ [Client] Response parsed successfully');
      console.log('📄 [Client] Document length:', result.document?.length || 0, 'characters');
      if (!result.document) {
        throw new Error('Document content missing from response');
      }
      
      const totalDuration = Date.now() - startTime;
      console.log('✨ [Client] Total generation time:', totalDuration, 'ms');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const safeData = JSON.parse(JSON.stringify(data));
      setPendingNavigation({ document: result.document, data: safeData });
      setGenerationComplete(true);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('❌ [Client] Error after', totalDuration, 'ms:', error);
      console.error('❌ [Client] Error details:', error);
      toast.error('Generation Failed', {
        description: 'There was an error generating your agreement. Please try again.',
      });
      setPendingNavigation(null);
      setGenerationComplete(false);
      setIsGenerating(false);
    }
  };

  const handleGenerationComplete = () => {
    const navData = pendingNavigation;
    setPendingNavigation(null);

    if (!navData) {
      setIsGenerating(false);
      return;
    }

    console.log('🚀 [Client] Navigating to review page...');
    setIsGenerating(false);
    
    const params = new URLSearchParams({
      document: navData.document,
      data: JSON.stringify(navData.data),
    });
    router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
  };

  function stepIdToSectionKey(id: 1 | 2 | 3 | 4): SectionKey {
    switch (id) {
      case 1:
        return 'basics';
      case 2:
        return 'compensation';
      case 3:
        return 'workTerms';
      case 4:
      default:
        return 'legalTerms';
    }
  }

  async function generateSection(section: SectionKey, data: EmploymentAgreementOptionalFormData) {
    try {
      const res = await fetch('/api/templates/employment-agreement/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      });
      if (!res.ok) {
        throw new Error(`Section API failed: ${res.status}`);
      }
      await res.json();
    } catch (error) {
      console.error('[Client] Background section generation failed:', section, error);
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  if (isGenerating) {
    return (
      <GeneratingAnimation
        onComplete={handleGenerationComplete}
        isComplete={generationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-[hsl(214,32%,91%)] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[hsl(222,47%,11%)]">Employment Agreement</h1>
                <p className="text-xs text-[hsl(215,16%,47%)]">All fields are optional</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[hsl(214,32%,91%)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="relative flex-1">
                  {index !== 0 && (
                    <div
                      className="absolute top-5 left-0 -ml-px h-0.5 w-full bg-[hsl(214,32%,91%)]"
                      style={{
                        backgroundColor:
                          currentStep > step.id
                            ? 'hsl(222,89%,52%)'
                            : 'hsl(214,32%,91%)',
                      }}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (step.id < currentStep) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`relative flex flex-col items-center group ${
                      step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.id
                          ? 'bg-[hsl(222,89%,52%)] border-[hsl(222,89%,52%)] text-white'
                          : currentStep === step.id
                          ? 'border-[hsl(222,89%,52%)] text-[hsl(222,89%,52%)] bg-white'
                          : 'border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] bg-white'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </span>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        currentStep >= step.id
                          ? 'text-[hsl(222,47%,11%)]'
                          : 'text-[hsl(215,16%,47%)]'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={handleSubmit(handleGenerate)}>
              {CurrentStepComponent && <CurrentStepComponent form={form} />}

              <div className="flex justify-between mt-8 pt-6 border-t border-[hsl(214,32%,91%)]">
                <Button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-[hsl(222,89%,52%)] hover:bg-[hsl(222,89%,45%)]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-gradient-to-r from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] hover:opacity-90"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Agreement
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
