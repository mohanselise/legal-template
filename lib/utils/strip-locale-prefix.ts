import { routing } from "@/i18n/routing";

/**
 * Strips locale prefix from href if present
 * next-intl Link component automatically adds locale, so we need to remove it if already present
 * 
 * @param href - The href path that may or may not contain a locale prefix
 * @returns The href with locale prefix removed
 * 
 * @example
 * stripLocalePrefix("/en/templates/nda/generate") // "/templates/nda/generate"
 * stripLocalePrefix("/templates/nda/generate") // "/templates/nda/generate"
 * stripLocalePrefix("/en") // "/"
 */
export function stripLocalePrefix(href: string): string {
  // Check if href starts with any locale prefix
  for (const locale of routing.locales) {
    if (href.startsWith(`/${locale}/`) || href === `/${locale}`) {
      return href.replace(`/${locale}`, '') || '/';
    }
  }
  return href;
}
