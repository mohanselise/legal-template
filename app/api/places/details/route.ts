import { NextRequest, NextResponse } from 'next/server';
import { extractAddressFromGooglePlace } from '@/lib/utils/address-formatting';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceDetailsResponse {
  result: {
    place_id: string;
    name?: string;
    formatted_address: string;
    address_components: GoogleAddressComponent[];
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
  status: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json(
      { error: 'place_id is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Use Google Places Details API to get full address information
    const fields = 'place_id,name,formatted_address,address_components,geometry';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&key=${apiKey}&fields=${fields}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = (await response.json()) as GooglePlaceDetailsResponse;

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Extract structured address from Google Place details
    const structuredAddress = extractAddressFromGooglePlace({
      place_id: data.result.place_id,
      name: data.result.name,
      formatted_address: data.result.formatted_address,
      address_components: data.result.address_components || [],
    });

    return NextResponse.json({
      place_id: data.result.place_id,
      name: data.result.name,
      formatted_address: data.result.formatted_address,
      address: structuredAddress,
    });
  } catch (error) {
    console.error('Error fetching place details from Google Places:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
