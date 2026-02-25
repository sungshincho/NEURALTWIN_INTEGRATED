// 개별 채팅 메시지 컴포넌트
import { ChatMessage as ChatMessageType } from '@/hooks/useChatPanel';

interface ChatMessageProps {
  message: ChatMessageType;
  isDark: boolean;
}

export function ChatMessage({ message, isDark }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? isDark
              ? 'bg-white/20 text-white'
              : 'bg-black/10 text-black'
            : isDark
              ? 'bg-white/10 text-white/90'
              : 'bg-black/5 text-black/90'
        }`}
        style={{
          backdropFilter: 'blur(10px)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words selectable">
          {message.content}
        </p>
        <span
          className={`text-[10px] mt-1 block ${
            isDark ? 'text-white/40' : 'text-black/40'
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
