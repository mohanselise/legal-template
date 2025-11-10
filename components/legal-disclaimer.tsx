import { AlertTriangle, Scale, MapPin, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LegalDisclaimerProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LegalDisclaimer({ variant = 'full', className = '' }: LegalDisclaimerProps) {
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
            <strong className="text-[hsl(var(--brand-primary))]">Not Legal Advice:</strong> These templates are provided for informational purposes only and do not constitute legal advice.
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <MapPin className={iconClass} />
          <span>
            <strong className="text-[hsl(var(--brand-primary))]">Switzerland-Based Product:</strong> This is a Switzerland-based product that may not be compliant with laws in your jurisdiction or state.
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <Bot className={iconClass} />
          <span>
            <strong className="text-[hsl(var(--brand-primary))]">AI-Generated Content:</strong> AI is inaccurate by nature. Always consult a qualified legal advisor to review this document before signing.
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
              Important Legal Disclaimer
            </h3>

            <div className="space-y-3 text-sm leading-relaxed text-[hsl(var(--brand-muted))]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">Not Legal Advice:</strong> These templates are provided for informational purposes only and as a starting point for your legal documents. They do not constitute legal advice, and we do not provide legal advice through this service.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">Jurisdiction Disclaimer:</strong> This is a Switzerland-based product. The templates provided may not be compliant with the specific laws, regulations, or requirements of your jurisdiction, state, or country. Laws vary significantly by location and change over time.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">AI-Generated Content:</strong> This service uses artificial intelligence to generate documents. AI is inherently inaccurate by nature and may produce errors, omissions, or inappropriate content. The generated documents should never be used as-is without professional legal review.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Scale className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                <p>
                  <strong className="font-semibold text-[hsl(var(--brand-primary))]">Professional Review Required:</strong> You must consult with a qualified legal advisor admitted to practice in your relevant jurisdiction to review, modify, and approve any document before you sign or use it. Do not rely on these templates without proper legal counsel.
                </p>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--brand-border))] pt-3">
              <p className="text-xs font-medium text-[hsl(var(--brand-muted))]">
                By using this service, you acknowledge that you understand these limitations and agree to seek appropriate legal counsel before using any generated documents.
              </p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
