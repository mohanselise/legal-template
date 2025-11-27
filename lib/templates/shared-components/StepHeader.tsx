'use client';

/**
 * Shared Step Header Component
 * 
 * Consistent header styling for all form wizard steps across templates.
 */

import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StepHeaderProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Additional content below the header */
  children?: ReactNode;
}

export function StepHeader({ icon: Icon, title, subtitle, children }: StepHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[hsl(var(--brand-muted))]">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

