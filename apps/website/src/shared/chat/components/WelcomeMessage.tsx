/**
 * NEURALTWIN Chat UI Kit - WelcomeMessage Component
 * 초기 인사 메시지
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SuggestionChips } from './SuggestionChips';
import { WELCOME_MESSAGES } from '../types/chat.types';
import type { WelcomeMessageProps } from '../types/chat.types';

export function WelcomeMessage({
  variant = 'website',
  suggestions,
  onSuggestionSelect,
}: WelcomeMessageProps) {
  const config = WELCOME_MESSAGES[variant];
  const displaySuggestions = suggestions || config.defaultSuggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center py-8"
    >
      {/* 아이콘 */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          variant === 'website'
            ? 'bg-gradient-to-br from-[#00d4aa] to-[#00a88a]'
            : 'bg-primary'
        )}
      >
        {variant === 'website' ? (
          <Brain className="h-8 w-8 text-black" />
        ) : (
          <Bot className="h-8 w-8 text-primary-foreground" />
        )}
      </motion.div>

      {/* 타이틀 */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'text-xl font-bold mb-1',
          variant === 'website' ? 'text-white' : 'text-foreground'
        )}
      >
        {config.title}
      </motion.h2>

      {/* 서브타이틀 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className={cn(
          'text-xs mb-4',
          variant === 'website'
            ? 'text-[#00d4aa]'
            : 'text-muted-foreground'
        )}
      >
        {config.subtitle}
      </motion.p>

      {/* 인사 메시지 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          'text-sm mb-6 max-w-[280px]',
          variant === 'website'
            ? 'text-white/70'
            : 'text-muted-foreground'
        )}
      >
        {config.greeting}
      </motion.p>

      {/* 추천 질문 */}
      {onSuggestionSelect && displaySuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          {/* CTA 안내 문구 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className={cn(
              'text-[11px] tracking-wide',
              variant === 'website'
                ? 'text-white/40'
                : 'text-muted-foreground/60'
            )}
          >
            클릭 한 번으로 바로 시작해보세요
          </motion.p>

          <SuggestionChips
            suggestions={displaySuggestions}
            onSelect={onSuggestionSelect}
            variant={variant}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default WelcomeMessage;
