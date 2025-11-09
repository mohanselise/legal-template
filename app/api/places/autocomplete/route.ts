import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  address?: {
    road?: string;
    business?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    // Use Nominatim OpenStreetMap API for free geocoding
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LegalTemplates/1.0', // Required by Nominatim usage policy
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Nominatim');
    }
    
    const data = (await response.json()) as NominatimResult[];

    // Transform Nominatim response to match our expected format
    const predictions = data.map((item) => {
      // For establishments, use the name field as main_text
      // For addresses, use road/street as main_text
      const mainText = item.name || item.address?.road || item.address?.business || item.display_name.split(',')[0].trim();
      
      return {
        description: item.display_name,
        place_id: item.place_id.toString(),
        structured_formatting: {
          main_text: mainText,
          secondary_text: [
            item.address?.road,
            item.address?.city || item.address?.town || item.address?.village,
            item.address?.state,
            item.address?.country,
          ]
            .filter(Boolean)
            .join(', '),
        },
      };
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return NextResponse.json(
      { predictions: [], error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
