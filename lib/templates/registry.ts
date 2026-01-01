/**
 * Template Registry
 * 
 * Central registry for all legal document templates.
 * Templates register themselves here and can be looked up by ID.
 */

import type { TemplateConfig, TemplateMeta } from './types';

// ==========================================
// REGISTRY STORAGE
// ==========================================

/**
 * Internal registry map storing all template configurations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const templateRegistry = new Map<string, TemplateConfig<any>>();

/**
 * Metadata-only registry for templates that may not be fully configured yet
 * (e.g., "coming soon" templates)
 */
const metadataRegistry = new Map<string, TemplateMeta>();

// ==========================================
// REGISTRATION FUNCTIONS
// ==========================================

/**
 * Register a fully configured template
 * 
 * @param config - Complete template configuration
 * @throws Error if template with same ID is already registered
 */
export function registerTemplate<TFormData>(
  config: TemplateConfig<TFormData>
): void {
  if (templateRegistry.has(config.id)) {
    console.warn(`Template "${config.id}" is already registered. Overwriting.`);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateRegistry.set(config.id, config as TemplateConfig<any>);
  metadataRegistry.set(config.id, config.meta);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Registry] Registered template: ${config.id}`);
  }
}

/**
 * Register metadata for a template that isn't fully implemented yet
 * Used for "coming soon" templates that appear in the listing but can't be used
 * 
 * @param meta - Template metadata
 */
export function registerTemplateMeta(meta: TemplateMeta): void {
  if (metadataRegistry.has(meta.id) && !templateRegistry.has(meta.id)) {
    console.warn(`Metadata for "${meta.id}" is already registered. Overwriting.`);
  }
  
  // Only set metadata if there's no full config already
  if (!templateRegistry.has(meta.id)) {
    metadataRegistry.set(meta.id, meta);
  }
}

/**
 * Unregister a template (mainly for testing)
 * 
 * @param id - Template ID to remove
 */
export function unregisterTemplate(id: string): void {
  templateRegistry.delete(id);
  metadataRegistry.delete(id);
}

/**
 * Clear all registered templates (mainly for testing)
 */
export function clearRegistry(): void {
  templateRegistry.clear();
  metadataRegistry.clear();
}

// ==========================================
// LOOKUP FUNCTIONS
// ==========================================

/**
 * Get a template configuration by ID
 * 
 * @param id - Template identifier
 * @returns Template configuration or undefined if not found
 */
export function getTemplate<TFormData = Record<string, unknown>>(
  id: string
): TemplateConfig<TFormData> | undefined {
  return templateRegistry.get(id) as TemplateConfig<TFormData> | undefined;
}

/**
 * Get a template configuration by ID, throwing if not found
 * 
 * @param id - Template identifier
 * @returns Template configuration
 * @throws Error if template is not registered
 */
export function getTemplateOrThrow<TFormData = Record<string, unknown>>(
  id: string
): TemplateConfig<TFormData> {
  const template = getTemplate<TFormData>(id);
  
  if (!template) {
    throw new Error(
      `Template "${id}" is not registered. ` +
      `Available templates: ${Array.from(templateRegistry.keys()).join(', ') || 'none'}`
    );
  }
  
  return template;
}

/**
 * Get template metadata by ID
 * 
 * @param id - Template identifier
 * @returns Template metadata or undefined if not found
 */
export function getTemplateMeta(id: string): TemplateMeta | undefined {
  // First check if we have a full config (which includes meta)
  const fullConfig = templateRegistry.get(id);
  if (fullConfig) {
    return fullConfig.meta;
  }
  
  // Fall back to metadata-only registry
  return metadataRegistry.get(id);
}

/**
 * Check if a template is registered and available for use
 * 
 * @param id - Template identifier
 * @returns true if template has full configuration
 */
export function isTemplateAvailable(id: string): boolean {
  const template = templateRegistry.get(id);
  return template?.meta.available ?? false;
}

/**
 * Check if a template ID is registered (even if just metadata)
 * 
 * @param id - Template identifier
 * @returns true if template is registered
 */
export function isTemplateRegistered(id: string): boolean {
  return metadataRegistry.has(id);
}

// ==========================================
// LISTING FUNCTIONS
// ==========================================

/**
 * Get all registered template configurations
 * 
 * @returns Array of all template configurations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTemplates(): TemplateConfig<any>[] {
  return Array.from(templateRegistry.values());
}

/**
 * Get all available (usable) templates
 * 
 * @returns Array of template configurations where available=true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAvailableTemplates(): TemplateConfig<any>[] {
  return getAllTemplates().filter(t => t.meta.available);
}

/**
 * Get all template metadata (including coming soon)
 * 
 * @returns Array of all template metadata
 */
export function getAllTemplateMeta(): TemplateMeta[] {
  return Array.from(metadataRegistry.values());
}

/**
 * Get metadata for available templates
 * 
 * @returns Array of metadata for templates where available=true
 */
export function getAvailableTemplateMeta(): TemplateMeta[] {
  return getAllTemplateMeta().filter(m => m.available);
}

/**
 * Get metadata for upcoming (coming soon) templates
 * 
 * @returns Array of metadata for templates where available=false
 */
export function getUpcomingTemplateMeta(): TemplateMeta[] {
  return getAllTemplateMeta().filter(m => !m.available);
}

/**
 * Get all template IDs
 * 
 * @returns Array of template identifiers
 */
export function getTemplateIds(): string[] {
  return Array.from(metadataRegistry.keys());
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate that a template ID is valid for dynamic routing
 * 
 * @param id - Template identifier to validate
 * @returns true if the ID is a valid, registered template
 */
export function isValidTemplateId(id: string): boolean {
  // Must be a non-empty string
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Must be registered
  return isTemplateRegistered(id);
}

/**
 * Get valid template IDs for static path generation (Next.js)
 * 
 * @returns Array of objects with templateId param for generateStaticParams
 */
export function getStaticTemplateParams(): { templateId: string }[] {
  return getTemplateIds().map(id => ({ templateId: id }));
}

// ==========================================
// TYPE HELPERS
// ==========================================

/**
 * Type guard to check if an object is a valid TemplateConfig
 */
export function isTemplateConfig(obj: unknown): obj is TemplateConfig<unknown> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const config = obj as Record<string, unknown>;
  
  return (
    typeof config.id === 'string' &&
    typeof config.meta === 'object' &&
    config.meta !== null &&
    typeof config.schema === 'object' &&
    Array.isArray(config.steps) &&
    typeof config.generation === 'object'
  );
}

/**
 * Infer the form data type from a template configuration
 * Usage: type MyFormData = InferFormData<typeof myTemplateConfig>
 */
export type InferFormData<T> = T extends TemplateConfig<infer TFormData>
  ? TFormData
  : never;

