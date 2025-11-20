'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Sparkles,
  Mountain,
  Award,
  Lock,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  // 1. Retrieve Data from Session Storage
  const payload = useMemo<PayloadSummary | null>(() => {
    if (typeof window === 'undefined') return null;
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
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem('signature-last-result');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SignatureSummary;
    } catch (error) {
      console.warn('Unable to parse signature result cache', error);
      return null;
    }
  }, []);

  // Clear session storage on mount to prevent stale data if they navigate back
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // We'll keep it for a moment just in case they refresh immediately, but ideally we clear it.
      // For this flow, let's clear it to ensure security.
      // window.sessionStorage.removeItem('signature-last-payload');
      // window.sessionStorage.removeItem('signature-last-result');
    }
  }, []);

  const employeeName: string =
    (payload?.document?.parties?.employee?.legalName as string) ||
    (payload?.formData?.employeeName as string) ||
    'the employee';

  const signatories = payload?.signatories
    ? [...payload.signatories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))] flex flex-col font-body">
      {/* 2. Top Navigation / Branding */}
      <header className="w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[hsl(var(--selise-blue))] rounded-lg flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-[hsl(var(--selise-blue))]">
              SELISE Signature
            </span>
          </div>
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-[hsl(var(--selise-blue))]">
            <Link href="/templates/employment-agreement/generate">
              Create Another
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* 3. Left Column: Success State & Document Info */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Success Badge & Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-[hsl(var(--success))] text-sm font-medium">
                <CheckCircle2 size={16} />
                <span>Document Sent Successfully</span>
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[hsl(var(--fg))] leading-tight">
                Employment agreement for <span className="text-[hsl(var(--selise-blue))]">{employeeName}</span> is on its way.
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                We&apos;ve securely emailed the document to all parties. They can review and sign directly from their device.
              </p>
            </div>

            {/* Document Timeline / Signatories */}
            <Card className="border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CardHeader className="bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))] py-4">
                <CardTitle className="font-subheading text-base flex items-center gap-2">
                  <Clock className="text-[hsl(var(--selise-blue))]" size={16} />
                  Signing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[hsl(var(--border))]">
                  {signatories.map((signatory, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{signatory.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{signatory.email}</p>
                      </div>
                      <Badge variant="secondary" className="bg-[hsl(var(--globe-grey))]/10 text-[hsl(var(--globe-grey))]">
                        Waiting
                      </Badge>
                    </div>
                  ))}
                  {signatories.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No signatories found in payload.
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 p-4 text-xs text-muted-foreground flex items-center justify-between border-t border-[hsl(var(--border))]">
                  <span>Tracking ID: <span className="font-mono">{summary?.trackingId || '---'}</span></span>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Audit Log Active
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="font-subheading font-semibold text-lg">What happens next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <Mail className="text-[hsl(var(--selise-blue))]" size={20} />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1">Email Delivery</span>
                    All parties receive a secure link to sign the document.
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <FileText className="text-[hsl(var(--selise-blue))]" size={20} />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1">Final Copy</span>
                    Everyone gets a PDF copy once all signatures are collected.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Right Column: Signup Conversion Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <div className="relative">
                <Card className="relative border-[hsl(var(--selise-blue))]/30 shadow-xl overflow-hidden bg-white dark:bg-[hsl(var(--card))]">
                  {/* Header with Light Gradient */}
                  <div className="bg-gradient-to-br from-[hsl(var(--selise-blue))]/10 to-[hsl(var(--sky-blue))]/10 p-8 text-center border-b border-[hsl(var(--selise-blue))]/10">
                    <div className="mx-auto h-12 w-12 bg-[hsl(var(--selise-blue))] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[hsl(var(--selise-blue))]/20">
                      <Sparkles className="text-white h-6 w-6" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold mb-2 text-[hsl(var(--selise-blue))]">
                      Free Signature Management
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Create a free account to track this agreement and manage your contracts in one place.
                    </p>
                  </div>

                  <CardContent className="p-8 space-y-6">
                    
                    {/* Value Props List */}
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-[hsl(var(--selise-blue))]/10 mt-0.5">
                          <LayoutDashboard className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm block text-[hsl(var(--fg))]">Real-time Tracking</span>
                          <span className="text-xs text-muted-foreground">See when {employeeName} opens and signs.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-[hsl(var(--selise-blue))]/10 mt-0.5">
                          <Clock className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm block text-[hsl(var(--fg))]">Auto-Reminders</span>
                          <span className="text-xs text-muted-foreground">We&apos;ll nudge signers so you don&apos;t have to.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-[hsl(var(--selise-blue))]/10 mt-0.5">
                          <Scale className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm block text-[hsl(var(--fg))]">Legally Compliant</span>
                          <span className="text-xs text-muted-foreground">Bank-grade security for all signatories.</span>
                        </div>
                      </li>
                    </ul>

                    <Separator className="bg-[hsl(var(--border))]" />

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                      <Button 
                        asChild 
                        className="w-full h-12 text-base font-subheading font-semibold bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Link href="https://selise.app/signup" target="_blank" rel="noopener noreferrer">
                          Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Free forever • No credit card required
                      </p>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 space-y-4">
                <p className="text-xs text-center font-semibold uppercase tracking-widest text-muted-foreground">Trusted for legal compliance</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Mountain className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                    <span className="text-xs font-medium text-muted-foreground">Swiss Hosted</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Award className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                    <span className="text-xs font-medium text-muted-foreground">eIDAS Compliant</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Lock className="h-5 w-5 text-[hsl(var(--globe-grey))]" />
                    <span className="text-xs font-medium text-muted-foreground">ISO 27001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
