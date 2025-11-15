'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Sparkles, HelpCircle, AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { SmartFieldSuggestion, ValidationWarning } from '@/lib/types/smart-form';
import { cn } from '@/lib/utils';
import { usePlacesAutocomplete } from '@/lib/hooks/usePlacesAutocomplete';

interface SmartInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'tel';
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  rows?: number; // For textarea

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
  rows = 3,
  suggestion,
  validation,
  loading = false,
  onApplySuggestion,
  enableAddressAutocomplete = false,
  autocompleteType = 'address',
  onAddressSelect,
  searchQuery,
}: SmartInputProps) {
  const isSuggestionApplied = suggestion && value === suggestion.value.toString();

  // Address autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [inputIsFocused, setInputIsFocused] = useState(false);
  
  // Use searchQuery if provided and user hasn't started typing, otherwise use the field's own value
  const queryToUse = (searchQuery && !userIsTyping) ? searchQuery : value;
  const [debouncedValue] = useDebounce(queryToUse, 500);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { suggestions, loading: suggestionsLoading, fetchSuggestions, clearSuggestions } =
    usePlacesAutocomplete(autocompleteType);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (enableAddressAutocomplete && debouncedValue && debouncedValue.length >= 3 && inputIsFocused) {
      fetchSuggestions(debouncedValue);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, enableAddressAutocomplete, inputIsFocused]);

  // Reset userIsTyping when searchQuery changes
  useEffect(() => {
    if (searchQuery && !value) {
      setUserIsTyping(false);
    }
  }, [searchQuery, value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setInputIsFocused(false);
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
    setUserIsTyping(false); // Reset typing state after selection
    setInputIsFocused(false); // Close suggestions
  };

  const handleInputChange = (newValue: string) => {
    // Mark that user is typing (to switch from searchQuery to their input)
    if (newValue !== value) {
      setUserIsTyping(true);
    }
    onChange(newValue);
  };

  const handleInputFocus = () => {
    setInputIsFocused(true);
    // Only show suggestions if we have them and the field has enough content
    const currentQuery = (searchQuery && !userIsTyping) ? searchQuery : value;
    if (enableAddressAutocomplete && currentQuery && currentQuery.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      setInputIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  const isLoading = loading || suggestionsLoading;
  const [showTooltip, setShowTooltip] = useState(false);
  const hasError = validation?.severity === 'error';
  const isTextarea = type === 'textarea';

  return (
    <Field 
      className="space-y-2" 
      ref={wrapperRef}
      data-invalid={hasError}
    >
      {/* Label with help icon */}
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>

        {helpText && (
          <div className="relative">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              aria-label={helpText}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-xl border border-background/10">
                {helpText}
                <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 bg-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input field */}
      <div className="relative">
        {isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            rows={rows}
            aria-invalid={hasError}
            className={cn(
              'flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
              validation?.severity === 'error' &&
                'border-[hsla(var(--destructive)_/_0.45)] focus-visible:border-[hsla(var(--destructive)_/_0.7)] focus-visible:ring-[hsla(var(--destructive)_/_0.35)]',
              validation?.severity === 'warning' &&
                'border-[hsla(var(--warning)_/_0.5)] focus-visible:border-[hsla(var(--warning)_/_0.7)] focus-visible:ring-[hsla(var(--warning)_/_0.3)]'
            )}
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            aria-invalid={hasError}
            className={cn(
              'text-base transition-all',
              validation?.severity === 'error' &&
                'border-[hsla(var(--destructive)_/_0.45)] focus-visible:border-[hsla(var(--destructive)_/_0.7)] focus-visible:ring-[hsla(var(--destructive)_/_0.35)]',
              validation?.severity === 'warning' &&
                'border-[hsla(var(--warning)_/_0.5)] focus-visible:border-[hsla(var(--warning)_/_0.7)] focus-visible:ring-[hsla(var(--warning)_/_0.3)]'
            )}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Address suggestions dropdown */}
        {enableAddressAutocomplete && showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-xl shadow-xl max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-accent/50 border-b last:border-b-0 transition-colors flex items-start gap-3 focus:outline-none focus:bg-accent/60"
              >
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {suggestion.structured_formatting ? (
                    <>
                      <div className="text-sm font-medium text-foreground truncate">
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-muted-foreground truncate leading-relaxed">
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
        <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-primary))/0.15] flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[hsl(var(--fg))]">AI Suggestion</p>
              <Badge
                variant="outline"
                className="text-xs border-[hsl(var(--brand-border))] bg-white text-[hsl(var(--brand-muted))]"
              >
                {suggestion.confidence} confidence
              </Badge>
            </div>
            <p className="text-sm text-[hsl(var(--fg))] font-medium">
              {suggestion.value}
            </p>
            <p className="text-xs text-[hsl(var(--brand-muted))] leading-relaxed">{suggestion.reason}</p>
            {onApplySuggestion && (
              <button
                type="button"
                onClick={onApplySuggestion}
                className="text-sm font-medium text-[hsl(var(--brand-primary))] underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all"
              >
                Apply suggestion
              </button>
            )}
          </div>
        </div>
      )}

      {/* Applied suggestion indicator */}
      {isSuggestionApplied && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--brand-muted))]">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--brand-primary))/0.15] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-3 w-3 text-[hsl(var(--brand-primary))]" />
          </div>
          <span className="font-medium">Using {suggestion.source} standard</span>
        </div>
      )}

      {/* Validation messages */}
      {validation && (
        <FieldError>
          <div
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-sm',
              validation.severity === 'error' &&
                'border-[hsla(var(--destructive)_/_0.35)] bg-[hsla(var(--destructive)_/_0.08)] text-[hsl(var(--destructive))]',
              validation.severity === 'warning' &&
                'border-[hsla(var(--warning)_/_0.4)] bg-[hsla(var(--warning)_/_0.12)] text-[hsla(var(--warning)_/_0.9)]',
              validation.severity === 'info' &&
                'border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))]'
            )}
          >
            <AlertCircle
              className={cn(
                'h-5 w-5 mt-0.5 flex-shrink-0',
                validation.severity === 'error' && 'text-[hsl(var(--destructive))]',
                validation.severity === 'warning' && 'text-[hsla(var(--warning)_/_0.9)]',
                validation.severity === 'info' && 'text-[hsl(var(--brand-primary))]'
              )}
            />
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold leading-relaxed">{validation.message}</p>
              {validation.suggestion && (
                <p className="text-xs opacity-90 leading-relaxed">{validation.suggestion}</p>
              )}
            </div>
          </div>
        </FieldError>
      )}
    </Field>
  );
}
