'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  overallCompletion: number;
  missingRequired: string[];
  warnings: string[];
  onFixIssues?: () => void;
}

export function ValidationPanel({
  overallCompletion,
  missingRequired,
  warnings,
  onFixIssues,
}: ValidationPanelProps) {
  const getHealthColor = () => {
    if (overallCompletion >= 90) return 'from-green-500 to-emerald-600';
    if (overallCompletion >= 70) return 'from-yellow-500 to-orange-500';
    if (overallCompletion >= 50) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  const getHealthText = () => {
    if (overallCompletion === 100) return 'Perfect!';
    if (overallCompletion >= 90) return 'Almost there';
    if (overallCompletion >= 70) return 'Good progress';
    if (overallCompletion >= 50) return 'Keep going';
    return 'Just started';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-4"
    >
      <Card className="p-6 shadow-xl border-2 border-[hsl(214,32%,91%)]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[hsl(222,47%,11%)] mb-1">Agreement Health</h3>
          <p className="text-xs text-[hsl(215,16%,47%)]">Track your progress</p>
        </div>

        {/* Circular Progress */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-3">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="hsl(220, 13%, 91%)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 364' }}
                animate={{
                  strokeDasharray: `${(overallCompletion / 100) * 364} 364`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={cn('stop-color-from', getHealthColor())} />
                  <stop offset="100%" className={cn('stop-color-to', getHealthColor())} />
                </linearGradient>
              </defs>
            </svg>
            {/* Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={overallCompletion}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-[hsl(222,47%,11%)]"
              >
                {Math.round(overallCompletion)}%
              </motion.span>
              <span className="text-xs text-[hsl(215,16%,47%)] font-medium">
                {getHealthText()}
              </span>
            </div>
          </div>
        </div>

        {/* Status Checklist */}
        <div className="space-y-3 mb-6">
          <AnimatePresence mode="popLayout">
            {missingRequired.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <Icons.Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-[hsl(222,47%,11%)] font-medium">All required fields</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-2 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 flex-shrink-0 mt-0.5">
                  <Icons.X className="h-3 w-3 text-white" />
                </div>
                <div>
                  <span className="text-[hsl(222,47%,11%)] font-medium">Missing:</span>
                  <div className="text-xs text-[hsl(215,16%,47%)] mt-1">
                    {missingRequired.length} required field{missingRequired.length > 1 ? 's' : ''}
                  </div>
                </div>
              </motion.div>
            )}

            {warnings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <Icons.Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-[hsl(222,47%,11%)] font-medium">No warnings</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-2 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 flex-shrink-0 mt-0.5">
                  <Icons.AlertTriangle className="h-3 w-3 text-white" />
                </div>
                <div>
                  <span className="text-[hsl(222,47%,11%)] font-medium">Warnings:</span>
                  <div className="text-xs text-[hsl(215,16%,47%)] mt-1">
                    {warnings.length} item{warnings.length > 1 ? 's' : ''} need attention
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        {(missingRequired.length > 0 || warnings.length > 0) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onFixIssues}
            className="w-full px-4 py-2.5 bg-[hsl(222,89%,52%)] text-white rounded-lg font-semibold text-sm hover:bg-[hsl(222,89%,45%)] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Icons.Wrench className="h-4 w-4" />
            Fix Issues
          </motion.button>
        )}

        {overallCompletion === 100 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Badge className="w-full justify-center py-2 bg-green-500 text-white">
              <Icons.CheckCircle2 className="h-4 w-4 mr-2" />
              Ready to export!
            </Badge>
          </motion.div>
        )}
      </Card>

      {/* Quick Tips */}
      <Card className="mt-4 p-4 bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] text-white border-0 shadow-lg">
        <div className="flex items-start gap-2">
          <Icons.Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold mb-1">Pro Tip</p>
            <p className="text-white/90 leading-relaxed">
              {overallCompletion < 50
                ? 'Start with the basics section to get AI suggestions for other fields.'
                : overallCompletion < 90
                ? 'Add legal protection clauses to ensure your agreement is comprehensive.'
                : 'Review the preview to ensure everything looks correct before exporting.'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
