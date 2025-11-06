'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { SmartCard as SmartCardType } from '@/lib/card-engine/types';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SmartCardProps {
  card: SmartCardType;
  onClick: (card: SmartCardType) => void;
  onValueChange?: (cardId: string, value: string) => void;
}

export function SmartCard({ card, onClick, onValueChange }: SmartCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(card.value || '');

  // Dynamically get the Lucide icon
  const IconComponent = (Icons as any)[card.icon] || Icons.Circle;

  const getStateStyles = () => {
    switch (card.state) {
      case 'empty':
        return 'bg-[hsl(220,13%,91%)] border-[hsl(214,32%,91%)] hover:border-[hsl(222,89%,52%)] hover:shadow-md';
      case 'suggested':
        return 'bg-[hsl(222,89%,95%)] border-[hsl(222,89%,70%)] hover:shadow-lg';
      case 'filled':
        return 'bg-[hsl(222,89%,52%)] text-white border-[hsl(222,89%,52%)] shadow-md';
      case 'warning':
        return 'bg-[hsl(38,92%,95%)] border-[hsl(38,92%,50%)] hover:shadow-md';
      case 'error':
        return 'bg-[hsl(0,84%,95%)] border-[hsl(0,84%,60%)] hover:shadow-md';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getTextColor = () => {
    return card.state === 'filled' ? 'text-white' : 'text-[hsl(222,47%,11%)]';
  };

  const handleSave = () => {
    if (onValueChange && localValue.trim()) {
      onValueChange(card.id, localValue);
      setIsEditing(false);
    }
  };

  const cardContent = (
    <Card
      className={cn(
        'relative h-32 w-32 sm:h-36 sm:w-36 flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 border-2',
        getStateStyles(),
        isEditing && 'ring-2 ring-[hsl(222,89%,52%)] ring-offset-2'
      )}
      onClick={() => {
        if (!isEditing) onClick(card);
      }}
    >
      {/* AI Suggestion Badge */}
      {card.aiSuggestion && card.state === 'suggested' && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <Badge className="bg-[hsl(262,83%,58%)] text-white shadow-lg">
            <Icons.Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </motion.div>
      )}

      {/* Warning/Error indicator */}
      {card.state === 'warning' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-[hsl(38,92%,50%)] rounded-full p-1">
            <Icons.AlertTriangle className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      {card.state === 'error' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-[hsl(0,84%,60%)] rounded-full p-1">
            <Icons.XCircle className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      {/* Checkmark for filled cards */}
      {card.state === 'filled' && !card.aiSuggestion && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <div className="bg-green-500 rounded-full p-1">
            <Icons.Check className="h-3 w-3 text-white" />
          </div>
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <IconComponent className={cn('h-8 w-8 mb-2', getTextColor())} />
      </motion.div>

      {/* Label */}
      <div className={cn('text-xs font-semibold text-center mb-1', getTextColor())}>
        {card.label}
      </div>

      {/* Value or Placeholder */}
      <div className={cn('text-[10px] text-center font-medium', getTextColor(), 'opacity-80')}>
        {card.value || (
          <span className={card.state === 'filled' ? 'text-white/60' : 'text-[hsl(215,16%,47%)]'}>
            {card.state === 'empty' ? 'Empty' :
             card.state === 'suggested' ? 'Suggested' :
             card.placeholder || 'Click to fill'}
          </span>
        )}
      </div>
    </Card>
  );

  // If card has AI suggestion or is editable, wrap in popover
  if (card.aiSuggestion || card.state !== 'filled') {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cardContent}
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="center">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-[hsl(222,89%,52%)]" />
                {card.label}
              </h4>
              {card.aiSuggestion && (
                <p className="text-xs text-[hsl(215,16%,47%)] mb-2">
                  <Icons.Sparkles className="h-3 w-3 inline mr-1" />
                  {card.aiSuggestion.reasoning}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[hsl(222,47%,11%)] mb-1 block">
                {card.placeholder || `Enter ${card.label.toLowerCase()}`}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[hsl(214,32%,91%)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(222,89%,52%)] focus:border-transparent"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={card.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 bg-[hsl(222,89%,52%)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {card.aiSuggestion ? 'Accept' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-[hsl(214,32%,91%)] rounded-md text-sm font-medium hover:bg-[hsl(220,13%,91%)] transition-colors"
              >
                Cancel
              </button>
            </div>

            {card.aiSuggestion && (
              <div className="pt-2 border-t border-[hsl(214,32%,91%)]">
                <div className="flex items-center gap-2 text-xs text-[hsl(215,16%,47%)]">
                  <Icons.Info className="h-3 w-3" />
                  <span>
                    Confidence: {Math.round(card.aiSuggestion.confidence * 100)}% •
                    Source: {card.aiSuggestion.source}
                  </span>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // For filled cards without popover
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {cardContent}
    </motion.div>
  );
}
