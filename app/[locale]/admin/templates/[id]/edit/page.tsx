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
  Languages,
  ExternalLink,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Copy,
  Link as LinkIcon,
  RefreshCw,
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
import type { Template, TemplateScreen, TemplateField, TemplatePage } from "@/lib/db";
import { ScreenEditor } from "../builder/_components/screen-editor";
import { DeleteDialog } from "../builder/_components/delete-dialog";
import { AIConfigurator } from "../builder/_components/ai-configurator";
import { FormBuilderDnd } from "../builder/_components/form-builder-dnd";

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
  // UILM Translation Keys (Module: templates, ID: 03e5475d-506d-4ad1-8d07-23fa768a7925)
  uilmTitleKey: z.string().optional().nullable(),
  uilmDescriptionKey: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

// Landing page form schema
const landingPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
  htmlBody: z.string().min(1, "HTML body is required"),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url("Invalid URL format").optional().nullable().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

type LandingPageFormData = z.infer<typeof landingPageSchema>;

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
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
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
        className={`h-4 w-4 transition-colors ${isSelected
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
  const [uilmConfigExpanded, setUilmConfigExpanded] = useState(false);

  // Landing page state
  const [landingPage, setLandingPage] = useState<TemplatePage | null>(null);
  const [landingPageExists, setLandingPageExists] = useState(false);
  const [isLandingPageSubmitting, setIsLandingPageSubmitting] = useState(false);
  const [isGeneratingLanding, setIsGeneratingLanding] = useState(false);
  const [landingKeywordInput, setLandingKeywordInput] = useState("");

  // Form builder dialog states
  const [screenEditorOpen, setScreenEditorOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenWithFields | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingScreen, setDeletingScreen] = useState<ScreenWithFields | null>(null);

  // AI Configurator panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Preview token state
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isRevokingToken, setIsRevokingToken] = useState(false);

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
      uilmTitleKey: null,
      uilmDescriptionKey: null,
    },
  });

  const landingPageForm = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      title: "",
      description: "",
      htmlBody: "",
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      keywords: [],
      published: false,
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
      setPreviewToken((data.template as any).previewToken || null);

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
        uilmTitleKey: (data.template as any).uilmTitleKey || null,
        uilmDescriptionKey: (data.template as any).uilmDescriptionKey || null,
      });

      // Auto-expand AI config if prompt or role exists
      setAiConfigExpanded(!!data.template.systemPrompt || !!(data.template as any).systemPromptRole);
      // Auto-expand UILM config if any key exists
      setUilmConfigExpanded(!!(data.template as any).uilmTitleKey || !!(data.template as any).uilmDescriptionKey);
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

  const fetchLandingPage = useCallback(async (slug: string) => {
    try {
      // Fetch landing page by slug and locale
      const response = await fetch(`/api/admin/template-pages?search=${encodeURIComponent(slug)}&locale=${locale}`);
      if (!response.ok) {
        throw new Error("Failed to fetch landing page");
      }
      const data = await response.json();

      // Find the exact match for this slug and locale
      const page = data.templatePages?.find(
        (p: TemplatePage) => p.slug === slug && p.locale === locale
      );

      if (page) {
        setLandingPage(page);
        setLandingPageExists(true);
        landingPageForm.reset({
          title: page.title,
          description: page.description,
          htmlBody: page.htmlBody,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          keywords: Array.isArray(page.keywords) ? page.keywords : [],
          published: page.published,
        });
      } else {
        setLandingPage(null);
        setLandingPageExists(false);
        // Pre-fill with template data
        if (template) {
          landingPageForm.reset({
            title: template.title,
            description: template.description,
            htmlBody: "",
            ogTitle: null,
            ogDescription: null,
            ogImage: null,
            keywords: Array.isArray(template.keywords) ? template.keywords : [],
            published: false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching landing page:", error);
      setLandingPage(null);
      setLandingPageExists(false);
    }
  }, [locale, landingPageForm, template]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTemplate(), fetchScreens()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTemplate, fetchScreens]);

  // Fetch landing page when template slug is available
  useEffect(() => {
    if (template?.slug) {
      fetchLandingPage(template.slug);
    }
  }, [template?.slug, fetchLandingPage]);

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

  // Landing page form handlers
  const handleLandingPageSubmit = async (data: LandingPageFormData) => {
    if (!template?.slug) return;

    setIsLandingPageSubmitting(true);
    try {
      const payload = {
        ...data,
        slug: template.slug,
        locale,
        ogImage: data.ogImage || null,
      };

      let response;
      if (landingPageExists && landingPage) {
        // Update existing landing page
        response = await fetch(`/api/admin/template-pages/${landingPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new landing page
        response = await fetch("/api/admin/template-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save landing page");
      }

      toast.success(landingPageExists ? "Landing page updated" : "Landing page created");
      await fetchLandingPage(template.slug);
    } catch (error) {
      console.error("Error saving landing page:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save landing page"
      );
    } finally {
      setIsLandingPageSubmitting(false);
    }
  };

  const addLandingKeyword = () => {
    const keyword = landingKeywordInput.trim().toLowerCase();
    if (keyword && !landingPageForm.getValues("keywords").includes(keyword)) {
      landingPageForm.setValue("keywords", [...landingPageForm.getValues("keywords"), keyword]);
      setLandingKeywordInput("");
    }
  };

  const removeLandingKeyword = (keyword: string) => {
    landingPageForm.setValue(
      "keywords",
      landingPageForm.getValues("keywords").filter((k) => k !== keyword)
    );
  };

  // AI Landing Page generation
  const handleGenerateLanding = async () => {
    if (!template) return;
    setIsGeneratingLanding(true);
    try {
      const response = await fetch("/api/admin/template-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          locale,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate landing page");
      }

      const { result } = await response.json();
      
      // The API returns structured blocks; store as JSON in htmlBody
      // The landing page renderer will parse this JSON
      const htmlBody = result.blocks 
        ? JSON.stringify(result.blocks, null, 2) 
        : (result.htmlBody || "");
      
      landingPageForm.reset({
        title: result.title || template.title,
        description: result.description || template.description,
        htmlBody,
        ogTitle: result.ogTitle || result.title || template.title,
        ogDescription: result.ogDescription || result.description || template.description,
        ogImage: result.ogImage || "",
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        published: landingPageForm.watch("published") ?? false,
      });

      toast.success("Generated landing page draft");
    } catch (error) {
      console.error("Error generating landing page:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate landing page"
      );
    } finally {
      setIsGeneratingLanding(false);
    }
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

  // Preview token handlers
  const handleGeneratePreviewToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/preview-token`, {
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
        error instanceof Error ? error.message : "Failed to generate preview token"
      );
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleRevokePreviewToken = async () => {
    setIsRevokingToken(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/preview-token`, {
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
        error instanceof Error ? error.message : "Failed to revoke preview token"
      );
    } finally {
      setIsRevokingToken(false);
    }
  };

  const handleCopyPreviewLink = async () => {
    if (!previewToken || !template?.slug) return;

    const previewUrl = `${window.location.origin}/${locale}/templates/${template.slug}/generate?preview=${previewToken}`;
    
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("Preview link copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy preview link");
    }
  };

  const selectedIcon =
    iconOptions.find((opt) => opt.value === form.watch("icon"))?.icon ||
    FileText;
  const IconComponent = selectedIcon;
  const selectedScreen = screens.find(s => s.id === selectedScreenId) ?? null;

  if (isLoading) {
    return (
      <div className="w-full mx-auto max-w-[95%] xl:max-w-[1600px] py-8 px-4">
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
    <div className="w-full mx-auto max-w-[95%] xl:max-w-[1600px] py-8 px-4">
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
          <TabsTrigger value="landing-page">
            <Globe className="h-4 w-4 mr-2" />
            Landing Page
            {landingPageExists && (
              <Badge
                variant="secondary"
                className={`ml-2 ${landingPage?.published ? "bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]" : ""}`}
              >
                {landingPage?.published ? "Live" : "Draft"}
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
                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                      URL will be: /{locale}/templates/{form.watch("slug") || "slug"}/generate
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
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/templates/${form.watch("slug") || template?.slug || "slug"}/generate?preview=${previewToken}`}
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
                          className="h-7 text-sm gap-1"
                        >
                          <RotateCcw className="size-3" />
                          Load Default
                        </Button>
                      )}
                    </div>
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

            {/* UILM Translations Card */}
            <Card className="mb-6">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setUilmConfigExpanded(!uilmConfigExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-[hsl(var(--poly-green))]" />
                    <CardTitle>Translations (UILM)</CardTitle>
                    {(form.watch("uilmTitleKey") || form.watch("uilmDescriptionKey")) && (
                      <Badge variant="secondary" className="text-xs bg-[hsl(var(--poly-green))]/10 text-[hsl(var(--poly-green))]">
                        Configured
                      </Badge>
                    )}
                  </div>
                  {uilmConfigExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                  )}
                </div>
                <CardDescription>
                  Map template content to UILM keys for multi-language support
                </CardDescription>
              </CardHeader>
              {uilmConfigExpanded && (
                <CardContent className="space-y-4">
                  <div className="p-3 bg-[hsl(var(--poly-green))]/5 rounded-lg border border-[hsl(var(--poly-green))]/20">
                    <div className="flex items-start gap-2">
                      <Languages className="h-4 w-4 text-[hsl(var(--poly-green))] mt-0.5" />
                      <div className="text-sm text-[hsl(var(--globe-grey))]">
                        <p className="font-medium text-[hsl(var(--fg))] mb-1">SELISE Blocks UILM Integration</p>
                        <p>
                          Add keys from the <strong>templates</strong> module to enable German translations.
                          Keys should be created in UILM first, then referenced here.
                        </p>
                        <a
                          href="https://blocks.selise.ch"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[hsl(var(--selise-blue))] hover:underline mt-1"
                        >
                          Open SELISE Blocks
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="uilmTitleKey">Title Key</Label>
                      <Input
                        id="uilmTitleKey"
                        placeholder="e.g., EMPLOYMENT_AGREEMENT_TITLE"
                        {...form.register("uilmTitleKey")}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-[hsl(var(--globe-grey))]">
                        UILM key for the template title
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uilmDescriptionKey">Description Key</Label>
                      <Input
                        id="uilmDescriptionKey"
                        placeholder="e.g., EMPLOYMENT_AGREEMENT_DESCRIPTION"
                        {...form.register("uilmDescriptionKey")}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-[hsl(var(--globe-grey))]">
                        UILM key for the template description
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-[hsl(var(--globe-grey))] p-2 bg-[hsl(var(--muted))]/30 rounded-md">
                    <p className="font-medium mb-1">Module Details:</p>
                    <code className="text-xs block">
                      Module: templates<br />
                      ID: 03e5475d-506d-4ad1-8d07-23fa768a7925
                    </code>
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
          {/* Form Builder Header with AI Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[hsl(var(--fg))]">
                Form Builder
              </h2>
              <Badge variant="secondary" className="text-xs">
                {screens.length} screen{screens.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <Button
              variant={aiPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="gap-2"
            >
              {aiPanelOpen ? (
                <>
                  <PanelRightClose className="h-4 w-4" />
                  Close AI Assistant
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Assistant
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Screens Panel - Fixed width sidebar */}
            <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[hsl(var(--fg))] uppercase tracking-wider">
                  Screens
                </h3>
                <Button size="sm" onClick={handleAddScreen}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <Card className="border-[hsl(var(--border))]">
                <CardContent className="p-2">
                  {screens.length === 0 ? (
                    <div className="text-center py-6 text-[hsl(var(--globe-grey))]">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No screens yet</p>
                      <p className="text-sm mt-1">Click &quot;Add&quot; to create one</p>
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

            {/* Main Content Area - Field Palette, Fields and AI Panel */}
            <div className={`flex-1 min-w-0 flex flex-col lg:flex-row gap-4`}>
              {/* Form Builder with DnD - includes field palette and screen content */}
              <div className={`${aiPanelOpen ? "flex-1 min-w-0" : "flex-1"}`}>
                <FormBuilderDnd
                  templateId={templateId}
                  screens={screens}
                  selectedScreenId={selectedScreenId}
                  onSelectScreen={setSelectedScreenId}
                  onScreensReordered={setScreens}
                  onFieldsUpdated={fetchScreens}
                  aiPanelOpen={aiPanelOpen}
                />
              </div>

              {/* AI Configurator Panel - Fixed width when open */}
              {aiPanelOpen && template && (
                <div className="w-full lg:w-96 xl:w-[420px] shrink-0 lg:h-[calc(100vh-12rem)] lg:sticky lg:top-4">
                  <AIConfigurator
                    templateId={templateId}
                    templateTitle={template.title}
                    templateDescription={template.description}
                    screens={screens}
                    selectedScreen={selectedScreen}
                    onScreenCreated={async () => {
                      await fetchScreens();
                    }}
                    onFieldsUpdated={async () => {
                      await fetchScreens();
                    }}
                    onClose={() => setAiPanelOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Landing Page Tab */}
        <TabsContent value="landing-page">
          <form onSubmit={landingPageForm.handleSubmit(handleLandingPageSubmit)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--fg))]">Landing Page</h2>
                <p className="text-sm text-[hsl(var(--globe-grey))]">Generate or edit the public landing page content.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGeneratingLanding || isLoading}
                  onClick={handleGenerateLanding}
                  className="gap-2"
                >
                  {isGeneratingLanding && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isGeneratingLanding ? "Generating..." : "Generate Landing Page"}
                </Button>
              </div>
            </div>

            {/* Status Banner */}
            {!landingPageExists && (
              <div className="mb-6 p-4 bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-[hsl(var(--selise-blue))] mt-0.5" />
                  <div>
                    <p className="font-medium text-[hsl(var(--fg))]">No landing page yet</p>
                    <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
                      Create a custom landing page for <code className="px-1 py-0.5 bg-[hsl(var(--muted))] rounded text-sm">/{locale}/templates/{template?.slug}</code>.
                      This page will be shown to users when they visit the template URL.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Page Metadata Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Page Metadata</CardTitle>
                    <CardDescription>
                      SEO and social sharing information
                    </CardDescription>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                      checked={landingPageForm.watch("published")}
                      onChange={(e) => landingPageForm.setValue("published", e.target.checked)}
                    />
                    <span className="text-sm font-medium text-[hsl(var(--fg))] flex items-center gap-1">
                      {landingPageForm.watch("published") ? (
                        <>
                          <Eye className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                          Draft
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title and Description */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="landing-title">Page Title *</Label>
                    <Input
                      id="landing-title"
                      placeholder="Employment Agreement Generator"
                      {...landingPageForm.register("title")}
                    />
                    {landingPageForm.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {landingPageForm.formState.errors.title.message}
                      </p>
                    )}
                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                      Used for the browser tab title and SEO
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landing-og-title">Open Graph Title</Label>
                    <Input
                      id="landing-og-title"
                      placeholder="Falls back to page title if empty"
                      {...landingPageForm.register("ogTitle")}
                    />
                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                      Title for social media sharing
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="landing-description">Meta Description *</Label>
                  <textarea
                    id="landing-description"
                    placeholder="A comprehensive description of this template page for search engines..."
                    className="flex min-h-20 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                    {...landingPageForm.register("description")}
                  />
                  {landingPageForm.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {landingPageForm.formState.errors.description.message}
                    </p>
                  )}
                </div>

                {/* OG Description */}
                <div className="space-y-2">
                  <Label htmlFor="landing-og-description">Open Graph Description</Label>
                  <textarea
                    id="landing-og-description"
                    placeholder="Falls back to meta description if empty..."
                    className="flex min-h-16 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                    {...landingPageForm.register("ogDescription")}
                  />
                  <p className="text-sm text-[hsl(var(--globe-grey))]">
                    Description for social media sharing
                  </p>
                </div>

                {/* OG Image */}
                <div className="space-y-2">
                  <Label htmlFor="landing-og-image">Open Graph Image URL</Label>
                  <div className="flex gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <ImageIcon className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                    </div>
                    <Input
                      id="landing-og-image"
                      placeholder="https://example.com/og-image.png"
                      {...landingPageForm.register("ogImage")}
                      className="flex-1"
                    />
                  </div>
                  {landingPageForm.formState.errors.ogImage && (
                    <p className="text-sm text-destructive">
                      {landingPageForm.formState.errors.ogImage.message}
                    </p>
                  )}
                  <p className="text-sm text-[hsl(var(--globe-grey))]">
                    Recommended: 1200x630px for optimal social media display
                  </p>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label>SEO Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      value={landingKeywordInput}
                      onChange={(e) => setLandingKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLandingKeyword();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addLandingKeyword}>
                      Add
                    </Button>
                  </div>
                  {(landingPageForm.watch("keywords") || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(landingPageForm.watch("keywords") || []).map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeLandingKeyword(keyword)}
                            className="ml-1 rounded-full hover:bg-destructive/20"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* HTML Body Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Page Content (HTML)</CardTitle>
                <CardDescription>
                  The HTML content that will be rendered on the landing page.
                  Use standard HTML tags and Tailwind CSS classes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="landing-html-body">HTML Body *</Label>
                    {landingPageForm.watch("htmlBody") && (
                      <span className="text-sm text-[hsl(var(--globe-grey))]">
                        {landingPageForm.watch("htmlBody")?.length.toLocaleString()} characters
                      </span>
                    )}
                  </div>
                  <textarea
                    id="landing-html-body"
                    placeholder={`<section class="py-16">
  <div class="container mx-auto px-4">
    <h1 class="text-4xl font-bold mb-4">Your Template Title</h1>
    <p class="text-lg text-muted-foreground">
      Describe what this template does and why users should use it.
    </p>
  </div>
</section>`}
                    className="flex min-h-96 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50"
                    {...landingPageForm.register("htmlBody")}
                  />
                  {landingPageForm.formState.errors.htmlBody && (
                    <p className="text-sm text-destructive">
                      {landingPageForm.formState.errors.htmlBody.message}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-[hsl(var(--muted))]/30 rounded-lg border border-[hsl(var(--border))]">
                  <p className="text-sm text-[hsl(var(--globe-grey))]">
                    <strong>Tips:</strong> You can use Tailwind CSS classes for styling.
                    The content will be rendered inside the main layout, so you don&apos;t need to include
                    header, footer, or html/body tags.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[hsl(var(--globe-grey))]">
                {landingPageExists ? (
                  <span>Last updated: {landingPage?.updatedAt ? new Date(landingPage.updatedAt).toLocaleString() : "Unknown"}</span>
                ) : (
                  <span>This will create a new landing page</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {landingPageExists && (
                  <Button type="button" variant="outline" asChild>
                    <a href={`/${locale}/templates/${template?.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </a>
                  </Button>
                )}
                <Button type="submit" disabled={isLandingPageSubmitting}>
                  {isLandingPageSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {landingPageExists ? "Save Changes" : "Create Landing Page"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Screen Editor Dialog */}
      <ScreenEditor
        open={screenEditorOpen}
        onOpenChange={setScreenEditorOpen}
        templateId={templateId}
        screen={editingScreen}
        allScreens={screens}
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
