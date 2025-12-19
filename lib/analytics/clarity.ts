'use client';

/**
 * Microsoft Clarity Analytics Integration
 * 
 * Provides type-safe wrappers for Clarity API calls
 */

declare global {
  interface Window {
    clarity?: {
      (action: string, ...args: unknown[]): void;
      identify?: (customId: string, customSessionId?: string, customPageId?: string, friendlyName?: string) => void;
      setTag?: (key: string, value: string | string[]) => void;
      event?: (eventName: string) => void;
      consent?: (consent: boolean) => void;
      consentV2?: (options?: { ad_Storage: 'granted' | 'denied'; analytics_Storage: 'granted' | 'denied' }) => void;
      upgrade?: (reason: string) => void;
    };
  }
}

/**
 * Initialize Microsoft Clarity
 * @param projectId - Clarity project ID from environment variable
 */
export function initClarity(projectId: string): void {
  if (typeof window === 'undefined') return;
  
  // Check if Clarity is already initialized
  if (window.clarity) {
    console.warn('[Clarity] Already initialized');
    return;
  }

  // Dynamically load Clarity script
  (function(c: Window, l: Document, a: string, r: string, i: string, t: HTMLScriptElement | null, y: HTMLScriptElement | null) {
    c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0] as HTMLScriptElement | null;
    if (y) {
      y.parentNode?.insertBefore(t, y);
    }
  })(window, document, 'clarity', 'script', 'clarity', null, null);
}

/**
 * Identify a user in Clarity
 * @param customId - Unique identifier for the customer (required)
 * @param customSessionId - Custom session identifier (optional)
 * @param customPageId - Custom page identifier (optional)
 * @param friendlyName - Friendly name for the customer (optional)
 */
export function identifyUser(
  customId: string,
  customSessionId?: string,
  customPageId?: string,
  friendlyName?: string
): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  
  if (window.clarity.identify) {
    window.clarity.identify(customId, customSessionId, customPageId, friendlyName);
  }
}

/**
 * Set a custom tag in Clarity
 * @param key - Tag key
 * @param value - Tag value(s)
 */
export function setTag(key: string, value: string | string[]): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  
  if (window.clarity.setTag) {
    window.clarity.setTag(key, value);
  }
}

/**
 * Track a custom event in Clarity
 * @param eventName - Name of the event to track
 */
export function trackEvent(eventName: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  
  if (window.clarity.event) {
    window.clarity.event(eventName);
  } else {
    // Fallback: use the main clarity function
    try {
      window.clarity('event', eventName);
    } catch (error) {
      console.warn('[Clarity] Failed to track event:', eventName, error);
    }
  }
}

/**
 * Upgrade a session for priority recording
 * @param reason - Reason for upgrading the session
 */
export function upgradeSession(reason: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  
  if (window.clarity.upgrade) {
    window.clarity.upgrade(reason);
  }
}
