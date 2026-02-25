# NEURALTWIN OS 챗봇 — Phase 4 기능 개발 요청서

> **버전**: v1.1 (DB 스키마 v2.0 반영)
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 3-A, 3-B, 3-C 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 4 목표

**안정화 — 에러 핸들링 강화 + Rate Limiting + 대화 히스토리 + E2E 테스트**

이 Phase가 완료되면:
- 모든 에러 케이스에 대한 일관된 에러 처리
- Rate Limiting 실제 적용 및 사용자 피드백
- 이전 대화 이어서 진행 가능
- 전체 시나리오 E2E 테스트 완료

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 프론트엔드 컴포넌트 수정
✅ neuraltwin-assistant Edge Function 안정화
✅ 프론트엔드 훅/컨텍스트 안정화
```

---

## 3. 구현 범위

### 3.1 에러 핸들링 강화

#### 3.1.1 에러 핸들러 통합 (errorHandler.ts)

```typescript
/**
 * 통합 에러 핸들러
 * 모든 에러를 일관된 형식으로 처리
 */

import { AssistantErrorCode, ERROR_DEFINITIONS, createErrorResponse } from './errorTypes.ts';

export interface ErrorContext {
  phase: string;
  action: string;
  userId?: string;
  storeId?: string;
  message?: string;
}

/**
 * 에러 로깅 및 추적
 */
export function logError(
  error: Error | unknown,
  context: ErrorContext
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    phase: context.phase,
    action: context.action,
    userId: context.userId,
    storeId: context.storeId,
    message: context.message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
  };

  console.error('[ErrorHandler]', JSON.stringify(errorInfo));
}

/**
 * 에러 코드 판별
 */
export function determineErrorCode(error: Error | unknown): AssistantErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('abort')) {
      return 'AI_TIMEOUT';
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return 'RATE_LIMITED';
    }
    if (message.includes('auth') || message.includes('401') || message.includes('unauthorized')) {
      return 'AUTH_EXPIRED';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('ef_failed') || message.includes('function')) {
      return 'EF_FAILED';
    }
    if (message.includes('query') || message.includes('database') || message.includes('supabase')) {
      return 'DB_QUERY_FAILED';
    }
  }

  return 'INTERNAL_ERROR';
}

/**
 * 재시도 가능 여부 확인
 */
export function isRetryable(errorCode: AssistantErrorCode): boolean {
  return ERROR_DEFINITIONS[errorCode]?.retryable || false;
}

/**
 * 재시도 대기 시간 (ms)
 */
export function getRetryAfter(errorCode: AssistantErrorCode): number {
  return ERROR_DEFINITIONS[errorCode]?.retryAfterMs || 2000;
}
```

#### 3.1.2 index.ts에 에러 핸들링 통합

```typescript
// index.ts 수정

import { logError, determineErrorCode } from './utils/errorHandler.ts';

// try-catch 블록 개선
try {
  // ... 기존 로직 ...

} catch (error) {
  // 에러 로깅
  logError(error, {
    phase: 'main',
    action: 'process_message',
    userId: user?.id,
    storeId: context?.store?.id,
    message: message,
  });

  // 에러 코드 판별
  const errorCode = determineErrorCode(error);

  // 재시도 가능한 에러면 메타데이터에 포함
  const errorDef = ERROR_DEFINITIONS[errorCode];

  return new Response(
    JSON.stringify({
      error: errorDef.userMessage,
      code: errorCode,
      retryable: errorDef.retryable,
      retryAfterMs: errorDef.retryAfterMs,
      meta: {
        conversationId: session?.conversationId,
        executionTimeMs: Date.now() - startTime,
      },
    }),
    {
      status: errorDef.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

### 3.2 Rate Limiting 강화

#### 3.2.1 프론트엔드 Rate Limit 피드백

```typescript
// useAssistantChat.ts 수정

// 에러 응답 처리 개선
if (error?.code === 'RATE_LIMITED') {
  const retryAfter = error.retryAfterMs || 60000;
  const retrySeconds = Math.ceil(retryAfter / 1000);

  setMessages((prev) => prev.map((msg) =>
    msg.id === loadingMessageId
      ? {
          ...msg,
          content: `요청이 너무 많습니다. ${retrySeconds}초 후에 다시 시도해주세요.`,
        }
      : msg
  ));

  // 자동 재시도 비활성화 (사용자가 직접 재시도하도록)
  return;
}
```

#### 3.2.2 Rate Limiter 헤더 추가

```typescript
// rateLimiter.ts 수정

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '30',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
```

### 3.3 대화 히스토리 로드/저장

#### 3.3.1 messageStore.ts 확장

```typescript
/**
 * 메시지 저장소 확장
 * 대화 히스토리 로드/저장
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

/**
 * 사용자의 최근 대화 목록 조회
 */
export async function getRecentConversations(
  supabase: SupabaseClient,
  userId: string,
  storeId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('id, title, message_count, created_at, updated_at')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .eq('channel', 'os_app')
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[messageStore] getRecentConversations error:', error);
    return [];
  }

  return data || [];
}

/**
 * 대화 히스토리 로드 (AI 컨텍스트용)
 */
export async function loadConversationHistory(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 20
): Promise<{ role: string; content: string }[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[messageStore] loadConversationHistory error:', error);
    return [];
  }

  // assistant 메시지의 role을 'assistant'로 매핑
  return (data || []).map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));
}

/**
 * 대화 제목 자동 생성/업데이트
 */
export async function updateConversationTitle(
  supabase: SupabaseClient,
  conversationId: string,
  firstUserMessage: string
): Promise<void> {
  // 첫 번째 사용자 메시지에서 제목 추출 (최대 50자)
  const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : '');

  const { error } = await supabase
    .from('chat_conversations')
    .update({ title })
    .eq('id', conversationId)
    .is('title', null);

  if (error) {
    console.error('[messageStore] updateConversationTitle error:', error);
  }
}

/**
 * 대화 아카이브
 */
export async function archiveConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_conversations')
    .update({ is_archived: true })
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[messageStore] archiveConversation error:', error);
    return false;
  }

  return true;
}
```

#### 3.3.2 프론트엔드 대화 히스토리 UI

```typescript
// useAssistantChat.ts에 추가

// 대화 목록 조회
const [conversations, setConversations] = useState<any[]>([]);

const loadConversations = useCallback(async () => {
  if (!session?.access_token || !selectedStore?.id) return;

  try {
    const { data } = await supabase.functions.invoke('neuraltwin-assistant', {
      body: {
        action: 'list_conversations',
        storeId: selectedStore.id,
      },
    });

    setConversations(data?.conversations || []);
  } catch (error) {
    console.error('[useAssistantChat] loadConversations error:', error);
  }
}, [session, selectedStore]);

// 특정 대화 로드
const loadConversation = useCallback(async (convId: string) => {
  if (!session?.access_token) return;

  setIsLoading(true);

  try {
    const { data } = await supabase.functions.invoke('neuraltwin-assistant', {
      body: {
        action: 'load_conversation',
        conversationId: convId,
      },
    });

    if (data?.messages) {
      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: new Date(msg.created_at),
      })));
      setConversationId(convId);
    }
  } catch (error) {
    console.error('[useAssistantChat] loadConversation error:', error);
  } finally {
    setIsLoading(false);
  }
}, [session]);
```

### 3.4 E2E 테스트 시나리오

#### 3.4.1 테스트 시나리오 목록

```markdown
## E2E 테스트 시나리오

### 1. 기본 플로우 테스트

#### 1.1 페이지 네비게이션
- [ ] "인사이트 허브로 가줘" → /insights 이동 확인
- [ ] "스튜디오 열어줘" → /studio 이동 확인
- [ ] "설정 페이지 보여줘" → /settings 이동 확인

#### 1.2 탭 전환
- [ ] "고객탭 보여줘" → /insights?tab=customer 이동 확인
- [ ] "AI 시뮬레이션 탭 열어줘" → /studio?tab=ai-simulation 이동 확인
- [ ] 현재 페이지에서 탭만 전환 확인

#### 1.3 날짜 필터
- [ ] "오늘 데이터로 변경해줘" → preset=today 적용 확인
- [ ] "최근 7일로 설정" → preset=7d 적용 확인
- [ ] "11/4~11/15 기간으로" → 커스텀 범위 적용 확인

#### 1.4 복합 명령
- [ ] "인사이트 허브 고객탭에서 7일 데이터 보여줘" → 페이지 + 탭 + 날짜 동시 적용

### 2. KPI 조회 테스트

#### 2.1 매출 조회
- [ ] "오늘 매출 얼마야?" → 실제 매출 데이터 반환 확인
- [ ] "어제 매출 알려줘" → 어제 데이터 반환 확인
- [ ] 전일 대비 변화율 표시 확인

#### 2.2 방문객 조회
- [ ] "방문객 몇 명이야?" → 방문객 수 반환 확인
- [ ] 전일 대비 변화율 표시 확인

#### 2.3 전환율 조회
- [ ] "전환율 어때?" → 전환율 반환 확인

### 3. 시뮬레이션/최적화 테스트

#### 3.1 시뮬레이션
- [ ] "시뮬레이션 돌려줘" → run-simulation EF 호출 확인
- [ ] "크리스마스 시뮬레이션" → scenario 파라미터 적용 확인
- [ ] 결과 요약 메시지 확인

#### 3.2 최적화
- [ ] "최적화 해줘" → generate-optimization EF 호출 확인
- [ ] "가구 배치 최적화" → optimization_type 적용 확인
- [ ] 결과 요약 메시지 확인

### 4. 일반 대화 테스트

#### 4.1 인사
- [ ] "안녕" → 친근한 응답 확인
- [ ] "뭐 할 수 있어?" → 기능 안내 응답 확인

#### 4.2 AI 폴백
- [ ] 패턴 매칭 실패 → AI 분류 폴백 확인
- [ ] AI 분류 결과 적절성 확인

### 5. 에러 처리 테스트

#### 5.1 인증 에러
- [ ] 토큰 없이 요청 → 401 + 에러 메시지 확인
- [ ] 만료된 토큰 → 401 + 에러 메시지 확인

#### 5.2 Rate Limiting
- [ ] 30회 초과 요청 → 429 + 대기 시간 안내 확인

#### 5.3 네트워크 에러
- [ ] EF 호출 실패 → 에러 메시지 + 재시도 안내 확인

#### 5.4 AI 타임아웃
- [ ] Gemini 응답 지연 → 타임아웃 메시지 확인

### 6. 대화 히스토리 테스트

#### 6.1 세션 유지
- [ ] 같은 conversationId로 연속 대화 확인
- [ ] 이전 메시지 컨텍스트 유지 확인

#### 6.2 대화 로드
- [ ] 이전 대화 목록 조회 확인
- [ ] 특정 대화 로드 확인
- [ ] 로드된 대화 이어서 진행 확인

### 7. UI/UX 테스트

#### 7.1 로딩 상태
- [ ] 요청 중 "생각 중..." 표시 확인
- [ ] 요청 중 입력창 비활성화 확인

#### 7.2 응답 표시
- [ ] 응답 메시지 정상 표시 확인
- [ ] 후속 제안 표시 확인
- [ ] 스크롤 자동 이동 확인
```

#### 3.4.2 자동화 테스트 스크립트 (선택)

```typescript
// tests/e2e/assistant.test.ts

import { expect, test } from '@playwright/test';

test.describe('NEURALTWIN OS 챗봇', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/insights');
  });

  test('페이지 네비게이션', async ({ page }) => {
    // 채팅창 열기
    await page.click('[data-testid="chat-toggle"]');

    // 메시지 입력
    await page.fill('[data-testid="chat-input"]', '스튜디오로 가줘');
    await page.click('[data-testid="chat-send"]');

    // 페이지 이동 확인
    await expect(page).toHaveURL(/\/studio/);
  });

  test('KPI 조회', async ({ page }) => {
    await page.click('[data-testid="chat-toggle"]');
    await page.fill('[data-testid="chat-input"]', '오늘 매출 얼마야?');
    await page.click('[data-testid="chat-send"]');

    // 응답에 매출 정보 포함 확인
    const response = await page.locator('[data-testid="chat-message-assistant"]').last();
    await expect(response).toContainText(/매출|원/);
  });
});
```

---

## 4. 완료 체크리스트

### 에러 핸들링
- [ ] `utils/errorHandler.ts` 생성
- [ ] 모든 에러 케이스에 일관된 로깅 적용
- [ ] 에러 코드별 적절한 HTTP 상태 반환

### Rate Limiting
- [ ] Rate Limit 헤더 추가
- [ ] 프론트엔드에서 Rate Limit 피드백 UI

### 대화 히스토리
- [ ] `messageStore.ts` 확장 (대화 목록, 로드, 아카이브)
- [ ] 프론트엔드에서 대화 목록/로드 기능

### E2E 테스트
- [ ] 테스트 시나리오 문서화
- [ ] 수동 테스트 완료
- [ ] (선택) 자동화 테스트 스크립트

### 최종 검증
- [ ] 모든 인텐트 동작 확인
- [ ] 에러 상황 복구 확인
- [ ] 성능 (응답 시간) 확인

---

## 5. 완료 후 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEURALTWIN OS 챗봇 완성 구조                      │
│                                                                     │
│  ┌─────────────────┐         ┌──────────────────────────────────┐  │
│  │   프론트엔드     │ ───────→│   neuraltwin-assistant EF         │  │
│  │                 │         │                                  │  │
│  │ useAssistantChat│         │  ┌─────────────────────────────┐ │  │
│  │ ActionDispatcher│←────────│  │ 인텐트 분류 (패턴 + AI)      │ │  │
│  │                 │         │  └─────────────────────────────┘ │  │
│  └─────────────────┘         │              ↓                   │  │
│                              │  ┌─────────────────────────────┐ │  │
│                              │  │ 액션 실행                    │ │  │
│                              │  │ - Navigation                │ │  │
│                              │  │ - Query KPI                 │ │  │
│                              │  │ - Run Simulation            │ │  │
│                              │  │ - Run Optimization          │ │  │
│                              │  │ - General Chat              │ │  │
│                              │  └─────────────────────────────┘ │  │
│                              │              ↓                   │  │
│                              │  ┌─────────────────────────────┐ │  │
│                              │  │ 기존 시스템 연동             │ │  │
│                              │  │ - run-simulation EF         │ │  │
│                              │  │ - generate-optimization EF  │ │  │
│                              │  │ - daily_kpis_agg 테이블     │ │  │
│                              │  │ - Gemini AI                 │ │  │
│                              │  └─────────────────────────────┘ │  │
│                              └──────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          챗봇 전용 DB (웹사이트 팀에서 마이그레이션 완료)       │   │
│  │  chat_conversations │ chat_messages │ chat_events           │   │
│  │  chat_leads (웹사이트) │ chat_daily_analytics │ command_cache │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Phase 4 요청서 끝**

---

## 🎉 전체 구현 완료

Phase 1 ~ Phase 4 완료 시, NEURALTWIN OS 챗봇의 초기 버전이 완성됩니다.

**구현된 기능:**
- 페이지 네비게이션 (navigate)
- 탭 전환 (set_tab)
- 날짜 필터 변경 (set_date_range)
- 복합 명령 (composite_navigate)
- KPI 조회 (query_kpi)
- 시뮬레이션 실행 (run_simulation)
- 최적화 실행 (run_optimization)
- 일반 대화 (general_chat)
- 에러 핸들링 + Rate Limiting + 대화 히스토리

**추후 구현 예정:**
- Context Bridge (웹사이트 챗봇 연동)
- 인라인 미니차트/시각화
- 명령어 캐싱 (응답 속도 향상)
- chat_daily_analytics 자동 집계
