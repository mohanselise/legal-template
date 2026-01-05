"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Variable,
  Languages,
  ArrowLeft,
  ArrowRight,
  Check,
  Type,
  Mail,
  Calendar,
  Hash,
  CheckSquare,
  List,
  AlignLeft,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Percent,
  Link2,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TemplateField, FieldType, TemplateScreen } from "@/lib/db";
import { ConditionEditor, type AvailableField } from "./condition-editor";
import type { ConditionGroup } from "@/lib/templates/conditions";

// Interface for available AI context keys from previous screens
export interface AvailableContextKey {
  screenTitle: string;
  key: string;
  type: string;
  fullPath: string;
}

// Interface for available form fields from previous screens
export interface AvailableFormField {
  screenTitle: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  variableSyntax: string;
}

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Must start with letter, alphanumeric only"),
  label: z.string().min(1, "Label is required"),
  type: z.enum([
    "text", "email", "date", "number", "checkbox", "select", "multiselect",
    "textarea", "phone", "address", "party", "currency", "percentage", "url"
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).default([]),
  aiSuggestionEnabled: z.boolean().default(false),
  aiSuggestionKey: z.string().optional(),
  uilmLabelKey: z.string().optional(),
  uilmPlaceholderKey: z.string().optional(),
  uilmHelpTextKey: z.string().optional(),
  uilmOptionsKeys: z.array(z.string()).default([]),
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
  currentScreen?: TemplateScreen & { fields?: TemplateField[] };
  allScreens?: (TemplateScreen & { fields?: TemplateField[] })[];
  defaultType?: FieldType;
  defaultLabel?: string;
  defaultPlaceholder?: string;
  defaultRequired?: boolean;
}

// Field type options with icons
const fieldTypeOptions: { value: FieldType; label: string; description: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  // Composite fields
  { value: "party", label: "Party", description: "Name + Address with Google Places", icon: Building2, group: "Composite" },
  { value: "address", label: "Address", description: "Full address fields", icon: MapPin, group: "Composite" },
  { value: "phone", label: "Phone", description: "With country code", icon: Phone, group: "Composite" },
  { value: "currency", label: "Currency", description: "Amount with symbol", icon: DollarSign, group: "Composite" },
  // Specialized
  { value: "percentage", label: "Percentage", description: "0-100% input", icon: Percent, group: "Specialized" },
  { value: "url", label: "URL", description: "Link with validation", icon: Link2, group: "Specialized" },
  { value: "textarea", label: "Long Text", description: "Multi-line text", icon: AlignLeft, group: "Specialized" },
  // Basic
  { value: "text", label: "Text", description: "Single-line input", icon: Type, group: "Basic" },
  { value: "email", label: "Email", description: "Email with validation", icon: Mail, group: "Basic" },
  { value: "date", label: "Date", description: "Date picker", icon: Calendar, group: "Basic" },
  { value: "number", label: "Number", description: "Numeric input", icon: Hash, group: "Basic" },
  { value: "checkbox", label: "Checkbox", description: "Yes/No toggle", icon: CheckSquare, group: "Basic" },
  { value: "select", label: "Select", description: "Dropdown options", icon: List, group: "Basic" },
  { value: "multiselect", label: "Multi-Select", description: "Multiple choices", icon: List, group: "Basic" },
];

// Wizard step definitions
type WizardStep = "basics" | "type" | "options" | "details" | "advanced" | "review";

const getSteps = (fieldType: FieldType): WizardStep[] => {
  const steps: WizardStep[] = ["basics", "type"];
  if (fieldType === "select" || fieldType === "multiselect") {
    steps.push("options");
  }
  steps.push("details", "advanced", "review");
  return steps;
};

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function FieldEditor({
  open,
  onOpenChange,
  screenId,
  field,
  onSaved,
  availableContextKeys = [],
  availableFormFields = [],
  currentScreen,
  allScreens = [],
  defaultType,
  defaultLabel,
  defaultPlaceholder,
  defaultRequired,
}: FieldEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [uilmOptionsKeys, setUilmOptionsKeys] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ConditionGroup | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const [direction, setDirection] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compute context keys from previous screens
  const computedContextKeys: AvailableContextKey[] = useMemo(() => {
    if (availableContextKeys.length > 0) return availableContextKeys;
    const keys: AvailableContextKey[] = [];
    if (!currentScreen) return keys;
    
    const previousScreens = allScreens
      .filter((s) => s.order < currentScreen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      const schemaStr = (prevScreen as any).aiOutputSchema;
      if (!schemaStr?.trim()) return;
      try {
        const schema = JSON.parse(schemaStr);
        if (schema.type === "object" && schema.properties) {
          Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
              keys.push({
                screenTitle: prevScreen.title,
              key,
                type: value.type || "unknown",
              fullPath: key,
              });
            });
        }
      } catch {}
    });
    return keys;
  }, [availableContextKeys, allScreens, currentScreen]);

  // Available fields for conditions
  const availableFieldsForConditions: AvailableField[] = useMemo(() => {
    const fields: AvailableField[] = [];
    if (!currentScreen) return fields;
    
    const currentScreenOrder = currentScreen.order;
    const currentFieldOrder = field?.order ?? (currentScreen.fields?.length ?? 0);
    
    const previousScreens = allScreens
      .filter((s) => s.order < currentScreenOrder)
      .sort((a, b) => a.order - b.order);
    
    previousScreens.forEach((prevScreen) => {
      if (prevScreen.fields) {
        prevScreen.fields.forEach((f) => {
          fields.push({
            name: f.name,
            label: f.label,
            screenTitle: prevScreen.title,
            type: f.type,
          });
        });
      }
    });
    
    if (currentScreen.fields) {
      currentScreen.fields
        .filter((f) => f.order < currentFieldOrder && f.id !== field?.id)
        .forEach((f) => {
          fields.push({
            name: f.name,
            label: f.label,
            screenTitle: currentScreen.title + " (this screen)",
            type: f.type,
          });
        });
    }
    
    return fields;
  }, [currentScreen, allScreens, field?.order, field?.id]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
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
      uilmLabelKey: "",
      uilmPlaceholderKey: "",
      uilmHelpTextKey: "",
      uilmOptionsKeys: [],
    },
  });

  const fieldType = watch("type");
  const fieldName = watch("name");
  const fieldLabel = watch("label");
  const steps = getSteps(fieldType);
  const currentStepIndex = steps.indexOf(currentStep);

  // Reset form when dialog opens
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
          aiSuggestionEnabled: (field as any).aiSuggestionEnabled ?? false,
          aiSuggestionKey: (field as any).aiSuggestionKey || "",
          uilmLabelKey: (field as any).uilmLabelKey || "",
          uilmPlaceholderKey: (field as any).uilmPlaceholderKey || "",
          uilmHelpTextKey: (field as any).uilmHelpTextKey || "",
          uilmOptionsKeys: (field as any).uilmOptionsKeys || [],
        });
        setOptions(field.options || []);
        setUilmOptionsKeys((field as any).uilmOptionsKeys || []);
        const fieldConditions = (field as any).conditions;
        if (fieldConditions) {
          try {
            setConditions(typeof fieldConditions === "string" ? JSON.parse(fieldConditions) : fieldConditions);
          } catch {
            setConditions(null);
          }
        } else {
          setConditions(null);
        }
        setShowAdvanced(
          !!(field as any).aiSuggestionEnabled ||
          !!(field as any).uilmLabelKey ||
          !!(field as any).conditions
        );
      } else {
        reset({
          name: "",
          label: defaultLabel || "",
          type: defaultType || "text",
          required: defaultRequired || false,
          placeholder: defaultPlaceholder || "",
          helpText: "",
          options: [],
          aiSuggestionEnabled: false,
          aiSuggestionKey: "",
          uilmLabelKey: "",
          uilmPlaceholderKey: "",
          uilmHelpTextKey: "",
          uilmOptionsKeys: [],
        });
        setOptions([]);
        setUilmOptionsKeys([]);
        setConditions(null);
        setShowAdvanced(false);
      }
      setCurrentStep("basics");
      setDirection(0);
      setError(null);
      setNewOption("");
    }
  }, [open, field, reset, defaultType, defaultLabel, defaultPlaceholder, defaultRequired]);

  // Navigation handlers
  const goToStep = (step: WizardStep) => {
    const targetIndex = steps.indexOf(step);
    setDirection(targetIndex > currentStepIndex ? 1 : -1);
    setCurrentStep(step);
  };

  const goNext = async () => {
    // Validate current step before proceeding
    if (currentStep === "basics") {
      const valid = await trigger(["name", "label"]);
      if (!valid) return;
    }
    if (currentStep === "options" && (fieldType === "select" || fieldType === "multiselect") && options.length === 0) {
      toast.error("Add at least one option");
      return;
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setDirection(1);
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setDirection(-1);
      setCurrentStep(steps[prevIndex]);
    }
  };

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
      const payload: Record<string, unknown> = {
        ...data,
        options: (fieldType === "select" || fieldType === "multiselect") ? options : [],
        aiSuggestionEnabled: data.aiSuggestionEnabled ?? false,
        uilmLabelKey: data.uilmLabelKey?.trim() || null,
        uilmPlaceholderKey: data.uilmPlaceholderKey?.trim() || null,
        uilmHelpTextKey: data.uilmHelpTextKey?.trim() || null,
          uilmOptionsKeys: (fieldType === "select" || fieldType === "multiselect") ? uilmOptionsKeys : [],
        conditions: conditions ? JSON.stringify(conditions) : null,
      };
      
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

      toast.success(field ? "Field updated successfully" : "Field created successfully");
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

  // Progress bar component
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
  return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              onClick={() => index < currentStepIndex && goToStep(step)}
              disabled={index > currentStepIndex}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                isActive && "bg-[hsl(var(--selise-blue))] text-white scale-110",
                isCompleted && "bg-[hsl(var(--lime-green))] text-white cursor-pointer hover:scale-105",
                !isActive && !isCompleted && "bg-[hsl(var(--muted))] text-[hsl(var(--globe-grey))]"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  index < currentStepIndex
                    ? "bg-[hsl(var(--lime-green))]"
                    : "bg-[hsl(var(--muted))]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 1: Basics
  const BasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Let's start with the basics
        </h2>
        <p className="text-[hsl(var(--globe-grey))]">
          Give your field a name and label
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-medium">
            Field Name
          </Label>
              <Input
                id="name"
                placeholder="e.g., companyName"
                {...register("name")}
            className="h-12 text-lg"
            autoFocus
              />
          <p className="text-sm text-[hsl(var(--globe-grey))]">
            Used as the key in form data. Start with a letter, alphanumeric only.
              </p>
              {errors.name && (
            <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p>
              )}
            </div>

        <div className="space-y-3">
          <Label htmlFor="label" className="text-base font-medium">
            Label
          </Label>
              <Input
                id="label"
            placeholder="e.g., Company Name"
                {...register("label")}
            className="h-12 text-lg"
              />
          <p className="text-sm text-[hsl(var(--globe-grey))]">
            What users will see when filling out the form.
          </p>
              {errors.label && (
            <p className="text-sm text-[hsl(var(--destructive))]">{errors.label.message}</p>
              )}
            </div>
      </div>
    </div>
  );

  // Step 2: Type Selection
  const TypeStep = () => {
    const groups = ["Composite", "Specialized", "Basic"];
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
            What type of field is this?
          </h2>
          <p className="text-[hsl(var(--globe-grey))]">
            Choose the best match for your data
          </p>
                  </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-3">
              <h3 className={cn(
                "text-xs font-semibold uppercase tracking-wider px-1",
                group === "Composite" && "text-[hsl(var(--selise-blue))]",
                group === "Specialized" && "text-[hsl(var(--poly-green))]",
                group === "Basic" && "text-[hsl(var(--globe-grey))]"
              )}>
                {group}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fieldTypeOptions.filter(o => o.group === group).map((option) => {
                  const Icon = option.icon;
                  const isSelected = fieldType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("type", option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                        isSelected
                          ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5 scale-105"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/50 hover:bg-[hsl(var(--muted))]/50"
                      )}
                    >
                      <Icon className={cn(
                        "h-6 w-6",
                        isSelected ? "text-[hsl(var(--selise-blue))]" : "text-[hsl(var(--globe-grey))]"
                      )} />
                      <span className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-[hsl(var(--selise-blue))]" : "text-[hsl(var(--fg))]"
                      )}>
                        {option.label}
                      </span>
                      <span className="text-xs text-[hsl(var(--globe-grey))] line-clamp-2">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
                      </div>
            </div>
                  ))}
                  </div>
                      </div>
    );
  };

  // Step 3: Options (for select/multiselect)
  const OptionsStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Add your options
        </h2>
        <p className="text-[hsl(var(--globe-grey))]">
          These will appear in the dropdown for users to select
        </p>
                  </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Type an option and press Enter..."
            className="h-12 text-lg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            onClick={addOption}
            disabled={!newOption.trim()}
            className="h-12 px-4"
          >
            <Plus className="h-5 w-5" />
          </Button>
                      </div>

        {options.length > 0 ? (
          <div className="space-y-2">
            {options.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]"
              >
                <span className="font-medium">{option}</span>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-1 hover:bg-[hsl(var(--destructive))]/10 rounded text-[hsl(var(--destructive))]"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[hsl(var(--globe-grey))]">
            <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No options added yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Details
  const DetailsStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Fine-tune the details
        </h2>
        <p className="text-[hsl(var(--globe-grey))]">
          Make it helpful for your users
        </p>
            </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Required toggle */}
        <label className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors">
              <input
                type="checkbox"
                {...register("required")}
            className="h-5 w-5 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
          />
          <div>
            <span className="font-medium text-[hsl(var(--fg))]">Required field</span>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Users must fill this out to proceed
            </p>
            </div>
        </label>

        {/* Placeholder */}
            {fieldType !== "checkbox" && (
          <div className="space-y-3">
            <Label htmlFor="placeholder" className="text-base font-medium">
              Placeholder text
            </Label>
                <Input
                  id="placeholder"
              placeholder="e.g., Enter your company name..."
                  {...register("placeholder")}
              className="h-12"
                />
              </div>
            )}

        {/* Help text */}
        <div className="space-y-3">
          <Label htmlFor="helpText" className="text-base font-medium">
            Help text
          </Label>
              <Input
                id="helpText"
            placeholder="e.g., This should match your official registration"
                {...register("helpText")}
            className="h-12"
          />
          <p className="text-sm text-[hsl(var(--globe-grey))]">
            Additional context shown below the field
          </p>
                      </div>
                        </div>
                      </div>
  );

  // Step 5: Advanced
  const AdvancedStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Advanced options
        </h2>
        <p className="text-[hsl(var(--globe-grey))]">
          Optional features for power users
                        </p>
                      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {/* AI Smart Suggestions */}
        <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button
                type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 bg-[hsl(var(--selise-blue))]/5 hover:bg-[hsl(var(--selise-blue))]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
              <span className="font-medium">AI Smart Suggestions</span>
                </div>
            {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
          {showAdvanced && (
                <div className="p-4 space-y-4 border-t border-[hsl(var(--border))]">
              <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("aiSuggestionEnabled")}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Enable AI suggestion from enrichment context</span>
              </label>
              
              {watch("aiSuggestionEnabled") && computedContextKeys.length > 0 && (
                        <div className="space-y-2">
                  <Label className="text-sm">Select context key</Label>
                  <div className="flex flex-wrap gap-2">
                    {computedContextKeys.map((ctx, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                        onClick={() => setValue("aiSuggestionKey", ctx.fullPath)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg border transition-all",
                          watch("aiSuggestionKey") === ctx.fullPath
                            ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                            : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]"
                        )}
                      >
                        {ctx.key}
                                </button>
                    ))}
                          </div>
                    </div>
                  )}
                </div>
              )}
            </div>

        {/* UILM Translations */}
        <div className="border border-[hsl(var(--poly-green))]/30 rounded-xl overflow-hidden">
          <div className="p-4 bg-[hsl(var(--poly-green))]/5">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-[hsl(var(--poly-green))]" />
              <span className="font-medium">Translations (UILM)</span>
                </div>
          </div>
          <div className="p-4 space-y-3 border-t border-[hsl(var(--poly-green))]/20">
            <div className="grid gap-3">
              <div>
                <Label className="text-sm">Label Key</Label>
                      <Input
                        placeholder="e.g., FIELD_COMPANY_NAME_LABEL"
                        {...register("uilmLabelKey")}
                        className="font-mono text-sm"
                      />
                    </div>
                    {fieldType !== "checkbox" && (
                <div>
                  <Label className="text-sm">Placeholder Key</Label>
                        <Input
                          placeholder="e.g., FIELD_COMPANY_NAME_PLACEHOLDER"
                          {...register("uilmPlaceholderKey")}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    </div>
                            </div>
            </div>

            {/* Conditional Visibility */}
            <ConditionEditor
              value={conditions}
              onChange={setConditions}
              availableFields={availableFieldsForConditions}
              label="Conditional Visibility"
          description="Show this field only when specific conditions are met"
        />
      </div>
    </div>
  );

  // Step 6: Review
  const ReviewStep = () => {
    const typeOption = fieldTypeOptions.find(o => o.value === fieldType);
    const TypeIcon = typeOption?.icon || Type;
    
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
            Review your field
          </h2>
          <p className="text-[hsl(var(--globe-grey))]">
            Everything look good?
          </p>
                </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border-2 border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/5 p-6 space-y-4">
            {/* Type badge */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
                <TypeIcon className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
              </div>
              <div>
                <Badge variant="secondary" className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                  {typeOption?.label || fieldType}
                      </Badge>
                {watch("required") && (
                  <Badge variant="outline" className="ml-2 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/50">
                    Required
                  </Badge>
                )}
              </div>
            </div>

            {/* Field details */}
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-[hsl(var(--globe-grey))]">Name</span>
                <span className="font-mono text-sm font-medium">{fieldName || "—"}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-[hsl(var(--globe-grey))]">Label</span>
                <span className="font-medium">{fieldLabel || "—"}</span>
              </div>
              {watch("placeholder") && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[hsl(var(--globe-grey))]">Placeholder</span>
                  <span className="text-sm italic text-[hsl(var(--globe-grey))]">{watch("placeholder")}</span>
                  </div>
                )}
              {(fieldType === "select" || fieldType === "multiselect") && options.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[hsl(var(--globe-grey))]">Options</span>
                  <span className="text-sm">{options.length} options</span>
                </div>
              )}
              {watch("aiSuggestionEnabled") && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[hsl(var(--globe-grey))]">AI Suggestion</span>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {watch("aiSuggestionKey") || "Enabled"}
                  </Badge>
              </div>
            )}
            </div>
          </div>
        </div>

            {error && (
          <div className="max-w-md mx-auto p-4 rounded-lg bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] text-sm">
                {error}
              </div>
            )}
          </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basics":
        return <BasicsStep />;
      case "type":
        return <TypeStep />;
      case "options":
        return <OptionsStep />;
      case "details":
        return <DetailsStep />;
      case "advanced":
        return <AdvancedStep />;
      case "review":
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">
                {field ? "Edit Field" : "Add Field"}
              </h3>
              <button
              type="button"
              onClick={() => onOpenChange(false)}
                className="p-1 rounded hover:bg-[hsl(var(--muted))]"
              >
                <X className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
              </button>
            </div>
            <ProgressBar />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={currentStepIndex === 0 ? () => onOpenChange(false) : goBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStepIndex === 0 ? "Cancel" : "Back"}
            </Button>

              {currentStep === "review" ? (
            <Button
              type="submit"
                  disabled={saving}
                  className="gap-2 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
              {field ? "Save Changes" : "Create Field"}
            </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className="gap-2 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
