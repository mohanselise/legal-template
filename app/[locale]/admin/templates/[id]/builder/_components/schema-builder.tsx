"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    Code,
    LayoutList,
    AlertCircle,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FieldType } from "@/lib/db";

interface SubsequentScreen {
    id: string;
    title: string;
    order: number;
    fields: Array<{
        id: string;
        name: string;
        label: string;
        type: FieldType;
        options?: string[]; // For select fields - becomes enum
    }>;
}

interface SchemaBuilderProps {
    value: string;
    onChange: (value: string) => void;
    subsequentScreens?: SubsequentScreen[];
}

// Map FieldType to JSON Schema type and structure
const fieldTypeToSchemaType = (
    fieldType: FieldType,
    options?: string[]
): { type: "string" | "number" | "boolean" | "object"; enum?: string[]; properties?: any; required?: string[] } => {
    switch (fieldType) {
        case "text":
        case "email":
        case "url":
        case "textarea":
        case "date":
            return { type: "string" };
        
        case "number":
        case "percentage":
            return { type: "number" };
        
        case "checkbox":
            return { type: "boolean" };
        
        case "select":
            return {
                type: "string",
                enum: options && options.length > 0 ? options : undefined,
            };
        
        case "multiselect":
            return {
                type: "string",
                enum: options && options.length > 0 ? options : undefined,
            };
        
        case "party":
            return {
                type: "object",
                properties: {
                    name: { type: "string" },
                    street: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    postalCode: { type: "string" },
                    country: { type: "string" },
                },
                required: ["name", "street", "city", "state", "postalCode", "country"],
            };
        
        case "address":
            return {
                type: "object",
                properties: {
                    street: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    postalCode: { type: "string" },
                    country: { type: "string" },
                },
                required: ["street", "city", "state", "postalCode", "country"],
            };
        
        case "currency":
            return {
                type: "object",
                properties: {
                    amount: { type: "number" },
                    currency: { type: "string" },
                },
                required: ["amount", "currency"],
            };
        
        case "phone":
            return {
                type: "object",
                properties: {
                    countryCode: { type: "string" },
                    number: { type: "string" },
                },
                required: ["countryCode", "number"],
            };
        
        default:
            return { type: "string" };
    }
};

// Parse JSON schema to get selected field names
const parseSchemaToSelectedFields = (schemaStr: string): Set<string> => {
    const selected = new Set<string>();
    try {
        if (!schemaStr || !schemaStr.trim()) return selected;

        const schema = JSON.parse(schemaStr);
        if (schema.type === "object" && schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
                selected.add(key);
            });
        }
    } catch (e) {
        console.error("Failed to parse schema", e);
    }
    return selected;
};

// Convert selected fields to JSON schema
const convertSelectedFieldsToSchema = (
    selectedFields: Set<string>,
    subsequentScreens: SubsequentScreen[]
): string => {
    const properties: any = {};
    const required: string[] = [];

    subsequentScreens.forEach((screen) => {
        screen.fields.forEach((field) => {
            if (selectedFields.has(field.name)) {
                const schemaDef = fieldTypeToSchemaType(field.type, field.options);
                properties[field.name] = {
                    type: schemaDef.type,
                    description: field.label,
                    ...(schemaDef.enum && { enum: schemaDef.enum }),
                    ...(schemaDef.properties && { properties: schemaDef.properties }),
                    ...(schemaDef.required && { required: schemaDef.required }),
                };
                required.push(field.name);
            }
        });
    });

    const schema = {
        type: "object",
        properties,
        required,
    };

    return JSON.stringify(schema, null, 2);
};

export function SchemaBuilder({ value, onChange, subsequentScreens = [] }: SchemaBuilderProps) {
    const [mode, setMode] = useState<"visual" | "code">("visual");
    const [selectedFields, setSelectedFields] = useState<Set<string>>(() => 
        parseSchemaToSelectedFields(value)
    );
    const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());
    const [jsonError, setJsonError] = useState<string | null>(null);
    const lastSyncedSchema = useRef<string>(value);

    // Initialize expanded screens
    useEffect(() => {
        if (subsequentScreens.length > 0 && expandedScreens.size === 0) {
            setExpandedScreens(new Set(subsequentScreens.map(s => s.id)));
        }
    }, [subsequentScreens, expandedScreens.size]);

    // Keep selected fields in sync with incoming value when using visual mode
    useEffect(() => {
        if (mode !== "visual") return;
        if (value === lastSyncedSchema.current) return;

        setSelectedFields(parseSchemaToSelectedFields(value));
        lastSyncedSchema.current = value;
    }, [value, mode]);

    // Handle mode switch
    const toggleMode = () => {
        if (mode === "visual") {
            // Switching to code: generate JSON from selected fields
            const schema = convertSelectedFieldsToSchema(selectedFields, subsequentScreens);
            lastSyncedSchema.current = schema;
            onChange(schema);
            setMode("code");
        } else {
            // Switching to visual: parse JSON to selected fields
            try {
                const parsed = parseSchemaToSelectedFields(value);
                setSelectedFields(parsed);
                lastSyncedSchema.current = value;
                setJsonError(null);
                setMode("visual");
            } catch (e) {
                setJsonError("Invalid JSON schema. Fix errors before switching to visual mode.");
            }
        }
    };

    // Update parent when selected fields change (if in visual mode)
    useEffect(() => {
        if (mode !== "visual") return;
        
        // If no subsequent screens, don't modify existing schema
        if (!subsequentScreens.length) return;

        const schema = convertSelectedFieldsToSchema(selectedFields, subsequentScreens);
        
        // Avoid overwriting non-empty schema with empty schema
        // This can happen when existing schema has field names that don't match subsequent screen fields
        const generatedProperties = JSON.parse(schema).properties || {};
        const hasGeneratedFields = Object.keys(generatedProperties).length > 0;
        
        // Only update if:
        // 1. We generated fields, OR
        // 2. User explicitly cleared all selections (selectedFields is empty)
        if (hasGeneratedFields || selectedFields.size === 0) {
            lastSyncedSchema.current = schema;
            if (schema !== value) {
                onChange(schema);
            }
        }
    }, [selectedFields, mode, onChange, value, subsequentScreens]);

    const toggleFieldSelection = (fieldName: string) => {
        setSelectedFields((prev) => {
            const next = new Set(prev);
            if (next.has(fieldName)) {
                next.delete(fieldName);
            } else {
                next.add(fieldName);
            }
            return next;
        });
    };

    const toggleScreenExpansion = (screenId: string) => {
        setExpandedScreens((prev) => {
            const next = new Set(prev);
            if (next.has(screenId)) {
                next.delete(screenId);
            } else {
                next.add(screenId);
            }
            return next;
        });
    };

    // Get field type label for display
    const getFieldTypeLabel = (fieldType: FieldType): string => {
        const labels: Record<FieldType, string> = {
            text: "Text",
            email: "Email",
            date: "Date",
            number: "Number",
            checkbox: "Boolean",
            select: "Select",
            multiselect: "Multi-Select",
            textarea: "Text Area",
            phone: "Phone",
            address: "Address",
            party: "Party",
            currency: "Currency",
            percentage: "Percentage",
            url: "URL",
        };
        return labels[fieldType] || fieldType;
    };

    const sortedScreens = useMemo(() => {
        return [...subsequentScreens].sort((a, b) => a.order - b.order);
    }, [subsequentScreens]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label>Output Schema</Label>
                    <Badge variant="outline" className="text-xs">
                        {mode === "visual" ? "Visual" : "Code"}
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
                    {sortedScreens.length === 0 ? (
                        <div className="text-center py-8 text-[hsl(var(--globe-grey))]">
                            <LayoutList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No subsequent screens available</p>
                            <p className="text-xs text-[hsl(var(--globe-grey))] mt-1">
                                Add screens after this one to select fields for the output schema
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedScreens.map((screen) => {
                                const isExpanded = expandedScreens.has(screen.id);
                                const screenFields = screen.fields || [];
                                const selectedCount = screenFields.filter(f => selectedFields.has(f.name)).length;

                                return (
                                    <div
                                        key={screen.id}
                                        className="border border-[hsl(var(--border))] rounded-md bg-background"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleScreenExpansion(screen.id)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                                                )}
                                                <span className="font-medium text-sm text-[hsl(var(--fg))]">
                                                    {screen.title}
                                                </span>
                                                {selectedCount > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {selectedCount} selected
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="px-3 pb-3 space-y-2 border-t border-[hsl(var(--border))] pt-3">
                                                {screenFields.length === 0 ? (
                                                    <p className="text-xs text-[hsl(var(--globe-grey))] italic">
                                                        No fields in this screen
                                                    </p>
                                                ) : (
                                                    screenFields.map((field) => {
                                                        const isSelected = selectedFields.has(field.name);
                                                        const schemaDef = fieldTypeToSchemaType(field.type, field.options);
                                                        const hasEnum = schemaDef.enum && schemaDef.enum.length > 0;
                                                        const isObject = schemaDef.type === "object";

                                                        return (
                                                            <div
                                                                key={field.id}
                                                                className={cn(
                                                                    "flex items-start gap-3 p-2 rounded-md border transition-colors",
                                                                    isSelected
                                                                        ? "border-[hsl(var(--selise-blue))]/50 bg-[hsl(var(--selise-blue))]/5"
                                                                        : "border-[hsl(var(--border))] hover:border-[hsl(var(--selise-blue))]/30"
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleFieldSelection(field.name)}
                                                                    className="mt-0.5"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-sm text-[hsl(var(--fg))]">
                                                                            {field.label}
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {getFieldTypeLabel(field.type)}
                                                                        </Badge>
                                                                        {isObject && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                Object
                                                                            </Badge>
                                                                        )}
                                                                        {hasEnum && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {schemaDef.enum!.length} options
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-[hsl(var(--globe-grey))] mt-0.5 font-mono">
                                                                        {field.name}
                                                                    </p>
                                                                    {hasEnum && isSelected && (
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {schemaDef.enum!.map((option, idx) => (
                                                                                <Badge
                                                                                    key={idx}
                                                                                    variant="secondary"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {option}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

