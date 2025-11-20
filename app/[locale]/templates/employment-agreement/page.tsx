import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Metadata } from 'next';
import { CheckCircle2, Clock, Shield, FileText, Users, Briefcase, Scale, AlertCircle, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('employmentAgreementPage.metadata');
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('openGraphTitle'),
      description: t('openGraphDescription'),
      type: 'website',
    },
  };
}

export default async function EmploymentAgreementPage() {
  const t = await getTranslations('employmentAgreementPage');
  return (
    <div className="bg-[hsl(var(--bg))] text-foreground">
      {/* Hero Section - Above the Fold */}
      <section className="relative bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-[hsl(var(--white))] overflow-hidden">
        {/* Background texture/image */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
            priority
          />
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[hsl(var(--light-blue))]/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative z-10">
              {/* Trust badge */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge className="bg-[hsl(var(--white))]/15 text-[hsl(var(--white))] border-[hsl(var(--white))]/30 backdrop-blur-sm font-subheading uppercase tracking-[0.12em]" variant="outline">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {t('hero.trustedBadge')}
                </Badge>
                <Badge className="bg-[hsl(var(--lime-green))]/20 text-[hsl(var(--white))] border-[hsl(var(--lime-green))]/40 font-subheading uppercase tracking-[0.12em]" variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t('hero.alwaysFreeBadge')}
                </Badge>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
                {t('hero.title')}
              </h1>
              <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed">
                {t('hero.subtitle')}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/templates/employment-agreement/generate"
                  className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-8 py-4 text-lg font-semibold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all transform hover:scale-105"
                >
                  {t('hero.generateButton')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[hsl(var(--white))]/70 px-8 py-4 text-lg font-semibold text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 hover:border-[hsl(var(--white))] transition-all backdrop-blur-sm"
                >
                  {t('hero.seeHowItWorks')}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                  </div>
                  <span className="text-[hsl(var(--white))]/80">{t('hero.legallyVetted')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                  </div>
                  <span className="text-[hsl(var(--white))]/80">{t('hero.readyIn5Minutes')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                  </div>
                  <span className="text-[hsl(var(--white))]/80">{t('hero.fullyCustomizable')}</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators with Visual */}
            <div className="relative">
              <div className="relative rounded-3xl border border-[hsl(var(--white))]/25 bg-[hsl(var(--white))]/10 p-8 shadow-2xl backdrop-blur-md">
                {/* Decorative sparkle */}
                <div className="absolute -top-3 -right-3">
                  <div className="rounded-full bg-[hsl(var(--lime-green))]/20 p-3 shadow-lg">
                    <Sparkles className="h-5 w-5 text-[hsl(var(--white))]" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {t('hero.whatsIncluded')}
                </h3>
                <ul className="space-y-4">
                  {[
                    t('hero.includedItems.jobTitle'),
                    t('hero.includedItems.compensation'),
                    t('hero.includedItems.workingHours'),
                    t('hero.includedItems.confidentiality'),
                    t('hero.includedItems.termination'),
                    t('hero.includedItems.nonCompete'),
                    t('hero.includedItems.ipRights'),
                    t('hero.includedItems.disputeResolution')
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--lime-green))]/15 transition-colors group-hover:bg-[hsl(var(--lime-green))]/25 flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))]" />
                      </div>
                      <span className="text-[hsl(var(--white))]/85 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why You Need an Employment Agreement */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('whyItMatters.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              {t('whyItMatters.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('whyItMatters.subtitle')}
            </p>
          </div>

          <div className="prose prose-lg max-w-4xl mx-auto text-foreground mb-16">
            <p className="text-lg leading-relaxed">
              {t('whyItMatters.intro1')}
            </p>

            <p className="text-lg leading-relaxed">
              {t('whyItMatters.intro2')}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{t('whyItMatters.legalProtection.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('whyItMatters.legalProtection.description')}
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{t('whyItMatters.clearExpectations.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('whyItMatters.clearExpectations.description')}
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Briefcase className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{t('whyItMatters.professionalImage.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('whyItMatters.professionalImage.description')}
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Scale className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{t('whyItMatters.compliance.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('whyItMatters.compliance.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--bg))] dark:from-[hsl(var(--selise-blue))]/5 dark:to-[hsl(var(--background))] py-20 sm:py-28 overflow-hidden">
        {/* Background spinning graphic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/graphics/black-spin-bg.webp"
            alt=""
            width={800}
            height={800}
            className="opacity-[0.015] dark:opacity-[0.04] animate-[spin_60s_linear_infinite]"
          />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[hsl(var(--lime-green))]/15 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/25 dark:text-[hsl(var(--lime-green))] font-subheading uppercase tracking-[0.12em]">
              {t('howItWorks.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
            <div className="relative text-center group">
              {/* Connection line (desktop only) */}
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-gradient-to-r from-[hsl(var(--sky-blue))] to-[hsl(var(--selise-blue))] md:block" />
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 transition-transform group-hover:scale-110">
                  <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--white))] text-lg font-bold text-[hsl(var(--selise-blue))] shadow-lg dark:bg-[hsl(var(--eerie-black))]">
                    1
                  </div>
                  <FileText className="h-9 w-9 text-[hsl(var(--white))]" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-foreground mb-4">
                {t('howItWorks.step1.title')}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('howItWorks.step1.description')}
              </p>
            </div>

            <div className="relative text-center group">
              {/* Step 2 */}
              <div className="relative">
                <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-gradient-to-r from-[hsl(var(--sky-blue))] to-[hsl(var(--selise-blue))] md:block" />
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 transition-transform group-hover:scale-110">
                  <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--white))] text-lg font-bold text-[hsl(var(--selise-blue))] shadow-lg dark:bg-[hsl(var(--eerie-black))]">
                    2
                  </div>
                  <Sparkles className="h-9 w-9 text-[hsl(var(--white))]" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-foreground mb-4">
                {t('howItWorks.step2.title')}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('howItWorks.step2.description')}
              </p>
            </div>

            <div className="relative text-center group">
              {/* Step 3 */}
              <div className="relative">
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 transition-transform group-hover:scale-110">
                  <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--white))] text-lg font-bold text-[hsl(var(--selise-blue))] shadow-lg dark:bg-[hsl(var(--eerie-black))]">
                    3
                  </div>
                  <CheckCircle2 className="h-9 w-9 text-[hsl(var(--white))]" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-foreground mb-4">
                {t('howItWorks.step3.title')}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('howItWorks.step3.description')}
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/templates/employment-agreement/generate"
              className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))] px-10 py-5 text-lg font-semibold text-[hsl(var(--white))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--gradient-dark-from))] transition-all transform hover:scale-105"
            >
              {t('howItWorks.ctaButton')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('howItWorks.ctaSubtext')}
            </p>
          </div>
        </div>
      </section>

      {/* Key Clauses Explained */}
      <section className="py-20 sm:py-28 bg-[hsl(var(--bg))] dark:bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('keyClauses.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {t('keyClauses.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('keyClauses.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: t('keyClauses.clauses.jobDescription.title'),
                description: t('keyClauses.clauses.jobDescription.description')
              },
              {
                title: t('keyClauses.clauses.compensation.title'),
                description: t('keyClauses.clauses.compensation.description')
              },
              {
                title: t('keyClauses.clauses.workSchedule.title'),
                description: t('keyClauses.clauses.workSchedule.description')
              },
              {
                title: t('keyClauses.clauses.confidentiality.title'),
                description: t('keyClauses.clauses.confidentiality.description')
              },
              {
                title: t('keyClauses.clauses.ipRights.title'),
                description: t('keyClauses.clauses.ipRights.description')
              },
              {
                title: t('keyClauses.clauses.nonCompete.title'),
                description: t('keyClauses.clauses.nonCompete.description')
              },
              {
                title: t('keyClauses.clauses.termination.title'),
                description: t('keyClauses.clauses.termination.description')
              },
              {
                title: t('keyClauses.clauses.disputeResolution.title'),
                description: t('keyClauses.clauses.disputeResolution.description')
              }
            ].map((clause, index) => (
              <div key={index} className="group bg-card border-2 border-border rounded-xl p-6 hover:border-[hsl(var(--sky-blue))] hover:shadow-lg transition-all">
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-[hsl(var(--white))]" />
                  </div>
                  {clause.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed ml-13">{clause.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--bg))] dark:from-[hsl(var(--selise-blue))]/5 dark:to-[hsl(var(--background))] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              {t('useCases.badge')}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {t('useCases.title')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              { title: t('useCases.useCases.startups.title'), desc: t('useCases.useCases.startups.description'), icon: Sparkles },
              { title: t('useCases.useCases.smallBusinesses.title'), desc: t('useCases.useCases.smallBusinesses.description'), icon: Briefcase },
              { title: t('useCases.useCases.remoteCompanies.title'), desc: t('useCases.useCases.remoteCompanies.description'), icon: Users },
              { title: t('useCases.useCases.contractors.title'), desc: t('useCases.useCases.contractors.description'), icon: FileText },
              { title: t('useCases.useCases.executives.title'), desc: t('useCases.useCases.executives.description'), icon: Star },
              { title: t('useCases.useCases.internationalHires.title'), desc: t('useCases.useCases.internationalHires.description'), icon: Scale }
            ].map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div key={index} className="group border-2 border-border rounded-2xl bg-[hsl(var(--card))] p-6 transition-all hover:border-[hsl(var(--sky-blue))] hover:shadow-xl dark:bg-[hsl(var(--background))]/70">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-[hsl(var(--white))]" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{useCase.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="relative py-12 bg-gradient-to-r from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--background))] dark:to-[hsl(var(--background))]/85 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.02] dark:opacity-[0.06]"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {[
              { number: '10,000+', label: t('stats.documentsGenerated') },
              { number: '98%', label: t('stats.satisfactionRate') },
              { number: '< 5 min', label: t('stats.averageTime') },
              { number: '24/7', label: t('stats.available') }
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('benefits.title')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('benefits.saveTimeMoney.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('benefits.saveTimeMoney.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('benefits.legallySound.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('benefits.legallySound.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('benefits.fullyCustomizable.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('benefits.fullyCustomizable.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t('benefits.plainEnglish.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('benefits.plainEnglish.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('faq.title')}
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: t('faq.questions.legallyBinding.question'),
                a: t('faq.questions.legallyBinding.answer')
              },
              {
                q: t('faq.questions.remoteEmployees.question'),
                a: t('faq.questions.remoteEmployees.answer')
              },
              {
                q: t('faq.questions.differenceOfferLetter.question'),
                a: t('faq.questions.differenceOfferLetter.answer')
              },
              {
                q: t('faq.questions.nonCompete.question'),
                a: t('faq.questions.nonCompete.answer')
              },
              {
                q: t('faq.questions.modifyAfterSigning.question'),
                a: t('faq.questions.modifyAfterSigning.answer')
              },
              {
                q: t('faq.questions.partTimeFullTime.question'),
                a: t('faq.questions.partTimeFullTime.answer')
              }
            ].map((faq, index) => (
              <details key={index} className="group bg-background border border-border rounded-lg p-6">
                <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="ml-4 flex-shrink-0 text-primary">+</span>
                </summary>
                <p className="mt-4 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-r-lg border-l-4 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/15 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-[hsl(var(--warning))]" />
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[hsl(var(--warning))]">{t('disclaimer.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('disclaimer.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-[hsl(var(--white))] py-24 sm:py-32 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[hsl(var(--light-blue))]/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Badge className="bg-[hsl(var(--white))]/20 text-[hsl(var(--white))] border-[hsl(var(--white))]/30 backdrop-blur-sm font-subheading uppercase tracking-[0.12em]">
              <Sparkles className="mr-1 h-3 w-3" />
              {t('finalCta.badge')}
            </Badge>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl sm:text-2xl text-[hsl(var(--white))]/85 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('finalCta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/templates/employment-agreement/generate"
              className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-12 py-6 text-lg font-bold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all transform hover:scale-105"
            >
              {t('finalCta.generateButton')}
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--white))]/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>{t('finalCta.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>{t('finalCta.readyIn5Minutes')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>{t('finalCta.downloadInstantly')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
