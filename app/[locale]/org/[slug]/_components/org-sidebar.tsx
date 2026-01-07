"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  X,
  Building2,
} from "lucide-react";
import { type OrgRole } from "@/lib/auth/organization";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const allNavItems = [
  {
    href: "",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["org_admin", "org_editor", "org_member"] as OrgRole[],
  },
  {
    href: "/templates",
    label: "Templates",
    icon: FileText,
    roles: ["org_admin", "org_editor", "org_member"] as OrgRole[],
  },
  {
    href: "/users",
    label: "Team",
    icon: Users,
    roles: ["org_admin"] as OrgRole[],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["org_admin"] as OrgRole[],
  },
];

interface OrgSidebarProps {
  locale: string;
  orgSlug: string;
  orgName: string;
  orgRole: OrgRole;
  isMobile?: boolean;
  onClose?: () => void;
}

export function OrgSidebar({
  locale,
  orgSlug,
  orgName,
  orgRole,
  isMobile = false,
  onClose,
}: OrgSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(orgRole));

  const basePath = `/${locale}/org/${orgSlug}`;

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === "") {
      return pathname === basePath || pathname === `${basePath}/`;
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
            href={basePath}
            className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--selise-blue))] font-heading truncate"
          >
            <Building2 className="h-5 w-5 shrink-0" />
            <span className="truncate">{orgName}</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Link href={basePath} className="mx-auto">
            <Building2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
          </Link>
        )}
        {isMobile && (
          <>
            <Link
              href={basePath}
              className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--selise-blue))] font-heading truncate"
            >
              <Building2 className="h-5 w-5 shrink-0" />
              <span className="truncate">{orgName}</span>
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
            className="h-8 w-8 shrink-0"
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

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-[hsl(var(--border))]">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              orgRole === "org_admin" &&
                "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]",
              orgRole === "org_editor" &&
                "bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]",
              orgRole === "org_member" &&
                "bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]"
            )}
          >
            {orgRole === "org_admin" && "Admin"}
            {orgRole === "org_editor" && "Editor"}
            {orgRole === "org_member" && "Member"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href || "overview"}
              href={`${basePath}${item.href}`}
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

      {/* Back to Templates */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        <Link
          href={`/${locale}/templates`}
          onClick={isMobile ? onClose : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--muted))]",
            collapsed && !isMobile && "justify-center"
          )}
        >
          <FileText className="h-5 w-5 shrink-0" />
          {(!collapsed || isMobile) && <span>Browse Templates</span>}
        </Link>
      </div>
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
