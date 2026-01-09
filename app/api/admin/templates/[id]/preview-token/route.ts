/**
 * Admin Templates API - Preview Token Management
 *
 * POST   /api/admin/templates/[id]/preview-token - Generate a new preview token
 * DELETE /api/admin/templates/[id]/preview-token - Remove the preview token
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { requireAdminOrEditorRole } from "@/lib/auth/roles";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/templates/[id]/preview-token
 * Generate a new preview token for the template
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or editor role
    const forbidden = await requireAdminOrEditorRole();
    if (forbidden) return forbidden;

    const { id } = await params;

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id },
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
    console.error("[ADMIN_TEMPLATE_PREVIEW_TOKEN_POST]", error);
    return NextResponse.json(
      { error: "Failed to generate preview token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]/preview-token
 * Remove the preview token (disable preview access)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or editor role
    const forbidden = await requireAdminOrEditorRole();
    if (forbidden) return forbidden;

    const { id } = await params;

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id },
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
    console.error("[ADMIN_TEMPLATE_PREVIEW_TOKEN_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove preview token" },
      { status: 500 }
    );
  }
}
