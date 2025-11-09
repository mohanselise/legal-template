'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { SmartFieldSuggestion, ValidationWarning } from '@/lib/types/smart-form';
import { cn } from '@/lib/utils';
import { usePlacesAutocomplete } from '@/lib/hooks/usePlacesAutocomplete';

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

  // Address autocomplete
  enableAddressAutocomplete?: boolean;
  autocompleteType?: 'establishment' | 'address';
  onAddressSelect?: (address: string) => void; // Callback for when establishment is selected
  searchQuery?: string; // External query to use for address search (e.g., company name)
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
  enableAddressAutocomplete = false,
  autocompleteType = 'address',
  onAddressSelect,
  searchQuery,
}: SmartInputProps) {
  const hasValue = value && value.length > 0;
  const isSuggestionApplied = suggestion && value === suggestion.value.toString();

  // Address autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Use searchQuery if provided, otherwise use the field's own value
  const queryToUse = searchQuery || value;
  const [debouncedValue] = useDebounce(queryToUse, 500);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { suggestions, loading: suggestionsLoading, fetchSuggestions, clearSuggestions } =
    usePlacesAutocomplete(autocompleteType);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (enableAddressAutocomplete && debouncedValue && debouncedValue.length >= 3) {
      fetchSuggestions(debouncedValue);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
    }
  }, [debouncedValue, enableAddressAutocomplete, fetchSuggestions, clearSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: { description: string; structured_formatting?: { main_text: string } }) => {
    // Just set the full address
    onChange(suggestion.description);
    setShowSuggestions(false);
    clearSuggestions();
  };

  const isLoading = loading || suggestionsLoading;

  return (
    <div className="space-y-2" ref={wrapperRef}>
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
          onFocus={() => {
            if (enableAddressAutocomplete && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            'transition-all',
            validation?.severity === 'error' && 'border-destructive focus:ring-destructive',
            validation?.severity === 'warning' && 'border-yellow-500 focus:ring-yellow-500',
            hasValue && !validation && 'border-green-500 focus:ring-green-500'
          )}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Address suggestions dropdown */}
        {enableAddressAutocomplete && showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {suggestion.structured_formatting ? (
                    <>
                      <div className="text-sm font-medium text-foreground truncate">
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-foreground">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
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
