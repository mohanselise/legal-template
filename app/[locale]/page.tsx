import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Download,
  Star,
  Globe,
  FileCheck,
  PenTool,
  Wrench,
  LifeBuoy,
  Handshake,
  ShieldCheck,
  Feather,
  Target,
  Mountain,
  Rocket
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations, getMessages } from 'next-intl/server';
import Image from "next/image";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { getAllTemplates } from "@/lib/templates-db";

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

  const trifecta = [
    {
      title: t('trifecta.compliance.title'),
      description: t('trifecta.compliance.description'),
      icon: ShieldCheck,
      link: t('trifecta.compliance.link')
    },
    {
      title: t('trifecta.efficiency.title'),
      description: t('trifecta.efficiency.description'),
      icon: Zap,
      link: t('trifecta.efficiency.link')
    },
    {
      title: t('trifecta.security.title'),
      description: t('trifecta.security.description'),
      icon: Shield,
      link: t('trifecta.security.link')
    }
  ];

  const services = [
    {
      title: t('services.employment.title'),
      description: t('services.employment.description'),
      icon: Handshake
    },
    {
      title: t('services.corporate.title'),
      description: t('services.corporate.description'),
      icon: Target
    },
    {
      title: t('services.intellectualProperty.title'),
      description: t('services.intellectualProperty.description'),
      icon: FileCheck
    }
  ];

  const products = [
    {
      title: t('productSuite.generator.title'),
      description: t('productSuite.generator.description'),
      icon: FileText
    },
    {
      title: t('productSuite.esignature.title'),
      description: t('productSuite.esignature.description'),
      icon: PenTool
    },
    {
      title: t('productSuite.management.title'),
      description: t('productSuite.management.description'),
      icon: Wrench
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/graphics/whole-page-bg.webp"
            alt="Background"
            fill
            className="object-cover object-center brightness-[0.4] scale-x-[-1]"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl font-heading">
              {t('title')}
            </h1>
            <p className="mt-6 text-xl leading-8 text-white/90">
              {t('subtitle')}
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Button asChild size="lg" className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-900/20">
                <Link href="#templates">{t('startGeneratingFree')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm px-8 h-12 text-base font-semibold">
                <Link href="#how-it-works">{t('seeHowItWorks')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trifecta Section */}
      <section className="py-24 bg-white dark:bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('trifecta.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('trifecta.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {trifecta.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col p-8 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 font-heading">{item.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">{item.description}</p>
                  <div className="flex items-center text-[hsl(var(--selise-blue))] font-semibold cursor-pointer group">
                    <span className="group-hover:underline">{item.link}</span> <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Templates Section */}
      <section id="templates" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/20 border-none px-4 py-1.5 text-sm font-medium">
              {t('popularTemplates.badge')}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('popularTemplates.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('popularTemplates.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {templates.filter(t => t.popular).slice(0, 3).map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-card">
                  <div className="h-48 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--oxford-blue))] p-6 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 opacity-10 bg-[url('/graphics/bg-black-texture.webp')] bg-cover mix-blend-overlay" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                    <Icon className="h-16 w-16 text-white relative z-10 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <CardHeader className="pt-6">
                    <CardTitle className="font-heading text-xl">{getTemplateText(template, 'title')}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 text-base">{getTemplateText(template, 'description')}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pb-6">
                    <Button asChild className="w-full bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] font-medium h-11">
                      <Link href={template.href}>
                        {t('templatesSection.generateNow')} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Button asChild variant="outline" size="lg" className="border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))] hover:text-white font-semibold px-10 h-14 text-lg transition-colors">
              <Link href="#all-templates">
                {t('finalCta.viewAllTemplates')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white dark:bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
              {t('services.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground font-heading">{service.title}</h3>
                    <p className="mt-2 text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Suite Section */}
      <section className="relative py-24 text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/graphics/mountain-bg-overlayed.jpg"
            alt="Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[hsl(var(--oxford-blue))]/90 mix-blend-multiply" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white hover:bg-white/20 border-none">
              {t('productSuite.badge')}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-heading">
              {t('productSuite.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <Icon className="h-10 w-10 text-[hsl(var(--sky-blue))] mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3 font-heading">{product.title}</h3>
                  <p className="text-gray-300">{product.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 bg-white dark:bg-background overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading">
            {t('finalCta.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('finalCta.description')}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild size="lg" className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]">
              <Link href="#templates">{t('finalCta.getStartedFree')}</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {t('finalCta.generateFirstDocument')}
          </p>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <LegalDisclaimer />
        </div>
      </section>
    </div>
  );
}
