import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, FieldType } from "@/lib/db";

// Schema for updating a field
const updateFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").optional(),
  label: z.string().min(1, "Label is required").optional(),
  type: z.enum([
    "text", "email", "date", "number", "checkbox", "select", "multiselect",
    "textarea", "phone", "address", "party", "currency", "percentage", "url"
  ]).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  options: z.array(z.string()).optional(),
  order: z.number().int().min(0).optional(),
  // Cross-screen movement - move field to a different screen
  screenId: z.string().optional(),
  // AI Smart Suggestions from enrichment context
  aiSuggestionEnabled: z.boolean().optional(),
  aiSuggestionKey: z.string().nullable().optional().transform(val => val?.trim() || null),
  // UILM Translation Keys
  uilmLabelKey: z.string().nullable().optional(),
  uilmPlaceholderKey: z.string().nullable().optional(),
  uilmHelpTextKey: z.string().nullable().optional(),
  uilmOptionsKeys: z.array(z.string()).optional(),
  // Conditional visibility - show/hide field based on other form responses
  conditions: z.string().nullable().optional(),
});

/**
 * GET /api/admin/fields/[fieldId]
 * Get a single field
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldId } = await params;

    const field = await prisma.templateField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json(field);
  } catch (error) {
    console.error("[FIELD_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch field" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/fields/[fieldId]
 * Update a field
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldId } = await params;

    const body = await request.json();
    const validation = updateFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if field exists
    const existingField = await prisma.templateField.findUnique({
      where: { id: fieldId },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // If moving to a new screen, verify target screen exists
    const targetScreenId = validation.data.screenId || existingField.screenId;
    if (validation.data.screenId && validation.data.screenId !== existingField.screenId) {
      const targetScreen = await prisma.templateScreen.findUnique({
        where: { id: validation.data.screenId },
      });
      if (!targetScreen) {
        return NextResponse.json(
          { error: "Target screen not found" },
          { status: 404 }
        );
      }
    }

    // If updating name, check for duplicates in the target screen
    if (validation.data.name && validation.data.name !== existingField.name) {
      const duplicateField = await prisma.templateField.findFirst({
        where: {
          screenId: targetScreenId,
          name: validation.data.name,
          NOT: { id: fieldId },
        },
      });

      if (duplicateField) {
        return NextResponse.json(
          { error: `Field with name "${validation.data.name}" already exists in this screen` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.type) {
      updateData.type = validation.data.type as FieldType;
    }
    
    // Handle cross-screen movement - assign new order if moving screens
    if (validation.data.screenId && validation.data.screenId !== existingField.screenId) {
      // Get the next order in the target screen
      const lastFieldInTarget = await prisma.templateField.findFirst({
        where: { screenId: validation.data.screenId },
        orderBy: { order: "desc" },
      });
      updateData.order = lastFieldInTarget ? lastFieldInTarget.order + 1 : 0;
    }
    
    // Handle aiSuggestionKey - convert empty string to null
    // The zod schema already handles trimming, but we ensure it's properly set
    if (validation.data.aiSuggestionKey !== undefined) {
      updateData.aiSuggestionKey = validation.data.aiSuggestionKey;
    }

    const field = await prisma.templateField.update({
      where: { id: fieldId },
      data: updateData,
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("[FIELD_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update field" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fields/[fieldId]
 * Delete a field
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldId } = await params;

    // Check if field exists
    const existingField = await prisma.templateField.findUnique({
      where: { id: fieldId },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.templateField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FIELD_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete field" },
      { status: 500 }
    );
  }
}

