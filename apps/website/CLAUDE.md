# NEURALTWIN INTEGRATED — CLAUDE.md (CDTO 전용)

> 모노레포 루트용 | 담당: E (CDTO)
> 최종 수정: 2026-02-26

---

## 프로젝트 개요

NeuralTwin은 오프라인 리테일 매장의 고객 행동을 IoT 센서(WiFi Probe)로 수집하고, AI(Gemini 2.5)로 분석해서 매장 운영을 최적화하는 SaaS 플랫폼이다.

## 담당 영역 (CDTO = E)

| 영역 | 경로 | 설명 |
|------|------|------|
| **Website** | `apps/website/` | 마케팅 웹사이트 전체 (랜딩, 대시보드, Chat UI) |
| **OS 프론트엔드** | `apps/os-dashboard/` | D(DT Lead)와 공동 담당 |
| **공유 UI** | `packages/@neuraltwin/ui/` | 컴포넌트 추출 및 관리 |
| **디자인 시스템** | `packages/@neuraltwin/tailwind-preset/` | 디자인 토큰 |

## 절대 건드리지 마

- `supabase/functions/` — C(Backend) 영역
- `apps/neuralsense/` — B(IoT) 영역
- 다른 팀원의 `REPO_ANALYSIS_*.md` 파일

## 모노레포 구조

```
NEURALTWIN_INTEGRATED/
├── apps/
│   ├── website/           ← 내 메인 담당
│   ├── os-dashboard/      ← D와 공동 담당
│   └── neuralsense/       ← B 담당 (Python IoT)
├── supabase/
│   └── functions/         ← C 담당 (Edge Functions)
├── packages/
│   ├── @neuraltwin/ui/    ← 공유 UI (내 담당)
│   └── @neuraltwin/tailwind-preset/ ← 디자인 토큰 (내 담당)
├── turbo.json
├── pnpm-workspace.yaml
└── CLAUDE.md              ← 이 파일
```

## 기술 스택

- **프레임워크**: React 18 + TypeScript + Vite 5
- **스타일링**: Tailwind CSS + shadcn/ui (48개 컴포넌트)
- **3D**: Three.js + @react-three/fiber
- **다국어**: react-i18next (ko/en, ja 미구현)
- **백엔드**: Supabase Auth + DB + Edge Functions
- **검증**: Zod (스키마 검증)
- **빌드**: pnpm + Turborepo

## Website 핵심 정보

### 디렉토리 구조

```
apps/website/src/
├── components/        → UI 컴포넌트 (94개)
│   ├── ui/            → shadcn/ui (48개)
│   ├── landing/       → 랜딩 페이지 섹션
│   └── ...
├── shared/
│   └── chat/          → AI 챗봇 UI (13개 파일) ★ 추출 대상
│       ├── components/ → ChatBubble, ChatInput, ChatScrollArea,
│       │                 FeedbackButtons, SuggestionChips,
│       │                 TypingIndicator, WelcomeMessage (7개)
│       ├── hooks/      → useChatSession, useStreaming (2개)
│       ├── types/      → chat.types.ts
│       ├── utils/      → exportConversation.ts, fileUpload.ts
│       └── index.ts
├── pages/             → 라우트 페이지 (15개)
├── hooks/             → 커스텀 훅
├── lib/               → 유틸리티
├── integrations/      → Supabase 연동
└── i18n/
    ├── config.ts      → i18next 설정
    └── locales/
        ├── ko.ts      → 한국어 (777줄, 기본 언어)
        └── en.ts      → 영어 (682줄)
```

### 현재 문제점 (해결 대상)

| 문제 | 심각도 | 설명 |
|------|--------|------|
| Supabase URL/Key 하드코딩 + Git 커밋 | 🔴 긴급 | `.env`로 이동 + `.gitignore` 추가 + Git 히스토리 제거 |
| @ts-ignore 92개 | 🔴 높음 | 점진적 타입 정의 추가로 제거 |
| strict: false | 🟡 중간 | strict: true 전환 준비 |
| 테스트 0% | 🟡 중간 | Vitest 설정 필요 |
| OS Dashboard와 Chat UI 중복 (~2,500 LOC) | 🟡 중간 | packages/@neuraltwin/ui로 추출 |
| shadcn/ui 중복 (48개 vs OS 49개) | 🟡 중간 | 공유 컴포넌트 통합 |
| three.js 버전 불일치 (@0.160 vs @0.169) | 🟢 낮음 | 버전 통일 |

## 규칙

1. 공유 UI 변경 시 → D에게 알리고 함께 리뷰
2. 컴포넌트 추출 시 → variant 시스템 ("website" | "os") 유지
3. Tailwind 커스텀 색상 → `tailwind-preset`에만 정의
4. i18n 키 → 네이밍 컨벤션 준수 (camelCase, 3단계 이내)
5. PR 필수, CODEOWNERS 리뷰 필수
6. 번역 키 추가 시 → ko, en 양쪽 모두 추가

## 에이전트 팀 구성

이 프로젝트는 3개의 서브 에이전트로 운영된다:

| 에이전트 | 가이드 파일 | 역할 |
|----------|-----------|------|
| **React Dev Agent** | `CLAUDE_REACT_DEV.md` | 웹사이트 컴포넌트 개발, 버그 수정, 성능 최적화 |
| **UI Kit Agent** | `CLAUDE_UI_KIT.md` | 공유 UI 컴포넌트 추출, variant 시스템, Storybook |
| **i18n/Content Agent** | `CLAUDE_I18N_CONTENT.md` | 다국어, 마케팅 콘텐츠, SEO |

각 에이전트는 해당 가이드 파일을 CLAUDE.md로 사용한다.

## 명령어

```bash
# 웹사이트
pnpm --filter website dev           # 개발 서버
pnpm --filter website build         # 프로덕션 빌드
pnpm --filter website typecheck     # 타입 체크

# UI 패키지
pnpm --filter @neuraltwin/ui build  # UI 패키지 빌드

# 전체
turbo run build                     # 전체 빌드
turbo run typecheck                 # 전체 타입 체크
```
