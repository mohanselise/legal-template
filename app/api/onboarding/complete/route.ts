/**
 * Onboarding Complete API
 *
 * POST /api/onboarding/complete - Mark onboarding as fully completed
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/onboarding/complete
 * Mark onboarding as completed
 */
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update profile to mark onboarding as complete
    const profile = await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
      create: {
        clerkUserId: userId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      completedAt: profile.onboardingCompletedAt,
    });
  } catch (error) {
    console.error("[ONBOARDING_COMPLETE_POST]", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
