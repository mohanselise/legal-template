'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Menu, X, FileText, HelpCircle, Mail, Globe2, LogIn, Building2 } from 'lucide-react';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';
import { AnimatePresence, motion } from 'framer-motion';
import { SignedIn, SignedOut, UserButton, useOrganization } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('common');
  const { organization } = useOrganization();

  return (
    <>
      <header className="sticky top-0 z-[999] border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] backdrop-blur-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Show org logo if available */}
            <div className="flex items-center">
              <Link href={organization ? `/org/${organization.slug}` : "/"} className="flex items-center gap-2">
                {organization?.imageUrl ? (
                  <Image
                    src={organization.imageUrl}
                    alt={organization.name}
                    width={48}
                    height={48}
                    className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src="/Selise Legal Templates.svg"
                    alt="SELISE Legal Templates"
                    width={424}
                    height={241}
                    className="h-10 w-auto md:h-12"
                    priority
                  />
                )}
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

              {/* Auth - Sign In or User Button */}
              <SignedOut>
                <Button asChild variant="default" size="sm">
                  <a href="/sign-in">{t('signIn')}</a>
                </Button>
              </SignedOut>
              <SignedIn>
                {organization ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/org/${organization.slug}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      {organization.name}
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <a href="/org/new">{t('createOrganization')}</a>
                  </Button>
                )}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                    },
                  }}
                />
              </SignedIn>
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
                  {organization?.imageUrl ? (
                    <Image
                      src={organization.imageUrl}
                      alt={organization.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-contain"
                      priority
                    />
                  ) : (
                    <Image
                      src="/Selise Legal Templates.svg"
                      alt="SELISE Legal Templates"
                      width={424}
                      height={241}
                      className="h-8 w-auto"
                      priority
                    />
                  )}
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

                {/* Sign In / User */}
                <div className="mt-4">
                  <SignedOut>
                    <a
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-white bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90 transition-colors font-subheading group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <LogIn className="w-6 h-6" />
                      </div>
                      <span>{t('signIn')}</span>
                    </a>
                  </SignedOut>
                  <SignedIn>
                    {organization ? (
                      <a
                        href={`/org/${organization.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group mb-3"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span>{organization.name}</span>
                      </a>
                    ) : (
                      <a
                        href="/org/new"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-semibold text-[hsl(var(--fg))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] transition-colors font-subheading group mb-3"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center text-[hsl(var(--selise-blue))] group-hover:bg-[hsl(var(--selise-blue))]/20 transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span>{t('createOrganization')}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-4 rounded-xl px-5 py-4 bg-[hsl(var(--muted))]/50">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: 'h-12 w-12',
                          },
                        }}
                      />
                      <span className="text-lg font-semibold text-[hsl(var(--fg))] font-subheading">
                        Account
                      </span>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
