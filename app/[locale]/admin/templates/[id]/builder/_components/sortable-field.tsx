"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  Sparkles,
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
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TemplateField, FieldType, TemplateScreen } from "@/lib/db";

// Field type icons mapping
const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  multiselect: <List className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  address: <MapPin className="h-4 w-4" />,
  party: <Users className="h-4 w-4" />,
  currency: <Banknote className="h-4 w-4" />,
  percentage: <Percent className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
};

// Field type labels mapping
const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text",
  email: "Email",
  date: "Date",
  number: "Number",
  checkbox: "Checkbox",
  select: "Select",
  multiselect: "Multiselect",
  textarea: "Textarea",
  phone: "Phone",
  address: "Address",
  party: "Party",
  currency: "Currency",
  percentage: "Percentage",
  url: "URL",
};

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface SortableFieldProps {
  field: TemplateField;
  screenId: string;
  onEdit: (field: TemplateField) => void;
  onDelete: (field: TemplateField) => void;
  onMoveField?: (field: TemplateField, targetScreenId: string) => Promise<void>;
  allScreens?: ScreenWithFields[];
  isDraggingOver?: boolean;
}

export function SortableField({
  field,
  screenId,
  onEdit,
  onDelete,
  onMoveField,
  allScreens = [],
  isDraggingOver,
}: SortableFieldProps) {
  // Get other screens (excluding current screen and signatory screens) for move dropdown
  const otherScreens = allScreens.filter(
    (s) => s.id !== screenId && (s as any).type !== "signatory"
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: field.id,
    data: {
      type: "field",
      field,
      screenId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-4 rounded-lg border bg-white transition-all",
        isDragging
          ? "opacity-50 shadow-lg ring-2 ring-[hsl(var(--selise-blue))]/30 z-50"
          : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/30",
        isOver && "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5",
        isDraggingOver && "scale-[0.98]"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-[hsl(var(--globe-grey))] opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Field Type Icon */}
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] flex-shrink-0">
        {fieldTypeIcons[field.type]}
      </div>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[hsl(var(--fg))]">{field.label}</span>
          {field.required && (
            <Badge
              variant="secondary"
              className="text-xs bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]"
            >
              Required
            </Badge>
          )}
          {(field as any).aiSuggestionEnabled && (
            <Badge
              variant="secondary"
              className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] gap-1"
            >
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs text-[hsl(var(--globe-grey))] bg-[hsl(var(--border))]/50 px-1.5 py-0.5 rounded">
            {field.name}
          </code>
          <span className="text-xs text-[hsl(var(--globe-grey))]">
            {fieldTypeLabels[field.type]}
          </span>
          {(field.type === "select" || field.type === "multiselect") &&
            field.options.length > 0 && (
              <span className="text-xs text-[hsl(var(--globe-grey))]">
                ({field.options.length} options)
              </span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(field)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {onMoveField && otherScreens.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to Screen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {otherScreens.map((targetScreen) => (
                <DropdownMenuItem
                  key={targetScreen.id}
                  onClick={() => onMoveField(field, targetScreen.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{targetScreen.title}</span>
                    <span className="text-xs text-[hsl(var(--globe-grey))]">
                      {targetScreen.fields.length} field{targetScreen.fields.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(field)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Drag overlay component for visual feedback during drag
interface FieldDragOverlayProps {
  field: TemplateField;
}

export function FieldDragOverlay({ field }: FieldDragOverlayProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-[hsl(var(--selise-blue))] bg-white shadow-xl ring-2 ring-[hsl(var(--selise-blue))]/30">
      <GripVertical className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] flex-shrink-0">
        {fieldTypeIcons[field.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[hsl(var(--fg))]">{field.label}</span>
        </div>
        <div className="text-xs text-[hsl(var(--globe-grey))]">
          {fieldTypeLabels[field.type]}
        </div>
      </div>
    </div>
  );
}

// Palette field type drag overlay
interface PaletteFieldDragOverlayProps {
  fieldType: FieldType;
  label: string;
}

export function PaletteFieldDragOverlay({ fieldType, label }: PaletteFieldDragOverlayProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--selise-blue))] bg-white shadow-xl ring-2 ring-[hsl(var(--selise-blue))]/30">
      <div className="h-8 w-8 rounded-md bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] flex-shrink-0">
        {fieldTypeIcons[fieldType]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[hsl(var(--fg))]">{label}</div>
        <div className="text-xs text-[hsl(var(--globe-grey))]">Drop to add field</div>
      </div>
    </div>
  );
}

