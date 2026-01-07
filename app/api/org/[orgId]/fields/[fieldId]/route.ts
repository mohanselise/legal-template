/**
 * Organization Field API - Single Field Operations
 *
 * GET    /api/org/[orgId]/fields/[fieldId] - Get a field
 * PATCH  /api/org/[orgId]/fields/[fieldId] - Update a field
 * DELETE /api/org/[orgId]/fields/[fieldId] - Delete a field
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, FieldType } from "@/lib/db";
import { canAccessOrganization, canManageOrgTemplates } from "@/lib/auth/organization";

type RouteParams = { params: Promise<{ orgId: string; fieldId: string }> };

const updateFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").optional(),
  label: z.string().min(1, "Label is required").optional(),
  type: z.enum([
    "text", "email", "date", "number", "checkbox", "select", "multiselect",
    "textarea", "phone", "address", "party", "currency", "percentage", "url"
  ]).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  options: z.array(z.string()).optional(),
  order: z.number().int().min(0).optional(),
  screenId: z.string().optional(),
  aiSuggestionEnabled: z.boolean().optional(),
  aiSuggestionKey: z.string().nullable().optional().transform(val => val?.trim() || null),
  conditions: z.string().nullable().optional(),
});

/**
 * Verify field belongs to an org template
 */
async function verifyFieldBelongsToOrg(fieldId: string, orgId: string) {
  const field = await prisma.templateField.findUnique({
    where: { id: fieldId },
    include: {
      screen: {
        include: {
          template: {
            select: { organizationId: true },
          },
        },
      },
    },
  });

  if (!field || field.screen.template.organizationId !== orgId) {
    return null;
  }
  return field;
}

/**
 * GET /api/org/[orgId]/fields/[fieldId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, fieldId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const field = await verifyFieldBelongsToOrg(fieldId, orgId);
    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Return field without nested includes
    const { screen, ...fieldData } = field;
    return NextResponse.json(fieldData);
  } catch (error) {
    console.error("[ORG_FIELD_GET]", error);
    return NextResponse.json({ error: "Failed to fetch field" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/[orgId]/fields/[fieldId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, fieldId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    const existingField = await verifyFieldBelongsToOrg(fieldId, orgId);
    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const targetScreenId = validation.data.screenId || existingField.screenId;

    // If moving to a new screen, verify target screen exists and belongs to org
    if (validation.data.screenId && validation.data.screenId !== existingField.screenId) {
      const targetScreen = await prisma.templateScreen.findUnique({
        where: { id: validation.data.screenId },
        include: {
          template: { select: { organizationId: true } },
        },
      });
      if (!targetScreen || targetScreen.template.organizationId !== orgId) {
        return NextResponse.json({ error: "Target screen not found" }, { status: 404 });
      }
    }

    // Check for duplicate field name
    if (validation.data.name && validation.data.name !== existingField.name) {
      const duplicateField = await prisma.templateField.findFirst({
        where: {
          screenId: targetScreenId,
          name: validation.data.name,
          NOT: { id: fieldId },
        },
      });

      if (duplicateField) {
        return NextResponse.json(
          { error: `Field with name "${validation.data.name}" already exists in this screen` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.type) {
      updateData.type = validation.data.type as FieldType;
    }

    // Handle cross-screen movement
    if (validation.data.screenId && validation.data.screenId !== existingField.screenId) {
      const lastFieldInTarget = await prisma.templateField.findFirst({
        where: { screenId: validation.data.screenId },
        orderBy: { order: "desc" },
      });
      updateData.order = lastFieldInTarget ? lastFieldInTarget.order + 1 : 0;
    }

    if (validation.data.aiSuggestionKey !== undefined) {
      updateData.aiSuggestionKey = validation.data.aiSuggestionKey;
    }

    const field = await prisma.templateField.update({
      where: { id: fieldId },
      data: updateData,
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("[ORG_FIELD_PATCH]", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

/**
 * DELETE /api/org/[orgId]/fields/[fieldId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { orgId, fieldId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await canAccessOrganization(orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await canManageOrgTemplates())) {
      return NextResponse.json({ error: "Forbidden: Cannot manage templates" }, { status: 403 });
    }

    const existingField = await verifyFieldBelongsToOrg(fieldId, orgId);
    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    await prisma.templateField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORG_FIELD_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
