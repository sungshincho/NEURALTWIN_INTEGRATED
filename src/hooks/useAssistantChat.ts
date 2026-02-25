/**
 * AI 연동 채팅 훅
 * Zustand chatStore 기반 - 라우트 변경 시에도 상태 유지
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useActionDispatcher } from '@/features/assistant/hooks/useActionDispatcher';
import { useChatStore, type ChatMessage } from '@/store/chatStore';

export type { ChatMessage };

interface UseAssistantChatReturn {
  isOpen: boolean;
  width: number;
  messages: ChatMessage[];
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export function useAssistantChat(): UseAssistantChatReturn {
  // Zustand 스토어에서 상태 가져오기 (라우트 변경에도 유지됨)
  const {
    isOpen,
    width,
    messages,
    isLoading,
    isStreaming,
    conversationId,
    togglePanel,
    openPanel,
    closePanel,
    setWidth,
    clearMessages,
    addMessage,
    updateMessage,
    setIsLoading,
    setIsStreaming,
    setConversationId,
  } = useChatStore();

  const { session } = useAuth();
  const { selectedStore } = useSelectedStore();
  const location = useLocation();
  const { dateRange } = useDateFilterStore();
  const { dispatchActions } = useActionDispatcher();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return;

    // 1. 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // 2. 로딩 상태 시작
    setIsLoading(true);

    // 3. "생각 중..." 임시 메시지 추가
    const loadingMessageId = (Date.now() + 1).toString();
    addMessage({
      id: loadingMessageId,
      content: '생각 중...',
      sender: 'assistant',
      timestamp: new Date(),
    });

    try {
      // 4. 현재 컨텍스트 수집
      const currentPage = location.pathname;
      const currentTab = new URLSearchParams(location.search).get('tab');

      const context = {
        page: {
          current: currentPage,
          tab: currentTab || undefined,
        },
        dateRange: {
          preset: dateRange.preset,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        store: {
          id: selectedStore?.id || '',
          name: selectedStore?.store_name || '',
        },
      };

      // 5. Edge Function 호출
      const { data, error } = await supabase.functions.invoke('neuraltwin-assistant', {
        body: {
          message: content.trim(),
          conversationId,
          context,
        },
      });

      if (error) {
        throw error;
      }

      setConversationId(data.meta?.conversationId || null);

      // 6. 응답 처리
      setIsLoading(false);
      setIsStreaming(true);

      let responseContent = data.message;
      if (data.suggestions?.length > 0) {
        responseContent += `\n\n이런 것도 해볼 수 있어요:\n${data.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
      }

      updateMessage(loadingMessageId, responseContent);

      // 7. 액션 실행 (응답 메시지 표시 후)
      if (data.actions?.length > 0) {
        await dispatchActions(data.actions);
      }

    } catch (error) {
      console.error('[useAssistantChat] Error:', error);

      // 에러 메시지로 교체
      updateMessage(
        loadingMessageId,
        '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading, isStreaming, conversationId, location, dateRange, selectedStore, dispatchActions, addMessage, updateMessage, setIsLoading, setIsStreaming, setConversationId]);

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
    isLoading,
    isStreaming,
  };
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH } from '@/store/chatStore';
