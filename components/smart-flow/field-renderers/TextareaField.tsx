"use client";

import { Sparkles, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldRendererProps } from "./types";
import { resolveTemplateVariables, getNestedValue, getSuggestionPlaceholder } from "./utils";

/**
 * AI Suggestion Status Badge - shows status only (loading/applied/available)
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

  // No badge shown when suggestion is available but not applied
  return null;
}

/**
 * AI Suggestion Indicator - unified component for applying standard values
 */
function AISuggestionIndicator({
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

  const suggestedStr = String(suggestedValue);
  const currentStr = currentValue !== undefined && currentValue !== null 
    ? String(currentValue) 
    : "";
  
  // Don't show if already applied
  if (suggestedStr === currentStr) return null;

  // Truncate for display (shorter on mobile)
  const displayValue = suggestedStr.length > 40 
    ? suggestedStr.substring(0, 40) + "..." 
    : suggestedStr;
  const displayValueMobile = suggestedStr.length > 20 
    ? suggestedStr.substring(0, 20) + "..." 
    : suggestedStr;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onApply(suggestedValue);
      }}
      className="inline-flex items-center justify-center gap-2 sm:gap-1.5 px-4 sm:px-2.5 py-3 sm:py-1 
        text-sm sm:text-xs font-semibold sm:font-medium rounded-lg sm:rounded-md
        bg-[hsl(var(--selise-blue))]/10 sm:bg-[hsl(var(--selise-blue))]/5 
        text-[hsl(var(--selise-blue))] 
        hover:bg-[hsl(var(--selise-blue))]/20 sm:hover:bg-[hsl(var(--selise-blue))]/15 
        active:bg-[hsl(var(--selise-blue))]/25 sm:active:bg-[hsl(var(--selise-blue))]/20
        transition-all cursor-pointer touch-manipulation
        border-2 sm:border border-[hsl(var(--selise-blue))]/40 sm:border-[hsl(var(--selise-blue))]/20 
        hover:border-[hsl(var(--selise-blue))]/60 sm:hover:border-[hsl(var(--selise-blue))]/40
        active:border-[hsl(var(--selise-blue))]/80 sm:active:border-[hsl(var(--selise-blue))]/60
        shadow-md sm:shadow-sm hover:shadow-lg sm:hover:shadow 
        active:shadow-inner sm:active:shadow-inner
        w-full sm:w-auto min-h-[44px] sm:min-h-0"
      title={`Apply standard value: ${suggestedStr.substring(0, 200)}`}
    >
      <Sparkles className="h-4 w-4 sm:h-3 sm:w-3 flex-shrink-0" />
      <span className="whitespace-nowrap">
        <span className="hidden sm:inline">Use standard: </span>
        <span className="sm:hidden">Standard: </span>
        <span className="font-semibold">
          <span className="hidden sm:inline">{displayValue}</span>
          <span className="sm:hidden">{displayValueMobile}</span>
        </span>
      </span>
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

  // Check if suggestion is available
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const hasSuggestion = showSuggestion && hasEnrichment && suggestedValue !== null;

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
        <Textarea
          id={field.name}
          placeholder={suggestionPlaceholder || undefined}
          value={(value as string) || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          rows={4}
          className={cn(
            "min-h-[100px] resize-y",
            error ? "border-destructive" : "",
            hasSuggestion ? "pb-16 sm:pb-16" : ""
          )}
        />
        {hasSuggestion && (
          <>
            {/* Desktop: Inside textarea (bottom-right) */}
            <div className="absolute right-2 bottom-2 hidden sm:block">
              <AISuggestionIndicator
                suggestionKey={field.aiSuggestionKey!}
                enrichmentContext={enrichmentContext}
                currentValue={value}
                onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
              />
            </div>
            {/* Mobile: Below textarea */}
            <div className="mt-2 sm:hidden">
              <AISuggestionIndicator
                suggestionKey={field.aiSuggestionKey!}
                enrichmentContext={enrichmentContext}
                currentValue={value}
                onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
              />
            </div>
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

export default TextareaField;
