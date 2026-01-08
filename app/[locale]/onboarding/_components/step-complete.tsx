"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Users, Settings } from "lucide-react";

interface StepCompleteProps {
  orgName: string | null;
  orgSlug: string | null;
  locale: string;
  onComplete: () => void;
  isLoading: boolean;
}

export function StepComplete({
  orgName,
  orgSlug,
  locale,
  onComplete,
  isLoading,
}: StepCompleteProps) {
  const quickLinks = [
    {
      icon: FileText,
      title: "Browse Templates",
      description: "Explore available legal document templates",
      href: orgSlug ? `/${locale}/org/${orgSlug}/templates` : `/${locale}/templates`,
    },
    {
      icon: Users,
      title: "Manage Team",
      description: "Invite team members and manage roles",
      href: orgSlug ? `/${locale}/org/${orgSlug}/users` : null,
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Configure organization settings",
      href: orgSlug ? `/${locale}/org/${orgSlug}/settings` : null,
    },
  ].filter((link) => link.href !== null);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/20">
          <CheckCircle className="h-10 w-10 text-[hsl(var(--lime-green))]" />
        </div>
        <h2 className="mt-6 font-[family-name:var(--font-aptos)] text-2xl font-bold text-[hsl(var(--fg))]">
          You&apos;re All Set!
        </h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          {orgName
            ? `Welcome to ${orgName}. You're ready to start creating legal documents.`
            : "You're ready to start creating legal documents."}
        </p>
      </div>

      {/* Quick links */}
      {quickLinks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            Quick Links
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.href!}
                className="group flex flex-col rounded-lg border border-[hsl(var(--border))] bg-white p-4 transition-all hover:border-[hsl(var(--selise-blue))]/30 hover:shadow-sm"
              >
                <link.icon className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                <span className="mt-2 font-medium text-[hsl(var(--fg))] group-hover:text-[hsl(var(--selise-blue))]">
                  {link.title}
                </span>
                <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {link.description}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? "Loading..." : "Go to Dashboard"}
        </Button>
      </div>
    </div>
  );
}
