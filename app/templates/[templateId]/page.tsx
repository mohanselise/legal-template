import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { CheckCircle2, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTemplateById, getTemplateIds, isValidTemplate } from '@/data/templates';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

/**
 * Generate static params for all template IDs
 * Note: With dynamic = 'force-dynamic', this won't be used, but kept for compatibility
 */
export function generateStaticParams() {
  return getTemplateIds().map((templateId) => ({
    templateId,
  }));
}

/**
 * Generate metadata for each template page
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ templateId: string }>
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplateById(templateId);

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
 * It shows template information and links to the generate page.
 */
export default async function TemplateLandingPage({
  params
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params;

  // Validate template exists
  if (!isValidTemplate(templateId)) {
    notFound();
  }

  const template = getTemplateById(templateId);

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
              Coming Soon
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
              {template.title}
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed max-w-2xl mx-auto mb-10">
              {template.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:hello@selise.ch?subject=Template%20request"
                className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-8 py-4 text-lg font-semibold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all"
              >
                Request Early Access
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[hsl(var(--white))]/70 px-8 py-4 text-lg font-semibold text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 hover:border-[hsl(var(--white))] transition-all backdrop-blur-sm"
              >
                Browse Available Templates
              </Link>
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
                  Most Popular
                </Badge>
              )}
              <Badge className="bg-[hsl(var(--lime-green))]/20 text-[hsl(var(--white))] border-[hsl(var(--lime-green))]/40 font-subheading uppercase tracking-[0.12em]" variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Always Free
              </Badge>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
              Create {template.title}s in Minutes
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed mb-10">
              {template.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={template.href}
                className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-8 py-4 text-lg font-semibold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all transform hover:scale-105"
              >
                Generate Your Agreement Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">Legally vetted templates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">Ready in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                </div>
                <span className="text-[hsl(var(--white))]/80">Fully customizable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Generate your {template.title.toLowerCase()} now. No credit card required.
          </p>
          <Link
            href={template.href}
            className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))] px-10 py-5 text-lg font-semibold text-[hsl(var(--white))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--gradient-dark-from))] transition-all transform hover:scale-105"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Start Generating
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}

