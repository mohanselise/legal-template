/**
 * Admin Users API - Single User Operations
 *
 * GET    /api/admin/users/:userId - Get user details
 * PATCH  /api/admin/users/:userId - Update user role
 * DELETE /api/admin/users/:userId - Delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { getUserRole, type UserRole } from "@/lib/auth/roles";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/users/:userId
 * Get single user details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const currentUserData = await currentUser();
    const role = getUserRole(currentUserData);
    
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await context.params;
    const client = await clerkClient();

    const user = await client.users.getUser(userId);

    return NextResponse.json({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName,
      lastName: user.lastName,
      role: (user.privateMetadata?.role as UserRole) || null,
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt,
      imageUrl: user.imageUrl,
    });
  } catch (error: any) {
    console.error("[ADMIN_USER_GET]", error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/:userId
 * Update user role
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const currentUserData = await currentUser();
    const currentRole = getUserRole(currentUserData);
    
    if (currentRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await context.params;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !["admin", "editor"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role (admin or editor) is required" },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin role
    if (userId === authUserId && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Update user's privateMetadata with new role
    const updatedUser = await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        role,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress || "",
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: (updatedUser.privateMetadata?.role as UserRole) || null,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_USER_PATCH]", error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const currentUserData = await currentUser();
    const role = getUserRole(currentUserData);
    
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    // Prevent admin from deleting themselves
    if (userId === authUserId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    await client.users.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("[ADMIN_USER_DELETE]", error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

