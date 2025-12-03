/**
 * Zod validation schemas for Template API
 */

import { z } from "zod";

// List of valid Lucide icon names for templates
export const validIcons = [
  "FileText",
  "Users",
  "Lock",
  "Shield",
  "Sparkles",
  "FileCheck",
  "FilePlus",
  "FileSearch",
  "Files",
  "Folder",
  "Scale",
  "Briefcase",
  "Building",
  "Handshake",
  "UserCheck",
  "ClipboardList",
] as const;

export const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only (e.g., employment-agreement)"
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be 1000 characters or less"),
  icon: z.enum(validIcons).default("FileText"),
  available: z.boolean().default(false),
  popular: z.boolean().default(false),
  // href is auto-generated from slug, so it's optional in input but always set in DB
  href: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  systemPromptRole: z.string().optional().nullable(),
  systemPrompt: z.string().optional().nullable(),
  // UILM Translation Keys (Module: templates, ID: 03e5475d-506d-4ad1-8d07-23fa768a7925)
  uilmTitleKey: z.string().optional().nullable(),
  uilmDescriptionKey: z.string().optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

