# NEURALTWIN OS 챗봇 — 기능 개발 요청서 (마스터)

> **버전**: v1.3 (인텐트 강화 반영)
> **작성일**: 2026-02-05
> **상태**: 검토 완료, 8단계 분할 확정 + 인텐트 강화 적용
> **대상**: Claude Code (개발 실행 에이전트)
> **DB 상태**: 웹사이트 챗봇 팀에서 마이그레이션 완료 (6개 테이블 이미 존재)

---

## 1. 개요

### 1.1 무엇을 만드는가

NEURALTWIN 대시보드에 이미 존재하는 채팅 패널(더미 에코 응답)을 **실제 AI 챗봇**으로 업그레이드한다. 인증된 유료 고객이 자연어로 대시보드 기능을 제어할 수 있게 한다.

### 1.2 한줄 정의

> 사용자가 "인사이트 허브 고객탭 보여줘"라고 입력하면, AI가 의도를 파악하고 실제로 해당 페이지/탭으로 이동시키는 시스템

### 1.3 기술 스택

| 구성 요소 | 기술 |
|:---|:---|
| AI 모델 | Gemini 2.5 Flash (Lovable API Gateway 경유) |
| Backend | Supabase Edge Function (`neuraltwin-assistant`) — **신규 생성** |
| DB | Supabase PostgreSQL — **통합 스키마 6개 테이블 (웹사이트 팀에서 마이그레이션 완료)** |
| Frontend | 기존 ChatPanel 활용 + 신규 훅/컨텍스트 추가 |
| 스트리밍 | SSE (Server-Sent Events) |

---

## 2. 핵심 제약조건

### 2.1 절대 금지 사항

```
❌ 기존 Edge Function 코드 수정 (run-simulation, generate-optimization, unified-ai 등 34개)
❌ 기존 DB 테이블 구조 수정 (daily_kpis_agg, zone_daily_metrics 등)
❌ 기존 프론트엔드 컴포넌트 코드 직접 수정 (ChatPanel.tsx, ChatInput.tsx, ChatMessage.tsx 등)
❌ 기존 훅 코드 직접 수정 (useChatPanel.ts, useDateFilterStore.ts 등)
❌ 기존 기능과 동일한 역할의 중복 EF/테이블 신규 생성
```

### 2.2 허용 사항

```
✅ neuraltwin-assistant Edge Function 1개 신규 생성
✅ 통합 DB 스키마 6개 테이블 활용 (웹사이트 팀에서 이미 마이그레이션 완료)
✅ 새로운 훅/컨텍스트/컴포넌트 파일 추가 (기존 파일은 수정하지 않되, 새 파일에서 기존 것을 import하여 사용)
✅ 기존 EF를 neuraltwin-assistant에서 호출 (오케스트레이션)
✅ 기존 DB 테이블을 직접 쿼리 (읽기 전용)
✅ 기존 Zustand 스토어/React Context의 액션을 호출하여 UI 상태 변경
✅ supabase/functions/_shared/ 에 챗봇 전용 공유 유틸 추가
```

### 2.3 예외적 최소 수정 (허용됨)

| 파일 | 수정 내용 | 이유 |
|:---|:---|:---|
| `DashboardLayout.tsx` | import 1줄 + 훅 호출 1줄 | `useChatPanel` → `useAssistantChat` 교체 |
| `InsightHubPage.tsx` | import 1줄 + useEffect 3줄 | URL 쿼리 파라미터로 탭 설정 |
| `DigitalTwinStudioPage.tsx` | import 1줄 + useEffect 3줄 | URL 쿼리 파라미터로 탭 설정 |

---

## 3. 사전 결정 사항

### 3.1 탭 설정 방식 — URL 쿼리 파라미터 채택

```typescript
// ActionDispatcher에서 탭 전환 시
navigate('/insights?tab=customer');
navigate('/studio?tab=ai-simulation');
```

### 3.2 에러 핸들링 — Phase 1에서 errorTypes.ts 선행 생성

- 9개 에러 코드 + 재시도 정책 사전 정의
- Phase 2~3에서 각 모듈에서 이 정의 참조

### 3.3 isLoading 상태 — isLoading + isStreaming 분리

- `isLoading`: EF 호출 시작 ~ 첫 응답 도착 전
- `isStreaming`: 첫 응답 도착 ~ 스트리밍 완료
- 둘 중 하나라도 true이면 입력창 비활성화

---

## 4. 구현 범위 (초기 버전)

### 4.1 초기 버전에서 구현하는 인텐트

| 인텐트 | 사용자 발화 예시 | 실행 동작 | 우선순위 |
|:---|:---|:---|:---|
| `navigate` | "인사이트 허브로 가줘", "스튜디오 열어줘" | 페이지 이동 (react-router) | P0 |
| `set_tab` | "고객탭 보여줘", "AI추천 탭 열어줘" | 특정 탭 활성화 | P0 |
| `set_date_range` | "11/4~11/15 기간으로 설정해줘" | 날짜 필터 변경 (Zustand store) | P0 |
| `composite_navigate` | "인사이트 허브에서 11/4~11/15 개요탭 보여줘" | 페이지 이동 + 날짜 설정 + 탭 전환 복합 | P0 |
| `scroll_to_section` | "KPI 카드 보여줘", "트렌드 차트 확인" | 특정 섹션으로 스크롤 + 하이라이트 | P1 |
| `open_modal` | "목표 설정하기", "사용자 초대" | 특정 모달/다이얼로그 열기 | P1 |
| `run_simulation` | "크리스마스 시뮬레이션 돌려줘" | 기존 `run-simulation` EF 호출 | P1 |
| `run_optimization` | "가구 배치 최적화 해줘" | 기존 `generate-optimization` EF 호출 | P1 |
| `query_kpi` | "오늘 매출 얼마야?", "목표 달성률 어때?" | 기존 DB 테이블 직접 쿼리 → 결과 반환 | P1 |
| `general_chat` | "안녕", "뭐 할 수 있어?" | 일반 대화 응답 | P0 |

### 4.2 인텐트 강화 (Phase 3-B+)

인텐트 분류 및 엔티티 추출 정확도 향상을 위해 다음 기능들이 추가되었습니다:

#### 4.2.1 날짜 표현 Variation 확대

| 카테고리 | 지원 표현 예시 |
|:---|:---|
| 절대 날짜 | "12월 1일", "12월 1-10일", "12월 1일부터 10일까지", "12/1~15", "25년 12월" |
| 상대 날짜 | "오늘", "어제", "그제", "이번 주", "지난 주", "이번 달", "지난 달" |
| 상대 기간 | "최근 7일", "지난 일주일", "최근 30일", "지난 3개월" |
| 자연어 기간 | "12월 첫째주", "12월 초", "12월 중순", "12월 말", "연말", "연초" |

#### 4.2.2 대시보드 용어 인식

| 용어 | Primary 위치 | Secondary 위치 |
|:---|:---|:---|
| 순 방문객 | 고객탭 (customer-kpi) | 개요탭 (kpi-cards) |
| 매출 | 개요탭 (kpi-cards) | 상품탭, ROI |
| 전환율 | 개요탭 (kpi-cards) | 고객탭 |
| 목표 달성률 | 개요탭 (goal-achievement) | - |
| 체류 시간 | 고객탭 (customer-kpi) | 매장탭 |

#### 4.2.3 확장된 UIAction 타입

| 액션 타입 | 설명 |
|:---|:---|
| `scroll_to_section` | 특정 섹션으로 스크롤 + 하이라이트 |
| `open_modal` | 특정 모달/다이얼로그 열기 |
| `highlight_element` | 특정 요소 하이라이트 |
| `show_tooltip` | 툴팁 표시 |

#### 4.2.4 조건부 응답

- `goal` 쿼리: 목표 설정 여부에 따라 다른 응답
- `inventory_alerts` 쿼리: 알림 데이터 유무에 따라 다른 응답

관련 설계 문서: `docs/review/NEURALTWIN_OS_CHATBOT_INTENT_ENHANCEMENT_DESIGN.md`

### 4.3 초기 버전에서 구현하지 않는 것

- Context Bridge (웹사이트 챗봇 연동)
- 인라인 미니차트/시각화 렌더링
- 명령어 캐싱 (assistant_command_cache 활용)
- chat_daily_analytics 자동 집계
- 3D 카메라 이동, 레이어 토글 등 Studio 심화 제어

---

## 5. 8단계 구현 계획

### 5.1 Phase 개요

| Phase | 명칭 | 핵심 산출물 |
|:---|:---|:---|
| **Phase 1** | 기반 인프라 | DB 6개 테이블 존재 확인 + EF 기본 구조 + 공유 유틸 4개 |
| **Phase 2-A** | 인텐트 분류 + 페이지 네비게이션 | patterns.ts + classifier.ts + navigate 액션 |
| **Phase 2-B** | 엔티티 추출 + 탭/날짜 액션 | entityExtractor.ts + set_tab, set_date_range 액션 |
| **Phase 2-C** | 프론트엔드 통합 | useAssistantChat.ts + ActionDispatcher + DashboardLayout 연결 |
| **Phase 3-A** | 일반 대화 + AI 연동 | geminiClient.ts + chatActions.ts + 시스템 프롬프트 |
| **Phase 3-B** | KPI 조회 | queryActions.ts + 기존 DB 테이블 쿼리 |
| **Phase 3-C** | 시뮬레이션/최적화 오케스트레이션 | executionActions.ts + 기존 EF 호출 |
| **Phase 4** | 안정화 | 에러 핸들링 강화 + Rate Limiting + 대화 히스토리 |

### 5.2 Phase별 의존성

```
Phase 1 (기반 인프라)
    │
    ├──→ Phase 2-A (인텐트 분류)
    │       │
    │       └──→ Phase 2-B (엔티티 추출)
    │               │
    │               └──→ Phase 2-C (프론트엔드 통합)
    │
    └──→ Phase 3-A (일반 대화 + AI)
            │
            ├──→ Phase 3-B (KPI 조회)
            │
            └──→ Phase 3-C (시뮬레이션/최적화)
                    │
                    └──→ Phase 4 (안정화)
```

**병렬 실행 가능:**
- Phase 2-A와 Phase 3-A는 Phase 1 완료 후 병렬 진행 가능
- Phase 3-B와 Phase 3-C는 Phase 3-A 완료 후 병렬 진행 가능

---

## 6. 신규 생성 파일 전체 목록

### 6.1 DB (웹사이트 팀에서 마이그레이션 완료)

```
⚠️ 마이그레이션 파일 생성 불필요 — 웹사이트 챗봇 팀에서 이미 완료

이미 존재하는 테이블 (6개):
├── chat_conversations    (대화 세션)
├── chat_messages         (개별 메시지)
├── chat_events           (이벤트 로그 — handover, context_bridge 등)
├── chat_leads            (웹사이트 전용 리드)
├── chat_daily_analytics  (일별 분석 집계)
└── assistant_command_cache (OS 전용 명령어 캐시)

이미 존재하는 함수:
└── handover_chat_session() (웹사이트 → OS 세션 인계)
```

### 6.2 Edge Function

```
supabase/functions/neuraltwin-assistant/
├── index.ts
├── intent/
│   ├── classifier.ts
│   ├── patterns.ts              # 인텐트 강화: 날짜 variation, 용어 인식
│   └── entityExtractor.ts       # 인텐트 강화: 날짜 추출 로직 확장
├── actions/
│   ├── navigationActions.ts     # 인텐트 강화: scroll_to_section, open_modal 추가
│   ├── executionActions.ts
│   ├── queryActions.ts          # 인텐트 강화: goal, dwellTime, newVsReturning 추가
│   └── chatActions.ts
├── config/
│   └── dashboardStructure.ts    # 인텐트 강화: 대시보드 구조, 용어-위치 매핑
├── response/
│   └── generator.ts
└── utils/
    ├── session.ts
    ├── messageStore.ts
    ├── geminiClient.ts
    └── errorTypes.ts
```

### 6.3 공유 유틸리티

```
supabase/functions/_shared/
├── chatLogger.ts              # 신규 (대화/메시지 CRUD)
├── chatEventLogger.ts         # 신규 (chat_events 테이블 CRUD)
├── streamingResponse.ts       # 신규 (SSE 스트리밍)
└── rateLimiter.ts             # 신규 (분당 요청 제한)
```

### 6.4 프론트엔드

```
src/
├── hooks/
│   └── useAssistantChat.ts           # 신규
├── features/
│   └── assistant/
│       ├── context/
│       │   └── AssistantProvider.tsx  # 신규
│       ├── hooks/
│       │   ├── useAssistantContext.ts # 신규
│       │   └── useActionDispatcher.ts # 신규
│       └── utils/
│           └── actionDispatcher.ts   # 신규
```

---

## 7. 관련 문서

| 문서 | 경로 | 설명 |
|:---|:---|:---|
| DB 스키마 | `docs/review/NEURALTWIN_CHATBOT_DB_SCHEMA.md` | 6개 테이블 + handover 함수 (v2.0) |
| Phase 1 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE1_REQUEST.md` | 기반 인프라 구현 |
| Phase 2-A 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2A_REQUEST.md` | 인텐트 분류 |
| Phase 2-B 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2B_REQUEST.md` | 엔티티 추출 |
| Phase 2-C 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2C_REQUEST.md` | 프론트엔드 통합 |
| Phase 3-A 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE3A_REQUEST.md` | 일반 대화 + AI |
| Phase 3-B 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE3B_REQUEST.md` | KPI 조회 |
| Phase 3-C 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE3C_REQUEST.md` | 시뮬레이션/최적화 |
| Phase 4 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE4_REQUEST.md` | 안정화 |
| 검토 결과 | `docs/review/NEURALTWIN_OS_CHATBOT_REVIEW_RESULT.md` | 검토자 피드백 |

---

## 8. 개발 세션 가이드

### 8.1 개발 세션 시작 시

1. 해당 Phase 요청서 읽기
2. 이전 Phase 완료 여부 확인
3. 체크리스트 기반으로 작업 진행

### 8.2 개발 세션 종료 시

1. 체크리스트 완료 여부 확인
2. 테스트 시나리오 실행
3. 코드 커밋 및 푸시

### 8.3 Phase 간 인수인계

- 각 Phase 요청서에 "다음 Phase 예고" 섹션 포함
- 완료된 Phase의 산출물을 다음 Phase에서 import하여 사용

---

**마스터 요청서 끝**
