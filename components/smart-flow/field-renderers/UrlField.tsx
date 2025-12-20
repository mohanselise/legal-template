"use client";

import { Sparkles, Check, Link2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FieldRendererProps } from "./types";
import { resolveTemplateVariables, getNestedValue, getSuggestionPlaceholder } from "./utils";

/**
 * AI Suggestion Status Badge - shows status only
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

  const currentStr = currentValue !== undefined && currentValue !== null 
    ? String(currentValue) 
    : "";
  
  if (String(suggestedValue) === currentStr) {
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
 * AI Suggestion Indicator
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
  
  // Don't show if already applied or user has custom input
  if (suggestedStr === currentStr) return null;
  if (currentStr.length > 0) return null;

  const displayValue = suggestedStr.length > 25 
    ? suggestedStr.substring(0, 25) + "..." 
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
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (will be caught by required check)
  try {
    new URL(url);
    return true;
  } catch {
    // Try with https:// prefix
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Normalize URL (add https:// if missing)
 */
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.match(/^https?:\/\//i)) return url;
  return `https://${url}`;
}

/**
 * URL Field Renderer - URL input with validation and preview link
 */
export function UrlField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
  const suggestionPlaceholder = showSuggestion 
    ? getSuggestionPlaceholder(field.aiSuggestionKey, enrichmentContext, field.placeholder)
    : resolveTemplateVariables(field.placeholder, formData, enrichmentContext);

  const urlValue = (value as string) || "";
  const isValid = isValidUrl(urlValue);
  const normalizedUrl = urlValue ? normalizeUrl(urlValue) : "";

  // Check if suggestion is available and field is empty
  const hasEnrichment = enrichmentContext && Object.keys(enrichmentContext).length > 0;
  const suggestedValue = showSuggestion && hasEnrichment
    ? getNestedValue(enrichmentContext, field.aiSuggestionKey!)
    : null;
  const showInlineButton = showSuggestion && hasEnrichment && suggestedValue !== null && urlValue.length === 0;

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
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          id={field.name}
          type="url"
          placeholder={suggestionPlaceholder || "https://example.com"}
          value={urlValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            "pl-10",
            error || (!isValid && urlValue) ? "border-destructive" : "",
            urlValue && isValid ? "pr-10" : ""
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {urlValue && isValid && (
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-[hsl(var(--selise-blue))]" />
            </a>
          )}
        </div>
      </div>
      {showInlineButton && (
        <AISuggestionIndicator
          suggestionKey={field.aiSuggestionKey!}
          enrichmentContext={enrichmentContext}
          currentValue={value}
          onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
        />
      )}
      {!isValid && urlValue && (
        <p className="text-xs text-destructive">Please enter a valid URL</p>
      )}
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default UrlField;
