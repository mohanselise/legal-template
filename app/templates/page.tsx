import type { Metadata } from "next";
import Link from "next/link";

import {
  getUpcomingTemplates,
  searchAvailableTemplates,
} from "@/lib/templates-db";
import { TemplateSearchGrid } from "@/app/templates/_components/template-search-grid";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
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
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/graphics/whole-page-bg.webp"
            alt="Templates background"
            fill
            priority
            className="object-cover brightness-[0.4] -scale-x-100"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--oxford-blue))]/80 via-[hsl(var(--selise-blue))]/60 to-[hsl(var(--eerie-black))]/65" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr,0.9fr] lg:px-8 lg:py-28">
          <div>
            <Badge className="bg-[hsl(var(--selise-blue))]/15 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.14em]">
              Template Library
            </Badge>
            <h1 className="mt-6 text-4xl font-heading font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Legal templates that match the homepage polish.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/85">
              Generate SELISE-vetted agreements in minutes. Browse the live library, queue your next request, and launch documents that already fit our Signature experience.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {availableTemplates[0] ? (
                <Button
                  asChild
                  size="lg"
                  className="group h-auto px-7 py-3.5 text-base font-semibold bg-[hsl(var(--selise-blue))] text-white hover:bg-[hsl(var(--oxford-blue))] shadow-lg shadow-[hsl(var(--selise-blue))]/30"
                >
                  <Link href={availableTemplates[0].href} className="flex items-center gap-2">
                    Generate {availableTemplates[0].title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto px-7 py-3.5 text-base font-semibold border-white/25 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#library">Browse the library</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-auto px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10"
              >
                <Link href="#upcoming">Request another template</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Live templates</p>
                <p className="mt-2 text-2xl font-semibold">{totalAvailable}</p>
                <p className="text-sm text-white/70">Always free to generate</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Upcoming</p>
                <p className="mt-2 text-2xl font-semibold">{upcomingTemplates.length}</p>
                <p className="text-sm text-white/70">Vote for what ships next</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Time to first PDF</p>
                <p className="mt-2 text-2xl font-semibold">≈ 3 min</p>
                <p className="text-sm text-white/70">Guided prompts, instant export</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[hsl(var(--light-blue))]" />
              <p className="text-sm uppercase tracking-[0.18em] text-white/70">Trusted experience</p>
            </div>
            <h2 className="mt-4 text-2xl font-heading font-semibold leading-tight">
              Aligned with our homepage design language—clean, confident, human.
            </h2>
            <ul className="mt-6 space-y-4 text-white/85">
              {[
                "Plain-English copy with SELISE voice and tone.",
                "No accounts, no cards—just answer and export.",
                "Bank-grade security ready for signature.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[hsl(var(--lime-green))]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-white/80 ring-1 ring-white/15">
              <Timer className="h-4 w-4" />
              <span>Built for fast launches and repeatable workflows</span>
            </div>
          </div>
        </div>
      </section>

      <section id="library" className="relative py-24 sm:py-28">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt="Textured background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white dark:from-[hsl(var(--background))] dark:via-[hsl(var(--background))]/85 dark:to-[hsl(var(--background))]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
                Available Now
              </Badge>
              <h2 className="mt-4 text-3xl font-heading font-bold tracking-tight sm:text-4xl">
                Browse and generate instantly
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Launch a tailored document in minutes. Answer the guided prompts, apply SELISE best-practice content, and export a PDF that is ready for signature.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-[hsl(var(--card))]/80 px-6 py-5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
              Showing {availableTemplates.length} of{" "}
              <span className="font-semibold text-foreground">{totalAvailable}</span>{" "}
              template{totalAvailable === 1 ? "" : "s"}.
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Legally vetted templates", body: "Built with SELISE standards and refreshed as regulations move." },
              { icon: Sparkles, title: "Plain-English guidance", body: "Prompts keep you on-track without legalese." },
              { icon: CheckCircle2, title: "Ready for Signature", body: "Download a clean PDF that pairs with SELISE Signature." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border bg-[hsl(var(--card))] p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-[hsl(var(--card))]/90 shadow-xl backdrop-blur">
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
        </div>
      </section>

      {upcomingTemplates.length > 0 ? (
        <section
          id="upcoming"
          className="relative overflow-hidden py-24 sm:py-28"
        >
          <div className="absolute inset-0">
            <Image
              src="/graphics/2nd-bg.webp"
              alt="Upcoming templates backdrop"
              fill
              className="object-cover brightness-[0.65]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--oxford-blue))]/85 via-[hsl(var(--selise-blue))]/55 to-[hsl(var(--background))]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-white">
            <Badge className="bg-white/15 text-white font-subheading uppercase tracking-[0.12em]">
              In Progress
            </Badge>
            <h2 className="mt-4 text-3xl font-heading font-bold tracking-tight sm:text-4xl text-on-media">
              Upcoming templates
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 text-on-media">
              Vote on what we launch next. Tell us what you need and we&apos;ll prioritise the roadmap accordingly.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {upcomingTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="relative flex h-full flex-col border border-white/15 bg-white/5 p-6 text-white shadow-lg backdrop-blur"
                  >
                    <div className="absolute right-6 top-6">
                      <Badge className="bg-white/20 text-white font-subheading uppercase tracking-[0.1em]">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-6 text-xl text-white">{template.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed text-white/80">
                      {template.description}
                    </CardDescription>
                    <CardFooter className="mt-auto px-0 pt-6">
                      <Button
                        variant="outline"
                        className="w-full border-white/40 text-white hover:bg-white/10 hover:text-white"
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

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src="/graphics/mountain-bg-overlayed.jpg"
            alt="CTA backdrop"
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--oxford-blue))]/80 via-[hsl(var(--eerie-black))]/65 to-[hsl(var(--oxford-blue))]/70" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center text-white lg:px-8">
          <h2 className="text-3xl font-heading font-bold tracking-tight sm:text-4xl">
            Need a different document?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            We&apos;re expanding the library with the requests we receive most. Tell us what helps your team move faster and we&apos;ll add it to the roadmap.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-auto px-8 py-3 bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              <Link href="mailto:hello@selise.ch?subject=Template%20request">
                Send a Request
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto px-8 py-3 border-2 border-white text-white hover:bg-white/10"
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
