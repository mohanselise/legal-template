"use client";

import { usePathname } from "next/navigation";
import { type OrgRole } from "@/lib/auth/organization";
import { OrgShell } from "./org-shell";

export function OrgLayoutClient({
  children,
  locale,
  orgSlug,
  orgName,
  orgRole,
}: {
  children: React.ReactNode;
  locale: string;
  orgSlug: string;
  orgName: string;
  orgRole: OrgRole;
}) {
  const pathname = usePathname();

  // Builder pages use their own full-screen layout
  const isBuilderPage = pathname.includes("/builder");

  if (isBuilderPage) {
    return <>{children}</>;
  }

  return (
    <OrgShell
      locale={locale}
      orgSlug={orgSlug}
      orgName={orgName}
      orgRole={orgRole}
    >
      {children}
    </OrgShell>
  );
}
