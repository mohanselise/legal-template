"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  X,
  Check,
  ChevronDown,
  Search,
  Info,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setEnabled(initialAiEnabled);
      setKey(initialAiKey);
      setSearchQuery("");
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
    // Try to find a matching key from available context keys based on field name
    const fieldNameLower = fieldName.toLowerCase();
    const matchingKey = availableContextKeys.find(
      (k) => k.key.toLowerCase() === fieldNameLower || k.key.toLowerCase().includes(fieldNameLower)
    );
    
    if (matchingKey) {
      setKey(matchingKey.fullPath);
    } else {
      // Fallback to generating AI_ prefixed key
      const sanitizedName = fieldName.replace(/[^a-zA-Z0-9]/g, "_");
      setKey(`AI${sanitizedName}`);
    }
  };

  // Filter keys based on search
  const filteredAvailableKeys = useMemo(() => {
    if (!searchQuery) return availableContextKeys;
    const query = searchQuery.toLowerCase();
    return availableContextKeys.filter(
      (k) =>
        k.key.toLowerCase().includes(query) ||
        k.fullPath.toLowerCase().includes(query) ||
        k.screenTitle.toLowerCase().includes(query)
    );
  }, [searchQuery, availableContextKeys]);

  // Group keys by screen
  const groupedKeys = useMemo(() => {
    const groups: Record<string, AvailableContextKey[]> = {};
    filteredAvailableKeys.forEach((k) => {
      if (!groups[k.screenTitle]) {
        groups[k.screenTitle] = [];
      }
      groups[k.screenTitle].push(k);
    });
    return groups;
  }, [filteredAvailableKeys]);

  const selectKey = (selectedKey: string) => {
    setKey(selectedKey);
    setPickerOpen(false);
    setSearchQuery("");
  };

  // Check if current key is from available keys
  const currentKeyInfo = useMemo(() => {
    const available = availableContextKeys.find((k) => k.fullPath === key || k.key === key);
    if (available) return { type: "available", label: available.key, screen: available.screenTitle };
    
    if (key) return { type: "custom", label: key };
    return null;
  }, [key, availableContextKeys]);

  const hasAvailableKeys = availableContextKeys.length > 0;

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
            <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--fg))]">
                  Enable AI Suggestions
                </p>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  Auto-fill this field with AI-generated suggestions
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => {
                  setEnabled(checked);
                  if (checked && !key && hasAvailableKeys) {
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
                    {/* Context Key Picker */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[hsl(var(--fg))]">
                        AI Context Key
                      </Label>
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        Select which data from AI enrichment should populate this field
                      </p>
                      
                      {hasAvailableKeys ? (
                        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left",
                                key
                                  ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5"
                                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/50"
                              )}
                            >
                              {key ? (
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                                  <span className="font-mono text-sm text-[hsl(var(--fg))]">
                                    {key}
                                  </span>
                                  {currentKeyInfo?.type === "available" && currentKeyInfo.screen && (
                                    <Badge variant="secondary" className="text-xs">
                                      {currentKeyInfo.screen}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-[hsl(var(--globe-grey))]">
                                  Select a context key...
                                </span>
                              )}
                              <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[--radix-popover-trigger-width] p-0" 
                            align="start"
                            sideOffset={4}
                          >
                            {/* Search */}
                            <div className="p-3 border-b border-[hsl(var(--border))]">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--globe-grey))]" />
                                <Input
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search context keys..."
                                  className="pl-9"
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                              {/* Keys grouped by screen */}
                              {Object.entries(groupedKeys).map(([screenTitle, keys]) => (
                                <div key={screenTitle} className="p-2 border-b border-[hsl(var(--border))] last:border-b-0">
                                  <p className="px-2 py-1.5 text-xs font-medium text-[hsl(var(--globe-grey))] uppercase flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {screenTitle}
                                  </p>
                                  {keys.map((ctx, idx) => (
                                    <button
                                      key={`${screenTitle}-${idx}`}
                                      type="button"
                                      onClick={() => selectKey(ctx.fullPath)}
                                      className={cn(
                                        "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                                        key === ctx.fullPath
                                          ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                                          : "hover:bg-[hsl(var(--muted))]"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm">{ctx.key}</span>
                                        {key === ctx.fullPath && (
                                          <Check className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                                        )}
                                      </div>
                                      <span className="text-xs text-[hsl(var(--globe-grey))]">
                                        {ctx.type}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ))}

                              {filteredAvailableKeys.length === 0 && searchQuery && (
                                <div className="p-4 text-center text-sm text-[hsl(var(--globe-grey))]">
                                  No keys matching &quot;{searchQuery}&quot;
                                </div>
                              )}

                              {/* Auto-generate option */}
                              <div className="p-2 border-t border-[hsl(var(--border))]">
                                <div className="flex items-center gap-2 p-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      autoGenerateKey();
                                      setPickerOpen(false);
                                    }}
                                    className="flex-1"
                                  >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Auto-match Key
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        /* No available keys - show info message */
                        <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-dashed border-[hsl(var(--border))]">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-[hsl(var(--globe-grey))] shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm text-[hsl(var(--fg))]">
                                No AI enrichment configured on previous screens
                              </p>
                              <p className="text-xs text-[hsl(var(--globe-grey))]">
                                To use AI suggestions, configure an AI Enrichment Prompt on an earlier screen. 
                                The output keys defined there will be available for auto-fill.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Manual input for custom keys */}
                      <div className="space-y-2">
                        <Label className="text-xs text-[hsl(var(--globe-grey))]">
                          Or enter a custom key
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="e.g., AIcompanyName"
                            className="font-mono text-sm"
                          />
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
                      </div>
                    </div>

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
                              When the enrichment context contains{" "}
                              <span className="font-mono text-[hsl(var(--selise-blue))]">{key}</span>,
                              its value will be suggested for this field.
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
