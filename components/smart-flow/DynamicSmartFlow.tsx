"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Check,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DynamicFormProvider,
  useDynamicForm,
  type TemplateConfig,
} from "./DynamicFormContext";
import { DynamicField, type FieldConfig } from "./field-renderers";
import { Button } from "@/components/ui/button";
import { Turnstile } from "next-turnstile";
import { setTurnstileToken as storeTurnstileToken } from "@/lib/turnstile-token-manager";
import { saveTemplateReview } from "@/components/template-review/TemplateReviewStorage";

interface DynamicSmartFlowProps {
  config: TemplateConfig;
  locale: string;
}

function DynamicSmartFlowContent({ locale }: { locale: string }) {
  const {
    config,
    formData,
    setFieldValue,
    errors,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    canProceed,
    isSubmitting,
    setSubmitting,
  } = useDynamicForm();

  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
      </div>
    );
  }

  const currentScreen = config.screens[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleContinue = () => {
    if (canProceed()) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed() || !turnstileToken) return;

    setSubmitting(true);
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

      // Redirect to review page
      router.push(`/${locale}/templates/${config.slug}/review`);
    } catch (error) {
      console.error("❌ [DynamicSmartFlow] Generation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate document. Please try again."
      );
      setSubmitting(false);
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
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="text-sm text-[hsl(var(--brand-muted))] font-medium">
            Step {currentStep + 1} of {totalSteps}:{" "}
            {currentScreen?.title || "Review"}
          </div>
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
                  {currentScreen?.fields.map((field) => (
                    <DynamicField
                      key={field.id}
                      field={field as FieldConfig}
                      value={formData[field.name]}
                      onChange={setFieldValue}
                      error={errors[field.name]}
                    />
                  ))}
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
                      className="flex items-center gap-3 px-8 py-4"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
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
              className={`h-2 rounded-full transition-all ${
                index <= currentStep
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

