import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mapClerkOrgRole } from "@/lib/auth/organization";
import { MembersTable } from "./_components/members-table";
import { InviteMemberForm } from "./_components/invite-member-form";
import { PendingInvitations } from "./_components/pending-invitations";

export default async function OrgUsersPage({
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

  // Only admins can access team management
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
            Team Members
          </h1>
          <p className="text-[hsl(var(--globe-grey))] mt-1">
            Manage your organization&apos;s team members and invitations
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MembersTable orgId={organization.id} />
          <PendingInvitations orgId={organization.id} />
        </div>
        <div>
          <InviteMemberForm
            orgId={organization.id}
            maxUsers={organization.maxUsers}
          />
        </div>
      </div>
    </div>
  );
}
