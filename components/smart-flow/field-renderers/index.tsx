"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Sparkles, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ADDITIONAL_SIGNATORIES_FIELD_NAME,
  AdditionalSignatoryInput,
  SIGNATORY_PARTY_OPTIONS,
  createBlankAdditionalSignatory,
  ensureAdditionalSignatoryArray,
} from "@/lib/templates/signatory-fields";
import type { FieldConfig, FieldRendererProps } from "./types";

// Import new composite field renderers
import { TextareaField } from "./TextareaField";
import { PhoneField } from "./PhoneField";
import { AddressField } from "./AddressField";
import { PartyField } from "./PartyField";
import { CurrencyField } from "./CurrencyField";
import { PercentageField } from "./PercentageField";
import { UrlField } from "./UrlField";

// Re-export types and utilities
export type { FieldConfig, FieldRendererProps, AddressValue, PartyValue, PhoneValue, CurrencyValue } from "./types";
export { COUNTRY_CODES, CURRENCIES, COUNTRIES } from "./types";
export * from "./utils";

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve template variables in a string
 * Supports {{variableName}} and {{variableName|fallback text}} syntax
 * Looks up values from formData first, then enrichmentContext
 * Falls back to provided fallback text, or shows the variable name if not found
 */
function resolveTemplateVariables(
  template: string | null | undefined,
  formData?: Record<string, unknown>,
  enrichmentContext?: Record<string, unknown>
): string {
  if (!template) return "";

  // Match all {{variableName}} or {{variableName|fallback text}} patterns
  return template.replace(/\{\{([^}|]+)(?:\|([^}]*))?\}\}/g, (match, variableName, fallbackText) => {
    const trimmedName = variableName.trim();
    const fallback = fallbackText !== undefined && fallbackText.trim() !== "" 
      ? fallbackText.trim() 
      : `[${trimmedName}]`;

    // Try to get value from formData first
    if (formData) {
      const formValue = getNestedValue(formData, trimmedName);
      if (formValue !== undefined && formValue !== null && formValue !== "") {
        return String(formValue);
      }
    }

    // Try to get value from enrichmentContext
    if (enrichmentContext) {
      const contextValue = getNestedValue(enrichmentContext, trimmedName);
      if (contextValue !== undefined && contextValue !== null && contextValue !== "") {
        return String(contextValue);
      }
    }

    // Fallback: use provided fallback text or default placeholder
    return fallback;
  });
}

/**
 * AI Suggestion Indicator - unified component for showing AI-suggested standard values
 * 
 * States:
 * 1. Loading - waiting for enrichment context (shows subtle AI badge)
 * 2. Applied - value matches suggestion (shows green checkmark)
 * 3. Available - suggestion ready, field empty (shows "Use standard: [value]" button)
 * 4. Hidden - user is typing their own value (no UI shown, don't interfere)
 */
function AISuggestionIndicator({
  suggestionKey,
  enrichmentContext,
  currentValue,
  onApply,
  variant = "label", // "label" for header position, "inline" for inside input
}: {
  suggestionKey: string;
  enrichmentContext?: Record<string, unknown>;
  currentValue: unknown;
  onApply: (value: unknown) => void;
  variant?: "label" | "inline";
}) {
  if (!suggestionKey) return null;

  // State 1: Loading - waiting for enrichment context
  if (!enrichmentContext || Object.keys(enrichmentContext).length === 0) {
    // Only show loading state in label variant to avoid clutter
    if (variant === "inline") return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
        title="AI suggestion will appear after completing the previous step"
      >
        <Sparkles className="h-3 w-3 opacity-50" />
        <span className="opacity-70">AI</span>
      </span>
    );
  }

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);
  
  // No suggestion available
  if (suggestedValue === undefined || suggestedValue === null) {
    return null;
  }

  const suggestedStr = String(suggestedValue);
  const currentStr = currentValue !== undefined && currentValue !== null 
    ? String(currentValue) 
    : "";
  
  // State 2: Applied - value matches suggestion
  if (suggestedStr === currentStr) {
    // Only show in label variant
    if (variant === "inline") return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-emerald-50 text-emerald-600 border border-emerald-200"
      >
        <Check className="h-3 w-3" />
        <span>Standard applied</span>
      </span>
    );
  }

  // State 4: Hidden - user has typed their own value (different from suggestion and not empty)
  // Don't show suggestion UI when user is entering custom value to avoid confusion
  const hasCustomValue = currentStr.length > 0 && currentStr !== suggestedStr;
  if (hasCustomValue) {
    return null;
  }

  // State 3: Available - suggestion ready, show apply button
  // Only show in one location (inline variant takes priority when field is empty)
  if (variant === "label") {
    // For label position, only show if this is being used alone (for backwards compat)
    return null;
  }

  // Truncate long values for display
  const displayValue = suggestedStr.length > 30 
    ? suggestedStr.substring(0, 30) + "..." 
    : suggestedStr;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onApply(suggestedValue);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
        bg-[hsl(var(--selise-blue))]/5 text-[hsl(var(--selise-blue))] 
        hover:bg-[hsl(var(--selise-blue))]/15 transition-all cursor-pointer
        border border-[hsl(var(--selise-blue))]/20 hover:border-[hsl(var(--selise-blue))]/40
        shadow-sm hover:shadow"
      title={`Apply standard value: ${suggestedStr}`}
    >
      <Sparkles className="h-3 w-3" />
      <span className="whitespace-nowrap">Use standard: <span className="font-semibold">{displayValue}</span></span>
    </button>
  );
}

/**
 * AI Suggestion Status Badge - shows only the status (loading/applied) in the label area
 * This is separate from the apply button to avoid redundancy
 */
function AISuggestionStatusBadge({
  suggestionKey,
  enrichmentContext,
  currentValue,
}: {
  suggestionKey: string;
  enrichmentContext?: Record<string, unknown>;
  currentValue: unknown;
}) {
  if (!suggestionKey) return null;

  // Loading state
  if (!enrichmentContext || Object.keys(enrichmentContext).length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
        title="AI suggestion will appear after completing the previous step"
      >
        <Sparkles className="h-3 w-3 opacity-50" />
        <span className="opacity-70">AI</span>
      </span>
    );
  }

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);
  
  if (suggestedValue === undefined || suggestedValue === null) {
    return null;
  }

  const suggestedStr = String(suggestedValue);
  const currentStr = currentValue !== undefined && currentValue !== null 
    ? String(currentValue) 
    : "";

  // Applied state
  if (suggestedStr === currentStr) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-emerald-50 text-emerald-600 border border-emerald-200"
      >
        <Check className="h-3 w-3" />
        <span>Standard applied</span>
      </span>
    );
  }

  // No badge shown when suggestion is available but not applied (user will see "Apply Standards" banner)
  return null;
}

/**
 * Get the suggested value for an input placeholder
 */
function getSuggestionPlaceholder(
  suggestionKey: string | null | undefined,
  enrichmentContext?: Record<string, unknown>,
  fallbackPlaceholder?: string | null
): string {
  if (!suggestionKey || !enrichmentContext) return fallbackPlaceholder || "";

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);
  if (suggestedValue !== undefined && suggestedValue !== null) {
    return String(suggestedValue);
  }

  return fallbackPlaceholder || "";
}

/**
 * Text Field Renderer
 */
export function TextField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables in label, placeholder, and helpText
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Use AI suggestion as placeholder if available, otherwise use the field's placeholder
  const suggestionPlaceholder = showSuggestion
    ? getSuggestionPlaceholder(field.aiSuggestionKey, enrichmentContext, field.placeholder)
    : resolveTemplateVariables(field.placeholder, formData, enrichmentContext);

  // Check if suggestion is available and field is empty (for layout adjustments)
  const currentStr = value !== undefined && value !== null ? String(value) : "";
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const showInlineButton = showSuggestion && hasEnrichment && suggestedValue !== null && currentStr.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          type="text"
          placeholder={suggestionPlaceholder || undefined}
          value={(value as string) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            error ? "border-destructive" : "",
            showInlineButton ? "pr-44" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AISuggestionIndicator
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
              variant="inline"
            />
          </div>
        )}
      </div>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Email Field Renderer
 */
export function EmailField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Use AI suggestion as placeholder if available
  const suggestionPlaceholder = showSuggestion
    ? getSuggestionPlaceholder(field.aiSuggestionKey, enrichmentContext, field.placeholder || "email@example.com")
    : resolveTemplateVariables(field.placeholder, formData, enrichmentContext) || "email@example.com";

  // Check if suggestion is available and field is empty (for layout adjustments)
  const currentStr = value !== undefined && value !== null ? String(value) : "";
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const showInlineButton = showSuggestion && hasEnrichment && suggestedValue !== null && currentStr.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          type="email"
          placeholder={suggestionPlaceholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            error ? "border-destructive" : "",
            showInlineButton ? "pr-44" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AISuggestionIndicator
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
              variant="inline"
            />
          </div>
        )}
      </div>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Date Field Renderer
 */
export function DateField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Check if suggestion is available and field is empty (for layout adjustments)
  const currentStr = value !== undefined && value !== null ? String(value) : "";
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const showInlineButton = showSuggestion && hasEnrichment && suggestedValue !== null && currentStr.length === 0;

  // Check if value is "Upon Signature" (case-insensitive)
  const isUponSignature = currentStr.toLowerCase() === "upon signature";
  const [showDateInput, setShowDateInput] = useState(!isUponSignature);

  // If value changes to a date, show date input; if it becomes "Upon Signature", hide date input
  useEffect(() => {
    if (currentStr && currentStr.toLowerCase() === "upon signature") {
      setShowDateInput(false);
    } else if (currentStr && currentStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setShowDateInput(true);
    }
  }, [currentStr]);

  // Handle switching from "Upon Signature" to date input
  const handleChangeToDate = () => {
    setShowDateInput(true);
    onChange(field.name, ""); // Clear the value so user can pick a date
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>
      <div className="relative">
        {isUponSignature && !showDateInput ? (
          // Display "Upon Signature" as a badge/display with option to change
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border-2 border-[hsl(var(--selise-blue))]/30 bg-[hsl(var(--selise-blue))]/5 px-4 py-2.5 h-11 flex items-center">
              <span className="text-base font-medium text-[hsl(var(--fg))]">Upon Signature</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChangeToDate}
              className="h-11"
            >
              Change to Date
            </Button>
          </div>
        ) : (
          // Regular date input
          <>
            <Input
              id={field.name}
              type="date"
              value={(value as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={cn(
                error ? "border-destructive" : "",
                showInlineButton ? "pr-44" : ""
              )}
            />
            {showSuggestion && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <AISuggestionIndicator
                  suggestionKey={field.aiSuggestionKey!}
                  enrichmentContext={enrichmentContext}
                  currentValue={value}
                  onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
                  variant="inline"
                />
              </div>
            )}
          </>
        )}
      </div>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Number Field Renderer
 */
export function NumberField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Use AI suggestion as placeholder if available
  const suggestionPlaceholder = showSuggestion
    ? getSuggestionPlaceholder(field.aiSuggestionKey, enrichmentContext, field.placeholder)
    : resolveTemplateVariables(field.placeholder, formData, enrichmentContext);

  // Check if suggestion is available and field is empty (for layout adjustments)
  const currentStr = value !== undefined && value !== null ? String(value) : "";
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const showInlineButton = showSuggestion && hasEnrichment && suggestedValue !== null && currentStr.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          type="number"
          placeholder={suggestionPlaceholder || undefined}
          value={(value as string | number) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            error ? "border-destructive" : "",
            showInlineButton ? "pr-44" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AISuggestionIndicator
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
              variant="inline"
            />
          </div>
        )}
      </div>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Checkbox Field Renderer
 */
export function CheckboxField({ field, value, onChange, error, formData, enrichmentContext }: FieldRendererProps) {
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          id={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
        />
        <div>
          <Label htmlFor={field.name} className="cursor-pointer">
            {resolvedLabel}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {resolvedHelpText && (
            <p className="text-xs text-[hsl(var(--globe-grey))] mt-0.5">
              {resolvedHelpText}
            </p>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Multi-Select Field Renderer
 * Redesigned with checkbox-style UI for clear multi-selection indication
 */
export function MultiSelectField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Ensure value is an array
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  // Check if we have option descriptions from enrichment context
  const getOptionLabel = (option: string) => {
    const optionKey = `${field.name}_${option}_label`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      // Apply variable interpolation to enrichment label
      return resolveTemplateVariables(String(enrichmentContext[optionKey]), formData, enrichmentContext);
    }
    // Apply variable interpolation to raw option
    return resolveTemplateVariables(option, formData, enrichmentContext);
  };

  const getOptionDescription = (option: string) => {
    const optionKey = `${field.name}_${option}_description`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      // Apply variable interpolation to enrichment description
      const description = resolveTemplateVariables(String(enrichmentContext[optionKey]), formData, enrichmentContext);
      return description || null;
    }
    return null;
  };

  // Toggle option selection
  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];
    onChange(field.name, newValues);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {resolvedLabel}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              {selectedValues.length} selected
            </Badge>
          )}
        </div>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={selectedValues}
          />
        )}
      </div>

      {/* Checkbox-style multi-select options */}
      <div className="space-y-2">
        {field.options.map((option) => {
          const isSelected = selectedValues.includes(option);
          const optionLabel = getOptionLabel(option);
          const optionDescription = getOptionDescription(option);

          return (
            <motion.label
              key={option}
              htmlFor={`${field.name}-${option}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all group",
                "hover:shadow-md hover:border-[hsl(var(--selise-blue))]/40",
                isSelected
                  ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5 shadow-sm"
                  : "border-[hsl(var(--border))] bg-background",
                error && "border-amber-400 bg-amber-50/50"
              )}
            >
              {/* Custom checkbox */}
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id={`${field.name}-${option}`}
                  checked={isSelected}
                  onChange={() => toggleOption(option)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]"
                      : "bg-background border-[hsl(var(--border))] group-hover:border-[hsl(var(--selise-blue))]/50"
                  )}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white stroke-3" />
                  )}
                </div>
              </div>

              {/* Option content */}
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-medium text-sm transition-colors",
                    isSelected
                      ? "text-[hsl(var(--selise-blue))]"
                      : "text-[hsl(var(--fg))]"
                  )}
                >
                  {optionLabel}
                </div>
                {optionDescription && (
                  <div className="text-xs text-[hsl(var(--globe-grey))] mt-1 leading-relaxed">
                    {optionDescription}
                  </div>
                )}
              </div>
            </motion.label>
          );
        })}
      </div>

      {/* Selected items summary (if any selected) */}
      {selectedValues.length > 0 && (
        <div className="pt-2 border-t border-[hsl(var(--border))]">
          <p className="text-xs font-medium text-[hsl(var(--globe-grey))] mb-2">
            Selected:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((val) => {
              const label = getOptionLabel(val);
              return (
                <Badge
                  key={val}
                  variant="secondary"
                  className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20 hover:bg-[hsl(var(--selise-blue))]/20"
                >
                  <Check className="w-3 h-3 mr-1" />
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Select Field Renderer
 * Renders select options as cards (similar to Work Arrangement step)
 */
export function SelectField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Check if we have option descriptions from enrichment context
  // Format: field.options might be simple strings, or we might have structured data
  const getOptionLabel = (option: string) => {
    // Try to get a more descriptive label from enrichment context if available
    const optionKey = `${field.name}_${option}_label`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      // Apply variable interpolation to enrichment label
      return resolveTemplateVariables(String(enrichmentContext[optionKey]), formData, enrichmentContext);
    }
    // Apply variable interpolation to raw option
    return resolveTemplateVariables(option, formData, enrichmentContext);
  };

  const getOptionDescription = (option: string) => {
    const optionKey = `${field.name}_${option}_description`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      // Apply variable interpolation to enrichment description
      const description = resolveTemplateVariables(String(enrichmentContext[optionKey]), formData, enrichmentContext);
      return description || null;
    }
    return null;
  };

  // Determine grid columns based on number of options
  const getGridCols = () => {
    if (field.options.length === 1) return "grid-cols-1";
    if (field.options.length === 2) return "grid-cols-1 md:grid-cols-2";
    if (field.options.length <= 4) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
  };

  // Get the suggested option value
  const suggestedOption = showSuggestion && enrichmentContext && field.aiSuggestionKey
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey)
    : null;
  const suggestedOptionStr = suggestedOption !== undefined && suggestedOption !== null
    ? String(suggestedOption)
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-sm font-medium">
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>

      {/* Card-based option selection */}
      <div className={`grid ${getGridCols()} gap-3`}>
        {field.options.map((option) => {
          const isSelected = value === option;
          const isSuggested = suggestedOptionStr !== null && option === suggestedOptionStr && !isSelected;
          const optionLabel = getOptionLabel(option);
          const optionDescription = getOptionDescription(option);

          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => onChange(field.name, option)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden cursor-pointer',
                isSelected
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.03] shadow-lg shadow-[hsl(var(--brand-primary))/10]'
                  : isSuggested
                  ? 'border-[hsl(var(--border))] border-dashed bg-[hsl(var(--selise-blue))]/3 hover:border-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--selise-blue))]/5 shadow-sm hover:shadow-md'
                  : 'border-[hsl(var(--border))] bg-background hover:border-[hsl(var(--brand-primary))/50] hover:shadow-md',
                error && 'border-amber-400 bg-amber-50/50 shadow-md shadow-amber-200/30'
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 p-3 opacity-0 transition-opacity duration-300",
                isSelected && "opacity-100"
              )}>
                <div className="bg-[hsl(var(--brand-primary))] rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Recommended badge for suggested option */}
              {isSuggested && (
                <div className="absolute top-2 left-2 z-20 animate-pulse">
                  <span 
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[hsl(var(--oxford-blue))] shadow-md border border-[hsl(var(--oxford-blue))]/50"
                    style={{ color: 'white' }}
                  >
                    <Sparkles className="h-2.5 w-2.5" style={{ color: 'white' }} />
                    <span style={{ color: 'white' }}>Recommended</span>
                  </span>
                </div>
              )}

              <div className="relative z-10">
                <div className={cn(
                  "font-semibold text-lg mb-1.5 transition-colors",
                  isSelected ? "text-[hsl(var(--brand-primary))]" : "text-[hsl(var(--fg))]"
                )}>
                  {optionLabel}
                </div>
                {optionDescription && (
                  <div className="text-sm text-[hsl(var(--brand-muted))] leading-relaxed group-hover:text-[hsl(var(--fg))] transition-colors">
                    {optionDescription}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Additional Signatories Field Renderer
 */
export function AdditionalSignatoriesField({
  field,
  value,
  onChange,
  error,
}: FieldRendererProps) {
  const [entries, setEntries] = useState<AdditionalSignatoryInput[]>(
    ensureAdditionalSignatoryArray(value)
  );

  useEffect(() => {
    setEntries(ensureAdditionalSignatoryArray(value));
  }, [value]);

  const updateEntries = (next: AdditionalSignatoryInput[]) => {
    setEntries(next);
    onChange(field.name, next);
  };

  const handleEntryChange = (
    index: number,
    key: keyof AdditionalSignatoryInput,
    fieldValue: string
  ) => {
    updateEntries(
      entries.map((entry, idx) =>
        idx === index ? { ...entry, [key]: fieldValue } : entry
      )
    );
  };

  const handleAddEntry = () => {
    updateEntries([...entries, createBlankAdditionalSignatory()]);
  };

  const handleRemoveEntry = (index: number) => {
    updateEntries(entries.filter((_, idx) => idx !== index));
  };

  const renderEntry = (entry: AdditionalSignatoryInput, index: number) => {
    const baseId = entry.id || `${field.name}-${index}`;
    return (
      <div
        key={baseId}
        className="rounded-lg border border-[hsl(var(--border))] bg-white p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[hsl(var(--fg))]">
            Additional Signatory #{index + 1}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveEntry(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-name`}>Full Name *</Label>
            <Input
              id={`${baseId}-name`}
              placeholder="Jane Doe"
              value={entry.name || ""}
              onChange={(e) => handleEntryChange(index, "name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-email`}>Email *</Label>
            <Input
              id={`${baseId}-email`}
              type="email"
              placeholder="jane@example.com"
              value={entry.email || ""}
              onChange={(e) => handleEntryChange(index, "email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-party`}>Party</Label>
            <Select
              value={entry.party}
              onValueChange={(val) => handleEntryChange(index, "party", val)}
            >
              <SelectTrigger id={`${baseId}-party`}>
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
              <SelectContent>
                {SIGNATORY_PARTY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-title`}>Title / Role</Label>
            <Input
              id={`${baseId}-title`}
              placeholder="Authorized Signatory"
              value={entry.title || ""}
              onChange={(e) => handleEntryChange(index, "title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${baseId}-phone`}>Phone</Label>
            <Input
              id={`${baseId}-phone`}
              placeholder="+1 (555) 123-4567"
              value={entry.phone || ""}
              onChange={(e) => handleEntryChange(index, "phone", e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Add Signatory
        </Button>
      </div>
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4 text-sm text-[hsl(var(--globe-grey))]">
          No additional signatories yet. Click “Add Signatory” to include more parties on this document.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => renderEntry(entry, index))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Dynamic Field Renderer
 * Renders the appropriate field component based on field type
 */
export function DynamicField(props: FieldRendererProps) {
  const { field } = props;

  if (field.name === ADDITIONAL_SIGNATORIES_FIELD_NAME) {
    return <AdditionalSignatoriesField {...props} />;
  }

  switch (field.type) {
    case "text":
      return <TextField {...props} />;
    case "email":
      return <EmailField {...props} />;
    case "date":
      return <DateField {...props} />;
    case "number":
      return <NumberField {...props} />;
    case "checkbox":
      return <CheckboxField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "multiselect":
      return <MultiSelectField {...props} />;
    // New composite field types
    case "textarea":
      return <TextareaField {...props} />;
    case "phone":
      return <PhoneField {...props} />;
    case "address":
      return <AddressField {...props} />;
    case "party":
      return <PartyField {...props} />;
    case "currency":
      return <CurrencyField {...props} />;
    case "percentage":
      return <PercentageField {...props} />;
    case "url":
      return <UrlField {...props} />;
    default:
      return <TextField {...props} />;
  }
}

// Export individual field components for direct use
export {
  TextareaField,
  PhoneField,
  AddressField,
  PartyField,
  CurrencyField,
  PercentageField,
  UrlField,
};

export default DynamicField;
