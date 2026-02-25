# NEURALTWIN 챗봇 통합 DB 스키마

> **버전**: v2.0 (웹사이트 팀 v2.1 스키마 반영 + OS 확장)
> **작성일**: 2026-02-05
> **상태**: Phase 1에서 생성 예정 (아직 프로젝트에 존재하지 않음)
> **적용 시점**: Phase 1 마이그레이션 실행 시
> **기반**: 웹사이트 챗봇 팀 DB 스키마 v2.1

---

## 1. 이 문서의 목적

**OS 챗봇 Phase 1 개발 시 신규 생성할 DB 스키마**를 정의한 문서이다.
웹사이트 챗봇 팀의 v2.1 스키마를 기반으로 하되, OS 챗봇에서 필요한 추가 사항을 포함한다.

### 중요 안내

```
⚠️ 이 문서에 정의된 테이블들은 아직 프로젝트 DB에 존재하지 않습니다.
⚠️ Phase 1 개발 세션에서 마이그레이션을 실행하면 생성됩니다.
⚠️ "사용 예정", "활용 예정" 등의 표현은 구현 계획을 의미합니다.
```

### v2.0 주요 변경사항 (v1.1 대비)

| 변경 항목 | v1.1 | v2.0 | 변경 이유 |
|:---|:---|:---|:---|
| CONSTRAINT | 웹사이트: `session_id` 필수 | 웹사이트: `session_id OR user_id` | 로그인 후 세션 인계 지원 |
| `chat_events` 테이블 | 없음 | 🆕 추가 | 이벤트 로깅 (handover, context_bridge 등) |
| `handover_chat_session()` | 없음 | 🆕 추가 | 웹사이트 → OS 세션 인계 함수 |
| `idx_conv_user_channel` | 없음 | 🆕 추가 | Context Bridge 쿼리 최적화 |
| RLS 정책 | 암묵적 service_role | 명시적 `auth.jwt()` 체크 | 보안 강화 |

### 테이블 생성 및 활용 계획

| 테이블 | Phase 1에서 | OS 챗봇 초기 버전 | 웹사이트 챗봇 (추후) |
|:---|:---|:---|:---|
| `chat_conversations` | 🆕 **생성** | ✅ 활용 예정 (`channel = 'os_app'`) | 🔜 `channel = 'website'`로 활용 예정 |
| `chat_messages` | 🆕 **생성** | ✅ 활용 예정 | 🔜 활용 예정 |
| `chat_events` | 🆕 **생성** | ✅ 활용 예정 (handover 이벤트) | 🔜 활용 예정 |
| `chat_leads` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | 🔜 **웹사이트 전용** — 리드 캡처 |
| `chat_daily_analytics` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | 🔜 양쪽 모두 활용 예정 |
| `assistant_command_cache` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | ❌ **OS 전용** |

---

## 2. 시나리오 흐름 호환성

이 스키마는 4가지 주요 시나리오 흐름을 모두 지원한다.

### 시나리오 흐름 요약

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         시나리오별 DB 흐름                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ① 웹사이트 비인증 → 신규 대화                                                 │
│     INSERT conversations (channel='website', session_id=xxx, user_id=NULL)    │
│                                                                               │
│  ② 웹사이트 비인증 → 로그인 후 OS 이동 (Context Bridge)                        │
│     OS에서 SELECT * FROM conversations WHERE user_id=auth.uid() 실행          │
│     → 웹사이트에서 handover된 대화 포함하여 조회                                │
│                                                                               │
│  ③ 웹사이트 대화 중 → 로그인 → 세션 인계 (Handover)                            │
│     handover_chat_session(old_session_id, new_user_id) 함수 호출              │
│     → conversations.user_id 업데이트 + chat_events에 handover 기록            │
│                                                                               │
│  ④ OS 기존 사용자 → 웹사이트 재방문                                            │
│     웹사이트 챗봇이 user의 이전 대화 참조 (channel_metadata에 저장)             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 시나리오별 RLS 정책 매핑

| 시나리오 | 호출 주체 | RLS 정책 | 비고 |
|:---|:---|:---|:---|
| ① 웹사이트 비인증 | website EF (service_role) | `website_service_conversations` | service_role 우회 |
| ② Context Bridge | OS 챗봇 (인증된 user) | `users_own_conversations` | user_id 기반 조회 |
| ③ Handover | website EF (service_role) | `website_service_conversations` | user_id 업데이트 |
| ④ OS→웹사이트 참조 | website EF (service_role) | `website_service_conversations` | 메타데이터 참조 |

---

## 3. 스키마 전체 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│             NEURALTWIN 챗봇 통합 스키마 v2.0 (Phase 1에서 생성)               │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │ chat_conversations  │────→│   chat_messages       │                       │
│  │ (대화방)             │ 1:N │   (개별 메시지)        │                       │
│  │                     │     │                      │                       │
│  │ channel: 'website'  │     │ channel_data: JSONB  │                       │
│  │        | 'os_app'   │     │ (채널별 확장 데이터)   │                       │
│  └─────────┬───────────┘     └──────────────────────┘                       │
│            │                                                                │
│            │ 1:N                                                            │
│            ▼                                                                │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │ chat_leads          │     │ chat_events (🆕 v2.0) │                       │
│  │ (웹사이트 전용 리드)  │     │ (이벤트 로그)         │                       │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐             │
│  │ chat_daily_analytics    │  │ assistant_command_cache       │             │
│  │ (일별 집계, 추후 활용)   │  │ (OS 전용, 추후 활용)          │             │
│  └─────────────────────────┘  └──────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. ENUM 타입

```sql
-- 채널 구분 ENUM (Phase 1에서 생성)
-- 웹사이트 챗봇은 'website', OS 챗봇은 'os_app' 사용
CREATE TYPE chat_channel AS ENUM ('website', 'os_app');
```

---

## 5. 테이블 상세

### 5.1 chat_conversations (대화 세션)

대화방 1개 = 레코드 1개. 사용자가 챗봇을 열고 대화를 시작하면 생성된다.

**Phase 1에서 생성, OS 챗봇 초기 버전에서 활용**

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,

  -- 식별자: 채널별 요구사항이 다름
  -- 웹사이트: session_id 또는 user_id (로그인 시 user_id 할당됨)
  -- OS: user_id 필수
  user_id UUID REFERENCES auth.users(id),          -- OS 필수, 웹사이트는 로그인 시 할당
  session_id TEXT,                                   -- 웹사이트 전용 (브라우저 세션)
  store_id UUID REFERENCES stores(id),              -- OS 전용 (nullable)

  -- 공통 필드
  title TEXT,                                        -- 대화 제목 (자동 생성 가능)
  message_count INTEGER DEFAULT 0,                   -- 총 메시지 수
  total_tokens_used INTEGER DEFAULT 0,               -- 총 토큰 사용량
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),

  -- 채널별 메타데이터 (JSONB — 채널마다 다른 데이터를 유연하게 저장)
  channel_metadata JSONB DEFAULT '{}',
  -- [website 활용 시]: { utm_source, referrer, user_agent, lead_captured, lead_email, lead_company, previous_os_context }
  -- [os_app 활용 시]:  { initial_context, panel_position, detail_level, inherited_from_website }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,

  -- v2.0 제약조건: 웹사이트는 session_id 또는 user_id 허용 (로그인 전/후 모두 지원)
  -- OS는 user_id 필수
  CONSTRAINT chat_conversations_channel_check CHECK (
    (channel = 'website' AND (session_id IS NOT NULL OR user_id IS NOT NULL))
    OR
    (channel = 'os_app' AND user_id IS NOT NULL)
  )
);
```

**v2.0 CONSTRAINT 변경 핵심:**

```
v1.1: (channel = 'website' AND session_id IS NOT NULL)
v2.0: (channel = 'website' AND (session_id IS NOT NULL OR user_id IS NOT NULL))
```

이 변경으로 **시나리오 ③ (Handover)** 지원:
- 비인증 상태: `session_id` 사용
- 로그인 후: `user_id` 할당됨 (세션 인계)
- 둘 중 하나만 있으면 유효

**채널별 활용 방식 차이:**

| 필드 | 웹사이트 챗봇 | OS 챗봇 |
|:---|:---|:---|
| `user_id` | NULL → 로그인 시 할당 | ✅ 인증된 사용자 ID (필수) |
| `session_id` | ✅ 브라우저 세션 ID | NULL |
| `store_id` | NULL | ✅ 선택된 매장 ID |
| `channel_metadata` | UTM, referrer, user_agent, previous_os_context | 초기 컨텍스트, inherited_from_website |

---

### 5.2 chat_messages (메시지)

대화방 내 개별 메시지. 사용자/어시스턴트/시스템 메시지 모두 저장.

**Phase 1에서 생성, OS 챗봇 초기 버전에서 활용**

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- 공통 AI 메타데이터
  model_used TEXT,               -- 'claude-sonnet-4' 또는 'gemini-2.5-flash'
  tokens_used INTEGER,
  execution_time_ms INTEGER,

  -- 채널별 확장 데이터 (JSONB — 채널마다 다른 구조)
  channel_data JSONB DEFAULT '{}',
  -- [website 활용 시]: {
  --   topic_category,          -- 12개 리테일 토픽 카테고리
  --   sub_category,
  --   sentiment,               -- 'positive' | 'neutral' | 'negative'
  --   pain_point_summary,      -- 추출된 Pain Point
  --   contains_pain_point,     -- boolean
  --   solution_mentioned,      -- boolean (뉴럴트윈 솔루션 언급 여부)
  --   user_engagement          -- 'high' | 'medium' | 'low'
  -- }
  -- [os_app 활용 시]: {
  --   intent,                  -- 분류된 인텐트
  --   confidence,              -- 분류 신뢰도
  --   sub_intent,
  --   actions,                 -- 실행된 UIAction 배열
  --   data,                    -- 조회/실행 결과 데이터
  --   suggestions              -- 후속 제안 목록
  -- }

  -- 공통 피드백
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative')),
  feedback_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5.3 chat_events (🆕 v2.0 — 이벤트 로그)

채널 간 세션 이동, 핸드오버, Context Bridge 활용 등 주요 이벤트를 기록한다.

**Phase 1에서 생성, 시나리오 ②③④ 추적에 활용**

```sql
CREATE TABLE chat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- 이벤트 타입 예시:
  -- 'session_start'         : 대화 시작
  -- 'handover_initiated'    : 웹사이트 → OS 핸드오버 시작
  -- 'handover_completed'    : 핸드오버 완료 (user_id 할당)
  -- 'context_bridge_load'   : OS에서 웹사이트 대화 이력 로드
  -- 'context_bridge_ref'    : 웹사이트에서 OS 대화 참조
  -- 'lead_captured'         : 리드 정보 수집됨
  -- 'session_end'           : 대화 종료

  event_data JSONB DEFAULT '{}',
  -- 이벤트별 추가 데이터:
  -- handover: { old_session_id, new_user_id }
  -- context_bridge_load: { source_channel, conversation_count }
  -- lead_captured: { email, company }

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**활용 예시:**

```sql
-- 시나리오 ③: Handover 이벤트 기록
INSERT INTO chat_events (conversation_id, event_type, event_data)
VALUES (
  'conv-uuid',
  'handover_completed',
  '{"old_session_id": "sess_abc123", "new_user_id": "user_xyz789"}'
);

-- 시나리오 ②: Context Bridge 로드 이벤트 기록
INSERT INTO chat_events (conversation_id, event_type, event_data)
VALUES (
  'new-os-conv-uuid',
  'context_bridge_load',
  '{"source_channel": "website", "loaded_conversations": 3}'
);
```

---

### 5.4 chat_leads (웹사이트 전용 — 리드 캡처)

웹사이트 챗봇에서 수집한 리드(잠재 고객) 정보.

**Phase 1에서 구조만 생성, OS 챗봇에서는 미사용, 웹사이트 챗봇 개발 시 활용**

```sql
CREATE TABLE chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  pain_points JSONB DEFAULT '[]',           -- 추출된 Pain Point 목록
  source_page TEXT,                          -- 리드 발생 시 웹 페이지
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Context Bridge 연동 포인트 (추후 구현):**
- 웹사이트에서 수집된 리드의 `email`이 OS 계정 가입 `email`과 매칭되면, OS 챗봇이 해당 사용자의 Pain Point를 조회하여 선제적 제안 가능

---

### 5.5 chat_daily_analytics (일별 분석 집계)

양 채널의 일별 사용 통계를 자동 집계. Cron Job 또는 트리거로 생성.

**Phase 1에서 구조만 생성, 추후 Phase에서 집계 로직 구현**

```sql
CREATE TABLE chat_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_turns_per_session NUMERIC(4,1) DEFAULT 0,
  top_topics JSONB DEFAULT '[]',
  top_pain_points JSONB DEFAULT '[]',        -- 웹사이트용
  top_intents JSONB DEFAULT '[]',            -- OS용
  lead_conversion_rate NUMERIC(4,2),         -- 웹사이트용
  satisfaction_avg NUMERIC(3,1),
  UNIQUE(date, channel)                      -- 날짜+채널 조합 유니크
);
```

---

### 5.6 assistant_command_cache (OS 전용 — 명령어 캐시)

OS 챗봇에서 반복되는 명령 패턴을 캐싱하여 응답 속도 향상.

**Phase 1에서 구조만 생성, 추후 Phase에서 캐싱 로직 구현**

```sql
CREATE TABLE assistant_command_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  input_pattern TEXT NOT NULL,               -- 입력 패턴 (정규화된 텍스트)
  input_hash TEXT NOT NULL,                  -- 입력 해시 (빠른 조회용)
  intent TEXT NOT NULL,                      -- 분류된 인텐트
  parameters JSONB,                          -- 추출된 파라미터
  usage_count INTEGER DEFAULT 1,             -- 사용 횟수
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                    -- 캐시 만료 시점
  UNIQUE(store_id, input_hash)               -- 매장+해시 조합 유니크
);
```

---

## 6. 함수 (🆕 v2.0)

### 6.1 handover_chat_session() — 세션 인계 함수

웹사이트에서 대화 중이던 사용자가 로그인하면, 해당 세션을 인증된 사용자에게 인계한다.

**시나리오 ③ 지원**

```sql
CREATE OR REPLACE FUNCTION handover_chat_session(
  p_session_id TEXT,
  p_new_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- 1. 해당 session_id의 웹사이트 대화 찾기
  SELECT id INTO v_conversation_id
  FROM chat_conversations
  WHERE session_id = p_session_id
    AND channel = 'website'
    AND user_id IS NULL  -- 아직 인계되지 않은 대화만
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RETURN NULL; -- 인계할 대화 없음
  END IF;

  -- 2. user_id 할당 (세션 인계)
  UPDATE chat_conversations
  SET user_id = p_new_user_id,
      updated_at = NOW(),
      channel_metadata = channel_metadata ||
        jsonb_build_object('handover_at', NOW(), 'original_session_id', p_session_id)
  WHERE id = v_conversation_id;

  -- 3. 핸드오버 이벤트 기록
  INSERT INTO chat_events (conversation_id, event_type, event_data)
  VALUES (
    v_conversation_id,
    'handover_completed',
    jsonb_build_object(
      'old_session_id', p_session_id,
      'new_user_id', p_new_user_id
    )
  );

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**사용 예시:**

```typescript
// 웹사이트 EF에서 로그인 직후 호출
const { data: handoveredConvId } = await supabase.rpc('handover_chat_session', {
  p_session_id: browserSessionId,
  p_new_user_id: authenticatedUserId
});

if (handoveredConvId) {
  console.log('세션 인계 완료:', handoveredConvId);
}
```

---

## 7. 인덱스

```sql
-- chat_conversations 인덱스
CREATE INDEX idx_conv_channel ON chat_conversations(channel, created_at DESC);
CREATE INDEX idx_conv_user ON chat_conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conv_session ON chat_conversations(session_id, created_at DESC) WHERE session_id IS NOT NULL;

-- 🆕 v2.0: Context Bridge 쿼리 최적화용
-- OS에서 user_id로 모든 채널의 대화를 조회할 때 사용
CREATE INDEX idx_conv_user_channel ON chat_conversations(user_id, channel, created_at DESC) WHERE user_id IS NOT NULL;

-- chat_messages 인덱스
CREATE INDEX idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_msg_channel_data ON chat_messages USING gin(channel_data);

-- chat_events 인덱스 (🆕 v2.0)
CREATE INDEX idx_events_conversation ON chat_events(conversation_id, created_at);
CREATE INDEX idx_events_type ON chat_events(event_type, created_at DESC);

-- chat_leads 인덱스
CREATE INDEX idx_leads_email ON chat_leads(email);

-- assistant_command_cache 인덱스
CREATE INDEX idx_cache_lookup ON assistant_command_cache(store_id, input_hash);
```

**인덱스 설명:**

| 인덱스 | 용도 | 주요 활용 채널 |
|:---|:---|:---|
| `idx_conv_channel` | 채널별 최신 대화 조회 | 양쪽 |
| `idx_conv_user` | 특정 사용자의 대화 목록 | OS |
| `idx_conv_session` | 특정 세션의 대화 조회 | 웹사이트 |
| `idx_conv_user_channel` | **Context Bridge — 사용자의 모든 채널 대화** | OS (시나리오 ②) |
| `idx_msg_conversation` | 대화방 내 메시지 시간순 조회 | 양쪽 |
| `idx_msg_channel_data` | JSONB 내부 필드 검색 (토픽, 인텐트 등) | 양쪽 |
| `idx_events_conversation` | 특정 대화의 이벤트 이력 | 양쪽 |
| `idx_events_type` | 이벤트 타입별 조회 (분석용) | 양쪽 |
| `idx_leads_email` | 이메일로 리드 조회 (Context Bridge) | 웹사이트 → OS |
| `idx_cache_lookup` | 매장별 명령어 캐시 조회 | OS |

---

## 8. RLS (Row Level Security) 정책

```sql
-- RLS 활성화
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- chat_conversations RLS 정책
-- =====================================================

-- 1. 인증된 사용자: 본인 대화 조회 (채널 무관 — Context Bridge 지원)
-- 시나리오 ②④ 지원: OS 사용자가 웹사이트에서 핸드오버된 대화도 조회 가능
CREATE POLICY "users_own_conversations" ON chat_conversations
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 2. 인증된 사용자: OS 채널 대화 생성
CREATE POLICY "users_insert_os_conversations" ON chat_conversations
  FOR INSERT WITH CHECK (
    channel = 'os_app' AND auth.uid() = user_id
  );

-- 3. service_role: 웹사이트 채널 전체 접근 (EF용)
-- 웹사이트 EF는 service_role 키로 호출되므로 이 정책으로 접근
CREATE POLICY "website_service_conversations" ON chat_conversations
  FOR ALL USING (
    channel = 'website' AND auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    channel = 'website' AND auth.jwt() ->> 'role' = 'service_role'
  );

-- 4. service_role: 웹사이트 대화 user_id 업데이트 (Handover용)
CREATE POLICY "website_service_update_user" ON chat_conversations
  FOR UPDATE USING (
    channel = 'website' AND auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    channel = 'website'
  );

-- =====================================================
-- chat_messages RLS 정책
-- =====================================================

-- 1. 인증된 사용자: 본인 대화의 메시지 조회
CREATE POLICY "users_own_messages" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- 2. 인증된 사용자: 본인 대화에 메시지 추가
CREATE POLICY "users_insert_messages" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- 3. service_role: 웹사이트 대화 메시지 전체 접근
CREATE POLICY "website_service_messages" ON chat_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE channel = 'website'
    ) AND auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE channel = 'website'
    ) AND auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- chat_events RLS 정책
-- =====================================================

-- 1. 인증된 사용자: 본인 대화의 이벤트 조회
CREATE POLICY "users_own_events" ON chat_events
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- 2. service_role: 모든 이벤트 접근 (EF용)
CREATE POLICY "service_all_events" ON chat_events
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- chat_leads RLS 정책 (웹사이트 전용)
-- =====================================================

-- service_role만 접근 가능 (웹사이트 EF 전용)
CREATE POLICY "service_leads_access" ON chat_leads
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );
```

**RLS 설계 원칙:**

- **OS 사용자**: Supabase Auth로 인증됨 → `auth.uid()` 기반 접근 제어
- **웹사이트 EF**: `service_role` 키 사용 → `auth.jwt() ->> 'role'` 체크
- **Context Bridge**: OS 사용자가 `user_id` 기반으로 모든 채널 대화 조회 가능
- **Handover**: service_role이 웹사이트 대화의 `user_id` 업데이트 가능

---

## 9. 전체 마이그레이션 SQL

아래 SQL을 Phase 1에서 마이그레이션 파일로 적용한다.

**파일 경로**: `supabase/migrations/20260205000001_create_chat_tables.sql`

```sql
-- ================================================================
-- NEURALTWIN 챗봇 통합 DB 스키마 v2.0
-- 마이그레이션: create_chat_tables
-- 작성일: 2026-02-05
-- 상태: Phase 1에서 신규 생성
-- 기반: 웹사이트 챗봇 팀 v2.1 스키마 + OS 확장
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
  -- v2.0: 웹사이트는 session_id OR user_id 허용
  CONSTRAINT chat_conversations_channel_check CHECK (
    (channel = 'website' AND (session_id IS NOT NULL OR user_id IS NOT NULL))
    OR
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

-- 테이블 3: chat_events (🆕 v2.0)
CREATE TABLE chat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 4: chat_leads (웹사이트 전용, 추후 활용)
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

-- 테이블 5: chat_daily_analytics (추후 활용)
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

-- 테이블 6: assistant_command_cache (OS 전용, 추후 활용)
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
CREATE INDEX idx_conv_user_channel ON chat_conversations(user_id, channel, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_msg_channel_data ON chat_messages USING gin(channel_data);

CREATE INDEX idx_events_conversation ON chat_events(conversation_id, created_at);
CREATE INDEX idx_events_type ON chat_events(event_type, created_at DESC);

CREATE INDEX idx_leads_email ON chat_leads(email);
CREATE INDEX idx_cache_lookup ON assistant_command_cache(store_id, input_hash);

-- ================================================================
-- 함수: handover_chat_session (🆕 v2.0)
-- ================================================================

CREATE OR REPLACE FUNCTION handover_chat_session(
  p_session_id TEXT,
  p_new_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM chat_conversations
  WHERE session_id = p_session_id
    AND channel = 'website'
    AND user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE chat_conversations
  SET user_id = p_new_user_id,
      updated_at = NOW(),
      channel_metadata = channel_metadata ||
        jsonb_build_object('handover_at', NOW(), 'original_session_id', p_session_id)
  WHERE id = v_conversation_id;

  INSERT INTO chat_events (conversation_id, event_type, event_data)
  VALUES (
    v_conversation_id,
    'handover_completed',
    jsonb_build_object('old_session_id', p_session_id, 'new_user_id', p_new_user_id)
  );

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- chat_conversations 정책
CREATE POLICY "users_own_conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_os_conversations" ON chat_conversations
  FOR INSERT WITH CHECK (channel = 'os_app' AND auth.uid() = user_id);

CREATE POLICY "website_service_conversations" ON chat_conversations
  FOR ALL USING (channel = 'website' AND auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (channel = 'website' AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "website_service_update_user" ON chat_conversations
  FOR UPDATE USING (channel = 'website' AND auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (channel = 'website');

-- chat_messages 정책
CREATE POLICY "users_own_messages" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "users_insert_messages" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "website_service_messages" ON chat_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
    AND auth.jwt() ->> 'role' = 'service_role'
  ) WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
    AND auth.jwt() ->> 'role' = 'service_role'
  );

-- chat_events 정책
CREATE POLICY "users_own_events" ON chat_events
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "service_all_events" ON chat_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- chat_leads 정책
CREATE POLICY "service_leads_access" ON chat_leads
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

---

## 10. Phase별 테이블 활용 계획

| Phase | 활용 테이블 | 활용 방식 |
|:---|:---|:---|
| Phase 1 | `chat_conversations`, `chat_messages`, `chat_events` | 세션 생성, 메시지 저장, 이벤트 기록 (기본) |
| Phase 2 | `chat_conversations`, `chat_messages` | 인텐트/액션 메타데이터 저장 |
| Phase 3 | `chat_conversations`, `chat_messages` | AI 응답 저장, 실행 결과 저장 |
| Phase 4 | `chat_conversations`, `chat_messages`, `chat_events` | 대화 히스토리 로드, Context Bridge |
| 추후 | `assistant_command_cache` | 명령어 캐싱으로 응답 속도 향상 |
| 추후 | `chat_daily_analytics` | 일별 사용 통계 자동 집계 |
| 웹사이트 챗봇 | `chat_leads`, `chat_events` | 리드 캡처 및 이벤트 추적 |

---

## 11. 시나리오별 쿼리 예시

### 시나리오 ②: Context Bridge (OS에서 웹사이트 대화 로드)

```typescript
// OS 챗봇에서 사용자의 모든 대화 조회 (웹사이트 포함)
const { data: allConversations } = await supabase
  .from('chat_conversations')
  .select('*, chat_messages(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// 웹사이트에서 핸드오버된 대화만 필터링
const websiteConversations = allConversations?.filter(
  c => c.channel === 'website'
);
```

### 시나리오 ③: Handover

```typescript
// 웹사이트 EF에서 로그인 직후 호출
const { data: handoveredConvId } = await supabase.rpc('handover_chat_session', {
  p_session_id: browserSessionId,
  p_new_user_id: authenticatedUserId
});
```

### 시나리오 ④: 웹사이트에서 OS 대화 참조

```typescript
// 웹사이트 EF (service_role)에서 사용자의 OS 대화 메타데이터 조회
const { data: osConversations } = await supabaseAdmin
  .from('chat_conversations')
  .select('id, title, channel_metadata, created_at')
  .eq('user_id', userId)
  .eq('channel', 'os_app')
  .order('created_at', { ascending: false })
  .limit(5);

// 조회 결과를 channel_metadata에 저장
await supabaseAdmin
  .from('chat_conversations')
  .update({
    channel_metadata: {
      ...existingMetadata,
      previous_os_context: osConversations
    }
  })
  .eq('id', currentWebsiteConvId);
```

---

**DB 스키마 문서 v2.0 끝**
