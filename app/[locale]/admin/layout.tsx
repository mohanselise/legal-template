import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./_components/admin-layout-client";

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

  return <AdminLayoutClient locale={locale}>{children}</AdminLayoutClient>;
}
