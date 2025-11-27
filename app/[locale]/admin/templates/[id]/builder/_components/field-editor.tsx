"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { TemplateField, FieldType } from "@/lib/db";

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Must start with letter, alphanumeric only"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "email", "date", "number", "checkbox", "select"]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).default([]),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface FieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenId: string;
  field: TemplateField | null;
  onSaved: () => void;
}

const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select / Dropdown" },
];

export function FieldEditor({
  open,
  onOpenChange,
  screenId,
  field,
  onSaved,
}: FieldEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      helpText: "",
      options: [],
    },
  });

  const fieldType = watch("type");

  // Reset form when dialog opens/closes or field changes
  useEffect(() => {
    if (open) {
      if (field) {
        reset({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || "",
          helpText: field.helpText || "",
          options: field.options || [],
        });
        setOptions(field.options || []);
      } else {
        reset({
          name: "",
          label: "",
          type: "text",
          required: false,
          placeholder: "",
          helpText: "",
          options: [],
        });
        setOptions([]);
      }
      setError(null);
      setNewOption("");
    }
  }, [open, field, reset]);

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      const updated = [...options, newOption.trim()];
      setOptions(updated);
      setValue("options", updated);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setValue("options", updated);
  };

  const onSubmit = async (data: FieldFormData) => {
    setSaving(true);
    setError(null);

    try {
      // Include options for select type
      const payload = {
        ...data,
        options: fieldType === "select" ? options : [],
      };

      const url = field
        ? `/api/admin/fields/${field.id}`
        : `/api/admin/screens/${screenId}/fields`;

      const response = await fetch(url, {
        method: field ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save field");
      }

      // Show success message
      toast.success(field ? "Field updated successfully" : "Field created successfully");
      
      // Close modal and refresh
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save field";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{field ? "Edit Field" : "Add Field"}</DialogTitle>
            <DialogDescription>
              {field
                ? "Update the field properties."
                : "Create a new form field for this screen."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Field Name *</Label>
              <Input
                id="name"
                placeholder="e.g., companyName"
                {...register("name")}
              />
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Used as the key in form data. Start with letter, alphanumeric only.
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                placeholder="e.g., Company Name"
                {...register("label")}
              />
              {errors.label && (
                <p className="text-sm text-destructive">{errors.label.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Field Type *</Label>
              <Select
                value={fieldType}
                onValueChange={(value) => setValue("type", value as FieldType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Required Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                {...register("required")}
                className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
              />
              <Label htmlFor="required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            {/* Placeholder (not for checkbox) */}
            {fieldType !== "checkbox" && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  placeholder="e.g., Enter company name..."
                  {...register("placeholder")}
                />
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-2">
              <Label htmlFor="helpText">Help Text</Label>
              <Input
                id="helpText"
                placeholder="e.g., Your registered company name"
                {...register("helpText")}
              />
            </div>

            {/* Options (for select type) */}
            {fieldType === "select" && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add an option..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {options.map((option, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="pr-1 gap-1"
                      >
                        {option}
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {options.length === 0 && (
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Add at least one option for the dropdown
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || (fieldType === "select" && options.length === 0)}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {field ? "Save Changes" : "Create Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

