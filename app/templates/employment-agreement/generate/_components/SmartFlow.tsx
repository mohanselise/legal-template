/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, Check, Building2, User, Briefcase, DollarSign, MapPin, Scale, FileText, Sparkles } from 'lucide-react';
import { EmploymentAgreementFormData } from '../schema';

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
      const params = new URLSearchParams({
        document: result.document,
        data: JSON.stringify(formData),
      });

      router.push(`/templates/employment-agreement/generate/review?${params.toString()}`);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate agreement. Please try again.');
      setIsGenerating(false);
    }
  };

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(var(--border))] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--brand-primary))] border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-10 h-10 text-[hsl(var(--brand-primary))] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-3xl font-semibold text-[hsl(var(--fg))]">Drafting your agreement</h2>
          <p className="text-[hsl(var(--brand-muted))] max-w-md mx-auto">
            Creating a professional, legally-sound document tailored to your specifications...
          </p>
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
              <div className="bg-white rounded-3xl shadow-lg border border-[hsl(var(--border))] p-8 md:p-12">
                {/* Header */}
                <div className="mb-8">
                  {currentScreen.icon && (
                    <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))] mb-6">
                      {currentScreen.icon}
                    </div>
                  )}
                  <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] mb-3">
                    {currentScreen.title}
                  </h2>
                  {currentScreen.subtitle && (
                    <p className="text-lg text-[hsl(var(--brand-muted))]">{currentScreen.subtitle}</p>
                  )}
                </div>

                {/* Cards Type */}
                {currentScreen.type === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {currentScreen.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCardSelect(option.value)}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-center hover:border-[hsl(var(--brand-primary))] hover:shadow-md ${
                          formData[currentScreen.field!] === option.value
                            ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05] shadow-md'
                            : 'border-[hsl(var(--border))] bg-white'
                        }`}
                      >
                        {option.recommended && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[hsl(var(--brand-primary))] text-white text-xs font-semibold rounded-full">
                            Recommended
                          </div>
                        )}
                        <div className="font-semibold text-lg text-[hsl(var(--fg))] mb-2">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-[hsl(var(--brand-muted))]">{option.description}</div>
                        )}
                        {formData[currentScreen.field!] === option.value && (
                          <Check className="w-5 h-5 text-[hsl(var(--brand-primary))] absolute top-4 right-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Group Type */}
                {currentScreen.type === 'group' && (
                  <div className="space-y-6 mb-8">
                    {currentScreen.fields?.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-[hsl(var(--fg))] mb-2">
                          {field.label}
                          {field.required && <span className="text-[hsl(var(--brand-primary))] ml-1">*</span>}
                        </label>
                        <input
                          type={field.type}
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 text-base border-2 border-[hsl(var(--border))] rounded-xl focus:border-[hsl(var(--brand-primary))] focus:ring-2 focus:ring-[hsl(var(--brand-primary))/0.2] outline-none transition-all"
                        />
                        {field.helper && (
                          <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">{field.helper}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4">
                  {currentScreen.skippable ? (
                    <button
                      onClick={handleSkip}
                      className="text-[hsl(var(--brand-muted))] hover:text-[hsl(var(--brand-primary))] font-medium transition-colors text-base"
                    >
                      {currentScreen.skipLabel || 'Skip this step'}
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={!canContinue()}
                    className="flex items-center gap-3 bg-[hsl(var(--brand-primary))] text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-[hsl(222,89%,45%)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
