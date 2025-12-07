"use client";

import { Sparkles, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FieldRendererProps, PhoneValue } from "./types";
import { COUNTRY_CODES } from "./types";
import { resolveTemplateVariables, getNestedValue, parseCompositeValue } from "./utils";

const DEFAULT_PHONE: PhoneValue = { countryCode: "+41", number: "" };

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
  
  // Check if values match (comparing normalized phone values)
  const currentPhone = parseCompositeValue<PhoneValue>(currentValue, DEFAULT_PHONE);
  const suggestedPhone = parseCompositeValue<PhoneValue>(suggestedValue, DEFAULT_PHONE);
  
  if (currentPhone.countryCode === suggestedPhone.countryCode && 
      currentPhone.number === suggestedPhone.number) {
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
 * Phone Field Renderer - Phone with country code
 * Stores: { countryCode: string, number: string }
 */
export function PhoneField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
  // Parse composite value
  const phoneValue = parseCompositeValue<PhoneValue>(value, DEFAULT_PHONE);
  
  const handleCountryChange = (countryCode: string) => {
    onChange(field.name, { ...phoneValue, countryCode });
  };
  
  const handleNumberChange = (number: string) => {
    // Allow only digits, spaces, and common phone separators
    const cleanNumber = number.replace(/[^\d\s\-()]/g, "");
    onChange(field.name, { ...phoneValue, number: cleanNumber });
  };

  const handleApplySuggestion = () => {
    if (!field.aiSuggestionKey || !enrichmentContext) return;
    const suggestedValue = getNestedValue(enrichmentContext, field.aiSuggestionKey);
    if (suggestedValue) {
      const suggestedPhone = parseCompositeValue<PhoneValue>(suggestedValue, DEFAULT_PHONE);
      onChange(field.name, suggestedPhone);
    }
  };

  // Check if there's a suggestion available to apply
  const hasSuggestion = showSuggestion && enrichmentContext && 
    Object.keys(enrichmentContext).length > 0 &&
    getNestedValue(enrichmentContext, field.aiSuggestionKey!) !== undefined;
  
  const suggestedPhone = hasSuggestion 
    ? parseCompositeValue<PhoneValue>(getNestedValue(enrichmentContext!, field.aiSuggestionKey!), DEFAULT_PHONE)
    : null;
  
  const isApplied = suggestedPhone && 
    phoneValue.countryCode === suggestedPhone.countryCode && 
    phoneValue.number === suggestedPhone.number;

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
          />
        )}
      </div>
      
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="w-[140px] flex-shrink-0">
          <Select
            value={phoneValue.countryCode || "+41"}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className={cn(error ? "border-destructive" : "")}>
              <SelectValue placeholder="Code" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {COUNTRY_CODES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{country.country}</span>
                    <span>{country.code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Input
            id={field.name}
            type="tel"
            placeholder={suggestedPhone?.number || "Phone number"}
            value={phoneValue.number || ""}
            onChange={(e) => handleNumberChange(e.target.value)}
            className={cn(
              error ? "border-destructive" : "",
              hasSuggestion && !isApplied ? "pr-20" : ""
            )}
          />
          {hasSuggestion && !isApplied && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                  bg-transparent text-[hsl(var(--selise-blue))] 
                  hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
                  border border-[hsl(var(--selise-blue))]/30 hover:border-[hsl(var(--selise-blue))]/50"
                title={`Apply suggestion: ${suggestedPhone?.countryCode} ${suggestedPhone?.number}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Apply</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default PhoneField;
