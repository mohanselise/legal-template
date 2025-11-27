/**
 * Template Initialization
 * 
 * This module handles registration of all templates with the registry.
 * Import this at the app entry point to ensure all templates are registered.
 */

import { registerTemplate } from './registry';
import { employmentAgreementConfig } from './employment-agreement/config';

// Flag to prevent double initialization
let initialized = false;

/**
 * Initialize all templates
 * 
 * This function should be called once at app startup.
 * It registers all template configurations with the registry.
 */
export function initializeTemplates(): void {
  if (initialized) {
    return;
  }

  // Register Employment Agreement template
  // Note: The full config includes step components which are loaded separately
  // in the app layer to support code splitting
  registerTemplate({
    ...employmentAgreementConfig,
    // Steps are defined in the app layer for code splitting
    steps: [],
  });

  initialized = true;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Templates] Initialized template registry');
  }
}

/**
 * Get initialization status
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization (for testing)
 */
export function resetInitialization(): void {
  initialized = false;
}

// Auto-initialize when this module is imported
initializeTemplates();

