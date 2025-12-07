'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('common');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 dark:bg-gray-950/95">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/signature-black.svg"
                alt="SELISE"
                width={125}
                height={49}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <Link
              href="/templates"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              {t('templates')}
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              {t('about')}
            </Link>
            <Link
              href="/faq"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              {t('faq')}
            </Link>
            <a
              href="https://selisegroup.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              {t('contact')}
            </a>
            <Link
              href="/templates/employment-agreement/generate"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity font-subheading"
            >
              {t('generateDocument')}
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-card"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">{t('openMainMenu')}</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="space-y-1 px-4 pb-3 pt-2">
            <Link
              href="/templates"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('templates')}
            </Link>
            <Link
              href="/about"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('about')}
            </Link>
            <Link
              href="/faq"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('faq')}
            </Link>
            <a
              href="https://selisegroup.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('contact')}
            </a>
            <Link
              href="/templates/employment-agreement/generate"
              className="block rounded-md bg-primary px-3 py-2 text-base font-semibold text-primary-foreground hover:opacity-90 font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('generateDocument')}
            </Link>
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
