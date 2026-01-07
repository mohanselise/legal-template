/**
 * Organization API - Create and Get
 *
 * POST /api/org - Create a new organization
 * GET  /api/org - Get current user's organization
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  getActiveOrganization,
  getOrganizationByClerkId,
} from "@/lib/auth/organization";

/**
 * GET /api/org
 * Get the current user's active organization
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ organization: null });
    }

    const organization = await getActiveOrganization();

    if (!organization) {
      // Org exists in Clerk but not synced to our DB yet
      return NextResponse.json({
        organization: null,
        pending: true,
        message: "Organization is being set up",
      });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("[ORG_GET]", error);
    return NextResponse.json(
      { error: "Failed to get organization" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org
 * Create a new organization via Clerk
 * The webhook will sync it to our database
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Create organization in Clerk
    const clerkOrg = await client.organizations.createOrganization({
      name: name.trim(),
      slug: slug.toLowerCase(),
      createdBy: userId,
    });

    // Wait briefly for webhook to process (optional, improves UX)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Try to get the synced organization
    const organization = await getOrganizationByClerkId(clerkOrg.id);

    return NextResponse.json({
      success: true,
      organization: organization || {
        clerkOrgId: clerkOrg.id,
        name: clerkOrg.name,
        slug: clerkOrg.slug,
        pending: true,
      },
    });
  } catch (error: any) {
    console.error("[ORG_POST]", error);

    // Handle Clerk-specific errors
    if (error.errors?.[0]?.code === "form_identifier_exists") {
      return NextResponse.json(
        { error: "An organization with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create organization" },
      { status: 500 }
    );
  }
}
