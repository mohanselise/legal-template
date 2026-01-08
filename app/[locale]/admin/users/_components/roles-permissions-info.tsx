"use client";

import { useState } from "react";
import {
  ShieldCheck,
  UserCog,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileText,
  BarChart3,
  Settings,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PermissionItem {
  feature: string;
  icon: React.ReactNode;
  admin: boolean;
  editor: boolean;
}

const permissions: PermissionItem[] = [
  {
    feature: "Dashboard Overview",
    icon: <LayoutDashboard className="size-4" />,
    admin: true,
    editor: false,
  },
  {
    feature: "Template Management",
    icon: <FileText className="size-4" />,
    admin: true,
    editor: true,
  },
  {
    feature: "Analytics & Reports",
    icon: <BarChart3 className="size-4" />,
    admin: true,
    editor: true,
  },
  {
    feature: "System Settings",
    icon: <Settings className="size-4" />,
    admin: true,
    editor: false,
  },
  {
    feature: "User Management",
    icon: <Users className="size-4" />,
    admin: true,
    editor: false,
  },
];

export function RolesPermissionsInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/10">
              <ShieldCheck className="size-5 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <CardTitle className="text-lg">Roles & Permissions</CardTitle>
              <p className="text-sm text-[hsl(var(--globe-grey))] mt-0.5">
                Understand what each role can access
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                Show Details
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* Role Descriptions */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Admin Role */}
            <div className="rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--selise-blue))]/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/10">
                  <ShieldCheck className="size-4 text-[hsl(var(--selise-blue))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--fg))]">Admin</h3>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Full system access
                  </p>
                </div>
                <Badge className="ml-auto bg-[hsl(var(--selise-blue))] text-white">
                  Full Access
                </Badge>
              </div>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                Administrators have complete access to all features including user
                management, system configuration, and all administrative functions.
                They can manage templates, view analytics, configure settings, and
                control user permissions.
              </p>
            </div>

            {/* Editor Role */}
            <div className="rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--lime-green))]/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--lime-green))]/10">
                  <UserCog className="size-4 text-[hsl(var(--lime-green))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--fg))]">Editor</h3>
                  <p className="text-xs text-[hsl(var(--globe-grey))]">
                    Limited access
                  </p>
                </div>
                <Badge className="ml-auto bg-[hsl(var(--lime-green))] text-white">
                  Limited Access
                </Badge>
              </div>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                Editors can manage templates and view analytics dashboards. They
                cannot access user management, system settings, or the main admin
                dashboard. This role is ideal for content creators and template
                managers.
              </p>
            </div>
          </div>

          {/* Permissions Table */}
          <div>
            <h4 className="font-semibold text-[hsl(var(--fg))] mb-3">
              Feature Access Matrix
            </h4>
            <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                        Feature
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-[hsl(var(--fg))]">
                        Admin
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-[hsl(var(--fg))]">
                        Editor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((permission, index) => (
                      <tr
                        key={index}
                        className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-[hsl(var(--globe-grey))]">
                              {permission.icon}
                            </div>
                            <span className="text-sm font-medium text-[hsl(var(--fg))]">
                              {permission.feature}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {permission.admin ? (
                            <div className="flex items-center justify-center">
                              <div className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/10">
                                <Check className="size-4 text-[hsl(var(--lime-green))]" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--globe-grey))]/10">
                                <X className="size-4 text-[hsl(var(--globe-grey))]" />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {permission.editor ? (
                            <div className="flex items-center justify-center">
                              <div className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/10">
                                <Check className="size-4 text-[hsl(var(--lime-green))]" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--globe-grey))]/10">
                                <X className="size-4 text-[hsl(var(--globe-grey))]" />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
            <h4 className="font-semibold text-[hsl(var(--fg))] mb-2 text-sm">
              Important Notes
            </h4>
            <ul className="space-y-1.5 text-sm text-[hsl(var(--globe-grey))]">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--selise-blue))] mt-0.5">•</span>
                <span>
                  Role changes take effect immediately after saving
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--selise-blue))] mt-0.5">•</span>
                <span>
                  Users without a role cannot access any admin features
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--selise-blue))] mt-0.5">•</span>
                <span>
                  Admins cannot remove their own admin role or delete their own
                  account
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--selise-blue))] mt-0.5">•</span>
                <span>
                  When inviting new users, assign the appropriate role based on
                  their responsibilities
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}




