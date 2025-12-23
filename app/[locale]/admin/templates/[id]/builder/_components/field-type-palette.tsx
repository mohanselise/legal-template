"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  Mail,
  Calendar,
  Hash,
  CheckSquare,
  List,
  AlignLeft,
  Phone,
  MapPin,
  Users,
  Banknote,
  Percent,
  Link2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FieldType } from "@/lib/db";

// Field type configuration with icons, labels, descriptions and groups
export interface FieldTypeConfig {
  value: FieldType;
  label: string;
  description: string;
  group: "Composite" | "Specialized" | "Basic";
  icon: React.ReactNode;
  defaultValues?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
}

export const fieldTypeConfigs: FieldTypeConfig[] = [
  // Composite fields (most feature-rich)
  {
    value: "party",
    label: "Party",
    description: "Business/person with full address",
    group: "Composite",
    icon: <Users className="h-4 w-4" />,
    defaultValues: { label: "Party Name", required: true },
  },
  {
    value: "address",
    label: "Address",
    description: "Full address with all fields",
    group: "Composite",
    icon: <MapPin className="h-4 w-4" />,
    defaultValues: { label: "Address" },
  },
  {
    value: "phone",
    label: "Phone",
    description: "Phone with country code",
    group: "Composite",
    icon: <Phone className="h-4 w-4" />,
    defaultValues: { label: "Phone Number", placeholder: "+41 XX XXX XX XX" },
  },
  {
    value: "currency",
    label: "Currency",
    description: "Amount with currency selector",
    group: "Composite",
    icon: <Banknote className="h-4 w-4" />,
    defaultValues: { label: "Amount", required: true },
  },
  // Specialized fields
  {
    value: "percentage",
    label: "Percentage",
    description: "0-100% input",
    group: "Specialized",
    icon: <Percent className="h-4 w-4" />,
    defaultValues: { label: "Percentage", placeholder: "Enter percentage" },
  },
  {
    value: "url",
    label: "URL",
    description: "Website link with validation",
    group: "Specialized",
    icon: <Link2 className="h-4 w-4" />,
    defaultValues: { label: "Website", placeholder: "https://" },
  },
  {
    value: "textarea",
    label: "Long Text",
    description: "Multi-line text area",
    group: "Specialized",
    icon: <AlignLeft className="h-4 w-4" />,
    defaultValues: { label: "Description" },
  },
  // Basic fields
  {
    value: "text",
    label: "Text",
    description: "Single-line text",
    group: "Basic",
    icon: <Type className="h-4 w-4" />,
    defaultValues: { label: "Text Field" },
  },
  {
    value: "email",
    label: "Email",
    description: "Email with validation",
    group: "Basic",
    icon: <Mail className="h-4 w-4" />,
    defaultValues: { label: "Email Address", placeholder: "email@example.com" },
  },
  {
    value: "date",
    label: "Date",
    description: "Date picker",
    group: "Basic",
    icon: <Calendar className="h-4 w-4" />,
    defaultValues: { label: "Date" },
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric input",
    group: "Basic",
    icon: <Hash className="h-4 w-4" />,
    defaultValues: { label: "Number", placeholder: "0" },
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "Yes/No toggle",
    group: "Basic",
    icon: <CheckSquare className="h-4 w-4" />,
    defaultValues: { label: "Agree to terms" },
  },
  {
    value: "select",
    label: "Select",
    description: "Dropdown options",
    group: "Basic",
    icon: <List className="h-4 w-4" />,
    defaultValues: { label: "Select Option" },
  },
  {
    value: "multiselect",
    label: "Multi-Select",
    description: "Multiple choice",
    group: "Basic",
    icon: <List className="h-4 w-4" />,
    defaultValues: { label: "Select Options" },
  },
];

// Get field type config by value
export function getFieldTypeConfig(type: FieldType): FieldTypeConfig | undefined {
  return fieldTypeConfigs.find((config) => config.value === type);
}

interface DraggableFieldTypeProps {
  config: FieldTypeConfig;
  disabled?: boolean;
}

function DraggableFieldType({ config, disabled }: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${config.value}`,
    data: {
      type: "palette-field-type",
      fieldType: config.value,
      config,
    },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group flex items-center gap-3 p-2.5 rounded-lg border border-[hsl(var(--border))] bg-white cursor-grab active:cursor-grabbing transition-all",
        "hover:border-[hsl(var(--selise-blue))]/40 hover:bg-[hsl(var(--selise-blue))]/5 hover:shadow-sm",
        isDragging && "shadow-lg ring-2 ring-[hsl(var(--selise-blue))]/30 z-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] shrink-0">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[hsl(var(--fg))] truncate">
          {config.label}
        </div>
        <div className="text-xs text-[hsl(var(--globe-grey))] truncate">
          {config.description}
        </div>
      </div>
      <GripVertical className="h-4 w-4 text-[hsl(var(--globe-grey))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

interface FieldGroupProps {
  title: string;
  fields: FieldTypeConfig[];
  defaultOpen?: boolean;
  disabled?: boolean;
  colorClass?: string;
}

function FieldGroup({ title, fields, defaultOpen = true, disabled, colorClass = "text-[hsl(var(--selise-blue))]" }: FieldGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left px-1"
      >
        {isOpen ? (
          <ChevronDown className={cn("h-4 w-4", colorClass)} />
        ) : (
          <ChevronRight className={cn("h-4 w-4", colorClass)} />
        )}
        <span className={cn("text-xs font-semibold uppercase tracking-wider", colorClass)}>
          {title}
        </span>
        <span className="text-xs text-[hsl(var(--globe-grey))]">({fields.length})</span>
      </button>
      {isOpen && (
        <div className="space-y-1.5 pl-1">
          {fields.map((config) => (
            <DraggableFieldType key={config.value} config={config} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FieldTypePaletteProps {
  disabled?: boolean;
  className?: string;
}

export function FieldTypePalette({ disabled, className }: FieldTypePaletteProps) {
  const compositeFields = fieldTypeConfigs.filter((f) => f.group === "Composite");
  const specializedFields = fieldTypeConfigs.filter((f) => f.group === "Specialized");
  const basicFields = fieldTypeConfigs.filter((f) => f.group === "Basic");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="px-1">
        <h3 className="text-sm font-semibold text-[hsl(var(--fg))] mb-1">Field Types</h3>
        <p className="text-xs text-[hsl(var(--globe-grey))]">
          Drag fields to add them to a screen
        </p>
      </div>

      <div className="space-y-4">
        <FieldGroup
          title="Composite"
          fields={compositeFields}
          defaultOpen={true}
          disabled={disabled}
          colorClass="text-[hsl(var(--selise-blue))]"
        />
        <FieldGroup
          title="Specialized"
          fields={specializedFields}
          defaultOpen={true}
          disabled={disabled}
          colorClass="text-[hsl(var(--poly-green))]"
        />
        <FieldGroup
          title="Basic"
          fields={basicFields}
          defaultOpen={false}
          disabled={disabled}
          colorClass="text-[hsl(var(--globe-grey))]"
        />
      </div>
    </div>
  );
}

