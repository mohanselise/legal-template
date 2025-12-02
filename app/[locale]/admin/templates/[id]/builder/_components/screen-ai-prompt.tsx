"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { TemplateScreen } from "@/lib/db";

const promptSchema = z.object({
    aiPrompt: z.string().optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface ScreenAIPromptProps {
    templateId: string;
    screen: TemplateScreen;
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
        formState: { isDirty },
    } = useForm<PromptFormData>({
        resolver: zodResolver(promptSchema),
        defaultValues: {
            aiPrompt: (screen as any).aiPrompt || "",
        },
    });

    useEffect(() => {
        reset({
            aiPrompt: (screen as any).aiPrompt || "",
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="aiPrompt" className="sr-only">
                            AI Prompt
                        </Label>
                        <textarea
                            id="aiPrompt"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., Based on the company name and address, estimate the trading currency and jurisdiction."
                            {...register("aiPrompt")}
                        />
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                            This prompt will run when the user completes this step. The result
                            will be stored as context for future steps.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || !isDirty}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Prompt
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
