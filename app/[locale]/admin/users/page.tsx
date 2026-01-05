import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/roles";
import { UsersAdminClient } from "./_components/users-admin-client";

export default async function UsersAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = getUserRole(user);

  // Only admins can access user management
  if (role !== "admin") {
    redirect(`/${locale}/admin/templates`);
  }

  return <UsersAdminClient locale={locale} />;
}

