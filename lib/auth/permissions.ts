/**
 * Granular Organization Permissions
 *
 * This module defines fine-grained permissions for organization features.
 * Permissions are mapped to organization roles by default, but can be
 * customized per-organization using the OrganizationPermission model.
 */

import type { OrgRole } from "./organization";

/**
 * All available organization permissions
 */
export const ORG_PERMISSIONS = {
  // Template permissions
  TEMPLATES_VIEW: "templates.view",
  TEMPLATES_CREATE: "templates.create",
  TEMPLATES_EDIT: "templates.edit",
  TEMPLATES_DELETE: "templates.delete",
  TEMPLATES_PUBLISH: "templates.publish",

  // Settings permissions
  SETTINGS_VIEW: "settings.view",
  SETTINGS_GENERAL: "settings.general",
  SETTINGS_INTEGRATIONS: "settings.integrations",
  SETTINGS_BILLING: "settings.billing",

  // Member permissions
  MEMBERS_VIEW: "members.view",
  MEMBERS_INVITE: "members.invite",
  MEMBERS_REMOVE: "members.remove",
  MEMBERS_CHANGE_ROLE: "members.change_role",

  // Document permissions
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_SIGN: "documents.sign",
  DOCUMENTS_SEND: "documents.send",
  DOCUMENTS_DELETE: "documents.delete",

  // Analytics permissions
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",
} as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[keyof typeof ORG_PERMISSIONS];

/**
 * Default permission sets per role
 * These are used when no custom permissions are configured for the organization
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<OrgRole, OrgPermission[]> = {
  org_admin: Object.values(ORG_PERMISSIONS), // All permissions

  org_editor: [
    // Templates - can create and edit, but not delete or publish
    ORG_PERMISSIONS.TEMPLATES_VIEW,
    ORG_PERMISSIONS.TEMPLATES_CREATE,
    ORG_PERMISSIONS.TEMPLATES_EDIT,

    // Documents - full access
    ORG_PERMISSIONS.DOCUMENTS_VIEW,
    ORG_PERMISSIONS.DOCUMENTS_SIGN,
    ORG_PERMISSIONS.DOCUMENTS_SEND,

    // Members - view only
    ORG_PERMISSIONS.MEMBERS_VIEW,

    // Analytics - view only
    ORG_PERMISSIONS.ANALYTICS_VIEW,
  ],

  org_member: [
    // Templates - view only
    ORG_PERMISSIONS.TEMPLATES_VIEW,

    // Documents - can view and sign
    ORG_PERMISSIONS.DOCUMENTS_VIEW,
    ORG_PERMISSIONS.DOCUMENTS_SIGN,

    // Members - view only
    ORG_PERMISSIONS.MEMBERS_VIEW,
  ],
};

/**
 * Permission group labels for UI display
 */
export const PERMISSION_GROUPS = {
  templates: {
    label: "Templates",
    permissions: [
      ORG_PERMISSIONS.TEMPLATES_VIEW,
      ORG_PERMISSIONS.TEMPLATES_CREATE,
      ORG_PERMISSIONS.TEMPLATES_EDIT,
      ORG_PERMISSIONS.TEMPLATES_DELETE,
      ORG_PERMISSIONS.TEMPLATES_PUBLISH,
    ],
  },
  settings: {
    label: "Settings",
    permissions: [
      ORG_PERMISSIONS.SETTINGS_VIEW,
      ORG_PERMISSIONS.SETTINGS_GENERAL,
      ORG_PERMISSIONS.SETTINGS_INTEGRATIONS,
      ORG_PERMISSIONS.SETTINGS_BILLING,
    ],
  },
  members: {
    label: "Team Members",
    permissions: [
      ORG_PERMISSIONS.MEMBERS_VIEW,
      ORG_PERMISSIONS.MEMBERS_INVITE,
      ORG_PERMISSIONS.MEMBERS_REMOVE,
      ORG_PERMISSIONS.MEMBERS_CHANGE_ROLE,
    ],
  },
  documents: {
    label: "Documents",
    permissions: [
      ORG_PERMISSIONS.DOCUMENTS_VIEW,
      ORG_PERMISSIONS.DOCUMENTS_SIGN,
      ORG_PERMISSIONS.DOCUMENTS_SEND,
      ORG_PERMISSIONS.DOCUMENTS_DELETE,
    ],
  },
  analytics: {
    label: "Analytics",
    permissions: [
      ORG_PERMISSIONS.ANALYTICS_VIEW,
      ORG_PERMISSIONS.ANALYTICS_EXPORT,
    ],
  },
} as const;

/**
 * Human-readable labels for permissions
 */
export const PERMISSION_LABELS: Record<OrgPermission, string> = {
  [ORG_PERMISSIONS.TEMPLATES_VIEW]: "View templates",
  [ORG_PERMISSIONS.TEMPLATES_CREATE]: "Create templates",
  [ORG_PERMISSIONS.TEMPLATES_EDIT]: "Edit templates",
  [ORG_PERMISSIONS.TEMPLATES_DELETE]: "Delete templates",
  [ORG_PERMISSIONS.TEMPLATES_PUBLISH]: "Publish templates",

  [ORG_PERMISSIONS.SETTINGS_VIEW]: "View settings",
  [ORG_PERMISSIONS.SETTINGS_GENERAL]: "Manage general settings",
  [ORG_PERMISSIONS.SETTINGS_INTEGRATIONS]: "Manage integrations",
  [ORG_PERMISSIONS.SETTINGS_BILLING]: "Manage billing",

  [ORG_PERMISSIONS.MEMBERS_VIEW]: "View team members",
  [ORG_PERMISSIONS.MEMBERS_INVITE]: "Invite members",
  [ORG_PERMISSIONS.MEMBERS_REMOVE]: "Remove members",
  [ORG_PERMISSIONS.MEMBERS_CHANGE_ROLE]: "Change member roles",

  [ORG_PERMISSIONS.DOCUMENTS_VIEW]: "View documents",
  [ORG_PERMISSIONS.DOCUMENTS_SIGN]: "Sign documents",
  [ORG_PERMISSIONS.DOCUMENTS_SEND]: "Send documents for signature",
  [ORG_PERMISSIONS.DOCUMENTS_DELETE]: "Delete documents",

  [ORG_PERMISSIONS.ANALYTICS_VIEW]: "View analytics",
  [ORG_PERMISSIONS.ANALYTICS_EXPORT]: "Export analytics data",
};

/**
 * Check if a role has a specific permission by default
 */
export function roleHasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: OrgRole): OrgPermission[] {
  return DEFAULT_ROLE_PERMISSIONS[role];
}
