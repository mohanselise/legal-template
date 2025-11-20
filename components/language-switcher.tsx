'use client';

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
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Update cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }

    // Navigate to new locale
    router.replace(pathname, { locale: newLocale });
  };

  const currentLocaleName = locale === 'de' ? 'Deutsch' : 'English';
  const otherLocale = locale === 'de' ? 'en' : 'de';
  const otherLocaleName = otherLocale === 'de' ? 'Deutsch' : 'English';

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
          <span className="sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          <button
            onClick={() => switchLocale('en')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              locale === 'en'
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent text-foreground'
            }`}
          >
            English
          </button>
          <button
            onClick={() => switchLocale('de')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              locale === 'de'
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent text-foreground'
            }`}
          >
            Deutsch
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

