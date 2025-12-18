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

const SYSTEM_PROMPT = `You are an expert SEO copywriter specializing in long-form, conversion-optimized landing pages.
You will produce comprehensive, SEO-first landing page content as structured JSON blocks (no HTML).

Key requirements:
- Return ONLY valid JSON.
- Generate LONG-FORM content: aim for 1500-2500 words of copy across all blocks. This is a comprehensive landing page, not a short summary.
- Tone: "Street-level easy" - explain everything in simple, human-understandable language that anyone can grasp, yet remain legally sophisticated. Use plain-English explanations for every step and concept. Avoid legal jargon unless absolutely necessary for jurisdictional precision.
- Brand Identity: SELISE is a Swiss company (https://selisesignature.com/). The service is completely FREE - no payment required, no login required, no user data storage. Users can download their generated PDF immediately with no strings attached. Emphasize this privacy-focused, no-commitment approach throughout the content.
- Follow SELISE brand guide (voice, clarity, accessibility). Avoid exaggerated or absolute claims (e.g., "100% legal compliance", "guaranteed"). Use measured, trustworthy language.
- Do NOT return HTML or hex colors. Use the block schema provided in the user message for structure.
- Include the approved CTAs exactly as provided (primary and secondary).
- Keep copy skimmable with clear headings, short paragraphs, bullets, and supporting subheadings.
- OG/meta fields concise and SEO-friendly; ogImage must be null.
- Include comprehensive FAQ sections (10-15 questions) targeting long-tail keywords.
- Write detailed, substantive descriptions - not just placeholder text.
- Each section should provide real value and answer user questions.
- STRICT LINKING RULES: Only use these allowed links:
  * Internal template links: /{locale}/templates/{slug} (only for templates listed in the user prompt)
  * All templates page: /{locale}/templates
  * Primary CTA: #generate
  * External: https://selisesignature.com/ and https://selisegroup.com/
  * DO NOT create any other links, especially NOT links to "examples", "samples", "templates gallery", or any non-existent pages.
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

    // Fetch other available templates for internal linking
    const otherTemplates = await prisma.template.findMany({
      where: {
        available: true,
        id: { not: templateId },
      },
      select: {
        title: true,
        slug: true,
        description: true,
      },
      orderBy: {
        title: "asc",
      },
    });

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

    const userPrompt = `Generate a COMPREHENSIVE, long-form, SEO-focused landing page for the template described below.

TEMPLATE WORKFLOW UNDERSTANDING:
The template works through a guided question flow. Users are asked simple, legally sophisticated questions in plain, human-understandable language. We explain every step clearly, suggest what to do or which option to select (with easy-to-understand explanations), but the user has full control (human in the loop). The process is designed to be accessible to anyone, not just legal professionals. Based on the template context provided below, explain exactly how this specific template's guided question flow works.

SECTION GUIDE (include ALL required sections, plus additional sections as needed for a comprehensive long-form page):

REQUIRED SECTIONS:
1. hero - Compelling headline, subtitle with value proposition emphasizing free, no-login, Swiss privacy. Include 4-6 bullet points highlighting key benefits. Must include primary CTA (#generate).

2. featureGrid - 6-9 key features/benefits with detailed descriptions (2-3 sentences each). Focus on what makes this template valuable, easy to use, and legally sound. Emphasize the guided question approach and user control.

3. steps - 4-6 step process showing how the template works. This is CRITICAL: Explain the guided question flow in simple terms. Describe how users will be asked questions, how we explain each step in plain language, how we suggest options but users have full control. Make it clear this is a human-in-the-loop process where users make decisions at each step. Base this on the actual screens and fields in the template context.

4. richText - 2-3 paragraphs (or more) of detailed content explaining the template's value, use cases, and benefits. Use simple language, avoid jargon. Explain when and why someone would need this template.

5. stats - 3-4 relevant statistics or metrics (can be industry stats or template benefits). Make these meaningful and contextual.

6. richText - Another section with detailed content about best practices, tips, or important considerations. Keep language accessible.

7. faq - 10-15 comprehensive Q&As covering common questions, legal considerations, use cases, the free nature of the service, privacy (no data storage), and how the guided process works. Answer in simple, understandable language.

8. cta - Strong closing CTA with compelling copy emphasizing free download, no commitment, instant PDF access.

OPTIONAL ADDITIONAL SECTIONS (add these if they help reach the 1500-2500 word goal and provide value):
- Additional richText blocks with deep dives into specific use cases, legal context (in simple terms), or industry insights
- Additional featureGrid blocks if there are more benefits to highlight
- Media blocks if visual explanations would help
- Additional FAQ sections if more questions need answering

Generate substantial content for each section - no placeholder or minimal text. Aim for a comprehensive, long-form landing page that thoroughly explains the template and its value.

BRAND GUIDE (abbreviated):
${BRAND_GUIDE}

TEMPLATE CONTEXT (JSON):
${JSON.stringify(context, null, 2)}

MANDATORY CTAs:
- Primary CTA href: "#generate" (renderer will resolve to current page + /generate)
- Secondary CTA href: "/${locale}/templates"

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
    // IMPORTANT: All blocks must include ALL required fields. CTA blocks MUST have primaryCta.
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
      "primaryCta": { "label": string, "href": "#generate", "variant"?: "primary"|"secondary"|"ghost" }, // REQUIRED for cta blocks - always include this
      "secondaryCta"?: { "label": string, "href": string, "variant"?: "primary"|"secondary"|"ghost" }
    }
  ]
}

STRICT LINKING RULES - CRITICAL:
You MUST ONLY use these allowed links. DO NOT create any other links, especially NOT:
- Links to "examples", "samples", "template examples", "see examples", "view samples", or similar
- Links to non-existent pages or features
- Links to external sites except the two approved SELISE domains below

ALLOWED LINKS ONLY:
1. Internal template links (use markdown format [Link Text](url) in text content):
Available templates:
${otherTemplates.map((t) => `   - "${t.title}": /${locale}/templates/${t.slug}`).join("\n")}
   - "All templates" or "Browse templates": /${locale}/templates

2. Primary CTA (always use this):
   - #generate (this resolves to the current page + /generate)

3. External SELISE domains (only these two):
   - https://selisesignature.com/
   - https://selisegroup.com/

LINKING GUIDELINES:
- Add 2-5 internal template links naturally within richText, faq answers, or descriptions where contextually relevant
- Only link where it makes sense (don't force links)
- Use varied anchor text (template name, action phrases like "create your NDA", "generate a contract")
- For internal template links, use markdown format: [anchor text](/${locale}/templates/slug)
- For external links, use markdown format: [anchor text](https://selisesignature.com/) or [anchor text](https://selisegroup.com/)
- href must be absolute (http/https), or start with "/", or start with "#"
- NEVER create links to pages that don't exist (no examples, samples, galleries, etc.)

LANGUAGE RULES:
- Avoid exaggerated/absolute claims (e.g., "100% compliance", "guaranteed results"). Use measured, trustworthy phrasing.
- Emphasize throughout: Free, no login, no payment, no data storage, Swiss privacy standards, instant PDF download
- Explain the guided question process in simple terms - users are asked questions, we explain each step clearly, suggest options, but users have full control
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
          temperature: 0.6,
          // Increased for comprehensive long-form content generation
          max_tokens: 4096,
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
