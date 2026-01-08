/**
 * Onboarding Profile API
 *
 * PATCH /api/onboarding/profile - Update user profile information
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/onboarding/profile
 * Update profile information (name, job title, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, jobTitle, department } = body;

    // Update Clerk user if name provided
    if (firstName !== undefined || lastName !== undefined) {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      });
    }

    // Upsert local profile
    const profile = await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: {
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
      },
      create: {
        clerkUserId: userId,
        jobTitle: jobTitle || null,
        department: department || null,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        jobTitle: profile.jobTitle,
        department: profile.department,
      },
    });
  } catch (error) {
    console.error("[ONBOARDING_PROFILE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
