'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActionButtons } from '../_components/ActionButtons';
import { DocumentRenderer } from '../_components/DocumentRenderer';
import { Loader2, CheckCircle2, Edit, Download, Send, Sparkles } from 'lucide-react';

function ReviewContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get document from URL params
    const docParam = searchParams.get('document');
    const dataParam = searchParams.get('data');

    if (docParam) {
      setGeneratedDocument(decodeURIComponent(docParam));
      setIsGenerating(false);
    }

    if (dataParam) {
      try {
        const parsed = JSON.parse(dataParam);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse form data');
      }
    }
  }, [searchParams]);

  const handleSendToSignature = async () => {
    try {
      const response = await fetch('/api/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument,
          formData,
          signatories: [
            {
              name: formData?.employeeName || 'Employee',
              email: formData?.employeeEmail || 'employee@company.com',
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to send to signature');

      const data = await response.json();

      // Show beautiful success modal
      showSuccessModal(data);
    } catch (error) {
      console.error('Error sending to signature:', error);
      alert('Failed to send document. Please try again.');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument,
          formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Employment_Agreement_${Date.now()}.docx`;
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
            class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
            Done
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Clear saved data
    localStorage.removeItem('employment-agreement-conversation');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center space-y-6 animate-pulse">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-10 h-10 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-3xl font-bold text-[hsl(var(--fg))]">Crafting Your Agreement</h2>
          <p className="text-[hsl(var(--brand-muted))] max-w-md mx-auto">
            Our AI is generating a professional, legally-sound employment agreement tailored to your needs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Your Agreement is Ready!</h1>
              <p className="text-blue-100 mt-1">Review and send for signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <DocumentRenderer document={generatedDocument} />
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-[hsl(var(--fg))] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  {/* Primary: Send to Signature */}
                  <button
                    onClick={handleSendToSignature}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all group"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Send via SELISE Signature
                  </button>
                  <p className="text-xs text-center text-[hsl(var(--brand-muted))]">
                    ✨ Recommended - Electronic signature workflow
                  </p>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-gray-800 px-2 text-xs text-[hsl(var(--brand-muted))]">
                        or
                      </span>
                    </div>
                  </div>

                  {/* Secondary: Download */}
                  <button
                    onClick={handleDownloadDocx}
                    className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 text-[hsl(var(--fg))] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download as DOCX
                  </button>
                </div>
              </div>

              {/* Document Info */}
              {formData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-[hsl(var(--fg))] mb-4">Document Summary</h3>
                  <dl className="space-y-3 text-sm">
                    {Object.entries(formData).slice(0, 5).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <dt className="text-[hsl(var(--brand-muted))] capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </dt>
                        <dd className="font-medium text-[hsl(var(--fg))] mt-1">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => window.location.href = '/templates/employment-agreement/generate'}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[hsl(var(--brand-primary))] hover:underline text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Start Over
                  </button>
                </div>
              )}

              {/* Legal Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚖️ Legal Notice:</strong> This AI-generated document should be reviewed by a qualified
                  attorney before use. Employment laws vary by jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
