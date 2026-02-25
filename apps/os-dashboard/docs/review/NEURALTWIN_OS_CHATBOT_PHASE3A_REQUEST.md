# NEURALTWIN OS 챗봇 — Phase 3-A 기능 개발 요청서

> **버전**: v1.2
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 1 (기반 인프라) 완료 필수, Phase 2 완료 권장
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 3-A 목표

**일반 대화(general_chat) + Gemini AI 연동** 구현

이 Phase가 완료되면:
- 패턴 매칭 실패 시 Gemini 2.5 Flash로 AI 분류 폴백
- "안녕", "뭐 할 수 있어?" 같은 일반 대화에 자연어 응답
- 시스템 프롬프트 기반 페르소나 적용

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant Edge Function 내 파일 추가/수정
```

---

## 3. 구현 범위

### 3.1 신규/수정 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   └── classifier.ts       # 수정 (AI 폴백 추가)
├── actions/
│   └── chatActions.ts      # 신규
├── response/
│   └── generator.ts        # 신규
├── utils/
│   └── geminiClient.ts     # 신규
└── constants/
    └── systemPrompt.ts     # 신규
```

### 3.2 geminiClient.ts — Gemini API 클라이언트

```typescript
/**
 * Gemini 2.5 Flash API 클라이언트
 * Lovable API Gateway 경유
 */

const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 1024;
const TIMEOUT_MS = 15000;

export interface GeminiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Gemini API 호출
 */
export async function callGemini(
  messages: GeminiMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<GeminiResponse> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not set');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice?.message?.content) {
      throw new Error('Invalid Gemini response format');
    }

    return {
      content: choice.message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      model: data.model || DEFAULT_MODEL,
    };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('AI_TIMEOUT');
    }
    throw error;
  }
}

/**
 * JSON 응답 파싱 헬퍼
 */
export function parseJsonResponse<T>(content: string): T | null {
  try {
    // Markdown 코드 블록 제거
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
```

### 3.3 systemPrompt.ts — 시스템 프롬프트 정의

```typescript
/**
 * NEURALTWIN AI Assistant 시스템 프롬프트
 */

export const SYSTEM_PROMPT = `당신은 NEURALTWIN AI Assistant입니다. "유능한 운영 오퍼레이터" 페르소나를 가지고 있습니다.

## 역할
- 사용자의 자연어 명령을 이해하고, NEURALTWIN 대시보드의 기능을 제어합니다.
- 항상 한국어로 응답합니다.
- 실행한 동작을 간결하게 설명하고, 후속으로 할 수 있는 작업 2~3개를 제안합니다.

## NEURALTWIN 대시보드 구조
- **인사이트 허브** (/insights): 개요, 매장, 고객, 상품, 재고, 예측, AI추천 탭
- **디지털트윈 스튜디오** (/studio): 레이어, AI 시뮬레이션, AI 최적화, 적용 탭
- **ROI 측정** (/roi): 전략 성과 분석
- **설정** (/settings): 매장 관리, 데이터, 사용자, 시스템, 플랜 탭
- **데이터 컨트롤타워** (/data/control-tower): 데이터 소스 관리

## 응답 스타일
- 친근하고 전문적인 톤을 유지합니다.
- 간결하게 응답하되, 필요한 정보는 충분히 제공합니다.
- 기술 용어는 쉽게 풀어서 설명합니다.
- 이모지는 최소한으로 사용합니다.

## 제한 사항
- 실제로 할 수 없는 작업(데이터 삭제, 시스템 설정 변경 등)은 정중히 거절합니다.
- 확실하지 않은 정보는 추측하지 않고 모른다고 말합니다.
- 외부 링크나 참조는 제공하지 않습니다.`;

export const INTENT_CLASSIFICATION_PROMPT = `사용자가 다음과 같이 말했습니다: "{userMessage}"

아래 인텐트 중 하나로 분류하고 관련 엔티티를 추출하세요.
반드시 JSON으로만 응답하세요.

## 인텐트 목록
- navigate: 페이지 이동 (예: "인사이트 허브로 가줘")
- set_tab: 탭 전환 (예: "고객탭 보여줘")
- set_date_range: 날짜 필터 변경 (예: "최근 7일로 설정")
- composite_navigate: 페이지 이동 + 탭/날짜 복합 (예: "인사이트 허브 고객탭 7일 데이터")
- open_dialog: 다이얼로그/모달 열기 (예: "새 연결 추가해줘")
- run_simulation: 시뮬레이션 실행 (예: "시뮬레이션 돌려줘")
- run_optimization: 최적화 실행 (예: "배치 최적화 해줘")
- query_kpi: 데이터 조회 (예: "오늘 매출 얼마야?")
- general_chat: 일반 대화 (예: "안녕", "뭐 할 수 있어?")

## 응답 형식 (JSON)
{
  "intent": "인텐트명",
  "confidence": 0.0~1.0,
  "entities": {
    "page": "/insights | /studio | /roi | /settings | /data/control-tower",
    "tab": "탭 값",
    "datePreset": "today | 7d | 30d | 90d",
    "dateStart": "YYYY-MM-DD",
    "dateEnd": "YYYY-MM-DD",
    "scenario": "시뮬레이션 시나리오",
    "dialogId": "다이얼로그 ID",
    "query": "조회 대상 (매출, 방문객 등)"
  }
}`;
```

### 3.4 classifier.ts 수정 — AI 폴백 추가

```typescript
/**
 * 하이브리드 인텐트 분류기
 * 1차: 패턴 매칭
 * 2차: Gemini AI 폴백 (패턴 매칭 실패 또는 낮은 신뢰도)
 */

import { matchIntent } from './patterns.ts';
import { callGemini, parseJsonResponse } from '../utils/geminiClient.ts';
import { INTENT_CLASSIFICATION_PROMPT } from '../constants/systemPrompt.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'pattern' | 'ai';
}

const PATTERN_CONFIDENCE_THRESHOLD = 0.7;
const AI_CONFIDENCE_THRESHOLD = 0.4;

/**
 * 사용자 메시지에서 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  context?: any
): Promise<ClassificationResult> {
  // 1. 패턴 매칭 시도
  const patternResult = matchIntent(message);

  if (patternResult && patternResult.confidence >= PATTERN_CONFIDENCE_THRESHOLD) {
    console.log('[classifier] Pattern match success:', patternResult.intent);
    return {
      intent: patternResult.intent,
      confidence: patternResult.confidence,
      entities: patternResult.entities,
      method: 'pattern',
    };
  }

  // 2. AI 분류 폴백
  console.log('[classifier] Pattern match failed, trying AI classification');

  try {
    const prompt = INTENT_CLASSIFICATION_PROMPT.replace('{userMessage}', message);

    const response = await callGemini(
      [{ role: 'user', content: prompt }],
      { jsonMode: true, temperature: 0.1 }
    );

    const parsed = parseJsonResponse<{
      intent: string;
      confidence: number;
      entities: Record<string, any>;
    }>(response.content);

    if (parsed && parsed.intent && parsed.confidence >= AI_CONFIDENCE_THRESHOLD) {
      console.log('[classifier] AI classification success:', parsed.intent);
      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities || {},
        method: 'ai',
      };
    }

  } catch (error) {
    console.error('[classifier] AI classification error:', error);
    // AI 실패 시 general_chat 폴백
  }

  // 3. 최종 폴백: general_chat
  console.log('[classifier] Falling back to general_chat');
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'pattern',
  };
}
```

### 3.5 chatActions.ts — 일반 대화 처리

```typescript
/**
 * 일반 대화(general_chat) 처리
 */

import { callGemini, GeminiMessage } from '../utils/geminiClient.ts';
import { SYSTEM_PROMPT } from '../constants/systemPrompt.ts';

export interface ChatActionResult {
  message: string;
  suggestions: string[];
  tokensUsed: number;
}

/**
 * 일반 대화 응답 생성
 */
export async function handleGeneralChat(
  userMessage: string,
  conversationHistory: GeminiMessage[] = [],
  context?: any
): Promise<ChatActionResult> {
  // 컨텍스트 기반 시스템 프롬프트 보강
  let contextInfo = '';
  if (context?.page?.current) {
    contextInfo += `\n\n현재 사용자 위치: ${context.page.current}`;
    if (context.page.tab) {
      contextInfo += ` (${context.page.tab} 탭)`;
    }
  }

  const messages: GeminiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + contextInfo },
    ...conversationHistory.slice(-10), // 최근 10개 메시지만 포함
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await callGemini(messages, {
      temperature: 0.7,
      maxTokens: 512,
    });

    // 후속 제안 생성
    const suggestions = generateSuggestions(userMessage, context);

    return {
      message: response.content,
      suggestions,
      tokensUsed: response.tokensUsed,
    };

  } catch (error) {
    console.error('[chatActions] handleGeneralChat error:', error);

    if (error.message === 'AI_TIMEOUT') {
      return {
        message: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
        suggestions: ['다시 시도해줘'],
        tokensUsed: 0,
      };
    }

    return {
      message: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
      suggestions: ['인사이트 허브로 이동', '도움말 보기'],
      tokensUsed: 0,
    };
  }
}

/**
 * 문맥 기반 후속 제안 생성
 */
function generateSuggestions(message: string, context?: any): string[] {
  const lowercaseMessage = message.toLowerCase();

  // 인사 관련
  if (/안녕|hi|hello|반가워/.test(lowercaseMessage)) {
    return [
      '오늘 매출 알려줘',
      '인사이트 허브 보여줘',
      '뭐 할 수 있어?',
    ];
  }

  // 기능 질문
  if (/뭐.*할.*수.*있|기능|도움|help/.test(lowercaseMessage)) {
    return [
      '인사이트 허브로 이동',
      '시뮬레이션 돌려줘',
      '오늘 매출 조회해줘',
    ];
  }

  // 현재 페이지 기반 제안
  const currentPage = context?.page?.current;
  switch (currentPage) {
    case '/insights':
      return ['고객탭 보여줘', '오늘 매출 얼마야?', '7일 데이터로 변경'];
    case '/studio':
      return ['시뮬레이션 돌려줘', '최적화 해줘', 'AI 시뮬레이션 탭 열어줘'];
    case '/roi':
      return ['90일 데이터로 변경', '인사이트 허브로 이동'];
    case '/settings':
      return ['매장 관리 탭', '데이터 연결 추가'];
    default:
      return ['인사이트 허브로 이동', '오늘 매출 조회', '시뮬레이션 실행'];
  }
}
```

### 3.6 generator.ts — 응답 생성기

```typescript
/**
 * 자연어 응답 생성기
 * 액션 실행 결과를 사용자 친화적 메시지로 변환
 */

import { ClassificationResult } from '../intent/classifier.ts';

export interface ActionResult {
  actions: any[];
  message: string;
  suggestions: string[];
  data?: any;
}

/**
 * 액션 결과를 자연어 응답으로 변환
 */
export function generateResponse(
  classification: ClassificationResult,
  actionResult: ActionResult,
  executionTimeMs: number
): string {
  let response = actionResult.message;

  // 실행 시간이 길었을 경우 안내
  if (executionTimeMs > 3000) {
    response += '\n(처리에 시간이 조금 걸렸네요.)';
  }

  return response;
}

/**
 * 에러 응답 생성
 */
export function generateErrorResponse(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    AI_TIMEOUT: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    AUTH_EXPIRED: '세션이 만료되었습니다. 새로고침 후 다시 시도해주세요.',
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    EF_FAILED: '기능 실행 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    DB_QUERY_FAILED: '데이터 조회 중 문제가 발생했어요.',
    DEFAULT: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
  };

  return errorMessages[errorCode] || errorMessages.DEFAULT;
}

/**
 * 데이터 조회 결과를 자연어로 변환
 */
export function formatDataResponse(
  queryType: string,
  data: any
): string {
  if (!data) {
    return '요청하신 데이터를 찾을 수 없습니다.';
  }

  switch (queryType) {
    case 'revenue':
      return `오늘 매출은 ${formatNumber(data.totalRevenue)}원입니다.` +
        (data.change ? ` 전일 대비 ${data.change > 0 ? '+' : ''}${data.change}%입니다.` : '');

    case 'visitors':
      return `오늘 방문객은 ${formatNumber(data.totalVisitors)}명입니다.` +
        (data.change ? ` 전일 대비 ${data.change > 0 ? '+' : ''}${data.change}%입니다.` : '');

    case 'conversion':
      return `현재 전환율은 ${data.conversionRate.toFixed(1)}%입니다.`;

    default:
      return JSON.stringify(data);
  }
}

function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '억';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(0) + '만';
  }
  return num.toLocaleString();
}
```

---

## 4. 완료 체크리스트

### 파일 생성
- [ ] `utils/geminiClient.ts` 생성
- [ ] `constants/systemPrompt.ts` 생성
- [ ] `actions/chatActions.ts` 생성
- [ ] `response/generator.ts` 생성

### 파일 수정
- [ ] `intent/classifier.ts`에 AI 폴백 추가

### 기능 테스트
- [ ] "안녕" → general_chat + 자연어 응답
- [ ] "뭐 할 수 있어?" → 기능 안내 응답
- [ ] 패턴 매칭 실패 시 AI 분류 폴백 동작
- [ ] AI 타임아웃 시 에러 메시지 반환
- [ ] 후속 제안 생성 확인

### 환경 변수
- [ ] `LOVABLE_API_KEY` 환경 변수 설정 확인

---

## 5. 다음 Phase 예고

**Phase 3-B**: KPI 조회
- `actions/queryActions.ts` — query_kpi 인텐트 처리
- 기존 DB 테이블 직접 쿼리 (daily_kpis_agg, zone_daily_metrics 등)
- 조회 결과 자연어 변환

---

**Phase 3-A 요청서 끝**
