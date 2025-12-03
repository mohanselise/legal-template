import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCompletionWithTracking } from "@/lib/openrouter";
import { getSessionId } from "@/lib/analytics/session";
import { FieldType } from "@/lib/db";

const generateFieldsSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  formData: z.record(z.any()).optional().default({}),
  enrichmentContext: z.record(z.any()).optional().default({}),
  maxFields: z.number().int().min(1).max(20).optional().default(5),
  screenTitle: z.string().optional(),
  screenDescription: z.string().optional(),
});

// Get all field types from Prisma enum (automatically updates when new types are added)
const SUPPORTED_FIELD_TYPES = Object.values(FieldType);

// Rich field type descriptions for AI context
const FIELD_TYPE_DESCRIPTIONS: Record<string, { description: string; properties: string[]; example: string }> = {
  text: {
    description: "Single-line text input for short answers",
    properties: ["placeholder", "helpText"],
    example: "Company name, person's name, short description",
  },
  email: {
    description: "Email address input with validation",
    properties: ["placeholder", "helpText"],
    example: "Contact email, notification email",
  },
  date: {
    description: "Date picker for selecting dates",
    properties: ["placeholder", "helpText"],
    example: "Agreement date, expiration date, effective date",
  },
  number: {
    description: "Numeric input for quantities or amounts",
    properties: ["placeholder", "helpText"],
    example: "Duration in months, monetary amounts, quantities",
  },
  checkbox: {
    description: "Yes/No toggle for boolean options",
    properties: ["helpText"],
    example: "Agree to terms, include optional clause, enable feature",
  },
  select: {
    description: "Dropdown menu for choosing from predefined options",
    properties: ["options", "helpText"],
    example: "Jurisdiction selection, contract type, duration options",
  },
};

// Generate schema documentation for AI
function generateFieldSchemaDocumentation(): string {
  const docs = SUPPORTED_FIELD_TYPES.map((type) => {
    const info = FIELD_TYPE_DESCRIPTIONS[type] || {
      description: `${type} field`,
      properties: ["helpText"],
      example: "General input",
    };
    return `- **${type}**: ${info.description}
    - Properties: ${info.properties.join(", ")}
    - Use for: ${info.example}`;
  });
  
  return docs.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = generateFieldsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { prompt, formData, enrichmentContext, maxFields, screenTitle, screenDescription } = validation.data;

    // Combine formData and enrichmentContext for variable interpolation
    const allContext = { ...formData, ...enrichmentContext };

    // Interpolate variables in the prompt (e.g., {{jurisdiction}}, {{purpose}})
    let interpolatedPrompt = prompt;
    Object.entries(allContext).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number") {
        interpolatedPrompt = interpolatedPrompt.replace(
          new RegExp(`{{${key}}}`, "g"),
          String(value)
        );
      }
    });

    // Also handle nested object interpolation (e.g., {{company.name}})
    interpolatedPrompt = interpolatedPrompt.replace(/{{([^}]+)}}/g, (match, path) => {
      const value = getNestedValue(allContext, path.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });

    // Generate dynamic schema documentation
    const fieldSchemaDoc = generateFieldSchemaDocumentation();
    const fieldTypesList = SUPPORTED_FIELD_TYPES.join(", ");

    const systemPrompt = `You are an AI assistant helping to create dynamic form fields for a legal document generator.

Your task is to generate relevant form questions based on the user's context and requirements.

## AVAILABLE FIELD TYPES

${fieldSchemaDoc}

## RULES

1. Generate between 1 and ${maxFields} fields maximum
2. Each field must have a unique "name" (camelCase, no spaces or special characters)
3. ONLY use these field types: ${fieldTypesList}
4. For "select" type fields, you MUST include an "options" array with string values
5. Make fields contextually relevant to the legal document being created
6. Include helpful "helpText" that explains why this information is needed (legal context)
7. Set "required" to true for critical information, false for optional details
8. Generate fields that would gather information not already provided in the context
9. Choose the most appropriate field type for each question

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "fields": [
    {
      "name": "fieldNameInCamelCase",
      "label": "Human Readable Label",
      "type": "${fieldTypesList}",
      "required": true|false,
      "placeholder": "Optional placeholder text (not for checkbox)",
      "helpText": "Explanation of why this is needed in legal context",
      "options": ["only", "for", "select", "type"]
    }
  ],
  "reasoning": "Brief explanation of why these fields were chosen based on the jurisdiction/context"
}`;

    const userMessage = `Context from previous form steps:
${JSON.stringify(allContext, null, 2)}

${screenTitle ? `Screen Title: ${screenTitle}` : ""}
${screenDescription ? `Screen Description: ${screenDescription}` : ""}

User's Request:
${interpolatedPrompt}

Generate appropriate form fields based on this context. Remember:
- Maximum ${maxFields} fields
- Only use supported field types: ${SUPPORTED_FIELD_TYPES.join(", ")}
- Make fields relevant to the legal document context`;

    // Get session ID for analytics
    const sessionId = await getSessionId();

    const completion = await createCompletionWithTracking(
      {
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      },
      {
        sessionId,
        endpoint: "/api/ai/generate-dynamic-fields",
      }
    );

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    const jsonResponse = JSON.parse(content);

    // Validate and sanitize the generated fields
    const validatedFields = validateAndSanitizeFields(jsonResponse.fields || [], maxFields);

    return NextResponse.json({
      fields: validatedFields,
      reasoning: jsonResponse.reasoning || null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI_GENERATE_DYNAMIC_FIELDS]", error);
    return NextResponse.json(
      { error: "Failed to generate dynamic fields" },
      { status: 500 }
    );
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Validate and sanitize AI-generated fields
 */
function validateAndSanitizeFields(
  fields: unknown[],
  maxFields: number
): Array<{
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: string[];
}> {
  if (!Array.isArray(fields)) return [];

  const validatedFields: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
    options: string[];
  }> = [];

  const usedNames = new Set<string>();

  for (const field of fields.slice(0, maxFields)) {
    if (!field || typeof field !== "object") continue;

    const f = field as Record<string, unknown>;

    // Validate required properties
    if (typeof f.name !== "string" || !f.name.trim()) continue;
    if (typeof f.label !== "string" || !f.label.trim()) continue;

    // Sanitize name to be valid identifier
    let name = f.name.replace(/[^a-zA-Z0-9]/g, "");
    if (!name || !/^[a-zA-Z]/.test(name)) {
      name = "field" + name;
    }

    // Ensure unique name
    if (usedNames.has(name)) {
      name = name + "_" + (usedNames.size + 1);
    }
    usedNames.add(name);

    // Validate type
    const type = SUPPORTED_FIELD_TYPES.includes(f.type as any)
      ? (f.type as string)
      : "text";

    // Handle options for select type
    let options: string[] = [];
    if (type === "select" && Array.isArray(f.options)) {
      options = f.options.filter((o): o is string => typeof o === "string" && o.trim() !== "");
      if (options.length === 0) {
        // If select has no valid options, convert to text
        continue;
      }
    }

    validatedFields.push({
      id: `dynamic_${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      label: String(f.label).trim(),
      type,
      required: Boolean(f.required),
      placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
      helpText: typeof f.helpText === "string" ? f.helpText : undefined,
      options,
    });
  }

  return validatedFields;
}

