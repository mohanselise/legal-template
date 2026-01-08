"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { StepProfile } from "./step-profile";
import { StepOrgSettings } from "./step-org-settings";
import { StepInviteTeam } from "./step-invite-team";
import { StepComplete } from "./step-complete";
import type { OrgRole } from "@/lib/auth/organization";

interface OnboardingWizardProps {
  locale: string;
  orgRole: OrgRole | null;
  orgSlug: string | null;
  orgName: string | null;
  orgId: string | null;
  initialProfile: {
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    jobTitle: string | null;
    department: string | null;
  };
  stepsCompleted: string[];
}

interface Step {
  id: string;
  title: string;
}

export function OnboardingWizard({
  locale,
  orgRole,
  orgSlug,
  orgName,
  orgId,
  initialProfile,
  stepsCompleted: initialStepsCompleted,
}: OnboardingWizardProps) {
  const router = useRouter();
  const isAdmin = orgRole === "org_admin";

  // Build steps based on role
  const steps: Step[] = [
    { id: "profile", title: "Your Profile" },
    ...(isAdmin
      ? [
          { id: "org_settings", title: "Organization" },
          { id: "invite_team", title: "Invite Team" },
        ]
      : []),
    { id: "complete", title: "Get Started" },
  ];

  // Calculate initial step based on completed steps
  const getInitialStep = () => {
    for (let i = 0; i < steps.length - 1; i++) {
      if (!initialStepsCompleted.includes(steps[i].id)) {
        return i;
      }
    }
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(initialStepsCompleted)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: initialProfile.firstName ?? "",
    lastName: initialProfile.lastName ?? "",
    jobTitle: initialProfile.jobTitle ?? "",
    department: initialProfile.department ?? "",
  });

  // Org settings state (for admins)
  const [orgData, setOrgData] = useState({
    name: orgName ?? "",
    logoUrl: "",
  });

  const saveProgress = useCallback(async (stepId: string) => {
    try {
      await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, []);

  const handleStepComplete = useCallback(
    async (stepId: string) => {
      setIsLoading(true);
      try {
        await saveProgress(stepId);
        setCompletedSteps((prev) => new Set([...prev, stepId]));
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      } finally {
        setIsLoading(false);
      }
    },
    [saveProgress, steps.length]
  );

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      // Redirect to org dashboard or home
      if (orgSlug) {
        router.push(`/${locale}/org/${orgSlug}`);
      } else {
        router.push(`/${locale}`);
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsLoading(false);
    }
  }, [locale, orgSlug, router]);

  const handleSkip = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "profile":
        return (
          <StepProfile
            data={profileData}
            onChange={setProfileData}
            onComplete={() => handleStepComplete("profile")}
            isLoading={isLoading}
          />
        );
      case "org_settings":
        return (
          <StepOrgSettings
            orgId={orgId}
            data={orgData}
            onChange={setOrgData}
            onComplete={() => handleStepComplete("org_settings")}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        );
      case "invite_team":
        return (
          <StepInviteTeam
            orgId={orgId}
            onComplete={() => handleStepComplete("invite_team")}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        );
      case "complete":
        return (
          <StepComplete
            orgName={orgName}
            orgSlug={orgSlug}
            locale={locale}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-aptos)] text-3xl font-bold text-[hsl(var(--fg))]">
          {orgName ? `Welcome to ${orgName}` : "Welcome"}
        </h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          Let&apos;s get you set up in just a few steps
        </p>
      </div>

      {/* Stepper */}
      <Stepper
        steps={steps}
        currentStep={currentStep}
        allowNavigation={false}
      />

      {/* Step content */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-white p-6 shadow-sm">
        {renderStep()}
      </div>
    </div>
  );
}
