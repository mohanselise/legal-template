import type { Metadata } from "next";
import Link from "next/link";

import {
  getUpcomingTemplates,
  searchAvailableTemplates,
} from "@/lib/templates-db";
import { TemplateSearchGrid } from "@/app/templates/_components/template-search-grid";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Legal Templates Library | SELISE Legal Template Generator",
  description:
    "Browse SELISE's library of free legal templates. Generate employment agreements today and preview upcoming documents we are preparing for release.",
};

const PAGE_SIZE = 12;

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const query = (searchParams?.q ?? "").trim();
  const currentPage = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  const [{ templates: availableTemplates, total: totalAvailable }, upcomingTemplates] =
    await Promise.all([
      searchAvailableTemplates({ query, page: currentPage, pageSize: PAGE_SIZE }),
      getUpcomingTemplates(),
    ]);

  const availableTemplateCards = availableTemplates.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    href: template.href,
    popular: template.popular,
    iconName:
      template.iconName ||
      (template.icon as any)?.displayName ||
      (template.icon as any)?.name ||
      "FileText",
  }));
  
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[hsl(var(--bg))] via-[hsl(var(--gradient-light-to))]/60 to-[hsl(var(--bg))]">
        <div className="absolute inset-0 bg-[hsl(var(--selise-blue))]/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:px-8">
          <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
            Template Library
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Explore Our Legal Templates
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            SELISE legal templates follow industry best practices, are written in plain English, and
            take minutes to generate. Start with a live template today or see what&apos;s shipping next.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            {availableTemplates[0] ? (
              <Button
                asChild
                size="lg"
                className="group bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] shadow-lg shadow-[hsl(var(--selise-blue))]/30 h-auto px-8 py-6 text-base"
              >
                <Link href={availableTemplates[0].href}>
                  Generate {availableTemplates[0].title}
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10 h-auto px-8 py-6 text-base"
            >
              <Link href="#upcoming">
                Request Another Template
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] font-subheading uppercase tracking-[0.12em]">
                Available Now
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Generate
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Launch a tailored document in minutes. We collect the details, apply SELISE best practice content, and deliver a downloadable PDF you can share immediately.
              </p>
            </div>
          <div className="rounded-2xl border border-border bg-[hsl(var(--card))]/80 px-6 py-5 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/70">
            Showing {availableTemplates.length} of{" "}
            <span className="font-semibold text-foreground">{totalAvailable}</span>{" "}
            template{totalAvailable === 1 ? "" : "s"}.
          </div>
          </div>

          <TemplateSearchGrid
            templates={availableTemplateCards}
            ctaLabel="Generate Now"
            liveBadgeLabel="Live"
            popularBadgeLabel="Most Popular"
            searchPlaceholder="Search templates by name or keywords"
            noResultsText="No templates match your search yet."
            resultsLabelText={`Showing ${availableTemplates.length} of ${totalAvailable} templates`}
            mode="server"
            initialQuery={query}
            currentPage={currentPage}
            totalResults={totalAvailable}
            pageSize={PAGE_SIZE}
          />
        </div>
      </section>

      {upcomingTemplates.length > 0 ? (
        <section id="upcoming" className="bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--bg))] py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
              In Progress
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Upcoming Templates
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Vote on what we launch next. Tell us what you need, and we&apos;ll prioritise new templates accordingly.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {upcomingTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="relative flex h-full flex-col border border-border bg-[hsl(var(--card))]/70 p-6 backdrop-blur-sm transition-colors dark:bg-[hsl(var(--background))]/60"
                  >
                    <div className="absolute right-6 top-6">
                      <Badge className="bg-[hsl(var(--brand-surface))] text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.1em] dark:bg-[hsl(var(--brand-surface-strong))] dark:text-[hsl(var(--sky-blue))]">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-6 text-xl">{template.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {template.description}
                    </CardDescription>
                    <CardFooter className="mt-auto px-0 pt-6">
                      <Button
                        variant="outline"
                        className="w-full border-[hsl(var(--selise-blue))]/40 text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
                        asChild
                      >
                        <Link href="mailto:hello@selise.ch?subject=Template%20request">
                          Request Early Access
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Need a different document?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We&apos;re expanding the library with the requests we receive most. Let us know what would help your team, and our legal specialists will add it to the roadmap.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              <Link href="mailto:hello@selise.ch?subject=Template%20request">
                Send a Request
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
            >
              <Link href="/templates/employment-agreement/generate">
                Explore Generator
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
