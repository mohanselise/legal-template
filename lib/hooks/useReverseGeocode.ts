import { useState, useCallback } from 'react';
import { extractAddressFromNominatim } from '@/lib/utils/address-formatting';
import type { StructuredAddress } from '@/lib/utils/address-formatting';

interface UseReverseGeocodeReturn {
  geocode: (address: string) => Promise<StructuredAddress | null>;
  loading: boolean;
  error: string | null;
}

interface NominatimResult {
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

export function useReverseGeocode(): UseReverseGeocodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string): Promise<StructuredAddress | null> => {
    if (!address || address.trim().length < 5) {
      setError('Address must be at least 5 characters');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Nominatim directly from client side
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LegalTemplates/1.0', // Required by Nominatim usage policy
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Nominatim');
      }

      const data = (await response.json()) as NominatimResult[];

      if (!data || data.length === 0) {
        // Not an error - just no results found
        return null;
      }

      const result = data[0];
      
      // Extract structured address using our utility
      const structured = extractAddressFromNominatim({
        display_name: result.display_name,
        address: result.address,
      });

      return structured;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to geocode address';
      setError(errorMessage);
      console.error('Reverse geocoding error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { geocode, loading, error };
}

