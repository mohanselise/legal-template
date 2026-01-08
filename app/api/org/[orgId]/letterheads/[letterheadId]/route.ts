/**
 * Individual Letterhead API
 *
 * GET    /api/org/[orgId]/letterheads/[letterheadId] - Get letterhead details
 * PATCH  /api/org/[orgId]/letterheads/[letterheadId] - Update letterhead
 * DELETE /api/org/[orgId]/letterheads/[letterheadId] - Delete letterhead
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import {
  canAccessOrganization,
  isOrgAdmin,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; letterheadId: string }> };

const utapi = new UTApi();

/**
 * GET /api/org/[orgId]/letterheads/[letterheadId]
 * Get a single letterhead
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, letterheadId } = await params;

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

    const letterhead = await prisma.organizationLetterhead.findUnique({
      where: { id: letterheadId },
    });

    if (!letterhead) {
      return NextResponse.json(
        { error: "Letterhead not found" },
        { status: 404 }
      );
    }

    // Verify letterhead belongs to this organization
    if (letterhead.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Letterhead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ letterhead });
  } catch (error) {
    console.error("[LETTERHEAD_GET]", error);
    return NextResponse.json(
      { error: "Failed to get letterhead" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgId]/letterheads/[letterheadId]
 * Update a letterhead
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, letterheadId } = await params;

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

    // Only admins can update letterheads
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Check letterhead exists and belongs to this org
    const existing = await prisma.organizationLetterhead.findUnique({
      where: { id: letterheadId },
    });

    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Letterhead not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, isDefault, contentArea } = body;

    const updateData: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Letterhead name is required" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (contentArea !== undefined) {
      if (typeof contentArea !== "object") {
        return NextResponse.json(
          { error: "Content area must be an object" },
          { status: 400 }
        );
      }

      const { x, y, width, height } = contentArea;
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof width !== "number" ||
        typeof height !== "number"
      ) {
        return NextResponse.json(
          { error: "Content area must have x, y, width, and height as numbers" },
          { status: 400 }
        );
      }

      updateData.contentAreaX = Math.round(x);
      updateData.contentAreaY = Math.round(y);
      updateData.contentAreaWidth = Math.round(width);
      updateData.contentAreaHeight = Math.round(height);
    }

    // Handle isDefault toggle
    if (isDefault !== undefined) {
      if (isDefault && !existing.isDefault) {
        // Setting as default - unset other defaults first
        await prisma.organizationLetterhead.updateMany({
          where: { organizationId: orgId, isDefault: true },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = !!isDefault;
    }

    const letterhead = await prisma.organizationLetterhead.update({
      where: { id: letterheadId },
      data: updateData,
    });

    return NextResponse.json({ letterhead });
  } catch (error) {
    console.error("[LETTERHEAD_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update letterhead" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]/letterheads/[letterheadId]
 * Delete a letterhead
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, letterheadId } = await params;

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

    // Only admins can delete letterheads
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Check letterhead exists and belongs to this org
    const letterhead = await prisma.organizationLetterhead.findUnique({
      where: { id: letterheadId },
    });

    if (!letterhead || letterhead.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Letterhead not found" },
        { status: 404 }
      );
    }

    // Delete from UploadThing
    try {
      await utapi.deleteFiles(letterhead.fileKey);
    } catch (utError) {
      console.error("[LETTERHEAD_DELETE] UploadThing delete error:", utError);
      // Continue with DB deletion even if UploadThing fails
    }

    // Delete from database
    await prisma.organizationLetterhead.delete({
      where: { id: letterheadId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LETTERHEAD_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete letterhead" },
      { status: 500 }
    );
  }
}
