'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Signature, Calendar } from 'lucide-react';
import type { SignatureField } from './SignatureFieldOverlay';

interface Signatory {
  name: string;
  email: string;
  role: string;
  color: string;
}

interface SignatureFieldMiniMapProps {
  numPages: number | null;
  signatureFields: SignatureField[];
  signatories: Signatory[];
  currentPage: number;
  onPageClick: (page: number) => void;
}

export function SignatureFieldMiniMap({
  numPages,
  signatureFields,
  signatories,
  currentPage,
  onPageClick,
}: SignatureFieldMiniMapProps) {
  const tMiniMap = useTranslations('miniMap');
  const tReviewPage = useTranslations('employmentAgreement.reviewPage');

  if (!numPages || numPages === 0) {
    return null;
  }

  // Group fields by page
  const fieldsByPage: Record<number, SignatureField[]> = {};
  signatureFields.forEach((field) => {
    const page = field.pageNumber || 1;
    if (!fieldsByPage[page]) {
      fieldsByPage[page] = [];
    }
    fieldsByPage[page].push(field);
  });

  // Get fields for a specific page, sorted by signatory
  const getPageFields = (page: number) => {
    return fieldsByPage[page] || [];
  };

  // Get color for signatory
  const getSignatoryColor = (signatoryIndex: number) => {
    return signatories[signatoryIndex]?.color || '#0066B2';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-[hsl(var(--fg))] uppercase tracking-wide">
        {tMiniMap('documentOverview')}
      </h4>

      {/* Page grid */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => {
          const pageFields = getPageFields(page);
          const hasFields = pageFields.length > 0;
          const isCurrentPage = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageClick(page)}
              className={`
                relative p-2 rounded-lg border-2 transition-all cursor-pointer
                ${isCurrentPage 
                  ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))]/10 shadow-sm' 
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 hover:border-[hsl(var(--brand-primary))]/50'
                }
              `}
              title={`${tReviewPage('page')} ${page}${hasFields ? ` - ${pageFields.length} ${tReviewPage('field', { count: pageFields.length })}` : ''}`}
            >
              {/* Page number and icon */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                <span className="text-xs font-medium text-[hsl(var(--fg))]">{page}</span>
              </div>

              {/* Field indicators */}
              {hasFields && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {pageFields.map((field) => (
                    <div
                      key={field.id}
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${getSignatoryColor(field.signatoryIndex)}20` }}
                      title={`${signatories[field.signatoryIndex]?.name || 'Signatory'} - ${field.type}`}
                    >
                      {field.type === 'signature' ? (
                        <Signature 
                          className="w-2.5 h-2.5" 
                          style={{ color: getSignatoryColor(field.signatoryIndex) }} 
                        />
                      ) : (
                        <Calendar 
                          className="w-2.5 h-2.5" 
                          style={{ color: getSignatoryColor(field.signatoryIndex) }} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty page indicator */}
              {!hasFields && (
                <div className="h-4 flex items-center justify-center">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">—</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-[hsl(var(--border))] space-y-2">
        <p className="text-xs font-semibold text-[hsl(var(--fg))]">{tMiniMap('signatories')}</p>
        {signatories.map((signatory, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: signatory.color }}
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              {signatory.name}
            </span>
          </div>
        ))}
      </div>

      {/* Field type legend */}
      <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center gap-1">
          <Signature className="w-3 h-3" />
          <span>{tMiniMap('signatureLabel')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{tMiniMap('dateLabel')}</span>
        </div>
      </div>
    </div>
  );
}

