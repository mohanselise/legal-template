import { useState, useCallback, useRef, useEffect } from 'react';
import type { StructuredAddress } from '@/lib/utils/address-formatting';

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  name?: string;
  formatted_address: string;
  address: StructuredAddress;
}

interface UseGooglePlacesSearchReturn {
  predictions: GooglePlacePrediction[];
  loading: boolean;
  error: string | null;
  searchBusinesses: (query: string) => Promise<void>;
  getPlaceDetails: (placeId: string) => Promise<GooglePlaceDetails | null>;
  clearPredictions: () => void;
}

/**
 * Custom hook for Google Places business search and place details
 * Includes debounced search to avoid excessive API calls
 */
export function useGooglePlacesSearch(
  debounceMs: number = 300
): UseGooglePlacesSearchReturn {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const searchBusinesses = useCallback(
    async (query: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If query is too short, clear predictions
      if (!query || query.length < 2) {
        setPredictions([]);
        setError(null);
        return;
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch(
            `/api/places/business-search?query=${encodeURIComponent(query)}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch business suggestions');
          }

          const data = await response.json();

          if (data.error) {
            setError(data.error);
            setPredictions([]);
          } else {
            setPredictions(data.predictions || []);
          }
        } catch (err) {
          console.error('Error searching businesses:', err);
          setError(err instanceof Error ? err.message : 'Failed to search businesses');
          setPredictions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const getPlaceDetails = useCallback(async (placeId: string): Promise<GooglePlaceDetails | null> => {
    if (!placeId) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/places/details?place_id=${encodeURIComponent(placeId)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return null;
      }

      return data as GooglePlaceDetails;
    } catch (err) {
      console.error('Error fetching place details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch place details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    predictions,
    loading,
    error,
    searchBusinesses,
    getPlaceDetails,
    clearPredictions,
  };
}
