"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Check, Building2, User, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { CountrySelect } from "./CountrySelect";
import { resolveTemplateVariables, getNestedValue, parseCompositeValue } from "./utils";
import { useGooglePlacesSearch, type GooglePlacePrediction, type GooglePlaceDetails } from "@/lib/hooks/useGooglePlacesSearch";
import { usePlacesAutocomplete } from "@/lib/hooks/usePlacesAutocomplete";

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
        <span>Standard applied</span>
      </span>
    );
  }

  // No badge shown when suggestion is available but not applied
  return null;
}

/**
 * Party Field Renderer - Name + Address composite field
 * Stores: { name, street, city, state, postalCode, country, placeId? }
 * 
 * Google Places API integration:
 * - Search by business name to autocomplete all fields
 * - placeId stores Google Place ID for reference
 * - Address autocomplete when typing street address
 */
export function PartyField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;

  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  // Parse composite value
  const partyValue = parseCompositeValue<PartyValue>(value, DEFAULT_PARTY);

  // Google Places hooks
  const { predictions, loading: businessLoading, searchBusinesses, getPlaceDetails, clearPredictions } = useGooglePlacesSearch(300);
  const { suggestions: addressSuggestions, loading: addressLoading, fetchSuggestions: fetchAddressSuggestions, clearSuggestions: clearAddressSuggestions } = usePlacesAutocomplete('address');

  // State for UI
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<GooglePlaceDetails | null>(null);
  const [showPreviewCard, setShowPreviewCard] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  
  // Refs for click outside detection
  const nameInputRef = useRef<HTMLDivElement>(null);
  const streetInputRef = useRef<HTMLDivElement>(null);

  // Determine if this looks like a business or person based on label
  const isBusinessLikely = /company|business|employer|organization|corp|firm|entity/i.test(field.label);

  const updateField = (fieldName: keyof PartyValue, fieldValue: string | undefined) => {
    onChange(field.name, { ...partyValue, [fieldName]: fieldValue });
  };

  // Handle business name input changes
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    updateField("name", newName);

    // Search for businesses if it looks like a business field and name is long enough
    if (isBusinessLikely && newName.length >= 2) {
      searchBusinesses(newName);
      setShowBusinessDropdown(true);
    } else {
      clearPredictions();
      setShowBusinessDropdown(false);
    }
  };

  // Handle business selection
  const handleBusinessSelect = async (prediction: GooglePlacePrediction) => {
    setShowBusinessDropdown(false);
    
    // Get full place details
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      setSelectedBusiness(details);
      setShowPreviewCard(true);
    }
  };

  // Apply address from preview card
  const handleApplyAddress = () => {
    if (selectedBusiness) {
      const address = selectedBusiness.address;
      onChange(field.name, {
        name: selectedBusiness.name || partyValue.name || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.countryCode || address.country || "",
        placeId: selectedBusiness.place_id,
      });
      setShowPreviewCard(false);
      setSelectedBusiness(null);
      clearPredictions();
    }
  };

  // Dismiss preview card
  const handleDismissPreview = () => {
    setShowPreviewCard(false);
    setSelectedBusiness(null);
  };

  // Handle street address input changes
  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStreet = e.target.value;
    updateField("street", newStreet);

    // Fetch address suggestions if user is typing
    if (newStreet.length >= 3) {
      fetchAddressSuggestions(newStreet);
      setShowAddressDropdown(true);
    } else {
      clearAddressSuggestions();
      setShowAddressDropdown(false);
    }
  };

  // Handle address suggestion selection
  const handleAddressSelect = async (suggestion: { place_id: string; description: string }) => {
    setShowAddressDropdown(false);
    clearAddressSuggestions();
    
    // Fetch full address details from Google Places
    if (suggestion.place_id) {
      const details = await getPlaceDetails(suggestion.place_id);
      if (details) {
        const address = details.address;
        // Update all address fields including street
        onChange(field.name, {
          ...partyValue,
          street: address.street || partyValue.street || "",
          city: address.city || "",
          state: address.state || "",
          postalCode: address.postalCode || "",
          country: address.countryCode || address.country || "",
          placeId: suggestion.place_id,
        });
      }
    }
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
      if (streetInputRef.current && !streetInputRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Check if party is empty
  const isEmpty = !partyValue.name && !partyValue.street && !partyValue.city;
  
  // Show inline button only when field is empty
  const showInlineButton = hasSuggestion && !isApplied && isEmpty;

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
        {showSuggestion && (
          <AISuggestionStatusBadge
            suggestionKey={field.aiSuggestionKey!}
            enrichmentContext={enrichmentContext}
            currentValue={value}
          />
        )}
      </div>

      {showInlineButton && (
        <button
          type="button"
          onClick={handleApplySuggestion}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
            bg-[hsl(var(--selise-blue))]/5 text-[hsl(var(--selise-blue))] 
            hover:bg-[hsl(var(--selise-blue))]/15 transition-all cursor-pointer
            border border-[hsl(var(--selise-blue))]/20 hover:border-[hsl(var(--selise-blue))]/40
            shadow-sm hover:shadow w-fit"
          title="Apply standard party details"
        >
          <Sparkles className="h-3 w-3" />
          <span className="whitespace-nowrap">Use standard party details</span>
        </button>
      )}

      <div className="space-y-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
        {/* Name Field - Primary identifier with business search */}
        <div className="space-y-1.5" ref={nameInputRef}>
          <Label htmlFor={`${field.name}-name`} className="text-xs font-medium text-[hsl(var(--fg))]">
            {isBusinessLikely ? "Business / Company Name" : "Full Name (Person or Business)"}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={`${field.name}-name`}
              placeholder={suggestedParty?.name || (isBusinessLikely ? "Enter company name" : "Enter full name of person or business")}
              value={partyValue.name || ""}
              onChange={handleBusinessNameChange}
              onFocus={() => {
                if (isBusinessLikely && partyValue.name && partyValue.name.length >= 2) {
                  setShowBusinessDropdown(true);
                }
              }}
              className={cn(
                "font-medium pr-10",
                error ? "border-destructive" : ""
              )}
            />
            {businessLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--globe-grey))]" />
              </div>
            )}
            
            {/* Business Search Dropdown */}
            {showBusinessDropdown && predictions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-xl max-h-72 overflow-y-auto">
                <div className="px-3 py-2 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]/50">
                  <p className="text-[10px] text-[hsl(var(--globe-grey))]">
                    Select a business to auto-fill address
                  </p>
                </div>
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => handleBusinessSelect(prediction)}
                    className="w-full text-left px-4 py-3 hover:bg-[hsl(var(--selise-blue))]/5 transition-colors border-b border-[hsl(var(--border))]/30 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded bg-[hsl(var(--selise-blue))]/10">
                        <Building2 className="h-3 w-3 text-[hsl(var(--selise-blue))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[hsl(var(--fg))]">
                          {prediction.structured_formatting.main_text}
                        </div>
                        <div className="text-xs text-[hsl(var(--globe-grey))] mt-0.5 line-clamp-2">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-[hsl(var(--globe-grey))]">
            {isBusinessLikely
              ? "Legal name as registered. Start typing to search for businesses."
              : "Full legal name as it appears on official documents"}
          </p>
        </div>

        {/* Preview Card - Shows when business is selected */}
        {showPreviewCard && selectedBusiness && (
          <div className="p-4 rounded-lg border-2 border-[hsl(var(--selise-blue))]/30 bg-[hsl(var(--selise-blue))]/5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                <span className="font-medium text-sm text-[hsl(var(--fg))]">
                  {selectedBusiness.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismissPreview}
                className="text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 text-sm text-[hsl(var(--globe-grey))] mb-4">
              {selectedBusiness.address.street && (
                <div>{selectedBusiness.address.street}</div>
              )}
              <div>
                {[
                  selectedBusiness.address.city,
                  selectedBusiness.address.state,
                  selectedBusiness.address.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {selectedBusiness.address.country && (
                <div>{selectedBusiness.address.country}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleApplyAddress}
                size="sm"
                className="flex-1 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90 text-white"
              >
                Apply Address
              </Button>
              <Button
                type="button"
                onClick={handleDismissPreview}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Type Manually
              </Button>
            </div>
          </div>
        )}

        {/* Address Section */}
        <div className="pt-2 border-t border-[hsl(var(--border))]/50">
          <p className="text-xs font-medium text-[hsl(var(--globe-grey))] mb-3">
            {isBusinessLikely ? "Registered Address" : "Address"}
          </p>

          {/* Street Address with autocomplete */}
          <div className="space-y-1.5 mb-3" ref={streetInputRef}>
            <Label htmlFor={`${field.name}-street`} className="text-xs text-[hsl(var(--globe-grey))]">
              Street Address
            </Label>
            <div className="relative">
              <Input
                id={`${field.name}-street`}
                placeholder={suggestedParty?.street || "Start typing to search addresses..."}
                value={partyValue.street || ""}
                onChange={handleStreetChange}
                onFocus={() => {
                  if (partyValue.street && partyValue.street.length >= 3) {
                    setShowAddressDropdown(true);
                  }
                }}
                className={cn(error ? "border-destructive" : "")}
              />
              {addressLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--globe-grey))]" />
                </div>
              )}
              
              {/* Address Autocomplete Dropdown */}
              {showAddressDropdown && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-xl max-h-72 overflow-y-auto">
                  <div className="px-3 py-2 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]/50">
                    <p className="text-[10px] text-[hsl(var(--globe-grey))]">
                      Select an address to auto-fill all fields
                    </p>
                  </div>
                  {addressSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleAddressSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-[hsl(var(--selise-blue))]/5 transition-colors border-b border-[hsl(var(--border))]/30 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded bg-[hsl(var(--selise-blue))]/10">
                          <MapPin className="h-3 w-3 text-[hsl(var(--selise-blue))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[hsl(var(--fg))]">
                            {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                          </div>
                          <div className="text-xs text-[hsl(var(--globe-grey))] mt-0.5 line-clamp-2">
                            {suggestion.structured_formatting?.secondary_text || suggestion.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-[hsl(var(--globe-grey))]">
              Type at least 3 characters to see address suggestions
            </p>
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
              <CountrySelect
                id={`${field.name}-country`}
                value={partyValue.country && partyValue.country.trim() ? partyValue.country : undefined}
                onValueChange={(val) => updateField("country", val)}
                placeholder="Select country"
                error={!!error}
              />
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
