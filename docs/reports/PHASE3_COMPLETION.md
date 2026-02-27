# Phase 3 완료 리포트 — AI 챗봇 통합 + IoT 실시간 브릿지

> **커밋**: `69277138`
> **브랜치**: `neuraltwin/sungshin` (프론트엔드) + `neuraltwin-sungshin` (백엔드 DB)
> **완료일**: 2026-02-27
> **담당**: T4 (Website), T2 (Backend), T1 (IoT 인프라 준비)

---

## 1. 변경 요약

| 태스크 | 설명 | 신규 파일 | 수정 파일 | 상태 |
|--------|------|-----------|-----------|------|
| P3-1: 세션 인계 | 비회원→회원 채팅 자동 머지 | 0 | 1 | 완료 |
| P3-2: AI 어시스턴트 | OS 대시보드 사이드 패널 | 3 | 1 | 완료 |
| P3-3: IoT 실시간 | 실시간 방문자 추적 + 위젯 | 4 | 2 | 완료 |
| 리포트 | Phase 1, 2 완료 리포트 | 2 | 0 | 완료 |
| DB 마이그레이션 | neuralsense_live_state 테이블 | 1 | 0 | 완료 |

**총**: 10개 신규 파일, 4개 수정 파일, 1,470줄 추가

---

## 2. P3-1: 세션 인계 (비회원→회원 채팅 머지)

### 구현 내용

기존 백엔드 인프라 (`handover_chat_session` RPC + `retail-chatbot` EF 핸들러)를 프론트엔드에서 호출하도록 연결.

### 변경 파일

| 파일 | 변경 |
|------|------|
| `src/pages/Auth.tsx` | 로그인 성공 후 세션 핸도버 호출 (3개 코드 경로) |

### 동작 흐름

```
게스트 채팅 (sessionId: localStorage)
  → 로그인/회원가입 성공
  → Auth.tsx에서 handover_session API 호출
    - POST /functions/v1/retail-chatbot
    - body: { action: 'handover_session', sessionId }
    - Authorization: Bearer ${access_token}
  → 백엔드: chat_conversations.user_id = NULL → 현재 유저로 업데이트
  → navigate(safeRedirect)
```

### 핸도버 호출 위치 (3곳)

1. `ensureOrganizationAndNavigate()` — 초기 세션 체크 + onAuthStateChange
2. `ensureOrgNav()` (useEffect 내부) — ensureOrgNavWrapper 호출
3. `handleEmailSignUp()` — 이메일 회원가입 폼 제출

### 설계 결정

| 결정 | 이유 |
|------|------|
| Non-blocking (try/catch, warn만) | 핸도버 실패해도 로그인 플로우 중단 안 됨 |
| sessionId 삭제 안 함 | 유저가 채팅 페이지로 돌아갈 수 있음 |
| access_token 사용 | 백엔드에서 auth.uid() 검증 가능 |

---

## 3. P3-2: OS AI 어시스턴트 사이드 패널

### 구현 내용

DashboardLayout에 접이식 AI 어시스턴트 패널 추가. 공유 Chat UI Kit (variant="os") 재사용.

### 신규 파일

| 파일 | 설명 | 라인 |
|------|------|------|
| `src/components/assistant/useAssistant.ts` | 어시스턴트 통신 훅 | 247 |
| `src/components/assistant/AssistantPanel.tsx` | UI 패널 컴포넌트 | 174 |
| `src/components/assistant/index.ts` | Barrel export | 2 |

### 수정 파일

| 파일 | 변경 |
|------|------|
| `src/layouts/DashboardLayout.tsx` | 사이드바에 AI 토글 버튼, 콘텐츠 영역에 패널, 모바일 탭바에 AI 탭 추가 |

### 아키텍처

```
DashboardLayout
├── Sidebar
│   ├── Nav items (4개)
│   ├── AI 어시스턴트 토글 버튼 (MessageSquare)  ← 신규
│   └── User footer
├── Header bar
├── Content area (flex)
│   ├── <Outlet /> (메인 콘텐츠)
│   └── <AssistantPanel /> (조건부)  ← 신규
└── Mobile bottom tab bar
    └── AI 탭 (5번째)  ← 신규
```

### useAssistant 훅 기능

| 기능 | 설명 |
|------|------|
| 메시지 관리 | ChatMessageUI[] 상태, 유저/어시스턴트 메시지 추가 |
| EF 통신 | `neuraltwin-assistant` EF에 POST (JSON, non-streaming) |
| 페이지 컨텍스트 | useLocation()으로 현재 페이지/탭 자동 전달 |
| 매장 컨텍스트 | useSelectedStore()로 매장 정보 전달 |
| 액션 처리 | 응답의 `navigate` 액션 자동 실행 (useNavigate) |
| 제안 | 응답의 suggestions를 SuggestionChips로 표시 |
| 초기화 | clearChat()로 대화 리셋 |

### AssistantPanel UI

| 요소 | 스펙 |
|------|------|
| 데스크톱 | w-80 (320px), 우측 패널, border-l |
| 모바일 | 풀스크린 오버레이, bg-black/40 배경 |
| 헤더 | Bot 아이콘 + "AI Assistant" + 초기화 + 닫기 |
| 컨텍스트 뱃지 | 현재 페이지명 (예: "인사이트 허브") + 초록 점 |
| 메시지 | ChatBubble (variant="os") + ChatScrollArea |
| 입력 | ChatInput (variant="os") + SuggestionChips |
| 웰컴 | WelcomeMessage (variant="os") |
| 키보드 | Escape로 닫기 |

---

## 4. P3-3: IoT 실시간 브릿지

### 구현 내용

neuralsense_live_state 테이블 생성 + Supabase Realtime 구독 + UI 위젯.

### 백엔드 (Supabase neuraltwin-sungshin 브랜치)

| 항목 | 설명 |
|------|------|
| **테이블** | `neuralsense_live_state` — 실시간 방문자 위치 추적 |
| **인덱스** | store_active, hashed_mac, last_seen, unique_active |
| **RLS** | authenticated: SELECT, service_role: INSERT/UPDATE/DELETE |
| **Realtime** | `supabase_realtime` publication에 추가 |
| **RPC** | `upsert_live_visitor()` — 방문자 UPSERT (ON CONFLICT) |
| **RPC** | `cleanup_stale_visitors()` — 5분 초과 비활성 처리 |

### 프론트엔드 신규 파일

| 파일 | 설명 | 라인 |
|------|------|------|
| `src/hooks/useIoTRealtimeStatus.ts` | Realtime 구독 훅 | 159 |
| `src/features/insights/components/IoTLiveWidget.tsx` | 실시간 방문자 위젯 | 200 |
| `src/features/settings/components/IoTStatusPanel.tsx` | Pi 디바이스 상태 패널 | 236 |

### 프론트엔드 수정 파일

| 파일 | 변경 |
|------|------|
| `src/features/insights/InsightHubPage.tsx` | IoTLiveWidget 추가 (DataQualityBanner 옆 그리드) |
| `src/features/settings/SettingsPage.tsx` | IoT 탭 추가 (Radio 아이콘, IoTStatusPanel) |

### useIoTRealtimeStatus 훅

```typescript
useIoTRealtimeStatus(storeId) → {
  visitors: LiveVisitor[],   // 실시간 방문자 리스트
  activeCount: number,       // 활성 방문자 수
  isConnected: boolean,      // Realtime 연결 상태
  lastUpdate: Date | null    // 마지막 업데이트 시간
}
```

- postgres_changes 이벤트 구독 (INSERT/UPDATE/DELETE)
- 테이블 미존재 시 graceful degradation (warn 로깅)
- 컴포넌트 언마운트 시 자동 cleanup

### IoTLiveWidget (InsightHub)

```
┌─────────────────────────┐
│ 실시간 방문자  ● 연결됨   │
│                         │
│     42명               │
│                         │
│ NS001 메인 입구    12명  │
│ NS005 의류 존      8명  │
│ NS012 계산대       6명  │
│ ...                     │
│ 마지막 업데이트: 12:30:45 │
└─────────────────────────┘
```

### IoTStatusPanel (Settings > IoT 탭)

```
┌────────────────────────────────────────────┐
│ IoT 디바이스 현황                            │
│                                            │
│ Pi ID    상태      구역            마지막     │
│ pi5     ● 대기 중   NS001-NS003   -         │
│ pi7     ● 대기 중   NS004-NS006   -         │
│ ...                                        │
│                                            │
│ 총 8대 | 모니터링 19개 존 | 연결 대기 중      │
└────────────────────────────────────────────┘
```

---

## 5. neuralsense_live_state 테이블 스키마

```sql
CREATE TABLE neuralsense_live_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  hashed_mac TEXT NOT NULL,
  current_zone_id UUID,
  position JSONB DEFAULT '{}',
  rssi_readings JSONB DEFAULT '{}',
  confidence NUMERIC DEFAULT 0,
  session_id TEXT,
  status TEXT DEFAULT 'browsing',  -- entering/browsing/purchasing/leaving/exited
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: 매장당 방문자(hashed_mac) 1개 활성 레코드
CREATE UNIQUE INDEX ... ON (store_id, hashed_mac) WHERE active = true;
```

---

## 6. 검증 결과

| 검증 | 결과 |
|------|------|
| `pnpm type-check` (website) | 통과 (0 errors) |
| `pnpm build` (website) | 통과 (20.01s, 5717 modules) |
| DB 마이그레이션 | 성공 (neuraltwin-sungshin 브랜치) |
| Realtime 활성화 | 성공 (supabase_realtime publication) |

---

## 7. 전체 진행 상태

| Phase | 내용 | 커밋 | 상태 |
|-------|------|------|------|
| Phase 0 | 마이그레이션 인프라 | `703fb640` ~ `eef9e467` | **완료** |
| Phase 1 | 채팅 랜딩 + 인증 플로우 | `0b565cf0` | **완료** |
| Phase 2 | 디자인 통합 + DashboardLayout | `e8a214c3` | **완료** |
| **Phase 3** | **AI 챗봇 통합 + IoT 실시간** | **`69277138`** | **완료** |
| Phase 4 | AI 고도화 + Function Calling | — | 대기 |
| Phase 5 | i18n + SEO + QA | — | 대기 |

---

## 8. Phase 4 선행 조건

| 항목 | 상태 | 설명 |
|------|------|------|
| AI 모델 라우팅 | CEO 결정 필요 | Flash+Pro 이원화 vs Pro 단일 |
| Function Calling | CEO 결정 필요 | 차트 생성 먼저 vs 시뮬레이션 실행 먼저 |
| IoT MAC 해싱 프로덕션 | T1 작업 필요 | Python uploader에서 upsert_live_visitor RPC 호출 |
| 온보딩 투어 | CEO 결정 필요 | react-joyride vs 자체 구현 |

---

## 9. 파일 트리 (Phase 3 변경)

```
apps/website/src/
├── components/assistant/          ← P3-2 신규
│   ├── AssistantPanel.tsx         (174 lines)
│   ├── useAssistant.ts            (247 lines)
│   └── index.ts                   (2 lines)
├── hooks/
│   └── useIoTRealtimeStatus.ts    ← P3-3 신규 (159 lines)
├── features/
│   ├── insights/
│   │   ├── InsightHubPage.tsx     ← P3-3 수정
│   │   └── components/
│   │       └── IoTLiveWidget.tsx   ← P3-3 신규 (200 lines)
│   └── settings/
│       ├── SettingsPage.tsx        ← P3-3 수정
│       └── components/
│           └── IoTStatusPanel.tsx  ← P3-3 신규 (236 lines)
├── layouts/
│   └── DashboardLayout.tsx        ← P3-2 수정
└── pages/
    └── Auth.tsx                    ← P3-1 수정

supabase/supabase/migrations/
└── 20260227120000_create_neuralsense_live_state.sql  ← P3-3 신규

docs/reports/
├── PHASE1_COMPLETION.md           ← 리포트
├── PHASE2_COMPLETION.md           ← 리포트
└── PHASE3_COMPLETION.md           ← 리포트 (이 파일)
```
