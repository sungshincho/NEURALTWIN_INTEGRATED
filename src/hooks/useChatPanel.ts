// 채팅 패널 상태 관리 훅
import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface UseChatPanelReturn {
  isOpen: boolean;
  width: number;
  messages: ChatMessage[];
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export function useChatPanel(): UseChatPanelReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);
  const [messages, setMessages] = useState<ChatMessage[]>([
    // TODO: 초기 메시지 - 백엔드 연동 시 제거
    {
      id: '1',
      content: '안녕하세요! 무엇을 도와드릴까요?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    setWidthState(clampedWidth);
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // TODO: 백엔드 API 연동
    // 현재는 간단한 에코 응답
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `메시지를 받았습니다: "${content.trim()}"`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isOpen,
    width,
    messages,
    togglePanel,
    openPanel,
    closePanel,
    setWidth,
    sendMessage,
    clearMessages,
  };
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
