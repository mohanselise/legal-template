/**
 * Organization Invitations API
 *
 * GET    /api/org/[orgId]/invitations - List pending invitations
 * DELETE /api/org/[orgId]/invitations - Revoke an invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  canAccessOrganization,
  isOrgAdmin,
  mapClerkOrgRole,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * GET /api/org/[orgId]/invitations
 * List all pending invitations
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

    // Only admins can view invitations
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get org from our database
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "pending";

    const client = await clerkClient();

    // Get invitations from Clerk
    const invitationsResponse =
      await client.organizations.getOrganizationInvitationList({
        organizationId: org.clerkOrgId,
        limit,
        offset,
        status: [status] as ("pending" | "accepted" | "revoked")[],
      });

    const invitations = invitationsResponse.data.map((inv) => ({
      id: inv.id,
      email: inv.emailAddress,
      role: mapClerkOrgRole(inv.role),
      status: inv.status,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    return NextResponse.json({
      invitations,
      totalCount: invitationsResponse.totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ORG_INVITATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]/invitations
 * Revoke a pending invitation (admin only)
 * Body: { invitationId: string }
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

    // Only admins can revoke invitations
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Get org from our database
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const client = await clerkClient();

    // Revoke the invitation
    await client.organizations.revokeOrganizationInvitation({
      organizationId: org.clerkOrgId,
      invitationId,
      requestingUserId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORG_INVITATIONS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
