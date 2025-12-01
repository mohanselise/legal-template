import { NextRequest, NextResponse } from 'next/server';
import { openrouter, JURISDICTION_MODEL, createCompletionWithTracking } from '@/lib/openrouter';
import { getSessionId } from '@/lib/analytics/session';

export async function POST(request: NextRequest) {
  try {
    const { companyName, companyAddress, jobTitle } = await request.json();

    if (!companyName || !companyAddress || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, companyAddress, jobTitle' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert employment contract assistant specializing in job descriptions and responsibilities.
Your task is to generate professional, comprehensive job responsibilities based on a job title, company, and location.
Keep the response concise but thorough - aim for 3-6 key responsibilities that are typical for this role.
Format as a bulleted list or comma-separated list that can be easily edited by the user.
Do not include markdown formatting - return plain text only.`;

    const userPrompt = `Generate job responsibilities for the following position:

Company: ${companyName}
Location: ${companyAddress}
Job Title: ${jobTitle}

Provide 3-6 key responsibilities that are typical for this role. Format as a simple list (either bullet points separated by newlines, or comma-separated items). Keep each responsibility concise (1-2 sentences max). Focus on core duties that would be standard for this position.`;

    // Get session ID for analytics
    const sessionId = await getSessionId();

    const completion = await createCompletionWithTracking({
      model: JURISDICTION_MODEL, // Use llama-4-scout for small AI tasks
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300, // Keep it concise
    }, {
      sessionId,
      endpoint: '/api/ai/job-responsibilities',
    });

    const responsibilities = completion.choices[0]?.message?.content?.trim() || '';

    if (!responsibilities) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Clean up the response - remove markdown bullets if present, normalize formatting
    const cleaned = responsibilities
      .replace(/^[-*•]\s+/gm, '') // Remove markdown bullets
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .trim()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n');

    return NextResponse.json({ responsibilities: cleaned });
  } catch (error) {
    console.error('Error generating job responsibilities:', error);
    return NextResponse.json(
      { error: 'Failed to generate job responsibilities' },
      { status: 500 }
    );
  }
}

