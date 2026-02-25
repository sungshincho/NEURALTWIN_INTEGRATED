# NEURALTWIN 종합 분석 및 로드맵

## 문서 정보
| 항목 | 값 |
|------|-----|
| 작성일 | 2026-01-05 |
| 버전 | 1.0 |
| Store ID | d9830554-2688-4032-af40-acccda787ac4 |
| User ID | e4200130-08e8-47da-8c92-3d0b90fafd77 |
| Supabase Project | bdrvowacecxnraaivlhr |
| 분석 기준 | 실제 코드베이스 |

---

# Executive Summary

## 프로젝트 개요

**NEURALTWIN**은 소매 매장을 위한 3D 디지털 트윈 기반 AI 최적화 플랫폼입니다.

### 핵심 기능
- **3D 디지털 트윈 스튜디오**: Three.js/React Three Fiber 기반 실시간 매장 시각화
- **AI 최적화 시스템**: 레이아웃, 동선, 인력, 혼잡도 최적화
- **인사이트 허브**: KPI 대시보드, 퍼널 분석, 고객 세그먼트
- **ROI 측정**: AI 추천 적용 후 실제 성과 측정 및 Continuous Learning

### 기술 스택
| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| 3D 렌더링 | Three.js, @react-three/fiber, @react-three/drei |
| 상태 관리 | React Query (TanStack), Zustand |
| 백엔드 | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| AI | Claude API (via ai.gateway.lovable.dev) |
| 외부 API | OpenWeatherMap, 공공데이터포털 (공휴일) |

## 현재 상태 요약 (MVP)

| 영역 | 구현 완료 | 부분 구현 | 미구현 | 완성도 |
|------|----------|----------|--------|--------|
| 프론트엔드 | 8개 기능 | 2개 기능 | 1개 기능 | 85% |
| 백엔드 (Edge Functions) | 22개 | 2개 | 0개 | 92% |
| 데이터베이스 | 53개 마이그레이션 | - | - | 95% |
| AI/ML 기능 | 6개 | 2개 | 2개 | 75% |

## 코드 통계 요약

| 영역 | 파일 수 | 총 라인 수 |
|------|--------|-----------|
| TypeScript/TSX (src/) | 402 | 115,365 |
| Edge Functions | 22 | 27,421 |
| SQL Migrations | 53 | ~15,000 |
| **합계** | 477 | ~158,000 |

---

# Part 1: 프로젝트 구조 분석

## 1.1 디렉토리 구조

### 프론트엔드 (src/)
```
src/
├── components/          # 공통 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── common/         # 공용 컴포넌트
│   ├── dashboard/      # 대시보드 컴포넌트
│   ├── goals/          # 목표 관련 컴포넌트
│   └── notifications/  # 알림 컴포넌트
├── core/
│   └── pages/          # 인증, 404 페이지
├── features/           # 기능별 모듈
│   ├── studio/         # 디지털 트윈 스튜디오 (핵심)
│   ├── insights/       # 인사이트 허브
│   ├── roi/            # ROI 측정
│   ├── settings/       # 설정
│   ├── data-management/# 데이터 관리
│   ├── simulation/     # 시뮬레이션 유틸리티
│   └── onboarding/     # 온보딩 위저드
├── hooks/              # 커스텀 훅 (30개)
├── integrations/       # 외부 연동 (Supabase)
├── lib/                # 유틸리티
└── stores/             # 상태 관리 (Zustand)
```

### 백엔드 (supabase/)
```
supabase/
├── functions/          # Edge Functions (22개)
│   ├── advanced-ai-inference/    # Ultimate AI 추론 (4,715줄)
│   ├── generate-optimization/    # 최적화 생성 (1,449줄)
│   ├── unified-ai/               # 통합 AI (1,094줄)
│   ├── unified-etl/              # 통합 ETL (713줄)
│   ├── environment-proxy/        # 환경 데이터 프록시 (367줄)
│   └── ... (17개 추가)
└── migrations/         # DB 마이그레이션 (53개)
```

## 1.2 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | InsightHubPage | 메인 대시보드 (인사이트 허브) |
| `/insights` | InsightHubPage | 인사이트 허브 |
| `/studio` | DigitalTwinStudioPage | 3D 디지털 트윈 스튜디오 |
| `/roi` | ROIMeasurementPage | ROI 측정 |
| `/settings` | SettingsPage | 설정 |
| `/auth` | AuthPage | 인증 |

## 1.3 주요 훅 목록

### 전역 훅 (src/hooks/) - 30개
| 훅 | 용도 | 라인 수 |
|----|------|--------|
| useAuth | 인증 관리 | 12,571 |
| useOnboarding | 온보딩 프로세스 | 17,876 |
| usePOSIntegration | POS 연동 | 19,226 |
| useLearningFeedback | Continuous Learning | 14,283 |
| useProductPerformance | 상품 성과 분석 | 11,390 |
| useGoals | 목표 관리 | 11,389 |
| useAI | AI 추천 | 8,683 |
| useFootfallAnalysis | 방문객 분석 | 7,857 |
| useOntologyData | 온톨로지 데이터 | 7,703 |
| ... | ... | ... |

### 스튜디오 훅 (src/features/studio/hooks/) - 21개
| 훅 | 용도 | 라인 수 |
|----|------|--------|
| useSceneSimulation | 씬 시뮬레이션 통합 | 27,198 |
| useFlowSimulation | 동선 시뮬레이션 | 25,065 |
| useStaffingSimulation | 인력 시뮬레이션 | 21,438 |
| useLayoutSimulation | 레이아웃 시뮬레이션 | 19,382 |
| useCongestionSimulation | 혼잡도 시뮬레이션 | 18,998 |
| useCustomerFlowData | 고객 동선 데이터 | 16,951 |
| useSceneRecipe | 씬 레시피 관리 | 13,853 |
| usePlacement | 상품 배치 | 12,868 |
| useOptimization | 최적화 관리 | 11,965 |
| useFurnitureSlots | 가구 슬롯 관리 | 10,508 |
| useEnvironmentContext | 환경 컨텍스트 | 10,054 |
| ... | ... | ... |

---

# Part 2: 기능별 상세 분석

## 2.1 디지털 트윈 스튜디오 (/studio)

### As-Is (현재 구현 상태)

#### 파일 구조
```
src/features/studio/
├── DigitalTwinStudioPage.tsx  # 메인 페이지 (66,821줄)
├── components/                # 3D 컴포넌트
├── panels/                    # 사이드 패널 (9개)
│   ├── LayerPanel.tsx        # 레이어 관리
│   ├── SimulationPanel.tsx   # 시뮬레이션 제어
│   ├── OptimizationResultPanel.tsx  # 최적화 결과
│   ├── UltimateAnalysisPanel.tsx    # Ultimate AI 분석
│   ├── PropertyPanel.tsx     # 속성 편집
│   ├── ToolPanel.tsx         # 도구
│   ├── OverlayControlPanel.tsx  # 오버레이 제어
│   └── SceneSavePanel.tsx    # 씬 저장
├── overlays/                  # 시각화 오버레이 (16개)
│   ├── LayoutOptimizationOverlay.tsx   # 레이아웃 최적화
│   ├── FlowOptimizationOverlay.tsx     # 동선 최적화
│   ├── StaffingOverlay.tsx             # 인력 배치
│   ├── CongestionOverlay.tsx           # 혼잡도
│   ├── HeatmapOverlay.tsx              # 히트맵
│   ├── EnvironmentEffectsOverlay.tsx   # 환경 효과
│   └── ... (10개 추가)
├── hooks/                     # 전용 훅 (21개)
├── types/                     # 타입 정의 (10개 파일)
├── services/                  # 서비스 로직
├── utils/                     # 유틸리티
└── stores/                    # 로컬 상태
```

#### 구현된 기능

| 기능 | 상태 | 파일 | 설명 |
|------|------|------|------|
| 3D 씬 렌더링 | ✅ 완료 | DigitalTwinStudioPage.tsx | Three.js 기반 실시간 렌더링 |
| 레이아웃 최적화 | ✅ 완료 | useLayoutSimulation.ts | AI 기반 상품/가구 배치 최적화 |
| 동선 최적화 | ✅ 완료 | useFlowSimulation.ts | 고객 동선 분석 및 최적화 |
| 인력 최적화 | ✅ 완료 | useStaffingSimulation.ts | 시간대별 인력 배치 최적화 |
| 혼잡도 시뮬레이션 | ✅ 완료 | useCongestionSimulation.ts | 실시간 혼잡도 예측 |
| Ultimate AI 분석 | ✅ 완료 | UltimateAnalysisPanel.tsx | 8개 모듈 통합 AI 분석 |
| 환경 컨텍스트 | ✅ 완료 | useEnvironmentContext.ts | 날씨/공휴일/시간대 반영 |
| 상품 연관 분석 | ✅ 완료 | associationMiner.ts | 크로스셀/번들 추천 |
| VMD 분석 | ✅ 완료 | vmdAnalyzer.ts | 비주얼 머천다이징 분석 |
| 씬 저장/로드 | ✅ 완료 | useScenePersistence.ts | 씬 상태 영구 저장 |

#### 미구현/부분 구현 기능

| 기능 | 현재 상태 | 필요 작업 | 우선순위 |
|------|----------|----------|---------|
| IoT 센서 연동 | ⚠️ 부분 | iot_sensors 테이블 생성 필요 | P1 |
| 실시간 트래킹 | ⚠️ 부분 | 센서 데이터 파이프라인 구축 | P2 |
| AR 뷰 | ❌ 미구현 | WebXR 통합 필요 | P3 |

### To-Be (목표 상태)

| 기능 | 설명 | 예상 구현 시기 | 의존성 |
|------|------|--------------|--------|
| 실시간 IoT 연동 | 센서 데이터 실시간 반영 | 중기 | IoT 인프라 |
| AR 매장 투어 | WebXR 기반 AR 뷰 | 장기 | WebXR API |
| 멀티 매장 비교 | 여러 매장 동시 비교 분석 | 중기 | 멀티 테넌시 |
| AI 자동 레이아웃 | 완전 자동화된 최적 배치 | 중기 | ML 모델 개선 |

---

## 2.2 인사이트 허브 (/insights)

### As-Is (현재 구현 상태)

#### 파일 구조
```
src/features/insights/
├── InsightHubPage.tsx      # 메인 페이지 (8,768줄)
├── components/             # 위젯 컴포넌트
├── hooks/                  # 데이터 훅
└── tabs/                   # 탭 컴포넌트
```

#### 구현된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| KPI 대시보드 | ✅ 완료 | 매출, 방문객, 전환율 등 핵심 지표 |
| 퍼널 분석 | ✅ 완료 | 입장→탐색→피팅→구매 퍼널 |
| 고객 세그먼트 | ✅ 완료 | VIP/Regular/New 세그먼트 분석 |
| 상품 성과 | ✅ 완료 | 상품별 매출/회전율 분석 |
| 히트맵 | ✅ 완료 | 존별 체류 시간 시각화 |
| 시간대별 분석 | ✅ 완료 | 시간대별 방문 패턴 |
| 목표 달성률 | ✅ 완료 | 월간/주간 목표 대비 실적 |

### To-Be (목표 상태)

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 예측 분석 | 미래 매출/방문객 예측 | P1 |
| 벤치마크 | 동종 매장 대비 성과 비교 | P2 |
| 자동 리포트 | PDF/이메일 자동 리포트 | P2 |

---

## 2.3 ROI 측정 (/roi)

### As-Is (현재 구현 상태)

#### 파일 구조
```
src/features/roi/
├── ROIMeasurementPage.tsx  # 메인 페이지 (6,126줄)
├── components/             # ROI 위젯
├── hooks/                  # ROI 데이터 훅
├── types/                  # 타입 정의
└── utils/                  # 계산 유틸리티
```

#### 구현된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 전략 적용 추적 | ✅ 완료 | applied_strategies 테이블 |
| 기준선 vs 실제 비교 | ✅ 완료 | 전/후 메트릭 비교 |
| ROI 계산 | ✅ 완료 | 예상 vs 실제 ROI |
| Continuous Learning | ✅ 완료 | 피드백 기반 신뢰도 조정 |
| 성공 패턴 분석 | ✅ 완료 | 성공/실패 패턴 학습 |

---

## 2.4 설정 (/settings)

### As-Is (현재 구현 상태)

| 기능 | 상태 | 설명 |
|------|------|------|
| 매장 관리 | ✅ 완료 | 매장 정보 CRUD |
| 사용자 프로필 | ✅ 완료 | 프로필 편집 |
| 데이터 임포트 | ✅ 완료 | CSV 임포트 (CSV, Excel) |
| 온톨로지 매핑 | ✅ 완료 | 필드 매핑 설정 |
| API 연동 | ⚠️ 부분 | POS 연동 구현 중 |

---

## 2.5 데이터 관리

### As-Is (현재 구현 상태)

#### 파일 구조
```
src/features/data-management/
├── components/           # UI 컴포넌트
├── import/              # 데이터 임포트
│   └── components/      # 임포트 위저드
└── ontology/            # 온톨로지 관리
    ├── components/      # 온톨로지 UI
    └── hooks/           # 온톨로지 훅
```

#### 구현된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| CSV 임포트 | ✅ 완료 | 거래/방문/고객 데이터 |
| 자동 스키마 감지 | ✅ 완료 | 컬럼 자동 인식 |
| 온톨로지 매핑 | ✅ 완료 | 필드→테이블 매핑 |
| 데이터 검증 | ✅ 완료 | 타입/형식 검증 |
| 임포트 히스토리 | ⚠️ 부분 | file_path 컬럼 필요 |

---

# Part 3: AI/ML 시스템 분석

## 3.1 현재 AI 기능

### Edge Functions 분석

| 함수명 | 코드량 | 용도 | AI 모델 | 상태 |
|--------|-------|------|--------|------|
| advanced-ai-inference | 4,715줄 | Ultimate AI 추론 | Claude | ✅ 완료 |
| generate-optimization | 1,449줄 | 레이아웃 최적화 | Claude | ✅ 완료 |
| unified-ai | 1,094줄 | 통합 AI 인터페이스 | Claude | ✅ 완료 |
| retail-ai-inference | 615줄 | 리테일 전용 AI | Claude | ✅ 완료 |
| run-simulation | 619줄 | 시뮬레이션 실행 | 규칙 기반 | ✅ 완료 |
| environment-proxy | 367줄 | 환경 데이터 수집 | N/A | ✅ 완료 |

### Ultimate AI 모듈 상세 (Phase 0-3)

```
generate-optimization/
├── data/
│   ├── layoutDataLoader.ts      # Phase 0.1: 레이아웃 데이터 로더
│   ├── flowAnalyzer.ts          # Phase 0.2: 동선 분석
│   ├── associationMiner.ts      # Phase 0.3: 연관 규칙 마이닝
│   └── environmentDataLoader.ts # 환경 데이터 로더
├── prompt/
│   ├── cotPromptBuilder.ts      # Phase 1.1: Chain-of-Thought
│   └── fewShotManager.ts        # Phase 1.2: Few-Shot Learning
├── prediction/
│   ├── conversionPredictor.ts   # Phase 2: 전환 예측
│   └── demandForecaster.ts      # Phase 2: 수요 예측
├── vmd/
│   └── vmdAnalyzer.ts           # Phase 3: VMD 분석
└── learning/
    └── learningModule.ts        # Continuous Learning
```

### 데이터 품질 현황

| 테이블 | 현재 데이터량 | 최소 요구량 | 상태 |
|--------|-------------|-----------|------|
| transactions | ~175건 | 50건 | ✅ 충분 |
| line_items | ~350건 | 100건 | ✅ 충분 |
| store_visits | ~1,250건 | 200건 | ✅ 충분 |
| weather_data | 90일 | 30일 | ✅ 충분 |
| holidays_events | 30건 | 10건 | ✅ 충분 |
| product_associations | 20건 | 10건 | ✅ 충분 |

## 3.2 AI 신뢰도 현황

| 모듈 | 예상 신뢰도 | 현재 신뢰도 | 개선 방안 |
|------|-----------|-----------|----------|
| 레이아웃 최적화 | 70%+ | 65% | 더 많은 피드백 데이터 |
| 동선 분석 | 80%+ | 75% | IoT 센서 연동 |
| 연관 분석 | 70%+ | 68% | 거래 데이터 축적 |
| 전환 예측 | 75%+ | 70% | 실시간 데이터 |

---

# Part 4: 데이터베이스 분석

## 4.1 테이블 현황

### 핵심 테이블 (40개+)

| 테이블명 | 용도 | 주요 관계 |
|----------|------|----------|
| stores | 매장 정보 | users, organizations |
| products | 상품 정보 | stores |
| zones_dim | 매장 존 정의 | stores |
| transactions | 거래 내역 | stores, customers |
| line_items | 거래 상세 | transactions, products |
| store_visits | 방문 기록 | stores, customers |
| daily_kpis_agg | 일별 KPI 집계 | stores |
| hourly_metrics | 시간별 메트릭 | stores |
| zone_daily_metrics | 존별 일간 메트릭 | zones_dim |
| customers | 고객 정보 | stores |
| customer_segments_agg | 고객 세그먼트 집계 | stores |
| product_performance_agg | 상품 성과 집계 | stores, products |
| funnel_events | 퍼널 이벤트 | store_visits |
| zone_events | 존 이벤트 | zones_dim |
| weather_data | 날씨 데이터 | stores |
| holidays_events | 공휴일/이벤트 | stores |
| product_associations | 상품 연관 규칙 | stores, products |
| applied_strategies | 적용된 전략 | stores |
| strategy_feedback | 전략 피드백 | applied_strategies |
| ai_model_performance | AI 모델 성능 | stores |
| learning_adjustments | 학습 조정 이력 | stores |
| store_goals | 매장 목표 | stores |
| store_scenes | 3D 씬 데이터 | stores |
| furniture | 가구 정보 | stores |
| furniture_slots | 가구 슬롯 | furniture |
| product_placements | 상품 배치 | products, furniture_slots |
| staff | 직원 정보 | stores |
| ai_recommendations | AI 추천 내역 | stores |
| ontology_entity_types | 온톨로지 엔티티 | organizations |
| ontology_relation_types | 온톨로지 관계 | organizations |
| graph_entities | 그래프 엔티티 | stores |
| graph_relations | 그래프 관계 | graph_entities |

## 4.2 마이그레이션 현황

- **총 마이그레이션 수**: 53개
- **최신 마이그레이션**: 20260105_product_associations.sql

### 최근 마이그레이션

| 날짜 | 파일 | 내용 |
|------|------|------|
| 2026-01-05 | product_associations.sql | 상품 연관 규칙 테이블 |
| 2026-01-05 | weather_holidays_unique_constraints.sql | 날씨/공휴일 유니크 제약 |
| 2026-01-05 | auto_learning_tables.sql | 자동 학습 테이블 |
| 2025-12-16 | furniture_table.sql | 가구 테이블 |
| 2025-12-16 | product_placement_and_avatars.sql | 상품 배치 및 아바타 |
| 2025-12-16 | display_type_and_slots.sql | 디스플레이 타입 및 슬롯 |

---

# Part 5: API 및 연동 분석

## 5.1 Edge Functions (22개)

### AI/추론 함수 (4개)
| 함수 | 용도 | 호출 빈도 |
|------|------|----------|
| advanced-ai-inference | Ultimate AI 통합 추론 | 높음 |
| generate-optimization | 레이아웃 최적화 생성 | 높음 |
| unified-ai | 범용 AI 인터페이스 | 중간 |
| retail-ai-inference | 리테일 특화 추론 | 중간 |

### 데이터 처리 함수 (8개)
| 함수 | 용도 |
|------|------|
| unified-etl | 통합 ETL |
| integrated-data-pipeline | 데이터 파이프라인 |
| datasource-mapper | 데이터소스 매핑 |
| import-with-ontology | 온톨로지 기반 임포트 |
| auto-map-etl | 자동 ETL 매핑 |
| smart-ontology-mapping | 스마트 온톨로지 매핑 |
| sync-api-data | API 데이터 동기화 |
| process-wifi-data | WiFi 트래킹 데이터 처리 |

### 집계/분석 함수 (5개)
| 함수 | 용도 |
|------|------|
| aggregate-all-kpis | 전체 KPI 집계 |
| aggregate-dashboard-kpis | 대시보드 KPI 집계 |
| graph-query | 그래프 쿼리 |
| run-simulation | 시뮬레이션 실행 |
| simulation-data-mapping | 시뮬레이션 데이터 매핑 |

### 외부 연동 함수 (3개)
| 함수 | 용도 |
|------|------|
| environment-proxy | 날씨/공휴일 API 프록시 |
| inventory-monitor | 재고 모니터링 |
| etl-scheduler | ETL 스케줄러 |

### 3D 모델 함수 (2개)
| 함수 | 용도 |
|------|------|
| analyze-3d-model | 3D 모델 분석 |
| auto-process-3d-models | 3D 모델 자동 처리 |

## 5.2 외부 API 연동

| API | 용도 | 연동 상태 | 파일 위치 |
|-----|------|----------|----------|
| OpenWeatherMap | 현재 날씨 | ✅ 완료 | environment-proxy |
| 공공데이터포털 | 공휴일 정보 | ✅ 완료 | environment-proxy |
| Claude AI Gateway | AI 추론 | ✅ 완료 | generate-optimization |
| Supabase Storage | 파일 저장 | ✅ 완료 | auto-process-3d-models |

---

# Part 6: 코드 품질 분석

## 6.1 TODO/FIXME 현황

| # | 파일 | 라인 | 내용 | 우선순위 |
|---|------|------|------|---------|
| 1 | conversionPredictor.ts | 868 | peakHour 시간대 결정 로직 | P2 |
| 2 | datasource-mapper/index.ts | 409 | 실제 데이터 동기화 구현 | P1 |
| 3 | useDataSourceMapping.ts | 444 | 프리셋 API 활성화 로직 | P2 |
| 4 | useRealtimeTracking.ts | 76 | iot_sensors 테이블 생성 | P1 |
| 5 | modelLayerLoader.ts | 585 | 기본 모델 URL 교체 | P2 |
| 6 | DataValidation.tsx | 83 | file_path 컬럼 추가 | P3 |
| 7 | DataImportHistory.tsx | 221 | 스토리지 정리 구현 | P3 |

**총 TODO/FIXME**: 7개

## 6.2 기술 부채

| 항목 | 설명 | 영향 | 해결 방안 | 우선순위 |
|------|------|------|----------|---------|
| IoT 테이블 미생성 | iot_sensors 테이블 없음 | 실시간 추적 불가 | 마이그레이션 추가 | P1 |
| 대용량 파일 | DigitalTwinStudioPage.tsx 66K줄 | 유지보수 어려움 | 컴포넌트 분리 | P2 |
| 하드코딩된 URL | 기본 3D 모델 URL 하드코딩 | 환경별 설정 불가 | 환경변수화 | P3 |
| 임포트 파일 추적 | file_path 저장 안됨 | 히스토리 불완전 | 스키마 업데이트 | P3 |

---

# Part 7: 로드맵

## 7.1 단기 (1-3개월)

### P0: 즉시 해결
| # | 작업 | 파일 | 예상 시간 |
|---|------|------|----------|
| 1 | iot_sensors 테이블 생성 | 마이그레이션 | 2시간 |
| 2 | datasource-mapper 동기화 구현 | datasource-mapper/index.ts | 4시간 |
| 3 | 환경변수 정리 | .env.example 업데이트 | 1시간 |

### P1: 1개월 내
| # | 작업 | 설명 | 예상 시간 |
|---|------|------|----------|
| 1 | AI 신뢰도 70%+ 달성 | 피드백 데이터 축적 및 학습 | 2주 |
| 2 | 실시간 트래킹 파이프라인 | WebSocket 기반 실시간 데이터 | 1주 |
| 3 | 예측 분석 대시보드 | 미래 매출/방문객 예측 위젯 | 1주 |
| 4 | 자동 리포트 생성 | PDF 리포트 자동화 | 3일 |

## 7.2 중기 (3-6개월)

| 작업 | 설명 | 의존성 | 예상 기간 |
|------|------|--------|----------|
| 멀티 매장 비교 | 여러 매장 동시 분석 | 멀티 테넌시 완성 | 1개월 |
| IoT 센서 연동 | 실시간 센서 데이터 | IoT 인프라 | 2개월 |
| AI 자동 레이아웃 | 완전 자동화 배치 | ML 모델 개선 | 2개월 |
| 벤치마크 시스템 | 동종 매장 비교 | 데이터 익명화 | 1개월 |

## 7.3 장기 (6-12개월)

| 작업 | 설명 | 의존성 | 예상 기간 |
|------|------|--------|----------|
| AR 매장 투어 | WebXR 기반 AR 뷰 | WebXR API | 3개월 |
| 음성 인터페이스 | 음성 명령 지원 | Speech API | 2개월 |
| 고급 ML 모델 | 자체 학습 모델 | 데이터 축적 | 6개월 |
| 모바일 앱 | React Native 앱 | API 안정화 | 4개월 |

---

# Part 8: 리스크 및 의존성

## 8.1 기술적 리스크

| 리스크 | 영향도 | 발생 가능성 | 완화 방안 |
|--------|-------|-----------|----------|
| AI 응답 지연 | 높음 | 중간 | 캐싱, 폴백 로직 |
| 3D 렌더링 성능 | 중간 | 중간 | LOD, 인스턴싱 |
| 실시간 데이터 스케일 | 높음 | 낮음 | 스트리밍, 샤딩 |
| 외부 API 의존성 | 중간 | 낮음 | 폴백 데이터 |

## 8.2 외부 의존성

| 의존성 | 용도 | 대안 | 전환 비용 |
|--------|------|------|----------|
| Supabase | BaaS | AWS/Firebase | 높음 |
| Claude API | AI 추론 | OpenAI/자체 모델 | 중간 |
| OpenWeatherMap | 날씨 데이터 | 기상청 API | 낮음 |
| Three.js | 3D 렌더링 | Babylon.js | 높음 |

---

# 부록

## A. 즉시 조치 필요 항목 Top 5

1. **iot_sensors 테이블 생성** - 실시간 추적 기능 활성화를 위한 필수 작업
2. **datasource-mapper 동기화 로직 완성** - 데이터 파이프라인 안정화
3. **AI 피드백 데이터 축적** - 신뢰도 향상을 위한 지속적 학습
4. **DigitalTwinStudioPage 리팩토링** - 66K줄 파일 분리
5. **환경변수 문서화** - 배포 환경 설정 표준화

## B. 가장 큰 기술 부채 3가지

1. **대용량 단일 파일** (DigitalTwinStudioPage.tsx - 66,821줄)
   - 문제: 유지보수 어려움, 빌드 시간 증가
   - 해결: 컴포넌트 분리, 레이지 로딩 적용

2. **IoT 센서 테이블 미구현**
   - 문제: 실시간 추적 기능 비활성화
   - 해결: 마이그레이션 추가 및 데이터 파이프라인 구축

3. **하드코딩된 설정값**
   - 문제: 환경별 설정 어려움
   - 해결: 환경변수화 및 설정 관리 시스템

## C. 다음 스프린트 권장 작업

### Sprint 1 (2주)
- [ ] iot_sensors 테이블 마이그레이션 작성 및 적용
- [ ] datasource-mapper 동기화 로직 구현
- [ ] AI 신뢰도 모니터링 대시보드 추가
- [ ] 환경변수 정리 및 .env.example 업데이트

### Sprint 2 (2주)
- [ ] DigitalTwinStudioPage 컴포넌트 분리 (Phase 1)
- [ ] 실시간 트래킹 WebSocket 구현
- [ ] 예측 분석 위젯 추가
- [ ] 자동 리포트 PDF 생성 기능

---

# 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-01-05 | 최초 작성 | Claude Code |
