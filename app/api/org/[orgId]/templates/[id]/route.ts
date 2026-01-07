/**
 * Organization Templates API - Single Template Operations
 *
 * GET    /api/org/[orgId]/templates/[id] - Get a single template
 * PATCH  /api/org/[orgId]/templates/[id] - Update a template
 * DELETE /api/org/[orgId]/templates/[id] - Delete a template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  canAccessOrganization,
  canManageOrgTemplates,
  canDeleteOrgTemplates,
} from "@/lib/auth/organization";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ orgId: string; id: string }>;
};

const updateTemplateSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().optional(),
  available: z.boolean().optional(),
  popular: z.boolean().optional(),
  href: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  estimatedMinutes: z.number().nullable().optional(),
  systemPrompt: z.string().nullable().optional(),
  systemPromptRole: z.string().nullable().optional(),
  uilmTitleKey: z.string().nullable().optional(),
  uilmDescriptionKey: z.string().nullable().optional(),
});

/**
 * GET /api/org/[orgId]/templates/[id]
 * Get a single organization template by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    const template = await prisma.template.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        screens: {
          orderBy: { order: "asc" },
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[ORG_TEMPLATE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgId]/templates/[id]
 * Update an organization template
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Check if user can manage templates
    if (!(await canManageOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to edit templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    // Check if template exists and belongs to org
    const existing = await prisma.template.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If slug is being updated, check for conflicts
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
      (data as any).href = `/templates/${data.slug}/generate`;
    }

    const template = await prisma.template.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ORG_TEMPLATE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgId]/templates/[id]
 * Delete an organization template (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user can access this organization
    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this organization" },
        { status: 403 }
      );
    }

    // Only admins can delete templates
    if (!(await canDeleteOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can delete templates" },
        { status: 403 }
      );
    }

    // Check if template exists and belongs to org
    const existing = await prisma.template.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
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
    console.error("[ORG_TEMPLATE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
