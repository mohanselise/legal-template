/**
 * Onboarding Progress API
 *
 * POST /api/onboarding/progress - Save step completion progress
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

const VALID_STEPS = ["profile", "org_settings", "invite_team"] as const;
type OnboardingStep = (typeof VALID_STEPS)[number];

/**
 * POST /api/onboarding/progress
 * Mark a step as completed
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stepId } = body;

    if (!stepId || !VALID_STEPS.includes(stepId as OnboardingStep)) {
      return NextResponse.json(
        { error: "Invalid step ID. Must be one of: " + VALID_STEPS.join(", ") },
        { status: 400 }
      );
    }

    // Get or create user profile
    let profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { clerkUserId: userId },
      });
    }

    // Add step to completed steps (if not already there)
    const completedSteps = new Set(profile.onboardingStepsCompleted);
    completedSteps.add(stepId);

    // Update profile
    const updated = await prisma.userProfile.update({
      where: { clerkUserId: userId },
      data: {
        onboardingStepsCompleted: Array.from(completedSteps),
      },
    });

    return NextResponse.json({
      success: true,
      stepsCompleted: updated.onboardingStepsCompleted,
    });
  } catch (error) {
    console.error("[ONBOARDING_PROGRESS_POST]", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
