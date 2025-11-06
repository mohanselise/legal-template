import { NextRequest, NextResponse } from 'next/server';
import { getAISuggestion, SuggestionRequest } from '@/lib/ai-suggestions';

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();

    if (!body.cardId || !body.cardLabel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const suggestion = await getAISuggestion(body);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Suggestion API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
