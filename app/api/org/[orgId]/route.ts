/**
 * Organization CRUD API
 *
 * GET    /api/org/[orgId] - Get organization details
 * PATCH  /api/org/[orgId] - Update organization settings
 * DELETE /api/org/[orgId] - Delete organization
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  canAccessOrganization,
  isOrgAdmin,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * GET /api/org/[orgId]
 * Get organization details
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

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { templates: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Return organization with credential status (not actual values)
    const { seliseClientId, seliseClientSecret, ...orgWithoutCredentials } = organization;
    return NextResponse.json({
      organization: {
        ...orgWithoutCredentials,
        hasSeliseCredentials: !!(seliseClientId && seliseClientSecret),
      },
    });
  } catch (error) {
    console.error("[ORG_GET_BY_ID]", error);
    return NextResponse.json(
      { error: "Failed to get organization" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgId]
 * Update organization settings (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId: activeOrgId } = await auth();
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

    // Only admins can update org settings
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, logoUrl, maxUsers, maxTemplates, seliseClientId, seliseClientSecret } = body;

    // Build update data
    const updateData: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Organization name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }
      updateData.slug = slug.toLowerCase();
    }

    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl;
    }

    if (maxUsers !== undefined) {
      updateData.maxUsers = maxUsers;
    }

    if (maxTemplates !== undefined) {
      updateData.maxTemplates = maxTemplates;
    }

    // Handle SELISE Signature credentials
    // Allow empty string to clear credentials (falls back to system settings)
    if (seliseClientId !== undefined) {
      updateData.seliseClientId = seliseClientId || null;
    }

    if (seliseClientSecret !== undefined) {
      updateData.seliseClientSecret = seliseClientSecret || null;
    }

    // Get the organization to find clerkOrgId
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update in Clerk first (if name or slug changed)
    if (updateData.name || updateData.slug) {
      const client = await clerkClient();
      await client.organizations.updateOrganization(org.clerkOrgId, {
        name: updateData.name,
        slug: updateData.slug,
      });
    }

    // Update in our database
    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
    });

    return NextResponse.json({ organization });
  } catch (error: any) {
    console.error("[ORG_PATCH]", error);

    if (error.errors?.[0]?.code === "form_identifier_exists") {
      return NextResponse.json(
        { error: "An organization with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]
 * Delete organization (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Only admins can delete org
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get the organization to find clerkOrgId
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Delete from Clerk (this will trigger webhook to delete from our DB)
    const client = await clerkClient();
    await client.organizations.deleteOrganization(org.clerkOrgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORG_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
