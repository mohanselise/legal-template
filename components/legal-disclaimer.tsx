'use client';

import { AlertTriangle, Scale, MapPin, Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LegalDisclaimerProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LegalDisclaimer({ variant = 'full', className = '' }: LegalDisclaimerProps) {
  const t = useTranslations('legalDisclaimer');
  if (variant === 'compact') {
    const iconClass = 'h-3 w-3 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]';

    return (
      <div
        className={cn(
          'space-y-1 rounded-lg border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] px-4 py-4 text-xs text-[hsl(var(--brand-muted))] shadow-sm',
          className,
        )}
      >
        <p className="flex items-start gap-1.5">
          <AlertTriangle className={iconClass} />
          <span>
            <strong className="text-[hsl(var(--brand-primary))]">{t('notLegalAdvice')}</strong> {t('notLegalAdviceText')}
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <MapPin className={iconClass} />
          <span>
            <strong className="text-[hsl(var(--brand-primary))]">{t('switzerlandBased')}</strong> {t('switzerlandBasedText')}
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <Bot className={iconClass} />
          <span>
            <strong className="text-[hsl(var(--brand-primary))]">{t('aiGenerated')}</strong> {t('aiGeneratedText')}
          </span>
        </p>
      </div>
    );
  }

  return (
    <Alert
      className={cn(
        'border-2 border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] text-[hsl(var(--brand-muted))] shadow-sm',
        className,
      )}
    >
      <AlertDescription>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--brand-primary))/0.12]">
            <Scale className="h-6 w-6 text-[hsl(var(--brand-primary))]" />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--brand-primary))]">
              {t('importantLegalDisclaimer')}
            </h3>

            <div className="space-y-3 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">{t('notLegalAdvice')}</strong> {t('notLegalAdviceText')}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">{t('jurisdictionDisclaimer')}</strong> {t('jurisdictionDisclaimerText')}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">{t('aiGenerated')}</strong> {t('aiGeneratedText')}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">{t('professionalReviewRequired')}</strong> {t('professionalReviewRequiredText')}
                </p>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--brand-border))] pt-3">
              <p className="text-xs font-medium text-[hsl(var(--brand-muted))]">
                {t('acknowledgment')}
              </p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
