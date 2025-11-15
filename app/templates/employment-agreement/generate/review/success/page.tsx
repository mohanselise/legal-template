'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Mail,
  Shield,
  Sparkles,
  Users,
  Zap,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';

interface SignatureSummary {
  documentId?: string;
  trackingId?: string;
  fileId?: string;
}

interface PayloadSummary {
  document?: EmploymentAgreement;
  formData?: Record<string, unknown> | null;
  signatories?: Array<{
    name: string;
    email: string;
    role?: string;
    order?: number;
  }>;
}

export default function SignatureSuccessPage() {
  const payload = useMemo<PayloadSummary | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.sessionStorage.getItem('signature-last-payload');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PayloadSummary;
    } catch (error) {
      console.warn('Unable to parse signature payload cache', error);
      return null;
    }
  }, []);

  const summary = useMemo<SignatureSummary | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.sessionStorage.getItem('signature-last-result');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SignatureSummary;
    } catch (error) {
      console.warn('Unable to parse signature result cache', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signature-last-payload');
      window.sessionStorage.removeItem('signature-last-result');
    }
  }, []);

  const employeeName =
    payload?.document?.parties?.employee?.legalName ||
    payload?.formData?.employeeName ||
    'the employee';

  const signatories = payload?.signatories
    ? [...payload.signatories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];
  const signatoryCount = signatories.length;
  const hasSignatories = signatoryCount > 0;

  const nextSteps = [
    {
      icon: Zap,
      title: 'Monitor progress in real time',
      description:
        'Use the SELISE Signature tracker to see who has viewed, signed, or needs a reminder.',
    },
    {
      icon: Mail,
      title: 'Personalise your follow-up',
      description: `Send a quick note to ${employeeName} with context about timelines and next steps.`,
    },
    {
      icon: Shield,
      title: 'Keep everything audit ready',
      description:
        'Completed agreements are sealed with a tamper-proof audit trail for your compliance team.',
    },
  ] as const;

  const highlights = [
    {
      icon: Globe,
      title: 'Global compliance',
      description:
        'Qualified electronic signatures recognised in 180+ countries.',
    },
    {
      icon: Download,
      title: 'Instant exports',
      description:
        'Download PDF or DOCX the moment every party signs the agreement.',
    },
    {
      icon: Sparkles,
      title: 'Smart templates',
      description:
        'Reuse structured variables to accelerate onboarding across roles.',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
      <section className="relative overflow-hidden border-b border-border bg-[hsl(var(--gradient-light-from))]">
        <div className="absolute -left-32 top-10 h-56 w-56 rounded-full bg-[hsl(var(--selise-blue))]/15 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              asChild
              variant="ghost"
              className="text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
            >
              <Link href="/templates/employment-agreement/generate/review">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to review
              </Link>
            </Button>
            {summary?.trackingId && (
              <Badge
                className="max-w-full truncate border-[hsl(var(--selise-blue))]/30 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                title={summary.trackingId}
              >
                Tracking ID • {summary.trackingId}
              </Badge>
            )}
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <Badge className="mb-6 w-fit border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] font-semibold">
                Employment agreement sent
              </Badge>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Your agreement is on its way to {employeeName}.
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Secure requests went out to every signer. You can follow progress,
                nudge pending signers, and download the finalised copy the moment
                everyone signs.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-[hsl(var(--selise-blue))] px-8 text-base font-semibold text-white hover:bg-[hsl(var(--selise-blue))]/90"
                >
                  <Link href="/templates/employment-agreement/generate">
                    Start another document
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border border-[hsl(var(--selise-blue))]/40 px-8 text-base font-semibold text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
                >
                  <Link
                    href="https://selise.app/login"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open SELISE Signature
                  </Link>
                </Button>
              </div>

              <dl className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[hsl(var(--selise-blue))]/20 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--selise-blue))]">
                      Status
                    </p>
                  </div>
                  <p className="mt-4 text-xl font-semibold text-[hsl(var(--fg))]">
                    Invitations sent
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Every signer receives a secure, branded invitation with full audit
                    tracking.
                  </p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--selise-blue))]/20 bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--selise-blue))]">
                      Signatories
                    </p>
                  </div>
                  <p className="mt-4 text-xl font-semibold text-[hsl(var(--fg))]">
                    {signatoryCount || 'Awaiting list'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automated reminders keep the order you defined on schedule.
                  </p>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                    Next checkpoints
                  </p>
                  <p className="text-lg font-semibold text-[hsl(var(--fg))]">
                    Keep momentum
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-5">
                <li className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <h3 className="text-base font-semibold text-[hsl(var(--fg))]">
                      Confirmation emails sent
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Every recipient gets a secure link that satisfies Swiss, EU, and US
                    compliance requirements.
                  </p>
                </li>
                <li className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <h3 className="text-base font-semibold text-[hsl(var(--fg))]">
                      Automated reminders enabled
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Scheduled nudges keep partners accountable before your onboarding
                    deadline.
                  </p>
                </li>
                <li className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
                    <h3 className="text-base font-semibold text-[hsl(var(--fg))]">
                      Tamper-proof archive
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completed files are sealed with a timestamped audit trail inside
                    SELISE Signature.
                  </p>
                </li>
              </ul>

              {summary?.documentId && (
                <div className="mt-6 rounded-2xl border border-[hsl(var(--selise-blue))]/25 bg-[hsl(var(--selise-blue))]/5 p-5 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(var(--selise-blue))]">
                    Document ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[hsl(var(--oxford-blue))]">
                    {summary.documentId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[hsl(var(--bg))] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Badge className="mb-4 border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                What&apos;s next
              </Badge>
              <h2 className="text-3xl font-bold text-[hsl(var(--fg))]">
                Three quick actions to stay ahead
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Keep your workflow moving with SELISE Signature tools built for
                compliant, international hiring.
              </p>

              <div className="mt-8 space-y-4">
                {nextSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))]/40 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/15">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-[hsl(var(--fg))]">
                            {step.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--selise-blue))]">
                Why SELISE Signature
              </p>
              <h3 className="mt-3 text-2xl font-bold text-[hsl(var(--fg))]">
                Built for high-trust legal workflows
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Whether you hire locally or across borders, SELISE Signature
                keeps every agreement fast, compliant, and on-brand.
              </p>

              <div className="mt-6 space-y-4">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--selise-blue))]/15 text-[hsl(var(--selise-blue))]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--fg))]">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                asChild
                variant="outline"
                className="mt-8 w-full rounded-xl border-[hsl(var(--selise-blue))]/40 text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/10"
              >
                <Link
                  href="https://selise.app/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create a free SELISE Signature account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {hasSignatories && (
        <section className="border-b border-border bg-gradient-to-b from-[hsl(var(--bg))] to-[hsl(var(--gradient-light-to))] py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-3 border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]">
                  Signing order
                </Badge>
                <h2 className="text-3xl font-bold text-[hsl(var(--fg))]">
                  Here&apos;s who signs next
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invitations go out sequentially so every stakeholder knows
                  when it&apos;s their turn.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {signatories.map((signatory, index) => (
                <div
                  key={signatory.email ?? `${signatory.name}-${index}`}
                  className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-[hsl(var(--selise-blue))]/40 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--selise-blue))] text-lg font-bold text-white shadow-lg">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[hsl(var(--fg))]">
                      {signatory.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {signatory.email}
                    </p>
                    {signatory.role && (
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                      >
                        {signatory.role}
                      </Badge>
                    )}
                  </div>
                  <div className="hidden text-sm text-muted-foreground sm:block">
                    {signatory.order ? `Step ${signatory.order}` : 'Awaiting'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden border-t border-border bg-gradient-to-br from-[hsl(var(--gradient-mid-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] py-20 sm:py-24 text-white">
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.05]"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Badge className="mb-5 border-white/30 bg-white/10 text-white backdrop-blur-sm">
            Need support?
          </Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Lean on SELISE for rollout and compliance
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Our legal operations specialists help configure advanced workflows,
            align with regional regulations, and onboard your entire team.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl border border-white/70 bg-white px-8 text-base font-semibold text-[hsl(var(--selise-blue))] hover:bg-white/90 hover:shadow-xl"
            >
              <Link href="mailto:signature@selise.ch">Contact SELISE Signature</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-2 border-white px-8 text-base font-semibold text-white hover:bg-white/10"
            >
              <Link
                href="https://selisesignature.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore product guide
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
