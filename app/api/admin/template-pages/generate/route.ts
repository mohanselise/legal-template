/**
 * Generate Landing Page Content via AI
 * POST /api/admin/template-pages/generate
 * Body: { templateId: string, locale: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createCompletionWithTracking } from "@/lib/openrouter";
import { getSessionId } from "@/lib/analytics/session";
import { jsonrepair } from "jsonrepair";
import fs from "fs";
import path from "path";

const requestSchema = z.object({
  templateId: z.string(),
  locale: z.string().default("en"),
});

// Try to load the brand style guide once
function loadBrandGuide(): string {
  try {
    const guidePath = path.join(process.cwd(), ".cursor/rules/brand-style-guide.mdc");
    return fs.readFileSync(guidePath, "utf8");
  } catch (error) {
    console.error("[TEMPLATE_PAGE_GENERATE] Failed to load brand guide", error);
    return "Follow SELISE brand tone: professional, clear, approachable. Use Tailwind with CSS variables (no hex).";
  }
}

const BRAND_GUIDE = loadBrandGuide();

const SYSTEM_PROMPT = `You are an expert marketing copywriter.
You will produce SEO-first landing page content as structured JSON blocks (no HTML).

Key requirements:
- Return ONLY valid JSON.
- Tone: professional, approachable, plain-English; avoid legalese unless required.
- Follow SELISE brand guide (voice, clarity, accessibility). Avoid exaggerated or absolute claims (e.g., “100% legal compliance”, “guaranteed”). Use measured, trustworthy language.
- Do NOT return HTML or hex colors. Use the block schema provided in the user message for structure.
- Include the approved CTAs exactly as provided (primary and secondary).
- Keep copy skimmable with clear headings, short paragraphs, bullets, and supporting subheadings.
- OG/meta fields concise and SEO-friendly; ogImage must be null.
`;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.format() }, { status: 400 });
    }

    const { templateId, locale } = parsed.data;

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        screens: {
          orderBy: { order: "asc" },
          include: { fields: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const sessionId = await getSessionId();

    // Build context object
    const context = {
      templateTitle: template.title,
      templateDescription: template.description,
      slug: template.slug,
      locale,
      keywords: template.keywords || [],
      screens: template.screens.map((s) => ({
        title: s.title,
        description: s.description,
        type: s.type,
        enableApplyStandards: s.enableApplyStandards ?? false,
        fields: s.fields.map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
        })),
      })),
    };

    const userPrompt = `Generate a long-form, SEO-focused landing page for the template described below.

BRAND GUIDE (abbreviated):
${BRAND_GUIDE}

TEMPLATE CONTEXT (JSON):
${JSON.stringify(context, null, 2)}

MANDATORY CTAs:
- Primary CTA (prominent): /${locale}/templates/${template.slug}/generate
- Secondary CTA (All Templates): /${locale}/templates

Return strict JSON with this shape (no additional fields):
{
  "title": string, // page title
  "description": string, // meta description
  "ogTitle": string, // may equal title
  "ogDescription": string, // may equal description
  "ogImage": null, // always null (skip OG image URL)
  "keywords": string[],
  "blocks": [
    // Include hero and a closing CTA; add other sections as needed for a complete landing page
    {
      "type": "hero",
      "eyebrow"?: string,
      "title": string,
      "subtitle"?: string,
      "bullets"?: string[],
      "primaryCta"?: { "label": string, "href": string, "variant"?: "primary"|"secondary"|"ghost" },
      "secondaryCta"?: { "label": string, "href": string, "variant"?: "primary"|"secondary"|"ghost" },
      "imageUrl"?: string,
      "imageAlt"?: string
      // backgroundImage / textureImage / sideImage are optional and may be omitted (renderer has defaults)
    },
    {
      "type": "featureGrid",
      "title"?: string,
      "description"?: string,
      "columns"?: number,
      "features": [{ "title": string, "description"?: string, "icon"?: string }]
    },
    {
      "type": "stats",
      "title"?: string,
      "description"?: string,
      "items": [{ "label": string, "value": string, "subtext"?: string }]
    },
    {
      "type": "steps",
      "title"?: string,
      "description"?: string,
      "items": [{ "title": string, "description"?: string, "icon"?: string }]
    },
    {
      "type": "media",
      "title"?: string,
      "description"?: string,
      "imageUrl": string,
      "imageAlt"?: string
    },
    {
      "type": "richText",
      "title"?: string,
      "body": string[]
    },
    {
      "type": "faq",
      "title"?: string,
      "items": [{ "question": string, "answer": string }]
    },
    {
      "type": "testimonials",
      "title"?: string,
      "items": [{ "quote": string, "name": string, "role"?: string, "avatarUrl"?: string }]
    },
    {
      "type": "cta",
      "title": string,
      "description"?: string,
      "primaryCta": { "label": string, "href": string, "variant"?: "primary"|"secondary"|"ghost" },
      "secondaryCta"?: { "label": string, "href": string, "variant"?: "primary"|"secondary"|"ghost" }
    }
  ]
}

Link rules:
- href must be absolute (http/https), or start with "/", or start with "#".

Language rules:
- Avoid exaggerated/absolute claims (e.g., “100% compliance”, “guaranteed results”). Use measured, trustworthy phrasing.
}`;

    let completion;
    try {
      completion = await createCompletionWithTracking(
        {
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
          // Keep generation affordable; stay under typical credit limits and avoid 402/403
          max_tokens: 1200,
        },
        {
          sessionId,
          endpoint: "/api/admin/template-pages/generate",
        }
      );
    } catch (apiError: unknown) {
      type ApiError = { status?: number; code?: number };
      const err = apiError as ApiError;
      // Handle OpenRouter API errors with user-friendly messages
      if (err?.status === 402 || err?.code === 402) {
        return NextResponse.json(
          {
            error: "API credit limit exceeded",
            message: "The AI service has insufficient credits. Please reduce max_tokens or add credits to your OpenRouter account."
          },
          { status: 402 }
        );
      }
      if (err?.status === 403 || err?.code === 403) {
        return NextResponse.json(
          {
            error: "API monthly limit exceeded",
            message: "The monthly API limit has been reached. Please manage your limits at https://openrouter.ai/settings/keys or try again later."
          },
          { status: 403 }
        );
      }
      // Re-throw other errors to be handled by outer catch
      throw apiError;
    }

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content from AI");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Attempt to repair malformed JSON
      try {
        const repaired = jsonrepair(content);
        result = JSON.parse(repaired);
      } catch (innerError) {
        console.error("[TEMPLATE_PAGE_GENERATE] JSON parse failed", innerError);
        return NextResponse.json(
          { error: "AI response malformed", message: "Could not parse generated JSON. Please try again." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[TEMPLATE_PAGE_GENERATE]", error);
    return NextResponse.json(
      { error: "Failed to generate landing page", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
