/**
 * Database-backed template fetching utilities
 *
 * These functions fetch templates from the database for use in
 * server components. They map database records to the expected
 * TemplateMeta format with Lucide icons.
 */

import { prisma, type Template } from "./db";
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
 * Fetch all templates from the database
 */
export async function getAllTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      orderBy: [{ popular: "desc" }, { title: "asc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch templates:", error);
    return [];
  }
}

/**
 * Fetch only available templates from the database
 */
export async function getAvailableTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: { available: true },
      orderBy: [{ popular: "desc" }, { title: "asc" }],
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch available templates:", error);
    return [];
  }
}

/**
 * Search available templates with pagination.
 */
export async function searchAvailableTemplates(options?: {
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ templates: TemplateWithIcon[]; total: number }> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 12));
  const where = {
    available: true,
    ...(options?.query
      ? {
          OR: [
            { title: { contains: options.query, mode: "insensitive" } },
            { description: { contains: options.query, mode: "insensitive" } },
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
 * Fetch only upcoming (not available) templates from the database
 */
export async function getUpcomingTemplates(): Promise<TemplateWithIcon[]> {
  try {
    const templates = await prisma.template.findMany({
      where: { available: false },
      orderBy: { title: "asc" },
    });
    return templates.map(mapTemplateWithIcon);
  } catch (error) {
    console.error("[TEMPLATES_DB] Failed to fetch upcoming templates:", error);
    return [];
  }
}

/**
 * Fetch a single template by slug
 */
export async function getTemplateBySlug(
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

