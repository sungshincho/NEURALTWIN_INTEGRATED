/**
 * NEURALTWIN Dual Chatbot System - Rate Limiter
 * DB 기반 Rate Limiting
 *
 * ⚠️ 인메모리 Map은 Edge Function cold start 시 리셋되므로 사용하지 않음.
 *    DB 기반으로 구현하되, 카운트 쿼리는 간단하게 유지 (성능).
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ChatChannel, RateLimitResult } from './chatTypes.ts';

// =============================================
// Rate Limit 설정
// =============================================

interface RateLimitConfig {
  windowMs: number;      // 시간 윈도우 (밀리초)
  maxRequests: number;   // 최대 요청 수
}

const RATE_LIMITS: Record<ChatChannel, RateLimitConfig> = {
  website: {
    windowMs: 60 * 1000,  // 1분
    maxRequests: 10,       // 세션당 1분 내 10회
  },
  os_app: {
    windowMs: 60 * 1000,  // 1분
    maxRequests: 30,       // 유저당 1분 내 30회
  },
};

// 웹사이트 대화당 최대 턴 수
const MAX_TURNS_PER_CONVERSATION = 20;

// =============================================
// Rate Limit 체크
// =============================================

/**
 * Rate Limit 체크
 * @param supabase - Supabase 클라이언트
 * @param identifier - session_id (웹사이트) 또는 user_id (OS)
 * @param channel - 채널
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  channel: ChatChannel
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[channel];
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  try {
    // 먼저 대화 ID 목록을 조회
    let conversationIds: string[] = [];

    if (channel === 'website') {
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', identifier)
        .eq('channel', 'website');
      conversationIds = (convs || []).map((c: { id: string }) => c.id);
    } else {
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', identifier)
        .eq('channel', 'os_app');
      conversationIds = (convs || []).map((c: { id: string }) => c.id);
    }

    if (conversationIds.length === 0) {
      return { allowed: true, remaining: config.maxRequests };
    }

    // 최근 시간 윈도우 내 메시지 수 카운트
    const { count, error } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', windowStart)
      .in('conversation_id', conversationIds);

    if (error) {
      console.error('[rateLimiter] checkRateLimit error:', error);
      // 에러 시 허용 (fail-open)
      return { allowed: true, remaining: config.maxRequests };
    }

    const currentCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const allowed = currentCount < config.maxRequests;

    return {
      allowed,
      remaining,
      resetAt: new Date(Date.now() + config.windowMs).toISOString(),
    };
  } catch (e) {
    console.error('[rateLimiter] checkRateLimit exception:', e);
    // 예외 시 허용 (fail-open)
    return { allowed: true, remaining: config.maxRequests };
  }
}

// =============================================
// 대화당 턴 수 체크 (웹사이트 전용)
// =============================================

/**
 * 대화당 최대 턴 수 체크
 * @param supabase - Supabase 클라이언트
 * @param conversationId - 대화 ID
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkConversationTurnLimit(
  supabase: SupabaseClient,
  conversationId: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('message_count')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('[rateLimiter] checkConversationTurnLimit error:', error);
      return { allowed: true, remaining: MAX_TURNS_PER_CONVERSATION };
    }

    const currentCount = data?.message_count || 0;
    const remaining = Math.max(0, MAX_TURNS_PER_CONVERSATION - currentCount);
    const allowed = currentCount < MAX_TURNS_PER_CONVERSATION;

    return { allowed, remaining };
  } catch (e) {
    console.error('[rateLimiter] checkConversationTurnLimit exception:', e);
    return { allowed: true, remaining: MAX_TURNS_PER_CONVERSATION };
  }
}

// =============================================
// 간단한 Rate Limit 체크 (메시지 테이블만 사용)
// =============================================

/**
 * 간단한 Rate Limit 체크 (서브쿼리 없이)
 * 성능 최적화를 위해 chat_conversations 테이블의 updated_at 활용
 */
export async function checkRateLimitSimple(
  supabase: SupabaseClient,
  identifier: string,
  channel: ChatChannel
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[channel];
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  try {
    // 최근 시간 윈도우 내 대화 수 카운트
    const query = channel === 'website'
      ? supabase
          .from('chat_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', identifier)
          .eq('channel', 'website')
          .gte('updated_at', windowStart)
      : supabase
          .from('chat_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', identifier)
          .eq('channel', 'os_app')
          .gte('updated_at', windowStart);

    const { count, error } = await query;

    if (error) {
      console.error('[rateLimiter] checkRateLimitSimple error:', error);
      return { allowed: true, remaining: config.maxRequests };
    }

    // 대화 수 * 예상 평균 턴 수로 근사치 계산
    const estimatedMessages = (count || 0) * 3; // 대화당 평균 3턴 가정
    const remaining = Math.max(0, config.maxRequests - estimatedMessages);
    const allowed = estimatedMessages < config.maxRequests;

    return {
      allowed,
      remaining,
      resetAt: new Date(Date.now() + config.windowMs).toISOString(),
    };
  } catch (e) {
    console.error('[rateLimiter] checkRateLimitSimple exception:', e);
    return { allowed: true, remaining: config.maxRequests };
  }
}
