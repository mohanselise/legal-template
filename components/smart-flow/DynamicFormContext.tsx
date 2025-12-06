"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { TemplateScreen, TemplateField } from "@/lib/db";
import {
  ADDITIONAL_SIGNATORIES_FIELD_NAME,
  AdditionalSignatoryInput,
  ensureAdditionalSignatoryArray,
} from "@/lib/templates/signatory-fields";
import { evaluateConditions } from "@/lib/templates/conditions";

export interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

export interface TemplateConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  screens: ScreenWithFields[];
}

interface DynamicFormContextType {
  // Template configuration
  config: TemplateConfig | null;

  // Form data
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
  setFieldValue: (name: string, value: unknown) => void;

  // Validation
  errors: Record<string, string>;
  validateField: (name: string) => boolean;
  validateScreen: (screenIndex: number) => boolean;
  clearErrors: () => void;

  // Navigation
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceed: () => boolean;

  // Conditional visibility
  visibleScreens: ScreenWithFields[];
  visibleScreenIndices: number[];
  getVisibleFields: (screen: ScreenWithFields) => TemplateField[];
  isScreenVisible: (screenIndex: number) => boolean;
  isFieldVisible: (field: TemplateField) => boolean;

  // Status
  isLoading: boolean;
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;

  // AI Enrichment
  enrichmentContext: Record<string, any>;
  setEnrichmentContext: (context: Record<string, any>) => void;
}

const DynamicFormContext = createContext<DynamicFormContextType | undefined>(undefined);

interface DynamicFormProviderProps {
  children: React.ReactNode;
  config: TemplateConfig;
  initialData?: Record<string, unknown>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAdditionalSignatories(value: unknown): {
  valid: boolean;
  message?: string;
} {
  const entries = ensureAdditionalSignatoryArray(value);
  const activeEntries = entries.filter((entry) => {
    const stringsToCheck = [entry.name, entry.email, entry.title, entry.phone];
    return stringsToCheck.some((text) => typeof text === "string" && text.trim().length > 0);
  });

  if (activeEntries.length === 0) {
    return { valid: true };
  }

  for (let index = 0; index < activeEntries.length; index++) {
    const entry = activeEntries[index] as AdditionalSignatoryInput;
    const label = `Additional signatory #${index + 1}`;

    if (!entry.name?.trim()) {
      return { valid: false, message: `${label} requires a name.` };
    }

    if (!entry.email?.trim()) {
      return { valid: false, message: `${label} requires an email address.` };
    }

    if (!EMAIL_REGEX.test(entry.email.trim())) {
      return { valid: false, message: `${label} email address is invalid.` };
    }
  }

  return { valid: true };
}

export function DynamicFormProvider({
  children,
  config,
  initialData = {},
}: DynamicFormProviderProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrichmentContext, setEnrichmentContextState] = useState<Record<string, any>>({});

  // Compute visible screens based on conditions
  const { visibleScreens, visibleScreenIndices } = useMemo(() => {
    const visible: ScreenWithFields[] = [];
    const indices: number[] = [];

    config.screens.forEach((screen, index) => {
      // Check if screen has conditions and evaluate them
      const conditions = (screen as any).conditions;
      if (evaluateConditions(conditions, formData)) {
        visible.push(screen);
        indices.push(index);
      }
    });

    return { visibleScreens: visible, visibleScreenIndices: indices };
  }, [config.screens, formData]);

  const totalSteps = visibleScreens.length;

  const updateFormData = useCallback((updates: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is updated
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Check if a screen is visible based on its conditions
  const isScreenVisible = useCallback((screenIndex: number): boolean => {
    const screen = config.screens[screenIndex];
    if (!screen) return false;
    const conditions = (screen as any).conditions;
    return evaluateConditions(conditions, formData);
  }, [config.screens, formData]);

  // Check if a field is visible based on its conditions
  const isFieldVisible = useCallback((field: TemplateField): boolean => {
    const conditions = (field as any).conditions;
    return evaluateConditions(conditions, formData);
  }, [formData]);

  // Get only visible fields for a screen
  const getVisibleFields = useCallback((screen: ScreenWithFields): TemplateField[] => {
    return screen.fields.filter((field) => {
      const conditions = (field as any).conditions;
      return evaluateConditions(conditions, formData);
    });
  }, [formData]);

  const validateField = useCallback((name: string): boolean => {
    // Find the field in the current config
    for (const screen of config.screens) {
      const field = screen.fields.find((f) => f.name === name);
      if (field) {
        const value = formData[name];

        if (field.name === ADDITIONAL_SIGNATORIES_FIELD_NAME) {
          const validation = validateAdditionalSignatories(value);
          if (!validation.valid) {
            setErrors((prev) => ({
              ...prev,
              [name]: validation.message || "Please review additional signatories",
            }));
            return false;
          }

          setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
          return true;
        }

        // Check required
        if (field.required) {
          if (value === undefined || value === null || value === "") {
            setErrors((prev) => ({
              ...prev,
              [name]: `${field.label} is required`,
            }));
            return false;
          }
        }

        // Check email format
        if (field.type === "email" && value) {
          if (!EMAIL_REGEX.test(value as string)) {
            setErrors((prev) => ({
              ...prev,
              [name]: "Please enter a valid email address",
            }));
            return false;
          }
        }

        // Clear error if valid
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return true;
      }
    }
    return true;
  }, [config.screens, formData]);

  const validateScreen = useCallback((screenIndex: number): boolean => {
    // Use visible screens for validation - screenIndex is relative to visible screens
    const screen = visibleScreens[screenIndex];
    if (!screen) return true;

    // Only validate visible fields
    const fieldsToValidate = getVisibleFields(screen);

    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const field of fieldsToValidate) {
      const value = formData[field.name];

      if (field.name === ADDITIONAL_SIGNATORIES_FIELD_NAME) {
        const validation = validateAdditionalSignatories(value);
        if (!validation.valid) {
          newErrors[field.name] = validation.message || "Please review additional signatories";
          isValid = false;
        }
        continue;
      }

      // Check required
      if (field.required) {
        if (value === undefined || value === null || value === "") {
          newErrors[field.name] = `${field.label} is required`;
          isValid = false;
          continue;
        }
      }

      // Check email format
      if (field.type === "email" && value) {
        if (!EMAIL_REGEX.test(value as string)) {
          newErrors[field.name] = "Please enter a valid email address";
          isValid = false;
        }
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  }, [visibleScreens, formData, getVisibleFields]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const canProceed = useCallback((): boolean => {
    return validateScreen(currentStep);
  }, [validateScreen, currentStep]);

  const goToStep = useCallback((step: number) => {
    // Step is relative to visible screens
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    if (canProceed() && currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Ensure currentStep is valid when visible screens change
  // This handles cases where a previously visible screen becomes hidden
  React.useEffect(() => {
    if (currentStep >= totalSteps && totalSteps > 0) {
      setCurrentStep(totalSteps - 1);
    }
  }, [totalSteps, currentStep]);

  const setSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  const setEnrichmentContext = useCallback((context: Record<string, any>) => {
    setEnrichmentContextState((prev) => ({ ...prev, ...context }));
  }, []);

  const value: DynamicFormContextType = {
    config,
    formData,
    updateFormData,
    setFieldValue,
    errors,
    validateField,
    validateScreen,
    clearErrors,
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    canProceed,
    visibleScreens,
    visibleScreenIndices,
    getVisibleFields,
    isScreenVisible,
    isFieldVisible,
    isLoading,
    isSubmitting,
    setSubmitting,
    enrichmentContext,
    setEnrichmentContext,
  };

  return (
    <DynamicFormContext.Provider value={value}>
      {children}
    </DynamicFormContext.Provider>
  );
}

export function useDynamicForm() {
  const context = useContext(DynamicFormContext);
  if (!context) {
    throw new Error("useDynamicForm must be used within DynamicFormProvider");
  }
  return context;
}
