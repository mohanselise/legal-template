"use client";

import { useState } from "react";
import { type OrgRole } from "@/lib/auth/organization";
import { OrgSidebar } from "./org-sidebar";
import { OrgTopbar } from "./org-topbar";

interface OrgShellProps {
  children: React.ReactNode;
  locale: string;
  orgSlug: string;
  orgName: string;
  orgRole: OrgRole;
}

export function OrgShell({
  children,
  locale,
  orgSlug,
  orgName,
  orgRole,
}: OrgShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <OrgSidebar
            locale={locale}
            orgSlug={orgSlug}
            orgName={orgName}
            orgRole={orgRole}
          />
        </aside>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && (
          <OrgSidebar
            locale={locale}
            orgSlug={orgSlug}
            orgName={orgName}
            orgRole={orgRole}
            isMobile
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <OrgTopbar
            locale={locale}
            orgName={orgName}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
