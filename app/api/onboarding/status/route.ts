/**
 * Onboarding Status API
 *
 * GET /api/onboarding/status - Check onboarding completion status
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/onboarding/status
 * Returns the user's onboarding status
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user profile
    let profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await prisma.userProfile.create({
        data: { clerkUserId: userId },
      });
    }

    return NextResponse.json({
      completed: profile.onboardingCompleted,
      completedAt: profile.onboardingCompletedAt,
      stepsCompleted: profile.onboardingStepsCompleted,
      profile: {
        jobTitle: profile.jobTitle,
        department: profile.department,
      },
    });
  } catch (error) {
    console.error("[ONBOARDING_STATUS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}
