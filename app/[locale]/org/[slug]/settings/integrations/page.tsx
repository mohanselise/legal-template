import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { IntegrationsSettings } from "./_components/integrations-settings";

export default async function SettingsIntegrationsPage({
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
      seliseClientId: true,
      seliseClientSecret: true,
    },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[hsl(var(--fg))] font-heading">
          Integrations
        </h2>
        <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
          Connect external services and APIs
        </p>
      </div>

      <IntegrationsSettings
        orgId={organization.id}
        hasSeliseCredentials={!!(organization.seliseClientId && organization.seliseClientSecret)}
      />
    </div>
  );
}
