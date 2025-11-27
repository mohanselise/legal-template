"use client";

import { useState, useEffect } from "react";
import { Plus, User, Mail, Briefcase, Phone, Trash2, Pencil, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateScreen, TemplateField } from "@/lib/db";

interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

interface SignatoryInfoManagerProps {
  screen: ScreenWithFields;
  onFieldsUpdated: () => void;
}

interface SignatoryField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

// Standard signatory fields
const STANDARD_SIGNATORY_FIELDS: SignatoryField[] = [
  { id: "party", name: "party", label: "Party", type: "select", required: true, options: ["employer", "employee", "witness", "other"] },
  { id: "name", name: "name", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
  { id: "email", name: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
  { id: "title", name: "title", label: "Title/Role", type: "text", required: false, placeholder: "CEO, Employee, etc." },
  { id: "phone", name: "phone", label: "Phone", type: "text", required: false, placeholder: "+1 (555) 123-4567" },
];

export function SignatoryInfoManager({ screen, onFieldsUpdated }: SignatoryInfoManagerProps) {
  const [signatoryFields, setSignatoryFields] = useState<SignatoryField[]>([]);
  const [editingField, setEditingField] = useState<SignatoryField | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingFields, setCreatingFields] = useState(false);

  // Load existing fields or initialize with standard fields
  useEffect(() => {
    if (screen.fields.length > 0) {
      // Convert existing fields to signatory fields
      const fields: SignatoryField[] = screen.fields.map((field) => ({
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type === "email" ? "email" : field.type === "select" ? "select" : "text",
        required: field.required,
        placeholder: field.placeholder || undefined,
        options: field.options.length > 0 ? field.options : undefined,
      }));
      setSignatoryFields(fields);
    } else {
      // Initialize with standard signatory fields
      setSignatoryFields(STANDARD_SIGNATORY_FIELDS);
    }
  }, [screen.fields]);

  const handleAddField = () => {
    setEditingField({
      id: `new-${Date.now()}`,
      name: "",
      label: "",
      type: "text",
      required: false,
    });
    setDialogOpen(true);
  };

  const handleEditField = (field: SignatoryField) => {
    setEditingField(field);
    setDialogOpen(true);
  };

  const handleSaveField = async (field: SignatoryField) => {
    // Check if field already exists
    const existingField = screen.fields.find((f) => f.id === field.id);
    
    const fieldData = {
      name: field.name,
      label: field.label,
      type: field.type === "email" ? "email" : field.type === "select" ? "select" : "text",
      required: field.required,
      placeholder: field.placeholder || null,
      options: field.type === "select" && field.options ? field.options : [],
      order: existingField?.order || signatoryFields.length,
    };

    try {
      if (existingField) {
        // Update existing field
        await fetch(`/api/admin/fields/${field.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldData),
        });
      } else {
        // Create new field
        await fetch(`/api/admin/screens/${screen.id}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldData),
        });
      }
      
      setDialogOpen(false);
      setEditingField(null);
      onFieldsUpdated();
    } catch (error) {
      console.error("Error saving field:", error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await fetch(`/api/admin/fields/${fieldId}`, {
        method: "DELETE",
      });
      onFieldsUpdated();
    } catch (error) {
      console.error("Error deleting field:", error);
    }
  };

  const handleCreateAllStandardFields = async () => {
    setCreatingFields(true);
    try {
      // Filter out fields that already exist
      const fieldsToCreate = STANDARD_SIGNATORY_FIELDS.filter(
        (standardField) => !screen.fields.some((f) => f.name === standardField.name)
      );

      if (fieldsToCreate.length === 0) {
        toast.info("All standard fields already exist");
        return;
      }

      // Create all missing standard fields
      const createPromises = fieldsToCreate.map((field, index) => {
        const fieldData = {
          name: field.name,
          label: field.label,
          type: field.type === "email" ? "email" : field.type === "select" ? "select" : "text",
          required: field.required,
          placeholder: field.placeholder || null,
          options: field.type === "select" && field.options ? field.options : [],
          order: screen.fields.length + index,
        };

        return fetch(`/api/admin/screens/${screen.id}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldData),
        });
      });

      await Promise.all(createPromises);
      toast.success(`Created ${fieldsToCreate.length} standard signatory field${fieldsToCreate.length !== 1 ? "s" : ""}`);
      onFieldsUpdated();
    } catch (error) {
      console.error("Error creating standard fields:", error);
      toast.error("Failed to create standard fields");
    } finally {
      setCreatingFields(false);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "select":
        return <Briefcase className="h-4 w-4" />;
      case "text":
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
          <p className="text-sm text-[hsl(var(--globe-grey))] mb-3">
            This is a <strong>Signatory Information</strong> screen. Use this screen to collect information about document signatories (name, email, title, party, etc.). You can add custom fields or use the standard signatory fields below.
          </p>
          {(() => {
            const missingFields = STANDARD_SIGNATORY_FIELDS.filter(
              (standardField) => !screen.fields.some((f) => f.name === standardField.name)
            );
            if (missingFields.length > 0) {
              return (
                <Button
                  size="sm"
                  onClick={handleCreateAllStandardFields}
                  className="w-full"
                  disabled={creatingFields}
                >
                  {creatingFields ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {creatingFields
                    ? "Creating Fields..."
                    : `Create All Standard Fields (${missingFields.length} missing)`}
                </Button>
              );
            }
            return null;
          })()}
        </div>

        <div className="space-y-2">
          {signatoryFields.map((field) => {
            const existingField = screen.fields.find((f) => f.name === field.name);
            return (
              <div
                key={field.id}
                className="group flex items-center gap-3 p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/30 transition-colors bg-white"
              >
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] flex-shrink-0">
                  {getFieldIcon(field.type)}
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
                    {existingField && (
                      <Badge variant="outline" className="text-xs">
                        Created
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-[hsl(var(--globe-grey))] bg-[hsl(var(--border))]/50 px-1.5 py-0.5 rounded">
                      {field.name}
                    </code>
                    <span className="text-xs text-[hsl(var(--globe-grey))]">
                      {field.type}
                    </span>
                    {field.type === "select" && field.options && (
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
                  {existingField && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteField(existingField.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" onClick={handleAddField} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Signatory Field
        </Button>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField?.id.startsWith("new-") ? "Add Signatory Field" : "Edit Signatory Field"}
            </DialogTitle>
            <DialogDescription>
              Configure a field for collecting signatory information.
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <SignatoryFieldForm
              field={editingField}
              onSave={(updatedField) => {
                handleSaveField(updatedField);
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingField(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SignatoryFieldFormProps {
  field: SignatoryField;
  onSave: (field: SignatoryField) => void;
  onCancel: () => void;
}

function SignatoryFieldForm({ field, onSave, onCancel }: SignatoryFieldFormProps) {
  const [formData, setFormData] = useState<SignatoryField>(field);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Field Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., signatoryName"
          required
        />
        <p className="text-xs text-[hsl(var(--globe-grey))]">
          Internal field name (used in form data)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Signatory Name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Field Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as "text" | "email" | "select" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="select">Select</SelectItem>
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
                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="e.g., employer, employee, witness"
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={formData.required}
          onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
          className="size-4 rounded border-[hsl(var(--border))] text-[hsl(var(--selise-blue))] focus:ring-[hsl(var(--selise-blue))]"
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required field
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Field</Button>
      </DialogFooter>
    </form>
  );
}

