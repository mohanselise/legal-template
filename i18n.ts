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
    // Use UILM for German, but merge with local JSON as fallback for missing keys
    const uilmMessages = await fetchUilmTranslations(locale);
    const localMessages = (await import(`./messages/${locale}.json`)).default;
    
    // Deep merge: UILM takes precedence, but fallback to local for missing keys
    // If UILM module is empty or missing, use local fallback
    const deepMerge = (target: any, source: any): any => {
      const result = { ...target };
      for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];
        
        // If source has a value and it's an object (not null, not array, not primitive)
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          // Check if source object is empty (no keys)
          const sourceKeys = Object.keys(sourceValue);
          if (sourceKeys.length === 0) {
            // UILM module is empty, keep local fallback
            continue;
          }
          
          // If target also has this key as an object, merge recursively
          if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
          } else {
            // Source has object, target doesn't - use source
            result[key] = sourceValue;
          }
        } else if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
          // Source has a primitive value - use it (UILM takes precedence)
          result[key] = sourceValue;
        }
        // If source value is null/undefined/empty, keep target value (local fallback)
      }
      return result;
    };
    
    messages = deepMerge(localMessages, uilmMessages);
    
    if (!uilmMessages || Object.keys(uilmMessages).length === 0) {
      console.warn('UILM returned empty messages for German. Using local file fallback.');
    } else {
      // Log which modules are missing/empty in UILM
      const missingModules = Object.keys(localMessages).filter(
        (key) => !uilmMessages[key] || Object.keys(uilmMessages[key] || {}).length === 0
      );
      if (missingModules.length > 0) {
        console.log(`[UILM] Using local fallback for modules: ${missingModules.join(', ')}`);
      }
    }
  } else {
    // Use local JSON files for other languages (e.g. English)
    messages = (await import(`./messages/${locale}.json`)).default;
  }

  return {
    locale,
    messages,
    timeZone: 'UTC' // Temporary default timezone to prevent environment mismatch errors
  };
});
