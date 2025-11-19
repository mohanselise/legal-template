'use client';

import React, { useState } from 'react';
import { MapPin, Zap, ChevronDown } from 'lucide-react';
import { useSmartForm } from '../SmartFormContext';
import { SmartInput } from '../SmartInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const WORK_ARRANGEMENT_OPTIONS = [
  {
    value: 'on-site' as const,
    label: 'On-Site',
    description: 'Full-time in the office',
  },
  {
    value: 'remote' as const,
    label: 'Remote',
    description: 'Work from anywhere',
  },
  {
    value: 'hybrid' as const,
    label: 'Hybrid',
    description: 'Mix of office and remote',
  },
];

export function Step3WorkArrangement() {
  const { formData, updateFormData, enrichment, applyMarketStandards } = useSmartForm();
  const [isCustomScheduleOpen, setIsCustomScheduleOpen] = useState(false);

  const marketStandards = enrichment.marketStandards;
  const jurisdictionName =
    enrichment.jurisdictionData?.state ||
    enrichment.jurisdictionData?.country ||
    'market';

  const handleUseMarketStandard = () => {
    if (marketStandards) {
      applyMarketStandards(marketStandards);
    }
  };

  const canContinue = formData.workLocation && formData.workHoursPerWeek;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-14 h-14 bg-[hsl(var(--brand-primary))/0.1] rounded-2xl flex items-center justify-center text-[hsl(var(--brand-primary))]">
          <MapPin className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[hsl(var(--fg))] font-heading">
            Work arrangement
          </h2>
          <p className="text-lg text-[hsl(var(--brand-muted))] mt-2">
            Where and when will they work?
          </p>
        </div>
      </div>

      {/* Work Arrangement Cards */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Work arrangement
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {WORK_ARRANGEMENT_OPTIONS.map((option) => {
            const isSelected = formData.workArrangement === option.value;
            const isRecommended =
              marketStandards?.workArrangement === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData({ workArrangement: option.value })}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-center',
                  'hover:border-[hsl(var(--brand-primary))] hover:shadow-md',
                  isSelected
                    ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))/0.05] shadow-md'
                    : 'border-[hsl(var(--border))] bg-white'
                )}
              >
                {isRecommended && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-[hsl(var(--brand-primary))] bg-[hsl(var(--popover))] dark:bg-[hsl(var(--popover))] text-xs text-[hsl(var(--brand-primary))] shadow-lg font-medium backdrop-blur-sm"
                  >
                    {jurisdictionName} standard
                  </Badge>
                )}
                <div className="font-semibold text-base mb-1">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location and Hours */}
      <div className="space-y-5">
        <SmartInput
          label={
            formData.workArrangement === 'remote'
              ? 'Home base / Tax residence (optional)'
              : formData.workArrangement === 'hybrid'
              ? 'Office location'
              : 'Primary work location'
          }
          name="workLocation"
          value={formData.workLocation || ''}
          onChange={(value) => updateFormData({ workLocation: value })}
          placeholder={
            formData.workArrangement === 'remote'
              ? 'e.g., Manchester, UK (for tax/legal purposes)'
              : 'San Francisco, CA'
          }
          required={formData.workArrangement !== 'remote'}
          helpText={
            formData.workArrangement === 'remote'
              ? 'Location for tax and legal purposes (not required to work from here)'
              : formData.workArrangement === 'hybrid'
              ? 'Office location where employee will work on-site days'
              : 'City and state/country where employee will primarily work'
          }
          suggestion={
            enrichment.jurisdictionData?.city && formData.workArrangement !== 'remote'
              ? {
                  value: `${enrichment.jurisdictionData.city}${enrichment.jurisdictionData.state ? `, ${enrichment.jurisdictionData.state}` : ''}`,
                  reason: 'Based on company address',
                  confidence: 'high',
                  source: 'jurisdiction',
                }
              : undefined
          }
          onApplySuggestion={() => {
            if (enrichment.jurisdictionData?.city) {
              updateFormData({
                workLocation: `${enrichment.jurisdictionData.city}${enrichment.jurisdictionData.state ? `, ${enrichment.jurisdictionData.state}` : ''}`,
              });
            }
          }}
        />

        <SmartInput
          label="Hours per week"
          name="workHoursPerWeek"
          type="number"
          value={formData.workHoursPerWeek || ''}
          onChange={(value) => updateFormData({ workHoursPerWeek: value })}
          placeholder="40"
          required
          helpText="Standard work hours per week"
          suggestion={
            marketStandards
              ? {
                  value: marketStandards.workHoursPerWeek.toString(),
                  reason: `Standard work week in ${jurisdictionName}`,
                  confidence: 'high',
                  source: 'jurisdiction',
                }
              : undefined
          }
          onApplySuggestion={() => {
            if (marketStandards) {
              updateFormData({
                workHoursPerWeek: marketStandards.workHoursPerWeek.toString(),
              });
            }
          }}
        />

        {/* Work schedule customization */}
        {marketStandards && (
          <Collapsible open={isCustomScheduleOpen} onOpenChange={setIsCustomScheduleOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                💡 Typical work week: {marketStandards.workDays}
                <span className="underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
                  click here to customize
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isCustomScheduleOpen && 'transform rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 animate-in slide-in-from-top-2">
              <div className="rounded-xl border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-surface))] p-4 shadow-sm">
                <p className="mb-3 text-sm font-medium text-[hsl(var(--fg))]">
                  Customize work schedule
                </p>
                <SmartInput
                  label="Custom work schedule"
                  name="workSchedule"
                  value={formData.workSchedule || ''}
                  onChange={(value) => updateFormData({ workSchedule: value })}
                  placeholder={`e.g., ${marketStandards.workDays}, 9 AM - 5 PM`}
                  helpText="Specify custom work days and hours if different from standard"
                />

                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="overtimeEligible"
                    type="checkbox"
                    checked={formData.overtimeEligible || false}
                    onChange={(e) =>
                      updateFormData({ overtimeEligible: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="overtimeEligible"
                    className="text-sm text-[hsl(var(--brand-muted))]"
                  >
                    Employee is eligible for overtime pay
                  </label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
