import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, ShieldCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Terms of Service | Legal Template Generator",
    description: "Terms of Service for legal-templates.com. Read our terms and conditions for using the AI-powered legal document automation platform.",
    openGraph: {
      title: "Terms of Service | Legal Template Generator",
      description: "Terms of Service for legal-templates.com",
      type: 'website',
    },
  };
}

export default async function TermsOfServicePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-[hsl(var(--selise-blue))]/15 dark:via-transparent dark:to-[hsl(var(--oxford-blue))]/30" />
        <div className="absolute left-[-8%] top-16 h-60 w-60 rounded-full bg-[hsl(var(--selise-blue))]/10 blur-3xl dark:bg-[hsl(var(--sky-blue))]/22" />
        <div className="absolute right-[-12%] bottom-[-8%] h-72 w-72 rounded-full bg-[hsl(var(--sky-blue))]/12 blur-3xl dark:bg-[hsl(var(--selise-blue))]/25" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-28 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20">
              Legal Terms
            </Badge>
            <Badge variant="secondary" className="font-subheading uppercase tracking-[0.12em] bg-[hsl(var(--brand-surface-strong))]/20 text-[hsl(var(--selise-blue))] border-[hsl(var(--brand-border))]/40">
              Last Updated: January 7, 2026
            </Badge>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Terms of Service
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
              Please read these terms carefully before using our service. These terms contain a binding arbitration provision and a waiver of class action rights.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="mb-8 rounded-lg border-2 border-[hsl(var(--crimson))]/20 bg-[hsl(var(--crimson))]/5 p-6">
              <p className="font-semibold text-[hsl(var(--crimson))] mb-2">
                IMPORTANT NOTICE: THESE TERMS CONTAIN A BINDING ARBITRATION PROVISION AND A WAIVER OF CLASS ACTION RIGHTS. PLEASE READ THEM CAREFULLY.
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">1. Introduction and Acceptance</h2>
                <p className="text-base leading-relaxed text-muted-foreground mb-4">
                  Welcome to legal-templates.com ("the Service"), a platform operated by SELISE GROUP AG ("Company", "we", "us"), located at The Circle 37, 8058 Zürich-Flughafen, Zürich, Switzerland.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  By clicking "Generate," "Draft," or accessing our platform, you ("User") agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">2. Nature of the Service (The "Self-Help" Tool)</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.1. Not Legal Advice.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      The Service is an AI-powered document automation tool. We are not a law firm, and we do not provide legal advice. The Service acts solely as a "scrivener" (scribe) to assist you in drafting documents based on your specific instructions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.2. User as "Driver".</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      You acknowledge that you are the primary author and editor of any document generated. The Artificial Intelligence (AI) provides a preliminary draft only. You retain full control to edit, reject, or modify any text.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.3. No Attorney-Client Relationship.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Use of the Service does not create an attorney-client relationship between you and SELISE GROUP AG. Your communications with us are not protected by attorney-client privilege.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">3. Artificial Intelligence & Accuracy</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">3.1. Use of LLMs.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      The Service utilizes Large Language Models (LLMs), including Google Gemini via OpenRouter, to generate text. You acknowledge that these technologies are probabilistic and may generate "hallucinations" (plausible-sounding but factually incorrect information).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">3.2. Mandatory Verification.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      You agree to independently verify the accuracy, legality, and suitability of any Output before signing or using it. The Company makes no warranty that the generated documents are compliant with the specific laws of your jurisdiction.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">4. Data Privacy & Transient Processing</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.1. Zero Permanent Storage.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      We operate a Transient Data Architecture. We do not retain the sensitive content of your contracts on our servers after your session ends. Once you close the browser or complete the session, your input data is discarded from our active memory.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.2. Third-Party Processing.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      To generate your document, your inputs are transmitted via secure, encrypted APIs to our third-party processors: OpenRouter (USA) and Google (USA).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.3. Abuse Monitoring (Safety Logs).</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      While we do not store your data, you acknowledge that our third-party AI providers may temporarily retain anonymized logs of inputs for up to 55 days solely for the purpose of safety and abuse monitoring (e.g., preventing hate speech or illegal content). By using the Service, you consent to this limited retention by our sub-processors.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.4. No Training on Data.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      We configure our API connections to opt-out of model training. Your data is not used to train the AI models for the general public.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">5. Intellectual Property</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">5.1. Ownership of Output.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Subject to your compliance with these Terms, the Company assigns to you all right, title, and interest in the specific legal document generated by you using the Service (the "Output").
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">5.2. Ownership of Platform.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      The Company retains all rights to the underlying software, algorithms, UI design, and methodology used to provide the Service.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">6. Disclaimers and Limitation of Liability</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">6.1. "AS IS" Warranty.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT PERMITTED BY SWISS LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">6.2. Limitation of Liability.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      IN NO EVENT SHALL SELISE GROUP AG BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF PROFITS OR LEGAL DISPUTES) ARISING FROM YOUR USE OF THE GENERATED DOCUMENTS. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE OR CHF 100.00, WHICHEVER IS GREATER.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">7. Governing Law and Jurisdiction</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">7.1. Governing Law.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      These Terms shall be governed by the substantive laws of Switzerland, excluding the United Nations Convention on Contracts for the International Sale of Goods (CISG).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">7.2. Jurisdiction.</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the ordinary courts of the Canton of Zürich, Switzerland, except where mandatory consumer protection laws require otherwise.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">8. US Residents: Class Action Waiver</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  If you are accessing the Service from the United States, you agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--selise-blue))]">9. Contact Us</h2>
                <p className="text-base leading-relaxed text-muted-foreground mb-2">
                  For legal notices or questions regarding these Terms:
                </p>
                <div className="text-base leading-relaxed text-muted-foreground space-y-1">
                  <p className="font-semibold">SELISE GROUP AG</p>
                  <p>The Circle 37</p>
                  <p>8058 Zürich-Flughafen</p>
                  <p>Switzerland</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--brand-surface))]/10">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Badge className="mx-auto bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/20 uppercase tracking-[0.12em] font-subheading">
              Questions?
            </Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">We're here to help</h2>
            <p className="text-lg text-muted-foreground">
              If you have questions about these terms or need clarification, please contact us.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))] px-7 py-5 h-auto">
                <Link href="/templates">
                  Browse Templates
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

