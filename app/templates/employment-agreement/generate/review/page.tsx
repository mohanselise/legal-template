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
import { SignatureDialog, type SignatureFormData } from '@/components/signature-dialog';

function ReviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [generatedDocument, setGeneratedDocument] = useState<EmploymentAgreement | null>(null);
  const [editedDocument, setEditedDocument] = useState<EmploymentAgreement | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

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

  const handleSendToSignature = () => {
    // Open the signature dialog
    setIsSignatureDialogOpen(true);
  };

  const handleSignatureSubmit = async (signatureData: SignatureFormData) => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend) return;

    try {
      const response = await fetch('/api/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend,
          formData,
          signatories: [
            {
              name: signatureData.companyRepresentative.name,
              email: signatureData.companyRepresentative.email,
              title: signatureData.companyRepresentative.title,
              role: 'Company Representative',
            },
            {
              name: documentToSend.parties.employee.legalName,
              email: signatureData.employee.email,
              role: 'Employee',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send to signature');
      }

      const data = await response.json();

      // Close dialog and show success modal
      setIsSignatureDialogOpen(false);
      showSuccessModal(data);
    } catch (error) {
      console.error('Error sending to signature:', error);
      alert(error instanceof Error ? error.message : 'Failed to send document. Please try again.');
      throw error; // Re-throw so dialog knows submission failed
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
    // Create a beautiful modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-slide-up">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Your employment agreement has been sent via SELISE Signature.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
            <p class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Tracking ID:</p>
            <code class="text-xs text-blue-700 dark:text-blue-300">${data.trackingId}</code>
          </div>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/templates/employment-agreement';"
            class="w-full py-3 bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-white rounded-lg font-semibold hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-to))] transition-all">
            Done
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Clear saved data
    localStorage.removeItem('employment-agreement-conversation');
    clearEmploymentAgreementReview();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a
            href="/templates/employment-agreement/generate"
            className="text-[hsl(var(--brand-primary))] hover:underline"
          >
            Go back and try again
          </a>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--oxford-blue))] to-[hsl(var(--gradient-dark-to))] overflow-hidden relative">
        {/* Animated background gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(var(--sky-blue))]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(var(--selise-blue))]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--light-blue))]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 text-center space-y-8 px-6 max-w-2xl">
          {/* Animated icon */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(var(--sky-blue))]/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--selise-blue))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-[hsl(var(--light-blue))]/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-[hsl(var(--sky-blue))] animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Crafting Your Agreement
            </h2>
            <p className="text-lg text-[hsl(var(--light-blue))]/90 max-w-xl mx-auto leading-relaxed">
              Our AI is generating a professional, legally-sound employment agreement tailored to your specifications. This usually takes 10-20 seconds.
            </p>
          </div>

          {/* Loading steps */}
          <div className="space-y-3 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            {[
              'Analyzing your requirements',
              'Drafting core provisions',
              'Building protective clauses',
              'Finalizing document structure'
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-[hsl(var(--light-blue))]/80 text-sm"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
                }}
              >
                <div className="w-1.5 h-1.5 bg-[hsl(var(--sky-blue))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Fun fact */}
          <p className="text-xs text-[hsl(var(--sky-blue))]/60 italic">
            ⚖️ Did you know? Employment agreements help protect both employer and employee by clearly defining expectations and obligations.
          </p>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--gradient-dark-from))] via-[hsl(var(--oxford-blue))] to-[hsl(var(--gradient-dark-to))] text-white shadow-2xl">
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] rounded-2xl flex items-center justify-center shadow-lg shadow-[hsl(var(--lime-green))]/30">
              <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-[hsl(var(--lime-green))]/20 border border-[hsl(var(--lime-green))]/30 rounded-full text-[hsl(var(--lime-green))] text-xs font-semibold uppercase tracking-wider mb-3">
                Document Ready
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                Your Employment Agreement is Ready
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                A professionally crafted legal document tailored to your specifications. Review carefully before proceeding to signature.
              </p>
            </div>
          </div>
        </div>
      </div>

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
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-gray-100 text-lg">
                    Next Steps
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Primary: Send to Signature */}
                  <button
                    onClick={handleSendToSignature}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] via-[hsl(var(--selise-blue))] to-[hsl(var(--gradient-mid-to))] text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-[hsl(var(--selise-blue))] hover:via-[hsl(var(--gradient-dark-from))] hover:to-[hsl(var(--gradient-dark-to))] transition-all duration-200 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <span className="relative z-10">Send via SELISE Signature</span>
                  </button>
                  <div className="bg-[hsl(var(--selise-blue))]/10 dark:bg-[hsl(var(--selise-blue))]/20 border border-[hsl(var(--selise-blue))]/30 dark:border-[hsl(var(--selise-blue))]/40 rounded-lg p-3">
                    <p className="text-xs text-center text-[hsl(var(--selise-blue))] dark:text-[hsl(var(--sky-blue))] font-medium">
                      ✨ Recommended for fast, secure execution
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-slate-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-gray-800 px-4 text-sm font-semibold text-slate-500 dark:text-gray-400">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Secondary: Download */}
                  <button
                    onClick={handleDownloadDocx}
                    className="w-full flex items-center justify-center gap-3 border-2 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-gray-100 px-6 py-4 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-slate-400 dark:hover:border-gray-500 transition-all duration-200 group"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    Download as DOCX
                  </button>
                </div>
              </div>

              {/* Document Info */}
              {formData && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 p-8">
                  <h3 className="font-bold text-slate-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    Document Details
                  </h3>
                  <dl className="space-y-4 text-sm border-t border-slate-200 dark:border-gray-700 pt-5">
                    {Object.entries(formData).slice(0, 5).map(([key, value]: [string, any]) => (
                      <div key={key} className="pb-3 border-b border-slate-100 dark:border-gray-800 last:border-0">
                        <dt className="text-slate-500 dark:text-gray-500 capitalize text-xs font-semibold uppercase tracking-wider mb-1.5">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-semibold text-slate-900 dark:text-gray-100">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => window.location.href = '/templates/employment-agreement/generate'}
                    className="mt-6 w-full flex items-center justify-center gap-2 text-[hsl(var(--selise-blue))] dark:text-[hsl(var(--sky-blue))] hover:text-[hsl(var(--gradient-dark-from))] dark:hover:text-[hsl(var(--light-blue))] font-semibold text-sm py-2 hover:bg-[hsl(var(--selise-blue))]/10 dark:hover:bg-[hsl(var(--selise-blue))]/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Start Over
                  </button>
                </div>
              )}

              {/* Comprehensive Legal Disclaimer */}
              <LegalDisclaimer className="shadow-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      {generatedDocument && (
        <SignatureDialog
          open={isSignatureDialogOpen}
          onOpenChange={setIsSignatureDialogOpen}
          employeeName={generatedDocument.parties.employee.legalName}
          companyName={generatedDocument.parties.employer.legalName}
          onSubmit={handleSignatureSubmit}
        />
      )}

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
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--brand-primary))]" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
