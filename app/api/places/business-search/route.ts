import { NextRequest, NextResponse } from 'next/server';

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

interface GoogleAutocompleteResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types?: string[];
  }>;
  status: string;
  error_message?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not configured');
    return NextResponse.json(
      { predictions: [], error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Use Google Places Autocomplete API to find businesses by name
    // types=establishment filters for businesses/companies
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = (await response.json()) as GoogleAutocompleteResponse;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { 
          predictions: [], 
          error: `Google Places API error: ${data.status}`,
          errorMessage: data.error_message 
        },
        { status: 500 }
      );
    }

    // Autocomplete API already returns predictions in the format we need
    // Just map them to our interface
    const predictions: GooglePlacePrediction[] = (data.predictions || []).map((prediction) => ({
      place_id: prediction.place_id,
      description: prediction.description,
      structured_formatting: {
        main_text: prediction.structured_formatting.main_text,
        secondary_text: prediction.structured_formatting.secondary_text,
      },
      types: prediction.types,
    }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error fetching business suggestions from Google Places:', error);
    return NextResponse.json(
      { predictions: [], error: 'Failed to fetch business suggestions' },
      { status: 500 }
    );
  }
}
