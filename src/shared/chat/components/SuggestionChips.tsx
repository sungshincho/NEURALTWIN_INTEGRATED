/**
 * NEURALTWIN Chat UI Kit - SuggestionChips Component
 * 후속 질문 추천 칩
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionChipsProps } from '../types/chat.types';

export function SuggestionChips({
  suggestions,
  onSelect,
  maxItems = 3,
  variant = 'website',
}: SuggestionChipsProps) {
  const displaySuggestions = suggestions.slice(0, maxItems);

  if (displaySuggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 justify-center"
    >
      {displaySuggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            type: 'spring',
            stiffness: 400,
            damping: 15,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            'border',
            variant === 'website'
              ? 'bg-transparent border-[#00d4aa]/30 text-[#00d4aa] hover:bg-[#00d4aa]/10 hover:border-[#00d4aa]'
              : 'bg-transparent border-primary/30 text-primary hover:bg-primary/10 hover:border-primary'
          )}
        >
          {suggestion}
          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </motion.button>
      ))}
    </motion.div>
  );
}

export default SuggestionChips;
