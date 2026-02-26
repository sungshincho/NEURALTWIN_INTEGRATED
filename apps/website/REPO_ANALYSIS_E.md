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

### .env.example 정의

| 변수 | 용도 | 필수 |
|------|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | **Yes** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (공개) 키 | **Yes** |
| `VITE_OPENWEATHERMAP_API_KEY` | 날씨 API 키 | No |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터 API 키 | No |
| `VITE_CALENDARIFIC_API_KEY` | 달력 API 키 | No |

### 사용 위치

| 변수 | 파일 | 사용 방식 |
|------|------|-----------|
| `VITE_SUPABASE_URL` | `integrations/supabase/client.ts` | Supabase 클라이언트 초기화 |
| `VITE_SUPABASE_URL` | `pages/Chat.tsx` (3곳) | Edge Function 직접 호출 URL 구성 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `integrations/supabase/client.ts` | Supabase anon 키 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `pages/Chat.tsx` (3곳) | EF 호출 인증 헤더 |

> **개선 필요**: `Chat.tsx`에서 `import.meta.env.VITE_SUPABASE_URL`을 3번 직접 참조 중. Supabase 클라이언트를 통한 EF 호출로 통합 필요.

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
| `ko` | 한국어 | `locales/ko.ts` | 777 | ~472개 |
| `en` | English | `locales/en.ts` | 683 | ~395개 |
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
| 번역 키 수 | ~472 | ~395 |
| 차이 | — | **~77개 키 누락** |
| `contact.consent` 섹션 | 있음 (상세 개인정보처리방침) | **없음** |
| `product.hero.benefits` 섹션 | 있음 | **없음** |
| `product.technology` 상세 | 있음 | 축약됨 |

> **TODO**: en 번역 77개 키 보충 필요. 특히 `contact.consent.privacyDoc` (개인정보처리방침 영문) 미번역.
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

| Edge Function | 호출 위치 | 방식 |
|--------------|----------|------|
| `retail-chatbot` | `pages/Chat.tsx` | SSE 스트리밍 (fetch + ReadableStream) |
| `submit-contact` | `pages/Contact.tsx` | POST (supabase.functions.invoke) |

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
