"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Settings,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  commonPromptInstructions: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DEFAULT_COMMON_PROMPT_INSTRUCTIONS = `## OUTPUT FORMAT

Return a JSON object matching this EXACT structure:

{
  "metadata": {
    "title": "Non Discloser Agreement",
    "effectiveDate": "YYYY-MM-DD",
    "documentType": "nda",
    "jurisdiction": "State/Country",
    "generatedAt": "ISO 8601 timestamp"
  },
  "content": [
    {
      "type": "article",
      "props": { "title": "ARTICLE TITLE", "number": "1" },
      "children": [
        {
          "type": "section",
          "props": { "title": "Optional Section Title", "number": "1.1" },
          "children": [
            {
              "type": "paragraph",
              "text": "Content here..."
            }
          ]
        }
      ]
    }
  ]
}

## BLOCK STRUCTURE REQUIREMENTS

Strictly follow this hierarchy:

- **Article** (type: "article"): Top-level container
  - props: { "title": string, "number": string }
  - children: Array of Section blocks
  
- **Section** (type: "section"): Second-level container
  - props: { "title": string | null, "number": string }
  - children: Array of content blocks
  
- **Content blocks**: paragraph, list, list_item, definition, definition_item
  - paragraph: { "type": "paragraph", "text": string }
  - list: { "type": "list", "props": { "ordered": boolean }, "children": [list_item] }
  - list_item: { "type": "list_item", "text": string }
  - definition: { "type": "definition", "children": [definition_item] }
  - definition_item: { "type": "definition_item", "props": { "term": string }, "text": string }

## CONTENT EXCLUSIONS

Do NOT include signature blocks, "In Witness Whereof" clauses, or any signature-related content in the content array. The signature page is generated separately in the PDF template.

## REGIONAL FORMATTING

Apply formatting conventions appropriate for the jurisdiction specified in the user prompt (dates, currency, addresses, numbers).

## DATA REQUIREMENTS

- Use EXACT names and details provided in the user prompt - never use placeholders or dummy data`;

export default function SettingsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commonPromptInstructions: "",
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        
        form.reset({
          commonPromptInstructions: data.commonPromptInstructions || DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
        // Use default if fetch fails
        form.reset({
          commonPromptInstructions: DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    form.reset({
      commonPromptInstructions: DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
    });
    toast.info("Reset to default values");
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--fg))]">
                System Settings
              </h1>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                Configure system-wide settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Common Prompt Instructions</CardTitle>
                <CardDescription>
                  These instructions will be automatically appended to all template system prompts.
                  Define the output format, block structure requirements, and other common guidelines here.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commonPromptInstructions">
                Common Instructions
              </Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                These instructions are automatically combined with each template&apos;s role and prompt.
              </p>
              <textarea
                id="commonPromptInstructions"
                placeholder="Enter common prompt instructions..."
                className="flex min-h-96 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("commonPromptInstructions")}
              />
              {form.watch("commonPromptInstructions") && (
                <div className="flex justify-between items-center text-xs text-[hsl(var(--globe-grey))]">
                  <span>
                    {form.watch("commonPromptInstructions")?.length.toLocaleString()} characters
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <Link href={`/${locale}/admin`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

