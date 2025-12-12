'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function LanguageSwitcher() {
  const [isMounted, setIsMounted] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Avoid SSR/client ID mismatches from Radix-generated IDs during hydration.
  if (!isMounted) return null;

  const switchLocale = (newLocale: string) => {
    // Force English only for now
    if (newLocale !== 'en') {
      return;
    }

    // Update cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }

    // Navigate to new locale
    router.replace(pathname, { locale: newLocale });
  };

  // Force English locale - always show English
  const currentLocaleName = 'English';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocaleName}</span>
          <span className="sm:hidden">EN</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          <button
            onClick={() => switchLocale('en')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              'bg-primary/10 text-primary font-medium'
            }`}
          >
            English
          </button>
          <button
            disabled
            className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors opacity-50 cursor-not-allowed text-muted-foreground"
          >
            Deutsch
            <span className="ml-2 text-xs text-amber-600">(Coming Soon)</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

