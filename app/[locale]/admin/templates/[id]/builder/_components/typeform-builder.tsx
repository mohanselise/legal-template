"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, Eye, Save } from "lucide-react";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import { Kbd } from "@/components/ui/kbd";
import { NavigationPanel } from "./navigation-panel";
import { PreviewCanvas } from "./preview-canvas";
import { PropertiesPanel } from "./properties-panel";
import { PreviewDialog } from "./preview-dialog";

// Types
export interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

export interface Template {
  id: string;
  slug: string;
  title: string;
  description: string;
  available: boolean;
  previewToken?: string | null;
}

export type SelectionType = "screen" | "field" | null;

export interface Selection {
  type: SelectionType;
  screenId: string | null;
  fieldId: string | null;
}

// Context for sharing state across panels
interface BuilderContextType {
  template: Template;
  screens: ScreenWithFields[];
  selection: Selection;
  setSelection: (selection: Selection) => void;
  refreshScreens: () => Promise<void>;
  updateField: (fieldId: string, updates: Partial<TemplateField>) => Promise<void>;
  updateScreen: (screenId: string, updates: Partial<TemplateScreen>) => Promise<void>;
  addScreen: () => void;
  addField: (screenId: string) => void;
  deleteScreen: (screenId: string) => Promise<void>;
  deleteField: (fieldId: string) => Promise<void>;
  reorderScreens: (screenIds: string[]) => Promise<void>;
  reorderFields: (screenId: string, fieldIds: string[]) => Promise<void>;
  saving: boolean;
}

const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within TypeformBuilder");
  }
  return context;
}

interface TypeformBuilderProps {
  template: Template;
  initialScreens: ScreenWithFields[];
  locale: string;
  /** API base path for org templates (e.g., "/api/org/orgId"). Defaults to "/api/admin" */
  apiBasePath?: string;
  /** Back URL for the exit button */
  backUrl?: string;
}

export function TypeformBuilder({
  template,
  initialScreens,
  locale,
  apiBasePath = "/api/admin",
  backUrl,
}: TypeformBuilderProps) {
  const [screens, setScreens] = useState<ScreenWithFields[]>(initialScreens);
  const [selection, setSelection] = useState<Selection>({
    type: initialScreens.length > 0 ? "screen" : null,
    screenId: initialScreens[0]?.id || null,
    fieldId: null,
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(template.previewToken || null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Get selected screen and field
  const selectedScreen = screens.find((s) => s.id === selection.screenId);
  const selectedField = selectedScreen?.fields.find(
    (f) => f.id === selection.fieldId
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          navigatePrevious();
          break;
        case "ArrowDown":
          e.preventDefault();
          navigateNext();
          break;
        case "Escape":
          // Go up to screen level if on field
          if (selection.fieldId && selection.screenId) {
            setSelection({
              type: "screen",
              screenId: selection.screenId,
              fieldId: null,
            });
          }
          break;
        case "Delete":
        case "Backspace":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (selection.fieldId) {
              deleteField(selection.fieldId);
            } else if (selection.screenId) {
              deleteScreen(selection.screenId);
            }
          }
          break;
        case "n":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (selection.screenId) {
              addField(selection.screenId);
            } else {
              addScreen();
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection]);

  // Navigation helpers
  const navigatePrevious = () => {
    if (!selectedScreen) return;

    if (selectedField) {
      const fieldIndex = selectedScreen.fields.findIndex(
        (f) => f.id === selectedField.id
      );
      if (fieldIndex > 0) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[fieldIndex - 1].id,
        });
      } else {
        setSelection({
          type: "screen",
          screenId: selectedScreen.id,
          fieldId: null,
        });
      }
    } else {
      const screenIndex = screens.findIndex((s) => s.id === selectedScreen.id);
      if (screenIndex > 0) {
        const prevScreen = screens[screenIndex - 1];
        if (prevScreen.fields.length > 0) {
          setSelection({
            type: "field",
            screenId: prevScreen.id,
            fieldId: prevScreen.fields[prevScreen.fields.length - 1].id,
          });
        } else {
          setSelection({
            type: "screen",
            screenId: prevScreen.id,
            fieldId: null,
          });
        }
      }
    }
  };

  const navigateNext = () => {
    if (!selectedScreen) return;

    if (selectedField) {
      const fieldIndex = selectedScreen.fields.findIndex(
        (f) => f.id === selectedField.id
      );
      if (fieldIndex < selectedScreen.fields.length - 1) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[fieldIndex + 1].id,
        });
      } else {
        const screenIndex = screens.findIndex((s) => s.id === selectedScreen.id);
        if (screenIndex < screens.length - 1) {
          setSelection({
            type: "screen",
            screenId: screens[screenIndex + 1].id,
            fieldId: null,
          });
        }
      }
    } else {
      if (selectedScreen.fields.length > 0) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[0].id,
        });
      } else {
        const screenIndex = screens.findIndex((s) => s.id === selectedScreen.id);
        if (screenIndex < screens.length - 1) {
          setSelection({
            type: "screen",
            screenId: screens[screenIndex + 1].id,
            fieldId: null,
          });
        }
      }
    }
  };

  // Fetch screens from API
  const refreshScreens = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiBasePath}/templates/${template.id}/screens`
      );
      if (!response.ok) throw new Error("Failed to fetch screens");
      const data = await response.json();
      setScreens(data);
    } catch (error) {
      toast.error("Failed to refresh screens");
    }
  }, [template.id, apiBasePath]);

  // Update a field
  const updateField = useCallback(
    async (fieldId: string, updates: Partial<TemplateField>) => {
      setSaving(true);
      try {
        const response = await fetch(`${apiBasePath}/fields/${fieldId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update field");

        // Optimistically update local state
        setScreens((prev) =>
          prev.map((screen) => ({
            ...screen,
            fields: screen.fields.map((field) =>
              field.id === fieldId ? { ...field, ...updates } : field
            ),
          }))
        );
      } catch (error) {
        toast.error("Failed to save changes");
        await refreshScreens();
      } finally {
        setSaving(false);
        setLastSaved(new Date());
      }
    },
    [apiBasePath, refreshScreens]
  );

  // Update a screen
  const updateScreen = useCallback(
    async (screenId: string, updates: Partial<TemplateScreen>) => {
      setSaving(true);
      try {
        const response = await fetch(
          `${apiBasePath}/templates/${template.id}/screens/${screenId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        if (!response.ok) throw new Error("Failed to update screen");

        // Optimistically update local state
        setScreens((prev) =>
          prev.map((screen) =>
            screen.id === screenId ? { ...screen, ...updates } : screen
          )
        );
      } catch (error) {
        toast.error("Failed to save changes");
        await refreshScreens();
      } finally {
        setSaving(false);
        setLastSaved(new Date());
      }
    },
    [template.id, apiBasePath, refreshScreens]
  );

  // Add a new screen
  const addScreen = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${apiBasePath}/templates/${template.id}/screens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Screen ${screens.length + 1}`,
            description: "",
            type: "standard",
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to create screen");
      const newScreen = await response.json();

      await refreshScreens();
      setSelection({
        type: "screen",
        screenId: newScreen.id,
        fieldId: null,
      });
      toast.success("Screen added");
    } catch (error) {
      toast.error("Failed to add screen");
    } finally {
      setSaving(false);
    }
  }, [template.id, screens.length, apiBasePath, refreshScreens]);

  // Add a new field to a screen
  const addField = useCallback(
    async (screenId: string) => {
      setSaving(true);
      try {
        const screen = screens.find((s) => s.id === screenId);
        const response = await fetch(`${apiBasePath}/screens/${screenId}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `field${(screen?.fields.length || 0) + 1}`,
            label: "New field",
            type: "text",
            required: false,
          }),
        });
        if (!response.ok) throw new Error("Failed to create field");
        const newField = await response.json();

        await refreshScreens();
        setSelection({
          type: "field",
          screenId,
          fieldId: newField.id,
        });
        toast.success("Field added");
      } catch (error) {
        toast.error("Failed to add field");
      } finally {
        setSaving(false);
      }
    },
    [screens, apiBasePath, refreshScreens]
  );

  // Delete a screen
  const deleteScreen = useCallback(
    async (screenId: string) => {
      setSaving(true);
      try {
        const response = await fetch(
          `${apiBasePath}/templates/${template.id}/screens/${screenId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete screen");

        await refreshScreens();

        // Update selection
        const remainingScreens = screens.filter((s) => s.id !== screenId);
        if (remainingScreens.length > 0) {
          setSelection({
            type: "screen",
            screenId: remainingScreens[0].id,
            fieldId: null,
          });
        } else {
          setSelection({ type: null, screenId: null, fieldId: null });
        }
        toast.success("Screen deleted");
      } catch (error) {
        toast.error("Failed to delete screen");
      } finally {
        setSaving(false);
      }
    },
    [template.id, screens, apiBasePath, refreshScreens]
  );

  // Delete a field
  const deleteField = useCallback(
    async (fieldId: string) => {
      setSaving(true);
      try {
        const response = await fetch(`${apiBasePath}/fields/${fieldId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete field");

        await refreshScreens();

        // Update selection to parent screen
        if (selection.fieldId === fieldId && selection.screenId) {
          setSelection({
            type: "screen",
            screenId: selection.screenId,
            fieldId: null,
          });
        }
        toast.success("Field deleted");
      } catch (error) {
        toast.error("Failed to delete field");
      } finally {
        setSaving(false);
      }
    },
    [selection.fieldId, selection.screenId, apiBasePath, refreshScreens]
  );

  // Reorder screens
  const reorderScreens = useCallback(
    async (screenIds: string[]) => {
      const reorderedScreens = screenIds
        .map((id) => screens.find((s) => s.id === id)!)
        .filter(Boolean);
      setScreens(reorderedScreens);

      try {
        const response = await fetch(
          `${apiBasePath}/templates/${template.id}/screens`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ screenIds }),
          }
        );
        if (!response.ok) throw new Error("Failed to reorder screens");
        await refreshScreens();
      } catch (error) {
        toast.error("Failed to reorder screens");
        await refreshScreens();
      }
    },
    [template.id, screens, apiBasePath, refreshScreens]
  );

  // Reorder fields within a screen
  const reorderFields = useCallback(
    async (screenId: string, fieldIds: string[]) => {
      // Optimistically update
      setScreens((prev) =>
        prev.map((screen) => {
          if (screen.id !== screenId) return screen;
          const reorderedFields = fieldIds
            .map((id) => screen.fields.find((f) => f.id === id)!)
            .filter(Boolean);
          return { ...screen, fields: reorderedFields };
        })
      );

      try {
        const response = await fetch(`${apiBasePath}/screens/${screenId}/fields`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldIds }),
        });
        if (!response.ok) throw new Error("Failed to reorder fields");
        await refreshScreens();
      } catch (error) {
        toast.error("Failed to reorder fields");
        await refreshScreens();
      }
    },
    [apiBasePath, refreshScreens]
  );

  const contextValue: BuilderContextType = {
    template,
    screens,
    selection,
    setSelection,
    refreshScreens,
    updateField,
    updateScreen,
    addScreen,
    addField,
    deleteScreen,
    deleteField,
    reorderScreens,
    reorderFields,
    saving,
  };

  return (
    <BuilderContext.Provider value={contextValue}>
      <div className="h-screen flex flex-col bg-[hsl(var(--bg))]">
        {/* Top Bar */}
        <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <a
              href={backUrl || `/${locale}/admin/templates`}
              className="p-2 rounded-lg text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[hsl(var(--fg))]">
                {template.title}
              </span>
              <AnimatePresence mode="wait">
                {saving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[hsl(var(--muted))] text-xs text-[hsl(var(--globe-grey))]"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border border-[hsl(var(--globe-grey))] border-t-transparent rounded-full"
                    />
                    Saving...
                  </motion.div>
                ) : lastSaved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[hsl(var(--lime-green))]/10 text-xs text-[hsl(var(--poly-green))]"
                  >
                    <Check className="h-3 w-3" />
                    Saved
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Keyboard shortcuts hint */}
            <div className="hidden lg:flex items-center gap-3 mr-4 text-xs text-[hsl(var(--globe-grey))]">
              <span className="flex items-center gap-1">
                <Kbd>↑↓</Kbd>
                Navigate
              </span>
            </div>
            <button
              onClick={() => {
                if (previewToken) {
                  // Navigate to preview URL
                  const previewUrl = `/${locale}/templates/${template.slug}/generate?preview=${previewToken}`;
                  window.open(previewUrl, "_blank");
                } else {
                  // Show dialog to create preview link
                  setPreviewDialogOpen(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
        </header>

        {/* Main 3-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Navigation */}
          <NavigationPanel />

          {/* Center Panel - Canvas */}
          <PreviewCanvas
            selectedScreen={selectedScreen || null}
            selectedField={selectedField || null}
          />

          {/* Right Panel - Properties */}
          <PropertiesPanel
            selectedScreen={selectedScreen || null}
            selectedField={selectedField || null}
            allScreens={screens}
          />
        </div>
      </div>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        templateId={template.id}
        templateSlug={template.slug}
        locale={locale}
        previewToken={previewToken}
        onTokenGenerated={(token) => {
          setPreviewToken(token);
          // Auto-open preview after generation
          const previewUrl = `/${locale}/templates/${template.slug}/generate?preview=${token}`;
          window.open(previewUrl, "_blank");
        }}
      />
    </BuilderContext.Provider>
  );
}

