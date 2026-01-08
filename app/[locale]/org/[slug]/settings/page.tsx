import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { OrgSettingsForm } from "./_components/org-settings-form";
import { DangerZone } from "./_components/danger-zone";
import { LetterheadSection } from "./_components/letterhead-section";

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const { userId, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = mapClerkOrgRole(orgRole ?? undefined);

  // Only admins can access settings
  if (role !== "org_admin") {
    redirect(`/${locale}/org/${slug}`);
  }

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Organization Settings
        </h1>
        <p className="text-[hsl(var(--globe-grey))] mt-1">
          Manage your organization&apos;s settings and preferences
        </p>
      </div>

      <OrgSettingsForm
        orgId={organization.id}
        initialData={{
          name: organization.name,
          slug: organization.slug,
          logoUrl: organization.logoUrl,
          hasSeliseCredentials: !!(organization.seliseClientId && organization.seliseClientSecret),
        }}
      />

      <DangerZone orgId={organization.id} orgName={organization.name} />
    </div>
  );
}
