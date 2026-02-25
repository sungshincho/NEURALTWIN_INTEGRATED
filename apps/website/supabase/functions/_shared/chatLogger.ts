/**
 * NEURALTWIN Dual Chatbot System - Chat Logger
 * 통합 대화 로깅 유틸리티
 *
 * ⚠️ 모든 함수는 에러 시 throw하지 않고 console.error + null 반환.
 *    DB 로깅 실패가 챗봇 응답을 블로킹하면 안 됨.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ChatChannel, ChatMessage } from './chatTypes.ts';

// =============================================
// 대화 세션 생성
// =============================================

interface ConversationIdentifiers {
  sessionId?: string;
  userId?: string;
  storeId?: string;
}

/**
 * 새 대화 세션 생성
 * - website 비회원: { sessionId }
 * - website 회원: { sessionId, userId }  ← v2.1: userId 선택적 추가
 * - os_app: { userId, storeId }
 */
export async function createConversation(
  supabase: SupabaseClient,
  channel: ChatChannel,
  identifiers: ConversationIdentifiers
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        channel,
        session_id: identifiers.sessionId || null,
        user_id: identifiers.userId || null,
        store_id: identifiers.storeId || null,
        message_count: 0,
        channel_metadata: {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[chatLogger] createConversation error:', error);
      return null;
    }

    // 세션 시작 이벤트 기록 (비동기)
    logEvent(supabase, data.id, channel, 'session_start', {
      sessionId: identifiers.sessionId,
      userId: identifiers.userId,
      storeId: identifiers.storeId,
    });

    return data.id;
  } catch (e) {
    console.error('[chatLogger] createConversation exception:', e);
    return null;
  }
}

// =============================================
// 메시지 추가
// =============================================

interface MessageMetadata {
  modelUsed?: string;
  tokensUsed?: number;
  executionTimeMs?: number;
  channelData?: Record<string, unknown>;
}

/**
 * 대화에 메시지 추가
 */
export async function addMessage(
  supabase: SupabaseClient,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: MessageMetadata
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        model_used: metadata?.modelUsed || null,
        tokens_used: metadata?.tokensUsed || null,
        execution_time_ms: metadata?.executionTimeMs || null,
        channel_data: metadata?.channelData || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[chatLogger] addMessage error:', error);
      return null;
    }

    return data.id;
  } catch (e) {
    console.error('[chatLogger] addMessage exception:', e);
    return null;
  }
}

// =============================================
// 이벤트 로깅
// =============================================

/**
 * 이벤트 로그 기록
 */
export async function logEvent(
  supabase: SupabaseClient,
  conversationId: string,
  channel: ChatChannel,
  eventType: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_events')
      .insert({
        conversation_id: conversationId,
        channel,
        event_type: eventType,
        event_data: eventData,
      });

    if (error) {
      console.error('[chatLogger] logEvent error:', error);
    }
  } catch (e) {
    console.error('[chatLogger] logEvent exception:', e);
  }
}

// =============================================
// 대화 카운트 업데이트
// =============================================

/**
 * 대화의 메시지 카운트 증가
 */
export async function updateConversationCount(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_conversation_count', {
      conv_id: conversationId,
    });

    // RPC가 없으면 직접 업데이트
    if (error) {
      const { error: updateError } = await supabase
        .from('chat_conversations')
        .update({
          message_count: supabase.rpc('sql', {
            query: `message_count + 1`,
          }),
        })
        .eq('id', conversationId);

      // 간단한 방식으로 폴백
      if (updateError) {
        await supabase
          .from('chat_conversations')
          .select('message_count')
          .eq('id', conversationId)
          .single()
          .then(async ({ data }) => {
            if (data) {
              await supabase
                .from('chat_conversations')
                .update({ message_count: (data.message_count || 0) + 1 })
                .eq('id', conversationId);
            }
          });
      }
    }
  } catch (e) {
    console.error('[chatLogger] updateConversationCount exception:', e);
  }
}

// =============================================
// 대화 메타데이터 업데이트
// =============================================

/**
 * 대화의 channel_metadata 업데이트 (병합)
 */
export async function updateConversationMetadata(
  supabase: SupabaseClient,
  conversationId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    // 기존 메타데이터 조회
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('channel_metadata')
      .eq('id', conversationId)
      .single();

    const merged = {
      ...(existing?.channel_metadata || {}),
      ...metadata,
    };

    const { error } = await supabase
      .from('chat_conversations')
      .update({ channel_metadata: merged })
      .eq('id', conversationId);

    if (error) {
      console.error('[chatLogger] updateConversationMetadata error:', error);
    }
  } catch (e) {
    console.error('[chatLogger] updateConversationMetadata exception:', e);
  }
}

// =============================================
// 대화 히스토리 로드
// =============================================

/**
 * 대화 히스토리 로드 (최근 N턴)
 */
export async function loadConversationHistory(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit * 2); // user + assistant 쌍이므로 2배

    if (error) {
      console.error('[chatLogger] loadConversationHistory error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[chatLogger] loadConversationHistory exception:', e);
    return [];
  }
}

// =============================================
// 대화 정보 조회
// =============================================

/**
 * 대화 정보 조회
 */
export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('[chatLogger] getConversation error:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('[chatLogger] getConversation exception:', e);
    return null;
  }
}

// =============================================
// v2.1: 세션 인계
// =============================================

/**
 * 비회원 대화를 회원 계정에 연결 (세션 인계)
 * @returns 연결된 대화 수
 */
export async function handoverSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('handover_chat_session', {
      p_session_id: sessionId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[chatLogger] handoverSession error:', error);
      return 0;
    }

    return data || 0;
  } catch (e) {
    console.error('[chatLogger] handoverSession exception:', e);
    return 0;
  }
}

// =============================================
// 기존 대화에 user_id 연결 (로그인 후 대화 이어가기)
// =============================================

/**
 * 기존 대화에 user_id 연결
 * (이미 conversationId가 있고, 현재 userId가 있는데 기존 user_id가 NULL인 경우)
 */
export async function linkUserToConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ user_id: userId })
      .eq('id', conversationId)
      .is('user_id', null);

    if (error) {
      console.error('[chatLogger] linkUserToConversation error:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[chatLogger] linkUserToConversation exception:', e);
    return false;
  }
}
