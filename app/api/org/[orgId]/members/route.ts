/**
 * Organization Members API
 *
 * GET  /api/org/[orgId]/members - List all members
 * POST /api/org/[orgId]/members - Invite a new member
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  canAccessOrganization,
  isOrgAdmin,
  mapClerkOrgRole,
  type OrgRole,
} from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * Serialized member for API response
 */
interface SerializedMember {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: OrgRole | null;
  imageUrl: string | null;
  createdAt: number;
}

/**
 * GET /api/org/[orgId]/members
 * List all members of the organization
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

    // Get org from our database to find clerkOrgId
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

    const client = await clerkClient();

    // Get organization memberships from Clerk
    const membershipsResponse =
      await client.organizations.getOrganizationMembershipList({
        organizationId: org.clerkOrgId,
        limit,
        offset,
      });

    // Serialize members for response
    const members: SerializedMember[] = membershipsResponse.data.map((m) => ({
      id: m.id,
      clerkUserId: m.publicUserData?.userId || "",
      email: m.publicUserData?.identifier || "",
      firstName: m.publicUserData?.firstName || null,
      lastName: m.publicUserData?.lastName || null,
      role: mapClerkOrgRole(m.role),
      imageUrl: m.publicUserData?.imageUrl || null,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      members,
      totalCount: membershipsResponse.totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ORG_MEMBERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgId]/members
 * Invite a new member to the organization (admin only)
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

    // Only admins can invite members
    if (!(await isOrgAdmin())) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate role - must be one of our org roles
    const validRoles = ["org:admin", "org:editor", "org:member"];
    const clerkRole = role?.startsWith("org:")
      ? role
      : role
        ? `org:${role}`
        : "org:member";

    if (!validRoles.includes(clerkRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or member" },
        { status: 400 }
      );
    }

    // Get org from our database to find clerkOrgId
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check member limit
    const client = await clerkClient();
    const currentMembers =
      await client.organizations.getOrganizationMembershipList({
        organizationId: org.clerkOrgId,
        limit: 1,
      });

    if (currentMembers.totalCount >= org.maxUsers) {
      return NextResponse.json(
        {
          error: `Member limit reached (${org.maxUsers}). Upgrade your plan to add more members.`,
        },
        { status: 403 }
      );
    }

    // Create invitation via Clerk - redirect to sign-up for new users
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitation =
      await client.organizations.createOrganizationInvitation({
        organizationId: org.clerkOrgId,
        emailAddress: email,
        role: clerkRole,
        inviterUserId: userId,
        redirectUrl: `${baseUrl}/sign-up`,
      });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.emailAddress,
        role: mapClerkOrgRole(invitation.role),
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[ORG_MEMBERS_POST]", error);

    // Handle Clerk-specific errors
    if (error.errors?.[0]?.code === "duplicate_record") {
      return NextResponse.json(
        { error: "This user is already a member or has a pending invitation" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to invite member" },
      { status: 500 }
    );
  }
}
