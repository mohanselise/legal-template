/**
 * Organization Template Screen API - Single Screen Operations
 *
 * GET    /api/org/[orgId]/templates/[id]/screens/[screenId] - Get a screen
 * PATCH  /api/org/[orgId]/templates/[id]/screens/[screenId] - Update a screen
 * DELETE /api/org/[orgId]/templates/[id]/screens/[screenId] - Delete a screen
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { $Enums } from "@/lib/generated/prisma/client";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; id: string; screenId: string }> };

const updateScreenSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["standard", "signatory", "dynamic"]).optional(),
  order: z.number().int().min(0).optional(),
  aiPrompt: z.string().nullable().optional(),
  aiOutputSchema: z.string().nullable().optional(),
  dynamicPrompt: z.string().nullable().optional(),
  dynamicMaxFields: z.number().int().min(1).max(20).nullable().optional(),
  signatoryConfig: z.string().nullable().optional(),
  enableApplyStandards: z.boolean().optional(),
  conditions: z.string().nullable().optional(),
});

/**
 * GET /api/org/[orgId]/templates/[id]/screens/[screenId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId, screenId } = await params;

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

    const screen = await prisma.templateScreen.findFirst({
      where: { id: screenId, templateId },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
    });

    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    return NextResponse.json(screen);
  } catch (error) {
    console.error("[ORG_SCREEN_GET]", error);
    return NextResponse.json({ error: "Failed to fetch screen" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/[orgId]/templates/[id]/screens/[screenId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId, screenId } = await params;

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
    const validation = updateScreenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if screen exists and belongs to template
    const existingScreen = await prisma.templateScreen.findFirst({
      where: { id: screenId, templateId },
    });

    if (!existingScreen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.type) {
      updateData.type = validation.data.type as $Enums.ScreenType;
    }

    await prisma.templateScreen.update({
      where: { id: screenId },
      data: updateData,
    });

    const screen = await prisma.templateScreen.findUnique({
      where: { id: screenId },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(screen);
  } catch (error) {
    console.error("[ORG_SCREEN_PATCH]", error);
    return NextResponse.json({ error: "Failed to update screen" }, { status: 500 });
  }
}

/**
 * DELETE /api/org/[orgId]/templates/[id]/screens/[screenId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id: templateId, screenId } = await params;

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

    const existingScreen = await prisma.templateScreen.findFirst({
      where: { id: screenId, templateId },
    });

    if (!existingScreen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    await prisma.templateScreen.delete({
      where: { id: screenId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORG_SCREEN_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete screen" }, { status: 500 });
  }
}
