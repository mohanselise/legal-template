"use client";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { stripLocalePrefix } from "@/lib/utils/strip-locale-prefix";
import { ComponentProps } from "react";

type SmartCTALinkProps = ComponentProps<typeof Link> & {
  href: string;
};

export function SmartCTALink({ href, children, ...props }: SmartCTALinkProps) {
  const pathname = usePathname();
  
  // Resolve #generate placeholder to actual generate URL
  let resolvedHref: string;
  if (href === "#generate") {
    resolvedHref = `${pathname.replace(/\/$/, "")}/generate`;
  } else {
    resolvedHref = href;
  }
  
  // Strip locale prefix if present (next-intl Link will add it automatically)
  resolvedHref = stripLocalePrefix(resolvedHref);
  
  return <Link href={resolvedHref} {...props}>{children}</Link>;
}
