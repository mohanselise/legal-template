'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  allowNavigation?: boolean;
  className?: string;
}

function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = true,
  className,
}: StepperProps) {
  const handleStepClick = (index: number) => {
    // Only allow clicking on completed steps
    if (allowNavigation && onStepClick && index < currentStep) {
      onStepClick(index);
    }
  };

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowNavigation && isCompleted;

          return (
            <li key={step.id} className="flex-1 group">
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex flex-col items-center gap-2 py-2 px-1 rounded-lg transition-all',
                  isClickable && 'cursor-pointer hover:bg-[hsl(var(--brand-surface))]',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step indicator circle */}
                <div
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))] text-white',
                    isCurrent && 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))]/10 text-[hsl(var(--brand-primary))] ring-4 ring-[hsl(var(--brand-primary))]/20',
                    !isCompleted && !isCurrent && 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step title - hidden on mobile, visible on larger screens */}
                <span
                  className={cn(
                    'hidden sm:block text-xs font-medium text-center leading-tight max-w-[80px] truncate',
                    isCompleted && 'text-[hsl(var(--brand-primary))]',
                    isCurrent && 'text-[hsl(var(--fg))] font-semibold',
                    !isCompleted && !isCurrent && 'text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {step.title}
                </span>
              </button>

              {/* Connector line - hidden for last step */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'hidden sm:block absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2',
                    isCompleted ? 'bg-[hsl(var(--brand-primary))]' : 'bg-[hsl(var(--border))]'
                  )}
                  style={{ width: 'calc(100% - 2rem)', marginLeft: '1rem' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact variant for mobile or smaller spaces
function StepperCompact({
  steps,
  currentStep,
  className,
}: Omit<StepperProps, 'onStepClick' | 'allowNavigation'>) {
  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      {steps.map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all',
              isCompleted && 'bg-[hsl(var(--brand-primary))] w-8',
              isCurrent && 'bg-[hsl(var(--brand-primary))] w-12',
              !isCompleted && !isCurrent && 'bg-[hsl(var(--border))] w-6'
            )}
          />
        );
      })}
    </div>
  );
}

export { Stepper, StepperCompact };
export type { Step, StepperProps };

