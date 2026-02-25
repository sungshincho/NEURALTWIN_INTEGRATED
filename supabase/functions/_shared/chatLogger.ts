/**
 * chatLogger.ts
 *
 * 챗봇 대화 로깅 유틸리티
 * - 대화 세션 생성/조회
 * - 메시지 저장/조회
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 대화 세션 (chat_conversations 테이블)
 */
export interface ChatConversation {
  id: string;
  channel: 'website' | 'os_app';
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
  channel: 'website' | 'os_app';
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
  return data;
}

/**
 * 대화 세션 조회
 */
export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ChatConversation | null> {
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
}

/**
 * 대화의 메시지 목록 조회
 */
export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
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
}

// ============================================================================
// Export
// ============================================================================

export default {
  createConversation,
  getConversation,
  saveMessage,
  getConversationMessages,
};
