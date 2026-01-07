import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateOrganization } from "@clerk/nextjs";

export default async function CreateOrgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, orgId } = await auth();

  // Must be signed in
  if (!userId) {
    redirect("/sign-in");
  }

  // If already in an org, redirect to that org's dashboard
  if (orgId) {
    // Get org slug from Clerk
    const { orgSlug } = await auth();
    if (orgSlug) {
      redirect(`/${locale}/org/${orgSlug}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))] py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading mb-2">
            Create Your Organization
          </h1>
          <p className="text-[hsl(var(--globe-grey))]">
            Set up your enterprise account to start creating private templates
            for your team.
          </p>
        </div>

        <CreateOrganization
          afterCreateOrganizationUrl="/org/:slug"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg border border-[hsl(var(--border))] rounded-xl",
              headerTitle: "font-heading",
              formButtonPrimary:
                "bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90",
            },
          }}
        />

        <p className="text-center text-sm text-[hsl(var(--globe-grey))] mt-6">
          Your organization will have access to private templates, team
          management, and more.
        </p>
      </div>
    </div>
  );
}
