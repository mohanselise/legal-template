'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, Loader2, MessageCircle, FileText } from 'lucide-react';

type Message = {
  role: 'assistant' | 'user';
  content: string;
  type?: 'question' | 'info' | 'summary';
  options?: string[];
  inputType?: 'text' | 'select' | 'buttons' | 'date';
  questionId?: string;
};

type Answer = {
  questionId: string;
  question: string;
  answer: string;
};

const INITIAL_QUESTIONS = [
  {
    id: 'complexity',
    question: "Let's create your employment agreement! First, what level of detail do you need?",
    options: ['Basic - Simple, straightforward contract', 'Detailed - Comprehensive with specific clauses', 'Custom - I have specific requirements'],
    type: 'buttons' as const,
  },
];

export function SmartQuestionnaire() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI legal assistant. I'll help you create a professional employment agreement in just a few minutes.",
      type: 'info',
    },
  ]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState('');
  const [phase, setPhase] = useState<'questioning' | 'generating' | 'preview'>('questioning');

  useEffect(() => {
    // Ask first question after a short delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: INITIAL_QUESTIONS[0].question,
          type: 'question',
          options: INITIAL_QUESTIONS[0].options,
          inputType: INITIAL_QUESTIONS[0].type,
          questionId: INITIAL_QUESTIONS[0].id,
        },
      ]);
      setCurrentQuestionId(INITIAL_QUESTIONS[0].id);
    }, 1000);
  }, []);

  const handleAnswer = async (answer: string, questionId: string, questionText: string) => {
    // Add user's answer to chat
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: answer,
      },
    ]);

    // Store answer
    const newAnswer: Answer = { questionId, question: questionText, answer };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    setCurrentInput('');
    setIsThinking(true);

    try {
      // Get next question from AI
      const response = await fetch('/api/ai/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: updatedAnswers,
          currentPhase: phase,
        }),
      });

      const data = await response.json();

      setIsThinking(false);

      if (data.done) {
        // We have enough information, generate the document
        setPhase('generating');
        generateDocument(updatedAnswers);
      } else {
        // Ask next question
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.question,
            type: 'question',
            options: data.options,
            inputType: data.inputType || 'text',
            questionId: data.questionId,
          },
        ]);
        setCurrentQuestionId(data.questionId);
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setIsThinking(false);
    }
  };

  const generateDocument = async (finalAnswers: Answer[]) => {
    setIsGenerating(true);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: "Perfect! I have everything I need. Let me draft your employment agreement...",
        type: 'info',
      },
    ]);

    try {
      // Convert answers to structured format
      const structuredData = answersToStructuredData(finalAnswers);

      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structuredData),
      });

      const data = await response.json();

      // Navigate to preview
      const params = new URLSearchParams({
        document: data.document,
        data: JSON.stringify(structuredData),
      });
      window.location.href = `/templates/employment-agreement/generate/review?${params}`;
    } catch (error) {
      console.error('Error generating document:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, there was an error generating your document. Please try again.",
          type: 'info',
        },
      ]);
      setIsGenerating(false);
    }
  };

  const answersToStructuredData = (answers: Answer[]): any => {
    const data: any = {};
    answers.forEach((answer) => {
      // Map answer IDs to schema fields
      data[answer.questionId] = answer.answer;
    });
    return data;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-[hsl(var(--fg))]">AI-Powered Legal Assistant</span>
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--fg))] mb-2">Employment Agreement Generator</h1>
          <p className="text-[hsl(var(--brand-muted))]">Answer a few quick questions, and I'll handle the rest</p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-slide-up ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'assistant'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Sparkles className="w-5 h-5 text-white" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'assistant'
                        ? 'bg-gray-100 dark:bg-gray-700 text-[hsl(var(--fg))]'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>

                    {/* Options for button-type questions */}
                    {message.type === 'question' && message.inputType === 'buttons' && message.options && (
                      <div className="mt-4 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(option, message.questionId!, message.content)}
                            className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 text-[hsl(var(--fg))] rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 transition-all font-medium"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text input for current question */}
                    {message.type === 'question' &&
                      message.inputType === 'text' &&
                      index === messages.length - 1 &&
                      !isThinking && (
                        <div className="mt-4">
                          <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && currentInput.trim()) {
                                handleAnswer(currentInput, message.questionId!, message.content);
                              }
                            }}
                            placeholder="Type your answer..."
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-[hsl(var(--fg))] border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      )}

                    {/* Date input */}
                    {message.type === 'question' &&
                      message.inputType === 'date' &&
                      index === messages.length - 1 &&
                      !isThinking && (
                        <div className="mt-4">
                          <input
                            type="date"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-[hsl(var(--fg))] border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (currentInput) {
                                handleAnswer(currentInput, message.questionId!, message.content);
                              }
                            }}
                            disabled={!currentInput}
                            className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-[hsl(var(--brand-muted))]">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
                        Drafting your employment agreement...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input for text questions - moved outside for better UX */}
          {!isThinking &&
            !isGenerating &&
            messages.length > 0 &&
            messages[messages.length - 1]?.type === 'question' &&
            messages[messages.length - 1]?.inputType === 'text' && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentInput.trim()) {
                        handleAnswer(
                          currentInput,
                          messages[messages.length - 1].questionId!,
                          messages[messages.length - 1].content
                        );
                      }
                    }}
                    placeholder="Type your answer and press Enter..."
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-[hsl(var(--fg))] border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (currentInput.trim()) {
                        handleAnswer(
                          currentInput,
                          messages[messages.length - 1].questionId!,
                          messages[messages.length - 1].content
                        );
                      }
                    }}
                    disabled={!currentInput.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="font-medium">Send</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Progress indicator */}
        {answers.length > 0 && !isGenerating && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-[hsl(var(--brand-muted))]">
                {answers.length} {answers.length === 1 ? 'question' : 'questions'} answered
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
