import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { LegalDisclaimer } from './legal-disclaimer';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-gray-50 py-12 dark:bg-gray-950 overflow-hidden">
      {/* Subtle texture background */}
      <div className="absolute inset-0">
        <Image
          src="/graphics/bg-black-texture.webp"
          alt=""
          fill
          className="object-cover opacity-[0.02] dark:opacity-[0.05]"
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Legal Disclaimer - Site-wide */}
        <div className="mb-10 pb-10 border-b border-border">
          <div className="mx-auto max-w-5xl">
            <LegalDisclaimer variant="compact" className="px-4 py-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} SELISE Group AG. All rights reserved.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Providing free, accessible legal document templates for everyone.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-xs text-muted-foreground">Powered by</p>
            <Link
              href="https://selisesignature.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-border bg-white px-5 py-3 transition-all hover:border-blue-400 hover:shadow-lg dark:bg-gray-900 dark:hover:border-blue-600"
            >
              <Image
                src="/signature-black.svg"
                alt="SELISE Signature"
                width={140}
                height={28}
                className="h-7 w-auto transition-opacity group-hover:opacity-80 dark:invert"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-8 text-xs text-muted-foreground">
          <Link
            href="https://selisegroup.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            href="https://selisegroup.com/software-development-terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Software Development Terms
          </Link>
          <span>•</span>
          <Link
            href="https://selisegroup.com/contact-us/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Contact Us
          </Link>
          <span>•</span>
          <Link href="/request" className="hover:text-foreground hover:underline">
            Request a Template
          </Link>
        </div>
      </div>
    </footer>
  );
}
