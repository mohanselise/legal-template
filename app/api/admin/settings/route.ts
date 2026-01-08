import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearSystemSettingCache,
  getBlocksProjectKey,
  getOpenRouterApiKey,
  getSeliseClientId,
  getSeliseClientSecret,
} from "@/lib/system-settings";

const settingsSchema = z.object({
  // Document generation settings
  documentGenerationAiModel: z.string().optional(),
  commonPromptInstructions: z.string().optional(),
  documentGenerationOutputInUserLocale: z.boolean().optional(),
  // Dynamic form AI settings
  dynamicFormAiModel: z.string().optional(),
  dynamicFormSystemPrompt: z.string().optional(),
  dynamicFormOutputInUserLocale: z.boolean().optional(),
  // Form enrichment AI settings
  formEnrichmentAiModel: z.string().optional(),
  formEnrichmentOutputInUserLocale: z.boolean().optional(),
  // Template AI Configurator settings
  templateConfiguratorAiModel: z.string().optional(),
  templateConfiguratorBusinessLogic: z.string().optional(),
  // Integration keys
  blocksProjectKey: z.string().optional(),
  openRouterApiKey: z.string().optional(),
  seliseClientId: z.string().optional(),
  seliseClientSecret: z.string().optional(),
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
    const [
      documentGenerationAiModel,
      commonPromptInstructions,
      documentGenerationOutputInUserLocale,
      dynamicFormAiModel,
      dynamicFormSystemPrompt,
      dynamicFormOutputInUserLocale,
      formEnrichmentAiModel,
      formEnrichmentOutputInUserLocale,
      templateConfiguratorAiModel,
      templateConfiguratorBusinessLogic,
      blocksProjectKey,
      openRouterApiKey,
      seliseClientId,
      seliseClientSecret,
    ] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: "documentGenerationAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "commonPromptInstructions" } }),
      prisma.systemSettings.findUnique({ where: { key: "documentGenerationOutputInUserLocale" } }),
      prisma.systemSettings.findUnique({ where: { key: "dynamicFormAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "dynamicFormSystemPrompt" } }),
      prisma.systemSettings.findUnique({ where: { key: "dynamicFormOutputInUserLocale" } }),
      prisma.systemSettings.findUnique({ where: { key: "formEnrichmentAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "formEnrichmentOutputInUserLocale" } }),
      prisma.systemSettings.findUnique({ where: { key: "templateConfiguratorAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "templateConfiguratorBusinessLogic" } }),
      getBlocksProjectKey(),
      getOpenRouterApiKey(),
      getSeliseClientId(),
      getSeliseClientSecret(),
    ]);

    // If not found, return empty (will use default in frontend)
    return NextResponse.json({
      documentGenerationAiModel: documentGenerationAiModel?.value || null,
      commonPromptInstructions: commonPromptInstructions?.value || null,
      documentGenerationOutputInUserLocale: documentGenerationOutputInUserLocale?.value === "true",
      dynamicFormAiModel: dynamicFormAiModel?.value || null,
      dynamicFormSystemPrompt: dynamicFormSystemPrompt?.value || null,
      dynamicFormOutputInUserLocale: dynamicFormOutputInUserLocale?.value === "true",
      formEnrichmentAiModel: formEnrichmentAiModel?.value || null,
      formEnrichmentOutputInUserLocale: formEnrichmentOutputInUserLocale?.value === "true",
      templateConfiguratorAiModel: templateConfiguratorAiModel?.value || null,
      templateConfiguratorBusinessLogic: templateConfiguratorBusinessLogic?.value || null,
      blocksProjectKey: blocksProjectKey || null,
      openRouterApiKey: openRouterApiKey || null,
      seliseClientId: seliseClientId || null,
      seliseClientSecret: seliseClientSecret || null,
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

    const {
      documentGenerationAiModel,
      commonPromptInstructions,
      documentGenerationOutputInUserLocale,
      dynamicFormAiModel,
      dynamicFormSystemPrompt,
      dynamicFormOutputInUserLocale,
      formEnrichmentAiModel,
      formEnrichmentOutputInUserLocale,
      templateConfiguratorAiModel,
      templateConfiguratorBusinessLogic,
      blocksProjectKey,
      openRouterApiKey,
      seliseClientId,
      seliseClientSecret,
    } = validation.data;

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

    // Document generation output in user locale
    if (documentGenerationOutputInUserLocale !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "documentGenerationOutputInUserLocale" },
          update: {
            value: String(documentGenerationOutputInUserLocale),
            updatedBy: userId,
          },
          create: {
            key: "documentGenerationOutputInUserLocale",
            value: String(documentGenerationOutputInUserLocale),
            description: "Output document generation results in the user's selected locale",
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

    // Dynamic form output in user locale
    if (dynamicFormOutputInUserLocale !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "dynamicFormOutputInUserLocale" },
          update: {
            value: String(dynamicFormOutputInUserLocale),
            updatedBy: userId,
          },
          create: {
            key: "dynamicFormOutputInUserLocale",
            value: String(dynamicFormOutputInUserLocale),
            description: "Output dynamic form fields in the user's selected locale",
            updatedBy: userId,
          },
        })
      );
    }

    // Form enrichment AI model
    if (formEnrichmentAiModel !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "formEnrichmentAiModel" },
          update: {
            value: formEnrichmentAiModel,
            updatedBy: userId,
          },
          create: {
            key: "formEnrichmentAiModel",
            value: formEnrichmentAiModel,
            description: "AI model used for form enrichment and smart suggestions",
            updatedBy: userId,
          },
        })
      );
    }

    // Form enrichment output in user locale
    if (formEnrichmentOutputInUserLocale !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "formEnrichmentOutputInUserLocale" },
          update: {
            value: String(formEnrichmentOutputInUserLocale),
            updatedBy: userId,
          },
          create: {
            key: "formEnrichmentOutputInUserLocale",
            value: String(formEnrichmentOutputInUserLocale),
            description: "Output form enrichment results in the user's selected locale",
            updatedBy: userId,
          },
        })
      );
    }

    // Template configurator AI model
    if (templateConfiguratorAiModel !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "templateConfiguratorAiModel" },
          update: {
            value: templateConfiguratorAiModel,
            updatedBy: userId,
          },
          create: {
            key: "templateConfiguratorAiModel",
            value: templateConfiguratorAiModel,
            description: "AI model used for the template configurator chat assistant",
            updatedBy: userId,
          },
        })
      );
    }

    // Template configurator business logic
    if (templateConfiguratorBusinessLogic !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "templateConfiguratorBusinessLogic" },
          update: {
            value: templateConfiguratorBusinessLogic,
            updatedBy: userId,
          },
          create: {
            key: "templateConfiguratorBusinessLogic",
            value: templateConfiguratorBusinessLogic,
            description: "Business logic and strategy prompt for the template configurator",
            updatedBy: userId,
          },
        })
      );
    }

    if (blocksProjectKey !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "blocksProjectKey" },
          update: {
            value: blocksProjectKey,
            updatedBy: userId,
          },
          create: {
            key: "blocksProjectKey",
            value: blocksProjectKey,
            description: "SELISE Blocks project key used for UILM translations",
            updatedBy: userId,
          },
        })
      );
    }

    if (openRouterApiKey !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "openRouterApiKey" },
          update: {
            value: openRouterApiKey,
            updatedBy: userId,
          },
          create: {
            key: "openRouterApiKey",
            value: openRouterApiKey,
            description: "API key for OpenRouter used by AI features",
            updatedBy: userId,
          },
        })
      );
    }

    if (seliseClientId !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "seliseClientId" },
          update: {
            value: seliseClientId,
            updatedBy: userId,
          },
          create: {
            key: "seliseClientId",
            value: seliseClientId,
            description: "SELISE Signature API Client ID for e-signing",
            updatedBy: userId,
          },
        })
      );
    }

    if (seliseClientSecret !== undefined) {
      upsertPromises.push(
        prisma.systemSettings.upsert({
          where: { key: "seliseClientSecret" },
          update: {
            value: seliseClientSecret,
            updatedBy: userId,
          },
          create: {
            key: "seliseClientSecret",
            value: seliseClientSecret,
            description: "SELISE Signature API Client Secret for e-signing",
            updatedBy: userId,
          },
        })
      );
    }

    await Promise.all(upsertPromises);
    clearSystemSettingCache([
      "blocksProjectKey",
      "openRouterApiKey",
      "seliseClientId",
      "seliseClientSecret",
      "documentGenerationAiModel",
      "commonPromptInstructions",
      "documentGenerationOutputInUserLocale",
      "dynamicFormAiModel",
      "dynamicFormSystemPrompt",
      "dynamicFormOutputInUserLocale",
      "formEnrichmentAiModel",
      "formEnrichmentOutputInUserLocale",
      "templateConfiguratorAiModel",
      "templateConfiguratorBusinessLogic",
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

