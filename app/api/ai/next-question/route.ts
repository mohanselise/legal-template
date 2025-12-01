import { NextRequest, NextResponse } from 'next/server';
import { openrouter, JURISDICTION_MODEL, createCompletionWithTracking } from '@/lib/openrouter';
import { getSessionId } from '@/lib/analytics/session';

type Answer = {
  questionId: string;
  question: string;
  answer: string;
};

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();

    // Determine if we have enough information
    const systemPrompt = `You are an intelligent legal assistant helping to collect information for an employment agreement.

Your job is to:
1. Analyze the answers provided so far
2. Determine what critical information is still missing
3. Ask ONE smart follow-up question that gets the most important missing information
4. Keep the conversation natural and flowing
5. After 5-8 essential questions, you should have enough to generate a high-quality agreement

Respond in JSON format:
{
  "done": false,
  "question": "The next question to ask",
  "questionId": "unique_id_for_this_question",
  "inputType": "text" | "buttons" | "date",
  "options": ["option1", "option2"] // only if inputType is "buttons",
  "reasoning": "Why you're asking this question"
}

If you have enough information to generate a good employment agreement, return:
{
  "done": true,
  "message": "I have everything I need!"
}

IMPORTANT:
- Start with the MOST critical questions (company name, job title, compensation)
- Only ask about optional items (benefits, non-compete, etc.) if the user chose "Detailed" or "Custom"
- Be conversational and friendly
- Don't ask more than 8 questions total
- If complexity is "Basic", keep it to 4-5 essential questions`;

    const userPrompt = buildPrompt(answers);

    // Get session ID for analytics
    const sessionId = await getSessionId();

    const completion = await createCompletionWithTracking({
      model: JURISDICTION_MODEL, // Use llama-4-scout for small AI tasks
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }, {
      sessionId,
      endpoint: '/api/ai/next-question',
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting next question:', error);
    return NextResponse.json(
      { error: 'Failed to get next question' },
      { status: 500 }
    );
  }
}

function buildPrompt(answers: Answer[]): string {
  if (!answers || answers.length === 0) {
    return 'No answers yet. Start with the first question.';
  }

  let prompt = `Here are the answers collected so far:\n\n`;

  answers.forEach((answer, index) => {
    prompt += `${index + 1}. Q: "${answer.question}"\n   A: "${answer.answer}"\n\n`;
  });

  prompt += `\nBased on these answers, what's the next most important question to ask?
Remember:
- We need: company name, job title, salary, start date at minimum
- If they chose "Basic", keep it simple (4-5 questions total)
- If they chose "Detailed" or "Custom", ask about benefits, legal clauses, etc.
- Stop after 8 questions max - we can infer reasonable defaults for everything else

Respond with the next question in JSON format.`;

  return prompt;
}
