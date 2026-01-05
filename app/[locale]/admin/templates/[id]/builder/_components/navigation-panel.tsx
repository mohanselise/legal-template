"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Type,
  Mail,
  Calendar,
  Hash,
  CheckSquare,
  List,
  AlignLeft,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Percent,
  Link2,
  FileText,
  Sparkles,
  Users,
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
import { useBuilder, type ScreenWithFields } from "./typeform-builder";
import type { TemplateField } from "@/lib/db";
import { cn } from "@/lib/utils";

// Field type icons
const fieldTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  email: Mail,
  date: Calendar,
  number: Hash,
  checkbox: CheckSquare,
  select: List,
  multiselect: List,
  textarea: AlignLeft,
  phone: Phone,
  address: MapPin,
  party: Building2,
  currency: DollarSign,
  percentage: Percent,
  url: Link2,
};

// Screen type icons
const screenTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  standard: FileText,
  dynamic: Sparkles,
  signatory: Users,
};

interface SortableFieldItemProps {
  field: TemplateField;
  screenId: string;
  isSelected: boolean;
}

function SortableFieldItem({ field, screenId, isSelected }: SortableFieldItemProps) {
  const { setSelection, deleteField } = useBuilder();
  const Icon = fieldTypeIcons[field.type] || Type;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ml-6",
        isSelected
          ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
          : "hover:bg-[hsl(var(--muted))]"
      )}
      onClick={() =>
        setSelection({ type: "field", screenId, fieldId: field.id })
      }
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
      </div>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm truncate flex-1">{field.label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteField(field.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[hsl(var(--destructive))]/10 rounded transition-all"
      >
        <Trash2 className="h-3 w-3 text-[hsl(var(--destructive))]" />
      </button>
    </div>
  );
}

interface SortableScreenItemProps {
  screen: ScreenWithFields;
  index: number;
}

function SortableScreenItem({ screen, index }: SortableScreenItemProps) {
  const {
    selection,
    setSelection,
    deleteScreen,
    addField,
    reorderFields,
  } = useBuilder();
  const [expanded, setExpanded] = useState(true);

  const isScreenSelected =
    selection.type === "screen" && selection.screenId === screen.id;
  const hasSelectedField =
    selection.screenId === screen.id && selection.type === "field";

  const ScreenIcon = screenTypeIcons[(screen as any).type || "standard"] || FileText;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = screen.fields.findIndex((f) => f.id === active.id);
    const newIndex = screen.fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(
      screen.fields.map((f) => f.id),
      oldIndex,
      newIndex
    );
    reorderFields(screen.id, newOrder);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      {/* Screen header */}
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-all",
          isScreenSelected || hasSelectedField
            ? "bg-[hsl(var(--selise-blue))]/5"
            : "hover:bg-[hsl(var(--muted))]"
        )}
        onClick={() =>
          setSelection({ type: "screen", screenId: screen.id, fieldId: null })
        }
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5 hover:bg-[hsl(var(--muted))] rounded"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
          )}
        </button>
        <div
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded text-xs font-medium",
            isScreenSelected
              ? "bg-[hsl(var(--selise-blue))] text-white"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--globe-grey))]"
          )}
        >
          {index + 1}
        </div>
        <span
          className={cn(
            "text-sm font-medium truncate flex-1",
            isScreenSelected
              ? "text-[hsl(var(--selise-blue))]"
              : "text-[hsl(var(--fg))]"
          )}
        >
          {screen.title}
        </span>
        <ScreenIcon className="h-4 w-4 text-[hsl(var(--globe-grey))] opacity-0 group-hover:opacity-100" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteScreen(screen.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[hsl(var(--destructive))]/10 rounded transition-all"
        >
          <Trash2 className="h-3 w-3 text-[hsl(var(--destructive))]" />
        </button>
      </div>

      {/* Fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext
                items={screen.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="py-1 space-y-0.5">
                  {screen.fields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      screenId={screen.id}
                      isSelected={selection.fieldId === field.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add field button */}
            <button
              onClick={() => addField(screen.id)}
              className="flex items-center gap-2 px-3 py-2 ml-6 text-sm text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/5 rounded-lg transition-colors w-[calc(100%-1.5rem)]"
            >
              <Plus className="h-4 w-4" />
              <span>Add field</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavigationPanel() {
  const { screens, addScreen, reorderScreens } = useBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleScreenDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = screens.findIndex((s) => s.id === active.id);
    const newIndex = screens.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(
      screens.map((s) => s.id),
      oldIndex,
      newIndex
    );
    reorderScreens(newOrder);
  };

  return (
    <aside className="w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--bg))] flex flex-col shrink-0">
      {/* Add content button */}
      <div className="p-3 border-b border-[hsl(var(--border))]">
        <button
          onClick={addScreen}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--selise-blue))] text-white font-medium text-sm hover:bg-[hsl(var(--oxford-blue))] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add content
        </button>
      </div>

      {/* Screen list */}
      <div className="flex-1 overflow-y-auto p-2">
        {screens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-[hsl(var(--globe-grey))] opacity-50 mb-3" />
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              No screens yet
            </p>
            <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
              Click "Add content" to get started
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleScreenDragEnd}
          >
            <SortableContext
              items={screens.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {screens.map((screen, index) => (
                  <SortableScreenItem key={screen.id} screen={screen} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}

