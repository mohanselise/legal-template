"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  FileText,
  Users,
  Lock,
  Shield,
  Sparkles,
  FileCheck,
  FilePlus,
  FileSearch,
  Files,
  Folder,
  Scale,
  Briefcase,
  Building,
  Handshake,
  UserCheck,
  ClipboardList,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from "@/lib/openai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Icon options
const iconOptions = [
  { value: "FileText", label: "File Text", icon: FileText },
  { value: "Users", label: "Users", icon: Users },
  { value: "Lock", label: "Lock", icon: Lock },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
  { value: "FileCheck", label: "File Check", icon: FileCheck },
  { value: "FilePlus", label: "File Plus", icon: FilePlus },
  { value: "FileSearch", label: "File Search", icon: FileSearch },
  { value: "Files", label: "Files", icon: Files },
  { value: "Folder", label: "Folder", icon: Folder },
  { value: "Scale", label: "Scale", icon: Scale },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "Building", label: "Building", icon: Building },
  { value: "Handshake", label: "Handshake", icon: Handshake },
  { value: "UserCheck", label: "User Check", icon: UserCheck },
  { value: "ClipboardList", label: "Clipboard List", icon: ClipboardList },
] as const;

// Default prompts by template slug
const defaultPrompts: Record<string, string> = {
  "employment-agreement": EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON,
};

const formSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only (e.g., employment-agreement)"
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be 1000 characters or less"),
  icon: z.string().default("FileText"),
  available: z.boolean().default(false),
  popular: z.boolean().default(false),
  // href is auto-generated from slug
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiConfigExpanded, setAiConfigExpanded] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "FileText",
      available: false,
      popular: false,
      // href will be auto-generated
      keywords: [],
      estimatedMinutes: null,
      systemPrompt: null,
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }

      const newTemplate = await response.json();
      toast.success("Template created successfully");
      
      // Redirect to edit page so user can configure the form
      router.push(`/${locale}/admin/templates/${newTemplate.id}/edit`);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create template"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !form.getValues("keywords").includes(keyword)) {
      form.setValue("keywords", [...form.getValues("keywords"), keyword]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    form.setValue(
      "keywords",
      form.getValues("keywords").filter((k) => k !== keyword)
    );
  };

  // Slug is handled by form.register

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;
  const IconComponent = selectedIcon;

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${locale}/admin/templates`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
            <FilePlus className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--fg))]">
              Create Template
            </h1>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Add a new legal document template
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core template details and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title and Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Employment Agreement"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                  <Input
                  id="slug"
                  placeholder="employment-agreement"
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Comprehensive employment contracts with customizable terms..."
                className="flex min-h-24 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <IconComponent className="size-5 text-[hsl(var(--selise-blue))]" />
                </div>
                <select
                  className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                  value={form.watch("icon")}
                  onChange={(e) => form.setValue("icon", e.target.value)}
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* URL Preview */}
            {form.watch("slug") && (
              <div className="space-y-2">
                <Label>URL Preview</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <code className="text-sm text-[hsl(var(--globe-grey))]">
                    /templates/{form.watch("slug")}/generate
                  </code>
                </div>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  URL is automatically generated from the slug
                </p>
              </div>
            )}

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                  checked={form.watch("available")}
                  onChange={(e) => form.setValue("available", e.target.checked)}
                />
                <span className="text-sm font-medium text-[hsl(var(--fg))]">
                  Available
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                  checked={form.watch("popular")}
                  onChange={(e) => form.setValue("popular", e.target.checked)}
                />
                <span className="text-sm font-medium text-[hsl(var(--fg))]">
                  Popular
                </span>
              </label>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {form.watch("keywords")?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.watch("keywords") || []).map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 rounded-full hover:bg-destructive/20"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Minutes */}
            <div className="space-y-2">
              <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min="1"
                placeholder="10"
                {...form.register("estimatedMinutes", {
                  setValueAs: (v) => (v === "" ? null : parseInt(v, 10)),
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration Card */}
        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setAiConfigExpanded(!aiConfigExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                <CardTitle>AI Configuration</CardTitle>
                {form.watch("systemPrompt") && (
                  <Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>
                )}
              </div>
              {aiConfigExpanded ? (
                <ChevronUp className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
              )}
            </div>
            <CardDescription>
              Configure the AI system prompt for document generation (optional)
            </CardDescription>
          </CardHeader>
          {aiConfigExpanded && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  {defaultPrompts[form.watch("slug")] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const defaultPrompt = defaultPrompts[form.watch("slug")];
                        if (defaultPrompt) {
                          form.setValue("systemPrompt", defaultPrompt);
                        }
                      }}
                      className="h-7 text-xs gap-1"
                    >
                      <RotateCcw className="size-3" />
                      Load Default
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  The system prompt defines the AI&apos;s behavior and output
                  format for document generation. Leave empty to use the default
                  prompt.
                </p>
                <textarea
                  id="systemPrompt"
                  placeholder="Enter custom system prompt for AI document generation..."
                  className="flex min-h-64 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("systemPrompt")}
                />
                {form.watch("systemPrompt") && (
                  <div className="flex justify-between items-center text-xs text-[hsl(var(--globe-grey))]">
                    <span>
                      {form.watch("systemPrompt")?.length.toLocaleString()}{" "}
                      characters
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => form.setValue("systemPrompt", null)}
                      className="h-6 text-xs text-destructive hover:text-destructive"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href={`/${locale}/admin/templates`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Template
          </Button>
        </div>
      </form>
    </div>
  );
}

