"use client";

import { usePathname } from "next/navigation";
import { type UserRole } from "@/lib/auth/roles";
import { AdminShell } from "./admin-shell";

export function AdminLayoutClient({
  children,
  locale,
  userRole,
}: {
  children: React.ReactNode;
  locale: string;
  userRole: UserRole;
}) {
  const pathname = usePathname();

  // Builder pages use their own full-screen layout
  const isBuilderPage = pathname.includes("/builder");

  if (isBuilderPage) {
    return <>{children}</>;
  }

  return (
    <AdminShell locale={locale} userRole={userRole}>
      {children}
    </AdminShell>
  );
}
