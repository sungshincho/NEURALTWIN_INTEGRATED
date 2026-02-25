-- ═══════════════════════════════════════
-- Phase 2: Layer 3 대화 컨텍스트 메모리
-- 사용자 프로파일 + 대화 인사이트 축적
-- ═══════════════════════════════════════

-- 대화 컨텍스트 메모리 테이블
CREATE TABLE IF NOT EXISTS chat_context_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  session_id TEXT,
  user_id UUID,

  -- 사용자 프로파일 (자동 추출)
  user_profile JSONB DEFAULT '{}'::jsonb,

  -- 대화 인사이트 (턴별 축적)
  conversation_insights JSONB DEFAULT '[]'::jsonb,

  -- 대화 요약 (주요 토픽/관심사)
  conversation_summary TEXT DEFAULT '',

  -- 마지막 업데이트 턴 수
  last_turn_count INT DEFAULT 0,

  -- 관리
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- conversation_id 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_context_memory_conv
  ON chat_context_memory(conversation_id);

-- session_id 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_context_memory_session
  ON chat_context_memory(session_id)
  WHERE session_id IS NOT NULL;

-- user_id 조회 인덱스 (동일 사용자 이전 대화 참조)
CREATE INDEX IF NOT EXISTS idx_context_memory_user
  ON chat_context_memory(user_id)
  WHERE user_id IS NOT NULL;

-- updated_at 기반 정리 인덱스
CREATE INDEX IF NOT EXISTS idx_context_memory_updated
  ON chat_context_memory(updated_at);
