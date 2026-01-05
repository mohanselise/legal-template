"use client";

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
  return (
    <AdminShell locale={locale} userRole={userRole}>
      {children}
    </AdminShell>
  );
}
