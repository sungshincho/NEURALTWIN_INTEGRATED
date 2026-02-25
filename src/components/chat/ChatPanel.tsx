// 메인 채팅 패널 컴포넌트 - 리사이즈, 토글 기능 포함
import { useRef, useEffect, useCallback } from 'react';
import { X, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType, MIN_WIDTH, MAX_WIDTH } from '@/store/chatStore';

interface ChatPanelProps {
  isOpen: boolean;
  width: number;
  messages: ChatMessageType[];
  isDark: boolean;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  onSendMessage: (content: string) => void;
  onClearMessages: () => void;
  disabled?: boolean;
}

export function ChatPanel({
  isOpen,
  width,
  messages,
  isDark,
  onClose,
  onWidthChange,
  onSendMessage,
  onClearMessages,
  disabled = false,
}: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // 새 메시지 시 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 리사이즈 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 h-full flex flex-col z-50 transition-transform duration-300"
      style={{
        width: `${width}px`,
        background: isDark
          ? 'linear-gradient(165deg, rgba(20,20,24,0.98) 0%, rgba(12,12,15,0.97) 30%, rgba(16,16,20,0.98) 60%, rgba(14,14,18,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 30%, rgba(255,255,255,0.98) 60%, rgba(248,248,250,0.97) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderLeft: isDark
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(0,0,0,0.08)',
        boxShadow: isDark
          ? '-4px 0 20px rgba(0,0,0,0.4)'
          : '-4px 0 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* 리사이즈 핸들 */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors ${
          isDark ? 'hover:bg-white/20' : 'hover:bg-black/10'
        }`}
        style={{ zIndex: 60 }}
      />

      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle
            className={`h-5 w-5 ${isDark ? 'text-white/80' : 'text-black/80'}`}
          />
          <h2
            className={`font-semibold text-sm ${
              isDark ? 'text-white/90' : 'text-black/90'
            }`}
          >
            채팅
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearMessages}
            className={`h-8 w-8 rounded-lg ${
              isDark
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
            title="대화 지우기"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`h-8 w-8 rounded-lg ${
              isDark
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}
          >
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">메시지가 없습니다</p>
            <p className="text-xs mt-1">대화를 시작해보세요</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} isDark={isDark} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 입력 영역 */}
      <ChatInput onSend={onSendMessage} isDark={isDark} disabled={disabled} />
    </div>
  );
}

// 채팅 토글 버튼 컴포넌트
interface ChatToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
  isDark: boolean;
  className?: string;
}

export function ChatToggleButton({
  onClick,
  isOpen,
  isDark,
  className = '',
}: ChatToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`relative ${className} ${
        isDark
          ? 'text-white/80 hover:text-white hover:bg-white/10'
          : 'text-black/70 hover:text-black hover:bg-black/5'
      } ${isOpen ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
      title={isOpen ? '채팅 닫기' : '채팅 열기'}
    >
      <MessageCircle className="h-5 w-5" />
    </Button>
  );
}
