import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, ShieldCheck, Cpu, Sparkles, ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function FAQPage() {
  const t = await getTranslations('faq');
  
  const faqSections = [
    {
      badge: t('sections.gettingStarted.badge'),
      icon: Sparkles,
      title: t('sections.gettingStarted.title'),
      description: t('sections.gettingStarted.description'),
      entries: [
        {
          question: t('sections.gettingStarted.questions.howFast.question'),
          answer: t('sections.gettingStarted.questions.howFast.answer'),
        },
        {
          question: t('sections.gettingStarted.questions.needAccount.question'),
          answer: t('sections.gettingStarted.questions.needAccount.answer'),
        },
        {
          question: t('sections.gettingStarted.questions.fileFormats.question'),
          answer: t('sections.gettingStarted.questions.fileFormats.answer'),
        },
      ],
    },
    {
      badge: t('sections.trustAccuracy.badge'),
      icon: ShieldCheck,
      title: t('sections.trustAccuracy.title'),
      description: t('sections.trustAccuracy.description'),
      entries: [
        {
          question: t('sections.trustAccuracy.questions.legallyBinding.question'),
          answer: t('sections.trustAccuracy.questions.legallyBinding.answer'),
        },
        {
          question: t('sections.trustAccuracy.questions.dataHandled.question'),
          answer: t('sections.trustAccuracy.questions.dataHandled.answer'),
        },
        {
          question: t('sections.trustAccuracy.questions.regionSpecific.question'),
          answer: t('sections.trustAccuracy.questions.regionSpecific.answer'),
        },
      ],
    },
    {
      badge: t('sections.beyondTemplate.badge'),
      icon: Cpu,
      title: t('sections.beyondTemplate.title'),
      description: t('sections.beyondTemplate.description'),
      entries: [
        {
          question: t('sections.beyondTemplate.questions.seliseReview.question'),
          answer: t('sections.beyondTemplate.questions.seliseReview.answer'),
        },
        {
          question: t('sections.beyondTemplate.questions.esignature.question'),
          answer: t('sections.beyondTemplate.questions.esignature.answer'),
        },
        {
          question: t('sections.beyondTemplate.questions.templateNotListed.question'),
          answer: t('sections.beyondTemplate.questions.templateNotListed.answer'),
        },
      ],
    },
  ];
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--selise-blue))]/15 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/30" />
        <div className="absolute left-[-8%] top-16 h-60 w-60 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/22" />
        <div className="absolute right-[-12%] bottom-[-8%] h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/12 blur-3xl dark:bg-[hsl(var(--selise-blue))]/25" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-28 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              {t('faqHub')}
            </Badge>
            <Badge variant="secondary" className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--brand-surface-strong))]/20 text-[hsl(var(--selise-blue))] border-[hsl(var(--brand-border))]/40">
              {t('updatedMonthly')}
            </Badge>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('heading')}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
              {t('subheading')}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto">
                <Link href="/templates">
                  {t('browseTemplates')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/contact">{t('reachSupport')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="grid gap-14">
            {faqSections.map((section) => (
              <div key={section.title} className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="space-y-4">
                  <Badge className="w-fit bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20 font-subheading uppercase tracking-[0.16em]">
                    {section.badge}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                      <section.icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-semibold">{section.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground">{section.description}</p>
                </div>

                <div className="space-y-6">
                  {section.entries.map((entry) => (
                    <Card key={entry.question} className="border-[hsl(var(--brand-border))]/40 bg-white/80 backdrop-blur-sm dark:bg-gray-950/70">
                      <CardHeader className="space-y-3">
                        <CardTitle className="text-xl">{entry.question}</CardTitle>
                        <CardDescription className="text-base leading-relaxed text-muted-foreground">
                          {entry.answer}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--brand-surface))]/10">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Badge className="mx-auto bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20 uppercase tracking-[0.12em] font-subheading">
              {t('stillNeedHelp')}
            </Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">{t('oneMessageAway')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('stillNeedHelpDescription')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto">
                <Link href="/contact">
                  {t('contactSelise')}
                  <MessageSquare className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/templates/employment-agreement/generate">
                  {t('startWithEmploymentAgreement')}
                  <FileText className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
