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
  const safeCurrent = React.useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(Math.max(currentStep, 0), steps.length - 1);
  }, [currentStep, steps.length]);

  const handleStepClick = (index: number) => {
    if (allowNavigation && onStepClick && index <= safeCurrent) {
      onStepClick(index);
    }
  };

  if (!steps.length) {
    return null;
  }

  const isScrollable = steps.length > 6;

  const stepsList = (
    <ol
      className={cn(
        'relative flex items-center',
        isScrollable ? 'min-w-max px-4 py-6' : 'w-full justify-between px-6 py-6'
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < safeCurrent;
        const isCurrent = index === safeCurrent;
        const isClickable = allowNavigation && (isCompleted || isCurrent);
        const leftSegmentActive = index <= safeCurrent;
        const rightSegmentActive = index < safeCurrent;

        return (
          <li
            key={step.id}
            className={cn(
              'relative flex flex-col items-center text-center',
              isScrollable ? 'flex-none min-w-[160px]' : 'flex-1'
            )}
          >
            {index !== 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-8 left-0 w-1/2 h-0.5 transition-colors duration-300 -translate-y-px',
                  leftSegmentActive
                    ? 'bg-[hsl(var(--selise-blue))]'
                    : 'bg-[hsl(var(--border))]'
                )}
              />
            )}
            {index !== steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-8 left-1/2 w-1/2 h-0.5 transition-colors duration-300 -translate-y-px',
                  rightSegmentActive
                    ? 'bg-[hsl(var(--selise-blue))]'
                    : 'bg-[hsl(var(--border))]'
                )}
              />
            )}

            <button
              type="button"
              onClick={() => handleStepClick(index)}
              disabled={!isClickable}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
              className={cn(
                'group flex flex-col items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--selise-blue))] focus-visible:ring-offset-2',
                isClickable && 'cursor-pointer hover:bg-[hsl(var(--brand-surface))] active:scale-95',
                !isClickable && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                  isCompleted && 
                    'border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))] text-white shadow-sm',
                  isCurrent &&
                    'border-[hsl(var(--selise-blue))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--selise-blue))] ring-2 ring-[hsl(var(--selise-blue))]/30 shadow-md',
                  !isCompleted &&
                    !isCurrent &&
                    'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <span className="font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium leading-tight line-clamp-2 max-w-[140px] transition-colors duration-200',
                  isCompleted && 'text-[hsl(var(--selise-blue))]',
                  isCurrent && 'text-[hsl(var(--fg))] font-semibold',
                  !isCompleted && !isCurrent && 'text-[hsl(var(--muted-foreground))]'
                )}
              >
                {step.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      {isScrollable ? (
        <div className="relative overflow-x-auto px-2 pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {stepsList}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-2">{stepsList}</div>
      )}
    </nav>
  );
}

// Compact variant for mobile or smaller spaces
function StepperCompact({
  steps,
  currentStep,
  className,
}: Omit<StepperProps, 'onStepClick' | 'allowNavigation'>) {
  const safeCurrent = React.useMemo(() => {
    if (!steps.length) return 0;
    return Math.min(Math.max(currentStep, 0), steps.length - 1);
  }, [currentStep, steps.length]);

  return (
    <div 
      className={cn('flex w-full items-center justify-center gap-1.5 px-4 py-3', className)}
      role="progressbar"
      aria-valuenow={safeCurrent + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Step ${safeCurrent + 1} of ${steps.length}`}
    >
      {steps.map((_, index) => {
        const isCompleted = index < safeCurrent;
        const isCurrent = index === safeCurrent;

        return (
          <div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              isCompleted && 'bg-[hsl(var(--selise-blue))] w-8',
              isCurrent && 'bg-[hsl(var(--selise-blue))] w-10 shadow-sm',
              !isCompleted && !isCurrent && 'bg-[hsl(var(--border))] w-6'
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export { Stepper, StepperCompact };
export type { Step, StepperProps };
