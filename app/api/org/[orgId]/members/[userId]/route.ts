/**
 * Individual Member Management API
 *
 * PATCH  /api/org/[orgId]/members/[userId] - Update member role
 * DELETE /api/org/[orgId]/members/[userId] - Remove member from org
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  canAccessOrganization,
  isOrgAdmin,
  mapClerkOrgRole,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; userId: string }> };

/**
 * PATCH /api/org/[orgId]/members/[userId]
 * Update a member's role (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: currentUserId } = await auth();
    const { orgId, userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Only admins can update roles
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ["org:admin", "org:editor", "org:member"];
    const clerkRole = role?.startsWith("org:")
      ? role
      : role
        ? `org:${role}`
        : null;

    if (!clerkRole || !validRoles.includes(clerkRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or member" },
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

    // Prevent self-demotion from admin
    if (currentUserId === targetUserId && clerkRole !== "org:admin") {
      // Check if this is the last admin
      const memberships =
        await client.organizations.getOrganizationMembershipList({
          organizationId: org.clerkOrgId,
        });

      const adminCount = memberships.data.filter(
        (m) => m.role === "org:admin"
      ).length;

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot demote yourself. Organization must have at least one admin.",
          },
          { status: 400 }
        );
      }
    }

    // Find the membership to update
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: org.clerkOrgId,
      });

    const membership = memberships.data.find(
      (m) => m.publicUserData?.userId === targetUserId
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Update the role
    const updatedMembership =
      await client.organizations.updateOrganizationMembership({
        organizationId: org.clerkOrgId,
        userId: targetUserId,
        role: clerkRole,
      });

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMembership.id,
        clerkUserId: updatedMembership.publicUserData?.userId,
        role: mapClerkOrgRole(updatedMembership.role),
      },
    });
  } catch (error) {
    console.error("[ORG_MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]/members/[userId]
 * Remove a member from the organization (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: currentUserId } = await auth();
    const { orgId, userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Only admins can remove members (unless removing self)
    const isAdmin = await isOrgAdmin();
    if (!isAdmin && currentUserId !== targetUserId) {
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

    const client = await clerkClient();

    // Check if trying to remove self as last admin
    if (currentUserId === targetUserId) {
      const memberships =
        await client.organizations.getOrganizationMembershipList({
          organizationId: org.clerkOrgId,
        });

      const currentMembership = memberships.data.find(
        (m) => m.publicUserData?.userId === currentUserId
      );

      if (currentMembership?.role === "org:admin") {
        const adminCount = memberships.data.filter(
          (m) => m.role === "org:admin"
        ).length;

        if (adminCount <= 1) {
          return NextResponse.json(
            {
              error:
                "Cannot leave organization. You are the last admin. Transfer ownership first or delete the organization.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Remove the member
    await client.organizations.deleteOrganizationMembership({
      organizationId: org.clerkOrgId,
      userId: targetUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORG_MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
