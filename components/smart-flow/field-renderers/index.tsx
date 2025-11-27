"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldType } from "@/lib/db";

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
 * Dynamic Field Renderer
 * Renders the appropriate field component based on field type
 */
export function DynamicField(props: FieldRendererProps) {
  const { field } = props;

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

