import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is not set');
}

/**
 * OpenRouter client configured to use OpenRouter API
 * This is used for jurisdiction detection and market standards analysis
 * using the meta-llama/llama-4-scout: nitro model
 */
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Legal Templates',
  },
});

/**
 * Model identifier for jurisdiction and market standards detection
 */
export const JURISDICTION_MODEL = 'meta-llama/llama-4-scout:nitro';

/**
 * Model identifier for legal contract generation
 * Claude 3.5 Sonnet provides excellent legal reasoning and structured JSON output
 */
export const CONTRACT_GENERATION_MODEL = 'anthropic/claude-3.5-sonnet';

