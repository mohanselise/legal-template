"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
}

export interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
}

/**
 * Text Field Renderer
 */
export function TextField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.name}
        type="text"
        placeholder={field.placeholder || undefined}
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Email Field Renderer
 */
export function EmailField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.name}
        type="email"
        placeholder={field.placeholder || "email@example.com"}
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Date Field Renderer
 */
export function DateField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.name}
        type="date"
        value={(value as string) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Number Field Renderer
 */
export function NumberField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.name}
        type="number"
        placeholder={field.placeholder || undefined}
        value={(value as string | number) || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={error ? "border-destructive" : ""}
      />
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Checkbox Field Renderer
 */
export function CheckboxField({ field, value, onChange, error }: FieldRendererProps) {
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
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.helpText && (
            <p className="text-xs text-[hsl(var(--globe-grey))] mt-0.5">
              {field.helpText}
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
export function SelectField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={(value as string) || ""}
        onValueChange={(val) => onChange(field.name, val)}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.helpText && (
        <p className="text-xs text-[hsl(var(--globe-grey))]">{field.helpText}</p>
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
