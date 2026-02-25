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
│   ├── types/            # @neuraltwin/types (DB, API, Auth 타입)
│   ├── shared/           # @neuraltwin/shared (CORS, 에러, 유틸 — EF용)
│   └── ui/               # @neuraltwin/ui (공유 UI 컴포넌트 — button, input, dialog, card)
├── supabase/
│   └── supabase/
│       ├── functions/    # Edge Functions (~47개, Deno 런타임)
│       │   └── _shared/  # EF 공유 유틸 (cors, env, error, ai/gateway)
│       ├── migrations/   # DB 마이그레이션
│       └── config.toml
├── scripts/              # 유틸리티 스크립트 (smoke-test-ef.sh 등)
├── .github/workflows/    # CI/CD (ci.yml, deploy-functions.yml)
└── docs/                 # 아키텍처, EF 사용 맵, 테이블 사용 맵
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

### 테스트 & 검증
```bash
# 스모크 테스트 (EF OPTIONS preflight)
./scripts/smoke-test-ef.sh [SUPABASE_URL]
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

### 주요 환경변수 — 앱 (Vite)
| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (공개) 키 | Yes |
| `VITE_OPENWEATHERMAP_API_KEY` | 날씨 API 키 | No |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터 API 키 | No |
| `VITE_CALENDARIFIC_API_KEY` | 달력 API 키 | No |

### 주요 환경변수 — Edge Functions (Supabase Secrets)
| 변수 | 설명 | 필수 |
|------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (자동 제공) | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon 키 (자동 제공) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (자동 제공) | Yes |
| `GOOGLE_AI_API_KEY` | Google AI (Gemini) API 키 | Yes |
| `OPENAI_API_KEY` | OpenAI API 키 (fallback) | No |
| `AI_PROVIDER` | AI 제공자 선택: `google` (기본) / `openai` | No |

> **보안 주의**: `.env` 파일은 절대 Git에 커밋하지 마세요. 루트 `.gitignore`에 이미 포함되어 있습니다.

## AI API 구조

Phase 4에서 Lovable AI Gateway에서 직접 API 연결로 전환했습니다:

```
supabase/supabase/functions/_shared/ai/gateway.ts
├── chatCompletion()       — 비스트리밍 (OpenAI 호환 응답)
├── chatCompletionStream() — SSE 스트리밍 (OpenAI 호환)
└── generateEmbedding()    — 벡터 임베딩
```

- **기본 Provider**: Google AI (Gemini 2.5 Flash)
- **Fallback**: OpenAI (gpt-4o-mini)
- **환경변수**: `AI_PROVIDER`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`
- **응답 형식**: OpenAI-compatible (자동 변환)

## 공유 패키지 사용법

### @neuraltwin/types
DB 타입, API 응답 타입, 인증 타입을 제공합니다:
```typescript
import type { Database, Tables, TablesInsert, Enums } from '@neuraltwin/types';
import type { ApiResponse, PaginatedResponse } from '@neuraltwin/types';
import type { AppRole, AuthUser } from '@neuraltwin/types';
```

앱의 Supabase 클라이언트가 이 패키지에서 `Database` 타입을 import합니다:
```typescript
// apps/*/src/integrations/supabase/client.ts
import type { Database } from '@neuraltwin/types';
export const supabase = createClient<Database>(url, key);
```

### @neuraltwin/ui
공유 UI 컴포넌트 (shadcn/ui 기반):
```typescript
import { Button, Input, Card, Dialog } from '@neuraltwin/ui';
```

현재 포함: Button, Input, Dialog, Card.
OS Dashboard는 glassmorphism 커스텀 버전을 로컬에서 유지합니다.

### @neuraltwin/shared
CORS 헤더, 환경변수 검증, 에러 응답 유틸을 제공합니다 (Supabase Edge Functions용):
```typescript
import { getCorsHeaders, handleCorsOptions } from '@neuraltwin/shared';
import { requireEnv, getEnvConfig } from '@neuraltwin/shared';
import { errorResponse } from '@neuraltwin/shared';
```

## 핵심 기술 스택
- Frontend: React 18, Vite 5, TypeScript 5.8, Tailwind CSS 3.4
- Backend: Supabase Edge Functions (Deno), PostgreSQL 17
- IoT: Python, MQTT (paho-mqtt), Raspberry Pi
- AI: Google Gemini 2.5 (직접 API) / OpenAI (fallback)
- 패키지 관리: pnpm workspace + Turborepo
- CI/CD: GitHub Actions → Vercel (프론트엔드), Supabase CLI (Edge Functions)

## 13. 핵심 수치 (현재 → 목표)

## CI/CD

### GitHub Actions
- `.github/workflows/ci.yml` — PR → type-check, lint, build
- `.github/workflows/deploy-functions.yml` — push main → EF 자동 배포

### 배포
- 프론트엔드: Vercel (각 앱별 `vercel.json` 포함)
- Edge Functions: Supabase CLI via GitHub Actions

## 트러블슈팅

### 포트 충돌
```bash
lsof -i :5173
pnpm dev:website -- --port 5175
```

### 빌드 에러
```bash
pnpm clean
pnpm install
pnpm build
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
