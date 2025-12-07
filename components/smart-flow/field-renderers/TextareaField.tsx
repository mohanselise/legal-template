"use client";

import { Sparkles, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldRendererProps } from "./types";
import { resolveTemplateVariables, getNestedValue, getSuggestionPlaceholder } from "./utils";

/**
 * AI Suggestion Badge for textarea fields
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
 * AI Apply Button for textarea fields
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
      title={`Apply suggestion: ${displayValue.substring(0, 50)}...`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Apply</span>
    </button>
  );
}

/**
 * Textarea Field Renderer - Multi-line text input
 */
export function TextareaField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
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
        <Textarea
          id={field.name}
          placeholder={suggestionPlaceholder || undefined}
          value={(value as string) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          rows={4}
          className={cn(
            "min-h-[100px] resize-y",
            error ? "border-destructive" : ""
          )}
        />
        {showSuggestion && (
          <div className="absolute right-2 top-2">
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

export default TextareaField;
