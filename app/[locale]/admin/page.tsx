import { currentUser } from "@clerk/nextjs/server";
import { redirect as nextRedirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowUpRight,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const adminModules = [
  {
    title: "Templates",
    description: "Manage legal templates",
    icon: FileText,
    href: "/admin/templates",
    details: "Create, edit, and manage all legal document templates.",
    available: true,
  },
  {
    title: "Users",
    description: "User management",
    icon: Users,
    href: "/admin/users",
    details: "Manage user accounts and permissions.",
    available: false,
  },
  {
    title: "Analytics",
    description: "Usage statistics",
    icon: BarChart3,
    href: "/admin/analytics",
    details: "View document generation and usage analytics.",
    available: true,
  },
  {
    title: "Settings",
    description: "System configuration",
    icon: Settings,
    href: "/admin/settings",
    details: "Configure system settings and preferences.",
    available: true,
  },
];

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

  return (
    <div className="container mx-auto space-y-8 px-4 py-10 lg:px-8">
      <div className="overflow-hidden rounded-2xl border bg-linear-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-[hsl(var(--white))] shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--selise-blue))]/20 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              Admin workspace
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl font-heading">
              Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
            </h1>
            <p className="max-w-2xl text-sm text-[hsl(var(--white))]/85 sm:text-base">
              Manage templates, insights, and configuration from a single, organized dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90"
            >
              <Link href={`/${locale}/admin/templates`} className="inline-flex items-center gap-2">
                Manage templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[hsl(var(--white))]/70 text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10"
            >
              <Link href={`/${locale}/admin/analytics`} className="inline-flex items-center gap-2">
                View analytics
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[hsl(var(--fg))]">Admin modules</h2>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Jump into a workspace to continue your tasks.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {adminModules.map((module) => {
          const Icon = module.icon;
          const cardContent = (
            <Card
              className={`group relative h-full overflow-hidden border transition-all ${
                module.available
                  ? "hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))]/30 hover:shadow-md"
                  : "opacity-70"
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        module.available
                          ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                          : "bg-[hsl(var(--border))] text-[hsl(var(--globe-grey))]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={module.available ? "secondary" : "outline"}
                    className={
                      module.available
                        ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/20"
                        : "text-[hsl(var(--globe-grey))] border-[hsl(var(--border))]"
                    }
                  >
                    {module.available ? "Active" : "Coming soon"}
                  </Badge>
                </div>
                <CardDescription className="text-sm leading-relaxed text-[hsl(var(--globe-grey))]">
                  {module.details}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-[hsl(var(--globe-grey))]">
                <span>{module.available ? "Open module" : "Preview only"}</span>
                {module.available && (
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--globe-grey))] transition-all group-hover:translate-x-1 group-hover:text-[hsl(var(--selise-blue))]" />
                )}
              </CardContent>
            </Card>
          );

          return module.available ? (
            <Link
              key={module.title}
              href={`/${locale}${module.href}`}
              className={`block group cursor-pointer`}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={module.title}
              className="block opacity-60 cursor-not-allowed"
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Quick glance at your profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium text-[hsl(var(--fg))]">Email</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium text-[hsl(var(--fg))]">User ID</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">{user.id}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm font-medium text-[hsl(var(--fg))]">Created</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
            <CardDescription>Stay confident while you manage admin tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--fg))]">Support</p>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Review settings or reach the team if something looks off.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="mt-2 px-0 text-[hsl(var(--selise-blue))] hover:text-[hsl(var(--selise-blue))]"
                >
                  <Link href={`/${locale}/admin/settings`} className="inline-flex items-center gap-1">
                    Open settings
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--fg))]">Security</p>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Keep your account secure by verifying sign-in details regularly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
