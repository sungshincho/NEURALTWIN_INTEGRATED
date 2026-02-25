# 기능 요청서 검토 결과

## 1. 요약 판정
- **판정**: ⚠️ 수정 필요
- **기능명**: NEURALTWIN OS 챗봇 — AI 어시스턴트 통합
- **검토일**: 2026-02-05

**판정 사유**: 기능 요청서는 전반적으로 잘 작성되어 있으나, **범위가 단일 개발 세션에서 완료하기에 과도**하며, **탭 설정 방식에 대한 결정이 필요**합니다. 기술적으로는 실현 가능하지만, **4개 Phase를 별도 기능 요청서로 분할**하여 단계적으로 구현할 것을 권장합니다.

---

## 2. 검토 항목별 결과

| 검토 항목 | 판정 | 비고 |
|-----------|------|------|
| 프로젝트 정합성 | ✅ 적합 | 언급된 모든 파일/경로가 실제 프로젝트에 존재함 |
| 아키텍처 일관성 | ✅ 적합 | Feature-based 구조, Zustand/Context 패턴과 일치 |
| 데이터 흐름 타당성 | ✅ 적합 | 기존 EF/DB 테이블 존재, 오케스트레이션 패턴 적절 |
| 기술적 실현 가능성 | ✅ 적합 | React 18, Supabase, SSE 모두 지원됨 |
| 범위 적절성 | ⚠️ 수정 필요 | 단일 세션에서 완료 불가, Phase별 분할 필요 |
| 누락 사항 | ⚠️ 수정 필요 | 탭 설정 방식 결정 미완, 에러 핸들링 구체화 필요 |

---

## 3. 상세 피드백

### 3.1 프로젝트 정합성 ✅

**확인된 기존 파일들:**

| 요청서 언급 | 실제 경로 | 상태 |
|:---|:---|:---|
| `src/components/chat/ChatPanel.tsx` | 존재 | ✅ |
| `src/components/chat/ChatInput.tsx` | 존재 | ✅ |
| `src/components/chat/ChatMessage.tsx` | 존재 | ✅ |
| `src/hooks/useChatPanel.ts` | 존재 | ✅ |
| `src/components/DashboardLayout.tsx` | 존재 | ✅ |
| `src/store/dateFilterStore.ts` | 존재 | ✅ |
| `src/features/insights/context/InsightDataContext.tsx` | 존재 | ✅ |
| `src/hooks/useSelectedStore.tsx` | 존재 | ✅ |
| `src/hooks/useAuth.tsx` | 존재 | ✅ |
| `supabase/functions/run-simulation/` | 존재 | ✅ |
| `supabase/functions/generate-optimization/` | 존재 | ✅ |
| `supabase/functions/_shared/` | 존재 | ✅ |

**기존 useChatPanel 인터페이스 확인:**

```typescript
// 실제 코드 (src/hooks/useChatPanel.ts:11-21)
interface UseChatPanelReturn {
  isOpen: boolean;
  width: number;
  messages: ChatMessage[];
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}
```

요청서의 `UseAssistantChatReturn` 인터페이스와 대부분 일치하나, 요청서에서 추가하려는 `isLoading` 필드가 기존에는 없음. 이는 **새 훅에서 추가**하면 되므로 문제없음.

---

### 3.2 아키텍처 일관성 ✅

**현재 프로젝트 구조 패턴:**

1. **Feature-based 모듈 구조**: `src/features/{feature-name}/` 형태 사용 중
   - `src/features/insights/`
   - `src/features/settings/`
   - `src/features/studio/`
   - `src/features/roi/`
   - `src/features/data-control/`

2. **상태 관리 패턴:**
   - Zustand: 전역 상태 (`dateFilterStore`)
   - React Context: 기능별 상태 (`InsightDataContext`, `SelectedStoreContext`, `AuthContext`)
   - useState: 페이지 내부 상태 (탭 등)

3. **Edge Function 구조:**
   - 단일 `index.ts` 또는 모듈화된 구조 (`generate-optimization/` 참조)
   - `_shared/` 공유 유틸리티 사용

**요청서 제안 구조와의 일치:**

```
src/features/assistant/  ← Feature-based 패턴 준수 ✅
├── context/
├── hooks/
└── utils/
```

---

### 3.3 데이터 흐름 타당성 ✅

**기존 Edge Function 인터페이스 확인:**

1. **run-simulation** (`supabase/functions/run-simulation/index.ts`):
```typescript
interface SimulationRequest {
  store_id: string;
  options: {
    duration_minutes: number;
    customer_count: number;
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'peak';
    simulation_type: 'realtime' | 'predictive' | 'scenario';
  };
  // ... (zones, scene_data 등 추가 필드)
}
```

2. **generate-optimization** (`supabase/functions/generate-optimization/index.ts`):
   - 환경 데이터 로딩 (`environmentLoader.ts`)
   - 고객 동선 분석 (`flowAnalyzer.ts`)
   - VMD 엔진 (`vmdEngine.ts`)
   - 매출/전환율 예측 (`revenuePredictor.ts`, `conversionPredictor.ts`)

**요청서의 오케스트레이션 패턴:**
```typescript
// neuraltwin-assistant에서 기존 EF 호출
const { data, error } = await supabaseClient.functions.invoke('run-simulation', { body: {...} });
```

이 패턴은 Supabase Edge Function 간 내부 호출로 **기술적으로 가능**하며, 기존 EF를 수정하지 않고 재사용하는 적절한 접근법임.

**기존 Zustand Store 확인:**

```typescript
// src/store/dateFilterStore.ts
interface DateFilterState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: PresetPeriod) => void;  // ← 요청서에서 사용할 함수
  setCustomRange: (startDate: string, endDate: string) => void;  // ← 요청서에서 사용할 함수
  getDays: () => number;
}
```

요청서의 ActionDispatcher에서 사용하려는 `setPreset()`, `setCustomRange()` 함수가 실제로 존재함. ✅

---

### 3.4 기술적 실현 가능성 ✅

| 기술 요구사항 | 현재 지원 | 비고 |
|:---|:---|:---|
| Supabase Edge Function 신규 생성 | ✅ | 34개 EF 운영 중, 패턴 확립됨 |
| SSE 스트리밍 | ✅ | Deno에서 지원, 기존 EF에서 사용 가능 |
| Gemini API 호출 | ✅ | Lovable API Gateway 통해 가능 |
| JSONB 컬럼 활용 | ✅ | 기존 테이블에서 광범위하게 사용 중 |
| RLS 정책 | ✅ | 기존 테이블에 RLS 적용됨, 패턴 확립 |
| React Context 추가 | ✅ | 기존 패턴 그대로 적용 가능 |
| 커스텀 이벤트 | ✅ | 브라우저 네이티브 API, 문제없음 |

---

### 3.5 범위 적절성 ⚠️ 수정 필요

**요청서의 4개 Phase 분석:**

| Phase | 포함 작업 | 예상 복잡도 | 단독 세션 가능 여부 |
|:---|:---|:---|:---|
| Phase 1 | DB 마이그레이션 5개 테이블 + _shared 유틸 3개 + EF 기본 구조 | 중 | ✅ 가능 |
| Phase 2 | 인텐트 분류기 + 엔티티 추출기 + 네비게이션 액션 + 프론트엔드 훅 + DashboardLayout 통합 | **고** | ⚠️ 분할 권장 |
| Phase 3 | 기존 EF 오케스트레이션 + KPI 쿼리 + 일반 대화 + Gemini AI 폴백 + 후속 제안 | **고** | ⚠️ 분할 권장 |
| Phase 4 | 에러 핸들링 + Rate Limiting + 대화 히스토리 + E2E 테스트 | 중 | ✅ 가능 |

**권장 분할:**

Phase 2를 다음과 같이 세분화:
- Phase 2-A: 패턴 매칭 인텐트 분류 + 네비게이션 액션 (navigate만)
- Phase 2-B: 엔티티 추출기 + 탭/날짜 액션 (set_tab, set_date_range)
- Phase 2-C: 프론트엔드 훅 + DashboardLayout 통합

Phase 3을 다음과 같이 세분화:
- Phase 3-A: general_chat 인텐트 + Gemini 연동
- Phase 3-B: query_kpi 인텐트 + DB 직접 쿼리
- Phase 3-C: run_simulation, run_optimization 오케스트레이션

---

### 3.6 누락 사항 ⚠️ 수정 필요

#### 3.6.1 탭 설정 방식 결정 필요

요청서에서 두 가지 방식을 제안했으나 **결정이 내려지지 않음**:

| 방식 | 장점 | 단점 |
|:---|:---|:---|
| **URL 쿼리 파라미터** (`/insights?tab=customer`) | 북마크 가능, 새로고침 유지 | 기존 페이지 컴포넌트 수정 필요 (InsightHubPage 등) |
| **커스텀 이벤트** (`window.dispatchEvent`) | 기존 코드 수정 최소화 | 페이지마다 이벤트 리스너 훅 추가 필요 |

**권장**: URL 쿼리 파라미터 방식
- 이유: 이미 `/settings?tab=stores` 리다이렉트가 App.tsx에 구현되어 있음
- InsightHubPage에 `useSearchParams` 훅 추가만으로 구현 가능
- **단, 이는 "기존 코드 최소 수정" 원칙에 1줄 추가가 필요**

#### 3.6.2 에러 핸들링 구체화 필요

요청서에서 "Phase 4에서 에러 핸들링"이라고 명시했으나, **구체적인 에러 케이스가 정의되지 않음**:

- [ ] AI API 타임아웃 (Gemini 응답 지연)
- [ ] Rate Limit 초과
- [ ] 인증 만료
- [ ] 네트워크 오류
- [ ] 잘못된 인텐트 분류
- [ ] 기존 EF 호출 실패

**권장**: Phase 1에서 에러 타입과 사용자 친화적 메시지를 정의한 `errorTypes.ts` 파일 먼저 생성

#### 3.6.3 isLoading 상태 처리

요청서에서 `UseAssistantChatReturn`에 `isLoading: boolean` 추가를 언급했으나, **UI 피드백 방식이 명시되지 않음**:

- 기존 ChatPanel에 로딩 인디케이터 표시?
- 입력 비활성화?
- 스트리밍 중 부분 텍스트 표시?

**권장**: Phase 2-C에서 `isLoading`, `isStreaming` 두 상태 분리하여 구현

---

## 4. 개발 체크리스트

### Phase 1: 기반 인프라

- [ ] DB 마이그레이션 파일 생성 (`YYYYMMDDHHMMSS_create_chat_tables.sql`)
- [ ] `chat_channel` ENUM 타입 생성 확인
- [ ] `chat_conversations` 테이블 생성 + RLS 정책 적용
- [ ] `chat_messages` 테이블 생성 + RLS 정책 적용
- [ ] `chat_leads` 테이블 생성 (초기 버전 미사용, 구조만)
- [ ] `chat_daily_analytics` 테이블 생성 (초기 버전 미사용, 구조만)
- [ ] `assistant_command_cache` 테이블 생성 (초기 버전 미사용, 구조만)
- [ ] 인덱스 6개 생성 확인
- [ ] `supabase/functions/_shared/chatLogger.ts` 생성
- [ ] `supabase/functions/_shared/streamingResponse.ts` 생성
- [ ] `supabase/functions/_shared/rateLimiter.ts` 생성
- [ ] `supabase/functions/neuraltwin-assistant/index.ts` 기본 구조 생성 (CORS, 인증)
- [ ] `neuraltwin-assistant` 로컬 테스트 통과

### Phase 2-A: 인텐트 분류 + 페이지 네비게이션

- [ ] `intent/patterns.ts` 생성 (navigate 패턴만)
- [ ] `intent/classifier.ts` 생성 (패턴 매칭만, AI 폴백 제외)
- [ ] `actions/navigationActions.ts` 생성 (navigate만 구현)
- [ ] 테스트: "인사이트 허브로 가줘" → navigate 인텐트 분류 확인

### Phase 2-B: 엔티티 추출 + 탭/날짜 액션

- [ ] `intent/entityExtractor.ts` 생성
- [ ] `intent/patterns.ts` 확장 (set_tab, set_date_range 패턴 추가)
- [ ] `actions/navigationActions.ts` 확장 (set_tab, set_date_range 구현)
- [ ] 테스트: "11/4~11/15 기간으로 설정해줘" → 날짜 추출 + 액션 실행 확인

### Phase 2-C: 프론트엔드 통합

- [ ] `src/hooks/useAssistantChat.ts` 생성
- [ ] `src/features/assistant/context/AssistantProvider.tsx` 생성
- [ ] `src/features/assistant/hooks/useAssistantContext.ts` 생성
- [ ] `src/features/assistant/hooks/useActionDispatcher.ts` 생성
- [ ] `src/features/assistant/utils/actionDispatcher.ts` 생성
- [ ] `DashboardLayout.tsx` 수정: `useChatPanel` → `useAssistantChat` 교체
- [ ] 테스트: "인사이트 허브 고객탭 보여줘" → 실제 페이지 이동 + 탭 전환 확인

### Phase 3-A: 일반 대화 + AI 연동

- [ ] `utils/geminiClient.ts` 생성
- [ ] `actions/chatActions.ts` 생성 (general_chat)
- [ ] `response/generator.ts` 생성
- [ ] `intent/classifier.ts` 확장 (Gemini AI 폴백 추가)
- [ ] 시스템 프롬프트 정의 (`constants/systemPrompt.ts`)
- [ ] 테스트: "안녕" → AI 자연어 응답 확인

### Phase 3-B: KPI 조회

- [ ] `actions/queryActions.ts` 생성
- [ ] `intent/patterns.ts` 확장 (query_kpi 패턴)
- [ ] 기존 DB 테이블 직접 쿼리 로직 (`daily_kpis_agg`, `zone_daily_metrics` 등)
- [ ] 테스트: "오늘 매출 얼마야?" → DB 조회 + 자연어 응답 확인

### Phase 3-C: 시뮬레이션/최적화 오케스트레이션

- [ ] `actions/executionActions.ts` 생성
- [ ] `run-simulation` EF 내부 호출 로직
- [ ] `generate-optimization` EF 내부 호출 로직
- [ ] 테스트: "크리스마스 시뮬레이션 돌려줘" → 기존 EF 호출 + 결과 요약 확인

### Phase 4: 안정화

- [ ] 에러 핸들링 전체 정리 (`utils/errorHandler.ts`)
- [ ] Rate Limiting 적용 (분당 30회)
- [ ] 대화 히스토리 로드/저장 (`utils/session.ts`, `utils/messageStore.ts`)
- [ ] SSE 스트리밍 응답 구현
- [ ] E2E 테스트 시나리오 작성 및 실행

---

## 5. 수정 제안

### 5.1 범위 분할 제안

**원본 요청서의 "11. 구현 순서"를 다음과 같이 수정:**

| 원본 Phase | 수정 후 | 예상 세션 수 |
|:---|:---|:---|
| Phase 1 | Phase 1 (변경 없음) | 1 세션 |
| Phase 2 | Phase 2-A, 2-B, 2-C | 3 세션 |
| Phase 3 | Phase 3-A, 3-B, 3-C | 3 세션 |
| Phase 4 | Phase 4 (변경 없음) | 1 세션 |

**총 8개 세션으로 분할하여 단계적 구현 권장**

### 5.2 탭 설정 방식 결정 제안

**URL 쿼리 파라미터 방식 채택 권장**

```typescript
// ActionDispatcher에서
case 'set_tab':
  deps.navigate(`/${action.page}?tab=${action.tab}`);
  break;
```

**추가 필요 작업 (기존 코드 최소 수정):**

```typescript
// InsightHubPage.tsx에 추가 (약 3줄)
const [searchParams] = useSearchParams();
const initialTab = searchParams.get('tab') as InsightTabType || 'overview';

// 기존 useState 수정
const [activeTab, setActiveTab] = useState<InsightTabType>(initialTab);
```

이 수정은 **"2.1 절대 금지 사항"의 "기존 프론트엔드 컴포넌트 코드 직접 수정"에 해당**하므로, 요청서의 제약조건을 완화하거나 커스텀 이벤트 방식을 채택해야 함.

**대안: 커스텀 이벤트 방식 채택 시**

```typescript
// 새 훅 생성: src/features/assistant/hooks/useAssistantTabSync.ts
// 각 페이지에서 이 훅만 import하면 됨 (기존 코드 1줄 추가)
```

### 5.3 에러 타입 정의 제안

```typescript
// supabase/functions/neuraltwin-assistant/utils/errorTypes.ts

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: '로그인이 필요합니다.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  AI_TIMEOUT: 'AI 응답이 지연되고 있습니다. 다시 시도해주세요.',
  INTENT_UNKNOWN: '죄송해요, 무슨 말씀인지 이해하지 못했어요. 다시 말씀해주시겠어요?',
  EF_CALL_FAILED: '기능 실행 중 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
} as const;
```

---

## 6. 분할된 기능 요청서 (Phase 1)

별도 문서 `NEURALTWIN_OS_CHATBOT_PHASE1_REQUEST.md`로 분리하여 제공합니다.

---

**검토 완료**