# NEURALTWIN 모노레포

> **Version**: 1.0 | 2026-02-25
> **Audience**: 전체 Claude Code 에이전트 및 팀원 (A~E)

---

## 1. 프로젝트 개요

NeuralTwin은 오프라인 리테일 매장의 고객 행동을 IoT 센서로 수집하고,
AI로 분석하여 매장 최적화를 지원하는 SaaS 플랫폼입니다.

**핵심 파이프라인**: IoT 센서 (WiFi Probe) → 실시간 데이터 수집 → AI 분석 (Gemini 2.5) → 리테일 인사이트 → 매장 최적화

---

## 2. 디렉토리 구조

```
neuraltwin/
├── apps/
│   ├── website/              # 마케팅 웹사이트 + AI 채팅 (React + Vite) — E 담당
│   ├── os-dashboard/         # 매장 관리 대시보드 (React + Vite + Three.js) — D 담당
│   └── neuralsense/          # IoT 센서 시스템 (Python, pnpm 외부) — B 담당
├── packages/
│   ├── types/                # @neuraltwin/types (공유 TypeScript 타입) — C (합류 전 A)
│   ├── shared/               # @neuraltwin/shared (CORS, 에러, 유틸) — C (합류 전 A)
│   ├── ui/                   # @neuraltwin/ui (공유 UI 컴포넌트) — E
│   └── tailwind-preset/      # @neuraltwin/tailwind-preset (디자인 토큰) — E
├── supabase/
│   └── supabase/
│       └── functions/        # Edge Functions (~52개, Deno 런타임) — C (합류 전 A)
│           ├── _shared/      # 공유 유틸리티 (13개 모듈)
│           └── deno.json     # Import Map
├── .github/
│   ├── workflows/            # CI/CD (C 담당)
│   └── CODEOWNERS            # 코드 소유권 (A 관리)
├── docs/
│   └── work-guides/          # 팀원별 작업 가이드
├── turbo.json                # Turborepo 태스크 설정
├── pnpm-workspace.yaml       # pnpm 워크스페이스 설정
├── CLAUDE.md                 # 이 파일 (전체 에이전트 가이드라인)
└── .env.example              # 환경변수 템플릿
```

---

## 3. 빌드 & 실행

### 전체 빌드
```bash
pnpm install                    # 의존성 설치 (루트에서 실행)
pnpm build                      # 전체 워크스페이스 빌드 (Turborepo)
pnpm type-check                 # 전체 타입 체크
pnpm lint                       # 전체 린트
```

### 앱별 개발 서버
```bash
pnpm dev:website                # 웹사이트 개발 서버 (기본 포트 5173)
pnpm dev:os                     # OS 대시보드 개발 서버 (기본 포트 5174)
```

### Supabase 로컬 개발
```bash
pnpm supabase:start             # Supabase 로컬 인스턴스 시작
pnpm supabase:functions:serve   # Edge Functions 로컬 서빙
pnpm supabase:gen-types         # DB 타입 재생성 → packages/types/src/database.types.ts
```

### Python (NeuralSense)
```bash
cd apps/neuralsense && pip install -r requirements.txt
ruff check .                    # Python 린트
mypy .                          # Python 타입 체크
pytest                          # Python 테스트
```

### Supabase Edge Functions 배포
```bash
supabase functions deploy <function-name> --project-ref bdrvowacecxnraaivlhr
```

---

## 4. 환경변수 설정

### 필수 설정
각 앱 디렉토리에 `.env` 파일을 생성하세요. `.env.example` 파일을 참고하세요:
```bash
cp apps/website/.env.example apps/website/.env
cp apps/os-dashboard/.env.example apps/os-dashboard/.env
```

### 주요 환경변수
| 변수 | 설명 | 필수 | 사용처 |
|------|------|:----:|--------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Yes | website, os-dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (공개) 키 | Yes | website, os-dashboard |
| `SUPABASE_URL` | Supabase 프로젝트 URL (서버) | Yes | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | Yes | Edge Functions |
| `LOVABLE_API_KEY` | AI Gateway 키 (Gemini 2.5) | Yes | Edge Functions |
| `GOOGLE_AI_API_KEY` | Google AI 임베딩 키 | Yes | retail-chatbot, knowledge-admin |
| `SERPER_API_KEY` | 웹 검색 API 키 | No | retail-chatbot |
| `VITE_OPENWEATHERMAP_API_KEY` | 날씨 API 키 | No | environment-proxy |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터 API 키 | No | environment-proxy |
| `VITE_CALENDARIFIC_API_KEY` | 달력 API 키 | No | environment-proxy |
| `MQTT_BROKER_IP` | MQTT 브로커 IP | No | neuralsense |
| `MQTT_BROKER_PORT` | MQTT 브로커 포트 | No | neuralsense |

> **보안 필수 규칙**:
> - `.env` 파일은 **절대** Git에 커밋하지 마세요. 루트 `.gitignore`에 이미 포함되어 있습니다.
> - 커밋 전 반드시 `git diff --cached`로 `.env` 파일 포함 여부를 확인하세요.
> - 하드코딩된 API 키, URL, 시크릿은 반드시 환경변수로 전환하세요.

---

## 5. 공유 패키지 사용법

### @neuraltwin/types
DB 타입, API 응답 타입, 인증 타입을 제공합니다:
```typescript
import type { Tables, TablesInsert, Enums } from '@neuraltwin/types';

// 테이블 Row 타입
type Store = Tables<'stores'>;

// Insert 타입
type NewStore = TablesInsert<'stores'>;

// Enum 타입
type Role = Enums<'app_role'>;

// API 응답 타입
import type { ApiResponse, PaginatedResponse } from '@neuraltwin/types';
```

### @neuraltwin/shared
CORS 헤더, 환경변수 검증, 에러 응답 유틸을 제공합니다 (Supabase Edge Functions용):
```typescript
import { getCorsHeaders, handleCorsOptions } from '@neuraltwin/shared';
import { requireEnv, getEnvConfig } from '@neuraltwin/shared';
import { errorResponse } from '@neuraltwin/shared';

// Edge Function 예시
Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const { supabaseUrl, supabaseServiceKey } = getEnvConfig();
  // ...
});
```

### @neuraltwin/ui (계획)
공유 UI 컴포넌트 (Chat UI Kit, shadcn/ui 공통 컴포넌트):
```typescript
import { ChatBubble, ChatInput, TypingIndicator } from '@neuraltwin/ui';
// variant prop으로 테마 전환
<ChatBubble variant="website" /> // 또는 variant="os"
```

### @neuraltwin/tailwind-preset (계획)
디자인 토큰 프리셋 (colors, spacing, fonts):
```javascript
// apps/website/tailwind.config.ts
import preset from '@neuraltwin/tailwind-preset';
export default { presets: [preset], /* app-specific overrides */ };
```

---

## 6. 핵심 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.19 |
| Language | TypeScript | 5.8.3 |
| CSS | Tailwind CSS | 3.4.17 |
| UI Components | shadcn/ui (Radix) | latest |
| State (OS) | Zustand | 5.0.9 |
| Server State | @tanstack/react-query | 5.83.0 |
| Backend | Supabase Edge Functions | Deno 2.x |
| Database | PostgreSQL | 17 |
| DB Client | @supabase/supabase-js | 2.89.0 (목표 통일 버전) |
| IoT | Python + paho-mqtt | 3.11+ / 2.1.0 |
| AI | Google Gemini 2.5 | via Lovable AI Gateway |
| 3D Rendering | Three.js + @react-three/fiber | 0.160.x / 8.18.0 |
| Package Manager | pnpm + Turborepo | 9.15.0 / 2.x |
| Validation | Zod | 3.x (website) / 4.x (os-dashboard) |

### AI API 호출 패턴 (필독)
모든 AI 호출은 Lovable API Gateway를 경유합니다. **절대 직접 API 호출 금지.**
```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'gemini-2.5-pro',   // 웹 챗봇
    // model: 'gemini-2.5-flash', // OS 챗봇
    messages: [...],
    stream: true,
  }),
});
```

---

## 7. Supabase 프로젝트 정보

| 항목 | 값 |
|------|-----|
| Project ID | `bdrvowacecxnraaivlhr` |
| Region | `ap-northeast-1` (Tokyo) |
| Database | PostgreSQL 17 (153개 테이블, 12개 뷰, 2개 Enum) |
| EF Runtime | Deno 2.x |
| Storage 버킷 | `user-imports`, `3d-models`, `store-data` |
| Local API Port | 54321 |
| Local Studio Port | 54323 |

### API 응답 표준 포맷
```typescript
// 성공
{ success: true, data: T, stats?: Record<string, any> }
// 에러
{ success: false, error: { code: string, message: string, details?: unknown } }
// 페이지네이션
{ success: true, data: T[], pagination: { page, pageSize, total, totalPages } }
```

---

## 8. 팀 구성 및 코드 소유권

| 멤버 | 역할 | 코드 소유 영역 | Claude 프로젝트 |
|------|------|---------------|----------------|
| **A** (CEO) | 총괄 아키텍트, Orchestrator | `packages/types/`, `CLAUDE.md`, `.github/CODEOWNERS`, AI 프롬프트 | `neuraltwin-orchestrator` |
| **B** (CTO) | IoT & Hardware Lead | `apps/neuralsense/` | `neuraltwin-iot` |
| **E** (CDTO) | Web Frontend & Marketing | `apps/website/`, `packages/ui/`, `packages/tailwind-preset/` | `neuraltwin-web` |
| **D** (DT Lead) | OS Dashboard 핵심 개발 | `apps/os-dashboard/`, neuraltwin-assistant EF | `neuraltwin-dt` |
| **C** (Backend) | 백엔드 엔지니어 (W5 합류) | `supabase/`, `packages/shared/`, `.github/workflows/` | `neuraltwin-backend` |

### 팀원별 작업 가이드
각 팀원의 상세 작업 가이드는 `docs/work-guides/`에 위치합니다:
- `WORK_GUIDE_A.md` — A (CEO) + Orchestrator Agents
- `WORK_GUIDE_B.md` — B (CTO) + IoT Agent Team
- `WORK_GUIDE_C.md` — E (CDTO) + Web Frontend Agent Team
- `WORK_GUIDE_D.md` — D (DT Lead) + Digital Twin Agent Team
- `WORK_GUIDE_E.md` — C (Backend) + Backend Agent Team

---

## 9. 크로스팀 의존성 매트릭스

**공유 리소스를 수정하려 할 때 반드시 아래 표를 확인하고 해당 소유자/조율 대상에게 알리세요.**

| 공유 리소스 | 소유자 | 변경 시 조율 대상 | 비고 |
|-------------|--------|------------------|------|
| `packages/@neuraltwin/types/` | C (합류 전: A) | **전원** | 타입 변경은 전 서비스에 영향 |
| `packages/@neuraltwin/shared/` | C (합류 전: A) | E, D | EF 공유 유틸 의존 |
| `packages/@neuraltwin/ui/` | E | D | OS에서도 사용 |
| `packages/@neuraltwin/tailwind-preset/` | E | D | 공유 디자인 토큰 |
| `supabase/functions/_shared/` | C (합류 전: A) | E, D | 챗봇 EF가 의존 |
| `supabase/migrations/` | C (합류 전: A) | **전원** | DB 스키마 변경 |
| `.env.example` | C (합류 전: A) | **전원** | 환경변수 목록 변경 |
| `pnpm-workspace.yaml` | C (합류 전: A) | **전원** | 워크스페이스 구조 변경 |
| `turbo.json` | C (합류 전: A) | A (아키텍처 승인) | 빌드 파이프라인 변경 |
| `.github/CODEOWNERS` | A | **전원** | 코드 소유권 변경 |
| `CLAUDE.md` (root) | A | **전원** | 가이드라인 변경 |
| `deno.json` (Import Map) | C | E, D | EF 의존성 변경 |
| MQTT payload schema | B | C (DB 매핑), D (표시) | IoT 데이터 구조 변경 |

---

## 10. 전 에이전트 필수 규칙

### 10.1 빌드 & 검증

1. `packages/@neuraltwin/types/` 수정 후 반드시 `pnpm build`로 전체 빌드 확인
2. PR 생성 전 반드시 `pnpm type-check` 실행
3. 공유 패키지 변경 시 의존하는 앱의 빌드도 확인

### 10.2 보안

1. `.env` 파일 **절대 커밋 금지** — 커밋 전 `.gitignore` 반드시 확인
2. API 키, 시크릿, 토큰을 소스 코드에 하드코딩 금지
3. `SUPABASE_SERVICE_ROLE_KEY`는 RLS 우회가 필요한 경우에만 사용 — 가능하면 `SUPABASE_ANON_KEY` + RLS 정책 사용
4. CORS 헤더는 `_shared/cors.ts`에서 관리 — 개별 EF에 하드코딩 금지

### 10.3 코드 품질

1. 모든 Edge Function은 `deno.json` Import Map을 통해 의존성 import (직접 URL import 금지)
2. AI 호출은 반드시 Lovable Gateway 경유 (`LOVABLE_API_KEY` 사용)
3. Supabase 타입은 `@neuraltwin/types`에서 import
4. 새 EF 추가 시 표준 응답 포맷 (`{ success, data/error }`) 준수

### 10.4 협업

1. 공유 리소스 충돌 감지 시 **즉시 중단** → Orchestrator(A)에 알림
2. 크로스서비스 변경 시 `.github/CODEOWNERS`에서 필수 리뷰어 확인
3. DB 스키마 변경 후 반드시 `pnpm supabase:gen-types` 실행하여 타입 재생성
4. 팀원 간 의존 태스크는 해당 가이드의 "크로스팀 동기화 포인트" 확인

---

## 11. 에스컬레이션 프로토콜

```
개별 Sub-Agent → 팀 리드의 Main Agent → Orchestrator (A)
                                              │
                                        의사결정 후
                                              │
                                        관련 팀에 전달
```

### Level 1: 서브에이전트 자체 해결
- CLAUDE.md 지시문과 참조 파일을 기반으로 해결 시도
- 30분 이상 블로킹되면 Level 2로 에스컬레이션

### Level 2: 팀 리드 에이전트
- 해당 팀원의 메인 Claude 에이전트가 이슈 리뷰
- 크로스팀 조율이 필요하면 Level 3으로 에스컬레이션

### Level 3: Orchestrator (A)
- A의 Claude Orchestrator가 크로스서비스 영향도 평가
- 아키텍처 결정 후 관련 팀에 전달

---

## 12. 8주 통합 프로젝트 타임라인 요약

| 주차 | A (CEO) | B (CTO/IoT) | E (CDTO/Web) | D (DT Lead) | C (Backend, W5 합류) |
|:----:|---------|-------------|--------------|-------------|---------------------|
| **W1** | 모노레포 스캐폴딩, 보안 수정 | 구조 검토 | Import 경로 감사 | Import 경로 감사 | — |
| **W2** | types v0.1, CODEOWNERS | 코드 정리, utils.py | Import 경로 마이그레이션 | Import 경로 마이그레이션 | — |
| **W3** | Import 마이그레이션 조율 | MQTT 스키마, paho-mqtt v2 | UI Kit 추출 시작 | OS supabase/ 중복 제거 | — |
| **W4** | UI Kit 리뷰 | Pi 배포 자동화 | tailwind-preset, Vercel | Zod/Three.js 통일 | — |
| **W5** | C 온보딩, 백엔드 인수인계 | Python CI | Lovable 의존성 제거 | 공유 UI 소비 | 온보딩, 구조 파악 |
| **W6** | B+C 브릿지 조율 | Supabase 브릿지 (C 공동) | CORS 수정, SEO | 3D 디지털 트윈 | supabase-js 통일, _shared/ 통합 |
| **W7** | 통합 테스트 조율 | E2E IoT 테스트 | 통합 테스트 | 통합 테스트 | CI/CD, CORS 중앙화 |
| **W8** | 최종 안정화, KPI 검증 | 문서화, 배포 가이드 | 성능 최적화 | UX 마무리 | 테스팅, DB 문서화 |

---

## 13. 핵심 수치 (현재 → 목표)

| 지표 | 현재값 | 목표값 (8주 후) |
|------|--------|----------------|
| `@supabase/supabase-js` 버전 수 | 11개 (52파일) | **1개** (`@2.89.0`) |
| `_shared/` 디렉토리 수 | 2개 (별도) | **1개** (통합) |
| Chat UI 코드 중복 | ~2,500 LOC | **0** (패키지화) |
| `.env` Git 노출 | 노출 위험 | **해소** |
| 자동 테스트 커버리지 | 0% | **>20%** |
| CI/CD 파이프라인 | 없음 | **PR 자동 검증 + 자동 배포** |
| Edge Functions | 52개 (7개 alias 포함) | 45개 (alias 제거, import 통합) |
| 빌드 시간 목표 | 측정 불가 | **<5분** (Turborepo) |

---

## 14. 트러블슈팅

### 포트 충돌
```bash
lsof -i :5173                           # 사용 중인 포트 확인
pnpm dev:website -- --port 5175         # 다른 포트로 실행
```

### 빌드 에러
```bash
pnpm clean && pnpm install && pnpm build  # 캐시 초기화 후 재빌드
```

### 타입 에러 (database.types.ts)
```bash
pnpm supabase:gen-types                 # DB 스키마 변경 후 타입 재생성
pnpm type-check                         # 타입 검증
```

### pnpm 의존성 문제
```bash
rm -rf node_modules && rm pnpm-lock.yaml && pnpm install
```

### Edge Function 배포 실패
```bash
supabase functions deploy <name> --project-ref bdrvowacecxnraaivlhr --debug
# deno.json Import Map이 올바른지 확인
# _shared/ 의존성이 모두 존재하는지 확인
```

### MQTT 연결 문제 (NeuralSense)
```bash
# 브로커 연결 테스트
mosquitto_pub -h 100.87.27.7 -p 1883 -t "test" -m "hello"
# Tailscale VPN 연결 상태 확인
tailscale status
```
