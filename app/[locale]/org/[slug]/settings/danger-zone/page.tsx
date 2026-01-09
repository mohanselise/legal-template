import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { DangerZoneSettings } from "./_components/danger-zone-settings";

export default async function SettingsDangerZonePage({
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

  if (role !== "org_admin") {
    redirect(`/${locale}/org/${slug}`);
  }

  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[hsl(var(--crimson))] font-heading">
          Danger Zone
        </h2>
        <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
          Irreversible actions that permanently affect your organization
        </p>
      </div>

      <DangerZoneSettings orgId={organization.id} orgName={organization.name} />
    </div>
  );
}
