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
import { getTranslations } from 'next-intl/server';
import Image from "next/image";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { templates } from "@/data/templates";

export default async function Home() {
  const t = await getTranslations('home');
  const tTemplates = await getTranslations('templates');
  
  const features = [
    {
      icon: Clock,
      title: t('features.generateInMinutes.title'),
      description: t('features.generateInMinutes.description'),
      highlight: t('features.generateInMinutes.highlight')
    },
    {
      icon: Shield,
      title: t('features.legallySound.title'),
      description: t('features.legallySound.description'),
      highlight: t('features.legallySound.highlight')
    },
    {
      icon: CheckCircle2,
      title: t('features.plainEnglish.title'),
      description: t('features.plainEnglish.description'),
      highlight: t('features.plainEnglish.highlight')
    },
    {
      icon: Zap,
      title: t('features.free.title'),
      description: t('features.free.description'),
      highlight: t('features.free.highlight')
    }
  ];

  const stats = [
    { value: t('stats.legalTemplates'), label: t('stats.legalTemplatesLabel'), icon: FileCheck },
    { value: t('stats.freeForever'), label: t('stats.freeForeverLabel'), icon: Zap },
    { value: t('stats.avgGeneration'), label: t('stats.avgGenerationLabel'), icon: Clock },
    { value: t('stats.available'), label: t('stats.availableLabel'), icon: Globe }
  ];

  const benefits = [
    t('benefits.noSignup'),
    t('benefits.instantPdf'),
    t('benefits.customizable'),
    t('benefits.plainEnglish'),
    t('benefits.noHiddenFees'),
    t('benefits.professionalQuality')
  ];

  const approach = [
    {
      title: t('seliseDio.design.title'),
      description: t('seliseDio.design.description'),
      icon: PenTool,
      badge: t('seliseDio.design.badge')
    },
    {
      title: t('seliseDio.implement.title'),
      description: t('seliseDio.implement.description'),
      icon: Wrench,
      badge: t('seliseDio.implement.badge')
    },
    {
      title: t('seliseDio.operate.title'),
      description: t('seliseDio.operate.description'),
      icon: LifeBuoy,
      badge: t('seliseDio.operate.badge')
    }
  ];

  const brandValues = [
    {
      title: t('brandValues.respectful.title'),
      description: t('brandValues.respectful.description'),
      icon: Handshake
    },
    {
      title: t('brandValues.integrous.title'),
      description: t('brandValues.integrous.description'),
      icon: ShieldCheck
    },
    {
      title: t('brandValues.humble.title'),
      description: t('brandValues.humble.description'),
      icon: Feather
    },
    {
      title: t('brandValues.pragmatic.title'),
      description: t('brandValues.pragmatic.description'),
      icon: Target
    },
    {
      title: t('brandValues.persevering.title'),
      description: t('brandValues.persevering.description'),
      icon: Mountain
    },
    {
      title: t('brandValues.empowering.title'),
      description: t('brandValues.empowering.description'),
      icon: Rocket
    }
  ];
  
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Announcement Bar */}
      <div className="bg-[hsl(var(--selise-blue))] px-4 py-3 text-center text-sm text-[hsl(var(--white))]">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{t('announcement')}</span>
          <Link href="#templates" className="underline underline-offset-4 hover:opacity-90">
            {t('tryItNow')}
          </Link>
        </div>
      </div>

      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background texture layer */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.03] dark:opacity-[0.08]"
            priority
          />
        </div>

        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--bg))]/80 via-[hsl(var(--gradient-light-to))]/70 to-[hsl(var(--bg))]/75 dark:from-[hsl(var(--selise-blue))]/20 dark:via-[hsl(var(--oxford-blue))]/20 dark:to-transparent" />

        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/20" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[hsl(var(--sky-blue))]/10 blur-3xl dark:bg-[hsl(var(--selise-blue))]/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust badge */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <Badge className="bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/20 dark:text-[hsl(var(--lime-green))] border-[hsl(var(--lime-green))]/30 font-subheading uppercase tracking-[0.12em]" variant="outline">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {t('trustedByThousands')}
              </Badge>
              <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]" variant="secondary">
                {t('freeForever')}
              </Badge>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl bg-clip-text font-heading">
              {t('title')}
            </h1>

            <p className="mt-8 text-xl leading-8 text-muted-foreground">
              {t('subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] shadow-lg shadow-[hsl(var(--selise-blue))]/30 text-base px-8 py-6 h-auto font-subheading">
                <Link href="#templates">
                  {t('startGeneratingFree')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 h-auto border-2 border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10 font-subheading">
                <Link href="#how-it-works">
                  {t('seeHowItWorks')}
                </Link>
              </Button>
            </div>

            {/* Quick benefits */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <span>{t('noCreditCardNeeded')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <span>{t('noSignUpRequired')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <span>{t('instantDownload')}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="group rounded-2xl border border-border bg-[hsl(var(--card))]/70 p-6 text-center backdrop-blur-sm transition-all hover:border-[hsl(var(--sky-blue))] hover:shadow-lg dark:bg-[hsl(var(--background))]/40 dark:hover:border-[hsl(var(--sky-blue))]">
                    <Icon className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--selise-blue))] dark:text-[hsl(var(--sky-blue))]" />
                    <div className="text-4xl font-bold text-foreground">{stat.value}</div>
                    <div className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section - Enhanced */}
      <section id="templates" className="py-24 sm:py-32 bg-[hsl(var(--bg))] dark:bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]">
              {t('templatesSection.badge')}
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-heading">
              {t('templatesSection.title')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              {t('templatesSection.description')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className={`group relative transition-all hover:shadow-2xl ${
                    template.available
                      ? 'border-2 hover:border-[hsl(var(--sky-blue))] hover:-translate-y-1 dark:hover:border-[hsl(var(--sky-blue))]'
                      : 'opacity-60'
                  }`}
                >
                  {template.popular && template.available && (
                    <div className="absolute -right-2 -top-2">
                      <Badge className="bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-[hsl(var(--white))] shadow-lg font-subheading uppercase tracking-[0.12em]">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        {t('templatesSection.mostPopular')}
                      </Badge>
                    </div>
                  )}
                  {!template.available && (
                    <div className="absolute right-4 top-4">
                      <Badge
                        variant="secondary"
                        className="bg-[hsl(var(--brand-surface))] text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--brand-surface-strong))] dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.1em]"
                      >
                        {t('templatesSection.comingSoon')}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                      <Icon className="h-7 w-7 text-[hsl(var(--white))]" />
                    </div>
                    <CardTitle className="text-2xl">{tTemplates(`templatesList.${template.id}.title`)}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {tTemplates(`templatesList.${template.id}.description`)}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4">
                    {template.available ? (
                      <Button asChild className="group w-full bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] shadow-md font-subheading">
                        <Link href={template.href}>
                          {t('templatesSection.generateNow')}
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        <Clock className="mr-2 h-4 w-4" />
                        {t('templatesSection.comingSoon')}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t('templatesSection.needDifferentTemplate')}{" "}
              <a
                href="https://selisegroup.com/contact-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[hsl(var(--selise-blue))] hover:text-[hsl(var(--oxford-blue))] dark:text-[hsl(var(--sky-blue))]"
              >
                {t('templatesSection.requestTemplate')}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--bg))] py-24 dark:from-[hsl(var(--selise-blue))]/5 dark:to-[hsl(var(--background))] sm:py-32">
        {/* Spinning background graphic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/graphics/black-spin-bg.webp"
            alt=""
            width={800}
            height={800}
            className="opacity-[0.02] dark:opacity-[0.06] animate-[spin_60s_linear_infinite]"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('featuresSection.badge')}
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-heading">
              {t('featuresSection.title')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              {t('featuresSection.description')}
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative rounded-2xl border border-border bg-[hsl(var(--card))] p-8 shadow-sm transition-all hover:border-[hsl(var(--sky-blue))] hover:shadow-xl dark:bg-[hsl(var(--background))]/60 dark:hover:border-[hsl(var(--sky-blue))]">
                  <div className="absolute -right-3 -top-3">
                    <Badge className="bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] text-xs font-subheading uppercase tracking-[0.14em]">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                    <Icon className="h-8 w-8 text-[hsl(var(--white))]" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground font-heading">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional benefits list */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="rounded-2xl border border-border bg-[hsl(var(--card))]/70 p-8 backdrop-blur-sm dark:bg-[hsl(var(--background))]/40">
              <h3 className="text-center text-xl font-semibold text-foreground font-heading">
                {t('featuresSection.everythingYouNeed')}
              </h3>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/10 dark:bg-[hsl(var(--lime-green))]/20">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))] dark:text-[hsl(var(--lime-green))]" />
                    </div>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-[hsl(var(--bg))] dark:bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/20 dark:text-[hsl(var(--lime-green))] font-subheading uppercase tracking-[0.12em]">
              {t('howItWorks.badge')}
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-heading">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              {t('howItWorks.description')}
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-5xl">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
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
                  <div key={index} className="relative">
                    {index < 2 && (
                      <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] md:block" />
                    )}
                    <div className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30">
                        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--white))] text-xl font-bold text-[hsl(var(--selise-blue))] shadow-lg dark:bg-[hsl(var(--eerie-black))]">
                          {item.step}
                        </div>
                        <Icon className="h-10 w-10 text-[hsl(var(--white))]" />
                      </div>
                      <h3 className="mt-8 text-2xl font-semibold text-foreground font-heading">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SELISE DIO Approach */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <Image
            src="/graphics/black-spin-bg.webp"
            alt=""
            fill
            className="object-cover opacity-[0.18] dark:opacity-[0.28]"
          />
        </div>
        <div className="absolute inset-0 bg-[hsl(var(--bg))]/70 dark:bg-[hsl(var(--background))]/60" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('seliseDio.badge')}
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-heading">
              {t('seliseDio.title')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              {t('seliseDio.description')}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {approach.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative flex h-full flex-col rounded-2xl border border-border bg-[hsl(var(--card))]/80 p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))] hover:shadow-2xl dark:bg-[hsl(var(--background))]/70"
                >
                  <Badge className="w-fit bg-[hsl(var(--lime-green))]/15 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/25 dark:text-[hsl(var(--lime-green))] font-subheading uppercase tracking-[0.12em]">
                    {item.badge}
                  </Badge>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg shadow-[hsl(var(--selise-blue))]/25">
                      <Icon className="h-7 w-7 text-[hsl(var(--white))]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground font-heading">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="relative bg-[hsl(var(--bg))] py-24 sm:py-32 dark:bg-[hsl(var(--background))] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/graphics/contact-page-whole-bg.webp"
            alt=""
            fill
            className="object-cover opacity-[0.12] dark:opacity-[0.2]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--bg))]/85 via-[hsl(var(--bg))]/80 to-[hsl(var(--bg))]/75 dark:from-[hsl(var(--background))]/80 dark:via-[hsl(var(--background))]/75 dark:to-[hsl(var(--background))]/70" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('brandValues.badge')}
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-heading">
              {t('brandValues.title')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              {t('brandValues.description')}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {brandValues.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="flex h-full flex-col rounded-2xl border border-border bg-[hsl(var(--card))]/75 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[hsl(var(--background))]/70"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground font-heading">{value.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Disclaimer Section - Enhanced */}
      <section className="bg-[hsl(var(--bg))] py-20 dark:bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <LegalDisclaimer />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--oxford-blue))] py-24 sm:py-32">
        {/* Background texture for depth */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[32px_32px]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-[hsl(var(--white))] sm:text-5xl font-heading">
              {t('finalCta.title')}
            </h2>
            <p className="mt-6 text-xl leading-8 text-[hsl(var(--white))]/90">
              {t('finalCta.description')}
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-[hsl(var(--white))] text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--white))]/90 shadow-xl text-base px-10 py-6 h-auto font-subheading">
                <Link href="#templates">
                  {t('finalCta.getStartedFree')}
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-[hsl(var(--white))] bg-transparent text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 text-base px-10 py-6 h-auto font-subheading">
                <Link href="#templates">
                  {t('finalCta.viewAllTemplates')}
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-[hsl(var(--white))]/80">
              {t('finalCta.generateFirstDocument')}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
