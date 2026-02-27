# NeuralTwin 통합 플랫폼 기획

> **Version**: 2.0 | 2026-02-27
> **Author**: PM Lead Agent + 6 Teammates (T1~T6 협업)
> **Status**: Draft — CEO 승인 대기
> **변경 이력**: v1.0 → v2.0 (전체 Teammate 분석 반영, 디자인 시스템/IoT/도메인/백엔드 섹션 추가)

---

## 1. 현황 분석

### 1.1 현재 구조: 두 개의 분리된 앱

```
apps/website/                (마케팅 + AI 챗봇)
  ├── 13개 라우트 (/ = AI Chat, /index = Landing)
  ├── AI 챗봇: /chat (전체 화면, SSE, 3D VizDirective)
  ├── 3D 시각화: raw Three.js (chatbot) + R3F (product demos)
  ├── i18n: ko/en (~300-400 키)
  ├── 로컬 UI: ~45개 shadcn 컴포넌트
  ├── 인증: /auth (Supabase Auth + org_members)
  └── Analytics: GA4/Meta Pixel 코드 존재, 미활성화

apps/os-dashboard/            (매장 관리 대시보드)
  ├── 8개 활성 라우트 + 12개 레거시 리다이렉트
  ├── InsightHub: 7개 탭 (Overview/Store/Customer/Product/Inventory/Prediction/AI)
  ├── Digital Twin Studio: R3F + 13개 오버레이 + 17개 스튜디오 훅
  ├── 6개 Zustand 스토어 (4 글로벌 + 2 피처)
  ├── 40+ 커스텀 훅
  ├── 로컬 UI: 44개 shadcn 컴포넌트 + glass-card (glassmorphism)
  ├── AI 어시스턴트: ChatPanel (사이드) + 22개 액션 타입
  ├── 설정: 5개 탭 (매장/데이터/사용자/시스템/플랜)
  ├── 데이터 관리: Control Tower + Lineage Explorer
  └── i18n: 미구현 (하드코딩 한국어)

apps/neuralsense/             (IoT 센서 시스템)
  ├── 8x Raspberry Pi (WiFi probe) → MQTT → 노트북 처리
  ├── run_live_geometry.py: 존 분류 알고리즘
  ├── supabase_uploader.py: 배치 업로드 (30초/50건)
  └── 19개 NS존 (zones_dim, neuralsense_grid)
```

### 1.2 정량적 중복 분석 (T3/T4 분석 기반)

| 영역 | Website | OS Dashboard | 중복/불일치 |
|------|---------|--------------|------------|
| **인증** | useAuth.ts (hasRole, orgId, license) | useAuth.tsx (role, orgId, orgName) | 동일 DB 구조, API 다름 |
| **AI 챗봇** | /chat (전체화면, SSE, 3D) — `retail-chatbot` EF | ChatPanel (사이드) — `neuraltwin-assistant` EF | **다른 EF 사용** |
| **Supabase 클라이언트** | client.ts | client.ts | 동일 |
| **RBAC** | AppRole (4종) | 동일 4종 | 동일 |
| **로컬 UI 컴포넌트** | ~45개 shadcn | 44개 shadcn + glass-card | 거의 동일, 0개 공유 |
| **@neuraltwin/ui 사용** | 4개 파일 (pass-through) | **0개 파일** | 사실상 미사용 |
| **3D 라이브러리** | raw Three.js (chatbot) + R3F (product) | R3F + Drei (전체) | 이중 구현 |
| **React Query** | v5 | v5 | 동일 |
| **Zustand** | 미사용 | 6개 스토어 | OS 전용 |
| **i18n** | i18next (ko/en) | 없음 | 미통합 |
| **다크 모드** | `.light` 클래스 (거의 미사용) | `.dark` 클래스 (132회 사용) | **반대 규칙** |

### 1.3 UX 단절 포인트

1. **로그인 2회**: Website → OS 이동 시 재로그인 필요
2. **AI 챗봇 분리**: Website `retail-chatbot` EF vs OS `neuraltwin-assistant` EF — 컨텍스트 완전 단절
3. **네비게이션 단절**: Website → Dashboard 링크가 외부 URL
4. **디자인 불일치**: `--accent` 값 반전, `--radius` 차이 (16px vs 24px), glassmorphism blur 4배 차이 (20px vs 80px)
5. **데이터 격리**: Website 3D(wireframe demo) ↔ OS Digital Twin(실시간 센서 데이터) 미연동
6. **IoT 실시간 부재**: 센서 데이터 30초 지연, 라이브 모니터링 UI 없음

### 1.4 Edge Function 인벤토리 (T2 분석 기반)

| 카테고리 | EF 수 | 사용처 |
|---------|-------|--------|
| AI/추론 | 4 | OS Dashboard |
| 챗봇 | 2 | Website: `retail-chatbot` / OS: `neuraltwin-assistant` |
| ETL/파이프라인 | 6 | OS Dashboard |
| KPI 집계 | 2 | OS Dashboard |
| 데이터 임포트 | 5 | OS Dashboard |
| 3D 모델 | 2 | OS Dashboard |
| 데이터 동기화 | 7 | OS Dashboard / 미사용 |
| 시뮬레이션 | 2 | OS Dashboard |
| 최적화 | 1 | OS Dashboard |
| IoT | 1 | IoT 파이프라인 |
| Website 전용 | 2 | `submit-contact`, `retail-chatbot` |
| 미확인/미사용 | 5 | `dynamic-handler`, `dynamic-responder` 등 |
| **합계** | **~47** | Website 3개 / OS 25+ / IoT 1개 |

---

## 2. 통합 목표

### 2.1 핵심 원칙

1. **Single URL**: 하나의 도메인에서 마케팅 + AI + 매장관리 모두 접근
2. **Progressive Disclosure**: 비로그인 → 게스트 AI체험 → 회원가입 → 대시보드 자연스러운 전환
3. **Unified AI**: 하나의 AI 어시스턴트가 마케팅 + 매장 분석 + 액션 디스패치 모두 처리
4. **Single Auth**: 한번 로그인으로 전체 플랫폼 이용
5. **Unified Design System**: 디자인 토큰 기반 완전 통일 UI/UX
6. **Real-time IoT**: NeuralSense 센서 데이터 실시간 대시보드 연동

### 2.2 타겟 유저 플로우

```
[비로그인 유저]
  Landing (/) → Product (/product) → AI 체험 (/chat, 10턴)
        ↓ 관심 → Contact (/contact) 또는 가입 (/auth)

[로그인 유저 — ORG_STORE (매장 관리자)]
  대시보드 (/dashboard)
    ├── 인사이트 허브 (/dashboard/insights) — 7탭
    ├── 디지털 트윈 (/dashboard/studio) — 3D 편집/시뮬레이션
    ├── AI 어시스턴트 (전역 사이드 패널 + 액션 디스패치)
    ├── 설정 (/dashboard/settings) — 매장/데이터/IoT/사용자/시스템/플랜
    └── 실시간 현황 위젯 (NeuralSense 존 점유 현황)

[로그인 유저 — ORG_HQ (본사 관리자)]
  위 전체 + ROI (/dashboard/roi)
            + 데이터 관리 (/dashboard/data)
            + 멀티 매장 비교 뷰
```

---

## 3. 통합 아키텍처

### 3.1 추천: 옵션 C — 라우팅 통합 (점진적 병합)

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 모노앱 | website + os 완전 병합 | 코드 공유 최대 | 대규모 리팩토링, 번들 크기 |
| B. Shell + Micro-FE | 공통 Shell 런타임 로드 | 독립 배포 | 복잡한 인프라 |
| **C. 라우팅 통합** | Website 기반 확장, OS를 /dashboard lazy import | 점진적 병합, 번들 분리 | 코드 의존성 관리 |

### 3.2 통합 앱 구조

```
apps/neuraltwin-app/  (통합 앱, apps/website 기반 확장)
├── src/
│   ├── App.tsx              (통합 라우터)
│   ├── layouts/
│   │   ├── PublicLayout.tsx     (마케팅: Header + Footer)
│   │   └── DashboardLayout.tsx  (관리: Sidebar + ChatPanel)
│   ├── pages/
│   │   ├── public/              (비로그인 접근)
│   │   │   ├── Landing.tsx      ├── Product.tsx
│   │   │   ├── Pricing.tsx      ├── Contact.tsx
│   │   │   ├── About.tsx        ├── Auth.tsx
│   │   │   ├── Chat.tsx         ├── Privacy.tsx
│   │   │   └── Terms.tsx
│   │   └── dashboard/           (로그인 필수, 전체 lazy load)
│   │       ├── insights/        ├── studio/
│   │       ├── roi/             ├── data/
│   │       └── settings/
│   ├── features/
│   │   ├── chat/                (통합 AI 챗봇)
│   │   ├── insights/            (from os-dashboard — 7탭)
│   │   ├── studio/              (from os-dashboard — 자체 완결 모듈)
│   │   ├── roi/                 (from os-dashboard)
│   │   ├── settings/            (from os-dashboard + IoT 탭 추가)
│   │   └── data-control/        (from os-dashboard)
│   ├── hooks/                   (통합 훅 — 40+)
│   ├── store/                   (통합 Zustand — 6+ 스토어)
│   ├── components/ui/           (통합 UI — 디자인 시스템 기반)
│   ├── integrations/            (Supabase, Analytics)
│   └── i18n/                    (ko/en/ja)
```

> **핵심**: `features/studio/` 디렉토리는 **자체 완결 모듈**로 이동. sceneStore + simulationStore + 13개 오버레이 + 17개 훅이 밀접하게 결합되어 있어 분리 불가. (T3 분석 결과)

---

## 4. 통합 라우팅 설계

### 4.1 URL 구조

```
/                           Landing (공개) ← 현재 Website의 /index
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
  ?tab=store                ├─ 매장 (존 히트맵 포함)
  ?tab=customer             ├─ 고객
  ?tab=product              ├─ 상품
  ?tab=inventory            ├─ 재고
  ?tab=prediction           ├─ 예측
  ?tab=ai                   └─ AI 추천 (Predict→Optimize→Recommend→Execute→Measure)
/dashboard/studio           디지털 트윈 스튜디오 (인증)
/dashboard/roi              ROI 측정 (HQ 이상)
/dashboard/data             데이터 컨트롤 타워 (HQ 이상)
/dashboard/data/lineage     데이터 리니지 (HQ 이상)
/dashboard/settings         설정 (인증)
  ?tab=stores               ├─ 매장 관리
  ?tab=iot                  ├─ IoT 기기 (신규: Pi 상태, 존 설정)
  ?tab=data                 ├─ 데이터
  ?tab=users                ├─ 팀원
  ?tab=system               ├─ 시스템
  ?tab=plan                 └─ 구독/라이선스
/profile                    내 프로필 (인증)
```

> **변경점 (v1.0 대비)**: Landing을 `/`로 이동 (현재 Website는 `/`=Chat), Settings에 IoT 탭 추가.

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
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
  </Route>

  {/* 대시보드: Sidebar + ChatPanel */}
  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<InsightHub />} />
    <Route path="/dashboard/insights" element={<InsightHub />} />
    <Route path="/dashboard/studio" element={<DigitalTwinStudio />} />
    <Route path="/dashboard/roi" element={<ROI />} />
    <Route path="/dashboard/data" element={<DataControlTower />} />
    <Route path="/dashboard/data/lineage" element={<LineageExplorer />} />
    <Route path="/dashboard/settings" element={<Settings />} />
    <Route path="/profile" element={<Profile />} />
  </Route>

  {/* 레거시 리다이렉트 (OS Dashboard 기존 URL 호환) */}
  <Route path="/insights" element={<Navigate to="/dashboard/insights" />} />
  <Route path="/studio" element={<Navigate to="/dashboard/studio" />} />
  {/* ... 12개 추가 리다이렉트 ... */}
</Routes>
```

---

## 5. AI 챗봇 통합 설계

### 5.1 현재 두 챗봇 정밀 비교 (T3/T4 분석 기반)

| 항목 | Website ChatPage | OS ChatPanel |
|------|-----------------|--------------|
| **UI** | 전체 화면 (~1,700줄), 좌측 대화 + 우측 3D | 우측 사이드 패널 (300-600px, 리사이즈) |
| **EF** | `retail-chatbot` (지식 기반, 14모듈) | `neuraltwin-assistant` (액션 디스패치) |
| **스트리밍** | SSE (ReadableStream + AbortController) | SSE (useAssistantChat → supabase.invoke) |
| **3D** | StoreVisualizer (raw Three.js, VizDirective 제어) | 없음 (별도 Studio 연결) |
| **세션** | localStorage (sessionId + conversationId) | chatStore (Zustand, in-memory) |
| **게스트** | 10턴 제한 + 리드 캡처 모달 | 없음 (로그인 필수) |
| **내보내기** | MD / PDF (jsPDF) / DOCX | 없음 |
| **파일 첨부** | Supabase Storage 업로드 | 없음 |
| **컨텍스트** | 게스트/회원 구분, 리드 캡처 | screenDataStore + dateFilter + selectedStore |
| **액션** | 없음 | 22개 액션 (navigate, toggle_overlay, simulation 등) |
| **UI 컴포넌트** | 7개 (shared/chat/components/) | 3개 (components/chat/) |

### 5.2 통합 챗봇 아키텍처

```
features/chat/
├── shared/
│   ├── hooks/
│   │   ├── useChatSession.ts      (세션: localStorage persist, 게스트→로그인 전환)
│   │   ├── useStreaming.ts        (SSE: ReadableStream + AbortController)
│   │   ├── useChatMessages.ts    (메시지 상태: chatStore 통합)
│   │   └── useActionDispatcher.ts (액션: 22타입, OS에서 이식)
│   ├── utils/
│   │   ├── exportConversation.ts  (MD/PDF/DOCX — lazy import)
│   │   └── fileUpload.ts         (Supabase Storage)
│   └── types.ts
├── ChatPage.tsx                   (공개: 전체 화면 + 3D VizDirective)
│   ├── 좌측: 대화 (SuggestionChips, FeedbackButtons)
│   ├── 우측: StoreVisualizer (raw Three.js)
│   └── 게스트 10턴 + 리드 캡처
├── ChatPanel.tsx                  (대시보드: 사이드 패널)
│   ├── 리사이즈 300-600px
│   ├── screenDataStore 연동
│   └── useActionDispatcher (navigate, overlay, simulation)
└── components/
    ├── ChatInput.tsx              ├── ChatMessage.tsx
    ├── ChatSuggestions.tsx         ├── ChatExportButton.tsx
    ├── TypingIndicator.tsx         ├── WelcomeMessage.tsx
    └── FeedbackButtons.tsx
```

### 5.3 EF 통합 전략

현재 Website(`retail-chatbot`)와 OS(`neuraltwin-assistant`)는 **별도 EF**.

| 옵션 | 설명 | 추천 |
|------|------|------|
| A. 하나로 통합 | `neuraltwin-assistant`에 게스트 모드 + 지식 모듈 병합 | Phase 3에서 |
| B. 프록시 | 통합 EF가 내부적으로 적절한 EF 호출 | 복잡 |
| **C. 유지 후 점진적 병합** | 공개 = `retail-chatbot`, 대시보드 = `neuraltwin-assistant` 유지 | **v2.0 추천** |

> `retail-chatbot`은 14개 리테일 지식 모듈(retailKnowledge.ts) 기반 — 마케팅/컨설팅 용. `neuraltwin-assistant`은 대시보드 액션 디스패치 + 실시간 데이터 컨텍스트 기반. 역할이 다르므로 Phase 3까지 분리 유지.

### 5.4 게스트→로그인 세션 연속성

```
[공개 /chat]                      [로그인 후 /dashboard]
  crypto.randomUUID() → sessionId     동일 sessionId 유지 (localStorage)
  retail-chatbot EF (10턴)             ↓
  "더 분석하려면 가입하세요"         neuraltwin-assistant EF로 전환
       ↓ 가입/로그인                 이전 세션 이력 DB에서 로드
  세션 → user_id 연결              + 실제 매장 데이터 기반 답변
```

---

## 6. 디자인 시스템 통합 (T6 Designer 분석 기반)

### 6.1 현재 디자인 불일치 — 정량 감사 결과

| 디자인 토큰 | Website 값 | OS Dashboard 값 | 불일치 정도 |
|------------|-----------|-----------------|------------|
| `--background` | `0 0% 98%` (near white) | `0 0% 92%` (light gray) | 경미 |
| `--accent` | `0 0% 20%` (dark) | `0 0% 96%` (near-white) | **심각 — 반전** |
| `--ring` | `0 0% 15%` (dark) | `0 0% 65%` (medium gray) | **심각** |
| `--radius` | `1rem` (16px) | `24px` | **차이** |
| `--destructive` | `0 60% 45%` | `0 84% 60%` | 차이 |
| Heading weight | `700` | `600` | 차이 |
| Heading font | Inter + Pretendard | Pretendard only | 차이 |
| Glassmorphism blur | `20px` | `80px` | **4배 차이** |
| Dark mode class | `.light` | `.dark` | **반대 규칙** |
| `dark:` 사용 빈도 | 3회 (라이브러리만) | 132회 (25 파일) | OS 전용 |
| `--glass-bg` 형식 | HSL 값 | `linear-gradient(...)` 문자열 | **호환 불가** |
| 사이드바 accent | `245 65% 72%` (purple) | grayscale | 불일치 |

### 6.2 통합 디자인 토큰 (권장)

```css
:root {
  /* 기본 */
  --background: 0 0% 96%;
  --foreground: 0 0% 5%;
  --primary: 0 0% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 95%;
  --accent: 0 0% 96%;                  /* OS 기준으로 통일 */
  --muted: 0 0% 94%;
  --destructive: 0 72% 52%;            /* 절충값 */

  /* 포커스 */
  --ring: 0 0% 45%;                    /* 절충값 */
  --border: 0 0% 89%;

  /* 곡률 */
  --radius: 20px;                      /* 절충값 */
  --radius-sm: 12px;
  --radius-xs: 8px;

  /* 글래스모피즘 — 통합 */
  --blur-glass: 40px;                  /* 절충: 20px ↔ 80px */
  --blur-subtle: 12px;
  --glass-opacity: 0.7;
  --glass-border-opacity: 0.15;

  /* 차트 */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;

  /* 상태 */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 98%;
}

.dark {
  --background: 0 0% 8%;
  --foreground: 0 0% 95%;
  /* ... (다크 모드 전체 정의) */
}
```

### 6.3 디자인 시스템 통합 체크리스트

| 항목 | 작업 | Owner | 우선순위 |
|------|------|-------|---------|
| 다크 모드 클래스 통일 | `.light` → `.dark` 규칙으로 변경 (Website) | T4+T6 | P0 |
| CSS 변수 충돌 해결 | `--accent`, `--ring`, `--radius` 통일 | T6 | P0 |
| Glassmorphism 통합 | OS `glass-card.tsx` 기반으로 공유 컴포넌트화 | T6+T4 | P0 |
| `--glass-bg` 형식 통일 | HSL 단일 값으로 표준화 | T6 | P0 |
| 타이포그래피 통일 | Pretendard 단일 (Inter 제거), 헤딩 weight 600 | T6 | P1 |
| fade-in 애니메이션 | 0.3s (앱 기준)로 통일 | T6 | P1 |
| @neuraltwin/ui 확장 | 4개 → 20+ 컴포넌트 (glass-card 포함) | T4+T6 | P1 |
| Website sidebar purple | `245 65% 72%` → grayscale로 변경 | T4 | P1 |
| 3D 텍스트 효과 | 대시보드 전용 유지 (CSS scope) | T6 | P2 |

### 6.4 네비게이션 와이어프레임

```
┌──────────────────────────────────────────────────────┐
│ [공개 페이지]                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Logo  Product  Pricing  About  Contact  Chat  Login│  │
│ └──────────────────────────────────────────────────┘  │
│                  Header (공개)                         │
│                                                       │
│            페이지 콘텐츠 (Landing, Product 등)           │
│                                                       │
│ ┌──────────────────────────────────────────────────┐  │
│ │                  Footer                          │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ [대시보드]                                             │
│ ┌────┬────────────────────────────────┬──────────┐   │
│ │    │ Header (테마/알림/유저/AI토글)   │          │   │
│ │    ├────────────────────────────────┤  Chat    │   │
│ │ S  │                                │  Panel   │   │
│ │ i  │       메인 콘텐츠 영역           │  (접이식) │   │
│ │ d  │ (Insights/Studio/ROI/Settings) │ 300-600px│   │
│ │ e  │                                │          │   │
│ │ b  │                                │          │   │
│ │ a  │   + 실시간 IoT 위젯 (하단)       │          │   │
│ │ r  │                                │          │   │
│ └────┴────────────────────────────────┴──────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 7. 공유 상태 관리 (T3 정밀 분석 기반)

### 7.1 Zustand Store 통합 계획

| Store | 현재 소속 | 상태 크기 | 커플링 | 통합 방안 |
|-------|---------|----------|--------|----------|
| **chatStore** | OS (글로벌) | messages[], isOpen, width | 중간 | → 전역 (공개+대시보드 공유) |
| **dateFilterStore** | OS (글로벌) | dateRange (persist) | **높음** (8+ 훅에서 사용) | → 대시보드 전용 유지, localStorage 키 유지 |
| **screenDataStore** | OS (글로벌) | overviewKPIs, funnel, storeKPIs | 낮음 | → 대시보드 전용 (챗봇 컨텍스트 브릿지) |
| **simulationStore** | OS (글로벌) | entities, customers, kpi + tick loop | **매우 높음** | → Studio 전용 유지 (requestAnimationFrame 의존) |
| **sceneStore** | OS Studio | models[], layers[], camera, overlays | **임계** (30+ 파일) | → Studio 전용 유지 (분리 불가) |
| **simulationStore** (studio) | OS Studio | AI 시뮬레이션 결과 | 중간 | → Studio 전용 유지 |
| **authStore** | (신규) | user, org, role, license | — | → 전역: useAuth 통합 |
| **themeStore** | (신규) | isDark + localStorage persist | — | → 전역: `.dark` 클래스 제어 |

> **주의**: `simulationStore`가 글로벌과 Studio에 **동명 중복** 존재 (T3 발견). 통합 시 네임스페이스 분리 필수.

### 7.2 Hook 통합 분류 (40+ 훅)

| 분류 | 공유 가능 | 대시보드 전용 |
|------|----------|-------------|
| **인증** | `useAuth` | — |
| **AI/챗봇** | `useChatSession`, `useStreaming` | `useAssistantChat`, `useActionDispatcher`, `useRetailAI` |
| **데이터** | `useDashboardKPI`, `useZoneMetrics`, `useCustomerSegments` | `useDataReadiness`, `useImportProgress` |
| **3D/Studio** | — | `useStoreScene`, `useSimulationEngine`, `useScenePersistence` + 17 studio 훅 |
| **유틸리티** | `useCountUp`, `useMobile`, `useActivityLogger` | `useDeviceCapability` |
| **i18n** | `useTranslation` | — |

---

## 8. 인증 통합

### 8.1 현재 비교 (T2/T4 분석 기반)

| 항목 | Website (`useAuth.ts`) | OS Dashboard (`useAuth.tsx`) |
|------|---------|-------------|
| 반환값 | user, authContext, hasRole(), hasAnyRole() | user, orgId, orgName, role |
| 조직 조회 | `organization_members` 쿼리 | 동일 + `migrate_user_to_organization` RPC fallback |
| OAuth | 없음 | Google, Kakao |
| 로그아웃 | `neuraltwin_manual_logout` localStorage 플래그 | `signOut()` |
| 피처 게이팅 | hasRole 기반 | hasFeature(feature) 기반 |
| 역할 | NEURALTWIN_MASTER, ORG_HQ, ORG_STORE, ORG_VIEWER | 동일 |

### 8.2 통합 useAuth

```typescript
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'kakao') => Promise<void>;

  // 게스트 세션
  isGuest: boolean;
  guestSessionId: string | null;
}
```

---

## 9. 백엔드 통합 (T2 분석 기반)

### 9.1 EF CORS 업데이트 필요

`supabase/supabase/functions/_shared/streamingResponse.ts`에 하드코딩된 allowed origins 업데이트:
- 현재: `neuraltwin.com`, `neuraltwin.website`, `localhost:5173`
- 통합 후: `neuraltwin.com` 단일 도메인 + `localhost:517X` 개발용

### 9.2 L2→L3 자동 집계 — Critical Gap

**현재 상태**: `zone_events`(L2) → `zone_daily_metrics`(L3) 자동 집계 **없음**.
- `unified-etl` EF에 L2→L3 코드 존재하지만 수동 호출만 가능
- `etl-scheduler` EF 존재하지만 **cron 미연결**
- OS Dashboard는 데이터 import 후 `aggregate-all-kpis` 수동 호출

**해결 방안**:
```yaml
# .github/workflows/etl-cron.yml (신규)
on:
  schedule:
    - cron: '0 2 * * *'  # 매일 새벽 2시 (KST 11시)

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST "$SUPABASE_URL/functions/v1/etl-scheduler" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### 9.3 Realtime 사용 현황

| 사용처 | 테이블 | 이벤트 |
|--------|--------|--------|
| `useRealtimeTracking` | visits/zones | 시뮬레이션 |
| `useImportProgress` | data_imports | 임포트 진행 |
| `useRealtimeInventory` | inventory | 재고 변동 |
| `useSelectedStore` | stores | 매장 변경 |
| `useWiFiTracking` | WiFi tracking | WiFi 이벤트 |
| **(신규)** | `neuralsense_live_state` | **IoT 실시간** |

### 9.4 미사용/미확인 EF 감사

다음 5개 EF의 용도 확인 및 정리 필요:
- `dynamic-handler`, `dynamic-responder`, `hyper-task`, `quick-handler`, `bright-processor`
- `sync-pos-data` (코드에 guard: "EF not yet deployed")

---

## 10. IoT 통합 (T1 분석 기반)

### 10.1 현재 파이프라인

```
[8x Raspberry Pi] → WiFi probe sniff
    → MQTT (100.87.27.7:1883, Tailscale VPN)
    → run_live_geometry.py (노트북)
        - 5s 롤링 RSSI 버퍼
        - 8-Pi freshness gate
        - Median normalize → composite score
        - Margin gating (>0.15)
        - Session linking (MAC 랜덤화 대응)
        - Transition debounce (3연속 확인)
    → zone_assignments.jsonl (로컬)
    → supabase_uploader.py (배치: 30초/50건)
        → process-neuralsense-data EF
        → DB: zone_events + visits + funnel_events
```

### 10.2 실시간 대시보드 연동 (신규)

**추천: Supabase Realtime 브릿지** (MQTT WebSocket 대비 구현 비용 낮음)

```sql
-- 신규 테이블: neuralsense_live_state
CREATE TABLE neuralsense_live_state (
  session_id TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  zone_id UUID REFERENCES zones_dim(id),
  ns_zone_id INTEGER,
  x INTEGER,
  y INTEGER,
  confidence FLOAT,
  margin FLOAT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

- `run_live_geometry.py`가 매 zone_assignment마다 upsert (비배치)
- 대시보드에서 Supabase Realtime 구독 → 2초 이내 갱신
- 대시보드 위젯: "현재 매장 현황" (방문자 수, 존별 점유, 최근 전환)

### 10.3 Settings 페이지 — IoT 탭 (신규)

| 기능 | 데이터 소스 | UI |
|------|-----------|-----|
| Pi 상태 (8대) | `neuralsense_pi_health` 테이블 (신규) | 테이블: Pi ID, IP, 상태, 마지막 신호 |
| MQTT 브로커 헬스 | heartbeat 체크 | 초록/빨강 인디케이터 |
| NS존 구성 (19존) | `zones_dim` | 2D 그리드 시각화 + 이름/타입 편집기 |
| 존 정확도 | `neuralsense_calibration` (신규) | 존별 정확도 % 배지 |
| 캘리브레이션 상태 | calibration.jsonl 업로드 | 마지막 캘리브레이션 날짜 |

### 10.4 IoT 관련 보안 이슈

| 이슈 | 심각도 | 대응 |
|------|--------|------|
| MAC 해싱 미적용 | 높음 | `pi_controller.sh`에 `--hash-macs` 프로덕션 모드 추가 |
| anon key로 데이터 업로드 | 중간 | service role key 또는 단기 JWT 전환 |
| MQTT 평문 전송 | 낮음 (VPN 내부) | Tailscale 이미 암호화, 추가 불필요 |
| 노트북 SPOF | 중간 | 장기적 전용 게이트웨이 디바이스 전환 |

### 10.5 누락 필드 (EF 업데이트 필요)

`supabase_uploader.py`에서 `margin`, `second_zone_id`, `sources`를 전송하지 않음.
`process-neuralsense-data` EF의 `NeuralsenseReading` 인터페이스에도 미포함.
→ 정확도 모니터링에 필요. T1+T2 협업으로 업데이트.

---

## 11. 도메인 기능 강화 (T5 분석 기반)

### 11.1 현재 리테일 분석 기능 평가

**강점 (유지)**:
- 14개 리테일 AI 지식 모듈 (`retailKnowledge.ts`) — 한국 시장 특화
- 5단계 퍼널 (Entry→Browse→Engage→Fitting→Purchase) — 경쟁사 대비 세분화
- AI 의사결정 루프 (Predict→Optimize→Recommend→Execute→Measure)
- `zone_daily_metrics` 15+ 컬럼 (존별 인텔리전스 기반)

**경쟁 갭 (추가 필요)**:

| 누락 기능 | 경쟁사 보유 | 구현 난이도 | 우선순위 |
|----------|-----------|-----------|---------|
| **2D 공간 히트맵** (바닥 평면 색상 오버레이) | RetailNext, Sensormatic | 중 (`heatmap_intensity` 이미 존재) | **P0** |
| **멀티 매장 비교** | Placer.ai | 중 (`org_id` 아키텍처 지원) | **P0** |
| **방문 경로 시각화** (존→존 이동 화살표) | RetailNext | 중 (`visit_zone_events` 데이터 존재) | P1 |
| **실시간 점유 모니터링** | Sensormatic, Axis | 낮음 (IoT 브릿지로 해결) | P1 |
| **요일별 비교** (7일 x 24시간 히트맵) | Placer.ai | 낮음 | P1 |
| **피팅룸 전환율** | 자체 퍼널에서 유도 가능 | 낮음 | P1 |

### 11.2 KPI 강화

| KPI | 현재 | 추가 방안 |
|-----|------|----------|
| **Fitting Room CVR** | `funnel_events`에 'fitting' 단계 존재 | fitting→purchase 전환율 위젯 추가 |
| **Revenue per sqm** | `zone_daily_metrics.revenue_attributed` 존재 | `zones_dim`에 `area_sqm` 필드 추가 |
| **UPT (Units Per Transaction)** | `purchases` 테이블 존재 | 라인 아이템 기반 계산 |
| **Repeat Visit Rate** | `visits` + `customers` 테이블 | 재방문율 = 재방문자/전체 방문자 |
| **SPLH (Sales Per Labor Hour)** | `shift_schedules` 테이블 미구현 | Phase 2에서 스태프 데이터 입력 후 |

### 11.3 스키마 갭 (T5 발견)

| 테이블 | 상태 | 영향 |
|--------|------|------|
| `prediction_records` | 미구현 | AI 예측 정확도 추적 불가 (MAPE 계산 불가) |
| `shift_schedules` | 미구현 | SPLH, 스태프 최적화 기능 차단 |
| `hq_guidelines` | 미구현 | HQ 페르소나 기능 차단 (벤치마크 전달) |
| `hq_notifications` | 미구현 | HQ→매장 커뮤니케이션 채널 없음 |
| `customer_nps` | 테이블 없음 | NPS 수집/표시 불가 |

### 11.4 용어 일관성 (T5 리뷰)

- "센서 커버율" → 툴팁 추가: "선택 기간 내 센서 데이터가 있는 존의 비율"
- "존 전환율" → "존 구매 전환율 (해당 존 방문 대비 구매율)"로 명확화
- Funnel "ENGAGE" 단계 → AI 챗봇이 설명할 수 있도록 맵핑 문서화

---

## 12. i18n 통합

### 12.1 현재 → 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| Website | ko/en (~300-400키) | ko/en/ja |
| OS Dashboard | 미구현 (하드코딩 한국어) | ko/en/ja |

### 12.2 번역 구조

```
i18n/
├── config.ts
└── locales/
    ├── ko/
    │   ├── common.ts      (네비게이션, 버튼, 에러 메시지)
    │   ├── public.ts      (Landing, Product, Pricing, Contact, About)
    │   ├── chat.ts        (AI 챗봇)
    │   ├── insights.ts    (인사이트 허브 7탭 — Canvas 렌더 텍스트 포함)
    │   ├── studio.ts      (디지털 트윈 — 오버레이/패널 라벨)
    │   ├── settings.ts    (설정 6탭)
    │   ├── data.ts        (데이터 관리)
    │   └── auth.ts        (인증)
    ├── en/
    │   └── (동일 구조)
    └── ja/
        └── (동일 구조)
```

### 12.3 i18n 주의사항 (T5 지적)

1. **Canvas 렌더 텍스트**: 차트 축/라벨은 i18n 라이브러리가 처리 불가 → 커스텀 locale 포매터 필요
2. **일본어 리테일 용어**: 客単価(ATV), 転換率(CVR), 滞在時間(Dwell Time) 등 업계 표준 용어 검증 필요
3. **EN 번역 불완전**: 현재 EN 파일이 KO보다 ~12% 짧음 → 누락 키 확인 필요
4. **`<html lang>`**: 현재 `"en"` 하드코딩 → 동적 변경 필요

---

## 13. 실행 계획 (6 Teammate 분석 반영)

### Phase 0: 사전 준비 (1주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 0.1 | 디자인 토큰 정의 | T6 Designer | 통합 CSS 변수 체계 확정 (색상/곡률/블러/타이포) |
| 0.2 | @neuraltwin/ui 확장 계획 | T6+T4 | glass-card, chart 등 20+ 컴포넌트 목록 확정 |
| 0.3 | 미사용 EF 감사 | T2 Backend | 5개 미확인 EF 용도 확인 및 정리 |
| 0.4 | L2→L3 자동 집계 | T2 Backend | etl-scheduler cron 연결 (GitHub Actions) |
| 0.5 | EF CORS 업데이트 | T2 Backend | streamingResponse.ts 도메인 목록 정리 |

### Phase 1: 기반 통합 (2주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 1.1 | 통합 앱 스캐폴드 | T4 Website | `apps/neuraltwin-app/` 생성, 라우팅 구조 설정 |
| 1.2 | 디자인 시스템 통합 | T6+T4 | CSS 변수 통일, `.dark` 클래스 통일, glassmorphism 표준화 |
| 1.3 | @neuraltwin/ui 확장 | T4+T6 | 4개 → 20+ 컴포넌트 (glass-card, toast, sidebar 등) |
| 1.4 | 인증 통합 | T2+T4 | useAuth 병합, OAuth 추가, 게스트 세션 지원 |
| 1.5 | 레이아웃 설정 | T4 | PublicLayout + DashboardLayout 구현 |
| 1.6 | Zustand 통합 | T3+T4 | chatStore 전역화, simulationStore 이름충돌 해결 |

### Phase 2: 페이지 마이그레이션 (3주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 2.1 | 공개 페이지 이식 | T4 | Landing(→/), Product, Pricing, Contact, About, Privacy, Terms |
| 2.2 | InsightHub 이식 | T3 | 7탭 + InsightDataContext + dateFilterStore |
| 2.3 | Studio 이식 | T3 | **자체 완결 모듈** 통째로 이동 (sceneStore + 13 overlay + 17 hooks) |
| 2.4 | ROI/Data/Settings 이식 | T3+T2 | ROI, DataControlTower, LineageExplorer, Settings |
| 2.5 | Settings IoT 탭 추가 | T1+T3 | Pi 상태, NS존 그리드 편집기, 캘리브레이션 |
| 2.6 | Profile 통합 | T4 | 기존 Profile 페이지 확장 |
| 2.7 | 레거시 리다이렉트 | T4 | OS 기존 URL 12개 → /dashboard/* 리다이렉트 |

### Phase 3: AI 챗봇 + IoT 통합 (2주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 3.1 | Chat 공통 모듈 추출 | T4 | useChatSession, useStreaming, ChatInput/Message 공통화 |
| 3.2 | ChatPage (공개) | T4 | 전체 화면 + 3D VizDirective + 게스트 10턴 + 리드 캡처 |
| 3.3 | ChatPanel (대시보드) | T3 | 사이드 패널 + screenDataStore + useActionDispatcher |
| 3.4 | 세션 연속성 | T2 | 게스트→로그인 세션 전환 (세션 DB 저장) |
| 3.5 | IoT Realtime 브릿지 | T1+T2 | neuralsense_live_state 테이블 + upsert EF |
| 3.6 | 실시간 대시보드 위젯 | T3 | "현재 매장 현황" 위젯 (Supabase Realtime 구독) |
| 3.7 | MAC 해싱 적용 | T1 | pi_controller.sh 프로덕션 모드 `--hash-macs` |

### Phase 4: 도메인 강화 + i18n + 마무리 (2주)

| Step | Task | Owner | Description |
|------|------|-------|-------------|
| 4.1 | 2D 공간 히트맵 | T3+T6 | StoreTab에 바닥 평면 존 히트맵 오버레이 추가 |
| 4.2 | 멀티 매장 비교 | T3+T2 | HQ 페르소나 전용 매장 비교 탭/대시보드 |
| 4.3 | Fitting Room CVR 위젯 | T3 | Customer 탭에 피팅룸 전환율 KPI 추가 |
| 4.4 | i18n 대시보드 적용 | T3+T4 | InsightHub, Studio, Settings 번역 키 추출 |
| 4.5 | en/ja 번역 | T5 | 영어 누락 키 보완 + 일본어 리테일 용어 번역 |
| 4.6 | SEO 강화 | T4 | sitemap.xml, robots.txt, 동적 `lang` 속성, OG 최적화 |
| 4.7 | Analytics 활성화 | T4 | GA4 + Meta Pixel 스크립트 index.html 연결 |
| 4.8 | E2E 테스트 | 전원 | 전체 유저 플로우 검증 |
| 4.9 | 배포 설정 | T2 | Vercel 단일 프로젝트, CI/CD 통합, EF 선택적 배포 |
| 4.10 | 디자인 리뷰 | T6 | 전체 UI/UX 일관성 최종 감사 |

---

## 14. 기술적 고려사항

### 14.1 번들 크기 최적화

```
현재 상태:
  website:      ~800KB (gzip)  — Three.js (raw) + R3F (product demos)
  os-dashboard: ~1.5MB (gzip)  — R3F + Canvas charts + 44 UI + 13 overlays

통합 후 전략 (Route-based code splitting):
  공개 페이지:    ~200KB (Three.js 제외)
  /chat:         +400KB (raw Three.js on demand — StoreVisualizer)
  /dashboard:    +800KB (R3F + Charts on demand — lazy import)
  /dashboard/studio: +300KB (13 overlays + simulation on demand)

코드 분할:
  React.lazy(() => import('./features/studio/DigitalTwinStudioPage'))
  React.lazy(() => import('./features/insights/InsightHubPage'))
  React.lazy(() => import('./pages/public/Chat'))
```

### 14.2 Studio 마이그레이션 위험

**T3 분석 핵심 발견**: Digital Twin Studio는 분리 불가능한 자체 완결 모듈.

- sceneStore: 644줄, 30+ 파일에서 구독
- simulationStore: `useFrame` (R3F)으로 매 프레임 tick → `subscribeWithSelector` 필수
- 13 오버레이가 모두 sceneStore 직접 참조
- `window.dispatchEvent` (CustomEvent)로 ChatPanel↔Studio 통신

**마이그레이션 전략**: `features/studio/` 디렉토리 전체를 하나의 단위로 이동.
내부 구조 변경 없이 import 경로만 업데이트. Phase 2.3에서 수행.

### 14.3 3D 라이브러리 이중화

| 3D 시스템 | 라이브러리 | 위치 | 용도 |
|-----------|-----------|------|------|
| Chatbot Visualizer | raw Three.js + OrbitControls | Website chat | AI VizDirective 제어 wireframe |
| Product Demos | R3F + Drei | Website product | 마케팅 데모 위젯 |
| Digital Twin | R3F + Drei + postprocessing | OS studio | 실 운영 3D 시각화 |
| Ontology Graph | R3F | OS settings | 3D 포스 그래프 |

> 통합 후에도 Chatbot Visualizer (raw Three.js)와 나머지 (R3F)는 분리 유지.
> raw Three.js는 VizDirective JSON 기반 명령형 제어에 최적화되어 있으며, R3F로 포팅 시 이점 없음.

### 14.4 배포 전략

| 항목 | 현재 | 통합 후 |
|------|------|---------|
| Website URL | website.neuraltwin.com | neuraltwin.com |
| OS URL | os.neuraltwin.com | neuraltwin.com/dashboard |
| 빌드 | 2개 개별 Vite 빌드 | 단일 Vite 빌드 |
| Vercel | 2개 프로젝트 | 1개 프로젝트 |
| CI/CD | 각각 트리거 | 통합 파이프라인 |
| EF 배포 | 전체 46개 일괄 | **변경분만 선택적 배포** (개선) |

---

## 15. 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| **Studio 마이그레이션 실패** | 3D 기능 불능 | 중 | 자체 완결 모듈로 통째 이동, 내부 변경 없음 |
| **번들 크기 초과** | 초기 로딩 느림 | 중 | Route-based splitting + preload hints |
| **CSS 변수 충돌** | 레이아웃 깨짐 | **높음** | Phase 0에서 디자인 토큰 먼저 통일 (T6 주도) |
| **simulationStore 이름충돌** | 잘못된 스토어 참조 | 중 | 네임스페이스 분리 (globalSimulation vs studioSimulation) |
| **다크 모드 클래스 반전** | 테마 전환 시 깨짐 | **높음** | Phase 1에서 `.dark` 규칙 통일 |
| **i18n Canvas 텍스트** | 차트 라벨 번역 누락 | 중 | 커스텀 locale 포매터 개발 |
| **인증 마이그레이션** | 기존 세션 유실 | 저 | Supabase 세션 자동 유지 |
| **IoT SPOF** | 노트북 다운 시 데이터 중단 | 중 | 운영 문서화, 장기적 게이트웨이 전환 |
| **MAC 해싱 미적용** | 개인정보 위반 리스크 | 높음 | Phase 3에서 `--hash-macs` 프로덕션 모드 적용 |
| **큰 작업량** | 개발 기간 초과 | 고 | Phase별 독립 배포 가능하게 설계 |

---

## 16. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 도메인 수 | 2개 (website + os) | 1개 |
| 로그인 횟수 (유저당) | 2회 | 1회 |
| AI 챗봇 세션 연속성 | 단절 (서로 다른 EF) | 공개↔대시보드 세션 ID 연속 |
| 코드 중복률 | ~30% (인증, UI, Supabase) | <5% |
| @neuraltwin/ui 컴포넌트 수 | 4개 | 20+ |
| @neuraltwin/ui 사용률 | Website 4파일 / OS 0파일 | 전체 UI import 통일 |
| CSS 변수 불일치 | 10개 이상 | 0개 |
| 초기 로딩 (공개) | ~3s | <2s |
| 초기 로딩 (대시보드) | ~5s | <3s |
| 다국어 | ko/en (Website만) | ko/en/ja (전체) |
| IoT 데이터 지연 | 30초 (배치) | <2초 (Realtime) |
| 2D 히트맵 | 없음 | StoreTab에 존 히트맵 |
| 멀티 매장 비교 | 없음 | HQ 전용 비교 뷰 |
| SEO | OG 태그만 | sitemap + robots.txt + 동적 lang |
| Analytics | 코드만 존재 | GA4 + Meta Pixel 활성화 |

---

## 17. 의사결정 필요 사항

CEO 검토/결정이 필요한 항목:

| # | 항목 | 옵션 | PM 추천 |
|---|------|------|---------|
| 1 | **통합 방식** | A(모노앱) / B(Micro-FE) / C(라우팅 통합) | **C** |
| 2 | **도메인** | neuraltwin.com 단일 도메인 | 확정 필요 |
| 3 | **루트 페이지** | `/` = Landing (마케팅) vs `/` = Chat (제품 주도) | **Landing 추천** |
| 4 | **다국어 범위** | ja 전체 vs 공개 페이지만 | 전체 추천 |
| 5 | **기존 URL 리다이렉트** | os.neuraltwin.com → neuraltwin.com/dashboard 자동 전환 기간 | 6개월 추천 |
| 6 | **GA/Meta Pixel** | 기존 추적 ID 유지 vs 신규 | 기존 유지 추천 |
| 7 | **MAC 해싱** | 즉시 적용 vs Phase 3 적용 | **즉시 추천 (GDPR)** |
| 8 | **L2→L3 자동 집계** | GitHub Actions cron vs pg_cron vs Supabase Webhooks | **GH Actions 추천** |
| 9 | **NS존 이름** | 매장 실제 구역명 매핑 일정 | CEO 직접 지정 필요 |
| 10 | **타임라인** | Phase 0-4 총 ~8주 | 확인 필요 |

---

## 부록 A: 팀별 기여 요약

| Agent | 분석 범위 | 핵심 발견 |
|-------|----------|----------|
| **PM Lead** | 전체 통합, 문서 작성 | v1.0→v2.0 기획 통합 |
| **T1 IoT** | apps/neuralsense/ 전체 | 실시간 브릿지 아키텍처, Pi 관리 UI, MAC 해싱 이슈, SPOF 문서화 |
| **T2 Backend** | supabase/ 전체, CI/CD | EF 47개 인벤토리, L2→L3 자동 집계 부재, Realtime 현황, CORS 업데이트 |
| **T3 DT/OS** | apps/os-dashboard/ 전체 | 6 스토어/40+ 훅/44 UI 정밀 인벤토리, Studio 자체 완결 모듈 판정, simulationStore 이름충돌 |
| **T4 Website** | apps/website/, packages/ui/ | 13 라우트 매핑, Chat ~1700줄 분석, 3D 이중 시스템, GA/SEO 미활성화, @neuraltwin/ui 4개만 |
| **T5 Domain** | 리테일 도메인, AI 지식 | 14 지식 모듈 평가, 경쟁 갭 6개, KPI 5개 추가 권장, 스키마 갭 5개, 용어 일관성 |
| **T6 Designer** | 양 앱 CSS/UI 전수 감사 | CSS 변수 10개 불일치, accent 반전, radius/blur/font 차이, 다크모드 클래스 반전, @neuraltwin/ui 사실상 미사용 |
