'use client';

/**
 * Shared Review Card Component
 * 
 * Displays a summary of form data in the review step with an edit button.
 */

import React, { type ReactNode } from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewField {
  label: string;
  value: string | number | boolean | undefined | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any) => string;
}

interface ReviewCardProps {
  /** Card title */
  title: string;
  /** Fields to display */
  fields: ReviewField[];
  /** Callback when edit button is clicked */
  onEdit?: () => void;
  /** Step index to navigate to on edit */
  editStepIndex?: number;
  /** Additional content after fields */
  children?: ReactNode;
}

export function ReviewCard({ 
  title, 
  fields, 
  onEdit, 
  children 
}: ReviewCardProps) {
  const formatValue = (field: ReviewField): string => {
    const value = field.value;
    
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    
    if (field.format) {
      return field.format(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <p className="font-semibold text-sm">{title}</p>
      <div className="space-y-2 text-sm">
        {fields.map((field, index) => (
          <div key={index}>
            <p className="text-xs text-muted-foreground">{field.label}</p>
            <p className="font-medium">{formatValue(field)}</p>
          </div>
        ))}
      </div>
      {children}
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
          <Edit3 className="w-3 h-3 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );
}

