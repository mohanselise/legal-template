"use client";

import { usePathname } from "next/navigation";

interface ConditionalFooterProps {
  children: React.ReactNode;
}

export function ConditionalFooter({ children }: ConditionalFooterProps) {
  const pathname = usePathname();
  
  // Hide footer on builder pages
  const isBuilderRoute = pathname.includes("/admin/templates/") && pathname.endsWith("/builder");
  
  if (isBuilderRoute) {
    return null;
  }
  
  return <>{children}</>;
}

