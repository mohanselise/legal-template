import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { LetterheadSection } from "../_components/letterhead-section";

export default async function SettingsLetterheadsPage({
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
    include: {
      letterheads: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[hsl(var(--fg))] font-heading">
          Company Letterheads
        </h2>
        <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
          Upload and manage letterheads for your organization&apos;s documents
        </p>
      </div>

      <LetterheadSection
        orgId={organization.id}
        initialLetterheads={organization.letterheads}
      />
    </div>
  );
}
