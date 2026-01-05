"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Sparkles,
  GitBranch,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { useBuilder, type ScreenWithFields } from "./typeform-builder";
import type { TemplateField, FieldType } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConditionEditor, type AvailableField } from "./condition-editor";
import type { ConditionGroup } from "@/lib/templates/conditions";

// Field type options
const fieldTypeOptions: {
  value: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "text", label: "Short Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "email", label: "Email", icon: Mail },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "select", label: "Dropdown", icon: List },
  { value: "multiselect", label: "Multiple Choice", icon: CheckSquare },
  { value: "checkbox", label: "Yes/No", icon: CheckSquare },
  { value: "address", label: "Address", icon: MapPin },
  { value: "party", label: "Party", icon: Building2 },
  { value: "currency", label: "Currency", icon: DollarSign },
  { value: "percentage", label: "Percentage", icon: Percent },
  { value: "url", label: "Website", icon: Link2 },
];

// Screen type options
const screenTypeOptions = [
  { value: "standard", label: "Standard", icon: FileText },
  { value: "dynamic", label: "Dynamic (AI)", icon: Sparkles },
  { value: "signatory", label: "Signatory", icon: Users },
];

interface PropertiesPanelProps {
  selectedScreen: ScreenWithFields | null;
  selectedField: TemplateField | null;
  allScreens: ScreenWithFields[];
}

export function PropertiesPanel({
  selectedScreen,
  selectedField,
  allScreens,
}: PropertiesPanelProps) {
  const { updateField, updateScreen, selection } = useBuilder();

  if (!selectedScreen) {
    return (
      <aside className="w-72 border-l border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4 shrink-0">
        <p className="text-sm text-[hsl(var(--globe-grey))] text-center mt-8">
          Select a screen or field to edit its properties
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l border-[hsl(var(--border))] bg-[hsl(var(--bg))] flex flex-col shrink-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedField ? (
          <FieldProperties
            key={selectedField.id}
            field={selectedField}
            screenId={selectedScreen.id}
            allScreens={allScreens}
          />
        ) : (
          <ScreenProperties
            key={selectedScreen.id}
            screen={selectedScreen}
          />
        )}
      </AnimatePresence>
    </aside>
  );
}

// Field properties component
function FieldProperties({
  field,
  screenId,
  allScreens,
}: {
  field: TemplateField;
  screenId: string;
  allScreens: ScreenWithFields[];
}) {
  const { updateField } = useBuilder();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [aiKeyInput, setAiKeyInput] = useState((field as any).aiSuggestionKey || "");
  const [conditions, setConditions] = useState<ConditionGroup | null>(() => {
    const fieldConditions = (field as any).conditions;
    if (fieldConditions) {
      try {
        return typeof fieldConditions === "string"
          ? JSON.parse(fieldConditions)
          : fieldConditions;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Update local state when field changes
  useEffect(() => {
    setAiKeyInput((field as any).aiSuggestionKey || "");
    const fieldConditions = (field as any).conditions;
    if (fieldConditions) {
      try {
        setConditions(
          typeof fieldConditions === "string"
            ? JSON.parse(fieldConditions)
            : fieldConditions
        );
      } catch {
        setConditions(null);
      }
    } else {
      setConditions(null);
    }
  }, [field.id]);

  // Compute available fields for conditions (fields from previous screens + earlier fields in current screen)
  const availableFieldsForConditions = useMemo<AvailableField[]>(() => {
    const result: AvailableField[] = [];
    const currentScreenIndex = allScreens.findIndex((s) => s.id === screenId);
    const currentScreen = allScreens[currentScreenIndex];
    const currentFieldIndex = currentScreen?.fields.findIndex(
      (f) => f.id === field.id
    );

    // Fields from all previous screens
    for (let i = 0; i < currentScreenIndex; i++) {
      const screen = allScreens[i];
      for (const f of screen.fields) {
        result.push({
          name: f.name,
          label: f.label,
          screenTitle: screen.title,
          type: f.type,
        });
      }
    }

    // Fields from current screen that come before this field
    if (currentScreen && currentFieldIndex !== undefined && currentFieldIndex > 0) {
      for (let i = 0; i < currentFieldIndex; i++) {
        const f = currentScreen.fields[i];
        result.push({
          name: f.name,
          label: f.label,
          screenTitle: currentScreen.title,
          type: f.type,
        });
      }
    }

    return result;
  }, [allScreens, screenId, field.id]);

  const selectedTypeOption = fieldTypeOptions.find((t) => t.value === field.type);
  const TypeIcon = selectedTypeOption?.icon || Type;

  const handleTypeChange = (newType: FieldType) => {
    updateField(field.id, { type: newType });
    setShowTypeSelector(false);
  };

  const addOption = () => {
    if (newOption.trim() && !field.options?.includes(newOption.trim())) {
      const updatedOptions = [...(field.options || []), newOption.trim()];
      updateField(field.id, { options: updatedOptions });
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = (field.options || []).filter((_, i) => i !== index);
    updateField(field.id, { options: updatedOptions });
  };

  const handleAiToggle = (checked: boolean) => {
    updateField(field.id, {
      aiSuggestionEnabled: checked,
      aiSuggestionKey: checked ? aiKeyInput || `AI${field.name}` : null,
    } as any);
    if (checked && !aiKeyInput) {
      setAiKeyInput(`AI${field.name}`);
    }
  };

  const handleAiKeyChange = (value: string) => {
    setAiKeyInput(value);
  };

  const handleAiKeyBlur = () => {
    if ((field as any).aiSuggestionEnabled && aiKeyInput) {
      updateField(field.id, { aiSuggestionKey: aiKeyInput } as any);
    }
  };

  const handleConditionsChange = (newConditions: ConditionGroup | null) => {
    setConditions(newConditions);
    updateField(field.id, {
      conditions: newConditions ? JSON.stringify(newConditions) : null,
    } as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <h3 className="font-semibold text-[hsl(var(--fg))]">Question</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Answer Type Selector */}
        <div className="space-y-2">
          <Label className="text-sm text-[hsl(var(--globe-grey))]">Answer</Label>
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center justify-between w-full p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
              <span className="text-sm font-medium">
                {selectedTypeOption?.label || field.type}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[hsl(var(--globe-grey))] transition-transform",
                showTypeSelector && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showTypeSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-1 p-2 mt-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                  {fieldTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = field.type === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleTypeChange(option.value)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                          isSelected
                            ? "bg-[hsl(var(--selise-blue))] text-white"
                            : "hover:bg-[hsl(var(--muted))]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField(field.id, { required: checked })
            }
          />
        </div>

        {/* Options for select/multiselect */}
        {(field.type === "select" || field.type === "multiselect") && (
          <div className="space-y-3">
            <Label className="text-sm">Options</Label>
            <div className="space-y-2">
              {(field.options || []).map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--muted))]/50"
                >
                  <span className="flex-1 text-sm truncate">{option}</span>
                  <button
                    onClick={() => removeOption(index)}
                    className="p-1 hover:bg-[hsl(var(--destructive))]/10 rounded"
                  >
                    <X className="h-3 w-3 text-[hsl(var(--destructive))]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
                className="flex-1"
              />
              <button
                onClick={addOption}
                disabled={!newOption.trim()}
                className="p-2 rounded-lg bg-[hsl(var(--selise-blue))] text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Placeholder */}
        {field.type !== "checkbox" && (
          <div className="space-y-2">
            <Label className="text-sm">Placeholder</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) =>
                updateField(field.id, { placeholder: e.target.value || undefined })
              }
              placeholder="Type your answer here..."
            />
          </div>
        )}

        {/* Advanced section */}
        <div className="border-t border-[hsl(var(--border))] pt-4">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[hsl(var(--fg))]">
                Advanced
              </span>
              {((field as any).aiSuggestionEnabled || conditions) && (
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--selise-blue))]" />
              )}
            </div>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
            )}
          </button>

          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {/* Field Name */}
                  <div className="space-y-2">
                    <Label className="text-sm">Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) =>
                        updateField(field.id, { name: e.target.value })
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-[hsl(var(--globe-grey))]">
                      Used as the key in form data
                    </p>
                  </div>

                  {/* AI Suggestions */}
                  <div className="space-y-3 p-3 rounded-lg bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                        <Label className="text-sm font-medium">AI Suggestions</Label>
                      </div>
                      <Switch
                        checked={(field as any).aiSuggestionEnabled || false}
                        onCheckedChange={handleAiToggle}
                      />
                    </div>
                    
                    <AnimatePresence>
                      {(field as any).aiSuggestionEnabled && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 pt-2">
                            <Label className="text-xs text-[hsl(var(--globe-grey))]">
                              AI Context Key
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={aiKeyInput}
                                onChange={(e) => handleAiKeyChange(e.target.value)}
                                onBlur={handleAiKeyBlur}
                                placeholder="e.g., companyName"
                                className="flex-1 font-mono text-sm"
                              />
                              <button
                                onClick={() => {
                                  const autoKey = `AI${field.name}`;
                                  setAiKeyInput(autoKey);
                                  updateField(field.id, { aiSuggestionKey: autoKey } as any);
                                }}
                                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--selise-blue))]"
                                title="Auto-generate key"
                              >
                                <Zap className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-[hsl(var(--globe-grey))]">
                              Maps to a value from AI enrichment context for auto-fill.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Conditional Logic */}
                  <ConditionEditor
                    value={conditions}
                    onChange={handleConditionsChange}
                    availableFields={availableFieldsForConditions}
                    label="Conditional Visibility"
                    description="Show this field only when specific conditions are met."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Screen properties component
function ScreenProperties({ screen }: { screen: ScreenWithFields }) {
  const { updateScreen, screens } = useBuilder();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [conditions, setConditions] = useState<ConditionGroup | null>(() => {
    const screenConditions = (screen as any).conditions;
    if (screenConditions) {
      try {
        return typeof screenConditions === "string"
          ? JSON.parse(screenConditions)
          : screenConditions;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Update conditions when screen changes
  useEffect(() => {
    const screenConditions = (screen as any).conditions;
    if (screenConditions) {
      try {
        setConditions(
          typeof screenConditions === "string"
            ? JSON.parse(screenConditions)
            : screenConditions
        );
      } catch {
        setConditions(null);
      }
    } else {
      setConditions(null);
    }
  }, [screen.id]);

  // Compute available fields for conditions (fields from all previous screens)
  const availableFieldsForConditions = useMemo<AvailableField[]>(() => {
    const result: AvailableField[] = [];
    const currentScreenIndex = screens.findIndex((s) => s.id === screen.id);

    for (let i = 0; i < currentScreenIndex; i++) {
      const s = screens[i];
      for (const f of s.fields) {
        result.push({
          name: f.name,
          label: f.label,
          screenTitle: s.title,
          type: f.type,
        });
      }
    }

    return result;
  }, [screens, screen.id]);

  const screenType = (screen as any).type || "standard";
  const selectedTypeOption = screenTypeOptions.find((t) => t.value === screenType);
  const TypeIcon = selectedTypeOption?.icon || FileText;

  const handleTypeChange = (newType: string) => {
    updateScreen(screen.id, { type: newType } as any);
    setShowTypeSelector(false);
  };

  const handleConditionsChange = (newConditions: ConditionGroup | null) => {
    setConditions(newConditions);
    updateScreen(screen.id, {
      conditions: newConditions ? JSON.stringify(newConditions) : null,
    } as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <h3 className="font-semibold text-[hsl(var(--fg))]">Screen</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Screen Type */}
        <div className="space-y-2">
          <Label className="text-sm text-[hsl(var(--globe-grey))]">Type</Label>
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center justify-between w-full p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
              <span className="text-sm font-medium">
                {selectedTypeOption?.label || screenType}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[hsl(var(--globe-grey))] transition-transform",
                showTypeSelector && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showTypeSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 p-2 mt-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                  {screenTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = screenType === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleTypeChange(option.value)}
                        className={cn(
                          "flex items-center gap-2 w-full p-2 rounded-lg text-left text-sm transition-colors",
                          isSelected
                            ? "bg-[hsl(var(--selise-blue))] text-white"
                            : "hover:bg-[hsl(var(--muted))]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Screen Title */}
        <div className="space-y-2">
          <Label className="text-sm">Title</Label>
          <Input
            value={screen.title}
            onChange={(e) => updateScreen(screen.id, { title: e.target.value })}
          />
        </div>

        {/* Screen Description */}
        <div className="space-y-2">
          <Label className="text-sm">Description</Label>
          <Input
            value={screen.description || ""}
            onChange={(e) =>
              updateScreen(screen.id, { description: e.target.value || undefined })
            }
            placeholder="Optional description..."
          />
        </div>

        {/* Screen stats */}
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/30 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--globe-grey))]">Fields</span>
            <span className="font-medium">{screen.fields.length}</span>
          </div>
        </div>

        {/* Conditional Logic */}
        {availableFieldsForConditions.length > 0 && (
          <div className="border-t border-[hsl(var(--border))] pt-4">
            <ConditionEditor
              value={conditions}
              onChange={handleConditionsChange}
              availableFields={availableFieldsForConditions}
              label="Screen Visibility"
              description="Show this screen only when specific conditions are met."
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

