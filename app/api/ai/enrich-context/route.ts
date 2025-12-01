import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openrouter, createCompletionWithTracking } from "@/lib/openrouter";
import { getSessionId } from "@/lib/analytics/session";

const enrichContextSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    formData: z.record(z.any()),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = enrichContextSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { prompt, formData } = validation.data;

        // Interpolate variables in the prompt (e.g., {{companyName}})
        let interpolatedPrompt = prompt;
        Object.entries(formData).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
                interpolatedPrompt = interpolatedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        });

        const systemPrompt = `You are an AI assistant helping to fill out a legal document form.
Your task is to analyze the provided form data and the user's prompt to generate useful context or suggestions for subsequent form steps.
Return your response in a valid JSON format. Do not include any markdown formatting or explanations outside the JSON.`;

        const userMessage = `Form Data: ${JSON.stringify(formData, null, 2)}

User Prompt: ${interpolatedPrompt}

Generate a JSON response based on the prompt.`;

        // Get session ID for analytics
        const sessionId = await getSessionId();

        const completion = await createCompletionWithTracking({
            model: "anthropic/claude-3.5-sonnet",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
        }, {
            sessionId,
            endpoint: '/api/ai/enrich-context',
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content received from AI");
        }

        const jsonResponse = JSON.parse(content);

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("[AI_ENRICH_CONTEXT]", error);
        return NextResponse.json(
            { error: "Failed to enrich context" },
            { status: 500 }
        );
    }
}
