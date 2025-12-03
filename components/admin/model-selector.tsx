"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, ChevronDown, Loader2, RefreshCw, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  maxTokens?: number;
  promptCost: number;
  completionCost: number;
  provider: string;
  isRecommended?: boolean;
}

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  useCase?: "documentGeneration" | "formEnrichment" | "dynamicForm";
  placeholder?: string;
  disabled?: boolean;
}

// Fallback models if API fails
const FALLBACK_MODELS: Model[] = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextLength: 200000,
    promptCost: 3,
    completionCost: 15,
    isRecommended: true,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextLength: 200000,
    promptCost: 3,
    completionCost: 15,
    isRecommended: true,
  },
  {
    id: "meta-llama/llama-4-scout:nitro",
    name: "Llama 4 Scout (Nitro)",
    provider: "meta-llama",
    contextLength: 512000,
    promptCost: 0.11,
    completionCost: 0.34,
    isRecommended: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextLength: 128000,
    promptCost: 2.5,
    completionCost: 10,
    isRecommended: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextLength: 128000,
    promptCost: 0.15,
    completionCost: 0.6,
    isRecommended: true,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "google",
    contextLength: 1000000,
    promptCost: 0.1,
    completionCost: 0.4,
    isRecommended: true,
  },
];

// Provider display names and colors
const PROVIDER_CONFIG: Record<string, { name: string; color: string }> = {
  anthropic: { name: "Anthropic", color: "bg-orange-100 text-orange-700" },
  openai: { name: "OpenAI", color: "bg-emerald-100 text-emerald-700" },
  google: { name: "Google", color: "bg-blue-100 text-blue-700" },
  "meta-llama": { name: "Meta", color: "bg-indigo-100 text-indigo-700" },
  mistralai: { name: "Mistral", color: "bg-purple-100 text-purple-700" },
  cohere: { name: "Cohere", color: "bg-pink-100 text-pink-700" },
  deepseek: { name: "DeepSeek", color: "bg-cyan-100 text-cyan-700" },
  qwen: { name: "Qwen", color: "bg-red-100 text-red-700" },
  perplexity: { name: "Perplexity", color: "bg-violet-100 text-violet-700" },
};

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function formatContextLength(length: number): string {
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${Math.round(length / 1000)}K`;
  return String(length);
}

export function ModelSelector({
  value,
  onChange,
  useCase,
  placeholder = "Select a model...",
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[]>(FALLBACK_MODELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchModels = async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (useCase) params.set("useCase", useCase);
      if (refresh) params.set("refresh", "true");

      const response = await fetch(`/api/admin/models?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }

      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
      }
    } catch (err) {
      console.error("Error fetching models:", err);
      setError("Using cached model list");
      // Keep fallback models
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [useCase]);

  // Filter and group models
  const filteredModels = useMemo(() => {
    const searchLower = search.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.id.toLowerCase().includes(searchLower) ||
        m.provider.toLowerCase().includes(searchLower)
    );
  }, [models, search]);

  const groupedModels = useMemo(() => {
    const recommended = filteredModels.filter((m) => m.isRecommended);
    const others = filteredModels.filter((m) => !m.isRecommended);

    // Group others by provider
    const byProvider: Record<string, Model[]> = {};
    others.forEach((model) => {
      const provider = model.provider;
      if (!byProvider[provider]) byProvider[provider] = [];
      byProvider[provider].push(model);
    });

    return { recommended, byProvider };
  }, [filteredModels]);

  const selectedModel = models.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-auto min-h-10 py-2"
        >
          {selectedModel ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedModel.isRecommended && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
              <span className="truncate font-medium">{selectedModel.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "ml-auto text-[10px] px-1.5 py-0 flex-shrink-0",
                  PROVIDER_CONFIG[selectedModel.provider]?.color || "bg-gray-100"
                )}
              >
                {PROVIDER_CONFIG[selectedModel.provider]?.name || selectedModel.provider}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0" align="start">
        {/* Search Header */}
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 shadow-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => fetchModels(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Model List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredModels.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No models found.
            </div>
          ) : (
            <>
              {/* Recommended Models */}
              {groupedModels.recommended.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    Recommended
                  </div>
                  {groupedModels.recommended.map((model) => (
                    <ModelItem
                      key={model.id}
                      model={model}
                      isSelected={value === model.id}
                      onSelect={() => {
                        onChange(model.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Other Models by Provider */}
              {Object.entries(groupedModels.byProvider)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([provider, providerModels]) => (
                  <div key={provider} className="p-2 border-t">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {PROVIDER_CONFIG[provider]?.name || provider}
                    </div>
                    {providerModels.map((model) => (
                      <ModelItem
                        key={model.id}
                        model={model}
                        isSelected={value === model.id}
                        onSelect={() => {
                          onChange(model.id);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
            {error}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface ModelItemProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelItem({ model, isSelected, onSelect }: ModelItemProps) {
  const providerConfig = PROVIDER_CONFIG[model.provider] || {
    name: model.provider,
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-2 py-2.5 rounded-md text-left transition-colors",
        isSelected
          ? "bg-[hsl(var(--selise-blue))]/10"
          : "hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border",
          isSelected
            ? "border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]"
            : "border-muted-foreground/30"
        )}
      >
        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {model.isRecommended && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
          <span className={cn("font-medium text-sm", isSelected && "text-[hsl(var(--selise-blue))]")}>
            {model.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", providerConfig.color)}>
            {providerConfig.name}
          </Badge>
          <span>{formatContextLength(model.contextLength)} ctx</span>
          <span>•</span>
          <span className="text-emerald-600 font-medium">
            {formatCost(model.promptCost)}/1K in
          </span>
          <span className="text-amber-600 font-medium">
            {formatCost(model.completionCost)}/1K out
          </span>
        </div>
      </div>
    </button>
  );
}
