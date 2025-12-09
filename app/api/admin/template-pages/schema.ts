/**
 * Zod validation schemas for Template Pages API
 */

import { z } from "zod";
import { templatePageBlocksSchema } from "@/lib/template-page-blocks";

// Supported locales (should match i18n config)
export const supportedLocales = ["en", "de", "fr"] as const;

export const createTemplatePageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only (e.g., nda-agreement)"
    ),
  locale: z.enum(supportedLocales).default("en"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
  blocks: templatePageBlocksSchema,
  htmlBody: z
    .string()
    .optional()
    .default(""),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url("Invalid URL format").optional().nullable(),
  keywords: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

export const updateTemplatePageSchema = createTemplatePageSchema.partial();

export type CreateTemplatePageInput = z.infer<typeof createTemplatePageSchema>;
export type UpdateTemplatePageInput = z.infer<typeof updateTemplatePageSchema>;
