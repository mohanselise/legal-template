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
import { SignaturePreviewDialog } from '@/components/signature-preview-dialog';

function ReviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [generatedDocument, setGeneratedDocument] = useState<EmploymentAgreement | null>(null);
  const [editedDocument, setEditedDocument] = useState<EmploymentAgreement | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isPreparingContract, setIsPreparingContract] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [preparedContractData, setPreparedContractData] = useState<{
    documentId: string;
    trackingId: string;
    fileId: string;
    title: string;
    signatories: Array<{ name: string; email: string; role: string; order: number }>;
  } | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<{
    fileId: string;
    accessToken: string;
  } | null>(null);

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
    // Open the signature dialog
    setIsSignatureDialogOpen(true);
    
    // Start background upload
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend) return;

    try {
      const uploadResponse = await fetch('/api/signature/upload-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToSend,
          formData,
        }),
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        setUploadedFileData({
          fileId: data.fileId,
          accessToken: data.accessToken,
        });
        console.log('✅ Document uploaded in background:', data.fileId);
      }
    } catch (error) {
      console.error('Background upload failed:', error);
      // Don't block the user, they can still proceed
    }
  };

  const handleSignatureSubmit = async (signatureData: SignatureFormData) => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToSend = editedDocument || generatedDocument;
    if (!documentToSend) return;

    setIsPreparingContract(true);

    try {
      // Step 1: Prepare contract (upload + create draft)
      const preparePayload: {
        document: typeof documentToSend;
        formData: typeof formData;
        signatories: Array<{
          name: string;
          email: string;
          title?: string;
          phone: string;
          role: string;
        }>;
        fileId?: string;
        accessToken?: string;
      } = {
        document: documentToSend,
        formData,
        signatories: [
          {
            name: signatureData.companyRepresentative.name,
            email: signatureData.companyRepresentative.email,
            title: signatureData.companyRepresentative.title,
            phone: '',
            role: 'Company Representative',
          },
          {
            name: documentToSend.parties.employee.legalName,
            email: signatureData.employee.email,
            phone: '',
            role: 'Employee',
          },
        ],
      };

      // If we already uploaded the file, include it
      if (uploadedFileData) {
        preparePayload.fileId = uploadedFileData.fileId;
        preparePayload.accessToken = uploadedFileData.accessToken;
      }

      const prepareResponse = await fetch('/api/signature/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || 'Failed to prepare contract');
      }

      const preparedData = await prepareResponse.json();

      // Close signature dialog and show preview
      setIsSignatureDialogOpen(false);
      setPreparedContractData(preparedData);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error preparing contract:', error);
      alert(error instanceof Error ? error.message : 'Failed to prepare document. Please try again.');
      throw error; // Re-throw so dialog knows submission failed
    } finally {
      setIsPreparingContract(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!preparedContractData) return;

    try {
      // Step 2: Rollout contract with signature fields
      const rolloutResponse = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: preparedContractData.documentId,
          fileId: preparedContractData.fileId,
          signatories: preparedContractData.signatories,
        }),
      });

      if (!rolloutResponse.ok) {
        const errorData = await rolloutResponse.json();
        throw new Error(errorData.error || 'Failed to send invitations');
      }

      // Close preview dialog and show success
      setIsPreviewDialogOpen(false);
      showSuccessModal(preparedContractData);
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invitations. Please try again.');
      throw error;
    }
  };

  const handleDownloadPdf = async () => {
    // Use edited document if available, otherwise fall back to generated document
    const documentToDownload = editedDocument || generatedDocument;
    if (!documentToDownload) return;

    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentToDownload, // Send the edited or original document
          formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const employeeName = documentToDownload.parties.employee.legalName.replace(/\s+/g, '_');
      a.download = `Employment_Agreement_${employeeName}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const showSuccessModal = (data: { trackingId: string }) => {
    // Create a beautiful modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-10 max-w-md mx-4 shadow-2xl border-2 border-[hsl(var(--border))] animate-slide-up">
        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-br from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="font-heading text-2xl font-bold text-[hsl(var(--fg))] mb-3">Invitations Sent!</h3>
          <p class="font-body text-[hsl(var(--brand-muted))] text-base leading-relaxed mb-6">
            Signature invitations have been sent to all parties via SELISE Signature.
          </p>
          <div class="bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] rounded-xl p-4 mb-6 text-left">
            <p class="font-body text-sm font-semibold text-[hsl(var(--brand-primary))] mb-2">Tracking ID:</p>
            <code class="font-body text-xs text-[hsl(var(--fg))] break-all">${data.trackingId}</code>
          </div>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/templates/employment-agreement';"
            class="w-full py-4 bg-[hsl(var(--brand-primary))] text-white rounded-xl font-bold text-base shadow-md hover:shadow-xl hover:bg-[hsl(222,89%,45%)] transition-all">
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))] overflow-hidden relative">
        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--brand-surface))_0%,_transparent_70%)]" />

        <div className="relative z-10 text-center space-y-8 px-6 max-w-2xl">
          {/* Animated icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(var(--brand-border))] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[hsl(var(--brand-primary))] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[hsl(var(--brand-primary))] animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[hsl(var(--fg))]">
              Crafting Your Agreement
            </h2>
            <p className="font-body text-base text-[hsl(var(--brand-muted))] max-w-xl mx-auto leading-relaxed">
              Our AI is generating a professional, legally-sound employment agreement tailored to your specifications. This usually takes 10-20 seconds.
            </p>
          </div>

          {/* Loading steps */}
          <div className="space-y-3 bg-white rounded-2xl p-6 border-2 border-[hsl(var(--border))] shadow-lg">
            {[
              'Analyzing your requirements',
              'Drafting core provisions',
              'Building protective clauses',
              'Finalizing document structure'
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-[hsl(var(--brand-muted))] text-sm font-medium"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
                }}
              >
                <div className="w-2 h-2 bg-[hsl(var(--brand-primary))] rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                <span className="font-body">{step}</span>
              </div>
            ))}
          </div>

          {/* Info */}
          <p className="font-body text-xs text-[hsl(var(--brand-muted))] italic">
            ⚖️ Employment agreements help protect both employer and employee by clearly defining expectations and obligations.
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
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Header - Clean and Professional */}
      <div className="bg-white border-b-2 border-[hsl(var(--brand-border))] shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] rounded-full text-[hsl(var(--brand-primary))] text-xs font-bold uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-3 h-3" />
                Document Ready
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[hsl(var(--fg))] mb-2 leading-tight">
                Review Your Employment Agreement
              </h1>
              <p className="font-body text-[hsl(var(--brand-muted))] text-base leading-relaxed max-w-2xl">
                Your professionally crafted legal document is ready. Review the details carefully before proceeding to signature.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div className="bg-white rounded-2xl shadow-xl border-2 border-[hsl(var(--border))] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[hsl(var(--brand-surface))] rounded-xl flex items-center justify-center border border-[hsl(var(--brand-border))]">
                    <Sparkles className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                  </div>
                  <h3 className="font-heading font-bold text-[hsl(var(--fg))] text-xl">
                    Next Steps
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Primary: Preview & Send to Signature */}
                  <button
                    onClick={handleSendToSignature}
                    disabled={isPreparingContract}
                    className="w-full flex items-center justify-center gap-3 bg-[hsl(var(--brand-primary))] text-white px-6 py-4 rounded-xl font-bold text-base shadow-md hover:shadow-xl hover:bg-[hsl(222,89%,45%)] transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Send via SELISE Signature</span>
                  </button>
                  <div className="bg-[hsl(var(--brand-surface))] border border-[hsl(var(--brand-border))] rounded-lg p-3">
                    <p className="text-xs text-center text-[hsl(var(--brand-primary))] font-semibold">
                      ✨ Recommended for fast, secure execution
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[hsl(var(--border))]"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-sm font-semibold text-[hsl(var(--brand-muted))]">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Secondary: Download */}
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full flex items-center justify-center gap-3 border-2 border-[hsl(var(--border))] text-[hsl(var(--fg))] px-6 py-4 rounded-xl font-bold text-base hover:bg-[hsl(var(--brand-surface))] hover:border-[hsl(var(--brand-border))] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    Download as PDF
                  </button>
                </div>
              </div>

              {/* Document Info */}
              {formData && (
                <div className="bg-white rounded-2xl shadow-xl border-2 border-[hsl(var(--border))] p-8">
                  <h3 className="font-heading font-bold text-[hsl(var(--fg))] text-lg mb-5 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[hsl(var(--brand-muted))]" />
                    Document Details
                  </h3>
                  <dl className="space-y-4 text-sm border-t border-[hsl(var(--border))] pt-5">
                    {Object.entries(formData).slice(0, 5).map(([key, value]: [string, any]) => (
                      <div key={key} className="pb-3 border-b border-[hsl(var(--border))] last:border-0">
                        <dt className="font-body text-[hsl(var(--brand-muted))] capitalize text-xs font-semibold uppercase tracking-wider mb-1.5">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-body font-semibold text-[hsl(var(--fg))]">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => window.location.href = '/templates/employment-agreement/generate'}
                    className="mt-6 w-full flex items-center justify-center gap-2 text-[hsl(var(--brand-primary))] hover:text-[hsl(222,89%,45%)] font-bold text-sm py-3 hover:bg-[hsl(var(--brand-surface))] rounded-xl transition-colors"
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
        <>
          <SignatureDialog
            open={isSignatureDialogOpen}
            onOpenChange={setIsSignatureDialogOpen}
            employeeName={generatedDocument.parties.employee.legalName}
            companyName={generatedDocument.parties.employer.legalName}
            onSubmit={handleSignatureSubmit}
            isSubmitting={isPreparingContract}
          />

          {preparedContractData && (
            <SignaturePreviewDialog
              open={isPreviewDialogOpen}
              onOpenChange={setIsPreviewDialogOpen}
              documentId={preparedContractData.documentId}
              fileId={preparedContractData.fileId}
              trackingId={preparedContractData.trackingId}
              title={preparedContractData.title}
              signatories={preparedContractData.signatories}
              onConfirmSend={handleConfirmSend}
            />
          )}
        </>
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
