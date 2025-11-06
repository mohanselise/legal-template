'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employmentAgreementSchema, defaultValues, EmploymentAgreementFormData } from '../schema';
import { StepBasicInfo } from './StepBasicInfo';
import { StepCompensation } from './StepCompensation';
import { StepWorkTerms } from './StepWorkTerms';
import { StepLegalTerms } from './StepLegalTerms';
import { PreviewPanel } from './PreviewPanel';
import { ActionButtons } from './ActionButtons';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Basic Info', component: StepBasicInfo },
  { id: 2, name: 'Compensation', component: StepCompensation },
  { id: 3, name: 'Work Terms', component: StepWorkTerms },
  { id: 4, name: 'Legal Terms', component: StepLegalTerms },
  { id: 5, name: 'Review', component: null },
];

const STORAGE_KEY = 'employment-agreement-draft';

export function FormWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<EmploymentAgreementFormData>({
    resolver: zodResolver(employmentAgreementSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, watch, trigger } = form;
  const formData = watch();

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
  }, [form]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    return await trigger(fieldsToValidate as any);
  };

  const getFieldsForStep = (step: number): (keyof EmploymentAgreementFormData)[] => {
    switch (step) {
      case 1:
        return [
          'companyName',
          'companyAddress',
          'companyState',
          'companyCountry',
          'employeeName',
          'employeeAddress',
          'employeeEmail',
          'jobTitle',
          'startDate',
          'employmentType',
        ];
      case 2:
        return ['salaryAmount', 'salaryCurrency', 'salaryPeriod'];
      case 3:
        return ['workLocation', 'workArrangement', 'workHoursPerWeek'];
      case 4:
        return ['disputeResolution', 'governingLaw'];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep === STEPS.length - 1) {
        // Generate document on reaching review step
        await generateDocument();
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const data = await response.json();
      setGeneratedDocument(data.document);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToSignature = async () => {
    try {
      const response = await fetch('/api/signature/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument,
          formData,
          signatories: [
            { name: formData.employeeName, email: formData.employeeEmail },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to send to signature');

      const data = await response.json();
      alert(`Document sent successfully! Tracking ID: ${data.trackingId}`);

      // Clear localStorage after successful send
      localStorage.removeItem(STORAGE_KEY);
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
      a.download = `Employment_Agreement_${formData.employeeName?.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Progress Stepper */}
      <div className="bg-white border-b border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="relative flex-1">
                  {index !== 0 && (
                    <div
                      className="absolute top-5 left-0 -ml-px h-0.5 w-full bg-[hsl(var(--border))]"
                      style={{
                        backgroundColor:
                          currentStep > step.id
                            ? 'hsl(var(--brand-primary))'
                            : 'hsl(var(--border))',
                      }}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (step.id < currentStep) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`relative flex flex-col items-center group ${
                      step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.id
                          ? 'bg-[hsl(var(--brand-primary))] border-[hsl(var(--brand-primary))] text-white'
                          : currentStep === step.id
                          ? 'border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] bg-white'
                          : 'border-[hsl(var(--border))] text-[hsl(var(--brand-muted))] bg-white'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </span>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        currentStep >= step.id
                          ? 'text-[hsl(var(--fg))]'
                          : 'text-[hsl(var(--brand-muted))]'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <form onSubmit={handleSubmit(generateDocument)}>
              {currentStep < STEPS.length ? (
                CurrentStepComponent && <CurrentStepComponent form={form} />
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[hsl(var(--fg))] mb-2">
                      Review & Generate
                    </h2>
                    <p className="text-[hsl(var(--brand-muted))]">
                      Review your information and generate your employment agreement.
                    </p>
                  </div>

                  {generatedDocument ? (
                    <ActionButtons
                      onSendToSignature={handleSendToSignature}
                      onDownloadDocx={handleDownloadDocx}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={generateDocument}
                      disabled={isGenerating}
                      className="w-full bg-[hsl(var(--brand-primary))] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Agreement'}
                    </button>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < STEPS.length && (
                <div className="flex justify-between mt-8 pt-6 border-t border-[hsl(var(--border))]">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--fg))] border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--card))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--brand-primary))] text-white rounded-lg hover:opacity-90 transition-all"
                  >
                    {currentStep === STEPS.length - 1 ? 'Review' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Preview Section */}
          <div>
            <PreviewPanel
              formData={formData}
              generatedDocument={generatedDocument}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
