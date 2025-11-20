import { openrouter, JURISDICTION_MODEL } from './openrouter';

export interface SuggestionRequest {
  cardId: string;
  cardLabel: string;
  context: {
    employeeName?: string;
    role?: string;
    level?: string;
    location?: string;
    salary?: string;
    [key: string]: string | undefined;
  };
}

export interface SuggestionResponse {
  value: string;
  confidence: number;
  reasoning: string;
}

export async function getAISuggestion(request: SuggestionRequest): Promise<SuggestionResponse> {
  try {
    const contextStr = Object.entries(request.context)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const prompt = `You are an expert employment contract assistant. Based on the following context, suggest an appropriate value for "${request.cardLabel}".

Context: ${contextStr || 'No context provided yet'}

Provide a concise, professional suggestion that would be typical for this role and location. Consider industry standards, legal requirements, and best practices.

Your response must be a JSON object with exactly these fields:
{
  "value": "the suggested value",
  "confidence": 0.85,
  "reasoning": "brief explanation (max 20 words)"
}`;

    const completion = await openrouter.chat.completions.create({
      model: JURISDICTION_MODEL, // Use llama-4-scout for small AI tasks
      messages: [
        {
          role: 'system',
          content: 'You are a legal employment contract expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(response);
    return {
      value: parsed.value || '',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'AI-generated suggestion',
    };
  } catch (error) {
    console.error('AI suggestion error:', error);
    // Fallback to simple suggestion
    return getFallbackSuggestion(request);
  }
}

function getFallbackSuggestion(request: SuggestionRequest): SuggestionResponse {
  const { cardId, context } = request;

  // Simple rule-based fallbacks
  if (cardId === 'level' && context.role?.toLowerCase().includes('engineer')) {
    return {
      value: 'Senior',
      confidence: 0.7,
      reasoning: 'Common level for engineers',
    };
  }

  if (cardId === 'pay-frequency') {
    return {
      value: 'Bi-weekly',
      confidence: 0.9,
      reasoning: 'Most common pay schedule in US',
    };
  }

  if (cardId === 'remote-policy' && context.location?.toLowerCase().includes('san francisco')) {
    return {
      value: 'Hybrid (3 days office)',
      confidence: 0.8,
      reasoning: 'Standard for SF tech companies',
    };
  }

  if (cardId === 'equity' && context.role?.toLowerCase().includes('engineer') && context.level === 'Senior') {
    return {
      value: '0.15-0.3%',
      confidence: 0.75,
      reasoning: 'Typical for senior engineers at startups',
    };
  }

  if (cardId === 'vesting') {
    return {
      value: '4 years',
      confidence: 0.95,
      reasoning: 'Industry standard vesting period',
    };
  }

  if (cardId === 'cliff') {
    return {
      value: '1 year',
      confidence: 0.95,
      reasoning: 'Standard cliff period for equity',
    };
  }

  if (cardId === 'pto') {
    return {
      value: '20 days/year',
      confidence: 0.8,
      reasoning: 'Competitive PTO for tech roles',
    };
  }

  if (cardId === 'employment-type') {
    return {
      value: 'At-will',
      confidence: 0.9,
      reasoning: 'Standard in most US states',
    };
  }

  if (cardId === 'notice-period') {
    return {
      value: '2 weeks',
      confidence: 0.85,
      reasoning: 'Professional courtesy standard',
    };
  }

  return {
    value: '',
    confidence: 0.5,
    reasoning: 'Commonly added for this role',
  };
}
