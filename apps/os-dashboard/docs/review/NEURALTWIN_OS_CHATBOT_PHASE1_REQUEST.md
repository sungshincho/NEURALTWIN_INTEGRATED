# NEURALTWIN OS 챗봇 — Phase 1 기능 개발 요청서

> **버전**: v1.2 (DB 스키마 v2.0 반영)
> **작성일**: 2026-02-05
> **원본 문서**: `NEURALTWIN_OS_CHATBOT_FEATURE_REQUEST.md`
> **분할 근거**: 검토 결과 보고서 `NEURALTWIN_OS_CHATBOT_REVIEW_RESULT.md`
> **패치 반영**: `OS_CHATBOT_PATCH_DECISIONS.md` (탭 설정 방식, 에러 핸들링, isLoading 상태)
> **DB 상태**: ⚠️ 웹사이트 챗봇 팀에서 마이그레이션 완료 — 테이블 존재 확인만 필요

---

## 0. 사전 결정 사항 (패치 반영)

### 0.1 탭 설정 방식 — URL 쿼리 파라미터 채택

```typescript
// ActionDispatcher에서 탭 전환 시
navigate('/insights?tab=customer');
navigate('/studio?tab=ai-simulation');
```

- Settings 페이지에서 이미 사용 중인 패턴과 일관성 유지
- Phase 2-C에서 InsightHubPage, DigitalTwinStudioPage에 `useSearchParams` 코드 4줄 추가 예정

### 0.2 에러 핸들링 — Phase 1에서 errorTypes.ts 선행 생성

- 7개 에러 코드 + 재시도 정책 사전 정의
- Phase 2~3에서 각 모듈에서 이 정의 참조

### 0.3 isLoading 상태 — isLoading + isStreaming 분리

- `isLoading`: EF 호출 시작 ~ 첫 응답 도착 전
- `isStreaming`: 첫 응답 도착 ~ 스트리밍 완료
- 둘 중 하나라도 true이면 입력창 비활성화

---

## 1. Phase 1 목표

**DB 존재 확인 + Edge Function 기본 구조 + 공유 유틸리티** 구축

이 Phase가 완료되면:
- 챗봇 전용 DB 테이블 6개 존재 확인됨 (웹사이트 팀에서 이미 마이그레이션 완료)
- `neuraltwin-assistant` Edge Function이 인증 + CORS + 세션 관리까지 동작함
- 후속 Phase에서 사용할 공유 유틸리티가 준비됨 (chatLogger, chatEventLogger, streamingResponse, rateLimiter)

---

## 2. 제약조건 (원본 그대로 유지)

### 2.1 절대 금지 사항

```
❌ 기존 Edge Function 코드 수정
❌ 기존 DB 테이블 구조 수정
❌ 기존 프론트엔드 컴포넌트 코드 수정
❌ 기존 훅 코드 수정
```

### 2.2 허용 사항

```
✅ neuraltwin-assistant Edge Function 1개 신규 생성
✅ 통합 DB 스키마 6개 테이블 활용 (웹사이트 팀에서 이미 생성 완료)
✅ supabase/functions/_shared/ 에 챗봇 전용 공유 유틸 추가
```

---

## 3. 구현 범위

### 3.1 DB 존재 확인 (마이그레이션 불필요)

```
⚠️ 중요: 웹사이트 챗봇 팀에서 이미 마이그레이션을 완료했습니다.
⚠️ 마이그레이션 파일 생성/실행 불필요 — 테이블 존재 확인만 수행하세요.
```

**확인할 테이블 (6개):**

| 테이블 | 상태 | Phase 1 역할 |
|:---|:---|:---|
| `chat_conversations` | ✅ 이미 존재 | 대화 세션 저장 |
| `chat_messages` | ✅ 이미 존재 | 개별 메시지 저장 |
| `chat_events` | ✅ 이미 존재 | 이벤트 로그 (handover, context_bridge 등) |
| `chat_leads` | ✅ 이미 존재 | OS에서 미사용 (웹사이트 전용) |
| `chat_daily_analytics` | ✅ 이미 존재 | OS 초기 버전 미사용 |
| `assistant_command_cache` | ✅ 이미 존재 | OS 초기 버전 미사용 |

**확인할 함수:**

| 함수 | 상태 | 용도 |
|:---|:---|:---|
| `handover_chat_session(p_session_id, p_new_user_id)` | ✅ 이미 존재 | 웹사이트 → OS 세션 인계 |

**스키마 상세:**
- `NEURALTWIN_CHATBOT_DB_SCHEMA.md` (v2.0) 참조
- ENUM, 테이블, 인덱스, RLS 정책, handover 함수 모두 포함됨

### 3.2 공유 유틸리티 (4개 파일)

**파일 생성 위치:**
```
supabase/functions/_shared/
├── chatLogger.ts           # 신규 (대화/메시지 CRUD)
├── chatEventLogger.ts      # 신규 (chat_events 테이블 CRUD)
├── streamingResponse.ts    # 신규 (SSE 스트리밍)
└── rateLimiter.ts          # 신규 (분당 요청 제한)
```

#### 3.2.1 chatLogger.ts

```typescript
/**
 * 챗봇 대화 로깅 유틸리티
 * - 대화 세션 생성/조회
 * - 메시지 저장/조회
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

export interface ConversationCreateInput {
  channel: 'website' | 'os_app';
  user_id?: string;
  session_id?: string;
  store_id?: string;
  channel_metadata?: Record<string, any>;
}

export interface MessageCreateInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  tokens_used?: number;
  execution_time_ms?: number;
  channel_data?: Record<string, any>;
}

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

export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<any | null> {
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
}

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

  // message_count 증가
  await supabase
    .from('chat_conversations')
    .update({
      message_count: supabase.rpc('increment_message_count', { conv_id: input.conversation_id }),
      updated_at: new Date().toISOString()
    })
    .eq('id', input.conversation_id);

  return data;
}

export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 50
): Promise<any[]> {
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
  return data || [];
}
```

#### 3.2.2 chatEventLogger.ts (신규 — chat_events 테이블 활용)

```typescript
/**
 * 챗봇 이벤트 로깅 유틸리티
 * - chat_events 테이블에 이벤트 기록
 * - handover, context_bridge, session_start 등 추적
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

export type ChatEventType =
  | 'session_start'
  | 'session_end'
  | 'handover_initiated'
  | 'handover_completed'
  | 'context_bridge_load'
  | 'context_bridge_ref'
  | 'lead_captured'
  | 'error_occurred';

export interface EventCreateInput {
  conversation_id: string;
  event_type: ChatEventType;
  event_data?: Record<string, any>;
}

/**
 * 이벤트 기록
 */
export async function createEvent(
  supabase: SupabaseClient,
  input: EventCreateInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('chat_events')
    .insert({
      conversation_id: input.conversation_id,
      event_type: input.event_type,
      event_data: input.event_data || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[chatEventLogger] createEvent error:', error);
    return null;
  }
  return data;
}

/**
 * 대화의 이벤트 이력 조회
 */
export async function getConversationEvents(
  supabase: SupabaseClient,
  conversationId: string,
  eventType?: ChatEventType
): Promise<any[]> {
  let query = supabase
    .from('chat_events')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[chatEventLogger] getConversationEvents error:', error);
    return [];
  }
  return data || [];
}

/**
 * 세션 시작 이벤트 기록 헬퍼
 */
export async function logSessionStart(
  supabase: SupabaseClient,
  conversationId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createEvent(supabase, {
    conversation_id: conversationId,
    event_type: 'session_start',
    event_data: metadata,
  });
}

/**
 * Context Bridge 로드 이벤트 기록 헬퍼
 */
export async function logContextBridgeLoad(
  supabase: SupabaseClient,
  conversationId: string,
  sourceChannel: string,
  loadedCount: number
): Promise<void> {
  await createEvent(supabase, {
    conversation_id: conversationId,
    event_type: 'context_bridge_load',
    event_data: {
      source_channel: sourceChannel,
      loaded_conversations: loadedCount,
    },
  });
}
```

#### 3.2.4 streamingResponse.ts

```typescript
/**
 * SSE 스트리밍 응답 유틸리티
 */

export function createSSEResponse(headers: Record<string, string> = {}): {
  response: Response;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
} {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers,
    },
  });

  return { response, writer, encoder };
}

export async function sendSSEEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: any
): Promise<void> {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

export async function sendSSEData(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  data: any
): Promise<void> {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

export async function closeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  await writer.close();
}
```

#### 3.2.5 rateLimiter.ts

```typescript
/**
 * Rate Limiting 유틸리티
 * - 사용자별 분당 요청 수 제한
 * - 메모리 기반 (Edge Function 인스턴스 내)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 30;  // 분당 30회
const WINDOW_MS = 60 * 1000;  // 1분

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  userId: string,
  limit: number = DEFAULT_LIMIT
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${userId}`;

  let entry = rateLimitMap.get(key);

  // 새 윈도우 시작 또는 기존 윈도우 만료
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    rateLimitMap.set(key, entry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
    };
  }

  // 기존 윈도우 내 요청
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// 주기적 정리 (메모리 누수 방지)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}
```

### 3.3 neuraltwin-assistant Edge Function 기본 구조

**파일 생성 위치:**
```
supabase/functions/neuraltwin-assistant/
├── index.ts
└── utils/
    ├── session.ts
    └── errorTypes.ts
```

#### 3.3.1 index.ts

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { checkRateLimit, cleanupExpiredEntries } from '../_shared/rateLimiter.ts';
import { createConversation, getConversation, saveMessage, getConversationMessages } from '../_shared/chatLogger.ts';
import { logSessionStart } from '../_shared/chatEventLogger.ts';
import { getOrCreateSession } from './utils/session.ts';
import { createErrorResponse } from './utils/errorTypes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 요청 인터페이스
interface OSAssistantRequest {
  message: string;
  conversationId?: string;
  context: {
    page: {
      current: string;
      tab?: string;
    };
    dateRange?: {
      preset: string;
      startDate: string;
      endDate: string;
    };
    store: {
      id: string;
      name: string;
    };
  };
}

// 응답 인터페이스
interface OSAssistantResponse {
  message: string;
  actions?: any[];
  suggestions?: string[];
  meta: {
    conversationId: string;
    intent: string;
    confidence: number;
    executionTimeMs: number;
  };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('AUTH_EXPIRED', corsHeaders);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return createErrorResponse('AUTH_EXPIRED', corsHeaders);
    }

    // 3. Rate Limiting
    const rateLimitResult = checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return createErrorResponse('RATE_LIMITED', corsHeaders);
    }

    // 4. 요청 파싱
    const body: OSAssistantRequest = await req.json();
    const { message, conversationId, context } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: '메시지를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 대화 세션 관리
    const session = await getOrCreateSession(supabase, {
      conversationId,
      userId: user.id,
      storeId: context.store.id,
      initialContext: context,
    });

    if (!session) {
      return createErrorResponse('SESSION_ERROR', corsHeaders);
    }

    // 5-1. 새 세션이면 session_start 이벤트 기록
    if (session.isNew) {
      await logSessionStart(supabase, session.conversationId, {
        page: context.page,
        store_id: context.store.id,
      });
    }

    // 6. 사용자 메시지 저장
    await saveMessage(supabase, {
      conversation_id: session.conversationId,
      role: 'user',
      content: message,
      channel_data: {
        page: context.page,
        dateRange: context.dateRange,
      },
    });

    // 7. TODO: 인텐트 분류 (Phase 2에서 구현)
    const intent = 'general_chat';  // 임시
    const confidence = 0.5;

    // 8. TODO: 액션 실행 (Phase 2, 3에서 구현)
    const actions: any[] = [];

    // 9. TODO: 응답 생성 (Phase 3에서 구현)
    const assistantMessage = `[Phase 1 테스트] 메시지를 받았습니다: "${message}"`;
    const suggestions = ['인사이트 허브로 이동', '오늘 매출 조회', '시뮬레이션 실행'];

    // 10. 어시스턴트 메시지 저장
    await saveMessage(supabase, {
      conversation_id: session.conversationId,
      role: 'assistant',
      content: assistantMessage,
      channel_data: {
        intent,
        confidence,
        actions,
        suggestions,
      },
    });

    // 11. 응답 반환
    const executionTimeMs = Date.now() - startTime;

    const response: OSAssistantResponse = {
      message: assistantMessage,
      actions,
      suggestions,
      meta: {
        conversationId: session.conversationId,
        intent,
        confidence,
        executionTimeMs,
      },
    };

    // 주기적 정리 (10% 확률로 실행)
    if (Math.random() < 0.1) {
      cleanupExpiredEntries();
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[neuraltwin-assistant] Error:', error);
    return createErrorResponse('INTERNAL_ERROR', corsHeaders);
  }
});
```

#### 3.3.2 utils/session.ts

```typescript
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
```

#### 3.3.3 utils/errorTypes.ts

```typescript
/**
 * 챗봇 에러 타입 정의 (패치 문서 반영)
 * - 7개 에러 코드 + 재시도 정책
 * - Phase 2~3에서 각 모듈에서 참조
 */

export type AssistantErrorCode =
  | 'AI_TIMEOUT'
  | 'RATE_LIMITED'
  | 'AUTH_EXPIRED'
  | 'NETWORK_ERROR'
  | 'INTENT_UNCLEAR'
  | 'EF_FAILED'
  | 'DB_QUERY_FAILED'
  | 'SESSION_ERROR'
  | 'INTERNAL_ERROR';

export interface AssistantError {
  code: AssistantErrorCode;
  userMessage: string;
  retryable: boolean;
  retryAfterMs?: number;
  httpStatus: number;
}

export const ERROR_DEFINITIONS: Record<AssistantErrorCode, AssistantError> = {
  AI_TIMEOUT: {
    code: 'AI_TIMEOUT',
    userMessage: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
    retryAfterMs: 2000,
    httpStatus: 504,
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryable: false,
    httpStatus: 429,
  },
  AUTH_EXPIRED: {
    code: 'AUTH_EXPIRED',
    userMessage: '세션이 만료되었습니다. 새로고침 후 다시 시도해주세요.',
    retryable: false,
    httpStatus: 401,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage: '네트워크 연결을 확인해주세요.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 503,
  },
  INTENT_UNCLEAR: {
    code: 'INTENT_UNCLEAR',
    userMessage: '', // 에러 아님, general_chat 폴백
    retryable: false,
    httpStatus: 200,
  },
  EF_FAILED: {
    code: 'EF_FAILED',
    userMessage: '기능 실행 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
    retryAfterMs: 2000,
    httpStatus: 502,
  },
  DB_QUERY_FAILED: {
    code: 'DB_QUERY_FAILED',
    userMessage: '데이터 조회 중 문제가 발생했어요.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 500,
  },
  SESSION_ERROR: {
    code: 'SESSION_ERROR',
    userMessage: '대화 세션을 생성할 수 없습니다.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 500,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    userMessage: '내부 오류가 발생했습니다.',
    retryable: false,
    httpStatus: 500,
  },
};

/**
 * 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  code: AssistantErrorCode,
  corsHeaders: Record<string, string>
): Response {
  const errorDef = ERROR_DEFINITIONS[code];
  return new Response(
    JSON.stringify({
      error: errorDef.userMessage,
      code: errorDef.code,
      retryable: errorDef.retryable,
      retryAfterMs: errorDef.retryAfterMs,
    }),
    {
      status: errorDef.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * 에러 응답을 어시스턴트 메시지 형태로 변환 (채팅창에 표시용)
 */
export function getErrorAsAssistantMessage(code: AssistantErrorCode): string {
  return ERROR_DEFINITIONS[code].userMessage;
}
```

---

## 4. 완료 체크리스트

### DB 존재 확인 (마이그레이션 불필요)
- [ ] `chat_channel` ENUM 타입 존재 확인
- [ ] `chat_conversations` 테이블 존재 확인
- [ ] `chat_messages` 테이블 존재 확인
- [ ] `chat_events` 테이블 존재 확인
- [ ] `chat_leads` 테이블 존재 확인
- [ ] `chat_daily_analytics` 테이블 존재 확인
- [ ] `assistant_command_cache` 테이블 존재 확인
- [ ] `handover_chat_session()` 함수 존재 확인
- [ ] 인덱스 10개 존재 확인
- [ ] RLS 정책 10개 존재 확인

### 공유 유틸리티
- [ ] `_shared/chatLogger.ts` 생성
- [ ] `_shared/chatEventLogger.ts` 생성 (chat_events 테이블 활용)
- [ ] `_shared/streamingResponse.ts` 생성
- [ ] `_shared/rateLimiter.ts` 생성

### Edge Function
- [ ] `neuraltwin-assistant/index.ts` 생성
- [ ] `neuraltwin-assistant/utils/session.ts` 생성
- [ ] `neuraltwin-assistant/utils/errorTypes.ts` 생성
- [ ] 로컬에서 Edge Function 실행 테스트
- [ ] CORS preflight 응답 확인
- [ ] 인증 실패 시 401 응답 확인
- [ ] Rate Limit 초과 시 429 응답 확인
- [ ] 정상 요청 시 200 응답 + 세션 생성 확인

---

## 5. 테스트 시나리오

### 5.1 DB 존재 확인 테스트

```bash
# 로컬 Supabase 시작 (이미 마이그레이션 완료된 상태)
supabase start

# 테이블 존재 확인 (6개 테이블)
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'chat_%' ORDER BY table_name;"

# 예상 결과:
# assistant_command_cache
# chat_conversations
# chat_daily_analytics
# chat_events
# chat_leads
# chat_messages

# handover 함수 존재 확인
supabase db execute "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'handover_chat_session';"
```

### 5.2 Edge Function 테스트

```bash
# Edge Function 로컬 실행
supabase functions serve neuraltwin-assistant --no-verify-jwt

# 테스트 요청 (인증 없이 - 401 예상)
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕"}'

# 테스트 요청 (인증 있음 - 200 예상)
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "안녕",
    "context": {
      "page": { "current": "insights", "tab": "overview" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'
```

---

## 6. 다음 Phase 예고

**Phase 2-A**: 인텐트 분류 + 페이지 네비게이션
- `intent/patterns.ts` — navigate 패턴
- `intent/classifier.ts` — 패턴 매칭 분류기
- `actions/navigationActions.ts` — navigate 액션

---

**Phase 1 요청서 끝**