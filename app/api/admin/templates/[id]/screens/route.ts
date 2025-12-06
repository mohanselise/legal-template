import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { $Enums } from "@/lib/generated/prisma/client";

// Schema for creating a screen
const createScreenSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["standard", "signatory", "dynamic"]).default("standard"),
  order: z.number().int().min(0).optional(),
  aiPrompt: z.string().optional(),
  aiOutputSchema: z.string().optional(),
  // Dynamic screen fields
  dynamicPrompt: z.string().nullable().optional(),
  dynamicMaxFields: z.number().int().min(1).max(20).nullable().optional(),
  // UILM Translation Keys
  uilmTitleKey: z.string().nullable().optional(),
  uilmDescriptionKey: z.string().nullable().optional(),
  // Apply Standards feature
  enableApplyStandards: z.boolean().optional().default(false),
});

// Schema for reordering screens
const reorderScreensSchema = z.object({
  screenIds: z.array(z.string()),
});

/**
 * GET /api/admin/templates/[id]/screens
 * List all screens for a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const screens = await prisma.templateScreen.findMany({
      where: { templateId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error("[SCREENS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch screens" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates/[id]/screens
 * Create a new screen for a template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createScreenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, description, type, order, aiPrompt, aiOutputSchema, dynamicPrompt, dynamicMaxFields, enableApplyStandards } = validation.data;

    // If order not provided, add to end
    let finalOrder = order;
    if (finalOrder === undefined) {
      const lastScreen = await prisma.templateScreen.findFirst({
        where: { templateId },
        orderBy: { order: "desc" },
      });
      finalOrder = lastScreen ? lastScreen.order + 1 : 0;
    }

    // Create screen without include to avoid implicit transaction
    // (Neon HTTP adapter does not support transactions)
    const screenType = (type || "standard") as $Enums.ScreenType;
    const isDynamic = screenType === $Enums.ScreenType.dynamic;
    const screen = await prisma.templateScreen.create({
      data: {
        templateId,
        title,
        description,
        type: screenType,
        order: finalOrder,
        aiPrompt,
        aiOutputSchema,
        // Dynamic screen configuration
        dynamicPrompt: isDynamic ? dynamicPrompt : null,
        dynamicMaxFields: isDynamic ? (dynamicMaxFields ?? 5) : null,
        // Apply Standards feature
        enableApplyStandards: enableApplyStandards ?? false,
      },
    });

    // Return screen with empty fields array (new screens have no fields)
    const screenWithFields = {
      ...screen,
      fields: [],
    };

    return NextResponse.json(screenWithFields, { status: 201 });
  } catch (error) {
    console.error("[SCREENS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create screen" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/templates/[id]/screens
 * Reorder screens for a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;

    const body = await request.json();
    const validation = reorderScreensSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { screenIds } = validation.data;

    // Update order for each screen sequentially
    // (Neon HTTP adapter does not support transactions)
    for (let index = 0; index < screenIds.length; index++) {
      await prisma.templateScreen.update({
        where: { id: screenIds[index] },
        data: { order: index },
      });
    }

    // Fetch updated screens
    const screens = await prisma.templateScreen.findMany({
      where: { templateId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error("[SCREENS_REORDER]", error);
    return NextResponse.json(
      { error: "Failed to reorder screens" },
      { status: 500 }
    );
  }
}

