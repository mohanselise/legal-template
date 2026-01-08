import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  mapClerkOrgRole,
  getOrganizationByClerkId,
} from "@/lib/auth/organization";
import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, orgId, orgRole } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Get organization details if user is in an org
  let organization = null;
  if (orgId) {
    organization = await getOrganizationByClerkId(orgId);
  }

  // Check if onboarding is already completed
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  if (profile?.onboardingCompleted && organization) {
    // Already onboarded - redirect to org dashboard
    redirect(`/${locale}/org/${organization.slug}`);
  }

  // Map role
  const role = mapClerkOrgRole(orgRole ?? undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <OnboardingWizard
        locale={locale}
        orgRole={role}
        orgSlug={organization?.slug ?? null}
        orgName={organization?.name ?? null}
        orgId={organization?.id ?? null}
        initialProfile={{
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          jobTitle: profile?.jobTitle ?? null,
          department: profile?.department ?? null,
        }}
        stepsCompleted={profile?.onboardingStepsCompleted ?? []}
      />
    </div>
  );
}
