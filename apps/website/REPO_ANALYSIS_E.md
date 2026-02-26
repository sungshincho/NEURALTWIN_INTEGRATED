# REPO_ANALYSIS_E — apps/website 분석 리포트

> **생성일**: 2026-02-26
> **대상**: `apps/website` (마케팅 웹사이트 + AI 채팅)
> **담당**: E (CDTO / Website Lead)

---

## 1. 디렉토리 트리 (3레벨 깊이)

```
apps/website/
├── public/
│   ├── images/
│   │   └── services/
│   ├── models/
│   └── presets/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── chatbot/
│   │   │   └── visualizer/          # 3D 시각화 컴포넌트 (4)
│   │   ├── features/                 # 미니 피쳐 데모 컴포넌트 (14)
│   │   ├── layout/                   # Header, Footer (2)
│   │   └── ui/                       # shadcn/ui 컴포넌트 (48)
│   ├── hooks/                        # 커스텀 훅 (3)
│   ├── i18n/
│   │   └── locales/                  # ko.ts, en.ts
│   ├── integrations/
│   │   └── supabase/                 # client.ts, types.ts
│   ├── lib/                          # 유틸리티 (5)
│   ├── pages/                        # 라우트 페이지 (13)
│   ├── shared/
│   │   └── chat/                     # ★ 추출 대상 Chat UI (13 파일)
│   │       ├── components/           # ChatBubble, ChatInput 등 (7)
│   │       ├── hooks/                # useChatSession, useStreaming (2)
│   │       ├── types/                # chat.types.ts (1)
│   │       └── utils/                # exportConversation, fileUpload (2)
│   ├── styles/                       # 페이지별 CSS (5)
│   └── types/                        # auth.ts (1)
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── components.json
└── vercel.json
```

---

## 2. 파일 수 & 코드 라인 수

### 파일 수 (src/ 기준)

| 확장자 | 파일 수 |
|--------|---------|
| `.tsx`  | 99      |
| `.ts`   | 26      |
| `.css`  | 7       |
| **합계** | **132** |

(+ 루트 설정 파일 6개: package.json, tsconfig.json, vite.config.ts, tailwind.config.ts, eslint.config.js, vercel.json)

### 코드 라인 수 (언어별)

| 언어          | LOC     | 비율   |
|--------------|---------|--------|
| TypeScript (TSX) | 18,157 | 60.7%  |
| TypeScript (TS)  | 5,570  | 18.6%  |
| CSS              | 6,190  | 20.7%  |
| **합계**         | **29,917** | 100% |

### 디렉토리별 LOC 분포

| 디렉토리                  | 파일 수 | LOC    | 비고              |
|--------------------------|---------|--------|-------------------|
| `pages/`                 | 13      | 6,924  | Chat.tsx 단독 2,260줄 |
| `components/ui/`         | 48      | —      | shadcn/ui (외부 생성) |
| `components/features/`   | 14      | 4,515  | 미니 피쳐 데모     |
| `components/chatbot/`    | 4       | 1,428  | 3D 시각화          |
| `components/layout/`     | 2       | 335    | Header + Footer    |
| `components/` (루트)      | 6       | 425    | 랜딩 페이지        |
| `shared/chat/`           | 13      | 1,818  | ★ Chat UI 추출 대상 |
| `hooks/`                 | 3       | 375    | Toast, Auth, Mobile |
| `lib/`                   | 5       | 933    | Pathfinding, Analytics |
| `i18n/locales/`          | 2       | 1,460  | ko(777줄), en(683줄) |
| `integrations/`          | 2       | 23     | Supabase client    |
| `types/`                 | 1       | 100    | auth.ts            |
| `styles/`                | 5       | 6,190  | 페이지별 CSS       |

---

## 3. 프레임워크 & 주요 라이브러리

### Core Framework

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react | ^18.3.1 | UI 프레임워크 |
| react-dom | ^18.3.1 | DOM 렌더링 |
| react-router-dom | ^6.30.1 | 클라이언트 라우팅 |
| typescript | ^5.8.3 | 타입 시스템 |
| vite | ^5.4.19 | 빌드 도구 |

### 상태 관리 & 데이터

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| @tanstack/react-query | ^5.83.0 | 서버 상태 관리 |
| @supabase/supabase-js | ^2.84.0 | Supabase 클라이언트 |
| zod | ^3.25.76 | 런타임 스키마 검증 |

### UI & 스타일링

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| tailwindcss | ^3.4.17 | 유틸리티 CSS |
| @radix-ui/* (23개) | ^1.x~^2.x | 접근성 기반 UI 프리미티브 |
| class-variance-authority | ^0.7.1 | 컴포넌트 변형 시스템 |
| clsx | ^2.1.1 | 조건부 className |
| tailwind-merge | ^2.6.0 | Tailwind 클래스 병합 |
| lucide-react | ^0.462.0 | 아이콘 라이브러리 |
| framer-motion | ^12.31.1 | 애니메이션 |
| sonner | ^1.7.4 | 토스트 알림 |
| cmdk | ^1.1.1 | 커맨드 팔레트 |
| embla-carousel-react | ^8.6.0 | 캐러셀 |
| vaul | ^0.9.9 | 드로어 |
| next-themes | ^0.3.0 | 다크모드 |

### 3D 시각화

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| three | ^0.160.0 | 3D 엔진 |
| @react-three/fiber | ^8.15.19 | React Three.js 바인딩 |
| @react-three/drei | ^9.99.0 | Three.js 헬퍼 |

### 폼 & 검증

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-hook-form | ^7.61.1 | 폼 관리 |
| @hookform/resolvers | ^3.10.0 | Zod 연동 |
| input-otp | ^1.4.2 | OTP 입력 |

### 데이터 시각화

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| recharts | ^2.15.4 | 차트 컴포넌트 |
| react-resizable-panels | ^2.1.9 | 리사이저블 패널 |

### 문서 & 파일

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| jspdf | ^4.1.0 | PDF 생성 |
| xlsx | ^0.18.5 | Excel 처리 |
| docx | ^9.5.1 | DOCX 생성 |
| mammoth | ^1.11.0 | DOCX 읽기 |
| pdfjs-dist | ^5.4.624 | PDF 렌더링 |
| file-saver | ^2.0.5 | 파일 다운로드 |

### 다국어

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| i18next | ^25.6.3 | 다국어 프레임워크 |
| react-i18next | ^16.3.5 | React i18n 바인딩 |

### 콘텐츠

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-markdown | ^10.1.0 | Markdown 렌더링 |
| react-day-picker | ^8.10.1 | 날짜 선택기 |
| date-fns | ^3.6.0 | 날짜 유틸리티 |

### 모노레포 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @neuraltwin/types | workspace:* | DB/API/Auth 타입 |
| @neuraltwin/ui | workspace:* | 공유 UI 컴포넌트 |

### DevDependencies

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| @vitejs/plugin-react-swc | ^3.11.0 | SWC 기반 React 플러그인 |
| eslint | ^9.32.0 | 린터 |
| eslint-plugin-react-hooks | ^5.2.0 | React Hooks 규칙 |
| eslint-plugin-react-refresh | ^0.4.20 | HMR 안전성 검사 |
| typescript-eslint | ^8.38.0 | TS ESLint 파서 |
| @tailwindcss/typography | ^0.5.16 | 타이포그래피 플러그인 |
| autoprefixer | ^10.4.21 | CSS 벤더 프리픽스 |
| postcss | ^8.5.6 | CSS 후처리 |

---

## 4. 컴포넌트 인벤토리

### 4-1. 전체 컴포넌트 목록 (76개 TSX)

#### `src/components/` 루트 — 랜딩/공통 (8개)

| 파일 | LOC | 설명 |
|------|-----|------|
| `Hero.tsx` | 64 | 히어로 섹션 |
| `Features.tsx` | 69 | 기능 소개 섹션 |
| `UseCases.tsx` | 68 | 유즈케이스 그리드 |
| `CTA.tsx` | 34 | 행동 유도(CTA) 섹션 |
| `NavLink.tsx` | 28 | 네비게이션 링크 |
| `LanguageToggle.tsx` | 27 | 언어 전환 토글 (ko/en) |
| `Footer.tsx` | 64 | 풋터 (레거시, layout/Footer와 중복) |
| `ProtectedRoute.tsx` | 71 | 인증 라우트 가드 |

#### `src/components/layout/` — 레이아웃 (2개)

| 파일 | LOC | 설명 |
|------|-----|------|
| `Header.tsx` | 198 | 글로벌 헤더 + 네비게이션 |
| `Footer.tsx` | 137 | 글로벌 풋터 |

#### `src/components/chatbot/visualizer/` — 3D 시각화 (4개)

| 파일 | LOC | 설명 |
|------|-----|------|
| `StoreVisualizer.tsx` | 947 | 3D 매장 시각화 (Three.js) |
| `KPIBar.tsx` | 220 | KPI 바 차트 |
| `StageProgress.tsx` | 150 | 퍼널 진행 표시 |
| `CompareVisualizer.tsx` | 111 | Before/After 비교 |

#### `src/components/features/` — 미니 피쳐 데모 (14개)

| 파일 | LOC | 설명 |
|------|-----|------|
| `LayoutSimulator3D.tsx` | 729 | 3D 레이아웃 시뮬레이터 |
| `Store3DViewer.tsx` | 677 | 3D 매장 뷰어 |
| `TrafficHeatmap3D.tsx` | 557 | 3D 트래픽 히트맵 |
| `ProductPerformance.tsx` | 360 | 상품 성과 분석 |
| `TrafficHeatmap.tsx` | 279 | 2D 트래픽 히트맵 |
| `CustomerJourney.tsx` | 268 | 고객 여정 맵 |
| `InventoryOptimizer.tsx` | 261 | 재고 최적화 |
| `StaffEfficiency.tsx` | 252 | 직원 효율 분석 |
| `HQStoreSync.tsx` | 233 | HQ-매장 동기화 |
| `LayoutSimulator.tsx` | 225 | 2D 레이아웃 시뮬레이터 |
| `FootfallVisualizer3D.tsx` | 221 | 3D 동선 시각화 |
| `ConversionFunnel.tsx` | 169 | 전환 퍼널 |
| `DemandForecast.tsx` | 160 | 수요 예측 |
| `FootfallVisualizer.tsx` | 124 | 2D 동선 시각화 |

### 4-2. shadcn/ui 컴포넌트 (48개)

`src/components/ui/` 디렉토리 — Radix UI 기반 접근성 컴포넌트:

| # | 컴포넌트 | # | 컴포넌트 | # | 컴포넌트 |
|---|----------|---|----------|---|----------|
| 1 | accordion | 17 | dialog | 33 | separator |
| 2 | alert | 18 | drawer | 34 | sheet |
| 3 | alert-dialog | 19 | dropdown-menu | 35 | sidebar |
| 4 | aspect-ratio | 20 | form | 36 | skeleton |
| 5 | avatar | 21 | hover-card | 37 | slider |
| 6 | badge | 22 | input | 38 | sonner |
| 7 | breadcrumb | 23 | input-otp | 39 | switch |
| 8 | button | 24 | label | 40 | table |
| 9 | calendar | 25 | menubar | 41 | tabs |
| 10 | card | 26 | navigation-menu | 42 | textarea |
| 11 | carousel | 27 | pagination | 43 | toast |
| 12 | chart | 28 | popover | 44 | toaster |
| 13 | checkbox | 29 | progress | 45 | toggle |
| 14 | collapsible | 30 | radio-group | 46 | toggle-group |
| 15 | command | 31 | resizable | 47 | tooltip |
| 16 | context-menu | 32 | scroll-area | 48 | — |

> **참고**: OS Dashboard는 49개 (website 48 + 1). 추후 `@neuraltwin/ui`로 통합 검토 필요.

### 4-3. ★ Chat UI 컴포넌트 (13개 파일, 1,818 LOC) — 추출 대상

`src/shared/chat/` — OS Dashboard와 공유 가능한 채팅 UI 모듈:

#### Components (7개, 686 LOC)

| 파일 | LOC | 설명 |
|------|-----|------|
| `ChatBubble.tsx` | 146 | 메시지 버블 (유저/AI 구분, Markdown 지원) |
| `ChatInput.tsx` | 127 | 입력창 (텍스트 + 파일 첨부) |
| `WelcomeMessage.tsx` | 125 | 초기 환영 메시지 + 추천 질문 |
| `ChatScrollArea.tsx` | 100 | 스크롤 영역 (자동 스크롤) |
| `FeedbackButtons.tsx` | 71 | 좋아요/싫어요 피드백 |
| `TypingIndicator.tsx` | 59 | AI 타이핑 애니메이션 |
| `SuggestionChips.tsx` | 58 | 추천 질문 칩 |

#### Hooks (2개, 278 LOC)

| 파일 | LOC | 설명 |
|------|-----|------|
| `useStreaming.ts` | 193 | SSE 스트리밍 처리 |
| `useChatSession.ts` | 85 | 세션 관리 (생성/복원) |

#### Types (1개, 171 LOC)

| 파일 | LOC | 설명 |
|------|-----|------|
| `chat.types.ts` | 171 | ChatMessage, ChatSession, StreamState 등 |

#### Utils (2개, 663 LOC)

| 파일 | LOC | 설명 |
|------|-----|------|
| `exportConversation.ts` | 441 | 대화 내보내기 (PDF/DOCX/TXT/Markdown) |
| `fileUpload.ts` | 222 | 파일 업로드 핸들링 |

#### Index (1개, 20 LOC)

| 파일 | LOC | 설명 |
|------|-----|------|
| `index.ts` | 20 | barrel export |

> **추출 계획**: `@neuraltwin/ui` 또는 별도 `@neuraltwin/chat` 패키지로 이동하여 Website + OS Dashboard에서 공유. 예상 절감: ~1,800+ LOC 중복 제거.

### 4-4. 랜딩 페이지 컴포넌트

랜딩 페이지 (`/index`)를 구성하는 컴포넌트:

| 컴포넌트 | 파일 | LOC | 설명 |
|----------|------|-----|------|
| Header | `components/layout/Header.tsx` | 198 | 네비 + 로그인/언어 전환 |
| Hero | `components/Hero.tsx` | 64 | 메인 히어로 (CTA 2개) |
| Features | `components/Features.tsx` | 69 | NeuralSense/Mind/Twin 소개 |
| UseCases | `components/UseCases.tsx` | 68 | 패션/식품/전자/편의점 |
| CTA | `components/CTA.tsx` | 34 | 데모 신청 CTA |
| Footer | `components/layout/Footer.tsx` | 137 | 링크 그리드 + 카피라이트 |
| LanguageToggle | `components/LanguageToggle.tsx` | 27 | ko/en 전환 |
| NavLink | `components/NavLink.tsx` | 28 | 네비 링크 아이템 |

### 4-5. 페이지 컴포넌트 (13개, 6,924 LOC)

| 파일 | LOC | 라우트 | 설명 |
|------|-----|--------|------|
| `Chat.tsx` | 2,260 | `/`, `/chat` | AI 채팅 (메인 페이지, SSE 스트리밍) |
| `Auth.tsx` | 847 | `/auth` | 로그인/회원가입 |
| `Product.tsx` | 774 | `/product` | 제품 소개 (미니 피쳐 탭) |
| `Profile.tsx` | 635 | `/profile` | 프로필 + 아바타 + 라이선스 |
| `Contact.tsx` | 629 | `/contact` | 문의 폼 (submit-contact EF) |
| `About.tsx` | 409 | `/about` | 회사 소개 |
| `Subscribe.tsx` | 401 | `/subscribe` | 구독 선택 |
| `Index.tsx` | 216 | `/index` | 랜딩 페이지 |
| `Pricing.tsx` | 211 | `/pricing` | 가격 정보 |
| `Dashboard.tsx` | 192 | `/dashboard` | 사용자 대시보드 |
| `Privacy.tsx` | 156 | `/privacy` | 개인정보처리방침 |
| `Terms.tsx` | 156 | `/terms` | 이용약관 |
| `NotFound.tsx` | 38 | `*` | 404 페이지 |

> **주의**: `Chat.tsx` (2,260줄)는 리팩토링 최우선 대상. 현재 SSE 스트리밍, 대화 관리, UI 렌더링이 단일 파일에 혼재.

---

## 5. 환경변수 목록 (VITE_ 접두사)

> 상세 내용은 [Section 14.2](#142-환경변수-목록-vite_-접두사--상세) 참조. 하드코딩 vs `.env` 분류 포함.

---

## 6. 다국어 (i18n) 현황

### 설정

- **프레임워크**: i18next + react-i18next
- **기본 언어**: `ko` (한국어)
- **Fallback 언어**: `ko`
- **설정 파일**: `src/i18n/config.ts`

### 지원 언어

| 언어 코드 | 언어명 | 파일 | LOC | 번역 키 수 |
|-----------|--------|------|-----|-----------|
| `ko` | 한국어 | `locales/ko.ts` | 777 | ~486개 |
| `en` | English | `locales/en.ts` | 683 | ~411개 |
| `ja` | 日本語 | — | — | **미구현** |

### 번역 키 카테고리 분포

| 네임스페이스 | 설명 | ko 키 수 (추정) |
|-------------|------|-----------------|
| `nav` | 네비게이션 | 5 |
| `hero` | 히어로 섹션 | 15 |
| `benefits` | 비즈니스 임팩트 | 7 |
| `valueProps` | 가치 제안 | 8 |
| `vision` | 비전 | 7 |
| `features` | 기능 소개 (NeuralSense/Mind/Twin) | 30 |
| `useCases` | 유즈케이스 | 9 |
| `product` | 제품 상세 (기술 파이프라인, 미니 피쳐) | ~120 |
| `pricing` | 가격 + FAQ | ~60 |
| `contact` | 문의 폼 + 개인정보처리방침 | ~100 |
| `auth` | 인증 | 15 |
| `subscribe` | 구독 | 8 |
| `profile` | 프로필 | 8 |
| `settings` | 설정 | 4 |
| `dashboardFeatures` | 데모 피쳐 (Funnel, Demand, Product) | ~80 |
| `cta`, `finalCta`, `footer` | CTA + 풋터 | 20 |

### 불일치 사항

| 항목 | ko | en |
|------|----|----|
| 번역 키 수 | ~486 | ~411 |
| 차이 | — | **~75개 키 누락** |
| `contact.consent` 섹션 | 있음 (상세 개인정보처리방침) | **없음** |
| `product.hero.benefits` 섹션 | 있음 | **없음** |
| `product.technology` 상세 | 있음 | 축약됨 |

> **TODO**: en 번역 75개 키 보충 필요. 특히 `contact.consent.privacyDoc` (개인정보처리방침 영문) 미번역.
> **TODO**: ja (일본어) 번역 파일 신규 생성 필요.

---

## 7. 모노레포 이동 시 예상 작업

### 7-1. 이미 완료된 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| pnpm workspace 통합 | ✅ 완료 | `pnpm-workspace.yaml`에 `apps/*` 포함 |
| @neuraltwin/types 의존성 | ✅ 완료 | `workspace:*`로 연결 |
| @neuraltwin/ui 의존성 | ✅ 완료 | `workspace:*`로 연결 |
| Supabase 클라이언트 타입 적용 | ✅ 완료 | `createClient<Database>()` |
| Turborepo 빌드 파이프라인 | ✅ 완료 | `turbo.json` 설정됨 |
| Vercel 배포 설정 | ✅ 완료 | `vercel.json` 존재 |
| CI/CD (ci.yml) | ✅ 완료 | type-check → lint → build |

### 7-2. 남은 작업 (우선순위별)

#### P0 — 보안

| 작업 | 예상 공수 | 설명 |
|------|----------|------|
| Chat.tsx 환경변수 직접 참조 제거 | 0.5d | `import.meta.env` 직접 참조 3곳 → Supabase 클라이언트 함수로 래핑 |

#### P1 — Chat UI 추출 (★ 핵심)

| 작업 | 예상 공수 | 설명 |
|------|----------|------|
| `shared/chat/` → `@neuraltwin/chat` 패키지 생성 | 1d | 13파일 1,818 LOC 이동 |
| Chat 컴포넌트 Props 인터페이스 정리 | 0.5d | channel 구분 (website/os_app) |
| OS Dashboard 측 import 경로 변경 | 0.5d | D팀 협업 필요 |
| 공유 타입 `chat.types.ts` → `@neuraltwin/types` 이동 | 0.5d | A팀 협업 필요 |

#### P2 — shadcn/ui 중복 제거

| 작업 | 예상 공수 | 설명 |
|------|----------|------|
| Website (48개) vs OS Dashboard (49개) 비교 | 0.5d | 차이점 식별 |
| 공통 컴포넌트 → `@neuraltwin/ui` 이동 | 2d | 점진적 마이그레이션 |
| OS Dashboard glassmorphism 변형 처리 | 1d | 테마/변형 시스템 설계 |

#### P3 — 코드 품질

| 작업 | 예상 공수 | 설명 |
|------|----------|------|
| Chat.tsx 리팩토링 (2,260줄) | 2d | 훅/컴포넌트 분리 |
| i18n en 번역 보충 (77키) | 1d | `contact.consent` 등 |
| i18n ja 번역 추가 | 2d | 일본어 번역 파일 신규 생성 |
| Three.js 버전 정렬 | 0.5d | 0.160.0 → OS Dashboard와 동일 버전 |
| 레거시 Footer.tsx 제거 | 0.25d | `components/Footer.tsx` (layout/Footer와 중복) |

#### P4 — 테스트

| 작업 | 예상 공수 | 설명 |
|------|----------|------|
| Vitest 설정 | 0.5d | vite.config.ts에 test 설정 추가 |
| Chat 컴포넌트 단위 테스트 | 2d | ChatBubble, ChatInput, useStreaming 등 |
| 페이지 통합 테스트 | 2d | React Testing Library |

### 7-3. 의존성 그래프

```
@neuraltwin/website
├── @neuraltwin/types (workspace:*)     ← DB, API, Auth 타입
├── @neuraltwin/ui (workspace:*)        ← Button, Input, Dialog, Card
├── @supabase/supabase-js              ← Supabase 클라이언트
├── @tanstack/react-query              ← 서버 상태 관리
├── three + @react-three/*             ← 3D 시각화
├── react-hook-form + zod              ← 폼 + 검증
├── i18next + react-i18next            ← 다국어
├── recharts                           ← 차트
├── framer-motion                      ← 애니메이션
└── jspdf + xlsx + docx                ← 문서 내보내기
```

### 7-4. Edge Function 연결 현황

> 상세 내용은 [Section 14.1.3](#1413-edge-function-호출-목록) 참조. 호출 방식, 요청/응답 상세 포함.

---

## 8. Chat UI 컴포넌트 상세 분석 (★ 추출 대상)

### 8-1. 아키텍처 개요

`src/shared/chat/` 는 이미 **variant 시스템**을 내장하여 website/os 양쪽에서 사용 가능하도록 설계되어 있다.

```
shared/chat/
├── index.ts                    # barrel export (9개 심볼)
├── types/chat.types.ts         # 타입 + 상수 (CHAT_STYLES, WELCOME_MESSAGES)
├── components/                 # UI 컴포넌트 7개
│   ├── ChatBubble.tsx          # 메시지 버블 (Markdown 렌더링)
│   ├── ChatInput.tsx           # 입력창 (자동 높이 + 글자수 제한)
│   ├── ChatScrollArea.tsx      # 자동 스크롤 영역
│   ├── WelcomeMessage.tsx      # 초기 인사 + 추천 질문
│   ├── SuggestionChips.tsx     # 후속 질문 칩
│   ├── FeedbackButtons.tsx     # 👍/👎 피드백
│   └── TypingIndicator.tsx     # 타이핑 인디케이터
├── hooks/                      # 로직 훅 2개
│   ├── useStreaming.ts         # SSE 스트리밍 (fetch + ReadableStream)
│   └── useChatSession.ts       # 세션 관리 (localStorage)
└── utils/                      # 유틸 2개
    ├── exportConversation.ts   # 대화 내보내기 (PDF/DOCX/TXT/MD)
    └── fileUpload.ts           # 파일 업로드 핸들링
```

### 8-2. Variant 시스템 분석

**타입 정의**: `ChatVariant = 'website' | 'os'`

모든 UI 컴포넌트가 `variant` prop을 받아 테마를 전환한다:

| 속성 | `website` | `os` |
|------|-----------|------|
| 배경 | `#0a0a0a` (dark navy) | `hsl(var(--background))` |
| 유저 버블 | `#1a1a2e` | `hsl(var(--primary))` |
| AI 버블 | `#16213e` | `hsl(var(--muted))` |
| 텍스트 | `#ffffff` | `hsl(var(--foreground))` |
| 액센트 | `#00d4aa` (teal) | `hsl(var(--primary))` |
| 입력 배경 | `#111111` | `hsl(var(--background))` |
| 입력 보더 | `#333333` | `hsl(var(--border))` |

> website = **하드코딩된 다크 테마**, os = **shadcn/ui CSS 변수 기반** (라이트/다크 자동 대응)

### 8-3. 컴포넌트별 Props 인터페이스

```typescript
// ChatBubble — 메시지 버블
interface ChatBubbleProps {
  message: ChatMessageUI;      // id, role, content, timestamp, isStreaming, feedback
  variant?: ChatVariant;        // 'website' | 'os' (default: 'website')
  showTimestamp?: boolean;      // 타임스탬프 표시 (default: false)
  feedbackSlot?: React.ReactNode; // 피드백 UI 삽입 슬롯
}

// ChatInput — 입력창
interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;         // default: '예: 이번 시즌 VMD 트렌드 알려줘'
  disabled?: boolean;
  maxLength?: number;           // default: 1000
  variant?: ChatVariant;
}

// ChatScrollArea — 스크롤 영역
interface ChatScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

// WelcomeMessage — 초기 인사
interface WelcomeMessageProps {
  variant?: ChatVariant;
  suggestions?: string[];       // 커스텀 추천 질문 (없으면 기본값)
  onSuggestionSelect?: (suggestion: string) => void;
}

// SuggestionChips — 추천 질문
interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  maxItems?: number;            // default: 3
  variant?: ChatVariant;
}

// FeedbackButtons — 피드백
interface FeedbackButtonsProps {
  messageId: string;
  currentFeedback?: 'positive' | 'negative';
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
  disabled?: boolean;
}

// TypingIndicator — 타이핑 중
interface TypingIndicatorProps {
  text?: string;                // default: 'NEURAL이 답변 중...'
  variant?: ChatVariant;
}
```

### 8-4. Hook 인터페이스

```typescript
// useStreaming — SSE 스트리밍
interface UseStreamingOptions {
  onDelta: (chunk: string) => void;
  onComplete: (metadata: StreamingMetadata) => void;
  onError: (error: string) => void;
}
// Returns: { startStreaming(url, body), abort(), isStreaming() }

// useChatSession — 세션 관리
interface UseChatSessionResult {
  sessionId: string;             // crypto.randomUUID() 기반
  conversationId: string | null; // 서버 응답에서 수신
  setConversationId: (id: string) => void;
  clearSession: () => void;
}
```

### 8-5. 외부 의존성 (추출 시 포함 필요)

| 의존성 | 사용 위치 | 용도 |
|--------|----------|------|
| `framer-motion` | 6/7 컴포넌트 | 애니메이션 (motion.div, AnimatePresence) |
| `react-markdown` | ChatBubble | AI 응답 Markdown 렌더링 |
| `lucide-react` | 4 컴포넌트 | 아이콘 (Send, ThumbsUp, ThumbsDown, ChevronDown, Brain, Bot, ArrowRight) |
| `@/lib/utils` (cn) | 6/7 컴포넌트 | className 병합 |
| `@/components/ui/button` | ChatInput | 전송 버튼 |
| `jspdf` | exportConversation | PDF 내보내기 |
| `docx` | exportConversation | DOCX 내보내기 |
| `file-saver` | exportConversation | 파일 다운로드 |

### 8-6. 추출 계획: `packages/@neuraltwin/ui/chat/`

**구조**:
```
packages/ui/
├── src/
│   ├── index.ts                    # 기존 exports + chat re-export
│   ├── button.tsx, input.tsx, ...  # 기존 4개
│   ├── chat/                       # ★ 새로 추가
│   │   ├── index.ts
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatScrollArea.tsx
│   │   ├── WelcomeMessage.tsx
│   │   ├── SuggestionChips.tsx
│   │   ├── FeedbackButtons.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── chat.types.ts
│   ├── hooks/
│   │   ├── useStreaming.ts
│   │   └── useChatSession.ts
│   └── utils/
│       ├── exportConversation.ts
│       └── fileUpload.ts
└── package.json                    # + framer-motion, react-markdown 의존성 추가
```

**마이그레이션 단계**:
1. `packages/ui/package.json`에 framer-motion, react-markdown, lucide-react 추가
2. 파일 이동 + `@/lib/utils` → `../lib/utils` import 경로 수정
3. `@/components/ui/button` → `../button` import 경로 수정
4. Website: `import { ChatBubble } from '@neuraltwin/ui/chat'`
5. OS Dashboard: `import { ChatBubble } from '@neuraltwin/ui/chat'` + `variant="os"`
6. 예상 절감: **~2,500 LOC** 중복 제거 (website 1,818 + OS 측 유사 코드)

---

## 9. shadcn/ui 현황 분석

### 9-1. 컴포넌트 비교 (Website vs OS Dashboard)

| 앱 | 파일 수 | 상태 |
|-----|--------|------|
| Website | 48개 (46 .tsx + 1 .ts + use-toast) | 대부분 `@neuraltwin/ui` re-export |
| OS Dashboard | 49개 (47 .tsx + 1 .ts + glass-card) | 로컬 구현 (glassmorphism) |

### 9-2. 커스터마이징 상태

**Website**: 핵심 4개 컴포넌트를 `@neuraltwin/ui`에서 re-export (2줄짜리 래퍼)

```typescript
// apps/website/src/components/ui/button.tsx (2줄)
export { Button, buttonVariants, type ButtonProps } from '@neuraltwin/ui';
```

**OS Dashboard**: 독립적인 로컬 구현 (glassmorphism 스타일링)

| 컴포넌트 | Website LOC | OS Dashboard LOC | 커스터마이징 수준 |
|----------|-------------|------------------|-------------------|
| `button.tsx` | 2 (re-export) | 146 | **Heavy** — glassmorphism, MutationObserver 다크모드 |
| `input.tsx` | 2 (re-export) | 51 | **Heavy** — gradient 배경, 인라인 스타일 |
| `dialog.tsx` | 13 (re-export) | 269 | **Very Heavy** — 3D perspective, 다층 glass 효과 |
| `card.tsx` | 2 (re-export) | 43 | **Minimal** — 표준 shadcn/ui |
| `glass-card.tsx` | 없음 | 286 | **Unique** — 3D glassmorphism + Icon3D, Badge3D |

### 9-3. 동일/다른 컴포넌트 분류

**동일 (표준 shadcn/ui)** — 공유 가능 대상:
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

→ **44개 공유 가능** (표준 shadcn/ui 그대로)

**다른 (앱별 유지 필요):**
| 컴포넌트 | 이유 |
|----------|------|
| `button.tsx` | OS: glassmorphism |
| `dialog.tsx` | OS: 3D glass overlay |
| `input.tsx` | OS: gradient 배경 |
| `glass-card.tsx` | OS 전용 (286줄) |

### 9-4. 통합 전략

```
@neuraltwin/ui (공유)
├── button.tsx (표준 shadcn/ui)
├── input.tsx (표준 shadcn/ui)
├── dialog.tsx (표준 shadcn/ui)
├── card.tsx (표준 shadcn/ui)
└── [+44개 표준 컴포넌트 점진적 추가]

apps/os-dashboard/src/components/ui/ (로컬 유지)
├── button.tsx (glassmorphism override)
├── dialog.tsx (glass overlay override)
├── input.tsx (gradient override)
└── glass-card.tsx (OS 전용)
```

---

## 10. Tailwind 커스텀 색상 분석

### 10-1. CSS 커스텀 속성 비교

| 항목 | Website | OS Dashboard |
|------|---------|-------------|
| CSS 변수 선언 수 | 74개 | 87개 |
| 고유 변수명 수 | 42개 | 56개 |
| 공통 변수 | **30개** | **30개** |
| Website 전용 | **12개** | — |
| OS Dashboard 전용 | — | **26개** |

### 10-2. 공통 변수 (30개) — 프리셋 추출 대상

```
--accent, --accent-foreground, --background, --border, --card, --card-foreground,
--destructive, --destructive-foreground, --foreground, --glass-bg, --glass-border,
--input, --muted, --muted-foreground, --popover, --popover-foreground,
--primary, --primary-foreground, --radius, --ring,
--secondary, --secondary-foreground,
--sidebar-accent, --sidebar-accent-foreground, --sidebar-background,
--sidebar-border, --sidebar-foreground, --sidebar-primary,
--sidebar-primary-foreground, --sidebar-ring
```

### 10-3. Website 전용 변수 (12개)

| 변수 | 용도 |
|------|------|
| `--gradient-accent` | 악센트 그라디언트 |
| `--gradient-chrome` | 크롬 그라디언트 |
| `--gradient-dark` | 다크 그라디언트 |
| `--gradient-metallic` | 메탈릭 그라디언트 |
| `--gradient-primary` | 프라이머리 그라디언트 |
| `--primary-glow` | 프라이머리 글로우 |
| `--primary-variant` | 프라이머리 변형 |
| `--shadow-chrome` | 크롬 그림자 |
| `--shadow-glass` | 글래스 그림자 |
| `--shadow-glow` | 글로우 그림자 |
| `--shadow-sharp` | 날카로운 그림자 |
| `--shadow-soft` | 부드러운 그림자 |

### 10-4. OS Dashboard 전용 변수 (26개)

| 변수 | 용도 |
|------|------|
| `--background-gradient` | 배경 그라디언트 |
| `--blur-glass`, `--blur-subtle` | 블러 강도 |
| `--chart-1` ~ `--chart-5` | 차트 색상 5개 |
| `--chrome-left`, `--chrome-top`, `--chrome-top-dark` | 크롬 하이라이트 |
| `--glass-bg-dark`, `--glass-border-dark` | 다크 글래스 |
| `--glass-reflection`, `--glass-reflection-dark` | 반사 효과 |
| `--icon-bg`, `--icon-bg-dark` | 아이콘 배경 |
| `--radius-sm`, `--radius-xs` | 추가 반지름 크기 |
| `--shadow-3d`, `--shadow-3d-dark` | 3D 그림자 |
| `--success`, `--success-foreground` | 성공 색상 |
| `--text-3d-dark`, `--text-3d-hero`, `--text-3d-label` | 3D 텍스트 효과 |

### 10-5. Tailwind 설정 비교

| 항목 | Website | OS Dashboard |
|------|---------|-------------|
| `tailwind.config.ts` 색상 | shadcn 표준 + chrome, glass | shadcn 표준 + primary.dark |
| 커스텀 폰트 | 없음 | Pretendard, Inter |
| keyframes | 6개 | 10개 |
| animations | 6개 | 12개 (+ enter/exit 조합) |
| boxShadow | 없음 | 7단계 (2xs ~ 2xl) |
| borderRadius | 표준 3단계 | 표준 3단계 |

### 10-6. `@neuraltwin/tailwind-preset` 설계

```typescript
// packages/tailwind-preset/src/index.ts
export const neuraltwinPreset = {
  theme: {
    extend: {
      colors: {
        // 30개 공통 CSS 변수 기반 색상
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: { /* 8개 사이드바 변수 */ },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { /* 공통 */ },
        "accordion-up": { /* 공통 */ },
        "fade-in": { /* 공통 */ },
        "scale-in": { /* 공통 */ },
        "float": { /* 공통 */ },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

**사용 방식**:
```typescript
// apps/website/tailwind.config.ts
import { neuraltwinPreset } from '@neuraltwin/tailwind-preset';
export default {
  presets: [neuraltwinPreset],
  theme: {
    extend: {
      colors: {
        chrome: { /* website 전용 */ },
        glass: { /* website 전용 */ },
      },
    },
  },
};
```

---

## 11. 보안 취약점 분석

### 11-1. Supabase URL/Key 하드코딩 — ✅ 수정 완료

| 항목 | 상태 | 커밋 |
|------|------|------|
| `.env` 파일 Git 삭제 | ✅ 수정됨 | `6343d49` (2026-02-25) |
| `client.ts` 환경변수 전환 | ✅ 수정됨 | `6343d49` (2026-02-25) |
| `.gitignore`에 `.env` 추가 | ✅ 적용됨 | 루트 `.gitignore` |

### 11-2. Git 히스토리 내 키 노출 — ⚠️ 주의 필요

커밋 `bff06ac` (subtree import) 에서 `.env` 파일이 포함되어 Git 히스토리에 다음 정보 잔존:

| 항목 | 노출 내용 | 위험도 |
|------|----------|--------|
| `VITE_SUPABASE_URL` | `https://bdrvowacecxnraaivlhr.supabase.co` | 🟡 낮음 (공개 URL) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` (anon key) | 🟡 낮음 (anon key는 공개용) |
| `VITE_SUPABASE_PROJECT_ID` | `bdrvowacecxnraaivlhr` | 🟢 낮음 (공개 정보) |

> **판정**: Supabase anon key는 설계상 공개 키 (클라이언트 사이드 RLS 기반). service_role_key가 노출되지 않았으므로 **즉각적인 키 로테이션은 불필요**. 다만 히스토리 정리 시 `git filter-branch` 또는 `BFG Repo-Cleaner` 권장.

### 11-3. 현재 소스 코드 내 하드코딩 검사 — ✅ 클린

| 검사 항목 | Website | OS Dashboard |
|-----------|---------|-------------|
| JWT 토큰 하드코딩 (`eyJ`) | ❌ 없음 | ❌ 없음 |
| Supabase URL 하드코딩 | ❌ 없음 | ❌ 없음 (주석 내 예시 1건만 존재) |
| API 키 하드코딩 | ❌ 없음 | ❌ 없음 |
| `.env` 파일 추적 | ❌ 없음 (.gitignore) | ❌ 없음 (.gitignore) |

### 11-4. Chat.tsx 환경변수 직접 참조 — ⚠️ 개선 필요

`pages/Chat.tsx`에서 `import.meta.env.VITE_SUPABASE_URL`을 **3곳** 직접 참조:

```typescript
// 라인 531, 757, 832
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

**문제**: EF 호출 URL을 수동으로 조립. Supabase 클라이언트의 `functions.invoke()`를 사용하지 않음.

**권장 수정**:
```typescript
// Before (3곳 반복)
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retail-chatbot`;
fetch(url, { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } });

// After (1곳으로 통합)
import { supabase } from '@/integrations/supabase/client';
// SSE는 supabase.functions.invoke가 지원하지 않으므로 래퍼 함수 사용
const url = `${supabase.supabaseUrl}/functions/v1/retail-chatbot`;
```

### 11-5. 즉시 수정 필요 항목 요약

| 우선순위 | 항목 | 상태 | 조치 |
|---------|------|------|------|
| P0 | `.env` Git 추적 제거 | ✅ 완료 | `6343d49`에서 삭제됨 |
| P0 | 소스 내 키 하드코딩 | ✅ 클린 | 현재 하드코딩 없음 |
| P1 | Chat.tsx env 직접 참조 | ⚠️ 미완 | 래퍼 함수로 통합 필요 |
| P2 | Git 히스토리 키 잔존 | ⚠️ 잔존 | BFG Cleaner로 정리 권장 (anon key라 긴급성 낮음) |

---

## 12. 다국어 (i18n) 상세 분석

### 12-1. 현재 구조

**프레임워크**: i18next v25.6.3 + react-i18next v16.3.5

**설정** (`src/i18n/config.ts`):
```typescript
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: 'ko',           // 기본 언어: 한국어
  fallbackLng: 'ko',   // 폴백 언어: 한국어
  interpolation: { escapeValue: false },
});
```

**언어 전환**: `LanguageToggle.tsx` — ko/en 토글 (URL 변경 없음, localStorage 미저장)

**번역 파일**:

| 파일 | LOC | 리프 키 수 | 상태 |
|------|-----|-----------|------|
| `locales/ko.ts` | 777 | ~486 | 기준 (마스터) |
| `locales/en.ts` | 683 | ~411 | **~75개 키 누락** |
| `locales/ja.ts` | — | — | **미구현** |

> **구조적 한계**: 단일 `translation` 네임스페이스에 모든 키를 flat object로 관리. 네임스페이스 분리 (lazy loading) 미적용.

### 12-2. 네임스페이스별 번역 키 비교 (ko vs en)

| 네임스페이스 | ko 키 | en 키 | 차이 | 누락 상세 |
|-------------|-------|-------|------|-----------|
| `nav` | 5 | 5 | 0 | — |
| `hero` | 16 | 16 | 0 | — |
| `benefits` | 8 | 8 | 0 | — |
| `valueProps` | 8 | 8 | 0 | — |
| `vision` | 7 | 7 | 0 | — |
| `finalCta` | 3 | 3 | 0 | — |
| `features` | 30 | 30 | 0 | — |
| `useCases` | 10 | 10 | 0 | — |
| `cta` | 5 | 5 | 0 | — |
| `footer` | 17 | 17 | 0 | copyright 연도 불일치 |
| `product` | **84** | **79** | **-5** | `hero.benefits` 구조 상이 |
| `pricing` | 57 | 57 | 0 | — |
| `contact` | **~116** | **~47** | **-69** | `consent` 섹션 전체 누락 |
| `auth` | 20 | 20 | 0 | — |
| `subscribe` | 10 | 10 | 0 | — |
| `welcome` | **1** | **0** | **-1** | 최상위 키 누락 |
| `profile` | 8 | 8 | 0 | — |
| `settings` | 4 | 4 | 0 | — |
| `dashboardFeatures` | 77 | 77 | 0 | — |
| **합계** | **~486** | **~411** | **~-75** | |

### 12-3. 누락 번역 키 상세 (en에 없는 키)

#### A. `contact.consent` — **65개 키 전체 누락** (🔴 Critical)

개인정보처리방침 및 마케팅 동의 전체 섹션이 영문 미번역:

```
contact.consent.required, optional, privacy, marketing, view, close,
  privacyRequired, privacyTitle
contact.consent.privacyDoc.intro, section1Title, section1Desc, service,
  serviceItems, servicePurpose, marketing, marketingItems, marketingPurpose,
  section2Title~section10Title, section2Desc~section10Desc,
  retention1~4, thirdParty1~2, rights1~4, rightsNote,
  destroy1~2, safety1~3, officer, contact,
  remedy1~4, effectiveDate, implementDate           (~50개)
contact.consent.marketingTitle
contact.consent.marketingDoc.intro, items, purpose, method, period, note  (6개)
```

> 법률 문서이므로 전문 법률 번역가 검토 필요.

#### B. `product.hero` — **5개 키 구조 차이** (🟡 Medium)

| ko 키 | en 대응 |
|--------|---------|
| `product.hero.description2` | ❌ 없음 |
| `product.hero.description3` | ❌ 없음 |
| `product.hero.benefits.sales.value/title/description` | `product.benefits.timeReduction/timeDesc` (구조 다름) |
| `product.hero.benefits.realtime.value/title/description` | `product.benefits.revenueIncrease/revenueDesc` (구조 다름) |
| `product.hero.benefits.visibility.value/title/description` | `product.benefits.costReduction/costDesc` (구조 다름) |

> en은 `product.benefits`에 flat 구조 (6키)로 대응, ko는 `product.hero.benefits` 내 중첩 구조 (9키 + value 포함).
> ⚠️ **런타임 오류 위험**: 같은 컴포넌트가 `t('product.hero.benefits.sales.value')` 호출 시 en에서 undefined 반환.

#### C. `contact` 구조 불일치 — **키 이름 자체가 다름** (🟡 Medium)

| ko 키 | en 키 | 비고 |
|--------|-------|------|
| `subtitlePart1~4, subtitleHighlight1~3` (7키) | `subtitleBefore, subtitleHighlight, subtitleAfter` (3키) | 구조 자체가 다름 |
| `successTitle` | `success` | 키명 불일치 |
| `successMessage` | `successDesc` | 키명 불일치 |

> ⚠️ **런타임 오류 위험**: Contact.tsx에서 `t('contact.successTitle')` 호출 시 en에서 undefined.

#### D. `welcome` — **1개 키 누락** (🟢 Low)

| ko | en |
|----|----|
| `welcome: "환영합니다"` | ❌ 없음 |

### 12-4. 번역 품질 검토

#### A. 의도적 현지화 (Localization ≠ Translation) — 양호

다음 항목은 직역이 아닌 의도적 현지화로 판단:

| 키 | ko | en | 판정 |
|----|----|----|------|
| `hero.headline1` | "궁극의 AI 리테일 인텔리전스" | "The Fastest Growing Store Operations Analytics Tool" | ✅ 현지화 |
| `hero.subheadline1` | "가장 진보한 스마트 리테일의 미래." | "3x Operational Efficiency with Store Digital Twin" | ✅ 현지화 |
| `valueProps.title2` | "강력한 데이터 통합 관리" | "Fast Decision Making" | ✅ 현지화 |
| `valueProps.title3` | "실시간 매장 현황 분석" | "Customer-Centric Operations" | ✅ 현지화 |

> ko = 기술 중심 메시지, en = 비즈니스 성과 중심 메시지. 마케팅 전략상 의도적 현지화로 보임.

#### B. 일관성 문제 — ⚠️ 수정 필요

| 항목 | ko | en | 문제 |
|------|----|----|------|
| `footer.copyright` | `"© 2025 NEURALTWIN..."` | `"© 2024 NEURALTWIN..."` | **연도 불일치** (2024 → 2025 통일 필요) |
| `contact.info.email` | `neuraltwin.hq@neuraltwin.io` | `contact@neuraltwin.com` | **이메일 주소 다름** (의도적일 수 있으나 확인 필요) |
| `subscribe.store.price` | `₩500,000/월` | `₩500,000/month` | **통화 미현지화** (en에서 USD 표기 필요?) |
| `subscribe.enterprise.price` | `₩3,000,000/월` | `₩3,000,000/month` | **통화 미현지화** (동일 이슈) |

#### C. 기계 번역 의심 항목 — 해당 없음

전반적으로 영문 번역은 자연스럽고 문맥에 맞는 표현 사용. 기계 번역 의심 항목 없음.
특히 `pricing.faq`, `contact.form` 등의 비즈니스 용어가 적절하게 현지화되어 있음.

#### D. 문맥상 부적절한 번역

| 키 | ko | en | 문제 |
|----|----|----|------|
| `pricing.viewer.feature4` | "초대로만 가입 가능" | "Invitation only" | en이 과도하게 축약됨 (UX상 무방) |
| `product.hero.subtitle` | "은 AI와 IoT 인프라를 기반으로..." | "Transformation for Physical Stores" | ko는 "NEURALTWIN" 뒤에 붙는 조사 시작 — en은 완전히 다른 문장 |

### 12-5. SEO 다국어 설정 분석

#### A. 현재 상태 요약

| 항목 | 상태 | 심각도 |
|------|------|--------|
| `<html lang>` 속성 | `lang="en"` 하드코딩 (동적 변경 없음) | 🟡 Medium |
| hreflang 태그 | ❌ 없음 | 🔴 Critical |
| `og:locale` 메타 태그 | ❌ 없음 | 🟡 High |
| `og:url` / canonical 태그 | ❌ 없음 | 🟡 High |
| sitemap.xml | ❌ 없음 | 🟡 High |
| robots.txt | ✅ 기본 설정 (sitemap 참조 없음) | 🟢 Low |
| React Helmet (동적 메타) | ❌ 미설치 | 🟡 High |
| URL 기반 언어 라우팅 | ❌ 없음 (`/en/*`, `/ko/*` 미지원) | 🟡 High |
| 언어 선택 저장 (localStorage) | ❌ 없음 | 🟢 Low |
| `document.documentElement.lang` 동적 변경 | ❌ 없음 | 🟡 Medium |

#### B. `index.html` 현재 상태

```html
<html lang="en">                    <!-- ❌ 기본 언어가 ko인데 en으로 설정됨 -->
<head>
  <meta name="description" content="Create accurate digital twins...">  <!-- 영문 고정 -->
  <meta property="og:title" content="NEURALTWIN" />
  <meta property="og:description" content="Create accurate digital twins..." />
  <!-- ❌ hreflang 없음 -->
  <!-- ❌ og:locale 없음 -->
  <!-- ❌ canonical 없음 -->
  <!-- ❌ og:url 없음 -->
</head>
```

> **주요 문제**: `<html lang="en">`이지만 기본 언어는 `ko`. 검색엔진이 콘텐츠를 잘못 인덱싱할 위험.

#### C. LanguageToggle 제한사항

```typescript
// LanguageToggle.tsx — 현재 구현
const toggleLanguage = () => {
  const newLang = i18n.language === 'ko' ? 'en' : 'ko';
  i18n.changeLanguage(newLang);
  // ❌ document.documentElement.lang 미변경
  // ❌ localStorage 미저장 (새로고침 시 ko로 리셋)
  // ❌ URL 경로 미변경 (/en, /ko 미지원)
};
```

#### D. Vercel 배포 설정

```json
// vercel.json — 단순 SPA rewrite만 설정
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
// ❌ 언어별 라우팅 없음
// ❌ Accept-Language 헤더 기반 리다이렉트 없음
// ❌ Content-Language 응답 헤더 없음
```

#### E. SEO 개선 로드맵

| 우선순위 | 작업 | 효과 | 예상 공수 |
|---------|------|------|----------|
| P0 | `<html lang="ko">` 기본값 수정 + 동적 변경 | 검색엔진 정확도 | 0.25d |
| P0 | hreflang 태그 추가 (`<link rel="alternate" hreflang="ko" />`) | 다국어 SEO | 0.5d |
| P1 | `react-helmet-async` 설치 + 페이지별 메타 태그 | 페이지별 SEO | 1d |
| P1 | sitemap.xml 생성 (언어별 alternate 포함) | 크롤링 효율 | 0.5d |
| P1 | canonical 태그 + og:url + og:locale 추가 | 중복 콘텐츠 방지 | 0.5d |
| P2 | URL 기반 언어 라우팅 (`/ko/*`, `/en/*`) | SEO + UX | 2d |
| P2 | 언어 선택 localStorage 저장 + 브라우저 감지 | UX 개선 | 0.5d |
| P3 | Vercel i18n 설정 (Accept-Language 리다이렉트) | 자동 언어 감지 | 0.5d |

### 12-6. 마케팅 콘텐츠 번역 우선순위

전환율(Conversion Rate) 영향도 기준으로 우선순위 분류:

#### 🔴 P0 — 전환 직결 (즉시 수정)

| 키 경로 | 유형 | 이슈 | 영향 |
|---------|------|------|------|
| `contact.consent.*` (65키) | 법률 문서 | en 전체 누락 | 영문 사용자 개인정보 동의 불가 → **문의 폼 제출 불가** |
| `contact.successTitle` / `successMessage` | CTA 결과 | 키명 불일치 (en: success/successDesc) | **런타임 에러 위험** |
| `contact.subtitlePart1~4` | CTA 부제 | 구조 불일치 (en: subtitleBefore/After) | **런타임 에러 위험** |

#### 🟡 P1 — 고 영향 마케팅 콘텐츠

| 키 경로 | 유형 | 이슈 | 영향 |
|---------|------|------|------|
| `hero.headline1` / `subheadline1` | 랜딩 헤드라인 | 현지화 완료 (양호) | — |
| `hero.cta1` / `cta2` | CTA 버튼 | 번역 완료 (양호) | — |
| `product.hero.benefits.*` (9키) | 제품 성과 지표 | en 구조 상이 → 런타임 위험 | 제품 페이지 KPI 미표시 |
| `product.hero.description2/3` | 제품 설명 | en 누락 | 제품 설명 불완전 |
| `pricing.*` | 가격 정보 | ₩ 통화 미현지화 | 해외 사용자 혼란 |

#### 🟢 P2 — 중 영향

| 키 경로 | 유형 | 이슈 | 영향 |
|---------|------|------|------|
| `welcome` | 환영 메시지 | en 누락 (1키) | 대시보드 진입 시 fallback |
| `footer.copyright` | 저작권 | 연도 불일치 (2024 vs 2025) | 사소하지만 신뢰도 |
| `subscribe.*.price` | 구독 가격 | ₩ 통화 표기 | 해외 사용자 혼란 |

#### 🔵 P3 — 낮은 영향

| 키 경로 | 유형 | 이슈 | 영향 |
|---------|------|------|------|
| `dashboardFeatures.*` | 데모 피쳐 | 번역 완료 (양호) | — |
| `auth.*` | 인증 | 번역 완료 (양호) | — |
| `profile.*` / `settings.*` | 사용자 설정 | 번역 완료 (양호) | — |

### 12-7. 종합 액션 아이템

| # | 작업 | 우선순위 | 예상 공수 | 담당 |
|---|------|---------|----------|------|
| 1 | `contact.consent.*` 영문 번역 추가 (65키) | P0 | 1d | E + 법률 |
| 2 | `contact` 키 구조 통일 (subtitle, success 키명) | P0 | 0.5d | E |
| 3 | `product.hero.benefits` 구조 통일 (ko/en 동일 구조) | P0 | 0.5d | E |
| 4 | `welcome` 키 en 추가 | P0 | 0.1d | E |
| 5 | `<html lang="ko">` 수정 + 동적 변경 | P0 | 0.25d | E |
| 6 | hreflang 태그 추가 | P1 | 0.5d | E |
| 7 | react-helmet-async 설치 + 페이지별 메타 | P1 | 1d | E |
| 8 | sitemap.xml 생성 | P1 | 0.5d | E |
| 9 | `footer.copyright` 연도 통일 | P2 | 0.1d | E |
| 10 | 가격 통화 현지화 ($USD for en) | P2 | 0.5d | E + 비즈니스 |
| 11 | URL 기반 언어 라우팅 (`/ko/*`, `/en/*`) | P2 | 2d | E |
| 12 | ja (일본어) 번역 파일 신규 생성 (~486키) | P3 | 3d | E + 번역 |
| | **합계** | | **~10d** | |

---

## 13. `@ts-ignore` / `as any` 전수 조사

### 13-1. 전체 현황 요약

> **참고**: `WORK_GUIDE_C.md`에 기재된 "92개 @ts-ignore"는 과거 상태이며, 현재는 대부분 제거됨. 실제 타입 안전성 이슈는 `as any` 사용에 집중.

| 지시자 | Website | OS Dashboard | Supabase EF | 합계 |
|--------|---------|-------------|-------------|------|
| `@ts-ignore` | 0 | 0 | **1** | **1** |
| `@ts-expect-error` | 0 | **1** | 0 | **1** |
| `@ts-nocheck` | 0 | 0 | 0 | 0 |
| `as any` | **4** | **328** | **73** | **405** |
| **타입 안전성 이슈 합계** | **4** | **329** | **74** | **407** |

### 13-2. `@ts-ignore` / `@ts-expect-error` 상세 (2건)

| # | 파일 | 라인 | 지시자 | 이유 | 수정 방법 |
|---|------|------|--------|------|----------|
| 1 | `supabase/.../generate-optimization/index.ts` | 1423 | `@ts-ignore` | `tool_call_id`는 OpenRouter에서 필요하지만 타입 미지원 | OpenRouter 응답 타입에 `tool_call_id` 추가 정의 |
| 2 | `apps/os-dashboard/.../DataImportWidget.tsx` | 723 | `@ts-expect-error` | Supabase query builder 깊은 타입 인스턴스화 한계 | Supabase 쿼리 래퍼 함수로 분리 |

### 13-3. Website `as any` 상세 (4건) — E 담당 즉시 수정 가능

| # | 파일 | 라인 | 코드 | 이유 | 수정 방법 |
|---|------|------|------|------|----------|
| 1 | `pages/Auth.tsx` | 14 | `(location.state as any)?.tab` | `location.state` 타입 미정의 | `location.state as { tab?: string }` |
| 2 | `pages/Auth.tsx` | 26 | `(location.state as any)?.tab` | 동일 (useEffect 내) | 동일 — 공통 타입 추출 |
| 3 | `pages/Profile.tsx` | 44 | `(location.state as any)?.tab` | `location.state` 타입 미정의 | `location.state as { tab?: string }` |
| 4 | `components/features/ProductPerformance.tsx` | 213 | `setSortBy(v as any)` | Select onValueChange 타입 불일치 | `setSortBy(v as SortKey)` + union 타입 정의 |

**수정 계획** (Website 4건):

```typescript
// 수정 1,2,3: location.state 타입 정의
// src/types/router.ts (신규)
interface LocationState {
  tab?: 'login' | 'signup' | 'account' | 'subscription' | 'notifications' | 'security';
}

// Auth.tsx, Profile.tsx
const tabFromState = (location.state as LocationState)?.tab;

// 수정 4: sortBy union 타입 정의
type SortKey = 'revenue' | 'sales' | 'stock' | 'change';
setSortBy(v as SortKey);
```

> **예상 공수**: 0.25d — 즉시 수정 가능

### 13-4. OS Dashboard `as any` 카테고리 분석 (328건)

| # | 카테고리 | 건수 | 비율 | 대표 파일 | 수정 방법 |
|---|---------|------|------|----------|----------|
| 1 | **Supabase 쿼리 빌더 타입 우회** | ~115 | 35% | useOnboarding.ts(26), useROITracking.ts(26), usePOSIntegration.ts(19) | 타입드 쿼리 래퍼 함수 생성 |
| 2 | **JSON/API 응답 미타이핑** | ~95 | 29% | modelLayerLoader.ts(32), useStoreContext.ts(16) | JSONB 필드 인터페이스 정의 (Vector3D, Transform 등) |
| 3 | **중첩 metadata 프로퍼티 접근** | ~59 | 18% | DigitalTwinStudioPage.tsx(18), sceneStore.ts(9) | 판별 유니언 타입 + 타입 가드 |
| 4 | **배열 타입 캐스팅** | ~26 | 8% | sceneRecipeGenerator.ts(11), useLayoutSimulation.ts(3) | 제네릭 `Array<T>` 명시 |
| 5 | **서드파티 라이브러리 타입 불일치** | ~20 | 6% | Canvas3D.tsx(2), UnifiedDataUpload.tsx(6) | 어댑터 인터페이스 생성 |
| 6 | **불필요한 lazy 타이핑** | ~13 | 4% | buildRetailOntologyGraph.ts(6), EntityTypeManager.tsx(3) | 직접 리팩토링 (즉시 가능) |

**핫스팟 파일 (상위 10)**:

| 파일 | 건수 | 주요 패턴 | 우선순위 |
|------|------|----------|---------|
| `modelLayerLoader.ts` | 32 | JSONB 필드 접근 (position, rotation, scale) | 🔴 |
| `useOnboarding.ts` | 26 | `supabase.from('table' as any)` | 🟡 |
| `useROITracking.ts` | 26 | Supabase 쿼리 + JSON 응답 | 🟡 |
| `AIOptimizationTab.tsx` | 21 | metadata 접근 + 진단 데이터 | 🟡 |
| `usePOSIntegration.ts` | 19 | Supabase 쿼리 빌더 | 🟡 |
| `DigitalTwinStudioPage.tsx` | 18 | metadata.childProducts 접근 | 🟡 |
| `useStoreContext.ts` | 16 | 복합 (쿼리 + JSON + 메타) | 🟡 |
| `sceneRecipeGenerator.ts` | 11 | 배열 캐스팅 + 데이터 변환 | 🟢 |
| `useSceneSimulation.ts` | 11 | 시뮬레이션 결과 타이핑 | 🟢 |
| `sceneStore.ts` | 9 | metadata + childProducts | 🟢 |

### 13-5. Supabase Edge Functions `as any` 카테고리 분석 (73건)

| # | 카테고리 | 건수 | 비율 | 대표 파일 | 수정 방법 |
|---|---------|------|------|----------|----------|
| 1 | **문자열→숫자 변환** | ~23 | 32% | process-wifi-data(23) | `parseFloatSafe(row.x: unknown)` 래퍼 |
| 2 | **DB 프로퍼티 접근 (JSONB)** | ~12 | 16% | aggregate-dashboard-kpis(4), import-with-ontology(4) | 엔티티 프로퍼티 타입 정의 |
| 3 | **RPC 응답 캐스팅** | ~10 | 14% | rpcHelpers.ts(10) | 저장 프로시저별 리턴 타입 정의 |
| 4 | **프로퍼티 뮤테이션** | ~6 | 8% | generate-optimization(3) | 불변 패턴 (`{ ...obj, newProp }`) |
| 5 | **배열 타입 변환** | ~5 | 7% | advanced-ai-inference(5) | 제네릭 `Array.from<T>()` |
| 6 | **Supabase 클라이언트 우회** | ~4 | 5% | retail-chatbot(4) | Supabase 타입 래퍼 |
| 7 | **열거형/유니언 할당** | ~3 | 4% | generate-optimization(2), run-simulation(1) | 타입 가드 함수 |
| 8 | **메타데이터/설정 접근** | ~5 | 7% | environment-proxy(2), validation.ts(2) | 스키마 검증 (Zod) |
| 9 | **기타** | ~5 | 7% | — | 개별 수정 |

### 13-6. 제거 로드맵: 407건 → 0건

#### Phase 1: Quick Wins (2주, ~50건 제거)

| 작업 | 대상 | 건수 | 담당 | 공수 |
|------|------|------|------|------|
| Website `as any` 4건 전수 제거 | Auth.tsx, Profile.tsx, ProductPerformance.tsx | 4 | E | 0.25d |
| OS 불필요한 lazy typing 제거 | buildRetailOntologyGraph.ts 등 | 13 | D | 0.5d |
| Supabase 열거형/유니언 수정 | generate-optimization, run-simulation | 3 | C | 0.25d |
| process-wifi-data 파싱 래퍼 생성 | process-wifi-data/index.ts | 23 | B | 1d |
| `@ts-ignore` 1건 제거 | generate-optimization/index.ts:1423 | 1 | C | 0.1d |
| `@ts-expect-error` 1건 제거 | DataImportWidget.tsx:723 | 1 | D | 0.25d |
| **소계** | | **45** | | **2.35d** |

#### Phase 2: 타입 인프라 구축 (4주, ~200건 제거)

| 작업 | 대상 | 건수 | 담당 | 공수 |
|------|------|------|------|------|
| `ModelMetadata` 판별 유니언 타입 정의 | DigitalTwinStudio, sceneStore, overlays | ~59 | D | 2d |
| `Vector3D`, `Transform`, `Position` 인터페이스 | modelLayerLoader.ts, scene 관련 | ~32 | D | 1d |
| Supabase 타입드 쿼리 래퍼 (`typedFrom<T>()`) | useOnboarding, useROI, usePOS 등 | ~115 | D+A | 3d |
| RPC 리턴 타입 정의 (`@neuraltwin/types`) | rpcHelpers.ts | ~10 | A+C | 1d |
| **소계** | | **~216** | | **7d** |

#### Phase 3: 잔여 제거 + ESLint 규칙 (4주, ~146건 제거)

| 작업 | 대상 | 건수 | 담당 | 공수 |
|------|------|------|------|------|
| JSON/API 응답 타이핑 (Supabase EF) | aggregate-kpis, import-ontology 등 | ~22 | C | 2d |
| 배열 타입 명시화 | sceneRecipeGenerator, useLayout 등 | ~31 | D | 1d |
| 서드파티 어댑터 인터페이스 | Canvas3D, Three.js 관련 | ~20 | D | 1d |
| Supabase EF 프로퍼티 접근 타이핑 | retail-chatbot, environment-proxy 등 | ~15 | C | 1d |
| 메타데이터/설정 Zod 스키마 | generate-optimization, validation 등 | ~11 | C | 1d |
| 시뮬레이션 훅 타이핑 | useSceneSimulation, useStoreContext | ~27 | D | 2d |
| 배열 변환 + 기타 잔여 | 산발적 파일 | ~20 | 전체 | 1d |
| **소계** | | **~146** | | **9d** |

#### Phase 4: 예방 (지속)

| 작업 | 설명 | 공수 |
|------|------|------|
| ESLint `no-explicit-any` 규칙 활성화 (warn → error) | 신규 `as any` 차단 | 0.5d |
| `@ts-expect-error` 필수화 (기존 `@ts-ignore` 대체) | 이유 주석 강제 | 0.25d |
| CI 파이프라인에 `any` count 리포트 추가 | PR별 `as any` 증감 추적 | 0.5d |

### 13-7. 전체 제거 일정 요약

| Phase | 기간 | 제거 건수 | 누적 잔여 | 담당 |
|-------|------|----------|----------|------|
| 현재 | — | — | **407** | — |
| Phase 1 (Quick Wins) | 2주 | -45 | **362** | E, D, C, B |
| Phase 2 (타입 인프라) | 4주 | -216 | **146** | D, A, C |
| Phase 3 (잔여 제거) | 4주 | -146 | **0** | D, C, 전체 |
| Phase 4 (예방) | 지속 | — | **0 유지** | 전체 |
| **합계** | **~10주** | **-407** | **0** | |

---

## 부록: 라우팅 맵

```
/            → Chat.tsx        (메인 = AI 채팅)
/index       → Index.tsx       (랜딩 페이지)
/product     → Product.tsx     (제품 소개 + 미니 피쳐)
/chat        → Chat.tsx        (AI 채팅 — / 과 동일)
/about       → About.tsx       (회사 소개)
/auth        → Auth.tsx        (로그인/회원가입)
/pricing     → Pricing.tsx     (가격)
/contact     → Contact.tsx     (문의)
/subscribe   → Subscribe.tsx   (구독 선택)
/dashboard   → Dashboard.tsx   (인증 사용자 대시보드)
/profile     → Profile.tsx     (프로필)
/privacy     → Privacy.tsx     (개인정보처리방침)
/terms       → Terms.tsx       (이용약관)
*            → NotFound.tsx    (404)
```

---

## 14. 외부 서비스 연결 지점 종합

### 14.1 Supabase 연결

#### 14.1.1 클라이언트 설정

- **파일**: `src/integrations/supabase/client.ts`
- **타입**: `@neuraltwin/types`의 `Database` 제네릭 사용
- **설정**: `localStorage` 기반 세션, `autoRefreshToken: true`, `persistSession: true`

#### 14.1.2 DB 쿼리 테이블 목록

| 테이블 | 쿼리 수 | 사용 파일 | 주요 작업 |
|--------|---------|-----------|-----------|
| `organization_members` | 9 | Auth.tsx, useAuth.ts, Profile.tsx, Dashboard.tsx, Subscribe.tsx | SELECT (관계 조인 포함), INSERT |
| `organizations` | 6 | Auth.tsx | SELECT (org_name 검색), INSERT (신규 조직 생성) |
| `subscriptions` | 5 | Auth.tsx, Profile.tsx, Dashboard.tsx | SELECT (active 상태 필터) |
| `profiles` | 3 | Profile.tsx, Header.tsx | SELECT (사용자 정보), UPDATE (display_name, avatar_url) |
| `licenses` | 1 | Profile.tsx | SELECT (subscription_id 기준, created_at DESC 정렬) |
| `avatars` (Storage) | 2 | Profile.tsx | UPLOAD, GET_PUBLIC_URL |

**쿼리 유형 분포**:

| 유형 | 횟수 | 비고 |
|------|------|------|
| SELECT | 17 | `.single()` 4회, `.maybeSingle()` 12회, 배열 1회 |
| INSERT | 6 | 모두 단일 행 삽입 |
| UPDATE | 1 | profiles 테이블만 |
| DELETE | 0 | 삭제 쿼리 없음 |
| UPSERT | 0 | — |
| RPC | 0 | `search_knowledge_trgm` 계획만 있음 (미구현) |
| Realtime | 0 | DB 실시간 구독 없음 |

**테이블별 상세 쿼리 위치**:

<details>
<summary>organization_members (11 쿼리)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `hooks/useAuth.ts` | 74–91 | SELECT | `.select()` + 관계 (organizations, licenses) → `single()` |
| `pages/Auth.tsx` | 47 | SELECT | `.select('org_id').eq('user_id', …)` → `maybeSingle()` |
| `pages/Auth.tsx` | 94 | INSERT | `{ user_id, org_id, role }` |
| `pages/Auth.tsx` | 155 | SELECT | `.select('org_id').eq('user_id', …)` → `maybeSingle()` |
| `pages/Auth.tsx` | 196 | INSERT | `{ user_id, org_id, role }` |
| `pages/Auth.tsx` | 361 | INSERT | `{ user_id, org_id, role }` |
| `pages/Profile.tsx` | 86–92 | SELECT | `.select()` + 관계 (organizations, licenses) → `maybeSingle()` |
| `pages/Dashboard.tsx` | 31–35 | SELECT | `.select('org_id, role, organizations(…)')` → `single()` |
| `pages/Subscribe.tsx` | 52–56 | SELECT | `.select("org_id").eq("user_id", …)` → `maybeSingle()` |

</details>

<details>
<summary>organizations (6 쿼리)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `pages/Auth.tsx` | 61 | SELECT | `.select('id').eq('org_name', companyName)` → `maybeSingle()` |
| `pages/Auth.tsx` | 73–79 | INSERT | `{ org_name, created_by, metadata: { country: 'KR' } }` |
| `pages/Auth.tsx` | 167 | SELECT | `.select('id').eq('org_name', companyName)` → `maybeSingle()` |
| `pages/Auth.tsx` | 177–183 | INSERT | `{ org_name, created_by, metadata: { country: 'KR' } }` |
| `pages/Auth.tsx` | 326 | SELECT | `.select('id').eq('org_name', company)` → `maybeSingle()` |
| `pages/Auth.tsx` | 339–345 | INSERT | `{ org_name, created_by, metadata: { country: 'KR' } }` → `single()` |

</details>

<details>
<summary>subscriptions (6 쿼리)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `pages/Auth.tsx` | 112 | SELECT | `.eq('org_id', …).eq('status', 'active')` → `maybeSingle()` |
| `pages/Auth.tsx` | 212 | SELECT | `.eq('org_id', …).eq('status', 'active')` → `maybeSingle()` |
| `pages/Auth.tsx` | 379 | SELECT | `.eq('org_id', …).eq('status', 'active')` → `maybeSingle()` |
| `pages/Profile.tsx` | 106 | SELECT | `.eq('org_id', …)` → `maybeSingle()` |
| `pages/Dashboard.tsx` | 44–48 | SELECT | `.eq('org_id', …)` → `single()` |

</details>

<details>
<summary>profiles (4 쿼리)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `pages/Profile.tsx` | 70 | SELECT | `.select("*").eq("id", userId)` → `maybeSingle()` |
| `pages/Profile.tsx` | 184–187 | UPDATE | `{ display_name, avatar_url }` → `.eq("id", userId)` |
| `components/layout/Header.tsx` | 38 | SELECT | `.select("*").eq("id", userId)` → `single()` |

</details>

<details>
<summary>licenses (1 쿼리)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `pages/Profile.tsx` | 113 | SELECT | `.eq('subscription_id', …).order('created_at', { ascending: false })` |

</details>

<details>
<summary>avatars — Storage (2 작업)</summary>

| 파일 | 라인 | 작업 | 패턴 |
|------|------|------|------|
| `pages/Profile.tsx` | 171 | UPLOAD | `supabase.storage.from('avatars').upload(…)` |
| `pages/Profile.tsx` | 179 | GET URL | `supabase.storage.from('avatars').getPublicUrl(…)` |

</details>

#### 14.1.3 Edge Function 호출 목록

| Function 이름 | 파일 | 호출 방식 | 용도 | 상태 |
|---------------|------|-----------|------|------|
| `retail-chatbot` | `pages/Chat.tsx:566` | `fetch()` (SSE 스트리밍) | AI 채팅 메시지 전송 & 응답 스트리밍 | **Active** |
| `retail-chatbot` | `pages/Chat.tsx:761` | `fetch()` (POST JSON) | 리드(Lead) 정보 캡처 (`action: "capture_lead"`) | **Active** |
| `retail-chatbot` | `pages/Chat.tsx:835` | `fetch()` (fire-and-forget) | 메시지 반응 로깅 (`action: "log_reaction"`) | **Active** |
| `submit-contact` | `pages/Contact.tsx:75` | `supabase.functions.invoke()` | 문의 폼 제출 | **Active** |
| `create-checkout` | `pages/Subscribe.tsx:138` | `supabase.functions.invoke()` | Stripe 결제 연동 | **TODO** (주석 처리) |

**retail-chatbot 호출 상세**:

```
[Chat 메시지 전송] POST ${SUPABASE_URL}/functions/v1/retail-chatbot
  Headers: Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}
  Body: { message, sessionId, conversationId, history, attachments?, stream, currentVizState? }
  Response: SSE stream (desktop) / JSON (mobile)

[Lead 캡처] POST ${SUPABASE_URL}/functions/v1/retail-chatbot
  Body: { action: "capture_lead", sessionId, conversationId, lead: { email, company, role } }
  Response: JSON

[반응 로깅] POST ${SUPABASE_URL}/functions/v1/retail-chatbot  (fire-and-forget)
  Body: { action: "log_reaction", sessionId, conversationId, reaction: { type, messageId, messageContent? } }
```

> **참고**: `retail-chatbot`은 `fetch()` 직접 호출, `submit-contact`은 `supabase.functions.invoke()` 사용. 관련 보안 개선 사항은 [Section 11-4](#114-chattsx-환경변수-직접-참조--️-개선-필요) 참조.

#### 14.1.4 Auth 사용 패턴

| 메서드 | 파일 | 라인 | 용도 |
|--------|------|------|------|
| `signUp()` | Auth.tsx | 304 | 이메일/비밀번호 회원가입 + 메타데이터 (name, company, phone, roleType) |
| `signInWithPassword()` | Auth.tsx | 425 | 이메일/비밀번호 로그인 |
| `signInWithOAuth({ provider: 'google' })` | Auth.tsx | 451 | Google OAuth 로그인 |
| `getSession()` | Auth.tsx:240, Dashboard.tsx:75 | — | 현재 세션 확인 |
| `getUser()` | useAuth.ts:96, Profile.tsx:59, Subscribe.tsx:38 | — | 인증 사용자 객체 조회 |
| `onAuthStateChange()` | useAuth.ts:17, Auth.tsx:253, Dashboard.tsx:60 | — | 인증 상태 변경 리스너 |
| `signOut()` | useAuth.ts:139, Profile.tsx:235 | — | 로그아웃 |
| `resetPasswordForEmail()` | Profile.tsx:219 | — | 비밀번호 재설정 이메일 발송 |

**역할 기반 접근 제어 (RBAC)**:

| 역할 (AppRole) | 권한 |
|----------------|------|
| `NEURALTWIN_MASTER` | 전체 관리자 → `/admin` 리디렉트 |
| `ORG_HQ` | 조직 본사 → `/dashboard` |
| `ORG_STORE` | 매장 관리자 → `/dashboard` |
| `ORG_VIEWER` | 조직 뷰어 → `/dashboard` |

**보호 경로**: `ProtectedRoute` 컴포넌트 (`src/components/ProtectedRoute.tsx`)
- `isAuthenticated` 확인 → 미인증 시 `/auth` 리디렉트
- `allowedRoles` prop으로 역할별 접근 제어

---

### 14.2 환경변수 목록 (VITE_ 접두사) — 상세

| 변수 | 용도 | 필수 | 사용 파일 | 분류 |
|------|------|------|-----------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | **Yes** | `client.ts` (초기화), `Chat.tsx` (EF 호출 3곳) | `.env` 로드 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon 공개 키 | **Yes** | `client.ts` (초기화), `Chat.tsx` (Bearer 토큰 3곳) | `.env` 로드 |
| `VITE_OPENWEATHERMAP_API_KEY` | OpenWeatherMap 날씨 API 키 | No | `.env.example`에 정의 (website 코드에서 미사용, os-dashboard에서 사용) | `.env` 로드 |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터포털 (data.go.kr) API 키 | No | `.env.example`에 정의 (website 코드에서 미사용, os-dashboard에서 사용) | `.env` 로드 |
| `VITE_CALENDARIFIC_API_KEY` | Calendarific 공휴일 캘린더 API 키 | No | `.env.example`에 정의 (website 코드에서 미사용, os-dashboard에서 사용) | `.env` 로드 |

**하드코딩 vs `.env` 분류**:

| 항목 | 분류 | 위치 | 비고 |
|------|------|------|------|
| Supabase URL | `.env` 로드 | `import.meta.env.VITE_SUPABASE_URL` | `.env.example`에 기본값 `https://bdrvowacecxnraaivlhr.supabase.co` |
| Supabase Key | `.env` 로드 | `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.example`에 `your_anon_key_here` 플레이스홀더 |
| OS Dashboard URL | **하드코딩** | `Dashboard.tsx:83` | `https://neuraltwintest.app` 직접 작성 |
| Vimeo 비디오 URL | **하드코딩** | `Index.tsx:139` | `https://player.vimeo.com/video/1142028485` |
| LinkedIn URL | **하드코딩** | `Footer.tsx:56` | `https://www.linkedin.com/company/neuraltwin` |
| Google Fonts URL | **하드코딩** | `index.css:1` | `fonts.googleapis.com/css2?family=Inter:wght@…` |
| Pretendard Font URL | **하드코딩** | `index.css:2` | `cdn.jsdelivr.net/gh/orioncactus/pretendard/…` |

> **권장**: OS Dashboard URL(`neuraltwintest.app`)은 환경별로 다를 수 있으므로 `VITE_OS_DASHBOARD_URL` 환경변수로 분리 검토.

---

### 14.3 외부 API 및 서비스

#### 14.3.1 분석 도구

| 서비스 | 구현 파일 | 초기화 | 이벤트 추적 |
|--------|-----------|--------|-------------|
| **Google Analytics 4 (GA4)** | `lib/analytics.ts` | `index.html`에서 gtag 스크립트 로드 (주입 필요) | `window.gtag('event', …)` |
| **Meta Pixel (Facebook)** | `lib/analytics.ts` | `index.html`에서 fbq 스크립트 로드 (주입 필요) | `window.fbq('track', …)` |

**GA4 이벤트 매핑**:

| 이벤트 이름 | 트리거 위치 | 퍼널 단계 |
|-------------|-------------|-----------|
| `page_view` | Index, Auth, Contact, Product, Pricing | 1–3 |
| `funnel_progress` | Index, Auth, Contact, Pricing | 1–4 |
| `cta_click` | Index, Pricing | 1–3 |
| `mini_feature_used` | Product (미니 피쳐 인터랙션) | 2 |
| `submit_contact` | Contact (폼 제출) | 3 |
| `start_contact` | Contact (폼 시작) | 3 |
| `meeting_booked` | — (예약 완료 시) | 4 |

**Meta Pixel 이벤트 매핑**:

| GA4 이벤트 | Meta Pixel 이벤트 |
|------------|-------------------|
| `submit_contact` | `Contact` |
| `view_pricing` | `ViewContent` |
| `meeting_booked` | `Schedule` |
| `click_mini_features` | `ViewContent` |
| `mini_feature_used` | `ViewContent` |
| 기타 | `CustomEvent` |

**분석 사용 페이지**:

| 페이지 | 함수 | 퍼널 단계 |
|--------|------|-----------|
| `Index.tsx` | `trackPageView`, `trackCTAClick`, `trackFunnelStep` | 1 |
| `Product.tsx` | `trackPageView`, `trackFunnelStep` | 2 |
| `Pricing.tsx` | `trackPageView`, `trackCTAClick`, `trackFunnelStep` | 2 |
| `Contact.tsx` | `trackPageView`, `trackContactForm`, `trackFunnelStep` | 3 |
| `Auth.tsx` | `trackPageView`, `trackFunnelStep` | 3 |

> **참고**: `index.html`에 현재 GA4/Meta Pixel 초기화 스크립트가 삽입되어 있지 않음. 프로덕션 배포 시 Vercel 환경 또는 GTM을 통해 주입해야 함.

#### 14.3.2 CDN 리소스

| 리소스 | URL | 파일 | 용도 |
|--------|-----|------|------|
| Google Fonts (Inter) | `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap` | `index.css:1` | 영문 기본 폰트 |
| Pretendard (jsDelivr) | `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css` | `index.css:2` | 한글 폰트 |

#### 14.3.3 임베디드 외부 콘텐츠

| 서비스 | URL | 파일 | 용도 |
|--------|-----|------|------|
| Vimeo | `https://player.vimeo.com/video/1142028485` | `Index.tsx:139` | 랜딩 페이지 배경 비디오 (자동 재생, 루프, 음소거) |

#### 14.3.4 외부 링크

| 서비스 | URL | 파일 | 용도 |
|--------|-----|------|------|
| LinkedIn | `https://www.linkedin.com/company/neuraltwin` | `Footer.tsx:56` | 소셜 미디어 링크 |
| OS Dashboard | `https://neuraltwintest.app` | `Dashboard.tsx:83` | 외부 대시보드 (인증 토큰 전달) |

#### 14.3.5 계획 중 (미구현) 외부 API

| API | URL / 서비스 | 문서 위치 | 상태 |
|-----|-------------|-----------|------|
| Stripe | 결제 게이트웨이 | `Subscribe.tsx:138` (주석) | TODO — DB 마이그레이션 후 구현 예정 |
| Jina Reader API | `https://r.jina.ai/` | `PLAN.md:247` | 계획 단계 |
| Google Serper API | `https://google.serper.dev/news` | `PLAN.md:276` | 계획 단계 |
| Google AI Embedding | `generativelanguage.googleapis.com` | `IMPLEMENTATION_PLAN.md:16` | 계획 단계 |

---

### 14.4 외부 서비스 연결 요약 다이어그램

```
apps/website (브라우저)
│
├─── Supabase ──────────────────────────────────────────────
│    ├── Auth API
│    │   ├── signUp / signInWithPassword / signInWithOAuth(google)
│    │   ├── getSession / getUser / onAuthStateChange
│    │   └── signOut / resetPasswordForEmail
│    │
│    ├── Database (PostgREST)
│    │   ├── organization_members  (SELECT, INSERT)
│    │   ├── organizations         (SELECT, INSERT)
│    │   ├── subscriptions         (SELECT)
│    │   ├── profiles              (SELECT, UPDATE)
│    │   └── licenses              (SELECT)
│    │
│    ├── Storage
│    │   └── avatars bucket        (UPLOAD, GET_PUBLIC_URL)
│    │
│    └── Edge Functions
│        ├── retail-chatbot        (Chat AI: 스트리밍, 리드 캡처, 반응 로깅)
│        ├── submit-contact        (문의 폼)
│        └── create-checkout       (TODO: Stripe)
│
├─── 분석 도구 ─────────────────────────────────────────────
│    ├── Google Analytics 4        (gtag — 퍼널 4단계 추적)
│    └── Meta Pixel                (fbq — 전환 추적)
│
├─── CDN ───────────────────────────────────────────────────
│    ├── Google Fonts              (Inter 폰트)
│    └── jsDelivr                  (Pretendard 한글 폰트)
│
├─── 임베디드 ──────────────────────────────────────────────
│    └── Vimeo                     (랜딩 페이지 배경 비디오)
│
└─── 외부 링크 ─────────────────────────────────────────────
     ├── neuraltwintest.app        (OS Dashboard — 토큰 전달)
     └── linkedin.com/neuraltwin   (소셜 링크)
```
