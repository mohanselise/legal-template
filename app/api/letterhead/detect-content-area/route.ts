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
    
    const completion = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o', // GPT-4o supports vision
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing letterhead designs and document layouts. Your task is to identify the content area where text should be placed, avoiding header graphics, logos, and footer elements.

Analyze the provided letterhead image and return a JSON object with:
1. Page dimensions (width and height in pixels)
2. Content area coordinates (x, y, width, height in pixels) - the rectangular area where document text should be placed

The content area should:
- Avoid header graphics, logos, and decorative elements at the top
- Avoid footer graphics, contact information, and decorative elements at the bottom
- Leave appropriate margins on left and right sides
- Be the largest usable rectangular area for text content

Return ONLY valid JSON in this exact format:
{
  "pageWidth": 2550,
  "pageHeight": 3300,
  "contentArea": {
    "x": 200,
    "y": 400,
    "width": 2150,
    "height": 2500
  }
}

All coordinates are in pixels relative to the image dimensions.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this letterhead image (${imageWidth}x${imageHeight} pixels) and detect the content area where text should be placed. Return the coordinates in pixels.`,
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

    // Validate response structure
    if (!result.pageWidth || !result.pageHeight || !result.contentArea) {
      throw new Error('Invalid AI response structure');
    }

    // Ensure content area is within bounds
    const contentArea = {
      x: Math.max(0, Math.min(result.contentArea.x, imageWidth)),
      y: Math.max(0, Math.min(result.contentArea.y, imageHeight)),
      width: Math.max(0, Math.min(result.contentArea.width, imageWidth - result.contentArea.x)),
      height: Math.max(0, Math.min(result.contentArea.height, imageHeight - result.contentArea.y)),
    };

    // Use AI-detected dimensions or fallback to provided/default dimensions
    const finalPageWidth = result.pageWidth || imageWidth;
    const finalPageHeight = result.pageHeight || imageHeight;

    return NextResponse.json({
      success: true,
      pageWidth: finalPageWidth,
      pageHeight: finalPageHeight,
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

