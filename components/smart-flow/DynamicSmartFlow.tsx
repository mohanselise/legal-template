"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Check,
  Sparkles,
  AlertTriangle,
  Loader2,
  Wand2,
  Zap,
  SkipForward,
  ChevronDown,
  Building2,
  User,
  Briefcase,
  Scale,
  PenTool,
  ClipboardCheck,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DynamicFormProvider,
  useDynamicForm,
  type TemplateConfig,
  type ScreenWithFields,
} from "./DynamicFormContext";
import { DynamicField, type FieldConfig } from "./field-renderers";
import { SignatoryScreenRenderer } from "./SignatoryScreenRenderer";
import { SignatoryEntry } from "@/lib/templates/signatory-config";
import { Button } from "@/components/ui/button";
import { Stepper, StepperCompact } from "@/components/ui/stepper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Turnstile } from "next-turnstile";
import { setTurnstileToken as storeTurnstileToken } from "@/lib/turnstile-token-manager";
import { saveTemplateReview } from "@/components/template-review/TemplateReviewStorage";

// Screen icons mapping based on common screen titles
const SCREEN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  company: Building2,
  employer: Building2,
  employee: User,
  work: Briefcase,
  job: Briefcase,
  compensation: Scale,
  salary: Scale,
  legal: Scale,
  signing: PenTool,
  signature: PenTool,
  review: ClipboardCheck,
  confirm: ClipboardCheck,
};

function getScreenIcon(title: string): React.ComponentType<{ className?: string }> {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(SCREEN_ICONS)) {
    if (lowerTitle.includes(key)) return icon;
  }
  return FileText;
}

/**
 * Dynamic Field with inline Apply button for standard values
 * Matches the SmartFlow v2 design with Apply button inside/next to input
 */
interface DynamicFieldWithApplyProps {
  field: FieldConfig;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  enrichmentContext?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  standardValue?: string;
}

function DynamicFieldWithApply({
  field,
  value,
  onChange,
  error,
  enrichmentContext,
  formData,
  standardValue,
}: DynamicFieldWithApplyProps) {
  const [justApplied, setJustApplied] = useState(false);
  
  const handleApply = () => {
    if (standardValue) {
      onChange(field.name, standardValue);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 1500);
    }
  };

  // Check if the current value matches the standard value
  const isStandardApplied = standardValue && String(value) === String(standardValue);
  const showApplyButton = standardValue && !isStandardApplied && !justApplied;

  // For text, number, email fields - wrap with inline Apply button
  if (['text', 'number', 'email'].includes(field.type)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {field.helpText && (
            <span className="text-[hsl(var(--globe-grey))] cursor-help" title={field.helpText}>
              <HelpCircle className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="relative">
          <input
            id={field.name}
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={standardValue || field.placeholder || ''}
            value={String(value || '')}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`
              w-full rounded-xl border-2 px-4 py-3 text-base transition-colors
              placeholder:text-[hsl(var(--globe-grey))]/60
              focus:border-[hsl(var(--selise-blue))] focus:outline-none focus:ring-0
              ${error ? 'border-destructive' : 'border-[hsl(var(--border))]'}
              ${showApplyButton ? 'pr-24' : ''}
            `}
          />
          {showApplyButton && (
            <button
              type="button"
              onClick={handleApply}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                bg-transparent text-[hsl(var(--selise-blue))] 
                hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
                border border-[hsl(var(--selise-blue))]/30 hover:border-[hsl(var(--selise-blue))]/50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          )}
          {justApplied && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="h-4 w-4" />
              Applied
            </span>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // For select fields with standard value
  if (field.type === 'select') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {standardValue && !isStandardApplied && (
              <span className="ml-2 text-xs text-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 px-2 py-0.5 rounded-full border border-[hsl(var(--selise-blue))]/20">
                Standard: {standardValue}
              </span>
            )}
          </label>
          {showApplyButton && (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                bg-transparent text-[hsl(var(--selise-blue))] 
                hover:bg-[hsl(var(--selise-blue))]/10 transition-colors cursor-pointer
                border border-[hsl(var(--selise-blue))]/30"
            >
              <Sparkles className="h-3 w-3" />
              Apply
            </button>
          )}
        </div>
        <DynamicField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          enrichmentContext={enrichmentContext}
          formData={formData}
        />
      </div>
    );
  }

  // For other field types, use the standard renderer
  return (
    <DynamicField
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      enrichmentContext={enrichmentContext}
      formData={formData}
    />
  );
}

// Tips to show during loading
const GENERATION_TIPS = [
  "💡 Tip: Review all terms carefully before signing any legal document.",
  "💡 Tip: Keep a copy of the signed agreement for your records.",
  "💡 Tip: Consider having a legal professional review important contracts.",
  "💡 Tip: Make sure all parties understand their obligations under the agreement.",
  "💡 Tip: Document any verbal agreements in writing for legal protection.",
];

// Generation stages for the loading screen
const GENERATION_STEPS = [
  {
    title: "Analyzing your requirements",
    description: "Reviewing all the information you provided to ensure completeness.",
    progress: 15,
    duration: 2500,
  },
  {
    title: "Drafting core provisions",
    description: "Creating the main clauses with precise legal language.",
    progress: 40,
    duration: 3000,
  },
  {
    title: "Building protective clauses",
    description: "Generating confidentiality, IP, and other protective provisions.",
    progress: 65,
    duration: 3500,
  },
  {
    title: "Finalizing document",
    description: "Adding signature blocks and formatting the final document.",
    progress: 85,
    duration: 2500,
  },
  {
    title: "Almost there",
    description: "Performing final quality checks on your document.",
    progress: 95,
    duration: 3000,
  },
];

interface DynamicSmartFlowProps {
  config: TemplateConfig;
  locale: string;
}

type AiEnrichmentIndicatorState =
  | { status: "idle" }
  | { status: "running"; screenTitle?: string }
  | { status: "error"; message: string; screenTitle?: string };

// Type for dynamically generated fields
interface DynamicFieldType {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: string[];
  standardValue?: string;
}

// Cache for generated dynamic fields per screen
type DynamicFieldsCache = Record<string, DynamicFieldType[]>;

// Cache for jurisdiction info per screen
type JurisdictionCache = Record<string, string | null>;

/**
 * Extract variable names from a prompt template
 * Supports both simple {{varName}} and nested {{object.property}} syntax
 */
function extractPromptVariables(prompt: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(prompt)) !== null) {
    const varName = match[1].trim();
    // For nested paths like "company.name", take the root variable
    const rootVar = varName.split('.')[0];
    if (!variables.includes(rootVar)) {
      variables.push(rootVar);
    }
  }
  
  return variables;
}

/**
 * Check if all required variables for a prompt are available in the form data or enrichment context
 */
function arePromptVariablesAvailable(
  prompt: string,
  formData: Record<string, unknown>,
  enrichmentContext: Record<string, unknown>
): boolean {
  const requiredVars = extractPromptVariables(prompt);
  if (requiredVars.length === 0) return true; // No variables needed, can fetch immediately
  
  const allContext = { ...formData, ...enrichmentContext };
  
  return requiredVars.every((varName) => {
    const value = allContext[varName];
    // Check if value exists and is not empty
    if (value === undefined || value === null || value === '') return false;
    // For strings, check if not just whitespace
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });
}

function cloneFormData<T extends Record<string, unknown>>(data: T): T {
  try {
    return structuredClone(data);
  } catch (error) {
    // Fallback when structuredClone isn't available (should be rare in modern browsers)
    return JSON.parse(JSON.stringify(data));
  }
}

function DynamicSmartFlowContent({ locale }: { locale: string }) {
  const {
    config,
    formData,
    setFieldValue,
    errors,
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    canProceed,
    isSubmitting,
    setSubmitting,
    enrichmentContext,
    setEnrichmentContext,
  } = useDynamicForm();

  const router = useRouter();
  const t = useTranslations('employmentAgreement.smartFlow');
  const [showWelcome, setShowWelcome] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const [aiEnrichmentState, setAiEnrichmentState] = useState<AiEnrichmentIndicatorState>({
    status: "idle",
  });

  // Loading screen state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const isNavigatingRef = useRef(false);
  const aiEnrichmentPendingCount = useRef(0);
  const aiEnrichmentResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic screen state
  const [dynamicFieldsCache, setDynamicFieldsCache] = useState<DynamicFieldsCache>({});
  const [dynamicFieldsLoading, setDynamicFieldsLoading] = useState(false);
  const [dynamicFieldsError, setDynamicFieldsError] = useState<string | null>(null);
  const dynamicFieldsFetchedRef = useRef<Set<string>>(new Set());
  const [jurisdictionCache, setJurisdictionCache] = useState<JurisdictionCache>({});
  const [applyingStandard, setApplyingStandard] = useState(false);
  const [appliedStandard, setAppliedStandard] = useState(false);
  // Track which step indices are currently being pre-fetched (for stepper loading indicator)
  const [prefetchingStepIndices, setPrefetchingStepIndices] = useState<Set<number>>(new Set());

  // Animate through generation steps
  useEffect(() => {
    if (!isGenerating || GENERATION_STEPS.length === 0) {
      setGenerationStepIndex(0);
      setFakeProgress(0);
      return;
    }

    type Timer = ReturnType<typeof setTimeout>;
    let isActive = true;
    const timeouts: Timer[] = [];
    let idleInterval: ReturnType<typeof setInterval> | null = null;

    setGenerationStepIndex(0);
    setFakeProgress(GENERATION_STEPS[0].progress);

    let cumulativeDelay = 0;
    for (let index = 1; index < GENERATION_STEPS.length; index++) {
      cumulativeDelay += GENERATION_STEPS[index - 1].duration;
      const timeout = setTimeout(() => {
        if (!isActive) return;
        setGenerationStepIndex(index);
        setFakeProgress(GENERATION_STEPS[index].progress);
      }, cumulativeDelay);
      timeouts.push(timeout);
    }

    // After all steps, slowly increment progress to 99
    cumulativeDelay += GENERATION_STEPS[GENERATION_STEPS.length - 1].duration;
    const idleTimeout = setTimeout(() => {
      idleInterval = setInterval(() => {
        if (!isActive) return;
        setFakeProgress((prev) => {
          const next = prev + 0.4 + Math.random() * 1.1;
          return next >= 99 ? 99 : next;
        });
      }, 2000);
    }, cumulativeDelay);
    timeouts.push(idleTimeout);

    return () => {
      isActive = false;
      timeouts.forEach((timeout) => clearTimeout(timeout));
      if (idleInterval) clearInterval(idleInterval);
    };
  }, [isGenerating]);

  // Rotate tips during generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % GENERATION_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    return () => {
      if (aiEnrichmentResetTimeout.current) {
        clearTimeout(aiEnrichmentResetTimeout.current);
      }
    };
  }, []);

  // Reset applied standard state when step changes
  useEffect(() => {
    setAppliedStandard(false);
    setApplyingStandard(false);
  }, [currentStep]);

  // Track which screens are being pre-fetched to avoid duplicate requests
  const prefetchingRef = useRef<Set<string>>(new Set());

  // Pre-fetch dynamic fields as soon as all required variables are available
  // This runs proactively before user reaches the dynamic screen
  useEffect(() => {
    if (!config?.screens) return;

    // Find all dynamic screens that we haven't fetched yet
    const dynamicScreens = config.screens
      .map((screen, index) => ({ screen, index }))
      .filter(({ screen }) => {
        const screenType = (screen as any).type;
        const dynamicPrompt = (screen as any).dynamicPrompt;
        return (
          screenType === "dynamic" &&
          dynamicPrompt &&
          !dynamicFieldsCache[screen.id] &&
          !dynamicFieldsFetchedRef.current.has(screen.id) &&
          !prefetchingRef.current.has(screen.id)
        );
      });

    if (dynamicScreens.length === 0) return;

    // Check each dynamic screen to see if its variables are available
    dynamicScreens.forEach(({ screen, index: stepIndex }) => {
      const dynamicPrompt = (screen as any).dynamicPrompt;
      const dynamicMaxFields = (screen as any).dynamicMaxFields || 5;

      // Check if all required variables are now available
      if (arePromptVariablesAvailable(dynamicPrompt, formData, enrichmentContext)) {
        // Mark as prefetching to prevent duplicate requests
        prefetchingRef.current.add(screen.id);
        
        // Add step index to loading indicator set
        setPrefetchingStepIndices((prev) => new Set([...prev, stepIndex]));

        console.log("🚀 Pre-fetching dynamic fields for screen:", screen.title, "(step", stepIndex + 1, ")");
        console.log("   Variables are ready, fetching ahead of time...");

        // Fire the pre-fetch request
        (async () => {
          try {
            const response = await fetch("/api/ai/generate-dynamic-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: dynamicPrompt,
                formData: cloneFormData(formData),
                enrichmentContext: cloneFormData(enrichmentContext),
                maxFields: dynamicMaxFields,
                screenTitle: screen.title,
                screenDescription: screen.description,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to generate dynamic fields");
            }

            const result = await response.json();
            console.log("✅ Pre-fetch complete for screen:", screen.title, result.fields);

            // Mark as fetched (so regular fetch doesn't re-run)
            dynamicFieldsFetchedRef.current.add(screen.id);
            prefetchingRef.current.delete(screen.id);
            
            // Remove step index from loading indicator set
            setPrefetchingStepIndices((prev) => {
              const next = new Set(prev);
              next.delete(stepIndex);
              return next;
            });

            // Update the cache
            setDynamicFieldsCache((prev) => ({
              ...prev,
              [screen.id]: result.fields,
            }));

            // Store jurisdiction name if provided
            if (result.jurisdictionName) {
              setJurisdictionCache((prev) => ({
                ...prev,
                [screen.id]: result.jurisdictionName,
              }));
            }
          } catch (error) {
            console.error("❌ Pre-fetch error for screen:", screen.title, error);
            // Remove from prefetching set so it can be retried
            prefetchingRef.current.delete(screen.id);
            // Remove step index from loading indicator set
            setPrefetchingStepIndices((prev) => {
              const next = new Set(prev);
              next.delete(stepIndex);
              return next;
            });
          }
        })();
      }
    });
  }, [config, formData, enrichmentContext, dynamicFieldsCache]);

  // Fetch dynamic fields when entering a dynamic screen (fallback if not pre-fetched)
  useEffect(() => {
    const screen = config?.screens[currentStep];
    if (!screen) return;

    // Check if this is a dynamic screen
    const screenType = (screen as any).type;
    const dynamicPrompt = (screen as any).dynamicPrompt;
    const dynamicMaxFields = (screen as any).dynamicMaxFields || 5;

    if (screenType !== "dynamic" || !dynamicPrompt) return;

    // Check if we already have cached fields for this screen (either pre-fetched or fetched)
    if (dynamicFieldsCache[screen.id]) return;

    // Check if we already fetched or are currently pre-fetching
    if (dynamicFieldsFetchedRef.current.has(screen.id)) return;
    if (prefetchingRef.current.has(screen.id)) {
      // Pre-fetch is in progress, wait for it
      console.log("⏳ Waiting for pre-fetch to complete for:", screen.title);
      return;
    }
    
    dynamicFieldsFetchedRef.current.add(screen.id);

    // Fetch dynamic fields (fallback when not pre-fetched)
    const fetchDynamicFields = async () => {
      setDynamicFieldsLoading(true);
      setDynamicFieldsError(null);

      try {
        console.log("🔮 Generating dynamic fields for screen (on-demand):", screen.title);
        const response = await fetch("/api/ai/generate-dynamic-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: dynamicPrompt,
            formData: cloneFormData(formData),
            enrichmentContext: cloneFormData(enrichmentContext),
            maxFields: dynamicMaxFields,
            screenTitle: screen.title,
            screenDescription: screen.description,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate dynamic fields");
        }

        const result = await response.json();
        console.log("✅ Dynamic fields generated:", result.fields);

        setDynamicFieldsCache((prev) => ({
          ...prev,
          [screen.id]: result.fields,
        }));
        
        // Store jurisdiction name if provided
        if (result.jurisdictionName) {
          setJurisdictionCache((prev) => ({
            ...prev,
            [screen.id]: result.jurisdictionName,
          }));
        }
      } catch (error) {
        console.error("❌ Dynamic field generation error:", error);
        setDynamicFieldsError(
          error instanceof Error ? error.message : "Failed to generate fields"
        );
        // Remove from fetched set so user can retry
        dynamicFieldsFetchedRef.current.delete(screen.id);
      } finally {
        setDynamicFieldsLoading(false);
      }
    };

    fetchDynamicFields();
  }, [config, currentStep, formData, enrichmentContext, dynamicFieldsCache]);

  // Create step definitions - must be before early return to satisfy React Hooks rules
  const stepDefinitions = useMemo(
    () => {
      if (!config?.screens || !Array.isArray(config.screens) || config.screens.length === 0) {
        return [];
      }
      return config.screens.map((screen, index) => ({
        id: screen.id || `step-${index}`,
        title: screen.title || `Step ${index + 1}`,
      }));
    },
    [config?.screens]
  );

  // AI enrichment callback - must be before early return to satisfy React Hooks rules
  const runAiEnrichmentInBackground = useCallback(
    (screen: ScreenWithFields | undefined) => {
      if (!screen?.aiPrompt) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AI Enrichment] Skipped - no aiPrompt configured for screen:', screen?.title);
        }
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AI Enrichment] Starting for screen:', screen.title);
        console.log('[AI Enrichment] Prompt:', screen.aiPrompt.substring(0, 100) + '...');
      }

      aiEnrichmentPendingCount.current += 1;
      setAiEnrichmentState({
        status: "running",
        screenTitle: screen.title,
      });

      const payload = {
        prompt: screen.aiPrompt,
        formData: cloneFormData(formData),
        outputSchema: screen.aiOutputSchema || null,
      };

      // Fire-and-forget so navigation isn't blocked
      void (async () => {
        try {
          console.log("✨ Executing AI Enrichment in background...");
          const response = await fetch("/api/ai/enrich-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (!response.ok) {
            const message =
              (typeof data?.error === "string" && data.error) ||
              (typeof data?.message === "string" && data.message) ||
              `Failed to enrich context (status ${response.status})`;
            throw new Error(message);
          }

          console.log("✅ AI Enrichment Result:", data);
          console.log("✅ AI Enrichment Keys:", Object.keys(data));
          setEnrichmentContext(data);
          aiEnrichmentPendingCount.current = Math.max(
            0,
            aiEnrichmentPendingCount.current - 1
          );
          if (aiEnrichmentPendingCount.current === 0) {
            if (aiEnrichmentResetTimeout.current) {
              clearTimeout(aiEnrichmentResetTimeout.current);
              aiEnrichmentResetTimeout.current = null;
            }
            setAiEnrichmentState({ status: "idle" });
          }
        } catch (error) {
          aiEnrichmentPendingCount.current = Math.max(
            0,
            aiEnrichmentPendingCount.current - 1
          );
          const friendlyMessage =
            (error instanceof Error && error.message) ||
            "AI enrichment is temporarily unavailable.";
          console.error("❌ AI Enrichment Error:", error);
          if (aiEnrichmentResetTimeout.current) {
            clearTimeout(aiEnrichmentResetTimeout.current);
          }
          setAiEnrichmentState({
            status: "error",
            screenTitle: screen.title,
            message: friendlyMessage,
          });
          aiEnrichmentResetTimeout.current = setTimeout(() => {
            if (aiEnrichmentPendingCount.current === 0) {
              setAiEnrichmentState({ status: "idle" });
              aiEnrichmentResetTimeout.current = null;
            }
          }, 5000);
        }
      })();
    },
    [formData, setEnrichmentContext]
  );

  // Keyboard navigation - must be after runAiEnrichmentInBackground is defined
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Welcome screen: Enter to start
      if (showWelcome && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (turnstileStatus === 'success' && turnstileToken) {
          setShowWelcome(false);
        }
        return;
      }
      
      // Form flow: Enter to continue
      if (!showWelcome && !isGenerating && e.key === 'Enter') {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        
        if (currentStep < totalSteps - 1) {
          e.preventDefault();
          // Let handleContinue do the validation
          const screen = config?.screens[currentStep];
          runAiEnrichmentInBackground(screen);
          nextStep();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showWelcome, turnstileStatus, turnstileToken, isGenerating, currentStep, totalSteps, config, runAiEnrichmentInBackground, nextStep]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
      </div>
    );
  }

  const currentScreen = config.screens[currentStep];
  const displayedProgress = Math.round(fakeProgress);

  // Loading Screen - shows during document generation
  if (isGenerating || generationError) {
    const currentStage =
      GENERATION_STEPS[Math.min(generationStepIndex, GENERATION_STEPS.length - 1)];

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--bg))] px-4">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.14),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.08),_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-2xl">
          {/* Error Display */}
          {generationError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-red-200 bg-background p-8 shadow-xl text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[hsl(var(--fg))] mb-3 font-heading">
                {t('generation.generationFailed')}
              </h2>
              <p className="text-[hsl(var(--brand-muted))] mb-6 leading-relaxed">
                {generationError}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetryGeneration}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('generation.goBack')}
                </Button>
                <Button
                  onClick={() => {
                    setGenerationError(null);
                    handleSubmit();
                  }}
                  className="flex items-center gap-2 bg-[hsl(var(--brand-primary))]"
                >
                  {t('generation.tryAgain')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-12 space-y-5 text-center"
              >
                {/* Animated icon */}
                <motion.div
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-[hsl(var(--brand-primary)/0.2)] bg-gradient-to-br from-[hsl(var(--brand-primary)/0.1)] to-[hsl(var(--brand-primary)/0.05)] shadow-lg backdrop-blur-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 10px 25px -5px hsla(var(--brand-primary)/0.1)",
                      "0 15px 35px -5px hsla(var(--brand-primary)/0.2)",
                      "0 10px 25px -5px hsla(var(--brand-primary)/0.1)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <FileText className="h-12 w-12 text-[hsl(var(--brand-primary))]" />
                  </motion.div>
                </motion.div>

                <h2 className="text-4xl font-semibold text-[hsl(var(--fg))] md:text-5xl font-heading tracking-tight">
                  {t('generation.title')}
                </h2>
                <p className="text-lg text-[hsl(var(--brand-muted))] leading-relaxed">
                  {t('generation.subtitle')}
                </p>
              </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="rounded-3xl border border-[hsl(var(--brand-border))] bg-background p-8 shadow-xl backdrop-blur-sm"
          >
            {/* Progress header */}
            <div className="mb-4 flex items-center justify-between text-sm font-medium">
              <span className="text-[hsl(var(--fg))]">{t('generation.percentComplete', { percent: displayedProgress })}</span>
              <span className="text-[hsl(var(--brand-muted))]">{t('generation.stepXOfY', { current: generationStepIndex + 1, total: GENERATION_STEPS.length })}</span>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 overflow-hidden rounded-full border border-[hsl(var(--brand-primary)/0.25)] bg-[hsl(var(--brand-primary)/0.08)] shadow-inner">
              {/* Animated background shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--brand-primary)/0.15)] to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              {/* Progress fill */}
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-primary))] via-[hsl(var(--brand-primary)/0.9)] to-[hsl(var(--brand-primary))] shadow-lg"
                style={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Glowing edge */}
              <motion.div
                className="absolute left-0 top-0 h-full w-2 rounded-full bg-white/60 blur-sm"
                style={{ left: `${fakeProgress}%`, marginLeft: '-4px' }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
              {/* Moving dot indicator */}
              <motion.div
                className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--brand-primary))] shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_4px_12px_hsla(206,100%,35%,0.5)]"
                style={{ left: `${fakeProgress}%`, marginLeft: '-10px' }}
                animate={{
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 3px rgba(255,255,255,0.5), 0 4px 12px hsla(206,100%,35%,0.5)',
                    '0 0 0 4px rgba(255,255,255,0.6), 0 6px 16px hsla(206,100%,35%,0.6)',
                    '0 0 0 3px rgba(255,255,255,0.5), 0 4px 12px hsla(206,100%,35%,0.5)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Current stage info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={generationStepIndex}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-[hsl(var(--brand-border))] bg-gradient-to-br from-background to-[hsl(var(--brand-primary)/0.02)] p-8 shadow-lg backdrop-blur-sm mt-6"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[hsl(var(--brand-primary)/0.2)] bg-gradient-to-br from-[hsl(var(--brand-primary)/0.1)] to-[hsl(var(--brand-primary)/0.05)] shadow-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-7 w-7 text-[hsl(var(--brand-primary))]" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-2 text-xl font-semibold text-[hsl(var(--fg))] font-heading tracking-tight">
                      {currentStage.title}
                    </h3>
                    <p className="leading-relaxed text-[hsl(var(--brand-muted))] text-base">
                      {currentStage.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stage checklist */}
            <div className="mt-7 space-y-3">
              {GENERATION_STEPS.map((stage, index) => {
                const isCompleted = index < generationStepIndex;
                const isCurrent = index === generationStepIndex;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      isCompleted
                        ? 'text-[hsl(var(--brand-primary))]'
                        : isCurrent
                        ? 'text-[hsl(var(--fg))] font-medium'
                        : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white"
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-5 w-5 rounded-full border-2 border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)]"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-border)/0.3)]" />
                    )}
                    <span className={isCurrent ? 'font-medium' : ''}>{stage.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-[hsl(var(--brand-muted))]"
          >
            {t('generation.typicallyTakes')}
          </motion.p>

          {/* Tips carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[hsl(var(--brand-primary))] uppercase tracking-wide mb-1">
                  Did you know?
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-[hsl(var(--brand-muted))] leading-relaxed"
                  >
                    {GENERATION_TIPS[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            {/* Tip indicator dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {GENERATION_TIPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentTipIndex
                      ? 'w-4 bg-[hsl(var(--brand-primary))]'
                      : 'w-1.5 bg-[hsl(var(--brand-border))]'
                  }`}
                />
              ))}
            </div>
          </motion.div>
            </>
          )}
        </div>
      </div>
    );
  }
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleContinue = () => {
    if (canProceed()) {
      const screen = config.screens[currentStep];

      // Trigger AI enrichment without waiting for the response
      runAiEnrichmentInBackground(screen);

      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed() || !turnstileToken) return;

    setSubmitting(true);
    setIsGenerating(true);
    setGenerationStepIndex(0);
    setFakeProgress(0);
    setGenerationError(null);

    try {
      console.log("🚀 [DynamicSmartFlow] Starting document generation...");
      console.log("📋 [DynamicSmartFlow] Form data:", formData);
      console.log("🔑 [DynamicSmartFlow] Template ID:", config.id);

      // Call the generation API
      const response = await fetch(`/api/templates/${config.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate document");
      }

      const result = await response.json();
      console.log("✅ [DynamicSmartFlow] Document generated successfully");

      // Store result in sessionStorage for review page using the reusable storage utility
      const reviewData = {
        document: result.document,
        formData: formData,
        templateId: config.id,
        templateSlug: config.slug,
        templateTitle: config.title,
        storedAt: new Date().toISOString(),
      };

      saveTemplateReview(config.slug, reviewData);

      // Set progress to 100 before navigating
      setFakeProgress(100);
      isNavigatingRef.current = true;

      // Brief delay to show 100% completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to review page
      router.push(`/${locale}/templates/${config.slug}/review`);
    } catch (error) {
      console.error("❌ [DynamicSmartFlow] Generation error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to generate document. Please try again.";
      setGenerationError(errorMessage);
      setIsGenerating(false);
      setSubmitting(false);
    }
  };

  // Reset generation and go back to form
  const handleRetryGeneration = () => {
    setGenerationError(null);
    setIsGenerating(false);
    setSubmitting(false);
    setFakeProgress(0);
    setGenerationStepIndex(0);
  };

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="relative min-h-screen overflow-y-auto bg-[hsl(var(--bg))] px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.18),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.1),_transparent_65%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto w-full max-w-4xl rounded-3xl border border-[hsl(var(--brand-border))] bg-background p-10 text-center shadow-xl backdrop-blur-sm"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(var(--brand-border))] bg-muted shadow-sm">
            <Sparkles className="h-10 w-10 text-[hsl(var(--brand-primary))]" />
          </div>
          <h1 className="mb-6 text-5xl font-semibold text-[hsl(var(--fg))] md:text-6xl font-heading">
            {config.title}
          </h1>
          <p className="mb-12 text-xl leading-relaxed text-[hsl(var(--brand-muted))]">
            {config.description}
            <br />
            <span className="text-[hsl(var(--brand-muted))]">{t('welcome.subtitle2')}</span>
          </p>

          {/* Collapsible Disclaimer */}
          <Collapsible className="mb-8">
            <CollapsibleTrigger className="w-full rounded-xl border border-[hsl(var(--brand-border))] bg-muted p-4 text-left hover:bg-muted/80 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                  <span className="font-medium text-[hsl(var(--fg))]">{t('welcome.viewImportantInfo')}</span>
                </div>
                <ChevronDown className="h-5 w-5 text-[hsl(var(--brand-muted))] transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-xl border border-[hsl(var(--brand-border))] bg-muted p-6 text-left animate-in slide-in-from-top-2">
              <div className="space-y-3 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
                <p><strong className="text-[hsl(var(--brand-primary))]">{t('welcome.notLegalAdvice')}</strong> {t('welcome.notLegalAdviceText')}</p>
                <p><strong className="text-[hsl(var(--brand-primary))]">{t('welcome.aiGenerated')}</strong> {t('welcome.aiGeneratedText')}</p>
                <p><strong className="text-[hsl(var(--brand-primary))]">{t('welcome.jurisdiction')}</strong> {t('welcome.jurisdictionText')}</p>
                <p><strong className="text-[hsl(var(--brand-primary))]">{t('welcome.reviewRequired')}</strong> {t('welcome.reviewRequiredText')}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Human Verification - Simplified styling */}
          <div className="mb-8 rounded-2xl border border-[hsl(var(--brand-border))] bg-card p-6">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading mb-2">
                {t('welcome.verifyHuman')}
              </h3>
              <p className="text-sm text-[hsl(var(--brand-muted))]">
                {t('welcome.verifyHumanDescription')}
              </p>
            </div>
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <div className="flex flex-col items-center gap-4">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  retry="auto"
                  refreshExpired="auto"
                  sandbox={false}
                  onError={() => {
                    setTurnstileStatus("error");
                    setTurnstileToken(null);
                  }}
                  onExpire={() => {
                    setTurnstileStatus("expired");
                    setTurnstileToken(null);
                  }}
                  onLoad={() => {
                    setTurnstileStatus("required");
                  }}
                  onVerify={(token) => {
                    setTurnstileStatus("success");
                    setTurnstileToken(token);
                    storeTurnstileToken(token);
                  }}
                />
                {turnstileStatus === 'success' && turnstileToken && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <Check className="h-4 w-4" />
                    <span>{t('welcome.verificationComplete')}</span>
                  </div>
                )}
                {turnstileStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t('welcome.verificationFailed')}</span>
                  </div>
                )}
                {turnstileStatus === 'expired' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t('welcome.verificationExpired')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-800 font-medium mb-1">
                  {t('welcome.turnstileConfigMissing')}
                </p>
                <p className="text-xs text-amber-700">
                  {t('welcome.turnstileConfigDescription')}
                </p>
              </div>
            )}
          </div>

          <motion.button
            onClick={() => {
              if (turnstileStatus === 'success' && turnstileToken) {
                // Token already stored in onVerify callback
                setShowWelcome(false);
              }
            }}
            disabled={turnstileStatus !== 'success' || !turnstileToken}
            className="inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--brand-primary-foreground))] shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
            whileHover={{ scale: turnstileStatus === 'success' ? 1.02 : 1 }}
            whileTap={{ scale: turnstileStatus === 'success' ? 0.98 : 1 }}
          >
            {t('welcome.iUnderstandGetStarted')}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </motion.button>
          <p className="hidden md:block mt-8 text-sm text-[hsl(var(--brand-muted))]">
            {t('welcome.pressEnterToBegin')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Main Form Flow
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[hsl(var(--border))] z-50">
        <motion.div
          className="h-full bg-[hsl(var(--brand-primary))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header with Stepper */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Step title for context */}
          <div className="text-center">
            <p className="text-sm text-[hsl(var(--brand-muted))] font-medium">
              {t('navigation.stepXOfY', { current: currentStep + 1, total: totalSteps, title: currentScreen?.title || 'Review' })}
            </p>
          </div>

          {stepDefinitions.length > 0 ? (
            <>
              <div className="hidden md:block">
                <Stepper
                  key={`stepper-${stepDefinitions.length}-${currentStep}`}
                  steps={stepDefinitions}
                  currentStep={currentStep}
                  onStepClick={goToStep}
                  allowNavigation
                  loadingSteps={prefetchingStepIndices}
                />
              </div>
              <div className="md:hidden">
                <StepperCompact 
                  key={`stepper-compact-${stepDefinitions.length}-${currentStep}`}
                  steps={stepDefinitions} 
                  currentStep={currentStep}
                  loadingSteps={prefetchingStepIndices}
                />
              </div>
            </>
          ) : (
            <div className="h-20 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--selise-blue))]" />
            </div>
          )}

          <AnimatePresence>
            {aiEnrichmentState.status !== "idle" && (
              <motion.div
                key={`ai-indicator-${aiEnrichmentState.status}`}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm shadow-sm ${aiEnrichmentState.status === "running"
                    ? "border-[hsl(var(--brand-primary))]/30 bg-[hsl(var(--brand-primary))]/5 text-[hsl(var(--brand-primary))]"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                aria-live="polite"
              >
                {aiEnrichmentState.status === "running" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-primary))]/10 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">
                        Enhancing your experience...
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[hsl(var(--brand-muted))] truncate">
                        AI is preparing smart suggestions in the background
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium">Enhancement unavailable</span>
                      <span className="text-[10px] sm:text-[11px]">
                        No worries — you can continue without AI suggestions
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Container */}
              <div className="bg-card rounded-3xl shadow-lg border border-[hsl(var(--border))] p-8 md:p-12">
                {/* Screen Header with Icon */}
                <div className="mb-8 space-y-3">
                  {currentScreen?.title && (() => {
                    const IconComponent = getScreenIcon(currentScreen.title);
                    return (
                      <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
                        <IconComponent className="w-7 h-7" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
                      {currentScreen?.title}
                    </h2>
                    {currentScreen?.description && (
                      <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
                        {currentScreen.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-6">
                  {/* Dynamic Screen: Show loading or generated fields */}
                  {(currentScreen as any)?.type === "dynamic" ? (
                    <>
                      {dynamicFieldsLoading && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-16 space-y-6"
                        >
                          <div className="relative">
                            <motion.div 
                              className="h-20 w-20 rounded-full border-4 border-[hsl(var(--brand-primary))]/20"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                              className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-[hsl(var(--brand-primary))]"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                              className="absolute inset-0 m-auto flex items-center justify-center"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Wand2 className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
                            </motion.div>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-[hsl(var(--fg))]">
                              Creating personalized questions...
                            </p>
                            <p className="text-sm text-[hsl(var(--brand-muted))] max-w-sm">
                              Our AI is analyzing your inputs to generate the most relevant questions for your document
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {dynamicFieldsError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-12 space-y-6"
                        >
                          <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-red-600">
                              Couldn&apos;t generate questions
                            </p>
                            <p className="text-sm text-[hsl(var(--brand-muted))] max-w-sm">
                              {dynamicFieldsError}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Allow retry by removing from cache and ref
                                dynamicFieldsFetchedRef.current.delete(currentScreen.id);
                                setDynamicFieldsError(null);
                                setDynamicFieldsCache((prev) => {
                                  const newCache = { ...prev };
                                  delete newCache[currentScreen.id];
                                  return newCache;
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              Try Again
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={nextStep}
                              className="text-[hsl(var(--globe-grey))]"
                            >
                              Skip this step
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {!dynamicFieldsLoading && !dynamicFieldsError && dynamicFieldsCache[currentScreen.id] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {/* AI Generated Badge with Optional indicator */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs text-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5 px-3 py-2 rounded-lg border border-[hsl(var(--selise-blue))]/20">
                              <Wand2 className="h-3.5 w-3.5" />
                              <span>Additional questions based on your context</span>
                            </div>
                          </div>
                          
                          {dynamicFieldsCache[currentScreen.id].map((field) => (
                            <DynamicFieldWithApply
                              key={field.id}
                              field={{
                                ...field,
                                type: field.type as any,
                              } as FieldConfig}
                              value={formData[field.name]}
                              onChange={setFieldValue}
                              error={errors[field.name]}
                              enrichmentContext={enrichmentContext}
                              formData={formData}
                              standardValue={field.standardValue}
                            />
                          ))}

                          {/* Apply Standards Banner - matches SmartFlow v2 design */}
                          {dynamicFieldsCache[currentScreen.id].some(f => f.standardValue) && !appliedStandard && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4"
                            >
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/80">
                                    <Zap className="h-5 w-5 text-amber-700" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[hsl(var(--fg))]">
                                      Save time with {jurisdictionCache[currentScreen.id] || 'local'} defaults
                                    </p>
                                    <p className="text-sm text-[hsl(var(--globe-grey))]">
                                      Auto-fill work hours, notice periods, and legal terms based on local standards
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    setApplyingStandard(true);
                                    const fields = dynamicFieldsCache[currentScreen.id];
                                    fields.forEach((field) => {
                                      if (field.standardValue) {
                                        setFieldValue(field.name, field.standardValue);
                                      }
                                    });
                                    // Show success feedback
                                    setAppliedStandard(true);
                                    setTimeout(() => {
                                      setApplyingStandard(false);
                                    }, 600);
                                  }}
                                  disabled={applyingStandard}
                                  className="flex items-center gap-2 bg-[hsl(var(--selise-blue))] text-white hover:bg-[hsl(var(--oxford-blue))] px-5"
                                >
                                  <Zap className="h-4 w-4" />
                                  Apply Standards
                                </Button>
                              </div>
                            </motion.div>
                          )}

                          {/* Applied Success State */}
                          {appliedStandard && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200">
                                  <Check className="h-5 w-5 text-emerald-700" />
                                </div>
                                <div>
                                  <p className="font-semibold text-emerald-800">
                                    {jurisdictionCache[currentScreen.id] || 'Standard'} defaults applied!
                                  </p>
                                  <p className="text-sm text-emerald-600">
                                    Fields have been filled with recommended values
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Show nothing while waiting but no error */}
                      {!dynamicFieldsLoading && !dynamicFieldsError && !dynamicFieldsCache[currentScreen.id] && (
                        <div className="py-8 text-center text-[hsl(var(--brand-muted))]">
                          <p>Preparing dynamic questions...</p>
                        </div>
                      )}
                    </>
                  ) : (currentScreen as any)?.type === "signatory" ? (
                    /* Signatory Screen: Show dedicated signatory collection UI */
                    <SignatoryScreenRenderer
                      configJson={(currentScreen as any).signatoryConfig}
                      value={(formData.signatories as SignatoryEntry[]) || []}
                      onChange={(signatories) => setFieldValue("signatories", signatories)}
                      errors={errors}
                      formData={formData}
                    />
                  ) : (
                    /* Standard Screen: Show regular fields */
                    <>
                      {currentScreen?.fields.map((field) => (
                        <DynamicField
                          key={field.id}
                          field={field as FieldConfig}
                          value={formData[field.name]}
                          onChange={setFieldValue}
                          error={errors[field.name]}
                          enrichmentContext={enrichmentContext}
                          formData={formData}
                        />
                      ))}
                    </>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                  {/* Left side - Back button */}
                  {currentStep > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={previousStep}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t('navigation.back')}
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {/* Right side buttons */}
                  <div className="flex items-center gap-3">
                    {/* Dynamic screen: Skip button only (Apply Standards is now in banner) */}
                    {(currentScreen as any)?.type === "dynamic" && 
                     dynamicFieldsCache[currentScreen?.id || ""] &&
                     currentStep < totalSteps - 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // Skip without filling any fields
                          nextStep();
                        }}
                        className="flex items-center gap-2 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip this step
                      </Button>
                    )}

                    {currentStep < totalSteps - 1 ? (
                      <Button
                        onClick={handleContinue}
                        disabled={dynamicFieldsLoading || ((currentScreen as any)?.type === "dynamic" && !dynamicFieldsCache[currentScreen?.id || ""])}
                        className="flex items-center gap-3 px-8 py-4 group"
                        size="lg"
                      >
                        {dynamicFieldsLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            {t('navigation.continue')}
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !turnstileToken || turnstileStatus !== "success"}
                        className="flex items-center gap-3 px-8 py-4 bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] group"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />
                            Generate Document
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hint - Hidden on touch devices */}
              {currentStep < totalSteps - 1 && (
                <p className="hidden md:block text-center mt-6 text-sm text-[hsl(var(--brand-muted))]">
                  {t('hint.pressEnterToContinue')}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="pb-6" />
    </div>
  );
}

export function DynamicSmartFlow({ config, locale }: DynamicSmartFlowProps) {
  return (
    <DynamicFormProvider config={config}>
      <DynamicSmartFlowContent locale={locale} />
    </DynamicFormProvider>
  );
}

export default DynamicSmartFlow;
