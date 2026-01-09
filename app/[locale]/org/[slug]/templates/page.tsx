import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Edit, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewTemplateDialog } from "./_components/new-template-dialog";

export default async function OrgTemplatesPage({
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

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    redirect(`/${locale}`);
  }

  const templates = await prisma.template.findMany({
    where: { organizationId: organization.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { screens: true },
      },
    },
  });

  const canManage = role === "org_admin" || role === "org_editor";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
            Organization Templates
          </h1>
          <p className="text-[hsl(var(--globe-grey))] mt-1">
            Private templates for your organization
          </p>
        </div>
        {canManage && (
          <NewTemplateDialog
            locale={locale}
            orgSlug={slug}
            orgName={organization.name}
            orgId={organization.id}
          />
        )}
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-[hsl(var(--globe-grey))] mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-[hsl(var(--globe-grey))] text-center mb-4">
              Create your first organization template to get started.
            </p>
            {canManage && (
              <NewTemplateDialog
                locale={locale}
                orgSlug={slug}
                orgName={organization.name}
                orgId={organization.id}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:border-[hsl(var(--selise-blue))]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.title}</h3>
                      <p className="text-sm text-[hsl(var(--globe-grey))]">
                        {template.slug} • {template._count.screens} screens
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={template.available ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {template.available ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </>
                      )}
                    </Badge>

                    <div className="flex items-center gap-1">
                      {template.available && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${locale}/templates/${template.slug}/generate`}>
                            Use
                          </Link>
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/${locale}/org/${slug}/templates/${template.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Limits */}
      <div className="text-sm text-[hsl(var(--globe-grey))] text-center">
        {templates.length} / {organization.maxTemplates} templates used
      </div>
    </div>
  );
}
