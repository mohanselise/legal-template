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
import {
  FileText,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
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
    available: false,
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
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--fg))] font-heading">
          Admin Dashboard
        </h1>
        <p className="text-[hsl(var(--globe-grey))] mt-2">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminModules.map((module) => {
          const Icon = module.icon;
          const cardContent = (
            <Card
              className={`h-full transition-all ${
                module.available
                  ? "hover:shadow-lg hover:border-[hsl(var(--selise-blue))]/30"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${
                      module.available
                        ? "bg-[hsl(var(--selise-blue))]/10"
                        : "bg-[hsl(var(--muted))]"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${
                        module.available
                          ? "text-[hsl(var(--selise-blue))]"
                          : "text-[hsl(var(--globe-grey))]"
                      }`}
                    />
                  </div>
                  {module.available && (
                    <ArrowRight className="size-4 text-[hsl(var(--globe-grey))] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  )}
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  {module.details}
                </p>
                {!module.available && (
                  <p className="text-xs text-[hsl(var(--globe-grey))] mt-2 italic">
                    Coming soon
                  </p>
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
