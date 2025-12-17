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
 * Supports {{variableName}} syntax
 * Looks up values from formData first, then enrichmentContext
 * Falls back to showing the variable name if not found
 */
function resolveTemplateVariables(
  template: string | null | undefined,
  formData?: Record<string, unknown>,
  enrichmentContext?: Record<string, unknown>
): string {
  if (!template) return "";

  // Match all {{variableName}} patterns
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();

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

    // Fallback: return a placeholder indicating the variable name
    return `[${trimmedName}]`;
  });
}

/**
 * AI Suggestion Badge - shows suggested value with tooltip (label version)
 */
function AISuggestionBadge({
  suggestionKey,
  enrichmentContext,
  currentValue,
  onApply,
}: {
  suggestionKey: string;
  enrichmentContext?: Record<string, unknown>;
  currentValue: unknown;
  onApply: (value: unknown) => void;
}) {
  if (!suggestionKey) return null;

  // If enrichment context is empty, show waiting indicator
  if (!enrichmentContext || Object.keys(enrichmentContext).length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
        title={`AI suggestion will appear after completing the previous step`}
      >
        <Sparkles className="h-3 w-3 opacity-50" />
        <span className="opacity-70">AI</span>
      </span>
    );
  }

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);

  // Don't show if no suggestion or if current value matches
  if (suggestedValue === undefined || suggestedValue === null) {
    return null;
  }

  if (String(suggestedValue) === String(currentValue)) {
    // Show "applied" state when value matches suggestion
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-emerald-50 text-emerald-600 border border-emerald-200"
      >
        <Check className="h-3 w-3" />
        <span>AI applied</span>
      </span>
    );
  }

  // Show "Apply" button if not applied
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onApply(suggestedValue);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
        bg-transparent text-[hsl(var(--selise-blue))] 
        hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
        border border-[hsl(var(--selise-blue))]/30 hover:border-[hsl(var(--selise-blue))]/50"
      title="Apply AI suggestion"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Apply</span>
    </button>
  );
}

/**
 * AI Apply Button - inline button inside input field for applying AI suggestions
 */
function AIApplyButton({
  suggestionKey,
  enrichmentContext,
  currentValue,
  onApply,
}: {
  suggestionKey: string;
  enrichmentContext?: Record<string, unknown>;
  currentValue: unknown;
  onApply: (value: unknown) => void;
}) {
  if (!suggestionKey) return null;
  if (!enrichmentContext || Object.keys(enrichmentContext).length === 0) return null;

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);

  // Don't show if no suggestion or if current value already matches
  if (suggestedValue === undefined || suggestedValue === null) return null;
  if (String(suggestedValue) === String(currentValue)) return null;

  const displayValue = typeof suggestedValue === 'object'
    ? JSON.stringify(suggestedValue)
    : String(suggestedValue);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onApply(suggestedValue);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
        bg-transparent text-[hsl(var(--selise-blue))] 
        hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
        border border-[hsl(var(--selise-blue))]/30 hover:border-[hsl(var(--selise-blue))]/50"
      title={`Apply suggestion: ${displayValue}`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Apply</span>
    </button>
  );
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
            onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-24" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
            onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-24" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
            onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
          />
        )}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            error ? "border-destructive" : "",
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-24" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
            onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-24" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
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
 * Renders options as toggleable cards (similar to SelectField but allows multiple selections)
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
      return String(enrichmentContext[optionKey]);
    }
    return option;
  };

  const getOptionDescription = (option: string) => {
    const optionKey = `${field.name}_${option}_description`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      return String(enrichmentContext[optionKey]);
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

  // Determine grid columns based on number of options
  const getGridCols = () => {
    if (field.options.length === 1) return "grid-cols-1";
    if (field.options.length === 2) return "grid-cols-1 md:grid-cols-2";
    if (field.options.length <= 4) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-sm font-medium">
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={selectedValues}
            onApply={(suggestedValue) => {
              // Handle AI suggestion - could be array or single value
              const suggestedArray = Array.isArray(suggestedValue) 
                ? suggestedValue 
                : (suggestedValue ? [suggestedValue] : []);
              onChange(field.name, suggestedArray);
            }}
          />
        )}
      </div>

      {/* Card-based multi-option selection */}
      <div className={`grid ${getGridCols()} gap-3`}>
        {field.options.map((option) => {
          const isSelected = selectedValues.includes(option);
          const optionLabel = getOptionLabel(option);
          const optionDescription = getOptionDescription(option);

          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden cursor-pointer',
                isSelected
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.03] shadow-lg shadow-[hsl(var(--brand-primary))/10]'
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

      {selectedValues.length > 0 && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">
          {selectedValues.length} option{selectedValues.length !== 1 ? "s" : ""} selected
        </p>
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
      return String(enrichmentContext[optionKey]);
    }
    return option;
  };

  const getOptionDescription = (option: string) => {
    const optionKey = `${field.name}_${option}_description`;
    if (enrichmentContext && optionKey in enrichmentContext) {
      return String(enrichmentContext[optionKey]);
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label className="text-sm font-medium">
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {showSuggestion && (
          <AISuggestionBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
            onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
          />
        )}
      </div>

      {/* Card-based option selection */}
      <div className={`grid ${getGridCols()} gap-3`}>
        {field.options.map((option) => {
          const isSelected = value === option;
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
