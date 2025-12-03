import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Cache models for 1 hour
let cachedModels: OpenRouterModel[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    modality: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
}

interface TransformedModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  maxTokens?: number;
  promptCost: number; // per 1K tokens
  completionCost: number; // per 1K tokens
  provider: string;
  isRecommended?: boolean;
}

// Models we recommend for different use cases
const RECOMMENDED_MODELS = {
  documentGeneration: [
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-sonnet-4",
    "openai/gpt-4o",
    "google/gemini-2.0-flash-001",
  ],
  formEnrichment: [
    "meta-llama/llama-4-scout:nitro",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-001",
  ],
  dynamicForm: [
    "meta-llama/llama-4-scout:nitro",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
  ],
};

// Filter criteria for usable models
function isUsableModel(model: OpenRouterModel): boolean {
  // Must support text output
  const outputModalities = model.architecture?.output_modalities || [];
  if (!outputModalities.includes("text")) return false;

  // Must have reasonable context length
  if (model.context_length < 4000) return false;

  // Skip image-only or audio-only models
  const modality = model.architecture?.modality || "";
  if (modality.includes("image->") && !modality.includes("text")) return false;
  if (modality.includes("audio->") && !modality.includes("text")) return false;

  return true;
}

function transformModel(model: OpenRouterModel, useCase?: string): TransformedModel {
  const provider = model.id.split("/")[0];
  const recommendedList = useCase
    ? RECOMMENDED_MODELS[useCase as keyof typeof RECOMMENDED_MODELS] || []
    : [];

  return {
    id: model.id,
    name: model.name,
    description: model.description,
    contextLength: model.context_length,
    maxTokens: model.top_provider?.max_completion_tokens,
    promptCost: parseFloat(model.pricing.prompt) * 1000, // Convert to per 1K
    completionCost: parseFloat(model.pricing.completion) * 1000,
    provider,
    isRecommended: recommendedList.includes(model.id),
  };
}

/**
 * GET /api/admin/models
 * Fetch available AI models from OpenRouter
 * Query params:
 *   - useCase: "documentGeneration" | "formEnrichment" | "dynamicForm"
 *   - refresh: "true" to force refresh cache
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const useCase = searchParams.get("useCase") || undefined;
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache
    const now = Date.now();
    if (!forceRefresh && cachedModels && now - cacheTimestamp < CACHE_DURATION_MS) {
      const models = cachedModels
        .filter(isUsableModel)
        .map((m) => transformModel(m, useCase))
        .sort((a, b) => {
          // Sort: recommended first, then by provider, then by name
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
          return a.name.localeCompare(b.name);
        });

      return NextResponse.json({
        models,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
      });
    }

    // Fetch from OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[MODELS_API] OPENROUTER_API_KEY not set");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[MODELS_API] OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to fetch models from OpenRouter" },
        { status: 502 }
      );
    }

    const data = await response.json();
    cachedModels = data.data as OpenRouterModel[];
    cacheTimestamp = now;

    const models = cachedModels
      .filter(isUsableModel)
      .map((m) => transformModel(m, useCase))
      .sort((a, b) => {
        // Sort: recommended first, then by provider, then by name
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      models,
      cached: false,
      totalAvailable: data.data.length,
      filtered: models.length,
    });
  } catch (error) {
    console.error("[MODELS_API]", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

