'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, Check, Loader2, Building2, Briefcase, DollarSign, FileText, Shield } from 'lucide-react';

type Question = {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'select' | 'date' | 'radio' | 'textarea';
  options?: { value: string; label: string; description?: string }[];
  required?: boolean;
  helpText?: string;
  icon?: any;
};

type Answer = {
  questionId: string;
  answer: string;
};

const INITIAL_QUESTION: Question = {
  id: 'complexity',
  label: 'What type of employment agreement do you need?',
  type: 'radio',
  required: true,
  icon: FileText,
  options: [
    {
      value: 'basic',
      label: 'Basic Agreement',
      description: 'Simple, straightforward contract with essential terms',
    },
    {
      value: 'detailed',
      label: 'Detailed Agreement',
      description: 'Comprehensive contract with benefits and legal protections',
    },
    {
      value: 'custom',
      label: 'Custom Agreement',
      description: 'Tailored contract with specific clauses and requirements',
    },
  ],
};

export function ModernForm() {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(INITIAL_QUESTION);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnswer = async (value: string) => {
    // Store answer
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      answer: value,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    setProgress(Math.min(progress + 15, 90));

    setIsLoading(true);

    try {
      // Get next question from AI
      const response = await fetch('/api/ai/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const data = await response.json();

      if (data.done) {
        // Generate document
        setProgress(100);
        generateDocument(updatedAnswers);
      } else {
        // Show next question
        const nextQuestion: Question = {
          id: data.questionId,
          label: data.question,
          type: data.inputType || 'text',
          options: data.options?.map((opt: string) => ({
            value: opt.toLowerCase().replace(/\s+/g, '-'),
            label: opt,
          })),
          icon: getIconForQuestion(data.questionId),
        };
        setCurrentQuestion(nextQuestion);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocument = async (finalAnswers: Answer[]) => {
    setIsGenerating(true);

    try {
      const structuredData = answersToData(finalAnswers);
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredData),
      });

      const data = await response.json();
      const params = new URLSearchParams({
        document: data.document,
        data: JSON.stringify(structuredData),
      });
      window.location.href = `/templates/employment-agreement/generate/review?${params}`;
    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
    }
  };

  const answersToData = (answers: Answer[]) => {
    const data: any = {};
    answers.forEach((ans) => {
      data[ans.questionId] = ans.answer;
    });
    return data;
  };

  const getIconForQuestion = (questionId: string) => {
    if (questionId.includes('company')) return Building2;
    if (questionId.includes('job') || questionId.includes('title')) return Briefcase;
    if (questionId.includes('salary') || questionId.includes('compensation')) return DollarSign;
    if (questionId.includes('legal') || questionId.includes('clause')) return Shield;
    return FileText;
  };

  if (isGenerating) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[hsl(222,89%,97%)] to-[hsl(262,83%,97%)] dark:from-gray-900 dark:to-gray-800 flex items-center justify-center overflow-hidden">
        {/* Background spinning graphic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/graphics/black-spin-bg.webp"
            alt=""
            width={600}
            height={600}
            className="opacity-[0.03] dark:opacity-[0.08] animate-[spin_60s_linear_infinite]"
          />
        </div>
        <div className="relative text-center space-y-6 px-4">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] rounded-full opacity-20 animate-ping"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-[hsl(var(--brand-primary))] animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[hsl(var(--fg))] mb-2">Generating Your Agreement</h2>
            <p className="text-[hsl(var(--brand-muted))] max-w-md mx-auto">
              Our AI is crafting a professional employment agreement based on your requirements...
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = currentQuestion.icon || FileText;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[hsl(222,89%,97%)] to-[hsl(262,83%,97%)] dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0">
        <Image
          src="/graphics/bg-black-texture.webp"
          alt=""
          fill
          className="object-cover opacity-[0.02] dark:opacity-[0.05]"
          priority
        />
      </div>
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4 border border-[hsl(var(--border))]">
            <Sparkles className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
            <span className="text-sm font-medium text-[hsl(var(--brand-muted))]">
              AI-Powered • {answers.length} {answers.length === 1 ? 'answer' : 'answers'} provided
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--fg))] mb-2">
            Employment Agreement Generator
          </h1>
          <p className="text-[hsl(var(--brand-muted))]">
            Answer a few questions to create your customized agreement
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-[hsl(var(--border))] overflow-hidden">
          {/* Question Section */}
          <div className="p-8 md:p-12">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-primary))]/10 to-[hsl(var(--brand-secondary))]/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-[hsl(var(--brand-primary))]" />
              </div>
            </div>

            {/* Question Label */}
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(var(--fg))] mb-2">
              {currentQuestion.label}
            </h2>

            {currentQuestion.helpText && (
              <p className="text-sm text-[hsl(var(--brand-muted))] mb-6">{currentQuestion.helpText}</p>
            )}

            {/* Input Fields */}
            <div className="mt-8">
              {currentQuestion.type === 'radio' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      disabled={isLoading}
                      className="w-full text-left p-6 rounded-xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--brand-primary))] hover:bg-gradient-to-br hover:from-[hsl(var(--brand-primary))]/5 hover:to-[hsl(var(--brand-secondary))]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--border))] group-hover:border-[hsl(var(--brand-primary))] flex-shrink-0 mt-1"></div>
                        <div>
                          <div className="font-semibold text-[hsl(var(--fg))] mb-1 group-hover:text-[hsl(var(--brand-primary))]">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-[hsl(var(--brand-muted))]">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'select' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      disabled={isLoading}
                      className="w-full text-left px-6 py-4 rounded-xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/5 transition-all font-medium text-[hsl(var(--fg))] hover:text-[hsl(var(--brand-primary))] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentAnswer.trim()) {
                        handleAnswer(currentAnswer);
                      }
                    }}
                    placeholder={currentQuestion.placeholder}
                    className="w-full px-4 py-4 text-lg border-2 border-[hsl(var(--border))] rounded-xl focus:border-[hsl(var(--brand-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]/20 transition-all bg-white dark:bg-gray-900 text-[hsl(var(--fg))]"
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      if (currentAnswer.trim()) {
                        handleAnswer(currentAnswer);
                      }
                    }}
                    disabled={!currentAnswer.trim() || isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {currentQuestion.type === 'date' && (
                <div className="space-y-4">
                  <input
                    type="date"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-[hsl(var(--border))] rounded-xl focus:border-[hsl(var(--brand-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]/20 transition-all bg-white dark:bg-gray-900 text-[hsl(var(--fg))]"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      if (currentAnswer) {
                        handleAnswer(currentAnswer);
                      }
                    }}
                    disabled={!currentAnswer || isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {currentQuestion.type === 'textarea' && (
                <div className="space-y-4">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    rows={4}
                    className="w-full px-4 py-4 text-lg border-2 border-[hsl(var(--border))] rounded-xl focus:border-[hsl(var(--brand-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]/20 transition-all bg-white dark:bg-gray-900 text-[hsl(var(--fg))] resize-none"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      if (currentAnswer.trim()) {
                        handleAnswer(currentAnswer);
                      }
                    }}
                    disabled={!currentAnswer.trim() || isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Footer */}
          {answers.length > 0 && (
            <div className="border-t border-[hsl(var(--border))] bg-gray-50 dark:bg-gray-900/50 px-8 py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[hsl(var(--brand-muted))]">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{answers.length} questions answered</span>
                </div>
                <span className="text-[hsl(var(--brand-muted))]">
                  Almost there...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--brand-muted))]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Legally Sound</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Ready in Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
