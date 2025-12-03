import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const settingsSchema = z.object({
  // Document generation settings
  documentGenerationAiModel: z.string().optional(),
  commonPromptInstructions: z.string().optional(),
  // Dynamic form AI settings
  dynamicFormAiModel: z.string().optional(),
  dynamicFormSystemPrompt: z.string().optional(),
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

    // Get all settings
    const [documentGenerationAiModel, commonPromptInstructions, dynamicFormAiModel, dynamicFormSystemPrompt] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: "documentGenerationAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "commonPromptInstructions" } }),
      prisma.systemSettings.findUnique({ where: { key: "dynamicFormAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "dynamicFormSystemPrompt" } }),
    ]);

    // If not found, return empty (will use default in frontend)
    return NextResponse.json({
      documentGenerationAiModel: documentGenerationAiModel?.value || null,
      commonPromptInstructions: commonPromptInstructions?.value || null,
      dynamicFormAiModel: dynamicFormAiModel?.value || null,
      dynamicFormSystemPrompt: dynamicFormSystemPrompt?.value || null,
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

    const { documentGenerationAiModel, commonPromptInstructions, dynamicFormAiModel, dynamicFormSystemPrompt } = validation.data;

    // Upsert settings in parallel
    const upsertPromises = [];

    // Document generation AI model
    if (documentGenerationAiModel !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "documentGenerationAiModel" },
          update: {
            value: documentGenerationAiModel,
            updatedBy: userId,
          },
          create: {
            key: "documentGenerationAiModel",
            value: documentGenerationAiModel,
            description: "AI model used for generating legal documents",
            updatedBy: userId,
          },
        })
      );
    }

    // Common prompt instructions
    if (commonPromptInstructions !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
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
        })
      );
    }

    // Dynamic form AI model
    if (dynamicFormAiModel !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "dynamicFormAiModel" },
          update: {
            value: dynamicFormAiModel,
            updatedBy: userId,
          },
          create: {
            key: "dynamicFormAiModel",
            value: dynamicFormAiModel,
            description: "AI model used for generating dynamic form fields",
            updatedBy: userId,
          },
        })
      );
    }

    // Dynamic form system prompt
    if (dynamicFormSystemPrompt !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "dynamicFormSystemPrompt" },
          update: {
            value: dynamicFormSystemPrompt,
            updatedBy: userId,
          },
          create: {
            key: "dynamicFormSystemPrompt",
            value: dynamicFormSystemPrompt,
            description: "System prompt for generating dynamic form fields",
            updatedBy: userId,
          },
        })
      );
    }

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

