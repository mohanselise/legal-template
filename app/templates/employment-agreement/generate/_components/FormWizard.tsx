/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  employmentAgreementSchema,
  defaultValues,
  EmploymentAgreementFormData,
} from '../schema';
import { SectionPreviewPanel, SectionKey, SectionState } from './SectionPreviewPanel';
import { ActionButtons } from './ActionButtons';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'employment-agreement-draft';

type Phase = 'essentials' | 'clauses' | 'review';

type ClauseProgress = 'pending' | 'active' | 'complete';

type ClauseField = {
  name: keyof EmploymentAgreementFormData;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'toggle';
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string }[];
  fullWidth?: boolean;
  advanced?: boolean;
  dependsOn?: {
    name: keyof EmploymentAgreementFormData;
    when: 'truthy' | 'equals';
    value?: string | boolean;
  };
};

type ClauseMeta = {
  key: SectionKey;
  title: string;
  subtitle: string;
  blurb: string;
  fields: ClauseField[];
  summary: (data: EmploymentAgreementFormData) => { label: string; value?: string }[];
};

const CLAUSE_FLOW: ClauseMeta[] = [
  {
    key: 'basics',
    title: 'Agreement Setup',
    subtitle: 'Parties & role framing',
    blurb: 'Confirm who is entering this agreement and the context for the hire.',
    fields: [
      { name: 'companyName', label: 'Employer legal name', type: 'text', placeholder: 'Acme Corporation' },
      { name: 'companyAddress', label: 'Registered address', type: 'text', placeholder: '123 Market Street, Suite 42' },
      { name: 'companyState', label: 'State / Province', type: 'text', placeholder: 'California' },
      { name: 'companyCountry', label: 'Country', type: 'text', placeholder: 'United States' },
      { name: 'employeeName', label: 'Employee full name', type: 'text', placeholder: 'Jane Doe' },
      { name: 'employeeAddress', label: 'Employee address', type: 'text', placeholder: '456 Grove Lane, Apt 8' },
      { name: 'employeeEmail', label: 'Employee email', type: 'text', placeholder: 'jane@company.com' },
      { name: 'employeePhone', label: 'Employee phone', type: 'text', placeholder: '+1 (555) 123-4567', advanced: true },
      { name: 'department', label: 'Department / team', type: 'text', placeholder: 'Product Design', advanced: true },
      { name: 'reportsTo', label: 'Reports to', type: 'text', placeholder: 'VP of Design', advanced: true },
      { name: 'companyWebsite', label: 'Company website', type: 'text', placeholder: 'https://example.com', advanced: true },
    ],
    summary: (data) => [
      { label: 'Employer', value: data.companyName },
      { label: 'Employee', value: data.employeeName },
      { label: 'Role', value: data.jobTitle },
    ],
  },
  {
    key: 'compensation',
    title: 'Compensation & Perks',
    subtitle: 'Base pay, equity & benefits',
    blurb: 'Lay out the financial package and highlight what makes this offer competitive.',
    fields: [
      { name: 'salaryAmount', label: 'Base salary', type: 'text', placeholder: '120000' },
      { name: 'salaryCurrency', label: 'Currency', type: 'text', placeholder: 'USD' },
      {
        name: 'salaryPeriod',
        label: 'Pay cadence',
        type: 'select',
        options: [
          { label: 'Annual', value: 'annual' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Bi-weekly', value: 'bi-weekly' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Hourly', value: 'hourly' },
        ],
      },
      {
        name: 'bonusStructure',
        label: 'Bonus / incentive structure',
        type: 'textarea',
        placeholder: 'Eligible for up to 15% annual performance bonus...',
        advanced: true,
      },
      {
        name: 'equityOffered',
        label: 'Equity grant details',
        type: 'textarea',
        placeholder: '0.15% stock options vesting over 4 years with a 1-year cliff...',
        advanced: true,
      },
      {
        name: 'signOnBonus',
        label: 'Sign-on bonus',
        type: 'text',
        placeholder: 'One-time payment of $10,000 on the first payroll cycle',
        advanced: true,
      },
      {
        name: 'paidTimeOff',
        label: 'Paid time off',
        type: 'textarea',
        placeholder: '20 days PTO annually, accrued monthly.',
        advanced: true,
      },
      {
        name: 'healthInsurance',
        label: 'Health insurance',
        type: 'toggle',
        description: 'Include medical coverage details',
        advanced: true,
      },
      {
        name: 'dentalInsurance',
        label: 'Dental insurance',
        type: 'toggle',
        advanced: true,
      },
      {
        name: 'visionInsurance',
        label: 'Vision insurance',
        type: 'toggle',
        advanced: true,
      },
      {
        name: 'retirementPlan',
        label: 'Retirement plan',
        type: 'toggle',
        description: '401(k), provident fund, or equivalent programme',
        advanced: true,
      },
      {
        name: 'otherBenefits',
        label: 'Other highlights',
        type: 'textarea',
        placeholder: 'Wellness stipend, home office allowance, commuter benefits...',
        advanced: true,
      },
    ],
    summary: (data) => [
      {
        label: 'Base pay',
        value: data.salaryAmount
          ? `${data.salaryCurrency ?? 'USD'} ${data.salaryAmount} / ${data.salaryPeriod ?? 'annual'}`
          : undefined,
      },
      { label: 'Bonus plan', value: data.bonusStructure ? 'Configured' : 'Standard' },
      { label: 'Equity', value: data.equityOffered ? 'Included' : 'Not included' },
    ],
  },
  {
    key: 'workTerms',
    title: 'Work Style & Expectations',
    subtitle: 'Location, cadence & reporting',
    blurb: 'Explain how work happens day to day so both sides align from the start.',
    fields: [
      {
        name: 'employmentType',
        label: 'Employment classification',
        type: 'select',
        options: [
          { label: 'Full-time', value: 'full-time' },
          { label: 'Part-time', value: 'part-time' },
          { label: 'Contract', value: 'contract' },
        ],
      },
      { name: 'workLocation', label: 'Primary location', type: 'text', placeholder: 'San Francisco, CA or Remote' },
      {
        name: 'workArrangement',
        label: 'Work arrangement',
        type: 'select',
        options: [
          { label: 'On-site', value: 'on-site' },
          { label: 'Remote', value: 'remote' },
          { label: 'Hybrid', value: 'hybrid' },
        ],
      },
      { name: 'workHoursPerWeek', label: 'Hours per week', type: 'text', placeholder: '40' },
      {
        name: 'workSchedule',
        label: 'Typical schedule',
        type: 'textarea',
        placeholder: 'Monday–Friday, core hours 10:00–16:00 PST',
        advanced: true,
      },
      {
        name: 'probationPeriod',
        label: 'Probationary period',
        type: 'text',
        placeholder: '3 months with performance check-in at 6 weeks',
        advanced: true,
      },
      {
        name: 'noticePeriod',
        label: 'Notice period',
        type: 'text',
        placeholder: '30 days written notice',
        advanced: true,
      },
      {
        name: 'overtimeEligible',
        label: 'Overtime eligibility',
        type: 'toggle',
        description: 'Mark if the role should follow overtime rules',
        advanced: true,
      },
    ],
    summary: (data) => [
      { label: 'Classification', value: data.employmentType },
      { label: 'Arrangement', value: data.workArrangement },
      { label: 'Location', value: data.workLocation },
    ],
  },
  {
    key: 'legalTerms',
    title: 'Legal Guardrails',
    subtitle: 'Protection & closing clauses',
    blurb: 'Tailor safeguards, dispute handling and any special provisions.',
    fields: [
      {
        name: 'includeConfidentiality',
        label: 'Confidentiality clause',
        type: 'toggle',
        description: 'Protect proprietary information and trade secrets',
      },
      {
        name: 'includeIpAssignment',
        label: 'IP assignment clause',
        type: 'toggle',
        description: 'Ensure company ownership of work product',
      },
      {
        name: 'includeNonCompete',
        label: 'Non-compete restriction',
        type: 'toggle',
        description: 'Limit post-employment competition',
      },
      {
        name: 'nonCompeteDuration',
        label: 'Non-compete duration',
        type: 'text',
        placeholder: '12 months after termination',
        dependsOn: { name: 'includeNonCompete', when: 'truthy' },
        advanced: true,
      },
      {
        name: 'nonCompeteRadius',
        label: 'Non-compete scope',
        type: 'text',
        placeholder: 'Technology companies within North America',
        dependsOn: { name: 'includeNonCompete', when: 'truthy' },
        advanced: true,
      },
      {
        name: 'includeNonSolicitation',
        label: 'Non-solicitation clause',
        type: 'toggle',
        description: 'Protect team and client relationships',
      },
      {
        name: 'nonSolicitationDuration',
        label: 'Non-solicitation duration',
        type: 'text',
        placeholder: '12 months post-employment',
        dependsOn: { name: 'includeNonSolicitation', when: 'truthy' },
        advanced: true,
      },
      {
        name: 'disputeResolution',
        label: 'Dispute resolution',
        type: 'select',
        options: [
          { label: 'Arbitration', value: 'arbitration' },
          { label: 'Mediation', value: 'mediation' },
          { label: 'Court', value: 'court' },
        ],
      },
      {
        name: 'governingLaw',
        label: 'Governing law jurisdiction',
        type: 'text',
        placeholder: 'State of Delaware, United States',
      },
      {
        name: 'additionalClauses',
        label: 'Additional clauses',
        type: 'textarea',
        placeholder: 'Any supplemental language or policies to include…',
        advanced: true,
      },
      {
        name: 'specialProvisions',
        label: 'Special provisions',
        type: 'textarea',
        placeholder: 'Equity acceleration triggers, relocation assistance, etc.',
        advanced: true,
      },
    ],
    summary: (data) => [
      { label: 'Confidentiality', value: data.includeConfidentiality ? 'Included' : 'Skipped' },
      { label: 'Non-compete', value: data.includeNonCompete ? 'Included' : 'Optional' },
      { label: 'Governing law', value: data.governingLaw },
    ],
  },
];

const ESSENTIAL_FIELDS: ClauseField[] = [
  { name: 'companyName', label: 'Who is hiring?', type: 'text', placeholder: 'Acme Corporation' },
  { name: 'employeeName', label: 'Who are you hiring?', type: 'text', placeholder: 'Jane Doe' },
  { name: 'jobTitle', label: 'Role title', type: 'text', placeholder: 'Lead Product Designer' },
  { name: 'startDate', label: 'Target start date', type: 'date' },
];

const INITIAL_SECTIONS: Record<SectionKey, SectionState> = {
  basics: { status: 'idle' },
  compensation: { status: 'idle' },
  workTerms: { status: 'idle' },
  legalTerms: { status: 'idle' },
};

export function FormWizard() {
  const [phase, setPhase] = useState<Phase>('essentials');
  const [activeClause, setActiveClause] = useState<SectionKey>('basics');
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(INITIAL_SECTIONS);
  const [clauseProgress, setClauseProgress] = useState<Record<SectionKey, ClauseProgress>>({
    basics: 'pending',
    compensation: 'pending',
    workTerms: 'pending',
    legalTerms: 'pending',
  });

  const form = useForm<EmploymentAgreementFormData>({
    resolver: zodResolver(employmentAgreementSchema) as any,
    defaultValues,
    mode: 'onChange',
  });

  const {
    watch,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = form;

  const formData = watch();

  useEffect(() => {
    const subscription = watch((data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to persist draft', error);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        reset(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to hydrate draft', error);
      }
    }
  }, [reset]);

  const timelineStage = useMemo(() => {
    if (phase === 'essentials') return 0;
    if (phase === 'clauses') return 1;
    return 2;
  }, [phase]);

  const combinedSectionDocument = useMemo(() => {
    return CLAUSE_FLOW.map(({ key }) => sections[key].content)
      .filter(Boolean)
      .join('\n\n');
  }, [sections]);

  useEffect(() => {
    const allSectionsReady = CLAUSE_FLOW.every(({ key }) => sections[key].status === 'done');
    if (allSectionsReady && phase !== 'review') {
      setPhase('review');
    }
  }, [sections, phase]);

  const handleEssentialsSubmit = async () => {
    const fieldsToValidate = ESSENTIAL_FIELDS.map((field) => field.name);
    const isValid = await trigger(fieldsToValidate as any, { shouldFocus: true });
    if (!isValid) return;

    setPhase('clauses');
    setActiveClause('basics');

    // Mark all clauses as active and trigger parallel generation
    setClauseProgress({
      basics: 'active',
      compensation: 'active',
      workTerms: 'active',
      legalTerms: 'active',
    });

    // Set all sections to generating state immediately
    setSections({
      basics: { status: 'generating' },
      compensation: { status: 'generating' },
      workTerms: { status: 'generating' },
      legalTerms: { status: 'generating' },
    });

    // Trigger ALL sections in parallel for faster generation
    void generateAllSectionsInParallel();
  };

  const handleActivateClause = (clauseKey: SectionKey) => {
    setPhase('clauses');
    setActiveClause(clauseKey);
    setClauseProgress((prev) => ({
      ...prev,
      [clauseKey]: prev[clauseKey] === 'complete' ? 'complete' : 'active',
    }));
  };

  const handleClauseSubmit = async (clauseKey: SectionKey) => {
    const clause = CLAUSE_FLOW.find((item) => item.key === clauseKey);
    if (!clause) return;

    const fieldsToValidate = clause.fields
      .filter((field) => !field.dependsOn)
      .map((field) => field.name);

    clause.fields
      .filter((field) => field.dependsOn)
      .forEach((field) => {
        const { name, when, value } = field.dependsOn!;
        const currentValue = getValues(name);
        if ((when === 'truthy' && currentValue) || (when === 'equals' && currentValue === value)) {
          fieldsToValidate.push(field.name);
        }
      });

    const isValid = await trigger(fieldsToValidate as any, { shouldFocus: true });
    if (!isValid) return;

    setClauseProgress((prev) => ({ ...prev, [clauseKey]: 'complete' }));
    setSections((prev) => ({
      ...prev,
      [clauseKey]: {
        ...prev[clauseKey],
        status: 'generating',
        error: undefined,
      },
    }));

    const pendingClauses = CLAUSE_FLOW.filter(
      (item) => item.key !== clauseKey && clauseProgress[item.key] !== 'complete',
    );
    if (pendingClauses.length > 0) {
      const nextClause = pendingClauses[0];
      setClauseProgress((prev) => ({
        ...prev,
        [nextClause.key]: prev[nextClause.key] === 'complete' ? 'complete' : 'active',
      }));
      setActiveClause(nextClause.key);
    } else {
      setActiveClause(clauseKey);
    }

    void generateClauseSection(clauseKey);
  };

  const generateClauseSection = async (sectionKey: SectionKey) => {
    try {
      const response = await fetch('/api/templates/employment-agreement/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionKey,
          data: getValues(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate section');
      }

      const data = await response.json();
      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          status: 'done',
          content: data.content,
        },
      }));
    } catch (error) {
      console.error('Error generating section', error);
      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          content: prev[sectionKey].content,
        },
      }));
    }
  };

  /**
   * Generate all sections in parallel for maximum speed
   * Uses Promise.allSettled to ensure all requests complete even if some fail
   */
  const generateAllSectionsInParallel = async () => {
    const currentData = getValues();

    // Create all API calls simultaneously
    const generationPromises = CLAUSE_FLOW.map(async ({ key }) => {
      try {
        const response = await fetch('/api/templates/employment-agreement/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: key,
            data: currentData,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate ${key} section`);
        }

        const data = await response.json();

        // Update this specific section as done
        setSections((prev) => ({
          ...prev,
          [key]: {
            status: 'done',
            content: data.content,
          },
        }));

        setClauseProgress((prev) => ({
          ...prev,
          [key]: 'complete',
        }));

        return { key, success: true, content: data.content };
      } catch (error) {
        console.error(`Error generating ${key} section:`, error);

        setSections((prev) => ({
          ...prev,
          [key]: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            content: prev[key]?.content,
          },
        }));

        return { key, success: false, error };
      }
    });

    // Wait for all sections to complete (success or failure)
    const results = await Promise.allSettled(generationPromises);

    console.log('Parallel generation complete:', results);
  };

  const regenerateClause = (clauseKey: SectionKey) => {
    setSections((prev) => ({
      ...prev,
      [clauseKey]: {
        ...prev[clauseKey],
        status: 'generating',
        error: undefined,
      },
    }));
    void generateClauseSection(clauseKey);
  };

  const generateFullDocument = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates/employment-agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getValues()),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      setGeneratedDocument(data.document);
    } catch (error) {
      console.error('Error generating document', error);
      alert('Unable to generate the full agreement. Please try again.');
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
          document: generatedDocument || combinedSectionDocument,
          formData: getValues(),
          signatories: [
            {
              name: formData.employeeName,
              email: formData.employeeEmail,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to send to signature');

      const data = await response.json();
      alert(`Document sent successfully! Tracking ID: ${data.trackingId}`);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error sending to signature', error);
      alert('Failed to send document. Please try again.');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await fetch('/api/documents/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: generatedDocument || combinedSectionDocument,
          formData: getValues(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Employment_Agreement_${formData.employeeName?.replace(/\s+/g, '_') || 'draft'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const essentialsCard = (
    <div className="bg-white border border-[hsl(var(--border))] rounded-3xl shadow-sm p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--brand-primary))/0.1] text-[hsl(var(--brand-primary))] text-xs font-semibold uppercase tracking-wide">
            Step 1
          </div>
          <h2 className="text-2xl font-semibold text-[hsl(var(--fg))] mt-4">Project setup</h2>
          <p className="text-[hsl(var(--brand-muted))] mt-2">
            Start with the essentials. We will layer in the detailed questions later and draft clauses as you go.
          </p>
        </div>
        <Sparkles className="w-8 h-8 text-[hsl(var(--brand-primary))]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ESSENTIAL_FIELDS.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            form={form}
            errors={errors}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-dashed border-[hsl(var(--border))]">
        <div className="text-sm text-[hsl(var(--brand-muted))]">
          We'll start generating all sections in parallel. You can refine details while we work.
        </div>
        <button
          type="button"
          onClick={handleEssentialsSubmit}
          className="inline-flex items-center gap-2 bg-[hsl(var(--brand-primary))] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
        >
          Start generating
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      <div className="border-b border-[hsl(var(--border))] bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--brand-muted))]">Employment agreement studio</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] mt-2">
                Generate a polished contract without the chat-style back-and-forth.
              </h1>
            </div>
            <BuildTimeline currentStage={timelineStage} sections={sections} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div className="space-y-6">
            {phase === 'essentials' ? (
              essentialsCard
            ) : (
              <div className="space-y-6">
                <EssentialsRecap
                  form={form}
                  onEdit={() => {
                    setPhase('essentials');
                  }}
                />

                {CLAUSE_FLOW.map((clause) => (
                  <ClauseCard
                    key={clause.key}
                    clause={clause}
                    form={form}
                    isActive={activeClause === clause.key}
                    status={clauseProgress[clause.key]}
                    sectionState={sections[clause.key]}
                    onActivate={() => handleActivateClause(clause.key)}
                    onSubmit={() => handleClauseSubmit(clause.key)}
                    onRegenerate={() => regenerateClause(clause.key)}
                  />
                ))}
              </div>
            )}

            {phase === 'review' && (
              <ReviewPanel
                combinedDocument={combinedSectionDocument}
                generatedDocument={generatedDocument}
                onGenerateFull={generateFullDocument}
                isGenerating={isGenerating}
                hasGenerated={!!generatedDocument}
                onSendToSignature={handleSendToSignature}
                onDownloadDocx={handleDownloadDocx}
              />
            )}
          </div>

          <div className="hidden xl:block">
            <SectionPreviewPanel sections={sections} />
          </div>
        </div>
      </div>
    </div>
  );
}

type FieldInputProps = {
  field: ClauseField;
  form: UseFormReturn<EmploymentAgreementFormData>;
  errors: UseFormReturn<EmploymentAgreementFormData>['formState']['errors'];
  disabled?: boolean;
};

function FieldInput({ field, form, errors, disabled }: FieldInputProps) {
  const { register, watch } = form;
  const value = watch(field.name);

  if (field.dependsOn) {
    const dependentValue = watch(field.dependsOn.name);
    const shouldRender =
      (field.dependsOn.when === 'truthy' && !!dependentValue) ||
      (field.dependsOn.when === 'equals' && dependentValue === field.dependsOn.value);
    if (!shouldRender) {
      return null;
    }
  }

  const errorMessage = errors[field.name]?.message as string | undefined;

  const baseProps = {
    id: field.name,
    ...register(field.name),
    disabled,
  };

  return (
    <div className={cn('space-y-1.5', field.fullWidth && 'md:col-span-2')}>
      <label htmlFor={field.name} className="block text-sm font-medium text-[hsl(var(--fg))]">
        {field.label}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          {...baseProps}
          className="w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm focus:border-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          placeholder={field.placeholder}
          rows={field.advanced ? 3 : 4}
        />
      ) : field.type === 'select' ? (
        <div className="relative">
          <select
            {...baseProps}
            className="w-full appearance-none rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm focus:border-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[hsl(var(--brand-muted))]" />
        </div>
      ) : field.type === 'toggle' ? (
        <label
          htmlFor={field.name}
          className={cn(
            'flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3',
            disabled && 'opacity-60',
          )}
        >
          <div>
            <span className="text-sm font-medium text-[hsl(var(--fg))]">{field.label}</span>
            {field.description && (
              <p className="text-xs text-[hsl(var(--brand-muted))] mt-1">{field.description}</p>
            )}
          </div>
          <input
            type="checkbox"
            id={field.name}
            {...register(field.name)}
            className="h-5 w-5 rounded border-[hsl(var(--border))] text-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
            checked={!!value}
          />
        </label>
      ) : (
        <input
          {...baseProps}
          type={field.type === 'date' ? 'date' : 'text'}
          className="w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm focus:border-[hsl(var(--brand-primary))] focus:ring-[hsl(var(--brand-primary))]"
          placeholder={field.placeholder}
        />
      )}

      {errorMessage && (
        <p className="text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

type ClauseCardProps = {
  clause: ClauseMeta;
  form: UseFormReturn<EmploymentAgreementFormData>;
  isActive: boolean;
  status: ClauseProgress;
  sectionState: SectionState;
  onActivate: () => void;
  onSubmit: () => void;
  onRegenerate: () => void;
};

function ClauseCard({
  clause,
  form,
  isActive,
  status,
  sectionState,
  onActivate,
  onSubmit,
  onRegenerate,
}: ClauseCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const values = form.watch();

  const advancedFields = clause.fields.filter((field) => field.advanced);
  const primaryFields = clause.fields.filter((field) => !field.advanced);

  const clauseStatusLabel = (() => {
    if (sectionState.status === 'generating') return 'Generating...';
    if (sectionState.status === 'done') return 'Complete';
    if (sectionState.status === 'error') return 'Failed';
    if (status === 'complete') return 'Awaiting generation';
    if (status === 'active') return 'Ready to generate';
    return 'Pending';
  })();

  const clauseStatusTone = (() => {
    if (sectionState.status === 'generating') return 'text-[hsl(var(--brand-primary))]';
    if (sectionState.status === 'done') return 'text-green-600';
    if (sectionState.status === 'error') return 'text-red-600';
    if (status === 'active') return 'text-[hsl(var(--brand-primary))]';
    if (status === 'complete') return 'text-[hsl(var(--brand-muted))]';
    return 'text-[hsl(var(--brand-muted))]';
  })();

  const showStatusIcon = (() => {
    if (sectionState.status === 'generating') {
      return <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--brand-primary))]" />;
    }
    if (sectionState.status === 'done') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (sectionState.status === 'error') {
      return <Circle className="w-4 h-4 text-red-600" />;
    }
    return null;
  })();

  return (
    <div
      className={cn(
        'rounded-3xl border bg-white shadow-sm transition-all',
        isActive ? 'border-[hsl(var(--brand-primary))] ring-1 ring-[hsl(var(--brand-primary))/0.2]' : 'border-[hsl(var(--border))]',
      )}
    >
      <button
        type="button"
        onClick={onActivate}
        className="w-full text-left p-6 flex flex-col gap-2"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-muted))]">
              Clause {clause.key === 'basics' ? '01' : clause.key === 'compensation' ? '02' : clause.key === 'workTerms' ? '03' : '04'}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <h3 className="text-xl font-semibold text-[hsl(var(--fg))]">{clause.title}</h3>
              {showStatusIcon}
            </div>
            <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">{clause.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {sectionState.status === 'generating' && (
              <div className="h-1.5 w-16 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                <div className="h-full bg-[hsl(var(--brand-primary))] animate-pulse w-3/4" />
              </div>
            )}
            <div className={cn('text-xs font-medium whitespace-nowrap', clauseStatusTone)}>{clauseStatusLabel}</div>
          </div>
        </div>
        {!isActive && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {clause.summary(values).map(
              (item) =>
                item.value && (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-dashed border-[hsl(var(--border))] px-4 py-3"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--brand-muted))]">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-medium text-[hsl(var(--fg))]">{item.value}</div>
                  </div>
                ),
            )}
          </div>
        )}
      </button>

      {isActive && (
        <div className="border-t border-[hsl(var(--border))] p-6 space-y-6">
          <p className="text-sm text-[hsl(var(--brand-muted))]">{clause.blurb}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryFields.map((field) => (
              <FieldInput key={field.name} field={field} form={form} errors={form.formState.errors} />
            ))}

            {advancedFields.length > 0 && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--brand-primary))]"
                >
                  <PenLine className="w-4 h-4" />
                  {showAdvanced ? 'Hide advanced inputs' : 'Show advanced inputs'}
                </button>
              </div>
            )}

            {showAdvanced &&
              advancedFields.map((field) => (
                <FieldInput key={field.name} field={field} form={form} errors={form.formState.errors} />
              ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[hsl(var(--border))]">
            <div className="text-xs text-[hsl(var(--brand-muted))]">
              {sectionState.status === 'generating'
                ? 'Generating this section in the background...'
                : sectionState.status === 'done'
                ? 'Section generated. You can regenerate or continue refining.'
                : 'All sections are being generated in parallel. Refine as needed.'}
            </div>
            <div className="flex items-center gap-3">
              {sectionState.status === 'done' && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="text-sm font-medium text-[hsl(var(--brand-muted))] hover:text-[hsl(var(--brand-primary))] transition-colors"
                >
                  Regenerate
                </button>
              )}
              {sectionState.status === 'error' && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
                >
                  Retry generation
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type EssentialsRecapProps = {
  form: UseFormReturn<EmploymentAgreementFormData>;
  onEdit: () => void;
};

function EssentialsRecap({ form, onEdit }: EssentialsRecapProps) {
  const values = form.watch();
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-muted))]">Essentials locked</div>
          <div className="text-lg font-semibold text-[hsl(var(--fg))] mt-1">
            {values.companyName || 'Employer'}, hiring {values.employeeName || 'a new team member'}
          </div>
          <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">
            {values.jobTitle ? `${values.jobTitle} starting ${values.startDate || 'soon'}` : 'Add a title and start date to keep drafting accurate.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--fg))] hover:bg-[hsl(var(--card))]"
        >
          Edit essentials
          <PenLine className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

type ReviewPanelProps = {
  combinedDocument: string;
  generatedDocument: string;
  onGenerateFull: () => Promise<void>;
  isGenerating: boolean;
  hasGenerated: boolean;
  onSendToSignature: () => Promise<void>;
  onDownloadDocx: () => Promise<void>;
};

function ReviewPanel({
  combinedDocument,
  generatedDocument,
  onGenerateFull,
  isGenerating,
  hasGenerated,
  onSendToSignature,
  onDownloadDocx,
}: ReviewPanelProps) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-white shadow-sm p-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))/0.1] text-[hsl(var(--brand-primary))]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--fg))]">Compile & share</h2>
          <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">
            All sections are drafted. Compile a single polished agreement or download / send right away.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm text-[hsl(var(--brand-muted))]">
        {combinedDocument ? (
          <p>
            Preview updates as you continue to refine the form. Generating the full agreement runs an additional pass to
            polish the language and add final signatures.
          </p>
        ) : (
          <p>We are waiting for each clause to finish drafting. Hang tight for a moment.</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <button
          type="button"
          onClick={onGenerateFull}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-primary))] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling agreement…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Compile polished agreement
            </>
          )}
        </button>

        <div className="text-xs text-[hsl(var(--brand-muted))]">
          A full compile refines tone, stitches sections, and generates a signature-ready version.
        </div>
      </div>

      <ActionButtons
        onSendToSignature={onSendToSignature}
        onDownloadDocx={onDownloadDocx}
        disabled={!hasGenerated && !combinedDocument}
      />

      {(generatedDocument || combinedDocument) && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-xs text-[hsl(var(--brand-muted))]">
          <div className="font-semibold text-[hsl(var(--fg))] mb-2">Quick peek</div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-[hsl(var(--fg))]">
            {(generatedDocument || combinedDocument).slice(0, 1200)}
            {(generatedDocument || combinedDocument).length > 1200 ? '…' : ''}
          </pre>
        </div>
      )}
    </div>
  );
}

type BuildTimelineProps = {
  currentStage: number;
  sections: Record<SectionKey, SectionState>;
};

function BuildTimeline({ currentStage, sections }: BuildTimelineProps) {
  const stages = [
    { label: 'Essentials', description: 'Context locked in' },
    { label: 'Clause drafting', description: `${Object.values(sections).filter((s) => s.status === 'done').length}/4 ready` },
    { label: 'Review & share', description: 'Send for signature' },
  ];

  return (
    <ol className="flex items-center gap-6 text-sm">
      {stages.map((stage, index) => {
        const status =
          index < currentStage
            ? 'done'
            : index === currentStage
            ? 'active'
            : 'pending';
        return (
          <li key={stage.label} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                status === 'done' && 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))] text-white',
                status === 'active' && 'border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))]',
                status === 'pending' && 'border-[hsl(var(--border))] text-[hsl(var(--brand-muted))]',
              )}
            >
              {status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <div>
              <div className="text-xs font-semibold text-[hsl(var(--fg))]">{stage.label}</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--brand-muted))]">
                {stage.description}
              </div>
            </div>
            {index !== stages.length - 1 && (
              <Circle className="hidden md:block h-1.5 w-1.5 text-[hsl(var(--border))]" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
