/**
 * Admin Template Pages API - Single Page Operations
 *
 * GET    /api/admin/template-pages/[id] - Get a single template page
 * PATCH  /api/admin/template-pages/[id] - Update a template page
 * DELETE /api/admin/template-pages/[id] - Delete a template page
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { updateTemplatePageSchema } from "../schema";
import { ZodError } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/template-pages/[id]
 * Get a single template page by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const templatePage = await prisma.templatePage.findUnique({
      where: { id },
    });

    if (!templatePage) {
      return NextResponse.json(
        { error: "Template page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ templatePage });
  } catch (error) {
    console.error("[ADMIN_TEMPLATE_PAGE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch template page" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/template-pages/[id]
 * Update a template page
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTemplatePageSchema.parse(body);

    // Check if template page exists
    const existing = await prisma.templatePage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template page not found" },
        { status: 404 }
      );
    }

    // If slug or locale is being updated, check for conflicts
    const newSlug = data.slug ?? existing.slug;
    const newLocale = data.locale ?? existing.locale;

    if (newSlug !== existing.slug || newLocale !== existing.locale) {
      const slugExists = await prisma.templatePage.findUnique({
        where: {
          slug_locale: {
            slug: newSlug,
            locale: newLocale,
          },
        },
      });

      if (slugExists && slugExists.id !== id) {
        return NextResponse.json(
          { error: `A template page with slug "${newSlug}" already exists for locale "${newLocale}"` },
          { status: 409 }
        );
      }
    }

    const templatePage = await prisma.templatePage.update({
      where: { id },
      data: {
        ...data,
        // Ensure htmlBody always defined for legacy column even if omitted
        ...(data.htmlBody !== undefined ? { htmlBody: data.htmlBody } : {}),
      },
    });

    return NextResponse.json({ templatePage });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ADMIN_TEMPLATE_PAGE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update template page" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/template-pages/[id]
 * Delete a template page
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if template page exists
    const existing = await prisma.templatePage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template page not found" },
        { status: 404 }
      );
    }

    await prisma.templatePage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_TEMPLATE_PAGE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete template page" },
      { status: 500 }
    );
  }
}
