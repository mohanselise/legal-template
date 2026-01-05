import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./_components/admin-layout-client";
import { getUserRole, type UserRole } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();

  if (!user) {
    // Redirect to sign-in without locale prefix (sign-in is excluded from i18n)
    redirect("/sign-in");
  }

  const role = getUserRole(user);
  
  // If user has no role, redirect to sign-in
  if (!role) {
    redirect("/sign-in");
  }

  // Route-level access control is handled in individual page components
  // This layout verifies the user has a role and passes it to the client
  return <AdminLayoutClient locale={locale} userRole={role}>{children}</AdminLayoutClient>;
}
