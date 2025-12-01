import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { CheckCircle2, Clock, Shield, FileText, Users, Briefcase, Scale, AlertCircle, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employment Agreement Template | Free Legal Contract Generator',
  description: 'Create professional employment agreements in minutes. Legally sound, customizable templates for full-time, part-time, and contract employees. No lawyer required.',
  keywords: 'employment agreement, employment contract, job contract template, employee agreement, work contract, hiring agreement',
  openGraph: {
    title: 'Employment Agreement Template | Free Legal Contract Generator',
    description: 'Create professional employment agreements in minutes. Legally sound, customizable templates.',
    type: 'website',
  },
};

export default function EmploymentAgreementPage() {
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
                  Trusted by 10,000+ employers
                </Badge>
                <Badge className="bg-[hsl(var(--lime-green))]/20 text-[hsl(var(--white))] border-[hsl(var(--lime-green))]/40 font-subheading uppercase tracking-[0.12em]" variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Always Free
                </Badge>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 font-heading">
                Create Professional Employment Agreements in Minutes
              </h1>
              <p className="text-lg sm:text-xl text-[hsl(var(--white))]/85 leading-relaxed">
                Generate legally sound employment contracts tailored to your needs. No lawyer required. Save time and money with our trusted template generator.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/templates/employment-agreement/generate"
                  className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-8 py-4 text-lg font-semibold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all transform hover:scale-105"
                >
                  Generate Your Agreement Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[hsl(var(--white))]/70 px-8 py-4 text-lg font-semibold text-[hsl(var(--white))] hover:bg-[hsl(var(--white))]/10 hover:border-[hsl(var(--white))] transition-all backdrop-blur-sm"
                >
                  See How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm">
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
                  What&apos;s Included:
                </h3>
                <ul className="space-y-4">
                  {[
                    'Job title and description',
                    'Compensation and benefits',
                    'Working hours and location',
                    'Confidentiality clauses',
                    'Termination conditions',
                    'Non-compete agreements',
                    'Intellectual property rights',
                    'Dispute resolution terms'
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
              Why It Matters
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Every Employer Needs a Written Employment Agreement
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Protect your business and create clear expectations from day one
            </p>
          </div>

          <div className="prose prose-lg max-w-4xl mx-auto text-foreground mb-16">
            <p className="text-lg leading-relaxed">
              An employment agreement is more than just a formality—it&apos;s a critical legal document that protects both employers and employees. Whether you&apos;re hiring your first employee or your hundredth, having a clear, written agreement prevents misunderstandings and provides legal protection.
            </p>

            <p className="text-lg leading-relaxed">
              Without a proper employment agreement, you risk costly disputes over compensation, job responsibilities, intellectual property ownership, and termination conditions. A well-drafted contract sets clear expectations and provides a framework for resolving issues before they escalate.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Legal Protection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Safeguard your business interests with enforceable confidentiality, non-compete, and IP clauses.
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Clear Expectations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Define roles, responsibilities, and performance standards to prevent future disputes.
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Briefcase className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Professional Image</h3>
              <p className="text-muted-foreground leading-relaxed">
                Show candidates you&apos;re a serious, organized employer who values proper documentation.
              </p>
            </div>

            <div className="group bg-card border border-border rounded-2xl p-8 hover:border-[hsl(var(--sky-blue))] hover:shadow-xl transition-all">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg group-hover:scale-110 transition-transform">
                <Scale className="h-7 w-7 text-[hsl(var(--white))]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Compliance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ensure your agreements meet legal requirements and industry standards.
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
              Quick & Easy Process
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Generate Your Employment Agreement in 3 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              No legal expertise required. Our guided process makes it easy.
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
                Answer Simple Questions
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Tell us about the position, compensation, and key terms. Our guided form walks you through every detail.
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
                Review Your Document
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Instantly see your customized agreement. Make edits, add clauses, or adjust terms as needed.
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
                Download & Sign
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Download in PDF or Word format. Ready to print, sign, and use immediately.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/templates/employment-agreement/generate"
              className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))] px-10 py-5 text-lg font-semibold text-[hsl(var(--white))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--gradient-dark-from))] transition-all transform hover:scale-105"
            >
              Start Creating Your Agreement
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              ⚡ Takes less than 5 minutes • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Key Clauses Explained */}
      <section className="py-20 sm:py-28 bg-[hsl(var(--bg))] dark:bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))] font-subheading uppercase tracking-[0.12em]">
              What's Inside
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Essential Clauses in Every Employment Agreement
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Understanding the building blocks of a strong contract
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Job Description & Duties',
                description: 'Clearly defines the role, responsibilities, reporting structure, and performance expectations. Prevents scope creep and disputes about job requirements.'
              },
              {
                title: 'Compensation & Benefits',
                description: 'Specifies salary, bonuses, commission structure, benefits, equity, and payment schedule. Includes provisions for raises and performance reviews.'
              },
              {
                title: 'Work Schedule & Location',
                description: 'Outlines working hours, remote work policies, overtime expectations, and physical work location. Critical for hybrid and remote arrangements.'
              },
              {
                title: 'Confidentiality & Non-Disclosure',
                description: 'Protects sensitive business information, trade secrets, client lists, and proprietary data. Enforceable during and after employment.'
              },
              {
                title: 'Intellectual Property Rights',
                description: 'Clarifies who owns work products, inventions, and creative output. Essential for tech companies and creative industries.'
              },
              {
                title: 'Non-Compete & Non-Solicitation',
                description: 'Prevents employees from joining competitors or poaching clients/staff after leaving. Must be reasonable in scope and duration.'
              },
              {
                title: 'Termination Conditions',
                description: 'Defines at-will employment status, notice periods, severance terms, and grounds for immediate dismissal. Protects both parties.'
              },
              {
                title: 'Dispute Resolution',
                description: 'Establishes how conflicts will be resolved—through arbitration, mediation, or court. Includes jurisdiction and governing law.'
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
              For Every Business
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Perfect For Every Hiring Scenario
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              { title: 'Startups', desc: 'Hiring your first employees with equity and vesting schedules', icon: Sparkles },
              { title: 'Small Businesses', desc: 'Bringing on full-time or part-time staff with clear terms', icon: Briefcase },
              { title: 'Remote Companies', desc: 'Managing distributed teams across different jurisdictions', icon: Users },
              { title: 'Contractors', desc: 'Converting freelancers to full-time employees', icon: FileText },
              { title: 'C-Suite Executives', desc: 'Executive agreements with complex compensation packages', icon: Star },
              { title: 'International Hires', desc: 'Cross-border employment with compliance considerations', icon: Scale }
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
              { number: '10,000+', label: 'Documents Generated' },
              { number: '98%', label: 'Satisfaction Rate' },
              { number: '< 5 min', label: 'Average Time' },
              { number: '24/7', label: 'Available' }
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
              Why Choose Our Employment Agreement Generator?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Save Time & Money
                </h3>
                <p className="text-muted-foreground">
                  Lawyers charge $500-$2,000 for employment agreements. Create yours in minutes for a fraction of the cost.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Legally Sound Templates
                </h3>
                <p className="text-muted-foreground">
                  Our templates are drafted by legal professionals and updated regularly to reflect current laws.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Fully Customizable
                </h3>
                <p className="text-muted-foreground">
                  Add, remove, or modify clauses to fit your specific situation. Every business is unique.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Plain English
                </h3>
                <p className="text-muted-foreground">
                  No confusing legalese. Our agreements are written in clear, understandable language.
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
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Is this employment agreement legally binding?',
                a: 'Yes, our templates create legally binding agreements when properly executed by both parties. However, we recommend having any contract reviewed by a local attorney to ensure it complies with your jurisdiction\'s specific requirements.'
              },
              {
                q: 'Can I use this for remote employees in other states or countries?',
                a: 'Our templates can be customized for remote workers, but employment laws vary significantly by jurisdiction. For international hires or multi-state employment, we strongly recommend consulting with an employment lawyer to ensure compliance.'
              },
              {
                q: 'What\'s the difference between an employment agreement and an offer letter?',
                a: 'An offer letter is a preliminary document outlining basic terms. An employment agreement is a comprehensive legal contract that details all aspects of the employment relationship, including confidentiality, IP rights, and termination conditions.'
              },
              {
                q: 'How do I handle non-compete clauses?',
                a: 'Non-compete enforceability varies by state. Our template includes customizable non-compete language, but some states heavily restrict or ban these clauses. Check your local laws or consult an attorney.'
              },
              {
                q: 'Can I modify the agreement after it\'s signed?',
                a: 'Yes, but any changes require mutual consent from both employer and employee. Changes should be documented in writing as amendments to the original agreement.'
              },
              {
                q: 'Do I need separate agreements for part-time vs full-time employees?',
                a: 'Our template can be customized for both full-time and part-time positions. The key differences are usually in benefits eligibility and work hours, which you can specify during the generation process.'
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
                <h3 className="mb-2 text-sm font-semibold text-[hsl(var(--warning))]">Important Legal Notice</h3>
                <p className="text-sm text-muted-foreground">
                  This template is provided for informational purposes and should not be considered legal advice. Employment laws vary by jurisdiction, industry, and specific circumstances. While our templates are drafted to be comprehensive and legally sound, we strongly recommend having any employment agreement reviewed by a qualified attorney in your area before use, especially for executive positions, international hires, or situations involving complex compensation structures.
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
              Ready to Get Started?
            </Badge>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Create Your Employment Agreement Now
          </h2>
          <p className="text-xl sm:text-2xl text-[hsl(var(--white))]/85 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of employers who trust our platform for their hiring needs
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/templates/employment-agreement/generate"
              className="group inline-flex items-center justify-center rounded-xl bg-[hsl(var(--white))] px-12 py-6 text-lg font-bold text-[hsl(var(--selise-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30 hover:bg-[hsl(var(--white))]/90 transition-all transform hover:scale-105"
            >
              Generate Your Agreement Now
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--white))]/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>Ready in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
              <span>Download instantly</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
