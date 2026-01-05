"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  locale: string;
  onMenuClick: () => void;
}

// Map paths to section titles
const getSectionTitle = (pathname: string): string => {
  if (pathname.includes("/admin/templates")) {
    if (pathname.includes("/new")) return "New Template";
    if (pathname.includes("/edit")) return "Edit Template";
    if (pathname.includes("/builder")) return "Template Builder";
    return "Templates";
  }
  if (pathname.includes("/admin/analytics")) return "Analytics";
  if (pathname.includes("/admin/users")) return "Users";
  if (pathname.includes("/admin/settings")) return "Settings";
  return "Dashboard";
};

export function AdminTopbar({ locale, onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const sectionTitle = getSectionTitle(pathname);

  return (
    <div className="sticky top-0 z-40 h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Mobile menu + Section title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
            {sectionTitle}
          </h1>
        </div>

        {/* Center: Search (hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--globe-grey))]" />
            <Input
              type="search"
              placeholder="Search templates, settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Right: User button */}
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}

