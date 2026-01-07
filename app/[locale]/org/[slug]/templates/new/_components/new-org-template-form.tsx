"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
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

const formSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only (e.g., nda-template)"
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
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface NewOrgTemplateFormProps {
  locale: string;
  orgSlug: string;
  orgId: string;
}

export function NewOrgTemplateForm({
  locale,
  orgSlug,
  orgId,
}: NewOrgTemplateFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "FileText",
      available: false,
      keywords: [],
      estimatedMinutes: null,
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/org/${orgId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }

      const { template } = await response.json();
      toast.success("Template created successfully");

      // Redirect to edit page so user can add screens/fields
      router.push(`/${locale}/org/${orgSlug}/templates/${template.id}/edit`);
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

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;
  const IconComponent = selectedIcon;

  return (
    <div className="max-w-3xl py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${locale}/org/${orgSlug}/templates`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
            <FilePlus className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
              Create Template
            </h1>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Add a new template for your organization
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>
              Basic details about your template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title and Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Non-Disclosure Agreement"
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
                  placeholder="nda-template"
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
                placeholder="A confidentiality agreement to protect sensitive information..."
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
                  This URL will only be accessible to your organization members
                </p>
              </div>
            )}

            {/* Available toggle */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                  checked={form.watch("available")}
                  onChange={(e) => form.setValue("available", e.target.checked)}
                />
                <span className="text-sm font-medium text-[hsl(var(--fg))]">
                  Make available immediately
                </span>
              </label>
            </div>
            <p className="text-xs text-[hsl(var(--globe-grey))] -mt-4">
              If unchecked, the template will be saved as a draft
            </p>

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

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href={`/${locale}/org/${orgSlug}/templates`}>Cancel</Link>
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
