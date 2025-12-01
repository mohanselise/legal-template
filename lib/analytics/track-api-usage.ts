import { prisma } from '@/lib/db';

interface TrackApiUsageParams {
    sessionId: string;
    templateSlug?: string;
    endpoint: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost?: number; // Actual cost from API if available
    responseTime: number;
    success: boolean;
    errorMessage?: string;
}

/**
 * Logs OpenRouter API usage to the database.
 * This function is designed to be "fire-and-forget" so it doesn't block the main response.
 */
export async function trackApiUsage(params: TrackApiUsageParams): Promise<void> {
    try {
        const {
            sessionId,
            templateSlug,
            endpoint,
            model,
            usage,
            cost: providedCost,
            responseTime,
            success,
            errorMessage,
        } = params;

        let cost = providedCost;
        let costMethod = 'api';

        // If cost is not provided by API, calculate it from our pricing table
        if (cost === undefined || cost === null) {
            costMethod = 'calculated';
            cost = 0;

            try {
                const pricing = await prisma.modelPricing.findUnique({
                    where: { model },
                });

                if (pricing) {
                    const promptCost = (usage.prompt_tokens / 1000) * pricing.promptCostPer1k;
                    const completionCost = (usage.completion_tokens / 1000) * pricing.completionCostPer1k;
                    cost = promptCost + completionCost;
                } else {
                    // Fallback for unknown models or if pricing missing
                    // Use a safe default or log a warning? 
                    // For now, we'll just leave it as 0 but maybe log it
                    console.warn(`[Analytics] No pricing found for model: ${model}`);
                }
            } catch (err) {
                console.error('[Analytics] Failed to fetch pricing:', err);
            }
        }

        await prisma.apiUsageLog.create({
            data: {
                sessionId,
                templateSlug,
                endpoint,
                model,
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
                cost,
                costMethod,
                responseTime,
                success,
                errorMessage,
            },
        });

    } catch (error) {
        // Silently fail to avoid affecting the user experience, but log to server console
        console.error('[Analytics] Failed to log API usage:', error);
    }
}
