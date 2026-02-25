/**
 * NEURALTWIN Chat UI Kit - FeedbackButtons Component
 * 피드백 버튼 (👍/👎)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedbackButtonsProps } from '../types/chat.types';

export function FeedbackButtons({
  messageId,
  currentFeedback,
  onFeedback,
  disabled = false,
}: FeedbackButtonsProps) {
  const handlePositive = () => {
    if (!disabled && currentFeedback !== 'positive') {
      onFeedback(messageId, 'positive');
    }
  };

  const handleNegative = () => {
    if (!disabled && currentFeedback !== 'negative') {
      onFeedback(messageId, 'negative');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-white/40 mr-2">도움이 되셨나요?</span>

      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={handlePositive}
        disabled={disabled || currentFeedback === 'positive'}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          currentFeedback === 'positive'
            ? 'bg-green-500/20 text-green-400'
            : 'text-white/40 hover:text-green-400 hover:bg-green-500/10',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        title="도움이 됐어요"
      >
        <ThumbsUp className="h-4 w-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={handleNegative}
        disabled={disabled || currentFeedback === 'negative'}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          currentFeedback === 'negative'
            ? 'bg-red-500/20 text-red-400'
            : 'text-white/40 hover:text-red-400 hover:bg-red-500/10',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        title="아쉬워요"
      >
        <ThumbsDown className="h-4 w-4" />
      </motion.button>
    </div>
  );
}

export default FeedbackButtons;
