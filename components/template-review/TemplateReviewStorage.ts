import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';

export const REVIEW_STORAGE_KEY_PREFIX = 'template-review';

type ReviewPayload = {
  document: LegalDocument;
  formData: Record<string, any>;
  templateId: string;
  templateSlug: string;
  templateTitle: string;
  storedAt?: string;
};

const isBrowser = () => typeof window !== 'undefined';

export const saveTemplateReview = (
  templateSlug: string,
  payload: ReviewPayload,
): boolean => {
  if (!isBrowser()) return false;
  try {
    sessionStorage.setItem(
      `${REVIEW_STORAGE_KEY_PREFIX}-${templateSlug}`,
      JSON.stringify({
        ...payload,
        storedAt: payload.storedAt ?? new Date().toISOString(),
      }),
    );
    return true;
  } catch (error) {
    console.warn(`[template-review] Failed to persist review payload for ${templateSlug}`, error);
    return false;
  }
};

export const loadTemplateReview = (templateSlug: string): ReviewPayload | null => {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(`${REVIEW_STORAGE_KEY_PREFIX}-${templateSlug}`);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewPayload;
  } catch (error) {
    console.warn(`[template-review] Failed to load review payload for ${templateSlug}`, error);
    return null;
  }
};

export const clearTemplateReview = (templateSlug: string) => {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(`${REVIEW_STORAGE_KEY_PREFIX}-${templateSlug}`);
  } catch (error) {
    console.warn(`[template-review] Failed to clear review payload for ${templateSlug}`, error);
  }
};

