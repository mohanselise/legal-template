"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Type,
  Mail,
  Calendar,
  Hash,
  CheckSquare,
  List,
  Sparkles,
  AlignLeft,
  Phone,
  MapPin,
  Users,
  Banknote,
  Percent,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldEditor, type AvailableContextKey } from "./field-editor";
import { DeleteDialog } from "./delete-dialog";
import { SignatoryInfoManager } from "./signatory-info-manager";
import type { TemplateScreen, TemplateField, FieldType } from "@/lib/db";

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface FieldListProps {
  screen: ScreenWithFields;
  allScreens?: ScreenWithFields[];
  onFieldsUpdated: () => void;
}

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  address: <MapPin className="h-4 w-4" />,
  party: <Users className="h-4 w-4" />,
  currency: <Banknote className="h-4 w-4" />,
  percentage: <Percent className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Text",
  email: "Email",
  date: "Date",
  number: "Number",
  checkbox: "Checkbox",
  select: "Select",
  textarea: "Textarea",
  phone: "Phone",
  address: "Address",
  party: "Party",
  currency: "Currency",
  percentage: "Percentage",
  url: "URL",
};

// Interface for available form fields from previous screens
export interface AvailableFormField {
  screenTitle: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  variableSyntax: string; // e.g., {{fieldName}}
}

export function FieldList({ screen, allScreens = [], onFieldsUpdated }: FieldListProps) {
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<TemplateField | null>(null);

  // Compute available form fields from previous screens
  const availableFormFields = useMemo(() => {
    const fields: AvailableFormField[] = [];
    
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      const screenWithFields = prevScreen as ScreenWithFields;
      if (screenWithFields.fields && screenWithFields.fields.length > 0) {
        screenWithFields.fields.forEach((field: TemplateField) => {
          fields.push({
            screenTitle: prevScreen.title,
            fieldName: field.name,
            fieldLabel: field.label,
            fieldType: field.type,
            variableSyntax: `{{${field.name}}}`,
          });
        });
      }
    });

    return fields;
  }, [allScreens, screen.order]);

  // Compute available AI context keys from previous screens
  const availableContextKeys = useMemo(() => {
    const keys: AvailableContextKey[] = [];
    
    // Get previous screens (those with order < current screen's order)
    const previousScreens = allScreens
      .filter((s) => s.order < screen.order)
      .sort((a, b) => a.order - b.order);

    previousScreens.forEach((prevScreen) => {
      const schemaStr = prevScreen.aiOutputSchema;
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

  const handleAddField = () => {
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (field: TemplateField) => {
    setEditingField(field);
    setFieldEditorOpen(true);
  };

  const handleDeleteField = (field: TemplateField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleFieldSaved = async () => {
    setFieldEditorOpen(false);
    setEditingField(null);
    await onFieldsUpdated();
  };

  const handleFieldDeleted = async () => {
    setDeleteDialogOpen(false);
    setDeletingField(null);
    onFieldsUpdated();
  };

  // Check if this is a signatory screen
  const isSignatoryScreen = (screen as any).type === "signatory";

  return (
    <>
      <Card className="border-[hsl(var(--border))]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-[hsl(var(--fg))]">
                  {screen.title}
                </CardTitle>
                {isSignatoryScreen && (
                  <Badge variant="secondary" className="text-xs">
                    Signatory Screen
                  </Badge>
                )}
              </div>
              {screen.description && (
                <CardDescription className="mt-1">
                  {screen.description}
                </CardDescription>
              )}
            </div>
            {!isSignatoryScreen && (
              <Button size="sm" onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isSignatoryScreen ? (
            <SignatoryInfoManager screen={screen} allScreens={allScreens} onConfigUpdated={onFieldsUpdated} />
          ) : (
            screen.fields.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--globe-grey))] border-2 border-dashed border-[hsl(var(--border))] rounded-lg">
              <Type className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No fields yet</p>
              <p className="text-xs mt-1 mb-4">
                Click "Add Field" to create form fields for this screen
              </p>
              <Button size="sm" variant="outline" onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Field
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {screen.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group flex items-center gap-3 p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/30 transition-colors bg-white"
                >
                  <GripVertical className="h-4 w-4 text-[hsl(var(--globe-grey))] opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
                  
                  <div className="h-9 w-9 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] flex-shrink-0">
                    {fieldTypeIcons[field.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[hsl(var(--fg))]">
                        {field.label}
                      </span>
                      {field.required && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]"
                        >
                          Required
                        </Badge>
                      )}
                      {(field as any).aiSuggestionEnabled && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-[hsl(var(--globe-grey))] bg-[hsl(var(--border))]/50 px-1.5 py-0.5 rounded">
                        {field.name}
                      </code>
                      <span className="text-xs text-[hsl(var(--globe-grey))]">
                        {fieldTypeLabels[field.type]}
                      </span>
                      {field.type === "select" && field.options.length > 0 && (
                        <span className="text-xs text-[hsl(var(--globe-grey))]">
                          ({field.options.length} options)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditField(field)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteField(field)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
          )}
        </CardContent>
      </Card>

      {/* Field Editor Dialog */}
      <FieldEditor
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        screenId={screen.id}
        field={editingField}
        onSaved={handleFieldSaved}
        availableContextKeys={availableContextKeys}
        availableFormFields={availableFormFields}
        currentScreen={screen}
        allScreens={allScreens}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Field"
        description={`Are you sure you want to delete the "${deletingField?.label}" field? This action cannot be undone.`}
        onConfirm={async () => {
          if (deletingField) {
            await fetch(`/api/admin/fields/${deletingField.id}`, {
              method: "DELETE",
            });
            await handleFieldDeleted();
          }
        }}
      />
    </>
  );
}

