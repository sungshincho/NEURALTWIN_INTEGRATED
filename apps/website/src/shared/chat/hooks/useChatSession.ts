/**
 * NEURALTWIN Chat UI Kit - useChatSession Hook
 * 채팅 세션 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseChatSessionResult } from '../types/chat.types';

const SESSION_ID_KEY = 'neuraltwin_chat_session_id';
const CONVERSATION_ID_KEY = 'neuraltwin_chat_conversation_id';

/**
 * 채팅 세션 관리 훅
 * - sessionId 생성/관리 (localStorage, crypto.randomUUID)
 * - conversationId 관리 (서버 응답에서 수신)
 */
export function useChatSession(): UseChatSessionResult {
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationId, setConversationIdState] = useState<string | null>(null);

  // 초기화: sessionId 로드 또는 생성
  useEffect(() => {
    let existingSessionId = localStorage.getItem(SESSION_ID_KEY);

    if (!existingSessionId) {
      existingSessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, existingSessionId);
    }

    setSessionId(existingSessionId);

    // conversationId도 로드 (페이지 새로고침 시 유지)
    const existingConvId = localStorage.getItem(CONVERSATION_ID_KEY);
    if (existingConvId) {
      setConversationIdState(existingConvId);
    }
  }, []);

  // conversationId 설정 (서버 응답에서 수신 시)
  const setConversationId = useCallback((id: string) => {
    setConversationIdState(id);
    localStorage.setItem(CONVERSATION_ID_KEY, id);
  }, []);

  // 세션 초기화 (새 대화 시작)
  const clearSession = useCallback(() => {
    // sessionId는 유지하고 conversationId만 초기화
    setConversationIdState(null);
    localStorage.removeItem(CONVERSATION_ID_KEY);
  }, []);

  // 완전히 새 세션 시작 (sessionId도 재생성)
  const resetSession = useCallback(() => {
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    localStorage.removeItem(CONVERSATION_ID_KEY);
    setSessionId(newSessionId);
    setConversationIdState(null);
  }, []);

  return {
    sessionId,
    conversationId,
    setConversationId,
    clearSession,
  };
}

/**
 * 세션 ID 생성
 * crypto.randomUUID 사용 (더 안전하고 고유함)
 */
function generateSessionId(): string {
  // crypto.randomUUID가 지원되는 경우
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: 타임스탬프 + 랜덤 문자열
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

export default useChatSession;
