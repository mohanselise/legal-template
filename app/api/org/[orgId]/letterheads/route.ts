/**
 * Organization Letterheads API
 *
 * GET  /api/org/[orgId]/letterheads - List all letterheads
 * POST /api/org/[orgId]/letterheads - Create a new letterhead
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, unsetOtherDefaultLetterheads } from "@/lib/db";
import {
  canAccessOrganization,
  isOrgAdmin,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * GET /api/org/[orgId]/letterheads
 * List all letterheads for an organization
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId } = await params;

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

    const letterheads = await prisma.organizationLetterhead.findMany({
      where: { organizationId: orgId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ letterheads });
  } catch (error) {
    console.error("[LETTERHEADS_GET]", error);
    return NextResponse.json(
      { error: "Failed to get letterheads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgId]/letterheads
 * Create a new letterhead
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId } = await params;

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

    // Only admins can create letterheads
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      fileUrl,
      fileKey,
      fileName,
      fileType,
      pageWidth,
      pageHeight,
      contentArea,
      isDefault,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Letterhead name is required" },
        { status: 400 }
      );
    }

    if (!fileUrl || !fileKey || !fileName || !fileType) {
      return NextResponse.json(
        { error: "File information is required" },
        { status: 400 }
      );
    }

    if (!pageWidth || !pageHeight || pageWidth <= 0 || pageHeight <= 0) {
      return NextResponse.json(
        { error: "Valid page dimensions are required" },
        { status: 400 }
      );
    }

    if (!contentArea || typeof contentArea !== "object") {
      return NextResponse.json(
        { error: "Content area is required" },
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

    const letterhead = await prisma.organizationLetterhead.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        fileUrl,
        fileKey,
        fileName,
        fileType,
        pageWidth: Math.round(pageWidth),
        pageHeight: Math.round(pageHeight),
        contentAreaX: Math.round(x),
        contentAreaY: Math.round(y),
        contentAreaWidth: Math.round(width),
        contentAreaHeight: Math.round(height),
        isDefault: !!isDefault,
      },
    });

    // If this letterhead is set as default, unset other defaults (uses raw SQL to avoid transaction issues)
    if (isDefault) {
      await unsetOtherDefaultLetterheads(orgId, letterhead.id);
    }

    return NextResponse.json({ letterhead }, { status: 201 });
  } catch (error) {
    console.error("[LETTERHEADS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create letterhead" },
      { status: 500 }
    );
  }
}
