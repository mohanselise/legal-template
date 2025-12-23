"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import type { TemplateScreen, TemplateField, FieldType } from "@/lib/db";
import { FieldTypePalette, fieldTypeConfigs, type FieldTypeConfig } from "./field-type-palette";
import { DroppableScreen } from "./droppable-screen";
import { FieldDragOverlay, PaletteFieldDragOverlay } from "./sortable-field";
import { FieldEditor } from "./field-editor";
import { DeleteDialog } from "./delete-dialog";
import { ScreenAIPrompt } from "./screen-ai-prompt";

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface FormBuilderDndProps {
  templateId: string;
  screens: ScreenWithFields[];
  selectedScreenId: string | null;
  onSelectScreen: (screenId: string) => void;
  onScreensReordered: (screens: ScreenWithFields[]) => void;
  onFieldsUpdated: () => Promise<void>;
  aiPanelOpen?: boolean;
}

export function FormBuilderDnd({
  templateId,
  screens,
  selectedScreenId,
  onSelectScreen,
  onScreensReordered,
  onFieldsUpdated,
  aiPanelOpen = false,
}: FormBuilderDndProps) {
  // Drag state
  const [activeDragType, setActiveDragType] = useState<"field" | "palette" | null>(null);
  const [activeDragData, setActiveDragData] = useState<{
    field?: TemplateField;
    fieldType?: FieldType;
    config?: FieldTypeConfig;
    sourceScreenId?: string;
  } | null>(null);

  // Field editor state
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [pendingFieldType, setPendingFieldType] = useState<FieldTypeConfig | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<TemplateField | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Small threshold to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "palette-field-type") {
      setActiveDragType("palette");
      setActiveDragData({
        fieldType: activeData.fieldType,
        config: activeData.config,
      });
    } else if (activeData?.type === "field") {
      setActiveDragType("field");
      setActiveDragData({
        field: activeData.field,
        sourceScreenId: activeData.screenId,
      });
    }
  }, []);

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Could add more visual feedback here if needed
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:111',message:'handleDragEnd called',data:{activeId:active.id,overId:over?.id,hasOver:!!over,activeData:active.data.current,overData:over?.data.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion

      // Reset drag state
      setActiveDragType(null);
      setActiveDragData(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Case 1: Dropping a palette item onto a screen
      if (activeData?.type === "palette-field-type") {
        let targetScreenId: string | null = null;

        // Check if dropped on a screen
        if (overData?.type === "screen") {
          targetScreenId = overData.screenId;
        } else if (String(over.id).startsWith("screen-")) {
          targetScreenId = String(over.id).replace("screen-", "");
        } else if (overData?.type === "field") {
          // If dropped on a field, use its screen
          targetScreenId = overData.screenId;
        }

        if (targetScreenId) {
          const config = activeData.config as FieldTypeConfig;
          setPendingFieldType(config);
          setEditingScreenId(targetScreenId);
          setEditingField(null);
          setFieldEditorOpen(true);
        }
        return;
      }

      // Case 2: Reordering fields within the same screen
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:148',message:'Case 2 check',data:{activeType:activeData?.type,overType:overData?.type,activeId:active.id,overId:over.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion
      if (activeData?.type === "field" && overData?.type === "field") {
        const sourceScreenId = activeData.screenId;
        const targetScreenId = overData.screenId;
        const activeField = activeData.field as TemplateField;
        const overField = overData.field as TemplateField;

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:154',message:'Field to field drop',data:{sourceScreenId,targetScreenId,activeFieldId:activeField.id,overFieldId:overField.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (sourceScreenId === targetScreenId) {
          // Same screen - reorder
          const screen = screens.find((s) => s.id === sourceScreenId);
          if (!screen) return;

          const oldIndex = screen.fields.findIndex((f) => f.id === activeField.id);
          const newIndex = screen.fields.findIndex((f) => f.id === overField.id);

          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:162',message:'Reorder indices',data:{oldIndex,newIndex,screenFieldCount:screen.fields.length,fieldIds:screen.fields.map(f=>f.id)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

          // Optimistically update
          const newFields = arrayMove(screen.fields, oldIndex, newIndex);
          const updatedScreens = screens.map((s) =>
            s.id === sourceScreenId ? { ...s, fields: newFields } : s
          );
          onScreensReordered(updatedScreens);

          // Update on server
          try {
            const fieldIds = newFields.map((f) => f.id);
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:180',message:'API call starting',data:{sourceScreenId,fieldIds},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            const response = await fetch(`/api/admin/screens/${sourceScreenId}/fields`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fieldIds }),
            });

            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:188',message:'API response',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            if (!response.ok) {
              throw new Error("Failed to reorder fields");
            }

            await onFieldsUpdated();
          } catch (error) {
            console.error("Error reordering fields:", error);
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:198',message:'Reorder error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            toast.error("Failed to reorder fields");
            // Refresh to restore correct order
            await onFieldsUpdated();
          }
        } else {
          // Different screen - move field
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:218',message:'Cross-screen move via field drop',data:{activeFieldId:activeField.id,sourceScreenId,targetScreenId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
          await moveFieldToScreen(activeField.id, sourceScreenId, targetScreenId);
        }
        return;
      }

      // Case 3: Moving a field to a different screen (dropped on screen, not field)
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:228',message:'Case 3 check',data:{activeType:activeData?.type,overType:overData?.type,overId:String(over.id),activeScreenId:activeData?.screenId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F,I,J'})}).catch(()=>{});
      // #endregion
      if (activeData?.type === "field") {
        let targetScreenId: string | null = null;

        if (overData?.type === "screen") {
          targetScreenId = overData.screenId;
        } else if (String(over.id).startsWith("screen-")) {
          targetScreenId = String(over.id).replace("screen-", "");
        }

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:240',message:'Case 3 target',data:{targetScreenId,activeScreenId:activeData.screenId,willMove:!!(targetScreenId && targetScreenId !== activeData.screenId)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F,J'})}).catch(()=>{});
        // #endregion

        if (targetScreenId && targetScreenId !== activeData.screenId) {
          const activeField = activeData.field as TemplateField;
          await moveFieldToScreen(activeField.id, activeData.screenId, targetScreenId);
        }
      }
    },
    [screens, onScreensReordered, onFieldsUpdated]
  );

  // Move field to a different screen
  const moveFieldToScreen = async (
    fieldId: string,
    fromScreenId: string,
    toScreenId: string
  ) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:258',message:'moveFieldToScreen called',data:{fieldId,fromScreenId,toScreenId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    try {
      const response = await fetch(`/api/admin/fields/${fieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId: toScreenId }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/259999bf-627f-43e4-8c10-ba206293d482',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'form-builder-dnd.tsx:268',message:'moveFieldToScreen response',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        throw new Error("Failed to move field");
      }

      await onFieldsUpdated();
      toast.success("Field moved to new screen");
    } catch (error) {
      console.error("Error moving field:", error);
      toast.error("Failed to move field");
    }
  };

  // Handle moving a field via dropdown menu
  const handleMoveField = async (field: TemplateField, targetScreenId: string) => {
    try {
      const response = await fetch(`/api/admin/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId: targetScreenId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to move field");
      }

      toast.success(`Field "${field.label}" moved successfully`);
      await onFieldsUpdated();
    } catch (error) {
      console.error("Error moving field:", error);
      toast.error(error instanceof Error ? error.message : "Failed to move field");
    }
  };

  // Handle adding a field via button
  const handleAddField = (screenId: string) => {
    setEditingScreenId(screenId);
    setEditingField(null);
    setPendingFieldType(null);
    setFieldEditorOpen(true);
  };

  // Handle editing a field
  const handleEditField = (field: TemplateField) => {
    const screen = screens.find((s) => s.fields.some((f) => f.id === field.id));
    if (screen) {
      setEditingScreenId(screen.id);
      setEditingField(field);
      setPendingFieldType(null);
      setFieldEditorOpen(true);
    }
  };

  // Handle deleting a field
  const handleDeleteField = (field: TemplateField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  // Handle field saved from editor
  const handleFieldSaved = async () => {
    setFieldEditorOpen(false);
    setEditingField(null);
    setEditingScreenId(null);
    setPendingFieldType(null);
    await onFieldsUpdated();
  };

  // Handle field deleted
  const handleFieldDeleted = async () => {
    if (deletingField) {
      await fetch(`/api/admin/fields/${deletingField.id}`, {
        method: "DELETE",
      });
      setDeleteDialogOpen(false);
      setDeletingField(null);
      await onFieldsUpdated();
      toast.success("Field deleted");
    }
  };

  // Custom collision detection that prefers screens over fields when dragging from palette
  const collisionDetection = useCallback(
    (args: Parameters<typeof closestCenter>[0]) => {
      // First, use pointer within for precision
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }

      // Fallback to rect intersection
      const rectCollisions = rectIntersection(args);
      if (rectCollisions.length > 0) {
        return rectCollisions;
      }

      // Final fallback to closest center
      return closestCenter(args);
    },
    []
  );

  // Get the selected screen
  const selectedScreen = screens.find((s) => s.id === selectedScreenId);

  // Get all screens for context
  const allScreensWithFields = screens;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        {/* Screen Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {selectedScreen ? (
            <>
              <DroppableScreen
                screen={selectedScreen}
                allScreens={allScreensWithFields}
                isSelected={true}
                onAddField={() => handleAddField(selectedScreen.id)}
                onEditField={handleEditField}
                onDeleteField={handleDeleteField}
                onMoveField={handleMoveField}
                onFieldsUpdated={onFieldsUpdated}
                isDraggingField={activeDragType === "field"}
                isDraggingPalette={activeDragType === "palette"}
              />
              <ScreenAIPrompt
                templateId={templateId}
                screen={selectedScreen}
                allScreens={allScreensWithFields}
                onSaved={onFieldsUpdated}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-[hsl(var(--globe-grey))] border-2 border-dashed border-[hsl(var(--border))] rounded-lg">
              <p className="text-sm">Select a screen to manage its fields</p>
            </div>
          )}
        </div>

        {/* Field Type Palette - Hidden when AI panel is open */}
        {!aiPanelOpen && (
          <div className="w-56 xl:w-64 shrink-0 overflow-y-auto max-h-[calc(100vh-16rem)] sticky top-4">
            <FieldTypePalette disabled={!selectedScreen} />
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragType === "field" && activeDragData?.field && (
          <FieldDragOverlay field={activeDragData.field} />
        )}
        {activeDragType === "palette" && activeDragData?.fieldType && activeDragData?.config && (
          <PaletteFieldDragOverlay
            fieldType={activeDragData.fieldType}
            label={activeDragData.config.label}
          />
        )}
      </DragOverlay>

      {/* Field Editor Dialog */}
      {editingScreenId && (
        <FieldEditor
          open={fieldEditorOpen}
          onOpenChange={setFieldEditorOpen}
          screenId={editingScreenId}
          field={editingField}
          onSaved={handleFieldSaved}
          currentScreen={screens.find((s) => s.id === editingScreenId)}
          allScreens={allScreensWithFields}
          // Pre-fill with pending field type defaults
          {...(pendingFieldType && !editingField
            ? {
                defaultType: pendingFieldType.value,
                defaultLabel: pendingFieldType.defaultValues?.label,
                defaultPlaceholder: pendingFieldType.defaultValues?.placeholder,
                defaultRequired: pendingFieldType.defaultValues?.required,
              }
            : {})}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Field"
        description={`Are you sure you want to delete the "${deletingField?.label}" field? This action cannot be undone.`}
        onConfirm={handleFieldDeleted}
      />
    </DndContext>
  );
}

