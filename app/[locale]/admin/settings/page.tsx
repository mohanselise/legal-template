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
  Wand2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Available AI models
const AI_MODEL_OPTIONS = [
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "meta-llama/llama-4-scout:nitro", label: "Llama 4 Scout" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
] as const;

const DEFAULT_DYNAMIC_AI_MODEL = "meta-llama/llama-4-scout:nitro";
const DEFAULT_DOCUMENT_GENERATION_MODEL = "anthropic/claude-3.5-sonnet";

const settingsSchema = z.object({
  // Document generation settings
  documentGenerationAiModel: z.string().optional(),
  commonPromptInstructions: z.string().optional(),
  // Dynamic form AI settings
  dynamicFormAiModel: z.string().optional(),
  dynamicFormSystemPrompt: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT = `You are an AI assistant helping to create dynamic form fields for a legal document generator.

Your task is to generate relevant form questions based on the user's context and requirements.

## RULES

1. Generate between 1 and the specified maximum number of fields
2. Each field must have a unique "name" (camelCase, no spaces or special characters)
3. ONLY use these field types: text, email, date, number, checkbox, select
4. For "select" type fields, you MUST include an "options" array with string values
5. Make fields contextually relevant to the legal document being created
6. Include helpful "helpText" that explains why this information is needed (legal context)
7. **ALL fields should be OPTIONAL (required: false)** - users can skip this screen entirely
8. Generate fields that would gather information not already provided in the context
9. Choose the most appropriate field type for each question
10. **IMPORTANT**: For each field, provide a "standardValue" - this is the jurisdiction-specific standard/default answer that would typically be used in professional agreements for the detected jurisdiction

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "fields": [
    {
      "name": "fieldNameInCamelCase",
      "label": "Human Readable Label",
      "type": "text|email|date|number|checkbox|select",
      "required": false,
      "placeholder": "Optional placeholder text (not for checkbox)",
      "helpText": "Explanation of why this is needed in legal context",
      "options": ["only", "for", "select", "type"],
      "standardValue": "The jurisdiction-specific standard/default value for this field"
    }
  ],
  "reasoning": "Brief explanation of why these fields were chosen based on the jurisdiction/context",
  "jurisdictionName": "Short name of the detected jurisdiction (e.g., 'Swiss', 'US', 'UK', 'EU')"
}`;

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
      documentGenerationAiModel: DEFAULT_DOCUMENT_GENERATION_MODEL,
      commonPromptInstructions: "",
      dynamicFormAiModel: DEFAULT_DYNAMIC_AI_MODEL,
      dynamicFormSystemPrompt: "",
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
          documentGenerationAiModel: data.documentGenerationAiModel || DEFAULT_DOCUMENT_GENERATION_MODEL,
          commonPromptInstructions: data.commonPromptInstructions || DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
          dynamicFormAiModel: data.dynamicFormAiModel || DEFAULT_DYNAMIC_AI_MODEL,
          dynamicFormSystemPrompt: data.dynamicFormSystemPrompt || DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
        // Use default if fetch fails
        form.reset({
          documentGenerationAiModel: DEFAULT_DOCUMENT_GENERATION_MODEL,
          commonPromptInstructions: DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
          dynamicFormAiModel: DEFAULT_DYNAMIC_AI_MODEL,
          dynamicFormSystemPrompt: DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT,
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

  const handleResetDocumentGeneration = () => {
    form.setValue("documentGenerationAiModel", DEFAULT_DOCUMENT_GENERATION_MODEL);
    form.setValue("commonPromptInstructions", DEFAULT_COMMON_PROMPT_INSTRUCTIONS);
    toast.info("Reset document generation settings to default");
  };

  const handleResetDynamicForm = () => {
    form.setValue("dynamicFormAiModel", DEFAULT_DYNAMIC_AI_MODEL);
    form.setValue("dynamicFormSystemPrompt", DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT);
    toast.info("Reset dynamic form settings to default");
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
                onClick={handleResetDocumentGeneration}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="documentGenerationAiModel">AI Model</Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Select the AI model used for generating legal documents.
              </p>
              <Select
                value={form.watch("documentGenerationAiModel") || DEFAULT_DOCUMENT_GENERATION_MODEL}
                onValueChange={(value) => form.setValue("documentGenerationAiModel", value)}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Common Instructions */}
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

        {/* Dynamic Form AI Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wand2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                <div>
                  <CardTitle>Dynamic Form AI Settings</CardTitle>
                  <CardDescription>
                    Configure the AI model and system prompt used for generating dynamic form fields.
                    These settings apply to all Dynamic AI Screens in your templates.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDynamicForm}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="dynamicFormAiModel">AI Model</Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Select the AI model to use for generating dynamic form fields.
              </p>
              <Select
                value={form.watch("dynamicFormAiModel") || DEFAULT_DYNAMIC_AI_MODEL}
                onValueChange={(value) => form.setValue("dynamicFormAiModel", value)}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="dynamicFormSystemPrompt">
                System Prompt
              </Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                This system prompt controls how the AI generates form fields for Dynamic AI Screens.
                It defines the rules, output format, and behavior for field generation.
              </p>
              <textarea
                id="dynamicFormSystemPrompt"
                placeholder="Enter system prompt for dynamic form field generation..."
                className="flex min-h-80 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("dynamicFormSystemPrompt")}
              />
              {form.watch("dynamicFormSystemPrompt") && (
                <div className="flex justify-between items-center text-xs text-[hsl(var(--globe-grey))]">
                  <span>
                    {form.watch("dynamicFormSystemPrompt")?.length.toLocaleString()} characters
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

