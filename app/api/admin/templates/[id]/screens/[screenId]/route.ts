import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { $Enums } from "@/lib/generated/prisma/client";
import { requireAdminOrEditorRole } from "@/lib/auth/roles";

// Schema for updating a screen
const updateScreenSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["standard", "signatory", "dynamic"]).optional(),
  order: z.number().int().min(0).optional(),
  aiPrompt: z.string().nullable().optional(),
  aiOutputSchema: z.string().nullable().optional(),
  // Dynamic screen fields
  dynamicPrompt: z.string().nullable().optional(),
  dynamicMaxFields: z.number().int().min(1).max(20).nullable().optional(),
  // Signatory screen configuration (JSON string)
  signatoryConfig: z.string().nullable().optional(),
  // UILM Translation Keys
  uilmTitleKey: z.string().nullable().optional(),
  uilmDescriptionKey: z.string().nullable().optional(),
  // Apply Standards feature
  enableApplyStandards: z.boolean().optional(),
  // Conditional visibility - show/hide screen based on previous form responses
  conditions: z.string().nullable().optional(),
});

/**
 * GET /api/admin/templates/[id]/screens/[screenId]
 * Get a single screen with its fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or editor role
    const forbidden = await requireAdminOrEditorRole();
    if (forbidden) return forbidden;

    const { screenId } = await params;

    const screen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    return NextResponse.json(screen);
  } catch (error) {
    console.error("[SCREEN_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch screen" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/templates/[id]/screens/[screenId]
 * Update a screen
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or editor role
    const forbidden = await requireAdminOrEditorRole();
    if (forbidden) return forbidden;

    const { screenId } = await params;

    const body = await request.json();
    const validation = updateScreenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if screen exists
    const existingScreen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
    });

    if (!existingScreen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    // Update screen without include to avoid implicit transaction
    // (Neon HTTP adapter does not support transactions)
    // Transform type to ScreenType enum if provided
    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.type) {
      updateData.type = validation.data.type as $Enums.ScreenType;
    }
    
    await prisma.templateScreen.update({
      where: { id: screenId },
      data: updateData,
    });

    // Fetch updated screen with fields in separate query
    const screen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(screen);
  } catch (error) {
    console.error("[SCREEN_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update screen" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]/screens/[screenId]
 * Delete a screen and all its fields
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; screenId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or editor role
    const forbidden = await requireAdminOrEditorRole();
    if (forbidden) return forbidden;

    const { screenId } = await params;

    // Check if screen exists
    const existingScreen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
    });

    if (!existingScreen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    // Delete screen (fields will be cascade deleted)
    await prisma.templateScreen.delete({
      where: { id: screenId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SCREEN_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete screen" },
      { status: 500 }
    );
  }
}
