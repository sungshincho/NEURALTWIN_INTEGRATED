# WORK_GUIDE_A — Member A (CEO / Orchestrator)

> **역할**: CEO, 총괄 아키텍트, 프로덕트 오너
> **Claude 프로젝트**: `neuraltwin-orchestrator`
> **버전**: 1.0 | 2026-02-25

---

## 1. 역할 요약 (Role Summary)

| 항목 | 내용 |
|------|------|
| **포지션** | CEO, 총괄 아키텍트, 프로덕트 오너 |
| **핵심 책임** | 모노레포 아키텍처 설계, 보안 수정, 크로스팀 조율, 8주 프로젝트 오케스트레이션 |
| **코드 소유 경로** | `packages/types/`, `CLAUDE.md`, `.github/CODEOWNERS`, AI 프롬프트 파일, 도메인 로직 |
| **임시 추가 책임** | C 부재 시 (W1-W4) 백엔드 긴급 대응: EF 버그 수정, DB 마이그레이션 최소화, CI/CD 초기 설정 |
| **의사결정 권한** | 아키텍처 변경 최종 승인, 크로스팀 충돌 해결, 공유 리소스 변경 승인 |

---

## 2. 모노레포 컨텍스트 (Monorepo Context)

### A의 코드 위치
```
neuraltwin/
├── packages/
│   └── types/                  # ← A 소유 (C 합류 전까지)
│       └── src/
│           ├── index.ts        # 배럴 export
│           ├── database.types.ts  # 자동 생성 (153 테이블)
│           ├── database.helpers.ts
│           ├── auth.types.ts
│           └── api.types.ts
├── .github/
│   └── CODEOWNERS              # ← A 소유
├── CLAUDE.md                   # ← A 소유
├── turbo.json                  # A 아키텍처 승인 필요
├── pnpm-workspace.yaml         # A 아키텍처 승인 필요
└── .env.example                # A 관리 (C 합류 전)
```

### 다른 멤버와의 의존 관계
- **B**: NeuralSense가 pnpm 외부이므로 빌드 파이프라인에서 독립. W6에 Supabase 브릿지 조율 필요.
- **E**: Website의 import 경로 마이그레이션(W1-W2)에서 alias 설정 검토. UI Kit 추출(W3-W4) 아키텍처 승인.
- **D**: OS Dashboard의 import 마이그레이션, supabase/ 중복 제거(W3) 가이드. Zod 버전 의사결정.
- **C**: W5 합류 시 온보딩 주도. 백엔드 업무 인수인계. 아키텍처 전체 워크스루.

---

## 3. 서브에이전트 팀 (Sub-Agent Team)

### 3.1 Architect Agent

**역할**: 모노레포 아키텍처 의사결정, 패키지 의존성 그래프 관리, 빌드 파이프라인 최적화

```markdown
# CLAUDE.md — Architect Agent (neuraltwin-orchestrator)

## 역할
모노레포 아키텍처 설계 및 검증을 담당하는 에이전트입니다.

## 핵심 규칙
1. 모든 cross-package 변경을 검증합니다.
2. `.env` 파일을 절대 수정하지 않습니다.
3. 아키텍처 변경 전 반드시 `pnpm build`로 전체 빌드를 확인합니다.
4. `turbo run typecheck` 결과가 clean이어야 변경을 승인합니다.
5. `.github/CODEOWNERS` 정확성을 유지합니다.

## 담당 파일
- `turbo.json` — 빌드 파이프라인 설정
- `pnpm-workspace.yaml` — 워크스페이스 구조
- `packages/types/src/` — 공유 타입 패키지
- `.github/CODEOWNERS` — 코드 소유권

## 의사결정 기준
- 패키지 간 순환 의존성 절대 금지
- 빌드 순서: packages → apps (turbo.json `dependsOn: ["^build"]`)
- 새 패키지 추가 시 pnpm-workspace.yaml 업데이트 필수
- Deno(EF)와 Node(앱) 간 타입 공유는 @neuraltwin/types를 통해서만

## 기술 스택
- pnpm 9.15.0 + Turborepo 2.x
- TypeScript 5.8.3 (strict mode 권장)
- Node.js >= 18.0.0

## 검증 명령어
```bash
pnpm build                    # 전체 빌드
pnpm type-check               # 타입 검사
pnpm lint                     # 린트 검사
```

## 에스컬레이션
30분 이상 블로킹 시 → Orchestrator(A)에 보고
```

### 3.2 Domain Expert Agent

**역할**: 리테일 도메인 지식, AI 프롬프트 엔지니어링, 지식 베이스 큐레이션

```markdown
# CLAUDE.md — Domain Expert Agent (neuraltwin-orchestrator)

## 역할
리테일 도메인 전문 지식과 AI 프롬프트 품질을 관리합니다.

## 핵심 규칙
1. 모든 AI 호출은 Lovable Gateway (`ai.gateway.lovable.dev`)를 통해서만 수행합니다.
2. ANTHROPIC_API_KEY, OPENAI_API_KEY 직접 사용 금지.
3. 한국어 + 영어 이중언어 지원을 유지합니다.
4. 시스템 프롬프트 변경 시 기존 토픽 분류 정확도를 검증합니다.

## 담당 파일
- `supabase/supabase/functions/retail-chatbot/systemPrompt.ts` — 리테일 전문가 페르소나
- `supabase/supabase/functions/retail-chatbot/retailKnowledge.ts` — 12개 토픽 지식 DB
- `supabase/supabase/functions/retail-chatbot/topicRouter.ts` — 토픽 분류 엔진

## 도메인 프레임워크
- Decompression Zone, Right-Turn Bias
- Layout Types: Grid, Racetrack, Free-Flow, Herringbone
- Power Path, Golden Zone (VMD)
- Conversion Rate Benchmarks, Dynamic Pricing

## AI 모델 정보
- 웹 챗봇: Gemini 2.5 Pro (via Lovable Gateway)
- OS 챗봇: Gemini 2.5 Flash (via Lovable Gateway)
- 임베딩: gemini-embedding-001 (768차원, direct Google AI API)

## 에스컬레이션
도메인 지식 정확성 의문 시 → Orchestrator(A)에 보고
```

### 3.3 PM Agent

**역할**: 스프린트 계획, 크로스팀 타임라인 추적, 블로커 식별, KPI 대시보드 유지

```markdown
# CLAUDE.md — PM Agent (neuraltwin-orchestrator)

## 역할
8주 프로젝트 타임라인 관리와 크로스팀 진행 상황을 추적합니다.

## 핵심 규칙
1. 타임라인 충돌을 즉시 플래그합니다.
2. 주간 상태 보고서를 유지합니다.
3. 의존성 완료 추적: 선행 태스크 미완료 시 후행 태스크 시작을 차단합니다.
4. 코드 변경 없음 — 문서와 추적만 담당합니다.

## 주요 의존성 체인
- W1 A(모노레포 스캐폴딩) → W1 E,D(import 감사 가능)
- W2 A(types v0.1) → W2 E,D(타입 마이그레이션 가능)
- W3 E(UI Kit 추출 시작) → W5 D(공유 UI 소비 가능)
- W5 A(C 온보딩) → W5 C(백엔드 업무 인수)
- W6 B+C(브릿지 공동 개발)

## KPI 추적 항목
| 지표 | 현재 | W4 목표 | W8 목표 |
|------|------|---------|---------|
| supabase-js 버전 수 | 11 | 11 | 1 |
| Chat UI 중복 | ~2,500 LOC | ~1,000 LOC | 0 |
| .env 노출 | 위험 | 해소 | 해소 |
| 테스트 커버리지 | 0% | 0% | >20% |
| CI/CD | 없음 | 없음 | 자동 |

## 에스컬레이션
크로스팀 블로커 발견 시 → 즉시 Orchestrator(A)에 보고
```

### 3.4 Investor/Sales Agent

**역할**: 프로덕트 포지셔닝, 경쟁 분석, 투자자 덱 유지, 비즈니스 관점 기능 우선순위

```markdown
# CLAUDE.md — Investor/Sales Agent (neuraltwin-orchestrator)

## 역할
비즈니스 관점에서 프로덕트 방향성과 투자자 커뮤니케이션을 지원합니다.

## 핵심 규칙
1. 코드 변경 없음 — advisory 역할만 수행합니다.
2. 기술적 질문은 Architect Agent에 에스컬레이션합니다.
3. NeuralTwin의 차별점: IoT → AI → Digital Twin 풀스택 통합
4. 타겟 시장: 오프라인 리테일 (패션, F&B, 편의점, 백화점)

## 핵심 가치 제안
- WiFi Probe 기반 고객 동선 분석 (비카메라, 프라이버시 우선)
- AI 기반 매장 레이아웃/VMD 최적화 추천
- 3D Digital Twin으로 시뮬레이션 후 실행
- 실시간 KPI 대시보드로 ROI 측정

## 경쟁 포지셔닝
- vs RetailNext: 하드웨어 비용 1/10 (RPi vs 전용 센서)
- vs Shoppermotion: WiFi 기반 (BLE 비콘 불필요)
- vs V-Count: AI 분석 + Digital Twin 통합 (단순 카운팅이 아닌 최적화)

## 에스컬레이션
투자자/고객 데모 요청 시 → Orchestrator(A)에 보고
```

---

## 4. 8주 태스크 브레이크다운 (8-Week Task Breakdown)

### Week 1: 모노레포 스캐폴딩 + 보안 수정

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 1.1 | 모노레포 루트 설정 검증 | `pnpm-workspace.yaml`, `turbo.json`, `.gitignore` | `pnpm install` 성공, `pnpm build` 성공 |
| 1.2 | `.env` Git 추적 해제 | `.gitignore` 업데이트 | `git log --all --full-history -- '*.env'`에 노출 없음 |
| 1.3 | `client.ts` 하드코딩 키 제거 | 환경변수 기반 `client.ts` | `grep -r "eyJ" apps/` 결과 0건 |
| 1.4 | 루트 CLAUDE.md 작성 | `CLAUDE.md` v1.0 | 전 팀원이 참조 가능한 완성 문서 |
| 1.5 | `.env.example` 정비 | 루트/앱별 `.env.example` | 모든 필수 변수 문서화 |

**롤백**: `git revert` — 각 태스크를 개별 커밋으로 관리

### Week 2: types v0.1 릴리스 + 코드 소유권

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 2.1 | `packages/types/` v0.1 검증 | 타입 패키지 빌드 성공 | `pnpm --filter @neuraltwin/types build` 성공 |
| 2.2 | DB 타입 최신화 | `database.types.ts` 재생성 | `pnpm supabase:gen-types` 성공, 153 테이블 포함 |
| 2.3 | `.github/CODEOWNERS` 생성 | CODEOWNERS 파일 | 5명 소유권 매핑 완료 |
| 2.4 | 크로스팀 킥오프 | 킥오프 미팅 + 문서 공유 | 전원 자기 WORK_GUIDE 확인 |

**CODEOWNERS 예시**:
```
# packages
packages/types/                @member-a @member-c
packages/shared/               @member-a @member-c
packages/ui/                   @member-e
packages/tailwind-preset/      @member-e

# apps
apps/website/                  @member-e
apps/os-dashboard/             @member-d
apps/neuralsense/              @member-b

# supabase
supabase/                      @member-a @member-c

# root config
CLAUDE.md                      @member-a
turbo.json                     @member-a
pnpm-workspace.yaml            @member-a
.github/CODEOWNERS             @member-a
```

### Week 3: Import 마이그레이션 조율

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 3.1 | E의 website import 마이그레이션 리뷰 | 리뷰 코멘트 | `pnpm --filter @neuraltwin/website build` 성공 |
| 3.2 | D의 os-dashboard import 마이그레이션 리뷰 | 리뷰 코멘트 | `pnpm --filter @neuraltwin/os-dashboard build` 성공 |
| 3.3 | 공유 타입 설계 검토 | 타입 전환 가이드 문서 | E, D가 `@neuraltwin/types` import 시작 가능 |

### Week 4: UI Kit 추출 리뷰 + 임시 백엔드

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 4.1 | E의 UI Kit 추출 아키텍처 리뷰 | 승인 또는 수정 요청 | variant prop 시스템 검증 완료 |
| 4.2 | 긴급 EF 버그 수정 (임시 백엔드) | 패치 커밋 | 런타임 에러 0건 |
| 4.3 | Zod 버전 의사결정 | 결정 문서 | v3 통일 또는 v4 마이그레이션 계획 확정 |

**C 부재 시 임시 백엔드 업무 범위**:
- 수행: EF 런타임 에러 긴급 수정, DB 마이그레이션 최소화 (긴급 스키마 수정만)
- 동결: EF 신규 개발, Import Map 대규모 변경, _shared/ 리팩토링, CI/CD 파이프라인 구축

### Week 5: C 온보딩 + 백엔드 인수인계

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 5.1 | C 온보딩 주도 | 온보딩 세션 완료 | C가 독립적으로 EF 배포 가능 |
| 5.2 | 백엔드 업무 인수인계 | 인수인계 문서 | C가 `packages/types/`, `packages/shared/`, `supabase/` 담당 확인 |
| 5.3 | W1-W4 작업 현황 브리핑 | 브리핑 문서 | C가 전체 진행 상황 파악 완료 |

### Week 6: B+C 브릿지 조율 + 중간 리뷰

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 6.1 | NeuralSense-Supabase 브릿지 킥오프 | B+C 공동 작업 계획 | MQTT → DB 데이터 흐름 설계 합의 |
| 6.2 | 중간 프로젝트 리뷰 | 리뷰 보고서 | KPI 진행률 50%+ 확인 |

### Week 7: 통합 테스트 조율

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 7.1 | E2E 통합 테스트 계획 | 테스트 시나리오 목록 | 전 서비스 주요 경로 커버 |
| 7.2 | 성능 벤치마킹 | 벤치마크 보고서 | 빌드 시간 <5분 확인 |

### Week 8: 최종 안정화

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 8.1 | KPI 최종 검증 | KPI 대시보드 최종본 | Section 13 목표 달성 확인 |
| 8.2 | 문서 동결 | 최종 CLAUDE.md + WORK_GUIDE 업데이트 | 플레이스홀더 0건 |
| 8.3 | 프로덕션 배포 승인 | 배포 체크리스트 | 전 서비스 빌드/테스트 통과 |

---

## 5. 기술 스펙 (Technical Specifications)

### 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| pnpm | 9.15.0 | 패키지 관리 |
| Turborepo | ^2.0.0 | 빌드 오케스트레이션 |
| TypeScript | ^5.8.3 | 언어 |
| Node.js | >=18.0.0 | 런타임 |
| @supabase/supabase-js | 2.89.0 (목표) | DB 클라이언트 |

### 주요 파일 경로

| 파일 | 역할 |
|------|------|
| `pnpm-workspace.yaml` | 워크스페이스 정의 (`apps/*`, `packages/*`) |
| `turbo.json` | 빌드 태스크 의존성 (`build → ^build`) |
| `package.json` (root) | 루트 스크립트 (build, dev, lint, type-check) |
| `packages/types/src/index.ts` | 타입 배럴 export |
| `packages/types/src/database.types.ts` | 자동 생성 DB 타입 (11,600+ LOC) |
| `packages/shared/src/index.ts` | 공유 유틸 배럴 export |
| `.env.example` | 환경변수 템플릿 |

### 빌드/실행 명령어
```bash
pnpm install                    # 의존성 설치
pnpm build                      # 전체 빌드
pnpm type-check                 # 타입 검사
pnpm lint                       # 린트
pnpm dev:website                # 웹사이트 개발 서버
pnpm dev:os                     # OS 대시보드 개발 서버
pnpm supabase:gen-types         # DB 타입 재생성
```

---

## 6. 크로스팀 의존성 (Cross-Team Dependencies)

| 공유 리소스 | 소유자 | 변경 시 조율 대상 | 비고 |
|-------------|--------|------------------|------|
| `packages/@neuraltwin/types/` | C (합류 전: A) | **전원** | 타입 변경은 전 서비스에 영향 |
| `packages/@neuraltwin/ui/` | E | D | OS에서도 사용 |
| `packages/@neuraltwin/tailwind-preset/` | E | D | 공유 디자인 토큰 |
| `supabase/functions/_shared/` | C (합류 전: A) | E, D | 챗봇 EF가 의존 |
| `supabase/migrations/` | C (합류 전: A) | **전원** | DB 스키마 변경 |
| `.env.example` | C (합류 전: A) | **전원** | 환경변수 목록 변경 |
| `pnpm-workspace.yaml` | C (합류 전: A) | **전원** | 워크스페이스 구조 |
| `turbo.json` | C (합류 전: A) | A (아키텍처 승인) | 빌드 파이프라인 |
| `.github/CODEOWNERS` | A | **전원** | 소유권 변경 |
| `CLAUDE.md` (root) | A | **전원** | 가이드라인 변경 |
| `deno.json` (Import Map) | C | E, D | EF 의존성 |
| MQTT payload schema | B | C, D | IoT 데이터 구조 |

### 크로스팀 동기화 포인트

| 시점 | 선행 | 후행 | 조율 내용 |
|------|------|------|----------|
| W1 완료 | A (모노레포 스캐폴딩) | E, D (import 감사) | 디렉토리 구조 확정 |
| W2 완료 | A (types v0.1) | E, D (타입 마이그레이션) | 타입 패키지 사용법 공유 |
| W3 중 | E (UI Kit 추출 시작) | D (W5 공유 UI 소비) | variant prop 인터페이스 합의 |
| W5 | A (C 온보딩) | C (백엔드 인수) | 전체 아키텍처 브리핑 |
| W6 | B+C (브릿지) | D (센서 데이터 표시) | MQTT → DB → 대시보드 데이터 흐름 |

---

## 7. 기술 부채 & 알려진 이슈 (Known Issues & Tech Debt)

### A가 직접 해결해야 할 이슈

| # | 심각도 | 이슈 | 위치 | 해결 방법 |
|:-:|:------:|------|------|----------|
| 1 | **CRITICAL** | Supabase 키 하드코딩 | `apps/website/src/integrations/supabase/client.ts` | 환경변수로 전환 |
| 2 | **CRITICAL** | `.env` Git 노출 위험 | `.gitignore` | `.env*` 패턴 확인, 히스토리 정리 검토 |
| 3 | **HIGH** | Zapier Webhook URL 소스코드 노출 | `supabase/supabase/functions/submit-contact/index.ts` | `ZAPIER_WEBHOOK_URL` 환경변수화 |
| 4 | **HIGH** | CORS `*` 전체 허용 | 52개 EF 전체 | `_shared/cors.ts` 중앙화 (C 합류 후 본격 진행) |
| 5 | **MEDIUM** | OG 이미지 Lovable 도메인 | `apps/website/index.html:13,17` | `neuraltwin.com` 도메인으로 전환 |
| 6 | **MEDIUM** | `lovable-tagger` 플랫폼 의존성 | `apps/website/vite.config.ts`, `apps/os-dashboard/vite.config.ts` | 조건부 import 처리 |
| 7 | **MEDIUM** | supabase-js 버전 11개 혼재 | 52개 EF 파일 | Import Map 통일 (C 합류 후) |
| 8 | **LOW** | `advanced-ai-inference` deprecated EF | `supabase/supabase/functions/advanced-ai-inference/` | W7-W8에 제거 |
| 9 | **LOW** | 7개 alias/duplicate EF | `bright-processor`, `dynamic-handler` 등 | W7-W8에 제거 |

---

## 8. 검증 체크리스트 (Verification Checklist)

### Phase 1 (W1-W2)
- [ ] `pnpm install` 에러 없이 완료
- [ ] `pnpm build` 전체 빌드 성공
- [ ] `pnpm type-check` 타입 에러 0건
- [ ] `.env` 파일이 Git에 추적되지 않음 (`git ls-files '*.env'` 결과 0건)
- [ ] `client.ts`에 하드코딩된 키 없음 (`grep -r "eyJ" apps/` 결과 0건)
- [ ] `.github/CODEOWNERS` 5명 매핑 완료
- [ ] `CLAUDE.md` v1.0 작성 완료
- [ ] `.env.example` 루트 + 앱별 존재

### Phase 2 (W3-W4)
- [ ] E의 website import 마이그레이션 빌드 통과
- [ ] D의 os-dashboard import 마이그레이션 빌드 통과
- [ ] Zod 버전 의사결정 완료 (v3 or v4)
- [ ] UI Kit 추출 아키텍처 승인

### Phase 3 (W5-W6)
- [ ] C 온보딩 완료 — 독립적 EF 배포 가능
- [ ] 백엔드 업무 인수인계 완료
- [ ] B+C 브릿지 킥오프 완료

### Phase 4 (W7-W8)
- [ ] 전체 빌드 시간 <5분
- [ ] CI/CD 파이프라인 작동 (PR 자동 검증)
- [ ] 테스트 커버리지 >20%
- [ ] supabase-js 단일 버전
- [ ] KPI 목표 달성 확인

---

## 9. 참조 파일 (Reference Files)

| 파일 | 위치 | 참조 섹션 |
|------|------|----------|
| SYSTEM_ARCHITECTURE.md | `docs/SYSTEM_ARCHITECTURE.md` | 전체 — 시스템 아키텍처, 데이터 흐름, 기술 부채 |
| REPO_ANALYSIS_B.md | `apps/neuralsense/REPO_ANALYSIS_B.md` | Sec 3 (환경변수), Sec 11 (기술 부채) — B 팀 조율용 |
| REPO_ANALYSIS_C.md | `supabase/REPO_ANALYSIS_C.md` | Sec 1 (EF 인벤토리), Sec 11 (기술 부채) — 임시 백엔드 업무 |
| REPO_ANALYSIS_D.md | `apps/os-dashboard/REPO_ANALYSIS_D.md` | Sec 12 (마이그레이션 계획) — D 팀 조율용 |
| REPO_ANALYSIS_E.md | `apps/website/REPO_ANALYSIS_E.md` | Sec 8 (공유 코드), Sec 10 (기술 부채) — E 팀 조율용 |
| DB_SCHEMA_DIFF.md | `supabase/DB_SCHEMA_DIFF.md` | 전체 — 153 테이블 vs 문서 차이 |
| TYPE_MIGRATION_TODO.md (OS) | `apps/os-dashboard/TYPE_MIGRATION_TODO.md` | 전체 — D 타입 마이그레이션 대상 |
| TYPE_MIGRATION_TODO.md (Web) | `apps/website/TYPE_MIGRATION_TODO.md` | 전체 — E 타입 마이그레이션 대상 |

---

## 10. 비상 절차 (Emergency Procedures)

### 빌드 실패 시
```bash
# 1. 캐시 초기화
pnpm clean

# 2. 의존성 재설치
rm -rf node_modules && rm pnpm-lock.yaml && pnpm install

# 3. 재빌드
pnpm build

# 4. 특정 패키지만 빌드
pnpm --filter @neuraltwin/types build
pnpm --filter @neuraltwin/website build
```

### 타입 에러 시
```bash
# DB 타입 재생성
pnpm supabase:gen-types
# 타입 검증
pnpm type-check
```

### 롤백 방법
```bash
# 특정 커밋으로 롤백 (비파괴적)
git revert <commit-hash>

# 패키지 변경 롤백
git checkout <previous-hash> -- packages/types/
pnpm install && pnpm build
```

### EF 배포 실패 시 (임시 백엔드 업무)
```bash
# 디버그 모드 배포
supabase functions deploy <name> --project-ref bdrvowacecxnraaivlhr --debug

# 로그 확인
supabase functions logs <name> --project-ref bdrvowacecxnraaivlhr
```

### 에스컬레이션 경로
```
Sub-Agent → A (Orchestrator) → 외부 전문가 (필요 시)
```
A는 최종 에스컬레이션 포인트이므로, 해결 불가 시 외부 리소스(Supabase 지원, 커뮤니티)를 활용합니다.
