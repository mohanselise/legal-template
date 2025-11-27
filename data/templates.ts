/**
 * Template Registry Integration
 * 
 * This file integrates the template metadata with the new registry system.
 * It maintains backward compatibility with existing code that imports `templates`.
 */

import { FileText, Lock, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { 
  registerTemplateMeta, 
  getAllTemplateMeta,
  getAvailableTemplateMeta,
  getUpcomingTemplateMeta,
  type TemplateMeta 
} from "@/lib/templates";

// Re-export the type for backward compatibility
export type { TemplateMeta };

/**
 * Static template metadata definitions
 * 
 * These are registered with the template registry on module load.
 * For fully implemented templates, the config in lib/templates/[template-name]/
 * will provide additional details like schema, steps, and generation config.
 */
const templateDefinitions: TemplateMeta[] = [
  {
    id: "employment-agreement",
    title: "Employment Agreement",
    description: "Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.",
    icon: FileText,
    available: true,
    href: "/templates/employment-agreement/generate",
    popular: true
  },
  {
    id: "founders-agreement",
    title: "Founders' Agreement",
    description: "Define equity splits, roles, responsibilities, and decision-making processes for your startup.",
    icon: Users,
    available: false,
    href: "/templates/founders-agreement"
  },
  {
    id: "nda",
    title: "Non-Disclosure Agreement",
    description: "Protect confidential information with bilateral or unilateral NDA templates.",
    icon: Lock,
    available: false,
    href: "/templates/nda"
  },
  {
    id: "dpa",
    title: "Data Processing Agreement",
    description: "GDPR-compliant DPA templates for processor-controller relationships.",
    icon: Shield,
    available: false,
    href: "/templates/dpa"
  },
  {
    id: "ip-assignment",
    title: "IP Assignment Agreement",
    description: "Transfer intellectual property rights with clear terms and comprehensive coverage.",
    icon: Sparkles,
    available: false,
    href: "/templates/ip-assignment"
  }
];

// Register all templates with the registry on module load
templateDefinitions.forEach(registerTemplateMeta);

/**
 * All templates (for backward compatibility)
 * 
 * @deprecated Use `getAllTemplateMeta()` from `@/lib/templates` instead
 */
export const templates: TemplateMeta[] = templateDefinitions;

/**
 * Get templates filtered by availability status
 * 
 * @deprecated Use `getAvailableTemplateMeta()` or `getUpcomingTemplateMeta()` instead
 */
export function getTemplatesByAvailability(available: boolean): TemplateMeta[] {
  return available ? getAvailableTemplateMeta() : getUpcomingTemplateMeta();
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): TemplateMeta | undefined {
  return templateDefinitions.find(t => t.id === id);
}

/**
 * Check if a template ID is valid
 */
export function isValidTemplate(id: string): boolean {
  return templateDefinitions.some(t => t.id === id);
}

/**
 * Get all template IDs for static generation
 */
export function getTemplateIds(): string[] {
  return templateDefinitions.map(t => t.id);
}
