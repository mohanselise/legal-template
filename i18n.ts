import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n/routing';
import { fetchUilmTranslations } from './lib/uilm-loader';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  let messages;

  if (locale === 'de') {
    // Use UILM for German only - NO local fallback
    messages = await fetchUilmTranslations(locale);
    
    // If UILM returns empty, log warning but don't fallback
    if (!messages || Object.keys(messages).length === 0) {
      console.warn('UILM returned empty messages for German. No fallback to local file.');
    }
  } else {
    // Use local JSON files for other languages (e.g. English)
    messages = (await import(`./messages/${locale}.json`)).default;
  }

  return {
    locale,
    messages
  };
});
