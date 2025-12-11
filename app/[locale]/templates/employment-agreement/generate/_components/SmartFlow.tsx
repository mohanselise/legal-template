 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, Check, Building2, User, Briefcase, DollarSign, MapPin, Scale, FileText, Sparkles } from 'lucide-react';
import { EmploymentAgreementFormData } from '../schema';
import { cn } from '@/lib/utils';
import { saveEmploymentAgreementReview } from '../reviewStorage';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type ScreenType = 'single' | 'group' | 'cards';

interface Field {
  key: keyof EmploymentAgreementFormData;
  label: string;
  type: 'text' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  helper?: string;
}

interface CardOption {
  value: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

interface Screen {
  id: string;
  type: ScreenType;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  skippable?: boolean;
  skipLabel?: string;

  // For single/group types
  fields?: Field[];

  // For cards type
  field?: keyof EmploymentAgreementFormData;
  options?: CardOption[];
}

const SCREENS: Screen[] = [
  // Screen 1: Essentials
  {
    id: 'essentials',
    type: 'group',
    title: "Let's start with the basics",
    subtitle: 'Core information to get started',
    icon: <FileText className="w-7 h-7" />,
    fields: [
      { key: 'companyName', label: 'Company name', type: 'text', placeholder: 'Acme Corporation', required: true },
      { key: 'employeeName', label: 'Employee name', type: 'text', placeholder: 'Jane Smith', required: true },
      { key: 'jobTitle', label: 'Job title', type: 'text', placeholder: 'Senior Product Designer', required: true },
      { key: 'startDate', label: 'Start date', type: 'date', required: true },
    ],
  },

  // Screen 2: Employment Type
  {
    id: 'employment-type',
    type: 'cards',
    title: 'What type of employment?',
    field: 'employmentType',
    options: [
      { value: 'full-time', label: 'Full-Time', description: 'Standard employment', recommended: true },
      { value: 'part-time', label: 'Part-Time', description: 'Reduced hours' },
      { value: 'contract', label: 'Contract', description: 'Fixed term' },
    ],
  },

  // Screen 3: Work Arrangement
  {
    id: 'work-arrangement',
    type: 'cards',
    title: 'Where will they work?',
    field: 'workArrangement',
    options: [
      { value: 'remote', label: 'Remote', description: 'Work from anywhere' },
      { value: 'hybrid', label: 'Hybrid', description: 'Mix of office & remote', recommended: true },
      { value: 'on-site', label: 'On-Site', description: 'In the office' },
    ],
  },

  // Screen 4: Location & Hours
  {
    id: 'location-hours',
    type: 'group',
    title: 'Work details',
    subtitle: 'Location and schedule',
    icon: <MapPin className="w-7 h-7" />,
    fields: [
      { key: 'workLocation', label: 'Primary work location', type: 'text', placeholder: 'San Francisco, CA', required: true, helper: 'City and state/country' },
      { key: 'workHoursPerWeek', label: 'Hours per week', type: 'text', placeholder: '40', helper: 'Standard work hours' },
    ],
  },

  // Screen 5: Compensation
  {
    id: 'compensation',
    type: 'group',
    title: 'Compensation',
    subtitle: 'Base salary details',
    icon: <DollarSign className="w-7 h-7" />,
    fields: [
      { key: 'salaryAmount', label: 'Annual salary', type: 'number', placeholder: '120000', required: true },
      { key: 'salaryCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
    ],
  },

  // Screen 6: Company Details (Skippable)
  {
    id: 'company-details',
    type: 'group',
    title: 'Company details',
    subtitle: 'For official records',
    icon: <Building2 className="w-7 h-7" />,
    skippable: true,
    skipLabel: 'Skip company address',
    fields: [
      { key: 'companyAddress', label: 'Street address', type: 'text', placeholder: '123 Market St, Suite 500' },
      { key: 'companyState', label: 'State / Province', type: 'text', placeholder: 'California' },
      { key: 'companyCountry', label: 'Country', type: 'text', placeholder: 'United States' },
    ],
  },

  // Screen 7: Employee Details (Skippable)
  {
    id: 'employee-details',
    type: 'group',
    title: 'Employee contact',
    subtitle: 'For signatures and notices',
    icon: <User className="w-7 h-7" />,
    skippable: true,
    skipLabel: 'Skip employee details',
    fields: [
      { key: 'employeeEmail', label: 'Email address', type: 'text', placeholder: 'jane@company.com', helper: 'For sending the agreement' },
      { key: 'employeeAddress', label: 'Residential address', type: 'text', placeholder: '456 Grove Ave, Apt 8' },
    ],
  },

  // Screen 8: Legal Governance
  {
    id: 'governance',
    type: 'group',
    title: 'Legal governance',
    subtitle: 'Jurisdiction and dispute resolution',
    icon: <Scale className="w-7 h-7" />,
    fields: [
      { key: 'governingLaw', label: 'Governing jurisdiction', type: 'text', placeholder: 'State of Delaware, United States', required: true, helper: 'Which law applies to this agreement' },
    ],
  },

  // Screen 9: Protection Clauses (Skippable)
  {
    id: 'protection',
    type: 'group',
    title: 'Protection clauses',
    subtitle: 'Standard legal safeguards',
    icon: <Scale className="w-7 h-7" />,
    skippable: true,
    skipLabel: 'Use standard clauses',
    fields: [
      { key: 'includeConfidentiality', label: 'Confidentiality', type: 'text', placeholder: 'Type "yes" or "no"', helper: 'Protects company information (recommended)' },
      { key: 'includeIpAssignment', label: 'IP assignment', type: 'text', placeholder: 'Type "yes" or "no"', helper: 'Company owns work product (recommended)' },
    ],
  },
];

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

export function SmartFlow() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<EmploymentAgreementFormData>>({
    salaryCurrency: 'USD',
    salaryPeriod: 'annual',
    includeConfidentiality: true,
    includeIpAssignment: true,
    disputeResolution: 'arbitration',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);

  const currentScreen = SCREENS[currentIndex];
  const progress = ((currentIndex + 1) / SCREENS.length) * 100;

  const handleNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGenerate();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleCardSelect = (value: string) => {
    if (currentScreen.field) {
      setFormData(prev => ({ ...prev, [currentScreen.field!]: value }));
      setTimeout(handleNext, 300);
    }
  };

  const handleFieldChange = (key: keyof EmploymentAgreementFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canContinue = () => {
    if (currentScreen.type === 'cards') {
      return formData[currentScreen.field!] !== undefined;
    }
    if (currentScreen.type === 'group') {
      const requiredFields = currentScreen.fields?.filter(f => f.required) || [];
      return requiredFields.every(f => formData[f.key]);
    }
    return true;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
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

      if (persisted) {
        router.push('/templates/employment-agreement/generate/review');
        return;
      }

      const params = new URLSearchParams({
        document: JSON.stringify(result.document),
        data: JSON.stringify(formData),
      });
      router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate agreement. Please try again.');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isGenerating || GENERATION_STEPS.length === 0) {
      setGenerationStepIndex(0);
      setFakeProgress(0);
      return;
    }

    type Timer = ReturnType<typeof setTimeout>;
    let isActive = true;
    const timeouts: Timer[] = [];
    let idleInterval: ReturnType<typeof setInterval> | null = null;

    setGenerationStepIndex(0);
    setFakeProgress(GENERATION_STEPS[0].progress);

    let cumulativeDelay = 0;
    for (let index = 1; index < GENERATION_STEPS.length; index++) {
      cumulativeDelay += GENERATION_STEPS[index - 1].duration;
      const timeout = setTimeout(() => {
        if (!isActive) return;
        setGenerationStepIndex(index);
        setFakeProgress(GENERATION_STEPS[index].progress);
      }, cumulativeDelay);
      timeouts.push(timeout);
    }

    cumulativeDelay += GENERATION_STEPS[GENERATION_STEPS.length - 1].duration;
    const idleTimeout = setTimeout(() => {
      idleInterval = setInterval(() => {
        if (!isActive) return;
        setFakeProgress(prev => {
          const next = prev + 0.4 + Math.random() * 1.1;
          return next >= 99 ? 99 : next;
        });
      }, 2000);
    }, cumulativeDelay);
    timeouts.push(idleTimeout);

    return () => {
      isActive = false;
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (idleInterval) clearInterval(idleInterval);
    };
  }, [isGenerating]);

  // Keyboard: Enter to continue
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showWelcome && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setShowWelcome(false);
        return;
      }
      if (e.key === 'Enter' && !isGenerating && !showWelcome && canContinue()) {
        handleNext();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showWelcome, isGenerating, currentIndex, formData]);

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
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Employment Agreement
          </h1>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            Create a professional employment agreement in minutes.<br />
            <span className="text-white/70">Clear, trustworthy, and tailored to your needs.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>~{SCREENS.length} quick screens</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>Skip optional details</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-base">
              <Check className="w-5 h-5" />
              <span>~3-5 minutes</span>
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

  // Generating Screen
  if (isGenerating) {
    const currentStep =
      GENERATION_STEPS[Math.min(generationStepIndex, GENERATION_STEPS.length - 1)];
    const displayedProgress = Math.round(fakeProgress);

    return (
      <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--bg))] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] opacity-95" />
        <motion.div
          className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-10rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl"
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.45, 0.65, 0.45] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]"
          animate={{ scale: [1, 1.03, 1], opacity: [0.6, 0.75, 0.6] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl space-y-10 text-center">
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-lg"
              animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>

            <div className="space-y-4">
              <motion.h2
                className="text-4xl font-semibold tracking-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Drafting your agreement
              </motion.h2>
              <p className="text-base text-white/70 md:text-lg">
                Creating a professional, legally-sound document tailored to your specifications.
                Hang tight while we polish every clause.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300 via-sky-400 to-fuchsia-500 shadow-lg shadow-sky-500/40"
                  animate={{ width: `${Math.min(displayedProgress, 99)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="absolute -top-1 h-5 w-5 rounded-full bg-white shadow-xl shadow-sky-500/60"
                  animate={{ x: `${Math.min(displayedProgress, 99)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
                <span>
                  Phase {Math.min(generationStepIndex + 1, GENERATION_STEPS.length)} of{' '}
                  {GENERATION_STEPS.length}
                </span>
                <span>{displayedProgress}%</span>
              </div>
            </div>

            <motion.div
              key={generationStepIndex}
              className="space-y-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur-xl shadow-lg shadow-sky-500/10"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                boxShadow: [
                  '0 4px 20px rgba(14, 165, 233, 0.1)',
                  '0 8px 30px rgba(14, 165, 233, 0.2)',
                  '0 4px 20px rgba(14, 165, 233, 0.1)',
                ]
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Currently working on
                </p>
              </div>
              <h3 className="text-lg font-semibold text-white">{currentStep.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{currentStep.description}</p>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
              {GENERATION_STEPS.map((step, index) => {
                const isPast = index < generationStepIndex;
                const isActive = index === generationStepIndex;
                return (
                  <motion.span
                    key={step.title}
                    className={cn(
                      'rounded-full border px-4 py-1.5 transition-colors',
                      isActive
                        ? 'border-white bg-white/20 text-white'
                        : isPast
                          ? 'border-white/60 text-white/80'
                          : 'border-white/10 text-white/50',
                    )}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    {step.title}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question Screens
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
        <div className="flex items-center justify-center max-w-3xl mx-auto">
          <div className="text-sm text-[hsl(var(--brand-muted))] font-medium">
            Step {currentIndex + 1} of {SCREENS.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Container */}
              <div className="bg-white rounded-2xl shadow-xl border border-[hsl(var(--border))] p-8 md:p-12">
                {/* Header */}
                <div className="mb-10">
                  {currentScreen.icon && (
                    <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--brand-primary))/0.15] to-[hsl(var(--brand-primary))/0.05] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))] mb-6 shadow-sm">
                      {currentScreen.icon}
                    </div>
                  )}
                  <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--fg))] mb-3 leading-tight">
                    {currentScreen.title}
                  </h2>
                  {currentScreen.subtitle && (
                    <p className="text-lg text-[hsl(var(--brand-muted))] leading-relaxed">{currentScreen.subtitle}</p>
                  )}
                </div>

                {/* Cards Type */}
                {currentScreen.type === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {currentScreen.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCardSelect(option.value)}
                        className={cn(
                          "relative p-6 rounded-xl border-2 transition-all text-center group",
                          "hover:border-[hsl(var(--brand-primary))] hover:shadow-lg hover:-translate-y-0.5",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2",
                          formData[currentScreen.field!] === option.value
                            ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.08] shadow-lg'
                            : 'border-[hsl(var(--border))] bg-white'
                        )}
                      >
                        {option.recommended && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[hsl(var(--brand-primary))] text-white text-xs font-semibold rounded-full shadow-md">
                            Recommended
                          </div>
                        )}
                        <div className="font-semibold text-lg text-[hsl(var(--fg))] mb-2 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-[hsl(var(--brand-muted))] leading-relaxed">
                            {option.description}
                          </div>
                        )}
                        {formData[currentScreen.field!] === option.value && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-[hsl(var(--brand-primary))] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Group Type */}
                {currentScreen.type === 'group' && (
                  <FieldSet className="mb-8">
                    <FieldGroup>
                      {currentScreen.fields?.map((field) => (
                        <Field key={field.key}>
                          <FieldLabel htmlFor={`field-${field.key}`}>
                            {field.label}
                            {field.required && <span className="text-[hsl(var(--brand-primary))] ml-1">*</span>}
                          </FieldLabel>
                          {field.helper && (
                            <FieldDescription>{field.helper}</FieldDescription>
                          )}
                          <Input
                            id={`field-${field.key}`}
                            type={field.type}
                            value={(formData[field.key] as string) || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="text-base"
                          />
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-[hsl(var(--border))]">
                  {currentScreen.skippable ? (
                    <button
                      onClick={handleSkip}
                      className="text-[hsl(var(--brand-muted))] hover:text-[hsl(var(--brand-primary))] font-medium transition-colors text-base underline underline-offset-4 decoration-transparent hover:decoration-current"
                    >
                      {currentScreen.skipLabel || 'Skip this step'}
                    </button>
                  ) : (
                    <div className="text-sm text-[hsl(var(--brand-muted))]">
                      {currentIndex + 1} of {SCREENS.length}
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={!canContinue()}
                    className={cn(
                      "flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-base shadow-md transition-all",
                      "bg-[hsl(var(--brand-primary))] text-white",
                      "hover:shadow-xl hover:bg-[hsl(222,89%,45%)] hover:-translate-y-0.5",
                      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                    )}
                  >
                    {currentIndex === SCREENS.length - 1 ? 'Generate agreement' : 'Continue'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-center mt-6 text-sm text-[hsl(var(--brand-muted))]">
                Press <kbd className="px-2 py-1 bg-white border border-[hsl(var(--border))] rounded text-xs">Enter ↵</kbd> to continue
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
