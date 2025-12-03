"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  User,
  Mail,
  Briefcase,
  Phone,
  Building2,
  MapPin,
  Trash2,
  Settings2,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  GripVertical,
  Info,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import {
  SignatoryScreenConfig,
  PartyTypeConfig,
  SignatoryCustomField,
  DEFAULT_SIGNATORY_CONFIG,
  DEFAULT_PARTY_TYPES,
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
    new Set(["predefined", "parties", "fields"])
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

  // Custom field editor
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<SignatoryCustomField | null>(null);

  // Party type editor
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyTypeConfig | null>(null);

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
      console.log("[SignatoryInfoManager] Saving config with", config.predefinedSignatories.length, "predefined signatories");
      
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

  // Party type management
  const handleAddPartyType = () => {
    setEditingParty({ value: "", label: "", description: "" });
    setPartyDialogOpen(true);
  };

  const handleEditPartyType = (party: PartyTypeConfig) => {
    setEditingParty(party);
    setPartyDialogOpen(true);
  };

  const handleSavePartyType = (party: PartyTypeConfig) => {
    if (editingParty && config.partyTypes.some(p => p.value === editingParty.value)) {
      // Edit existing
      updateConfig({
        partyTypes: config.partyTypes.map(p =>
          p.value === editingParty.value ? party : p
        ),
      });
    } else {
      // Add new
      updateConfig({
        partyTypes: [...config.partyTypes, party],
      });
    }
    setPartyDialogOpen(false);
    setEditingParty(null);
  };

  const handleRemovePartyType = (value: string) => {
    updateConfig({
      partyTypes: config.partyTypes.filter(p => p.value !== value),
      requiredPartyTypes: config.requiredPartyTypes.filter(v => v !== value),
    });
  };

  const handleToggleRequiredParty = (value: string, required: boolean) => {
    if (required) {
      updateConfig({
        requiredPartyTypes: [...config.requiredPartyTypes, value],
      });
    } else {
      updateConfig({
        requiredPartyTypes: config.requiredPartyTypes.filter(v => v !== value),
      });
    }
  };

  // Custom field management
  const handleAddCustomField = () => {
    setEditingCustomField({
      id: `custom_${Date.now()}`,
      name: "",
      label: "",
      type: "text",
      required: false,
    });
    setCustomFieldDialogOpen(true);
  };

  const handleEditCustomField = (field: SignatoryCustomField) => {
    setEditingCustomField(field);
    setCustomFieldDialogOpen(true);
  };

  const handleSaveCustomField = (field: SignatoryCustomField) => {
    if (config.customFields.some(f => f.id === field.id)) {
      // Edit existing
      updateConfig({
        customFields: config.customFields.map(f =>
          f.id === field.id ? field : f
        ),
        });
      } else {
      // Add new
      updateConfig({
        customFields: [...config.customFields, field],
      });
    }
    setCustomFieldDialogOpen(false);
    setEditingCustomField(null);
  };

  const handleRemoveCustomField = (id: string) => {
    updateConfig({
      customFields: config.customFields.filter(f => f.id !== id),
    });
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

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20">
        <Info className="h-5 w-5 text-[hsl(var(--selise-blue))] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[hsl(var(--fg))]">
          <p className="font-medium mb-1">Signatory Screen</p>
          <p className="text-[hsl(var(--globe-grey))]">
            This special screen type collects information about document signatories with a dedicated UI.
            Users can add multiple signatories with party types, names, emails, and optional fields.
          </p>
        </div>
      </div>

      {/* Pre-defined Signatories Section */}
      <Card className="border border-[hsl(var(--border))] overflow-hidden">
        {renderSectionHeader(
          "predefined",
          "Pre-defined Signatories",
          "Configure fixed signatory slots with pre-filled data",
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
            />
          </CardContent>
        )}
      </Card>

      {/* Party Types Section */}
      <Card className="border border-[hsl(var(--border))] overflow-hidden">
        {renderSectionHeader(
          "parties",
          "Party Types",
          "Define the types of parties that can sign",
          <Briefcase className="h-4 w-4" />
        )}
        {expandedSections.has("parties") && (
          <CardContent className="p-4 pt-0 space-y-4 border-t border-[hsl(var(--border))]">
            {/* Party List */}
        <div className="space-y-2">
              {config.partyTypes.map((party) => (
              <div
                  key={party.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-white group hover:border-[hsl(var(--selise-blue))]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                      <span className="font-medium text-[hsl(var(--fg))]">{party.label}</span>
                      <code className="text-xs text-[hsl(var(--globe-grey))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
                        {party.value}
                      </code>
                      {config.requiredPartyTypes.includes(party.value) && (
                        <Badge variant="secondary" className="text-xs bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]">
                        Required
                      </Badge>
                    )}
                  </div>
                    {party.description && (
                      <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                        {party.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="flex items-center gap-2 text-xs text-[hsl(var(--globe-grey))] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.requiredPartyTypes.includes(party.value)}
                        onChange={(e) => handleToggleRequiredParty(party.value, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[hsl(var(--border))]"
                      />
                      Required
                    </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                      onClick={() => handleEditPartyType(party)}
                  >
                      <Settings2 className="h-4 w-4" />
                  </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[hsl(var(--crimson))] hover:text-[hsl(var(--crimson))]"
                      onClick={() => handleRemovePartyType(party.value)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add From Presets or Custom */}
            <div className="flex gap-2">
              <Select
                onValueChange={(value) => {
                  const preset = DEFAULT_PARTY_TYPES.find(p => p.value === value);
                  if (preset && !config.partyTypes.some(p => p.value === preset.value)) {
                    updateConfig({
                      partyTypes: [...config.partyTypes, {
                        value: preset.value,
                        label: preset.label,
                        description: preset.description,
                      }],
                    });
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add from presets..." />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_PARTY_TYPES.filter(
                    p => !config.partyTypes.some(cp => cp.value === p.value)
                  ).map((party) => (
                    <SelectItem key={party.value} value={party.value}>
                      <div className="flex flex-col">
                        <span>{party.label}</span>
                        <span className="text-xs text-[hsl(var(--globe-grey))]">{party.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleAddPartyType} className="gap-2">
                <Plus className="h-4 w-4" />
                Custom
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Signatory Limits Section */}
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

            <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50">
              <div>
                <Label className="text-sm font-medium">Allow Multiple Signatories</Label>
                <p className="text-xs text-[hsl(var(--globe-grey))]">
                  Let users add more than one signatory
                </p>
              </div>
              <Switch
                checked={config.allowMultiple}
                onCheckedChange={(checked) => updateConfig({ allowMultiple: checked })}
              />
            </div>
          </CardContent>
        )}
      </Card>

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
            {/* Standard Fields */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-[hsl(var(--globe-grey))]">
                Standard Fields
              </Label>
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
                        <Badge variant="outline" className="text-[10px]">Required</Badge>
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
        </div>

            {/* Custom Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-[hsl(var(--globe-grey))]">
                  Custom Fields
                </Label>
                <Button variant="outline" size="sm" onClick={handleAddCustomField} className="gap-2">
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>
              {config.customFields.length === 0 ? (
                <p className="text-sm text-[hsl(var(--globe-grey))] text-center py-4">
                  No custom fields defined
                </p>
              ) : (
                <div className="space-y-2">
                  {config.customFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-white group hover:border-[hsl(var(--selise-blue))]/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{field.label}</span>
                          <Badge variant="outline" className="text-xs">{field.type}</Badge>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]">
                              Required
                            </Badge>
                          )}
                        </div>
                        <code className="text-xs text-[hsl(var(--globe-grey))]">{field.name}</code>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditCustomField(field)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[hsl(var(--crimson))]"
                          onClick={() => handleRemoveCustomField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* UI Options Section */}
      <Card className="border border-[hsl(var(--border))] overflow-hidden">
        {renderSectionHeader(
          "ui",
          "Display Options",
          "Configure how the signatory form appears to users",
          <Settings2 className="h-4 w-4" />
        )}
        {expandedSections.has("ui") && (
          <CardContent className="p-4 pt-0 space-y-3 border-t border-[hsl(var(--border))]">
            {[
              {
                key: "groupByParty",
                label: "Group by Party Type",
                description: "Organize signatories by their party type",
              },
              {
                key: "showPartyDescriptions",
                label: "Show Party Descriptions",
                description: "Display helpful descriptions for each party type",
              },
              {
                key: "compactMode",
                label: "Compact Mode",
                description: "Use a more compact layout for signatory cards",
              },
              {
                key: "allowReordering",
                label: "Allow Reordering",
                description: "Let users drag and reorder signatories",
              },
            ].map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50"
              >
                <div>
                  <Label className="text-sm font-medium">{option.label}</Label>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">{option.description}</p>
                </div>
                <Switch
                  checked={config.uiConfig[option.key as keyof typeof config.uiConfig]}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      uiConfig: {
                        ...config.uiConfig,
                        [option.key]: checked,
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Party Type Editor Dialog */}
      <Dialog open={partyDialogOpen} onOpenChange={setPartyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingParty?.value ? "Edit Party Type" : "Add Party Type"}
            </DialogTitle>
            <DialogDescription>
              Configure a party type for signatories
            </DialogDescription>
          </DialogHeader>
          {editingParty && (
            <PartyTypeForm
              party={editingParty}
              existingValues={config.partyTypes.map(p => p.value).filter(v => v !== editingParty.value)}
              onSave={handleSavePartyType}
              onCancel={() => {
                setPartyDialogOpen(false);
                setEditingParty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Field Editor Dialog */}
      <Dialog open={customFieldDialogOpen} onOpenChange={setCustomFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomField?.name ? "Edit Custom Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              Configure a custom field for signatory collection
            </DialogDescription>
          </DialogHeader>
          {editingCustomField && (
            <CustomFieldForm
              field={editingCustomField}
              existingNames={config.customFields.map(f => f.name).filter(n => n !== editingCustomField.name)}
              onSave={handleSaveCustomField}
              onCancel={() => {
                setCustomFieldDialogOpen(false);
                setEditingCustomField(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Party Type Form
// ============================================================================

interface PartyTypeFormProps {
  party: PartyTypeConfig;
  existingValues: string[];
  onSave: (party: PartyTypeConfig) => void;
  onCancel: () => void;
}

function PartyTypeForm({ party, existingValues, onSave, onCancel }: PartyTypeFormProps) {
  const [formData, setFormData] = useState(party);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.value.trim()) {
      setError("Value is required");
      return;
    }
    if (!formData.label.trim()) {
      setError("Label is required");
      return;
    }
    if (existingValues.includes(formData.value)) {
      setError("This value already exists");
      return;
    }

    // Auto-generate value from label if empty
    const value = formData.value || formData.label.toLowerCase().replace(/\s+/g, "_");
    onSave({ ...formData, value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="value">Value (identifier) *</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
          placeholder="e.g., disclosing_party"
        />
        <p className="text-xs text-[hsl(var(--globe-grey))]">
          Used internally (lowercase, no spaces)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Display Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Disclosing Party"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., The party sharing confidential information"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--crimson))]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Party Type</Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// Custom Field Form
// ============================================================================

interface CustomFieldFormProps {
  field: SignatoryCustomField;
  existingNames: string[];
  onSave: (field: SignatoryCustomField) => void;
  onCancel: () => void;
}

function CustomFieldForm({ field, existingNames, onSave, onCancel }: CustomFieldFormProps) {
  const [formData, setFormData] = useState(field);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Field name is required");
      return;
    }
    if (!formData.label.trim()) {
      setError("Label is required");
      return;
    }
    if (existingNames.includes(formData.name)) {
      setError("This field name already exists");
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Field Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
          placeholder="e.g., companyRegistration"
        />
        <p className="text-xs text-[hsl(var(--globe-grey))]">
          Used in form data (camelCase, no spaces)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Display Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Company Registration Number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Field Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as SignatoryCustomField["type"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="tel">Phone</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === "select" && (
        <div className="space-y-2">
          <Label htmlFor="options">Options (comma-separated)</Label>
          <Input
            id="options"
            value={formData.options?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                options: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
              })
            }
            placeholder="e.g., Option 1, Option 2, Option 3"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={formData.placeholder || ""}
          onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
          placeholder="Optional placeholder text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="helpText">Help Text</Label>
        <Input
          id="helpText"
          value={formData.helpText || ""}
          onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
          placeholder="Optional help text for users"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={formData.required}
          onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
          className="h-4 w-4 rounded border-[hsl(var(--border))]"
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required field
        </Label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--crimson))]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Field</Button>
      </DialogFooter>
    </form>
  );
}
