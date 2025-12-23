"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2, Copy, Code, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import { SchemaBuilder } from "./schema-builder";

const promptSchema = z.object({
    aiPrompt: z.string().optional(),
    aiOutputSchema: z.string().optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface ScreenWithFields extends TemplateScreen {
    fields: TemplateField[];
}

interface ContextVariable {
    screenTitle: string;
    fieldName: string;
    fieldType: string;
    variableSyntax: string;
}

interface ScreenAIPromptProps {
    templateId: string;
    screen: ScreenWithFields;
    allScreens: TemplateScreen[];
    onSaved: () => void;
}

function computePromptEnabled(screen: ScreenWithFields): boolean {
    return Boolean(screen.aiPrompt?.trim() || screen.aiOutputSchema?.trim());
}

export function ScreenAIPrompt({
    templateId,
    screen,
    allScreens,
    onSaved,
}: ScreenAIPromptProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [aiPromptEnabled, setAiPromptEnabled] = useState(() => computePromptEnabled(screen));
    const [initialToggleState, setInitialToggleState] = useState(() => computePromptEnabled(screen));
    const [contextVariables, setContextVariables] = useState<ContextVariable[]>([]);
    const [previousFormFields, setPreviousFormFields] = useState<ContextVariable[]>([]);
    const [showPreviousFields, setShowPreviousFields] = useState(false);
    const [showPreviousContext, setShowPreviousContext] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { isDirty },
    } = useForm<PromptFormData>({
        resolver: zodResolver(promptSchema),
        defaultValues: {
            aiPrompt: screen.aiPrompt || "",
            aiOutputSchema: screen.aiOutputSchema || "",
        },
    });

    useEffect(() => {
        const nextEnabled = computePromptEnabled(screen);
        reset({
            aiPrompt: screen.aiPrompt || "",
            aiOutputSchema: screen.aiOutputSchema || "",
        });
        setAiPromptEnabled(nextEnabled);
        setInitialToggleState(nextEnabled);
    }, [screen, reset]);

    const hasToggleChanged = aiPromptEnabled !== initialToggleState;
    const isSaveDisabled = isSaving || (!isDirty && !hasToggleChanged);

    const onSubmit = async (data: PromptFormData) => {
        setIsSaving(true);
        try {
            const normalizedPrompt = data.aiPrompt?.trim() || null;
            const normalizedSchema = data.aiOutputSchema?.trim() || null;

            const payload = aiPromptEnabled
                ? {
                    aiPrompt: normalizedPrompt,
                    aiOutputSchema: normalizedSchema,
                }
                : {
                    aiPrompt: null,
                    aiOutputSchema: null,
                };

            const response = await fetch(
                `/api/admin/templates/${templateId}/screens/${screen.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to save AI prompt");
            }

            toast.success("AI prompt saved successfully");
            onSaved();
            reset({
                aiPrompt: payload.aiPrompt ?? "",
                aiOutputSchema: payload.aiOutputSchema ?? "",
            }); // Reset dirty state with new values
            setInitialToggleState(aiPromptEnabled);
        } catch (error) {
            console.error("Error saving AI prompt:", error);
            toast.error("Failed to save AI prompt");
        } finally {
            setIsSaving(false);
        }
    };

    const copyVariable = async (variableSyntax: string) => {
        try {
            await navigator.clipboard.writeText(variableSyntax);
            toast.success(`Copied ${variableSyntax} to clipboard`);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            toast.error("Failed to copy to clipboard");
        }
    };

    const insertVariable = (variableSyntax: string) => {
        if (!aiPromptEnabled) {
            toast.info("Enable the AI prompt to insert variables.");
            return;
        }

        const currentPrompt = watch("aiPrompt") || "";
        setValue("aiPrompt", currentPrompt + (currentPrompt ? " " : "") + variableSyntax, {
            shouldDirty: true,
        });
        toast.success(`Inserted ${variableSyntax}`);
    };

    const handleToggleChange = (checked: boolean) => {
        setAiPromptEnabled(checked);
    };

    // Parse context variables from previous screens (AI output schemas)
    useEffect(() => {
        const variables: ContextVariable[] = [];

        // Get previous screens (those with order < current screen's order)
        const previousScreens = allScreens
            .filter((s) => s.order < screen.order)
            .sort((a, b) => a.order - b.order);

        previousScreens.forEach((prevScreen) => {
            const schemaStr = prevScreen.aiOutputSchema;
            if (!schemaStr) return;

            try {
                const schema = JSON.parse(schemaStr);
                if (schema.type === "object" && schema.properties) {
                    // Flatten schema properties to get all fields
                    // Note: AI context is stored in enrichmentContext with keys directly at top level
                    const flattenProperties = (properties: any, prefix = ""): void => {
                        Object.entries(properties).forEach(([key, value]: [string, any]) => {
                            const fullKey = prefix ? `${prefix}.${key}` : key;
                            variables.push({
                                screenTitle: prevScreen.title,
                                fieldName: fullKey,
                                fieldType: value.type || "unknown",
                                // Use just the key name - data is stored flat, not nested under screen title
                                variableSyntax: `{{${fullKey}}}`,
                            });

                            // Recursively handle nested objects
                            if (value.type === "object" && value.properties) {
                                flattenProperties(value.properties, fullKey);
                            }
                        });
                    };

                    flattenProperties(schema.properties);
                }
            } catch (e) {
                console.error(`Failed to parse schema for screen ${prevScreen.title}`, e);
            }
        });

        setContextVariables(variables);
    }, [allScreens, screen.order]);

    // Collect form fields from previous screens
    useEffect(() => {
        const variables: ContextVariable[] = [];

        const previousScreens = allScreens
            .filter((s) => s.order < screen.order)
            .sort((a, b) => a.order - b.order);

        previousScreens.forEach((prevScreen) => {
            const screenWithFields = prevScreen as any;
            if (screenWithFields.fields && screenWithFields.fields.length > 0) {
                screenWithFields.fields.forEach((field: TemplateField) => {
                    variables.push({
                        screenTitle: prevScreen.title,
                        fieldName: field.name,
                        fieldType: field.type,
                        // Use just the field name - formData stores fields flat, not nested under screen title
                        variableSyntax: `{{${field.name}}}`,
                    });
                });
            }
        });

        setPreviousFormFields(variables);
    }, [allScreens, screen.order]);

    return (
        <Card className="border-[hsl(var(--border))]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                        <CardTitle>AI Enrichment Prompt</CardTitle>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-8 w-8 p-0"
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <CardDescription>
                    Configure the AI prompt that runs when this screen is completed
                </CardDescription>
            </CardHeader>
            {!isCollapsed && (
                <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Enable / Disable */}
                    <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
                        <div>
                            <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                                AI Enrichment
                            </p>
                            <p className="text-xs text-[hsl(var(--globe-grey))]">
                                Run the AI prompt after this screen to add extra context for later steps.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--globe-grey))]">
                                {aiPromptEnabled ? "ON" : "OFF"}
                            </span>
                            <Switch checked={aiPromptEnabled} onCheckedChange={handleToggleChange} />
                        </div>
                    </div>

                    {!aiPromptEnabled && (
                        <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                            Variables are view-only while AI Enrichment is turned off.
                        </p>
                    )}
                    {/* Dynamic Variables */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                            Available Variables
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {screen.fields.length === 0 ? (
                                <span className="text-xs text-[hsl(var(--globe-grey))] italic">
                                    No fields available in this screen
                                </span>
                            ) : (
                                screen.fields.map((field) => {
                                    const variableSyntax = `{{${field.name}}}`;
                                    return (
                                        <Badge
                                            key={field.id}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] transition-colors"
                                            onClick={() => copyVariable(variableSyntax)}
                                            title={`Click to copy ${variableSyntax}`}
                                        >
                                            <Copy className="h-3 w-3 mr-1" />
                                            {field.name}
                                        </Badge>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Form Fields from Previous Screens */}
                    {previousFormFields.length > 0 && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPreviousFields(!showPreviousFields)}
                                className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                            >
                                {showPreviousFields ? (
                                    <ChevronUp className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                                )}
                                <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider cursor-pointer">
                                    Form Fields from Previous Steps ({previousFormFields.length})
                                </Label>
                            </button>
                            {showPreviousFields && (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        {previousFormFields.map((field, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] transition-colors"
                                                onClick={() => copyVariable(field.variableSyntax)}
                                                title={`Click to copy ${field.variableSyntax}`}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                {field.screenTitle}.{field.fieldName}
                                                <span className="ml-1 text-[10px] opacity-60">({field.fieldType})</span>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                                        These are user-input fields from previous screens.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Context Variables from Previous Screens */}
                    {contextVariables.length > 0 && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPreviousContext(!showPreviousContext)}
                                className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                            >
                                {showPreviousContext ? (
                                    <ChevronUp className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                                )}
                                <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider cursor-pointer">
                                    AI Context from Previous Steps ({contextVariables.length})
                                </Label>
                            </button>
                            {showPreviousContext && (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        {contextVariables.map((ctx, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] hover:border-[hsl(var(--selise-blue))] transition-colors"
                                                onClick={() => copyVariable(ctx.variableSyntax)}
                                                title={`Click to copy ${ctx.variableSyntax}`}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                {ctx.screenTitle}.{ctx.fieldName}
                                                <span className="ml-1 text-[10px] opacity-60">({ctx.fieldType})</span>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                                        These fields are populated by AI prompts in previous screens.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <Label htmlFor="aiPrompt">Prompt</Label>
                        <textarea
                            id="aiPrompt"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            placeholder="e.g., Based on the {{companyName}} and {{address}}, estimate the trading currency and jurisdiction."
                            {...register("aiPrompt")}
                            disabled={!aiPromptEnabled}
                        />
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                            Use the variables above to dynamically insert user input into the
                            prompt.
                        </p>
                        {!aiPromptEnabled && (
                            <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                                Enable the AI Enrichment toggle to edit the prompt.
                            </p>
                        )}
                    </div>

                    {/* Output Schema */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                            <Label>Output Schema</Label>
                        </div>
                        <div className={`relative ${aiPromptEnabled ? "" : "opacity-60"}`}>
                            <SchemaBuilder
                                value={watch("aiOutputSchema") || ""}
                                onChange={(value) =>
                                    setValue("aiOutputSchema", value, { shouldDirty: true })
                                }
                            />
                            {!aiPromptEnabled && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))] bg-background/80 text-xs font-medium text-[hsl(var(--globe-grey))]">
                                    Enable AI Enrichment to edit the schema
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                            Define the expected JSON structure for the AI output using the
                            visual builder or raw JSON.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaveDisabled}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Configuration
                        </Button>
                    </div>
                </form>
                </CardContent>
            )}
        </Card>
    );
}
