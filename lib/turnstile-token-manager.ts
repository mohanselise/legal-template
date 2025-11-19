/**
 * Turnstile Token Manager
 * 
 * Simple token storage/retrieval for Turnstile tokens.
 * Token expiration is handled by Cloudflare's validation API.
 * We only protect the generate API call (Step 8), not subsequent requests.
 */

const TOKEN_STORAGE_KEY = 'turnstile-token';

/**
 * Get the current Turnstile token from sessionStorage
 */
export function getTurnstileToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Store a Turnstile token
 */
export function setTurnstileToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * Clear the Turnstile token
 */
export function clearTurnstileToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

