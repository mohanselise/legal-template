import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1),
  // Allow absolute URLs, app-relative paths, and in-page anchors
  href: z
    .string()
    .url()
    .or(z.string().startsWith("/"))
    .or(z.string().startsWith("#")),
  variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
});

const mediaRefSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(""),
  overlay: z.string().optional(), // e.g., gradient or opacity class hint
});

const heroBlockSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  bullets: z.array(z.string().min(1)).optional().default([]),
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().optional(),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
  sideImage: mediaRefSchema.optional(),
});

const featureGridBlockSchema = z.object({
  type: z.literal("featureGrid"),
  title: z.string().optional(),
  description: z.string().optional(),
  columns: z.number().int().min(2).max(4).default(3),
  features: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const statsBlockSchema = z.object({
  type: z.literal("stats"),
  title: z.string().optional(),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        subtext: z.string().optional(),
      })
    )
    .min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const stepsBlockSchema = z.object({
  type: z.literal("steps"),
  title: z.string().optional(),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const testimonialsBlockSchema = z.object({
  type: z.literal("testimonials"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        quote: z.string().min(1),
        name: z.string().min(1),
        role: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const faqBlockSchema = z.object({
  type: z.literal("faq"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      })
    )
    .min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const richTextBlockSchema = z.object({
  type: z.literal("richText"),
  title: z.string().optional(),
  body: z.array(z.string().min(1)).min(1),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const ctaBlockSchema = z.object({
  type: z.literal("cta"),
  title: z.string().min(1),
  description: z.string().optional(),
  primaryCta: linkSchema,
  secondaryCta: linkSchema.optional(),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

const mediaBlockSchema = z.object({
  type: z.literal("media"),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  imageAlt: z.string().default(""),
  backgroundImage: mediaRefSchema.optional(),
  textureImage: mediaRefSchema.optional(),
});

export const templatePageBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  featureGridBlockSchema,
  statsBlockSchema,
  stepsBlockSchema,
  testimonialsBlockSchema,
  faqBlockSchema,
  richTextBlockSchema,
  ctaBlockSchema,
  mediaBlockSchema,
]);

export const templatePageBlocksSchema = z
  .array(templatePageBlockSchema)
  .min(1, "At least one content block is required");

export type TemplatePageBlock = z.infer<typeof templatePageBlockSchema>;
export type TemplatePageBlocks = z.infer<typeof templatePageBlocksSchema>;

export function parseTemplatePageBlocks(raw: unknown): TemplatePageBlocks {
  const parsed = templatePageBlocksSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  
  // Log detailed error information
  console.warn("[TEMPLATE_PAGE_BLOCKS] Failed to parse blocks");
  if (parsed.error instanceof z.ZodError) {
    parsed.error.issues.forEach((issue, idx) => {
      console.warn(`[TEMPLATE_PAGE_BLOCKS] Issue ${idx + 1}:`, {
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
        expected: (issue as any).expected,
        received: (issue as any).received,
      });
    });
    
    // Try to parse individual blocks and filter out invalid ones
    if (Array.isArray(raw)) {
      console.log("[TEMPLATE_PAGE_BLOCKS] Attempting to parse blocks individually...");
      const validBlocks: TemplatePageBlock[] = [];
      raw.forEach((block, idx) => {
        const blockParsed = templatePageBlockSchema.safeParse(block);
        if (blockParsed.success) {
          validBlocks.push(blockParsed.data);
        } else {
          console.warn(`[TEMPLATE_PAGE_BLOCKS] Block ${idx} (type: ${(block as any)?.type || "unknown"}) failed validation:`, blockParsed.error.issues);
        }
      });
      
      if (validBlocks.length > 0) {
        console.log(`[TEMPLATE_PAGE_BLOCKS] Successfully parsed ${validBlocks.length} of ${raw.length} blocks`);
        return validBlocks as TemplatePageBlocks;
      }
    }
  }
  
  return [];
}

