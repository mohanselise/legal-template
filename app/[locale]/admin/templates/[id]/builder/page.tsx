"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  FileText,
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenEditor } from "./_components/screen-editor";
import { FieldList } from "./_components/field-list";
import { DeleteDialog } from "./_components/delete-dialog";
import type { TemplateScreen, TemplateField } from "@/lib/db";

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

interface Template {
  id: string;
  slug: string;
  title: string;
  description: string;
  available: boolean;
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const locale = params.locale as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [screens, setScreens] = useState<ScreenWithFields[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [screenEditorOpen, setScreenEditorOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenWithFields | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingScreen, setDeletingScreen] = useState<ScreenWithFields | null>(null);

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch template");
    }
  }, [templateId]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch screens");
    }
  }, [templateId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplate(), fetchScreens()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTemplate, fetchScreens]);

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
    await fetchScreens();
    setDeleteDialogOpen(false);
    setDeletingScreen(null);
    
    // If deleted screen was selected, select first available
    if (deletingScreen && deletingScreen.id === selectedScreenId) {
      const remainingScreens = screens.filter(s => s.id !== deletingScreen.id);
      setSelectedScreenId(remainingScreens[0]?.id || null);
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

  const selectedScreen = screens.find(s => s.id === selectedScreenId);

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container py-8 max-w-7xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error || "Template not found"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
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
              <FileText className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--fg))]">
                {template.title}
              </h1>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                Form Builder
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

      {/* Main Content */}
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
              allScreens={screens}
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
        onConfirm={async () => {
          if (deletingScreen) {
            await fetch(
              `/api/admin/templates/${templateId}/screens/${deletingScreen.id}`,
              { method: "DELETE" }
            );
            await handleScreenDeleted();
          }
        }}
      />
    </div>
  );
}

