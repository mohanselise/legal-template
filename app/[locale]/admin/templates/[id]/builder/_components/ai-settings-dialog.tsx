"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  X,
  Check,
  Copy,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Interface for available AI context keys from previous screens
export interface AvailableContextKey {
  screenTitle: string;
  key: string;
  type: string;
  fullPath: string;
}

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Field name/label */
  targetLabel: string;
  /** Field name (for auto-generating key) */
  fieldName: string;
  /** Index/number for display badge */
  targetIndex: number;
  /** Whether AI suggestions are enabled */
  aiEnabled: boolean;
  /** AI suggestion context key */
  aiKey: string;
  /** Callback when AI settings change */
  onSave: (enabled: boolean, key: string) => void;
  /** Available context keys from previous screen enrichments */
  availableContextKeys?: AvailableContextKey[];
}

export function AISettingsDialog({
  open,
  onOpenChange,
  targetLabel,
  fieldName,
  targetIndex,
  aiEnabled: initialAiEnabled,
  aiKey: initialAiKey,
  onSave,
  availableContextKeys = [],
}: AISettingsDialogProps) {
  // Local state for editing
  const [enabled, setEnabled] = useState(initialAiEnabled);
  const [key, setKey] = useState(initialAiKey);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setEnabled(initialAiEnabled);
      setKey(initialAiKey);
    }
  }, [open, initialAiEnabled, initialAiKey]);

  const handleSave = () => {
    onSave(enabled, key);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const autoGenerateKey = () => {
    const sanitizedName = fieldName.replace(/[^a-zA-Z0-9]/g, "_");
    setKey(`AI_${sanitizedName}`);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0"
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
                <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                AI Suggestions for
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

          <div className="px-6 py-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--fg))]">
                  Enable AI Suggestions
                </p>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  Auto-fill this field with AI-generated suggestions from enrichment context
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => {
                  setEnabled(checked);
                  if (checked && !key) {
                    autoGenerateKey();
                  }
                }}
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
                    {/* Context Key Input */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[hsl(var(--fg))]">
                        AI Context Key
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="e.g., companyName"
                            className="font-mono text-sm pr-10"
                          />
                          {key && (
                            <button
                              type="button"
                              onClick={copyKey}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]"
                              title="Copy key"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={autoGenerateKey}
                          title="Auto-generate key"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        This key maps to a value from the AI enrichment context. When available, it will auto-fill this field.
                      </p>
                    </div>

                    {/* Available Context Keys */}
                    {availableContextKeys.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-[hsl(var(--fg))]">
                          Available Context Keys
                        </Label>
                        <p className="text-xs text-[hsl(var(--globe-grey))]">
                          These keys are available from previous screen AI enrichments. Click to use.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableContextKeys.map((ctx, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setKey(ctx.fullPath)}
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-lg border transition-all",
                                key === ctx.fullPath
                                  ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))] bg-[hsl(var(--bg))]"
                              )}
                            >
                              <span className="font-mono">{ctx.key}</span>
                              <span className="ml-1 text-xs text-[hsl(var(--globe-grey))]">
                                ({ctx.screenTitle})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    {key && (
                      <div className="p-4 rounded-xl bg-[hsl(var(--lime-green))]/5 border border-[hsl(var(--lime-green))]/20">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--lime-green))]/10 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-[hsl(var(--poly-green))]" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[hsl(var(--fg))]">
                              AI will auto-fill this field
                            </p>
                            <p className="text-xs text-[hsl(var(--globe-grey))]">
                              When the enrichment context contains <span className="font-mono text-[hsl(var(--selise-blue))]">{key}</span>, its value will be suggested for this field.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disabled state info */}
            {!enabled && (
              <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/30 border border-dashed border-[hsl(var(--border))]">
                <p className="text-sm text-[hsl(var(--globe-grey))] text-center">
                  Enable AI suggestions to configure auto-fill from enrichment context
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

