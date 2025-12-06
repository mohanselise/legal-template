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
  Globe,
  MessageSquare,
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
import { ModelSelector } from "@/components/admin/model-selector";

const DEFAULT_DYNAMIC_AI_MODEL = "meta-llama/llama-4-scout:nitro";
const DEFAULT_DOCUMENT_GENERATION_MODEL = "anthropic/claude-3.5-sonnet";
const DEFAULT_FORM_ENRICHMENT_MODEL = "meta-llama/llama-4-scout:nitro";
const DEFAULT_TEMPLATE_CONFIGURATOR_MODEL = "anthropic/claude-sonnet-4";

const settingsSchema = z.object({
  // Document generation settings
  documentGenerationAiModel: z.string().optional(),
  commonPromptInstructions: z.string().optional(),
  documentGenerationOutputInUserLocale: z.boolean().default(false),
  // Dynamic form AI settings
  dynamicFormAiModel: z.string().optional(),
  dynamicFormSystemPrompt: z.string().optional(),
  dynamicFormOutputInUserLocale: z.boolean().default(false),
  // Form enrichment AI settings
  formEnrichmentAiModel: z.string().optional(),
  formEnrichmentOutputInUserLocale: z.boolean().default(false),
  // Template AI Configurator settings
  templateConfiguratorAiModel: z.string().optional(),
  templateConfiguratorBusinessLogic: z.string().optional(),
});

const DEFAULT_TEMPLATE_CONFIGURATOR_BUSINESS_LOGIC = `You are helping build REUSABLE legal document templates for a Swiss-based legal platform.

## PRIORITY: FRICTIONLESS USER EXPERIENCE

1. Minimize manual input for end users
2. Maximize "Apply Standards" one-click auto-fill
3. Strategic screen ordering: collect data first, auto-fill later
4. Maintain legal quality - don't skip essential fields

## CONVERSATION APPROACH

**Discovery First, Then Full Proposal:**
1. Ask 2-3 questions to understand complete template needs
2. Explore: document type, parties, key sections, jurisdiction
3. Then propose ALL screens at once with optimal flow
4. Explain the frictionless user experience in your proposal

## STRATEGIC SCREEN FLOW PATTERN

**Screen 1-2: Data Collection + AI Enrichment**
- Collect essential seed data (company, address, role)
- Run aiEnrichment to infer: jurisdiction, currency, industry, standards
- User must fill these manually

**Screen 3+: One-Click Auto-Fill (enableApplyStandards: true)**
- Enable "Apply Standards" button
- Fields use aiSuggestionKey to pull from enrichment
- User clicks once to fill multiple fields
- Can review and adjust

**Last Screen: Signatories**

## EXAMPLE FLOWS WITH APPLY STANDARDS

**Employment Agreement:**
1. Employer Info (aiEnrichment → jurisdiction, currency, salaryRange)
2. Employee Info (user fills while AI runs)
3. Position Details (enableApplyStandards: true)
4. Compensation (enableApplyStandards: true) ← one click fills salary, currency, benefits
5. Working Conditions (enableApplyStandards: true)
6. Confidentiality (minimal AI needed)
7. Signatories

**NDA:**
1. Disclosing Party (aiEnrichment → jurisdiction, industry)
2. Receiving Party (user fills)
3. Confidential Info (enableApplyStandards: true)
4. Terms & Obligations (enableApplyStandards: true)
5. Signatories

## ENRICHMENT OUTPUT RECOMMENDATIONS

From company info, generate:
- jurisdiction, tradingCurrency, industrySector, companySize

From role/position info, generate:
- marketSalaryRange, standardBenefits, typicalProbation, seniorityLevel

## APPLY STANDARDS CHECKLIST

For screens with enableApplyStandards: true:
- ✓ Most fields have aiSuggestionEnabled: true
- ✓ Each has aiSuggestionKey matching enrichment output
- ✓ Appears AFTER enrichment screens (screen 3+)

## Platform Context
- Swiss law defaults
- Multi-jurisdiction support  
- UILM translation keys available`;

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
      documentGenerationOutputInUserLocale: false,
      dynamicFormAiModel: DEFAULT_DYNAMIC_AI_MODEL,
      dynamicFormSystemPrompt: "",
      dynamicFormOutputInUserLocale: false,
      formEnrichmentAiModel: DEFAULT_FORM_ENRICHMENT_MODEL,
      formEnrichmentOutputInUserLocale: false,
      templateConfiguratorAiModel: DEFAULT_TEMPLATE_CONFIGURATOR_MODEL,
      templateConfiguratorBusinessLogic: "",
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
          documentGenerationOutputInUserLocale: data.documentGenerationOutputInUserLocale ?? false,
          dynamicFormAiModel: data.dynamicFormAiModel || DEFAULT_DYNAMIC_AI_MODEL,
          dynamicFormSystemPrompt: data.dynamicFormSystemPrompt || DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT,
          dynamicFormOutputInUserLocale: data.dynamicFormOutputInUserLocale ?? false,
          formEnrichmentAiModel: data.formEnrichmentAiModel || DEFAULT_FORM_ENRICHMENT_MODEL,
          formEnrichmentOutputInUserLocale: data.formEnrichmentOutputInUserLocale ?? false,
          templateConfiguratorAiModel: data.templateConfiguratorAiModel || DEFAULT_TEMPLATE_CONFIGURATOR_MODEL,
          templateConfiguratorBusinessLogic: data.templateConfiguratorBusinessLogic || DEFAULT_TEMPLATE_CONFIGURATOR_BUSINESS_LOGIC,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
        // Use default if fetch fails
        form.reset({
          documentGenerationAiModel: DEFAULT_DOCUMENT_GENERATION_MODEL,
          commonPromptInstructions: DEFAULT_COMMON_PROMPT_INSTRUCTIONS,
          documentGenerationOutputInUserLocale: false,
          dynamicFormAiModel: DEFAULT_DYNAMIC_AI_MODEL,
          dynamicFormSystemPrompt: DEFAULT_DYNAMIC_FORM_SYSTEM_PROMPT,
          dynamicFormOutputInUserLocale: false,
          formEnrichmentAiModel: DEFAULT_FORM_ENRICHMENT_MODEL,
          formEnrichmentOutputInUserLocale: false,
          templateConfiguratorAiModel: DEFAULT_TEMPLATE_CONFIGURATOR_MODEL,
          templateConfiguratorBusinessLogic: DEFAULT_TEMPLATE_CONFIGURATOR_BUSINESS_LOGIC,
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

  const handleResetTemplateConfigurator = () => {
    form.setValue("templateConfiguratorAiModel", DEFAULT_TEMPLATE_CONFIGURATOR_MODEL);
    form.setValue("templateConfiguratorBusinessLogic", DEFAULT_TEMPLATE_CONFIGURATOR_BUSINESS_LOGIC);
    toast.info("Reset template configurator settings to default");
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
              <div className="max-w-md">
                <ModelSelector
                  value={form.watch("documentGenerationAiModel") || DEFAULT_DOCUMENT_GENERATION_MODEL}
                  onChange={(value) => form.setValue("documentGenerationAiModel", value)}
                  useCase="documentGeneration"
                  placeholder="Select AI model"
                />
              </div>
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

            {/* Locale-aware output toggle */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--poly-green))]/5">
              <input
                type="checkbox"
                id="documentGenerationOutputInUserLocale"
                checked={form.watch("documentGenerationOutputInUserLocale")}
                onChange={(e) => form.setValue("documentGenerationOutputInUserLocale", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
              />
              <div className="flex-1">
                <Label htmlFor="documentGenerationOutputInUserLocale" className="cursor-pointer flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                  Output in user&apos;s locale
                </Label>
                <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                  When enabled, adds an instruction for the AI to generate documents in the user&apos;s selected language (e.g., German for /de visitors).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Enrichment AI Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wand2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <div>
                  <CardTitle>Form Enrichment AI Settings</CardTitle>
                  <CardDescription>
                    Configure the AI model used for enriching form context and generating smart suggestions.
                    This runs when users complete a screen with AI Enrichment enabled.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("formEnrichmentAiModel", DEFAULT_FORM_ENRICHMENT_MODEL);
                  toast.info("Reset form enrichment AI model to default");
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formEnrichmentAiModel">AI Model</Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Select the AI model used for AI Enrichment prompts (analyzing form data to generate context for smart suggestions).
              </p>
              <div className="max-w-md">
                <ModelSelector
                  value={form.watch("formEnrichmentAiModel") || DEFAULT_FORM_ENRICHMENT_MODEL}
                  onChange={(value) => form.setValue("formEnrichmentAiModel", value)}
                  useCase="formEnrichment"
                  placeholder="Select AI model"
                />
              </div>
            </div>

            {/* Locale-aware output toggle */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--poly-green))]/5">
              <input
                type="checkbox"
                id="formEnrichmentOutputInUserLocale"
                checked={form.watch("formEnrichmentOutputInUserLocale")}
                onChange={(e) => form.setValue("formEnrichmentOutputInUserLocale", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
              />
              <div className="flex-1">
                <Label htmlFor="formEnrichmentOutputInUserLocale" className="cursor-pointer flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                  Output in user&apos;s locale
                </Label>
                <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                  When enabled, adds an instruction for the AI to return enrichment values in the user&apos;s selected language.
                </p>
              </div>
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
              <div className="max-w-md">
                <ModelSelector
                  value={form.watch("dynamicFormAiModel") || DEFAULT_DYNAMIC_AI_MODEL}
                  onChange={(value) => form.setValue("dynamicFormAiModel", value)}
                  useCase="dynamicForm"
                  placeholder="Select AI model"
                />
              </div>
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

            {/* Locale-aware output toggle */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--poly-green))]/5">
              <input
                type="checkbox"
                id="dynamicFormOutputInUserLocale"
                checked={form.watch("dynamicFormOutputInUserLocale")}
                onChange={(e) => form.setValue("dynamicFormOutputInUserLocale", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
              />
              <div className="flex-1">
                <Label htmlFor="dynamicFormOutputInUserLocale" className="cursor-pointer flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                  Output in user&apos;s locale
                </Label>
                <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                  When enabled, adds an instruction for the AI to generate form field labels and help text in the user&apos;s selected language.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template AI Configurator Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--mauveine))]" />
                <div>
                  <CardTitle>Template AI Configurator</CardTitle>
                  <CardDescription>
                    Configure the AI assistant that helps build template screens and fields through natural conversation.
                    This powers the AI chat panel in the Form Builder.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetTemplateConfigurator}
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
              <Label htmlFor="templateConfiguratorAiModel">AI Model</Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Select the AI model used for the template configurator chat. Models with strong reasoning and JSON output are recommended.
              </p>
              <div className="max-w-md">
                <ModelSelector
                  value={form.watch("templateConfiguratorAiModel") || DEFAULT_TEMPLATE_CONFIGURATOR_MODEL}
                  onChange={(value) => form.setValue("templateConfiguratorAiModel", value)}
                  useCase="documentGeneration"
                  placeholder="Select AI model"
                />
              </div>
            </div>

            {/* Business Logic Prompt */}
            <div className="space-y-2">
              <Label htmlFor="templateConfiguratorBusinessLogic">
                Business Logic &amp; Strategy Prompt
              </Label>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Define the core strategy and business rules the AI should follow when building templates.
                This prompt is combined with the current template context and schema information.
              </p>
              <textarea
                id="templateConfiguratorBusinessLogic"
                placeholder="Enter business logic and strategy instructions for the AI configurator..."
                className="flex min-h-64 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("templateConfiguratorBusinessLogic")}
              />
              {form.watch("templateConfiguratorBusinessLogic") && (
                <div className="flex justify-between items-center text-xs text-[hsl(var(--globe-grey))]">
                  <span>
                    {form.watch("templateConfiguratorBusinessLogic")?.length.toLocaleString()} characters
                  </span>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="p-4 rounded-lg border border-[hsl(var(--mauveine))]/20 bg-[hsl(var(--mauveine))]/5">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-[hsl(var(--mauveine))] mt-0.5 shrink-0" />
                <div className="text-xs text-[hsl(var(--globe-grey))]">
                  <p className="font-medium text-[hsl(var(--fg))] mb-1">How the AI Configurator Works</p>
                  <p>
                    The AI configurator receives the full template context (title, description, existing screens and fields)
                    along with your business logic instructions. It can generate new screens with fields or add fields to
                    existing screens through natural conversation.
                  </p>
                </div>
              </div>
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

