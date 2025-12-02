"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2, Copy, Code } from "lucide-react";
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

interface ScreenAIPromptProps {
    templateId: string;
    screen: ScreenWithFields;
    onSaved: () => void;
}

export function ScreenAIPrompt({
    templateId,
    screen,
    onSaved,
}: ScreenAIPromptProps) {
    const [isSaving, setIsSaving] = useState(false);

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
            aiPrompt: (screen as any).aiPrompt || "",
            aiOutputSchema: (screen as any).aiOutputSchema || "",
        },
    });

    useEffect(() => {
        reset({
            aiPrompt: (screen as any).aiPrompt || "",
            aiOutputSchema: (screen as any).aiOutputSchema || "",
        });
    }, [screen, reset]);

    const onSubmit = async (data: PromptFormData) => {
        setIsSaving(true);
        try {
            const response = await fetch(
                `/api/admin/templates/${templateId}/screens/${screen.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to save AI prompt");
            }

            toast.success("AI prompt saved successfully");
            onSaved();
            reset(data); // Reset dirty state with new values
        } catch (error) {
            console.error("Error saving AI prompt:", error);
            toast.error("Failed to save AI prompt");
        } finally {
            setIsSaving(false);
        }
    };

    const insertVariable = (fieldName: string) => {
        const currentPrompt = watch("aiPrompt") || "";
        const variable = `{{${fieldName}}}`;
        setValue("aiPrompt", currentPrompt + (currentPrompt ? " " : "") + variable, {
            shouldDirty: true,
        });
        toast.success(`Inserted ${variable}`);
    };

    return (
        <Card className="border-[hsl(var(--border))]">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <CardTitle>AI Enrichment Prompt</CardTitle>
                </div>
                <CardDescription>
                    Configure the AI prompt that runs when this screen is completed
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                screen.fields.map((field) => (
                                    <Badge
                                        key={field.id}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] transition-colors"
                                        onClick={() => insertVariable(field.name)}
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        {field.name}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <Label htmlFor="aiPrompt">Prompt</Label>
                        <textarea
                            id="aiPrompt"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            placeholder="e.g., Based on the {{companyName}} and {{address}}, estimate the trading currency and jurisdiction."
                            {...register("aiPrompt")}
                        />
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                            Use the variables above to dynamically insert user input into the
                            prompt.
                        </p>
                    </div>

                    {/* Output Schema */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                            <Label>Output Schema</Label>
                        </div>
                        <SchemaBuilder
                            value={watch("aiOutputSchema") || ""}
                            onChange={(value) =>
                                setValue("aiOutputSchema", value, { shouldDirty: true })
                            }
                        />
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                            Define the expected JSON structure for the AI output using the
                            visual builder or raw JSON.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || !isDirty}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Configuration
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
