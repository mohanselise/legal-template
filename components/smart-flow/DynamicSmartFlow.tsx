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
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DynamicFormProvider,
  useDynamicForm,
  type TemplateConfig,
  type ScreenWithFields,
} from "./DynamicFormContext";
import { evaluateConditions } from "@/lib/templates/conditions";
import type { TemplateField } from "@/lib/db";
import { DynamicField, type FieldConfig } from "./field-renderers";
import { SignatoryScreenRenderer } from "./SignatoryScreenRenderer";
import { SignatoryEntry } from "@/lib/templates/signatory-config";
import { Button } from "@/components/ui/button";
import { Stepper, StepperCompact } from "@/components/ui/stepper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Turnstile } from "next-turnstile";
import { setTurnstileToken as storeTurnstileToken } from "@/lib/turnstile-token-manager";
import { saveTemplateReview } from "@/components/template-review/TemplateReviewStorage";
import {
  trackSmartflowStarted,
  trackStepCompleted,
  trackStandardsApplied,
  trackDocumentGenerationStarted,
  trackDocumentGenerated,
} from "@/lib/analytics";

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
 * Maps a variable name to its source screen and field definition.
 * Returns null if the variable doesn't correspond to any form field
 * (it might be from enrichment context instead).
 */
function mapVariableToScreenAndField(
  variableName: string,
  screens: ScreenWithFields[]
): { screenIndex: number; field: TemplateField } | null {
  for (let screenIndex = 0; screenIndex < screens.length; screenIndex++) {
    const screen = screens[screenIndex];
    for (const field of screen.fields) {
      if (field.name === variableName) {
        return { screenIndex, field };
      }
    }
  }
  return null;
}

/**
 * Finds the screen index where a variable from enrichment context is generated.
 * Enrichment context values come from aiPrompt outputs on previous screens.
 * Returns the screen index if found, or -1 if not found.
 */
function findEnrichmentSourceScreen(
  variableName: string,
  screens: ScreenWithFields[]
): number {
  for (let screenIndex = 0; screenIndex < screens.length; screenIndex++) {
    const screen = screens[screenIndex];
    const aiOutputSchema = (screen as any).aiOutputSchema;
    
    if (aiOutputSchema) {
      try {
        const schema = typeof aiOutputSchema === 'string' 
          ? JSON.parse(aiOutputSchema) 
          : aiOutputSchema;
        
        // Check if the variable is defined in this screen's output schema
        if (schema.properties && variableName in schema.properties) {
          return screenIndex;
        }
      } catch {
        // Skip invalid JSON schemas
      }
    }
  }
  return -1;
}

/**
 * Check if a value is considered "filled" (non-empty)
 */
function isValueFilled(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Check if a variable is resolved considering:
 * 1. Has a value in formData or enrichmentContext
 * 2. The field is not visible (conditions evaluate to false)
 * 3. User has passed the screen containing the field
 * 4. Variable comes from enrichmentContext (AI output from previous screen)
 */
function isVariableResolved(
  variableName: string,
  formData: Record<string, unknown>,
  enrichmentContext: Record<string, unknown>,
  screens: ScreenWithFields[],
  currentStep: number
): boolean {
  // Check 1: Does the variable have a value?
  const allContext = { ...formData, ...enrichmentContext };
  if (isValueFilled(allContext[variableName])) {
    return true;
  }

  // Check 2: Is this a form field variable?
  const fieldMapping = mapVariableToScreenAndField(variableName, screens);
  
  if (fieldMapping) {
    const { screenIndex, field } = fieldMapping;
    
    // Check 2a: Is the field not visible due to conditions?
    const conditions = (field as any).conditions;
    if (conditions && !evaluateConditions(conditions, formData)) {
      // Field is hidden, user won't fill it - consider resolved
      return true;
    }
    
    // Check 2b: Has the user passed this screen?
    // currentStep is 0-indexed, so if currentStep > screenIndex, user has moved past
    if (currentStep > screenIndex) {
      // User has passed this screen - the field was either:
      // - Filled (handled in Check 1)
      // - Optional and skipped
      // - Hidden due to screen-level conditions
      return true;
    }
    
    // Field is visible and user hasn't passed it yet - not resolved
    return false;
  }

  // Check 3: Is this an enrichment context variable?
  const enrichmentSourceScreen = findEnrichmentSourceScreen(variableName, screens);
  
  if (enrichmentSourceScreen >= 0) {
    // Variable comes from AI enrichment on a previous screen
    // It's resolved if user has passed the screen that generates it
    if (currentStep > enrichmentSourceScreen) {
      // User completed the enrichment screen - even if no value,
      // the enrichment either ran or won't run
      return true;
    }
    // User hasn't passed the enrichment screen yet
    return false;
  }

  // Unknown variable source - consider it resolved to avoid blocking
  // (might be a typo in the prompt or a variable that will be added later)
  console.warn(`Unknown variable source for: ${variableName}`);
  return true;
}

/**
 * Check if all required variables for a prompt are resolved.
 * A variable is resolved if:
 * 1. It has a non-empty value in formData or enrichmentContext
 * 2. The field that provides it is not visible (conditions evaluate to false)
 * 3. The user has passed the screen containing the field
 * 4. For enrichment variables, the source screen has been completed
 *
 * This is the sophisticated calculation that considers conditional visibility
 * and screen navigation, not just whether values exist.
 */
function arePromptVariablesResolved(
  prompt: string,
  formData: Record<string, unknown>,
  enrichmentContext: Record<string, unknown>,
  screens: ScreenWithFields[],
  currentStep: number
): boolean {
  const requiredVars = extractPromptVariables(prompt);
  if (requiredVars.length === 0) return true; // No variables needed, can fetch immediately

  return requiredVars.every((varName) =>
    isVariableResolved(varName, formData, enrichmentContext, screens, currentStep)
  );
}

/**
 * Check if all required variables for a prompt are available in the form data or enrichment context
 * @deprecated Use arePromptVariablesResolved() for sophisticated checking with visibility/navigation
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

/**
 * Get nested value from object using dot notation (for enrichment context lookups)
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Get fields with available suggestions for a standard screen
 * Returns fields that have aiSuggestionEnabled and a value available in enrichmentContext
 */
function getFieldsWithSuggestions(
  fields: Array<{ name: string; aiSuggestionEnabled?: boolean; aiSuggestionKey?: string | null }>,
  enrichmentContext: Record<string, unknown>
): Array<{ name: string; suggestedValue: unknown }> {
  const fieldsWithSuggestions: Array<{ name: string; suggestedValue: unknown }> = [];

  for (const field of fields) {
    if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
      const suggestedValue = getNestedValue(enrichmentContext, field.aiSuggestionKey);
      if (suggestedValue !== undefined && suggestedValue !== null && suggestedValue !== '') {
        fieldsWithSuggestions.push({
          name: field.name,
          suggestedValue,
        });
      }
    }
  }

  return fieldsWithSuggestions;
}

function DynamicSmartFlowContent({ locale }: { locale: string }) {
  const {
    config,
    formData,
    setFieldValue: originalSetFieldValue,
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
    visibleScreens,
    getVisibleFields,
  } = useDynamicForm();
  
  // Wrap setFieldValue to clear validation error display when user starts filling fields
  const setFieldValue = useCallback((name: string, value: unknown) => {
    originalSetFieldValue(name, value);
    // Clear validation error display when user starts filling fields
    setShowValidationErrors(false);
  }, [originalSetFieldValue]);

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

  // Validation error state - tracks when user tries to proceed without filling required fields
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Loading screen state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [retryTurnstileToken, setRetryTurnstileToken] = useState<string | null>(null);
  const [retryTurnstileStatus, setRetryTurnstileStatus] = useState<'success' | 'error' | 'expired' | 'required'>('required');
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
  const [failedDynamicScreens, setFailedDynamicScreens] = useState<Set<string>>(new Set());
  const [applyingStandard, setApplyingStandard] = useState(false);
  const [appliedStandard, setAppliedStandard] = useState(false);
  
  // Ref to track latest formData for recursive apply (avoids stale closure)
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  // Recursive apply function for standard screens - applies suggestions and checks for newly visible fields
  const applyStandardsRecursively = useCallback((
    currentScreen: ScreenWithFields,
    maxIterations = 5 // Safety limit to prevent infinite loops
  ) => {
    let iterations = 0;
    
    const applyNextBatch = () => {
      if (iterations >= maxIterations) {
        setApplyingStandard(false);
        setAppliedStandard(true);
        return;
      }
      
      iterations++;
      
      // Use ref to get latest formData (avoids stale closure)
      const currentFormData = formDataRef.current;
      
      // Get currently visible fields with suggestions
      const visibleFields = getVisibleFields(currentScreen) || [];
      const fieldsWithSuggestions = getFieldsWithSuggestions(visibleFields, enrichmentContext);
      
      // Filter to unfilled fields using latest formData
      const unfilledFields = fieldsWithSuggestions.filter(
        (f) => !currentFormData[f.name] || currentFormData[f.name] === ''
      );
      
      if (unfilledFields.length === 0) {
        // No more unfilled fields, we're done
        setApplyingStandard(false);
        setAppliedStandard(true);
        return;
      }
      
      // Apply values to unfilled fields
      unfilledFields.forEach((field) => {
        setFieldValue(field.name, field.suggestedValue);
      });
      
      // Wait for React to update state and check for newly visible fields
      setTimeout(applyNextBatch, 150);
    };
    
    setApplyingStandard(true);
    applyNextBatch();
  }, [getVisibleFields, enrichmentContext, setFieldValue]);
  
  // Recursive apply function for dynamic screens
  const applyDynamicStandardsRecursively = useCallback((
    screenId: string,
    fields: DynamicFieldType[],
    maxIterations = 5
  ) => {
    let iterations = 0;
    
    const applyNextBatch = () => {
      if (iterations >= maxIterations) {
        setApplyingStandard(false);
        setAppliedStandard(true);
        return;
      }
      
      iterations++;
      
      // Use ref to get latest formData (avoids stale closure)
      const currentFormData = formDataRef.current;
      
      // Get unfilled fields with standard values using latest formData
      const unfilledFields = fields.filter(
        (f) => f.standardValue && (!currentFormData[f.name] || currentFormData[f.name] === '')
      );
      
      if (unfilledFields.length === 0) {
        // No more unfilled fields, we're done
        setApplyingStandard(false);
        setAppliedStandard(true);
        return;
      }
      
      // Apply values to unfilled fields
      unfilledFields.forEach((field) => {
        setFieldValue(field.name, field.standardValue!);
      });
      
      // Wait for React to update state and check again
      setTimeout(applyNextBatch, 150);
    };
    
    setApplyingStandard(true);
    applyNextBatch();
  }, [setFieldValue]);
  
  // Track which step indices are currently being pre-fetched (for stepper loading indicator)
  const [prefetchingStepIndices, setPrefetchingStepIndices] = useState<Set<number>>(new Set());
  
  // Timeout for dynamic field generation (30 seconds - generous timeout)
  const DYNAMIC_FIELDS_FETCH_TIMEOUT = 30000;
  
  // Timeout for waiting state - if no data comes through after this period, auto-proceed
  const DYNAMIC_SCREEN_WAITING_TIMEOUT = 20000;

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

  // Track smartflow started when component mounts with config
  useEffect(() => {
    if (config) {
      trackSmartflowStarted(config.slug, config.title);
    }
  }, [config]);

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

    // Check each dynamic screen to see if its variables are resolved
    // A variable is resolved if: has a value, field is hidden, or user passed the screen
    dynamicScreens.forEach(({ screen, index: stepIndex }) => {
      const dynamicPrompt = (screen as any).dynamicPrompt;
      const dynamicMaxFields = (screen as any).dynamicMaxFields || 5;

      // Check if all required variables are now resolved (considering visibility and navigation)
      if (arePromptVariablesResolved(dynamicPrompt, formData, enrichmentContext, config.screens, currentStep)) {
        // Mark as prefetching to prevent duplicate requests
        prefetchingRef.current.add(screen.id);

        // Add step index to loading indicator set
        setPrefetchingStepIndices((prev) => new Set([...prev, stepIndex]));

        console.log("🚀 Pre-fetching dynamic fields for screen:", screen.title, "(step", stepIndex + 1, ")");
        console.log("   Variables are ready, fetching ahead of time...");

        // Fire the pre-fetch request
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), DYNAMIC_FIELDS_FETCH_TIMEOUT);
          
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
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

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
            clearTimeout(timeoutId);
            const isTimeout = error instanceof Error && error.name === 'AbortError';
            console.error(`❌ Pre-fetch ${isTimeout ? 'timeout' : 'error'} for screen:`, screen.title, error);
            // Mark screen as failed
            setFailedDynamicScreens((prev) => new Set([...prev, screen.id]));
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
  }, [config, formData, enrichmentContext, dynamicFieldsCache, currentStep]);

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DYNAMIC_FIELDS_FETCH_TIMEOUT);

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
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

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
        clearTimeout(timeoutId);
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`❌ Dynamic field generation ${isTimeout ? 'timeout' : 'error'}:`, error);
        // Mark screen as failed
        setFailedDynamicScreens((prev) => new Set([...prev, screen.id]));
        setDynamicFieldsError(
          isTimeout 
            ? "Request timed out. Please try again or continue without additional questions."
            : (error instanceof Error ? error.message : "Failed to generate fields")
        );
        // Remove from fetched set so user can retry
        dynamicFieldsFetchedRef.current.delete(screen.id);
      } finally {
        setDynamicFieldsLoading(false);
      }
    };

    fetchDynamicFields();
  }, [config, currentStep, formData, enrichmentContext, dynamicFieldsCache]);

  // Auto-advance when user is on a failed dynamic screen
  useEffect(() => {
    const screen = config?.screens[currentStep];
    if (!screen) return;

    const screenType = (screen as any).type;
    if (screenType !== "dynamic") return;

    // Check if this screen has failed
    if (failedDynamicScreens.has(screen.id)) {
      // Show error message briefly, then auto-advance
      setDynamicFieldsError("Couldn't load additional questions - proceeding...");
      
      const autoAdvanceTimeout = setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          nextStep();
        }
      }, 2000);

      return () => clearTimeout(autoAdvanceTimeout);
    }
  }, [currentStep, failedDynamicScreens, config, totalSteps, nextStep]);

  // Auto-advance when dynamic screen is stuck in "waiting" state (no loading, no error, no data)
  useEffect(() => {
    const screen = config?.screens[currentStep];
    if (!screen) return;

    const screenType = (screen as any).type;
    if (screenType !== "dynamic") return;

    // Check if we're in the "waiting" state - prefetch in progress but no data yet
    const isWaiting = 
      !dynamicFieldsLoading && 
      !dynamicFieldsError && 
      !dynamicFieldsCache[screen.id];

    if (!isWaiting) return;

    // Start a timeout to auto-proceed if no data comes through
    const waitingTimeout = setTimeout(() => {
      console.log("⏰ Dynamic screen waiting timeout reached, auto-proceeding...");
      
      // Show a brief message before advancing
      setDynamicFieldsError("Taking too long to load - proceeding...");
      
      // Auto-advance after a brief delay to show the message
      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          nextStep();
        }
      }, 1500);
    }, DYNAMIC_SCREEN_WAITING_TIMEOUT);

    return () => clearTimeout(waitingTimeout);
  }, [currentStep, config, dynamicFieldsLoading, dynamicFieldsError, dynamicFieldsCache, totalSteps, nextStep]);

  // Create step definitions from visible screens (respects conditional visibility)
  const stepDefinitions = useMemo(
    () => {
      if (!visibleScreens || !Array.isArray(visibleScreens) || visibleScreens.length === 0) {
        return [];
      }
      return visibleScreens.map((screen, index) => ({
        id: screen.id || `step-${index}`,
        title: screen.title || `Step ${index + 1}`,
      }));
    },
    [visibleScreens]
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

  // Use visible screens for current screen (respects conditional visibility)
  const currentScreen = visibleScreens[currentStep];
  const displayedProgress = Math.round(fakeProgress);

  // Reset generation and go back to form
  const handleRetryGeneration = () => {
    setGenerationError(null);
    setIsTokenExpired(false);
    setIsGenerating(false);
    setSubmitting(false);
    setFakeProgress(0);
    setGenerationStepIndex(0);
    setRetryTurnstileToken(null);
    setRetryTurnstileStatus('required');
  };

  // Retry generation after re-verification
  const retryGeneration = useCallback(async (newToken: string) => {
    setRetryTurnstileToken(newToken);
    setRetryTurnstileStatus('success');
    setIsTokenExpired(false);
    
    // Store the new token
    storeTurnstileToken(newToken);
    
    // Small delay to ensure token is stored
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retry the generation
    setSubmitting(true);
    setIsGenerating(true);
    setGenerationStepIndex(0);
    setFakeProgress(0);
    setGenerationError(null);
    
    try {
      console.log("🔄 [DynamicSmartFlow] Retrying generation with new token...");
      
      const response = await fetch(`/api/templates/${config.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          turnstileToken: newToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate document");
      }

      const result = await response.json();
      console.log("✅ [DynamicSmartFlow] Document generated successfully after re-verification");

      // Track document generated
      if (config) {
        trackDocumentGenerated(config.slug, config.title);
      }

      // Store result in sessionStorage for review page
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
      console.error("❌ [DynamicSmartFlow] Retry generation error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to generate document. Please try again.";
      setGenerationError(errorMessage);
      setIsGenerating(false);
      setSubmitting(false);
      setIsTokenExpired(false);
    }
  }, [formData, config, locale, router]);

  const handleSubmit = async () => {
    if (!canProceed() || !turnstileToken) return;

    // Track document generation started
    if (config) {
      trackDocumentGenerationStarted(config.slug, config.title);
    }

    setSubmitting(true);
    setIsGenerating(true);
    setGenerationStepIndex(0);
    setFakeProgress(0);
    setGenerationError(null);
    setIsTokenExpired(false);

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
        const errorMessage = error.error || "Failed to generate document";
        const errorCodes = error['error-codes'] || error.error_codes || [];
        
        // Check if this is a token expiration error
        const isTokenExpirationError = 
          response.status === 403 &&
          (errorMessage.includes("Invalid or expired verification token") ||
           errorMessage.includes("expired") ||
           errorCodes.includes('timeout-or-duplicate') ||
           errorCodes.includes('invalid-input-response'));
        
        if (isTokenExpirationError) {
          // Token expired - show re-verification widget instead of error
          setIsTokenExpired(true);
          setGenerationError(null);
          setIsGenerating(false);
          setSubmitting(false);
          return; // Exit early, don't throw error
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ [DynamicSmartFlow] Document generated successfully");

      // Track document generated
      if (config) {
        trackDocumentGenerated(config.slug, config.title);
      }

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
      
      // Only set error if it's not a token expiration (which is handled above)
      if (!isTokenExpired) {
        setGenerationError(errorMessage);
        setIsGenerating(false);
        setSubmitting(false);
      }
    }
  };

  // Loading Screen - shows during document generation
  if (isGenerating || generationError || isTokenExpired) {
    const currentStage =
      GENERATION_STEPS[Math.min(generationStepIndex, GENERATION_STEPS.length - 1)];

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--bg))] px-4">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.14),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.08),_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-2xl">
          {/* Token Expiration - Show Turnstile Widget */}
          {isTokenExpired ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-amber-200 bg-background p-8 shadow-xl text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50">
                <AlertTriangle className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-[hsl(var(--fg))] mb-3 font-heading">
                Verification Expired
              </h2>
              <p className="text-[hsl(var(--brand-muted))] mb-6 leading-relaxed">
                Your verification has expired. Please verify again to continue generating your document.
              </p>
              
              {/* Inline Turnstile Widget */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                  <>
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      retry="auto"
                      refreshExpired="auto"
                      sandbox={false}
                      onError={() => {
                        setRetryTurnstileStatus("error");
                        setRetryTurnstileToken(null);
                      }}
                      onExpire={() => {
                        setRetryTurnstileStatus("expired");
                        setRetryTurnstileToken(null);
                      }}
                      onLoad={() => {
                        setRetryTurnstileStatus("required");
                      }}
                      onVerify={(token) => {
                        setRetryTurnstileStatus("success");
                        setRetryTurnstileToken(token);
                        // Automatically retry generation with new token
                        retryGeneration(token);
                      }}
                    />
                    {retryTurnstileStatus === 'success' && retryTurnstileToken && (
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                        <Check className="h-4 w-4" />
                        <span>Verification complete. Retrying generation...</span>
                      </div>
                    )}
                    {retryTurnstileStatus === 'error' && (
                      <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Verification failed. Please try again.</span>
                      </div>
                    )}
                    {retryTurnstileStatus === 'expired' && (
                      <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Verification expired. Please verify again.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                    <AlertTriangle className="mx-auto h-5 w-5 text-amber-600 mb-2" />
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Turnstile configuration missing
                    </p>
                    <p className="text-xs text-amber-700">
                      Please set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> in your environment variables.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetryGeneration}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('generation.goBack')}
                </Button>
              </div>
            </motion.div>
          ) : generationError ? (
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
                        className={`flex items-center gap-3 text-sm transition-all duration-300 ${isCompleted
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
                      className={`h-1.5 rounded-full transition-all ${index === currentTipIndex
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
      // Use visible screen for the current step
      const screen = visibleScreens[currentStep];

      // Track step completion
      if (config && screen) {
        trackStepCompleted(currentStep + 1, screen.id || screen.title || `step_${currentStep + 1}`, config.slug);
      }

      // Trigger AI enrichment without waiting for the response
      runAiEnrichmentInBackground(screen);

      // Clear validation errors when proceeding successfully
      setShowValidationErrors(false);
      nextStep();
    } else {
      // Show validation errors when user tries to proceed without filling required fields
      setShowValidationErrors(true);
      
      // Scroll to first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-field-error="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
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
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <Image
              src="/Selise Legal Templates.svg"
              alt="SELISE Legal Templates"
              width={424}
              height={241}
              className="h-16 w-auto"
              priority
            />
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
                <p><strong className="text-[hsl(var(--brand-primary))]">{t('welcome.reviewRequired')}</strong> {t('welcome.reviewRequiredText')}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Human Verification - Simplified styling */}
          <div className="mb-6 rounded-lg border border-[hsl(var(--brand-border))] bg-card p-4">
            <div className="mb-3 text-center">
              <h3 className="text-sm font-medium text-[hsl(var(--fg))] font-heading">
                Security verification
              </h3>
            </div>
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <div className="flex flex-col items-center gap-3">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  retry="auto"
                  refreshExpired="auto"
                  sandbox={false}
                  theme="light"
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
            className="inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--brand-primary-foreground))] shadow-lg transition-all hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
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
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--brand-primary))]" />
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
              {/* Card Container - Premium Glassmorphism */}
              <div className="bg-gradient-to-br from-background/95 to-[hsl(var(--brand-primary))/5] backdrop-blur-xl rounded-3xl shadow-xl shadow-[hsl(var(--brand-primary))/5] border border-[hsl(var(--border))] p-5 sm:p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--brand-primary))/5] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Screen Header with Icon */}
                <div className="mb-6 sm:mb-8 space-y-3">
                  {currentScreen?.title && (() => {
                    const IconComponent = getScreenIcon(currentScreen.title);
                    return (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
                        <IconComponent className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
                      {currentScreen?.title}
                    </h2>
                    {currentScreen?.description && (
                      <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
                        {currentScreen.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Validation Error Banner */}
                {showValidationErrors && Object.keys(errors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 md:p-5 shadow-md shadow-amber-200/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg text-amber-800">
                          Please fill in the required fields
                        </h3>
                        <p className="text-sm text-amber-700">
                          The following fields are required to continue:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                          {Object.entries(errors).map(([fieldName, errorMessage]) => {
                            const field = getVisibleFields(currentScreen).find(f => f.name === fieldName);
                            return (
                              <li key={fieldName} className="text-amber-800">
                                <strong>{field?.label || fieldName}</strong>: {errorMessage}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Fields with Staggered Animation */}
                <motion.div
                  className="space-y-5 sm:space-y-8 relative z-10"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {/* Dynamic Screen: Show loading or generated fields */}
                  <AnimatePresence mode="popLayout">
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
                              <div className="flex items-center gap-2 text-xs text-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))]/5 px-3 py-2 rounded-lg border border-[hsl(var(--brand-primary))]/20">
                                <Wand2 className="h-3.5 w-3.5" />
                                <span>Additional questions based on your context</span>
                              </div>
                            </div>

                            {/* Apply Standards Banner for Dynamic Screens - shown before fields */}
                            {(() => {
                              const fields = dynamicFieldsCache[currentScreen.id];
                              // Get only unfilled fields with standard values
                              const unfilledFieldsWithStandards = fields.filter(
                                (f) => f.standardValue && (!formData[f.name] || formData[f.name] === '')
                              );
                              
                              // Show banner if there are unfilled fields with standards
                              if (unfilledFieldsWithStandards.length > 0) {
                                return (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 mb-6"
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
                                            Auto-fill {unfilledFieldsWithStandards.length} field{unfilledFieldsWithStandards.length !== 1 ? 's' : ''} with local standards
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        onClick={() => {
                                          // Track standards applied
                                          if (config) {
                                            const unfilledCount = fields.filter(
                                              (f) => f.standardValue && (!formData[f.name] || formData[f.name] === '')
                                            ).length;
                                            if (unfilledCount > 0) {
                                              trackStandardsApplied(config.slug, unfilledCount);
                                            }
                                          }
                                          // Use recursive apply to handle conditionally visible fields
                                          applyDynamicStandardsRecursively(currentScreen.id, fields);
                                        }}
                                        disabled={applyingStandard}
                                        className="flex items-center gap-2 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] px-5 shadow-md hover:shadow-lg transition-all font-medium [&>*]:!text-white [&_svg]:!text-white"
                                        style={{ color: 'white' }}
                                      >
                                        <Zap className="h-4 w-4" />
                                        Apply Standards
                                      </Button>
                                    </div>
                                  </motion.div>
                                );
                              }
                              
                              // Show success state when all fields with standards are filled
                              if (appliedStandard && fields.some(f => f.standardValue)) {
                                return (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6"
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
                                );
                              }
                              
                              return null;
                            })()}

                            {dynamicFieldsCache[currentScreen.id].map((field) => (
                              <motion.div
                                key={field.id}
                                variants={{
                                  hidden: { opacity: 0, y: 20 },
                                  show: { opacity: 1, y: 0 }
                                }}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, y: -20 }}
                                layout
                                data-field-error={errors[field.name] ? "true" : undefined}
                              >
                                <DynamicField
                                  field={{
                                    ...field,
                                    type: field.type as any,
                                    // Enable AI suggestion for fields with standardValue
                                    aiSuggestionEnabled: !!field.standardValue,
                                    aiSuggestionKey: field.standardValue ? `_dynamic_${field.name}` : undefined,
                                  } as FieldConfig}
                                  value={formData[field.name]}
                                  onChange={setFieldValue}
                                  error={errors[field.name]}
                                  // Inject standardValue into enrichmentContext so field renderers can find it
                                  enrichmentContext={{
                                    ...enrichmentContext,
                                    ...(field.standardValue ? { [`_dynamic_${field.name}`]: field.standardValue } : {}),
                                  }}
                                  formData={formData}
                                />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}

                        {/* Show waiting state while prefetch is in progress (no loading spinner, no error, no data yet) */}
                        {!dynamicFieldsLoading && !dynamicFieldsError && !dynamicFieldsCache[currentScreen.id] && (
                          <div className="py-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--selise-blue))] animate-pulse" />
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--selise-blue))] animate-pulse [animation-delay:0.2s]" />
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--selise-blue))] animate-pulse [animation-delay:0.4s]" />
                              </div>
                              <p className="text-[hsl(var(--globe-grey))]">
                                Preparing dynamic questions...
                              </p>
                              <p className="text-sm text-[hsl(var(--globe-grey))] opacity-70">
                                This may take a moment. Will auto-continue shortly if needed.
                              </p>
                            </div>
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
                      /* Standard Screen: Show regular fields (filtered by conditions) */
                      <>
                        {/* Apply Standards Banner for Standard Screens - shown before fields */}
                        {(currentScreen as any)?.enableApplyStandards && currentScreen && (() => {
                          const fieldsWithSuggestions = getFieldsWithSuggestions(
                            getVisibleFields(currentScreen) || [],
                            enrichmentContext
                          );
                          // Get only the unfilled fields with suggestions
                          const unfilledFieldsWithSuggestions = fieldsWithSuggestions.filter(
                            (f) => !formData[f.name] || formData[f.name] === ''
                          );

                          // Show banner if there are unfilled fields with suggestions
                          // This allows the banner to reappear when conditionally visible fields become visible
                          if (unfilledFieldsWithSuggestions.length > 0) {
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 mb-6"
                              >
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/80">
                                      <Zap className="h-5 w-5 text-amber-700" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-[hsl(var(--fg))]">
                                        Save time with smart defaults
                                      </p>
                                      <p className="text-sm text-[hsl(var(--globe-grey))]">
                                        Auto-fill {unfilledFieldsWithSuggestions.length} field{unfilledFieldsWithSuggestions.length !== 1 ? 's' : ''} with AI-suggested values
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      // Track standards applied
                                      if (config) {
                                        const fieldsWithSuggestions = getFieldsWithSuggestions(
                                          getVisibleFields(currentScreen) || [],
                                          enrichmentContext
                                        );
                                        const unfilledCount = fieldsWithSuggestions.filter(
                                          (f) => !formData[f.name] || formData[f.name] === ''
                                        ).length;
                                        if (unfilledCount > 0) {
                                          trackStandardsApplied(config.slug, unfilledCount);
                                        }
                                      }
                                      // Use recursive apply to handle conditionally visible fields
                                      applyStandardsRecursively(currentScreen);
                                    }}
                                    disabled={applyingStandard}
                                    className="flex items-center gap-2 bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] px-5 shadow-md hover:shadow-lg transition-all font-medium [&>*]:!text-white [&_svg]:!text-white"
                                    style={{ color: 'white' }}
                                  >
                                    <Zap className="h-4 w-4" />
                                    Apply Standards
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          }
                          
                          // Show success state only when all fields with suggestions are filled
                          if (appliedStandard && fieldsWithSuggestions.length > 0) {
                            return (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200">
                                    <Check className="h-5 w-5 text-emerald-700" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-emerald-800">
                                      Smart defaults applied!
                                    </p>
                                    <p className="text-sm text-emerald-600">
                                      Fields have been filled with recommended values
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          
                          return null;
                        })()}

                        <AnimatePresence mode="popLayout">
                          {currentScreen && getVisibleFields(currentScreen).map((field) => (
                            <motion.div
                              key={field.id}
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                              }}
                              initial="hidden"
                              animate="show"
                              exit={{ opacity: 0, scale: 0.95 }}
                              layout
                              data-field-error={errors[field.name] ? "true" : undefined}
                            >
                              <DynamicField
                                field={field as FieldConfig}
                                value={formData[field.name]}
                                onChange={setFieldValue}
                                error={errors[field.name]}
                                enrichmentContext={enrichmentContext}
                                formData={formData}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>

                      </>
                    )}
                  </AnimatePresence>
                </motion.div>

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
                        disabled={
                          dynamicFieldsLoading || 
                          ((currentScreen as any)?.type === "dynamic" && 
                           (!dynamicFieldsCache[currentScreen?.id || ""] || 
                            prefetchingStepIndices.has(currentStep)))
                        }
                        className="flex items-center gap-2 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 group transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(var(--brand-primary))/20]"
                        size="lg"
                      >
                        {dynamicFieldsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span className="text-sm sm:text-base">Loading...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm sm:text-base">{t('navigation.continue')}</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            isSubmitting || 
                            !turnstileToken || 
                            turnstileStatus !== "success" ||
                            dynamicFieldsLoading ||
                            ((currentScreen as any)?.type === "dynamic" && 
                             (!dynamicFieldsCache[currentScreen?.id || ""] ||
                              prefetchingStepIndices.has(currentStep)))
                          }
                          className="flex items-center gap-2 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 bg-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary-foreground))] hover:bg-[hsl(var(--brand-primary))/90] shadow-lg shadow-[hsl(var(--brand-primary))/20] group transition-all duration-300"
                          size="lg"
                        >
                          {(dynamicFieldsLoading || ((currentScreen as any)?.type === "dynamic" && prefetchingStepIndices.has(currentStep))) ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              <span className="text-sm sm:text-base">Loading...</span>
                            </>
                          ) : isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              <span className="text-sm sm:text-base">Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                              <span className="text-sm sm:text-base">Generate Document</span>
                            </>
                          )}
                        </Button>
                      </motion.div>
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
        </div >
      </div >

      {/* Bottom padding */}
      < div className="pb-6" />
    </div >
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
