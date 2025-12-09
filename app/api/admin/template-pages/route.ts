/**
 * Admin Template Pages API - List and Create
 *
 * GET  /api/admin/template-pages - List all template pages
 * POST /api/admin/template-pages - Create a new template page
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@/lib/db";
import { createTemplatePageSchema } from "./schema";
import { ZodError } from "zod";

/**
 * GET /api/admin/template-pages
 * List all template pages with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const locale = searchParams.get("locale");
    const published = searchParams.get("published");

    // Build where clause
    const where: Prisma.TemplatePageWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (locale) {
      where.locale = locale;
    }

    if (published !== null && published !== undefined) {
      where.published = published === "true";
    }

    const templatePages = await prisma.templatePage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ templatePages });
  } catch (error) {
    console.error("[ADMIN_TEMPLATE_PAGES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch template pages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/template-pages
 * Create a new template page
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplatePageSchema.parse(body);

    // Check if slug+locale combination already exists
    const existing = await prisma.templatePage.findUnique({
      where: {
        slug_locale: {
          slug: data.slug,
          locale: data.locale,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A template page with slug "${data.slug}" already exists for locale "${data.locale}"` },
        { status: 409 }
      );
    }

    const templatePage = await prisma.templatePage.create({
      data: {
        slug: data.slug,
        locale: data.locale,
        title: data.title,
        description: data.description,
        // Keep htmlBody for backward compatibility but prefer blocks
        htmlBody: data.htmlBody ?? "",
        blocks: data.blocks,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,
        keywords: data.keywords,
        published: data.published,
      },
    });

    return NextResponse.json({ templatePage }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ADMIN_TEMPLATE_PAGES_POST]", error);
    return NextResponse.json(
      { error: "Failed to create template page" },
      { status: 500 }
    );
  }
}
