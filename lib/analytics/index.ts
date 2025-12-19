'use client';

/**
 * Centralized Analytics Module
 * 
 * Provides unified interface for tracking events across multiple analytics platforms
 * Currently supports: Microsoft Clarity
 * Future: Google Analytics 4 events
 */

import { trackEvent as clarityTrackEvent, setTag as claritySetTag, identifyUser as clarityIdentifyUser, upgradeSession as clarityUpgradeSession } from './clarity';

/**
 * Event names used throughout the application
 */
export const AnalyticsEvents = {
  // SmartFlow Events
  SMARTFLOW_STARTED: 'smartflow_started',
  STEP_COMPLETED: 'step_completed',
  STANDARDS_APPLIED: 'standards_applied',
  DOCUMENT_GENERATION_STARTED: 'document_generation_started',
  DOCUMENT_GENERATED: 'document_generated',
  
  // Template Review Events
  DOCUMENT_PREVIEW_LOADED: 'document_preview_loaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_SENT_SELISE: 'document_sent_selise',
  SIGNATURE_FIELD_ADDED: 'signature_field_added',
  SIGNATURE_FIELD_REMOVED: 'signature_field_removed',
  DOCUMENT_EDITED: 'document_edited',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

/**
 * Track an analytics event across all enabled platforms
 * @param eventName - Name of the event
 * @param metadata - Optional metadata to attach to the event
 */
export function trackEvent(eventName: AnalyticsEventName, metadata?: Record<string, unknown>): void {
  // Track in Clarity
  clarityTrackEvent(eventName);
  
  // If metadata provided, set as tags in Clarity
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const tagValue = Array.isArray(value) 
          ? value.map(String)
          : String(value);
        claritySetTag(key, tagValue);
      }
    });
  }
  
  // Future: Add Google Analytics 4 event tracking here
  // if (window.gtag) {
  //   window.gtag('event', eventName, metadata);
  // }
}

/**
 * Track a step completion in the smartflow
 * @param stepNumber - Current step number
 * @param stepName - Name/ID of the step
 * @param templateSlug - Template being used
 */
export function trackStepCompleted(
  stepNumber: number,
  stepName: string,
  templateSlug: string
): void {
  trackEvent(AnalyticsEvents.STEP_COMPLETED, {
    step_number: stepNumber,
    step_name: stepName,
    template_slug: templateSlug,
  });
}

/**
 * Track document generation start
 * @param templateSlug - Template being generated
 * @param templateTitle - Template title
 */
export function trackDocumentGenerationStarted(
  templateSlug: string,
  templateTitle: string
): void {
  trackEvent(AnalyticsEvents.DOCUMENT_GENERATION_STARTED, {
    template_slug: templateSlug,
    template_title: templateTitle,
  });
  
  // Upgrade session for document generation (important event)
  clarityUpgradeSession('document_generation_started');
}

/**
 * Track successful document generation
 * @param templateSlug - Template that was generated
 * @param templateTitle - Template title
 */
export function trackDocumentGenerated(
  templateSlug: string,
  templateTitle: string
): void {
  trackEvent(AnalyticsEvents.DOCUMENT_GENERATED, {
    template_slug: templateSlug,
    template_title: templateTitle,
  });
}

/**
 * Track smartflow start
 * @param templateSlug - Template being started
 * @param templateTitle - Template title
 */
export function trackSmartflowStarted(
  templateSlug: string,
  templateTitle: string
): void {
  trackEvent(AnalyticsEvents.SMARTFLOW_STARTED, {
    template_slug: templateSlug,
    template_title: templateTitle,
  });
}

/**
 * Track standards application
 * @param templateSlug - Template being used
 * @param fieldsApplied - Number of fields that had standards applied
 */
export function trackStandardsApplied(
  templateSlug: string,
  fieldsApplied: number
): void {
  trackEvent(AnalyticsEvents.STANDARDS_APPLIED, {
    template_slug: templateSlug,
    fields_applied: fieldsApplied,
  });
}

/**
 * Track document download
 * @param templateSlug - Template that was downloaded
 */
export function trackDocumentDownloaded(templateSlug: string): void {
  trackEvent(AnalyticsEvents.DOCUMENT_DOWNLOADED, {
    template_slug: templateSlug,
  });
}

/**
 * Track document sent to SELISE for signature
 * @param templateSlug - Template that was sent
 * @param signatoryCount - Number of signatories
 */
export function trackDocumentSentSelise(
  templateSlug: string,
  signatoryCount: number
): void {
  trackEvent(AnalyticsEvents.DOCUMENT_SENT_SELISE, {
    template_slug: templateSlug,
    signatory_count: signatoryCount,
  });
  
  // Upgrade session for signature sending (important conversion event)
  clarityUpgradeSession('document_sent_for_signature');
}

/**
 * Track document preview loaded
 * @param templateSlug - Template that was previewed
 */
export function trackDocumentPreviewLoaded(templateSlug: string): void {
  trackEvent(AnalyticsEvents.DOCUMENT_PREVIEW_LOADED, {
    template_slug: templateSlug,
  });
}

/**
 * Track signature field added
 * @param templateSlug - Template being edited
 * @param fieldType - Type of signature field (signature, date, etc.)
 */
export function trackSignatureFieldAdded(
  templateSlug: string,
  fieldType: string
): void {
  trackEvent(AnalyticsEvents.SIGNATURE_FIELD_ADDED, {
    template_slug: templateSlug,
    field_type: fieldType,
  });
}

/**
 * Track signature field removed
 * @param templateSlug - Template being edited
 */
export function trackSignatureFieldRemoved(templateSlug: string): void {
  trackEvent(AnalyticsEvents.SIGNATURE_FIELD_REMOVED, {
    template_slug: templateSlug,
  });
}

/**
 * Track document edit
 * @param templateSlug - Template being edited
 * @param editType - Type of edit (text, signature_field, etc.)
 */
export function trackDocumentEdited(
  templateSlug: string,
  editType: string
): void {
  trackEvent(AnalyticsEvents.DOCUMENT_EDITED, {
    template_slug: templateSlug,
    edit_type: editType,
  });
}

// Re-export Clarity utilities for direct use if needed
export { initClarity, identifyUser as clarityIdentifyUser, setTag as claritySetTag, upgradeSession as clarityUpgradeSession } from './clarity';
