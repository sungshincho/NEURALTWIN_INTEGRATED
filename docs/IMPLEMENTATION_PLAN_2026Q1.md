# NeuralTwin 구현 계획서 v2 (검증 완료)
## NT_Master Playbook vs 현재 코드베이스 Gap 분석 기반

> **Date**: 2026-03-02
> **Author**: PM Lead Agent
> **Approved by**: CEO 성신 (Pending)
> **기준 브랜치**: `neuraltwin/sungshin` (commit `4b318af`)
> **v2 변경**: 코드베이스 실사 검증 완료 — 초판 오판 5건 정정

---

## 0. Executive Summary

NT_Master_Product_Playbook_v2.md 대비 현재 코드베이스의 **가중 평균 완성도는 ~75%**입니다.

초판(v1) 대비 핵심 정정사항:
- ✅ MQTT→Supabase 브릿지는 **이미 구현됨** (`run_live_geometry.py` + `supabase_uploader.py`)
- ✅ IoT→3D Realtime 훅 **이미 존재** (`useRealtimeTracking.ts`, `useWiFiTracking.ts`)
- ✅ PDF 생성 **이미 구현됨** (jsPDF v3/v4 설치, 시뮬레이션/채팅 내보내기 동작)
- ⚠️ RLS 미적용은 **99개 테이블**로 기존 추정(~70개)보다 심각
- 🔴 결제 시스템은 **코드 0%** — 초판에서 누락된 핵심 과제

**실제 병목**: 보안(RLS 99테이블) → 결제 시스템(0%) → SaaS Tier 게이팅(인프라만 존재)

---

## 1. 검증된 완성도 매트릭스

| 모듈 | 완성도 | 핵심 갭 | Tier 영향 |
|------|:------:|---------|:---------:|
| M1: SEE (실시간 인텔리전스) | **82%** | 브릿지 배포 설정 (`ENABLE_UPLOAD=true`, 환경변수), MQTT TLS | All |
| M2: UNDERSTAND (AI 엔진) | **75%** | 자동 이상 탐지 시스템 미구현 (템플릿만 존재) | Growth+ |
| M3: SIMULATE (3D 디지털 트윈) | **83%** | Time Travel 재생 미구현, `neuralsense_live_state`→3D 미연결 | Enterprise |
| M4: CONNECT (데이터 관리) | **90%** | POS 실제 어댑터 미구현 (스키마만 존재) | Growth+ |
| M5: PROVE (ROI 측정) | **88%** | 매장 진단 리포트 전용 PDF 템플릿 필요 (jsPDF 라이브러리는 존재) | All |
| 인프라 — 보안/RLS | **50%** | 109개 테이블 중 **99개 RLS 정책 누락**, 32개 EF가 service_role | All |
| SaaS Tier 게이팅 | **15%** | DB 스키마+타입 존재, **실행 로직 0%** | All |
| 결제 시스템 | **0%** | Stripe/토스페이먼츠 코드 전무 | All |
| Vercel 배포 | **5%** | vercel.json(SPA rewrite만), 프로젝트 0개 | All |

### 검증으로 확인된 기존재 자산

| 자산 | 상태 | 파일 |
|------|------|------|
| MQTT 브릿지 데몬 | ✅ 구현 완료 | `apps/neuralsense/run_live_geometry.py` (580줄, MQTT subscribe + zone assignment + 업로더) |
| Supabase 업로더 | ✅ 구현 완료 | `apps/neuralsense/supabase_uploader.py` (453줄, 배치+스트리밍+재시도) |
| IoT Realtime 훅 | ✅ 구현 완료 | `useRealtimeTracking.ts` (Presence/Broadcast), `useWiFiTracking.ts` (postgres_changes) |
| PDF 생성 | ✅ 구현 완료 | jsPDF v3+v4, 시뮬레이션/채팅 내보내기 동작 |
| 온보딩 위자드 | ✅ 7단계 완성 | `OnboardingWizard.tsx` (첫 로그인 자동 트리거) |
| InsightHub | ✅ 7탭 완성 | 개요/매장/고객/상품/재고/예측/AI추천 |
| 3D 오버레이 | ✅ 14개 완성 | 고객아바타, 히트맵, 혼잡도, 스태프, 환경 등 |
| Website E2E | ✅ 존재 | Playwright 스모크 테스트 (5개 테스트 스위트) |
| 시뮬레이션 엔진 | ✅ 구현 완료 | `CustomerSimulationEngine` (확률적 고객 행동 모델링) |

---

## 2. NT_Master 데이터 검증 결과 (T5 리서치)

### 시장 데이터

| 항목 | NT_Master 기재 | 검증 결과 | 판정 |
|------|---------------|----------|:----:|
| 글로벌 리테일 애널리틱스 | $66억, CAGR 4.2% | Mordor Intelligence 정확 일치 | ✅ |
| 인스토어 애널리틱스(북미) | $16.8억, CAGR 22% | 정확 일치 | ✅ |
| 한국 CAGR | 9.3% | 일치 확인 | ✅ |
| 실시간 매장 모니터링 | $19.5억 | 2024년 기준 (2025년은 ~$23억) | ⚠️ 수정권장 |
| 디지털 트윈 시장 | (미기재) | $211~358억(2025), CAGR 34~48% | ➕ 추가권장 |

### 타겟 고객 최신 수치

| 고객 | NT_Master | 최신 (2025-2026) | 변경점 |
|------|----------|-----------------|--------|
| 올리브영 | 1,300+ 매장, 4.5조 | **1,371개, 4.79조(2024), 5.6조(2025전망)** | 상향 |
| 다이소 | 1,500+ 매장 | **1,600+ 돌파, 뷰티 +144%** | 상향 |
| 무신사 | 성수/홍대 예정 | **34개→60호점 목표, 판매액 1조 목표** | 확인+확대 |

### 경쟁사 핵심 업데이트

| 경쟁사 | 핵심 발견 | NeuralTwin 영향 |
|--------|----------|----------------|
| Sensormatic | Orbit AI + Re-ID (2025.12 발표) | 직접 경쟁 낮음 (대형 유통 타겟) |
| loplat | 아기유니콘, 700만 MAU | 보완 관계 (매장 in/out vs 매장 내 분석) |
| Walmart | 4,200개 매장 디지털 트윈 배포 | 시장 검증 완료 — 세일즈 레퍼런스로 활용 |
| 한국 시장 | WiFi+AI+3D 통합 = NeuralTwin 유일 | 블루오션 확인 |

---

## 3. 팀 구조 (역할 업데이트)

| Teammate | 역할 | 담당 범위 |
|----------|------|----------|
| **T1 IoT** | NeuralSense 개발 | Python, MQTT, Pi, 센서 배포, 캘리브레이션 |
| **T2 Backend** | Supabase/DB/보안 | Edge Functions, RLS, CI/CD, 결제 연동 |
| **T3 DT/OS** | 3D 대시보드 | Three.js, React, Zustand, Realtime 연결 |
| **T4 Website** | 마케팅사이트 | React, Vercel 배포, i18n, 공유 UI |
| **T5 Product Data** | **제품 데이터 리서치 & AI 데이터 레이어** | 기능 설계에 필요한 모든 데이터 직접 리서치, AI 채팅 기능용 데이터 서치+수집, 데이터 레이어 구축, UI/UX 리서치, 도메인 지식 |
| **T6 UI/UX Design** | **전체 제품 UI/UX 디자인 설계** | 전체 제품(Website, OS Dashboard, 모바일)의 UI/UX 설계, 디자인 시스템, 컴포넌트 스펙, 유저플로우, 인터랙션 패턴 |

### T5 상세 역할 — Product Data Researcher & AI Data Layer

```
T5 담당 영역:
├── 제품 기능 설계 데이터
│   ├── 리테일 도메인 데이터 리서치 (KPI 정의, 업종별 벤치마크)
│   ├── 경쟁사/시장 분석 데이터 수집
│   └── 기능 요구사항에 필요한 외부 데이터 조사
├── AI 채팅 기능 데이터
│   ├── AI 어시스턴트용 도메인 지식 데이터 서치 & 수집
│   ├── retail_knowledge_chunks (RAG) 데이터 레이어 구축
│   ├── AI 프롬프트 도메인 검증 & 최적화
│   └── 업종별 AI 응답 품질 테스트 데이터
├── UI/UX 리서치 데이터
│   ├── 사용자 니즈/페인포인트 리서치
│   ├── 경쟁 제품 UX 벤치마킹
│   └── T6에게 디자인 결정 근거 데이터 제공
└── 세일즈 데이터
    ├── 데모 시나리오용 샘플 데이터
    ├── 케이스 스터디 데이터
    └── ROI 계산기 벤치마크 데이터
```

### T6 상세 역할 — Product UI/UX Designer

```
T6 담당 영역:
├── 전체 제품 디자인 설계
│   ├── Website UI/UX 디자인
│   ├── OS Dashboard UI/UX 디자인
│   ├── AI 챗봇 인터페이스 디자인
│   └── 모바일 대응 디자인
├── 디자인 시스템
│   ├── 디자인 토큰 (색상, 타이포, 간격)
│   ├── 컴포넌트 스펙 (T3, T4 구현용)
│   ├── @neuraltwin/ui 패키지 디자인 방향
│   └── 글래스모피즘/다크모드 가이드
├── 유저플로우 설계
│   ├── 온보딩 플로우
│   ├── 대시보드 네비게이션
│   ├── 3D 스튜디오 인터랙션
│   └── 결제/구독 플로우
└── 세일즈 디자인
    ├── 피치덱 디자인
    ├── 매장 진단 리포트 PDF 템플릿
    └── 데모 화면 디자인
```

---

## 4. 구현 우선순위 (Phase 1 — 8주 Sprint)

### Sprint 1: W1~W2 — 🔴 보안 & 파이프라인 배포 (최우선)

> **실제 병목**: RLS 99테이블 미적용 + service_role 남용이 출시 최대 장벽

| # | 태스크 | 담당 | 산출물 | 기한 |
|---|--------|------|--------|:----:|
| 1.1 | **브릿지 프로덕션 배포 설정** | T1 IoT | `ENABLE_UPLOAD=true`, SUPABASE_URL/KEY 설정, 데몬 자동 시작 스크립트 | W1 (2일) |
| 1.2 | **MQTT TLS 적용** | T1 IoT | TLS 인증서, 암호화 통신 | W1 |
| 1.3 | **RLS 정책 마이그레이션 (99테이블)** | T2 Backend | `org_id` 기반 멤버십 체크 RLS 정책 전체 적용 | W1~2 |
| 1.4 | **EF service_role→auth 전환** (user-facing 15개+) | T2 Backend | `createSupabaseWithAuth()` 전환 + 스모크 테스트 | W2 |
| 1.5 | **`neuralsense_live_state` → 3D 연결** | T3 DT/OS | 기존 `useRealtimeTracking` 훅에 NeuralSense 데이터 소스 연결 | W1~2 |
| 1.6 | **Vercel 배포** (앞당김) | T4 Website | Website + OS Dashboard 프로젝트 생성, 환경변수, GitHub 연결 | W1 |
| 1.7 | **전체 제품 UX 감사** | T6 UI/UX | 현재 Website/Dashboard UX 문제점 파악, 개선 우선순위 리스트 | W1~2 |
| 1.8 | **AI 채팅 도메인 데이터 조사** | T5 Product Data | retail_knowledge_chunks용 도메인 데이터 수집 시작, 업종별 KPI 정의 | W1~2 |

**검증 기준**: Pi → MQTT(TLS) → Supabase → OS Dashboard 3D에 실시간 고객 표시 + Vercel 라이브

---

### Sprint 2: W3~W4 — 🟡 SaaS 매출 기반 & 결제

| # | 태스크 | 담당 | 산출물 | 기한 |
|---|--------|------|--------|:----:|
| 2.1 | **SaaS Tier 게이팅 로직** | T2 Backend | 기존 subscriptions/licenses 스키마 활용, EF + Frontend route guard 구현 | W3 |
| 2.2 | **결제 시스템 구축** | T2 Backend + T4 Website | Stripe 또는 토스페이먼츠 연동, webhook, 구독 관리 | W3~4 |
| 2.3 | **이상 탐지 자동화 서비스** | T2 Backend | `daily_kpis_agg` 패턴 분석 → `user_alerts` 자동 생성 EF + cron | W4 |
| 2.4 | KPI 대시보드 실데이터 검증 | T3 DT/OS | InsightHub 7탭 실 센서 데이터 정합성 확인 | W3 |
| 2.5 | CORS 중복 정리 | T2 Backend | `unified-chatbot` 등 인라인 CORS → `_shared/cors.ts` 통일 | W4 |
| 2.6 | **결제/구독 UX 설계** | T6 UI/UX | 가격 페이지, 결제 플로우, 구독 관리 화면 디자인 | W3 |
| 2.7 | **AI 데이터 레이어 구축** | T5 Product Data | RAG용 리테일 지식 데이터 정제, 업종별 AI 프롬프트 검증 | W3~4 |
| 2.8 | **기능별 UX 리서치** | T5 Product Data | 히트맵/동선/3D 기능의 UX 벤치마킹, 사용자 니즈 데이터 수집 | W3~4 |

**검증 기준**: 외부 사용자가 가격 페이지 → 결제 → Starter 대시보드 접근 가능

---

### Sprint 3: W5~W6 — 🟢 파일럿 준비

| # | 태스크 | 담당 | 산출물 | 기한 |
|---|--------|------|--------|:----:|
| 3.1 | 파일럿 매장 Pi 설치 + 캘리브레이션 | T1 IoT | 실제 매장 8대 Pi 설치, zone 캘리브레이션 | W5 |
| 3.2 | 2주 데이터 수집 + 품질 모니터링 | T1 IoT + T2 Backend | 수집 안정성 95%+, 데이터 정합성 검증 | W5~6 |
| 3.3 | **매장 진단 리포트 PDF 템플릿** | T3 DT/OS | 기존 jsPDF 활용, 40~60페이지 전용 템플릿 (히트맵/동선/체류/AI제안) | W5~6 |
| 3.4 | **진단 리포트 PDF 디자인** | T6 UI/UX | 리포트 레이아웃, 차트 스타일, 브랜딩 적용 | W5 |
| 3.5 | **seed.sql** 작성 | T2 Backend | 개발환경 초기 데이터 (조직, 매장, 존, 센서, 샘플 KPI) | W5 |
| 3.6 | OS Dashboard E2E 테스트 | T3 DT/OS | Playwright 테스트 추가 (Website은 이미 존재) | W6 |
| 3.7 | **파일럿 데모 데이터 준비** | T5 Product Data | 업종별 샘플 데이터, AI 챗봇 테스트 시나리오, 데모용 KPI 벤치마크 | W5~6 |

**검증 기준**: 실제 매장 데이터로 브랜딩된 40페이지 PDF 리포트 자동 생성

---

### Sprint 4: W7~W8 — 🔵 출시 & 첫 고객

| # | 태스크 | 담당 | 산출물 | 기한 |
|---|--------|------|--------|:----:|
| 4.1 | Starter Tier 출시 (₩99K/월) | 전체 | 결제→온보딩→대시보드 전체 플로우 | W7 |
| 4.2 | **데모 시나리오 3종 데이터** | T5 Product Data | 패션/뷰티/백화점 업종별 데모 데이터 + AI 응답 검증 | W7 |
| 4.3 | **세일즈 피치덱 + 데모 UI 디자인** | T6 UI/UX | 5슬라이드 피치덱, 데모 모드 UI, 케이스 스터디 페이지 디자인 | W7 |
| 4.4 | 데모 시나리오 3종 구현 | T3 DT/OS | 패션/뷰티/백화점 업종별 데모 스크립트 + 3D 씬 | W8 |
| 4.5 | 블로그/케이스 스터디 페이지 | T4 Website | Website에 블로그 섹션 + 케이스 스터디 페이지 + 가격 페이지 | W8 |
| 4.6 | CI/CD 강화 | T2 Backend | E2E 테스트 CI 통합, NeuralSense pytest CI 추가 | W8 |
| 4.7 | **케이스 스터디 데이터 작성** | T5 Product Data | 파일럿 결과 데이터 분석, ROI 계산, 성과 리포트 | W7~8 |

**검증 기준**: 외부 고객이 Website → 가입 → 결제 → 대시보드 사용까지 셀프서비스 가능

---

## 5. Phase 2~3 로드맵 개요 (6~18개월)

### Phase 2: "읽을 줄 안다" (6~12개월) — Growth Tier

| 영역 | 태스크 | 담당 |
|------|--------|------|
| AI | 자연어 질의 고도화 (컨텍스트 유지, 멀티턴) | T2 + T5(데이터) |
| AI | 이상 탐지 알림 고도화 (다차원 패턴) | T2 |
| AI | AI 채팅 도메인 데이터 확장 (업종별 특화) | T5 |
| Data | POS 연동 3종 (Shopify POS, Square, 토스POS) | T2 |
| Data | ROI 자동 추적 + 자동 리포트 이메일 | T2 + T3 |
| Security | PIPA 준수 체크리스트 완전 구현 | T2 |
| 기술 | MAC 랜덤화 대응: IE 핑거프린팅 + 타이밍 분석 | T1 |
| Design | Growth Tier 전용 대시보드 UX 설계 | T6 |
| 영업 | Growth Tier 출시 (₩299K/월) | 전체 |

### Phase 3: "미래를 본다" (12~18개월) — Enterprise Tier

| 영역 | 태스크 | 담당 |
|------|--------|------|
| 3D | Time Travel 재생 (타임라인 스크러버) | T3 + T6(UX) |
| 3D | 3D 디지털 트윈 정식 출시 | T3 |
| AI | A/B 시뮬레이션 자동화 | T2 + T3 |
| AI | 직원 배치 최적화 고도화 | T2 |
| Data | @neuraltwin/ai-core 패키지 분리 | T2 |
| Data | 온톨로지 그래프 시각화 UI | T3 + T6(UX) |
| Research | 일본/동남아 시장 데이터 리서치 | T5 |
| Design | Enterprise 전용 UX + 멀티 매장 비교 뷰 | T6 |
| 영업 | Enterprise Tier 출시 (₩599K+/월) | 전체 |

---

## 6. 팀 가동 계획

### 전원 즉시 가동 (Sprint 1부터)

| Teammate | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|----------|----------|----------|----------|----------|
| **T1 IoT** | 브릿지 배포+TLS | — | 파일럿 설치+수집 | — |
| **T2 Backend** | RLS 99테이블+auth전환 | Tier게이팅+결제+이상탐지 | seed.sql | CI/CD |
| **T3 DT/OS** | live_state→3D연결 | KPI검증 | PDF템플릿+E2E | 데모구현 |
| **T4 Website** | Vercel배포 | 결제UI+구독관리 | — | 블로그+가격페이지 |
| **T5 Product Data** | AI데이터조사+KPI정의 | RAG데이터레이어+UX리서치 | 파일럿데모데이터 | 케이스스터디+데모데이터 |
| **T6 UI/UX Design** | 전체UX감사+개선리스트 | 결제/구독UX설계 | PDF리포트디자인 | 피치덱+데모UI |

---

## 7. 의존성 그래프 (수정)

```
[1.1 브릿지 배포(2일)] ──→ [1.5 live_state→3D] ──→ [3.1 파일럿 설치]
                                                          ↓
[1.3 RLS 99테이블] ──→ [1.4 service_role 전환] ──→ [2.1 Tier 게이팅]
    (1.5주, 병목)                                         ↓
                                                    [2.2 결제 시스템]
[1.6 Vercel 배포] ──→ [2.2 결제] ──→ [4.1 Starter 출시]        ↓
                                                          ↓
[1.8 AI데이터] ──→ [2.7 데이터레이어] ──→ [3.7 데모데이터]   ↓
[1.7 UX감사] ──→ [2.6 결제UX] ──→ [3.4 PDF디자인] ──→ [4.3 피치덱]
                                                          ↓
[3.3 PDF 리포트] ──→ [3.2 데이터 수집] ──→ [4.7 케이스 스터디]
```

**크리티컬 패스**: 1.3 RLS(1.5주) → 2.1 Tier → 2.2 결제 → 4.1 출시

---

## 8. 리스크 & 완화

| 리스크 | 심각도 | 완화 전략 |
|--------|:------:|----------|
| RLS 99테이블 마이그레이션 시 EF 대량 장애 | 🔴 | 테이블 그룹별 단계 적용 (core→analytics→ai), 스모크 테스트 병행 |
| 결제 시스템 구축 지연 | 🔴 | Stripe Checkout(호스팅) 먼저 → 커스텀 결제 후속 |
| 파일럿 매장 확보 실패 | 🟡 | CEO 인맥 + 무료 진단 5건 제안 |
| MAC 랜덤화로 방문객 수 부정확 | 🟡 | "트래픽 패턴/트렌드 분석" 포지셔닝 |
| PIPA WiFi 센싱 규제 강화 | 🟡 | GDPR 기준 선제 적용 (MAC 해싱+솔트, 일별 키 변경) |
| AI 기본법 (2026.01 시행) | 🟡 | AI 신뢰성 확보 조치 문서화 |

---

## 9. 성공 지표 (Phase 1 — 8주 후)

| 지표 | 목표 |
|------|:----:|
| 라이브 데모 가능 여부 | Yes |
| RLS 정책 커버리지 | 109/109 테이블 (100%) |
| Vercel 배포 완료 | Website + OS Dashboard |
| 결제 플로우 동작 | Starter 구독 결제 가능 |
| 파일럿 매장 설치 | 1곳 |
| PDF 리포트 자동 생성 | 브랜딩된 40페이지 |
| AI 챗봇 도메인 정확도 | 업종별 테스트 통과 |
| 유료 진단 리포트 판매 | 1건+ |

---

*NeuralTwin | PM Lead Implementation Plan v2 (Verified) | 2026-03-02 | CEO Approval Pending*
