"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrgTopbarProps {
  locale: string;
  orgName: string;
  onMenuClick: () => void;
}

// Map paths to section titles
const getSectionTitle = (pathname: string): string => {
  if (pathname.includes("/templates")) {
    if (pathname.includes("/new")) return "New Template";
    if (pathname.includes("/builder")) return "Template Builder";
    return "Templates";
  }
  if (pathname.includes("/users")) return "Team";
  if (pathname.includes("/settings")) return "Settings";
  return "Overview";
};

export function OrgTopbar({ locale, orgName, onMenuClick }: OrgTopbarProps) {
  const pathname = usePathname();
  const sectionTitle = getSectionTitle(pathname);

  return (
    <div className="sticky top-16 z-40 h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/95 backdrop-blur-sm md:hidden">
      <div className="flex h-full items-center px-4">
        {/* Mobile menu button + Section title */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 mr-3"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
          {sectionTitle}
        </h1>
      </div>
    </div>
  );
}
