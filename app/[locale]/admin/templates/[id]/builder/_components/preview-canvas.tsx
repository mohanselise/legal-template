"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
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
  ChevronUp,
  ChevronDown,
  FileText,
} from "lucide-react";
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

interface PreviewCanvasProps {
  selectedScreen: ScreenWithFields | null;
  selectedField: TemplateField | null;
}

export function PreviewCanvas({
  selectedScreen,
  selectedField,
}: PreviewCanvasProps) {
  const { selection, setSelection, updateField, updateScreen, screens } = useBuilder();
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [labelValue, setLabelValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // Sync values with selected item
  useEffect(() => {
    if (selectedField) {
      setLabelValue(selectedField.label);
      setDescriptionValue(selectedField.helpText || "");
    } else if (selectedScreen) {
      setLabelValue(selectedScreen.title);
      setDescriptionValue(selectedScreen.description || "");
    }
  }, [selectedField, selectedScreen]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [editingLabel]);

  useEffect(() => {
    if (editingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingDescription]);

  const handleLabelSave = () => {
    setEditingLabel(false);
    if (selectedField && labelValue !== selectedField.label) {
      updateField(selectedField.id, { label: labelValue });
    } else if (selectedScreen && !selectedField && labelValue !== selectedScreen.title) {
      updateScreen(selectedScreen.id, { title: labelValue });
    }
  };

  const handleDescriptionSave = () => {
    setEditingDescription(false);
    if (selectedField && descriptionValue !== (selectedField.helpText || "")) {
      updateField(selectedField.id, { helpText: descriptionValue || undefined });
    } else if (selectedScreen && !selectedField && descriptionValue !== (selectedScreen.description || "")) {
      updateScreen(selectedScreen.id, { description: descriptionValue || undefined });
    }
  };

  // Navigation between items
  const navigatePrev = () => {
    if (!selectedScreen) return;
    
    if (selectedField) {
      const fieldIndex = selectedScreen.fields.findIndex(f => f.id === selectedField.id);
      if (fieldIndex > 0) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[fieldIndex - 1].id,
        });
      } else {
        // Go to screen
        setSelection({
          type: "screen",
          screenId: selectedScreen.id,
          fieldId: null,
        });
      }
    } else {
      // At screen level, go to previous screen's last field or the screen itself
      const screenIndex = screens.findIndex(s => s.id === selectedScreen.id);
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
      const fieldIndex = selectedScreen.fields.findIndex(f => f.id === selectedField.id);
      if (fieldIndex < selectedScreen.fields.length - 1) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[fieldIndex + 1].id,
        });
      } else {
        // Go to next screen
        const screenIndex = screens.findIndex(s => s.id === selectedScreen.id);
        if (screenIndex < screens.length - 1) {
          setSelection({
            type: "screen",
            screenId: screens[screenIndex + 1].id,
            fieldId: null,
          });
        }
      }
    } else {
      // At screen level, go to first field or next screen
      if (selectedScreen.fields.length > 0) {
        setSelection({
          type: "field",
          screenId: selectedScreen.id,
          fieldId: selectedScreen.fields[0].id,
        });
      } else {
        const screenIndex = screens.findIndex(s => s.id === selectedScreen.id);
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

  // Get current position for display
  const getCurrentPosition = () => {
    if (!selectedScreen) return null;
    const screenIndex = screens.findIndex(s => s.id === selectedScreen.id);
    if (selectedField) {
      const fieldIndex = selectedScreen.fields.findIndex(f => f.id === selectedField.id);
      return `${screenIndex + 1}.${fieldIndex + 1}`;
    }
    return `${screenIndex + 1}`;
  };

  const FieldIcon = selectedField 
    ? fieldTypeIcons[selectedField.type] || Type 
    : FileText;

  if (!selectedScreen) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[hsl(var(--bg))] to-[hsl(var(--muted))]/30">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--globe-grey))] opacity-30" />
          <p className="text-lg text-[hsl(var(--globe-grey))]">
            Select or create a screen to get started
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-gradient-to-b from-[hsl(var(--bg))] to-[hsl(var(--muted))]/20 overflow-hidden">
      {/* Canvas content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          key={selectedField?.id || selectedScreen.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl"
        >
          {/* Position indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 text-[hsl(var(--selise-blue))]">
              <span className="text-lg font-semibold">{getCurrentPosition()}</span>
              <span className="text-[hsl(var(--globe-grey))]">→</span>
            </div>
          </div>

          {/* Question / Title - Inline editable */}
          <div className="mb-4">
            {editingLabel ? (
              <input
                ref={labelInputRef}
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={handleLabelSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLabelSave();
                  if (e.key === "Escape") {
                    setEditingLabel(false);
                    setLabelValue(selectedField?.label || selectedScreen.title);
                  }
                }}
                className="w-full text-3xl font-semibold text-[hsl(var(--fg))] bg-transparent border-none outline-none focus:ring-0 placeholder:text-[hsl(var(--globe-grey))]/50"
                placeholder={selectedField ? "Your question here" : "Screen title"}
              />
            ) : (
              <h1
                onClick={() => setEditingLabel(true)}
                className="text-3xl font-semibold text-[hsl(var(--fg))] cursor-text hover:bg-[hsl(var(--muted))]/50 rounded-lg px-2 -mx-2 py-1 transition-colors"
              >
                {labelValue || (selectedField ? "Your question here" : "Screen title")}
                {selectedField?.required && (
                  <span className="text-[hsl(var(--destructive))] ml-1">*</span>
                )}
              </h1>
            )}
          </div>

          {/* Description - Inline editable */}
          <div className="mb-8">
            {editingDescription ? (
              <input
                ref={descriptionInputRef}
                type="text"
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDescriptionSave();
                  if (e.key === "Escape") {
                    setEditingDescription(false);
                    setDescriptionValue(selectedField?.helpText || selectedScreen.description || "");
                  }
                }}
                className="w-full text-lg text-[hsl(var(--globe-grey))] bg-transparent border-none outline-none focus:ring-0 placeholder:text-[hsl(var(--globe-grey))]/50"
                placeholder="Description (optional)"
              />
            ) : (
              <p
                onClick={() => setEditingDescription(true)}
                className={cn(
                  "text-lg cursor-text hover:bg-[hsl(var(--muted))]/50 rounded-lg px-2 -mx-2 py-1 transition-colors",
                  descriptionValue
                    ? "text-[hsl(var(--globe-grey))]"
                    : "text-[hsl(var(--globe-grey))]/50 italic"
                )}
              >
                {descriptionValue || "Description (optional)"}
              </p>
            )}
          </div>

          {/* Field preview */}
          {selectedField && (
            <div className="mt-8">
              <FieldPreview field={selectedField} />
            </div>
          )}

          {/* Screen fields list when screen is selected */}
          {!selectedField && selectedScreen.fields.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="text-sm text-[hsl(var(--globe-grey))] mb-4">
                Fields in this screen:
              </p>
              {selectedScreen.fields.map((field, index) => {
                const Icon = fieldTypeIcons[field.type] || Type;
                return (
                  <button
                    key={field.id}
                    onClick={() =>
                      setSelection({
                        type: "field",
                        screenId: selectedScreen.id,
                        fieldId: field.id,
                      })
                    }
                    className="flex items-center gap-3 w-full p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/50 hover:bg-[hsl(var(--selise-blue))]/5 transition-all text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[hsl(var(--fg))] truncate">
                        {field.label}
                      </p>
                      <p className="text-sm text-[hsl(var(--globe-grey))] truncate">
                        {field.type} {field.required && "• Required"}
                      </p>
                    </div>
                    <span className="text-sm text-[hsl(var(--globe-grey))]">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-[hsl(var(--border))]">
        <button
          onClick={navigatePrev}
          className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={navigateNext}
          className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </main>
  );
}

// Field preview component
function FieldPreview({ field }: { field: TemplateField }) {
  const placeholder = field.placeholder || `Type your answer here...`;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          placeholder={placeholder}
          disabled
          className="w-full h-32 px-4 py-3 text-lg border-b-2 border-[hsl(var(--border))] bg-transparent resize-none placeholder:text-[hsl(var(--globe-grey))]/50 focus:outline-none"
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="h-6 w-6 rounded border-2 border-[hsl(var(--border))]" />
          <span className="text-lg text-[hsl(var(--fg))]">Yes</span>
        </label>
      );

    case "select":
    case "multiselect":
      return (
        <div className="space-y-2">
          {(field.options || []).length > 0 ? (
            field.options?.map((option, i) => (
              <button
                key={i}
                className="flex items-center gap-3 w-full p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))] transition-colors text-left"
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 border-[hsl(var(--border))]",
                    field.type === "multiselect" && "rounded"
                  )}
                />
                <span className="text-[hsl(var(--fg))]">{option}</span>
              </button>
            ))
          ) : (
            <p className="text-[hsl(var(--globe-grey))] italic">
              No options configured
            </p>
          )}
        </div>
      );

    case "date":
      return (
        <input
          type="text"
          placeholder="MM / DD / YYYY"
          disabled
          className="w-full text-lg border-b-2 border-[hsl(var(--border))] bg-transparent py-2 placeholder:text-[hsl(var(--globe-grey))]/50 focus:outline-none"
        />
      );

    case "number":
    case "percentage":
    case "currency":
      return (
        <div className="flex items-center gap-2">
          {field.type === "currency" && (
            <span className="text-lg text-[hsl(var(--globe-grey))]">$</span>
          )}
          <input
            type="text"
            placeholder={placeholder}
            disabled
            className="flex-1 text-lg border-b-2 border-[hsl(var(--border))] bg-transparent py-2 placeholder:text-[hsl(var(--globe-grey))]/50 focus:outline-none"
          />
          {field.type === "percentage" && (
            <span className="text-lg text-[hsl(var(--globe-grey))]">%</span>
          )}
        </div>
      );

    default:
      return (
        <input
          type="text"
          placeholder={placeholder}
          disabled
          className="w-full text-lg border-b-2 border-[hsl(var(--border))] bg-transparent py-2 placeholder:text-[hsl(var(--globe-grey))]/50 focus:outline-none"
        />
      );
  }
}

