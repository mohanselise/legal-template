import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "About Legal Template Generator | A SELISE Group AG Initiative",
  description:
    "Discover the mission behind Legal Template Generator, a free subsidiary initiative of SELISE Group AG focused on delivering plain-English legal documents to everyone.",
};

const pillars = [
  {
    title: "Accessible by Design",
    description:
      "We remove friction from standard agreements so founders, operators, and HR leaders get compliant paperwork without legal gatekeeping.",
    icon: Sparkles,
  },
  {
    title: "Grounded in Legal Craft",
    description:
      "Each template follows industry-aligned structures with clear guidance, so you understand every clause you sign or share.",
    icon: ShieldCheck,
  },
  {
    title: "Human Support Network",
    description:
      "Need more than a template? Our SELISE network connects you to specialists who can extend, localize, or operationalize what you generate.",
    icon: Users2,
  },
];

const commitments = [
  {
    title: "Always Free",
    description: "No paywalls, upcharges, or aggressive upsells. Your organization keeps control from draft to signature.",
  },
  {
    title: "Plain-Language First",
    description: "We translate legal formality into plain English while preserving the obligations you need to stay protected.",
  },
  {
    title: "Privacy-Respectful",
    description: "Documents render client-side. We never retain your answers or generated files unless you explicitly opt in.",
  },
];

const dioApproach = [
  {
    title: "Design",
    description:
      "We co-create journeys with legal advisors and operational teams to map real approval paths, regional nuances, and stakeholder needs.",
    icon: PenTool,
    accent: "Insight to Blueprint",
  },
  {
    title: "Implement",
    description:
      "Engineering sprints stack automation, validation, and performance monitoring so legal content remains dependable at scale.",
    icon: Wrench,
    accent: "Build with Precision",
  },
  {
    title: "Operate",
    description:
      "Continuous updates, feedback loops, and analytics keep templates aligned with regulatory shifts and business growth.",
    icon: LifeBuoy,
    accent: "Always On",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--selise-blue))]/15 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/35" />
        <div className="absolute left-[-10%] top-12 h-64 w-64 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/20" />
        <div className="absolute bottom-[-12%] right-[-10%] h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/10 blur-3xl dark:bg-[hsl(var(--selise-blue))]/25" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              Subsidiary of SELISE Group AG
            </Badge>
            <Badge variant="secondary" className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--lime-green))]/15 text-[hsl(var(--poly-green))] border-[hsl(var(--lime-green))]/20">
              Free Forever
            </Badge>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Legal clarity for every growing team.
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
              Legal Template Generator is a SELISE initiative dedicated to making professional contracts available to anyone,
              anywhere, at zero cost. We convert complex legal structures into plain-English documents you can trust from your
              first hire through global expansion.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto"
              >
                <Link href="/templates">
                  Explore Templates
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <a href="https://selisegroup.com/contact-us/" target="_blank" rel="noopener noreferrer">Talk to SELISE</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[hsl(var(--brand-surface))]/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-[hsl(var(--selise-blue))] sm:text-4xl">What guides our work</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every release centers on accessibility, clarity, and confidence. These pillars keep the experience pragmatic and ready for real-world legal workflows.
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
              <h2 className="text-3xl font-semibold sm:text-4xl">Powered by SELISE Group AG</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                SELISE Group AG is a global digital engineering partner headquartered in Switzerland, known for delivering outcomes
                through the Design-Implement-Operate (DIO) model. Legal Template Generator extends that mission by translating years
                of regulatory experience into instant, self-serve solutions for teams that need to move quickly without sacrificing compliance.
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
              <h3 className="text-2xl font-semibold text-[hsl(var(--selise-blue))]">Our global footprint</h3>
              <p className="mt-4 text-base text-muted-foreground">
                With teams spanning Europe, the Middle East, and Asia, SELISE blends regulatory expertise with engineering depth.
                This reach lets us keep templates relevant across jurisdictions while sharing best practices gathered from enterprise programs.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Globe2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  Multidisciplinary teams aligned to your region and time zone
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users2 className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  Experience spanning regulated industries, scale-ups, and public sector
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                  Governance practices rooted in privacy, resilience, and clarity
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
              The DIO Approach
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">How we keep templates reliable</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              SELISE&apos;s Design-Implement-Operate methodology ensures the generator evolves alongside regulations, technology,
              and the realities of running a business. Pace without breaking things.
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
          <h2 className="text-3xl font-semibold sm:text-4xl">We believe legal confidence should be default</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you are hiring your first employee, protecting IP, or formalizing strategic partnerships, Legal Template Generator
            keeps the barriers low and the standards high. Consider it your starting point—free today, free tomorrow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto"
            >
              <Link href="/templates">
                Generate a Document
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
