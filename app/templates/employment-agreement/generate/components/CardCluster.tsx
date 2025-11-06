'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { CardCluster as CardClusterType, SmartCard as SmartCardType } from '@/lib/card-engine/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartCard } from './SmartCard';
import { cn } from '@/lib/utils';

interface CardClusterProps {
  cluster: CardClusterType;
  onCardClick: (card: SmartCardType) => void;
  onCardValueChange?: (cardId: string, value: string) => void;
}

export function CardCluster({ cluster, onCardClick, onCardValueChange }: CardClusterProps) {
  const IconComponent = (Icons as any)[cluster.icon] || Icons.Circle;

  const getCompletionColor = () => {
    if (cluster.completionPercentage === 100) return 'text-green-600';
    if (cluster.completionPercentage >= 50) return 'text-yellow-600';
    return 'text-gray-400';
  };

  const getProgressBarColor = () => {
    if (cluster.completionPercentage === 100) return 'bg-green-500';
    if (cluster.completionPercentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <Card className="p-6 shadow-lg border-2 border-[hsl(214,32%,91%)] hover:border-[hsl(222,89%,70%)] transition-all duration-300">
        {/* Cluster Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] shadow-md">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[hsl(222,47%,11%)] flex items-center gap-2">
                  {cluster.title}
                  {cluster.required && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      Required
                    </Badge>
                  )}
                </h3>
              </div>
            </div>

            {/* Completion Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Badge
                variant={cluster.completionPercentage === 100 ? 'default' : 'outline'}
                className={cn(
                  'text-sm font-semibold',
                  cluster.completionPercentage === 100
                    ? 'bg-green-500 text-white'
                    : 'border-gray-300 text-gray-600'
                )}
              >
                {cluster.completionPercentage === 100 && (
                  <Icons.Check className="h-3 w-3 mr-1" />
                )}
                {Math.round(cluster.completionPercentage)}%
              </Badge>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cluster.completionPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn('h-full rounded-full', getProgressBarColor())}
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cluster.cards
            .sort((a, b) => a.order - b.order)
            .map((card) => (
              <SmartCard
                key={card.id}
                card={card}
                onClick={onCardClick}
                onValueChange={onCardValueChange}
              />
            ))}
        </div>

        {/* Cluster Stats */}
        <div className="mt-4 pt-4 border-t border-[hsl(214,32%,91%)] flex items-center justify-between text-xs text-[hsl(215,16%,47%)]">
          <div className="flex items-center gap-4">
            <span>
              {cluster.cards.filter((c) => c.state === 'filled').length} of {cluster.cards.length} completed
            </span>
            {cluster.cards.filter((c) => c.state === 'suggested').length > 0 && (
              <span className="flex items-center gap-1">
                <Icons.Sparkles className="h-3 w-3" />
                {cluster.cards.filter((c) => c.state === 'suggested').length} AI suggestions
              </span>
            )}
          </div>
          {cluster.required && cluster.completionPercentage < 100 && (
            <span className="text-red-600 font-medium">
              Complete this section to proceed
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
