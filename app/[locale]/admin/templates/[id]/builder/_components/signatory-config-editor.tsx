"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Info,
  Sparkles,
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
  DEFAULT_PARTY_TYPES,
  SignatoryScreenConfig,
  PredefinedSignatory,
  AutoFillConfig,
  createPredefinedSignatory,
} from "@/lib/templates/signatory-config";

interface AvailableField {
  name: string;
  label: string;
  screenTitle: string;
  screenId: string;
  type: string;
}

interface AvailableContextKey {
  screenTitle: string;
  key: string;
  type: string;
  fullPath: string;
}

interface SignatoryConfigEditorProps {
  config: SignatoryScreenConfig;
  onChange: (config: SignatoryScreenConfig) => void;
  availableFields: AvailableField[];
  availableContextKeys?: AvailableContextKey[];
  readOnly?: boolean;
}

const AUTO_FILL_FIELDS = [
  { key: "name" as const, label: "Full Name", icon: User },
  { key: "email" as const, label: "Email Address", icon: Mail },
  { key: "title" as const, label: "Title / Role", icon: Briefcase },
  { key: "phone" as const, label: "Phone Number", icon: Phone },
  { key: "company" as const, label: "Company", icon: Building2 },
  { key: "address" as const, label: "Address", icon: MapPin },
];

export function SignatoryConfigEditor({
  config,
  onChange,
  availableFields,
  availableContextKeys = [],
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
    const defaultPartyType = DEFAULT_PARTY_TYPES[0]?.value || "other";
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

  return (
    <div className="space-y-4">
      {config.predefinedSignatories.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/5">
          <Info className="h-5 w-5 text-[hsl(var(--selise-blue))] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[hsl(var(--fg))]">
            <p className="font-medium mb-1">No signatory slots defined</p>
            <p className="text-[hsl(var(--globe-grey))]">
              Add signatory slots to define fixed parties for this document
              (e.g., &quot;Employer&quot; and &quot;Employee&quot;). Each slot can be pre-filled
              with data from previous form steps.
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
                  availableFields={availableFields}
                  availableContextKeys={availableContextKeys}
                  readOnly={readOnly}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPredefined}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Signatory Slot
        </Button>
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
  availableFields: AvailableField[];
  availableContextKeys?: AvailableContextKey[];
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
  availableFields,
  availableContextKeys = [],
  readOnly,
}: PredefinedSignatoryCardProps) {
  const partyLabel =
    DEFAULT_PARTY_TYPES.find((p) => p.value === predefined.partyType)?.label ||
    predefined.partyType;

  // Count auto-filled fields
  const autoFillCount = Object.values(predefined.autoFillFrom || {}).filter(Boolean).length;

  const handleAutoFillChange = (fieldKey: keyof AutoFillConfig, sourceField: string) => {
    const newAutoFill = { ...predefined.autoFillFrom };
    if (sourceField === "__none__") {
      delete newAutoFill[fieldKey];
    } else {
      newAutoFill[fieldKey] = sourceField;
    }
    onUpdate({ autoFillFrom: newAutoFill });
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
              {predefined.label || "Untitled"}
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
          {autoFillCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3 text-[hsl(var(--lime-green))]" />
              <span className="text-xs text-[hsl(var(--globe-grey))]">
                {autoFillCount} field{autoFillCount !== 1 ? "s" : ""} auto-filled
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
            <div className="px-4 pb-4 pt-2 border-t border-[hsl(var(--border))] space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Label *</Label>
                  <Input
                    value={predefined.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="e.g., Employer, Employee, Witness"
                    disabled={readOnly}
                  />
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Display name shown to the user
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Party Type *</Label>
                  <Input
                    value={predefined.partyType}
                    onChange={(e) => onUpdate({ partyType: e.target.value })}
                    placeholder="e.g., employer, employee, witness"
                    disabled={readOnly}
                  />
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Type the party type identifier (lowercase, no spaces)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={predefined.description || ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Optional description for the end user"
                  disabled={readOnly}
                />
              </div>

              {/* Required checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
                  checked={predefined.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  disabled={readOnly}
                />
                <span className="text-sm text-[hsl(var(--fg))]">Required signatory</span>
              </label>

              {/* Auto-fill Section */}
              {availableFields.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                    <Label className="text-sm font-medium">Auto-fill from Previous Steps</Label>
                  </div>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Optionally pre-fill fields with data from previous form steps
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {AUTO_FILL_FIELDS.map((field) => {
                      const Icon = field.icon;
                      const currentValue = predefined.autoFillFrom?.[field.key] || "";
                      
                      return (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-xs text-[hsl(var(--globe-grey))] flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {field.label}
                          </Label>
                          <Select
                            value={currentValue || "__none__"}
                            onValueChange={(value) => handleAutoFillChange(field.key, value)}
                            disabled={readOnly}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Manual entry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                <span className="text-[hsl(var(--globe-grey))]">Manual entry</span>
                              </SelectItem>
                              {availableFields.length > 0 && (
                                <>
                                  {availableFields.map((sourceField) => (
                                    <SelectItem key={sourceField.name} value={sourceField.name}>
                                      <div className="flex flex-col">
                                        <span>{sourceField.label}</span>
                                        <span className="text-xs text-[hsl(var(--globe-grey))]">
                                          {sourceField.screenTitle}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {availableContextKeys.length > 0 && (
                                <>
                                  {availableFields.length > 0 && (
                                    <div className="px-2 py-1.5 text-xs font-medium text-[hsl(var(--globe-grey))] border-t border-[hsl(var(--border))] mt-1">
                                      AI Enriched Context
                                    </div>
                                  )}
                                  {availableContextKeys.map((contextKey) => (
                                    <SelectItem key={contextKey.fullPath} value={contextKey.fullPath}>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-[hsl(var(--selise-blue))]" />
                                          <span>{contextKey.key}</span>
                                        </div>
                                        <span className="text-xs text-[hsl(var(--globe-grey))]">
                                          {contextKey.screenTitle} ({contextKey.type})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableFields.length === 0 && availableContextKeys.length === 0 && (
                <div className="p-3 rounded-lg bg-[hsl(var(--globe-grey))]/5 text-sm text-[hsl(var(--globe-grey))]">
                  <Info className="h-4 w-4 inline mr-2" />
                  No fields or AI enriched context available from previous screens. End users will fill in all information manually.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SignatoryConfigEditor;
