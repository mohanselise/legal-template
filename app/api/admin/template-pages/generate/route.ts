/**
 * Generate Landing Page Content via AI
 * POST /api/admin/template-pages/generate
 * Body: { templateId: string, locale: string }
 */

import { NextRequest, NextResponse } from "next/server";
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

const SYSTEM_PROMPT = `You are an expert marketing copywriter and frontend writer.
You will produce a long-form, SEO-first landing page for a legal template.

Key requirements:
- Return ONLY valid JSON.
- Tone: professional, approachable, plain-English; avoid legalese unless required.
- Respect SELISE brand guide (colors via CSS variables, no hex; clear voice; accessibility).
- Layout: boxed (non full-width). Use a centered container with max content width ~680-780px and comfortable padding; do NOT render full-bleed sections.
- Use Tailwind utility classes only. Do NOT inline hex colors. Use CSS vars: text-[hsl(var(--fg))], bg-[hsl(var(--bg))], etc.
- Include approved CTAs:
  * Primary CTA: /{locale}/templates/{slug}/generate (prominent, above the fold and in final CTA)
  * Secondary CTA: /{locale}/templates/ (see other templates)
- Structure for long-form SEO: hero, credibility/benefits, detailed sections (what it covers, who it’s for, how it works, FAQs), and strong closing CTA.
- Keep copy skimmable with clear headings, short paragraphs, bullets, and supporting subheadings.
- Avoid embedding external images; you may reference existing ones (e.g., /graphics/bg-black-texture.webp) if helpful.
- Ensure headings are semantic (h1/h2/h3), paragraphs with <p>, lists with <ul>/<li>.
- Keep HTML safe; no scripts, no external assets.
- OG/meta fields should be concise and SEO-friendly. Do NOT include an ogImage URL; leave it null.
`;

export async function POST(request: NextRequest) {
  try {
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
        enableApplyStandards: (s as any).enableApplyStandards ?? false,
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
- Secondary CTA: /${locale}/templates/

Return strict JSON with this shape:
{
  "title": string, // page title
  "description": string, // meta description
  "ogTitle": string, // may equal title
  "ogDescription": string, // may equal description
  "ogImage": null, // always null (skip OG image URL)
  "keywords": string[],
  "htmlBody": string // full HTML body using Tailwind classes and CSS vars
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
    } catch (apiError: any) {
      // Handle OpenRouter API errors with user-friendly messages
      if (apiError?.status === 402 || apiError?.code === 402) {
        return NextResponse.json(
          { 
            error: "API credit limit exceeded", 
            message: "The AI service has insufficient credits. Please reduce max_tokens or add credits to your OpenRouter account." 
          },
          { status: 402 }
        );
      }
      if (apiError?.status === 403 || apiError?.code === 403) {
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
