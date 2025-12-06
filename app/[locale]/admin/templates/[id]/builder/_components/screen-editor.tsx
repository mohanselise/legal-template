"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, Wand2, ChevronDown, ChevronUp, Info, Languages, Zap } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateScreen } from "@/lib/db";
import { ConditionEditor, type AvailableField } from "./condition-editor";
import type { ConditionGroup } from "@/lib/templates/conditions";

const screenSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["standard", "signatory", "dynamic"]).default("standard"),
  // Dynamic screen configuration
  dynamicPrompt: z.string().optional(),
  dynamicMaxFields: z.number().int().min(1).max(20).optional().default(5),
  // UILM Translation Keys
  uilmTitleKey: z.string().optional(),
  uilmDescriptionKey: z.string().optional(),
  // Apply Standards feature
  enableApplyStandards: z.boolean().optional().default(false),
});

type ScreenFormData = z.infer<typeof screenSchema>;

// Interface for available variables from previous screens
interface AvailableVariable {
  name: string;
  screenTitle: string;
  source: "field" | "enrichment";
}

interface ScreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  screen: TemplateScreen | null;
  allScreens?: TemplateScreen[]; // All screens to compute available variables
  onSaved: () => void;
}

export function ScreenEditor({
  open,
  onOpenChange,
  templateId,
  screen,
  allScreens = [],
  onSaved,
}: ScreenEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicConfigExpanded, setDynamicConfigExpanded] = useState(false);
  const [uilmConfigExpanded, setUilmConfigExpanded] = useState(false);
  const [conditions, setConditions] = useState<ConditionGroup | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScreenFormData>({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "standard",
      dynamicPrompt: "",
      dynamicMaxFields: 5,
      uilmTitleKey: "",
      uilmDescriptionKey: "",
      enableApplyStandards: false,
    },
  });

  const screenType = watch("type");

  // Compute available variables from previous screens
  const availableVariables = useMemo(() => {
    const variables: AvailableVariable[] = [];
    
    // Get the order of current screen (or last position if new screen)
    const currentOrder = screen?.order ?? allScreens.length;
    
    // Get previous screens
    const previousScreens = allScreens
      .filter((s) => s.order < currentOrder)
      .sort((a, b) => a.order - b.order);
    
    previousScreens.forEach((prevScreen) => {
      // Add field variables
      if ((prevScreen as any).fields) {
        ((prevScreen as any).fields as any[]).forEach((field) => {
          variables.push({
            name: field.name,
            screenTitle: prevScreen.title,
            source: "field",
          });
        });
      }
      
      // Add enrichment context variables from AI output schema
      if (prevScreen.aiOutputSchema) {
        try {
          const schema = JSON.parse(prevScreen.aiOutputSchema);
          if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
              variables.push({
                name: key,
                screenTitle: prevScreen.title,
                source: "enrichment",
              });
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
    
    return variables;
  }, [allScreens, screen?.order]);

  // Compute available fields for condition editor (from previous screens)
  const availableFieldsForConditions: AvailableField[] = useMemo(() => {
    const fields: AvailableField[] = [];
    
    // Get the order of current screen (or last position if new screen)
    const currentOrder = screen?.order ?? allScreens.length;
    
    // Get previous screens
    const previousScreens = allScreens
      .filter((s) => s.order < currentOrder)
      .sort((a, b) => a.order - b.order);
    
    previousScreens.forEach((prevScreen) => {
      // Add fields from each previous screen
      if ((prevScreen as any).fields) {
        ((prevScreen as any).fields as any[]).forEach((field) => {
          fields.push({
            name: field.name,
            label: field.label,
            screenTitle: prevScreen.title,
            type: field.type,
          });
        });
      }
    });
    
    return fields;
  }, [allScreens, screen?.order]);

  // Reset form when dialog opens/closes or screen changes
  useEffect(() => {
    if (open) {
      reset({
        title: screen?.title || "",
        description: screen?.description || "",
        type: ((screen as any)?.type as "standard" | "signatory" | "dynamic") || "standard",
        dynamicPrompt: (screen as any)?.dynamicPrompt || "",
        dynamicMaxFields: (screen as any)?.dynamicMaxFields ?? 5,
        uilmTitleKey: (screen as any)?.uilmTitleKey || "",
        uilmDescriptionKey: (screen as any)?.uilmDescriptionKey || "",
        enableApplyStandards: (screen as any)?.enableApplyStandards ?? false,
      });
      setError(null);
      // Expand dynamic config section if it's a dynamic screen
      setDynamicConfigExpanded((screen as any)?.type === "dynamic");
      // Expand UILM config if any key exists
      setUilmConfigExpanded(!!(screen as any)?.uilmTitleKey || !!(screen as any)?.uilmDescriptionKey);
      // Load conditions from screen
      const screenConditions = (screen as any)?.conditions;
      if (screenConditions) {
        try {
          setConditions(typeof screenConditions === "string" ? JSON.parse(screenConditions) : screenConditions);
        } catch {
          setConditions(null);
        }
      } else {
        setConditions(null);
      }
    }
  }, [open, screen, reset]);

  // Insert variable into dynamic prompt at cursor position
  const insertVariable = (varName: string) => {
    const currentPrompt = watch("dynamicPrompt") || "";
    setValue("dynamicPrompt", currentPrompt + `{{${varName}}}`, { shouldDirty: true });
  };

  const onSubmit = async (data: ScreenFormData) => {
    setSaving(true);
    setError(null);

    try {
      const url = screen
        ? `/api/admin/templates/${templateId}/screens/${screen.id}`
        : `/api/admin/templates/${templateId}/screens`;

      // Prepare payload with dynamic fields
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        type: data.type,
        // UILM Translation Keys
        uilmTitleKey: data.uilmTitleKey?.trim() || null,
        uilmDescriptionKey: data.uilmDescriptionKey?.trim() || null,
        // Apply Standards feature
        enableApplyStandards: data.enableApplyStandards ?? false,
        // Conditional visibility
        conditions: conditions ? JSON.stringify(conditions) : null,
      };

      // Include dynamic screen configuration if type is dynamic
      if (data.type === "dynamic") {
        payload.dynamicPrompt = data.dynamicPrompt || null;
        payload.dynamicMaxFields = data.dynamicMaxFields ?? 5;
      } else {
        // Clear dynamic fields for non-dynamic screens
        payload.dynamicPrompt = null;
        payload.dynamicMaxFields = null;
      }

      const response = await fetch(url, {
        method: screen ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save screen");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save screen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {screen ? "Edit Screen" : "Add Screen"}
            </DialogTitle>
            <DialogDescription>
              {screen
                ? "Update the screen title and description."
                : "Create a new screen for the form wizard."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Company Information"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional helper text for this step"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Screen Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => {
                  setValue("type", value as "standard" | "signatory" | "dynamic");
                  if (value === "dynamic") {
                    setDynamicConfigExpanded(true);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select screen type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="signatory">Signatory Information</SelectItem>
                  <SelectItem value="dynamic">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                      <span>Dynamic AI Screen</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                {screenType === "signatory"
                  ? "Special screen for collecting signatory information (name, email, title, etc.)"
                  : screenType === "dynamic"
                  ? "AI-generated form fields based on context from previous steps"
                  : "Regular form screen with custom fields"}
              </p>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* UILM Translations Configuration */}
            <div className="border border-[hsl(var(--poly-green))]/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setUilmConfigExpanded(!uilmConfigExpanded)}
                className="w-full flex items-center justify-between p-3 bg-[hsl(var(--poly-green))]/5 hover:bg-[hsl(var(--poly-green))]/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                  <span className="font-medium text-sm text-[hsl(var(--fg))]">
                    Translations (UILM)
                  </span>
                  {(watch("uilmTitleKey") || watch("uilmDescriptionKey")) && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-[hsl(var(--poly-green))]/10 text-[hsl(var(--poly-green))]"
                    >
                      Configured
                    </Badge>
                  )}
                </div>
                {uilmConfigExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                )}
              </button>

              {uilmConfigExpanded && (
                <div className="p-4 space-y-4 border-t border-[hsl(var(--poly-green))]/20">
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Map screen content to UILM keys for multi-language support. Keys should be created in SELISE Blocks first.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="uilmTitleKey" className="text-sm">Title Key</Label>
                      <Input
                        id="uilmTitleKey"
                        placeholder="e.g., COMPANY_INFO_TITLE"
                        {...register("uilmTitleKey")}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="uilmDescriptionKey" className="text-sm">Description Key</Label>
                      <Input
                        id="uilmDescriptionKey"
                        placeholder="e.g., COMPANY_INFO_DESCRIPTION"
                        {...register("uilmDescriptionKey")}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-[hsl(var(--globe-grey))] p-2 bg-[hsl(var(--muted))]/30 rounded-md">
                    Module: templates (ID: 03e5475d-506d-4ad1-8d07-23fa768a7925)
                  </div>
                </div>
              )}
            </div>

            {/* Apply Standards Configuration */}
            <div className="flex items-start gap-3 p-4 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]/30 transition-colors">
              <input
                type="checkbox"
                id="enableApplyStandards"
                {...register("enableApplyStandards")}
                className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="enableApplyStandards" className="font-medium cursor-pointer">
                    Enable &quot;Apply Standards&quot; Button
                  </Label>
                  {watch("enableApplyStandards") && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-amber-100 text-amber-700"
                    >
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                  Show a button that auto-fills fields with AI suggestions from enrichment context. 
                  Fields must have &quot;AI Suggestion&quot; enabled and configured to be auto-filled.
                </p>
              </div>
            </div>

            {/* Conditional Visibility */}
            <ConditionEditor
              value={conditions}
              onChange={setConditions}
              availableFields={availableFieldsForConditions}
              label="Conditional Visibility"
              description="Show this screen only when specific conditions are met based on previous form responses."
            />

            {/* Dynamic Screen Configuration */}
            {screenType === "dynamic" && (
              <div className="border border-[hsl(var(--selise-blue))]/30 rounded-lg overflow-hidden bg-[hsl(var(--selise-blue))]/5">
                <button
                  type="button"
                  onClick={() => setDynamicConfigExpanded(!dynamicConfigExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--selise-blue))]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                    <span className="font-medium text-sm text-[hsl(var(--fg))]">
                      Dynamic Screen Configuration
                    </span>
                    {watch("dynamicPrompt") && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-[hsl(var(--selise-blue))]/20 text-[hsl(var(--selise-blue))]"
                      >
                        Configured
                      </Badge>
                    )}
                  </div>
                  {dynamicConfigExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                  )}
                </button>

                {dynamicConfigExpanded && (
                  <div className="p-4 space-y-4 border-t border-[hsl(var(--selise-blue))]/20">
                    {/* Info Box */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--selise-blue))]/10">
                      <Info className="h-4 w-4 text-[hsl(var(--selise-blue))] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[hsl(var(--fg))]">
                        This screen will generate form fields dynamically using AI based on your prompt. 
                        Use <code className="px-1 py-0.5 bg-[hsl(var(--bg))] rounded text-[hsl(var(--selise-blue))]">{"{{variableName}}"}</code> to 
                        reference values from previous steps.
                      </p>
                    </div>

                    {/* AI Prompt */}
                    <div className="space-y-2">
                      <Label htmlFor="dynamicPrompt" className="text-sm font-medium">
                        AI Prompt for Field Generation *
                      </Label>
                      <textarea
                        id="dynamicPrompt"
                        {...register("dynamicPrompt")}
                        placeholder="e.g., Based on {{jurisdiction}}, what additional questions should we ask for drafting an NDA for {{purpose}}?"
                        className="w-full min-h-[100px] p-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[hsl(var(--selise-blue))] focus:border-transparent"
                      />
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        The AI will generate relevant form fields based on this prompt and context from previous steps.
                      </p>
                    </div>

                    {/* Max Fields */}
                    <div className="space-y-2">
                      <Label htmlFor="dynamicMaxFields" className="text-sm font-medium">
                        Maximum Fields to Generate
                      </Label>
                      <Input
                        id="dynamicMaxFields"
                        type="number"
                        min={1}
                        max={20}
                        {...register("dynamicMaxFields", { valueAsNumber: true })}
                        className="w-32"
                      />
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        Limit the number of fields the AI can generate (1-20).
                      </p>
                    </div>

                    {/* Note about AI settings location */}
                    <div className="rounded-lg border border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/5 p-3">
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        <span className="font-medium text-[hsl(var(--fg))]">AI Model & System Prompt:</span>{" "}
                        Configure the AI model and system prompt in{" "}
                        <a href="/en/admin/settings" className="text-[hsl(var(--selise-blue))] underline hover:no-underline">
                          System Settings
                        </a>
                        . These settings apply to all Dynamic AI Screens.
                      </p>
                    </div>

                    {/* Available Variables */}
                    {availableVariables.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                          Available Variables from Previous Steps
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableVariables.map((v, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] hover:border-[hsl(var(--selise-blue))] transition-colors"
                              onClick={() => insertVariable(v.name)}
                            >
                              {v.source === "enrichment" ? (
                                <Sparkles className="h-3 w-3 mr-1 text-[hsl(var(--selise-blue))]" />
                              ) : null}
                              {v.name}
                              <span className="ml-1 text-[10px] opacity-50">
                                ({v.screenTitle})
                              </span>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                          Click a variable to insert it into your prompt.
                        </p>
                      </div>
                    )}
                  </div>
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
              disabled={saving}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {screen ? "Save Changes" : "Create Screen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

