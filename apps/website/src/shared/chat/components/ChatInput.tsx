/**
 * NEURALTWIN Chat UI Kit - ChatInput Component
 * 메시지 입력 컴포넌트
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChatInputProps } from '../types/chat.types';

const DEFAULT_MAX_LENGTH = 1000;

export function ChatInput({
  onSend,
  placeholder = '예: 이번 시즌 VMD 트렌드 알려줘',
  disabled = false,
  maxLength = DEFAULT_MAX_LENGTH,
  variant = 'website',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');

    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter로 전송, Shift+Enter로 줄바꿈
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        setValue(newValue);
      }

      // 자동 높이 조절
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    },
    [maxLength]
  );

  const isNearLimit = value.length > maxLength * 0.9;
  const charCount = `${value.length}/${maxLength}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex items-end gap-2 p-3 rounded-2xl',
        variant === 'website'
          ? 'bg-[#111] border border-[#333]'
          : 'bg-background border border-border'
      )}
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent outline-none text-sm leading-relaxed',
            'placeholder:text-[#666] disabled:opacity-50 disabled:cursor-not-allowed',
            variant === 'website'
              ? 'text-white placeholder:text-[#666]'
              : 'text-foreground placeholder:text-muted-foreground'
          )}
          style={{ maxHeight: '120px' }}
        />

        {/* 글자수 표시 */}
        <div
          className={cn(
            'absolute bottom-0 right-0 text-xs opacity-50',
            isNearLimit && 'text-yellow-500 opacity-100'
          )}
        >
          {charCount}
        </div>
      </div>

      {/* 전송 버튼 */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className={cn(
          'shrink-0 rounded-xl transition-all',
          variant === 'website'
            ? 'bg-[#00d4aa] hover:bg-[#00e8bb] text-black disabled:bg-[#00d4aa]/30'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        )}
      >
        <Send className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

export default ChatInput;
