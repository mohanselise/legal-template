import { User, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export type UserRole = "admin" | "editor";

/**
 * Route permissions mapping
 * Maps route patterns to the roles that can access them
 */
export const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin dashboard - admin only
  "/admin": ["admin"],
  "/admin/": ["admin"],
  
  // Templates - admin and editor
  "/admin/templates": ["admin", "editor"],
  
  // Analytics - admin and editor
  "/admin/analytics": ["admin", "editor"],
  
  // Settings - admin only
  "/admin/settings": ["admin"],
  
  // Users - admin only
  "/admin/users": ["admin"],
  
  // API routes
  "/api/admin/templates": ["admin", "editor"],
  "/api/admin/analytics": ["admin", "editor"],
  "/api/admin/users": ["admin"],
  // All other API routes require admin
};

/**
 * Extract user role from Clerk user's privateMetadata
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null;
  
  const role = user.privateMetadata?.role as UserRole | undefined;
  
  if (role === "admin" || role === "editor") {
    return role;
  }
  
  return null;
}

/**
 * Check if a user role has access to a given path
 */
export function hasAccess(role: UserRole | null, path: string): boolean {
  if (!role) return false;
  
  // Admin has access to everything
  if (role === "admin") return true;
  
  // For editor, check specific route permissions
  // Normalize path (remove locale prefix and trailing slashes)
  const normalizedPath = path
    .replace(/^\/[a-z]{2}\//, "/") // Remove locale prefix like /en/
    .replace(/\/$/, "") || "/"; // Remove trailing slash
  
  // Check exact match first
  if (ROLE_PERMISSIONS[normalizedPath]) {
    return ROLE_PERMISSIONS[normalizedPath].includes(role);
  }
  
  // Check if path starts with any allowed route pattern
  for (const [route, allowedRoles] of Object.entries(ROLE_PERMISSIONS)) {
    if (normalizedPath.startsWith(route) && allowedRoles.includes(role)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user has access to a given path
 */
export function userHasAccess(user: User | null, path: string): boolean {
  const role = getUserRole(user);
  return hasAccess(role, path);
}

/**
 * Get allowed routes for a role
 */
export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) return [];
  
  if (role === "admin") {
    // Admin has access to all routes
    return Object.keys(ROLE_PERMISSIONS);
  }
  
  // For editor, return only routes they can access
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route);
}

/**
 * Check role-based access for API routes
 * Returns a NextResponse with 403 if access is denied, null if access is granted
 */
export async function checkApiRouteAccess(pathname: string): Promise<NextResponse | null> {
  const user = await currentUser();
  const role = getUserRole(user);
  
  if (!role) {
    return NextResponse.json(
      { error: "Unauthorized: No role assigned" },
      { status: 403 }
    );
  }
  
  if (!hasAccess(role, pathname)) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }
  
  return null; // Access granted
}

