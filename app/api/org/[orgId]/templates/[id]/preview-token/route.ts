/**
 * Organization Templates API - Preview Token Management
 *
 * POST   /api/org/[orgId]/templates/[id]/preview-token - Generate a new preview token
 * DELETE /api/org/[orgId]/templates/[id]/preview-token - Remove the preview token
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = {
  params: Promise<{ orgId: string; id: string }>;
};

/**
 * POST /api/org/[orgId]/templates/[id]/preview-token
 * Generate a new preview token for the organization template
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Verify user can manage templates
    if (!(await canManageOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to manage templates" },
        { status: 403 }
      );
    }

    // Check if template exists and belongs to this organization
    const template = await prisma.template.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Generate a new preview token
    const previewToken = randomUUID();

    // Update template with new preview token
    const updated = await prisma.template.update({
      where: { id },
      data: { previewToken },
    });

    return NextResponse.json({
      previewToken: updated.previewToken,
      message: "Preview token generated successfully",
    });
  } catch (error) {
    console.error("[ORG_TEMPLATE_PREVIEW_TOKEN_POST]", error);
    return NextResponse.json(
      { error: "Failed to generate preview token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]/templates/[id]/preview-token
 * Remove the preview token (disable preview access)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Verify user can manage templates
    if (!(await canManageOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to manage templates" },
        { status: 403 }
      );
    }

    // Check if template exists and belongs to this organization
    const template = await prisma.template.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Remove preview token
    await prisma.template.update({
      where: { id },
      data: { previewToken: null },
    });

    return NextResponse.json({
      message: "Preview token removed successfully",
    });
  } catch (error) {
    console.error("[ORG_TEMPLATE_PREVIEW_TOKEN_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove preview token" },
      { status: 500 }
    );
  }
}
