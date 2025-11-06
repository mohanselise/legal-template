import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-gray-50 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              &copy; {currentYear} Legal Templates. All rights reserved.
            </p>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Providing free, accessible legal document templates for everyone.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Powered by</p>
            <Link
              href="https://selisesignature.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-white px-5 py-3 transition-all hover:border-blue-400 hover:shadow-lg dark:bg-gray-900 dark:hover:border-blue-600"
            >
              <Image
                src="/signature-black.svg"
                alt="SELISE Signature"
                width={140}
                height={28}
                className="h-7 w-auto transition-opacity group-hover:opacity-80 dark:invert"
              />
              <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-[hsl(var(--border))] pt-8 text-xs text-[hsl(var(--muted-foreground))]">
          <Link href="/privacy" className="hover:text-[hsl(var(--fg))] hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-[hsl(var(--fg))] hover:underline">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-[hsl(var(--fg))] hover:underline">
            Contact Us
          </Link>
          <span>•</span>
          <Link href="/request" className="hover:text-[hsl(var(--fg))] hover:underline">
            Request a Template
          </Link>
        </div>
      </div>
    </footer>
  );
}
