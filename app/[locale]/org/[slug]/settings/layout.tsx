"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  KeyRound,
  FileImage,
  AlertTriangle,
  CreditCard,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    href: "",
    label: "General",
    description: "Organization name and URL",
    icon: Building2,
  },
  {
    href: "/integrations",
    label: "Integrations",
    description: "SELISE Signature and APIs",
    icon: KeyRound,
  },
  {
    href: "/letterheads",
    label: "Letterheads",
    description: "Company document headers",
    icon: FileImage,
  },
  {
    href: "/billing",
    label: "Billing",
    description: "Subscription and payments",
    icon: CreditCard,
    badge: "Soon",
  },
  {
    href: "/knowledgebase",
    label: "Knowledgebase",
    description: "Company documents and data",
    icon: BookOpen,
    badge: "Soon",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Extract base settings path
  const pathParts = pathname.split("/");
  const settingsIndex = pathParts.indexOf("settings");
  const basePath = pathParts.slice(0, settingsIndex + 1).join("/");
  const currentSection = pathParts[settingsIndex + 1] || "";

  const isActive = (href: string) => {
    const sectionPath = href.replace("/", "");
    if (href === "") {
      return currentSection === "" || currentSection === "general";
    }
    return currentSection === sectionPath;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Image
            src="/Selise Legal Templates.svg"
            alt="SELISE Legal Templates"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
              Organization Settings
            </h1>
            <p className="text-[hsl(var(--globe-grey))]">
              Manage your organization&apos;s settings and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Side Navigation */}
        <aside className="w-64 shrink-0">
          <nav className="sticky top-6 space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isDisabled = !!item.badge;

              if (isDisabled) {
                return (
                  <div
                    key={item.href || "general"}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-[hsl(var(--globe-grey))]/50 cursor-not-allowed"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--globe-grey))]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs truncate opacity-60">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href || "general"}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                    active
                      ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                      : "text-[hsl(var(--globe-grey))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--fg))]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block">{item.label}</span>
                    <p
                      className={cn(
                        "text-xs truncate",
                        active ? "text-[hsl(var(--selise-blue))]/70" : "opacity-60"
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                    )}
                  />
                </Link>
              );
            })}

            {/* Danger Zone - separated */}
            <div className="pt-4 mt-4 border-t border-[hsl(var(--border))]">
              <Link
                href={`${basePath}/danger-zone`}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                  currentSection === "danger-zone"
                    ? "bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]"
                    : "text-[hsl(var(--globe-grey))] hover:bg-[hsl(var(--crimson))]/5 hover:text-[hsl(var(--crimson))]"
                )}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block">Danger Zone</span>
                  <p
                    className={cn(
                      "text-xs truncate",
                      currentSection === "danger-zone"
                        ? "text-[hsl(var(--crimson))]/70"
                        : "opacity-60"
                    )}
                  >
                    Destructive actions
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    currentSection === "danger-zone"
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-50"
                  )}
                />
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
