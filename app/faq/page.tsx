import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, ShieldCheck, Cpu, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Legal Template Generator",
  description:
    "Find answers about how the Legal Template Generator works, what makes it free, and how SELISE Group AG keeps your documents private and dependable.",
};

const faqSections = [
  {
    badge: "Getting Started",
    icon: Sparkles,
    title: "Using the generator",
    description:
      "Everything you need to know to go from idea to ready-to-download template in minutes.",
    entries: [
      {
        question: "How fast can I generate a document?",
        answer:
          "Most templates are ready in under three minutes. The guided questions collect core facts, render the clauses client-side, and produce both a preview and downloadable PDF immediately.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "No. Legal Template Generator is intentionally frictionless. Open the template you need, answer the prompts, and export your document—no registration, credit card, or emails required.",
      },
      {
        question: "What file formats are supported?",
        answer:
          "We currently provide high-resolution PDF downloads optimized for sharing and e-signature. Structured DOCX exports are on the roadmap and will follow once formatting parity is guaranteed.",
      },
    ],
  },
  {
    badge: "Trust & Accuracy",
    icon: ShieldCheck,
    title: "Legal quality and privacy",
    description:
      "Why you can rely on our templates and how we safeguard every answer you provide.",
    entries: [
      {
        question: "Are the templates legally binding?",
        answer:
          "Our templates mirror industry-standard structures crafted with SELISE legal specialists. However, enforceability always depends on local law and proper execution. When in doubt, have counsel review for jurisdiction-specific needs.",
      },
      {
        question: "How is my data handled?",
        answer:
          "Your inputs stay in your browser session. We never store template responses or generated documents unless you explicitly choose to share them with us. Analytics are anonymized to understand feature usage, not document content.",
      },
      {
        question: "Do templates include region-specific clauses?",
        answer:
          "Yes. We bake in conditional language for common jurisdictions and highlight where localized counsel should validate. As regulations shift, SELISE’s global compliance team updates those clauses and publishes release notes.",
      },
    ],
  },
  {
    badge: "Beyond the Template",
    icon: Cpu,
    title: "Working with SELISE",
    description:
      "How the broader SELISE ecosystem helps when you need more than a self-serve document.",
    entries: [
      {
        question: "Can SELISE review my completed document?",
        answer:
          "Absolutely. Our advisory partners can audit, localize, or customize any generated agreement. Reach out via the contact form and we’ll connect you with the right expert squad.",
      },
      {
        question: "Do you offer e-signature or workflow tools?",
        answer:
          "Yes. SELISE Signature integrates directly with our templates for drag-and-drop signature placement, automated reminders, and audit trails. The integration roadmap is published in our updates section.",
      },
      {
        question: "What if I need a template that’s not listed?",
        answer:
          "Use the request form and tell us what you need. We prioritize based on demand and regulatory urgency, then ship new templates with clear changelogs so you always know what’s new.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--selise-blue))]/15 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/30" />
        <div className="absolute left-[-8%] top-16 h-60 w-60 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/22" />
        <div className="absolute right-[-12%] bottom-[-8%] h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/12 blur-3xl dark:bg-[hsl(var(--selise-blue))]/25" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-28 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              FAQ Hub
            </Badge>
            <Badge variant="secondary" className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--brand-surface-strong))]/20 text-[hsl(var(--selise-blue))] border-[hsl(var(--brand-border))]/40">
              Updated Monthly
            </Badge>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Answers to keep you moving with confidence.
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
              Legal Template Generator removes the friction from standard agreements. Explore the most common questions about how we stay free, how SELISE safeguards your information, and how to get help from a human if you need it.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto">
                <Link href="/templates">
                  Browse Templates
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/contact">Reach Support</Link>
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
              Still need help?
            </Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">We’re one message away.</h2>
            <p className="text-lg text-muted-foreground">
              Chat with our support team for walkthroughs, enterprise rollouts, or specialized clauses. SELISE advisors can jump in when you need regional nuance or deeper automation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="group bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] px-7 py-5 h-auto">
                <Link href="/contact">
                  Contact SELISE
                  <MessageSquare className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/templates/employment-agreement/generate">
                  Start with Employment Agreement
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
