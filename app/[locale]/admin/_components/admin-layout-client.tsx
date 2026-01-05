"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, FileText, Users, BarChart3 } from "lucide-react";
import { type UserRole, hasAccess } from "@/lib/auth/roles";

const allNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] as UserRole[] },
  { href: "/admin/templates", label: "Templates", icon: FileText, roles: ["admin", "editor"] as UserRole[] },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "editor"] as UserRole[] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] as UserRole[] },
];

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

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === "/admin") {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/admin${userRole === "editor" ? "/templates" : ""}`}
              className="text-lg font-semibold text-[hsl(var(--selise-blue))] font-heading"
            >
              Admin Portal
            </Link>
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10"
                        : "text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--muted))]"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
      {children}
    </div>
  );
}
