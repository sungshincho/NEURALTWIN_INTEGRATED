/**
 * Context Memory Store — Phase 2 (Layer 3)
 *
 * chat_context_memory 테이블 CRUD
 * 대화별 프로파일 + 인사이트를 DB에 저장/로드
 *
 * 동작:
 * - loadMemory: 대화 시작 시 기존 메모리 로드
 * - saveMemory: 각 턴 후 비동기 저장 (응답 반환 후)
 * - loadUserHistory: 동일 사용자의 이전 대화 프로파일 로드
 */

import type { ContextMemory, UserProfile, ConversationInsight } from './types.ts';
import { createEmptyProfile } from './types.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ═══════════════════════════════════════════
//  메모리 로드
// ═══════════════════════════════════════════

/**
 * conversation_id로 기존 메모리 로드
 * 없으면 null 반환
 */
export async function loadMemory(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ContextMemory | null> {
  try {
    const { data, error } = await supabase
      .from('chat_context_memory')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      conversationId: data.conversation_id,
      sessionId: data.session_id,
      userId: data.user_id,
      userProfile: (data.user_profile || {}) as UserProfile,
      conversationInsights: (data.conversation_insights || []) as ConversationInsight[],
      conversationSummary: data.conversation_summary || '',
      lastTurnCount: data.last_turn_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[ContextMemory] Load failed:', err);
    return null;
  }
}

// ═══════════════════════════════════════════
//  메모리 저장 (upsert)
// ═══════════════════════════════════════════

/**
 * 메모리 저장 (conversation_id 기준 upsert)
 * 비동기로 호출됨 — 실패해도 대화는 계속됨 (fail-open)
 */
export async function saveMemory(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    sessionId: string | null;
    userId: string | null;
    userProfile: UserProfile;
    conversationInsights: ConversationInsight[];
    conversationSummary: string;
    turnCount: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_context_memory')
      .upsert({
        conversation_id: params.conversationId,
        session_id: params.sessionId,
        user_id: params.userId,
        user_profile: params.userProfile,
        conversation_insights: params.conversationInsights,
        conversation_summary: params.conversationSummary,
        last_turn_count: params.turnCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id',
      });

    if (error) {
      console.error('[ContextMemory] Save error:', error);
    }
  } catch (err) {
    console.error('[ContextMemory] Save failed:', err);
  }
}

// ═══════════════════════════════════════════
//  사용자 이전 대화 프로파일 로드
// ═══════════════════════════════════════════

/**
 * 동일 사용자(user_id)의 이전 대화에서 프로파일 병합
 * 새 대화 시작 시 호출하여 기존 프로파일을 이어받기
 */
export async function loadUserProfileHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('chat_context_memory')
      .select('user_profile')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) {
      return createEmptyProfile();
    }

    // 가장 최근 프로파일을 기반으로, 이전 프로파일의 interests/painPoints 병합
    const latest = (data[0].user_profile || {}) as UserProfile;
    const merged: UserProfile = {
      ...latest,
      interests: latest.interests || [],
      painPoints: latest.painPoints || [],
    };

    // 이전 대화들의 interests, painPoints 누적 (중복 제거)
    for (let i = 1; i < data.length; i++) {
      const prev = (data[i].user_profile || {}) as UserProfile;
      if (prev.interests) {
        for (const interest of prev.interests) {
          if (!merged.interests.includes(interest)) {
            merged.interests.push(interest);
          }
        }
      }
      if (prev.painPoints) {
        for (const pp of prev.painPoints) {
          if (!merged.painPoints.includes(pp)) {
            merged.painPoints.push(pp);
          }
        }
      }
    }

    return merged;
  } catch (err) {
    console.warn('[ContextMemory] User profile history load failed:', err);
    return createEmptyProfile();
  }
}

// ═══════════════════════════════════════════
//  세션 기반 프로파일 로드 (비회원)
// ═══════════════════════════════════════════

/**
 * 동일 세션(session_id)의 이전 대화에서 프로파일 로드
 * 비회원 사용자를 위한 세션 연속성 보장
 */
export async function loadSessionProfileHistory(
  supabase: SupabaseClient,
  sessionId: string
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('chat_context_memory')
      .select('user_profile')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return createEmptyProfile();
    }

    const profile = (data[0].user_profile || {}) as UserProfile;
    return {
      ...profile,
      interests: profile.interests || [],
      painPoints: profile.painPoints || [],
    };
  } catch (err) {
    console.warn('[ContextMemory] Session profile load failed:', err);
    return createEmptyProfile();
  }
}
