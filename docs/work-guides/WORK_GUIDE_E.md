# WORK_GUIDE_E — Member C (Backend Engineer)

> **역할**: Backend Engineer, Supabase Edge Functions & DevOps
> **Claude 프로젝트**: `neuraltwin-backend`
> **버전**: 1.0 | 2026-02-25
> **합류 시점**: Week 5 (W1-W4는 A가 긴급 백엔드 대응)

---

## 1. 역할 요약 (Role Summary)

| 항목 | 내용 |
|------|------|
| **포지션** | Backend Engineer, Supabase & DevOps |
| **핵심 책임** | 52개 EF 통합/정리, @supabase/supabase-js 버전 통일, _shared/ 통합, deno.json Import Map 관리, CORS 중앙화, GitHub Actions CI/CD, DB 스키마 관리, 테스트 |
| **코드 소유 경로** | `supabase/supabase/functions/` 전체, `supabase/migrations/`, `packages/shared/`, `.github/workflows/` |
| **합류 시점** | W5 (W1-W4 동안 A가 긴급 백엔드 대응) |
| **의사결정 권한** | EF 아키텍처, DB 마이그레이션 전략, CI/CD 파이프라인 설계, _shared/ 모듈 구조 |

### 합류 전 A가 처리하는 긴급 사항 (W1-W4)
- EF 버그 핫픽스 (서비스 중단 시)
- DB 마이그레이션 최소화 (스키마 변경 자제)
- CI/CD 초기 스캐폴딩 (기본 lint/type-check)
- supabase/ 디렉토리 canonical 결정

---

## 2. 모노레포 컨텍스트 (Monorepo Context)

### C의 코드 위치
```
neuraltwin/
├── supabase/
│   └── supabase/
│       ├── functions/                  # ← C 전체 소유 (53개 EF)
│       │   ├── _shared/               # 13개 공유 모듈 ← C 통합 관리
│       │   │   ├── calculations/      # ROI, 트래픽, 검증
│       │   │   ├── optimization/      # 교차 최적화
│       │   │   ├── persona/           # 매장 페르소나
│       │   │   ├── vmd/               # VMD 룰셋
│       │   │   ├── aiResponseLogger.ts
│       │   │   ├── chatEventLogger.ts
│       │   │   ├── chatLogger.ts
│       │   │   ├── chatTypes.ts
│       │   │   ├── errorHandler.ts
│       │   │   ├── rateLimiter.ts
│       │   │   ├── safeJsonParse.ts
│       │   │   ├── streamingResponse.ts
│       │   │   └── supabase-client.ts  # 공유 클라이언트
│       │   ├── neuraltwin-assistant/   # 34파일 (D 소유 로직, C 인프라)
│       │   ├── retail-chatbot/         # 26파일 (E 소유 로직, C 인프라)
│       │   ├── generate-optimization/  # 11파일
│       │   └── ... (49개 추가 EF)
│       ├── deno.json                   # Import Map ← C 관리
│       ├── migrations/                 # DB 마이그레이션 ← C 관리
│       └── config.toml                 # Supabase 로컬 설정
├── packages/
│   └── shared/                         # ← C 공동 소유 (A와)
│       └── src/
│           ├── cors.ts                 # CORS 헤더
│           ├── env.ts                  # 환경변수 검증
│           ├── error.ts               # 에러 응답
│           └── index.ts               # 배럴 export
├── .github/
│   └── workflows/                      # ← C 생성 예정 (W6)
│       ├── ci.yml                      # PR 시 lint/type-check/build
│       ├── deploy-ef.yml              # EF 배포
│       └── deploy-frontend.yml        # 프론트 배포 (Vercel)
└── .env.example                        # 루트 환경변수 (C 관리)
```

### 다른 멤버와의 의존 관계
- **A**: W5 합류 시 A로부터 전체 아키텍처 워크스루, 백엔드 업무 인수인계. 아키텍처 변경 승인 요청.
- **D**: OS Dashboard `supabase/functions/` 36개 중복 정리 협업. `neuraltwin-assistant`, `generate-optimization` EF — D가 로직 소유, C가 인프라(배포, _shared, CORS) 관리.
- **E**: Website `supabase/functions/` 5개 EF (`retail-chatbot`, `knowledge-admin`, `submit-contact`, `test-embedding`, `upscale-image`) — E가 로직 소유, C가 인프라 관리. `_shared/` 모듈 공유.
- **B**: `process-neuralsense-data`, `process-wifi-data` EF — B의 IoT 데이터 수신 엔드포인트. MQTT → EF 연동 조율.

### 핵심 수치
- **Edge Functions**: 53개 (통합 supabase), 36개 (OS 중복), 5개 (Website) = 총 ~90개 파일 관리
- **코드**: 70,576 LOC (TypeScript/Deno)
- **DB 테이블**: 153개 + 12개 뷰
- **@supabase/supabase-js 버전**: 8개 혼재 (2.7.1 ~ 2.89.0)
- **_shared/ 모듈**: 13개 (통합) + α (OS/Website 로컬)
- **환경변수**: 8개 (SUPABASE_URL, SERVICE_ROLE_KEY, LOVABLE_API_KEY 등)

---

## 3. 서브에이전트 팀 (Sub-Agent Team)

### 3.1 Edge Function Agent

**역할**: Edge Function 코드 품질, 버전 통일, CORS 중앙화, Import Map 관리

```markdown
# CLAUDE.md — Edge Function Agent (neuraltwin-backend)

## 역할
Supabase Edge Functions의 코드 품질과 인프라를 담당하는 에이전트입니다.

## 핵심 규칙
1. 모든 EF는 `supabase/supabase/functions/` 디렉토리에서 관리.
2. `@supabase/supabase-js` 버전은 반드시 deno.json Import Map의 단일 버전 사용.
3. CORS 헤더는 `@neuraltwin/shared`의 `getCorsHeaders()` 사용 (절대 인라인 하드코딩 금지).
4. 모든 EF는 `handleCorsOptions(req)` preflight 체크로 시작.
5. 새 EF 작성 시 반드시 `_shared/supabase-client.ts`의 공유 클라이언트 사용.
6. AI API 호출은 Lovable AI Gateway 경유만 허용.
7. `Deno.env.get()` 사용 시 `!` non-null assertion 대신 null 체크 권장.

## 담당 파일
- `supabase/supabase/functions/` — 53개 EF 전체
- `supabase/supabase/functions/_shared/` — 13개 공유 모듈
- `supabase/supabase/functions/deno.json` — Import Map

## Import Map (deno.json)
```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.89.0",
    "xlsx": "https://esm.sh/xlsx@0.18.5",
    "@shared/": "./_shared/"
  }
}
```

## CORS 패턴
```typescript
import { getCorsHeaders, handleCorsOptions } from '@neuraltwin/shared';

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);
  try {
    // 로직
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers
    });
  }
});
```

## 버전 통일 대상
- `@supabase/supabase-js`: 8개 → 1개 (2.89.0)
- `deno.land/std@0.168.0/http/server.ts`: → Deno.serve() 네이티브 전환

## 검증 명령어
```bash
supabase functions serve <function-name>   # 로컬 테스트
deno check supabase/supabase/functions/<name>/index.ts  # 타입 체크
```

## 에스컬레이션
EF 배포 실패 → C에 보고 → A에 에스컬레이션
```

### 3.2 DB / Schema Agent

**역할**: PostgreSQL 스키마 관리, 마이그레이션, RPC 함수, RLS 정책

```markdown
# CLAUDE.md — DB / Schema Agent (neuraltwin-backend)

## 역할
Supabase PostgreSQL 데이터베이스 스키마, 마이그레이션, RPC 함수를 담당합니다.

## 핵심 규칙
1. 모든 스키마 변경은 마이그레이션 파일로 관리 (`supabase/supabase/migrations/`).
2. 직접 DB 수정 금지 — 반드시 `supabase db push` 또는 `supabase migration apply`.
3. 테이블 삭제/컬럼 삭제 시 A 승인 필수 (데이터 손실 위험).
4. RLS 정책 변경 시 관련 EF 테스트 필수.
5. RPC 함수 수정 시 호출하는 EF 목록 확인 후 영향도 분석.
6. `database.types.ts` 재생성: 스키마 변경 후 `pnpm supabase:gen-types` 필수.
7. 인덱스 추가 시 읽기 빈도 기준 판단 (참조 함수 수 3+ 이상).

## 담당 파일
- `supabase/supabase/migrations/` — DB 마이그레이션
- `packages/types/src/database.types.ts` — 자동 생성 타입
- `supabase/supabase/config.toml` — DB 설정
- RPC 함수 17개 (neuraltwin-assistant 11개, graph-query 2개, retail-chatbot 2개, 기타 2개)

## DB 규모
- 테이블: 153개
- 뷰: 12개
- Enum: 2개 (app_role, subscription_status)
- RPC: 17개

## 핵심 테이블 참조 빈도 Top 10
| 테이블 | EF 참조 수 | 주요 EF |
|--------|-----------|---------|
| graph_entities | 10+ | aggregate-*-kpis, import-with-ontology, run-simulation, unified-etl |
| ontology_entity_types | 9+ | analyze-3d-model, auto-map-etl, import-with-ontology |
| products | 7+ | advanced-ai-inference, generate-optimization, neuraltwin-assistant |
| raw_imports | 6+ | bright-processor, execute-import, unified-etl, validate-data |
| upload_sessions | 6+ | dynamic-handler, execute-import, parse-file |
| zones_dim | 5+ | generate-optimization, process-neuralsense-data, run-simulation |
| stores | 4+ | aggregate-*-kpis, neuraltwin-assistant, process-wifi-data |
| api_connections | 4+ | api-connector, dynamic-responder, sync-api-data |
| daily_kpis_agg | 4+ | retail-ai-inference, run-simulation, unified-ai |
| user_data_imports | 5+ | execute-import, integrated-data-pipeline, rollback-import |

## 검증 명령어
```bash
pnpm supabase:gen-types    # 타입 재생성
pnpm type-check            # 전체 타입 검사
supabase db diff           # 스키마 변경 확인
```

## 에스컬레이션
스키마 충돌/데이터 손실 위험 → C에 보고 → A에 즉시 에스컬레이션
```

### 3.3 DevOps Agent

**역할**: GitHub Actions CI/CD, 환경변수 관리, 모니터링, 배포 자동화

```markdown
# CLAUDE.md — DevOps Agent (neuraltwin-backend)

## 역할
CI/CD 파이프라인, 환경변수 관리, 배포 자동화를 담당합니다.

## 핵심 규칙
1. CI 파이프라인은 PR 단위로 실행 (lint → type-check → build → test).
2. `.env` 파일 커밋 절대 금지 — GitHub Secrets 사용.
3. EF 배포는 `supabase functions deploy` CLI 사용.
4. 프론트엔드 배포는 Vercel (website) 또는 Supabase Hosting (os-dashboard).
5. 모든 배포 전 `pnpm build` 전체 통과 확인.
6. 롤백 절차: Supabase Dashboard → Edge Functions → 이전 배포 버전 선택.

## 담당 파일
- `.github/workflows/` — CI/CD 워크플로우
- `.env.example` — 루트/앱별 환경변수 템플릿
- `supabase/supabase/config.toml` — Supabase CLI 설정
- `turbo.json` — Turborepo 빌드 파이프라인 (A와 공동)

## CI/CD 파이프라인 설계
```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-type-check:
    - pnpm install
    - pnpm lint
    - pnpm type-check

  build:
    needs: lint-and-type-check
    - pnpm build

  test:
    needs: build
    - pnpm test (향후)

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    - Vercel preview deploy (website)
```

## 환경변수 관리
| 환경 | 관리 위치 | 접근 방법 |
|------|-----------|-----------|
| 로컬 개발 | `.env` (gitignored) | `import.meta.env.VITE_*` / `Deno.env.get()` |
| CI/CD | GitHub Secrets | `${{ secrets.* }}` |
| Supabase EF | Supabase Dashboard → Secrets | `Deno.env.get()` (자동 주입) |
| Vercel | Vercel Dashboard → Environment Variables | `import.meta.env.VITE_*` |

## 에스컬레이션
배포 실패/롤백 필요 → C에 보고 → A에 에스컬레이션
```

---

## 4. 8주 작업 분해 (Task Breakdown)

> **Note**: C는 W5 합류. W1-W4는 A가 백엔드 최소 운영. C의 실질 작업은 W5-W8 (4주).

### Week 5 — 온보딩 & EF 인벤토리

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| C5.1 | A로부터 전체 아키텍처 워크스루 수령 — CLAUDE.md, SYSTEM_ARCHITECTURE.md, REPO_ANALYSIS_C.md 숙지 | 온보딩 완료 체크리스트 | 3개 문서 읽기 + 로컬 개발 환경 구축 완료 |
| C5.2 | 53개 EF 전수 인벤토리 — 상태(active/deprecated/duplicate), 소유자(D/E/C), @supabase/supabase-js 버전 기록 | `EF_INVENTORY.md` | 53개 EF × 4항목(상태, 소유자, supabase-js 버전, 의존 테이블) 완성 |
| C5.3 | OS `supabase/functions/` 36개 ↔ 통합 53개 diff 비교 — D가 준비한 중복 목록 검증 | diff 리포트 | 모든 중복 EF의 코드 차이 0건 또는 패치 준비 완료 |
| C5.4 | `@supabase/supabase-js` 8개 버전 → 2.89.0 통일 PoC — 5개 EF 시범 | PoC 결과 | 5개 EF에서 버전 통일 후 로컬 서빙 정상 |

**EF 인벤토리 템플릿:**

| # | EF 이름 | 상태 | 소유자 | supabase-js 버전 | 의존 테이블 수 | _shared 의존 |
|---|---------|------|--------|------------------|-------------|-------------|
| 1 | advanced-ai-inference | Active | D | @2.89.0 | 6 | aiResponseLogger |
| 2 | aggregate-all-kpis | Active | C | @2.79.0 | 4 | — |
| ... | ... | ... | ... | ... | ... | ... |

**@supabase/supabase-js 현재 상태:**

| 버전 | 파일 수 | 전환 전략 |
|------|---------|-----------|
| `@2.89.0` | 15 | 유지 (최신) |
| `@2.79.0` | 13 | → 2.89.0 |
| `@2.49.1` | 11 | → 2.89.0 |
| `@2` (latest) | 6 | → 2.89.0 (pinned) |
| `@2.84.0` | 3 | → 2.89.0 |
| `@2.80.0` | 1 | → 2.89.0 |
| `@2.39.3` | 1 | → 2.89.0 |
| `@2.7.1` | 2 | → 2.89.0 |

### Week 6 — 버전 통일 & CORS 중앙화

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| C6.1 | @supabase/supabase-js 전체 통일 — deno.json Import Map 활용 | 전 EF `@supabase/supabase-js` 단일 버전 | `grep -r "supabase-js@" supabase/supabase/functions/` 결과 2.89.0만 |
| C6.2 | deno.json Import Map 확장 — 공통 의존성 중앙 관리 | `deno.json` 업데이트 | 모든 EF가 Import Map 경유 import |
| C6.3 | CORS 중앙화 — 52개 EF의 인라인 CORS → `@neuraltwin/shared` 전환 | 52개 EF 수정 | `grep -r "Access-Control-Allow-Origin" supabase/supabase/functions/` 결과 `getCorsHeaders` import만 |
| C6.4 | `_shared/supabase-client.ts` 통합 — 공유 Supabase 클라이언트 팩토리 | `supabase-client.ts` 정비 | 모든 EF가 공유 클라이언트 사용, 인라인 `createClient` 제거 |

**deno.json Import Map 확장 목표:**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.89.0",
    "xlsx": "https://esm.sh/xlsx@0.18.5",
    "@shared/": "./_shared/",
    "@neuraltwin/shared": "../../packages/shared/src/index.ts"
  }
}
```

**CORS 전환 Before/After:**

```typescript
// Before (52개 EF에 인라인 반복)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// After (@neuraltwin/shared 사용)
import { getCorsHeaders, handleCorsOptions } from '@shared/cors';
// getCorsHeaders(req) 호출
```

### Week 7 — CI/CD & _shared/ 통합

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| C7.1 | GitHub Actions CI 워크플로우 작성 — PR 시 lint → type-check → build | `.github/workflows/ci.yml` | PR 생성 시 자동 CI 실행, 결과 GitHub에 표시 |
| C7.2 | EF 배포 워크플로우 작성 — main 머지 시 변경된 EF만 배포 | `.github/workflows/deploy-ef.yml` | `supabase functions deploy` 자동 실행 |
| C7.3 | `_shared/` 모듈 통합 — OS 로컬 `_shared/` + 통합 `_shared/` 머지 | 통합된 `_shared/` | D의 OS EF가 통합 `_shared/` import 정상 |
| C7.4 | OS `supabase/functions/` 중복 EF 제거 실행 — D와 공동 | 중복 EF 삭제, OS EF 호출 경로 업데이트 | OS supabase/functions/ 디렉토리 삭제 또는 최소화, 빌드 통과 |

**CI 워크플로우 설계:**
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm build
```

### Week 8 — 테스트 & 안정화

| # | 태스크 | 산출물 | Done When |
|---|--------|--------|-----------|
| C8.1 | EF 단위 테스트 — 핵심 10개 EF (`unified-etl`, `process-neuralsense-data`, `neuraltwin-assistant` 등) | `*.test.ts` 파일 | 10개 EF 핵심 로직 테스트 통과, 커버리지 > 20% |
| C8.2 | DB 마이그레이션 정리 — 미사용 테이블 식별, 인덱스 검토 | 마이그레이션 상태 리포트 | 153개 테이블 중 미사용 테이블 목록화 |
| C8.3 | `.env.example` 전체 정비 — 루트 + 앱별 환경변수 문서화 | `.env.example` 파일 3개 | 모든 필수/선택 변수 주석 포함 |
| C8.4 | 통합 빌드 & EF 배포 테스트 | 전체 파이프라인 실행 결과 | `pnpm build` (루트) 0 errors, EF 53개 배포 성공 |

---

## 5. 기술 사양 (Technical Specifications)

### 5.1 Supabase Edge Functions 런타임

| 항목 | 사양 |
|------|------|
| **런타임** | Deno 2.x |
| **HTTP 서버** | `Deno.serve()` (네이티브) |
| **레거시 HTTP** | `deno.land/std@0.168.0/http/server.ts` → `serve()` (일부 EF) |
| **DB 클라이언트** | `@supabase/supabase-js@2.89.0` (통일 목표) |
| **스프레드시트** | `xlsx@0.18.5` |
| **AI Gateway** | `ai.gateway.lovable.dev/v1/chat/completions` |

### 5.2 EF 아키텍처 패턴

**표준 EF 구조:**
```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. 인증 (JWT 또는 service_role)
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 3. 요청 파싱
  const body = await req.json();

  // 4. 비즈니스 로직

  // 5. 응답
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

### 5.3 인증 패턴 분류

| 유형 | EF 수 | 설명 |
|------|-------|------|
| JWT 필수 | 24 | `req.headers.get('Authorization')` → `supabase.auth.getUser()` |
| JWT + 역할 검증 | 4 | NEURALTWIN_MASTER 역할 체크 |
| JWT 선택적 | 3 | 있으면 user context, 없으면 anonymous |
| service_role 직접 | 10 | 내부 EF 또는 스케줄러 |
| 공개 | 4 | `generate-template`, `smooth-api`, `submit-contact`, `test-embedding` |

### 5.4 EF 간 내부 호출 관계

```
etl-scheduler ─────────────→ unified-etl
replay-import ─────────────→ unified-etl
ai-batch-qa-test ──────────→ run-simulation
                   └───────→ generate-optimization
sync-api-data ─────────────→ api-connector
              └────────────→ integrated-data-pipeline
integrated-data-pipeline ──→ smart-ontology-mapping
                     └─────→ unified-etl
```

### 5.5 _shared/ 모듈 구조

| 클러스터 | 모듈 | 사용 EF |
|----------|------|---------|
| **AI 최적화** | `calculations/*`, `optimization/*`, `persona/*`, `vmd/*` | `generate-optimization` |
| **AI 인프라** | `aiResponseLogger.ts`, `safeJsonParse.ts` | `generate-optimization`, `advanced-ai-inference`, `run-simulation`, `retail-ai-inference` |
| **챗봇 인프라** | `chatLogger.ts`, `chatEventLogger.ts`, `rateLimiter.ts` | `neuraltwin-assistant` |
| **공통** | `supabase-client.ts`, `errorHandler.ts`, `streamingResponse.ts`, `chatTypes.ts` | 다수 EF |

### 5.6 외부 서비스 맵

| 서비스 | 엔드포인트 | API Key | 사용 EF |
|--------|-----------|---------|---------|
| Lovable AI Gateway | `ai.gateway.lovable.dev/v1/chat/completions` | `LOVABLE_API_KEY` | 11개 EF |
| OpenWeatherMap | `api.openweathermap.org/data/2.5/weather` | `OPENWEATHERMAP_API_KEY` | `environment-proxy` |
| 한국 공공데이터포털 | `apis.data.go.kr/...` | `DATA_GO_KR_API_KEY` | `environment-proxy` |
| Zapier Webhook | `hooks.zapier.com/hooks/catch/...` | (URL에 내장) | `submit-contact` |
| Google AI Embeddings | Generative AI API | `GOOGLE_AI_API_KEY` | `retail-chatbot`, `knowledge-admin` |
| Serper Web Search | `serper.dev` | `SERPER_API_KEY` | `retail-chatbot` |

### 5.7 DB 스키마 관리

```
실제 DB: 153 테이블 + 12 뷰
코드 참조: 76 테이블 (49.7% 커버리지)
미참조: 77 테이블 (프론트 직접, RPC 전용, 마스터, 후속 추가)

타입 생성 명령어:
$ pnpm supabase:gen-types
→ packages/types/src/database.types.ts 자동 업데이트
```

---

## 6. 크로스팀 의존성 (Cross-Team Dependencies)

### 6.1 C → A 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| 온보딩 워크스루 | W5 Day 1-2 | 전체 아키텍처, 팀 현황, 백엔드 인수인계 |
| supabase/ canonical 결정 | W5 | 통합 supabase vs OS supabase 최종 확정 |
| CI/CD 파이프라인 승인 | W7 | GitHub Actions 워크플로우 아키텍처 검토 |
| DB 스키마 변경 승인 | W8 | 미사용 테이블 정리 등 파괴적 변경 |

### 6.2 C → D 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| OS supabase/ 중복 EF diff | W5 | D가 W3에 준비한 diff 리포트 수령 |
| neuraltwin-assistant 로직 소유 | 상시 | 프롬프트, 인텐트 변경은 D 승인 |
| OS EF 호출 경로 업데이트 | W7 | D가 프론트에서 통합 supabase 경로 사용 확인 |

### 6.3 C → E 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| retail-chatbot 로직 소유 | 상시 | 프롬프트, 지식베이스 변경은 E 승인 |
| Website EF 5개 통합 | W6 | E의 website `supabase/functions/` → 통합 supabase 이동 |

### 6.4 C → B 의존

| 항목 | 시점 | 상세 |
|------|------|------|
| IoT EF 요구사항 | W6 | `process-neuralsense-data`, `process-wifi-data` 수정 시 B 조율 |
| MQTT → EF 데이터 스키마 | W6 | B의 MQTT JSON 스키마 → EF 파서 맞춤 |

### 6.5 크로스팀 Sync Points

| 주차 | 참여자 | 안건 |
|------|--------|------|
| W5 Day 1-2 | C + A | 온보딩 워크스루, 백엔드 인수인계 |
| W5 | C + D | supabase/ 중복 EF 현황 공유, 정리 계획 확정 |
| W6 | C + E | Website EF 통합, CORS 중앙화 조율 |
| W6 | C + B | IoT EF 연동 조율 |
| W7 | C + D | OS 중복 EF 제거 실행, _shared/ 통합 |
| W8 | 전체 | 통합 빌드 검증, 배포 테스트 |

---

## 7. 알려진 이슈 & 기술 부채 (Known Issues & Tech Debt)

### 7.1 버전 혼재

| 이슈 | 상세 | 영향 | 수정 시점 |
|------|------|------|-----------|
| @supabase/supabase-js 8개 버전 | 2.7.1 ~ 2.89.0 혼재 | 타입 불일치, Deno에서 다중 버전 로드 → 번들 증가 | W6 (C6.1) |
| `deno.land/std@0.168.0` 레거시 | 일부 EF에서 `serve()` import | Deno 2.x 네이티브 `Deno.serve()` 사용 권장 | W6 (C6.2) |

### 7.2 보안 이슈

| 심각도 | 이슈 | 위치 | 수정 시점 |
|--------|------|------|-----------|
| 🔴 Critical | CORS `*` 전체 허용 (52개 EF) | 모든 EF의 corsHeaders | W6 (C6.3) |
| 🟡 Medium | Zapier webhook URL 하드코딩 | `submit-contact/index.ts` | W6 (환경변수 전환) |
| 🟡 Medium | `environment-proxy` 동적 환경변수 접근 | `Deno.env.get(requestedKey)` | W6 (허용 키 화이트리스트) |
| 🟡 Medium | 10개 EF 인증 없음 (service_role 직접) | 내부 호출 전용이나 외부 접근 가능 | W7 (JWT 또는 API Key 추가) |

### 7.3 아키텍처 부채

| 이슈 | 상세 | 수정 시점 |
|------|------|-----------|
| 3개 supabase/ 디렉토리 공존 | 통합, OS, Website 각각 EF 보유 | W7 (C7.4) — 통합 supabase로 canonical화 |
| `_shared/` 3벌 존재 | 통합, OS, Website 각각 로컬 _shared | W7 (C7.3) |
| neuraltwin-backend/ 빈 프로젝트 | `supabase/neuraltwin-backend/supabase/` 구조 (config.toml만) | W5 — 정리 또는 제거 |
| `super-responder` = `rollback-import` 복제 | 동일 코드의 placeholder | W6 (제거 또는 통합) |

### 7.4 테스트 부채

| 이슈 | 수치 |
|------|------|
| EF 단위 테스트 | **0%** 커버리지 |
| Integration 테스트 | 없음 |
| `ai-batch-qa-test` EF | 존재하나 정기 실행 미확인 |
| DB 마이그레이션 테스트 | 없음 |

### 7.5 문서 부채

| 이슈 | 상세 |
|------|------|
| 153개 중 77개 테이블 미문서화 | 코드 역공학 76개만 문서화 (49.7%) |
| EF API 계약서 없음 | 요청/응답 스키마 문서 없음 |
| RPC 함수 문서 없음 | 17개 RPC 파라미터/반환값 미문서화 |

---

## 8. 검증 체크리스트 (Verification Checklist)

### W5 완료 체크
- [ ] 로컬 개발 환경 구축 — `supabase start` + `supabase functions serve` 정상
- [ ] CLAUDE.md, SYSTEM_ARCHITECTURE.md, REPO_ANALYSIS_C.md 숙지 확인
- [ ] 53개 EF 인벤토리 (`EF_INVENTORY.md`) 완성
- [ ] OS 36개 ↔ 통합 53개 diff 비교 완료
- [ ] @supabase/supabase-js 통일 PoC (5개 EF) 성공

### W6 완료 체크
- [ ] `grep -r "supabase-js@" supabase/supabase/functions/` → `@2.89.0`만 출력
- [ ] deno.json Import Map 확장 — 모든 EF Import Map 경유
- [ ] `grep -r "Access-Control-Allow-Origin.*\*" supabase/supabase/functions/` → 0건
- [ ] `_shared/supabase-client.ts` 공유 클라이언트 모든 EF 사용

### W7 완료 체크
- [ ] `.github/workflows/ci.yml` — PR 생성 시 CI 자동 실행
- [ ] `_shared/` 통합 완료 — 단일 디렉토리
- [ ] OS `supabase/functions/` 중복 제거 또는 최소화

### W8 완료 체크
- [ ] 10개 핵심 EF 테스트 통과, 커버리지 > 20%
- [ ] `.env.example` 3개 파일 정비 완료
- [ ] `pnpm build` (루트) 0 errors
- [ ] 53개 EF 배포 성공 (또는 시뮬레이션)

---

## 9. 참조 파일 (Reference Files)

### 분석 문서
| 파일 | 설명 | 핵심 데이터 |
|------|------|------------|
| `supabase/REPO_ANALYSIS_C.md` | Supabase EF 전체 분석 (1,884줄) | 53 EF, 8 supabase-js 버전, 70,576 LOC |
| `supabase/DB_SCHEMA_DIFF.md` | DB 스키마 비교 | 153 실제 vs 76 문서화 |
| `docs/SYSTEM_ARCHITECTURE.md` | 시스템 아키텍처 | 데이터 흐름, 4개 런타임 |
| `apps/os-dashboard/REPO_ANALYSIS_D.md` | OS Dashboard 분석 | 36개 중복 EF 상세 |

### 설정 파일
| 파일 | 역할 |
|------|------|
| `supabase/supabase/functions/deno.json` | Import Map (@supabase/supabase-js@2.89.0, xlsx@0.18.5) |
| `supabase/supabase/config.toml` | Supabase 로컬 설정 (DB, Auth, Storage, Edge Runtime) |
| `packages/shared/package.json` | @neuraltwin/shared (CORS, env, error) |
| `packages/types/package.json` | @neuraltwin/types (DB 타입) |

### 핵심 코드 파일
| 파일 | 중요도 | 설명 |
|------|--------|------|
| `supabase/supabase/functions/_shared/` | 🔴 | 13개 공유 모듈 — 통합 대상 |
| `supabase/supabase/functions/deno.json` | 🔴 | Import Map — 버전 통일 핵심 |
| `supabase/supabase/functions/neuraltwin-assistant/index.ts` | ⭐ | 34파일 복합 EF (D 로직 소유) |
| `supabase/supabase/functions/advanced-ai-inference/index.ts` | ⭐ | 4,972 LOC 최대 EF |
| `supabase/supabase/functions/unified-etl/index.ts` | ⭐ | 4개 ETL 파이프라인 통합 |
| `supabase/supabase/functions/retail-chatbot/index.ts` | ⭐ | 1,915 LOC (E 로직 소유) |
| `packages/shared/src/cors.ts` | 🔴 | CORS 중앙화 대상 |
| `packages/shared/src/env.ts` | 🔴 | 환경변수 검증 |

---

## 10. 긴급 대응 절차 (Emergency Procedures)

### EF 배포 실패
```
증상: supabase functions deploy 에러
1. Supabase Dashboard → Edge Functions → 에러 로그 확인
2. 로컬 테스트: supabase functions serve <function-name> --env-file .env
3. Deno 타입 체크: deno check supabase/supabase/functions/<name>/index.ts
4. Import Map 확인: deno.json 경로/버전 정확한지
5. 개별 배포: supabase functions deploy <function-name> --project-ref bdrvowacecxnraaivlhr
6. 롤백: Supabase Dashboard → Edge Functions → 이전 버전 선택
```

### EF 런타임 에러
```
증상: 500 에러, 타임아웃, 잘못된 응답
1. Supabase Dashboard → Edge Functions → 해당 함수 로그
2. 요청 재현: curl -X POST https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/<name> \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
3. 환경변수 확인: Supabase Dashboard → Settings → Edge Function Secrets
4. 메모리/타임아웃: EF 기본 150MB/60초 제한 체크
5. DB 연결: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 유효성
6. AI Gateway: ai.gateway.lovable.dev 상태 확인 (LOVABLE_API_KEY)
```

### DB 마이그레이션 실패
```
증상: supabase db push/migration apply 에러
1. 에러 메시지에서 충돌 테이블/컬럼 확인
2. supabase db diff 로 현재 vs 예상 스키마 비교
3. 마이그레이션 파일 SQL 수동 검토
4. 롤백: supabase db reset (로컬만!) — 프로덕션은 절대 금지
5. 프로덕션 롤백: 역방향 마이그레이션 SQL 작성 → A 승인 후 실행
```

### @supabase/supabase-js 버전 충돌
```
증상: 타입 에러, 메서드 미존재, 런타임 에러
1. 해당 EF의 import 문에서 버전 확인
2. deno.json Import Map의 버전과 대조
3. 직접 URL import가 Import Map을 override하는지 확인
4. 임시 조치: 해당 EF만 명시적 버전 지정
5. 근본 해결: Import Map 통일 (C6.1)
```

### CORS 에러
```
증상: 프론트에서 "CORS policy" 에러
1. 브라우저 Network 탭 → OPTIONS preflight 응답 확인
2. EF 코드에서 CORS 헤더 확인 (Access-Control-Allow-Origin, Allow-Headers)
3. Authorization 헤더가 Allow-Headers에 포함되어 있는지
4. Supabase URL에서 /functions/v1/ 경로 정확한지
5. 임시 조치: corsHeaders에 누락 헤더 추가
6. 근본 해결: @neuraltwin/shared getCorsHeaders() 사용 (C6.3)
```

### 에스컬레이션 경로
```
C 자체 해결 시도 (30분)
  → C → A (아키텍처/DB 스키마/크로스팀 이슈)
  → C → D (neuraltwin-assistant/AI EF 로직 이슈)
  → C → E (retail-chatbot/website EF 로직 이슈)
  → C → B (IoT EF/MQTT 데이터 이슈)
```
