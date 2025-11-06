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
  Lock,
  Users,
  Zap,
  Download,
  Star,
  Globe,
  FileCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const templates = [
  {
    id: "employment-agreement",
    title: "Employment Agreement",
    description: "Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.",
    icon: FileText,
    available: true,
    href: "/templates/employment-agreement",
    popular: true
  },
  {
    id: "founders-agreement",
    title: "Founders' Agreement",
    description: "Define equity splits, roles, responsibilities, and decision-making processes for your startup.",
    icon: Users,
    available: false,
    href: "#"
  },
  {
    id: "nda",
    title: "Non-Disclosure Agreement",
    description: "Protect confidential information with bilateral or unilateral NDA templates.",
    icon: Lock,
    available: false,
    href: "#"
  },
  {
    id: "dpa",
    title: "Data Processing Agreement",
    description: "GDPR-compliant DPA templates for processor-controller relationships.",
    icon: Shield,
    available: false,
    href: "#"
  },
  {
    id: "ip-assignment",
    title: "IP Assignment Agreement",
    description: "Transfer intellectual property rights with clear terms and comprehensive coverage.",
    icon: Sparkles,
    available: false,
    href: "#"
  }
];

const features = [
  {
    icon: Clock,
    title: "Generate in Minutes",
    description: "Answer a few questions and get your customized legal document instantly—no waiting, no hassle.",
    highlight: "2 min avg"
  },
  {
    icon: Shield,
    title: "Legally Sound",
    description: "All templates are drafted following industry best practices and common legal standards.",
    highlight: "Professional"
  },
  {
    icon: CheckCircle2,
    title: "Plain English",
    description: "No confusing legalese. Our templates are written in clear, understandable language.",
    highlight: "Easy to read"
  },
  {
    icon: Zap,
    title: "100% Free",
    description: "All templates are completely free to generate, customize, and download. No hidden costs.",
    highlight: "Forever free"
  }
];

const stats = [
  { value: "5+", label: "Legal Templates", icon: FileCheck },
  { value: "100%", label: "Free Forever", icon: Zap },
  { value: "2 min", label: "Avg. Generation", icon: Clock },
  { value: "24/7", label: "Available", icon: Globe }
];

const benefits = [
  "No sign-up or registration required",
  "Instant PDF download",
  "Customizable for your needs",
  "Plain-English, easy to understand",
  "No hidden fees or subscriptions",
  "Professional quality templates"
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] font-sans">
      {/* Announcement Bar */}
      <div className="bg-blue-600 px-4 py-3 text-center text-sm text-white">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">New: Employment Agreement template now available!</span>
          <Link href="#templates" className="underline underline-offset-4 hover:text-blue-100">
            Try it now →
          </Link>
        </div>
      </div>

      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--border))]">
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/20" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl dark:bg-purple-600/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust badge */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" variant="outline">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Trusted by thousands
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" variant="secondary">
                100% Free
              </Badge>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-[hsl(var(--fg))] sm:text-7xl bg-clip-text">
              Professional Legal Documents,
              <span className="block bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Generated Instantly
              </span>
            </h1>

            <p className="mt-8 text-xl leading-8 text-[hsl(var(--muted-foreground))]">
              Stop paying expensive lawyers for standard documents. Generate customized,
              <span className="font-semibold text-[hsl(var(--fg))]"> plain-English legal templates</span> in minutes—
              completely free, forever.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 text-base px-8 py-6 h-auto">
                <Link href="#templates">
                  Start Generating Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 h-auto border-2">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Quick benefits */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>No sign-up required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Instant download</span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="group rounded-2xl border border-[hsl(var(--border))] bg-white/50 p-6 text-center backdrop-blur-sm transition-all hover:border-blue-300 hover:shadow-lg dark:bg-black/20 dark:hover:border-blue-700">
                    <Icon className="mx-auto mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="text-4xl font-bold text-[hsl(var(--fg))]">{stat.value}</div>
                    <div className="mt-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section - Enhanced */}
      <section id="templates" className="py-24 sm:py-32 bg-white dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Popular Templates
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-[hsl(var(--fg))] sm:text-5xl">
              Choose Your Template
            </h2>
            <p className="mt-6 text-lg text-[hsl(var(--muted-foreground))]">
              Select from our growing library of professional legal templates.
              <span className="font-semibold text-[hsl(var(--fg))]"> More templates added every month.</span>
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
                      ? 'border-2 hover:border-blue-400 hover:-translate-y-1 dark:hover:border-blue-600'
                      : 'opacity-60'
                  }`}
                >
                  {template.popular && template.available && (
                    <div className="absolute -right-2 -top-2">
                      <Badge className="bg-linear-to-r from-orange-500 to-pink-500 text-white shadow-lg">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {!template.available && (
                    <div className="absolute right-4 top-4">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{template.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4">
                    {template.available ? (
                      <Button asChild className="group w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        <Link href={template.href}>
                          Generate Now
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        <Clock className="mr-2 h-4 w-4" />
                        Coming Soon
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Need a different template?{" "}
              <Link href="#" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Request a template
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50 to-white py-24 dark:from-blue-950/10 dark:to-black sm:py-32">
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
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-[hsl(var(--fg))] sm:text-5xl">
              Legal Documents Made Simple
            </h2>
            <p className="mt-6 text-lg text-[hsl(var(--muted-foreground))]">
              We believe legal documents should be accessible, understandable, and free for everyone.
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative rounded-2xl border border-[hsl(var(--border))] bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-xl dark:bg-black/40 dark:hover:border-blue-700">
                  <div className="absolute -right-3 -top-3">
                    <Badge className="bg-blue-600 text-white text-xs">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[hsl(var(--fg))]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional benefits list */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-white/50 p-8 backdrop-blur-sm dark:bg-black/20">
              <h3 className="text-center text-xl font-semibold text-[hsl(var(--fg))]">
                Everything You Need, Nothing You Don&apos;t
              </h3>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-[hsl(var(--fg))]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-white dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Quick & Easy
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-[hsl(var(--fg))] sm:text-5xl">
              Generate in 3 Simple Steps
            </h2>
            <p className="mt-6 text-lg text-[hsl(var(--muted-foreground))]">
              From zero to legally-sound document in under 2 minutes.
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-5xl">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Choose Your Template",
                  description: "Select the legal document you need from our curated library of professional templates.",
                  icon: FileText
                },
                {
                  step: "2",
                  title: "Fill in the Details",
                  description: "Answer simple questions in plain English. No legal knowledge required—we guide you through every field.",
                  icon: CheckCircle2
                },
                {
                  step: "3",
                  title: "Download & Use",
                  description: "Get your customized, professionally-formatted document as a PDF. Ready to use immediately.",
                  icon: Download
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="relative">
                    {index < 2 && (
                      <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-linear-to-r from-blue-400 to-purple-400 md:block" />
                    )}
                    <div className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-600/30">
                        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-600 shadow-lg dark:bg-gray-900">
                          {item.step}
                        </div>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="mt-8 text-2xl font-semibold text-[hsl(var(--fg))]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
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

      {/* Social Proof Section */}
      <section className="relative border-y border-[hsl(var(--border))] bg-linear-to-r from-blue-50 via-purple-50 to-pink-50 py-16 dark:from-blue-950/10 dark:via-purple-950/10 dark:to-pink-950/10 overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.015] dark:opacity-[0.04]"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 fill-current" />
              ))}
            </div>
            <p className="mt-6 text-2xl font-semibold text-[hsl(var(--fg))] sm:text-3xl">
              &quot;Finally, legal documents that don&apos;t require a law degree to understand!&quot;
            </p>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
              Join thousands of professionals, startups, and small businesses who trust our templates.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Disclaimer Section */}
      <section className="bg-white py-20 dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 shadow-lg dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                    Important Legal Disclaimer
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                    These templates are provided for informational purposes and as a starting point for your legal documents.
                    They do not constitute legal advice. For specific legal guidance tailored to your situation, please consult
                    with a qualified attorney in your jurisdiction. Laws vary by location and change over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-600 to-purple-700 py-24 sm:py-32">
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
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Create Your Legal Document?
            </h2>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Join thousands of users generating professional legal documents for free.
              No credit card. No sign-up. Just instant access.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-white text-blue-600 hover:bg-gray-100 shadow-xl text-base px-10 py-6 h-auto">
                <Link href="#templates">
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white/10 text-base px-10 py-6 h-auto">
                <Link href="#templates">
                  View All Templates
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-blue-200">
              ⚡ Generate your first document in under 2 minutes
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
