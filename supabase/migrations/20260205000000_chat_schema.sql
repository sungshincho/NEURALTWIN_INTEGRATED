-- =============================================
-- NEURALTWIN Dual Chatbot System - DB Schema
-- v2.1: 웹사이트 로그인 유저 지원, 세션 인계
-- =============================================

-- 1. chat_channel ENUM 타입 정의
DO $$ BEGIN
  CREATE TYPE chat_channel AS ENUM ('website', 'os_app');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. chat_conversations — 대화 세션 (채널 통합)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  title TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  channel_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE,

  -- v2.1 CHECK 제약조건: 웹사이트에서 session_id OR user_id 허용
  CONSTRAINT chat_conversations_channel_check CHECK (
    (channel = 'website' AND (session_id IS NOT NULL OR user_id IS NOT NULL))
    OR
    (channel = 'os_app' AND user_id IS NOT NULL)
  )
);

-- 3. chat_messages — 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  channel_data JSONB DEFAULT '{}',
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative')),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. chat_leads — 리드 (웹사이트 전용)
CREATE TABLE IF NOT EXISTS chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  pain_points JSONB DEFAULT '[]',
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. chat_events — 이벤트 로그 (분석용)
CREATE TABLE IF NOT EXISTS chat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  channel chat_channel NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. chat_daily_analytics — 일별 분석 (집계용)
CREATE TABLE IF NOT EXISTS chat_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_turns_per_session NUMERIC(4,1),
  top_topics JSONB DEFAULT '[]',
  top_pain_points JSONB DEFAULT '[]',
  top_intents JSONB DEFAULT '[]',
  lead_conversion_rate NUMERIC(4,2),
  satisfaction_avg NUMERIC(3,1),
  UNIQUE(date, channel)
);

-- 7. assistant_command_cache — OS 명령어 캐시
CREATE TABLE IF NOT EXISTS assistant_command_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  input_pattern TEXT,
  input_hash TEXT,
  intent TEXT,
  parameters JSONB,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(store_id, input_hash)
);

-- =============================================
-- 인덱스
-- =============================================

-- chat_conversations 인덱스
CREATE INDEX IF NOT EXISTS idx_conv_channel ON chat_conversations(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_user ON chat_conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conv_session ON chat_conversations(session_id, created_at DESC) WHERE session_id IS NOT NULL;
-- v2.1 신규: Context Bridge에서 "특정 유저의 웹사이트 대화만" 조회 시 사용
CREATE INDEX IF NOT EXISTS idx_conv_user_channel ON chat_conversations(user_id, channel, created_at DESC) WHERE user_id IS NOT NULL;

-- chat_messages 인덱스
CREATE INDEX IF NOT EXISTS idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_channel_data ON chat_messages USING GIN(channel_data);

-- chat_events 인덱스
CREATE INDEX IF NOT EXISTS idx_events_conv ON chat_events(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON chat_events(event_type, created_at DESC);

-- chat_leads 인덱스
CREATE INDEX IF NOT EXISTS idx_leads_email ON chat_leads(email);

-- assistant_command_cache 인덱스
CREATE INDEX IF NOT EXISTS idx_cache_lookup ON assistant_command_cache(store_id, input_hash);

-- =============================================
-- updated_at 자동 갱신 트리거
-- =============================================

CREATE OR REPLACE FUNCTION update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER trigger_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversations_updated_at();

-- =============================================
-- RLS 정책
-- =============================================

-- chat_conversations RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- OS: SELECT/INSERT WHERE auth.uid() = user_id
CREATE POLICY "chat_conversations_os_select" ON chat_conversations
  FOR SELECT
  USING (channel = 'os_app' AND auth.uid() = user_id);

CREATE POLICY "chat_conversations_os_insert" ON chat_conversations
  FOR INSERT
  WITH CHECK (channel = 'os_app' AND auth.uid() = user_id);

-- Website 인증: SELECT/INSERT WHERE auth.uid() = user_id (로그인 유저)
CREATE POLICY "chat_conversations_website_auth_select" ON chat_conversations
  FOR SELECT
  USING (channel = 'website' AND auth.uid() = user_id);

CREATE POLICY "chat_conversations_website_auth_insert" ON chat_conversations
  FOR INSERT
  WITH CHECK (channel = 'website' AND auth.uid() = user_id);

-- Service role 전체 접근 (비인증 웹사이트 + 관리)
CREATE POLICY "chat_conversations_service_role" ON chat_conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- chat_messages RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- conversation 소유자만 (conversation_id를 통해)
CREATE POLICY "chat_messages_owner_select" ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
    )
  );

CREATE POLICY "chat_messages_service_role" ON chat_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- chat_events RLS
ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;

-- service_role만 INSERT
CREATE POLICY "chat_events_service_role_insert" ON chat_events
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 소유자만 SELECT
CREATE POLICY "chat_events_owner_select" ON chat_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_events.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_events_service_role_select" ON chat_events
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- chat_leads RLS
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- service_role만 접근
CREATE POLICY "chat_leads_service_role" ON chat_leads
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- chat_daily_analytics RLS
ALTER TABLE chat_daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_daily_analytics_service_role" ON chat_daily_analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- assistant_command_cache RLS
ALTER TABLE assistant_command_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_command_cache_service_role" ON assistant_command_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 유틸리티 함수
-- =============================================

-- 메시지 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_message_count(
  p_conversation_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE chat_conversations
  SET message_count = message_count + 1, updated_at = now()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- v2.1: 세션 인계 함수
-- =============================================

CREATE OR REPLACE FUNCTION handover_chat_session(
  p_session_id TEXT,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 비회원 대화를 회원 계정에 연결
  UPDATE chat_conversations
  SET user_id = p_user_id, updated_at = now()
  WHERE session_id = p_session_id
    AND user_id IS NULL
    AND channel = 'website';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- 인계 이벤트 기록
  IF updated_count > 0 THEN
    INSERT INTO chat_events (conversation_id, channel, event_type, event_data)
    SELECT id, 'website', 'session_handover',
           jsonb_build_object(
             'session_id', p_session_id,
             'user_id', p_user_id::text,
             'conversations_linked', updated_count
           )
    FROM chat_conversations
    WHERE session_id = p_session_id AND user_id = p_user_id;
  END IF;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 코멘트
-- =============================================

COMMENT ON TABLE chat_conversations IS 'NEURALTWIN 듀얼 챗봇 대화 세션 (웹사이트 + OS 통합)';
COMMENT ON TABLE chat_messages IS '챗봇 대화 메시지';
COMMENT ON TABLE chat_leads IS '웹사이트 챗봇 리드 캡처';
COMMENT ON TABLE chat_events IS '챗봇 이벤트 로그 (분석용)';
COMMENT ON TABLE chat_daily_analytics IS '챗봇 일별 분석 집계';
COMMENT ON TABLE assistant_command_cache IS 'OS 챗봇 명령어 캐시';
COMMENT ON FUNCTION handover_chat_session IS 'v2.1: 비회원→로그인 전환 시 대화 세션 인계';
