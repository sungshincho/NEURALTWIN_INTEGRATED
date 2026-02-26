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
