/**
 * NEURALTWIN Chat UI Kit - ChatScrollArea Component
 * 자동 스크롤 채팅 영역
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatScrollAreaProps } from '../types/chat.types';

export function ChatScrollArea({
  children,
  className,
}: ChatScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // 스크롤 위치 감지
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100; // 바닥에서 100px 이내면 "바닥"으로 간주
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;

    setIsAtBottom(atBottom);
    if (atBottom) {
      setShowNewMessage(false);
    }
  }, []);

  // 바닥으로 스크롤
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setShowNewMessage(false);
  }, []);

  // 새 메시지 감지 (children 변경 시)
  useEffect(() => {
    if (isAtBottom) {
      // 이미 바닥에 있으면 자동 스크롤
      scrollToBottom(true);
    } else {
      // 위로 스크롤한 상태면 "새 메시지" 버튼 표시
      setShowNewMessage(true);
    }
  }, [children, isAtBottom, scrollToBottom]);

  // 초기 로드 시 바닥으로 스크롤
  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  return (
    <div className={cn('relative flex-1 overflow-hidden', className)}>
      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <div className="flex flex-col gap-4 p-4">
          {children}
        </div>
      </div>

      {/* "새 메시지" 버튼 */}
      <AnimatePresence>
        {showNewMessage && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom(true)}
            className={cn(
              'absolute bottom-4 left-1/2 -translate-x-1/2',
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'bg-[#00d4aa] text-black text-xs font-medium',
              'shadow-lg hover:bg-[#00e8bb] transition-colors'
            )}
          >
            <ChevronDown className="h-3 w-3" />
            새 메시지
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatScrollArea;
