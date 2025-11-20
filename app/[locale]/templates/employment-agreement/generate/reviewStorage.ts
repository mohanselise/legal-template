import type { EmploymentAgreement, LegalDocument } from '@/app/api/templates/employment-agreement/schema';
import type { EmploymentAgreementFormData } from './schema';

export const REVIEW_STORAGE_KEY = 'employment-agreement-review';

type ReviewPayload = {
  document: LegalDocument | EmploymentAgreement;
  formData: Partial<EmploymentAgreementFormData>;
  storedAt?: string;
};

const isBrowser = () => typeof window !== 'undefined';

export const saveEmploymentAgreementReview = (
  payload: ReviewPayload,
): boolean => {
  if (!isBrowser()) return false;
  try {
    sessionStorage.setItem(
      REVIEW_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        storedAt: payload.storedAt ?? new Date().toISOString(),
      }),
    );
    return true;
  } catch (error) {
    console.warn('[employment-agreement] Failed to persist review payload', error);
    return false;
  }
};

export const loadEmploymentAgreementReview = (): ReviewPayload | null => {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewPayload;
  } catch (error) {
    console.warn('[employment-agreement] Failed to load review payload', error);
    return null;
  }
};

export const clearEmploymentAgreementReview = () => {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(REVIEW_STORAGE_KEY);
  } catch (error) {
    console.warn('[employment-agreement] Failed to clear review payload', error);
  }
};
