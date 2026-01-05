/**
 * Admin Users API - List and Invite
 *
 * GET  /api/admin/users - List all users with pagination
 * POST /api/admin/users - Invite a new user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserRole, type UserRole } from "@/lib/auth/roles";

/**
 * Serialized user for API response
 */
interface SerializedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole | null;
  lastSignInAt: number | null;
  createdAt: number;
  imageUrl: string | null;
}

/**
 * GET /api/admin/users
 * List all users with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await currentUser();
    const role = getUserRole(user);
    
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || undefined;

    const client = await clerkClient();
    
    // Fetch users from Clerk
    const usersResponse = await client.users.getUserList({
      limit,
      offset,
      query: search,
      orderBy: "-created_at",
    });

    // Serialize users for response
    const users: SerializedUser[] = usersResponse.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      firstName: u.firstName,
      lastName: u.lastName,
      role: (u.privateMetadata?.role as UserRole) || null,
      lastSignInAt: u.lastSignInAt,
      createdAt: u.createdAt,
      imageUrl: u.imageUrl,
    }));

    return NextResponse.json({
      users,
      totalCount: usersResponse.totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Invite a new user with a specific role
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await currentUser();
    const role = getUserRole(user);
    
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role: inviteRole } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!inviteRole || !["admin", "editor"].includes(inviteRole)) {
      return NextResponse.json(
        { error: "Valid role (admin or editor) is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Create invitation
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        pendingRole: inviteRole, // Store pending role to apply after signup
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/sign-in`,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_USERS_POST]", error);
    
    // Handle Clerk-specific errors
    if (error.errors?.[0]?.code === "form_identifier_exists") {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to invite user" },
      { status: 500 }
    );
  }
}

