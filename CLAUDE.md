# NEURALTWIN 모노레포

## 프로젝트 개요
NeuralTwin은 오프라인 리테일 매장의 고객 행동을 IoT 센서로 수집하고,
AI로 분석하여 매장 최적화를 지원하는 플랫폼입니다.

## 디렉토리 구조
```
neuraltwin/
├── apps/
│   ├── website/          # 마케팅 웹사이트 + AI 채팅 (React + Vite)
│   ├── os-dashboard/     # 매장 관리 대시보드 (React + Vite + Three.js)
│   └── neuralsense/      # IoT 센서 시스템 (Python, pnpm 외부)
├── packages/
│   ├── types/            # @neuraltwin/types (공유 TypeScript 타입)
│   ├── shared/           # @neuraltwin/shared (CORS, 에러, 유틸)
│   ├── ui/               # @neuraltwin/ui (공유 UI 컴포넌트)
│   └── tailwind-preset/  # @neuraltwin/tailwind-preset (디자인 토큰)
├── supabase/
│   ├── functions/        # Edge Functions (~60개, Deno 런타임)
│   ├── migrations/       # DB 마이그레이션
│   └── config.toml
└── docs/                 # API 계약서, 아키텍처 문서
```

## 빌드 & 실행

### 전체 빌드
```bash
pnpm install          # 의존성 설치 (루트에서 실행)
pnpm build            # 전체 워크스페이스 빌드 (Turborepo)
pnpm type-check       # 전체 타입 체크
pnpm lint             # 전체 린트
```

### 앱별 개발 서버
```bash
pnpm dev:website      # 웹사이트 개발 서버 (기본 포트 5173)
pnpm dev:os           # OS 대시보드 개발 서버 (기본 포트 5174)
```

### Supabase 로컬 개발
```bash
pnpm supabase:start              # Supabase 로컬 인스턴스 시작
pnpm supabase:functions:serve    # Edge Functions 로컬 서빙
pnpm supabase:gen-types          # DB 타입 재생성 → packages/types/src/database.types.ts
```

## 환경변수 설정

### 필수 설정
각 앱 디렉토리에 `.env` 파일을 생성하세요. `.env.example` 파일을 참고하세요:
```bash
cp apps/website/.env.example apps/website/.env
cp apps/os-dashboard/.env.example apps/os-dashboard/.env
```

### 주요 환경변수
| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (공개) 키 | Yes |
| `VITE_OPENWEATHERMAP_API_KEY` | 날씨 API 키 | No |
| `VITE_DATA_GO_KR_API_KEY` | 공공데이터 API 키 | No |
| `VITE_CALENDARIFIC_API_KEY` | 달력 API 키 | No |

> **보안 주의**: `.env` 파일은 절대 Git에 커밋하지 마세요. 루트 `.gitignore`에 이미 포함되어 있습니다.

## 공유 패키지 사용법

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

## 핵심 기술 스택
- Frontend: React 18, Vite 5, TypeScript 5.8, Tailwind CSS 3.4
- Backend: Supabase Edge Functions (Deno), PostgreSQL 17
- IoT: Python, MQTT (paho-mqtt), Raspberry Pi
- AI: Google Gemini 2.5 (via Lovable AI Gateway)
- 패키지 관리: pnpm workspace + Turborepo

## Supabase 프로젝트
- ID: bdrvowacecxnraaivlhr
- Region: ap-northeast-1 (Tokyo)

## 트러블슈팅

### 포트 충돌
개발 서버가 이미 사용 중인 포트로 시작하려 할 때:
```bash
# 사용 중인 포트 확인
lsof -i :5173
# 또는 다른 포트로 실행
pnpm dev:website -- --port 5175
```

### 빌드 에러
```bash
# 캐시 초기화 후 재빌드
pnpm clean
pnpm install
pnpm build
```

### 타입 에러 (database.types.ts)
DB 스키마 변경 후 타입이 맞지 않을 때:
```bash
pnpm supabase:gen-types   # 타입 재생성
pnpm type-check           # 타입 검증
```

### pnpm 의존성 문제
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```
