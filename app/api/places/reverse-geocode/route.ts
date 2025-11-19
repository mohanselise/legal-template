import { NextRequest, NextResponse } from 'next/server';

interface NominatimReverseResult {
  place_id: number;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface StructuredAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  raw: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json(
        { error: 'Address is required and must be at least 5 characters' },
        { status: 400 }
      );
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LegalTemplates/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Nominatim');
    }
    
    const data = (await response.json()) as NominatimReverseResult[];

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', structured: null },
        { status: 404 }
      );
    }

    const result = data[0];
    const addr = result.address || {};

    const structured: StructuredAddress = {
      raw: address,
      street: [addr.house_number, addr.road].filter(Boolean).join(' ') || undefined,
      city: addr.city || addr.town || addr.village || undefined,
      state: addr.state || undefined,
      postalCode: addr.postcode || undefined,
      country: addr.country || undefined,
      countryCode: addr.country_code?.toUpperCase() || undefined,
    };

    return NextResponse.json({
      structured,
      displayName: result.display_name,
      placeId: result.place_id,
    });
  } catch (error) {
    console.error('Error reverse geocoding address:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

