import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, FieldType } from "@/lib/db";

// Schema for creating a field
const createFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "email", "date", "number", "checkbox", "select"]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).default([]),
  order: z.number().int().min(0).optional(),
});

// Schema for reordering fields
const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string()),
});

/**
 * GET /api/admin/screens/[screenId]/fields
 * List all fields for a screen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { screenId } = await params;

    // Verify screen exists
    const screen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
    });

    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const fields = await prisma.templateField.findMany({
      where: { screenId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("[FIELDS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/screens/[screenId]/fields
 * Create a new field for a screen
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { screenId } = await params;

    // Verify screen exists
    const screen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
    });

    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = createFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, label, type, required, placeholder, helpText, options, order } =
      validation.data;

    // Check for duplicate field name within the same screen
    const existingField = await prisma.templateField.findFirst({
      where: {
        screenId,
        name,
      },
    });

    if (existingField) {
      return NextResponse.json(
        { error: `Field with name "${name}" already exists in this screen` },
        { status: 400 }
      );
    }

    // If order not provided, add to end
    let finalOrder = order;
    if (finalOrder === undefined) {
      const lastField = await prisma.templateField.findFirst({
        where: { screenId },
        orderBy: { order: "desc" },
      });
      finalOrder = lastField ? lastField.order + 1 : 0;
    }

    const field = await prisma.templateField.create({
      data: {
        screenId,
        name,
        label,
        type: type as FieldType,
        required,
        placeholder,
        helpText,
        options,
        order: finalOrder,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("[FIELDS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create field" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/screens/[screenId]/fields
 * Reorder fields for a screen
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { screenId } = await params;

    const body = await request.json();
    const validation = reorderFieldsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { fieldIds } = validation.data;

    // Update order for each field
    await prisma.$transaction(
      fieldIds.map((fieldId, index) =>
        prisma.templateField.update({
          where: { id: fieldId },
          data: { order: index },
        })
      )
    );

    // Fetch updated fields
    const fields = await prisma.templateField.findMany({
      where: { screenId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("[FIELDS_REORDER]", error);
    return NextResponse.json(
      { error: "Failed to reorder fields" },
      { status: 500 }
    );
  }
}

