'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { SmartFieldSuggestion, ValidationWarning } from '@/lib/types/smart-form';
import { cn } from '@/lib/utils';

interface SmartInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email';
  placeholder?: string;
  required?: boolean;
  helpText?: string;

  // Smart features
  suggestion?: SmartFieldSuggestion;
  validation?: ValidationWarning;
  loading?: boolean;

  // Apply suggestion callback
  onApplySuggestion?: () => void;
}

export function SmartInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  suggestion,
  validation,
  loading = false,
  onApplySuggestion,
}: SmartInputProps) {
  const hasValue = value && value.length > 0;
  const isSuggestionApplied = suggestion && value === suggestion.value.toString();

  return (
    <div className="space-y-2">
      {/* Label with help icon */}
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Input field */}
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'transition-all',
            validation?.severity === 'error' && 'border-destructive focus:ring-destructive',
            validation?.severity === 'warning' && 'border-yellow-500 focus:ring-yellow-500',
            hasValue && !validation && 'border-green-500 focus:ring-green-500'
          )}
        />

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* AI Suggestion badge */}
      {suggestion && !isSuggestionApplied && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-blue-900">AI Suggestion</p>
              <Badge variant="outline" className="text-xs">
                {suggestion.confidence} confidence
              </Badge>
            </div>
            <p className="text-sm text-blue-700">
              <strong>{suggestion.value}</strong>
            </p>
            <p className="text-xs text-blue-600">{suggestion.reason}</p>
            {onApplySuggestion && (
              <button
                type="button"
                onClick={onApplySuggestion}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Apply suggestion
              </button>
            )}
          </div>
        </div>
      )}

      {/* Applied suggestion indicator */}
      {isSuggestionApplied && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Using {suggestion.source} standard</span>
        </div>
      )}

      {/* Validation messages */}
      {validation && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border p-3',
            validation.severity === 'error' &&
              'border-red-200 bg-red-50 text-red-900',
            validation.severity === 'warning' &&
              'border-yellow-200 bg-yellow-50 text-yellow-900',
            validation.severity === 'info' && 'border-blue-200 bg-blue-50 text-blue-900'
          )}
        >
          <AlertCircle
            className={cn(
              'h-4 w-4 mt-0.5 flex-shrink-0',
              validation.severity === 'error' && 'text-red-600',
              validation.severity === 'warning' && 'text-yellow-600',
              validation.severity === 'info' && 'text-blue-600'
            )}
          />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{validation.message}</p>
            {validation.suggestion && (
              <p className="text-xs opacity-90">{validation.suggestion}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
