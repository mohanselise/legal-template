import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Interpolate variables in a string template.
 * Replaces {{variableName}} or {{path.to.value}} with values from the data object.
 * Supports {{variableName|fallback text}} syntax for fallback values.
 * 
 * @param template - String containing {{variable}} placeholders
 * @param data - Object containing values to interpolate
 * @returns String with variables replaced by their values
 * 
 * @example
 * interpolateVariables("Hello {{name}}", { name: "John" }) // "Hello John"
 * interpolateVariables("Company: {{company.name}}", { company: { name: "Acme" } }) // "Company: Acme"
 * interpolateVariables("Hello {{name|there}}", {}) // "Hello there"
 */
export function interpolateVariables(
  template: string | undefined | null,
  data: Record<string, unknown>
): string {
  if (!template) return "";
  
  return template.replace(/\{\{([^}|]+)(?:\|([^}]*))?\}\}/g, (match, path: string, fallbackText: string | undefined) => {
    const trimmedPath = path.trim();
    const fallback = fallbackText !== undefined && fallbackText.trim() !== "" 
      ? fallbackText.trim() 
      : match; // Keep original placeholder if no fallback provided
    
    // Handle nested paths like "company.name" or "user.contact.email"
    const parts = trimmedPath.split(".");
    let value: unknown = data;
    
    for (const part of parts) {
      if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        // Path not found, return fallback text or original placeholder
        return fallback;
      }
    }
    
    // Convert value to string, handle various types
    if (value === null || value === undefined) {
      return fallback; // Use fallback if value is null/undefined
    }
    
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    
    // For arrays and objects, return fallback or original placeholder
    return fallback;
  });
}
