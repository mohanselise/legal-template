import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations, getMessages } from 'next-intl/server';

import { getAvailableTemplates, getUpcomingTemplates } from "@/lib/templates-db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

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

export default async function TemplatesPage() {
  const t = await getTranslations('templates');
  const tTemplates = await getTranslations('templates');
  const messages = await getMessages();
  
  // Fetch templates from database
  const availableTemplates = await getAvailableTemplates();
  const upcomingTemplates = await getUpcomingTemplates();

  // Helper to safely get template translation with fallback to database value
  // Priority: 1. UILM key (if configured), 2. Static translation key, 3. Database value
  const getTemplateText = (
    template: typeof availableTemplates[0] | typeof upcomingTemplates[0],
    field: 'title' | 'description'
  ) => {
    const slug = template.slug;
    const fallback = field === 'title' ? template.title : template.description;
    
    // 1. Check for UILM key (for dynamically created templates)
    const uilmKey = field === 'title' 
      ? (template as any).uilmTitleKey 
      : (template as any).uilmDescriptionKey;
    
    if (uilmKey) {
      // UILM keys are stored in templates module - try to find them
      // The UILM loader converts SNAKE_CASE to camelCase, so we need to check both
      const templatesModule = (messages as any)?.templates;
      if (templatesModule) {
        // Try 1: Direct key lookup (original format - UILM loader also stores original)
        if (templatesModule[uilmKey]) {
          return templatesModule[uilmKey];
        }
        
        // Try 2: camelCase version (UILM loader converts STUDENT_AGREEMENT_TITLE -> studentAgreementTitle)
        const camelKey = uilmKey.toLowerCase().replace(/_([a-z0-9])/g, (g: string) => g[1].toUpperCase());
        if (templatesModule[camelKey]) {
          return templatesModule[camelKey];
        }
        
        // Try 3: Lowercase with underscores (some variations)
        const lowerKey = uilmKey.toLowerCase();
        if (templatesModule[lowerKey]) {
          return templatesModule[lowerKey];
        }
        
        // Try 4: Check if key exists in nested structure (templatesList)
        const templatesList = templatesModule.templatesList;
        if (templatesList) {
          // Check if there's a nested structure for this slug
          const slugData = templatesList[slug];
          if (slugData && slugData[field]) {
            return slugData[field];
          }
        }
        
      }
    }
    
    // 2. Check for static translation key (for pre-defined templates)
    const templatesMessages = (messages as any)?.templates?.templatesList?.[slug];
    if (templatesMessages?.[field]) {
      return tTemplates(`templatesList.${slug}.${field}`);
    }
    
    // 3. Fallback to database value
    return fallback;
  };
  
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[hsl(var(--bg))] via-[hsl(var(--gradient-light-to))]/60 to-[hsl(var(--bg))]">
        <div className="absolute inset-0 bg-[hsl(var(--selise-blue))]/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:px-8">
          <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
            {t('templateLibrary')}
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {t('description')}
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            {availableTemplates[0] ? (
              <Button
                asChild
                size="lg"
                className="group bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] shadow-lg shadow-[hsl(var(--selise-blue))]/30 h-auto px-8 py-6 text-base"
              >
                <Link href={availableTemplates[0].href}>
                  {t('templatesSection.generateNow')} {getTemplateText(availableTemplates[0], 'title')}
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
                {t('templatesSection.requestTemplate')}
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
                {t('availableNow')}
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('readyToGenerate')}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {t('availableDescription')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-[hsl(var(--card))]/80 px-6 py-5 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/70">
              {t('currentlyLive', { 
                count: availableTemplates.length,
                plural: availableTemplates.length === 1 ? '' : 's'
              })}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {availableTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="group flex h-full flex-col justify-between border-2 border-[hsl(var(--selise-blue))]/20 transition-all hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))]"
                >
                  <CardHeader>
                    <Badge className="w-fit bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
                      {template.popular ? t('mostPopular') : t('live')}
                    </Badge>
                    <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                      <Icon className="h-7 w-7 text-[hsl(var(--white))]" />
                    </div>
                    <CardTitle className="mt-6 text-2xl">{getTemplateText(template, 'title')}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {getTemplateText(template, 'description')}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button
                      asChild
                      className="group w-full bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] shadow-md"
                    >
                      <Link href={template.href}>
                        {t('templatesSection.generateNow')}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {upcomingTemplates.length > 0 ? (
        <section id="upcoming" className="bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--bg))] py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('inProgress')}
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t('upcomingTemplates')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {t('upcomingDescription')}
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
                        {t('templatesSection.comingSoon')}
                      </Badge>
                    </div>
                    <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-6 text-xl">{getTemplateText(template, 'title')}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {getTemplateText(template, 'description')}
                    </CardDescription>
                    <CardFooter className="mt-auto px-0 pt-6">
                      <Button
                        variant="outline"
                        className="w-full border-[hsl(var(--selise-blue))]/40 text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
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

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('needDifferentDocument')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t('needDifferentDescription')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              <Link href="mailto:hello@selise.ch?subject=Template%20request">
                {t('sendRequest')}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
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
