/**
 * Organization Template Screens API
 *
 * GET   /api/org/[orgId]/templates/[id]/screens - List all screens
 * POST  /api/org/[orgId]/templates/[id]/screens - Create a new screen
 * PATCH /api/org/[orgId]/templates/[id]/screens - Reorder screens
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { $Enums } from "@/lib/generated/prisma/client";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; id: string }> };

const createScreenSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["standard", "signatory", "dynamic"]).default("standard"),
  order: z.number().int().min(0).optional(),
  aiPrompt: z.string().optional(),
  aiOutputSchema: z.string().optional(),
  dynamicPrompt: z.string().nullable().optional(),
  dynamicMaxFields: z.number().int().min(1).max(20).nullable().optional(),
  signatoryConfig: z.string().nullable().optional(),
  enableApplyStandards: z.boolean().optional().default(false),
  conditions: z.string().nullable().optional(),
});

const reorderScreensSchema = z.object({
  screenIds: z.array(z.string()),
});

/**
 * GET /api/org/[orgId]/templates/[id]/screens
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify template belongs to org
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId: orgId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const screens = await prisma.templateScreen.findMany({
      where: { templateId },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error("[ORG_SCREENS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch screens" }, { status: 500 });
  }
}

/**
 * POST /api/org/[orgId]/templates/[id]/screens
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    // Verify template belongs to org
    const template = await prisma.template.findFirst({
      where: { id: templateId, organizationId: orgId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = createScreenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, description, type, order, aiPrompt, aiOutputSchema, dynamicPrompt, dynamicMaxFields, signatoryConfig, enableApplyStandards, conditions } = validation.data;

    let finalOrder = order;
    if (finalOrder === undefined) {
      const lastScreen = await prisma.templateScreen.findFirst({
        where: { templateId },
        orderBy: { order: "desc" },
      });
      finalOrder = lastScreen ? lastScreen.order + 1 : 0;
    }

    const screenType = (type || "standard") as $Enums.ScreenType;
    const isDynamic = screenType === $Enums.ScreenType.dynamic;
    const isSignatory = screenType === $Enums.ScreenType.signatory;

    const screen = await prisma.templateScreen.create({
      data: {
        templateId,
        title,
        description,
        type: screenType,
        order: finalOrder,
        aiPrompt,
        aiOutputSchema,
        dynamicPrompt: isDynamic ? dynamicPrompt : null,
        dynamicMaxFields: isDynamic ? (dynamicMaxFields ?? 5) : null,
        signatoryConfig: isSignatory ? signatoryConfig : null,
        enableApplyStandards: enableApplyStandards ?? false,
        conditions: conditions ?? null,
      },
    });

    return NextResponse.json({ ...screen, fields: [] }, { status: 201 });
  } catch (error) {
    console.error("[ORG_SCREENS_POST]", error);
    return NextResponse.json({ error: "Failed to create screen" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/[orgId]/templates/[id]/screens
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    const body = await request.json();
    const validation = reorderScreensSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { screenIds } = validation.data;

    for (let index = 0; index < screenIds.length; index++) {
      await prisma.templateScreen.update({
        where: { id: screenIds[index] },
        data: { order: index },
      });
    }

    const screens = await prisma.templateScreen.findMany({
      where: { templateId },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(screens);
  } catch (error) {
    console.error("[ORG_SCREENS_REORDER]", error);
    return NextResponse.json({ error: "Failed to reorder screens" }, { status: 500 });
  }
}
