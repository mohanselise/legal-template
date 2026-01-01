import OpenAI from 'openai';

import { getOpenRouterApiKey } from '@/lib/system-settings';

/**
 * Model identifier for jurisdiction and market standards detection
 */
export const JURISDICTION_MODEL = 'meta-llama/llama-4-scout:nitro';

/**
 * Model identifier for legal contract generation
 * Claude 3.5 Sonnet provides excellent legal reasoning and structured JSON output
 */
export const CONTRACT_GENERATION_MODEL = 'anthropic/claude-3.5-sonnet';

import { trackApiUsage } from '@/lib/analytics/track-api-usage';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;
let cachedAt = 0;

export async function getOpenRouterClient(): Promise<OpenAI> {
  const apiKey = await getOpenRouterApiKey();

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const isCacheValid =
    cachedClient &&
    cachedKey === apiKey &&
    Date.now() - cachedAt < CLIENT_CACHE_TTL_MS;

  if (isCacheValid && cachedClient) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer':
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Legal Templates',
    },
  });
  cachedKey = apiKey;
  cachedAt = Date.now();

  return cachedClient;
}

/**
 * Wrapper for OpenRouter chat completions that tracks usage and costs.
 * 
 * @param params Standard OpenAI chat completion parameters
 * @param context Analytics context (session ID, template, endpoint)
 * @returns The chat completion response
 */
export async function createCompletionWithTracking(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  context: {
    sessionId: string;
    templateSlug?: string;
    endpoint: string;
  }
) {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let completion: OpenAI.Chat.Completions.ChatCompletion | undefined;
  let cost: number | undefined;

  try {
    const openrouter = await getOpenRouterClient();
    // Add OpenRouter-specific parameters for usage tracking if possible
    // Note: We cast to any to allow 'include' parameter which isn't in OpenAI types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestParams = {
      ...params,
      include: { usage: true }, // Request explicit usage/cost data from OpenRouter
    } as any;

    completion = await openrouter.chat.completions.create(requestParams);
    success = true;

    // Try to extract cost from response if OpenRouter provides it
    // OpenRouter sometimes puts it in usage or a separate field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResponse = completion as any;
    if (rawResponse.usage?.cost) {
      cost = rawResponse.usage.cost;
    } else if (rawResponse.cost) {
      cost = rawResponse.cost;
    }

    return completion;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;

    // Log usage asynchronously (fire and forget)
    if (completion?.usage) {
      trackApiUsage({
        sessionId: context.sessionId,
        templateSlug: context.templateSlug,
        endpoint: context.endpoint,
        model: params.model,
        usage: {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        },
        cost,
        responseTime,
        success,
        errorMessage,
      }).catch(err => console.error('[OpenRouter Wrapper] Failed to track usage:', err));
    } else if (!success) {
      // Log failed requests too (with 0 tokens)
      trackApiUsage({
        sessionId: context.sessionId,
        templateSlug: context.templateSlug,
        endpoint: context.endpoint,
        model: params.model,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        cost: 0,
        responseTime,
        success,
        errorMessage,
      }).catch(err => console.error('[OpenRouter Wrapper] Failed to track usage:', err));
    }
  }
}

