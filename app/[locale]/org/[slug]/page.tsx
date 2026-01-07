import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock } from "lucide-react";

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const { orgId } = await auth();

  // Get organization with template count
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { templates: true },
      },
    },
  });

  if (!organization) {
    return null;
  }

  // Get recent templates
  const recentTemplates = await prisma.template.findMany({
    where: { organizationId: organization.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      available: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
          Welcome to {organization.name}
        </h1>
        <p className="text-[hsl(var(--globe-grey))] mt-1">
          Manage your organization&apos;s templates and team members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization._count.templates}
            </div>
            <p className="text-xs text-[hsl(var(--globe-grey))]">
              {organization.maxTemplates - organization._count.templates}{" "}
              remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Limit</CardTitle>
            <Users className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.maxUsers}</div>
            <p className="text-xs text-[hsl(var(--globe-grey))]">
              Maximum team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Clock className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(organization.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
            <p className="text-xs text-[hsl(var(--globe-grey))]">
              Organization created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTemplates.length === 0 ? (
            <p className="text-[hsl(var(--globe-grey))] text-sm">
              No templates yet. Create your first template to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                    <div>
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-xs text-[hsl(var(--globe-grey))]">
                        {template.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        template.available
                          ? "bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]"
                          : "bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
                      }`}
                    >
                      {template.available ? "Active" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
