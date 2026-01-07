import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { NewOrgTemplateForm } from "./_components/new-org-template-form";

export default async function NewOrgTemplatePage({
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

  // Only admins and editors can create templates
  if (role !== "org_admin" && role !== "org_editor") {
    redirect(`/${locale}/org/${slug}`);
  }

  // Get organization from database
  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  return (
    <NewOrgTemplateForm
      locale={locale}
      orgSlug={slug}
      orgId={organization.id}
    />
  );
}
