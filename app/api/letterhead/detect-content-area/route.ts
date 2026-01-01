import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient, createCompletionWithTracking } from '@/lib/openrouter';
import { getSessionId } from '@/lib/analytics/session';

/**
 * AI Content Area Detection API
 * Uses vision AI to detect the content area in a letterhead image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageDataUrl = formData.get('imageDataUrl') as string | null;

    if (!file && !imageDataUrl) {
      return NextResponse.json(
        { error: 'Missing file or imageDataUrl' },
        { status: 400 }
      );
    }

    // Get image data URL
    let dataUrl: string;
    let imageWidth: number | undefined;
    let imageHeight: number | undefined;
    
    if (imageDataUrl) {
      dataUrl = imageDataUrl;
      // Try to extract dimensions from form data if provided
      const widthParam = formData.get('width');
      const heightParam = formData.get('height');
      if (widthParam && heightParam) {
        imageWidth = parseInt(widthParam as string, 10);
        imageHeight = parseInt(heightParam as string, 10);
      }
    } else if (file) {
      // Convert file to data URL
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type || 'image/png';
      dataUrl = `data:${mimeType};base64,${base64}`;
    } else {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // If dimensions not provided, use defaults (will be corrected by AI response)
    // For US Letter at 300 DPI: 2550 x 3300 pixels
    if (!imageWidth || !imageHeight) {
      imageWidth = 2550;
      imageHeight = 3300;
    }

    // Get session ID for analytics
    const sessionId = await getSessionId();

    // Use vision AI to detect content area
    // Using GPT-4o via OpenRouter for vision capabilities
    const openrouter = await getOpenRouterClient();
    
    // Fixed horizontal margins (12% of page width, matching the ContentAreaEditor)
    const fixedX = Math.round(imageWidth * 0.12);
    const fixedWidth = Math.round(imageWidth * 0.76); // 1 - 2*0.12 = 0.76
    
    const completion = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o', // GPT-4o supports vision
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing letterhead designs and document layouts. Your task is to identify the VERTICAL content area (top and bottom boundaries only) where text should be placed, avoiding header graphics, logos, and footer elements.

Analyze the provided letterhead image and return a JSON object with:
1. The TOP boundary (y coordinate in pixels) - where content should START (below any header/logo)
2. The BOTTOM boundary (contentBottom in pixels) - where content should END (above any footer graphics)

Focus ONLY on detecting:
- Where the header/logo graphics END (this determines the top of content area)
- Where the footer graphics BEGIN (this determines the bottom of content area)

The horizontal margins are FIXED at 12% of the page width on each side - you do not need to detect these.

Return ONLY valid JSON in this exact format:
{
  "contentTop": 450,
  "contentBottom": 2850
}

Where:
- contentTop: Y coordinate in pixels where text content should start (below header)
- contentBottom: Y coordinate in pixels where text content should end (above footer)

All coordinates are in pixels relative to the image dimensions (${imageWidth}x${imageHeight}).`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this letterhead image (${imageWidth}x${imageHeight} pixels) and detect the vertical content boundaries. Return contentTop (Y where content starts, below header) and contentBottom (Y where content ends, above footer).`,
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(responseContent);

    // Validate response structure - now expects contentTop and contentBottom
    if (result.contentTop === undefined || result.contentBottom === undefined) {
      throw new Error('Invalid AI response structure - expected contentTop and contentBottom');
    }

    // Calculate content area with fixed horizontal margins and AI-detected vertical bounds
    const contentTop = Math.max(0, Math.min(result.contentTop, imageHeight));
    const contentBottom = Math.max(contentTop + 50, Math.min(result.contentBottom, imageHeight));
    
    const contentArea = {
      x: fixedX,
      y: contentTop,
      width: fixedWidth,
      height: contentBottom - contentTop,
    };

    return NextResponse.json({
      success: true,
      pageWidth: imageWidth,
      pageHeight: imageHeight,
      contentArea,
    });
  } catch (error) {
    console.error('Error detecting content area:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect content area',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

