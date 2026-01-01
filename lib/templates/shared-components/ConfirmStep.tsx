'use client';

/**
 * Shared Confirm Step Component
 * 
 * Final confirmation step with legal disclaimers before document generation.
 * Can be customized per template with different acknowledgments.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BackgroundGenerationResult } from '../types';

interface Acknowledgment {
  id: string;
  label: string;
  required: boolean;
}

interface ConfirmStepProps {
  /** Document type name (e.g., "Employment Agreement") */
  documentType: string;
  /** List of acknowledgments the user must accept */
  acknowledgments?: Acknowledgment[];
  /** Callback to start generation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStartGeneration?: (task: () => Promise<BackgroundGenerationResult<any> | null>) => void;
  /** Function that returns the generation task */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createGenerationTask?: () => Promise<BackgroundGenerationResult<any> | null>;
  /** Additional content before acknowledgments */
  preContent?: React.ReactNode;
  /** Additional content after acknowledgments */
  postContent?: React.ReactNode;
}

const DEFAULT_ACKNOWLEDGMENTS: Acknowledgment[] = [
  {
    id: 'disclaimer',
    label: 'I understand this is NOT legal advice and no attorney-client relationship is formed.',
    required: true,
  },
  {
    id: 'ai-content',
    label: 'I understand the content is AI-generated and may contain errors.',
    required: true,
  },
  {
    id: 'review',
    label: 'I will review the document and consult a legal professional if needed.',
    required: true,
  },
];

export function ConfirmStep({
  documentType,
  acknowledgments = DEFAULT_ACKNOWLEDGMENTS,
  onStartGeneration,
  createGenerationTask,
  preContent,
  postContent,
}: ConfirmStepProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const requiredAcknowledgments = acknowledgments.filter(a => a.required);
  const allRequiredChecked = requiredAcknowledgments.every(a => checkedItems.has(a.id));

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    if (!allRequiredChecked || !createGenerationTask) return;

    if (onStartGeneration) {
      onStartGeneration(createGenerationTask);
    } else {
      // Fallback: run generation directly
      setIsGenerating(true);
      createGenerationTask().finally(() => setIsGenerating(false));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
          Final confirmations
        </h2>
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          Please review and accept these terms before generating your {documentType.toLowerCase()}
        </p>
      </div>

      {preContent}

      {/* Acknowledgments */}
      <div className="space-y-4">
        {acknowledgments.map((acknowledgment) => (
          <motion.label
            key={acknowledgment.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${checkedItems.has(acknowledgment.id)
                ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05]'
                : 'border-[hsl(var(--brand-border))] hover:border-[hsl(var(--brand-primary))/0.5]'
              }
            `}
          >
            <div className={`
              w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
              ${checkedItems.has(acknowledgment.id)
                ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))] text-white'
                : 'border-[hsl(var(--brand-border))]'
              }
            `}>
              {checkedItems.has(acknowledgment.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
            </div>
            <input
              type="checkbox"
              checked={checkedItems.has(acknowledgment.id)}
              onChange={() => toggleCheck(acknowledgment.id)}
              className="sr-only"
            />
            <span className="text-base leading-relaxed text-[hsl(var(--fg))]">
              {acknowledgment.label}
              {acknowledgment.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </span>
          </motion.label>
        ))}
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold mb-1">Important Legal Notice</p>
            <p className="leading-relaxed">
              This tool generates documents for informational purposes only and does not constitute legal advice.
              Laws vary by jurisdiction and circumstance. Always consult a qualified attorney before using
              any legal document in your specific situation.
            </p>
          </div>
        </div>
      </div>

      {postContent}

      {/* Generate Button */}
      <div className="pt-4">
        <Button
          onClick={handleGenerate}
          disabled={!allRequiredChecked || isGenerating}
          className="w-full h-14 text-lg font-semibold bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))/0.9] text-white shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate {documentType}
            </>
          )}
        </Button>
        {!allRequiredChecked && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Please accept all required terms above to continue
          </p>
        )}
      </div>
    </div>
  );
}

