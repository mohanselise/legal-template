import { currentUser } from "@clerk/nextjs/server";
import { redirect as nextRedirect } from "next/navigation";
import Link from "next/link";
import { getUserRole, hasAccess } from "@/lib/auth/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle2,
  Circle,
  KeyRound,
  Sparkles,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getBlocksProjectKey, getOpenRouterApiKey } from "@/lib/system-settings";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionHref: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();

  if (!user) {
    // Redirect to sign-in without locale prefix (sign-in is excluded from i18n)
    nextRedirect("/sign-in");
  }

  const role = getUserRole(user);
  if (!role || !hasAccess(role, "/admin")) {
    // Editors should be redirected to templates
    if (role === "editor") {
      nextRedirect(`/${locale}/admin/templates`);
    }
    // No role or insufficient permissions
    nextRedirect("/sign-in");
  }

  // Server-side status probes
  const [templateCount, blocksKey, openRouterKey] = await Promise.all([
    prisma.template.count(),
    getBlocksProjectKey(),
    getOpenRouterApiKey(),
  ]);

  const hasTemplates = templateCount > 0;
  const hasIntegrationKeys = Boolean(blocksKey && openRouterKey);

  // Build checklist items
  const checklistItems: ChecklistItem[] = [
    {
      id: "integration-keys",
      title: "Configure integration keys",
      description: "Set up SELISE Blocks and OpenRouter API keys in settings to enable AI features.",
      completed: hasIntegrationKeys,
      actionHref: `/${locale}/admin/settings`,
      actionLabel: "Open Settings",
      icon: KeyRound,
    },
    {
      id: "create-template",
      title: "Create your first template",
      description: "Add a legal document template so users can generate contracts and agreements.",
      completed: hasTemplates,
      actionHref: `/${locale}/admin/templates/new`,
      actionLabel: "Create Template",
      icon: FileText,
    },
    ...(role === "admin"
      ? [
          {
            id: "manage-users",
            title: "Invite team members",
            description: "Add editors or admins to help manage templates and settings.",
            completed: false, // Could check user count if needed
            actionHref: `/${locale}/admin/users`,
            actionLabel: "Manage Users",
            icon: Users,
          } as ChecklistItem,
        ]
      : []),
    {
      id: "review-analytics",
      title: "Review analytics",
      description: "Check usage statistics and monitor document generation activity.",
      completed: false, // Always actionable
      actionHref: `/${locale}/admin/analytics`,
      actionLabel: "View Analytics",
      icon: BarChart3,
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressPercentage = Math.round(
    (completedCount / checklistItems.length) * 100
  );

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
          <span className="text-sm font-medium text-[hsl(var(--globe-grey))]">
            Admin Dashboard
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[hsl(var(--fg))] font-heading">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress?.split("@")[0]}
        </h1>
        <p className="text-[hsl(var(--globe-grey))]">
          Get started by completing the setup checklist below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Getting Started Checklist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Complete these steps to set up your admin workspace
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[hsl(var(--selise-blue))] font-heading">
                    {progressPercentage}%
                  </div>
                  <div className="text-xs text-[hsl(var(--globe-grey))]">
                    {completedCount} of {checklistItems.length} complete
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                      item.completed
                        ? "border-[hsl(var(--lime-green))]/30 bg-[hsl(var(--lime-green))]/5"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.completed
                          ? "bg-[hsl(var(--lime-green))] text-white"
                          : "border-2 border-[hsl(var(--border))] bg-transparent"
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              className={`h-4 w-4 ${
                                item.completed
                                  ? "text-[hsl(var(--lime-green))]"
                                  : "text-[hsl(var(--globe-grey))]"
                              }`}
                            />
                            <h3
                              className={`font-medium ${
                                item.completed
                                  ? "text-[hsl(var(--globe-grey))] line-through"
                                  : "text-[hsl(var(--fg))]"
                              }`}
                            >
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-sm text-[hsl(var(--globe-grey))]">
                            {item.description}
                          </p>
                        </div>
                        {!item.completed && (
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={item.actionHref}
                              className="inline-flex items-center gap-1.5"
                            >
                              {item.actionLabel}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" size="lg">
                <Link href={`/${locale}/admin/templates/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Template
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Link href={`/${locale}/admin/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Open Settings
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Link href={`/${locale}/admin/analytics`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              {role === "admin" && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <Link href={`/${locale}/admin/users`}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
