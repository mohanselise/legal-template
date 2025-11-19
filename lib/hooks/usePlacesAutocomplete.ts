import { useState, useCallback } from 'react';

export interface NominatimAddress {
  road?: string;
  house_number?: string;
  business?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface Suggestion {
  description: string;
  place_id: string;
  nominatim?: {
    display_name: string;
    address?: NominatimAddress;
  };
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface UsePlacesAutocompleteReturn {
  suggestions: Suggestion[];
  loading: boolean;
  fetchSuggestions: (input: string) => Promise<void>;
  clearSuggestions: () => void;
}

export function usePlacesAutocomplete(
  type: 'establishment' | 'address' = 'address'
): UsePlacesAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!input || input.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(input)}&type=${type}`
        );
        const data = await response.json();

        if (data.predictions) {
          setSuggestions(data.predictions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, fetchSuggestions, clearSuggestions };
}
