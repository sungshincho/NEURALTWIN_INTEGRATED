// 채팅 메시지 입력 컴포넌트
import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isDark: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isDark, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="p-3 border-t"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        background: isDark
          ? 'rgba(20,20,24,0.5)'
          : 'rgba(255,255,255,0.5)',
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
            isDark
              ? 'bg-white/10 text-white placeholder:text-white/40 focus:bg-white/15'
              : 'bg-black/5 text-black placeholder:text-black/40 focus:bg-black/10'
          }`}
          style={{
            border: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.08)',
            minHeight: '42px',
            maxHeight: '120px',
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size="icon"
          className={`rounded-xl h-[42px] w-[42px] transition-all ${
            isDark
              ? 'bg-white/20 hover:bg-white/30 text-white disabled:bg-white/5 disabled:text-white/30'
              : 'bg-black/10 hover:bg-black/20 text-black disabled:bg-black/5 disabled:text-black/30'
          }`}
          style={{
            border: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p
        className={`text-[10px] mt-2 ${
          isDark ? 'text-white/30' : 'text-black/30'
        }`}
      >
        Enter로 전송, Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
