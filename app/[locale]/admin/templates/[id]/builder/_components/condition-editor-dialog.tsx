"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GitBranch,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConditionGroup,
  ConditionRule,
  ConditionOperator,
} from "@/lib/templates/conditions";

// Available fields from previous screens
export interface AvailableField {
  name: string;
  label: string;
  screenTitle: string;
  type: string;
  options?: string[];
}

interface ConditionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Field or screen name/label */
  targetLabel: string;
  /** Index/number for display badge */
  targetIndex: number;
  /** Current condition group */
  conditions: ConditionGroup | null;
  /** Callback when conditions change */
  onConditionsChange: (conditions: ConditionGroup | null) => void;
  /** Available fields for condition rules */
  availableFields: AvailableField[];
}

const OPERATORS: {
  value: ConditionOperator;
  label: string;
  needsValue: boolean;
}[] = [
  { value: "equals", label: "is", needsValue: true },
  { value: "notEquals", label: "is not", needsValue: true },
  { value: "contains", label: "contains", needsValue: true },
  { value: "notContains", label: "does not contain", needsValue: true },
  { value: "isEmpty", label: "is empty", needsValue: false },
  { value: "isNotEmpty", label: "is not empty", needsValue: false },
  { value: "greaterThan", label: "is greater than", needsValue: true },
  { value: "lessThan", label: "is less than", needsValue: true },
  { value: "startsWith", label: "starts with", needsValue: true },
  { value: "endsWith", label: "ends with", needsValue: true },
];

export function ConditionEditorDialog({
  open,
  onOpenChange,
  targetLabel,
  targetIndex,
  conditions: initialConditions,
  onConditionsChange,
  availableFields,
}: ConditionEditorDialogProps) {
  // Local state for editing
  const [conditions, setConditions] = useState<ConditionGroup | null>(
    initialConditions
  );

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setConditions(initialConditions);
    }
  }, [open, initialConditions]);

  const hasConditions = conditions?.rules && conditions.rules.length > 0;

  const addRule = () => {
    const newRule: ConditionRule = {
      field: availableFields[0]?.name || "",
      operator: "equals",
      value: "",
    };

    if (!conditions) {
      setConditions({
        operator: "and",
        rules: [newRule],
      });
    } else {
      setConditions({
        ...conditions,
        rules: [...conditions.rules, newRule],
      });
    }
  };

  const updateRule = (index: number, updates: Partial<ConditionRule>) => {
    if (!conditions) return;

    const newRules = [...conditions.rules];
    newRules[index] = { ...newRules[index], ...updates };
    setConditions({ ...conditions, rules: newRules });
  };

  const removeRule = (index: number) => {
    if (!conditions) return;

    const newRules = conditions.rules.filter((_, i) => i !== index);
    if (newRules.length === 0) {
      setConditions(null);
    } else {
      setConditions({ ...conditions, rules: newRules });
    }
  };

  const clearAllRules = () => {
    setConditions(null);
  };

  const getOperatorNeedsValue = (op: ConditionOperator): boolean => {
    return OPERATORS.find((o) => o.value === op)?.needsValue ?? true;
  };

  const getFieldOptions = (fieldName: string): string[] | undefined => {
    return availableFields.find((f) => f.name === fieldName)?.options;
  };

  const handleSave = () => {
    onConditionsChange(conditions);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
              </button>
              <DialogTitle className="flex items-center gap-2 text-base font-medium">
                <GitBranch className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                Edit conditions for
                <Badge
                  variant="secondary"
                  className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-mono"
                >
                  #{targetIndex}
                </Badge>
              </DialogTitle>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <X className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Target Info */}
          <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-[hsl(var(--selise-blue))]/5 border-[hsl(var(--selise-blue))]/20 text-[hsl(var(--selise-blue))] font-mono"
              >
                #{targetIndex}
              </Badge>
              <span className="text-sm text-[hsl(var(--fg))] truncate">
                {targetLabel}
              </span>
            </div>
          </div>

          {/* Conditional Visibility Section */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Show this item only when specific conditions are met based on previous form responses.
            </p>

            {availableFields.length === 0 ? (
              <div className="p-4 bg-[hsl(var(--muted))]/30 rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-sm text-[hsl(var(--globe-grey))] text-center">
                  No fields available from previous screens.
                  <br />
                  Add fields to earlier screens to create conditions.
                </p>
              </div>
            ) : (
              <>
                {/* Rules List */}
                <AnimatePresence mode="popLayout">
                  {hasConditions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      {/* Logic Operator Toggle */}
                      {conditions!.rules.length > 1 && (
                        <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))]/30 rounded-lg">
                          <span className="text-xs text-[hsl(var(--globe-grey))]">
                            Match:
                          </span>
                          <div className="flex rounded-md overflow-hidden border border-[hsl(var(--border))]">
                            <button
                              type="button"
                              onClick={() =>
                                setConditions({ ...conditions!, operator: "and" })
                              }
                              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                conditions!.operator === "and"
                                  ? "bg-[hsl(var(--selise-blue))] text-white"
                                  : "bg-[hsl(var(--bg))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]"
                              }`}
                            >
                              ALL rules (AND)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConditions({ ...conditions!, operator: "or" })
                              }
                              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                conditions!.operator === "or"
                                  ? "bg-[hsl(var(--selise-blue))] text-white"
                                  : "bg-[hsl(var(--bg))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]"
                              }`}
                            >
                              ANY rule (OR)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Individual Rules */}
                      {conditions!.rules.map((rule, index) => {
                        const fieldOptions = getFieldOptions(rule.field);

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-[hsl(var(--bg))] rounded-xl border border-[hsl(var(--border))] shadow-sm"
                          >
                            {/* Rule Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase">
                                  {index === 0 ? "If" : conditions!.operator.toUpperCase()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRule(index)}
                                className="p-1.5 rounded-lg text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Rule Content */}
                            <div className="space-y-3">
                              {/* Field Select */}
                              <div className="flex items-center gap-2">
                                <Select
                                  value={rule.field}
                                  onValueChange={(val) =>
                                    updateRule(index, { field: val, value: "" })
                                  }
                                >
                                  <SelectTrigger className="flex-1 h-10">
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableFields.map((field) => (
                                      <SelectItem
                                        key={field.name}
                                        value={field.name}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>{field.label}</span>
                                          <span className="text-xs text-[hsl(var(--globe-grey))]">
                                            ({field.screenTitle})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Operator + Value Row */}
                              <div className="flex items-center gap-2">
                                <Select
                                  value={rule.operator}
                                  onValueChange={(val) =>
                                    updateRule(index, {
                                      operator: val as ConditionOperator,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-44 h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPERATORS.map((op) => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {getOperatorNeedsValue(rule.operator) && (
                                  <>
                                    {fieldOptions && fieldOptions.length > 0 ? (
                                      <Select
                                        value={String(rule.value || "")}
                                        onValueChange={(val) =>
                                          updateRule(index, { value: val })
                                        }
                                      >
                                        <SelectTrigger className="flex-1 h-10">
                                          <SelectValue placeholder="Select value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {fieldOptions.map((opt) => (
                                            <SelectItem key={opt} value={opt}>
                                              {opt}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        value={String(rule.value || "")}
                                        onChange={(e) =>
                                          updateRule(index, {
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder="Enter value"
                                        className="flex-1 h-10"
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Condition Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="flex items-center gap-2 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--selise-blue))]/10"
                >
                  <Plus className="h-4 w-4" />
                  Add condition
                </Button>

                {/* Preview */}
                {hasConditions && (
                  <div className="p-4 bg-[hsl(var(--selise-blue))]/5 rounded-lg border border-[hsl(var(--selise-blue))]/20">
                    <p className="text-xs font-medium text-[hsl(var(--selise-blue))] mb-2">
                      Visibility Rule Preview:
                    </p>
                    <p className="text-sm text-[hsl(var(--fg))]">
                      Show when{" "}
                      {conditions!.rules.map((rule, i) => {
                        const field = availableFields.find(
                          (f) => f.name === rule.field
                        );
                        const fieldLabel = field?.label || rule.field;
                        const opLabel =
                          OPERATORS.find((o) => o.value === rule.operator)
                            ?.label || rule.operator;
                        const needsValue = getOperatorNeedsValue(rule.operator);
                        const hasDisplayValue =
                          needsValue &&
                          rule.value !== undefined &&
                          rule.value !== null &&
                          rule.value !== "";

                        return (
                          <span key={i}>
                            {i > 0 && (
                              <span className="font-medium text-[hsl(var(--selise-blue))]">
                                {" "}
                                {conditions!.operator.toUpperCase()}{" "}
                              </span>
                            )}
                            <span className="font-medium">{fieldLabel}</span>{" "}
                            <span className="italic">{opLabel}</span>
                            {hasDisplayValue && (
                              <>
                                {" "}
                                <span className="font-medium">
                                  &quot;{String(rule.value)}&quot;
                                </span>
                              </>
                            )}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllRules}
              disabled={!hasConditions}
              className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all rules
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

