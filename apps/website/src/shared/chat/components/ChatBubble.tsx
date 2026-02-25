/**
 * NEURALTWIN Chat UI Kit - ChatBubble Component
 * 메시지 버블 컴포넌트
 */

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { ChatBubbleProps } from '../types/chat.types';

export function ChatBubble({
  message,
  variant = 'website',
  showTimestamp = false,
  feedbackSlot,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          variant === 'website'
            ? isUser
              ? 'bg-[#1a1a2e] text-white'
              : 'bg-[#16213e] text-white'
            : isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
          variant === 'website' && 'border border-white/[0.08]'
        )}
      >
        {/* 메시지 내용 */}
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  // 링크 스타일링
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'underline',
                        variant === 'website'
                          ? 'text-[#00d4aa] hover:text-[#00e8bb]'
                          : 'text-primary hover:text-primary/80'
                      )}
                    >
                      {children}
                    </a>
                  ),
                  // 코드 블록 스타일링
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    return isBlock ? (
                      <pre className="bg-black/30 rounded-lg p-3 overflow-x-auto">
                        <code className="text-xs">{children}</code>
                      </pre>
                    ) : (
                      <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">
                        {children}
                      </code>
                    );
                  },
                  // 리스트 스타일링
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2">
                      {children}
                    </ol>
                  ),
                  // 강조 스타일링
                  strong: ({ children }) => (
                    <strong
                      className={cn(
                        'font-semibold',
                        variant === 'website' ? 'text-[#00d4aa]' : 'text-primary'
                      )}
                    >
                      {children}
                    </strong>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 스트리밍 중 커서 */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}

        {/* 타임스탬프 */}
        {showTimestamp && (
          <div
            className={cn(
              'text-xs mt-2 opacity-50',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {formatTime(message.timestamp)}
          </div>
        )}

        {/* 피드백 버튼 슬롯 */}
        {!isUser && feedbackSlot && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {feedbackSlot}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// 시간 포맷팅
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default ChatBubble;
