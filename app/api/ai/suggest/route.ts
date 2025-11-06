import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { question, context, field } = await request.json();

    // Build a smart prompt based on the context
    const systemPrompt = `You are an AI assistant helping to fill out an employment agreement form.
Your job is to provide helpful, contextually relevant suggestions based on what the user has already filled in.
Keep suggestions practical, professional, and brief (1-2 sentences max).`;

    const userPrompt = buildSuggestionPrompt(question, context, field);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error getting AI suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestion' },
      { status: 500 }
    );
  }
}

function buildSuggestionPrompt(question: string, context: any, field: string): string {
  let prompt = `Question: "${question}"\n\nContext:\n`;

  // Add relevant context
  if (context.companyName) prompt += `- Company: ${context.companyName}\n`;
  if (context.jobTitle) prompt += `- Job Title: ${context.jobTitle}\n`;
  if (context.department) prompt += `- Department: ${context.department}\n`;
  if (context.employmentType) prompt += `- Employment Type: ${context.employmentType}\n`;

  // Field-specific logic
  if (field === 'jobTitle') {
    prompt += `\nSuggest 1-2 professional, industry-standard job titles that might fit.`;
  } else if (field === 'department') {
    prompt += `\nBased on the job title "${context.jobTitle}", suggest an appropriate department.`;
  } else if (field === 'bonusStructure') {
    prompt += `\nSuggest a typical bonus structure for a ${context.jobTitle} role. Keep it brief and realistic.`;
  } else if (field === 'workLocation') {
    if (context.workArrangement === 'remote') {
      prompt += `\nSuggest how to specify the work location for a remote employee.`;
    } else {
      prompt += `\nSuggest a standard format for specifying the work location.`;
    }
  } else {
    prompt += `\nProvide a helpful suggestion or tip for answering this question.`;
  }

  prompt += `\n\nProvide only the suggestion, no extra explanation.`;

  return prompt;
}
