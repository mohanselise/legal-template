"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { FieldType } from "@/lib/db";
import {
  ADDITIONAL_SIGNATORIES_FIELD_NAME,
  AdditionalSignatoryInput,
  SIGNATORY_PARTY_OPTIONS,
  createBlankAdditionalSignatory,
  ensureAdditionalSignatoryArray,
} from "@/lib/templates/signatory-fields";

export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options: string[];
  // AI Smart Suggestions
  aiSuggestionEnabled?: boolean;
  aiSuggestionKey?: string | null;
}

export interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  enrichmentContext?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve template variables in a string
 * Supports {{variableName}} syntax
 * Looks up values from formData first, then enrichmentContext
 * Falls back to showing the variable name if not found
 */
function resolveTemplateVariables(
  template: string | null | undefined,
  formData?: Record<string, unknown>,
  enrichmentContext?: Record<string, unknown>
): string {
  if (!template) return "";
  
  // Match all {{variableName}} patterns
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    // Try to get value from formData first
    if (formData) {
      const formValue = getNestedValue(formData, trimmedName);
      if (formValue !== undefined && formValue !== null && formValue !== "") {
        return String(formValue);
      }
    }
    
    // Try to get value from enrichmentContext
    if (enrichmentContext) {
      const contextValue = getNestedValue(enrichmentContext, trimmedName);
      if (contextValue !== undefined && contextValue !== null && contextValue !== "") {
        return String(contextValue);
      }
    }
    
    // Fallback: return a placeholder indicating the variable name
    return `[${trimmedName}]`;
  });
}

/**
 * AI Suggestion Badge - shows suggested value and allows one-click apply
 */
function AISuggestionBadge({
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
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AISuggestionBadge] Checking:', {
      suggestionKey,
      hasEnrichmentContext: !!enrichmentContext,
      enrichmentContextKeys: enrichmentContext ? Object.keys(enrichmentContext) : [],
      currentValue,
    });
  }

  if (!suggestionKey) return null;
  
  // If enrichment context is empty, show waiting indicator
  if (!enrichmentContext || Object.keys(enrichmentContext).length === 0) {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
        title={`AI suggestion will appear after completing the previous step with AI enrichment (key: ${suggestionKey})`}
      >
        <Sparkles className="h-3 w-3 opacity-50" />
        <span className="opacity-70">AI</span>
      </span>
    );
  }

  const suggestedValue = getNestedValue(enrichmentContext, suggestionKey);
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AISuggestionBadge] Value lookup:', {
      suggestionKey,
      suggestedValue,
      found: suggestedValue !== undefined && suggestedValue !== null,
    });
  }
  
  // Don't show if no suggestion or if current value matches
  if (suggestedValue === undefined || suggestedValue === null) {
    // Show that suggestion is configured but value not found
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full 
          bg-amber-100 text-amber-700"
        title={`AI suggestion configured (key: ${suggestionKey}) but no value found in context. Available keys: ${Object.keys(enrichmentContext).join(', ')}`}
      >
        <Sparkles className="h-3 w-3" />
        <span>AI (no match)</span>
      </span>
    );
  }
  
  if (String(suggestedValue) === String(currentValue)) return null;

  const displayValue = typeof suggestedValue === 'object' 
    ? JSON.stringify(suggestedValue)
    : String(suggestedValue);

  // Truncate long values for display
  const truncatedValue = displayValue.length > 40 
    ? displayValue.substring(0, 40) + '...' 
    : displayValue;

  return (
    <button
      type="button"
      onClick={() => onApply(suggestedValue)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full 
        bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] 
        hover:bg-[hsl(var(--selise-blue))]/20 transition-colors cursor-pointer
        border border-[hsl(var(--selise-blue))]/20"
      title={`Click to use: ${displayValue}`}
    >
      <Sparkles className="h-3 w-3" />
      <span>Use: {truncatedValue}</span>
      <Check className="h-3 w-3 opacity-60" />
    </button>
  );
}

/**
 * Text Field Renderer
 */
export function TextField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && (field.aiSuggestionEnabled || field.aiSuggestionKey)) {
    console.log('[TextField] AI Suggestion config:', {
      fieldName: field.name,
      aiSuggestionEnabled: field.aiSuggestionEnabled,
      aiSuggestionKey: field.aiSuggestionKey,
      showSuggestion,
    });
  }
  
  // Resolve template variables in label, placeholder, and helpText
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

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
      <Input
        id={field.name}
        type="text"
        placeholder={resolvedPlaceholder || undefined}
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Email Field Renderer
 */
export function EmailField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

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
      <Input
        id={field.name}
        type="email"
        placeholder={resolvedPlaceholder || "email@example.com"}
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Date Field Renderer
 */
export function DateField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

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
      <Input
        id={field.name}
        type="date"
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Number Field Renderer
 */
export function NumberField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

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
      <Input
        id={field.name}
        type="number"
        placeholder={resolvedPlaceholder || undefined}
        value={(value as string | number) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Checkbox Field Renderer
 */
export function CheckboxField({ field, value, onChange, error, formData, enrichmentContext }: FieldRendererProps) {
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          id={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          className="h-4 w-4 mt-1 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
        />
        <div>
          <Label htmlFor={field.name} className="cursor-pointer">
            {resolvedLabel}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {resolvedHelpText && (
            <p className="text-xs text-[hsl(var(--globe-grey))] mt-0.5">
              {resolvedHelpText}
            </p>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Select Field Renderer
 */
export function SelectField({ field, value, onChange, error, enrichmentContext, formData }: FieldRendererProps) {
  const showSuggestion = field.aiSuggestionEnabled && field.aiSuggestionKey;
  
  // Resolve template variables
  const resolvedLabel = resolveTemplateVariables(field.label, formData, enrichmentContext);
  const resolvedPlaceholder = resolveTemplateVariables(field.placeholder, formData, enrichmentContext);
  const resolvedHelpText = resolveTemplateVariables(field.helpText, formData, enrichmentContext);

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
      <Select
        value={(value as string) || ""}
        onValueChange={(val) => onChange(field.name, val)}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={resolvedPlaceholder || `Select ${resolvedLabel.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {resolvedHelpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{resolvedHelpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Additional Signatories Field Renderer
 */
export function AdditionalSignatoriesField({
  field,
  value,
  onChange,
  error,
}: FieldRendererProps) {
  const [entries, setEntries] = useState<AdditionalSignatoryInput[]>(
    ensureAdditionalSignatoryArray(value)
  );

  useEffect(() => {
    setEntries(ensureAdditionalSignatoryArray(value));
  }, [value]);

  const updateEntries = (next: AdditionalSignatoryInput[]) => {
    setEntries(next);
    onChange(field.name, next);
  };

  const handleEntryChange = (
    index: number,
    key: keyof AdditionalSignatoryInput,
    fieldValue: string
  ) => {
    updateEntries(
      entries.map((entry, idx) =>
        idx === index ? { ...entry, [key]: fieldValue } : entry
      )
    );
  };

  const handleAddEntry = () => {
    updateEntries([...entries, createBlankAdditionalSignatory()]);
  };

  const handleRemoveEntry = (index: number) => {
    updateEntries(entries.filter((_, idx) => idx !== index));
  };

  const renderEntry = (entry: AdditionalSignatoryInput, index: number) => {
    const baseId = entry.id || `${field.name}-${index}`;
    return (
      <div
        key={baseId}
        className="rounded-lg border border-[hsl(var(--border))] bg-white p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[hsl(var(--fg))]">
            Additional Signatory #{index + 1}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveEntry(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-name`}>Full Name *</Label>
            <Input
              id={`${baseId}-name`}
              placeholder="Jane Doe"
              value={entry.name || ""}
              onChange={(e) => handleEntryChange(index, "name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-email`}>Email *</Label>
            <Input
              id={`${baseId}-email`}
              type="email"
              placeholder="jane@example.com"
              value={entry.email || ""}
              onChange={(e) => handleEntryChange(index, "email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-party`}>Party</Label>
            <Select
              value={entry.party}
              onValueChange={(val) => handleEntryChange(index, "party", val)}
            >
              <SelectTrigger id={`${baseId}-party`}>
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
              <SelectContent>
                {SIGNATORY_PARTY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-title`}>Title / Role</Label>
            <Input
              id={`${baseId}-title`}
              placeholder="Authorized Signatory"
              value={entry.title || ""}
              onChange={(e) => handleEntryChange(index, "title", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${baseId}-phone`}>Phone</Label>
            <Input
              id={`${baseId}-phone`}
              placeholder="+1 (555) 123-4567"
              value={entry.phone || ""}
              onChange={(e) => handleEntryChange(index, "phone", e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Add Signatory
        </Button>
      </div>
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4 text-sm text-[hsl(var(--globe-grey))]">
          No additional signatories yet. Click “Add Signatory” to include more parties on this document.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => renderEntry(entry, index))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Dynamic Field Renderer
 * Renders the appropriate field component based on field type
 */
export function DynamicField(props: FieldRendererProps) {
  const { field } = props;

  if (field.name === ADDITIONAL_SIGNATORIES_FIELD_NAME) {
    return <AdditionalSignatoriesField {...props} />;
  }

  switch (field.type) {
    case "text":
      return <TextField {...props} />;
    case "email":
      return <EmailField {...props} />;
    case "date":
      return <DateField {...props} />;
    case "number":
      return <NumberField {...props} />;
    case "checkbox":
      return <CheckboxField {...props} />;
    case "select":
      return <SelectField {...props} />;
    default:
      return <TextField {...props} />;
  }
}

export default DynamicField;
