"use client";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ComponentProps } from "react";

type SmartCTALinkProps = ComponentProps<typeof Link> & {
  href: string;
};

export function SmartCTALink({ href, children, ...props }: SmartCTALinkProps) {
  const pathname = usePathname();
  
  // Resolve #generate placeholder to actual generate URL
  const resolvedHref = href === "#generate" 
    ? `${pathname.replace(/\/$/, "")}/generate`
    : href;
  
  return <Link href={resolvedHref} {...props}>{children}</Link>;
}
