"use client";

import { Sparkles, Check, Building2, User } from "lucide-react";
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
import type { FieldRendererProps, PartyValue } from "./types";
import { COUNTRIES } from "./types";
import { resolveTemplateVariables, getNestedValue, parseCompositeValue } from "./utils";

const DEFAULT_PARTY: PartyValue = {
  name: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  placeId: undefined,
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

  const currentParty = parseCompositeValue<PartyValue>(currentValue, DEFAULT_PARTY);
  const suggestedParty = parseCompositeValue<PartyValue>(suggestedValue, DEFAULT_PARTY);

  // Check if all fields match
  const fieldsMatch =
    currentParty.name === suggestedParty.name &&
    currentParty.street === suggestedParty.street &&
    currentParty.city === suggestedParty.city &&
    currentParty.state === suggestedParty.state &&
    currentParty.postalCode === suggestedParty.postalCode &&
    currentParty.country === suggestedParty.country;

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
 * Party Field Renderer - Name + Address composite field
 * Stores: { name, street, city, state, postalCode, country, placeId? }
 * 
 * Designed for future Google Places API integration:
 * - Search by business name to autocomplete all fields
 * - placeId stores Google Place ID for reference
 */
export function PartyField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Parse composite value
  const partyValue = parseCompositeValue<PartyValue>(value, DEFAULT_PARTY);

  const updateField = (fieldName: keyof PartyValue, fieldValue: string) => {
    onChange(field.name, { ...partyValue, [fieldName]: fieldValue });
  };

  const handleApplySuggestion = () => {
    if (!field.aiSuggestionKey || !enrichmentContext) return;
    const suggestedValue = getNestedValue(enrichmentContext, field.aiSuggestionKey);
    if (suggestedValue) {
      const suggestedParty = parseCompositeValue<PartyValue>(suggestedValue, DEFAULT_PARTY);
      onChange(field.name, suggestedParty);
    }
  };

  // Check if there's a suggestion available
  const hasSuggestion = showSuggestion && enrichmentContext &&
    Object.keys(enrichmentContext).length > 0 &&
    getNestedValue(enrichmentContext, field.aiSuggestionKey!) !== undefined;

  const suggestedParty = hasSuggestion
    ? parseCompositeValue<PartyValue>(getNestedValue(enrichmentContext!, field.aiSuggestionKey!), DEFAULT_PARTY)
    : null;

  // Check if already applied
  const isApplied = suggestedParty &&
    partyValue.name === suggestedParty.name &&
    partyValue.street === suggestedParty.street &&
    partyValue.city === suggestedParty.city &&
    partyValue.state === suggestedParty.state &&
    partyValue.postalCode === suggestedParty.postalCode &&
    partyValue.country === suggestedParty.country;

  // Determine if this looks like a business or person based on label
  const isBusinessLikely = /company|business|employer|organization|corp|firm|entity/i.test(field.label);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {isBusinessLikely ? (
            <Building2 className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
          ) : (
            <User className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
          )}
          <Label>
            {resolvedLabel}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
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
        {/* Name Field - Primary identifier */}
        <div className="space-y-1.5">
          <Label htmlFor={`${field.name}-name`} className="text-xs font-medium text-[hsl(var(--fg))]">
            {isBusinessLikely ? "Business / Company Name" : "Full Name (Person or Business)"}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={`${field.name}-name`}
            placeholder={suggestedParty?.name || (isBusinessLikely ? "Enter company name" : "Enter full name of person or business")}
            value={partyValue.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            className={cn(
              "font-medium",
              error ? "border-destructive" : ""
            )}
          />
          {/* Future: Google Places autocomplete will be integrated here */}
          <p className="text-[10px] text-[hsl(var(--globe-grey))]">
            {isBusinessLikely
              ? "Legal name as registered"
              : "Full legal name as it appears on official documents"}
          </p>
        </div>

        {/* Address Section */}
        <div className="pt-2 border-t border-[hsl(var(--border))]/50">
          <p className="text-xs font-medium text-[hsl(var(--globe-grey))] mb-3">
            {isBusinessLikely ? "Registered Address" : "Address"}
          </p>

          {/* Street Address */}
          <div className="space-y-1.5 mb-3">
            <Label htmlFor={`${field.name}-street`} className="text-xs text-[hsl(var(--globe-grey))]">
              Street Address
            </Label>
            <Input
              id={`${field.name}-street`}
              placeholder={suggestedParty?.street || "Street address, building, floor"}
              value={partyValue.street || ""}
              onChange={(e) => updateField("street", e.target.value)}
              className={cn(error ? "border-destructive" : "")}
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${field.name}-city`} className="text-xs text-[hsl(var(--globe-grey))]">
                City
              </Label>
              <Input
                id={`${field.name}-city`}
                placeholder={suggestedParty?.city || "City"}
                value={partyValue.city || ""}
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
                placeholder={suggestedParty?.state || "State or province"}
                value={partyValue.state || ""}
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
                placeholder={suggestedParty?.postalCode || "Postal code"}
                value={partyValue.postalCode || ""}
                onChange={(e) => updateField("postalCode", e.target.value)}
                className={cn(error ? "border-destructive" : "")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${field.name}-country`} className="text-xs text-[hsl(var(--globe-grey))]">
                Country
              </Label>
              <Select
                value={partyValue.country && partyValue.country.trim() ? partyValue.country : undefined}
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
      </div>

      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default PartyField;
