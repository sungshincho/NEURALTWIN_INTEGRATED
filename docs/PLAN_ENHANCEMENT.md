# NEURALTWIN 통합 플랫폼 고도화 기획안

> **Version**: 1.0 | 2026-02-27
> **작성**: PM 리드 에이전트
> **승인 대기**: CEO 성신
> **참조**: `docs/PLAN_UNIFIED_PLATFORM.md`, `docs/design/DESIGN_SYSTEM.md`

---

## 0. 현재 완료 상태

### 통합 마이그레이션 (완료)
| 커밋 | 내용 |
|------|------|
| `703fb640` | Phase 0 — 디자인 토큰, MAC 해싱, ETL cron, EF 감사 |
| `077d1c10` | 5개 alias Edge Functions 삭제 |
| `85a1a784` | Phase 1 — AuthProvider, 라우팅, 디자인 토큰 |
| `c5c0d925` | @neuraltwin/ui Tier 1 + 코드 스플리팅 + Zustand |
| `54fc9f03` | OS Dashboard 라우트 스캐폴드 + Provider 인프라 |
| `79d7eae0` | ROI Measurement 페이지 마이그레이션 (20 files) |
| `5cd8aab7` | InsightHub 페이지 마이그레이션 (41 files) |
| `370d88cc` | Settings + data-control + ontology 마이그레이션 (42 files) |
| `eef9e467` | Studio + Simulation 마이그레이션 (217 files) + shared-3d + 코드 스플리팅 |
| `0b565cf0` | **Phase 1 — 채팅 랜딩 + 인증 플로우 정상화** |

### 유저 플로우 (Phase 1 완료)
```
사용자 접속 (/) → 채팅 랜딩 (AI 리테일 어시스턴트)
  → 채팅 활용 (게스트 10턴)
  → 로그인/회원가입 (선택)
  → OS 대시보드 unlock (/os/*)
```

---

## 1. UI/UX 고도화

### 1-1. 채팅 랜딩 페이지 강화

| 항목 | 현재 | 개선 |
|------|------|------|
| **프리셋 카드** | 4개 텍스트 카드 | 아이콘 + 미니 애니메이션 + 난이도 태그 추가 |
| **온보딩 가이드** | 없음 | 첫 방문 시 "이렇게 시작하세요" 3스텝 오버레이 |
| **스크롤 섹션** | Footer만 존재 | 채팅 아래 간결한 가치 제안 (3 카드 + 비디오 루프) |
| **SEO** | 없음 | meta tags, OG tags, structured data |
| **성능 지표** | 없음 | Web Vitals 모니터링 (LCP < 2.5s, CLS < 0.1) |

### 1-2. 채팅 UX 고도화

| 항목 | 현재 | 개선 |
|------|------|------|
| **스트리밍** | 모바일 SSE 비활성 (JSON fallback) | 모바일도 SSE 활성화 (네트워크 상태 기반) |
| **3D 시각화** | 채팅 내 inline Three.js | 존 클릭 → 상세 분석 패널 (사이드 슬라이드) |
| **대화 히스토리** | 세션 기반 (새로고침 시 초기화) | 로그인 유저: Supabase에 히스토리 저장 + 불러오기 |
| **파일 첨부** | 기본 기능 존재 | 매장 도면(이미지) → AI 분석 → 3D 존 자동 생성 |
| **멀티모달 응답** | 텍스트 + 3D 시각화 | 차트 인라인 렌더링 (recharts), 테이블 포맷팅 |
| **음성 입력** | 없음 | Web Speech API 연동 (ko/en/ja) |
| **내보내기** | MD/PDF/DOCX | + 이메일 전송, Slack 공유 |

### 1-3. OS 대시보드 디자인 통합

**원칙**: 채팅 페이지 다크 테마 (`#0a0a0a` + `#00d4aa` 액센트)를 OS 기본 언어로

| 항목 | 현재 | 개선 |
|------|------|------|
| **다크모드** | 라이트 기본 | 다크 기본 (토글 유지) |
| **액센트 컬러** | 모노크롬 (흑/백) | `#00d4aa` 틸 액센트 도입 (활성 메뉴, 버튼, 링크) |
| **폰트** | Pretendard/Inter (일관) | 유지 + 코드 블록만 Fira Code |
| **GlassCard** | 3곳 중복 인라인 | 단일 `components/ui/glass-card.tsx` |
| **useDarkMode** | 모든 컴포넌트 복붙 | `hooks/useDarkMode.ts` 공유 훅 |
| **Toast** | useToast vs sonner 혼용 | `sonner` 단일화 |

### 1-4. DashboardLayout 고도화

```
현재:
┌─ Sidebar ─┐┌─ Content ─────────────────────┐
│ Nav 4개    ││ (패딩 없음, 페이지별 자체 처리)  │
└────────────┘└───────────────────────────────┘

개선:
┌─ Sidebar ──────┐┌─ Top Header ─────────────────┐
│ Logo            ││ [매장: 강남점 ▼] [🔔] [👤 ▼] │
│ ● 인사이트 허브  │├───────────────────────────────┤
│ ○ 스튜디오      ││                               │
│ ○ ROI          ││  일관된 p-6 패딩 Content       │
│ ○ 설정         ││                               │
│ ────────       ││                               │
│ 💬 AI 어시스턴트 ││                               │
│ ────────       ││                               │
│ [🌙] [User]    ││                               │
└────────────────┘└───────────────────────────────┘

모바일 (≤768px):
┌─ Top Bar: [≡] [매장명] [👤] ─┐
│                               │
│  Content (full width)         │
│                               │
├─ Bottom Tab Bar ──────────────┤
│ [📊] [🎨] [💰] [⚙️] [💬]    │
└───────────────────────────────┘
```

**추가 사항:**
- 매장 선택 드롭다운 (SelectedStoreProvider 활용)
- 알림 벨 아이콘 (향후 실시간 알림 연동)
- AI 어시스턴트 미니 패널 (사이드바 하단, 채팅↔OS 연동)
- 모바일: 하단 5-탭 네비게이션 (인사이트, 스튜디오, ROI, 설정, AI)
- 테마 토글 아이콘 (사이드바 하단)

### 1-5. 반응형 & 접근성

| 항목 | 개선 |
|------|------|
| Studio 모바일 | "데스크톱에서 이용해주세요" 안내 + 읽기 전용 3D 뷰 |
| 키보드 단축키 | Studio: `Ctrl+S` 저장, `Space` 시뮬레이션, `Esc` 패널 닫기 |
| ARIA | 모든 인터랙티브 요소에 ARIA 라벨 |
| 색상 대비 | WCAG AA 준수 (특히 `#00d4aa` on `#0a0a0a` 검증) |
| 포커스 관리 | Tab 순서, 모달 포커스 트랩 |

---

## 2. 유저 플로우 고도화

### 2-1. 전환 퍼널 최적화

```
Stage 1: 방문 (/)
  └── 채팅 프리셋 카드 클릭 or 직접 입력

Stage 2: 체험 (채팅 활용)
  ├── 3D 매장 시각화 체험
  ├── AI 인사이트 프리뷰 (채팅 내 차트/데이터)
  └── 5턴 시점: 소프트 CTA "더 많은 기능이 있어요" 배너

Stage 3: 전환 (로그인)
  ├── 10턴 제한 모달: "로그인하면 무제한 + 대시보드"
  ├── 채팅 내 OS 기능 티저: "대시보드에서 자세히 보기 →"
  └── AI가 자연스럽게 유도: "더 깊은 분석은 대시보드에서..."

Stage 4: 활성화 (OS 대시보드)
  ├── 첫 로그인 온보딩 투어 (3스텝)
  │   1. 매장 등록 (도면 업로드 가이드)
  │   2. 대시보드 소개 (인사이트 허브 하이라이트)
  │   3. Studio 안내 (3D 디지털트윈 맛보기)
  ├── 비회원 채팅 → 회원 계정 자동 인계 (세션 머지)
  └── OS AI 어시스턴트 (사이드바 패널) 안내

Stage 5: 리텐션
  ├── 주간 인사이트 요약 이메일
  ├── 실시간 이상 탐지 알림 (IoT 연동 후)
  └── AI 최적화 제안 푸시
```

### 2-2. 세션 인계 (비회원→회원)

`PLAN_UNIFIED_PLATFORM.md` 시나리오 ③ 구현:

```
비회원 채팅 (session_id만 저장)
  → 로그인
  → 기존 session_id의 대화를 user_id에 연결
  → OS 대시보드에서 이전 채팅 컨텍스트 자동 참조
```

**기술 구현:**
- 채팅 시 `localStorage`에 `sessionId` 저장 (현재 작동 중)
- 로그인 후 `retail-chatbot` EF에 `merge-session` 요청
- `chat_messages` 테이블의 `user_id` = NULL인 레코드를 현재 유저로 업데이트
- OS AI 어시스턴트가 웹 채팅 히스토리를 Context Bridge로 참조

### 2-3. 온보딩 플로우 상세

```
첫 로그인 → 매장 등록 여부 확인
  ├── 매장 있음 → OS 대시보드 바로 진입
  └── 매장 없음 → 온보딩 모달
        Step 1: "매장 정보를 등록하세요"
          - 매장명, 주소, 면적
          - 도면 업로드 (옵션)
        Step 2: "대시보드를 소개합니다"
          - 하이라이트 투어 (react-joyride)
        Step 3: "AI 스튜디오를 만나보세요"
          - Studio 데모 장면 자동 로드
```

---

## 3. 기능 고도화

### 3-1. 채팅 AI 고도화

| 항목 | 현재 | 목표 |
|------|------|------|
| **모델** | Gemini 2.5 Flash (기본) | Gemini 2.5 Pro (복잡한 분석), Flash (빠른 응답) 자동 라우팅 |
| **컨텍스트** | 14개 토픽 모듈 | 20+ 모듈 + 유저별 매장 데이터 주입 |
| **메모리** | 세션 내 히스토리만 | 장기 메모리 (대화 요약 → 벡터 임베딩 → RAG) |
| **도구 호출** | 없음 | Function calling: 차트 생성, 데이터 조회, 시뮬레이션 실행 |
| **3D 연동** | vizDirective (존 하이라이트) | 매장 레이아웃 실시간 변경 제안 → 3D 프리뷰 |

#### AI 모델 자동 라우팅

```
사용자 질문 분류 (topicRouter)
  ├── 단순 정보 (FAQ, 정의) → Gemini 2.5 Flash (빠르고 저렴)
  ├── 분석 요청 (인사이트, 비교) → Gemini 2.5 Pro (정확)
  ├── 시뮬레이션 (레이아웃, 최적화) → Gemini 2.5 Pro + Function Call
  └── 일반 대화 (인사, 잡담) → Gemini 2.5 Flash
```

#### Function Calling (채팅 → OS 기능 직접 실행)

```typescript
// AI가 판단하여 자동 호출
const tools = [
  {
    name: "query_store_data",
    description: "매장 실시간 데이터 조회 (트래픽, 전환율, 매출)",
    parameters: { store_id, metric, date_range }
  },
  {
    name: "generate_chart",
    description: "데이터 시각화 차트 생성",
    parameters: { chart_type, data, title }
  },
  {
    name: "run_simulation",
    description: "레이아웃 시뮬레이션 실행",
    parameters: { store_id, scenario, parameters }
  },
  {
    name: "compare_layouts",
    description: "As-Is vs To-Be 레이아웃 비교",
    parameters: { store_id, layout_a, layout_b }
  },
  {
    name: "get_optimization_suggestions",
    description: "AI 최적화 제안 생성",
    parameters: { store_id, focus_area }
  }
];
```

### 3-2. OS AI 어시스턴트 고도화

| 항목 | 현재 (설계) | 목표 |
|------|-------------|------|
| **위치** | 사이드 패널 (미구현) | 사이드바 하단 미니 패널 + 확장 모드 |
| **모델** | Gemini 2.5 Flash | Flash (빠른 액션) + Pro (복잡 분석) |
| **액션** | 22개 디스패치 타입 | 30+ 타입 + 페이지 컨텍스트 인식 |
| **연동** | 독립 | 웹 채팅 히스토리 Context Bridge 참조 |

#### 페이지 컨텍스트 인식

```
사용자가 InsightHub에 있을 때:
  AI: "현재 보고 계신 인사이트에 대해 설명해드릴까요?"
  → 현재 탭, 필터, 선택된 데이터를 컨텍스트로 전달

사용자가 Studio에 있을 때:
  AI: "현재 씬의 가구 배치를 최적화해드릴까요?"
  → 현재 sceneStore 상태를 컨텍스트로 전달
  → 시뮬레이션 결과를 자동 해석
```

### 3-3. InsightHub 고도화

| 항목 | 현재 | 목표 |
|------|------|------|
| **2D 히트맵** | 없음 | 매장 평면도 위 존별 트래픽 히트맵 (P0 — `PLAN_UNIFIED_PLATFORM.md`) |
| **멀티매장 비교** | 없음 | 매장 간 KPI 비교 대시보드 (P0) |
| **방문 경로** | 없음 | 고객 이동 경로 시각화 (P1) |
| **예측 분석** | 기본 | 시계열 예측 + 이상 탐지 알림 |
| **실시간** | 없음 | IoT 연동 후 실시간 존 트래픽 표시 |

#### 신규 테이블 (PLAN에서 식별)

```sql
prediction_records     -- AI 예측 기록 (매출, 트래픽)
shift_schedules       -- 직원 교대 스케줄
hq_guidelines         -- 본사 가이드라인
hq_notifications      -- 본사→매장 알림
customer_nps          -- 고객 만족도 설문
```

### 3-4. Studio 고도화

| 항목 | 현재 | 목표 |
|------|------|------|
| **모델 라이브러리** | 수동 업로드 | AI 자동 매칭 (가구 카탈로그 → 3D 모델) |
| **실시간 시뮬레이션** | 버튼 클릭 실행 | 실시간 고객 흐름 시뮬레이션 (IoT 데이터 반영) |
| **A/B 테스트** | As-Is/To-Be 비교 | 3개 이상 시나리오 동시 비교 |
| **협업** | 단일 사용자 | 실시간 멀티유저 편집 (Supabase Realtime) |
| **내보내기** | 없음 | 3D 씬 → PDF 보고서, 이미지 캡처, 영상 녹화 |

### 3-5. IoT 실시간 브릿지

`PLAN_IOT_SUPABASE_PIPELINE.md` 참조:

```
NeuralSense Pi (9대)
  → MQTT (Tailscale VPN)
  → Supabase Bridge (neuralsense_live_state 테이블)
  → Realtime Subscription
  → OS Dashboard 실시간 표시 (<2초 지연)
```

| 항목 | 현재 | 목표 |
|------|------|------|
| **데이터 지연** | 30초+ (배치) | <2초 (Realtime) |
| **MAC 해싱** | 미적용 (GDPR 위험) | SHA-256 해싱 즉시 적용 |
| **L2→L3 집계** | 미연결 | GitHub Actions cron (매일 2am KST) |
| **Settings IoT 탭** | 없음 | Pi 상태 모니터링, 존 그리드 설정, 캘리브레이션 |

---

## 4. AI 모델 고도화 로드맵

### 4-1. 현재 AI 아키텍처

```
supabase/functions/_shared/ai/gateway.ts
├── chatCompletion()         — Gemini 2.5 Flash (기본)
├── chatCompletionStream()   — SSE 스트리밍
└── generateEmbedding()      — 벡터 임베딩

Provider: Google AI (GOOGLE_AI_API_KEY)
Fallback: OpenAI (OPENAI_API_KEY)
```

### 4-2. 단기 (1-2주)

| 항목 | 상세 |
|------|------|
| **모델 업그레이드** | Gemini 2.5 Flash → **Gemini 2.5 Pro** (복잡 분석용), Flash 유지 (빠른 응답) |
| **토픽 라우터 개선** | `topicRouter.ts` confidence threshold 조정 → 저확신 시 Pro 모델 사용 |
| **토큰 최적화** | `retailKnowledge.ts` 12개 모듈 → 필요한 모듈만 주입 (현재 방식 유지, 임계치 조정) |
| **응답 품질 모니터링** | AI 응답에 대한 유저 피드백 (👍/👎) 수집 → `chat_feedback` 테이블 |

### 4-3. 중기 (3-4주)

| 항목 | 상세 |
|------|------|
| **RAG 파이프라인** | 매장별 데이터 → 벡터 임베딩 → pgvector 검색 → 컨텍스트 주입 |
| **Function Calling** | Gemini Function Calling API로 도구 실행 (차트, 시뮬레이션, 데이터 조회) |
| **대화 요약** | 장기 대화 시 이전 턴 요약 → 토큰 절약 + 컨텍스트 유지 |
| **멀티모달 입력** | 매장 사진 → Gemini Vision → 레이아웃 분석 → 개선 제안 |
| **A/B 테스팅** | Pro vs Flash 응답 품질 비교 → 자동 라우팅 최적화 |

### 4-4. 장기 (5-8주)

| 항목 | 상세 |
|------|------|
| **에이전트 워크플로우** | 복잡한 태스크를 AI가 자동 분해 → 순차 실행 (시뮬레이션 → 분석 → 보고서) |
| **예측 모델** | 트래픽 예측, 매출 예측, 이상 탐지 (시계열 + Gemini 해석) |
| **자동 보고서** | 주간/월간 인사이트 보고서 자동 생성 (PDF) |
| **음성 인터페이스** | Web Speech API → STT → AI → TTS (한국어 최적화) |
| **경쟁사 벤치마크** | 공개 데이터 기반 동종 업계 비교 분석 |

### 4-5. AI 모델 선택 기준

```
요청 유형별 라우팅:
┌────────────────┬──────────────┬─────────┬────────────┐
│ 유형            │ 모델          │ 지연    │ 비용/1K토큰 │
├────────────────┼──────────────┼─────────┼────────────┤
│ FAQ/단순 질문    │ Flash 2.5    │ <1s     │ $0.001     │
│ 도메인 분석     │ Pro 2.5      │ 2-3s    │ $0.01      │
│ 시뮬레이션/최적화│ Pro 2.5 + FC │ 3-5s    │ $0.015     │
│ 멀티모달 (이미지)│ Pro 2.5      │ 3-5s    │ $0.02      │
│ 임베딩          │ text-embed   │ <0.5s   │ $0.0001    │
└────────────────┴──────────────┴─────────┴────────────┘
```

---

## 5. i18n 완성

| 항목 | 현재 | 목표 |
|------|------|------|
| 지원 언어 | ko, en (ko 기본) | ko, en, ja |
| 랜딩/채팅 | 한국어 하드코딩 | i18n 키 적용 |
| OS 대시보드 | 한국어 하드코딩 | i18n 키 적용 |
| 언어 토글 | 주석 처리됨 | 활성화 (Header + DashboardLayout) |
| AI 응답 | 한국어 고정 | 유저 언어 설정에 따라 시스템 프롬프트 언어 전환 |

---

## 6. 실행 로드맵

### Phase 2: 디자인 통합 + DashboardLayout (1주)
- 디자인 토큰 통합 (`#00d4aa` 액센트, 다크 기본)
- DashboardLayout 헤더바 + 매장 선택 + 모바일 탭바
- 공유 컴포넌트 정리 (GlassCard, useDarkMode, Toast)
- **담당**: T6 (디자인 스펙) → T4 (구현)

### Phase 3: AI 챗봇 통합 + IoT (2주)
- 세션 인계 (비회원→회원)
- OS AI 어시스턴트 사이드 패널
- IoT 실시간 브릿지 (MAC 해싱 포함)
- **담당**: T4 (프론트), T2 (백엔드), T1 (IoT)

### Phase 4: AI 고도화 + 기능 확장 (2주)
- AI 모델 자동 라우팅 (Flash/Pro)
- Function Calling 도구 연동
- 2D 히트맵 + 멀티매장 비교
- **담당**: T4, T2, T5 (도메인)

### Phase 5: i18n + SEO + QA (1주)
- ja 번역 추가, 언어 토글 활성화
- SEO 최적화 (채팅 랜딩 기준)
- E2E 테스트 (Playwright)
- **담당**: T4, T5

---

## 7. 성공 지표

| 지표 | 현재 | Phase 2 후 | Phase 4 후 |
|------|------|-----------|-----------|
| 도메인 수 | 2 | **1** | 1 |
| 로그인 횟수/유저 | 2 | **1** | 1 |
| 코드 중복 | ~30% | <10% | **<5%** |
| 채팅→로그인 전환율 | 측정 불가 | **측정 시작** | >15% |
| 채팅 응답 품질 (👍율) | 측정 불가 | 측정 시작 | **>80%** |
| 초기 로드 (LCP) | ~3s | <2.5s | **<2s** |
| IoT 데이터 지연 | 30s+ | <2s | **<2s** |
| 지원 언어 | 2 | 2 | **3** (ko/en/ja) |

---

## 8. CEO 결정 사항

| # | 항목 | 옵션 |
|---|------|------|
| 1 | Phase 2 즉시 시작? | A: 즉시 / B: 리뷰 후 |
| 2 | AI 모델 라우팅 | A: Flash+Pro 이원화 / B: Pro 단일 |
| 3 | Function Calling 우선순위 | A: 채팅→차트 생성 먼저 / B: 채팅→시뮬레이션 실행 먼저 |
| 4 | IoT MAC 해싱 | A: 즉시 (GDPR 리스크) / B: Phase 3에서 |
| 5 | ja 번역 | A: Phase 5에서 / B: 후순위 |
| 6 | 온보딩 투어 라이브러리 | A: react-joyride / B: 자체 구현 |
