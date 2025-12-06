"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Mail,
  Briefcase,
  Phone,
  Building2,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Info,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import {
  SignatoryScreenConfig,
  DEFAULT_SIGNATORY_CONFIG,
  parseSignatoryConfig,
  stringifySignatoryConfig,
} from "@/lib/templates/signatory-config";
import { SignatoryConfigEditor } from "./signatory-config-editor";

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

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

interface SignatoryInfoManagerProps {
  screen: ScreenWithFields;
  allScreens?: ScreenWithFields[];
  onConfigUpdated: () => void;
}

export function SignatoryInfoManager({ screen, allScreens = [], onConfigUpdated }: SignatoryInfoManagerProps) {
  const [config, setConfig] = useState<SignatoryScreenConfig>(DEFAULT_SIGNATORY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["predefined", "fields", "limits"])
  );

  // Compute available form fields from previous screens
  const availableFields: AvailableField[] = useMemo(() => {
    const fields: AvailableField[] = [];
    
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      if (prevScreen.fields && prevScreen.fields.length > 0) {
        prevScreen.fields.forEach((field: TemplateField) => {
          fields.push({
            screenTitle: prevScreen.title,
            screenId: prevScreen.id,
            name: field.name,
            label: field.label,
            type: field.type,
          });
        });
      }
    });

    return fields;
  }, [allScreens, screen.order]);

  // Compute available AI context keys from previous screens
  const availableContextKeys: AvailableContextKey[] = useMemo(() => {
    const keys: AvailableContextKey[] = [];
    
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      const schemaStr = (prevScreen as any).aiOutputSchema;
      if (!schemaStr || !schemaStr.trim()) return;

      try {
        const schema = JSON.parse(schemaStr);
        if (schema.type === "object" && schema.properties) {
          // Flatten schema properties to get all fields
          const flattenProperties = (properties: Record<string, any>, prefix = ""): void => {
            Object.entries(properties).forEach(([key, value]: [string, any]) => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              keys.push({
                screenTitle: prevScreen.title,
                key: fullKey,
                type: value.type || "unknown",
                fullPath: fullKey,
              });

              // Recursively handle nested objects
              if (value.type === "object" && value.properties) {
                flattenProperties(value.properties, fullKey);
              }
            });
          };

          flattenProperties(schema.properties);
        }
      } catch (e) {
        console.error(`Failed to parse schema for screen ${prevScreen.title}`, e);
      }
    });

    return keys;
  }, [allScreens, screen.order]);

  // Load config from screen
  useEffect(() => {
    const loadedConfig = parseSignatoryConfig((screen as any).signatoryConfig);
    setConfig(loadedConfig);
    setHasChanges(false);
  }, [screen]);

  const updateConfig = useCallback((updates: Partial<SignatoryScreenConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const configJson = stringifySignatoryConfig(config);
      console.log("[SignatoryInfoManager] Saving config:", config.mode, "mode with", config.predefinedSignatories.length, "predefined signatories");
      
      const response = await fetch(`/api/admin/templates/${screen.templateId}/screens/${screen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatoryConfig: configJson,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save signatory configuration");
      }

      toast.success("Signatory configuration saved");
      setHasChanges(false);
      onConfigUpdated();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const renderSectionHeader = (
    id: string,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted))]/50 transition-colors rounded-t-lg"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))]">
          {icon}
        </div>
        <div className="text-left">
          <h4 className="font-medium text-[hsl(var(--fg))]">{title}</h4>
          <p className="text-xs text-[hsl(var(--globe-grey))]">{description}</p>
        </div>
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
      ) : (
        <ChevronDown className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--fg))]">
              Signatory Screen Configuration
            </h3>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Configure how signatories are collected from users
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
        </Button>
      </div>

      {/* Mode Selection */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.mode === "deterministic" ? (
              <ToggleRight className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-[hsl(var(--globe-grey))]" />
            )}
            <div>
              <h4 className="font-medium text-[hsl(var(--fg))]">
                {config.mode === "deterministic" ? "Deterministic Mode" : "Dynamic Mode"}
              </h4>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                {config.mode === "deterministic" 
                  ? "Admin defines fixed signatory slots, end user fills them"
                  : "End users can add signatories as needed"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${config.mode === "dynamic" ? "text-[hsl(var(--selise-blue))] font-medium" : "text-[hsl(var(--globe-grey))]"}`}>
              Dynamic
            </span>
            <Switch
              checked={config.mode === "deterministic"}
              onCheckedChange={(checked) => updateConfig({ mode: checked ? "deterministic" : "dynamic" })}
            />
            <span className={`text-sm ${config.mode === "deterministic" ? "text-[hsl(var(--selise-blue))] font-medium" : "text-[hsl(var(--globe-grey))]"}`}>
              Deterministic
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20">
        <Info className="h-5 w-5 text-[hsl(var(--selise-blue))] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[hsl(var(--fg))]">
          <p className="font-medium mb-1">
            {config.mode === "deterministic" ? "Deterministic Mode" : "Dynamic Mode"}
          </p>
          <p className="text-[hsl(var(--globe-grey))]">
            {config.mode === "deterministic" 
              ? "Define fixed signatory slots below. Each slot can be pre-filled with data from previous form steps. End users will fill in the remaining fields."
              : "End users can add one or more signatories. Use the limits below to control minimum and maximum number of signatories."}
          </p>
        </div>
      </div>

      {/* Pre-defined Signatories Section (only in deterministic mode) */}
      {config.mode === "deterministic" && (
        <Card className="border border-[hsl(var(--border))] overflow-hidden">
          {renderSectionHeader(
            "predefined",
            "Signatory Slots",
            "Configure fixed signatory slots with optional auto-fill",
            <Users className="h-4 w-4" />
          )}
          {expandedSections.has("predefined") && (
            <CardContent className="p-4 pt-0 space-y-4 border-t border-[hsl(var(--border))]">
              <SignatoryConfigEditor
                config={config}
                onChange={(newConfig) => {
                  setConfig(newConfig);
                  setHasChanges(true);
                }}
                availableFields={availableFields}
                availableContextKeys={availableContextKeys}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Signatory Limits Section (only in dynamic mode) */}
      {config.mode === "dynamic" && (
        <Card className="border border-[hsl(var(--border))] overflow-hidden">
          {renderSectionHeader(
            "limits",
            "Signatory Limits",
            "Set minimum and maximum number of signatories",
            <Users className="h-4 w-4" />
          )}
          {expandedSections.has("limits") && (
            <CardContent className="p-4 pt-0 space-y-4 border-t border-[hsl(var(--border))]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Signatories</Label>
                  <Input
                    type="number"
                    min={1}
                    max={config.maxSignatories}
                    value={config.minSignatories}
                    onChange={(e) => updateConfig({ minSignatories: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Signatories</Label>
                  <Input
                    type="number"
                    min={config.minSignatories}
                    max={20}
                    value={config.maxSignatories}
                    onChange={(e) => updateConfig({ maxSignatories: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Collected Fields Section */}
      <Card className="border border-[hsl(var(--border))] overflow-hidden">
        {renderSectionHeader(
          "fields",
          "Collected Fields",
          "Choose which information to collect from signatories",
          <User className="h-4 w-4" />
        )}
        {expandedSections.has("fields") && (
          <CardContent className="p-4 pt-0 space-y-4 border-t border-[hsl(var(--border))]">
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "name", label: "Full Name", icon: <User className="h-4 w-4" />, locked: true },
                { key: "email", label: "Email Address", icon: <Mail className="h-4 w-4" />, locked: true },
                { key: "title", label: "Title / Role", icon: <Briefcase className="h-4 w-4" /> },
                { key: "phone", label: "Phone Number", icon: <Phone className="h-4 w-4" /> },
                { key: "company", label: "Company", icon: <Building2 className="h-4 w-4" /> },
                { key: "address", label: "Address", icon: <MapPin className="h-4 w-4" /> },
              ].map((field) => (
                <div
                  key={field.key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    config.collectFields[field.key as keyof typeof config.collectFields]
                      ? "border-[hsl(var(--selise-blue))]/30 bg-[hsl(var(--selise-blue))]/5"
                      : "border-[hsl(var(--border))] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`text-[hsl(var(--globe-grey))] ${
                      config.collectFields[field.key as keyof typeof config.collectFields]
                        ? "text-[hsl(var(--selise-blue))]"
                        : ""
                    }`}>
                      {field.icon}
                    </div>
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.locked && (
                      <span className="text-[10px] text-[hsl(var(--globe-grey))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
                        Always On
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={config.collectFields[field.key as keyof typeof config.collectFields]}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        collectFields: {
                          ...config.collectFields,
                          [field.key]: checked,
                        },
                      })
                    }
                    disabled={field.locked}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
