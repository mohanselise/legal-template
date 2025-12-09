import { notFound } from 'next/navigation';
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, ArrowRight, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getTemplateBySlug,
  getAllTemplates,
  getTemplatePageBySlugAndLocale,
  getAllTemplatePageSlugs,
  type TemplatePageWithBlocks,
} from "@/lib/templates-db";
import { parseTemplatePageBlocks } from "@/lib/template-page-blocks";
import { TemplatePageRenderer } from "./_components/template-page-renderer";

export const dynamic = "force-dynamic";

/**
 * Generate static params for all template slugs (both Template and TemplatePage)
 */
export async function generateStaticParams() {
  const [templates, templatePages] = await Promise.all([
    getAllTemplates(),
    getAllTemplatePageSlugs(),
  ]);
  
  // Combine both sources, with template pages taking precedence
  const slugsFromTemplates = templates.map((t) => ({ slug: t.slug }));
  const slugsFromPages = templatePages.map((p) => ({ slug: p.slug }));
  
  // Use a Set to deduplicate
  const uniqueSlugs = new Set<string>();
  const result: { slug: string }[] = [];
  
  for (const item of [...slugsFromPages, ...slugsFromTemplates]) {
    if (!uniqueSlugs.has(item.slug)) {
      uniqueSlugs.add(item.slug);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Generate metadata for each template page
 * Checks for TemplatePage first (custom landing page), then falls back to Template
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params;
  
  // Check for custom landing page first
  const templatePage = await getTemplatePageBySlugAndLocale(slug, locale);
  
  if (templatePage) {
    return {
      title: templatePage.title,
      description: templatePage.description,
      keywords: templatePage.keywords,
      openGraph: {
        title: templatePage.ogTitle || templatePage.title,
        description: templatePage.ogDescription || templatePage.description,
        type: 'website',
        ...(templatePage.ogImage && { images: [templatePage.ogImage] }),
      },
    };
  }
  
  // Fall back to Template model
  const template = await getTemplateBySlug(slug);

  if (!template) {
    return {
      title: 'Template Not Found',
    };
  }

  return {
    title: `${template.title} | Free Legal Contract Generator`,
    description: template.description,
    openGraph: {
      title: `${template.title} | Free Legal Contract Generator`,
      description: template.description,
      type: 'website',
    },
  };
}

/**
 * Dynamic Template Landing Page
 * 
 * This page serves as a landing page for any template.
 * Priority:
 * 1. Check for a published TemplatePage (custom HTML landing page)
 * 2. Fall back to Template model (default landing page)
 */
export default async function TemplateLandingPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params;
  const t = await getTranslations('templates');

  // Check for custom landing page first
  const templatePage = await getTemplatePageBySlugAndLocale(slug, locale);

  console.log("[TemplateLanding] slug", slug, "locale", locale, "templatePage?", !!templatePage);

  if (templatePage) {
    let blocks = parseTemplatePageBlocks((templatePage as TemplatePageWithBlocks).blocks);

    // Compatibility: allow JSON stored in htmlBody while the admin UI catches up
    if (!blocks.length && templatePage.htmlBody) {
      try {
        const parsed = JSON.parse(templatePage.htmlBody);
        blocks = parseTemplatePageBlocks(parsed);
        console.log("[TemplateLanding] parsed from htmlBody. rawArray?", Array.isArray(parsed), "blockCount", blocks.length);
      } catch (err) {
        console.warn("[TemplateLanding] failed to parse htmlBody JSON", err);
      }
    }

    console.log("[TemplateLanding] blocks count", blocks.length);

    if (blocks.length) {
      return <TemplatePageRenderer blocks={blocks} />;
    }
  }

  // Fall back to Template model
  const template = await getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  const Icon = template.icon;

  // If template is not yet available, show coming soon page
  if (!template.available) {
    return (
      <div className="bg-[hsl(var(--bg))] text-foreground min-h-screen">
        <section className="relative bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-[hsl(var(--white))] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/graphics/bg-black-texture.webp"
              alt=""
              fill
              className="object-cover opacity-[0.08] mix-blend-overlay"
              priority
            />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 py-24 sm:py-32 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--white))]/15 backdrop-blur-sm">
                <Icon className="h-10 w-10 text-[hsl(var(--white))]" />
              </div>
            </div>

            <Badge className="mb-6 bg-[hsl(var(--white))]/15 text-[hsl(var(--white))] border-[hsl(var(--white))]/30 backdrop-blur-sm font-subheading uppercase tracking-[0.12em]">
              {t('templatesSection.comingSoon')}
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
              {template.title}
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed max-w-2xl mx-auto mb-10">
              {template.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90 shadow-2xl h-auto px-8 py-4 text-lg">
                <Link href="mailto:hello@selise.ch?subject=Template%20request">
                  {t('requestEarlyAccess')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-[hsl(var(--white))]/70 text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 h-auto px-8 py-4 text-lg">
                <Link href="/templates">
                  {t('browseAvailableTemplates')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Available template - show full landing page
  return (
    <div className="bg-[hsl(var(--bg))] text-foreground">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-[hsl(var(--white))] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
            priority
          />
        </div>

        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[hsl(var(--light-blue))]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {template.popular && (
                <Badge className="bg-[hsl(var(--white))]/15 text-[hsl(var(--white))] border-[hsl(var(--white))]/30 backdrop-blur-sm font-subheading uppercase tracking-[0.12em]" variant="outline">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {t('mostPopular')}
                </Badge>
              )}
              <Badge className="bg-[hsl(var(--lime-green))]/20 text-[hsl(var(--white))] border-[hsl(var(--lime-green))]/40 font-subheading uppercase tracking-[0.12em]" variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('alwaysFree')}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
              {t('createInMinutes', { template: template.title })}
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed mb-10">
              {template.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90 shadow-2xl h-auto px-8 py-4 text-lg">
                <Link href={template.href}>
                  {t('generateYourAgreementNow')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">{t('legallyVetted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">{t('readyInMinutes')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">{t('fullyCustomizable')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-heading">
            {t('readyToGetStarted')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('generateYourTemplateNow', { template: template.title.toLowerCase() })}
          </p>
          <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] shadow-2xl h-auto px-10 py-5 text-lg">
            <Link href={template.href}>
              <Sparkles className="mr-2 h-5 w-5" />
              {t('startGenerating')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

