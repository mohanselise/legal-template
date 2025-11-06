'use client';

import { motion } from 'framer-motion';
import { Loader2, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GeneratingAnimationProps {
  onComplete?: () => void;
  isComplete?: boolean; // NEW: external completion signal
}

const STAGES = [
  { id: 1, label: 'Processing form data', duration: 2000 },
  { id: 2, label: 'Analyzing requirements', duration: 3000 },
  { id: 3, label: 'Generating contract clauses', duration: 15000 },
  { id: 4, label: 'Formatting document', duration: 4000 },
  { id: 5, label: 'Finalizing', duration: 1000 },
];

export function GeneratingAnimation({ onComplete, isComplete = false }: GeneratingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If externally signaled as complete, finish immediately
    if (isComplete) {
      setProgress(100);
      setCurrentStage(STAGES.length - 1);
      setTimeout(() => {
        onComplete?.();
      }, 500);
      return;
    }

    let stageIndex = 0;
    let elapsed = 0;
    const totalDuration = STAGES.reduce((sum, stage) => sum + stage.duration, 0);

    const interval = setInterval(() => {
      elapsed += 100;
      
      // Calculate overall progress
      let cumulativeDuration = 0;
      for (let i = 0; i <= stageIndex && i < STAGES.length; i++) {
        cumulativeDuration += STAGES[i].duration;
      }
      const newProgress = Math.min((cumulativeDuration / totalDuration) * 100, 95); // Cap at 95% until complete
      setProgress(newProgress);

      // Move to next stage
      if (stageIndex < STAGES.length - 1) {
        const currentStageDuration = STAGES.slice(0, stageIndex + 1).reduce((sum, stage) => sum + stage.duration, 0);
        if (elapsed >= currentStageDuration) {
          stageIndex++;
          setCurrentStage(stageIndex);
        }
      }

      // Don't auto-complete - wait for external signal
      // If we reach the end of timer, just stay at 95% on last stage
      if (elapsed >= totalDuration) {
        setCurrentStage(STAGES.length - 1);
        setProgress(95);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete, isComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-lg w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] flex items-center justify-center"
            >
              <FileText className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] opacity-20"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-[hsl(222,47%,11%)] mb-2">
          Crafting Your Agreement
        </h2>
        <p className="text-center text-[hsl(215,16%,47%)] mb-8">
          Our AI is generating your professional employment agreement...
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)]"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-[hsl(215,16%,47%)]">
              {STAGES[currentStage]?.label || 'Processing...'}
            </span>
            <span className="text-xs font-bold text-[hsl(222,89%,52%)]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {STAGES.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentStage ? 1 : 0.3,
                x: 0 
              }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {index < currentStage ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : index === currentStage ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-5 h-5 text-[hsl(222,89%,52%)] flex-shrink-0" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${index <= currentStage ? 'text-[hsl(222,47%,11%)]' : 'text-[hsl(215,16%,47%)]'}`}>
                {stage.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom sparkle */}
        <div className="flex justify-center mt-8">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-[hsl(262,83%,58%)]" />
          </motion.div>
        </div>

        {/* Estimated time */}
        <p className="text-center text-xs text-[hsl(215,16%,47%)] mt-4">
          This usually takes 20-30 seconds
        </p>
      </motion.div>
    </div>
  );
}
