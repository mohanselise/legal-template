import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Download,
  Target,
  UserCheck
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations, getMessages } from 'next-intl/server';
import Image from "next/image";
import { getAllTemplates } from "@/lib/templates-db";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    stroke="currentColor"
    strokeWidth="1.935"
    strokeLinejoin="round"
  >
    <path d="M22.0648 10.721V11.613C22.0631 13.6991 21.387 15.7289 20.1375 17.3995C18.888 19.0701 17.132 20.292 15.1313 20.8832C13.1306 21.4743 10.9924 21.4029 9.03563 20.6797C7.07882 19.9564 5.40822 18.62 4.27292 16.8698C3.13763 15.1196 2.59847 13.0492 2.73585 10.9676C2.87323 8.88593 3.67978 6.90443 5.03523 5.31858C6.39069 3.73273 8.22243 2.62748 10.2573 2.16764C12.2922 1.70781 14.4212 1.91803 16.3268 2.76695" />
    <path d="M22.0653 3.87L12.3893 13.557L9.48633 10.654" />
  </svg>
);

export default async function Home() {
  const t = await getTranslations('home');
  const tTemplates = await getTranslations('templates');
  const messages = await getMessages();

  // Fetch templates from database
  const templates = await getAllTemplates();

  // Helper to safely get template translation with fallback to database value
  const getTemplateText = (
    template: typeof templates[0],
    field: 'title' | 'description'
  ) => {
    const slug = template.slug;
    const fallback = field === 'title' ? template.title : template.description;

    // 1. Check for UILM key (for dynamically created templates)
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

    // 2. Check for static translation key (for pre-defined templates)
    const templatesMessages = (messages as any)?.templates?.templatesList?.[slug];
    if (templatesMessages?.[field]) {
      return tTemplates(`templatesList.${slug}.${field}`);
    }

    // 3. Fallback to database value
    return fallback;
  };

  const whyUseUsPoints = [
    {
      title: t('whyUseUs.points.verified.title'),
      description: t('whyUseUs.points.verified.description'),
      icon: UserCheck
    },
    {
      title: t('whyUseUs.points.precision.title'),
      description: t('whyUseUs.points.precision.description'),
      icon: Target
    },
    {
      title: t('whyUseUs.points.simplicity.title'),
      description: t('whyUseUs.points.simplicity.description'),
      icon: Sparkles
    }
  ];

  const workflowFeatures = [
    {
      title: "No fees",
      description: "No platform fees—draft, send, and sign without extra charges."
    },
    {
      title: t('integratedWorkflow.features.noBarriers.title'),
      description: t('integratedWorkflow.features.noBarriers.description')
    },
    {
      title: t('integratedWorkflow.features.fastSecure.title'),
      description: t('integratedWorkflow.features.fastSecure.description')
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center">
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

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl font-heading leading-tight">
              {t('title')}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-white/90 max-w-2xl">
              {t('subtitle')}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm px-8 h-12 text-base font-semibold">
                <Link href="/templates">{t('cta.secondary')}</Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Why Use Us (Trifecta) Section */}
      <section className="py-24 bg-white dark:bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading mb-4">
              {t('whyUseUs.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('whyUseUs.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {whyUseUsPoints.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 font-heading">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Human in the Loop Section - Carded layout */}
      <section className="py-24 bg-white dark:bg-background text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl border border-border bg-black text-white">
              <div className="relative min-h-[400px] md:aspect-video">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  <source src="/videos/human-ai.webm" type="video/webm" />
                </video>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex h-full min-h-[400px] items-center justify-center px-6 py-12 md:px-8 md:py-0 text-center">
                  <div className="max-w-3xl w-full">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl font-heading mb-6 text-on-media">
                      {t('humanInTheLoop.title')}
                    </h2>
                    <p className="text-lg sm:text-xl leading-relaxed text-white max-w-2xl mx-auto mb-8 md:mb-10 text-on-media">
                      <span className="hidden md:inline">{t('humanInTheLoop.description')}</span>
                      <span className="md:hidden">transparency, trust, and user control at the core.</span>
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="border border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12"
                    >
                      <Link href="#templates">{t('humanInTheLoop.cta')}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Templates Section */}
      <section id="templates" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('popularTemplates.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('popularTemplates.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.filter(t => t.popular).slice(0, 3).map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="group flex h-full flex-col border border-[hsl(var(--border))] bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] ring-1 ring-[hsl(var(--selise-blue))]/15">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="font-heading text-xl leading-snug">{getTemplateText(template, 'title')}</CardTitle>
                      <CardDescription className="text-base leading-relaxed text-muted-foreground line-clamp-3">
                        {getTemplateText(template, 'description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="mt-auto pt-0">
                    <Button
                      asChild
                      className="w-full justify-between bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-foreground))] hover:bg-[hsl(var(--button-primary-hover))] hover:text-[hsl(var(--button-primary-foreground))] focus-visible:ring-[hsl(var(--button-primary))] focus-visible:ring-opacity-40 focus-visible:ring-offset-2"
                    >
                      <Link href={template.href}>
                        <span>{tTemplates('templatesSection.generateNow')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Button asChild variant="outline" size="lg" className="border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))] hover:text-white font-semibold px-10 h-14 text-lg transition-colors">
              <Link href="/templates">
                {t('finalCta.viewAllTemplates')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Integrated Workflow Section (SELISE Signature) */}
      <section className="py-24 bg-[hsl(var(--oxford-blue))] text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-heading mb-6 text-on-media">
                {t('integratedWorkflow.title')}
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed text-on-media">
                {t('integratedWorkflow.description')}
              </p>

              <div className="space-y-8 text-white">
                {workflowFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/20 text-[hsl(var(--selise-blue))]">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                    <div className="text-white text-on-media">
                      <h3 className="text-lg font-bold text-white mb-2 font-heading text-on-media">{feature.title}</h3>
                      <p className="text-white/80 text-on-media">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))]/20 to-[hsl(var(--oxford-blue))] border border-white/10">
                <Image
                  src="/graphics/image-2.webp"
                  alt="Integrated workflow illustration"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 480px, 100vw"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('howItWorks.description')}
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connecting line for large screens */}
            <div className="absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--selise-blue))]/20 to-transparent hidden md:block" />

            {[
              {
                step: "1",
                title: t('howItWorks.step1.title'),
                description: t('howItWorks.step1.description'),
                icon: FileText
              },
              {
                step: "2",
                title: t('howItWorks.step2.title'),
                description: t('howItWorks.step2.description'),
                icon: CheckCircle2
              },
              {
                step: "3",
                title: t('howItWorks.step3.title'),
                description: t('howItWorks.step3.description'),
                icon: Download
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white border-4 border-[hsl(var(--background))] shadow-xl mb-8">
                    <div className="absolute inset-0 bg-[hsl(var(--selise-blue))]/5 rounded-full" />
                    <Icon className="h-10 w-10 text-[hsl(var(--selise-blue))]" />
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[hsl(var(--selise-blue))] text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4 font-heading">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 min-h-[500px]">
          <Image
            src="/graphics/mountain-bg-overlayed.jpg"
            alt="SELISE Signature background"
            fill
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center text-white text-on-media">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-heading">
              POWERED BY SELISE SIGNATURE
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Legally Binding",
                body: "We adhere to strict global e-signature standards (eIDAS & ESIGN), ensuring your contracts hold up in the real world.",
              },
              {
                title: "Zero Barriers",
                body: "No accounts. No logins. No friction. We designed the signing process to be instant for you and your recipients.",
              },
              {
                title: "Bank-Grade Protection",
                body: "Your data is protected by advanced encryption and secure audit trails, keeping your sensitive information safe.",
              }
            ].map((item, index) => (
              <div
                key={index}
                className="p-0 text-white text-on-media"
              >
                <h3 className="text-xl font-semibold font-heading mb-2">{item.title}</h3>
                <p className="text-white/85">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
