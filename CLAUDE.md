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
- `pnpm install` — 의존성 설치
- `pnpm dev:website` — 웹사이트 개발 서버
- `pnpm dev:os` — OS 대시보드 개발 서버
- `pnpm build` — 전체 빌드
- `pnpm type-check` — 타입 체크

## 핵심 기술 스택
- Frontend: React 18, Vite 5, TypeScript 5.8, Tailwind CSS 3.4
- Backend: Supabase Edge Functions (Deno), PostgreSQL 17
- IoT: Python, MQTT (paho-mqtt), Raspberry Pi
- AI: Google Gemini 2.5 (via Lovable AI Gateway)
- 패키지 관리: pnpm workspace + Turborepo

## Supabase 프로젝트
- ID: bdrvowacecxnraaivlhr
- Region: ap-northeast-1 (Tokyo)
