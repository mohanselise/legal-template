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
}

/**
 * Convert a database template to one with a Lucide icon component
 */
function mapTemplateWithIcon(template: Template): TemplateWithIcon {
  return {
    ...template,
    icon: iconMap[template.icon] || FileText,
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

