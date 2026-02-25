# WORK_GUIDE_C — Member E (CDTO / Web Frontend & Marketing)

> **역할**: CDTO, 웹 프론트엔드 & 마케팅 리드
> **Claude 프로젝트**: `neuraltwin-web`
> **버전**: 1.0 | 2026-02-25

---

## 1. 역할 요약 (Role Summary)

| 항목 | 내용 |
|------|------|
| **포지션** | CDTO, 웹 프론트엔드 & 마케팅 리드 |
| **핵심 책임** | Website import 마이그레이션, Chat UI Kit 추출, tailwind-preset 생성, Vercel 배포 |
| **코드 소유 경로** | `apps/website/`, `packages/ui/` (생성 예정), `packages/tailwind-preset/` (생성 예정) |
| **EF 소유** | `retail-chatbot`, `knowledge-admin`, `submit-contact`, `test-embedding`, `upscale-image` (5개) |

---

## 2. 모노레포 컨텍스트 (Monorepo Context)

### E의 코드 위치
```
neuraltwin/
├── apps/
│   └── website/                    # ← E 소유
│       ├── src/
│       │   ├── pages/              # 13개 페이지
│       │   ├── components/         # 94개 컴포넌트
│       │   ├── shared/chat/        # Chat UI Kit (추출 대상)
│       │   │   ├── components/     # 7개 채팅 UI 컴포넌트
│       │   │   ├── hooks/          # 2개 훅
│       │   │   ├── types/          # chat.types.ts
│       │   │   └── utils/          # 2개 유틸
│       │   ├── integrations/supabase/
│       │   │   ├── client.ts       # ⚠️ 하드코딩 키 포함
│       │   │   └── types.ts        # 11,603 LOC (자동 생성)
│       │   ├── i18n/               # ko.ts, en.ts
│       │   └── styles/             # 5개 CSS
│       ├── supabase/functions/     # E 소유 5개 EF
│       │   ├── retail-chatbot/     # 26파일, ~8,000 LOC
│       │   ├── knowledge-admin/
│       │   ├── submit-contact/
│       │   ├── test-embedding/
│       │   └── upscale-image/
│       └── vite.config.ts
├── packages/
│   ├── ui/                         # ← E 생성 예정 (W3)
│   └── tailwind-preset/            # ← E 생성 예정 (W4)
```

### 다른 멤버와의 의존 관계
- **A**: W1 모노레포 스캐폴딩 완료 후 import 감사 시작. types v0.1(W2) 후 타입 마이그레이션 가능.
- **D**: UI Kit 추출(W3) 후 D가 OS에서 소비(W5). Three.js/Zod 버전 공동 결정.
- **C**: retail-chatbot EF의 `_shared/` 의존성. W6에 CORS 중앙화 시 조율.
- **B**: 직접 의존 없음.

---

## 3. 서브에이전트 팀 (Sub-Agent Team)

### 3.1 React Dev Agent

```markdown
# CLAUDE.md — React Dev Agent (neuraltwin-web)

## 역할
Website React 컴포넌트 개발과 유지보수를 담당합니다.

## 핵심 규칙
1. Supabase 타입은 `@neuraltwin/types`에서 import (마이그레이션 후).
2. 공유 컴포넌트는 `@neuraltwin/ui`에서 import (추출 후).
3. shadcn/ui 패턴을 따릅니다 (Radix + CVA + Tailwind).
4. `@` alias 규칙 유지 (`vite.config.ts`의 `@` → `./src`).
5. `packages/` 직접 수정 금지 — UI Kit Agent 담당.

## 주요 설정 파일
- `apps/website/vite.config.ts` — Vite 빌드 설정, alias
- `apps/website/tsconfig.json` — TypeScript 설정
- `apps/website/tailwind.config.ts` — Tailwind 커스텀 설정

## 기술 스택
- React 18.3.1 + Vite 5.4.19 + TypeScript 5.8.3
- Tailwind CSS 3.4.17 + shadcn/ui (Radix)
- @supabase/supabase-js ^2.84.0 (목표: 2.89.0)
- i18next ^25.6.3 + react-i18next ^16.3.5
- zod ^3.25.76

## 검증 명령어
```bash
pnpm --filter @neuraltwin/website build
pnpm --filter @neuraltwin/website type-check
pnpm --filter @neuraltwin/website lint
```

## 에스컬레이션
30분 이상 블로킹 → E (Team Lead)에 보고
```

### 3.2 UI Kit Agent

```markdown
# CLAUDE.md — UI Kit Agent (neuraltwin-web)

## 역할
`packages/@neuraltwin/ui/` 추출과 유지보수를 담당합니다.

## 핵심 규칙
1. 모든 컴포넌트는 `variant` prop을 지원합니다 (`'website'` | `'os'`).
2. 모든 컴포넌트에 Storybook 스토리를 작성합니다.
3. `index.ts` 배럴 파일에서 export합니다.
4. `@neuraltwin/tailwind-preset` 토큰만 사용합니다.
5. 앱 특화 로직을 공유 컴포넌트에 넣지 않습니다.

## 추출 대상 컴포넌트 (12개)
### Components (7개)
- `ChatBubble.tsx` — 메시지 버블 (user/AI 구분, markdown 렌더링, variant 지원)
- `ChatInput.tsx` — 입력 필드 (Enter=전송, Shift+Enter=줄바꿈, auto-height)
- `ChatScrollArea.tsx` — 자동 스크롤 채팅 영역
- `FeedbackButtons.tsx` — 좋아요/싫어요 평가 버튼
- `SuggestionChips.tsx` — 후속 질문 추천 칩 (max 3)
- `TypingIndicator.tsx` — 3-dot 타이핑 애니메이션
- `WelcomeMessage.tsx` — 초기 인사 + 추천 칩

### Hooks (2개)
- `useChatSession.ts` — 세션 관리 (sessionId, conversationId)
- `useStreaming.ts` — SSE 스트리밍 (fetch + ReadableStream)

### Types (1개)
- `chat.types.ts` — ChatMessageUI, ChatVariant

### Utils (2개)
- `exportConversation.ts` — .md/.pdf/.docx 내보내기
- `fileUpload.ts` — Supabase Storage 파일 업로드

## 패키지 구조
```
packages/ui/
├── src/
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatScrollArea.tsx
│   │   ├── FeedbackButtons.tsx
│   │   ├── SuggestionChips.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── WelcomeMessage.tsx
│   ├── hooks/
│   │   ├── useChatSession.ts
│   │   └── useStreaming.ts
│   ├── types/
│   │   └── chat.types.ts
│   ├── utils/
│   │   ├── exportConversation.ts
│   │   └── fileUpload.ts
│   └── index.ts              # 배럴 export
├── package.json
└── tsconfig.json
```

## 에스컬레이션
variant 인터페이스 변경 시 → E (Team Lead) → D (OS 소비자)에 알림
```

### 3.3 i18n/Content Agent

```markdown
# CLAUDE.md — i18n/Content Agent (neuraltwin-web)

## 역할
SEO, 국제화(i18n), 마케팅 콘텐츠를 관리합니다.

## 핵심 규칙
1. ko/en JSON 번역 파일을 동기화 유지합니다.
2. 모든 meta 태그에 양 언어 지원 확인합니다.
3. OG 이미지는 `neuraltwin.com` 도메인을 사용합니다 (Lovable 도메인 금지).
4. SEO를 위해 시맨틱 HTML을 따릅니다.

## 주요 파일
- `apps/website/src/i18n/ko.ts` — 한국어 번역
- `apps/website/src/i18n/en.ts` — 영어 번역
- `apps/website/src/i18n/config.ts` — i18n 설정
- `apps/website/index.html` — meta 태그, OG 이미지

## OG 이미지 현황
- 현재: `lovable.dev/opengraph-image-*.png` (변경 필요)
- 목표: `neuraltwin.com/og-image-*.png`

## 에스컬레이션
브랜드/콘텐츠 방향성 → E (Team Lead)에 보고
```

---

## 4. 8주 태스크 브레이크다운 (8-Week Task Breakdown)

### Week 1: Import 경로 감사

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 1.1 | `@` alias import 경로 전수 조사 | import 목록 (~200개 파일) | `grep -r "from '@/" apps/website/src/ \| wc -l` 결과 기록 |
| 1.2 | `vite.config.ts` alias 설정 확인 | 설정 리뷰 문서 | 현재 `@` → `./src` 매핑 확인 |
| 1.3 | `tsconfig.json` paths 확인 | 설정 리뷰 문서 | paths 매핑 현황 파악 |

### Week 2: Import 경로 마이그레이션 완료

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 2.1 | `vite.config.ts` alias 업데이트 | 수정된 vite.config.ts | 모노레포 구조에 맞는 alias |
| 2.2 | `tsconfig.json` paths 업데이트 | 수정된 tsconfig.json | `@neuraltwin/types` 등 패키지 경로 추가 |
| 2.3 | 전체 빌드 검증 | 빌드 성공 로그 | `pnpm --filter @neuraltwin/website build` 성공 |

**롤백**: `git revert` — import 변경 커밋 되돌리기

### Week 3: Chat UI Kit 추출

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 3.1 | `packages/ui/` 패키지 스캐폴딩 | package.json, tsconfig.json | `pnpm --filter @neuraltwin/ui build` 성공 |
| 3.2 | Chat 컴포넌트 7개 이동 | `packages/ui/src/chat/` | import 경로 변경 후 빌드 성공 |
| 3.3 | Hooks 2개 이동 | `packages/ui/src/hooks/` | useChatSession, useStreaming 동작 확인 |
| 3.4 | Types + Utils 이동 | `packages/ui/src/types/`, `utils/` | 전체 export 확인 |
| 3.5 | variant prop 시스템 검증 | variant='website' 테스트 | ChatBubble에서 두 테마 동작 확인 |
| 3.6 | Website에서 `@neuraltwin/ui` import | 기존 `../shared/chat/` → 패키지 | `pnpm --filter @neuraltwin/website build` 성공 |

**variant prop 구현 패턴**:
```typescript
type ChatVariant = 'website' | 'os';

interface ChatBubbleProps {
  variant?: ChatVariant;
  message: ChatMessageUI;
}

export function ChatBubble({ variant = 'website', message }: ChatBubbleProps) {
  const styles = variant === 'website'
    ? 'bg-turquoise-500 text-white'  // website: turquoise 테마
    : 'bg-card text-foreground';      // os: shadcn 테마
  // ...
}
```

### Week 4: tailwind-preset + Vercel 배포

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 4.1 | `packages/tailwind-preset/` 생성 | preset 패키지 | 공유 토큰 (colors, spacing, fonts) 추출 |
| 4.2 | Website tailwind.config 프리셋 적용 | 수정된 config | `presets: [require('@neuraltwin/tailwind-preset')]` |
| 4.3 | Vercel 배포 설정 | `vercel.json` | 프리뷰 URL 작동 확인 |
| 4.4 | OS Dashboard Vercel 설정 | `vercel.json` (os-dashboard) | D와 공동 작업 |

**tailwind-preset 구조**:
```javascript
// packages/tailwind-preset/src/index.ts
export default {
  theme: {
    extend: {
      colors: {
        // CSS variable 기반 시맨틱 컬러
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        // ...
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Week 5: Lovable 의존성 제거 + 타입 마이그레이션

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 5.1 | `lovable-tagger` 조건부 import | 수정된 vite.config.ts | Lovable 외부에서도 빌드 성공 |
| 5.2 | `client.ts` 환경변수 전환 | 수정된 client.ts | 하드코딩 키 0건 |
| 5.3 | OG 이미지 도메인 변경 | 수정된 index.html | `lovable.dev` 참조 0건 |
| 5.4 | 타입 마이그레이션 | `@neuraltwin/types` import | `src/integrations/supabase/types.ts`를 re-export로 변경 |

**client.ts 전환 (Before → After)**:
```typescript
// Before (하드코딩)
const SUPABASE_URL = "https://bdrvowacecxnraaivlhr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJ...";

// After (환경변수)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

**타입 마이그레이션 (TYPE_MIGRATION_TODO.md 기반)**:
```typescript
// apps/website/src/integrations/supabase/types.ts (변경 후)
export type { Database } from '@neuraltwin/types';
// 나머지 103개 파일은 client import이므로 변경 불필요
```

### Week 6: CORS 수정 + SEO

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 6.1 | `retail-chatbot` CORS 환경변수화 | 수정된 EF | 하드코딩 도메인 0건 (lines 637-645) |
| 6.2 | 소유 5개 EF CORS 통일 | 수정된 EF | `_shared/cors.ts` 사용 (C와 조율) |
| 6.3 | SEO meta 태그 감사 | 감사 보고서 | 전 페이지 title/description/OG 확인 |
| 6.4 | i18n 완성도 검증 | 번역 완료율 | ko.ts/en.ts 키 100% 동기화 |

### Week 7: 통합 테스트

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 7.1 | D와 공유 UI 소비 통합 테스트 | 테스트 결과 | OS에서 `@neuraltwin/ui` import 성공 |
| 7.2 | 크로스 브라우저 테스트 | 테스트 보고서 | Chrome, Firefox, Safari, Mobile |
| 7.3 | 챗봇 E2E 테스트 | 테스트 시나리오 | SSE 스트리밍, 리드 캡처, 세션 인계 |

### Week 8: 성능 최적화 + 문서화

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 8.1 | 번들 사이즈 최적화 | 최적화 보고서 | 코드 스플리팅 적용 |
| 8.2 | `Chat.tsx` 리팩토링 | 분리된 컴포넌트 | 2,250 LOC → 커스텀 훅 + 컨텍스트 분리 |
| 8.3 | 최종 문서화 | 업데이트된 README | 배포, 개발, 아키텍처 문서 |

---

## 5. 기술 스펙 (Technical Specifications)

### 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| react | ^18.3.1 | UI 프레임워크 |
| vite | ^5.4.19 | 빌드 도구 |
| typescript | ^5.8.3 | 언어 |
| tailwindcss | ^3.4.17 | CSS |
| @supabase/supabase-js | ^2.84.0 (목표: 2.89.0) | DB 클라이언트 |
| zod | ^3.25.76 | 스키마 검증 |
| i18next | ^25.6.3 | 국제화 |
| three | ^0.160.0 | 3D 렌더링 |
| lovable-tagger | ^1.1.11 (dev) | Lovable 태깅 (제거 예정) |

### 주요 파일

| 파일 | 역할 | LOC |
|------|------|-----|
| `apps/website/src/pages/Chat.tsx` | AI 챗봇 메인 페이지 | 2,250 |
| `apps/website/src/shared/chat/` | 공유 Chat UI Kit (추출 대상) | ~1,200 |
| `apps/website/src/integrations/supabase/client.ts` | Supabase 클라이언트 (수정 필요) | ~10 |
| `apps/website/src/integrations/supabase/types.ts` | DB 타입 (자동 생성) | 11,603 |
| `apps/website/supabase/functions/retail-chatbot/` | 웹 챗봇 EF | ~8,000 |
| `apps/website/vite.config.ts` | Vite 설정 | ~20 |
| `apps/website/tailwind.config.ts` | Tailwind 커스텀 | ~80 |

### 빌드 명령어
```bash
pnpm --filter @neuraltwin/website dev      # 개발 서버
pnpm --filter @neuraltwin/website build    # 프로덕션 빌드
pnpm --filter @neuraltwin/website lint     # 린트
pnpm --filter @neuraltwin/website type-check  # 타입 체크
```

---

## 6. 크로스팀 의존성 (Cross-Team Dependencies)

| 공유 리소스 | 소유자 | 변경 시 조율 대상 | 비고 |
|-------------|--------|------------------|------|
| `packages/@neuraltwin/ui/` | E | D (OS 소비자) | variant prop 인터페이스 공유 |
| `packages/@neuraltwin/tailwind-preset/` | E | D (공유 설정) | 디자인 토큰 변경 |
| `packages/@neuraltwin/types/` | C (합류 전: A) | **전원** | 타입 변경 영향 |
| `retail-chatbot` EF | E | C (백엔드 인프라) | _shared/ 의존 |
| `supabase/functions/_shared/` | C (합류 전: A) | E (챗봇 의존) | CORS, streaming 유틸 |
| Three.js 버전 | E + D | 공동 결정 | 0.160.0 vs 0.160.1 통일 |
| Zod 버전 | E + D | 공동 결정 | v3 vs v4 |

---

## 7. 기술 부채 & 알려진 이슈 (Known Issues & Tech Debt)

| # | 심각도 | 이슈 | 위치 | 해결 방법 |
|:-:|:------:|------|------|----------|
| 1 | **CRITICAL** | Supabase 키 하드코딩 | `client.ts:5-6` | `import.meta.env` 전환 |
| 2 | **HIGH** | CORS 도메인 하드코딩 | `retail-chatbot/index.ts:637-645` | 환경변수 전환 |
| 3 | **HIGH** | Chat.tsx 2,250 LOC 모놀리스 | `src/pages/Chat.tsx` | 훅 + 컨텍스트 분리 |
| 4 | **MEDIUM** | OG 이미지 Lovable 도메인 | `index.html:13,17` | neuraltwin.com 도메인 |
| 5 | **MEDIUM** | lovable-tagger 의존성 | `vite.config.ts:4` | 조건부 import 처리 |
| 6 | **MEDIUM** | `strict: false` in tsconfig | `tsconfig.app.json` | strict 모드 활성화 (W7-W8) |
| 7 | **MEDIUM** | ~92개 `@ts-ignore` | `src/` 전체 | 점진적 제거 |
| 8 | **LOW** | dual lock files | `package-lock.json` + `bun.lockb` | pnpm 통일 후 제거 |
| 9 | **LOW** | `App.css` 미사용 | `src/App.css` (43 LOC) | 삭제 |
| 10 | **LOW** | `next-themes` (Next.js용) | Vite 프로젝트에서 사용 | 커스텀 ThemeProvider 전환 |

---

## 8. 검증 체크리스트 (Verification Checklist)

### Phase 1 (W1-W2) — Import 마이그레이션
- [ ] `vite.config.ts` alias 업데이트
- [ ] `tsconfig.json` paths 업데이트
- [ ] `pnpm --filter @neuraltwin/website build` 성공
- [ ] `pnpm --filter @neuraltwin/website type-check` 에러 0건

### Phase 2 (W3-W4) — UI Kit + Preset
- [ ] `packages/ui/` 패키지 생성
- [ ] 12개 Chat UI 컴포넌트/훅/유틸 이동 완료
- [ ] variant prop 시스템 동작 확인
- [ ] `packages/tailwind-preset/` 생성
- [ ] Vercel 프리뷰 URL 작동
- [ ] `pnpm build` 전체 빌드 성공

### Phase 3 (W5-W6) — Lovable 제거 + CORS
- [ ] `client.ts` 하드코딩 키 제거
- [ ] OG 이미지 Lovable 도메인 제거
- [ ] `lovable-tagger` 조건부 처리
- [ ] 타입 `@neuraltwin/types` import 전환
- [ ] retail-chatbot CORS 환경변수화

### Phase 4 (W7-W8) — 최적화
- [ ] D와 공유 UI 통합 테스트 통과
- [ ] 크로스 브라우저 테스트 완료
- [ ] 번들 사이즈 최적화 (코드 스플리팅)

---

## 9. 참조 파일 (Reference Files)

| 파일 | 위치 | 참조 섹션 |
|------|------|----------|
| REPO_ANALYSIS_E.md | `apps/website/REPO_ANALYSIS_E.md` | **전체** — 컴포넌트 인벤토리, 의존성, 기술 부채 |
| TYPE_MIGRATION_TODO.md | `apps/website/TYPE_MIGRATION_TODO.md` | 전체 — 타입 마이그레이션 대상 파일 목록 |
| CLAUDE.md (website) | `apps/website/CLAUDE.md` | 전체 — 챗봇 시스템 아키텍처, AI API 패턴 |
| REPO_ANALYSIS_D.md | `apps/os-dashboard/REPO_ANALYSIS_D.md` | Sec 9 (공유 코드) — D와 공유 대상 파악 |
| REPO_ANALYSIS_C.md | `supabase/REPO_ANALYSIS_C.md` | Sec 9 (타입), Sec 11 (CORS 이슈) — EF 관련 |
| SYSTEM_ARCHITECTURE.md | `docs/SYSTEM_ARCHITECTURE.md` | Sec 4 (챗봇 데이터 흐름) |

---

## 10. 비상 절차 (Emergency Procedures)

### 빌드 실패 시
```bash
# 캐시 초기화
pnpm --filter @neuraltwin/website clean

# 의존성 재설치
rm -rf apps/website/node_modules && pnpm install

# 재빌드
pnpm --filter @neuraltwin/website build

# 타입만 체크
pnpm --filter @neuraltwin/website type-check
```

### UI Kit 추출 중 빌드 실패 시
```bash
# 1. 기존 shared/chat/ 복원 (패키지 전환 전)
git checkout -- apps/website/src/shared/chat/

# 2. packages/ui/ 패키지 빌드 먼저 확인
pnpm --filter @neuraltwin/ui build

# 3. website에서 패키지 import 재시도
pnpm --filter @neuraltwin/website build
```

### retail-chatbot EF 문제 시
```bash
# 로그 확인
supabase functions logs retail-chatbot --project-ref bdrvowacecxnraaivlhr

# 디버그 배포
supabase functions deploy retail-chatbot --project-ref bdrvowacecxnraaivlhr --debug

# SSE 스트리밍 테스트
curl -X POST https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/retail-chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "stream": false}'
```

### 롤백
```bash
git revert <commit-hash>
pnpm install && pnpm build
```

### 에스컬레이션 경로
```
React Dev / UI Kit / i18n Agent → E (Team Lead) → A (Orchestrator)
```
