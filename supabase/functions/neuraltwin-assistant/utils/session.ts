import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { createConversation, getConversation } from '../../_shared/chatLogger.ts';

interface SessionInput {
  conversationId?: string;
  userId: string;
  storeId: string;
  initialContext?: any;
}

interface SessionResult {
  conversationId: string;
  isNew: boolean;
}

export async function getOrCreateSession(
  supabase: SupabaseClient,
  input: SessionInput
): Promise<SessionResult | null> {
  // 기존 대화 ID가 있으면 로드
  if (input.conversationId) {
    const existing = await getConversation(supabase, input.conversationId);
    if (existing && existing.user_id === input.userId) {
      return {
        conversationId: existing.id,
        isNew: false,
      };
    }
    // ID가 있지만 조회 실패 → 새로 생성
  }

  // 새 대화 세션 생성
  const result = await createConversation(supabase, {
    channel: 'os_app',
    user_id: input.userId,
    store_id: input.storeId,
    channel_metadata: {
      initial_context: input.initialContext,
    },
  });

  if (!result) {
    return null;
  }

  return {
    conversationId: result.id,
    isNew: true,
  };
}
