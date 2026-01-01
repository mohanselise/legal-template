// import 'server-only';
import enMessages from '../messages/en.json';

const UILM_BASE_URL = process.env.NEXT_PUBLIC_BLOCKS_API_URL || 'https://api.seliseblocks.com';

// List of modules that correspond to the top-level keys in our message JSON files
const MODULES = [
  'common',
  'home',
  'templates',
  'about',
  'faq',
  'employmentAgreement',
  'legalDisclaimer',
  'employmentAgreementPage',
  'footer',
  'tips', // Module ID: 31c9a49e-126c-43af-842b-a13de29ac200
  'miniMap' // Module ID: 04a716ad-4882-42e5-b574-7ccf1c8d7329
];

/**
 * Fetches translations from SELISE Blocks UILM API
 * @param locale The locale code (e.g., 'en', 'de')
 * @returns Merged translation object matching the structure of messages/*.json
 */
async function resolveProjectKey(): Promise<string> {
  // Edge runtime cannot load Prisma; fall back to env variables there.
  if (process.env.NEXT_RUNTIME === 'edge') {
    return (
      process.env.NEXT_PUBLIC_X_BLOCKS_KEY ||
      process.env.VITE_X_BLOCKS_KEY ||
      ''
    );
  }

  try {
    const { getBlocksProjectKey } = await import('@/lib/system-settings');
    return (await getBlocksProjectKey()) || '';
  } catch (error) {
    console.warn('[UILM] Failed to load blocks key from system settings, falling back to env.', error);
    return (
      process.env.NEXT_PUBLIC_X_BLOCKS_KEY ||
      process.env.VITE_X_BLOCKS_KEY ||
      ''
    );
  }
}

export async function fetchUilmTranslations(locale: string) {
  // Map short locale codes to full culture codes expected by UILM
  // Defaulting 'de' to 'de-DE' as per project configuration.
  const culture = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : locale;
  
  const projectKey = await resolveProjectKey();
  
  if (!projectKey) {
    console.warn('Missing SELISE Blocks Project Key (admin setting or environment). UILM translations may fail.');
  }

  console.log(`Fetching UILM translations for culture: ${culture}`);

  const results = await Promise.allSettled(
    MODULES.map(async (moduleName) => {
        const params = new URLSearchParams({
            Language: culture,
            ModuleName: moduleName,
            ProjectKey: projectKey,
        });
        
        // Construct the full URL for the GetUilmFile endpoint
        const url = `${UILM_BASE_URL}/uilm/v1/Key/GetUilmFile?${params.toString()}`;
        
        try {
            // Fetch with caching (Next.js Data Cache)
            // Revalidate every hour (3600 seconds) to balance freshness and performance
            const res = await fetch(url, { 
              headers: {
                'x-blocks-key': projectKey,
                'accept': '*/*'
              },
              next: { revalidate: 3600, tags: ['translations'] } 
            });
            
            if (!res.ok) {
                // Check content type to avoid parsing HTML error pages as JSON
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Failed to fetch module ${moduleName}: ${res.status} ${res.statusText}. Response appears to be HTML (likely an error page).`);
                }
                throw new Error(`Failed to fetch module ${moduleName}: ${res.status} ${res.statusText}`);
            }
            
            // Handle empty response body (Content-Length: 0)
            const contentLength = res.headers.get('content-length');
            if (contentLength === '0') {
              console.warn(`[UILM] Module ${moduleName} returned empty body (Content-Length: 0). Returning empty object.`);
              return { moduleName, data: {} };
            }

            // Fallback: try reading text and parsing, checking for empty string
            const text = await res.text();
            if (!text) {
              console.warn(`[UILM] Module ${moduleName} returned empty response text. Returning empty object.`);
              return { moduleName, data: {} };
            }

            try {
                const rawData = JSON.parse(text);
                
                // DEBUG: Log keys for templates module to debug nesting issues
                if (moduleName === 'templates') {
                    console.log('[UILM DEBUG] Raw keys for templates:', Object.keys(rawData).slice(0, 10));
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unflattenedData: Record<string, any> = {};

                Object.keys(rawData).forEach(key => {
                    const prefix = `${moduleName.toUpperCase()}_`;
                    let cleanKey = key;
                    if (key.startsWith(prefix)) {
                        cleanKey = key.substring(prefix.length);
                    }

                    // Convert SNAKE_CASE to camelCase
                // e.g. "IMPORTANT_LEGAL_DISCLAIMER" -> "importantLegalDisclaimer"
                const camelKey = cleanKey.toLowerCase().replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
                
                // Assign simple camelCase key (e.g. footer.requestTemplate)
                unflattenedData[camelKey] = rawData[key];

                // ATTEMPT TO RECONSTRUCT NESTED STRUCTURE
                // For keys like "FINAL_CTA_GENERATE_FIRST_DOCUMENT" -> "finalCta.generateFirstDocument"
                // The camelKey logic above produces "finalCtaGenerateFirstDocument".
                // This is NOT what next-intl wants if it expects t('finalCta.generateFirstDocument').
                
                // Strategy:
                // 1. Split by underscore: ["FINAL", "CTA", "GENERATE", "FIRST", "DOCUMENT"]
                // 2. Iterate and try to build a tree.
                // The problem is ambiguity: Is it { final: { cta: ... } } or { finalCta: ... }?
                // Based on "finalCta", it seems standard is camelCase for segments.
                // So "FINAL_CTA" -> "finalCta".
                // "GENERATE_FIRST_DOCUMENT" -> "generateFirstDocument".
                
                // Heuristic:
                // Split the UPPER_SNAKE key by underscore.
                // Try to combine parts to form known camelCase keys from the original EN file? We don't have it here easily.
                
                // Alternative:
                // Since we can't know the original nesting perfecty, we will assume that 
                // any UNDERSCORE in the UILM key might represent a DOT in the nested key, OR an uppercase letter.
                // But we know our import script:
                // fullKey = prefix ? `${prefix}_${key}` : key;
                // And then: key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
                
                // So "finalCta" became "FINAL_C_T_A"?? No.
                // Let's look at generate script:
                // const fullKey = prefix ? `${prefix}_${key}` : key;
                // const normalizedKey = fullKey.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                
                // Example: "finalCta" -> "FINAL_CTA"
                // Example: "generateFirstDocument" -> "GENERATE_FIRST_DOCUMENT"
                // Nested: "finalCta.generateFirstDocument" -> "FINAL_CTA_GENERATE_FIRST_DOCUMENT"
                
                // So we have "FINAL_CTA_GENERATE_FIRST_DOCUMENT".
                // We want { finalCta: { generateFirstDocument: ... } }
                
                // We CANNOT disambiguate "finalCta" vs "final" + "cta" without a schema.
                // HOWEVER, we can be smart about "common" structural patterns.
                // Or we can provide a custom 'dot' version of the key if we detect it matches a certain pattern.
                
                // Let's try a recursive builder that assumes parts might be camelCased segments.
                // But since we don't know where to split, this is hard.
                
                // HACK:
                // If we can't reconstruct the tree, we can try to supply keys that might match what next-intl looks for.
                // next-intl flattens keys internally to "finalCta.generateFirstDocument".
                // So if we provide unflattenedData['finalCta.generateFirstDocument'] = val, it might work?
                // No, next-intl expects a nested object structure.
                
                // SOLUTION:
                // We must use the keys from the ENGLISH translation file (which is local) as a schema guide!
                // But we can't import 'en.json' here easily in a generic way without bloating the bundle or async issues.
                
                // COMPROMISE:
                // We will try to "guess" nesting by looking for common structural markers if possible, 
                // OR we assume that if a key is requested as "home.finalCta.generateFirstDocument", 
                // we can't easily support it dynamically without the schema.
                
                // WAIT!
                // Does `next-intl` support dot notation keys in the message object itself?
                // e.g. { "finalCta.generateFirstDocument": "..." }
                // If so, we could just generate likely dot-path permutations.
                
                // Let's try to support the specific case of `finalCta` -> `generateFirstDocument`.
                // We can try to build a nested object where every "segment" is a potential node.
                // But "FINAL_CTA" becomes "finalCta" via our logic?
                // "FINAL_CTA" -> cleanKey.toLowerCase() -> "final_cta" -> replace -> "finalCta". Correct!
                
                // So "FINAL_CTA_GENERATE_FIRST_DOCUMENT" -> "finalCtaGenerateFirstDocument".
                // This is one long key.
                
                // The issue is that `t('finalCta.generateFirstDocument')` looks for `messages.home.finalCta.generateFirstDocument`.
                // We are returning `messages.home.finalCtaGenerateFirstDocument`.
                
                // FIX:
                // We need to SPLIT the key. But where?
                // If we split at every underscore:
                // FINAL_CTA_GENERATE_FIRST_DOCUMENT -> final.cta.generate.first.document
                // This is wrong. It should be finalCta.generateFirstDocument.
                
                // There is NO WAY to deterministically reverse this without the schema.
                // BUT, we can try to fetch the `en` keys to use as a map?
                // Or just accept that for deep nesting, we might need to manually map them or flatten the app usage?
                
                // BETTER IDEA:
                // Let's try to create a "best guess" nested structure by assuming that any key *could* be a path.
                // Since we can't distinguish, maybe we just rely on the fact that standard keys usually don't have underscores?
                // If they do, they are camelCase.
                
                // Let's try to map strictly based on the import script logic which inserts underscores between case changes.
                // Only explicit dots in the source became underscores too.
                // So "finalCta.generate" -> "FINAL_CTA_GENERATE"
                // "finalCta_generate" -> "FINAL_CTA_GENERATE"
                
                // It is irreversible lossy compression.
                
                // MANUAL MAPPING for known problematic sections?
                // Or better: Can we fetch the 'en' keys in this loader since it runs on server?
                // Yes! We can import `messages/en.json` dynamically and use it as a template!
                
                // This is the robust fix.
                
                unflattenedData[key] = rawData[key];
              });
              
              // We will do a second pass using the EN structure to guide the unflattening
              try {
                 // Use the statically imported EN messages as schema
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 const moduleSchema = (enMessages as any)[moduleName];
                 
                 if (moduleSchema) {
                    // Recursive function to fill values from rawData using schema keys
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fillFromSchema = (schema: any, prefix: string, target: any) => {
                        Object.keys(schema).forEach(k => {
                            const value = schema[k];
                            const currentKeyPath = prefix ? `${prefix}_${k}` : k;
                            
                            // Calculate the expected flattened key for this node
                            // Logic must match generate-uilm-import.ts:
                            // fullKey.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                            
                            const normalizeKey = (str: string) => 
                                str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                                
                            const flattenedKey = normalizeKey(currentKeyPath);
                            
                            // Check if we have a value for this flattened key (prefixed with module name)
                            // The rawData keys DO NOT have the module prefix anymore because we stripped it in the loop above?
                            // No, rawData has "COMMON_TEMPLATES".
                            // Our `cleanKey` logic stripped it. BUT we should use the rawData directly for lookup to be safe.
                            
                            // Let's reconstruct the expected key in rawData
                            // The import script used: `${moduleName.toUpperCase()}_${flattenedKey}`
                            const lookupKey = `${moduleName.toUpperCase()}_${flattenedKey}`;
                            
                            // Special handling for 'templates' module which has 'templatesList'
                            // The flattening logic might have produced: TEMPLATES_TEMPLATES_LIST_EMPLOYMENT_AGREEMENT_TITLE
                            // But unflattening looks for: TEMPLATES_TEMPLATESLIST_EMPLOYMENTAGREEMENT_TITLE
                            // Because of how we normalized the schema keys.
                            
                            // Let's debug the specific keys we are looking for if we are in templates module
                            // if (moduleName === 'templates' && k === 'templatesList') {
                            //    console.log('[UILM DEBUG] Looking for templatesList with key:', lookupKey);
                            // }

                            if (typeof value === 'string') {
                                // It's a leaf node
                                if (rawData[lookupKey]) {
                                    target[k] = rawData[lookupKey];
                                }
                            } else if (typeof value === 'object' && value !== null) {
                                // It's a nested object
                                target[k] = target[k] || {};
                                fillFromSchema(value, currentKeyPath, target[k]);
                            }
                        });
                    };
                    
                    fillFromSchema(moduleSchema, '', unflattenedData);
                 }
              } catch (schemaError) {
                 console.warn('[UILM] Could not use EN schema for unflattening.', schemaError);
              }

              return { moduleName, data: unflattenedData };
            } catch (jsonError) {
              console.error(`[UILM] Failed to parse JSON for module ${moduleName}. Response text: "${text.substring(0, 100)}..."`);
              throw jsonError;
            }

        } catch (e) {
            // Re-throw to be caught by allSettled
            throw e;
        }
    })
  );

  // Initialize the translations object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const translations: Record<string, any> = {};

  // Process results
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
        // Assign the module data to the corresponding key in the translations object
        // e.g., translations['common'] = { ... }
        // This matches the structure of the local JSON files
        translations[result.value.moduleName] = result.value.data;
    } else {
        console.error(`[UILM] Failed to load translations for module:`, result.reason);
        // We gracefully continue, leaving this module empty or undefined
        // Alternatively, we could fallback to local files here if we had granular access
    }
  });

  return translations;
}
