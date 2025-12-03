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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Turnstile } from "next-turnstile";
import { setTurnstileToken as storeTurnstileToken } from "@/lib/turnstile-token-manager";
import { saveTemplateReview } from "@/components/template-review/TemplateReviewStorage";

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
interface DynamicField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: string[];
}

// Cache for generated dynamic fields per screen
type DynamicFieldsCache = Record<string, DynamicField[]>;

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
  const isNavigatingRef = useRef(false);
  const aiEnrichmentPendingCount = useRef(0);
  const aiEnrichmentResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic screen state
  const [dynamicFieldsCache, setDynamicFieldsCache] = useState<DynamicFieldsCache>({});
  const [dynamicFieldsLoading, setDynamicFieldsLoading] = useState(false);
  const [dynamicFieldsError, setDynamicFieldsError] = useState<string | null>(null);
  const dynamicFieldsFetchedRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    return () => {
      if (aiEnrichmentResetTimeout.current) {
        clearTimeout(aiEnrichmentResetTimeout.current);
      }
    };
  }, []);

  // Fetch dynamic fields when entering a dynamic screen
  useEffect(() => {
    const screen = config?.screens[currentStep];
    if (!screen) return;

    // Check if this is a dynamic screen
    const screenType = (screen as any).type;
    const dynamicPrompt = (screen as any).dynamicPrompt;
    const dynamicMaxFields = (screen as any).dynamicMaxFields || 5;

    if (screenType !== "dynamic" || !dynamicPrompt) return;

    // Check if we already have cached fields for this screen
    if (dynamicFieldsCache[screen.id]) return;

    // Check if we already fetched for this screen (avoid double-fetch)
    if (dynamicFieldsFetchedRef.current.has(screen.id)) return;
    dynamicFieldsFetchedRef.current.add(screen.id);

    // Fetch dynamic fields
    const fetchDynamicFields = async () => {
      setDynamicFieldsLoading(true);
      setDynamicFieldsError(null);

      try {
        console.log("🔮 Generating dynamic fields for screen:", screen.title);
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

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
      </div>
    );
  }

  const currentScreen = config.screens[currentStep];
  const stepDefinitions = useMemo(
    () =>
      config.screens.map((screen) => ({
        id: screen.id,
        title: screen.title,
      })),
    [config.screens]
  );
  const displayedProgress = Math.round(fakeProgress);
  const runAiEnrichmentInBackground = useCallback(
    (screen: ScreenWithFields | undefined) => {
      if (!screen?.aiPrompt) {
        return;
      }

      aiEnrichmentPendingCount.current += 1;
      setAiEnrichmentState({
        status: "running",
        screenTitle: screen.title,
      });

      const payload = {
        prompt: screen.aiPrompt,
        formData: cloneFormData(formData),
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

  // Loading Screen - shows during document generation
  if (isGenerating) {
    const currentStage =
      GENERATION_STEPS[Math.min(generationStepIndex, GENERATION_STEPS.length - 1)];

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--bg))] px-4">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--brand-primary)_/_0.14),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_hsla(var(--brand-primary)_/_0.08),_transparent_60%)]" />

        <div className="relative z-10 w-full max-w-2xl">
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

            <h2 className="text-3xl font-bold text-[hsl(var(--fg))] sm:text-4xl font-heading">
              Creating Your Document
            </h2>
            <p className="mx-auto max-w-md text-lg text-[hsl(var(--brand-muted))]">
              Our AI is generating a professional document tailored to your
              specifications.
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
              <span className="text-[hsl(var(--brand-muted))]">
                Step {Math.min(generationStepIndex + 1, GENERATION_STEPS.length)}{" "}
                of {GENERATION_STEPS.length}
              </span>
              <span className="text-[hsl(var(--brand-primary))]">
                {displayedProgress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 overflow-hidden rounded-full border border-[hsl(var(--brand-primary)/0.25)] bg-[hsl(var(--brand-primary)/0.08)] shadow-inner">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--brand-primary)/0.15)] to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              {/* Progress fill */}
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--sky-blue))]"
                initial={{ width: 0 }}
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Glowing edge */}
                <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-r from-transparent to-white/30" />
              </motion.div>
            </div>

            {/* Current stage info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={generationStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
                  {currentStage.title}
                </h3>
                <p className="mt-1 text-sm text-[hsl(var(--brand-muted))]">
                  {currentStage.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Stage indicators */}
            <div className="mt-8 space-y-3">
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
                        ? "text-[hsl(var(--brand-primary))]"
                        : isCurrent
                          ? "text-[hsl(var(--fg))] font-medium"
                          : "text-[hsl(var(--muted-foreground))]"
                      }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${isCompleted
                          ? "bg-[hsl(var(--brand-primary))] text-white"
                          : isCurrent
                            ? "border-2 border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)]"
                            : "border border-[hsl(var(--border))] bg-transparent"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(var(--brand-primary))]" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span>{stage.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
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
      setIsGenerating(false);
      setSubmitting(false);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate document. Please try again."
      );
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
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(var(--brand-border))] bg-muted shadow-sm">
            <Sparkles className="h-10 w-10 text-[hsl(var(--brand-primary))]" />
          </div>
          <h1 className="mb-6 text-5xl font-semibold text-[hsl(var(--fg))] md:text-6xl font-heading">
            {config.title}
          </h1>
          <p className="mb-12 text-xl leading-relaxed text-[hsl(var(--brand-muted))]">
            {config.description}
          </p>
          <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex items-center gap-3 text-base text-[hsl(var(--fg))]">
              <Check className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <span>{totalSteps} steps</span>
            </div>
            <div className="flex items-center gap-3 text-base text-[hsl(var(--fg))]">
              <Check className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <span>~5 minutes</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 rounded-2xl border border-[hsl(var(--brand-border))] bg-muted p-6 text-left shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading">
                Before You Begin
              </h3>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
              <p>
                <strong className="text-[hsl(var(--brand-primary))]">
                  Not Legal Advice:
                </strong>{" "}
                This tool generates documents for informational purposes only.
              </p>
              <p>
                <strong className="text-[hsl(var(--brand-primary))]">
                  Review Required:
                </strong>{" "}
                Always consult a qualified legal advisor before using any
                generated document.
              </p>
            </div>
          </div>

          {/* Human Verification */}
          <div className="mb-8 rounded-2xl border border-[hsl(var(--brand-border))] bg-white p-6 shadow-sm">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-[hsl(var(--fg))] font-heading mb-2">
                Verify you are human
              </h3>
              <p className="text-sm text-[hsl(var(--brand-muted))]">
                Please complete the verification below to continue
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
                {turnstileStatus === "success" && turnstileToken && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <Check className="h-4 w-4" />
                    <span>Verification complete</span>
                  </div>
                )}
                {turnstileStatus === "error" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Verification failed. Please try again.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-800 font-medium">
                  Turnstile configuration missing
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (turnstileStatus === "success" && turnstileToken) {
                setShowWelcome(false);
              }
            }}
            disabled={turnstileStatus !== "success" || !turnstileToken}
            className="inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--brand-primary-foreground))] shadow-lg transition-transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            I Understand, Get Started
            <ArrowRight className="h-5 w-5" />
          </button>
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

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center text-sm text-[hsl(var(--brand-muted))] font-medium">
            Step {currentStep + 1} of {totalSteps}:{" "}
            {currentScreen?.title || "Review"}
          </div>

          <div className="hidden md:block">
            <Stepper
              steps={stepDefinitions}
              currentStep={currentStep}
              onStepClick={goToStep}
              allowNavigation
            />
          </div>
          <div className="md:hidden">
            <StepperCompact steps={stepDefinitions} currentStep={currentStep} />
          </div>

          <AnimatePresence>
            {aiEnrichmentState.status !== "idle" && (
              <motion.div
                key={`ai-indicator-${aiEnrichmentState.status}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full items-center gap-3 rounded-full border px-4 py-2 text-xs sm:text-sm ${aiEnrichmentState.status === "running"
                    ? "border-[hsl(var(--selise-blue))]/40 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                aria-live="polite"
              >
                {aiEnrichmentState.status === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        Analyzing{" "}
                        {aiEnrichmentState.screenTitle
                          ? `${aiEnrichmentState.screenTitle}...`
                          : "your answers..."}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[hsl(var(--brand-muted))]">
                        AI is enriching your inputs in the background.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <div className="flex flex-col">
                      <span className="font-semibold">AI enrichment issue</span>
                      <span className="text-[10px] sm:text-[11px]">
                        {aiEnrichmentState.message ||
                          "We couldn't enhance this step. You can keep going."}
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
              <div className="bg-white rounded-3xl shadow-lg border border-[hsl(var(--border))] p-8 md:p-12">
                {/* Screen Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading">
                    {currentScreen?.title}
                  </h2>
                  {currentScreen?.description && (
                    <p className="mt-2 text-[hsl(var(--brand-muted))]">
                      {currentScreen.description}
                    </p>
                  )}
                </div>

                {/* Fields */}
                <div className="space-y-6">
                  {/* Dynamic Screen: Show loading or generated fields */}
                  {(currentScreen as any)?.type === "dynamic" ? (
                    <>
                      {dynamicFieldsLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 space-y-4"
                        >
                          <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-[hsl(var(--selise-blue))]/20" />
                            <motion.div
                              className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-[hsl(var(--selise-blue))]"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <Wand2 className="absolute inset-0 m-auto h-6 w-6 text-[hsl(var(--selise-blue))]" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-[hsl(var(--fg))]">
                              Generating smart questions...
                            </p>
                            <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">
                              AI is analyzing your context to create relevant questions
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {dynamicFieldsError && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-8 space-y-4"
                        >
                          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-red-600">
                              Failed to generate questions
                            </p>
                            <p className="text-sm text-[hsl(var(--brand-muted))] mt-1">
                              {dynamicFieldsError}
                            </p>
                            <button
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
                              className="mt-4 px-4 py-2 text-sm font-medium text-[hsl(var(--selise-blue))] border border-[hsl(var(--selise-blue))] rounded-lg hover:bg-[hsl(var(--selise-blue))]/5 transition-colors"
                            >
                              Try Again
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {!dynamicFieldsLoading && !dynamicFieldsError && dynamicFieldsCache[currentScreen.id] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {/* AI Generated Badge */}
                          <div className="flex items-center gap-2 text-xs text-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/5 px-3 py-2 rounded-lg border border-[hsl(var(--selise-blue))]/20">
                            <Wand2 className="h-3.5 w-3.5" />
                            <span>AI-generated questions based on your context</span>
                          </div>
                          
                          {dynamicFieldsCache[currentScreen.id].map((field) => (
                            <DynamicField
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
                            />
                          ))}
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
                    />
                  ) : (
                    /* Standard Screen: Show regular fields */
                    currentScreen?.fields.map((field) => (
                      <DynamicField
                        key={field.id}
                        field={field as FieldConfig}
                        value={formData[field.name]}
                        onChange={setFieldValue}
                        error={errors[field.name]}
                        enrichmentContext={enrichmentContext}
                        formData={formData}
                      />
                    ))
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                  {currentStep > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={previousStep}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < totalSteps - 1 ? (
                    <Button
                      onClick={handleContinue}
                      disabled={dynamicFieldsLoading || ((currentScreen as any)?.type === "dynamic" && !dynamicFieldsCache[currentScreen?.id || ""])}
                      className="flex items-center gap-3 px-8 py-4"
                      size="lg"
                    >
                      {dynamicFieldsLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !turnstileToken || turnstileStatus !== "success"}
                      className="flex items-center gap-3 px-8 py-4 bg-[hsl(var(--lime-green))] hover:bg-[hsl(var(--poly-green))]"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Generate Document
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Hint */}
              {currentStep < totalSteps - 1 && (
                <p className="text-center mt-6 text-sm text-[hsl(var(--brand-muted))]">
                  Press{" "}
                  <kbd className="px-2 py-1 bg-white border border-[hsl(var(--border))] rounded text-xs">
                    Enter ↵
                  </kbd>{" "}
                  to continue
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Step Indicators (bottom) */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
          {config.screens.map((screen, index) => (
            <div
              key={screen.id}
              className={`h-2 rounded-full transition-all ${index <= currentStep
                  ? "bg-[hsl(var(--brand-primary))] w-12"
                  : "bg-[hsl(var(--border))] w-8"
                }`}
            />
          ))}
        </div>
      </div>
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
