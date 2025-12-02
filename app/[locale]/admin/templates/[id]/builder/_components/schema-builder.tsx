"use client";

import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Code,
    LayoutList,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SchemaField {
    id: string;
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    description?: string;
    properties?: SchemaField[]; // For objects
    items?: SchemaField; // For arrays
}

interface SchemaBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to parse JSON schema into internal state
const parseSchemaToState = (schemaStr: string): SchemaField[] => {
    try {
        const schema = JSON.parse(schemaStr);
        if (schema.type !== "object" || !schema.properties) return [];

        const parseProperties = (properties: any): SchemaField[] => {
            return Object.entries(properties).map(([key, value]: [string, any]) => {
                const field: SchemaField = {
                    id: generateId(),
                    name: key,
                    type: value.type || "string",
                    description: value.description,
                };

                if (value.type === "object" && value.properties) {
                    field.properties = parseProperties(value.properties);
                }

                if (value.type === "array" && value.items) {
                    // Handle array of objects or primitives
                    if (value.items.type === "object" && value.items.properties) {
                        field.items = {
                            id: generateId(),
                            name: "item",
                            type: "object",
                            properties: parseProperties(value.items.properties)
                        }
                    } else {
                        field.items = {
                            id: generateId(),
                            name: "item",
                            type: value.items.type || "string",
                        }
                    }
                }

                return field;
            });
        };

        return parseProperties(schema.properties);
    } catch (e) {
        console.error("Failed to parse schema", e);
        return [];
    }
};

// Helper to convert internal state to JSON schema
const convertStateToSchema = (fields: SchemaField[]): string => {
    const buildProperties = (fields: SchemaField[]): any => {
        const properties: any = {};
        fields.forEach((field) => {
            const prop: any = { type: field.type };
            if (field.description) prop.description = field.description;

            if (field.type === "object" && field.properties) {
                prop.properties = buildProperties(field.properties);
                prop.required = field.properties.map(f => f.name);
            }

            if (field.type === "array" && field.items) {
                if (field.items.type === "object" && field.items.properties) {
                    prop.items = {
                        type: "object",
                        properties: buildProperties(field.items.properties),
                        required: field.items.properties.map(f => f.name)
                    }
                } else {
                    prop.items = { type: field.items.type };
                }
            }

            properties[field.name] = prop;
        });
        return properties;
    };

    const schema = {
        type: "object",
        properties: buildProperties(fields),
        required: fields.map((f) => f.name),
    };

    return JSON.stringify(schema, null, 2);
};

export function SchemaBuilder({ value, onChange }: SchemaBuilderProps) {
    const [mode, setMode] = useState<"visual" | "code">("visual");
    const [fields, setFields] = useState<SchemaField[]>(() => parseSchemaToState(value));
    const [jsonError, setJsonError] = useState<string | null>(null);
    const lastSyncedSchema = useRef<string>(value);

    // Keep local fields in sync with incoming value when using the visual builder
    useEffect(() => {
        if (mode !== "visual") return;
        if (value === lastSyncedSchema.current) return;

        setFields(parseSchemaToState(value));
        lastSyncedSchema.current = value;
    }, [value, mode]);

    // Handle mode switch
    const toggleMode = () => {
        if (mode === "visual") {
            // Switching to code: generate JSON from state
            const schema = convertStateToSchema(fields);
            lastSyncedSchema.current = schema;
            onChange(schema);
            setMode("code");
        } else {
            // Switching to visual: parse JSON to state
            try {
                const parsed = parseSchemaToState(value);
                setFields(parsed);
                lastSyncedSchema.current = value;
                setJsonError(null);
                setMode("visual");
            } catch (e) {
                setJsonError("Invalid JSON schema. Fix errors before switching to visual mode.");
            }
        }
    };

    // Update parent when fields change (if in visual mode)
    useEffect(() => {
        if (mode !== "visual") return;

        const schema = convertStateToSchema(fields);
        lastSyncedSchema.current = schema;
        if (schema !== value) {
            onChange(schema);
        }
    }, [fields, mode, onChange, value]);

    const addField = (parentId?: string, isArrayItem?: boolean) => {
        const newField: SchemaField = {
            id: generateId(),
            name: isArrayItem ? "item" : "",
            type: "string",
        };

        if (!parentId) {
            setFields([...fields, newField]);
            return;
        }

        // Recursive update
        const updateFields = (currentFields: SchemaField[]): SchemaField[] => {
            return currentFields.map((field) => {
                if (field.id === parentId) {
                    if (field.type === 'array') {
                        // For arrays, we set the 'items' property
                        return { ...field, items: newField };
                    }
                    return {
                        ...field,
                        properties: [...(field.properties || []), newField],
                    };
                }
                if (field.properties) {
                    return { ...field, properties: updateFields(field.properties) };
                }
                if (field.items && field.items.type === 'object' && field.items.properties) {
                    // Search inside array items if they are objects
                    // If the parentId matches the array item's ID (which acts as a container for object properties)
                    if (field.items.id === parentId) {
                        return {
                            ...field,
                            items: {
                                ...field.items,
                                properties: [...(field.items.properties || []), newField]
                            }
                        }
                    }
                    return {
                        ...field,
                        items: {
                            ...field.items,
                            properties: updateFields(field.items.properties)
                        }
                    }
                }
                return field;
            });
        };

        setFields(updateFields(fields));
    };

    const updateField = (id: string, updates: Partial<SchemaField>) => {
        const updateRecursive = (currentFields: SchemaField[]): SchemaField[] => {
            return currentFields.map((field) => {
                if (field.id === id) {
                    return { ...field, ...updates };
                }
                if (field.properties) {
                    return { ...field, properties: updateRecursive(field.properties) };
                }
                if (field.items) {
                    if (field.items.id === id) {
                        return { ...field, items: { ...field.items, ...updates } };
                    }
                    if (field.items.type === 'object' && field.items.properties) {
                        return {
                            ...field,
                            items: {
                                ...field.items,
                                properties: updateRecursive(field.items.properties)
                            }
                        }
                    }
                }
                return field;
            });
        };
        setFields(updateRecursive(fields));
    };

    const deleteField = (id: string) => {
        const deleteRecursive = (currentFields: SchemaField[]): SchemaField[] => {
            return currentFields
                .filter((field) => field.id !== id)
                .map((field) => {
                    if (field.properties) {
                        return { ...field, properties: deleteRecursive(field.properties) };
                    }
                    if (field.items) {
                        if (field.items.id === id) {
                            const { items, ...rest } = field;
                            return rest as SchemaField;
                        }
                        if (field.items.type === 'object' && field.items.properties) {
                            return {
                                ...field,
                                items: {
                                    ...field.items,
                                    properties: deleteRecursive(field.items.properties)
                                }
                            }
                        }
                    }
                    return field;
                });
        };
        setFields(deleteRecursive(fields));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label>Output Schema</Label>
                    <Badge variant="outline" className="text-xs">
                        {mode === "visual" ? "Visual Builder" : "JSON Code"}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="mode-toggle" className="text-xs cursor-pointer">
                        {mode === "visual" ? "Switch to Code" : "Switch to Visual"}
                    </Label>
                    <Switch
                        id="mode-toggle"
                        checked={mode === "code"}
                        onCheckedChange={toggleMode}
                    />
                </div>
            </div>

            {mode === "code" ? (
                <div className="space-y-2">
                    <textarea
                        className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            setJsonError(null);
                        }}
                        placeholder="{}"
                    />
                    {jsonError && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {jsonError}
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4 space-y-4">
                    {fields.length === 0 ? (
                        <div className="text-center py-8 text-[hsl(var(--globe-grey))]">
                            <LayoutList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No fields defined</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => addField()}
                                className="mt-1"
                            >
                                Add your first field
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {fields.map((field) => (
                                <FieldRow
                                    key={field.id}
                                    field={field}
                                    onUpdate={updateField}
                                    onDelete={deleteField}
                                    onAddChild={addField}
                                />
                            ))}
                        </div>
                    )}
                    {fields.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addField()}
                            className="w-full border-dashed"
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Root Field
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

interface FieldRowProps {
    field: SchemaField;
    onUpdate: (id: string, updates: Partial<SchemaField>) => void;
    onDelete: (id: string) => void;
    onAddChild: (parentId: string) => void;
    level?: number;
}

function FieldRow({
    field,
    onUpdate,
    onDelete,
    onAddChild,
    level = 0,
}: FieldRowProps) {
    const [expanded, setExpanded] = useState(true);

    const hasChildren = field.type === "object" || (field.type === "array" && field.items?.type === "object");

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "flex items-start gap-2 p-2 rounded-md bg-background border border-[hsl(var(--border))] group hover:border-[hsl(var(--selise-blue))]/50 transition-colors",
                    level > 0 && "ml-6"
                )}
            >
                {hasChildren && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2.5 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]"
                    >
                        {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}
                {!hasChildren && <div className="w-4" />}

                <div className="grid grid-cols-12 gap-2 flex-1">
                    <div className="col-span-4">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                            Name
                        </Label>
                        <Input
                            value={field.name}
                            onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                            placeholder="field_name"
                            className="h-8 text-sm font-mono"
                        />
                    </div>
                    <div className="col-span-3">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                            Type
                        </Label>
                        <Select
                            value={field.type}
                            onValueChange={(value: any) =>
                                onUpdate(field.id, { type: value })
                            }
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-5">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-1 block">
                            Description
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={field.description || ""}
                                onChange={(e) =>
                                    onUpdate(field.id, { description: e.target.value })
                                }
                                placeholder="Description..."
                                className="h-8 text-sm"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDelete(field.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Properties (Object) */}
            {field.type === "object" && expanded && (
                <div className="space-y-2">
                    {field.properties?.map((child) => (
                        <FieldRow
                            key={child.id}
                            field={child}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            level={level + 1}
                        />
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddChild(field.id)}
                        className={cn("h-7 text-xs text-[hsl(var(--selise-blue))]", level > 0 ? "ml-8" : "ml-6")}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Property
                    </Button>
                </div>
            )}

            {/* Array Items */}
            {field.type === "array" && expanded && (
                <div className={cn("space-y-2", level > 0 && "ml-6")}>
                    <div className="pl-4 border-l-2 border-[hsl(var(--border))]">
                        <Label className="text-xs text-[hsl(var(--globe-grey))] mb-2 block">Array Items Type</Label>
                        {field.items ? (
                            field.items.type === 'object' ? (
                                // Array of Objects
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline">Object</Badge>
                                        <Button variant="ghost" size="sm" onClick={() => onDelete(field.items!.id)} className="h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                    {field.items.properties?.map((child) => (
                                        <FieldRow
                                            key={child.id}
                                            field={child}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                            onAddChild={onAddChild}
                                            level={0} // Reset level visually relative to container
                                        />
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onAddChild(field.items!.id)}
                                        className="h-7 text-xs text-[hsl(var(--selise-blue))]"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Item Property
                                    </Button>
                                </div>
                            ) : (
                                // Array of Primitives
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={field.items.type}
                                        onValueChange={(value: any) => {
                                            if (value === 'object') {
                                                // Convert to object
                                                onUpdate(field.id, { items: { ...field.items!, type: 'object', properties: [] } })
                                            } else {
                                                onUpdate(field.items!.id, { type: value })
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="object">Object</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="sm" onClick={() => onDelete(field.items!.id)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            )
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddChild(field.id)}
                                className="h-7 text-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Define Items
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
