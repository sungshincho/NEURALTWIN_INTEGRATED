# WORK_GUIDE_D — Member D (DT Lead / OS Dashboard)

> **역할**: Digital Twin Lead, OS 매장 관리 대시보드
> **Claude 프로젝트**: `neuraltwin-os`
> **버전**: 1.0 | 2026-02-25

---

## 1. 역할 요약 (Role Summary)

| 항목 | 내용 |
|------|------|
| **포지션** | DT Lead, OS Dashboard Frontend |
| **핵심 책임** | OS Dashboard import 마이그레이션, supabase/ 중복 EF 정리, 3D 디지털 트윈 고도화, Zod 버전 결정, UI Kit 소비 |
| **코드 소유 경로** | `apps/os-dashboard/` 전체 |
| **EF 소유** | `neuraltwin-assistant` (34파일), `advanced-ai-inference`, `aggregate-all-kpis`, `aggregate-dashboard-kpis`, `analyze-3d-model`, `auto-process-3d-models`, `generate-optimization`, `run-simulation` 및 os-dashboard `supabase/functions/` 내 36개 EF |
| **의사결정 권한** | 3D 렌더링 파이프라인, OS UX 설계, 대시보드 차트/위젯 구조, Zustand 스토어 설계 |

---

## 2. 모노레포 컨텍스트 (Monorepo Context)

### D의 코드 위치
```
neuraltwin/
├── apps/
│   └── os-dashboard/                 # ← D 전체 소유
│       ├── src/
│       │   ├── components/
│       │   │   ├── chat/             # 챗봇 UI (3파일)
│       │   │   ├── common/           # 공통 컴포넌트
│       │   │   ├── dashboard/        # 대시보드 위젯
│       │   │   ├── goals/            # 목표 위젯
│       │   │   ├── notifications/    # 알림 시스템
│       │   │   └── ui/               # shadcn/ui (49개) ← W5 packages/ui 소비
│       │   ├── features/
│       │   │   ├── assistant/        # AI 어시스턴트 Provider
│       │   │   ├── data-control/     # 데이터 컨트롤타워
│       │   │   ├── data-management/  # ETL & 온톨로지
│       │   │   ├── insights/         # 인사이트 탭 (6개)
│       │   │   ├── onboarding/       # 온보딩 플로우
│       │   │   ├── roi/              # ROI 측정
│       │   │   ├── settings/         # 설정
│       │   │   ├── simulation/       # 시뮬레이션 엔진
│       │   │   └── studio/           # 3D 디지털 트윈 스튜디오 ★
│       │   ├── hooks/                # 커스텀 React 훅 (50+)
│       │   ├── integrations/
│       │   │   └── supabase/
│       │   │       ├── client.ts     # ⚠️ 하드코딩 키 포함
│       │   │       └── types.ts      # DB 타입 (마이그레이션 대상)
│       │   ├── store/                # Zustand 스토어 (3개)
│       │   ├── stores/               # Zustand 스토어 (3개) ← 통합 필요
│       │   ├── services/             # 비즈니스 로직
│       │   ├── types/                # TypeScript 타입
│       │   └── utils/                # 유틸리티
│       ├── supabase/
│       │   ├── functions/            # 36개 EF ← 중복 제거 대상
│       │   │   ├── _shared/          # 13개 공유 모듈
│       │   │   ├── neuraltwin-assistant/  # 34파일 (가장 복잡)
│       │   │   ├── generate-optimization/ # 11파일
│       │   │   ├── retail-chatbot/   # 26파일
│       │   │   └── ... (33개 추가)
│       │   ├── migrations/           # DB 마이그레이션 (40+)
│       │   └── seed/                 # 시드 데이터
│       ├── public/
│       │   └── lighting-presets/     # 3개 조명 JSON
│       ├── package.json
│       ├── vite.config.ts            # port 8080, React SWC
│       ├── tailwind.config.ts
│       └── TYPE_MIGRATION_TODO.md
```

### 다른 멤버와의 의존 관계
- **A**: W1 모노레포 스캐폴딩 완료 후 import 감사 시작. Zod 버전 최종 결정 시 A 아키텍처 승인 필요. types v0.1(W2) 후 타입 마이그레이션 가능.
- **E**: E의 UI Kit 추출(W3) 완료 후 D가 OS에서 소비(W5). shadcn/ui 49개 컴포넌트 중 공유 가능 컴포넌트 조율. tailwind-preset 소비.
- **C**: W5 합류 시 supabase/ 중복 EF 정리 협업. `neuraltwin-assistant` EF prompt/config 변경 시 C와 조율. `_shared/` 통합.
- **B**: 센서 데이터 3D 시각화. IoT Broadcast → `store-tracking-{storeId}` Realtime 채널로 고객 위치 수신. `zones.csv` 존 정보 연동.

### 핵심 수치
- **소스 코드**: ~242,750 LOC (tsx 80,365 / ts 60,996 / EF ts 54,516 / SQL 45,740)
- **컴포넌트 수**: 231개 (3D 49, shadcn/ui 49, 위젯 19, 차트 12, 폼 27, 기타)
- **3D Canvas 초기화**: 11개 파일 (Canvas3D, SimulationScene, SchemaGraph3D 등)
- **파일 수**: ~743개 (src + supabase + SQL)
- **hooks**: 61 useQuery + 48 useMutation
- **Realtime 채널**: 6개 (inventory, suggestions, import-progress, stores, wifi-tracking, store-tracking)

---

## 3. 서브에이전트 팀 (Sub-Agent Team)

### 3.1 OS Dashboard Agent

**역할**: OS Dashboard 프론트엔드 코드 관리, import 마이그레이션, 상태 관리, 컴포넌트 리팩토링

```markdown
# CLAUDE.md — OS Dashboard Agent (neuraltwin-os)

## 역할
OS Dashboard 프론트엔드 코드를 관리하는 에이전트입니다.

## 핵심 규칙
1. `apps/os-dashboard/src/` 내 파일만 수정합니다.
2. `.env` 파일을 절대 수정하지 않습니다.
3. 모든 변경 후 `pnpm type-check` → `pnpm lint` → `pnpm build` 통과 확인.
4. shadcn/ui 컴포넌트(`src/components/ui/`)는 직접 수정하지 않고 packages/ui 소비로 전환.
5. Zustand 스토어 변경 시 `subscribeWithSelector` 미들웨어 사용 여부 확인.
6. `store/` vs `stores/` 디렉토리 통합 시 import 경로 전수 조사 필수.

## 담당 파일
- `src/features/` — 8개 feature 모듈
- `src/hooks/` — 50+ 커스텀 훅
- `src/components/` — 채팅, 공통, 대시보드, 목표, 알림 컴포넌트
- `src/store/` + `src/stores/` — Zustand 6개 스토어
- `src/services/` — 비즈니스 로직 서비스
- `src/integrations/supabase/client.ts` — 환경변수 마이그레이션 대상

## 기술 스택
- React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 (SWC)
- Tailwind CSS 3.4.17, shadcn/ui (Radix UI 기반)
- Zustand 5.0.9, TanStack React Query 5.83.0
- React Hook Form 7.61.1 + Zod 4.1.12
- Recharts 2.15.4, Framer Motion 12.23.25

## Import 규칙
- `@/` → `src/` 절대경로 (vite.config.ts alias)
- `@neuraltwin/types` — DB/API 타입 (마이그레이션 후)
- `@neuraltwin/shared` — CORS, 환경변수 유틸 (EF에서만)
- `@neuraltwin/ui` — 공유 UI 컴포넌트 (W5 이후)

## 검증 명령어
```bash
cd apps/os-dashboard && pnpm type-check   # 타입 검사
cd apps/os-dashboard && pnpm lint          # 린트
cd apps/os-dashboard && pnpm build         # 프로덕션 빌드
```

## 에스컬레이션
30분 이상 블로킹 시 → D에 보고
```

### 3.2 3D / Three.js Agent

**역할**: 3D 디지털 트윈 스튜디오, 시뮬레이션 3D, R3F 컴포넌트, 후처리 이펙트 관리

```markdown
# CLAUDE.md — 3D / Three.js Agent (neuraltwin-os)

## 역할
Three.js / React Three Fiber 기반 3D 디지털 트윈 시각화를 담당하는 에이전트입니다.

## 핵심 규칙
1. Three.js 0.160.1, @react-three/fiber 8.18.0, @react-three/drei 9.122.0 버전 고정.
2. 커스텀 GLSL 셰이더 작성 금지 — 내장 Material + PostProcessing으로 해결.
3. 새 Canvas 초기화 금지 — 기존 11개 Canvas 엔트리포인트만 사용.
4. GLB 모델은 Supabase Storage (`3d-models/` 버킷)에서만 로드. 로컬 저장 금지.
5. `dpr={1}`, `powerPreference: 'high-performance'` 성능 설정 유지.
6. 모든 3D 컴포넌트는 `<Suspense>` 경계 내에 배치.
7. Realtime Broadcast `tracking-update` → 칼만 필터 → 3D 좌표 변환 파이프라인 수정 시 D 승인 필요.

## 담당 파일
- `src/features/studio/` — Studio 코어, 모델, 오버레이, 패널, 탭, 서비스, 훅
  - `core/Canvas3D.tsx` — 메인 3D 캔버스
  - `core/PostProcessing.tsx` — 후처리 이펙트
  - `core/ModelLoader.tsx` — GLTF 로딩
  - `overlays/` — 16개 오버레이 (히트맵, 고객흐름, 혼잡도, 직원배치 등)
  - `stores/sceneStore.ts` — 3D 씬 상태
  - `stores/simulationStore.ts` — 3D 실시간 시뮬레이션 상태
- `src/features/simulation/components/digital-twin/` — 시뮬레이션 3D
  - `Store3DViewer.tsx`, `SceneViewer.tsx`, `Model3DPreview.tsx`
  - `overlays/` — 8개 시뮬레이션 오버레이
- `src/features/data-management/ontology/components/` — 온톨로지 3D 그래프
  - `SchemaGraph3D.tsx`, `OntologyGraph3D.tsx`
- `public/lighting-presets/` — 3개 조명 프리셋 JSON

## 3D 에셋 관리
- GLB 파일: Supabase Storage `3d-models/{userId}/{storeId}/`
- 조명 프리셋: `public/lighting-presets/` (cool-modern, dramatic-spot, warm-retail)
- Baked Material: `bakedMaterialUtils.ts` (감지 패턴: bottom_plate, space_a, _baked)
- 텍스처: Day/Night 시스템 (`useSpaceTextures.ts`)

## 성능 기준
- Canvas3D: `dpr={1}`, `alpha:false`, `stencil:false`
- PostProcessing: `multisampling={2}` (스튜디오), `multisampling={4}` (시뮬레이션)
- Bloom: intensity=0.5, luminanceThreshold=0.9
- N8AO: intensity=1.5, aoRadius=0.5, quality='medium'

## 검증 방법
- `pnpm build` 통과 (Three.js 트리셰이킹 확인)
- 브라우저 콘솔에 WebGL 경고/에러 없음
- Chrome DevTools Performance 탭에서 60fps 유지 확인

## 에스컬레이션
렌더링 성능 이슈(30fps 미만 지속) → D에 보고
```

### 3.3 OS Chatbot / AI Agent

**역할**: neuraltwin-assistant EF, AI 추론 EF, 챗봇 UI, Lovable AI Gateway 연동

```markdown
# CLAUDE.md — OS Chatbot / AI Agent (neuraltwin-os)

## 역할
OS Dashboard AI 어시스턴트(neuraltwin-assistant) 및 AI 추론 Edge Functions를 담당합니다.

## 핵심 규칙
1. AI API 호출은 반드시 Lovable AI Gateway 경유 (`ai.gateway.lovable.dev/v1/chat/completions`).
2. 직접 Gemini/OpenAI API 호출 절대 금지.
3. API Key 하드코딩 금지 — `Deno.env.get('LOVABLE_API_KEY')` 사용.
4. neuraltwin-assistant 프롬프트 수정 시 `ai-batch-qa-test` 배치 테스트로 검증.
5. 스트리밍 응답 사용 시 SSE 형식 준수 (`text/event-stream`).
6. `_shared/rateLimiter.ts` 분당 요청 제한 유지.
7. 매장 데이터 조회 시 반드시 `org_id` + `store_id` 필터 확인 (RLS 보완).

## 담당 파일
- `supabase/functions/neuraltwin-assistant/` — 34파일, 7개 하위 디렉토리
  - `actions/` — 쿼리 액션 (queryActions/)
  - `config/` — 설정
  - `constants/` — 상수
  - `intent/` — 사용자 의도 분류
  - `response/` — 응답 생성
  - `utils/` — 유틸리티
- `supabase/functions/advanced-ai-inference/index.ts` — 4,972 LOC
- `supabase/functions/run-simulation/index.ts` — 1,561 LOC
- `supabase/functions/generate-optimization/` — 11파일 (VMD, 데이터, 피드백, 예측)
- `supabase/functions/_shared/` — AI 관련 모듈
  - `aiResponseLogger.ts` — AI 응답 로깅
  - `chatLogger.ts` — 대화 CRUD
  - `chatEventLogger.ts` — 이벤트 추적
  - `rateLimiter.ts` — 요청 제한
  - `safeJsonParse.ts` — 안전한 JSON 파싱
  - `calculations/` — ROI, 트래픽, 검증
  - `optimization/` — 교차 최적화
  - `persona/` — 매장 페르소나
  - `vmd/` — VMD 룰셋
- `src/components/chat/` — 프론트엔드 챗봇 UI
- `src/features/assistant/` — AssistantProvider, hooks

## AI Gateway 호출 패턴
```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',  // 또는 'gemini-2.5-pro' (chatbot만)
    messages: [...],
    temperature: 0.7,
    // stream: true  // 스트리밍 시
  }),
});
```

## RPC 함수 의존
- `get_overview_kpis`, `get_zone_metrics`, `get_customer_segments`
- `get_product_performance`, `get_inventory_status`, `get_store_goals`
- `get_hourly_entry_counts`, `get_zones_dim_list`, `get_applied_strategies`
- `get_inventory_movements`, `get_data_control_tower_status`
- `increment_chat_message_count`

## 에스컬레이션
AI 응답 품질 저하(parse_success < 80%) → D에 보고 → A에 에스컬레이션
```

---

## 4. 8주 작업 분해 (Task Breakdown)

### Week 1 — Import 감사 & 환경변수 수정

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D1.1 | `src/integrations/supabase/client.ts` 하드코딩 키 → `import.meta.env.VITE_*` 전환 | `client.ts` 수정, `.env.example` 정비 | `pnpm build` 통과, 하드코딩 URL/키 grep 결과 0건 |
| D1.2 | `.env.example` 파일 생성/정비 (6개 변수) | `.env.example` | 모든 `VITE_*` 변수 문서화 |
| D1.3 | `src/` 전체 import 경로 감사 — `@/integrations/supabase/client` 사용 103개 파일 목록화 | `TYPE_MIGRATION_TODO.md` 업데이트 | 모든 supabase 관련 import 추적 완료 |
| D1.4 | `store/` vs `stores/` 디렉토리 통합 결정 | 통합 계획 문서 또는 실행 | 6개 Zustand 스토어 단일 디렉토리에 배치, import 경로 전수 수정, 빌드 통과 |

**Before:**
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://bdrvowacecxnraaivlhr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIs...";
```

**After:**
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}
```

### Week 2 — 타입 마이그레이션 & Zod 결정

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D2.1 | A의 `@neuraltwin/types` v0.1 확인 후 `src/integrations/supabase/types.ts` → 재export 전환 | `types.ts` 1줄 re-export | `pnpm type-check` 0 errors, 103개 파일 영향 없음 |
| D2.2 | Zod v4 유지 vs v3 다운그레이드 결정 — 호환성 분석 | Zod 버전 결정 문서 | A 최종 승인, website(v3)/os-dashboard 간 전략 확정 |
| D2.3 | `next-themes` ^0.3.0 대체 검토 — Vite 환경에서 불필요한 Next.js 의존성 | `ThemeToggle.tsx` 수정 또는 유지 결정 | next-themes 제거 시 다크/라이트 모드 정상 동작 확인 |
| D2.4 | OS Dashboard supabase/ 내 EF 인벤토리 정리 — 36개 중 통합 supabase/와 중복 식별 | 중복 EF 목록 + 제거 계획 | 중복 EF 식별 완료, C 합류 시 제거 계획 수립 |

**Zod 버전 결정 매트릭스:**

| 옵션 | 장점 | 단점 | 영향 |
|------|------|------|------|
| OS: v4 유지, Website: v3 유지 | 각 앱 독립, 변경 최소 | 공유 validation schema 불가 | `packages/types`에 zod-agnostic 타입만 |
| 전체 v4 통일 | 단일 버전, 공유 가능 | Website 마이그레이션 비용 | E(Website) W3에 v4 마이그레이션 필요 |
| 전체 v3 통일 | 생태계 호환성 최대 | OS 다운그레이드 비용 | D(OS) 전체 schema 마이그레이션 |

> **권장**: 옵션 1 (독립 유지). Zod는 앱 내부 validation이므로 packages 간 공유 불필요.

### Week 3 — supabase/ 중복 제거 & import 경로 마이그레이션 시작

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D3.1 | OS `supabase/functions/` 36개 EF 중 통합 `supabase/supabase/functions/`와 중복 EF 식별 및 제거 계획 확정 | 중복 EF 제거 스프레드시트 | D/A 합의, 중복 30개+ 식별 |
| D3.2 | 중복 EF에서 OS 고유 변경사항 diff 추출 | diff 파일 또는 패치 | 통합본에 OS 고유 로직 누락 0건 |
| D3.3 | `_shared/` 디렉토리 — OS 고유 모듈 vs 통합 가능 모듈 분류 | 모듈 분류 목록 | 13개 모듈 분류 완료 |
| D3.4 | Import 경로 마이그레이션 Phase 1 — `@/hooks/`, `@/services/` | 수정된 파일들 | Phase 1 대상 파일 빌드 통과 |

**중복 EF 예상 목록 (OS supabase/ ↔ 통합 supabase/):**

| OS EF (36개) | 통합 EF (53개) | 상태 |
|---|---|---|
| `neuraltwin-assistant` | `neuraltwin-assistant` | 🔴 중복 — OS가 최신 (34파일) |
| `advanced-ai-inference` | `advanced-ai-inference` | 🔴 중복 |
| `generate-optimization` | `generate-optimization` | 🔴 중복 — OS가 최신 (11파일) |
| `retail-chatbot` | `retail-chatbot` | 🟡 소유권 E — 비교 필요 |
| `run-simulation` | `run-simulation` | 🔴 중복 |
| `aggregate-all-kpis` | `aggregate-all-kpis` | 🔴 중복 |
| `unified-etl` | `unified-etl` | 🔴 중복 |
| (기타 ~30개) | (대응 EF) | 🔴 대부분 중복 예상 |

**원칙**: 통합 supabase/의 EF를 canonical로 사용. OS 고유 변경은 패치로 통합.

### Week 4 — 3D 디지털 트윈 고도화 & Three.js 정렬

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D4.1 | Three.js 버전 정렬 — os-dashboard(0.160.1) vs website(0.160.0) → 0.160.1 통일 | `package.json` 업데이트 | 두 앱 Three.js 동일 버전, 빌드 통과 |
| D4.2 | @react-three/drei 버전 정렬 — 9.122.0 vs website 9.99.x → 확인 및 정렬 | `package.json` 업데이트 | 호환성 확인, 빌드 통과 |
| D4.3 | Studio 3D Canvas 성능 프로파일링 — 60fps 기준 | 성능 프로파일 리포트 | Canvas3D에서 60fps 유지 확인 또는 최적화 적용 |
| D4.4 | `public/lighting-presets/` JSON 스키마 문서화 | 프리셋 스키마 문서 | 3개 프리셋 구조 통일 확인 |

**Three.js 버전 현황:**

| 패키지 | OS Dashboard | Website | 통일 대상 |
|--------|-------------|---------|-----------|
| `three` | ^0.160.1 | ^0.160.0 | 0.160.1 |
| `@react-three/fiber` | ^8.18.0 | ^8.15.12 | 8.18.0 |
| `@react-three/drei` | ^9.122.0 | ^9.99.7 | 9.122.0 (주의: 대규모 업데이트) |
| `@react-three/postprocessing` | ^2.16.2 | 미사용 | OS만 |

> **주의**: drei 9.99 → 9.122 업데이트는 API 변경 가능. Website 3D 사용이 제한적이면 독립 유지 고려.

### Week 5 — UI Kit 소비 & C 합류 조율

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D5.1 | E의 `packages/ui` 소비 — `src/components/ui/` 49개 → `@neuraltwin/ui` import 전환 | 49개 파일 import 수정 | `import { Button } from '@neuraltwin/ui'` 패턴 전수 적용, 빌드 통과 |
| D5.2 | E의 `packages/tailwind-preset` 소비 — `tailwind.config.ts` 프리셋 적용 | `tailwind.config.ts` 수정 | 디자인 토큰(색상, 간격, 폰트) 통일, 시각적 회귀 없음 |
| D5.3 | C 합류 온보딩 지원 — supabase/ 중복 EF 현황 공유, `_shared/` 통합 계획 인수인계 | 온보딩 문서 | C가 EF 인벤토리, 중복 현황, 통합 계획 이해 |
| D5.4 | OS Dashboard 프론트엔드 EF 호출 경로 정리 — 중복 제거된 EF 엔드포인트 업데이트 | `src/hooks/` 내 EF 호출 URL 수정 | 모든 EF 호출이 통합 supabase 경로 사용, 기능 동작 정상 |

**UI Kit 소비 전환 예시:**
```typescript
// Before
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// After
import { Button, Card, CardContent } from '@neuraltwin/ui';
```

### Week 6 — 대시보드 최적화 & B 센서 연동

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D6.1 | 인사이트 탭 Canvas 차트 성능 최적화 — 13개 커스텀 Canvas 차트 메모이제이션 | 최적화된 차트 컴포넌트 | 탭 전환 시 렌더링 < 100ms |
| D6.2 | B의 NeuralSense → Supabase 브릿지 데이터를 3D 시각화 — `store-tracking-{storeId}` Realtime | 실시간 고객 아바타 3D 표시 | WiFi 센서 데이터 → 3D Canvas 실시간 반영 (5초 이내) |
| D6.3 | `useRealtimeTracking.ts` 칼만 필터 파라미터 튜닝 | 튜닝된 칼만 필터 | 3D 고객 위치 떨림 최소화 (시각 확인) |
| D6.4 | jsPDF 버전 정렬 — os-dashboard(3.0.3) vs website(4.1.0) | 버전 결정 | 리포트 내보내기 정상 동작 |

**Realtime IoT → 3D 파이프라인:**
```
WiFi AP (8대) → MQTT Broker → process-neuralsense-data EF
     → Supabase DB → Realtime Broadcast (store-tracking-{storeId})
          → useRealtimeTracking.ts → 5초 윈도우 버퍼
               → 삼변측량(Trilateration) → 칼만 필터(Kalman Filter)
                    → 3D 좌표 변환 → Presence track()
                         → CustomerAvatarOverlay (R3F)
```

### Week 7 — 테스트 & 코드 품질

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D7.1 | OS Dashboard 단위 테스트 — Zustand 스토어 6개 테스트 | `*.test.ts` 파일 | 6개 스토어 핵심 액션 테스트 통과 |
| D7.2 | 3D 컴포넌트 스냅샷 테스트 — R3F 렌더 트리 검증 | 스냅샷 테스트 파일 | Canvas3D, ModelLoader 스냅샷 안정 |
| D7.3 | React Query 커스텀 훅 테스트 — 주요 10개 훅 | `*.test.ts` 파일 | 캐시 무효화, 에러 처리 테스트 통과 |
| D7.4 | OS Dashboard 번들 사이즈 분석 & 최적화 | 번들 분석 리포트 | 현재 ~3.6MB → 2.5MB 이하 목표 |

**번들 최적화 타겟:**

| 라이브러리 | 현재 크기 (추정) | 최적화 |
|-----------|----------------|--------|
| Three.js + R3F | ~1.2MB | 트리셰이킹 확인, 사용 안 하는 drei 헬퍼 제거 |
| Recharts | ~400KB | 동적 import로 전환 |
| Framer Motion | ~200KB | 사용 최소화 또는 CSS 전환 |
| shadcn/ui (49개) | ~300KB | packages/ui 이동 후 트리셰이킹 |
| 기타 | ~1.5MB | 코드 스플리팅 (`React.lazy`) |

### Week 8 — 안정화 & 통합 테스트

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| D8.1 | E2E 테스트 — 핵심 플로우 3개 (로그인→인사이트, 스튜디오→시뮬레이션, 데이터 임포트) | Playwright 테스트 | 3개 플로우 자동화 통과 |
| D8.2 | 전체 모노레포 빌드 통합 확인 | `pnpm build` 전체 통과 | 루트에서 `pnpm build` 0 errors |
| D8.3 | `neuraltwin-assistant` 배치 QA 테스트 실행 | `ai-batch-qa-test` 결과 리포트 | parse_success > 90%, 주요 인텐트 정확도 > 85% |
| D8.4 | OS Dashboard 최종 성능 검증 | Lighthouse 리포트 | Performance > 70, Accessibility > 80 |

---

## 5. 기술 사양 (Technical Specifications)

### 5.1 OS Dashboard 프론트엔드 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| **빌드** | Vite + SWC | 5.4.19, @vitejs/plugin-react-swc 3.11.0 |
| **프레임워크** | React | 18.3.1 |
| **라우팅** | React Router DOM | 6.30.1 |
| **언어** | TypeScript | 5.8.3 |
| **스타일링** | Tailwind CSS | 3.4.17 |
| **UI** | shadcn/ui (Radix UI) | 27개 Radix 프리미티브, 49개 컴포넌트 |
| **상태 (클라이언트)** | Zustand | 5.0.9 |
| **상태 (서버)** | TanStack React Query | 5.83.0 |
| **3D** | Three.js + R3F + Drei | 0.160.1, 8.18.0, 9.122.0 |
| **후처리** | @react-three/postprocessing | 2.16.2 |
| **차트** | Recharts + Canvas API 커스텀 | 2.15.4 |
| **폼** | React Hook Form + Zod | 7.61.1, 4.1.12 |
| **애니메이션** | Framer Motion | 12.23.25 |
| **아이콘** | lucide-react | 0.462.0 |
| **내보내기** | jsPDF, xlsx | 3.0.3, 0.18.5 |
| **다크모드** | next-themes (검토 필요) | 0.3.0 |

### 5.2 Vite 설정

```typescript
// apps/os-dashboard/vite.config.ts
export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
}));
```

### 5.3 라우팅 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/auth` | `AuthPage` | 인증 |
| `/` | `InsightHubPage` | 메인 대시보드 |
| `/insights` | `InsightHubPage` | 인사이트 (6탭) |
| `/studio` | `DigitalTwinStudioPage` | 3D 디지털 트윈 ★ |
| `/roi` | `ROIMeasurementPage` | ROI 측정 |
| `/settings` | `SettingsPage` | 설정 |
| `/data/control-tower` | `DataControlTowerPage` | 데이터 컨트롤타워 |
| `/data/lineage` | `LineageExplorerPage` | 데이터 리니지 |
| `/data/connectors/:id` | `ConnectorSettingsPage` | 커넥터 설정 |

**레거시 리다이렉트**: `/overview/*` → `/insights`, `/simulation/*` → `/studio`, `/data-management/*` → `/settings?tab=data`

### 5.4 Zustand 스토어 설계

| 스토어 | 위치 | 미들웨어 | 핵심 데이터 |
|--------|------|----------|------------|
| `useChatStore` | `src/store/chatStore.ts` | — | 채팅 패널 상태, 메시지, 스트리밍 |
| `useDateFilterStore` | `src/store/dateFilterStore.ts` | `persist` (localStorage) | 전역 날짜 필터 (today/7d/30d/90d/custom) |
| `useScreenDataStore` | `src/store/screenDataStore.ts` | — | 현재 화면 KPI (챗봇 공유용) |
| `useSimulationStore` (AI) | `src/stores/simulationStore.ts` | — | AI 시뮬레이션 상태/결과 |
| `useSimulationStore` (3D) | `src/features/studio/stores/simulationStore.ts` | `subscribeWithSelector` | 3D 실시간 시뮬레이션, 고객 에이전트 |
| `useSceneStore` | `src/features/studio/stores/sceneStore.ts` | — | 3D 씬 모델, 레이어, 선택, 오버레이 |

> **⚠️ 이름 충돌**: `useSimulationStore` 2개 — W1에 디렉토리 통합 시 네이밍 조정 필수.

### 5.5 neuraltwin-assistant 아키텍처

```
neuraltwin-assistant/
├── index.ts              # 진입점 (POST 핸들러)
├── actions/              # 사용자 액션 실행
│   └── queryActions/     # DB 쿼리 액션 (11개 RPC)
│       └── index.ts
├── config/               # 모델 설정, 프롬프트 설정
├── constants/            # 상수 (인텐트 목록, 에러 메시지)
├── intent/               # 사용자 의도 분류 (Gemini)
├── response/             # 응답 생성 (자연어 변환)
└── utils/                # 유틸 (토큰 카운팅, 컨텍스트 빌딩)
```

**데이터 흐름**: 사용자 메시지 → JWT 검증 → 조직/매장 확인 → Rate Limit 체크 → 의도 분류 → DB 쿼리 실행 → AI 응답 생성 → 메시지 저장 → 스트리밍 응답

---

## 6. 크로스팀 의존성 (Cross-Team Dependencies)

### 6.1 D → A 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| 모노레포 스캐폴딩 | W1 | `pnpm-workspace.yaml`, `turbo.json` 설정 완료 |
| `@neuraltwin/types` v0.1 | W2 | `database.types.ts` 패키지 배포 후 D 타입 마이그레이션 |
| Zod 버전 최종 결정 | W2 | A 아키텍처 승인 (v4 유지 or 통일) |
| supabase/ 중복 제거 승인 | W3 | 통합 supabase 디렉토리 canonical 결정 |

### 6.2 D → E 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| `packages/ui` 배포 | W5 | E의 UI Kit 추출 완료 → D 소비 |
| `packages/tailwind-preset` | W5 | E의 디자인 토큰 패키지 → D 소비 |
| Three.js 버전 공동 결정 | W4 | drei 9.99 → 9.122 업데이트 범위 합의 |

### 6.3 D → C 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| supabase/ 중복 EF 정리 | W5-W6 | C 합류 후 canonical EF 결정 및 배포 |
| `_shared/` 모듈 통합 | W6 | C가 공유 모듈 정리, D가 OS에서 import 전환 |
| CORS 중앙화 | W6 | C가 CORS 헤더 → `@neuraltwin/shared` 통합, D EF 업데이트 |

### 6.4 D → B 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| `zones.csv` 형식 확정 | W4 | B의 존 정보 → 3D ZoneBoundaryOverlay 매핑 |
| NeuralSense → Supabase 브릿지 | W6 | B의 `process-neuralsense-data` EF → D의 Realtime 수신 |
| MQTT 토픽 스키마 | W3 | B의 MQTT JSON 스키마 → D의 Broadcast 수신 형식 맞춤 |

### 6.5 크로스팀 Sync Points

| 주차 | 참여자 | 안건 |
|------|--------|------|
| W2 | D + A | Zod 버전 최종 결정, supabase/ 중복 전략 |
| W3 | D + A + E | Three.js 버전 정렬, _shared/ 분류 결과 |
| W5 | D + C + A | C 온보딩, EF 중복 제거 실행 계획 |
| W6 | D + B | IoT → 3D Realtime 연동 테스트 |
| W8 | 전체 | 통합 빌드 검증, E2E 테스트 |

---

## 7. 알려진 이슈 & 기술 부채 (Known Issues & Tech Debt)

### 7.1 보안 이슈

| 심각도 | 이슈 | 위치 | 수정 시점 |
|--------|------|------|-----------|
| 🔴 Critical | Supabase URL/Key 하드코딩 | `src/integrations/supabase/client.ts` | W1 (D1.1) |
| 🟡 Medium | `LOVABLE_API_KEY` EF에서 직접 사용 | 12개 EF | C 합류 후 (W5+) |
| 🟡 Medium | CORS `*` 전체 허용 | 36개 OS EF | C 합류 후 (W6) |
| 🟢 Low | `next-themes` 불필요한 Next.js 의존성 | `package.json` | W2 (D2.3) |

### 7.2 아키텍처 부채

| 이슈 | 상세 | 영향 | 수정 시점 |
|------|------|------|-----------|
| `store/` vs `stores/` 디렉토리 중복 | 6개 Zustand 스토어가 2개 디렉토리에 분산 | import 혼동, 코드 탐색 어려움 | W1 (D1.4) |
| `useSimulationStore` 이름 중복 | AI 시뮬레이션 vs 3D 시뮬레이션 동일 이름 | 잘못된 import 위험 | W1 |
| OS `supabase/functions/` 36개 중복 | 통합 supabase/와 대부분 중복 | 동기화 불가, 버전 drift | W3-W5 |
| `_shared/` 13개 모듈 OS 로컬 | 통합 supabase `_shared/`와 분리됨 | 로직 불일치 위험 | W5-W6 |
| @supabase/supabase-js 11버전 혼재 (EF) | 2.7.1 ~ 2.89.0 | 타입 불일치, 번들 크기 | C 합류 후 (W5+) |

### 7.3 성능 부채

| 이슈 | 상세 | 수정 시점 |
|------|------|-----------|
| 번들 ~3.6MB (uncompressed) | Three.js, Recharts, Framer Motion 등 | W7 (D7.4) |
| 13개 커스텀 Canvas 차트 메모이제이션 없음 | 탭 전환 시 불필요한 재렌더링 | W6 (D6.1) |
| 오프라인 처리 미구현 | Realtime 단절 시 복구 없음 | 후속 프로젝트 |
| 낙관적 업데이트 1곳만 적용 | 48개 뮤테이션 중 `useUpdateConnection`만 | 후속 프로젝트 |
| `d3-force`, `react-force-graph-2d` 미사용 의존성 | 설치만 됨, 활성 사용 안 함 | W7 (제거) |

### 7.4 테스트 부채

| 이슈 | 수치 |
|------|------|
| 단위 테스트 | **0%** 커버리지 |
| E2E 테스트 | 없음 |
| AI 배치 테스트 | `ai-batch-qa-test` EF 존재하나 정기 실행 미확인 |
| 3D 렌더링 테스트 | 없음 |

---

## 8. 검증 체크리스트 (Verification Checklist)

### W1 완료 체크
- [ ] `client.ts` 하드코딩 키 제거됨 — `grep -r "eyJhbGci" apps/os-dashboard/src/` 결과 0건
- [ ] `.env.example` 6개 변수 문서화
- [ ] `store/` + `stores/` 통합 완료 — 단일 디렉토리
- [ ] `pnpm build` 통과 (os-dashboard)

### W2 완료 체크
- [ ] `types.ts` → `@neuraltwin/types` re-export 전환
- [ ] `pnpm type-check` 0 errors
- [ ] Zod 버전 결정 문서 작성, A 승인
- [ ] OS supabase/ EF 인벤토리 36개 분류 완료

### W3 완료 체크
- [ ] 중복 EF 목록 + 제거 계획 A/D 합의
- [ ] OS 고유 EF 변경사항 diff 추출 완료
- [ ] `_shared/` 13개 모듈 분류 완료

### W5 완료 체크
- [ ] `@neuraltwin/ui` import 전환 — 49개 UI 컴포넌트
- [ ] `@neuraltwin/tailwind-preset` 적용
- [ ] C 합류 온보딩 완료
- [ ] EF 호출 경로 통합 supabase 사용

### W7 완료 체크
- [ ] Zustand 스토어 6개 테스트 통과
- [ ] React Query 주요 10개 훅 테스트 통과
- [ ] 번들 사이즈 ≤ 2.5MB

### W8 완료 체크
- [ ] E2E 핵심 3개 플로우 통과
- [ ] `pnpm build` (루트) 0 errors
- [ ] `ai-batch-qa-test` parse_success > 90%
- [ ] Lighthouse Performance > 70

---

## 9. 참조 파일 (Reference Files)

### 분석 문서
| 파일 | 설명 | 핵심 데이터 |
|------|------|------------|
| `apps/os-dashboard/REPO_ANALYSIS_D.md` | OS Dashboard 전체 분석 (2,721줄) | 231 컴포넌트, 49 3D, 6 Zustand, 61 useQuery, 6 Realtime |
| `apps/os-dashboard/TYPE_MIGRATION_TODO.md` | 타입 마이그레이션 가이드 | 103개 파일 supabase client import 목록 |
| `supabase/REPO_ANALYSIS_C.md` | Supabase EF 전체 분석 (1,884줄) | 53 EF, 8 supabase-js 버전, 55 테이블 |
| `docs/SYSTEM_ARCHITECTURE.md` | 시스템 아키텍처 | 전체 데이터 흐름, 4개 런타임 |

### 설정 파일
| 파일 | 역할 |
|------|------|
| `apps/os-dashboard/package.json` | 의존성 (Three.js 0.160.1, Zod 4.1.12, Zustand 5.0.9) |
| `apps/os-dashboard/vite.config.ts` | Vite 설정 (port 8080, SWC, `@` alias) |
| `apps/os-dashboard/tailwind.config.ts` | Tailwind 테마 & 플러그인 |
| `apps/os-dashboard/tsconfig.json` | TypeScript 프로젝트 레퍼런스 |
| `apps/os-dashboard/components.json` | shadcn/ui 레지스트리 설정 |

### 핵심 코드 파일
| 파일 | 중요도 | 설명 |
|------|--------|------|
| `src/integrations/supabase/client.ts` | 🔴 | W1 수정 대상 (하드코딩 키) |
| `src/integrations/supabase/types.ts` | 🔴 | W2 마이그레이션 대상 |
| `src/features/studio/core/Canvas3D.tsx` | ⭐ | 메인 3D 캔버스 엔트리포인트 |
| `src/features/studio/stores/sceneStore.ts` | ⭐ | 3D 씬 상태 관리 |
| `src/features/studio/stores/simulationStore.ts` | ⭐ | 3D 실시간 시뮬레이션 상태 |
| `src/features/simulation/hooks/useRealtimeTracking.ts` | ⭐ | IoT → 3D 파이프라인 (칼만 필터) |
| `src/hooks/useAuth.tsx` | 🔴 | AuthContext + 인증 상태 관리 |
| `src/App.tsx` | 🔴 | Provider 계층, QueryClient, 라우팅 |
| `supabase/functions/neuraltwin-assistant/index.ts` | ⭐ | AI 어시스턴트 진입점 |
| `supabase/functions/advanced-ai-inference/index.ts` | ⭐ | 4,972 LOC 다목적 AI 추론 |

---

## 10. 긴급 대응 절차 (Emergency Procedures)

### 3D 렌더링 크래시
```
증상: WebGL context lost, 흰 화면, 무한 로딩 스피너
1. Chrome DevTools → Console에서 WebGL 에러 확인
2. `Canvas3D.tsx` → gl 설정 확인 (powerPreference, stencil, alpha)
3. PostProcessing 비활성화 테스트 (Bloom, N8AO 순차 제거)
4. Three.js 메모리 릭 확인: `renderer.info.memory` 체크
5. 롤백: git stash → 이전 작동 커밋 체크아웃
```

### neuraltwin-assistant 장애
```
증상: AI 챗봇 응답 없음, 타임아웃, 잘못된 응답
1. Supabase Dashboard → Edge Functions → neuraltwin-assistant 로그 확인
2. Rate Limiter 확인: _shared/rateLimiter.ts (분당 제한 초과?)
3. AI Gateway 상태: ai.gateway.lovable.dev 헬스체크
4. LOVABLE_API_KEY 유효성: Supabase Dashboard → Settings → Edge Function Secrets
5. 응답 품질: ai_response_logs 테이블 → parse_success 비율 확인
6. 롤백: supabase functions deploy neuraltwin-assistant (이전 커밋)
```

### 빌드 실패
```
증상: pnpm build 에러
1. 에러 메시지 확인 (타입 에러 vs 번들링 에러)
2. 타입 에러: pnpm type-check → 구체적 파일/라인 확인
3. 의존성 이슈: rm -rf node_modules && pnpm install
4. Three.js 관련: drei/fiber 버전 호환성 확인 (package.json)
5. Zod 관련: v3 vs v4 API 차이 확인
6. 롤백: git stash → pnpm install → pnpm build
```

### Supabase Realtime 연결 장애
```
증상: 실시간 데이터 미수신, 3D 고객 위치 미업데이트
1. Supabase Dashboard → Realtime 탭 → 활성 연결 수 확인
2. 브라우저 Network 탭 → WebSocket 연결 상태 확인
3. 채널 구독 상태: supabase.getChannels() 콘솔 체크
4. RLS 정책: 해당 테이블의 SELECT/REALTIME 정책 확인
5. 일시 조치: refetchInterval 폴링으로 폴백 (30초)
6. 에스컬레이션: Supabase 플랫폼 이슈 시 A에 보고
```

### 환경변수 누락
```
증상: 앱 로드 시 에러, Supabase 연결 실패
1. .env 파일 존재 확인: ls -la apps/os-dashboard/.env
2. 필수 변수 확인: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
3. .env.example과 비교: diff .env .env.example
4. Vite 캐시 초기화: rm -rf node_modules/.vite && pnpm dev:os
5. 환경변수 접근 확인: import.meta.env.VITE_* (VITE_ 접두사 필수!)
```

### 에스컬레이션 경로
```
D 자체 해결 시도 (30분)
  → D → A (아키텍처/크로스팀 이슈)
  → D → C (EF/백엔드 이슈, W5 이후)
  → D → B (IoT/센서 이슈)
  → D → E (UI Kit/디자인 토큰 이슈)
```
