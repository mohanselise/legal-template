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

import { trackApiUsage } from '@/lib/analytics/track-api-usage';

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
    // Add OpenRouter-specific parameters for usage tracking if possible
    // Note: We cast to any to allow 'include' parameter which isn't in OpenAI types
    const requestParams = {
      ...params,
      include: { usage: true }, // Request explicit usage/cost data from OpenRouter
    } as any;

    completion = await openrouter.chat.completions.create(requestParams);
    success = true;

    // Try to extract cost from response if OpenRouter provides it
    // OpenRouter sometimes puts it in usage or a separate field
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

