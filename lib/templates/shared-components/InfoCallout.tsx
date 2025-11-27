'use client';

/**
 * Shared Info Callout Component
 * 
 * Styled information box for tips, warnings, and status messages.
 */

import React, { type ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

type CalloutVariant = 'info' | 'warning' | 'error' | 'success' | 'loading';

interface InfoCalloutProps {
  /** Callout variant/type */
  variant?: CalloutVariant;
  /** Main message content */
  children: ReactNode;
  /** Optional title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<CalloutVariant, { 
  container: string; 
  icon: typeof Info;
  iconClass: string;
}> = {
  info: {
    container: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    container: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  success: {
    container: 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800',
    icon: CheckCircle2,
    iconClass: 'text-green-600 dark:text-green-400',
  },
  loading: {
    container: 'border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))]',
    icon: Sparkles,
    iconClass: 'text-[hsl(var(--brand-primary))] animate-pulse',
  },
};

export function InfoCallout({ 
  variant = 'info', 
  children, 
  title,
  className = '' 
}: InfoCalloutProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles.container} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.iconClass}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-[hsl(var(--fg))] mb-1">{title}</p>
          )}
          <div className="text-[hsl(var(--brand-muted))] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

