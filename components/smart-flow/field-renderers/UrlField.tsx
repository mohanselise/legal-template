"use client";

import { Sparkles, Check, Link2, ExternalLink } from "lucide-react";
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
      title={`Apply suggestion: ${String(suggestedValue).substring(0, 30)}...`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>Apply</span>
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
            showSuggestion && enrichmentContext && Object.keys(enrichmentContext).length > 0 ? "pr-32" : "pr-10"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showSuggestion && (
            <AIApplyButton
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
              onApply={(suggestedValue) => onChange(field.name, suggestedValue)}
            />
          )}
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
