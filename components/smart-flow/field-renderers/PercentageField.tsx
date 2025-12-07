"use client";

import { Sparkles, Check, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FieldRendererProps } from "./types";
import { resolveTemplateVariables, getNestedValue, getSuggestionPlaceholder } from "./utils";

/**
 * AI Suggestion Badge
 */
function AISuggestionBadge({
  suggestionKey,
  enrichmentContext,
  currentValue,
}: {
  suggestionKey: string;
  enrichmentContext?: Record<string, unknown>;
  currentValue: unknown;
  onApply: (value: unknown) => void;
}) {
  if (!suggestionKey) return null;
  
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
  
  if (String(suggestedValue) === String(currentValue)) {
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

  return null;
}

/**
 * AI Apply Button
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
  
  if (suggestedValue === undefined || suggestedValue === null) return null;
  if (String(suggestedValue) === String(currentValue)) return null;

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
      title={`Apply suggestion: ${suggestedValue}%`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Apply</span>
    </button>
  );
}

/**
 * Percentage Field Renderer - Number input with % suffix
 * Validates 0-100 range, displays with % symbol
 */
export function PercentageField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
  const suggestionPlaceholder = showSuggestion 
    ? getSuggestionPlaceholder(field.aiSuggestionKey, enrichmentContext, field.placeholder)
    : resolveTemplateVariables(field.placeholder, formData, enrichmentContext);

  const handleChange = (inputValue: string) => {
    // Allow only numbers and decimal point
    const cleanValue = inputValue.replace(/[^\d.]/g, "");
    
    // Parse and validate
    const numValue = parseFloat(cleanValue);
    
    // Allow empty or valid percentage (0-100)
    if (cleanValue === "" || cleanValue === ".") {
      onChange(field.name, cleanValue);
    } else if (!isNaN(numValue)) {
      // Cap at 100
      const cappedValue = Math.min(numValue, 100);
      // Prevent negative (should already be handled by regex)
      const finalValue = Math.max(cappedValue, 0);
      onChange(field.name, finalValue);
    }
  };

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
      <div className="relative max-w-[200px]">
        <Input
          id={field.name}
          type="text"
          inputMode="decimal"
          placeholder={suggestionPlaceholder || "0"}
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "pr-12 font-mono",
            error ? "border-destructive" : "",
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-28" : "pr-12"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showSuggestion && (
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
            />
          )}
          <Percent className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default PercentageField;
