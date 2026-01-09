import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { EditOrgTemplateForm } from "./_components/edit-org-template-form";

export default async function EditOrgTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; id: string }>;
}) {
  const { locale, slug, id } = await params;
  const { userId, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = mapClerkOrgRole(orgRole ?? undefined);

  // Only admins and editors can edit templates
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

  // Get template with screens
  const template = await prisma.template.findFirst({
    where: {
      id,
      organizationId: organization.id,
    },
    include: {
      screens: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!template) {
    redirect(`/${locale}/org/${slug}/templates`);
  }

  return (
    <EditOrgTemplateForm
      locale={locale}
      orgSlug={slug}
      orgId={organization.id}
      template={template}
      previewToken={template.previewToken}
    />
  );
}
