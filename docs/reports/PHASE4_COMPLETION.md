# Phase 4 완료 리포트 — Unified Chatbot + Function Calling + Onboarding Tour

> **브랜치**: `neuraltwin/sungshin` (프론트엔드) + `neuraltwin-sungshin` (백엔드)
> **완료일**: 2026-03-01
> **담당**: T4 (Website), T2 (Backend)

---

## 1. 변경 요약

| 태스크 | 설명 | 신규 파일 | 수정 파일 | 상태 |
|--------|------|-----------|-----------|------|
| P4-1: Unified Chatbot EF | 두 챗봇을 단일 EF로 통합 | 68 | 0 | 완료 |
| P4-2: Function Calling | 차트 생성 + 시뮬레이션 도구 정의 | 3 (tools/) | 0 | 완료 |
| P4-3: Frontend URL 전환 | unified-chatbot 엔드포인트로 변경 | 0 | 3 | 완료 |
| P4-4: Custom Onboarding Tour | 3단계 투어 (자체 구현) | 2 | 1 | 완료 |
| 리포트 | Phase 4 완료 리포트 | 1 | 0 | 완료 |

**총**: 74개 신규 파일, 4개 수정 파일

---

## 2. P4-1: Unified Chatbot EF

### 아키텍처

```
unified-chatbot/index.ts
│
├─ 1. CORS (공유)
├─ 2. Body 파싱 + 채널 감지
│     ├─ X-NeuralTwin-Channel 헤더
│     ├─ context.page + context.store → OS
│     ├─ sessionId → Website
│     └─ 기본값: Website
│
├─ 3A. Website → handleWebsiteRequest()
│   ├─ 7단계 파이프라인 (retail-chatbot)
│   ├─ SSE 스트리밍 (text/viz/meta/done)
│   └─ Gemini 2.5 Pro → GPT-4o → Gemini 2.5 Flash 폴백
│
└─ 3B. OS → handleOSRequest()
    ├─ 인텐트 분류 (24종)
    ├─ 액션 디스패치 (navigate/query/execute/chat)
    └─ JSON 응답 + UIActions
```

### 채널 감지 로직

| 우선순위 | 감지 방법 | 채널 |
|----------|-----------|------|
| 1 | `X-NeuralTwin-Channel: os` 헤더 | OS |
| 2 | `context.page` + `context.store` 존재 | OS |
| 3 | `sessionId` 존재 | Website |
| 4 | 기본값 | Website |

### 디렉토리 구조

```
supabase/supabase/functions/unified-chatbot/  (68 files)
├── index.ts                  # 채널 라우터 (CORS + 감지 + 위임)
├── website/
│   ├── handler.ts            # Website 파이프라인 (retail-chatbot에서 추출)
│   ├── topicRouter.ts        # 25+ 토픽 분류
│   ├── contextAssembler.ts   # 5-Layer 컨텍스트
│   ├── painPointExtractor.ts # Pain Point 추출
│   ├── salesBridge.ts        # 세일즈 브릿지
│   ├── vizDirectiveGenerator.ts  # VizDirective 생성
│   ├── suggestionGenerator.ts    # 후속 질문 생성
│   ├── retailKnowledge.ts    # 도메인 지식 DB
│   ├── systemPrompt.ts       # 시스템 프롬프트
│   ├── knowledge/            # Vector Knowledge (6 files)
│   ├── memory/               # Conversation Memory (4 files)
│   └── search/               # Smart Search (7 files)
├── os/
│   ├── handler.ts            # OS 파이프라인 (neuraltwin-assistant에서 추출)
│   ├── intent/               # 인텐트 분류 (2 files)
│   ├── actions/              # 액션 핸들러 (16 files)
│   ├── config/               # 대시보드 구조 (1 file)
│   ├── constants/            # 프롬프트 + 시스템 (7 files)
│   ├── response/             # 응답 포매터 (1 file)
│   └── utils/                # 유틸리티 (5 files)
└── tools/
    ├── registry.ts           # Function Calling 도구 레지스트리
    ├── chartGenerator.ts     # 차트 생성 도구
    └── simulationRunner.ts   # 시뮬레이션 실행 도구
```

### Backward Compatibility

| 항목 | 보장 |
|------|------|
| Website SSE 이벤트 | `text`, `viz`, `meta`, `done`, `error` — 동일 |
| Website 액션 | `capture_lead`, `handover_session`, `log_reaction` — 동일 |
| OS JSON 응답 | `{ message, actions, suggestions, meta }` — 동일 |
| DB 테이블 | `chat_conversations`, `chat_messages` — 동일, `chat_channel` ENUM 유지 |

---

## 3. P4-2: Function Calling

### 도구 정의

| 도구 | 설명 | 채널 |
|------|------|------|
| `generate_chart` | 매장 데이터 기반 차트 생성 (bar/line/pie/heatmap) | 양쪽 |
| `run_simulation` | 고객 동선 시뮬레이션 실행 (6개 시나리오) | OS |

### 시나리오 프리셋

| 시나리오 | 설명 | 고객 배수 |
|----------|------|-----------|
| current | 현재 상태 | 1.0x |
| optimized | 최적화 레이아웃 | 1.0x |
| rush_hour | 러시아워 | 2.5x |
| weekend | 주말 | 1.8x |
| promotion | 프로모션 | 3.0x |
| custom | 커스텀 | 1.0x |

### AI Gateway 통합 위치

`_shared/ai/gateway.ts`의 기존 `tools`/`toolChoice` 파라미터 활용.

---

## 4. P4-3: Frontend URL 전환

| 파일 | 변경 |
|------|------|
| `useAssistant.ts` | `neuraltwin-assistant` → `unified-chatbot` + `X-NeuralTwin-Channel: os` 헤더 |
| `Chat.tsx` | `retail-chatbot` → `unified-chatbot` (3곳) |
| `Auth.tsx` | `retail-chatbot` → `unified-chatbot` (3곳, 세션 인계) |

---

## 5. P4-4: Custom Onboarding Tour

### 3단계 투어

| 단계 | 제목 | 대상 | 설명 |
|------|------|------|------|
| 1 | 인사이트 허브 | 사이드바 네비게이션 | AI 분석 인사이트 + 실시간 방문자 |
| 2 | 디지털트윈 스튜디오 | 사이드바 네비게이션 | 3D 시뮬레이션 + 레이아웃 최적화 |
| 3 | AI 어시스턴트 | 사이드바 토글 버튼 | 매출 조회, 시뮬레이션, 페이지 이동 |

### 구현 파일

| 파일 | 설명 | 라인 |
|------|------|------|
| `src/hooks/useOnboardingTour.ts` | 투어 상태 관리 훅 | 120 |
| `src/components/onboarding/OnboardingOverlay.tsx` | 스포트라이트 오버레이 + 툴팁 | 200 |
| `src/layouts/DashboardLayout.tsx` | data-tour 속성 + 투어 트리거 (수정) | +15 |

### 기술 특징

| 항목 | 스펙 |
|------|------|
| 애니메이션 | framer-motion (이미 설치됨) |
| 저장 | localStorage (`neuraltwin_onboarding_completed`) |
| 자동 시작 | 첫 접속 시 1.5초 후 자동 시작 |
| 키보드 | Escape=건너뛰기, Enter/ArrowRight=다음 |
| 추가 패키지 | 없음 (0 dependencies added) |
| 버전 관리 | `TOUR_VERSION` 상수로 투어 재시작 제어 |

---

## 6. 검증 결과

| 검증 | 결과 |
|------|------|
| `pnpm type-check` (website) | 통과 (0 errors) |
| `pnpm build` (website) | 통과 (20.77s) |

---

## 7. 전체 진행 상태

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | 마이그레이션 인프라 | **완료** |
| Phase 1 | 채팅 랜딩 + 인증 플로우 | **완료** |
| Phase 2 | 디자인 통합 + DashboardLayout | **완료** |
| Phase 3 | AI 챗봇 통합 + IoT 실시간 | **완료** |
| **Phase 4** | **Unified Chatbot + FC + Onboarding** | **완료** |
| Phase 5 | i18n + SEO + QA | 대기 |

---

## 8. 다음 단계 — Phase 5 선행 조건

| 항목 | 상태 | 설명 |
|------|------|------|
| unified-chatbot 배포 | CEO 결정 필요 | neuraltwin-sungshin 브랜치에 EF 배포 |
| 기존 EF 정리 | 배포 후 | retail-chatbot, neuraltwin-assistant 디렉토리 제거 |
| i18n 범위 | CEO 결정 필요 | 어떤 페이지부터? 전체 or 점진적? |
| SEO | CEO 결정 필요 | 메타 태그, OG 태그, sitemap |
| E2E 테스트 | CEO 결정 필요 | Playwright or Cypress |

---

## 9. 파일 트리 (Phase 4 변경)

```
supabase/supabase/functions/
└── unified-chatbot/              ← P4-1 신규 (68 files)
    ├── index.ts
    ├── website/handler.ts + 모듈 (31 files)
    ├── os/handler.ts + 모듈 (33 files)
    └── tools/ (3 files)

apps/website/src/
├── components/
│   ├── assistant/
│   │   └── useAssistant.ts       ← P4-3 수정 (URL + 헤더)
│   └── onboarding/               ← P4-4 신규
│       └── OnboardingOverlay.tsx
├── hooks/
│   └── useOnboardingTour.ts      ← P4-4 신규
├── layouts/
│   └── DashboardLayout.tsx       ← P4-4 수정 (투어 통합)
└── pages/
    ├── Chat.tsx                  ← P4-3 수정 (URL)
    └── Auth.tsx                  ← P4-3 수정 (URL)

docs/reports/
└── PHASE4_COMPLETION.md          ← 이 파일
```
