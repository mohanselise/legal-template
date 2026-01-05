"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wand2,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Code,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TemplateField } from "@/lib/db";
import { SchemaBuilder } from "./schema-builder";

// Interface for context variable from previous screens
interface ContextVariable {
  screenTitle: string;
  fieldName: string;
  fieldType: string;
  variableSyntax: string;
  source: "field" | "enrichment";
}

// Interface for subsequent screen (for schema builder)
interface SubsequentScreen {
  id: string;
  title: string;
  order: number;
  fields: Array<{
    id: string;
    name: string;
    label: string;
    type: TemplateField["type"];
    options?: string[];
    aiSuggestionEnabled?: boolean;
  }>;
}

interface ScreenWithFields {
  id: string;
  title: string;
  order: number;
  aiPrompt?: string | null;
  aiOutputSchema?: string | null;
  fields: TemplateField[];
}

interface AIEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screen: ScreenWithFields;
  screenIndex: number;
  allScreens: ScreenWithFields[];
  onSave: (aiPrompt: string | null, aiOutputSchema: string | null) => void;
}

export function AIEnrichmentDialog({
  open,
  onOpenChange,
  screen,
  screenIndex,
  allScreens,
  onSave,
}: AIEnrichmentDialogProps) {
  // Local state
  const [enabled, setEnabled] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [schema, setSchema] = useState("");
  const [showFormFields, setShowFormFields] = useState(false);
  const [showPreviousContext, setShowPreviousContext] = useState(false);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      const hasEnrichment = Boolean(screen.aiPrompt?.trim() || screen.aiOutputSchema?.trim());
      setEnabled(hasEnrichment);
      setPrompt(screen.aiPrompt || "");
      setSchema(screen.aiOutputSchema || "");
    }
  }, [open, screen.aiPrompt, screen.aiOutputSchema]);

  // Compute available context variables from current screen fields
  const currentScreenFields = useMemo<ContextVariable[]>(() => {
    return screen.fields.map((field) => ({
      screenTitle: screen.title,
      fieldName: field.name,
      fieldType: field.type,
      variableSyntax: `{{${field.name}}}`,
      source: "field" as const,
    }));
  }, [screen.fields, screen.title]);

  // Compute form fields from previous screens
  const previousFormFields = useMemo<ContextVariable[]>(() => {
    const variables: ContextVariable[] = [];
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      prevScreen.fields.forEach((field) => {
        variables.push({
          screenTitle: prevScreen.title,
          fieldName: field.name,
          fieldType: field.type,
          variableSyntax: `{{${field.name}}}`,
          source: "field",
        });
      });
    });

    return variables;
  }, [allScreens, screen.order]);

  // Compute AI context from previous screens' output schemas
  const previousContextVariables = useMemo<ContextVariable[]>(() => {
    const variables: ContextVariable[] = [];
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      const schemaStr = prevScreen.aiOutputSchema;
      if (!schemaStr) return;

      try {
        const parsedSchema = JSON.parse(schemaStr);
        if (parsedSchema.type === "object" && parsedSchema.properties) {
          Object.entries(parsedSchema.properties).forEach(([key, value]: [string, any]) => {
            variables.push({
              screenTitle: prevScreen.title,
              fieldName: key,
              fieldType: value.type || "unknown",
              variableSyntax: `{{${key}}}`,
              source: "enrichment",
            });
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    return variables;
  }, [allScreens, screen.order]);

  // Compute subsequent screens for schema builder
  const subsequentScreens = useMemo<SubsequentScreen[]>(() => {
    return allScreens
      .filter((s) => s.order > screen.order && s.fields.length > 0)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        fields: s.fields.map((field) => ({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.type,
          options: field.options && field.options.length > 0 ? field.options : undefined,
          aiSuggestionEnabled: field.aiSuggestionEnabled ?? false,
        })),
      }));
  }, [allScreens, screen.order]);

  const handleSave = () => {
    if (enabled) {
      onSave(prompt.trim() || null, schema.trim() || null);
    } else {
      onSave(null, null);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const copyVariable = async (variableSyntax: string) => {
    try {
      await navigator.clipboard.writeText(variableSyntax);
      toast.success(`Copied ${variableSyntax} to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const insertVariable = (variableSyntax: string) => {
    setPrompt((current) => current + (current ? " " : "") + variableSyntax);
    toast.success(`Inserted ${variableSyntax}`);
  };

  // Count output keys in schema
  const outputKeyCount = useMemo(() => {
    if (!schema.trim()) return 0;
    try {
      const parsed = JSON.parse(schema);
      if (parsed.type === "object" && parsed.properties) {
        return Object.keys(parsed.properties).length;
      }
    } catch {
      return 0;
    }
    return 0;
  }, [schema]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--selise-blue))]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
              </button>
              <DialogTitle className="flex items-center gap-2 text-base font-medium">
                <Wand2 className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                AI Enrichment for
                <Badge
                  variant="secondary"
                  className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-mono"
                >
                  Screen #{screenIndex}
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
          {/* Screen Info */}
          <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-[hsl(var(--selise-blue))]/5 border-[hsl(var(--selise-blue))]/20 text-[hsl(var(--selise-blue))] font-mono"
              >
                #{screenIndex}
              </Badge>
              <span className="text-sm text-[hsl(var(--fg))] truncate">
                {screen.title}
              </span>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--fg))]">
                  Enable AI Enrichment
                </p>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  Run AI prompt after this screen to add extra context for later steps
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {/* AI Configuration (shown when enabled) */}
            <AnimatePresence>
              {enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6">
                    {/* Current Screen Variables */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                        Available Variables (Current Screen)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {currentScreenFields.length === 0 ? (
                          <span className="text-xs text-[hsl(var(--globe-grey))] italic">
                            No fields in this screen
                          </span>
                        ) : (
                          currentScreenFields.map((field, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] transition-colors"
                              onClick={() => insertVariable(field.variableSyntax)}
                              title={`Click to insert ${field.variableSyntax}`}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {field.fieldName}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Previous Form Fields */}
                    {previousFormFields.length > 0 && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowFormFields(!showFormFields)}
                          className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                        >
                          {showFormFields ? (
                            <ChevronUp className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                          )}
                          <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider cursor-pointer">
                            Form Fields from Previous Steps ({previousFormFields.length})
                          </Label>
                        </button>
                        {showFormFields && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {previousFormFields.map((field, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] transition-colors"
                                onClick={() => insertVariable(field.variableSyntax)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {field.screenTitle}.{field.fieldName}
                                <span className="ml-1 text-[10px] opacity-60">({field.fieldType})</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Previous AI Context */}
                    {previousContextVariables.length > 0 && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowPreviousContext(!showPreviousContext)}
                          className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                        >
                          {showPreviousContext ? (
                            <ChevronUp className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
                          )}
                          <Label className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider cursor-pointer">
                            AI Context from Previous Steps ({previousContextVariables.length})
                          </Label>
                        </button>
                        {showPreviousContext && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {previousContextVariables.map((ctx, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="cursor-pointer hover:bg-[hsl(var(--selise-blue))]/10 hover:text-[hsl(var(--selise-blue))] hover:border-[hsl(var(--selise-blue))] transition-colors"
                                onClick={() => insertVariable(ctx.variableSyntax)}
                              >
                                <Sparkles className="h-3 w-3 mr-1 text-[hsl(var(--selise-blue))]" />
                                {ctx.fieldName}
                                <span className="ml-1 text-[10px] opacity-60">({ctx.fieldType})</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-2">
                      <Label htmlFor="aiPrompt" className="text-sm font-medium text-[hsl(var(--fg))]">
                        AI Prompt
                      </Label>
                      <textarea
                        id="aiPrompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--selise-blue))] focus-visible:ring-offset-2 font-mono resize-y"
                        placeholder="e.g., Based on the {{companyName}} and {{address}}, estimate the trading currency and jurisdiction."
                      />
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        Use variables like {"{{fieldName}}"} to include form data in the prompt.
                      </p>
                    </div>

                    {/* Output Schema */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                        <Label className="text-sm font-medium text-[hsl(var(--fg))]">
                          Output Schema
                        </Label>
                        {outputKeyCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {outputKeyCount} key{outputKeyCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <SchemaBuilder
                        value={schema}
                        onChange={setSchema}
                        subsequentScreens={subsequentScreens}
                      />
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        Define what data the AI should output. These keys will be available to auto-fill fields in later screens.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disabled state info */}
            {!enabled && (
              <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/30 border border-dashed border-[hsl(var(--border))]">
                <p className="text-sm text-[hsl(var(--globe-grey))] text-center">
                  Enable AI enrichment to configure prompts and output schemas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          <div className="flex items-center justify-end w-full gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

