'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { CardCluster } from './components/CardCluster';
import { ValidationPanel } from './components/ValidationPanel';
import { initialCards, initialClusters } from '@/lib/card-engine/initial-cards';
import {
  SmartCard as SmartCardType,
  CardCluster as CardClusterType,
} from '@/lib/card-engine/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function GeneratePage() {
  const [cards, setCards] = useState<SmartCardType[]>(initialCards);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Calculate clusters with completion
  const clusters: CardClusterType[] = useMemo(() => {
    return initialClusters.map((clusterTemplate) => {
      const clusterCards = cards.filter((card) => card.category === clusterTemplate.category);
      const filledCards = clusterCards.filter((card) => card.state === 'filled').length;
      const totalCards = clusterCards.length;
      const completionPercentage = totalCards > 0 ? (filledCards / totalCards) * 100 : 0;

      return {
        ...clusterTemplate,
        cards: clusterCards,
        completionPercentage,
      };
    });
  }, [cards]);

  // Calculate overall completion
  const overallCompletion = useMemo(() => {
    const filledCards = cards.filter((card) => card.state === 'filled').length;
    return (filledCards / cards.length) * 100;
  }, [cards]);

  // Find missing required cards
  const missingRequired = useMemo(() => {
    return cards
      .filter((card) => card.required && card.state !== 'filled')
      .map((card) => card.id);
  }, [cards]);

  // Find warning cards
  const warnings = useMemo(() => {
    return cards.filter((card) => card.state === 'warning').map((card) => card.id);
  }, [cards]);

  // Handle card value changes
  const handleCardValueChange = (cardId: string, value: string) => {
    setCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            value,
            state: 'filled' as const,
          };
        }
        return card;
      })
    );

    // Trigger related cards to appear as suggestions
    const updatedCard = cards.find((c) => c.id === cardId);
    if (updatedCard?.relatedCards) {
      setCards((prevCards) =>
        prevCards.map((card) => {
          if (updatedCard.relatedCards?.includes(card.id) && card.state === 'empty') {
            return {
              ...card,
              state: 'suggested' as const,
              aiSuggestion: {
                confidence: 0.85,
                source: 'ai-inference',
                reasoning: `Commonly added when ${updatedCard.label.toLowerCase()} is specified`,
              },
            };
          }
          return card;
        })
      );
    }
  };

  // Handle card click
  const handleCardClick = (card: SmartCardType) => {
    console.log('Card clicked:', card);
  };

  // Handle fix issues
  const handleFixIssues = () => {
    // Scroll to first missing required card
    if (missingRequired.length > 0) {
      const firstMissing = missingRequired[0];
      const element = document.getElementById(`card-${firstMissing}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-[hsl(214,32%,91%)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] shadow-md">
                <Icons.FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[hsl(222,47%,11%)]">Employment Agreement</h1>
                <p className="text-xs text-[hsl(215,16%,47%)]">Build your contract with smart cards</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? (
                  <>
                    <Icons.Grid3x3 className="h-4 w-4" />
                    Edit Mode
                  </>
                ) : (
                  <>
                    <Icons.Eye className="h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => setShowExportDialog(true)}
                disabled={overallCompletion < 80}
                className="flex items-center gap-2 bg-[hsl(222,89%,52%)] hover:bg-[hsl(222,89%,45%)]"
              >
                <Icons.Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[hsl(215,16%,47%)]">
                Overall Progress
              </span>
              <span className="text-xs font-bold text-[hsl(222,89%,52%)]">
                {Math.round(overallCompletion)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallCompletion}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!showPreview ? (
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8"
            >
              {/* Card Clusters */}
              <div className="space-y-6">
                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                      <Icons.Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">
                        Welcome to the Smart Canvas
                      </h2>
                      <p className="text-sm text-blue-100 leading-relaxed">
                        Fill in the cards below to build your employment agreement. Click any card to
                        edit, and watch as AI suggests related fields automatically. No specific order
                        required!
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Clusters */}
                {clusters.map((cluster) => (
                  <CardCluster
                    key={cluster.id}
                    cluster={cluster}
                    onCardClick={handleCardClick}
                    onCardValueChange={handleCardValueChange}
                  />
                ))}
              </div>

              {/* Sidebar */}
              <aside>
                <ValidationPanel
                  overallCompletion={overallCompletion}
                  missingRequired={missingRequired}
                  warnings={warnings}
                  onFixIssues={handleFixIssues}
                />
              </aside>
            </motion.div>
          ) : (
            <motion.div
              key="preview-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Preview Document */}
              <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-12 border border-[hsl(214,32%,91%)]">
                <div className="mb-8 pb-6 border-b border-[hsl(214,32%,91%)]">
                  <h1 className="text-3xl font-bold text-[hsl(222,47%,11%)] mb-2">
                    EMPLOYMENT AGREEMENT
                  </h1>
                  <p className="text-sm text-[hsl(215,16%,47%)]">
                    This document was generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Document Sections */}
                <div className="space-y-6 text-sm leading-relaxed">
                  <section>
                    <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] mb-3">
                      1. PARTIES TO THE AGREEMENT
                    </h2>
                    <p className="text-[hsl(222,47%,11%)]">
                      This Employment Agreement (&quot;Agreement&quot;) is made and entered into as of{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'start-date')?.value || '[Start Date]'}
                      </span>{' '}
                      by and between [Employer Name] (&quot;Employer&quot;) and{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'employee-name')?.value || '[Employee Name]'}
                      </span>{' '}
                      (&quot;Employee&quot;).
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] mb-3">
                      2. POSITION AND DUTIES
                    </h2>
                    <p className="text-[hsl(222,47%,11%)]">
                      The Employee is hired for the position of{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'role')?.value || '[Job Title]'}
                      </span>
                      {cards.find((c) => c.id === 'level')?.value && (
                        <>
                          {' '}at the{' '}
                          <span className="font-semibold bg-blue-50 px-1 rounded">
                            {cards.find((c) => c.id === 'level')?.value}
                          </span>{' '}
                          level
                        </>
                      )}
                      . The Employee will be based in{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'location')?.value || '[Location]'}
                      </span>
                      .
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] mb-3">
                      3. COMPENSATION
                    </h2>
                    <p className="text-[hsl(222,47%,11%)]">
                      The Employee shall receive an annual base salary of{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'salary')?.value || '[Salary Amount]'}
                      </span>
                      , payable{' '}
                      <span className="font-semibold bg-blue-50 px-1 rounded">
                        {cards.find((c) => c.id === 'pay-frequency')?.value || '[Pay Frequency]'}
                      </span>
                      .
                    </p>
                    {cards.find((c) => c.id === 'equity')?.value && (
                      <p className="mt-2 text-[hsl(222,47%,11%)]">
                        In addition, the Employee will be granted{' '}
                        <span className="font-semibold bg-blue-50 px-1 rounded">
                          {cards.find((c) => c.id === 'equity')?.value}
                        </span>{' '}
                        in company equity.
                      </p>
                    )}
                  </section>

                  {/* Placeholder for other sections */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Icons.Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Preview Mode</p>
                        <p>
                          This is a simplified preview. Additional sections (Benefits, Legal
                          Protection, Termination) will appear as you fill more cards. Export for
                          the complete document.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Your Agreement</DialogTitle>
            <DialogDescription>
              Choose your preferred format to download
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                alert('PDF export coming soon!');
              }}
            >
              <Icons.FileText className="h-5 w-5 mr-3 text-red-600" />
              <div className="text-left">
                <div className="font-semibold">PDF Document</div>
                <div className="text-xs text-[hsl(215,16%,47%)]">
                  Best for signing and archiving
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                alert('Word export coming soon!');
              }}
            >
              <Icons.FileEdit className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Word Document (.docx)</div>
                <div className="text-xs text-[hsl(215,16%,47%)]">Best for further editing</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                alert('Email functionality coming soon!');
              }}
            >
              <Icons.Mail className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Email to Parties</div>
                <div className="text-xs text-[hsl(215,16%,47%)]">
                  Send to employer and employee
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
