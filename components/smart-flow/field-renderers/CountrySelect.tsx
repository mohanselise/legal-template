"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "./types";

// Major countries to show at the top
const MAJOR_COUNTRIES = [
  "US", // United States
  "GB", // United Kingdom
  "DE", // Germany
  "FR", // France
  "IT", // Italy
  "ES", // Spain
  "NL", // Netherlands
  "BE", // Belgium
  "AT", // Austria
  "CH", // Switzerland
  "SE", // Sweden
  "NO", // Norway
  "DK", // Denmark
  "FI", // Finland
  "PL", // Poland
  "PT", // Portugal
  "IE", // Ireland
  "GR", // Greece
  "CZ", // Czech Republic
  "RO", // Romania
  "HU", // Hungary
  "BG", // Bulgaria
  "HR", // Croatia
  "SK", // Slovakia
  "SI", // Slovenia
  "EE", // Estonia
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "CY", // Cyprus
];

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  error?: boolean;
}

// Detect user's country from browser
async function detectUserCountry(): Promise<string | null> {
  try {
    // Try using a free geolocation API
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      return data.country_code || null;
    }
  } catch (error) {
    // Fallback: try another service
    try {
      const response = await fetch("https://api.country.is/");
      if (response.ok) {
        const data = await response.json();
        return data.country || null;
      }
    } catch (fallbackError) {
      console.warn("Could not detect user country:", fallbackError);
    }
  }
  return null;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country",
  id,
  className,
  error,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  // Detect user's country on mount
  useEffect(() => {
    if (!value && !detectedCountry) {
      detectUserCountry().then((country) => {
        if (country) {
          setDetectedCountry(country);
          // Auto-select detected country if no value is set
          if (!value) {
            onValueChange(country);
          }
        }
      });
    }
  }, [value, detectedCountry, onValueChange]);

  // Organize countries: major countries first, then filtered by search
  const organizedCountries = useMemo(() => {
    const major: typeof COUNTRIES = [];
    const others: typeof COUNTRIES = [];

    COUNTRIES.forEach((country) => {
      if (MAJOR_COUNTRIES.includes(country.code)) {
        major.push(country);
      } else {
        others.push(country);
      }
    });

    // Sort major countries by the order in MAJOR_COUNTRIES
    major.sort((a, b) => {
      const indexA = MAJOR_COUNTRIES.indexOf(a.code);
      const indexB = MAJOR_COUNTRIES.indexOf(b.code);
      return indexA - indexB;
    });

    // Sort others alphabetically
    others.sort((a, b) => a.label.localeCompare(b.label));

    return { major, others };
  }, []);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return organizedCountries;
    }

    const filterCountry = (country: typeof COUNTRIES[0]) =>
      country.label.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query);

    return {
      major: organizedCountries.major.filter(filterCountry),
      others: organizedCountries.others.filter(filterCountry),
    };
  }, [searchQuery, organizedCountries]);

  const selectedCountry = COUNTRIES.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rounded-lg border px-4 py-2.5 text-base shadow-sm",
            "h-[44px]",
            "bg-background text-foreground",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-[color,box-shadow,border-color]",
            error && "border-destructive",
            className
          )}
        >
          <span className="truncate">
            {selectedCountry ? selectedCountry.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
        <div className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                // Prevent closing popover when typing
                e.stopPropagation();
              }}
            />
          </div>

          {/* Country list */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredCountries.major.length === 0 &&
            filteredCountries.others.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              <>
                {/* Major countries section */}
                {filteredCountries.major.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Major Countries
                    </div>
                    {filteredCountries.major.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          onValueChange(country.code);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground",
                          value === country.code && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1 text-left">{country.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Other countries section */}
                {filteredCountries.others.length > 0 && (
                  <>
                    {filteredCountries.major.length > 0 && (
                      <div className="my-1 border-t" />
                    )}
                    {filteredCountries.major.length > 0 && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        All Countries
                      </div>
                    )}
                    {filteredCountries.others.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          onValueChange(country.code);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground",
                          value === country.code && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1 text-left">{country.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}









