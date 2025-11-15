'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PDFSignatureEditor } from '@/components/pdf-signature-editor';
import { Loader2 } from 'lucide-react';

interface SignatoryData {
  party: 'employer' | 'employee';
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface SignatureFieldMetadata {
  id: string;
  type: 'signature' | 'text' | 'date';
  party: 'employer' | 'employee';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

interface SignatureField {
  id: string;
  type: 'signature' | 'text' | 'date';
  signatoryIndex: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export default function SignatureEditorPage() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatories, setSignatories] = useState<SignatoryData[]>([]);
  const [initialFields, setInitialFields] = useState<SignatureField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get PDF from sessionStorage
      const pdfBase64 = sessionStorage.getItem('signature-editor-pdf');
      const dataStr = sessionStorage.getItem('signature-editor-data');
      const fieldsStr = sessionStorage.getItem('signature-field-metadata');

      if (!pdfBase64) {
        throw new Error('No PDF data found. Please generate the document first.');
      }

      if (!dataStr) {
        throw new Error('No document data found.');
      }

      // Convert base64 to blob URL
      const binary = atob(pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Parse document data to extract signatories
      const data = JSON.parse(dataStr);
      const formData = data.formData;
      const document = data.document;

      // Build signatories list with distinct order
      const signatoriesList: SignatoryData[] = [
        {
          party: 'employer',
          name: formData.companyRepName || document.parties?.employer?.legalName || 'Company Representative',
          email: formData.companyRepEmail || document.parties?.employer?.email || '',
          role: formData.companyRepTitle || 'Authorized Signatory',
          phone: formData.companyRepPhone,
        },
        {
          party: 'employee',
          name: formData.employeeName || document.parties?.employee?.legalName || 'Employee',
          email: formData.employeeEmail || document.parties?.employee?.email || '',
          role: formData.jobTitle || 'Employee',
          phone: formData.employeePhone,
        },
      ];

      setSignatories(signatoriesList);

      // Parse signature field metadata if available and convert to SignatureField format
      if (fieldsStr) {
        try {
          const metadata: SignatureFieldMetadata[] = JSON.parse(fieldsStr);
          // Convert metadata to editor format
          const convertedFields: SignatureField[] = metadata.map(field => ({
            id: field.id || `field-${Date.now()}-${Math.random()}`,
            type: field.type,
            signatoryIndex: field.party === 'employer' ? 0 : 1,
            pageNumber: field.pageNumber,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            label: field.label,
          }));
          setInitialFields(convertedFields);
        } catch (e) {
          console.warn('Could not parse signature field metadata:', e);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading signature editor:', err);
      setError(err instanceof Error ? err.message : 'Failed to load signature editor');
      setIsLoading(false);
    }

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const handleConfirm = async (fields: any[]) => {
    try {
      // Get the stored data
      const dataStr = sessionStorage.getItem('signature-editor-data');
      if (!dataStr) {
        throw new Error('Document data not found');
      }

      const data = JSON.parse(dataStr);

      // Call rollout API with signature fields
      const response = await fetch('/api/signature/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: data.document,
          formData: data.formData,
          signatureFields: fields,
          signatories,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send for signature');
      }

      const result = await response.json();
      console.log('✅ Signature request sent:', result);

      // Clear session storage
      sessionStorage.removeItem('signature-editor-pdf');
      sessionStorage.removeItem('signature-editor-data');
      sessionStorage.removeItem('signature-field-metadata');

      // Show success and redirect
      alert('✅ Signature request sent successfully!');
      router.push('/templates/employment-agreement/generate/review');
    } catch (error) {
      console.error('Error sending signature request:', error);
      alert(error instanceof Error ? error.message : 'Failed to send signature request');
    }
  };

  const handleCancel = () => {
    // Clear session storage
    sessionStorage.removeItem('signature-editor-pdf');
    sessionStorage.removeItem('signature-editor-data');
    sessionStorage.removeItem('signature-field-metadata');

    router.push('/templates/employment-agreement/generate/review');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading signature editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <p className="font-semibold text-lg mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => router.push('/templates/employment-agreement/generate/review')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden">
      <PDFSignatureEditor
        pdfUrl={pdfUrl}
        signatories={signatories.map((sig, index) => ({
          name: sig.name,
          email: sig.email,
          role: sig.role,
          order: index,
        }))}
        initialFields={initialFields}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
