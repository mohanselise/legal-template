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
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Copy,
  Link as LinkIcon,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Template, TemplateScreen, TemplateField } from "@/lib/db";

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
      "Slug must be lowercase with hyphens only"
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
  systemPromptRole: z.string().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface TemplateWithScreens extends Template {
  screens: ScreenWithFields[];
}

interface EditOrgTemplateFormProps {
  locale: string;
  orgSlug: string;
  orgId: string;
  template: TemplateWithScreens;
  previewToken?: string | null;
}

export function EditOrgTemplateForm({
  locale,
  orgSlug,
  orgId,
  template,
  previewToken: initialPreviewToken,
}: EditOrgTemplateFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiConfigExpanded, setAiConfigExpanded] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(initialPreviewToken || null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isRevokingToken, setIsRevokingToken] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: template.slug,
      title: template.title,
      description: template.description,
      icon: template.icon,
      available: template.available,
      keywords: Array.isArray(template.keywords) ? template.keywords as string[] : [],
      estimatedMinutes: template.estimatedMinutes,
      systemPromptRole: template.systemPromptRole,
      systemPrompt: template.systemPrompt,
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/org/${orgId}/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }

      toast.success("Template updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update template"
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

  // Preview token handlers
  const handleGeneratePreviewToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await fetch(`/api/org/${orgId}/templates/${template.id}/preview-token`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate preview token");
      }

      const data = await response.json();
      setPreviewToken(data.previewToken);
      toast.success("Preview link generated successfully");
    } catch (error) {
      console.error("Error generating preview token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate preview link"
      );
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleRevokePreviewToken = async () => {
    setIsRevokingToken(true);
    try {
      const response = await fetch(`/api/org/${orgId}/templates/${template.id}/preview-token`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke preview token");
      }

      setPreviewToken(null);
      toast.success("Preview link revoked successfully");
    } catch (error) {
      console.error("Error revoking preview token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke preview link"
      );
    } finally {
      setIsRevokingToken(false);
    }
  };

  const handleCopyPreviewLink = () => {
    if (previewToken) {
      const previewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/templates/${form.watch("slug") || template.slug}/generate?preview=${previewToken}`;
      navigator.clipboard.writeText(previewUrl);
      toast.success("Preview link copied to clipboard");
    }
  };

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;
  const IconComponent = selectedIcon;

  return (
    <div className="max-w-4xl py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/org/${orgSlug}/templates`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
                Edit Template
              </h1>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                {template.title}
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant={template.available ? "default" : "secondary"}
          className="gap-1"
        >
          {template.available ? (
            <>
              <Eye className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" />
              Draft
            </>
          )}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <Settings2 className="h-4 w-4 mr-2" />
            Template Details
          </TabsTrigger>
          <TabsTrigger value="form-builder">
            <FileText className="h-4 w-4 mr-2" />
            Form Builder
            {template.screens.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {template.screens.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Template Details Tab */}
        <TabsContent value="details">
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
                      This URL is only accessible to your organization members
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
                      Make available to organization
                    </span>
                  </label>
                </div>
                <p className="text-xs text-[hsl(var(--globe-grey))] -mt-4">
                  If unchecked, the template will remain as a draft
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

            {/* Internal Preview Link Card - Only show for draft templates */}
            {!form.watch("available") && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <CardTitle>Internal Preview Link</CardTitle>
                  </div>
                  <CardDescription>
                    Generate a shareable preview link for team review. This link allows access to draft templates without making them publicly available.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previewToken ? (
                    <>
                      <div className="space-y-2">
                        <Label>Preview URL</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/templates/${form.watch("slug") || template.slug}/generate?preview=${previewToken}`}
                            className="font-mono text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopyPreviewLink}
                            title="Copy preview link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-[hsl(var(--globe-grey))]">
                          Share this link with your team for internal review. The link will stop working if you revoke it or publish the template.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGeneratePreviewToken}
                          disabled={isGeneratingToken}
                          className="gap-2"
                        >
                          {isGeneratingToken ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Regenerate Link
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRevokePreviewToken}
                          disabled={isRevokingToken}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          {isRevokingToken ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              Revoke Access
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <LinkIcon className="h-5 w-5 text-[hsl(var(--selise-blue))] mt-0.5" />
                          <div>
                            <p className="font-medium text-[hsl(var(--fg))]">No preview link generated</p>
                            <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
                              Generate a preview link to share this draft template with your team for review and feedback.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleGeneratePreviewToken}
                        disabled={isGeneratingToken}
                        className="gap-2"
                      >
                        {isGeneratingToken ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <LinkIcon className="h-4 w-4" />
                            Generate Preview Link
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                    {(form.watch("systemPrompt") || form.watch("systemPromptRole")) && (
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
                  Configure the AI system prompt for document generation
                </CardDescription>
              </CardHeader>
              {aiConfigExpanded && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemPromptRole">Role</Label>
                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                      Define the AI&apos;s role (e.g., &quot;expert legal drafter specializing in employment agreements&quot;)
                    </p>
                    <Input
                      id="systemPromptRole"
                      placeholder="e.g., expert legal drafter specializing in employment agreements"
                      {...form.register("systemPromptRole")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">Prompt</Label>
                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                      The system prompt defines the AI&apos;s behavior and output
                      format for document generation. Common instructions from Settings will be automatically appended.
                    </p>
                    <textarea
                      id="systemPrompt"
                      placeholder="Enter custom system prompt for AI document generation..."
                      className="flex min-h-64 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("systemPrompt")}
                    />
                    {form.watch("systemPrompt") && (
                      <div className="flex justify-between items-center text-sm text-[hsl(var(--globe-grey))]">
                        <span>
                          {form.watch("systemPrompt")?.length.toLocaleString()}{" "}
                          characters
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("systemPrompt", null)}
                          className="h-6 text-sm text-destructive hover:text-destructive"
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
                <Link href={`/${locale}/org/${orgSlug}/templates`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Form Builder Tab */}
        <TabsContent value="form-builder">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4 max-w-md mx-auto">
                <div className="h-16 w-16 mx-auto rounded-full bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">
                    Form Builder
                  </h3>
                  <p className="text-sm text-[hsl(var(--globe-grey))]">
                    {template.screens.length === 0
                      ? "No screens yet. Open the form builder to add screens and fields."
                      : `This template has ${template.screens.length} screen${template.screens.length !== 1 ? "s" : ""} with ${template.screens.reduce((acc, s) => acc + s.fields.length, 0)} field${template.screens.reduce((acc, s) => acc + s.fields.length, 0) !== 1 ? "s" : ""}.`}
                  </p>
                </div>

                {/* Screen List */}
                {template.screens.length > 0 && (
                  <div className="text-left mt-6 space-y-2">
                    {template.screens.map((screen, index) => (
                      <div
                        key={screen.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[hsl(var(--globe-grey))]">
                            {index + 1}.
                          </span>
                          <span className="font-medium text-[hsl(var(--fg))]">
                            {screen.title}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {screen.fields.length} field{screen.fields.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    onClick={() => router.push(`/${locale}/org/${orgSlug}/templates/${template.id}/builder`)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Open Form Builder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
