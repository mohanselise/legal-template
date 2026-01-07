/**
 * Database-backed template fetching utilities
 *
 * These functions fetch templates from the database for use in
 * server components. They map database records to the expected
 * TemplateMeta format with Lucide icons.
 */

import { prisma, type Template, type TemplatePage, Prisma } from "./db";
import {
  FileText,
  Users,
  Lock,
  Shield,
  Sparkles,
  FileCheck,
  FilePlus,
  FileSearch,
  Files,
  Folder,
  Scale,
  Briefcase,
  Building,
  Handshake,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Users,
  Lock,
  Shield,
  Sparkles,
  FileCheck,
  FilePlus,
  FileSearch,
  Files,
  Folder,
  Scale,
  Briefcase,
  Building,
  Handshake,
  UserCheck,
  ClipboardList,
};

export interface TemplateWithIcon extends Omit<Template, "icon"> {
  icon: LucideIcon;
  /**
   * Preserve the original icon name string for client-safe rendering.
   */
  iconName?: string;
}

/**
 * Convert a database template to one with a Lucide icon component
 */
function mapTemplateWithIcon(template: Template): TemplateWithIcon {
  const iconName = template.icon;
  return {
    ...template,
    icon: iconMap[iconName] || FileText,
    iconName,
  };
}

/**
 * Fetch all PUBLIC templates from the database
 * Excludes organization-specific templates
 */
export async function getAllTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: {
        organizationId: null, // Only public templates
      },
      orderBy: [{ popular: "desc" }, { title: "asc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch templates:", error);
    return [];
  }
}

/**
 * Fetch only available PUBLIC templates from the database
 * Excludes organization-specific templates
 */
export async function getAvailableTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: {
        available: true,
        organizationId: null, // Only public templates
      },
      orderBy: [{ popular: "desc" }, { title: "asc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch available templates:", error);
    return [];
  }
}

/**
 * Search available PUBLIC templates with pagination.
 * Excludes organization-specific templates
 */
export async function searchAvailableTemplates(options?: {
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ templates: TemplateWithIcon[]; total: number }> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 12));
  const where: Prisma.TemplateWhereInput = {
    available: true,
    organizationId: null, // Only public templates
    ...(options?.query
      ? {
          OR: [
            {
              title: {
                contains: options.query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              description: {
                contains: options.query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [total, templates] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.findMany({
        where,
        orderBy: [{ popular: "desc" }, { title: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { templates: templates.map(mapTemplateWithIcon), total };
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to search available templates:", error);
    return { templates: [], total: 0 };
  }
}

/**
 * Fetch only upcoming (not available) PUBLIC templates from the database
 * Excludes organization-specific templates
 */
export async function getUpcomingTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: {
        available: false,
        organizationId: null, // Only public templates
      },
      orderBy: { title: "asc" },
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch upcoming templates:", error);
    return [];
  }
}

/**
 * Fetch a single PUBLIC template by slug
 * Excludes organization-specific templates for security
 */
export async function getTemplateBySlug(
  slug: string
): Promise<TemplateWithIcon | null> {
  try {
    const template = await prisma.template.findFirst({
      where: {
        slug,
        organizationId: null, // Only public templates
      },
    });
    return template ? mapTemplateWithIcon(template) : null;
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template by slug:", error);
    return null;
  }
}

/**
 * Fetch any template by slug (including org templates)
 * WARNING: Only use this after verifying access permissions!
 * For public-facing code, use getTemplateBySlug instead.
 */
export async function getTemplateBySlugInternal(
  slug: string
): Promise<TemplateWithIcon | null> {
  try {
    const template = await prisma.template.findUnique({
      where: { slug },
    });
    return template ? mapTemplateWithIcon(template) : null;
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template by slug:", error);
    return null;
  }
}

// ============================================================================
// Template Pages (Dynamic Content Pages)
// ============================================================================

export type TemplatePageWithBlocks = TemplatePage & {
  blocks?: Prisma.JsonValue | null;
};

export type { TemplatePage };

/**
 * Fetch a single template page by slug and locale
 * Only returns published pages for public consumption
 * In development, also allows unpublished pages for testing
 */
export async function getTemplatePageBySlugAndLocale(
  slug: string,
  locale: string
): Promise<TemplatePageWithBlocks | null> {
  try {
    // In development, allow viewing unpublished pages for testing
    const isDevelopment = process.env.NODE_ENV === "development";
    
    const templatePage = await prisma.templatePage.findFirst({
      where: {
        slug,
        locale,
        ...(isDevelopment ? {} : { published: true }),
      },
    });
    return templatePage as TemplatePageWithBlocks;
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template page:", error);
    return null;
  }
}

/**
 * Fetch all published template page slugs for static generation
 */
export async function getAllTemplatePageSlugs(): Promise<
  Array<{ slug: string; locale: string }>
> {
  try {
    const pages = await prisma.templatePage.findMany({
      where: { published: true },
      select: { slug: true, locale: true },
    });
    return pages;
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template page slugs:", error);
    return [];
  }
}

/**
 * Fetch all published template pages with updatedAt for sitemap generation
 */
export async function getAllPublishedTemplatePagesForSitemap(): Promise<
  Array<{ slug: string; locale: string; updatedAt: Date }>
> {
  try {
    const pages = await prisma.templatePage.findMany({
      where: { published: true },
      select: { slug: true, locale: true, updatedAt: true },
    });
    return pages;
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template pages for sitemap:", error);
    return [];
  }
}

// ============================================================================
// Organization-Aware Template Queries
// ============================================================================

/**
 * Fetch templates for an organization user.
 * Returns all public templates (organizationId = null) PLUS the org's private templates.
 */
export async function getTemplatesForOrgUser(
  organizationId: string | null
): Promise<TemplateWithIcon[]> {
  try {
    // If no organization, just return public templates
    if (!organizationId) {
      return getAvailableTemplates();
    }

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          // Public templates (no organization)
          { organizationId: null, available: true },
          // Organization's own templates (including drafts for org members)
          { organizationId },
        ],
      },
      orderBy: [{ popular: "desc" }, { title: "asc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch templates for org user:", error);
    return [];
  }
}

/**
 * Fetch only an organization's private templates
 */
export async function getOrgTemplates(
  organizationId: string
): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: { organizationId },
      orderBy: [{ available: "desc" }, { updatedAt: "desc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch org templates:", error);
    return [];
  }
}

/**
 * Check if a user can access a specific template.
 * Public templates are accessible to anyone.
 * Org templates require membership in that organization.
 */
export async function canAccessTemplate(
  slug: string,
  userOrgId: string | null
): Promise<{ canAccess: boolean; template: TemplateWithIcon | null }> {
  try {
    const template = await prisma.template.findUnique({
      where: { slug },
    });

    if (!template) {
      return { canAccess: false, template: null };
    }

    const templateWithIcon = mapTemplateWithIcon(template);

    // Public template (no org)
    if (!template.organizationId) {
      // Must be available for public access (or have valid preview token, handled elsewhere)
      return { canAccess: template.available, template: templateWithIcon };
    }

    // Org template - user must be member of that org
    if (template.organizationId === userOrgId) {
      return { canAccess: true, template: templateWithIcon };
    }

    // User not in this org
    return { canAccess: false, template: null };
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to check template access:", error);
    return { canAccess: false, template: null };
  }
}

/**
 * Get template with organization info
 */
export async function getTemplateWithOrg(slug: string): Promise<
  | (TemplateWithIcon & {
      organization: { id: string; name: string; slug: string } | null;
    })
  | null
> {
  try {
    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!template) return null;

    return {
      ...mapTemplateWithIcon(template),
      organization: template.organization,
    };
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch template with org:", error);
    return null;
  }
}

