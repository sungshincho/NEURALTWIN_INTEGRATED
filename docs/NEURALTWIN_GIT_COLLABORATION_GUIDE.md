# NEURALTWIN 듀얼 챗봇 Git 협업 가이드

> **버전**: 1.0
> **작성일**: 2026-02-05
> **프로젝트**: NEURALTWIN Customer Dashboard
> **대상 독자**: 개발자 A(UI/UX), 개발자 B(Web Bot), 개발자 C(OS Bot)

---

## 목차

1. [핵심 원칙](#1-핵심-원칙)
2. [브랜치 전략](#2-브랜치-전략)
3. [파일 소유권 맵](#3-파일-소유권-맵)
4. [A + B 웹사이트 챗봇 동시 작업](#4-a--b-웹사이트-챗봇-동시-작업)
5. [A + C OS 챗봇 동시 작업](#5-a--c-os-챗봇-동시-작업)
6. [인터페이스 계약 기반 병렬 개발](#6-인터페이스-계약-기반-병렬-개발)
7. [PR 워크플로우 & 코드 리뷰](#7-pr-워크플로우--코드-리뷰)
8. [충돌 방지 실전 규칙](#8-충돌-방지-실전-규칙)
9. [일일 동기화 체크리스트](#9-일일-동기화-체크리스트)
10. [부록: 빠른 참조 카드](#부록-빠른-참조-카드)

---

## 1. 핵심 원칙

### 1.1 "같은 레포, 다른 디렉토리, 계약으로 연결"

3명의 개발자가 하나의 레포지토리에서 동시에 작업하면서도 충돌을 최소화하는 핵심 전략입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Customer_Dashboard Repository                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    🟪 공유 계약 레이어 (전원 합의)                      │  │
│  │  src/shared/chat/types/chat.types.ts (신규)                           │  │
│  │  src/features/website-chatbot/types/website.types.ts (신규)           │  │
│  │  src/features/ai-assistant/types/assistant.types.ts (신규)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│            ┌───────────────────────┼───────────────────────┐                │
│            │                       │                       │                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │  🟦 A (UI/UX)   │   │  🟩 B (Web Bot) │   │  🟧 C (OS Bot)  │           │
│  │                 │   │                 │   │                 │           │
│  │ src/shared/     │   │ supabase/       │   │ supabase/       │           │
│  │   chat/         │   │   functions/    │   │   functions/    │           │
│  │   components/   │   │   retail-       │   │   neuraltwin-   │           │
│  │   hooks/        │   │   chatbot/      │   │   assistant/    │           │
│  │                 │   │                 │   │                 │           │
│  │ src/features/   │   │ DB migrations   │   │ _shared/        │           │
│  │   website-      │   │ (chat schema)   │   │   chat utils    │           │
│  │   chatbot/      │   │                 │   │                 │           │
│  │   *.tsx         │   │                 │   │                 │           │
│  │                 │   │                 │   │                 │           │
│  │ src/features/   │   │                 │   │                 │           │
│  │   ai-assistant/ │   │                 │   │                 │           │
│  │   *.tsx         │   │                 │   │                 │           │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    기존 NEURALTWIN 인프라 (수정 금지)                   │  │
│  │  src/features/studio/ (stores/, hooks/, components/)                  │  │
│  │  src/features/insights/, roi/, settings/, simulation/                 │  │
│  │  supabase/functions/ (run-simulation, generate-optimization, etc.)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 세 가지 불변 규칙

| # | 규칙 | 위반 시 |
|:--|:---|:---|
| 1 | **자기 영역 파일만 직접 수정** | 다른 사람 영역 수정 필요 시 → Slack 요청 또는 PR 리뷰 요청 |
| 2 | **계약 파일 변경 시 전원 동의** | `*.types.ts` 파일 수정 전 반드시 Slack 알림 + 10분 대기 |
| 3 | **매일 아침 develop rebase** | 충돌 누적 방지, 오전 10시 전 필수 |

### 1.3 프로젝트 구조 분석 결과

현재 프로젝트 구조 분석을 통해 확인된 핵심 사항:

| # | 항목 | 분석 결과 | 적용 방침 |
|:--|:---|:---|:---|
| 1 | `src/shared/` 존재 여부 | ❌ 없음 | 신규 생성 (`src/shared/chat/`) |
| 2 | features 네이밍 컨벤션 | kebab-case (예: `data-control`, `studio`) | `website-chatbot`, `ai-assistant` 사용 |
| 3 | feature 내부 구조 | components/, hooks/, types/, stores/ 분리 | 동일 패턴 적용 |
| 4 | `_shared/` 존재 여부 | ✅ 있음 (aiResponseLogger.ts, safeJsonParse.ts 등) | 기존 패턴 따라 챗봇 유틸 추가 |
| 5 | EF 구조 패턴 | index.ts 기본, 복잡한 EF는 하위 폴더 분리 | 동일 패턴 적용 |
| 6 | Zustand store 위치 | `src/features/studio/stores/`, `src/store/` | 기존 store 연동, 신규는 feature 내 |
| 7 | 브랜치 전략 | main만 존재, develop 없음 | develop 브랜치 신규 생성 |
| 8 | 커밋 컨벤션 | `feat(category):`, `fix(category):` (한국어) | 기존 패턴 확장 |
| 9 | 라우팅 | App.tsx에서 직접 정의 (react-router) | AVAILABLE_ROUTES 목록 기반 |
| 10 | CODEOWNERS | ❌ 없음 | 신규 생성 |

---

## 2. 브랜치 전략

### 2.1 브랜치 구조

```
main (프로덕션)
 │
 └── develop (통합 브랜치) ← 신규 생성 필요
      │
      ├── feat/a-shared-chat-ui        (A 소유)
      ├── feat/a-website-chatbot-ui    (A 소유)
      ├── feat/a-os-assistant-ui       (A 소유)
      │
      ├── feat/b-retail-chatbot-ef     (B 소유)
      ├── feat/b-chat-db-schema        (B 소유)
      │
      ├── feat/c-assistant-ef          (C 소유)
      └── feat/c-shared-ef-utils       (C 소유)
```

### 2.2 develop 브랜치 생성 (최초 1회)

현재 develop 브랜치가 없으므로 프로젝트 시작 시 생성합니다:

```bash
# main에서 develop 생성
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop

# GitHub에서 develop을 default branch로 설정 (Settings > Branches)
```

### 2.3 브랜치 네이밍 규칙

```
feat/{담당자코드}-{기능설명}

담당자 코드:
  a = 개발자 A (UI/UX)
  b = 개발자 B (Web Bot)
  c = 개발자 C (OS Bot)

예시:
  feat/a-chat-bubble-component
  feat/b-claude-api-integration
  feat/c-intent-classifier
```

### 2.4 머지 흐름

```
feature branch ──(Squash Merge)──► develop ──(Merge Commit)──► main

1. feature → develop: Squash Merge
   - 커밋 히스토리 정리
   - PR 승인 필수 (최소 1명)

2. develop → main: Merge Commit
   - 릴리즈 시점에만 실행
   - CSO 또는 테크 리드 승인 필수
```

### 2.5 브랜치 운영 규칙

| 상황 | 명령어 | 빈도 |
|:---|:---|:---|
| feature 시작 | `git checkout develop && git pull && git checkout -b feat/a-xxx` | 기능 시작 시 |
| 일일 동기화 | `git fetch origin develop && git rebase origin/develop` | 매일 오전 |
| PR 생성 | GitHub에서 feat/xxx → develop PR 생성 | 기능 완료 시 |
| 충돌 해결 | `git rebase origin/develop` 후 conflict 수정 | 필요 시 |

---

## 3. 파일 소유권 맵

### 3.1 소유권 범례

| 색상 | 담당자 | 역할 |
|:---|:---|:---|
| 🟦 | 개발자 A | UI/UX, 프론트엔드 컴포넌트 |
| 🟩 | 개발자 B | 웹사이트 챗봇 백엔드, DB 스키마 |
| 🟧 | 개발자 C | OS 챗봇 백엔드, 공유 EF 유틸 |
| 🟪 | 전원 합의 | 인터페이스 계약, 공유 타입 |
| ⬜ | 기존 코드 | 수정 금지 (필요 시 협의) |

### 3.2 디렉토리 소유권 맵

```
Customer_Dashboard/
├── src/
│   ├── shared/                              🟦🟪 (신규)
│   │   └── chat/
│   │       ├── components/                  🟦 A 전담
│   │       │   ├── ChatBubble.tsx
│   │       │   ├── ChatInput.tsx
│   │       │   ├── TypingIndicator.tsx
│   │       │   ├── SuggestionChips.tsx
│   │       │   ├── FeedbackButtons.tsx
│   │       │   ├── ChatScrollArea.tsx
│   │       │   ├── WelcomeMessage.tsx
│   │       │   └── MarkdownRenderer.tsx
│   │       ├── hooks/                       🟦 A 전담
│   │       │   ├── useStreaming.ts
│   │       │   ├── useChatSession.ts
│   │       │   └── useFeedback.ts
│   │       └── types/
│   │           └── chat.types.ts            🟪 전원 합의
│   │
│   ├── features/
│   │   ├── website-chatbot/                 (신규)
│   │   │   ├── ChatbotWidget.tsx            🟦 A
│   │   │   ├── ChatbotTrigger.tsx           🟦 A
│   │   │   ├── LeadCaptureForm.tsx          🟦 A
│   │   │   ├── hooks/
│   │   │   │   └── useChatbot.ts            🟩 B
│   │   │   └── types/
│   │   │       └── website.types.ts         🟩🟪 B (변경 시 A 알림)
│   │   │
│   │   ├── ai-assistant/                    (신규)
│   │   │   ├── AssistantPanel.tsx           🟦 A
│   │   │   ├── AssistantButton.tsx          🟦 A
│   │   │   ├── components/                  🟦 A
│   │   │   │   ├── InlineChart.tsx
│   │   │   │   ├── ActionButtons.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAssistant.ts          🟧 C
│   │   │   │   └── useActionDispatch.ts     🟧 C
│   │   │   ├── providers/
│   │   │   │   └── AssistantProvider.tsx    🟧 C
│   │   │   └── types/
│   │   │       └── assistant.types.ts       🟧🟪 C (변경 시 A 알림)
│   │   │
│   │   ├── studio/                          ⬜ 기존 (수정 주의)
│   │   │   ├── stores/
│   │   │   │   ├── sceneStore.ts            ⬜ (C가 읽기 전용 참조)
│   │   │   │   └── simulationStore.ts       ⬜ (C가 읽기 전용 참조)
│   │   │   └── ...
│   │   │
│   │   ├── insights/                        ⬜ 기존
│   │   ├── roi/                             ⬜ 기존
│   │   ├── settings/                        ⬜ 기존
│   │   ├── simulation/                      ⬜ 기존
│   │   ├── data-control/                    ⬜ 기존
│   │   ├── data-management/                 ⬜ 기존
│   │   └── onboarding/                      ⬜ 기존
│   │
│   ├── components/                          ⬜ 기존
│   ├── hooks/                               ⬜ 기존
│   ├── store/
│   │   └── dateFilterStore.ts               ⬜ (C가 읽기 전용 참조)
│   ├── types/                               ⬜ 기존
│   └── App.tsx                              ⬜🟦 (A가 챗봇 라우트 추가 시 협의)
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/                         기존 + 신규
│   │   │   ├── aiResponseLogger.ts          ⬜ 기존
│   │   │   ├── safeJsonParse.ts             ⬜ 기존
│   │   │   ├── encryption.ts                ⬜ 기존
│   │   │   ├── calculations/                ⬜ 기존
│   │   │   ├── optimization/                ⬜ 기존
│   │   │   ├── persona/                     ⬜ 기존
│   │   │   ├── vmd/                         ⬜ 기존
│   │   │   │
│   │   │   ├── chatLogger.ts                🟧 C (신규)
│   │   │   ├── streamingResponse.ts         🟧 C (신규)
│   │   │   ├── retailGlossary.ts            🟧 C (신규)
│   │   │   ├── rateLimiter.ts               🟧 C (신규)
│   │   │   ├── errorHandler.ts              🟧 C (신규)
│   │   │   └── chatTypes.ts                 🟧🟪 C (신규, 공유 타입)
│   │   │
│   │   ├── retail-chatbot/                  🟩 B 전담 (신규)
│   │   │   ├── index.ts
│   │   │   ├── prompts/
│   │   │   │   └── retailExpert.ts
│   │   │   ├── salesBridge.ts
│   │   │   ├── painPointExtractor.ts
│   │   │   └── leadCapture.ts
│   │   │
│   │   ├── neuraltwin-assistant/            🟧 C 전담 (신규)
│   │   │   ├── index.ts
│   │   │   ├── intent/
│   │   │   │   ├── classifier.ts
│   │   │   │   ├── entityExtractor.ts
│   │   │   │   └── patterns.ts
│   │   │   ├── actions/
│   │   │   │   ├── queryActions.ts
│   │   │   │   ├── aiActions.ts
│   │   │   │   └── uiActions.ts
│   │   │   ├── orchestrator/
│   │   │   │   └── functionCaller.ts
│   │   │   └── response/
│   │   │       ├── generator.ts
│   │   │       └── suggester.ts
│   │   │
│   │   ├── run-simulation/                  ⬜ 기존 (C가 호출만)
│   │   ├── generate-optimization/           ⬜ 기존 (C가 호출만)
│   │   ├── retail-ai-inference/             ⬜ 기존
│   │   └── ... (기타 기존 EF)
│   │
│   └── migrations/
│       └── YYYYMMDD_chat_schema.sql         🟩🟧 B+C 공동 (신규)
│
├── .github/                                 (신규 생성)
│   ├── CODEOWNERS                           🟪
│   └── pull_request_template.md             🟪
│
├── package.json                             🟪 (의존성 추가 시 협의)
├── tsconfig.json                            ⬜ (수정 금지)
└── vite.config.ts                           ⬜ (수정 금지)
```

### 3.3 CODEOWNERS 파일

`.github/CODEOWNERS` 파일로 PR 시 자동 리뷰어 지정:

```
# NEURALTWIN Dual Chatbot - Code Owners
# 각 영역별 담당자가 자동으로 리뷰어로 지정됩니다.

# ============================================
# 🟪 공유 계약 파일 (전원 승인 필요)
# ============================================
src/shared/chat/types/                    @dev-a @dev-b @dev-c
src/features/website-chatbot/types/       @dev-a @dev-b
src/features/ai-assistant/types/          @dev-a @dev-c
supabase/functions/_shared/chatTypes.ts   @dev-b @dev-c

# ============================================
# 🟦 개발자 A (UI/UX)
# ============================================
src/shared/chat/components/               @dev-a
src/shared/chat/hooks/                    @dev-a
src/features/website-chatbot/*.tsx        @dev-a
src/features/ai-assistant/*.tsx           @dev-a
src/features/ai-assistant/components/     @dev-a

# ============================================
# 🟩 개발자 B (Web Bot)
# ============================================
supabase/functions/retail-chatbot/        @dev-b
src/features/website-chatbot/hooks/       @dev-b

# ============================================
# 🟧 개발자 C (OS Bot)
# ============================================
supabase/functions/neuraltwin-assistant/  @dev-c
supabase/functions/_shared/chatLogger.ts  @dev-c
supabase/functions/_shared/streaming*.ts  @dev-c
supabase/functions/_shared/rateLimiter.ts @dev-c
supabase/functions/_shared/errorHandler.ts @dev-c
supabase/functions/_shared/retailGlossary.ts @dev-c
src/features/ai-assistant/hooks/          @dev-c
src/features/ai-assistant/providers/      @dev-c

# ============================================
# 🟩🟧 B+C 공동 (DB 스키마)
# ============================================
supabase/migrations/*chat*.sql            @dev-b @dev-c

# ============================================
# 🟪 프로젝트 설정 (전원 협의)
# ============================================
package.json                              @dev-a @dev-b @dev-c
.github/                                  @dev-a @dev-b @dev-c
```

---

## 4. A + B 웹사이트 챗봇 동시 작업

### 4.1 경계선 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        웹사이트 챗봇 (NEURAL)                                │
│                                                                             │
│   ┌─────────────────────────────────┐     ┌───────────────────────────────┐ │
│   │     🟦 A 영역 (프론트엔드)       │     │     🟩 B 영역 (백엔드)        │ │
│   │                                 │     │                               │ │
│   │  src/shared/chat/               │     │  supabase/functions/          │ │
│   │    components/                  │     │    retail-chatbot/            │ │
│   │    hooks/useStreaming.ts        │     │      index.ts                 │ │
│   │                                 │     │      prompts/                 │ │
│   │  src/features/website-chatbot/  │     │      salesBridge.ts           │ │
│   │    ChatbotWidget.tsx            │     │      painPointExtractor.ts    │ │
│   │    ChatbotTrigger.tsx           │     │      leadCapture.ts           │ │
│   │    LeadCaptureForm.tsx          │     │                               │ │
│   │                                 │     │  supabase/migrations/         │ │
│   │                                 │     │    chat_schema.sql            │ │
│   └─────────────────────────────────┘     └───────────────────────────────┘ │
│                     │                                   │                   │
│                     │         🟪 계약 레이어            │                   │
│                     │                                   │                   │
│                     ▼                                   ▼                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  src/features/website-chatbot/types/website.types.ts                │   │
│   │  src/features/website-chatbot/hooks/useChatbot.ts  (🟩 B 개발)      │   │
│   │  src/shared/chat/types/chat.types.ts                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 병렬 개발 3단계

```
Phase 0 (Week 1-3)     Phase 1 (Week 4-5)        Phase 2 (Week 6-7)
┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  인터페이스 합의  │   │   Mock 기반 독립 개발  │   │     연동 통합         │
│                  │   │                      │   │                      │
│ A+B:             │   │ A: Mock으로 UI 개발   │   │ A: 실제 API 연결     │
│ - 요청/응답 타입  │──▶│ B: curl로 EF 개발    │──▶│ B: 프롬프트 튜닝     │
│ - SSE 이벤트 포맷│   │                      │   │                      │
│ - 에러 코드      │   │ 서로 코드 안 봄       │   │ E2E 테스트           │
└──────────────────┘   └──────────────────────┘   └──────────────────────┘
```

### 4.3 Mock 기반 독립 개발 코드

#### A가 사용할 Mock Hook

```typescript
// src/features/website-chatbot/hooks/useChatbot.mock.ts
// 🟦 A가 개발 초기에 사용, B의 EF 완성 전까지

import { useState, useCallback } from 'react';
import type { WebChatRequest, WebChatResponse } from '../types/website.types';

const MOCK_RESPONSES: Record<string, Partial<WebChatResponse>> = {
  default: {
    message: '안녕하세요! 리테일 전문 AI NEURAL입니다. 매장 운영에 대해 무엇이든 물어보세요.',
    meta: {
      conversationId: 'mock-conv-001',
      topicCategory: 'greeting',
      sentiment: 'positive',
      solutionMentioned: false,
    },
    suggestions: ['전환율 개선 방법은?', '매장 레이아웃 최적화', '리테일 KPI 벤치마크'],
  },
  conversion: {
    message: `전환율 개선을 위한 핵심 전략을 말씀드릴게요.

1. **동선 최적화**: 입구에서 3m는 감속 구간(Decompression Zone)입니다. 이 구간에는 상품 배치를 피하세요.

2. **골든존 활용**: 시선 높이 ±15cm가 골든존입니다. 주력 상품을 배치하세요.

3. **피크타임 집중**: 방문객이 몰리는 시간대에 스태프 배치를 최적화하세요.

업계 평균 전환율이 패션 리테일 기준 2-4%인데, 매장 상황을 더 알려주시면 맞춤 조언 드릴게요.`,
    meta: {
      conversationId: 'mock-conv-001',
      topicCategory: 'conversion',
      sentiment: 'neutral',
      solutionMentioned: false,
    },
    suggestions: ['우리 매장 전환율이 1.5%인데 괜찮은 건가요?', '피크타임 스태핑 방법'],
  },
  lead: {
    message: '말씀하신 매장 구조라면, 3D 디지털 트윈으로 재배치 효과를 미리 시뮬레이션해볼 수 있어요. 저희가 이런 걸 만들고 있거든요 😊',
    meta: {
      conversationId: 'mock-conv-001',
      topicCategory: 'layout',
      painPoint: '매장 동선 문제',
      sentiment: 'positive',
      solutionMentioned: true,
    },
    suggestions: ['디지털 트윈이 뭔가요?', '정확도가 어느 정도 되나요?'],
    showLeadForm: true,
  },
};

export function useChatbotMock() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const sendMessage = useCallback(async (message: string): Promise<WebChatResponse> => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsStreaming(true);

    // Mock 스트리밍 시뮬레이션 (500ms 딜레이)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 키워드 기반 응답 선택
    let response: Partial<WebChatResponse>;
    if (message.includes('전환율') || message.includes('conversion')) {
      response = MOCK_RESPONSES.conversion;
    } else if (turnCount >= 5 && message.includes('매장') || message.includes('레이아웃')) {
      response = MOCK_RESPONSES.lead;
    } else {
      response = MOCK_RESPONSES.default;
    }

    const fullResponse: WebChatResponse = {
      message: response.message || '',
      meta: response.meta || {
        conversationId: 'mock-conv-001',
        topicCategory: 'general',
        sentiment: 'neutral',
        solutionMentioned: false,
      },
      suggestions: response.suggestions,
      showLeadForm: response.showLeadForm,
    };

    setMessages(prev => [...prev, { role: 'assistant', content: fullResponse.message }]);
    setIsStreaming(false);
    setTurnCount(prev => prev + 1);

    return fullResponse;
  }, [turnCount]);

  return {
    messages,
    isStreaming,
    sendMessage,
    turnCount,
  };
}
```

#### Mock ↔ 실제 API 전환

```typescript
// src/features/website-chatbot/hooks/useChatbot.ts
// 🟩 B가 개발, 환경변수로 Mock/실제 전환

import { useChatbotMock } from './useChatbot.mock';
import { useChatbotReal } from './useChatbot.real';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CHATBOT === 'true';

export function useChatbot() {
  if (USE_MOCK) {
    return useChatbotMock();
  }
  return useChatbotReal();
}

// .env.development
// VITE_USE_MOCK_CHATBOT=true

// .env.production
// VITE_USE_MOCK_CHATBOT=false
```

#### B가 EF 테스트하는 curl 명령어

```bash
# 로컬 Supabase에서 테스트
# 1. Supabase 로컬 시작
supabase start

# 2. anon key 확인
supabase status

# 3. retail-chatbot 호출
curl -X POST "http://localhost:54321/functions/v1/retail-chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "매장 전환율 개선 방법 알려줘",
    "sessionId": "test-session-001",
    "turnCount": 1
  }'

# 4. SSE 스트리밍 테스트
curl -N -X POST "http://localhost:54321/functions/v1/retail-chatbot" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "안녕", "sessionId": "test-001", "turnCount": 1}'

# 5. 리드 캡처 테스트
curl -X POST "http://localhost:54321/functions/v1/retail-chatbot/lead" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-001",
    "email": "test@retail.co.kr",
    "company": "테스트 리테일",
    "painPoints": ["전환율 개선", "동선 최적화"]
  }'
```

### 4.4 SSE 스트리밍 이벤트 계약서

B가 전송하고 A가 파싱하는 SSE 이벤트 포맷:

```typescript
// src/features/website-chatbot/types/website.types.ts
// 🟪 A+B 합의 필요

// SSE 이벤트 타입
export type SSEEventType =
  | 'start'      // 스트리밍 시작
  | 'chunk'      // 텍스트 청크
  | 'meta'       // 메타데이터 (토픽, 감정 등)
  | 'suggestion' // 추천 질문
  | 'end';       // 스트리밍 종료

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

// 각 이벤트별 데이터 형식
export interface SSEStartEvent {
  type: 'start';
  data: { conversationId: string };
}

export interface SSEChunkEvent {
  type: 'chunk';
  data: { text: string };
}

export interface SSEMetaEvent {
  type: 'meta';
  data: {
    topicCategory: string;
    painPoint?: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    solutionMentioned: boolean;
  };
}

export interface SSESuggestionEvent {
  type: 'suggestion';
  data: { suggestions: string[] };
}

export interface SSEEndEvent {
  type: 'end';
  data: {
    showLeadForm?: boolean;
    totalTokens?: number;
  };
}
```

**SSE 메시지 형식 (B가 전송):**

```
event: start
data: {"conversationId":"conv-abc123"}

event: chunk
data: {"text":"안녕하세요! "}

event: chunk
data: {"text":"리테일 전문 AI "}

event: chunk
data: {"text":"NEURAL입니다."}

event: meta
data: {"topicCategory":"greeting","sentiment":"positive","solutionMentioned":false}

event: suggestion
data: {"suggestions":["전환율 개선 방법은?","매장 레이아웃 최적화"]}

event: end
data: {"showLeadForm":false,"totalTokens":150}
```

### 4.5 A+B 충돌 발생 가능 지점

| # | 충돌 지점 | 원인 | 해결 방법 |
|:--|:---|:---|:---|
| 1 | `website.types.ts` | A가 UI용 필드 추가, B가 API용 필드 추가 | Slack 알림 후 한 명만 수정, 다른 한 명은 rebase |
| 2 | `useChatbot.ts` | A가 UI 로직 추가, B가 API 로직 추가 | B가 소유권, A는 mock만 수정 |
| 3 | `package.json` | A가 UI 라이브러리 추가, B가 API 라이브러리 추가 | 동시에 추가 안 함, 순차적 PR |
| 4 | SSE 파싱 로직 | 이벤트 포맷 변경 시 양쪽 불일치 | 계약 파일 먼저 수정, 10분 대기 후 각자 수정 |

### 4.6 A+B 연동 체크포인트 (Week 4~7)

| 주차 | 요일 | 시간 | 체크 항목 |
|:--|:---|:---|:---|
| Week 4 | 화 | 14:00 | Mock → 실제 API 전환 테스트 |
| Week 4 | 금 | 14:00 | SSE 스트리밍 파싱 검증 |
| Week 5 | 화 | 14:00 | 리드 캡처 폼 연동 테스트 |
| Week 5 | 금 | 14:00 | 에러 핸들링 + 로딩 상태 |
| Week 6 | 화 | 14:00 | 세일즈 브릿지 트리거 테스트 |
| Week 6 | 금 | 14:00 | Pain Point 추출 검증 |
| Week 7 | 화 | 14:00 | 전체 시나리오 E2E |
| Week 7 | 금 | 14:00 | 최종 QA + 버그 수정 |

---

## 5. A + C OS 챗봇 동시 작업

### 5.1 경계선 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OS 챗봇 (AI Assistant)                               │
│                                                                             │
│   ┌─────────────────────────────────┐     ┌───────────────────────────────┐ │
│   │     🟦 A 영역 (프론트엔드)       │     │     🟧 C 영역 (백엔드)        │ │
│   │                                 │     │                               │ │
│   │  src/shared/chat/               │     │  supabase/functions/          │ │
│   │    components/                  │     │    neuraltwin-assistant/      │ │
│   │    hooks/useStreaming.ts        │     │      index.ts                 │ │
│   │                                 │     │      intent/                  │ │
│   │  src/features/ai-assistant/     │     │      actions/                 │ │
│   │    AssistantPanel.tsx           │     │      orchestrator/            │ │
│   │    AssistantButton.tsx          │     │      response/                │ │
│   │    components/                  │     │                               │ │
│   │      InlineChart.tsx            │     │  supabase/functions/_shared/  │ │
│   │      ActionButtons.tsx          │     │    chatLogger.ts              │ │
│   │      QuickActions.tsx           │     │    streamingResponse.ts       │ │
│   │                                 │     │    rateLimiter.ts             │ │
│   └─────────────────────────────────┘     └───────────────────────────────┘ │
│                     │                                   │                   │
│                     │         🟪 계약 레이어            │                   │
│                     │                                   │                   │
│                     ▼                                   ▼                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  src/features/ai-assistant/types/assistant.types.ts                 │   │
│   │  src/features/ai-assistant/hooks/useAssistant.ts      (🟧 C 개발)   │   │
│   │  src/features/ai-assistant/hooks/useActionDispatch.ts (🟧 C 개발)   │   │
│   │  src/features/ai-assistant/providers/AssistantProvider.tsx (🟧 C)   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                     ▼ UIAction 실행                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  기존 시스템 연동 (읽기 전용 참조)                                    │   │
│   │  src/features/studio/stores/sceneStore.ts                           │   │
│   │  src/features/studio/stores/simulationStore.ts                      │   │
│   │  src/store/dateFilterStore.ts                                       │   │
│   │  react-router (navigate)                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 A+C의 특수 과제: UIAction 연결

OS 챗봇은 웹사이트 챗봇과 달리 **AI 응답이 실제 UI를 제어**해야 합니다.

```
C의 EF가 반환하는 응답:
{
  "message": "크리스마스 시뮬레이션을 실행할게요.",
  "actions": [
    { "type": "navigate", "target": "/studio" },
    { "type": "run_simulation", "options": { "scenario": "christmas" } }
  ]
}
        │
        ▼
A의 UI가 actions 배열을 받아 각각 실행
        │
        ├── navigate("/studio") → react-router useNavigate()
        └── run_simulation() → simulationStore.runSimulation()
```

### 5.3 UIAction 인터페이스 계약서

```typescript
// src/features/ai-assistant/types/assistant.types.ts
// 🟪 A+C 합의 필요

// ============================================
// UIAction 타입 정의
// ============================================

export type UIAction =
  | NavigateAction
  | ToggleLayerAction
  | SelectZoneAction
  | RunSimulationAction
  | RunOptimizationAction
  | UpdateDateRangeAction
  | CameraMoveAction;

// 페이지 이동
export interface NavigateAction {
  type: 'navigate';
  target: AvailableRoute;
  params?: Record<string, string>;
}

// 레이어 토글 (sceneStore.toggleOverlay 연결)
export interface ToggleLayerAction {
  type: 'toggle_layer';
  layerId: string;
  visible: boolean;
}

// 존 선택 (sceneStore.select 연결)
export interface SelectZoneAction {
  type: 'select_zone';
  zoneId: string;
}

// 시뮬레이션 실행 (simulationStore.runSimulation 연결)
export interface RunSimulationAction {
  type: 'run_simulation';
  options: {
    scenario?: string;
    dateRange?: { start: string; end: string };
  };
}

// 최적화 실행 (generate-optimization EF 호출)
export interface RunOptimizationAction {
  type: 'run_optimization';
  options: {
    type: 'furniture' | 'product' | 'staffing';
  };
}

// 날짜 범위 변경 (dateFilterStore.setCustomRange 연결)
export interface UpdateDateRangeAction {
  type: 'update_date_range';
  start: string;
  end: string;
}

// 카메라 이동 (sceneStore.setCamera 연결)
export interface CameraMoveAction {
  type: 'camera_move';
  target: { x: number; y: number; z: number };
}

// ============================================
// 사용 가능한 라우트 (실제 App.tsx 기반)
// ============================================

export type AvailableRoute =
  | '/'
  | '/insights'
  | '/studio'
  | '/roi'
  | '/settings'
  | '/data/control-tower'
  | '/data/lineage'
  | `/data/connectors/${string}`;

export const AVAILABLE_ROUTES: Record<string, string> = {
  home: '/',
  insights: '/insights',
  studio: '/studio',
  roi: '/roi',
  settings: '/settings',
  dataControlTower: '/data/control-tower',
  dataLineage: '/data/lineage',
};
```

### 5.4 useActionDispatch 구현

실제 Zustand store 분석 결과 기반 구현:

```typescript
// src/features/ai-assistant/hooks/useActionDispatch.ts
// 🟧 C가 개발

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSceneStore } from '@/features/studio/stores/sceneStore';
import { useSimulationStore } from '@/features/studio/stores/simulationStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { supabase } from '@/integrations/supabase/client';
import type { UIAction } from '../types/assistant.types';

export function useActionDispatch() {
  const navigate = useNavigate();

  // 기존 Zustand store 참조
  // sceneStore에서 사용 가능한 액션들:
  // - setMode, select, hover, toggleLayerVisibility, toggleOverlay
  // - setCamera, focusOnModel, applySimulationResults
  const sceneStore = useSceneStore();

  // simulationStore에서 사용 가능한 액션들:
  // - setOptions, runSimulation, reset
  const simulationStore = useSimulationStore();

  // dateFilterStore에서 사용 가능한 액션들:
  // - setDateRange, setPreset, setCustomRange
  const dateFilterStore = useDateFilterStore();

  const dispatch = useCallback(async (action: UIAction): Promise<boolean> => {
    try {
      switch (action.type) {
        case 'navigate':
          navigate(action.target);
          return true;

        case 'toggle_layer':
          // sceneStore.toggleOverlay 사용
          sceneStore.toggleOverlay(action.layerId);
          return true;

        case 'select_zone':
          // sceneStore.select 사용
          sceneStore.select(action.zoneId);
          // 카메라 포커스도 함께
          sceneStore.focusOnModel(action.zoneId);
          return true;

        case 'run_simulation':
          // 옵션 설정 후 시뮬레이션 실행
          if (action.options.scenario) {
            simulationStore.setOptions({
              simulation_type: 'predictive',
              // 시나리오에 따른 환경 컨텍스트 설정
              environment_context: {
                scenario: action.options.scenario,
              },
            });
          }
          // 실제 시뮬레이션 실행은 storeId 필요
          // TODO: 현재 선택된 store ID를 context에서 가져와야 함
          return true;

        case 'run_optimization':
          // generate-optimization EF 호출
          const { data, error } = await supabase.functions.invoke('generate-optimization', {
            body: {
              optimization_type: action.options.type,
              // TODO: storeId, 추가 옵션
            },
          });
          if (error) throw error;
          return true;

        case 'update_date_range':
          dateFilterStore.setCustomRange(action.start, action.end);
          return true;

        case 'camera_move':
          sceneStore.setCamera({
            target: action.target,
            position: {
              x: action.target.x + 10,
              y: action.target.y + 10,
              z: action.target.z + 15,
            },
          });
          return true;

        default:
          console.warn('Unknown action type:', action);
          return false;
      }
    } catch (error) {
      console.error('Action dispatch failed:', action, error);
      return false;
    }
  }, [navigate, sceneStore, simulationStore, dateFilterStore]);

  // 배열의 모든 액션을 순차 실행
  const dispatchAll = useCallback(async (actions: UIAction[]): Promise<boolean[]> => {
    const results: boolean[] = [];
    for (const action of actions) {
      const result = await dispatch(action);
      results.push(result);
      // 각 액션 사이에 약간의 딜레이 (UI 업데이트 시간)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }, [dispatch]);

  return { dispatch, dispatchAll };
}
```

### 5.5 AssistantProvider 구현

```typescript
// src/features/ai-assistant/providers/AssistantProvider.tsx
// 🟧 C가 개발 - 현재 컨텍스트 수집

import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSceneStore } from '@/features/studio/stores/sceneStore';
import { useSimulationStore } from '@/features/studio/stores/simulationStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { OSAssistantRequest } from '../types/assistant.types';

interface AssistantContextValue {
  getContext: () => OSAssistantRequest['context'];
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const sceneStore = useSceneStore();
  const simulationStore = useSimulationStore();
  const dateFilterStore = useDateFilterStore();
  const { selectedStore } = useSelectedStore();

  const getContext = useMemo(() => (): OSAssistantRequest['context'] => {
    // 현재 페이지 파악
    const pathname = location.pathname;
    let currentPage: string;
    let currentTab: string | undefined;

    if (pathname === '/' || pathname === '/insights') {
      currentPage = 'insight-hub';
      // URL params에서 tab 추출
      const params = new URLSearchParams(location.search);
      currentTab = params.get('tab') || undefined;
    } else if (pathname === '/studio') {
      currentPage = 'studio';
    } else if (pathname === '/roi') {
      currentPage = 'roi-measurement';
    } else if (pathname === '/settings') {
      currentPage = 'settings';
    } else {
      currentPage = 'other';
    }

    // 선택된 항목 (Studio 전용)
    const selection = currentPage === 'studio' ? {
      zoneIds: sceneStore.selectedId ? [sceneStore.selectedId] : undefined,
      furnitureIds: sceneStore.models
        .filter(m => m.type === 'furniture' && sceneStore.selectedId === m.id)
        .map(m => m.id),
    } : undefined;

    // 날짜 범위
    const dateRange = {
      start: dateFilterStore.dateRange.startDate,
      end: dateFilterStore.dateRange.endDate,
    };

    // 최근 결과
    const recentResults = {
      hasSimulation: simulationStore.result !== null,
      hasOptimization: false, // TODO: 최적화 결과 저장 시 업데이트
    };

    return {
      page: {
        current: currentPage,
        tab: currentTab,
      },
      selection,
      dateRange,
      store: {
        id: selectedStore?.id || '',
        name: selectedStore?.name || '',
      },
      recentResults,
    };
  }, [location, sceneStore, simulationStore, dateFilterStore, selectedStore]);

  return (
    <AssistantContext.Provider value={{ getContext }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within AssistantProvider');
  }
  return context;
}
```

### 5.6 A가 사용할 Mock Provider

```typescript
// src/features/ai-assistant/hooks/useAssistant.mock.ts
// 🟦 A가 개발 초기에 사용

import { useState, useCallback } from 'react';
import type { OSAssistantRequest, OSAssistantResponse, UIAction } from '../types/assistant.types';

// 3가지 시나리오 Mock
const MOCK_SCENARIOS: Record<string, OSAssistantResponse> = {
  // 시나리오 1: KPI 조회
  kpi: {
    message: {
      content: `오늘 매장 현황을 알려드릴게요.

📊 **주요 KPI (오늘 기준)**
- 방문객: 1,234명 (전일 대비 +8%)
- 매출: ₩12,500,000 (전일 대비 +12%)
- 전환율: 3.2% (업계 평균 대비 양호)
- 평균 체류시간: 18분`,
      format: 'markdown',
    },
    data: {
      type: 'kpi',
      payload: {
        visitors: 1234,
        revenue: 12500000,
        conversionRate: 3.2,
        avgDwellTime: 18,
      },
    },
    visualization: {
      type: 'mini-chart',
      config: {
        chartType: 'bar',
        data: [
          { label: '어제', value: 1142 },
          { label: '오늘', value: 1234 },
        ],
      },
    },
    suggestions: ['시간대별 상세 보기', '어제와 비교', '주간 트렌드'],
    meta: {
      conversationId: 'mock-os-001',
      intent: 'query_kpi',
      confidence: 0.95,
      executionTime: 234,
    },
  },

  // 시나리오 2: 시뮬레이션 실행
  simulation: {
    message: {
      content: '크리스마스 시뮬레이션을 실행할게요. 스튜디오 페이지로 이동합니다.',
      format: 'text',
    },
    actions: [
      { type: 'navigate', target: '/studio' },
      { type: 'run_simulation', options: { scenario: 'christmas' } },
    ] as UIAction[],
    suggestions: ['시뮬레이션 결과 설명해줘', '다른 시나리오 실행'],
    meta: {
      conversationId: 'mock-os-001',
      intent: 'run_simulation',
      confidence: 0.92,
      executionTime: 456,
    },
  },

  // 시나리오 3: 존 분석
  zone: {
    message: {
      content: `입구 존 분석 결과입니다.

🚶 **입구 존 (A1)**
- 일 평균 통과 인원: 892명
- 평균 체류시간: 45초 (정상 범위)
- 전환율: 2.1% (개선 필요)

💡 **제안**: 입구 존은 "감속 구간"입니다. 현재 배치된 프로모션 테이블을 3m 안쪽으로 이동하면 전환율 개선이 기대됩니다.`,
      format: 'markdown',
    },
    actions: [
      { type: 'select_zone', zoneId: 'zone-entrance-a1' },
      { type: 'camera_move', target: { x: 0, y: 2, z: 5 } },
    ] as UIAction[],
    data: {
      type: 'chart',
      payload: {
        chartType: 'funnel',
        data: [
          { stage: '통과', value: 892 },
          { stage: '멈춤', value: 234 },
          { stage: '구매', value: 19 },
        ],
      },
    },
    suggestions: ['가구 배치 최적화 해줘', '다른 존 분석'],
    meta: {
      conversationId: 'mock-os-001',
      intent: 'query_zone',
      confidence: 0.88,
      executionTime: 567,
    },
  },
};

export function useAssistantMock() {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    actions?: UIAction[];
    data?: OSAssistantResponse['data'];
    visualization?: OSAssistantResponse['visualization'];
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    message: string,
    context: OSAssistantRequest['context']
  ): Promise<OSAssistantResponse> => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    // 키워드 기반 시나리오 선택
    let response: OSAssistantResponse;
    if (message.includes('매출') || message.includes('KPI') || message.includes('현황')) {
      response = MOCK_SCENARIOS.kpi;
    } else if (message.includes('시뮬레이션') || message.includes('크리스마스')) {
      response = MOCK_SCENARIOS.simulation;
    } else if (message.includes('존') || message.includes('입구') || message.includes('분석')) {
      response = MOCK_SCENARIOS.zone;
    } else {
      response = MOCK_SCENARIOS.kpi; // 기본
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.message.content,
      actions: response.actions,
      data: response.data,
      visualization: response.visualization,
    }]);
    setIsLoading(false);

    return response;
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
```

### 5.7 C가 EF 테스트하는 curl 명령어

```bash
# JWT 토큰 획득 (Supabase Auth)
TOKEN=$(curl -s -X POST "http://localhost:54321/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}' \
  | jq -r '.access_token')

# neuraltwin-assistant 호출 (KPI 조회)
curl -X POST "http://localhost:54321/functions/v1/neuraltwin-assistant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "오늘 매출 얼마야?",
    "context": {
      "page": { "current": "insight-hub" },
      "dateRange": { "start": "2026-02-05", "end": "2026-02-05" },
      "store": { "id": "store-001", "name": "강남점" }
    }
  }'

# 시뮬레이션 실행 요청
curl -X POST "http://localhost:54321/functions/v1/neuraltwin-assistant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "크리스마스 시뮬레이션 돌려줘",
    "context": {
      "page": { "current": "studio" },
      "store": { "id": "store-001", "name": "강남점" },
      "recentResults": { "hasSimulation": false, "hasOptimization": false }
    }
  }'

# 존 분석 요청 (선택된 존 포함)
curl -X POST "http://localhost:54321/functions/v1/neuraltwin-assistant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "이 존 성과 어때?",
    "context": {
      "page": { "current": "studio" },
      "selection": { "zoneIds": ["zone-entrance-a1"] },
      "store": { "id": "store-001", "name": "강남점" }
    }
  }'
```

### 5.8 A+C 충돌 발생 가능 지점

| # | 충돌 지점 | 원인 | 해결 방법 |
|:--|:---|:---|:---|
| 1 | `assistant.types.ts` | A가 UI 렌더링용 필드 추가, C가 액션 타입 추가 | UIAction 추가 시 반드시 순서 프로토콜 준수 |
| 2 | `useActionDispatch.ts` | A가 UI 로직 수정, C가 액션 매핑 수정 | C가 소유권, A는 읽기 전용 |
| 3 | 기존 store 연동 | C가 sceneStore 액션 호출 방식 변경 | 기존 store 수정 금지, 신규 wrapper만 작성 |
| 4 | ActionButtons 렌더링 | 새 액션 타입 추가 시 UI 미구현 | A+C 동시 작업, 페어 세션 |

### 5.9 UIAction 추가 시 순서 강제 프로토콜

새로운 UIAction을 추가할 때는 반드시 아래 순서를 따릅니다:

```
Step 1: C가 Slack에 "새 UIAction 추가 예정" 알림
        └── 액션 이름, 용도, 파라미터 설명

Step 2: A가 확인 응답 (최대 2시간 내)
        └── "확인", "질문 있음", "반대"

Step 3: C가 assistant.types.ts에 타입 추가 + 커밋
        └── 커밋 메시지: "contract(os): UIAction 타입 추가 - {액션명}"

Step 4: A가 rebase 후 ActionButtons.tsx 렌더링 추가
        └── 커밋 메시지: "feat(os-ui): {액션명} 버튼 렌더링"

Step 5: C가 useActionDispatch.ts에 구현 추가
        └── 커밋 메시지: "feat(os-ef): {액션명} 디스패치 구현"

Step 6: A+C 페어 테스트 (화면 공유)
```

### 5.10 A+C 연동 체크포인트 (Week 7~10)

| 주차 | 요일 | 시간 | 체크 항목 |
|:--|:---|:---|:---|
| Week 7 | 화 | 14:00 | Mock → 실제 API 전환 테스트 |
| Week 7 | 금 | 14:00 | 기본 인텐트 분류 검증 (KPI, 네비게이션) |
| Week 8 | 화 | 14:00 | UIAction 실행 테스트 (navigate, select_zone) |
| Week 8 | 금 | 14:00 | 시뮬레이션 연동 테스트 |
| Week 9 | 화 | 14:00 | 최적화 연동 테스트 |
| Week 9 | 금 | 14:00 | 컨텍스트 수집 검증 |
| Week 10 | 화 | 14:00 | 전체 시나리오 E2E |
| Week 10 | 금 | 14:00 | 최종 QA + 버그 수정 |

---

## 6. 인터페이스 계약 기반 병렬 개발

### 6.1 계약 파일 목록 및 Lock 규칙

| # | 파일 | 소유권 | Lock 규칙 |
|:--|:---|:---|:---|
| 1 | `src/shared/chat/types/chat.types.ts` | 🟪 전원 | 변경 시 Slack 알림 + 전원 동의 |
| 2 | `src/features/website-chatbot/types/website.types.ts` | 🟩🟪 B+A | B가 변경, A에게 알림 필수 |
| 3 | `src/features/ai-assistant/types/assistant.types.ts` | 🟧🟪 C+A | C가 변경, A에게 알림 필수 |

### 6.2 계약 변경 프로토콜

```
┌─────────────────────────────────────────────────────────────────┐
│                    계약 변경 프로토콜                            │
│                                                                 │
│  1. Slack 알림 (변경자)                                         │
│     └── 채널: #chatbot-dev                                      │
│     └── 메시지: "⚠️ 계약 변경: {파일명}\n변경 내용: {상세}"      │
│                                                                 │
│  2. 대기 (10분)                                                 │
│     └── 반대 의견 없으면 진행                                    │
│     └── 반대 있으면 논의 후 결정                                 │
│                                                                 │
│  3. 커밋 (변경자)                                               │
│     └── 브랜치: 본인 feature 브랜치                              │
│     └── 메시지: "contract({영역}): {변경 내용 요약}"             │
│                                                                 │
│  4. 알림 (변경자)                                               │
│     └── "✅ 계약 변경 완료, rebase 해주세요"                     │
│                                                                 │
│  5. 각자 수정 (영향 받는 사람)                                   │
│     └── rebase 후 본인 코드 수정                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 SSE 스트리밍 이벤트 계약 (웹 챗봇 전용)

```typescript
// B가 전송 → A가 파싱

// 1. start - 스트리밍 시작
event: start
data: { "conversationId": "string" }

// 2. chunk - 텍스트 청크 (연속 전송)
event: chunk
data: { "text": "string" }

// 3. meta - 응답 메타데이터 (스트리밍 중간 또는 종료 직전)
event: meta
data: {
  "topicCategory": "string",
  "painPoint": "string | null",
  "sentiment": "positive | neutral | negative",
  "solutionMentioned": "boolean"
}

// 4. suggestion - 추천 질문 (종료 직전)
event: suggestion
data: { "suggestions": ["string", "string", "string"] }

// 5. end - 스트리밍 종료
event: end
data: {
  "showLeadForm": "boolean",
  "totalTokens": "number"
}

// 에러 발생 시
event: error
data: {
  "code": "string",
  "message": "string"
}
```

---

## 7. PR 워크플로우 & 코드 리뷰

### 7.1 PR 템플릿

`.github/pull_request_template.md`:

```markdown
## 변경 유형

<!-- 해당하는 항목에 x 표시 -->

- [ ] 🟦 UI/UX (프론트엔드 컴포넌트, 스타일)
- [ ] 🟩 Web Bot (웹사이트 챗봇 백엔드)
- [ ] 🟧 OS Bot (OS 챗봇 백엔드)
- [ ] 🟪 공유/계약 (타입, 스키마, 유틸)

## 변경 내용

<!-- 무엇을 변경했는지 간단히 설명 -->



## 인터페이스 변경 여부

<!-- 계약 파일을 수정했나요? -->

- [ ] 예 - `chat.types.ts` 수정
- [ ] 예 - `website.types.ts` 수정
- [ ] 예 - `assistant.types.ts` 수정
- [ ] 예 - DB 스키마 수정
- [ ] 아니오

## 테스트 체크리스트

<!-- 수행한 테스트 -->

- [ ] 로컬에서 기능 동작 확인
- [ ] 타입 에러 없음 (`npm run typecheck`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] (EF) curl로 테스트 완료
- [ ] (UI) 브라우저에서 확인

## 스크린샷 / 로그

<!-- UI 변경 시 스크린샷, EF 변경 시 응답 예시 -->



## 관련 이슈

<!-- 관련 이슈 번호 -->

Closes #

## 리뷰어 요청

<!-- CODEOWNERS 기반 자동 지정, 추가 요청 시 멘션 -->

```

### 7.2 리뷰 매트릭스

| 변경 영역 | 필수 리뷰어 | 최소 승인 |
|:---|:---|:---|
| 🟦 UI/UX | A 본인 확인 | 0명 (본인 영역) |
| 🟩 Web Bot | B 본인 확인 | 0명 (본인 영역) |
| 🟧 OS Bot | C 본인 확인 | 0명 (본인 영역) |
| 🟪 공유 타입 | 영향 받는 전원 | 1명 이상 |
| 🟪 DB 스키마 | B + C | 2명 |
| 🟪 프로젝트 설정 | 전원 | 2명 |

### 7.3 긴급 Hotfix 프로세스

```
┌─────────────────────────────────────────────────────────────────┐
│                    긴급 Hotfix 프로세스                          │
│                                                                 │
│  조건: 프로덕션 장애 발생 시에만                                  │
│                                                                 │
│  1. Slack @channel 알림                                         │
│     └── "🚨 Hotfix 필요: {증상}"                                │
│                                                                 │
│  2. main에서 직접 브랜치                                         │
│     └── git checkout main && git checkout -b hotfix/{증상}       │
│                                                                 │
│  3. 수정 + 테스트 + PR                                          │
│     └── PR 타겟: main (develop 아님)                            │
│     └── 리뷰: 1명 이상 즉시 승인                                  │
│                                                                 │
│  4. main 머지 후 develop에도 반영                                │
│     └── git checkout develop && git merge main                   │
│                                                                 │
│  5. 사후 보고                                                    │
│     └── 다음 스탠드업에서 공유                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 충돌 방지 실전 규칙

### 8.1 동시 수정 위험이 높은 파일 목록

실제 프로젝트 분석 결과 기반:

| # | 파일 | 위험도 | 충돌 상황 | 해결 방법 |
|:--|:---|:---|:---|:---|
| 1 | `package.json` | 🔴 높음 | 3명이 각자 의존성 추가 | 순차적 PR, 동시에 추가 안 함 |
| 2 | `src/App.tsx` | 🟡 중간 | A가 챗봇 위젯 추가 시 | A만 수정, 라우트는 기존 패턴 따름 |
| 3 | `tsconfig.json` | 🟢 낮음 | 일반적으로 수정 없음 | 수정 금지 |
| 4 | `vite.config.ts` | 🟢 낮음 | 일반적으로 수정 없음 | 수정 금지 |
| 5 | `supabase/config.toml` | 🟡 중간 | B, C가 EF 설정 추가 | 순차적 PR |
| 6 | `src/integrations/supabase/types.ts` | 🟡 중간 | DB 스키마 변경 시 자동 생성 | B+C 협의 후 한 명만 생성 |
| 7 | 계약 타입 파일들 | 🔴 높음 | 인터페이스 변경 | 계약 변경 프로토콜 준수 |

### 8.2 Git Pull 리듬

```bash
# 매일 아침 (오전 10시 전)
git fetch origin develop
git rebase origin/develop

# 충돌 발생 시
git status  # 충돌 파일 확인
# 충돌 해결 후
git add .
git rebase --continue

# 심한 충돌 시 (10개 이상 파일)
git rebase --abort  # 중단
# Slack에서 해당 파일 소유자와 협의
```

### 8.3 커밋 메시지 컨벤션

기존 프로젝트의 `feat(category):`, `fix(category):` 패턴을 확장:

```
# 형식
{type}({scope}): {description}

# type
feat     새 기능
fix      버그 수정
docs     문서
style    포맷팅
refactor 리팩토링
test     테스트
chore    빌드/설정

# scope (신규 추가)
shared   공유 Chat UI Kit
web-ui   웹사이트 챗봇 UI
web-ef   웹사이트 챗봇 EF
os-ui    OS 챗봇 UI
os-ef    OS 챗봇 EF
contract 인터페이스 계약
schema   DB 스키마

# 예시
feat(shared): ChatBubble 컴포넌트 구현
feat(web-ui): ChatbotWidget 플로팅 위젯 추가
feat(web-ef): Claude API 연동 및 시스템 프롬프트 구현
feat(os-ui): AssistantPanel 사이드 패널 추가
feat(os-ef): 인텐트 분류기 패턴 매칭 구현
contract(web): SSE 이벤트 타입 추가
contract(os): UIAction 타입 추가 - CameraMoveAction
schema: chat_conversations, chat_messages 테이블 추가
fix(os-ef): 인텐트 분류 confidence 계산 오류 수정
```

---

## 9. 일일 동기화 체크리스트

### 9.1 매일 아침 스탠드업 (15분)

```
시간: 매일 오전 10:00
형식: Slack 스레드 또는 15분 콜

각자 공유 (2분씩):
1. 어제 완료한 것
2. 오늘 할 것
3. 블로커 (있으면)

전체 논의 (5분):
- 인터페이스 변경 예정 사항
- 연동 테스트 필요 여부
- 기타 협의
```

### 9.2 A+B 연동 체크포인트 (Week 4~7)

| 체크포인트 | 확인 항목 | 담당 |
|:---|:---|:---|
| Week 4 화 | Mock → 실제 API 전환, 응답 형식 | A 주도 |
| Week 4 금 | SSE 스트리밍 파싱, 청크 조합 | A+B 공동 |
| Week 5 화 | 리드 캡처 폼 표시/제출 | A 주도 |
| Week 5 금 | 에러 핸들링, 재시도 로직 | B 주도 |
| Week 6 화 | 세일즈 브릿지 트리거 (턴 기반) | B 주도 |
| Week 6 금 | Pain Point 추출 결과 검증 | B 주도 |
| Week 7 화 | 전체 시나리오 E2E | A+B 공동 |
| Week 7 금 | 최종 QA, 버그 수정 | A+B 공동 |

### 9.3 A+C 연동 체크포인트 (Week 7~10)

| 체크포인트 | 확인 항목 | 담당 |
|:---|:---|:---|
| Week 7 화 | Mock → 실제 API 전환, 응답 형식 | A 주도 |
| Week 7 금 | 기본 인텐트 분류 (KPI, 네비게이션) | C 주도 |
| Week 8 화 | UIAction 실행 (navigate, select_zone) | A+C 공동 |
| Week 8 금 | 시뮬레이션 연동 (run_simulation) | C 주도 |
| Week 9 화 | 최적화 연동 (run_optimization) | C 주도 |
| Week 9 금 | 컨텍스트 수집 (AssistantProvider) | C 주도 |
| Week 10 화 | 전체 시나리오 E2E | A+C 공동 |
| Week 10 금 | 최종 QA, 버그 수정 | A+C 공동 |

### 9.4 주간 금요일 통합 리뷰 (1시간)

```
시간: 매주 금요일 16:00
참석: 전원 (A, B, C)

아젠다:
1. 데모 (각 15분)
   - 이번 주 구현 기능 시연
   - 다음 주 계획 공유

2. 인터페이스 리뷰 (10분)
   - 계약 변경 사항 정리
   - 다음 주 변경 예고

3. 이슈 논의 (10분)
   - 해결 안 된 블로커
   - 기술 부채

4. 다음 주 계획 (10분)
   - 마일스톤 점검
   - 우선순위 조정
```

---

## 부록: 빠른 참조 카드

### A+B 웹사이트 챗봇 한눈에 보기

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    A + B 웹사이트 챗봇 협업                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟦 A (UI/UX) 영역                    🟩 B (Web Bot) 영역               │
│  ─────────────────────                ─────────────────────             │
│  src/shared/chat/                     supabase/functions/               │
│    components/                          retail-chatbot/                 │
│    hooks/useStreaming.ts                index.ts                        │
│                                         prompts/                        │
│  src/features/website-chatbot/          salesBridge.ts                  │
│    ChatbotWidget.tsx                    painPointExtractor.ts           │
│    ChatbotTrigger.tsx                   leadCapture.ts                  │
│    LeadCaptureForm.tsx                                                  │
│                                       supabase/migrations/              │
│                                         chat_schema.sql                 │
│                                                                         │
│  🟪 공유 계약                                                           │
│  ─────────────────────                                                  │
│  src/features/website-chatbot/types/website.types.ts                    │
│  src/features/website-chatbot/hooks/useChatbot.ts (🟩 B 개발)           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ 할 일                             ❌ 절대 하지 말 것                 │
│  ─────────────                        ─────────────────                 │
│  • Phase 0: 타입 먼저 합의            • B가 *.tsx 직접 수정             │
│  • A는 Mock으로 UI 개발               • A가 EF 파일 직접 수정           │
│  • B는 curl로 EF 테스트               • 계약 파일 알림 없이 수정         │
│  • SSE 이벤트 포맷 준수               • 동시에 website.types.ts 수정    │
│  • 주 2회 연동 체크포인트             • rebase 없이 작업 지속            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### A+C OS 챗봇 한눈에 보기

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    A + C OS 챗봇 협업                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟦 A (UI/UX) 영역                    🟧 C (OS Bot) 영역                │
│  ─────────────────────                ─────────────────────             │
│  src/shared/chat/                     supabase/functions/               │
│    components/                          neuraltwin-assistant/           │
│    hooks/useStreaming.ts                index.ts                        │
│                                         intent/                         │
│  src/features/ai-assistant/             actions/                        │
│    AssistantPanel.tsx                   orchestrator/                   │
│    AssistantButton.tsx                  response/                       │
│    components/                                                          │
│      InlineChart.tsx                  supabase/functions/_shared/       │
│      ActionButtons.tsx                  chatLogger.ts                   │
│      QuickActions.tsx                   streamingResponse.ts            │
│                                         rateLimiter.ts                  │
│                                                                         │
│  🟪 공유 계약                                                           │
│  ─────────────────────                                                  │
│  src/features/ai-assistant/types/assistant.types.ts                     │
│  src/features/ai-assistant/hooks/useAssistant.ts (🟧 C 개발)            │
│  src/features/ai-assistant/hooks/useActionDispatch.ts (🟧 C 개발)       │
│  src/features/ai-assistant/providers/AssistantProvider.tsx (🟧 C 개발)  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ 할 일                             ❌ 절대 하지 말 것                 │
│  ─────────────                        ─────────────────                 │
│  • Phase 0: UIAction 타입 먼저 합의   • C가 *.tsx 직접 수정             │
│  • A는 Mock Provider로 UI 개발        • A가 EF 파일 직접 수정           │
│  • C는 curl + JWT로 EF 테스트         • 기존 store 직접 수정            │
│  • UIAction 추가 시 순서 프로토콜     • 계약 파일 알림 없이 수정         │
│  • 주 2회 연동 체크포인트             • rebase 없이 작업 지속            │
│  • useActionDispatch로만 store 접근                                     │
│                                                                         │
│  ⚠️ 특별 규칙: UIAction 추가 시                                         │
│  1. C → Slack 알림                                                      │
│  2. A → 확인 (2시간 내)                                                 │
│  3. C → types 추가                                                      │
│  4. A → UI 렌더링 추가                                                  │
│  5. C → dispatch 구현                                                   │
│  6. A+C → 페어 테스트                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 문서 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:--|:---|:---|:---|
| 1.0 | 2026-02-05 | Claude Code | 최초 작성 (실제 프로젝트 구조 기반) |

---

*본 가이드는 NEURALTWIN 듀얼 챗봇 프로젝트의 Git 협업 규칙을 정의합니다. 모든 개발자는 이 가이드를 숙지하고 준수해야 합니다.*

**문서 끝**
