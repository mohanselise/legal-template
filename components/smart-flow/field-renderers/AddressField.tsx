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
import type { FieldRendererProps, AddressValue } from "./types";
import { COUNTRIES } from "./types";
import { resolveTemplateVariables, getNestedValue, parseCompositeValue } from "./utils";

const DEFAULT_ADDRESS: AddressValue = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "CH",
};

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
  
  const currentAddress = parseCompositeValue<AddressValue>(currentValue, DEFAULT_ADDRESS);
  const suggestedAddress = parseCompositeValue<AddressValue>(suggestedValue, DEFAULT_ADDRESS);
  
  // Check if all fields match
  const fieldsMatch = 
    currentAddress.street === suggestedAddress.street &&
    currentAddress.city === suggestedAddress.city &&
    currentAddress.state === suggestedAddress.state &&
    currentAddress.postalCode === suggestedAddress.postalCode &&
    currentAddress.country === suggestedAddress.country;
  
  if (fieldsMatch) {
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
 * Address Field Renderer - Composite address field
 * Stores: { street, city, state, postalCode, country }
 * 
 * Designed for future Google Places API integration
 */
export function AddressField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);
  
  // Parse composite value
  const addressValue = parseCompositeValue<AddressValue>(value, DEFAULT_ADDRESS);
  
  const updateField = (fieldName: keyof AddressValue, fieldValue: string) => {
    onChange(field.name, { ...addressValue, [fieldName]: fieldValue });
  };

  const handleApplySuggestion = () => {
    if (!field.aiSuggestionKey || !enrichmentContext) return;
    const suggestedValue = getNestedValue(enrichmentContext, field.aiSuggestionKey);
    if (suggestedValue) {
      const suggestedAddress = parseCompositeValue<AddressValue>(suggestedValue, DEFAULT_ADDRESS);
      onChange(field.name, suggestedAddress);
    }
  };

  // Check if there's a suggestion available
  const hasSuggestion = showSuggestion && enrichmentContext && 
    Object.keys(enrichmentContext).length > 0 &&
    getNestedValue(enrichmentContext, field.aiSuggestionKey!) !== undefined;
  
  const suggestedAddress = hasSuggestion 
    ? parseCompositeValue<AddressValue>(getNestedValue(enrichmentContext!, field.aiSuggestionKey!), DEFAULT_ADDRESS)
    : null;
  
  // Check if already applied
  const isApplied = suggestedAddress && 
    addressValue.street === suggestedAddress.street &&
    addressValue.city === suggestedAddress.city &&
    addressValue.state === suggestedAddress.state &&
    addressValue.postalCode === suggestedAddress.postalCode &&
    addressValue.country === suggestedAddress.country;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label>
          {resolvedLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {showSuggestion && (
            <AISuggestionBadge
              suggestionKey={field.aiSuggestionKey!}
              enrichmentContext={enrichmentContext}
              currentValue={value}
            />
          )}
          {hasSuggestion && !isApplied && (
            <button
              type="button"
              onClick={handleApplySuggestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                bg-transparent text-[hsl(var(--selise-blue))] 
                hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
                border border-[hsl(var(--selise-blue))]/30 hover:border-[hsl(var(--selise-blue))]/50"
              title="Apply AI suggestion"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
        {/* Street Address */}
        <div className="space-y-1.5">
          <Label htmlFor={`${field.name}-street`} className="text-xs text-[hsl(var(--globe-grey))]">
            Street Address
          </Label>
          <Input
            id={`${field.name}-street`}
            placeholder={suggestedAddress?.street || "Street address, building, floor"}
            value={addressValue.street || ""}
            onChange={(e) => updateField("street", e.target.value)}
            className={cn(error ? "border-destructive" : "")}
          />
        </div>
        
        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${field.name}-city`} className="text-xs text-[hsl(var(--globe-grey))]">
              City
            </Label>
            <Input
              id={`${field.name}-city`}
              placeholder={suggestedAddress?.city || "City"}
              value={addressValue.city || ""}
              onChange={(e) => updateField("city", e.target.value)}
              className={cn(error ? "border-destructive" : "")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${field.name}-state`} className="text-xs text-[hsl(var(--globe-grey))]">
              State / Province / Canton
            </Label>
            <Input
              id={`${field.name}-state`}
              placeholder={suggestedAddress?.state || "State or province"}
              value={addressValue.state || ""}
              onChange={(e) => updateField("state", e.target.value)}
              className={cn(error ? "border-destructive" : "")}
            />
          </div>
        </div>
        
        {/* Postal Code and Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${field.name}-postalCode`} className="text-xs text-[hsl(var(--globe-grey))]">
              Postal / ZIP Code
            </Label>
            <Input
              id={`${field.name}-postalCode`}
              placeholder={suggestedAddress?.postalCode || "Postal code"}
              value={addressValue.postalCode || ""}
              onChange={(e) => updateField("postalCode", e.target.value)}
              className={cn(error ? "border-destructive" : "")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${field.name}-country`} className="text-xs text-[hsl(var(--globe-grey))]">
              Country
            </Label>
            <Select
              value={addressValue.country || "CH"}
              onValueChange={(val) => updateField("country", val)}
            >
              <SelectTrigger id={`${field.name}-country`} className={cn(error ? "border-destructive" : "")}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default AddressField;
