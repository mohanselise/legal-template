/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Check, Building2, User, Briefcase, DollarSign, MapPin, Scale, Loader2 } from 'lucide-react';
import { EmploymentAgreementFormData } from '../schema';

type QuestionType = 'text' | 'select' | 'multiselect' | 'date' | 'number' | 'cards';

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  recommended?: boolean;
}

interface Question {
  id: string;
  field: keyof EmploymentAgreementFormData;
  question: string;
  subtitle?: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
  required?: boolean;
  skipIf?: (data: Partial<EmploymentAgreementFormData>) => boolean;
  icon?: React.ReactNode;
}

const QUESTIONS: Question[] = [
  // Section 1: Core Essentials
  {
    id: 'company',
    field: 'companyName',
    question: "What's your company name?",
    subtitle: "Let's start with the basics",
    type: 'text',
    placeholder: 'e.g., Acme Corporation',
    required: true,
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    id: 'employee',
    field: 'employeeName',
    question: "Who are you hiring?",
    subtitle: "Enter the employee's full legal name",
    type: 'text',
    placeholder: 'e.g., Jane Smith',
    required: true,
    icon: <User className="w-8 h-8" />,
  },
  {
    id: 'role',
    field: 'jobTitle',
    question: "What's the role?",
    subtitle: "Job title for this position",
    type: 'text',
    placeholder: 'e.g., Senior Product Designer',
    required: true,
    icon: <Briefcase className="w-8 h-8" />,
  },
  {
    id: 'start-date',
    field: 'startDate',
    question: "When do they start?",
    subtitle: "Expected start date",
    type: 'date',
    required: true,
  },

  // Section 2: Employment Type & Location
  {
    id: 'employment-type',
    field: 'employmentType',
    question: "What type of employment?",
    type: 'cards',
    required: true,
    options: [
      {
        value: 'full-time',
        label: 'Full-Time',
        description: 'Standard 40 hours/week',
        icon: <Briefcase className="w-6 h-6" />,
        recommended: true,
      },
      {
        value: 'part-time',
        label: 'Part-Time',
        description: 'Less than 40 hours/week',
        icon: <Briefcase className="w-6 h-6" />,
      },
      {
        value: 'contract',
        label: 'Contract',
        description: 'Fixed-term agreement',
        icon: <Briefcase className="w-6 h-6" />,
      },
    ],
  },
  {
    id: 'work-arrangement',
    field: 'workArrangement',
    question: "Where will they work?",
    type: 'cards',
    required: true,
    options: [
      {
        value: 'remote',
        label: 'Remote',
        description: 'Work from anywhere',
        icon: <MapPin className="w-6 h-6" />,
      },
      {
        value: 'hybrid',
        label: 'Hybrid',
        description: 'Mix of office and remote',
        icon: <MapPin className="w-6 h-6" />,
        recommended: true,
      },
      {
        value: 'on-site',
        label: 'On-Site',
        description: 'Full-time at office',
        icon: <MapPin className="w-6 h-6" />,
      },
    ],
  },
  {
    id: 'location',
    field: 'workLocation',
    question: "What's the work location?",
    subtitle: "City and state/country",
    type: 'text',
    placeholder: 'e.g., San Francisco, CA',
    required: true,
  },

  // Section 3: Compensation
  {
    id: 'salary',
    field: 'salaryAmount',
    question: "What's the salary?",
    subtitle: "Annual base compensation",
    type: 'number',
    placeholder: 'e.g., 120000',
    required: true,
    icon: <DollarSign className="w-8 h-8" />,
  },
  {
    id: 'salary-period',
    field: 'salaryPeriod',
    question: "How is it paid?",
    type: 'cards',
    options: [
      { value: 'annual', label: 'Annual', description: 'Yearly salary', recommended: true },
      { value: 'monthly', label: 'Monthly', description: 'Per month' },
      { value: 'bi-weekly', label: 'Bi-Weekly', description: 'Every 2 weeks' },
      { value: 'hourly', label: 'Hourly', description: 'Per hour' },
    ],
  },

  // Section 4: Work Details
  {
    id: 'work-hours',
    field: 'workHoursPerWeek',
    question: "How many hours per week?",
    subtitle: "Standard work hours",
    type: 'cards',
    options: [
      { value: '40', label: '40 hours', description: 'Standard full-time', recommended: true },
      { value: '32', label: '32 hours', description: '4-day workweek' },
      { value: '20', label: '20 hours', description: 'Part-time' },
    ],
    skipIf: (data) => data.employmentType === 'contract',
  },
  {
    id: 'company-address',
    field: 'companyAddress',
    question: "What's your company address?",
    subtitle: "For legal records and notices",
    type: 'text',
    placeholder: 'e.g., 123 Market St, Suite 500',
  },
  {
    id: 'company-state',
    field: 'companyState',
    question: "State or province?",
    type: 'text',
    placeholder: 'e.g., California',
    required: true,
  },
  {
    id: 'employee-email',
    field: 'employeeEmail',
    question: "Employee's email address?",
    subtitle: "For sending the agreement",
    type: 'text',
    placeholder: 'e.g., jane@company.com',
  },
  {
    id: 'employee-address',
    field: 'employeeAddress',
    question: "Employee's address?",
    subtitle: "For legal records",
    type: 'text',
    placeholder: 'e.g., 456 Grove Ave, Apt 8',
  },

  // Section 5: Legal & Governance
  {
    id: 'governing-law',
    field: 'governingLaw',
    question: "Which jurisdiction governs?",
    subtitle: "State or country law that applies",
    type: 'text',
    placeholder: 'e.g., State of Delaware, United States',
    required: true,
    icon: <Scale className="w-8 h-8" />,
  },
  {
    id: 'dispute-resolution',
    field: 'disputeResolution',
    question: "How should disputes be resolved?",
    subtitle: "Choose a conflict resolution method",
    type: 'cards',
    options: [
      { value: 'arbitration', label: 'Arbitration', description: 'Private, binding resolution', recommended: true },
      { value: 'mediation', label: 'Mediation', description: 'Facilitated negotiation' },
      { value: 'court', label: 'Court', description: 'Traditional litigation' },
    ],
  },
  {
    id: 'confidentiality',
    field: 'includeConfidentiality',
    question: "Include confidentiality clause?",
    subtitle: "Protects company secrets and proprietary information",
    type: 'cards',
    options: [
      { value: 'true', label: 'Yes', description: 'Recommended for most roles', recommended: true },
      { value: 'false', label: 'No', description: 'Skip this clause' },
    ],
  },
  {
    id: 'ip-assignment',
    field: 'includeIpAssignment',
    question: "Include IP assignment clause?",
    subtitle: "Company owns work created during employment",
    type: 'cards',
    options: [
      { value: 'true', label: 'Yes', description: 'Standard for tech roles', recommended: true },
      { value: 'false', label: 'No', description: 'Skip this clause' },
    ],
  },
  {
    id: 'non-compete',
    field: 'includeNonCompete',
    question: "Include non-compete restriction?",
    subtitle: "Limits working for competitors after employment",
    type: 'cards',
    options: [
      { value: 'false', label: 'No', description: 'More employee-friendly', recommended: true },
      { value: 'true', label: 'Yes', description: 'Protects business interests' },
    ],
  },
];

export function TypeformFlow() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<EmploymentAgreementFormData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  // Skip logic
  const getNextIndex = useCallback((fromIndex: number): number => {
    let nextIndex = fromIndex + 1;
    while (nextIndex < QUESTIONS.length && QUESTIONS[nextIndex].skipIf?.(formData)) {
      nextIndex++;
    }
    return nextIndex;
  }, [formData]);

  const handleNext = useCallback(() => {
    const nextIndex = getNextIndex(currentIndex);
    if (nextIndex < QUESTIONS.length) {
      setDirection('forward');
      setCurrentIndex(nextIndex);
    } else {
      // All questions answered - generate document
      handleGenerate();
    }
  }, [currentIndex, getNextIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('backward');
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleAnswer = useCallback((field: keyof EmploymentAgreementFormData, value: any) => {
    // Convert string booleans to actual booleans
    let finalValue = value;
    if (value === 'true') finalValue = true;
    if (value === 'false') finalValue = false;

    setFormData(prev => ({ ...prev, [field]: finalValue }));

    // Auto-advance for certain question types
    if (currentQuestion.type === 'cards' || currentQuestion.type === 'select') {
      setTimeout(handleNext, 300);
    }
  }, [currentQuestion, handleNext]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showWelcome && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setShowWelcome(false);
        return;
      }

      if (e.key === 'Enter' && !isGenerating && !showWelcome) {
        const value = formData[currentQuestion?.field];
        if (value !== undefined && value !== '') {
          handleNext();
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentQuestion, formData, handleNext, isGenerating, showWelcome]);

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-10 h-10 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Crafting Your Agreement</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            AI is generating a legally-sound employment agreement tailored to your needs...
          </p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Employment Agreement Generator
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12">
            Create a professional, legally-sound employment agreement in minutes.
            <br />
            <span className="text-white/70">No legal expertise required.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span>{QUESTIONS.length} smart questions</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span>AI-powered drafting</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span>~5 minutes</span>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="bg-white text-purple-600 px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform inline-flex items-center gap-3"
          >
            Let's get started
            <ChevronRight className="w-6 h-6" />
          </button>
          <p className="mt-8 text-white/60 text-sm">
            Press <kbd className="px-2 py-1 bg-white/20 rounded">Space</kbd> or{' '}
            <kbd className="px-2 py-1 bg-white/20 rounded">Enter</kbd> to begin
          </p>
        </motion.div>
      </div>
    );
  }

  const currentValue = formData[currentQuestion.field];
  const isAnswered = currentValue !== undefined && currentValue !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} of {QUESTIONS.length}
        </div>

        <div className="w-16" /> {/* Spacer for alignment */}
      </div>

      {/* Question Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              initial={{ opacity: 0, x: direction === 'forward' ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 'forward' ? -100 : 100 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Question Header */}
              <div className="space-y-4">
                {currentQuestion.icon && (
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto text-purple-600">
                    {currentQuestion.icon}
                  </div>
                )}
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {currentQuestion.question}
                  </h1>
                  {currentQuestion.subtitle && (
                    <p className="text-gray-500 text-lg">{currentQuestion.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                {currentQuestion.type === 'text' && (
                  <input
                    type="text"
                    value={(currentValue as string) || ''}
                    onChange={(e) => handleAnswer(currentQuestion.field, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'number' && (
                  <input
                    type="number"
                    value={(currentValue as string) || ''}
                    onChange={(e) => handleAnswer(currentQuestion.field, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'date' && (
                  <input
                    type="date"
                    value={(currentValue as string) || ''}
                    onChange={(e) => handleAnswer(currentQuestion.field, e.target.value)}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.field, option.value)}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-left group hover:border-purple-600 hover:shadow-lg ${
                          currentValue === option.value
                            ? 'border-purple-600 bg-purple-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:bg-purple-50'
                        }`}
                      >
                        {option.recommended && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                            Recommended
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          {option.icon && (
                            <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                              currentValue === option.value
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                            }`}>
                              {option.icon}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-gray-900">{option.label}</div>
                            {option.description && (
                              <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                            )}
                          </div>
                          {currentValue === option.value && (
                            <Check className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Continue Button (for text inputs) */}
              {(currentQuestion.type === 'text' || currentQuestion.type === 'number' || currentQuestion.type === 'date') && (
                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                  >
                    {currentIndex === QUESTIONS.length - 1 ? 'Generate Agreement' : 'Continue'}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {/* Hint */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Press <kbd className="px-2 py-1 bg-gray-200 rounded">Enter ↵</kbd> to continue
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
