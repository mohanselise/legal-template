"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Sparkles, ChevronDown, ChevronUp, Copy, Variable } from "lucide-react";
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
import type { TemplateField, FieldType, TemplateScreen } from "@/lib/db";

// Interface for available AI context keys from previous screens
export interface AvailableContextKey {
  screenTitle: string;
  key: string;
  type: string;
  fullPath: string; // The key to use in aiSuggestionKey
}

// Interface for available form fields from previous screens
export interface AvailableFormField {
  screenTitle: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  variableSyntax: string; // e.g., {{fieldName}}
}

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
  // AI Smart Suggestions from enrichment context
  aiSuggestionEnabled: z.boolean().default(false),
  aiSuggestionKey: z.string().optional(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface FieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenId: string;
  field: TemplateField | null;
  onSaved: () => void;
  availableContextKeys?: AvailableContextKey[];
  availableFormFields?: AvailableFormField[];
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
  availableContextKeys = [],
  availableFormFields = [],
}: FieldEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [aiSectionExpanded, setAiSectionExpanded] = useState(false);
  const [variablesSectionExpanded, setVariablesSectionExpanded] = useState(false);
  const [activeInputField, setActiveInputField] = useState<"label" | "placeholder" | "helpText" | null>(null);

  // Check if there are any variables available
  const hasVariables = availableFormFields.length > 0 || availableContextKeys.length > 0;

  // Insert variable into the active text field
  const insertVariable = (variableSyntax: string) => {
    if (!activeInputField) {
      toast.info("Click on Label, Placeholder, or Help Text field first to insert the variable");
      return;
    }
    const currentValue = watch(activeInputField) || "";
    setValue(activeInputField, currentValue + variableSyntax, { shouldDirty: true });
    toast.success(`Inserted ${variableSyntax} into ${activeInputField}`);
  };

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
      aiSuggestionEnabled: false,
      aiSuggestionKey: "",
    },
  });

  const fieldType = watch("type");

  // Reset form when dialog opens/closes or field changes
  useEffect(() => {
    if (open) {
      if (field) {
        const aiEnabled = (field as any).aiSuggestionEnabled ?? false;
        reset({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || "",
          helpText: field.helpText || "",
          options: field.options || [],
          aiSuggestionEnabled: aiEnabled,
          aiSuggestionKey: (field as any).aiSuggestionKey || "",
        });
        setOptions(field.options || []);
        setAiSectionExpanded(aiEnabled);
      } else {
        reset({
          name: "",
          label: "",
          type: "text",
          required: false,
          placeholder: "",
          helpText: "",
          options: [],
          aiSuggestionEnabled: false,
          aiSuggestionKey: "",
        });
        setOptions([]);
        setAiSectionExpanded(false);
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
      // Include options for select type and AI suggestion fields
      const payload: Record<string, unknown> = {
        ...data,
        options: fieldType === "select" ? options : [],
        aiSuggestionEnabled: data.aiSuggestionEnabled ?? false,
      };
      
      // Only include aiSuggestionKey if it has a value, otherwise don't include it
      if (data.aiSuggestionEnabled && data.aiSuggestionKey?.trim()) {
        payload.aiSuggestionKey = data.aiSuggestionKey.trim();
      } else {
        payload.aiSuggestionKey = null;
      }

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
              <div className="flex items-center justify-between">
                <Label htmlFor="label">Label *</Label>
                {hasVariables && activeInputField === "label" && (
                  <span className="text-xs text-[hsl(var(--selise-blue))]">← Insert variables below</span>
                )}
              </div>
              <Input
                id="label"
                placeholder="e.g., Company Name or Email for {{employeeName}}"
                {...register("label")}
                onFocus={() => setActiveInputField("label")}
                className={activeInputField === "label" ? "ring-2 ring-[hsl(var(--selise-blue))]/30" : ""}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="placeholder">Placeholder</Label>
                  {hasVariables && activeInputField === "placeholder" && (
                    <span className="text-xs text-[hsl(var(--selise-blue))]">← Insert variables below</span>
                  )}
                </div>
                <Input
                  id="placeholder"
                  placeholder="e.g., Enter {{companyName}}'s email..."
                  {...register("placeholder")}
                  onFocus={() => setActiveInputField("placeholder")}
                  className={activeInputField === "placeholder" ? "ring-2 ring-[hsl(var(--selise-blue))]/30" : ""}
                />
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="helpText">Help Text</Label>
                {hasVariables && activeInputField === "helpText" && (
                  <span className="text-xs text-[hsl(var(--selise-blue))]">← Insert variables below</span>
                )}
              </div>
              <Input
                id="helpText"
                placeholder="e.g., Work email for {{employeeName}} at {{companyName}}"
                {...register("helpText")}
                onFocus={() => setActiveInputField("helpText")}
                className={activeInputField === "helpText" ? "ring-2 ring-[hsl(var(--selise-blue))]/30" : ""}
              />
            </div>

            {/* Template Variables Section */}
            {hasVariables && (
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setVariablesSectionExpanded(!variablesSectionExpanded)}
                  className="w-full flex items-center justify-between p-3 bg-[hsl(var(--poly-green))]/5 hover:bg-[hsl(var(--poly-green))]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                    <span className="font-medium text-sm text-[hsl(var(--fg))]">
                      Template Variables
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {availableFormFields.length + availableContextKeys.length}
                    </Badge>
                  </div>
                  {variablesSectionExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                  )}
                </button>
                
                {variablesSectionExpanded && (
                  <div className="p-4 space-y-4 border-t border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      Click on <strong>Label</strong>, <strong>Placeholder</strong>, or <strong>Help Text</strong> field above, then click a variable below to insert it. 
                      Variables will be replaced with actual values when the form is rendered.
                    </p>
                    
                    {activeInputField && (
                      <div className="flex items-center gap-2 p-2 bg-[hsl(var(--selise-blue))]/10 rounded-md text-xs text-[hsl(var(--selise-blue))]">
                        <span>Inserting into: <strong>{activeInputField}</strong></span>
                      </div>
                    )}

                    {/* Form Fields from Previous Steps */}
                    {availableFormFields.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                          Form Fields from Previous Steps
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableFormFields.map((formField, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => insertVariable(formField.variableSyntax)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-white border border-[hsl(var(--border))] text-[hsl(var(--fg))] hover:border-[hsl(var(--poly-green))] hover:bg-[hsl(var(--poly-green))]/5 transition-colors"
                              title={`Insert ${formField.variableSyntax} - from ${formField.screenTitle}`}
                            >
                              <Copy className="h-3 w-3" />
                              {formField.fieldName}
                              <span className="opacity-50">({formField.fieldType})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Context from Previous Steps */}
                    {availableContextKeys.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                          AI Context from Previous Steps
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableContextKeys.map((ctx, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => insertVariable(`{{${ctx.fullPath}}}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-white border border-[hsl(var(--border))] text-[hsl(var(--fg))] hover:border-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/5 transition-colors"
                              title={`Insert {{${ctx.fullPath}}} - from ${ctx.screenTitle}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {ctx.key}
                              <span className="opacity-50">({ctx.type})</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                          AI context values include a fallback - if unavailable, the variable name will be shown.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Smart Suggestions Section */}
            <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setAiSectionExpanded(!aiSectionExpanded)}
                className="w-full flex items-center justify-between p-3 bg-[hsl(var(--selise-blue))]/5 hover:bg-[hsl(var(--selise-blue))]/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                  <span className="font-medium text-sm text-[hsl(var(--fg))]">
                    AI Smart Suggestions
                  </span>
                  {watch("aiSuggestionEnabled") && watch("aiSuggestionKey") && (
                    <Badge variant="secondary" className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                      {watch("aiSuggestionKey")}
                    </Badge>
                  )}
                </div>
                {aiSectionExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                )}
              </button>
              
              {aiSectionExpanded && (
                <div className="p-4 space-y-4 border-t border-[hsl(var(--border))]">
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Map this field to a value from AI Enrichment context. Users can auto-fill with one click.
                  </p>
                  
                  {/* Enable Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="aiSuggestionEnabled"
                      {...register("aiSuggestionEnabled")}
                      className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                    />
                    <Label htmlFor="aiSuggestionEnabled" className="cursor-pointer text-sm">
                      Enable AI suggestion from enrichment context
                    </Label>
                  </div>

                  {/* Key Selection (only shown when enabled) */}
                  {watch("aiSuggestionEnabled") && (
                    <div className="space-y-3">
                      {/* Available Context Keys */}
                      {availableContextKeys.length > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-sm">
                            Select from Available Context Keys
                          </Label>
                          <div className="flex flex-wrap gap-2 p-3 bg-[hsl(var(--muted))]/30 rounded-lg border border-[hsl(var(--border))]">
                            {availableContextKeys.map((ctx, idx) => {
                              const isSelected = watch("aiSuggestionKey") === ctx.fullPath;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setValue("aiSuggestionKey", ctx.fullPath, { shouldDirty: true })}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    isSelected
                                      ? "bg-[hsl(var(--selise-blue))] text-white ring-2 ring-[hsl(var(--selise-blue))]/30"
                                      : "bg-white border border-[hsl(var(--border))] text-[hsl(var(--fg))] hover:border-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/5"
                                  }`}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>{ctx.key}</span>
                                  <span className={`text-[10px] ${isSelected ? "opacity-70" : "opacity-50"}`}>
                                    ({ctx.type})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-[hsl(var(--globe-grey))]">
                            These keys are from AI Output Schema of previous screens. Click to select.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-[hsl(var(--muted))]/30 rounded-lg border border-dashed border-[hsl(var(--border))]">
                          <p className="text-xs text-[hsl(var(--globe-grey))] text-center">
                            No AI context keys available. Configure AI Enrichment on previous screens first.
                          </p>
                        </div>
                      )}

                      {/* Manual Input (fallback/override) */}
                      <div className="space-y-2">
                        <Label htmlFor="aiSuggestionKey" className="text-sm text-[hsl(var(--globe-grey))]">
                          Or enter key manually
                        </Label>
                        <Input
                          id="aiSuggestionKey"
                          placeholder="e.g., suggestedEmail or currency"
                          {...register("aiSuggestionKey")}
                          className="text-sm"
                        />
                      </div>

                      {/* Selected Key Display */}
                      {watch("aiSuggestionKey") && (
                        <div className="flex items-center gap-2 p-2 bg-[hsl(var(--lime-green))]/10 rounded-md border border-[hsl(var(--lime-green))]/20">
                          <Sparkles className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                          <span className="text-sm font-medium text-[hsl(var(--poly-green))]">
                            Selected: {watch("aiSuggestionKey")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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

