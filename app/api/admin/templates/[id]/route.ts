/**
 * Admin Templates API - Single Template Operations
 *
 * GET    /api/admin/templates/[id] - Get a single template
 * PATCH  /api/admin/templates/[id] - Update a template
 * DELETE /api/admin/templates/[id] - Delete a template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { updateTemplateSchema } from "../schema";
import { ZodError } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/templates/[id]
 * Get a single template by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[ADMIN_TEMPLATE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/templates/[id]
 * Update a template
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    // Check if template exists
    const existing = await prisma.template.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If slug is being updated, check for conflicts and auto-generate href
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.template.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "A template with this slug already exists" },
          { status: 409 }
        );
      }
      
      // Auto-generate href from new slug
      data.href = `/templates/${data.slug}/generate`;
    }

    // Validate signatory screen exists when publishing template
    if (data.available === true && !existing.available) {
      const signatoryScreen = await prisma.templateScreen.findFirst({
        where: { 
          templateId: id, 
          type: "signatory" 
        },
      });

      if (!signatoryScreen) {
        return NextResponse.json(
          { 
            error: "Template must have at least one signatory screen before publishing",
            details: "Add a signatory screen in the Form Builder to collect signature information."
          },
          { status: 400 }
        );
      }
    }

    const template = await prisma.template.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ADMIN_TEMPLATE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]
 * Delete a template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if template exists
    const existing = await prisma.template.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_TEMPLATE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

