"use client";

import { useState } from "react";
import { type UserRole } from "@/lib/auth/roles";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

interface AdminShellProps {
  children: React.ReactNode;
  locale: string;
  userRole: UserRole;
}

export function AdminShell({ children, locale, userRole }: AdminShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <AdminSidebar locale={locale} userRole={userRole} />
        </aside>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && (
          <AdminSidebar
            locale={locale}
            userRole={userRole}
            isMobile
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar
            locale={locale}
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

