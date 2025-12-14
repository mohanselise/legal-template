import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations, getMessages } from 'next-intl/server';

import { getUpcomingTemplates, searchAvailableTemplates } from "@/lib/templates-db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle
} from "@/components/ui/card";
import { TemplateSearchGrid } from "@/app/templates/_components/template-search-grid";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('templates');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

const PAGE_SIZE = 12;

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const t = await getTranslations('templates');
  const messages = await getMessages();
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams?.q ?? "").trim();
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);

  const [{ templates: availableTemplates, total: totalAvailable }, upcomingTemplates] = await Promise.all([
    searchAvailableTemplates({ query, page: currentPage, pageSize: PAGE_SIZE }),
    getUpcomingTemplates(),
  ]);

  const getTemplateText = (
    template: typeof availableTemplates[0] | typeof upcomingTemplates[0],
    field: 'title' | 'description'
  ) => {
    const slug = template.slug;
    const fallback = field === 'title' ? template.title : template.description;

    // 1. Check for UILM key
    const uilmKey = field === 'title'
      ? (template as any).uilmTitleKey
      : (template as any).uilmDescriptionKey;

    if (uilmKey) {
      const templatesModule = (messages as any)?.templates;
      if (templatesModule) {
        if (templatesModule[uilmKey]) return templatesModule[uilmKey];
        const camelKey = uilmKey.toLowerCase().replace(/_([a-z0-9])/g, (g: string) => g[1].toUpperCase());
        if (templatesModule[camelKey]) return templatesModule[camelKey];
        const lowerKey = uilmKey.toLowerCase();
        if (templatesModule[lowerKey]) return templatesModule[lowerKey];
        const templatesList = templatesModule.templatesList;
        if (templatesList) {
          const slugData = templatesList[slug];
          if (slugData && slugData[field]) return slugData[field];
        }
      }
    }

    // 2. Check for static translation key
    const templatesMessages = (messages as any)?.templates?.templatesList?.[slug];
    if (templatesMessages?.[field]) {
      return t(`templatesList.${slug}.${field}`);
    }

    // 3. Fallback to database value
    return fallback;
  };

  const availableTemplateCards = availableTemplates.map((template) => ({
    id: template.id,
    title: getTemplateText(template, 'title'),
    description: getTemplateText(template, 'description'),
    href: template.href,
    popular: template.popular,
    iconName:
      template.iconName ||
      (template.icon as any)?.displayName ||
      (template.icon as any)?.name ||
      "FileText",
  }));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Hero Section */}
      <section className="relative min-h-[60vh] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/whole-page-bg.webp"
            alt="Background"
            fill
            className="object-cover brightness-[0.4] -scale-x-100"
            priority
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 lg:px-8 py-20 text-center">
          <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm mb-8 px-4 py-2 text-sm font-subheading uppercase tracking-[0.14em]">
            {t('templateLibrary')}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-heading leading-tight max-w-4xl">
            {t('title')}
          </h1>

          <p className="mt-6 text-xl leading-relaxed text-white/90 max-w-2xl mx-auto">
            {t('description')}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[hsl(var(--selise-blue))] text-white hover:bg-[hsl(var(--oxford-blue))] px-8 h-12 text-base font-semibold border-0">
              <Link href="#library">{t('browseAvailableTemplates')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm px-8 h-12 text-base font-semibold">
              <Link href="#upcoming">{t('templatesSection.requestTemplate')}</Link>
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-white/10 pt-10 w-full max-w-4xl">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">{totalAvailable}</span>
              <span className="text-sm text-white/70 uppercase tracking-widest mt-1">{t('live')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">{upcomingTemplates.length}</span>
              <span className="text-sm text-white/70 uppercase tracking-widest mt-1">{t('inProgress')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">3m</span>
              <span className="text-sm text-white/70 uppercase tracking-widest mt-1">Avg. Time</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">0$</span>
              <span className="text-sm text-white/70 uppercase tracking-widest mt-1">{t('alwaysFree')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Library Section - Light Background */}
      <section id="library" className="py-24 bg-muted/30">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('readyToGenerate')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('availableDescription')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-16 grid gap-8 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t('legallyVetted'), body: "Compliant with Swiss laws and regulations." },
              { icon: Sparkles, title: t('readyInMinutes'), body: "Answer a few questions and get your document instantly." },
              { icon: CheckCircle2, title: t('fullyCustomizable'), body: "Tailor every clause to your specific needs." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <TemplateSearchGrid
              templates={availableTemplateCards}
              ctaLabel={t('templatesSection.generateNow')}
              liveBadgeLabel={t('live')}
              popularBadgeLabel={t('mostPopular')}
              searchPlaceholder={t('searchPlaceholder')}
              noResultsText={t('searchNoResults')}
              resultsLabelText={t('searchResultsLabel', { visible: availableTemplates.length, total: totalAvailable })}
              clearLabel={t('searchClear')}
              clearSearchLabel={t('searchClearAria')}
              useLocalizedLink
              mode="server"
              initialQuery={query}
              currentPage={currentPage}
              totalResults={totalAvailable}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>
      </section>

      {/* Upcoming Templates Section - Dark with Graphic */}
      {upcomingTemplates.length > 0 ? (
        <section
          id="upcoming"
          className="relative overflow-hidden py-32"
        >
          {/* Enhanced Background with Vignette and Gradient */}
          <div className="absolute inset-0 bg-[hsl(var(--oxford-blue))]">
            <Image
              src="/graphics/2nd-bg.webp"
              alt={t('upcomingTemplates')}
              fill
              className="object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--oxford-blue))] via-transparent to-[hsl(var(--oxford-blue))]/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[hsl(var(--selise-blue))]/20 via-transparent to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-4xl font-heading font-bold tracking-tight text-[hsl(var(--white))] mb-6 sm:text-5xl text-shadow-lg">
                {t('upcomingTemplates')}
              </h2>
              <p className="text-xl leading-relaxed text-[hsl(var(--white))]/90">
                {t('upcomingDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-[hsl(var(--white))] shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                  >
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--selise-blue))]/20 blur-3xl transition-all group-hover:bg-[hsl(var(--selise-blue))]/30" />

                    <div className="relative mb-6 flex items-start justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-8 w-8 text-[hsl(var(--white))] icon-glow" />
                      </div>
                    </div>

                    <CardTitle className="text-2xl text-[hsl(var(--white))] font-heading mb-3 group-hover:text-[hsl(var(--light-blue))] transition-colors">
                      {getTemplateText(template, 'title')}
                    </CardTitle>

                    <CardDescription className="text-base leading-relaxed text-[hsl(var(--white))]/70 mb-8 line-clamp-3">
                      {getTemplateText(template, 'description')}
                    </CardDescription>

                    <CardFooter className="mt-auto p-0">
                      <Button
                        className="w-full bg-[hsl(var(--white))] text-[hsl(var(--oxford-blue))] hover:bg-[hsl(var(--light-blue))] hover:text-[hsl(var(--white))] font-semibold transition-all shadow-lg"
                        size="lg"
                        asChild
                      >
                        <Link href="mailto:hello@selise.ch?subject=Template%20request">
                          {t('requestEarlyAccess')}
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

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/graphics/mountain-bg-overlayed.jpg"
            alt={t('needDifferentDocument')}
            fill
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center text-white text-on-media">
          <h2 className="text-3xl font-heading font-bold tracking-tight sm:text-5xl mb-6 text-shadow-sm text-on-media">
            {t('needDifferentDocument')}
          </h2>
          <p className="text-xl leading-relaxed text-white/90 max-w-2xl mx-auto mb-10 text-on-media">
            {t('needDifferentDescription')}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-[hsl(var(--selise-blue))] text-white hover:bg-white hover:text-[hsl(var(--selise-blue))] transition-colors border-2 border-transparent hover:border-white text-on-media hover:text-foreground"
            >
              <Link href="mailto:hello@selise.ch?subject=Template%20request">
                {t('sendRequest')}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-semibold border-2 border-white text-white bg-transparent hover:bg-white/10 text-on-media"
            >
              <Link href="/templates/employment-agreement/generate">
                {t('exploreGenerator')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
