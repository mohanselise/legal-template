/**
 * Admin Templates API - List and Create
 *
 * GET  /api/admin/templates - List all templates
 * POST /api/admin/templates - Create a new template
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@/lib/db";
import { createTemplateSchema } from "./schema";
import { ZodError } from "zod";

/**
 * GET /api/admin/templates
 * List all templates with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const available = searchParams.get("available");

    // Build where clause
    const where: Prisma.TemplateWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (available !== null) {
      where.available = available === "true";
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[ADMIN_TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // Check if slug already exists
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
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[ADMIN_TEMPLATES_POST]", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

