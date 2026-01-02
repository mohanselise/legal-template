import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LegalDisclaimer } from './legal-disclaimer';

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations('footer');

  return (
    <footer className="relative overflow-hidden border-t border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] py-12">
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
        <div className="mb-10 pb-10 border-b border-[hsl(var(--brand-border))]">
          <div className="mx-auto max-w-5xl">
            <LegalDisclaimer variant="compact" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              {t('copyright', { year: currentYear })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('tagline')}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-xs text-muted-foreground">{t('poweredBy')}</p>
            <Link
              href="https://selisesignature.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface-strong))] px-5 py-3 text-sm transition-all shadow-sm hover:border-[hsl(var(--brand-primary))] hover:shadow-lg hover:shadow-[hsl(var(--brand-primary))/0.2]"
            >
              <Image
                src="/signature-black.svg"
                alt="SELISE Signature"
                width={140}
                height={28}
                className="h-7 w-auto transition-opacity group-hover:opacity-80 dark:invert"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--brand-primary))]" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-[hsl(var(--brand-border))] pt-8 text-xs text-muted-foreground">
          <Link
            href="https://selisegroup.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            {t('privacyPolicy')}
          </Link>
          <span>•</span>
          <Link
            href="https://selisegroup.com/contact-us/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            {t('contactUs')}
          </Link>
          <span>•</span>
          <a
            href="https://selisegroup.com/contact-us/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            {t('requestTemplate')}
          </a>
        </div>
      </div>
    </footer>
  );
}
