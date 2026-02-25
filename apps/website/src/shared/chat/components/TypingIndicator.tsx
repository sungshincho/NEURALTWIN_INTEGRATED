/**
 * NEURALTWIN Chat UI Kit - TypingIndicator Component
 * 타이핑 중 인디케이터
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TypingIndicatorProps } from '../types/chat.types';

export function TypingIndicator({
  text = 'NEURAL이 답변 중...',
  variant = 'website',
}: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2"
    >
      {/* 3개 점 bounce 애니메이션 */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              variant === 'website' ? 'bg-[#00d4aa]' : 'bg-primary'
            )}
            animate={{
              y: ['0%', '-50%', '0%'],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 텍스트 */}
      <span
        className={cn(
          'text-xs',
          variant === 'website'
            ? 'text-white/60'
            : 'text-muted-foreground'
        )}
      >
        {text}
      </span>
    </motion.div>
  );
}

export default TypingIndicator;
