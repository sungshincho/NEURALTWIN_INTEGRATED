# NeuralTwin 통합 플랫폼 기획

> **Version**: 1.0 | 2026-02-27
> **Author**: PM Lead Agent
> **Status**: Draft — CEO 승인 대기

---

## 1. 현황 분석

### 1.1 현재 구조: 두 개의 분리된 앱

```
apps/website/          (마케팅 + AI 챗봇)
  ├── 공개 페이지: Landing, Product, Pricing, About, Contact
  ├── AI 챗봇: /chat (전체 화면, SSE 스트리밍, 3D 시각화)
  ├── 인증: /auth (로그인/회원가입)
  ├── 프로필: /profile
  └── 대시보드 진입점: /dashboard → 외부 OS 앱 링크

apps/os-dashboard/     (매장 관리 대시보드)
  ├── 인사이트 허브: /insights (7개 탭)
  ├── 디지털 트윈: /studio (3D 편집 + 시뮬레이션)
  ├── ROI 측정: /roi
  ├── 데이터 관리: /data/control-tower, /data/lineage
  ├── 설정: /settings (5개 탭)
  └── AI 어시스턴트: 우측 사이드 패널
```

### 1.2 중복 요소

| 영역 | Website | OS Dashboard | 중복 정도 |
|------|---------|--------------|----------|
| **인증** | /auth (로그인/회원가입) | /auth (로그인) | 거의 동일 |
| **AI 챗봇** | /chat (전체 화면) | ChatPanel (사이드) | 유사 (다른 UI) |
| **Supabase 클라이언트** | client.ts | client.ts | 동일 |
| **RBAC** | permissions.ts | useAuth.tsx | 동일 역할 체계 |
| **UI 시스템** | shadcn/ui + glassmorphism | shadcn/ui + glassmorphism | 거의 동일 |
| **React Query** | v5 | v5 | 동일 |
| **3D 시각화** | StoreVisualizer (읽기 전용) | DigitalTwin (편집 가능) | 부분 중복 |
| **i18n** | ko/en | - (미구현) | 미통합 |

### 1.3 UX 단절 포인트 (현재)

1. **로그인 2회**: Website에서 로그인 → OS로 이동하면 다시 로그인
2. **AI 챗봇 분리**: Website 챗봇은 마케팅/데모용, OS 챗봇은 운영용 — 같은 유저인데 컨텍스트 단절
3. **네비게이션 단절**: Website → Dashboard 링크가 외부 URL 이동
4. **디자인 불일치**: 미세한 스타일 차이 (배경색, 카드 모양, 간격 등)
5. **데이터 격리**: Website 챗봇의 3D 시각화가 OS의 Digital Twin과 연동 안됨

---

## 2. 통합 목표

### 2.1 핵심 원칙

1. **Single URL**: 하나의 도메인에서 마케팅 + AI + 매장관리 모두 접근
2. **Progressive Disclosure**: 비로그인 → 게스트 AI체험 → 회원가입 → 대시보드 자연스러운 전환
3. **Unified AI**: 하나의 AI 어시스턴트가 마케팅 질문 + 매장 분석 모두 처리
4. **Single Auth**: 한번 로그인으로 전체 플랫폼 이용
5. **Shared Design System**: 완전 통일된 UI/UX

### 2.2 타겟 유저 플로우

```
[비로그인 유저]
  Landing (/) → Product (/product) → AI 체험 (/chat, 10턴)
        ↓ 관심 → Contact (/contact) 또는 가입 (/auth)

[로그인 유저 — ORG_STORE]
  대시보드 (/dashboard)
    ├── 인사이트 허브 (/dashboard/insights)
    ├── 디지털 트윈 (/dashboard/studio)
    ├── AI 어시스턴트 (전역 사이드 패널)
    └── 설정 (/dashboard/settings)

[로그인 유저 — ORG_HQ]
  위 전체 + ROI (/dashboard/roi)
            + 데이터 관리 (/dashboard/data)
            + 멀티 매장 비교
```

---

## 3. 통합 아키텍처

### 3.1 앱 구조 옵션 비교

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. 모노앱** | website + os를 하나의 앱으로 병합 | 완전 통합, 코드 공유 최대 | 대규모 리팩토링, 번들 크기 |
| **B. Shell + Micro-FE** | 공통 Shell이 website/os를 런타임 로드 | 독립 배포 가능, 점진적 통합 | 복잡한 인프라 |
| **C. 라우팅 통합** | Website를 베이스로, OS를 /dashboard 하위로 lazy import | 중간 수준 작업, 번들 분리 가능 | 코드 의존성 관리 |

### 3.2 추천: 옵션 C — 라우팅 통합 (점진적 병합)

```
neuraltwin-app/  (통합 앱, apps/website 기반 확장)
├── src/
│   ├── App.tsx  (통합 라우터)
│   ├── layouts/
│   │   ├── PublicLayout.tsx    (마케팅: Header + Footer)
│   │   └── DashboardLayout.tsx (관리: Sidebar + ChatPanel)
│   ├── pages/
│   │   ├── public/            (비로그인 접근 가능)
│   │   │   ├── Landing.tsx
│   │   │   ├── Product.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── About.tsx
│   │   │   └── Auth.tsx
│   │   └── dashboard/         (로그인 필수)
│   │       ├── insights/      (7개 탭)
│   │       ├── studio/        (Digital Twin)
│   │       ├── roi/           (ROI 측정)
│   │       ├── data/          (데이터 관리)
│   │       └── settings/      (설정)
│   ├── features/
│   │   ├── chat/              (통합 AI 챗봇)
│   │   │   ├── ChatPanel.tsx  (사이드 패널 — 대시보드)
│   │   │   ├── ChatPage.tsx   (전체 화면 — 공개)
│   │   │   └── shared/        (공통: 스트리밍, 세션, 내보내기)
│   │   ├── insights/          (from os-dashboard)
│   │   ├── studio/            (from os-dashboard)
│   │   ├── roi/               (from os-dashboard)
│   │   ├── settings/          (from os-dashboard)
│   │   └── data-control/      (from os-dashboard)
│   ├── hooks/                 (통합 훅)
│   ├── store/                 (통합 Zustand)
│   ├── components/            (통합 UI)
│   ├── integrations/          (Supabase, Analytics)
│   └── i18n/                  (ko/en/ja)
```

---

## 4. 통합 라우팅 설계

### 4.1 URL 구조

```
/                           Landing (공개)
/product                    Product 소개 (공개)
/pricing                    요금제 (공개)
/about                      서비스 소개 (공개)
/contact                    문의하기 (공개)
/chat                       AI 챗봇 체험 (공개, 게스트 10턴)
/auth                       로그인/회원가입 (공개)
/privacy                    개인정보처리방침 (공개)
/terms                      이용약관 (공개)

/dashboard                  대시보드 홈 = 인사이트 허브 (인증)
/dashboard/insights         인사이트 허브 (인증)
  ?tab=overview             ├─ 종합 (기본)
  ?tab=store                ├─ 매장
  ?tab=customer             ├─ 고객
  ?tab=product              ├─ 상품
  ?tab=inventory            ├─ 재고
  ?tab=prediction           ├─ 예측
  ?tab=ai                   └─ AI 추천
/dashboard/studio           디지털 트윈 스튜디오 (인증)
/dashboard/roi              ROI 측정 (HQ 이상)
/dashboard/data             데이터 컨트롤 타워 (HQ 이상)
/dashboard/data/lineage     데이터 리니지 (HQ 이상)
/dashboard/settings         설정 (인증)
  ?tab=stores               ├─ 매장 관리
  ?tab=data                 ├─ 데이터
  ?tab=users                ├─ 팀원
  ?tab=system               ├─ 시스템
  ?tab=plan                 └─ 구독/라이선스

/profile                    내 프로필 (인증)
```

### 4.2 레이아웃 전환

```tsx
<Routes>
  {/* 공개 페이지: Header + Footer */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<Landing />} />
    <Route path="/product" element={<Product />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/auth" element={<Auth />} />
  </Route>

  {/* 대시보드: Sidebar + ChatPanel */}
  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<InsightHub />} />
    <Route path="/dashboard/insights" element={<InsightHub />} />
    <Route path="/dashboard/studio" element={<DigitalTwin />} />
    <Route path="/dashboard/roi" element={<ROI />} />
    <Route path="/dashboard/data" element={<DataControlTower />} />
    <Route path="/dashboard/settings" element={<Settings />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
```

---

## 5. AI 챗봇 통합 설계

### 5.1 현재 두 챗봇 비교

| 항목 | Website ChatPage | OS ChatPanel |
|------|-----------------|--------------|
| UI | 전체 화면, 좌측 대화 + 우측 3D | 우측 사이드 패널 (300-600px) |
| EF | `retail-chatbot` | `retail-chatbot` (동일) |
| 스트리밍 | SSE (ReadableStream) | SSE (useAssistantChat) |
| 3D 시각화 | StoreVisualizer (읽기 전용) | - (별도 Studio 연결) |
| 세션 | localStorage sessionId | chatStore (Zustand) |
| 게스트 | 10턴 제한 | - (로그인 필수) |
| 내보내기 | MD/PDF/DOCX | - |
| 화면 데이터 | - | screenDataStore 연동 |
| 리드 캡처 | leadForm 트리거 | - |

### 5.2 통합 챗봇 설계

```
features/chat/
├── shared/
│   ├── hooks/
│   │   ├── useChatSession.ts     (세션 관리 — 통합)
│   │   ├── useStreaming.ts       (SSE 스트리밍 — 통합)
│   │   └── useChatMessages.ts    (메시지 상태 — 통합)
│   ├── utils/
│   │   ├── exportConversation.ts (MD/PDF/DOCX)
│   │   └── fileUpload.ts        (파일 업로드)
│   └── types.ts                  (공통 타입)
├── ChatPage.tsx                  (공개: 전체 화면 모드)
│   ├── 좌측: 대화 영역
│   ├── 우측: 3D StoreVisualizer
│   └── 게스트 10턴 제한 + 리드 캡처
├── ChatPanel.tsx                 (대시보드: 사이드 패널 모드)
│   ├── 리사이즈 가능 (300-600px)
│   ├── screenDataStore 연동
│   └── 액션 디스패처 (모달/네비게이션)
└── components/
    ├── ChatInput.tsx             (공통 입력)
    ├── ChatMessage.tsx           (공통 메시지 버블)
    ├── ChatSuggestions.tsx        (팔로업 제안)
    └── ChatExportButton.tsx       (내보내기)
```

### 5.3 컨텍스트 연속성

```
[공개 /chat]                      [로그인 후 /dashboard]
  게스트 세션 시작                     동일 세션 ID 유지
  10턴 대화                           ↓
  "더 분석하려면 가입하세요"        대시보드 AI 패널에서
       ↓ 가입/로그인                 이전 대화 이어서 진행
  세션 → 유저 계정 연결              + 실제 매장 데이터 기반 답변
```

---

## 6. UI/UX 통합 설계

### 6.1 디자인 시스템 통합

| 구성요소 | 현재 | 통합 후 |
|---------|------|---------|
| **기본 컴포넌트** | @neuraltwin/ui (Button, Input, Card, Dialog) | 확장: Glass3DCard, GlowChart 포함 |
| **테마** | Website: 다크 고정 / OS: 다크+라이트 | 통합: 다크+라이트 토글 전역 |
| **Glassmorphism** | OS만 적용 | 전체 통일 |
| **3D Text** | OS만 적용 | 대시보드 영역 유지 |
| **Chart** | Website: Recharts / OS: Canvas 커스텀 | 통합: Canvas 기반 (OS 버전) |
| **색상 팔레트** | 미세 차이 | 통합 CSS 변수 체계 |

### 6.2 네비게이션 통합

```
┌─────────────────────────────────────────────────────────┐
│ [공개 페이지]                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Logo  Product  Pricing  About  Contact  Chat  Login│   │
│ └───────────────────────────────────────────────────┘   │
│                   Header (공개)                          │
│                                                         │
│              페이지 콘텐츠 (Landing, Product 등)          │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │                   Footer                          │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [대시보드]                                               │
│ ┌────┬──────────────────────────────────┬──────────┐   │
│ │    │  Header (테마/알림/유저/AI토글)    │          │   │
│ │    ├──────────────────────────────────┤  Chat    │   │
│ │ S  │                                  │  Panel   │   │
│ │ i  │        메인 콘텐츠 영역            │  (접이식) │   │
│ │ d  │  (Insights/Studio/ROI/Settings)  │          │   │
│ │ e  │                                  │          │   │
│ │ b  │                                  │          │   │
│ │ a  │                                  │          │   │
│ │ r  │                                  │          │   │
│ └────┴──────────────────────────────────┴──────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 6.3 공개↔대시보드 전환 UX

1. **로그인 후 자동 리다이렉트**: `/auth` 성공 → `/dashboard`
2. **대시보드에서 공개 페이지 접근**: Header에 "홈페이지" 링크
3. **공개에서 대시보드 진입**: 로그인 버튼 → `/auth` → `/dashboard`
4. **AI 챗봇 연속**: `/chat`에서 시작한 대화 → `/dashboard` ChatPanel에서 이어짐
5. **뒤로가기**: 대시보드 ↔ 공개 페이지 자연스러운 히스토리 탐색

---

## 7. 공유 상태 관리

### 7.1 Zustand Store 통합

| Store | 소속 | 통합 방안 |
|-------|------|----------|
| **chatStore** | OS | → 전역 (공개 + 대시보드 공유) |
| **dateFilterStore** | OS | → 대시보드 전용 유지 |
| **simulationStore** | OS | → 대시보드 전용 유지 |
| **screenDataStore** | OS | → 대시보드 전용 유지 |
| **sceneStore** | OS Studio | → Studio 전용 유지 |
| **authStore** | (신규) | → 전역: useAuth 훅 통합 버전 |
| **themeStore** | (신규) | → 전역: 다크/라이트 + localStorage persist |

### 7.2 공유 Hooks 통합

```
hooks/
├── useAuth.ts           ← Website + OS useAuth 병합
├── useChatSession.ts    ← Website 버전 기반
├── useStreaming.ts      ← Website 버전 기반
├── useSelectedStore.ts  ← OS 유지
├── useZoneMetrics.ts    ← OS 유지
├── useCountUp.ts        ← OS 유지
└── useTranslation.ts    ← Website i18n 확장 (ko/en/ja)
```

---

## 8. 인증 통합

### 8.1 현재 인증 코드 비교

| 항목 | Website | OS Dashboard |
|------|---------|-------------|
| `useAuth()` 위치 | hooks/useAuth.ts | hooks/useAuth.tsx |
| 반환값 | user, authContext, hasRole() | user, orgId, orgName, role |
| 조직 처리 | 자동 생성 + 멤버 할당 | orgId로 RLS 필터 |
| 로그아웃 | manualLogout localStorage | signOut() |
| OAuth | - | Google, Kakao |

### 8.2 통합 useAuth

```typescript
// 통합 useAuth.ts
interface UnifiedAuth {
  // 기본
  user: User | null;
  loading: boolean;
  initialized: boolean;

  // 조직
  orgId: string | null;
  orgName: string | null;
  role: AppRole | null;

  // 라이선스
  license: LicenseInfo | null;

  // 권한
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  canAccess: (feature: Feature) => boolean;

  // 액션
  signIn: (email, password) => Promise<void>;
  signUp: (data) => Promise<void>;
  signOut: () => Promise<void>;

  // 세션
  isGuest: boolean;  // 비로그인 AI 챗봇 사용자
  guestSessionId: string | null;
}
```

---

## 9. i18n 통합

### 9.1 현재 → 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| Website | ko/en 지원 | ko/en/ja |
| OS Dashboard | 미구현 (하드코딩 한국어) | ko/en/ja |

### 9.2 번역 구조

```
i18n/
├── config.ts
└── locales/
    ├── ko/
    │   ├── common.ts      (공통: 네비게이션, 버튼, 에러)
    │   ├── public.ts      (공개: Landing, Product, Pricing)
    │   ├── chat.ts        (AI 챗봇)
    │   ├── insights.ts    (인사이트 허브 7탭)
    │   ├── studio.ts      (디지털 트윈)
    │   ├── settings.ts    (설정)
    │   └── auth.ts        (인증)
    ├── en/
    │   └── (동일 구조)
    └── ja/
        └── (동일 구조)
```

---

## 10. 실행 계획

### Phase 1: 기반 통합 (1-2주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 1.1 | 통합 앱 스캐폴드 | T4 Website | 새 앱 또는 Website 확장, 라우팅 구조 설정 |
| 1.2 | 인증 통합 | T2 Backend | useAuth 병합, OAuth 추가, 조직 자동 생성 |
| 1.3 | 디자인 시스템 통합 | T4 Website | @neuraltwin/ui 확장, 테마 변수 통일 |
| 1.4 | 레이아웃 설정 | T4 Website | PublicLayout + DashboardLayout 구현 |

### Phase 2: 페이지 마이그레이션 (2-3주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 2.1 | 공개 페이지 이식 | T4 Website | Landing, Product, Pricing, Contact, About |
| 2.2 | InsightHub 이식 | T3 DT/OS | 7개 탭 전체 + InsightDataContext |
| 2.3 | Studio 이식 | T3 DT/OS | 3D 캔버스 + 14개 오버레이 + 시뮬레이션 |
| 2.4 | ROI/Data/Settings 이식 | T3 DT/OS + T2 | 나머지 대시보드 페이지 |
| 2.5 | Profile 통합 | T4 Website | 기존 Profile 페이지 확장 |

### Phase 3: AI 챗봇 통합 (1-2주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 3.1 | Chat 공통 모듈 추출 | T4 Website | useChatSession, useStreaming 통합 |
| 3.2 | ChatPage (공개) | T4 Website | 전체 화면 모드 + 3D 시각화 |
| 3.3 | ChatPanel (대시보드) | T3 DT/OS | 사이드 패널 + screenDataStore 연동 |
| 3.4 | 세션 연속성 | T2 Backend | 게스트→로그인 세션 전환 |

### Phase 4: 다국어 + 마무리 (1주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 4.1 | i18n 대시보드 적용 | T3 DT/OS | InsightHub, Studio, Settings 번역 |
| 4.2 | en/ja 번역 | T5 Domain | 영어/일본어 번역 작업 |
| 4.3 | E2E 테스트 | 전원 | 전체 유저 플로우 검증 |
| 4.4 | 배포 설정 | T2 Backend | Vercel 도메인 통합, CI/CD |

---

## 11. 기술적 고려사항

### 11.1 번들 크기 최적화

```
현재 상태:
  website:      ~800KB (gzip)  - Three.js가 대부분
  os-dashboard: ~1.5MB (gzip)  - Three.js + Canvas charts

통합 후 전략:
  공개 페이지:    ~200KB (Three.js lazy load)
  /chat:         +400KB (Three.js on demand)
  /dashboard:    +800KB (Three.js + Charts on demand)

Route-based code splitting:
  React.lazy(() => import('./features/studio/DigitalTwinStudioPage'))
  React.lazy(() => import('./features/insights/InsightHubPage'))
```

### 11.2 공유 의존성

```json
{
  "dependencies": {
    // 공통 (항상 로드)
    "react": "18.3.x",
    "@supabase/supabase-js": "2.x",
    "@tanstack/react-query": "5.x",
    "zustand": "5.x",
    "react-router-dom": "6.x",
    "tailwindcss": "3.4.x",

    // 대시보드 전용 (lazy)
    "three": "0.160.x",
    "@react-three/fiber": "8.x",
    "@react-three/drei": "9.x",

    // 챗봇/내보내기 (lazy)
    "jspdf": "4.x",
    "docx": "9.x"
  }
}
```

### 11.3 배포 전략

| 항목 | 현재 | 통합 후 |
|------|------|---------|
| Website URL | website.neuraltwin.com | neuraltwin.com |
| OS URL | os.neuraltwin.com | neuraltwin.com/dashboard |
| 빌드 | 각각 개별 빌드 | 단일 Vite 빌드 |
| Vercel | 2개 프로젝트 | 1개 프로젝트 |
| CI/CD | 각각 트리거 | 통합 파이프라인 |

---

## 12. 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 번들 크기 초과 | 초기 로딩 느림 | 중 | Route-based splitting + preload |
| 3D 라이브러리 충돌 | Three.js 버전 차이 | 저 | 동일 버전 통일 (0.160) |
| 인증 마이그레이션 | 기존 세션 유실 | 저 | Supabase 세션은 유지됨 |
| 스타일 충돌 | CSS 우선순위 문제 | 중 | Tailwind prefix 또는 CSS Modules |
| 큰 작업량 | 개발 기간 초과 | 고 | Phase별 점진적 배포 가능 |

---

## 13. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 도메인 수 | 2개 (website + os) | 1개 |
| 로그인 횟수 (유저당) | 2회 | 1회 |
| AI 챗봇 세션 연속성 | 단절 | 공개↔대시보드 연속 |
| 코드 중복률 | ~30% (인증, UI, Supabase) | <5% |
| 초기 로딩 (공개) | ~3s | <2s |
| 초기 로딩 (대시보드) | ~5s | <3s |
| 다국어 | ko/en (Website만) | ko/en/ja (전체) |

---

## 14. 의사결정 필요 사항

CEO 검토/결정이 필요한 항목:

1. **통합 방식**: 옵션 C (라우팅 통합) 승인 여부
2. **도메인**: neuraltwin.com 단일 도메인 사용 확정
3. **우선순위**: Phase 1-4 순서 및 타임라인 조정
4. **다국어**: ja (일본어) 추가 범위 (전체 vs 공개 페이지만)
5. **기존 URL 유지**: 이전 URL에서 리다이렉트 처리 방식
6. **GA/Meta Pixel**: 통합 후 추적 ID 유지 여부
