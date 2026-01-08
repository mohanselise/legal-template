import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { Organization } from "@/lib/generated/prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, type OrgPermission } from "./permissions";

/**
 * Organization roles within Clerk Organizations
 * These are separate from platform roles (admin/editor)
 */
export type OrgRole = "org_admin" | "org_editor" | "org_member";

/**
 * Map Clerk organization role to our OrgRole type
 * Clerk uses "org:admin", "org:editor", "org:member" format
 */
export function mapClerkOrgRole(clerkRole: string | undefined): OrgRole | null {
  if (!clerkRole) return null;

  // Clerk roles come as "org:admin", "org:editor", "org:member"
  const roleMap: Record<string, OrgRole> = {
    "org:admin": "org_admin",
    "org:editor": "org_editor",
    "org:member": "org_member",
    // Also support direct role names
    admin: "org_admin",
    editor: "org_editor",
    member: "org_member",
  };

  return roleMap[clerkRole] ?? null;
}

/**
 * Get the current user's active organization from Clerk
 * Returns the Organization record from our database if it exists
 */
export async function getActiveOrganization(): Promise<Organization | null> {
  const { orgId } = await auth();

  if (!orgId) return null;

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
  });

  return organization;
}

/**
 * Get the current user's organization role
 * Returns null if user is not in an organization or doesn't have a role
 */
export async function getOrgRole(): Promise<OrgRole | null> {
  const { orgRole } = await auth();
  return mapClerkOrgRole(orgRole ?? undefined);
}

/**
 * Require an active organization - throws redirect if none
 * Use in server components/API routes that require org context
 */
export async function requireOrganization(): Promise<Organization> {
  const org = await getActiveOrganization();

  if (!org) {
    throw new Error("Organization required");
  }

  return org;
}

/**
 * Check if current user is an organization admin
 */
export async function isOrgAdmin(): Promise<boolean> {
  const role = await getOrgRole();
  return role === "org_admin";
}

/**
 * Check if current user is an organization editor (or admin)
 */
export async function isOrgEditor(): Promise<boolean> {
  const role = await getOrgRole();
  return role === "org_admin" || role === "org_editor";
}

/**
 * Check if current user is an organization member (any role)
 */
export async function isOrgMember(): Promise<boolean> {
  const role = await getOrgRole();
  return role !== null;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { slug },
  });
}

/**
 * Get organization by Clerk org ID
 */
export async function getOrganizationByClerkId(
  clerkOrgId: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { clerkOrgId },
  });
}

/**
 * Create organization record synced from Clerk
 */
export async function createOrganization(data: {
  clerkOrgId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}): Promise<Organization> {
  return prisma.organization.create({
    data: {
      clerkOrgId: data.clerkOrgId,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl,
    },
  });
}

/**
 * Update organization record synced from Clerk
 */
export async function updateOrganization(
  clerkOrgId: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string | null;
  }
): Promise<Organization> {
  return prisma.organization.update({
    where: { clerkOrgId },
    data,
  });
}

/**
 * Delete organization record synced from Clerk
 * Note: This will cascade delete all org templates
 */
export async function deleteOrganization(clerkOrgId: string): Promise<void> {
  await prisma.organization.delete({
    where: { clerkOrgId },
  });
}

/**
 * Check if a user can access an organization's resources
 * Validates that user's active org matches the requested org
 */
export async function canAccessOrganization(orgId: string): Promise<boolean> {
  const activeOrg = await getActiveOrganization();
  return activeOrg?.id === orgId;
}

/**
 * Permission check: Can user manage org templates (create/edit)?
 * Requires org_admin or org_editor role
 */
export async function canManageOrgTemplates(): Promise<boolean> {
  return isOrgEditor();
}

/**
 * Permission check: Can user delete org templates?
 * Requires org_admin role only
 */
export async function canDeleteOrgTemplates(): Promise<boolean> {
  return isOrgAdmin();
}

/**
 * Permission check: Can user manage org members?
 * Requires org_admin role
 */
export async function canManageOrgMembers(): Promise<boolean> {
  return isOrgAdmin();
}

/**
 * Permission check: Can user update org settings?
 * Requires org_admin role
 */
export async function canUpdateOrgSettings(): Promise<boolean> {
  return isOrgAdmin();
}

/**
 * Sync organization from Clerk to database
 * Used as fallback when webhook hasn't fired (e.g., local development)
 * Fetches org details from Clerk API and creates/updates local record
 */
export async function syncOrganizationFromClerk(
  clerkOrgId: string
): Promise<Organization | null> {
  try {
    const clerk = await clerkClient();
    const clerkOrg = await clerk.organizations.getOrganization({
      organizationId: clerkOrgId,
    });

    if (!clerkOrg) {
      return null;
    }

    // Upsert: create if not exists, update if exists
    const organization = await prisma.organization.upsert({
      where: { clerkOrgId },
      update: {
        name: clerkOrg.name,
        slug: clerkOrg.slug ?? clerkOrgId,
        logoUrl: clerkOrg.imageUrl,
      },
      create: {
        clerkOrgId,
        name: clerkOrg.name,
        slug: clerkOrg.slug ?? clerkOrgId,
        logoUrl: clerkOrg.imageUrl,
      },
    });

    console.log(`[ORG_SYNC] Synced organization from Clerk: ${organization.slug}`);
    return organization;
  } catch (error) {
    console.error("[ORG_SYNC] Failed to sync organization from Clerk:", error);
    return null;
  }
}

/**
 * Get organization by slug, with fallback to sync from Clerk
 * This ensures orgs work even without webhooks (local development)
 */
export async function getOrganizationBySlugWithSync(
  slug: string,
  clerkOrgId: string | null
): Promise<Organization | null> {
  // First try to find by slug
  let organization = await prisma.organization.findUnique({
    where: { slug },
  });

  // If not found and we have a Clerk org ID, try to sync
  if (!organization && clerkOrgId) {
    organization = await syncOrganizationFromClerk(clerkOrgId);
  }

  return organization;
}

/**
 * Check if the current user has a specific permission in their organization
 * First checks default role permissions, then checks for custom org-level overrides
 */
export async function hasOrgPermission(permission: OrgPermission): Promise<boolean> {
  const role = await getOrgRole();
  if (!role) return false;

  // Check default role permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check for custom org-level permission overrides
  const org = await getActiveOrganization();
  if (org) {
    const customPermission = await prisma.organizationPermission.findUnique({
      where: {
        organizationId_permission: {
          organizationId: org.id,
          permission,
        },
      },
    });

    if (customPermission && customPermission.roles.includes(role)) {
      return true;
    }
  }

  return false;
}

/**
 * Require a specific permission - returns false if not granted
 * Use in server components/API routes to check permissions
 */
export async function requireOrgPermission(permission: OrgPermission): Promise<boolean> {
  return hasOrgPermission(permission);
}

/**
 * Check multiple permissions at once
 * Returns true if user has ALL specified permissions
 */
export async function hasAllOrgPermissions(permissions: OrgPermission[]): Promise<boolean> {
  const results = await Promise.all(permissions.map(hasOrgPermission));
  return results.every(Boolean);
}

/**
 * Check multiple permissions at once
 * Returns true if user has ANY of the specified permissions
 */
export async function hasAnyOrgPermission(permissions: OrgPermission[]): Promise<boolean> {
  const results = await Promise.all(permissions.map(hasOrgPermission));
  return results.some(Boolean);
}
