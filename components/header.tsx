'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Menu, X, FileText, HelpCircle, Mail, Globe2 } from 'lucide-react';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';
import { AnimatePresence, motion } from 'framer-motion';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('common');

  return (
    <>
      <header className="sticky top-0 z-[999] border-b border-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 dark:bg-gray-950/95">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/Selise Legal Templates.svg"
                  alt="SELISE Legal Templates"
                  width={424}
                  height={241}
                  className="h-10 w-auto md:h-12"
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
      </header>

      {/* Mobile menu - Full screen overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 z-[1001] md:hidden bg-[hsl(var(--bg))] flex flex-col"
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-3">
                  <Image
                    src="/Selise Legal Templates.svg"
                    alt="SELISE Legal Templates"
                    width={424}
                    height={241}
                    className="h-8 w-auto"
                    priority
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto px-6 py-8">
                <nav className="space-y-3">
                  <Link
                    href="/templates"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span>{t('templates')}</span>
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <span>{t('about')}</span>
                  </Link>

                  <Link
                    href="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <span>{t('faq')}</span>
                  </Link>

                  <a
                    href="https://selisegroup.com/contact-us/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span>{t('contact')}</span>
                  </a>
                </nav>

                {/* Language Switcher */}
                <div className="mt-8 pt-8 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-4 rounded-xl px-5 py-4 bg-[hsl(var(--muted))]/50">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))]">
                      <Globe2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--fg))] mb-1">Language</p>
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
