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
import type { FieldRendererProps, CurrencyValue } from "./types";
import { CURRENCIES } from "./types";
import { resolveTemplateVariables, getNestedValue, parseCompositeValue } from "./utils";

const DEFAULT_CURRENCY: CurrencyValue = { amount: "", currency: "CHF" };

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
  
  const currentCurrency = parseCompositeValue<CurrencyValue>(currentValue, DEFAULT_CURRENCY);
  const suggestedCurrency = parseCompositeValue<CurrencyValue>(suggestedValue, DEFAULT_CURRENCY);
  
  // Check if both amount and currency match
  const amountMatch = String(currentCurrency.amount) === String(suggestedCurrency.amount);
  const currencyMatch = currentCurrency.currency === suggestedCurrency.currency;
  
  if (amountMatch && currencyMatch) {
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
 * Currency Field Renderer - Amount with currency selector
 * Stores: { amount: number|string, currency: string }
 */
export function CurrencyField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
  // Parse composite value
  const currencyValue = parseCompositeValue<CurrencyValue>(value, DEFAULT_CURRENCY);
  
  const handleAmountChange = (amountStr: string) => {
    // Allow only numbers and decimal point
    const cleanAmount = amountStr.replace(/[^\d.]/g, "");
    // Prevent multiple decimal points
    const parts = cleanAmount.split(".");
    const normalizedAmount = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join("")}`
      : cleanAmount;
    
    onChange(field.name, { ...currencyValue, amount: normalizedAmount });
  };
  
  const handleCurrencyChange = (currency: string) => {
    onChange(field.name, { ...currencyValue, currency });
  };

  const handleApplySuggestion = () => {
    if (!field.aiSuggestionKey || !enrichmentContext) return;
    const suggestedValue = getNestedValue(enrichmentContext, field.aiSuggestionKey);
    if (suggestedValue) {
      const suggestedCurrency = parseCompositeValue<CurrencyValue>(suggestedValue, DEFAULT_CURRENCY);
      onChange(field.name, suggestedCurrency);
    }
  };

  // Check if there's a suggestion available
  const hasSuggestion = showSuggestion && enrichmentContext && 
    Object.keys(enrichmentContext).length > 0 &&
    getNestedValue(enrichmentContext, field.aiSuggestionKey!) !== undefined;
  
  const suggestedCurrency = hasSuggestion 
    ? parseCompositeValue<CurrencyValue>(getNestedValue(enrichmentContext!, field.aiSuggestionKey!), DEFAULT_CURRENCY)
    : null;
  
  const isApplied = suggestedCurrency && 
    String(currencyValue.amount) === String(suggestedCurrency.amount) &&
    currencyValue.currency === suggestedCurrency.currency;

  // Get currency symbol for display
  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === currencyValue.currency);
  const currencySymbol = selectedCurrencyInfo?.symbol || currencyValue.currency;

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
        {/* Currency Selector */}
        <div className="w-[130px] flex-shrink-0">
          <Select
            value={currencyValue.currency || "CHF"}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger className={cn(error ? "border-destructive" : "")}>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground w-6">{currency.symbol}</span>
                    <span>{currency.code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Amount Input */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
            {currencySymbol}
          </div>
          <Input
            id={field.name}
            type="text"
            inputMode="decimal"
            placeholder={suggestedCurrency?.amount?.toString() || "0.00"}
            value={currencyValue.amount || ""}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={cn(
              "pl-12 font-mono",
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
                title={`Apply suggestion: ${suggestedCurrency?.currency} ${suggestedCurrency?.amount}`}
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

export default CurrencyField;
