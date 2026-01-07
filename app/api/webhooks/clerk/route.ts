/**
 * Clerk Webhook Handler
 *
 * Handles webhook events from Clerk for organization lifecycle management.
 * Syncs Clerk Organizations with our Prisma Organization model.
 *
 * Events handled:
 * - organization.created - Create Organization record
 * - organization.updated - Update Organization record
 * - organization.deleted - Delete Organization record (cascade deletes templates)
 *
 * Setup:
 * 1. Add CLERK_WEBHOOK_SECRET to .env
 * 2. Configure webhook in Clerk Dashboard: https://dashboard.clerk.com/webhooks
 * 3. Subscribe to organization.* events
 * 4. Set endpoint URL to: https://yourdomain.com/api/webhooks/clerk
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/lib/auth/organization";

type OrganizationWebhookEvent = {
  data: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
  object: "event";
  type:
    | "organization.created"
    | "organization.updated"
    | "organization.deleted";
};

/**
 * POST /api/webhooks/clerk
 * Handle incoming webhook events from Clerk
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[CLERK_WEBHOOK] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[CLERK_WEBHOOK] Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook verification headers" },
      { status: 400 }
    );
  }

  // Get raw body
  const payload = await request.text();

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: OrganizationWebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as OrganizationWebhookEvent;
  } catch (err) {
    console.error("[CLERK_WEBHOOK] Verification failed:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  // Handle event based on type
  const { type, data } = event;

  console.log(`[CLERK_WEBHOOK] Received event: ${type}`, {
    orgId: data.id,
    name: data.name,
    slug: data.slug,
  });

  try {
    switch (type) {
      case "organization.created": {
        await createOrganization({
          clerkOrgId: data.id,
          name: data.name,
          slug: data.slug,
          logoUrl: data.image_url,
        });
        console.log(`[CLERK_WEBHOOK] Created organization: ${data.slug}`);
        break;
      }

      case "organization.updated": {
        await updateOrganization(data.id, {
          name: data.name,
          slug: data.slug,
          logoUrl: data.image_url,
        });
        console.log(`[CLERK_WEBHOOK] Updated organization: ${data.slug}`);
        break;
      }

      case "organization.deleted": {
        await deleteOrganization(data.id);
        console.log(`[CLERK_WEBHOOK] Deleted organization: ${data.id}`);
        break;
      }

      default: {
        // Log unhandled event types but don't error
        console.log(`[CLERK_WEBHOOK] Unhandled event type: ${type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[CLERK_WEBHOOK] Error handling ${type}:`, error);

    // Return 200 anyway to prevent Clerk from retrying
    // The error is logged for investigation
    return NextResponse.json({
      received: true,
      warning: "Event processing encountered an error",
    });
  }
}
