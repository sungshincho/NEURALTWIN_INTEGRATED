/**
 * chatLogger.ts
 *
 * 챗봇 대화 로깅 유틸리티 (통합 버전)
 * - 대화 세션 생성/조회
 * - 메시지 저장/조회
 * - 이벤트 로깅
 * - 세션 인계 (v2.1)
 *
 * C 버전 기반 + E 버전 기능 통합 (channel 파라미터, 이벤트 로깅, 세션 인계)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// 타입 정의
// ============================================================================

/** 채널 타입 */
export type ChatChannel = 'website' | 'os_app';

/**
 * 대화 세션 (chat_conversations 테이블)
 */
export interface ChatConversation {
  id: string;
  channel: ChatChannel;
  user_id: string | null;
  session_id: string | null;
  store_id: string | null;
  message_count: number;
  channel_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * 메시지 (chat_messages 테이블)
 */
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used: string | null;
  tokens_used: number | null;
  execution_time_ms: number | null;
  channel_data: Record<string, unknown>;
  created_at: string;
}

/**
 * 대화 세션 생성 입력
 */
export interface ConversationCreateInput {
  channel: ChatChannel;
  user_id?: string;
  session_id?: string;
  store_id?: string;
  channel_metadata?: Record<string, unknown>;
}

/**
 * 메시지 생성 입력
 */
export interface MessageCreateInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  tokens_used?: number;
  execution_time_ms?: number;
  channel_data?: Record<string, unknown>;
}

// ============================================================================
// 대화 세션 함수
// ============================================================================

/**
 * 대화 세션 생성
 */
export async function createConversation(
  supabase: SupabaseClient,
  input: ConversationCreateInput
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        channel: input.channel,
        user_id: input.user_id,
        session_id: input.session_id,
        store_id: input.store_id,
        channel_metadata: input.channel_metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[chatLogger] createConversation error:', error);
      return null;
    }

    // 세션 시작 이벤트 기록 (비동기, 실패해도 무시)
    logEvent(supabase, data.id, input.channel, 'session_start', {
      sessionId: input.session_id,
      userId: input.user_id,
      storeId: input.store_id,
    });

    return data;
  } catch (e) {
    console.error('[chatLogger] createConversation exception:', e);
    return null;
  }
}

/**
 * 대화 세션 조회
 */
export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ChatConversation | null> {
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
    return data as ChatConversation;
  } catch (e) {
    console.error('[chatLogger] getConversation exception:', e);
    return null;
  }
}

// ============================================================================
// 메시지 함수
// ============================================================================

/**
 * 메시지 저장
 */
export async function saveMessage(
  supabase: SupabaseClient,
  input: MessageCreateInput
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        model_used: input.model_used,
        tokens_used: input.tokens_used,
        execution_time_ms: input.execution_time_ms,
        channel_data: input.channel_data || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[chatLogger] saveMessage error:', error);
      return null;
    }

    // message_count 증가 (버그 수정: RPC 분리 호출)
    const { error: rpcError } = await supabase.rpc('increment_chat_message_count', {
      conv_id: input.conversation_id,
    });

    if (rpcError) {
      // RPC가 없을 경우 fallback: 직접 조회 후 증가
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('message_count')
        .eq('id', input.conversation_id)
        .single();

      await supabase
        .from('chat_conversations')
        .update({
          message_count: (conv?.message_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.conversation_id);
    }

    return data;
  } catch (e) {
    console.error('[chatLogger] saveMessage exception:', e);
    return null;
  }
}

/**
 * 대화의 메시지 목록 조회
 */
export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[chatLogger] getConversationMessages error:', error);
      return [];
    }
    return (data as ChatMessage[]) || [];
  } catch (e) {
    console.error('[chatLogger] getConversationMessages exception:', e);
    return [];
  }
}

// ============================================================================
// 이벤트 로깅 (E 버전에서 통합)
// ============================================================================

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

// ============================================================================
// 대화 메타데이터 업데이트 (E 버전에서 통합)
// ============================================================================

/**
 * 대화의 channel_metadata 업데이트 (병합)
 */
export async function updateConversationMetadata(
  supabase: SupabaseClient,
  conversationId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
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

// ============================================================================
// 대화 히스토리 로드 (E 버전에서 통합)
// ============================================================================

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

// ============================================================================
// 세션 인계 (E 버전 v2.1에서 통합)
// ============================================================================

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

/**
 * 기존 대화에 user_id 연결 (로그인 후 대화 이어가기)
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

// ============================================================================
// Export
// ============================================================================

export default {
  createConversation,
  getConversation,
  saveMessage,
  getConversationMessages,
  logEvent,
  updateConversationMetadata,
  loadConversationHistory,
  handoverSession,
  linkUserToConversation,
};
