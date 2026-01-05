"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { type UserRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const allNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"] as UserRole[],
  },
  {
    href: "/admin/templates",
    label: "Templates",
    icon: FileText,
    roles: ["admin", "editor"] as UserRole[],
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["admin", "editor"] as UserRole[],
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["admin"] as UserRole[],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "editor"] as UserRole[],
  },
];

interface AdminSidebarProps {
  locale: string;
  userRole: UserRole;
  isMobile?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  locale,
  userRole,
  isMobile = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === "/admin") {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-[hsl(var(--bg))] border-r border-[hsl(var(--border))]",
        isMobile ? "w-80" : collapsed ? "w-16" : "w-64",
        "transition-all duration-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--border))]">
        {!collapsed && !isMobile && (
          <Link
            href={`/${locale}/admin${userRole === "editor" ? "/templates" : ""}`}
            className="text-lg font-semibold text-[hsl(var(--selise-blue))] font-heading"
          >
            Admin Portal
          </Link>
        )}
        {isMobile && (
          <>
            <Link
              href={`/${locale}/admin${userRole === "editor" ? "/templates" : ""}`}
              className="text-lg font-semibold text-[hsl(var(--selise-blue))] font-heading"
            >
              Admin Portal
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "text-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10"
                  : "text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--muted))]",
                collapsed && !isMobile && "justify-center"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Sidebar */}
        <div className="fixed left-0 top-0 bottom-0">{sidebarContent}</div>
      </div>
    );
  }

  return sidebarContent;
}

