/**
 * chatStore.ts
 *
 * 전역 채팅 상태 관리 (Zustand)
 * - 라우트 변경 시에도 채팅 기록 유지
 * - 패널 열림/닫힘 상태 보존
 */

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

interface ChatState {
  // UI 상태
  isOpen: boolean;
  width: number;

  // 메시지
  messages: ChatMessage[];

  // 로딩 상태
  isLoading: boolean;
  isStreaming: boolean;

  // 세션
  conversationId: string | null;

  // UI 액션
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;

  // 메시지 액션
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;

  // 상태 액션
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  // 초기 상태
  isOpen: false,
  width: DEFAULT_WIDTH,
  messages: [
    {
      id: '1',
      content: '안녕하세요! NEURALTWIN AI 어시스턴트입니다. 무엇을 도와드릴까요?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  isStreaming: false,
  conversationId: null,

  // UI 액션
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  setWidth: (newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    set({ width: clampedWidth });
  },

  // 메시지 액션
  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id: string, content: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content, timestamp: new Date() } : msg
      ),
    })),
  clearMessages: () =>
    set({
      messages: [
        {
          id: '1',
          content: '안녕하세요! NEURALTWIN AI 어시스턴트입니다. 무엇을 도와드릴까요?',
          sender: 'assistant',
          timestamp: new Date(),
        },
      ],
      conversationId: null,
    }),

  // 상태 액션
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setIsStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
  setConversationId: (id: string | null) => set({ conversationId: id }),
}));

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
