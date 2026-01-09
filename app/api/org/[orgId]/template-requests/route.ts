/**
 * Organization Template Requests API
 *
 * POST /api/org/[orgId]/template-requests - Request SELISE team to create a template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = {
  params: Promise<{ orgId: string }>;
};

/**
 * POST /api/org/[orgId]/template-requests
 * Submit a request for SELISE team to create a template
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

    // Verify user can manage templates
    if (!(await canManageOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to manage templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, organizationName } = body;

    // Get user details
    const user = await currentUser();

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Store the request in the database
    const templateRequest = await prisma.templateRequest.create({
      data: {
        organizationId: orgId,
        requestedBy: userId,
        requesterEmail: user?.emailAddresses?.[0]?.emailAddress || "",
        requesterName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown",
        type: type || "collaboration",
        status: "pending",
        notes: `Template creation request for ${organizationName || organization.name}`,
      },
    });

    // TODO: Send notification email to SELISE team
    // This could be implemented with a service like SendGrid, Resend, etc.

    return NextResponse.json({
      success: true,
      requestId: templateRequest.id,
      message: "Template request submitted successfully",
    });
  } catch (error) {
    console.error("[ORG_TEMPLATE_REQUEST_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit template request" },
      { status: 500 }
    );
  }
}
