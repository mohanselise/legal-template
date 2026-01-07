/**
 * Organization Templates API - List and Create
 *
 * GET  /api/org/[orgId]/templates - List organization's templates
 * POST /api/org/[orgId]/templates - Create a new org template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@/lib/db";
import {
  canAccessOrganization,
  canManageOrgTemplates,
} from "@/lib/auth/organization";
import { z } from "zod";

type RouteParams = { params: Promise<{ orgId: string }> };

const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().default("FileText"),
  available: z.boolean().default(false),
  popular: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
  estimatedMinutes: z.number().optional(),
  systemPrompt: z.string().optional(),
  systemPromptRole: z.string().optional(),
});

/**
 * GET /api/org/[orgId]/templates
 * List all templates for the organization
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId } = await params;

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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const available = searchParams.get("available");

    // Build where clause - only org templates
    const where: Prisma.TemplateWhereInput = {
      organizationId: orgId,
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (available !== null) {
      where.available = available === "true";
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { screens: true },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[ORG_TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgId]/templates
 * Create a new organization template
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId } = await params;

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

    // Check if user can manage templates (admin or editor)
    if (!(await canManageOrgTemplates())) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to create templates" },
        { status: 403 }
      );
    }

    // Check template limit
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { templates: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (org._count.templates >= org.maxTemplates) {
      return NextResponse.json(
        {
          error: `Template limit reached (${org.maxTemplates}). Upgrade your plan to create more templates.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // Check if slug already exists (globally unique)
    const existing = await prisma.template.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A template with this slug already exists" },
        { status: 409 }
      );
    }

    // Auto-generate href from slug
    const href = `/templates/${data.slug}/generate`;

    const template = await prisma.template.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        icon: data.icon,
        available: data.available,
        popular: data.popular,
        href,
        keywords: data.keywords,
        estimatedMinutes: data.estimatedMinutes,
        systemPrompt: data.systemPrompt,
        systemPromptRole: data.systemPromptRole,
        organizationId: orgId, // Link to organization
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ORG_TEMPLATES_POST]", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
