/**
 * Organization Screen Fields API
 *
 * GET   /api/org/[orgId]/screens/[screenId]/fields - List all fields
 * POST  /api/org/[orgId]/screens/[screenId]/fields - Create a new field
 * PATCH /api/org/[orgId]/screens/[screenId]/fields - Reorder fields
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, FieldType } from "@/lib/db";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; screenId: string }> };

const createFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum([
    "text", "email", "date", "number", "checkbox", "select", "multiselect",
    "textarea", "phone", "address", "party", "currency", "percentage", "url"
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).default([]),
  order: z.number().int().min(0).optional(),
  aiSuggestionEnabled: z.boolean().default(false),
  aiSuggestionKey: z.string().nullable().optional(),
  conditions: z.string().nullable().optional(),
});

const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string()),
});

/**
 * Verify screen belongs to an org template
 */
async function verifyScreenBelongsToOrg(screenId: string, orgId: string) {
  const screen = await prisma.templateScreen.findUnique({
    where: { id: screenId },
    include: {
      template: {
        select: { organizationId: true },
      },
    },
  });

  if (!screen || screen.template.organizationId !== orgId) {
    return null;
  }
  return screen;
}

/**
 * GET /api/org/[orgId]/screens/[screenId]/fields
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, screenId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const screen = await verifyScreenBelongsToOrg(screenId, orgId);
    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const fields = await prisma.templateField.findMany({
      where: { screenId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("[ORG_FIELDS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}

/**
 * POST /api/org/[orgId]/screens/[screenId]/fields
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, screenId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    const screen = await verifyScreenBelongsToOrg(screenId, orgId);
    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = createFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, label, type, required, placeholder, helpText, options, order, aiSuggestionEnabled, aiSuggestionKey, conditions } = validation.data;

    // Check for duplicate field name
    const existingField = await prisma.templateField.findFirst({
      where: { screenId, name },
    });

    if (existingField) {
      return NextResponse.json(
        { error: `Field with name "${name}" already exists in this screen` },
        { status: 400 }
      );
    }

    let finalOrder = order;
    if (finalOrder === undefined) {
      const lastField = await prisma.templateField.findFirst({
        where: { screenId },
        orderBy: { order: "desc" },
      });
      finalOrder = lastField ? lastField.order + 1 : 0;
    }

    const field = await prisma.templateField.create({
      data: {
        screenId,
        name,
        label,
        type: type as FieldType,
        required,
        placeholder,
        helpText,
        options,
        order: finalOrder,
        aiSuggestionEnabled: aiSuggestionEnabled ?? false,
        aiSuggestionKey: aiSuggestionKey?.trim() || null,
        conditions: conditions ?? null,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("[ORG_FIELDS_POST]", error);
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/[orgId]/screens/[screenId]/fields
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, screenId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    const screen = await verifyScreenBelongsToOrg(screenId, orgId);
    if (!screen) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = reorderFieldsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { fieldIds } = validation.data;

    for (let index = 0; index < fieldIds.length; index++) {
      await prisma.templateField.update({
        where: { id: fieldIds[index] },
        data: { order: index },
      });
    }

    const fields = await prisma.templateField.findMany({
      where: { screenId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("[ORG_FIELDS_REORDER]", error);
    return NextResponse.json({ error: "Failed to reorder fields" }, { status: 500 });
  }
}
