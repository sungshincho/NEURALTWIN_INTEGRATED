-- ================================================================
-- NEURALTWIN 챗봇 통합 DB 스키마
-- 마이그레이션: create_chat_tables
-- 작성일: 2026-02-05
-- 상태: Phase 1에서 신규 생성
-- ================================================================

-- ENUM
CREATE TYPE chat_channel AS ENUM ('website', 'os_app');

-- 테이블 1: chat_conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  store_id UUID REFERENCES stores(id),
  title TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  channel_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  CONSTRAINT valid_identifier CHECK (
    (channel = 'website' AND session_id IS NOT NULL) OR
    (channel = 'os_app' AND user_id IS NOT NULL)
  )
);

-- 테이블 2: chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  channel_data JSONB DEFAULT '{}',
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative')),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 3: chat_leads (웹사이트 전용, 추후 활용)
CREATE TABLE chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  pain_points JSONB DEFAULT '[]',
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 4: chat_daily_analytics (추후 활용)
CREATE TABLE chat_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_turns_per_session NUMERIC(4,1) DEFAULT 0,
  top_topics JSONB DEFAULT '[]',
  top_pain_points JSONB DEFAULT '[]',
  top_intents JSONB DEFAULT '[]',
  lead_conversion_rate NUMERIC(4,2),
  satisfaction_avg NUMERIC(3,1),
  UNIQUE(date, channel)
);

-- 테이블 5: assistant_command_cache (OS 전용, 추후 활용)
CREATE TABLE assistant_command_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  input_pattern TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  intent TEXT NOT NULL,
  parameters JSONB,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(store_id, input_hash)
);

-- ================================================================
-- 인덱스
-- ================================================================

CREATE INDEX idx_conv_channel ON chat_conversations(channel, created_at DESC);
CREATE INDEX idx_conv_user ON chat_conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conv_session ON chat_conversations(session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_msg_channel_data ON chat_messages USING gin(channel_data);
CREATE INDEX idx_leads_email ON chat_leads(email);
CREATE INDEX idx_cache_lookup ON assistant_command_cache(store_id, input_hash);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- OS: 본인 대화만 조회/생성
CREATE POLICY "os_users_own_conversations" ON chat_conversations
  FOR SELECT USING (channel = 'os_app' AND auth.uid() = user_id);
CREATE POLICY "os_users_insert_conversations" ON chat_conversations
  FOR INSERT WITH CHECK (channel = 'os_app' AND auth.uid() = user_id);

-- Website: service_role 접근
CREATE POLICY "website_service_access" ON chat_conversations
  FOR ALL USING (channel = 'website')
  WITH CHECK (channel = 'website');

-- 메시지: 대화 소유자만
CREATE POLICY "messages_via_conversation" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );
CREATE POLICY "messages_insert_via_conversation" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );
