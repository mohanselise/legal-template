import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users2,
  PenTool,
  Wrench,
  LifeBuoy,
  BookCheck
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
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

export default async function AboutPage() {
  const t = await getTranslations('about');
  
  const pillars = [
    {
      title: t('pillars.accessibleByDesign.title'),
      description: t('pillars.accessibleByDesign.description'),
      icon: Sparkles,
    },
    {
      title: t('pillars.groundedInLegalCraft.title'),
      description: t('pillars.groundedInLegalCraft.description'),
      icon: ShieldCheck,
    },
    {
      title: t('pillars.humanSupportNetwork.title'),
      description: t('pillars.humanSupportNetwork.description'),
      icon: Users2,
    },
  ];

  const commitments = [
    {
      title: t('commitments.alwaysFree.title'),
      description: t('commitments.alwaysFree.description'),
    },
    {
      title: t('commitments.plainLanguageFirst.title'),
      description: t('commitments.plainLanguageFirst.description'),
    },
    {
      title: t('commitments.privacyRespectful.title'),
      description: t('commitments.privacyRespectful.description'),
    },
  ];

  const dioApproach = [
    {
      title: t('dioSteps.design.title'),
      description: t('dioSteps.design.description'),
      icon: PenTool,
      accent: t('dioSteps.design.accent'),
    },
    {
      title: t('dioSteps.implement.title'),
      description: t('dioSteps.implement.description'),
      icon: Wrench,
      accent: t('dioSteps.implement.accent'),
    },
    {
      title: t('dioSteps.operate.title'),
      description: t('dioSteps.operate.description'),
      icon: LifeBuoy,
      accent: t('dioSteps.operate.accent'),
    },
  ];
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--selise-blue))]/15 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/35" />
        <div className="absolute left-[-10%] top-12 h-64 w-64 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/20" />
        <div className="absolute bottom-[-12%] right-[-10%] h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/10 blur-3xl dark:bg-[hsl(var(--selise-blue))]/25" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              {t('subsidiaryBadge')}
            </Badge>
            <Badge variant="secondary" className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--lime-green))]/15 text-[hsl(var(--poly-green))] border-[hsl(var(--lime-green))]/20">
              {t('freeForeverBadge')}
            </Badge>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('heading')}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
              {t('subheading')}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto"
              >
                <Link href="/templates">
                  {t('exploreTemplates')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/contact">{t('talkToSelise')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[hsl(var(--brand-surface))]/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-[hsl(var(--selise-blue))] sm:text-4xl">{t('whatGuidesOurWork')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('whatGuidesDescription')}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="h-full border-[hsl(var(--brand-border))]/40 bg-white/70 backdrop-blur-sm dark:bg-gray-950/70">
                <CardHeader className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{pillar.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">{pillar.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold sm:text-4xl">{t('poweredBySelise')}</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                {t('poweredByDescription')}
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {commitments.map((commitment) => (
                  <div key={commitment.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--brand-surface-strong))]/10 p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[hsl(var(--selise-blue))]">
                      <BookCheck className="h-4 w-4" />
                      {commitment.title}
                    </div>
                    <p className="text-base text-muted-foreground">{commitment.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[hsl(var(--brand-border))]/60 bg-gradient-to-br from-[hsl(var(--selise-blue))]/10 via-white to-[hsl(var(--sky-blue))]/15 p-8 dark:from-[hsl(var(--selise-blue))]/20 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/30">
              <h3 className="text-2xl font-semibold text-[hsl(var(--selise-blue))]">{t('globalFootprint')}</h3>
              <p className="mt-4 text-base text-muted-foreground">
                {t('globalFootprintDescription')}
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Globe2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  {t('multidisciplinaryTeams')}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  {t('experienceSpanning')}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  {t('governancePractices')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[hsl(var(--brand-surface))]/10">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mx-auto bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30 uppercase tracking-[0.12em] font-subheading">
              {t('dioApproach')}
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{t('howWeKeepTemplatesReliable')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('dioDescription')}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {dioApproach.map((item) => (
              <Card key={item.title} className="h-full border-[hsl(var(--brand-border))]/50 bg-white/80 backdrop-blur-sm dark:bg-gray-950/70">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--globe-grey))]">{item.accent}</span>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base text-muted-foreground">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-8">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t('believeHeading')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('believeDescription')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto"
            >
              <Link href="/templates">
                {t('generateDocument')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
              <Link href="/faq">{t('readFaq')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
