import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Interpolate variables in a string template.
 * Replaces {{variableName}} or {{path.to.value}} with values from the data object.
 * 
 * @param template - String containing {{variable}} placeholders
 * @param data - Object containing values to interpolate
 * @returns String with variables replaced by their values
 * 
 * @example
 * interpolateVariables("Hello {{name}}", { name: "John" }) // "Hello John"
 * interpolateVariables("Company: {{company.name}}", { company: { name: "Acme" } }) // "Company: Acme"
 */
export function interpolateVariables(
  template: string | undefined | null,
  data: Record<string, unknown>
): string {
  if (!template) return "";
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
    const trimmedPath = path.trim();
    
    // Handle nested paths like "company.name" or "user.contact.email"
    const parts = trimmedPath.split(".");
    let value: unknown = data;
    
    for (const part of parts) {
      if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        // Path not found, return original placeholder
        return match;
      }
    }
    
    // Convert value to string, handle various types
    if (value === null || value === undefined) {
      return match; // Keep placeholder if value is null/undefined
    }
    
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    
    // For arrays and objects, return the original placeholder
    return match;
  });
}
