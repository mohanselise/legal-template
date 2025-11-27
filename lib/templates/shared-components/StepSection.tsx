'use client';

/**
 * Shared Step Section Component
 * 
 * Groups related form fields with a title and description.
 */

import React, { type ReactNode } from 'react';

interface StepSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Form fields or content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function StepSection({ title, description, children, className = '' }: StepSectionProps) {
  return (
    <div className={`space-y-5 ${className}`}>
      <div className="pb-2 border-b border-[hsl(var(--brand-border))]">
        <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[hsl(var(--brand-muted))]">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

