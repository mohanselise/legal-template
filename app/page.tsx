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
import Link from "next/link";
import Image from "next/image";

const templates = [
  {
    id: "employment-agreement",
    title: "Employment Agreement",
    description: "Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.",
    icon: FileText,
    available: true,
    href: "/templates/employment-agreement/generate",
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

const approach = [
  {
    title: "Design",
    description: "Collaborative discovery turns requirements into human-centered journeys that respect regional regulations from day one.",
    icon: PenTool,
    badge: "Insight to Blueprint"
  },
  {
    title: "Implement",
    description: "Agile sprints with automated QA deliver reliable, scalable document experiences that stay aligned with legal standards.",
    icon: Wrench,
    badge: "Build with Precision"
  },
  {
    title: "Operate",
    description: "Continuous monitoring, analytics, and feedback loops keep every template accurate, secure, and always ready to ship.",
    icon: LifeBuoy,
    badge: "Always On"
  }
];

const brandValues = [
  {
    title: "Respectful",
    description: "We listen first and co-create solutions that empower distributed teams and their clients.",
    icon: Handshake
  },
  {
    title: "Integrous",
    description: "Transparent processes, audit trails, and responsible data handling build long-lasting trust.",
    icon: ShieldCheck
  },
  {
    title: "Humble",
    description: "We stay curious, iterate fast, and learn with every release to keep improving our craft.",
    icon: Feather
  },
  {
    title: "Pragmatic",
    description: "Every feature is anchored in measurable impact, making legal delivery simpler and faster.",
    icon: Target
  },
  {
    title: "Persevering",
    description: "We engineer resilient systems that adapt, scale, and keep critical workflows running.",
    icon: Mountain
  },
  {
    title: "Empowering",
    description: "We transfer knowledge and tools that let teams operate independently with confidence.",
    icon: Rocket
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Announcement Bar */}
      <div className="bg-[hsl(var(--selise-blue))] px-4 py-3 text-center text-sm text-white">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">New: Employment Agreement template now available!</span>
          <Link href="#templates" className="underline underline-offset-4 hover:opacity-90">
            Try it now →
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
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-[hsl(var(--gradient-light-to))]/70 to-white/75 dark:from-[hsl(var(--selise-blue))]/20 dark:via-[hsl(var(--oxford-blue))]/20 dark:to-transparent" />

        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/20" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[hsl(var(--sky-blue))]/10 blur-3xl dark:bg-[hsl(var(--selise-blue))]/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust badge */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <Badge className="bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/20 dark:text-[hsl(var(--lime-green))] border-[hsl(var(--lime-green))]/30" variant="outline">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Trusted by thousands
              </Badge>
              <Badge className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]" variant="secondary">
                100% Free
              </Badge>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl bg-clip-text">
              Professional Legal Documents,
              <span className="block bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] bg-clip-text text-transparent dark:from-[hsl(var(--sky-blue))] dark:to-[hsl(var(--light-blue))]">
                Generated Instantly
              </span>
            </h1>

            <p className="mt-8 text-xl leading-8 text-muted-foreground">
              Stop paying expensive lawyers for standard documents. Generate customized,
              <span className="font-semibold text-foreground"> plain-English legal templates</span> in minutes—
              completely free, forever.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white shadow-lg shadow-[hsl(var(--selise-blue))]/30 text-base px-8 py-6 h-auto">
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
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                <span>No sign-up required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
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
                  <div key={index} className="group rounded-2xl border border-border bg-white/50 p-6 text-center backdrop-blur-sm transition-all hover:border-[hsl(var(--sky-blue))] hover:shadow-lg dark:bg-black/20 dark:hover:border-[hsl(var(--sky-blue))]">
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
      <section id="templates" className="py-24 sm:py-32 bg-white dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]">
              Popular Templates
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Choose Your Template
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Select from our growing library of professional legal templates.
              <span className="font-semibold text-foreground"> More templates added every month.</span>
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
                      <Badge className="bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white shadow-lg">
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
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{template.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4">
                    {template.available ? (
                      <Button asChild className="group w-full bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white shadow-md">
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
            <p className="text-sm text-muted-foreground">
              Need a different template?{" "}
              <Link href="#" className="font-semibold text-[hsl(var(--selise-blue))] hover:text-[hsl(var(--oxford-blue))] dark:text-[hsl(var(--sky-blue))]">
                Request a template
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-white py-24 dark:from-[hsl(var(--selise-blue))]/5 dark:to-black sm:py-32">
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
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Legal Documents Made Simple
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              We believe legal documents should be accessible, understandable, and free for everyone.
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative rounded-2xl border border-border bg-white p-8 shadow-sm transition-all hover:border-[hsl(var(--sky-blue))] hover:shadow-xl dark:bg-black/40 dark:hover:border-[hsl(var(--sky-blue))]">
                  <div className="absolute -right-3 -top-3">
                    <Badge className="bg-[hsl(var(--selise-blue))] text-white text-xs">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
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
            <div className="rounded-2xl border border-border bg-white/50 p-8 backdrop-blur-sm dark:bg-black/20">
              <h3 className="text-center text-xl font-semibold text-foreground">
                Everything You Need, Nothing You Don&apos;t
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
      <section id="how-it-works" className="py-24 sm:py-32 bg-white dark:bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/20 dark:text-[hsl(var(--lime-green))]">
              Quick & Easy
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Generate in 3 Simple Steps
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
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
                      <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] md:block" />
                    )}
                    <div className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-2xl shadow-[hsl(var(--selise-blue))]/30">
                        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-[hsl(var(--selise-blue))] shadow-lg dark:bg-[hsl(var(--eerie-black))]">
                          {item.step}
                        </div>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="mt-8 text-2xl font-semibold text-foreground">
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
        <div className="absolute inset-0 bg-white/70 dark:bg-black/65" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]">
              Our DIO Model
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Structured for End-to-End Delivery
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              SELISE follows a Design, Implement, Operate rhythm that keeps every template human-centered,
              technically sound, and continuously optimized.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {approach.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative flex h-full flex-col rounded-2xl border border-border bg-white/80 p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))] hover:shadow-2xl dark:bg-black/60"
                >
                  <Badge className="w-fit bg-[hsl(var(--lime-green))]/15 text-[hsl(var(--poly-green))] dark:bg-[hsl(var(--lime-green))]/25 dark:text-[hsl(var(--lime-green))]">
                    {item.badge}
                  </Badge>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg shadow-[hsl(var(--selise-blue))]/25">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="relative bg-white py-24 sm:py-32 dark:bg-black overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/graphics/contact-page-whole-bg.webp"
            alt=""
            fill
            className="object-cover opacity-[0.12] dark:opacity-[0.2]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/80 to-white/75 dark:from-black/80 dark:via-black/75 dark:to-black/70" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/20 dark:text-[hsl(var(--sky-blue))]">
              Our Values
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Guided by What Matters
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Every interaction reflects SELISE values—respect, integrity, humility, pragmatism, perseverance, and empowerment.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {brandValues.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="flex h-full flex-col rounded-2xl border border-border bg-white/75 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-black/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] dark:bg-[hsl(var(--sky-blue))]/25 dark:text-[hsl(var(--sky-blue))]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
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
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Create Your Legal Document?
            </h2>
            <p className="mt-6 text-xl leading-8 text-white/90">
              Join thousands of users generating professional legal documents for free.
              No credit card. No sign-up. Just instant access.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-white text-[hsl(var(--selise-blue))] hover:bg-white/90 shadow-xl text-base px-10 py-6 h-auto">
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
            <p className="mt-8 text-sm text-white/80">
              ⚡ Generate your first document in under 2 minutes
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
