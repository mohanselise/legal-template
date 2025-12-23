"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Type, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import { SortableField } from "./sortable-field";
import { SignatoryInfoManager } from "./signatory-info-manager";

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface DroppableScreenProps {
  screen: ScreenWithFields;
  allScreens?: ScreenWithFields[];
  isSelected?: boolean;
  onSelect?: () => void;
  onAddField: () => void;
  onEditField: (field: TemplateField) => void;
  onDeleteField: (field: TemplateField) => void;
  onFieldsUpdated: () => void;
  isDraggingField?: boolean;
  isDraggingPalette?: boolean;
}

export function DroppableScreen({
  screen,
  allScreens = [],
  isSelected,
  onSelect,
  onAddField,
  onEditField,
  onDeleteField,
  onFieldsUpdated,
  isDraggingField,
  isDraggingPalette,
}: DroppableScreenProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `screen-${screen.id}`,
    data: {
      type: "screen",
      screenId: screen.id,
      screen,
    },
  });

  // Check if this is a signatory screen
  const isSignatoryScreen = (screen as any).type === "signatory";

  // Determine if we should show the drop indicator
  const showDropIndicator = (isDraggingField || isDraggingPalette) && !isSignatoryScreen;
  const isDropTarget = isOver && !isSignatoryScreen;

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "border-[hsl(var(--border))] transition-all duration-200",
        isSelected && "ring-2 ring-[hsl(var(--selise-blue))]/30",
        isDropTarget && "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5 shadow-lg",
        showDropIndicator && !isDropTarget && "border-dashed"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-[hsl(var(--fg))]">
                {screen.title}
              </CardTitle>
              {isSignatoryScreen && (
                <Badge variant="secondary" className="text-xs">
                  Signatory Screen
                </Badge>
              )}
              {(screen as any).type === "dynamic" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Dynamic
                </Badge>
              )}
            </div>
            {screen.description && (
              <CardDescription className="mt-1">
                {screen.description}
              </CardDescription>
            )}
          </div>
          {!isSignatoryScreen && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onAddField(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSignatoryScreen ? (
          <SignatoryInfoManager
            screen={screen}
            allScreens={allScreens}
            onConfigUpdated={onFieldsUpdated}
          />
        ) : screen.fields.length === 0 ? (
          <DropZonePlaceholder
            isOver={isDropTarget}
            isDragging={showDropIndicator}
            onAddField={onAddField}
          />
        ) : (
          <div className="space-y-2">
            <SortableContext
              items={screen.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {screen.fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  screenId={screen.id}
                  onEdit={onEditField}
                  onDelete={onDeleteField}
                  isDraggingOver={isDropTarget}
                />
              ))}
            </SortableContext>

            {/* Drop zone at the end of the list */}
            {showDropIndicator && (
              <div
                className={cn(
                  "flex items-center justify-center p-4 rounded-lg border-2 border-dashed transition-all",
                  isDropTarget
                    ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--globe-grey))]"
                )}
              >
                <span className="text-sm font-medium">
                  {isDropTarget ? "Drop here to add" : "Drop field here"}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DropZonePlaceholderProps {
  isOver: boolean;
  isDragging: boolean;
  onAddField: () => void;
}

function DropZonePlaceholder({ isOver, isDragging, onAddField }: DropZonePlaceholderProps) {
  return (
    <div
      className={cn(
        "text-center py-12 border-2 border-dashed rounded-lg transition-all",
        isOver
          ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10"
          : isDragging
          ? "border-[hsl(var(--selise-blue))]/50 bg-[hsl(var(--selise-blue))]/5"
          : "border-[hsl(var(--border))] text-[hsl(var(--globe-grey))]"
      )}
    >
      <Type
        className={cn(
          "h-10 w-10 mx-auto mb-3",
          isOver ? "text-[hsl(var(--selise-blue))]" : "opacity-50"
        )}
      />
      <p
        className={cn(
          "text-sm font-medium",
          isOver ? "text-[hsl(var(--selise-blue))]" : ""
        )}
      >
        {isOver ? "Drop to add field" : isDragging ? "Drop field here" : "No fields yet"}
      </p>
      {!isDragging && (
        <>
          <p className="text-xs mt-1 mb-4 text-[hsl(var(--globe-grey))]">
            Drag a field type from the palette or click the button below
          </p>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onAddField(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Field
          </Button>
        </>
      )}
    </div>
  );
}

