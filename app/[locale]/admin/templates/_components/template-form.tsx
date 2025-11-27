"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
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
import type { LucideIcon } from "lucide-react";
import { EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from "@/lib/openai";
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
import type { Template } from "@/lib/db";

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
  href: z
    .string()
    .min(1, "Href is required")
    .regex(/^\//, "Href must start with /"),
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  systemPromptRole: z.string().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
  onSubmit: (data: FormData) => Promise<void>;
}

export function TemplateForm({
  open,
  onOpenChange,
  template,
  onSubmit,
}: TemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiConfigExpanded, setAiConfigExpanded] = useState(false);

  const isEditing = !!template;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "FileText",
      available: false,
      popular: false,
      href: "/templates/",
      keywords: [],
      estimatedMinutes: null,
      systemPromptRole: null,
      systemPrompt: null,
    },
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.reset({
        slug: template.slug,
        title: template.title,
        description: template.description,
        icon: template.icon,
        available: template.available,
        popular: template.popular,
        href: template.href,
        keywords: Array.isArray(template.keywords) ? template.keywords : [],
        estimatedMinutes: template.estimatedMinutes,
        systemPromptRole: (template as any).systemPromptRole || null,
        systemPrompt: template.systemPrompt,
      });
      // Auto-expand AI config if prompt or role exists
      setAiConfigExpanded(!!template.systemPrompt || !!(template as any).systemPromptRole);
    } else {
      form.reset({
        slug: "",
        title: "",
        description: "",
        icon: "FileText",
        available: false,
        popular: false,
        href: "/templates/",
        keywords: [],
        estimatedMinutes: null,
        systemPromptRole: null,
        systemPrompt: null,
      });
      setAiConfigExpanded(false);
    }
    setKeywordInput("");
  }, [template, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
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

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the template details below."
              : "Fill in the details to create a new template."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <p className="text-sm text-[hsl(var(--destructive))]">
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
                <p className="text-sm text-[hsl(var(--destructive))]">
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
              <p className="text-sm text-[hsl(var(--destructive))]">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Icon and Href */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  {(() => {
                    const IconComp = selectedIcon;
                    return (
                      <IconComp className="size-5 text-[hsl(var(--selise-blue))]" />
                    );
                  })()}
                </div>
                <select
                  className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                  value={form.watch("icon")}
                  onChange={(e) =>
                    form.setValue("icon", e.target.value)
                  }
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="href">URL Path *</Label>
              <Input
                id="href"
                placeholder="/templates/employment-agreement/generate"
                {...form.register("href")}
              />
              {form.formState.errors.href && (
                <p className="text-sm text-[hsl(var(--destructive))]">
                  {form.formState.errors.href.message}
                </p>
              )}
            </div>
          </div>

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
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 rounded-full hover:bg-[hsl(var(--destructive))]/20"
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

          {/* AI Configuration Section */}
          <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <button
              type="button"
              onClick={() => setAiConfigExpanded(!aiConfigExpanded)}
              className="flex w-full items-center justify-between p-4 bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="size-5 text-[hsl(var(--selise-blue))]" />
                <span className="font-medium text-[hsl(var(--fg))]">
                  AI Configuration
                </span>
                {(form.watch("systemPrompt") || form.watch("systemPromptRole")) && (
                  <Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>
                )}
              </div>
              {aiConfigExpanded ? (
                <ChevronUp className="size-5 text-[hsl(var(--globe-grey))]" />
              ) : (
                <ChevronDown className="size-5 text-[hsl(var(--globe-grey))]" />
              )}
            </button>

            {aiConfigExpanded && (
              <div className="p-4 space-y-4 border-t border-[hsl(var(--border))]">
                <div className="space-y-2">
                  <Label htmlFor="systemPromptRole">Role</Label>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Define the AI&apos;s role (e.g., &quot;expert legal drafter specializing in employment agreements&quot;)
                  </p>
                  <Input
                    id="systemPromptRole"
                    placeholder="e.g., expert legal drafter specializing in employment agreements"
                    {...form.register("systemPromptRole")}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemPrompt">Prompt</Label>
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
                    The system prompt defines the AI&apos;s behavior and output format for document generation. Common instructions from Settings will be automatically appended.
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
                        {form.watch("systemPrompt")?.length.toLocaleString()} characters
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => form.setValue("systemPrompt", null)}
                        className="h-6 text-xs text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

