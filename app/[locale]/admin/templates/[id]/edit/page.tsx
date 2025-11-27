"use client";

import { useEffect, useState, useCallback } from "react";
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
  Settings2,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Template, TemplateScreen, TemplateField } from "@/lib/db";
import { ScreenEditor } from "../builder/_components/screen-editor";
import { FieldList } from "../builder/_components/field-list";
import { DeleteDialog } from "../builder/_components/delete-dialog";

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
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  systemPromptRole: z.string().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface TemplateWithScreens extends Template {
  screens?: TemplateScreen[];
}

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface SortableScreenItemProps {
  screen: ScreenWithFields;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableScreenItem({
  screen,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: SortableScreenItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-[hsl(var(--selise-blue))]/10 border border-[hsl(var(--selise-blue))]/20"
          : "hover:bg-[hsl(var(--border))]/50"
      } ${isDragging ? "z-50" : ""}`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-[hsl(var(--globe-grey))] opacity-0 group-hover:opacity-100" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[hsl(var(--globe-grey))] w-6">
            {index + 1}.
          </span>
          <span className="font-medium text-sm text-[hsl(var(--fg))] truncate">
            {screen.title}
          </span>
        </div>
        <p className="text-xs text-[hsl(var(--globe-grey))] ml-6">
          {screen.fields.length} field{screen.fields.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ChevronRight
        className={`h-4 w-4 transition-colors ${
          isSelected
            ? "text-[hsl(var(--selise-blue))]"
            : "text-[hsl(var(--globe-grey))]"
        }`}
      />
    </div>
  );
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const locale = params.locale as string;

  const [template, setTemplate] = useState<TemplateWithScreens | null>(null);
  const [screens, setScreens] = useState<ScreenWithFields[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiConfigExpanded, setAiConfigExpanded] = useState(false);

  // Form builder dialog states
  const [screenEditorOpen, setScreenEditorOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenWithFields | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingScreen, setDeletingScreen] = useState<ScreenWithFields | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "FileText",
      available: false,
      popular: false,
      keywords: [],
      estimatedMinutes: null,
      systemPromptRole: null,
      systemPrompt: null,
    },
  });

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      setTemplate(data.template);

      // Reset form with template data
      form.reset({
        slug: data.template.slug,
        title: data.template.title,
        description: data.template.description,
        icon: data.template.icon,
        available: data.template.available,
        popular: data.template.popular,
        keywords: Array.isArray(data.template.keywords) ? data.template.keywords : [],
        estimatedMinutes: data.template.estimatedMinutes,
        systemPromptRole: (data.template as any).systemPromptRole || null,
        systemPrompt: data.template.systemPrompt,
      });

      // Auto-expand AI config if prompt or role exists
      setAiConfigExpanded(!!data.template.systemPrompt || !!(data.template as any).systemPromptRole);
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  }, [templateId, form]);

  const fetchScreens = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/screens`);
      if (!response.ok) {
        throw new Error("Failed to fetch screens");
      }
      const data = await response.json();
      setScreens(data);
      
      // Auto-select first screen if none selected
      if (data.length > 0) {
        setSelectedScreenId((prev) => prev ?? data[0].id);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
    }
  }, [templateId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTemplate(), fetchScreens()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTemplate, fetchScreens]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }

      toast.success("Template updated successfully");
      await fetchTemplate(); // Refresh template data
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

  // Form builder handlers
  const handleAddScreen = () => {
    setEditingScreen(null);
    setScreenEditorOpen(true);
  };

  const handleEditScreen = (screen: ScreenWithFields) => {
    setEditingScreen(screen);
    setScreenEditorOpen(true);
  };

  const handleDeleteScreen = (screen: ScreenWithFields) => {
    setDeletingScreen(screen);
    setDeleteDialogOpen(true);
  };

  const handleScreenSaved = async () => {
    await fetchScreens();
    setScreenEditorOpen(false);
    setEditingScreen(null);
  };

  const handleScreenDeleted = async () => {
    if (deletingScreen) {
      await fetch(
        `/api/admin/templates/${templateId}/screens/${deletingScreen.id}`,
        { method: "DELETE" }
      );
      await fetchScreens();
      setDeleteDialogOpen(false);
      
      // If deleted screen was selected, select first available
      if (deletingScreen.id === selectedScreenId) {
        const remainingScreens = screens.filter(s => s.id !== deletingScreen.id);
        setSelectedScreenId(remainingScreens[0]?.id || null);
      }
      setDeletingScreen(null);
    }
  };

  const handleFieldsUpdated = async () => {
    await fetchScreens();
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = screens.findIndex((screen) => screen.id === active.id);
    const newIndex = screens.findIndex((screen) => screen.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newScreens = arrayMove(screens, oldIndex, newIndex);
    setScreens(newScreens);

    // Update order on server
    try {
      const screenIds = newScreens.map((screen) => screen.id);
      const response = await fetch(`/api/admin/templates/${templateId}/screens`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder screens");
      }

      // Refresh to get updated data
      await fetchScreens();
      toast.success("Screens reordered successfully");
    } catch (error) {
      // Revert on error
      setScreens(screens);
      toast.error("Failed to reorder screens");
      console.error("Error reordering screens:", error);
    }
  };

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;
  const IconComponent = selectedIcon;
  const selectedScreen = screens.find(s => s.id === selectedScreenId);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Template Not Found</CardTitle>
            <CardDescription>
              The template you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/templates`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/templates`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--fg))]">
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
          className={
            template.available
              ? "bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]"
              : "bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
          }
        >
          {template.available ? "Available" : "Coming Soon"}
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
            {screens.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {screens.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Template Details Tab */}
        <TabsContent value="details">
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
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      URL will be: /templates/{form.watch("slug") || "slug"}/generate
                    </p>
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
                Save Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Form Builder Tab */}
        <TabsContent value="form-builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Screens Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[hsl(var(--fg))]">
                  Screens
                </h2>
                <Button size="sm" onClick={handleAddScreen}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Screen
                </Button>
              </div>

              <Card className="border-[hsl(var(--border))]">
                <CardContent className="p-2">
                  {screens.length === 0 ? (
                    <div className="text-center py-8 text-[hsl(var(--globe-grey))]">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No screens yet</p>
                      <p className="text-xs mt-1">Click "Add Screen" to create one</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={screens.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1">
                          {screens.map((screen, index) => (
                            <SortableScreenItem
                              key={screen.id}
                              screen={screen}
                              index={index}
                              isSelected={selectedScreenId === screen.id}
                              onSelect={() => setSelectedScreenId(screen.id)}
                              onEdit={(e) => {
                                e.stopPropagation();
                                handleEditScreen(screen);
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                handleDeleteScreen(screen);
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fields Panel */}
            <div className="lg:col-span-2">
              {selectedScreen ? (
                <FieldList
                  screen={selectedScreen}
                  onFieldsUpdated={handleFieldsUpdated}
                />
              ) : (
                <Card className="border-[hsl(var(--border))] h-full min-h-[400px]">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center text-[hsl(var(--globe-grey))]">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a screen</p>
                      <p className="text-sm mt-1">
                        Choose a screen from the list to manage its fields
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Screen Editor Dialog */}
      <ScreenEditor
        open={screenEditorOpen}
        onOpenChange={setScreenEditorOpen}
        templateId={templateId}
        screen={editingScreen}
        onSaved={handleScreenSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Screen"
        description={`Are you sure you want to delete "${deletingScreen?.title}"? This will also delete all ${deletingScreen?.fields.length || 0} fields in this screen. This action cannot be undone.`}
        onConfirm={handleScreenDeleted}
      />
    </div>
  );
}
