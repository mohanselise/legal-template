"use client";

import { useState } from "react";
import { Plus, Trash2, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
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
import type { ConditionGroup, ConditionRule, ConditionOperator } from "@/lib/templates/conditions";

// Available fields from previous screens
export interface AvailableField {
  name: string;
  label: string;
  screenTitle: string;
  type: string;
}

interface ConditionEditorProps {
  value: ConditionGroup | null;
  onChange: (conditions: ConditionGroup | null) => void;
  availableFields: AvailableField[];
  label?: string;
  description?: string;
}

const OPERATORS: { value: ConditionOperator; label: string; needsValue: boolean }[] = [
  { value: "equals", label: "Equals", needsValue: true },
  { value: "notEquals", label: "Not equals", needsValue: true },
  { value: "contains", label: "Contains", needsValue: true },
  { value: "notContains", label: "Does not contain", needsValue: true },
  { value: "isEmpty", label: "Is empty", needsValue: false },
  { value: "isNotEmpty", label: "Is not empty", needsValue: false },
  { value: "greaterThan", label: "Greater than", needsValue: true },
  { value: "lessThan", label: "Less than", needsValue: true },
  { value: "startsWith", label: "Starts with", needsValue: true },
  { value: "endsWith", label: "Ends with", needsValue: true },
];

export function ConditionEditor({
  value,
  onChange,
  availableFields,
  label = "Conditional Visibility",
  description = "Show this item only when specific conditions are met based on previous form responses.",
}: ConditionEditorProps) {
  const [expanded, setExpanded] = useState(!!value?.rules?.length);

  const hasConditions = value?.rules && value.rules.length > 0;

  const addRule = () => {
    const newRule: ConditionRule = {
      field: availableFields[0]?.name || "",
      operator: "equals",
      value: "",
    };

    if (!value) {
      onChange({
        operator: "and",
        rules: [newRule],
      });
    } else {
      onChange({
        ...value,
        rules: [...value.rules, newRule],
      });
    }
    setExpanded(true);
  };

  const updateRule = (index: number, updates: Partial<ConditionRule>) => {
    if (!value) return;

    const newRules = [...value.rules];
    newRules[index] = { ...newRules[index], ...updates };
    onChange({ ...value, rules: newRules });
  };

  const removeRule = (index: number) => {
    if (!value) return;

    const newRules = value.rules.filter((_, i) => i !== index);
    if (newRules.length === 0) {
      onChange(null);
    } else {
      onChange({ ...value, rules: newRules });
    }
  };

  const toggleOperator = () => {
    if (!value) return;
    onChange({
      ...value,
      operator: value.operator === "and" ? "or" : "and",
    });
  };

  const clearConditions = () => {
    onChange(null);
    setExpanded(false);
  };

  // Get operator info
  const getOperatorNeedsValue = (op: ConditionOperator): boolean => {
    return OPERATORS.find((o) => o.value === op)?.needsValue ?? true;
  };

  return (
    <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-[hsl(var(--muted))]/30 hover:bg-[hsl(var(--muted))]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
          <span className="font-medium text-sm text-[hsl(var(--fg))]">
            {label}
          </span>
          {hasConditions && (
            <Badge
              variant="secondary"
              className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
            >
              {value!.rules.length} rule{value!.rules.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--globe-grey))]">{description}</p>

          {availableFields.length === 0 ? (
            <div className="p-3 bg-[hsl(var(--muted))]/30 rounded-lg border border-dashed border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--globe-grey))] text-center">
                No fields available from previous screens. Add fields to earlier screens first.
              </p>
            </div>
          ) : (
            <>
              {/* Rules List */}
              {hasConditions && (
                <div className="space-y-3">
                  {/* Logic Operator Toggle */}
                  {value!.rules.length > 1 && (
                    <div className="flex items-center gap-2 pb-2">
                      <span className="text-xs text-[hsl(var(--globe-grey))]">
                        Match:
                      </span>
                      <button
                        type="button"
                        onClick={toggleOperator}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          value!.operator === "and"
                            ? "bg-[hsl(var(--selise-blue))] text-white"
                            : "bg-[hsl(var(--muted))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]/80"
                        }`}
                      >
                        ALL rules (AND)
                      </button>
                      <button
                        type="button"
                        onClick={toggleOperator}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          value!.operator === "or"
                            ? "bg-[hsl(var(--selise-blue))] text-white"
                            : "bg-[hsl(var(--muted))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]/80"
                        }`}
                      >
                        ANY rule (OR)
                      </button>
                    </div>
                  )}

                  {/* Individual Rules */}
                  {value!.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-start gap-2 p-3 bg-[hsl(var(--bg))] rounded-lg border border-[hsl(var(--border))]"
                    >
                      {/* Row indicator for multiple rules */}
                      {value!.rules.length > 1 && (
                        <div className="flex items-center gap-1 w-full mb-2">
                          <span className="text-[10px] font-medium text-[hsl(var(--globe-grey))] uppercase">
                            Rule {index + 1}
                          </span>
                          {index > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {value!.operator.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Field Select */}
                      <div className="flex-1 min-w-[140px]">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                          Field
                        </Label>
                        <Select
                          value={rule.field}
                          onValueChange={(val) => updateRule(index, { field: val })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                <span className="truncate">{field.label}</span>
                                <span className="ml-1 text-xs text-[hsl(var(--globe-grey))]">
                                  ({field.screenTitle})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator Select */}
                      <div className="flex-1 min-w-[130px]">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                          Operator
                        </Label>
                        <Select
                          value={rule.operator}
                          onValueChange={(val) =>
                            updateRule(index, { operator: val as ConditionOperator })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
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
                      </div>

                      {/* Value Input (conditional) */}
                      {getOperatorNeedsValue(rule.operator) && (
                        <div className="flex-1 min-w-[120px]">
                          <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                            Value
                          </Label>
                          <Input
                            value={String(rule.value || "")}
                            onChange={(e) =>
                              updateRule(index, { value: e.target.value })
                            }
                            placeholder="Expected value"
                            className="h-9 text-sm"
                          />
                        </div>
                      )}

                      {/* Delete Button */}
                      <div className="pt-5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="h-9 w-9 p-0 text-[hsl(var(--globe-grey))] hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Rule / Clear Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="flex items-center gap-1.5 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--selise-blue))]/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Rule
                </Button>
                {hasConditions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearConditions}
                    className="text-[hsl(var(--globe-grey))] hover:text-destructive"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Preview */}
              {hasConditions && (
                <div className="p-3 bg-[hsl(var(--selise-blue))]/5 rounded-lg border border-[hsl(var(--selise-blue))]/20">
                  <p className="text-xs font-medium text-[hsl(var(--selise-blue))] mb-1">
                    Visibility Rule Preview:
                  </p>
                  <p className="text-xs text-[hsl(var(--fg))]">
                    Show when{" "}
                    {value!.rules.map((rule, i) => {
                      const field = availableFields.find((f) => f.name === rule.field);
                      const fieldLabel = field?.label || rule.field;
                      const opLabel = OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator;
                      const needsValue = getOperatorNeedsValue(rule.operator);

                      return (
                        <span key={i}>
                          {i > 0 && (
                            <span className="font-medium text-[hsl(var(--selise-blue))]">
                              {" "}
                              {value!.operator.toUpperCase()}{" "}
                            </span>
                          )}
                          <span className="font-medium">{fieldLabel}</span>{" "}
                          <span className="italic">{opLabel.toLowerCase()}</span>
                          {needsValue && rule.value && (
                            <>
                              {" "}
                              <span className="font-medium">&quot;{String(rule.value)}&quot;</span>
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
      )}
    </div>
  );
}
