import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const settingsSchema = z.object({
  commonPromptInstructions: z.string().optional(),
});

/**
 * GET /api/admin/settings
 * Get system settings
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create settings
    let commonPromptInstructions = await prisma.systemSettings.findUnique({
      where: { key: "commonPromptInstructions" },
    });

    // If not found, return empty (will use default in frontend)
    return NextResponse.json({
      commonPromptInstructions: commonPromptInstructions?.value || null,
    });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { commonPromptInstructions } = validation.data;

    // Upsert common prompt instructions
    if (commonPromptInstructions !== undefined) {
      await prisma.systemSettings.upsert({
        where: { key: "commonPromptInstructions" },
        update: {
          value: commonPromptInstructions,
          updatedBy: userId,
        },
        create: {
          key: "commonPromptInstructions",
          value: commonPromptInstructions,
          description: "Common prompt instructions appended to all template system prompts",
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

