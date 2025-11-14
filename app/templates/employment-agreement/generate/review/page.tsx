'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActionButtons } from '../_components/ActionButtons';
import { EditableDocumentRenderer } from '../_components/EditableDocumentRenderer';
import { Loader2, CheckCircle2, Edit, Download, Send, Sparkles, FileText } from 'lucide-react';
import type { EmploymentAgreement } from '@/app/api/templates/employment-agreement/schema';
import {
  clearEmploymentAgreementReview,
  loadEmploymentAgreementReview,
} from '../reviewStorage';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function ReviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [generatedDocument, setGeneratedDocument] = useState<EmploymentAgreement | null>(null);
  const [editedDocument, setEditedDocument] = useState<EmploymentAgreement | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionPayload = loadEmploymentAgreementReview();
    const hasSessionDocument = Boolean(sessionPayload?.document);

    if (hasSessionDocument) {
      setGeneratedDocument(sessionPayload!.document);
      setEditedDocument(sessionPayload!.document);
      setFormData(sessionPayload!.formData);
      setIsGenerating(false);
      setError(null);
    }

    const docParam = searchParams.get('document');
    const dataParam = searchParams.get('data');

    if (!hasSessionDocument && docParam) {
      try {
        const parsedDocument = JSON.parse(docParam);
        setGeneratedDocument(parsedDocument);
        setEditedDocument(parsedDocument);
        setIsGenerating(false);
        setError(null);
        console.log('✅ Document parsed successfully:', parsedDocument);
      } catch (err) {
        console.error('❌ Failed to parse document JSON:', err);
        setError('Failed to load document. Please try generating again.');
        setIsGenerating(false);
      }
    } else if (!hasSessionDocument && !docParam) {
      setIsGenerating(false);
      setError('We could not load your generated document. Please try generating again.');
    }

    if ((!sessionPayload || !sessionPayload.formData) && dataParam) {
      let dataContent = dataParam;
      try {
        dataContent = decodeURIComponent(dataParam);
      } catch (err) {
        dataContent = dataParam;
      }

      try {
        const parsed = JSON.parse(dataContent);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse form data');
      }
    }
  }, [searchParams]);

  const handleDocumentChange = (updatedDocument: EmploymentAgreement) => {
    setEditedDocument(updatedDocument);
  };

  const handleSendToSignature = async () => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend) return;

    try {
      const response = await fetch('/api/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend, // Send the edited or original document
          formData,
          signatories: [
            {
              name: documentToSend.parties.employee.legalName,
              email: documentToSend.parties.employee.email || 'employee@company.com',
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to send to signature');

      const data = await response.json();
      showSuccessModal(data);
    } catch (error) {
      console.error('Error sending to signature:', error);
      alert('Failed to send document. Please try again.');
    }
  };

  const handleDownloadDocx = async () => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToDownload = editedDocument || generatedDocument;
    if (!documentToDownload) return;

    try {
      const response = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToDownload, // Send the edited or original document
          formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const employeeName = documentToDownload.parties.employee.legalName.replace(/\s+/g, '_');
      a.download = `Employment_Agreement_${employeeName}_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const showSuccessModal = (data: any) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-[hsl(var(--eerie-black))]/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4';
    modal.innerHTML = `
      <div class="bg-background rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up border border-border">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] rounded-2xl flex items-center justify-center shadow-lg shadow-[hsl(var(--lime-green))]/30">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h3 class="text-2xl font-bold text-foreground mb-3">Successfully Sent!</h3>

          <p class="text-muted-foreground mb-6 leading-relaxed">
            Your employment agreement has been sent via SELISE Signature for execution.
          </p>

          <div class="bg-[hsl(var(--selise-blue))]/8 border border-[hsl(var(--selise-blue))]/20 rounded-xl p-4 mb-6 text-left">
            <p class="text-sm font-semibold text-[hsl(var(--selise-blue))] mb-2">Tracking ID</p>
            <code class="text-xs text-foreground font-mono break-all">${data.trackingId}</code>
          </div>

          <button
            onclick="this.closest('.fixed').remove(); window.location.href='/templates/employment-agreement';"
            class="w-full py-3.5 bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-from))] transition-all">
            Done
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    localStorage.removeItem('employment-agreement-conversation');
    clearEmploymentAgreementReview();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[hsl(var(--destructive))]/10 border-2 border-[hsl(var(--destructive))]/30 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[hsl(var(--destructive))]" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            Unable to Load Document
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {error}
          </p>

          <Button asChild size="lg" className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-white shadow-md">
            <a href="/templates/employment-agreement/generate" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go back and try again
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--oxford-blue))] to-[hsl(var(--gradient-dark-to))] overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(var(--sky-blue))]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(var(--selise-blue))]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 text-center space-y-8 px-6 max-w-2xl">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(var(--sky-blue))]/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-[hsl(var(--sky-blue))] animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Crafting Your Agreement
            </h2>
            <p className="text-lg text-[hsl(var(--light-blue))]/90 max-w-xl mx-auto leading-relaxed">
              Our AI is generating a professional, legally-sound employment agreement tailored to your specifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-dark-to))] text-white">
        {/* Background texture */}
        <div className="absolute inset-0">
          <Image
            src="/graphics/bg-black-texture.webp"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
          />
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[hsl(var(--sky-blue))]/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[hsl(var(--light-blue))]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Success Icon */}
            <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] rounded-2xl flex items-center justify-center shadow-2xl shadow-[hsl(var(--lime-green))]/30">
              <CheckCircle2 className="w-9 h-9 md:w-11 md:h-11 text-white" strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Success Badge */}
              <div className="mb-4">
                <Badge className="bg-[hsl(var(--lime-green))]/20 text-white border-[hsl(var(--lime-green))]/40 font-subheading uppercase tracking-[0.12em]" variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Document Ready
                </Badge>
              </div>

              {/* Heading */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                Your Employment Agreement is Ready
              </h1>

              {/* Description */}
              <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-3xl">
                A professionally crafted legal document tailored to your specifications. Review carefully before proceeding to signature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Document Preview - Takes up 2 columns */}
          <div className="lg:col-span-2">
            {generatedDocument && (
              <EditableDocumentRenderer
                document={generatedDocument}
                onDocumentChange={handleDocumentChange}
                isEditable={true}
              />
            )}
          </div>

            {/* Actions Sidebar */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="sticky top-8 space-y-6">
                {/* Quick Actions Card */}
                <Card className="shadow-lg border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-xl flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-xl">Next Steps</CardTitle>
                    </div>
                    <CardDescription>
                      Choose how you'd like to proceed with your document
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Primary Action: Send to Signature */}
                    <Button
                      onClick={handleSendToSignature}
                      size="lg"
                      className="w-full bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-from))] text-white shadow-lg h-auto py-4 group"
                    >
                      <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                      Send via SELISE Signature
                    </Button>

                    {/* Recommendation Badge */}
                    <div className="bg-[hsl(var(--selise-blue))]/8 border border-[hsl(var(--selise-blue))]/20 rounded-lg p-3">
                      <p className="text-xs text-center text-[hsl(var(--selise-blue))] font-medium">
                        <Star className="inline w-3 h-3 mr-1 fill-current" />
                        Recommended for fast, secure execution
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm font-semibold text-muted-foreground">
                        OR
                      </span>
                    </div>

                    {/* Secondary Action: Download */}
                    <Button
                      onClick={handleDownloadDocx}
                      variant="outline"
                      size="lg"
                      className="w-full border-2 h-auto py-4 group"
                    >
                      <Download className="w-5 h-5 mr-2 text-[hsl(var(--selise-blue))] group-hover:translate-y-0.5 transition-transform" />
                      Download as DOCX
                    </Button>
                  </CardContent>
                </Card>

                {/* Document Info Card */}
                {formData && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[hsl(var(--selise-blue))]" />
                        Document Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4 text-sm">
                        {Object.entries(formData).slice(0, 5).map(([key, value]: [string, any]) => (
                          <div key={key} className="pb-3 border-b border-border last:border-0">
                            <dt className="text-muted-foreground capitalize text-xs font-semibold uppercase tracking-wider mb-1.5">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </dt>
                            <dd className="font-semibold text-foreground">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <Separator className="my-4" />
                      <Button
                        variant="ghost"
                        onClick={() => window.location.href = '/templates/employment-agreement/generate'}
                        className="w-full justify-center text-[hsl(var(--selise-blue))] hover:text-[hsl(var(--gradient-dark-from))] hover:bg-[hsl(var(--selise-blue))]/8"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Start Over
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Legal Disclaimer */}
                <LegalDisclaimer className="shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function ReviewPageV2() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--selise-blue))]" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
