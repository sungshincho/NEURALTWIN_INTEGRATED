# Customer Dashboard 프로젝트 현황 보고서

**작성일**: 2025-12-16
**최종 수정**: 2025-12-17
**버전**: 2.1
**프로젝트명**: NeuralTwin Customer Dashboard

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 2.1 | 2025-12-17 | 슬롯 기반 제품 배치 구현, 모든 기능 검증 완료, 빌드 검증 |
| 2.0 | 2025-12-17 | 데이터 소스 문서화, 3-Layer 아키텍처, 시드 데이터 상세화, 데이터 연결 현황 추가 |
| 1.1 | 2025-12-16 | 미사용 코드 정리 (4,444줄 삭제) |
| 1.0 | 2025-12-16 | 최초 작성 |

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개
리테일 매장을 위한 통합 분석 및 디지털 트윈 플랫폼입니다. AI 기반 인사이트, 3D 시뮬레이션, ROI 측정 기능을 제공하여 매장 운영 최적화를 지원합니다.

### 1.2 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트엔드** | React 18, TypeScript, Vite |
| **스타일링** | TailwindCSS, shadcn/ui |
| **상태관리** | Zustand, TanStack Query |
| **3D 렌더링** | Three.js, @react-three/fiber, @react-three/drei |
| **백엔드** | Supabase (PostgreSQL, Edge Functions) |
| **차트** | Recharts |
| **폼 관리** | React Hook Form, Zod |

---

## 2. 프로젝트 구조

### 2.1 디렉토리 구조

```
Customer_Dashboard/
├── src/                          # 프론트엔드 소스코드
│   ├── App.tsx                   # 메인 앱 컴포넌트
│   ├── main.tsx                  # 엔트리 포인트
│   ├── components/               # 공통 UI 컴포넌트
│   │   ├── ui/                   # shadcn/ui 컴포넌트 (40+ 컴포넌트)
│   │   ├── dashboard/            # 대시보드 관련 컴포넌트
│   │   ├── common/               # 공통 컴포넌트
│   │   ├── goals/                # 목표 설정 관련
│   │   └── notifications/        # 알림 센터
│   ├── core/                     # 코어 페이지
│   │   └── pages/                # AuthPage, NotFoundPage
│   ├── features/                 # 기능별 모듈 (Feature-based 구조)
│   │   ├── insights/             # 인사이트 허브
│   │   │   ├── tabs/             # 6개 탭 컴포넌트
│   │   │   ├── hooks/            # useInsightMetrics, useAIPrediction
│   │   │   └── components/       # FunnelChart, MetricCard
│   │   ├── studio/               # 디지털 트윈 스튜디오
│   │   ├── roi/                  # ROI 측정
│   │   │   ├── hooks/            # useROISummary, useAppliedStrategies
│   │   │   ├── components/       # ROISummaryCards, StrategyTable
│   │   │   └── types/            # roi.types.ts
│   │   ├── settings/             # 설정 페이지
│   │   ├── simulation/           # 시뮬레이션 엔진 (studio 지원)
│   │   │   ├── hooks/            # useSimulationEngine, useStoreContext
│   │   │   ├── utils/            # sceneRecipeGenerator, modelLayerLoader
│   │   │   └── types/            # 시뮬레이션 타입 정의
│   │   ├── data-management/      # 데이터 관리
│   │   └── onboarding/           # 온보딩 위자드
│   ├── hooks/                    # 커스텀 훅 (35+ 훅)
│   ├── types/                    # TypeScript 타입 정의
│   ├── utils/                    # 유틸리티 함수
│   ├── services/                 # 서비스 레이어
│   ├── store/                    # Zustand 스토어
│   ├── stores/                   # 추가 스토어
│   ├── config/                   # 설정 (Feature Flags 등)
│   ├── integrations/             # 외부 연동
│   │   └── supabase/             # Supabase 클라이언트 및 타입
│   └── lib/                      # 라이브러리 유틸
├── supabase/                     # Supabase 백엔드
│   ├── functions/                # Edge Functions (19개)
│   ├── migrations/               # DB 마이그레이션 (30+ 파일)
│   └── seeds/                    # 시드 데이터 (5개 SQL 파일)
├── scripts/                      # 스크립트
│   └── migrations/               # 마이그레이션 스크립트
├── public/                       # 정적 파일
│   └── lighting-presets/         # 3D 조명 프리셋
├── docs/                         # 문서 (30+ 문서)
└── 설정 파일들                    # package.json, tsconfig, vite.config 등
```

---

## 3. 데이터 아키텍처 (3-Layer)

### 3.1 레이어 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         L3: AGGREGATED LAYER                            │
│  daily_kpis_agg, zone_daily_metrics, product_performance_agg,          │
│  customer_segments_agg, hourly_metrics, daily_sales                     │
├─────────────────────────────────────────────────────────────────────────┤
│                         L2: FACT/DIMENSION LAYER                        │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ FACT TABLES                 │  │ DIMENSION TABLES                │  │
│  │ • funnel_events             │  │ • stores                        │  │
│  │ • zone_events               │  │ • zones_dim                     │  │
│  │ • transactions              │  │ • products                      │  │
│  │ • line_items                │  │ • customers                     │  │
│  │ • purchases                 │  │ • staff                         │  │
│  │ • store_visits              │  │ • furniture                     │  │
│  └─────────────────────────────┘  │ • furniture_slots               │  │
│                                    └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                         L1: RAW/GRAPH LAYER                             │
│  raw_imports, ontology_entity_types, ontology_relation_types,          │
│  graph_entities, graph_relations                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름

```
데이터 소스 (CSV/API/IoT)
        ↓
   L1: raw_imports → 온톨로지 매핑
        ↓
   L2: Fact Tables (funnel_events, transactions 등)
        ↓
   L3: Aggregated Tables (daily_kpis_agg 등)
        ↓
   Frontend Hooks (useInsightMetrics 등)
        ↓
   UI Components (탭, 차트, 테이블)
```

---

## 4. 메인 페이지 구조

### 4.1 라우팅 구조 (4개 메인 페이지)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` `/insights` | InsightHubPage | 통합 인사이트 허브 (대시보드 + 분석 + AI 추천) |
| `/studio` | DigitalTwinStudioPage | 디지털 트윈 3D 스튜디오 |
| `/roi` | ROIMeasurementPage | ROI 측정 대시보드 |
| `/settings` | SettingsPage | 통합 설정 페이지 |
| `/auth` | AuthPage | 로그인/인증 |

### 4.2 레거시 라우트 리다이렉트
기존 라우트들은 자동으로 새 구조로 리다이렉트됩니다:
- `/overview/*` → `/insights` 또는 `/settings`
- `/analysis/*` → `/insights?tab=...`
- `/simulation/*` → `/studio`
- `/data-management/*` → `/settings?tab=data`

---

## 5. 인사이트 허브 데이터 소스

### 5.1 Overview Tab (개요)

**파일:** `src/features/insights/tabs/OverviewTab.tsx`
**Hook:** `src/features/insights/hooks/useInsightMetrics.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Footfall (총 입장) | `daily_kpis_agg` | `total_visitors` | ✅ |
| Unique Visitors (순 방문객) | `daily_kpis_agg` + `store_visits` | `unique_visitors`, `customer_id` | ✅ |
| Revenue (총 매출) | `daily_kpis_agg` | `total_revenue` | ✅ |
| Conversion (전환율) | *계산* | `purchase / entry * 100` | ✅ |
| ATV (객단가) | *계산* | `revenue / transactions` | ✅ |
| Transactions (거래 수) | `transactions` | `COUNT(*)` | ✅ |
| Avg Dwell Time | `zone_events` | `AVG(duration_seconds)` | ✅ |
| Funnel Entry | `funnel_events` | `event_type = 'entry'` | ✅ |
| Funnel Browse | `funnel_events` | `event_type = 'browse'` | ⚠️ 보완 필요 |
| Funnel Engage | `funnel_events` | `event_type = 'engage'` | ⚠️ 보완 필요 |
| Funnel Fitting | `funnel_events` | `event_type = 'fitting'` | ⚠️ 보완 필요 |
| Funnel Purchase | `funnel_events` | `event_type = 'purchase'` | ✅ |

### 5.2 Store Tab (매장)

**파일:** `src/features/insights/tabs/StoreTab.tsx`
**Hook:** `src/hooks/useZoneMetrics.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Peak Time | `funnel_events` | `event_hour` (MAX) | ⚠️ event_hour NULL 이슈 |
| Popular Zone | `zone_daily_metrics` | `MAX(total_visitors)` | ✅ |
| Avg Dwell Time | `zone_daily_metrics` | `AVG(avg_dwell_seconds)` | ✅ |
| Tracking Coverage | *계산* | `tracked / unique * 100` | ✅ |
| Hourly Visits | `funnel_events` | `event_hour`, `event_type='entry'` | ⚠️ 보완 필요 |
| Zone Metrics | `zone_daily_metrics` | `total_visitors`, `avg_dwell_seconds` | ✅ |
| Zone Names | `zones_dim` | `zone_name`, `zone_code` | ✅ |

### 5.3 Customer Tab (고객)

**파일:** `src/features/insights/tabs/CustomerTab.tsx`
**Hook:** `src/hooks/useCustomerSegmentsAgg.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Unique Visitors | `daily_kpis_agg` | `unique_visitors` | ✅ |
| Repeat Rate | `store_visits` | 2회 이상 방문 고객 비율 | ⚠️ 0% 이슈 |
| Top Segment | `customer_segments_agg` | `MAX(customer_count)` | ✅ |
| Loyal Customers | `customer_segments_agg` | `segment='VIP'` | ✅ |
| Segment Distribution | `customer_segments_agg` | `segment_name`, `customer_count` | ✅ |
| Return Visits Chart | `daily_kpis_agg` | `total_visitors - returning_visitors` | ⚠️ 음수 이슈 |

### 5.4 Product Tab (상품)

**파일:** `src/features/insights/tabs/ProductTab.tsx`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Revenue | `product_performance_agg` | `SUM(revenue)` | ✅ |
| Transactions | `product_performance_agg` | `SUM(units_sold)` | ✅ |
| Bestseller | `product_performance_agg` + `products` | `MAX(revenue)` → `product_name` | ✅ |
| Low Stock | `product_performance_agg` | `stock_level < 10` | ✅ |
| Category Sales | `products` | `category`, `SUM(revenue)` | ✅ |
| Product Names | `products` | `product_name`, `category` | ✅ |

### 5.5 Prediction Tab (예측)

**파일:** `src/features/insights/tabs/PredictionTab.tsx`
**Hook:** `src/features/insights/hooks/useAIPrediction.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Historical Revenue | `daily_kpis_agg` | `total_revenue` (14일) | ✅ |
| Historical Visitors | `daily_kpis_agg` | `total_visitors` (14일) | ✅ |
| Historical Conversion | `daily_kpis_agg` | `conversion_rate` (14일) | ✅ |
| Predictions | *계산 (이동평균/트렌드)* | 향후 7일 예측 | ✅ |

### 5.6 AI Recommendation Tab (AI 추천)

**파일:** `src/features/insights/tabs/AIRecommendationTab.tsx`
**Hook:** `src/hooks/useAIRecommendations.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| AI Recommendations | `ai_recommendations` | `title`, `description`, `priority`, `expected_impact` | ✅ |
| Active Strategies | *Mock 데이터* | - | 🔄 구현 예정 |
| Price Optimization | *Mock 데이터* | - | 🔄 구현 예정 |
| Inventory Optimization | *Mock 데이터* | - | 🔄 구현 예정 |

---

## 6. 3D Studio 데이터 소스

### 6.1 Scene Recipe Generator

**파일:** `src/features/simulation/utils/sceneRecipeGenerator.ts`

| Asset Type | 테이블 | 컬럼 | 연결상태 |
|------------|--------|------|----------|
| Space (매장 공간) | `stores` | `model_3d_url`, `dimensions` | ✅ |
| Furniture (가구) | `furniture` | `model_url`, `position`, `rotation`, `scale` | ✅ |
| Products (상품) | `products` | `model_3d_url`, `model_3d_position`, `initial_furniture_id`, `slot_id` | ⚠️ 슬롯 배치 이슈 |
| Staff (직원) | `staff` | `avatar_url`, `avatar_position`, `staff_name`, `role` | ✅ |
| Customers (고객) | `customers` | `avatar_url`, `avatar_type` | ✅ |
| Furniture Slots | `furniture_slots` | `slot_id`, `slot_position`, `compatible_display_types` | ✅ |

### 6.2 Model Layer Loader

**파일:** `src/features/simulation/utils/modelLayerLoader.ts`

| 레이어 | 테이블 | 용도 |
|--------|--------|------|
| Space Layer | `stores` | 매장 공간 3D 모델 |
| Furniture Layer | `furniture` | 선반, 테이블, 디스플레이 |
| Product Layer | `products` + `product_placements` | 상품 3D 모델 |
| Zone Layer | `zones_dim` | 존 경계 시각화 |

### 6.3 알려진 이슈

| 이슈 | 원인 | 해결방안 |
|------|------|----------|
| 상품이 슬롯에 배치 안됨 | `model_3d_position` 직접 사용 | `calculateSlotWorldPosition()` 사용 필요 |
| 3D 모델 로드 오류 | 잘못된 URL (`demo.supabase.co`) | NULL 설정 또는 유효한 Storage URL 사용 |

---

## 7. ROI Analysis 데이터 소스

### 7.1 ROI Summary

**파일:** `src/features/roi/hooks/useROISummary.ts`

| 지표 | 테이블/RPC | 연결상태 |
|------|-----------|----------|
| Total Applied | `get_roi_summary` RPC | ⚠️ RPC 함수 필요 |
| Active Count | `applied_strategies` (status='active') | ✅ |
| Success Rate | *계산* | ✅ |
| Average ROI | *계산* | ✅ |
| Total Revenue Impact | `SUM(actual_revenue - expected_revenue)` | ✅ |

### 7.2 Applied Strategies

**파일:** `src/features/roi/hooks/useAppliedStrategies.ts`

| 지표 | 테이블 | 컬럼 | 연결상태 |
|------|--------|------|----------|
| Strategy List | `applied_strategies` | `name`, `source`, `source_module` | ✅ |
| Expected ROI | `applied_strategies` | `expected_roi` | ✅ |
| Current ROI | `applied_strategies` | `current_roi` | ✅ |
| Status | `applied_strategies` | `status`, `result` | ✅ |
| Daily Metrics | `strategy_daily_metrics` | `daily_roi`, `cumulative_roi` | ✅ |

### 7.3 Source Modules

| Source | Module | 설명 |
|--------|--------|------|
| `2d_simulation` | `price_optimization` | 가격 최적화 |
| `2d_simulation` | `inventory_optimization` | 재고 최적화 |
| `2d_simulation` | `promotion` | 프로모션 |
| `2d_simulation` | `ai_recommendation` | AI 추천 |
| `3d_simulation` | `layout_optimization` | 레이아웃 최적화 |
| `3d_simulation` | `flow_optimization` | 동선 최적화 |
| `3d_simulation` | `congestion_simulation` | 혼잡도 시뮬레이션 |
| `3d_simulation` | `staffing_optimization` | 인력 배치 최적화 |

---

## 8. 데이터베이스 스키마

### 8.1 L3: Aggregated Tables (집계 테이블)

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `daily_kpis_agg` | 일별 KPI 집계 | `total_visitors`, `unique_visitors`, `total_revenue`, `conversion_rate`, `returning_visitors` |
| `hourly_metrics` | 시간대별 메트릭 | `hour`, `visitor_count`, `revenue`, `conversion_rate` |
| `zone_daily_metrics` | 존별 일별 메트릭 | `zone_id`, `total_visitors`, `avg_dwell_seconds`, `conversion_count` |
| `product_performance_agg` | 상품별 성과 | `product_id`, `units_sold`, `revenue`, `stock_level` |
| `customer_segments_agg` | 고객 세그먼트 집계 | `segment_name`, `customer_count`, `avg_transaction_value` |
| `daily_sales` | 일별 매출 | `total_revenue`, `total_transactions`, `avg_transaction_value` |

### 8.2 L2: Fact Tables (트랜잭션 테이블)

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `funnel_events` | 고객 여정 퍼널 | `event_type`, `event_date`, `event_hour`, `session_id`, `visitor_id` |
| `zone_events` | 존 이벤트 | `zone_id`, `event_type`, `duration_seconds`, `visitor_id` |
| `transactions` | 거래 | `transaction_datetime`, `total_amount`, `customer_id` |
| `line_items` | 거래 상세 | `transaction_id`, `product_id`, `quantity`, `unit_price` |
| `purchases` | 구매 | `purchase_date`, `total_amount`, `customer_id` |
| `store_visits` | 매장 방문 | `visit_date`, `customer_id`, `duration_minutes`, `made_purchase` |

### 8.3 L2: Dimension Tables (마스터 테이블)

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `stores` | 매장 마스터 | `store_name`, `model_3d_url`, `floor_area_sqm` |
| `zones_dim` | 존 마스터 | `zone_code`, `zone_name`, `zone_type`, `coordinates` |
| `products` | 상품 마스터 | `product_name`, `sku`, `category`, `model_3d_url`, `initial_furniture_id` |
| `customers` | 고객 마스터 | `customer_id`, `avatar_url`, `avatar_type` |
| `staff` | 직원 마스터 | `staff_name`, `role`, `avatar_url`, `assigned_zone_id` |
| `furniture` | 가구 마스터 | `furniture_type`, `model_url`, `position_x/y/z`, `width/height/depth` |
| `furniture_slots` | 가구 슬롯 | `furniture_id`, `slot_id`, `slot_position`, `compatible_display_types` |

### 8.4 AI/Strategy Tables

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `ai_recommendations` | AI 추천 | `title`, `description`, `priority`, `expected_impact`, `status` |
| `ai_inference_results` | AI 추론 결과 | `inference_type`, `result_data`, `confidence` |
| `applied_strategies` | 적용된 전략 | `source`, `source_module`, `expected_roi`, `current_roi`, `status` |
| `strategy_daily_metrics` | 전략 일별 메트릭 | `strategy_id`, `daily_roi`, `cumulative_roi` |
| `strategy_feedback` | 전략 피드백 | `strategy_id`, `feedback_type`, `feedback_data` |

---

## 9. 시드 데이터

### 9.1 시드 파일 목록

| 파일 | 용도 | 데이터 수 |
|------|------|----------|
| `NEURALTWIN_UNIFIED_SEED_v8.sql` | 메인 통합 시드 | ~35개 테이블, 수만 건 |
| `NEURALTWIN_UNIFIED_SEED_v8.3.sql` | 가구/슬롯 데이터 | 가구, 슬롯 정의 |
| `INSIGHT_HUB_DATA_PATCH_v8.4.sql` | 인사이트 허브 패치 | event_type 수정 |
| `INSIGHT_HUB_DATA_FIX_v8.5.sql` | 데이터 불일치 수정 | 퍼널/시간대 보완 |
| `MVP_MODEL_URL_UPDATE.sql` | 3D 모델 URL 설정 | 모델 URL 템플릿 |

### 9.2 시드 데이터 요약 (v8.0)

| 카테고리 | 테이블 | 건수 |
|----------|--------|------|
| **마스터** | stores | 1 |
| | zones_dim | 7 |
| | products | 25 |
| | customers | 2,500 |
| | staff | 8 |
| **트랜잭션** | store_visits | ~3,500 |
| | purchases | ~490 |
| | transactions | ~490 |
| | line_items | ~980 |
| | funnel_events | ~6,000 |
| | zone_events | ~5,000 |
| **집계** | daily_kpis_agg | 90 |
| | daily_sales | 90 |
| | zone_daily_metrics | 630 |
| | hourly_metrics | 1,080 |
| | product_performance_agg | 2,250 |
| | customer_segments_agg | 540 |
| **AI/전략** | applied_strategies | 10 |
| | strategy_daily_metrics | ~50 |
| | ai_recommendations | ~8 |

### 9.3 Funnel Event Types

| Event Type | 설명 | 예상 비율 |
|------------|------|----------|
| `entry` | 입장 | 100% |
| `browse` | 탐색 | ~75% |
| `engage` | 관심/상호작용 | ~45% |
| `fitting` | 피팅/시착 | ~25% |
| `purchase` | 구매 | ~0.8% |

---

## 10. 데이터 연결 현황

### 10.1 인사이트 허브 연결 상태

| 탭 | 정상 | 이슈 | 상태 |
|----|------|------|------|
| **개요** | 6/10 | 퍼널 Browse/Engage/Fitting 누락 | ⚠️ |
| **매장** | 5/6 | 시간대별 방문 패턴 없음 | ⚠️ |
| **고객** | 4/6 | Repeat Rate 0%, 재방문 음수 | ⚠️ |
| **상품** | 6/6 | 없음 | ✅ |
| **예측** | 5/5 | 없음 | ✅ |
| **AI추천** | 3/5 | 일부 Mock 데이터 | 🔄 |

### 10.2 알려진 이슈 및 해결방안

| 이슈 | 원인 | 해결 파일 | 상태 |
|------|------|----------|------|
| 퍼널 Engage/Fitting = 0 | funnel_events 누락 | `INSIGHT_HUB_DATA_FIX_v8.5.sql` | 패치 대기 |
| 시간대별 방문 패턴 없음 | `event_hour` NULL | `INSIGHT_HUB_DATA_FIX_v8.5.sql` | 패치 대기 |
| 재방문 추이 음수 | `returning_visitors > total_visitors` | `INSIGHT_HUB_DATA_FIX_v8.5.sql` | 패치 대기 |
| Repeat Rate 0% | `store_visits.customer_id` NULL | 시드 데이터 수정 필요 | 패치 대기 |
| 3D 모델 로드 오류 | 잘못된 model URL | `MVP_MODEL_URL_UPDATE.sql` | 패치 대기 |
| 상품 슬롯 배치 안됨 | `model_3d_position` 직접 사용 | `sceneRecipeGenerator.ts` | ✅ 수정 완료 |

---

## 11. 커스텀 Hooks

### 11.1 핵심 Hooks (35+)

| 훅 | 파일 | 기능 |
|----|------|------|
| **useAuth** | useAuth.tsx | 인증, 사용자 정보, 조직, 역할 |
| **useSelectedStore** | useSelectedStore.tsx | 선택된 매장 관리 |
| **useInsightMetrics** | features/insights/hooks | 인사이트 허브 통합 메트릭 |
| **useAIPrediction** | features/insights/hooks | AI 예측 데이터 |
| **useDashboardKPI** | useDashboardKPI.ts | 대시보드 KPI 조회 |
| **useDashboardKPIAgg** | useDashboardKPIAgg.ts | 집계된 KPI |
| **useCustomerSegments** | useCustomerSegments.ts | 고객 세그먼트 |
| **useCustomerSegmentsAgg** | useCustomerSegmentsAgg.ts | 고객 세그먼트 집계 |
| **useCustomerJourney** | useCustomerJourney.ts | 고객 여정 분석 |
| **useProductPerformance** | useProductPerformance.ts | 상품 성과 |
| **useFunnelAnalysis** | useFunnelAnalysis.ts | 퍼널 분석 |
| **useFootfallAnalysis** | useFootfallAnalysis.ts | 방문객 분석 |
| **useZoneMetrics** | useZoneMetrics.ts | 존 메트릭 |
| **useZoneTransition** | useZoneTransition.ts | 존 전환 분석 |
| **useAIRecommendations** | useAIRecommendations.ts | AI 추천 |
| **useROISummary** | features/roi/hooks | ROI 요약 |
| **useAppliedStrategies** | features/roi/hooks | 적용된 전략 |
| **useCategoryPerformance** | features/roi/hooks | 카테고리별 성과 |

---

## 12. Supabase Edge Functions

### 12.1 함수 목록 (19개)

| 함수명 | 기능 |
|--------|------|
| **advanced-ai-inference** | 고급 AI 추론 (139KB) + 학습 모듈 |
| **unified-ai** | 통합 AI 서비스 |
| **retail-ai-inference** | 리테일 AI 추론 |
| **unified-etl** | 통합 ETL 파이프라인 |
| **integrated-data-pipeline** | 통합 데이터 파이프라인 |
| **smart-ontology-mapping** | AI 기반 온톨로지 매핑 |
| **import-with-ontology** | 온톨로지 연동 임포트 |
| **datasource-mapper** | 데이터 소스 매퍼 |
| **auto-map-etl** | 자동 ETL 매핑 |
| **sync-api-data** | API 데이터 동기화 |
| **graph-query** | 그래프 쿼리 |
| **aggregate-dashboard-kpis** | 대시보드 KPI 집계 |
| **aggregate-all-kpis** | 전체 KPI 집계 |
| **etl-scheduler** | ETL 스케줄러 |
| **process-wifi-data** | WiFi 데이터 처리 |
| **analyze-3d-model** | 3D 모델 분석 |
| **auto-process-3d-models** | 3D 모델 자동 처리 |
| **simulation-data-mapping** | 시뮬레이션 데이터 매핑 |
| **inventory-monitor** | 재고 모니터링 |

---

## 13. 온톨로지 시스템

### 13.1 아키텍처

```
데이터 소스 → 데이터 파이프라인 → 온톨로지 스토리지 → AI 추론 → 애플리케이션
```

### 13.2 온톨로지 구성

| 구분 | 수량 | 설명 |
|------|------|------|
| Entity Types | 43개 | Customer, Product, Store, Zone 등 |
| Relation Types | 89개 | 엔티티 간 관계 정의 |
| Graph Entities | 수천~수만 | 실제 엔티티 인스턴스 |
| Graph Relations | 수만~수십만 | 엔티티 간 관계 인스턴스 |

### 13.3 데이터 파이프라인

**Phase 1: 배치 변환** ✅
- CSV → 온톨로지
- API → 온톨로지
- AI 기반 자동 매핑

**Phase 2: 실시간 동기화** ✅
- Database 트리거를 통한 자동 엔티티 생성
- AI 관계 추론

**Phase 3: AI 추론** 🔄
- 추천 시스템
- 이상 탐지
- 패턴 분석
- 예측 모델링

---

## 14. 구현 상태 요약

### 14.1 완료된 기능 ✅

- [x] 4개 메인 페이지 구조 (Insights, Studio, ROI, Settings)
- [x] 인증 및 권한 관리
- [x] 다중 매장 지원
- [x] 대시보드 KPI 분석
- [x] 고객 세그먼트 분석
- [x] 상품 성과 분석
- [x] 3D 디지털 트윈 뷰어
- [x] 레이어 관리 시스템
- [x] 히트맵 오버레이
- [x] 시뮬레이션 엔진 (레이아웃, 동선, 혼잡도, 인력)
- [x] ROI 측정 대시보드
- [x] 온톨로지 시스템 (Phase 1, 2 완료)
- [x] 데이터 임포트 (CSV, Excel)
- [x] API 연동 시스템
- [x] AI 추론 엔진
- [x] 온보딩 위자드
- [x] 미사용 코드 정리 (v1.1)
- [x] 3-Layer 데이터 아키텍처 (v2.0)
- [x] 통합 시드 데이터 v8.0 (v2.0)

### 14.2 진행 중인 기능 🔄

- [ ] 인사이트 허브 데이터 불일치 수정 (v8.5 패치 - 실행 대기)
- [ ] 온톨로지 AI 추론 (Phase 3)
- [ ] 고급 예측 모델링

### 14.3 완료된 최적화 (v2.1) ✅

- [x] **슬롯 기반 제품 배치 구현**: `sceneRecipeGenerator.ts`에서 `initial_furniture_id` + `slot_id` 기반으로 `calculateSlotWorldPosition()` 함수를 사용하여 제품 위치 자동 계산
- [x] **모든 기능 모듈 검증**: Insight Hub (6탭), Digital Twin Studio, ROI Measurement, Settings (5탭) 구현 완료 확인
- [x] **ROI RPC 함수 확인**: `get_roi_summary`, `get_category_performance` 함수 정상 작동 확인
- [x] **빌드 검증**: `npm run build` 성공 (3.1MB JS 번들)

### 14.4 계획된 기능 📋

- [ ] 고급 AI 추천 시스템
- [ ] 이상 탐지 시스템
- [ ] 고급 패턴 분석
- [ ] 다국어 지원 확대

---

## 15. 문서 목록

### 15.1 주요 문서 (docs/)

| 문서 | 내용 |
|------|------|
| `PROJECT_STATUS_REPORT.md` | 프로젝트 현황 보고서 (현재 문서) |
| `DATA_FLOW_ARCHITECTURE.md` | 데이터 흐름 아키텍처 |
| `UNUSED_CODE_ANALYSIS.md` | 미사용 코드 분석 보고서 |
| `CUSTOMER_DASHBOARD_SPECIFICATION.md` | 고객 대시보드 사양 |
| `NEURALTWIN_ADMIN_DASHBOARD_SPECIFICATION.md` | 관리자 대시보드 사양 |
| `NEURALTWIN_BACKEND_SPECIFICATION.md` | 백엔드 사양 |
| `ONTOLOGY_COMPLETE_ARCHITECTURE.md` | 온톨로지 아키텍처 |
| `DATA_PIPELINE_PHASE1_IMPLEMENTATION.md` | 데이터 파이프라인 구현 |
| `INTEGRATED_ARCHITECTURE_GUIDE.md` | 통합 아키텍처 가이드 |
| `SIMULATION_GUIDE.md` | 시뮬레이션 가이드 |
| `3D_MODEL_UPLOAD_SCENARIOS.md` | 3D 모델 업로드 시나리오 |
| `WIFI_TRACKING_CSV_GUIDE.md` | WiFi 추적 CSV 가이드 |
| `IOT_TRACKING_INTEGRATION.md` | IoT 추적 통합 |
| `DATA_MANAGEMENT_GUIDE.md` | 데이터 관리 가이드 |

---

## 16. 개발 팀 가이드

### 16.1 코드 구조 원칙

1. **Feature-based 구조**: 기능별로 모듈화
2. **컴포넌트 분리**: UI, 로직, 타입 분리
3. **커스텀 훅 활용**: 비즈니스 로직 재사용
4. **TypeScript 엄격 모드**: 타입 안전성 확보

### 16.2 데이터 레이어 원칙

1. **L3 우선 조회**: 집계 테이블(L3) 먼저 조회
2. **L2 폴백**: L3 데이터 없을 시 L2에서 계산
3. **org_id/store_id 필터링**: 멀티테넌트 지원
4. **날짜 범위 필터링**: dateRange 활용

### 16.3 새 기능 추가 시

1. `features/` 디렉토리에 새 모듈 생성
2. 컴포넌트, 훅, 타입 분리
3. 필요시 Edge Function 추가
4. 타입 정의 업데이트
5. 시드 데이터에 샘플 데이터 추가

### 16.4 데이터 이슈 해결 시

1. 먼저 SQL 쿼리로 현재 데이터 상태 확인
2. `supabase/seeds/` 에 패치 SQL 작성
3. 패치 실행 후 프론트엔드 확인
4. 문서 업데이트

---

**문서 끝**
