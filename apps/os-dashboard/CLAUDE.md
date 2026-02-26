# OS Dashboard — D (DT Lead) 개발 가이드

## 역할
apps/os-dashboard/ 전체 개발을 담당합니다.
3D 매장 시각화, 데이터 대시보드, OS 챗봇 연동을 포함합니다.

## 코드 소유권
- `apps/os-dashboard/` — D 주 소유 (E와 프론트엔드 공동 관리)
- `supabase/functions/neuraltwin-assistant/` — D 주 소유 (A 도메인 검증 필수)

## 기술 스택 & 버전 고정
- React 18 + TypeScript 5.8 + Vite 5
- Three.js **@0.169.0** (버전 고정 필수, 절대 업그레이드하지 말 것)
- @react-three/fiber + @react-three/drei
- Zustand (상태관리)
- @tanstack/react-query (서버 상태)
- recharts / d3 (2D 차트)
- Tailwind CSS 3.4
- Supabase Realtime (postgres_changes + Broadcast + Presence)

## 디렉토리 구조 규칙

```
apps/os-dashboard/src/
├── components/          # UI 컴포넌트
│   ├── dashboard/       # 대시보드 관련
│   ├── three/           # 3D 관련 컴포넌트
│   └── chat/            # OS 챗봇 UI
├── stores/              # Zustand 스토어 (반드시 이 디렉토리에 생성)
├── hooks/               # 커스텀 훅
├── pages/               # 라우트 페이지
├── lib/                 # 유틸리티
└── integrations/
    └── supabase/        # Supabase 클라이언트 (Database 타입 import)
```

## 핵심 규칙

### 상태관리
1. Zustand 스토어는 반드시 `src/stores/` 디렉토리에 위치
2. 서버 상태는 @tanstack/react-query 사용 (Zustand로 서버 상태 관리 금지)
3. 스토어 네이밍: `use{Domain}Store.ts` (예: `useFloorPlanStore.ts`)

### 3D 성능
1. 데스크톱: 60fps 유지 필수
2. 모바일: 30fps 이상
3. GLB 모델은 반드시 Draco 압축 적용
4. 대형 씬은 `React.lazy()` + `Suspense`로 코드 분할
5. `useFrame()` 내부에서 setState 호출 금지 — ref 사용
6. 메모리 누수 방지: `useEffect` cleanup에서 geometry/material dispose

### Realtime
1. 채널명 규칙: `{domain}-{action}-{id?}` (예: `store-update-123`)
2. 구독은 컴포넌트 마운트 시 시작, 언마운트 시 반드시 해제
3. Realtime 훅은 `src/hooks/useRealtime{Domain}.ts`에 정의

### 타입
1. DB 타입은 `@neuraltwin/types`에서 import
2. 컴포넌트 props는 인라인 정의 금지 — 별도 `types.ts`에 정의
3. any 타입 사용 금지

### Import
1. 공유 UI: `@neuraltwin/ui`에서 import (Button, Input, Card, Dialog)
2. OS 전용 glassmorphism 컴포넌트는 로컬에서 유지
3. Supabase 클라이언트: `@/integrations/supabase/client`에서 import

### 챗봇 (neuraltwin-assistant)
1. Edge Function 경로: `supabase/functions/neuraltwin-assistant/`
2. 프롬프트 변경 시 반드시 A에게 도메인 검증 요청
3. RPC 함수 호출 시 에러 핸들링 필수
4. 응답 형식은 OpenAI-compatible (gateway.ts 사용)

## 빌드 & 테스트

```bash
pnpm --filter os-dashboard dev          # 개발 서버 (포트 5174)
pnpm --filter os-dashboard build        # 프로덕션 빌드
pnpm --filter os-dashboard type-check   # 타입 검증
```

## E와의 협업 경계
- E는 OS Dashboard 프론트엔드 공동 담당 (CODEOWNERS: @D @E)
- UI/UX 변경은 E와 사전 합의
- 공유 UI 컴포넌트 변경 요청은 E에게 전달
- packages/@neuraltwin/ui/ 직접 수정 금지 — E의 영역
