import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { OrgLayoutClient } from "./_components/org-layout-client";
import { mapClerkOrgRole, getOrganizationBySlugWithSync } from "@/lib/auth/organization";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get organization from database by slug (with auto-sync from Clerk if not found)
  const organization = await getOrganizationBySlugWithSync(slug, orgId);

  if (!organization) {
    notFound();
  }

  // Verify user is a member of this organization
  if (!orgId || organization.clerkOrgId !== orgId) {
    // User is not in this organization
    redirect(`/${locale}/org/unauthorized`);
  }

  const role = mapClerkOrgRole(orgRole ?? undefined);

  if (!role) {
    redirect(`/${locale}/org/unauthorized`);
  }

  return (
    <OrgLayoutClient
      locale={locale}
      orgSlug={slug}
      orgName={organization.name}
      orgRole={role}
    >
      {children}
    </OrgLayoutClient>
  );
}
