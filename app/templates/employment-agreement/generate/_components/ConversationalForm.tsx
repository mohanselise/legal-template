'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { conversationalSchema, conversationalDefaults, type ConversationalFormData } from '../schema-v2';
import { Sparkles, ArrowRight, Check, Loader2 } from 'lucide-react';

type Question = {
  id: keyof ConversationalFormData;
  question: string;
  type: 'text' | 'email' | 'date' | 'select' | 'yesno' | 'textarea' | 'multiselect';
  options?: { value: string; label: string }[];
  placeholder?: string;
  helper?: string;
  aiSuggest?: boolean;
  dependsOn?: { field: keyof ConversationalFormData; value: any };
  group?: string; // For grouping related questions
};

const questions: Question[] = [
  // Company basics
  {
    id: 'companyName',
    question: "What's your company name?",
    type: 'text',
    placeholder: 'e.g., Acme Corporation',
    aiSuggest: false,
    group: 'company',
  },
  {
    id: 'companyCountry',
    question: 'Where is your company based?',
    type: 'text',
    placeholder: 'e.g., United States',
    helper: 'This helps us ensure legal compliance',
    group: 'company',
  },

  // Employee info choice
  {
    id: 'hasEmployeeInfo',
    question: 'Do you know who the employee will be, or would you like to leave it blank for them to fill later?',
    type: 'yesno',
    helper: 'You can generate a template that the employee fills in themselves',
  },
  {
    id: 'employeeName',
    question: "What's the employee's full name?",
    type: 'text',
    placeholder: 'e.g., John Smith',
    dependsOn: { field: 'hasEmployeeInfo', value: true },
  },
  {
    id: 'employeeEmail',
    question: "What's their email address?",
    type: 'email',
    placeholder: 'john@example.com',
    dependsOn: { field: 'hasEmployeeInfo', value: true },
  },

  // Position
  {
    id: 'jobTitle',
    question: "What's the job title for this position?",
    type: 'text',
    placeholder: 'e.g., Senior Software Engineer',
    aiSuggest: true,
    group: 'position',
  },
  {
    id: 'department',
    question: 'Which department will they work in?',
    type: 'text',
    placeholder: 'e.g., Engineering (optional)',
    group: 'position',
  },
  {
    id: 'hasReportsTo',
    question: 'Would you like to specify who this person reports to?',
    type: 'yesno',
  },
  {
    id: 'reportsTo',
    question: 'Who will they report to?',
    type: 'text',
    placeholder: 'e.g., VP of Engineering',
    dependsOn: { field: 'hasReportsTo', value: true },
  },
  {
    id: 'employmentType',
    question: 'What type of employment is this?',
    type: 'select',
    options: [
      { value: 'full-time', label: 'Full-Time' },
      { value: 'part-time', label: 'Part-Time' },
      { value: 'contract', label: 'Contract' },
    ],
  },
  {
    id: 'startDate',
    question: 'When will they start?',
    type: 'date',
    helper: 'You can always adjust this date later',
  },

  // Compensation
  {
    id: 'salaryAmount',
    question: "What's the base salary?",
    type: 'text',
    placeholder: '120000',
    group: 'compensation',
  },
  {
    id: 'salaryPeriod',
    question: 'Is that per hour, per year, or something else?',
    type: 'select',
    options: [
      { value: 'annual', label: 'Per Year' },
      { value: 'monthly', label: 'Per Month' },
      { value: 'hourly', label: 'Per Hour' },
      { value: 'weekly', label: 'Per Week' },
      { value: 'bi-weekly', label: 'Bi-Weekly' },
    ],
    group: 'compensation',
  },
  {
    id: 'hasBonus',
    question: 'Will there be any bonus or commission structure?',
    type: 'yesno',
  },
  {
    id: 'bonusStructure',
    question: 'Tell me about the bonus structure',
    type: 'textarea',
    placeholder: 'e.g., Annual performance bonus up to 15% of base salary',
    dependsOn: { field: 'hasBonus', value: true },
  },
  {
    id: 'hasEquity',
    question: 'Will you be offering stock options or equity?',
    type: 'yesno',
  },
  {
    id: 'equityOffered',
    question: 'Describe the equity compensation',
    type: 'textarea',
    placeholder: 'e.g., 10,000 stock options with 4-year vesting',
    dependsOn: { field: 'hasEquity', value: true },
  },

  // Benefits
  {
    id: 'hasBenefits',
    question: 'Would you like to specify benefits (health insurance, PTO, etc.)?',
    type: 'yesno',
  },
  {
    id: 'paidTimeOff',
    question: 'How many days of paid time off per year?',
    type: 'text',
    placeholder: 'e.g., 20 days',
    dependsOn: { field: 'hasBenefits', value: true },
  },

  // Work arrangement
  {
    id: 'workArrangement',
    question: 'Where will they work?',
    type: 'select',
    options: [
      { value: 'on-site', label: 'On-Site at Office' },
      { value: 'remote', label: 'Fully Remote' },
      { value: 'hybrid', label: 'Hybrid (Mix of both)' },
    ],
    group: 'work',
  },
  {
    id: 'workLocation',
    question: "What's the work location?",
    type: 'text',
    placeholder: 'e.g., 123 Main St, San Francisco, CA',
    helper: 'For remote workers, you can specify "Remote" or the employee location',
    group: 'work',
  },

  // Legal
  {
    id: 'includeNonCompete',
    question: 'Do you want to include a non-compete agreement?',
    type: 'yesno',
    helper: 'Note: Non-competes are not enforceable in some states like California',
  },
  {
    id: 'governingLaw',
    question: 'Which state or country laws should govern this agreement?',
    type: 'text',
    placeholder: 'e.g., State of California',
    helper: 'Usually where your company is based',
  },
];

const STORAGE_KEY = 'employment-agreement-conversation';

export function ConversationalForm() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const form = useForm<ConversationalFormData>({
    resolver: zodResolver(conversationalSchema),
    defaultValues: conversationalDefaults,
    mode: 'onChange',
  });

  const { watch, setValue, trigger } = form;
  const formData = watch();

  // Auto-save
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to load saved data');
      }
    }
  }, [form]);

  // Get current question
  const currentQuestion = questions[currentIndex];

  // Check if question should be shown based on dependencies
  const shouldShowQuestion = (q: Question): boolean => {
    if (!q.dependsOn) return true;
    const dependentValue = formData[q.dependsOn.field];
    return dependentValue === q.dependsOn.value;
  };

  // Get next valid question index
  const getNextQuestionIndex = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < questions.length; i++) {
      if (shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return questions.length; // End of questions
  };

  const handleNext = async () => {
    const isValid = await trigger(currentQuestion.id);
    if (!isValid) return;

    const nextIndex = getNextQuestionIndex(currentIndex);

    if (nextIndex >= questions.length) {
      // Finished!
      setShowSuccess(true);
      handleGenerate();
    } else {
      setCurrentIndex(nextIndex);
      // Get AI suggestion for next question if applicable
      if (questions[nextIndex]?.aiSuggest) {
        getSuggestion(questions[nextIndex]);
      }
    }
  };

  const handlePrevious = () => {
    // Find previous valid question
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (shouldShowQuestion(questions[i])) {
        setCurrentIndex(i);
        break;
      }
    }
  };

  const getSuggestion = async (question: Question) => {
    if (!question.aiSuggest) return;

    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          context: formData,
          field: question.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleGenerate = async () => {
    // Navigate to review page with form data
    const params = new URLSearchParams({ data: JSON.stringify(formData) });
    window.location.href = `/templates/employment-agreement/generate/review?${params}`;
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[hsl(var(--fg))]">All Set!</h2>
          <p className="text-[hsl(var(--brand-muted))]">Generating your employment agreement...</p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--brand-primary))]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Question Counter */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-[hsl(var(--brand-muted))] shadow-sm">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-8 transform transition-all duration-500 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--fg))] mb-6">
            {currentQuestion.question}
          </h2>

          {currentQuestion.helper && (
            <p className="text-sm text-[hsl(var(--brand-muted))] mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {currentQuestion.helper}
            </p>
          )}

          {/* AI Suggestion */}
          {isLoadingSuggestion && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Getting AI suggestions...</span>
              </div>
            </div>
          )}

          {aiSuggestion && !isLoadingSuggestion && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-1">AI Suggestion</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{aiSuggestion}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(currentQuestion.id, aiSuggestion as any);
                      setAiSuggestion(null);
                    }}
                    className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Use this suggestion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input Field */}
          <QuestionInput
            question={currentQuestion}
            value={formData[currentQuestion.id]}
            onChange={(value: string) => setValue(currentQuestion.id, value as any)}
            error={form.formState.errors[currentQuestion.id]?.message as string}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 text-[hsl(var(--brand-muted))] hover:text-[hsl(var(--fg))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-3 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            {currentIndex === questions.length - 1 ? 'Generate Agreement' : 'Continue'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

// Question Input Component
function QuestionInput({ question, value, onChange, error }: any) {
  if (question.type === 'yesno') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            value === true
              ? 'border-[hsl(var(--brand-primary))] bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-[hsl(var(--brand-primary))]/50'
          }`}
        >
          <span className="text-lg font-medium">Yes</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            value === false
              ? 'border-[hsl(var(--brand-primary))] bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-[hsl(var(--brand-primary))]/50'
          }`}
        >
          <span className="text-lg font-medium">No</span>
        </button>
      </div>
    );
  }

  if (question.type === 'select') {
    return (
      <div className="space-y-3">
        {question.options?.map((option: any) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              value === option.value
                ? 'border-[hsl(var(--brand-primary))] bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-[hsl(var(--brand-primary))]/50'
            }`}
          >
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'textarea') {
    return (
      <div>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-[hsl(var(--brand-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]/20 transition-all"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Default text/email/date input
  return (
    <div>
      <input
        type={question.type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-[hsl(var(--brand-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]/20 transition-all"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
