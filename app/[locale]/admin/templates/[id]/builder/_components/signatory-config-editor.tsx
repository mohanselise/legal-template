"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Link2,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Info,
  Sparkles,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_PARTY_TYPES,
  SignatoryScreenConfig,
  PredefinedSignatory,
  SignatoryFieldMapping,
  createPredefinedSignatory,
} from "@/lib/templates/signatory-config";

interface AvailableField {
  name: string;
  label: string;
  screenTitle: string;
  screenId: string;
  type: string;
}

// Helper to check if a string contains dynamic tags
const hasDynamicTags = (str: string) => /\{\{[^}]+\}\}/.test(str);

interface SignatoryConfigEditorProps {
  config: SignatoryScreenConfig;
  onChange: (config: SignatoryScreenConfig) => void;
  availableFields: AvailableField[];
  readOnly?: boolean;
}

const SIGNATORY_FIELDS = [
  { value: "name", label: "Full Name", icon: User },
  { value: "email", label: "Email Address", icon: Mail },
  { value: "title", label: "Title / Role", icon: Briefcase },
  { value: "phone", label: "Phone Number", icon: Phone },
  { value: "company", label: "Company / Organization", icon: Building2 },
  { value: "address", label: "Address", icon: MapPin },
] as const;

export function SignatoryConfigEditor({
  config,
  onChange,
  availableFields,
  readOnly = false,
}: SignatoryConfigEditorProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddPredefined = () => {
    const order = config.predefinedSignatories.length;
    const defaultPartyType = config.partyTypes[0]?.value || "other";
    const newPredefined = createPredefinedSignatory(
      defaultPartyType,
      `Signatory ${order + 1}`,
      order
    );
    onChange({
      ...config,
      predefinedSignatories: [...config.predefinedSignatories, newPredefined],
    });
    setExpandedCards((prev) => new Set([...prev, newPredefined.id]));
  };

  const handleRemovePredefined = (id: string) => {
    onChange({
      ...config,
      predefinedSignatories: config.predefinedSignatories
        .filter((p) => p.id !== id)
        .map((p, index) => ({ ...p, order: index })),
    });
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleUpdatePredefined = (
    id: string,
    updates: Partial<PredefinedSignatory>
  ) => {
    onChange({
      ...config,
      predefinedSignatories: config.predefinedSignatories.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  };

  const handleReorder = (newOrder: PredefinedSignatory[]) => {
    onChange({
      ...config,
      predefinedSignatories: newOrder.map((p, index) => ({
        ...p,
        order: index,
      })),
    });
  };

  const handleAddFieldMapping = (
    predefinedId: string,
    mapping: SignatoryFieldMapping
  ) => {
    const predefined = config.predefinedSignatories.find(
      (p) => p.id === predefinedId
    );
    if (!predefined) return;

    if (predefined.fieldMappings.some((m) => m.targetField === mapping.targetField)) {
      return;
    }

    handleUpdatePredefined(predefinedId, {
      fieldMappings: [...predefined.fieldMappings, mapping],
    });
  };

  const handleRemoveFieldMapping = (
    predefinedId: string,
    targetField: string
  ) => {
    const predefined = config.predefinedSignatories.find(
      (p) => p.id === predefinedId
    );
    if (!predefined) return;

    handleUpdatePredefined(predefinedId, {
      fieldMappings: predefined.fieldMappings.filter(
        (m) => m.targetField !== targetField
      ),
    });
  };

  const emailFields = useMemo(
    () => availableFields.filter((f) => f.type === "email" || f.name.toLowerCase().includes("email")),
    [availableFields]
  );
  const nameFields = useMemo(
    () => availableFields.filter((f) => f.name.toLowerCase().includes("name") && !f.name.toLowerCase().includes("company")),
    [availableFields]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[hsl(var(--fg))]">
            Pre-defined Signatories
          </h3>
          <p className="text-sm text-[hsl(var(--globe-grey))]">
            Configure fixed signatory slots with pre-filled data from previous steps
          </p>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPredefined}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Signatory
          </Button>
        )}
      </div>

      {config.predefinedSignatories.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/5">
          <Info className="h-5 w-5 text-[hsl(var(--selise-blue))] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[hsl(var(--fg))]">
            <p className="font-medium mb-1">No pre-defined signatories</p>
            <p className="text-[hsl(var(--globe-grey))]">
              Without pre-defined signatories, end users will be able to add any number
              of signatories dynamically. Add pre-defined signatories to create fixed
              slots (e.g., &quot;School Representative&quot; and &quot;Student&quot;) with data pre-filled
              from previous form steps.
            </p>
          </div>
        </div>
      )}

      {config.predefinedSignatories.length > 0 && (
        <Reorder.Group
          axis="y"
          values={config.predefinedSignatories}
          onReorder={handleReorder}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {config.predefinedSignatories.map((predefined, index) => (
              <Reorder.Item
                key={predefined.id}
                value={predefined}
                dragListener={!readOnly}
              >
                <PredefinedSignatoryCard
                  predefined={predefined}
                  index={index}
                  config={config}
                  isExpanded={expandedCards.has(predefined.id)}
                  onToggleExpand={() => toggleExpand(predefined.id)}
                  onUpdate={(updates) =>
                    handleUpdatePredefined(predefined.id, updates)
                  }
                  onRemove={() => handleRemovePredefined(predefined.id)}
                  onAddFieldMapping={(mapping) =>
                    handleAddFieldMapping(predefined.id, mapping)
                  }
                  onRemoveFieldMapping={(targetField) =>
                    handleRemoveFieldMapping(predefined.id, targetField)
                  }
                  availableFields={availableFields}
                  emailFields={emailFields}
                  nameFields={nameFields}
                  readOnly={readOnly}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {!readOnly && config.predefinedSignatories.length > 0 && (
        <motion.button
          type="button"
          onClick={handleAddPredefined}
          className="w-full py-4 border-2 border-dashed border-[hsl(var(--border))] rounded-xl text-[hsl(var(--globe-grey))] hover:border-[hsl(var(--selise-blue))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/5 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Plus className="h-5 w-5" />
          Add Another Signatory Slot
        </motion.button>
      )}
    </div>
  );
}

interface PredefinedSignatoryCardProps {
  predefined: PredefinedSignatory;
  index: number;
  config: SignatoryScreenConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<PredefinedSignatory>) => void;
  onRemove: () => void;
  onAddFieldMapping: (mapping: SignatoryFieldMapping) => void;
  onRemoveFieldMapping: (targetField: string) => void;
  availableFields: AvailableField[];
  emailFields: AvailableField[];
  nameFields: AvailableField[];
  readOnly: boolean;
}

function PredefinedSignatoryCard({
  predefined,
  index,
  config,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddFieldMapping,
  onRemoveFieldMapping,
  availableFields,
  readOnly,
}: PredefinedSignatoryCardProps) {
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [showLabelVariables, setShowLabelVariables] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  
  const partyLabel =
    config.partyTypes.find((p) => p.value === predefined.partyType)?.label ||
    predefined.partyType;

  const mappedFields = new Set(predefined.fieldMappings.map((m) => m.targetField));
  
  // Filter party type suggestions based on current input
  const partySuggestions = useMemo(() => {
    const input = predefined.partyType.toLowerCase();
    if (!input) return DEFAULT_PARTY_TYPES;
    return DEFAULT_PARTY_TYPES.filter(
      (p) => p.label.toLowerCase().includes(input) || p.value.toLowerCase().includes(input)
    );
  }, [predefined.partyType]);

  // Insert variable tag into label
  const insertLabelVariable = (varName: string) => {
    const currentLabel = predefined.label || "";
    onUpdate({ label: currentLabel + `{{${varName}}}` });
    setShowLabelVariables(false);
    labelInputRef.current?.focus();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl border border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--selise-blue))]/30 transition-all"
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {!readOnly && (
          <div className="cursor-grab active:cursor-grabbing text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]">
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        <div className="h-10 w-10 rounded-full bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-[hsl(var(--selise-blue))]">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[hsl(var(--fg))] truncate">
              {predefined.label}
            </span>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {partyLabel}
            </Badge>
            {predefined.required && (
              <Badge
                variant="secondary"
                className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
              >
                Required
              </Badge>
            )}
          </div>
          {predefined.fieldMappings.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3 text-[hsl(var(--lime-green))]" />
              <span className="text-xs text-[hsl(var(--globe-grey))]">
                {predefined.fieldMappings.length} field{predefined.fieldMappings.length !== 1 ? "s" : ""} pre-filled
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/10"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="text-[hsl(var(--globe-grey))]">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-[hsl(var(--border))] space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Label with dynamic tag support */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Label *</Label>
                    {availableFields.length > 0 && !readOnly && (
                      <Popover open={showLabelVariables} onOpenChange={setShowLabelVariables}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1 text-[hsl(var(--selise-blue))]"
                          >
                            <Tag className="h-3 w-3" />
                            Insert Variable
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="end">
                          <p className="text-xs text-[hsl(var(--globe-grey))] mb-2">
                            Click to insert a dynamic variable
                          </p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {availableFields.map((field) => (
                              <button
                                key={field.name}
                                type="button"
                                onClick={() => insertLabelVariable(field.name)}
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[hsl(var(--selise-blue))]/10 transition-colors"
                              >
                                <span className="font-medium">{field.label}</span>
                                <span className="text-xs text-[hsl(var(--globe-grey))] ml-1">
                                  ({field.screenTitle})
                                </span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <Input
                    ref={labelInputRef}
                    value={predefined.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="e.g., School Representative or {{companyName}} Rep"
                    disabled={readOnly}
                  />
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    {hasDynamicTags(predefined.label) ? (
                      <span className="text-[hsl(var(--selise-blue))]">
                        Contains dynamic tags - will be resolved from form data
                      </span>
                    ) : (
                      "Use {{variableName}} for dynamic labels from previous steps"
                    )}
                  </p>
                </div>

                {/* Party Type with custom input and suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Party Type *</Label>
                  <div className="relative">
                    <Input
                      value={predefined.partyType}
                      onChange={(e) => {
                        onUpdate({ partyType: e.target.value });
                        setShowPartySuggestions(true);
                      }}
                      onFocus={() => setShowPartySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowPartySuggestions(false), 200)}
                      placeholder="e.g., Student, Employer, Witness..."
                      disabled={readOnly}
                    />
                    {showPartySuggestions && partySuggestions.length > 0 && !readOnly && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[hsl(var(--border))] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {partySuggestions.map((party) => (
                          <button
                            key={party.value}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--selise-blue))]/10 transition-colors border-b last:border-b-0 border-[hsl(var(--border))]"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onUpdate({ partyType: party.value });
                              setShowPartySuggestions(false);
                            }}
                          >
                            <div className="font-medium text-sm">{party.label}</div>
                            <div className="text-xs text-[hsl(var(--globe-grey))]">{party.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Type a custom party type or select from suggestions
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={predefined.description || ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Optional description for the end user"
                  disabled={readOnly}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                    checked={predefined.required}
                    onChange={(e) => onUpdate({ required: e.target.checked })}
                    disabled={readOnly}
                  />
                  <span className="text-sm text-[hsl(var(--fg))]">Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                    checked={predefined.canRemove}
                    onChange={(e) => onUpdate({ canRemove: e.target.checked })}
                    disabled={readOnly}
                  />
                  <span className="text-sm text-[hsl(var(--fg))]">
                    User can remove
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                    checked={predefined.canChangePartyType}
                    onChange={(e) =>
                      onUpdate({ canChangePartyType: e.target.checked })
                    }
                    disabled={readOnly}
                  />
                  <span className="text-sm text-[hsl(var(--fg))]">
                    User can change party type
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                  <Label className="text-sm font-medium">Field Mappings</Label>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  Optionally pre-fill signatory fields with data from previous form steps.
                  Leave unmapped fields empty for end users to fill in manually.
                </p>

                {predefined.fieldMappings.length > 0 && (
                  <div className="space-y-2">
                    {predefined.fieldMappings.map((mapping) => {
                      const fieldDef = SIGNATORY_FIELDS.find(
                        (f) => f.value === mapping.targetField
                      );
                      const sourceField = availableFields.find(
                        (f) => f.name === mapping.sourceField
                      );
                      const Icon = fieldDef?.icon || User;

                      return (
                        <div
                          key={mapping.targetField}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--lime-green))]/5 border border-[hsl(var(--lime-green))]/20"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                            <span className="text-sm font-medium text-[hsl(var(--fg))]">
                              {fieldDef?.label}
                            </span>
                            <span className="text-[hsl(var(--globe-grey))]">←</span>
                            <Badge variant="secondary" className="text-xs">
                              {sourceField?.label || mapping.sourceField}
                            </Badge>
                            {sourceField && (
                              <span className="text-xs text-[hsl(var(--globe-grey))]">
                                ({sourceField.screenTitle})
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--crimson))]"
                              onClick={() =>
                                onRemoveFieldMapping(mapping.targetField)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!readOnly && availableFields.length > 0 && (
                  <FieldMappingAdder
                    mappedFields={mappedFields}
                    availableFields={availableFields}
                    onAdd={onAddFieldMapping}
                  />
                )}

                {availableFields.length === 0 && (
                  <div className="p-3 rounded-lg bg-[hsl(var(--globe-grey))]/5 text-sm text-[hsl(var(--globe-grey))]">
                    No fields available from previous screens for pre-filling.
                    End users will fill in all signatory information manually.
                  </div>
                )}

                {availableFields.length > 0 && predefined.fieldMappings.length === 0 && (
                  <div className="p-3 rounded-lg bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20 text-sm text-[hsl(var(--globe-grey))]">
                    <span className="text-[hsl(var(--selise-blue))] font-medium">No mappings configured.</span>{" "}
                    End users will fill in all fields for this signatory manually.
                    Add mappings above to pre-fill from previous steps.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FieldMappingAdderProps {
  mappedFields: Set<string>;
  availableFields: AvailableField[];
  onAdd: (mapping: SignatoryFieldMapping) => void;
}

function FieldMappingAdder({
  mappedFields,
  availableFields,
  onAdd,
}: FieldMappingAdderProps) {
  const [targetField, setTargetField] = useState<string>("");
  const [sourceField, setSourceField] = useState<string>("");

  const unmappedFields = SIGNATORY_FIELDS.filter(
    (f) => !mappedFields.has(f.value)
  );

  const handleAdd = () => {
    if (!targetField || !sourceField) return;

    onAdd({
      targetField: targetField as SignatoryFieldMapping["targetField"],
      sourceField,
    });

    setTargetField("");
    setSourceField("");
  };

  if (unmappedFields.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-[hsl(var(--lime-green))]/5 text-sm text-[hsl(var(--lime-green))]">
        All fields are mapped!
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 p-3 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-[hsl(var(--globe-grey))]">
          Signatory Field
        </Label>
        <Select value={targetField} onValueChange={setTargetField}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select field..." />
          </SelectTrigger>
          <SelectContent>
            {unmappedFields.map((field) => {
              const Icon = field.icon;
              return (
                <SelectItem key={field.value} value={field.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {field.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="text-[hsl(var(--globe-grey))] pb-2">←</div>

      <div className="flex-1 space-y-1">
        <Label className="text-xs text-[hsl(var(--globe-grey))]">
          Form Field (Source)
        </Label>
        <Select value={sourceField} onValueChange={setSourceField}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select source..." />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field.name} value={field.name}>
                <div className="flex flex-col">
                  <span>{field.label}</span>
                  <span className="text-xs text-[hsl(var(--globe-grey))]">
                    {field.screenTitle}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
        disabled={!targetField || !sourceField}
        className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default SignatoryConfigEditor;
