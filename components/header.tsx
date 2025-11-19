'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, FileText } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 dark:bg-gray-950/95">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary font-heading">
              <FileText className="h-6 w-6" />
              <span>Legal Templates</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <Link
              href="/templates"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              Templates
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              About
            </Link>
            <Link
              href="/faq"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              FAQ
            </Link>
            <a
              href="https://selisegroup.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors font-subheading"
            >
              Contact
            </a>
            <Link
              href="/templates/employment-agreement/generate"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity font-subheading"
            >
              Generate Document
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-card"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
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
              Templates
            </Link>
            <Link
              href="/about"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/faq"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <a
              href="https://selisegroup.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-card font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
            <Link
              href="/templates/employment-agreement/generate"
              className="block rounded-md bg-primary px-3 py-2 text-base font-semibold text-primary-foreground hover:opacity-90 font-subheading"
              onClick={() => setMobileMenuOpen(false)}
            >
              Generate Document
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
