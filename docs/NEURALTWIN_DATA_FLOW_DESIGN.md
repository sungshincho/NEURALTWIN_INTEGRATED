# NEURALTWIN 플랫폼 데이터 흐름 및 연결성 설계 문서

## 문서 정보
- **버전**: 1.0.0
- **작성일**: 2026-01-14
- **목적**: Data Control Tower, Insight Hub, Digital Twin Studio 간의 데이터 흐름 및 연결성 상세 설계

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [데이터 레이어 아키텍처](#2-데이터-레이어-아키텍처)
3. [Data Control Tower](#3-data-control-tower)
4. [Insight Hub](#4-insight-hub)
5. [Digital Twin Studio](#5-digital-twin-studio)
6. [테이블 스키마 상세](#6-테이블-스키마-상세)
7. [RPC 함수 목록](#7-rpc-함수-목록)
8. [데이터 품질 관리](#8-데이터-품질-관리)

---

## 1. 아키텍처 개요

### 1.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEURALTWIN 플랫폼                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Data Control   │  │   Insight Hub   │  │   Digital Twin Studio       │ │
│  │     Tower       │  │                 │  │                             │ │
│  │                 │  │  ┌───────────┐  │  │  ┌────────┐ ┌────────────┐  │ │
│  │ - API Connector │  │  │ Overview  │  │  │  │ 3D     │ │ Simulation │  │ │
│  │ - Data Pipeline │  │  │ Store     │  │  │  │ Viewer │ │            │  │ │
│  │ - Lineage       │  │  │ Customer  │  │  │  └────────┘ └────────────┘  │ │
│  │ - Quality Score │  │  │ Product   │  │  │                             │ │
│  └────────┬────────┘  │  │ Prediction│  │  │  ┌────────┐ ┌────────────┐  │ │
│           │           │  │ AI Reco   │  │  │  │Heatmap │ │ Analytics  │  │ │
│           │           │  └───────────┘  │  │  └────────┘ └────────────┘  │ │
│           │           └────────┬────────┘  └──────────────┬──────────────┘ │
│           │                    │                          │                │
│           └────────────────────┼──────────────────────────┘                │
│                                │                                            │
│  ┌─────────────────────────────┴─────────────────────────────────────────┐ │
│  │                    InsightDataProvider (Context)                       │ │
│  │   - storeData, customerData, productData, predictions, recommendations│ │
│  └───────────────────────────────┬───────────────────────────────────────┘ │
│                                  │                                          │
│  ┌───────────────────────────────┴───────────────────────────────────────┐ │
│  │                         Supabase Backend                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │  │L1: Raw   │→→│L2: Fact  │→→│L3: Agg   │→→│RPC Funcs │              │ │
│  │  │Imports   │  │Tables    │  │Tables    │  │          │              │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 소스 유형

| 소스 유형 | 데이터 카테고리 | 설명 |
|----------|---------------|------|
| POS | pos | 매출/거래 데이터 (Toast, Square, Shopify 등) |
| CRM | crm | 고객 관계 관리 데이터 (HubSpot, Salesforce 등) |
| ERP | erp | 재고 및 상품 관리 데이터 |
| Sensor | sensor | WiFi/BLE/카메라 센서 데이터 (NEURALSENSE) |
| E-commerce | ecommerce | 온라인 판매 데이터 |
| Analytics | analytics | 분석 및 통계 데이터 |

---

## 2. 데이터 레이어 아키텍처

### 2.1 3-레이어 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        L3: Aggregation Layer                        │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐  │
│  │ daily_kpis_agg  │ │zone_daily_metrics│ │customer_segments_agg│  │
│  └─────────────────┘ └──────────────────┘ └─────────────────────┘  │
│  ┌─────────────────┐ ┌──────────────────┐                          │
│  │hourly_metrics   │ │product_perf_agg  │                          │
│  └─────────────────┘ └──────────────────┘                          │
├─────────────────────────────────────────────────────────────────────┤
│                           L2: Fact Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────────┐   │
│  │transactions │ │ zone_events │ │funnel_evts │ │ line_items   │   │
│  └─────────────┘ └─────────────┘ └────────────┘ └──────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────────┐   │
│  │   visits    │ │visit_zone_ev│ │inv_movemnts│ │ purchases    │   │
│  └─────────────┘ └─────────────┘ └────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                        L2: Dimension Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────────┐   │
│  │  zones_dim  │ │  products   │ │ customers  │ │    staff     │   │
│  └─────────────┘ └─────────────┘ └────────────┘ └──────────────┘   │
│  ┌─────────────┐ ┌─────────────┐                                    │
│  │   stores    │ │organizations│                                    │
│  └─────────────┘ └─────────────┘                                    │
├─────────────────────────────────────────────────────────────────────┤
│                          L1: Raw Layer                              │
│  ┌─────────────────────┐ ┌─────────────────────────────────────┐   │
│  │     raw_imports     │ │          user_data_imports          │   │
│  │  - source_type      │ │  - file_name, file_type             │   │
│  │  - source_name      │ │  - raw_data (JSONB)                 │   │
│  │  - row_count        │ │  - status                           │   │
│  │  - status           │ │  - progress                         │   │
│  └─────────────────────┘ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 ETL 파이프라인 흐름

```
External API/CSV → raw_imports (L1) → ETL Processing → Fact Tables (L2) → Aggregation (L3)
                          ↓
                    etl_runs (로깅)
                          ↓
                  source_trace (Lineage)
```

---

## 3. Data Control Tower

### 3.1 기능 개요

Data Control Tower는 플랫폼의 데이터 품질 모니터링 및 관리를 담당하는 중앙 제어 센터입니다.

### 3.2 주요 기능

| 기능 | 설명 | 관련 컴포넌트 |
|-----|------|-------------|
| API 연결 관리 | 외부 시스템 API 연결 생성/수정/삭제 | `ApiConnectionsList`, `ApiConnectionEditor` |
| 데이터 파이프라인 | Import → ETL → Aggregation 모니터링 | `DataPipelineStatus` |
| 품질 점수 | 데이터 커버리지 및 완전성 평가 | `DataQualityScore` |
| Lineage 탐색 | KPI → Fact → Raw 역추적 | `LineageExplorer` |
| 최근 Import | Import 이력 및 재처리 | `RecentImportsList` |

### 3.3 Hook-to-Table 매핑

```typescript
// src/features/data-control/hooks/useDataControlTower.ts

Hook: useDataControlTowerStatus()
├── RPC: get_data_control_tower_status(store_id)
│   ├── raw_imports (L1)
│   ├── etl_runs
│   ├── zone_events (L2)
│   ├── transactions (L2)
│   ├── customers (L2)
│   ├── products (L2)
│   ├── zones_dim (L2 DIM)
│   └── daily_kpis_agg (L3)
└── Returns: DataControlTowerStatus

Hook: useDataQualityScore()
├── RPC: calculate_data_quality_score(store_id, date)
│   ├── transactions → POS 커버리지
│   ├── zone_events → Sensor 커버리지
│   ├── customers → CRM 커버리지
│   ├── products → Product 커버리지
│   └── zones_dim → Zone 커버리지
└── Returns: DataQualityScore

Hook: useKPILineage()
├── RPC: get_kpi_lineage(kpi_table, kpi_id, store_id, date)
│   ├── daily_kpis_agg.source_trace
│   ├── zone_daily_metrics.source_trace
│   ├── etl_runs
│   └── raw_imports
└── Returns: KPILineage

Hook: useApiConnections()
├── Table: api_connections
│   ├── SELECT with filters (org_id, store_id)
│   └── JOIN: api_mapping_templates
└── Returns: ApiConnection[]

Hook: useSyncConnection()
├── Table: api_connections (읽기)
├── RPC: sync_api_connection (실행)
├── Table: api_sync_logs (기록)
└── Target Tables: transactions, customers, products, etc.
```

### 3.4 데이터 흐름 다이어그램

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Data Control Tower                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      API Connections Panel                          ││
│  │                                                                     ││
│  │  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐  ││
│  │  │ Toast POS   │───→│ api_connections │───→│ transactions      │  ││
│  │  │ (Provider)  │    │ (Config)        │    │ line_items        │  ││
│  │  └─────────────┘    └─────────────────┘    └───────────────────┘  ││
│  │                                                                     ││
│  │  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐  ││
│  │  │ HubSpot CRM │───→│ field_mappings  │───→│ customers         │  ││
│  │  │ (Provider)  │    │ (Transform)     │    │                   │  ││
│  │  └─────────────┘    └─────────────────┘    └───────────────────┘  ││
│  │                                                                     ││
│  │  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐  ││
│  │  │ NEURALSENSE │───→│ api_sync_logs   │───→│ zone_events       │  ││
│  │  │ (WiFi/BLE)  │    │ (History)       │    │ visits            │  ││
│  │  └─────────────┘    └─────────────────┘    └───────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      Data Pipeline Panel                            ││
│  │                                                                     ││
│  │     L1: Raw           L2: Fact            L3: Aggregate            ││
│  │  ┌──────────┐      ┌──────────────┐     ┌─────────────────┐       ││
│  │  │raw_imports│ ──→ │transactions  │ ──→ │daily_kpis_agg   │       ││
│  │  │          │      │zone_events   │     │zone_daily_metrics│       ││
│  │  │          │      │line_items    │     │hourly_metrics   │       ││
│  │  │          │      │funnel_events │     │customer_seg_agg │       ││
│  │  └──────────┘      └──────────────┘     └─────────────────┘       ││
│  │       │                   │                      │                 ││
│  │       └───────────────────┴──────────────────────┘                 ││
│  │                           │                                         ││
│  │                     ┌─────────────┐                                 ││
│  │                     │  etl_runs   │                                 ││
│  │                     │  (Logging)  │                                 ││
│  │                     └─────────────┘                                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      Data Quality Panel                             ││
│  │                                                                     ││
│  │  Coverage Scores:                                                   ││
│  │  ┌──────────────────────────────────────────────────────────────┐  ││
│  │  │ POS: transactions.COUNT / 1000 × 0.25                        │  ││
│  │  │ Sensor: zone_events.COUNT / 5000 × 0.30                      │  ││
│  │  │ CRM: customers.COUNT > 0 ? 1 : 0 × 0.15                      │  ││
│  │  │ Product: products.COUNT > 0 ? 1 : 0 × 0.15                   │  ││
│  │  │ Zone: zones_dim.COUNT > 0 ? 1 : 0 × 0.15                     │  ││
│  │  └──────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Confidence Level: high (≥80%) / medium (≥50%) / low (<50%)        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Insight Hub

### 4.1 탭 구성 및 데이터 소스

Insight Hub는 6개의 분석 탭으로 구성되며, `InsightDataProvider` Context를 통해 데이터를 공유합니다.

### 4.2 Overview 탭

**목적**: 매장 전체 KPI 대시보드

```typescript
// src/features/insights/hooks/useStoreOverview.ts

Hook: useStoreKPIs()
├── Primary: RPC: get_store_overview_kpis(store_id, date_range)
├── Fallback: daily_kpis_agg (L3)
│   ├── total_visitors
│   ├── total_transactions
│   ├── total_revenue
│   ├── conversion_rate
│   ├── avg_basket_size
│   ├── avg_transaction_value
│   ├── sales_per_sqm
│   └── sales_per_visitor
└── Returns: StoreKPIs

Hook: useHourlyTraffic()
├── Primary: RPC: get_hourly_entry_counts(store_id, date)
├── Fallback: hourly_metrics (L3)
│   ├── hour (0-23)
│   ├── visitor_count
│   ├── entry_count
│   ├── exit_count
│   └── transaction_count
└── Returns: HourlyTraffic[]

Hook: useFunnelMetrics()
├── Primary: RPC: get_funnel_summary(store_id, date_range)
├── Fallback: funnel_events (L2)
│   ├── entry → browse → engage → fitting → checkout → purchase
│   └── Conversion rates between stages
└── Returns: FunnelMetrics

Hook: useZonePerformance()
├── Primary: zone_daily_metrics (L3)
│   ├── zone_id → zones_dim JOIN
│   ├── total_visitors
│   ├── avg_dwell_seconds
│   ├── conversion_count
│   └── revenue_attributed
└── Returns: ZonePerformance[]
```

**데이터 흐름**:
```
zone_events (L2) ──aggregate──→ zone_daily_metrics (L3) ──→ Overview Tab
transactions (L2) ──aggregate──→ daily_kpis_agg (L3) ──→ KPI Cards
funnel_events (L2) ──aggregate──→ funnel_summary ──→ Funnel Chart
hourly_metrics (L3) ──→ Traffic Chart
```

### 4.3 Store 탭

**목적**: 매장 세부 분석 및 비교

```typescript
// src/features/insights/hooks/useStoreAnalysis.ts

Hook: useStoreDetails()
├── Table: stores
│   ├── store_name, store_code
│   ├── address, region, district
│   ├── area_sqm
│   ├── opening_date
│   └── store_format
├── JOIN: daily_kpis_agg (최근 실적)
└── Returns: StoreDetails

Hook: useStoreComparison()
├── Table: daily_kpis_agg (L3)
│   ├── GROUP BY store_id
│   ├── AVG(conversion_rate)
│   ├── SUM(total_revenue)
│   └── AVG(sales_per_sqm)
└── Returns: StoreComparison[]

Hook: useStoreGoals()
├── Table: store_goals
│   ├── goal_type (revenue, visitors, conversion)
│   ├── target_value
│   ├── current_value
│   └── achievement_rate
└── Returns: StoreGoals[]

Hook: useRegionalBenchmark()
├── Table: daily_kpis_agg (L3)
│   ├── JOIN stores ON region
│   ├── AVG metrics by region
│   └── Percentile ranking
└── Returns: RegionalBenchmark
```

**데이터 흐름**:
```
stores (DIM) ──────────────────────────────→ Store Info Card
    │
    └──→ daily_kpis_agg (L3) ──────────────→ Store Performance
              │
              └──→ GROUP BY region ────────→ Regional Benchmark
                        │
store_goals ────────────┴──────────────────→ Goal Achievement
```

### 4.4 Customer 탭

**목적**: 고객 세그먼트 분석 및 행동 패턴

```typescript
// src/features/insights/hooks/useCustomerAnalysis.ts

Hook: useCustomerSegments()
├── Primary: customer_segments_agg (L3)
│   ├── segment_type: 'rfm' | 'behavioral' | 'demographic'
│   ├── segment_name
│   ├── customer_count
│   ├── total_revenue
│   ├── avg_transaction_value
│   ├── visit_frequency
│   ├── avg_basket_size
│   ├── churn_risk_score
│   └── ltv_estimate
├── Fallback: customers (L2) → Manual aggregation
└── Returns: CustomerSegment[]

Hook: useCustomerBehavior()
├── Table: visits (L2)
│   ├── visit_date
│   ├── duration_minutes
│   └── zones_visited
├── JOIN: visit_zone_events
│   ├── entry_time, exit_time
│   ├── dwell_seconds
│   └── path_sequence
└── Returns: CustomerBehavior

Hook: useCustomerLifetimeValue()
├── Table: customers (L2)
│   ├── total_purchases
│   └── last_visit_date
├── JOIN: transactions
│   ├── SUM(total_amount) per customer
│   └── COUNT(transactions) per customer
└── Returns: CustomerLTV[]

Hook: useRFMAnalysis()
├── Derived from:
│   ├── Recency: DATEDIFF(NOW(), last_visit_date)
│   ├── Frequency: COUNT(transactions)
│   └── Monetary: SUM(total_amount)
├── Scoring: 1-5 scale for each dimension
└── Returns: RFMScore[]
```

**데이터 흐름**:
```
customers (L2) ─────────────────────────────→ Customer List
    │
    ├──→ transactions (L2) ─────────────────→ Purchase History
    │         │
    │         └──→ RFM Calculation ─────────→ RFM Analysis
    │
    └──→ visits (L2) ───────────────────────→ Visit Patterns
              │
              └──→ customer_segments_agg (L3) → Segment Charts
```

### 4.5 Product 탭

**목적**: 상품 성과 분석 및 재고 최적화

```typescript
// src/features/insights/hooks/useProductAnalysis.ts

Hook: useProductPerformance()
├── Primary: product_performance_agg (L3)
│   ├── product_id → products JOIN
│   ├── units_sold
│   ├── revenue
│   ├── transactions
│   ├── conversion_rate
│   ├── avg_selling_price
│   ├── discount_rate
│   ├── return_rate
│   ├── stock_level
│   ├── stockout_hours
│   ├── category_rank
│   └── store_rank
└── Returns: ProductPerformance[]

Hook: useProductSalesDaily()
├── Table: product_sales_daily (L3)
│   ├── date
│   ├── units_sold
│   ├── revenue
│   ├── cost
│   ├── profit
│   ├── avg_price
│   ├── discount_amount
│   ├── return_units
│   └── return_amount
└── Returns: ProductSalesDaily[]

Hook: useInventoryStatus()
├── Table: inventory_levels
│   ├── product_id
│   ├── current_stock
│   ├── optimal_stock
│   ├── minimum_stock
│   └── weekly_demand
├── JOIN: inventory_movements
│   ├── movement_type: 'in' | 'out' | 'adjustment' | 'transfer'
│   ├── quantity
│   └── moved_at
└── Returns: InventoryStatus[]

Hook: useProductRecommendations()
├── Table: auto_order_suggestions
│   ├── product_id
│   ├── current_stock
│   ├── optimal_stock
│   ├── suggested_order_quantity
│   ├── urgency_level
│   ├── estimated_stockout_date
│   └── potential_revenue_loss
└── Returns: OrderSuggestion[]
```

**데이터 흐름**:
```
products (DIM) ────────────────────────────────→ Product Master
    │
    ├──→ line_items (L2) ──────────────────────→ Transaction Details
    │         │
    │         └──→ product_performance_agg (L3) → Performance Chart
    │
    ├──→ inventory_levels ─────────────────────→ Stock Status
    │         │
    │         └──→ inventory_movements ────────→ Movement History
    │
    └──→ auto_order_suggestions ───────────────→ Reorder Alerts
```

### 4.6 Prediction 탭

**목적**: AI 기반 예측 분석

```typescript
// src/features/insights/hooks/usePredictions.ts

Hook: useDemandForecast()
├── Primary: RPC: predict_demand(store_id, product_id, horizon)
├── Input:
│   ├── Historical: daily_kpis_agg (L3)
│   ├── External: weather_data, holidays_events
│   └── Patterns: funnel_events (L2)
├── Output:
│   ├── predicted_demand[]
│   ├── confidence_interval
│   └── contributing_factors
└── Returns: DemandForecast

Hook: useTrafficPrediction()
├── Primary: RPC: predict_traffic(store_id, date_range)
├── Input:
│   ├── Historical: hourly_metrics (L3)
│   ├── External: weather_data
│   └── Calendar: holidays_events
├── Output:
│   ├── hourly_predictions[]
│   ├── peak_hours[]
│   └── anomaly_alerts[]
└── Returns: TrafficPrediction

Hook: useChurnPrediction()
├── Table: customers (L2)
│   ├── recency_score
│   ├── frequency_score
│   └── monetary_score
├── Calculation:
│   ├── Churn probability model
│   └── At-risk customer identification
└── Returns: ChurnRisk[]

Hook: useRevenueProjection()
├── Input:
│   ├── daily_kpis_agg (L3) - Historical
│   ├── Seasonality patterns
│   └── Growth trends
├── Output:
│   ├── weekly_projection
│   ├── monthly_projection
│   └── confidence_bounds
└── Returns: RevenueProjection
```

**데이터 흐름**:
```
daily_kpis_agg (L3) ──┬──────────────────────→ Historical Base
                      │
weather_data ─────────┤
                      ├──→ ML Models ────────→ Predictions
holidays_events ──────┤
                      │
hourly_metrics (L3) ──┘
```

### 4.7 AI Recommendation 탭

**목적**: AI 기반 실행 가능한 추천

```typescript
// src/features/insights/hooks/useAIRecommendations.ts

Hook: useAIRecommendations()
├── Table: ai_recommendations
│   ├── recommendation_type
│   │   ├── 'layout' - 레이아웃 최적화
│   │   ├── 'pricing' - 가격 조정
│   │   ├── 'inventory' - 재고 관리
│   │   ├── 'staffing' - 인력 배치
│   │   └── 'promotion' - 프로모션
│   ├── priority: 'high' | 'medium' | 'low'
│   ├── title
│   ├── description
│   ├── action_category
│   ├── expected_impact (JSONB)
│   │   ├── revenue_increase
│   │   ├── cost_reduction
│   │   └── efficiency_gain
│   ├── evidence (JSONB)
│   ├── data_source
│   ├── status: 'pending' | 'applied' | 'dismissed'
│   └── created_at
└── Returns: AIRecommendation[]

Hook: useRecommendationHistory()
├── Table: ai_recommendations
│   ├── Filter: status = 'applied' | 'dismissed'
│   ├── displayed_at
│   └── dismissed_at
└── Returns: RecommendationHistory[]

Hook: useRecommendationImpact()
├── Compare:
│   ├── Before: daily_kpis_agg (recommendation date - 7d)
│   └── After: daily_kpis_agg (recommendation date + 7d)
├── Metrics:
│   ├── revenue_change
│   ├── conversion_change
│   └── efficiency_change
└── Returns: ImpactAnalysis
```

**데이터 흐름**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Recommendation Engine                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  daily_kpis_agg (L3) ────┐                                      │
│                          │                                      │
│  zone_daily_metrics (L3) ─┼──→ AI Analysis ──→ ai_recommendations│
│                          │         │                             │
│  product_performance (L3)─┤         │                             │
│                          │         ↓                             │
│  customer_segments (L3) ──┘    Priority                          │
│                               Scoring                            │
│                                 │                                │
│                                 ↓                                │
│                         AI Recommendation                        │
│                              Tab UI                              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.8 InsightDataProvider 컨텍스트

```typescript
// src/features/insights/context/InsightDataProvider.tsx

interface InsightDataContextType {
  // Store Data
  storeData: {
    store: Store;
    kpis: StoreKPIs;
    hourlyTraffic: HourlyTraffic[];
    goals: StoreGoals[];
  };

  // Customer Data (Lazy-loaded on Customer tab)
  customerData: {
    segments: CustomerSegment[];
    rfmAnalysis: RFMScore[];
    churnRisk: ChurnRisk[];
  };

  // Product Data (Lazy-loaded on Product tab)
  productData: {
    performance: ProductPerformance[];
    inventory: InventoryStatus[];
    suggestions: OrderSuggestion[];
  };

  // Predictions (Lazy-loaded on Prediction tab)
  predictions: {
    demand: DemandForecast;
    traffic: TrafficPrediction;
    revenue: RevenueProjection;
  };

  // AI Recommendations
  recommendations: AIRecommendation[];

  // Loading & Error States
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;

  // Actions
  refreshData: (section: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
}
```

---

## 5. Digital Twin Studio

### 5.1 기능 개요

Digital Twin Studio는 매장의 3D 디지털 트윈을 생성하고 시뮬레이션을 실행하는 기능을 제공합니다.

### 5.2 주요 기능 및 데이터 소스

| 기능 | 설명 | 데이터 소스 |
|-----|------|-----------|
| 3D 뷰어 | 매장 3D 모델 렌더링 | store_scenes, graph_entities |
| 히트맵 | 구역별 트래픽 시각화 | zone_events, zone_daily_metrics |
| 실시간 추적 | WiFi/BLE 위치 추적 | wifi_tracking, wifi_raw_signals |
| 시뮬레이션 | 레이아웃 변경 시뮬레이션 | scenarios, simulation_results |
| 존 관리 | 구역 정의 및 편집 | zones_dim, wifi_zones |

### 5.3 Hook-to-Table 매핑

```typescript
// src/features/digital-twin/hooks/

Hook: useStoreScene()
├── Table: store_scenes
│   ├── recipe_data (JSONB)
│   │   ├── floor_plan
│   │   ├── fixtures[]
│   │   ├── zones[]
│   │   └── camera_positions
│   └── is_active
├── JOIN: graph_entities
│   ├── model_3d_position
│   ├── model_3d_rotation
│   └── model_3d_scale
└── Returns: StoreScene

Hook: useHeatmapData()
├── Primary: zone_daily_metrics (L3)
│   ├── zone_id
│   ├── heatmap_intensity
│   ├── total_visitors
│   └── avg_dwell_seconds
├── Fallback: zone_events (L2)
│   ├── GROUP BY zone_id, event_hour
│   └── COUNT(*) as intensity
├── Additional: wifi_heatmap_cache
│   ├── grid_x, grid_z
│   └── visit_count
└── Returns: HeatmapData[]

Hook: useWifiTracking()
├── Table: wifi_tracking
│   ├── timestamp
│   ├── session_id
│   ├── x, z coordinates
│   ├── accuracy
│   └── status
├── JOIN: wifi_raw_signals
│   ├── mac_address (hashed)
│   ├── sensor_id
│   └── rssi (signal strength)
└── Returns: TrackingData[]

Hook: useZonesConfig()
├── Table: zones_dim
│   ├── zone_code
│   ├── zone_name
│   ├── zone_type
│   ├── coordinates (JSONB)
│   ├── area_sqm
│   └── capacity
├── JOIN: wifi_zones
│   ├── zone_id
│   └── sensor positions
└── Returns: ZoneConfig[]

Hook: useSimulation()
├── Table: scenarios
│   ├── scenario_type
│   │   ├── 'layout' - 레이아웃 변경
│   │   ├── 'pricing' - 가격 시뮬레이션
│   │   ├── 'staffing' - 인력 배치
│   │   └── 'promotion' - 프로모션 효과
│   ├── params (JSONB)
│   ├── baseline_kpi (JSONB)
│   ├── predicted_kpi (JSONB)
│   ├── confidence_score
│   └── ai_insights
├── JOIN: simulation_results
│   ├── result_type
│   ├── result_data (JSONB)
│   └── metadata
└── Returns: SimulationResult

Hook: useOntologyEntities()
├── Table: graph_entities
│   ├── entity_type_id → ontology_entity_types
│   ├── label
│   ├── properties (JSONB)
│   └── 3D transform data
├── JOIN: graph_relations
│   ├── source_entity_id
│   ├── target_entity_id
│   └── relation_type_id
└── Returns: OntologyGraph
```

### 5.4 3D 렌더링 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Digital Twin Studio                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                         3D Scene Layer                             │ │
│  │                                                                    │ │
│  │  store_scenes ──→ Floor Plan + Fixtures ──→ Three.js Renderer     │ │
│  │                                                                    │ │
│  │  graph_entities ──→ 3D Objects (Position/Rotation/Scale)          │ │
│  │                                                                    │ │
│  │  ontology_entity_types ──→ 3D Model URLs + Dimensions             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                         Heatmap Layer                              │ │
│  │                                                                    │ │
│  │  zone_events (L2) ───┐                                            │ │
│  │                      ├──→ Aggregation ──→ Heatmap Texture         │ │
│  │  zone_daily_metrics ─┘                                            │ │
│  │                                                                    │ │
│  │  wifi_heatmap_cache ──→ Grid-based Intensity ──→ Color Mapping    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      Real-time Tracking Layer                      │ │
│  │                                                                    │ │
│  │  wifi_tracking ──→ Position Updates ──→ Avatar Animations         │ │
│  │                                                                    │ │
│  │  wifi_raw_signals ──→ Trilateration ──→ Position Calculation      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                       Simulation Layer                             │ │
│  │                                                                    │ │
│  │  scenarios ──→ What-if Analysis ──→ Predicted KPIs                │ │
│  │                                                                    │ │
│  │  simulation_results ──→ A/B Comparison ──→ Impact Visualization   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 테이블 스키마 상세

### 6.1 L1: Raw Layer 테이블

#### 6.1.1 raw_imports

데이터 Import 이력 및 Lineage 추적용 테이블

```sql
CREATE TABLE public.raw_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  user_id UUID NOT NULL,

  -- Import 소스 정보
  source_type TEXT NOT NULL,        -- 'csv', 'api', 'manual'
  source_name TEXT,                 -- 파일명 또는 API 이름
  file_path TEXT,                   -- 저장된 파일 경로
  data_type TEXT,                   -- 'purchases', 'customers', 'products', 'wifi', 'visits'

  -- Import 결과
  row_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',    -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_raw_imports_org_store ON raw_imports(org_id, store_id);
CREATE INDEX idx_raw_imports_status ON raw_imports(status);
CREATE INDEX idx_raw_imports_source_type ON raw_imports(source_type);
CREATE INDEX idx_raw_imports_created_at ON raw_imports(created_at DESC);
```

#### 6.1.2 etl_runs

ETL 실행 이력 테이블

```sql
CREATE TABLE public.etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- ETL 정보
  etl_function TEXT NOT NULL,       -- 'aggregate_daily_kpis', 'process_zone_events', etc.
  etl_version TEXT DEFAULT '2.0',

  -- 처리 범위
  date_range_start DATE,
  date_range_end DATE,

  -- 처리 결과
  input_record_count INTEGER DEFAULT 0,
  output_record_count INTEGER DEFAULT 0,
  raw_import_ids UUID[] DEFAULT '{}',

  -- 상태
  status TEXT DEFAULT 'running',    -- 'running', 'completed', 'failed', 'partial'
  error_message TEXT,
  error_details JSONB,

  -- 시간 정보
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_etl_runs_org_store ON etl_runs(org_id, store_id);
CREATE INDEX idx_etl_runs_function ON etl_runs(etl_function);
CREATE INDEX idx_etl_runs_status ON etl_runs(status);
CREATE INDEX idx_etl_runs_started_at ON etl_runs(started_at DESC);
```

### 6.2 L2: Dimension 테이블

#### 6.2.1 stores

매장 마스터 테이블

```sql
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),

  -- 기본 정보
  store_name TEXT NOT NULL,
  store_code TEXT NOT NULL,

  -- 위치 정보
  address TEXT,
  region TEXT,
  district TEXT,

  -- 매장 속성
  area_sqm NUMERIC,
  store_format TEXT,                -- 'flagship', 'standard', 'outlet', etc.
  opening_date DATE,
  status TEXT DEFAULT 'active',     -- 'active', 'inactive', 'closed'

  -- 연락처
  manager_name TEXT,
  email TEXT,
  phone TEXT,

  -- HQ 연동
  hq_store_code TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6.2.2 zones_dim

구역 마스터 테이블

```sql
CREATE TABLE public.zones_dim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id) NOT NULL,

  -- 구역 식별
  zone_code TEXT NOT NULL,
  zone_name TEXT NOT NULL,

  -- 구역 유형
  zone_type TEXT,                   -- 'entrance', 'checkout', 'display', 'fitting', 'storage'
  floor_level INTEGER DEFAULT 1,

  -- 물리적 속성
  area_sqm NUMERIC,
  capacity INTEGER,

  -- 계층 구조
  parent_zone_id UUID REFERENCES zones_dim(id),

  -- 좌표
  coordinates JSONB,                -- {x, y, width, height, polygon}

  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, zone_code)
);
```

#### 6.2.3 products

상품 마스터 테이블

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- 상품 정보
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  description TEXT,

  -- 가격 정보
  cost_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,

  -- 재고 관련
  supplier TEXT,
  lead_time_days INTEGER DEFAULT 7,
  min_stock_level INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6.2.4 customers

고객 마스터 테이블

```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- 고객 정보
  customer_name TEXT,
  email TEXT,
  phone TEXT,

  -- 세그먼트 정보
  segment TEXT,                     -- 'VIP', 'Regular', 'New', 'At-risk'

  -- 집계 정보
  total_purchases NUMERIC DEFAULT 0,
  last_visit_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6.2.5 staff

직원 마스터 테이블

```sql
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  user_id UUID,

  -- 직원 정보
  staff_code TEXT,
  staff_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- 역할 및 부서
  role TEXT,                        -- 'manager', 'sales', 'cashier', 'stock'
  department TEXT,

  -- 고용 정보
  hire_date DATE,
  hourly_rate NUMERIC,

  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.3 L2: Fact 테이블

#### 6.3.1 transactions

거래 Fact 테이블 (POS 데이터)

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- 거래 식별
  external_id TEXT,                 -- 외부 시스템 ID
  transaction_id TEXT NOT NULL,

  -- 시간 정보
  transaction_date DATE NOT NULL,
  transaction_time TIMESTAMPTZ,

  -- 금액 정보
  total_amount NUMERIC NOT NULL,
  net_amount NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,

  -- 결제 정보
  payment_status TEXT,              -- 'completed', 'refunded', 'pending'
  payment_method TEXT,              -- 'card', 'cash', 'mobile'

  -- 주문 정보
  order_id TEXT,
  order_name TEXT,
  currency TEXT DEFAULT 'KRW',

  -- 고객 연결
  customer_id UUID REFERENCES customers(id),

  -- Lineage
  source_trace JSONB DEFAULT '{}'::jsonb,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_transactions_store_date ON transactions(store_id, transaction_date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);
```

#### 6.3.2 line_items

거래 상세 Fact 테이블

```sql
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- 연결 정보
  transaction_id TEXT NOT NULL,
  purchase_id UUID REFERENCES purchases(id),
  product_id UUID REFERENCES products(id),
  customer_id UUID REFERENCES customers(id),

  -- 상품 수량 및 가격
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL,

  -- 시간 정보
  transaction_date DATE NOT NULL,
  transaction_hour INTEGER,

  -- 결제 정보
  payment_method TEXT,
  is_return BOOLEAN DEFAULT false,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_line_items_store_date ON line_items(store_id, transaction_date);
CREATE INDEX idx_line_items_product ON line_items(product_id);
CREATE INDEX idx_line_items_customer ON line_items(customer_id);
CREATE INDEX idx_line_items_transaction ON line_items(transaction_id);
```

#### 6.3.3 zone_events

구역 이벤트 Fact 테이블 (센서 데이터)

```sql
CREATE TABLE public.zone_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  zone_id UUID REFERENCES zones_dim(id),

  -- 이벤트 정보
  event_type TEXT NOT NULL,         -- 'enter', 'exit', 'dwell', 'interaction'

  -- 시간 정보
  event_date DATE NOT NULL,
  event_hour INTEGER,
  event_timestamp TIMESTAMPTZ NOT NULL,

  -- 방문자 정보
  visitor_id TEXT,                  -- Anonymous tracking ID
  customer_id UUID REFERENCES customers(id),

  -- 체류 정보
  duration_seconds INTEGER,

  -- 센서 정보
  sensor_type TEXT,                 -- 'wifi', 'camera', 'beacon', 'ble'
  sensor_id TEXT,
  confidence_score NUMERIC,

  -- 외부 ID (API 연동용)
  external_id TEXT,
  zone_external_id TEXT,
  zone_name TEXT,
  customer_external_id TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_zone_events_store_date ON zone_events(store_id, event_date);
CREATE INDEX idx_zone_events_zone ON zone_events(zone_id);
CREATE INDEX idx_zone_events_type ON zone_events(event_type);
CREATE INDEX idx_zone_events_timestamp ON zone_events(event_timestamp);
CREATE INDEX idx_zone_events_external_id ON zone_events(external_id);
```

#### 6.3.4 funnel_events

퍼널 이벤트 Fact 테이블

```sql
CREATE TABLE public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),

  -- 방문자 정보
  visitor_id TEXT,
  customer_id UUID REFERENCES customers(id),
  session_id TEXT,

  -- 이벤트 정보
  event_type TEXT NOT NULL,         -- 'entry', 'browse', 'engage', 'fitting', 'checkout', 'purchase', 'exit'

  -- 시간 정보
  event_date DATE NOT NULL,
  event_hour INTEGER,
  event_timestamp TIMESTAMPTZ NOT NULL,

  -- 위치 정보
  zone_id UUID REFERENCES zones_dim(id),

  -- 체류 정보
  duration_seconds INTEGER,

  -- 퍼널 순서
  previous_event_type TEXT,
  next_event_type TEXT,

  -- 디바이스 정보
  device_type TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_funnel_events_store_date ON funnel_events(store_id, event_date);
CREATE INDEX idx_funnel_events_type ON funnel_events(event_type);
CREATE INDEX idx_funnel_events_visitor ON funnel_events(visitor_id);
CREATE INDEX idx_funnel_events_session ON funnel_events(session_id);
```

#### 6.3.5 visits

방문 Fact 테이블

```sql
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),

  -- 방문 정보
  external_id TEXT,                 -- 외부 시스템 ID
  visitor_id TEXT,                  -- Anonymous visitor ID

  -- 시간 정보
  visit_date TIMESTAMPTZ NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- 방문 경로
  zones_visited TEXT[],
  device_id TEXT,

  -- 재방문 여부
  is_returning BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_visits_store_date ON visits(store_id, visit_date);
CREATE INDEX idx_visits_customer ON visits(customer_id);
CREATE INDEX idx_visits_external_id ON visits(external_id);
```

#### 6.3.6 visit_zone_events

방문-구역 연계 Fact 테이블

```sql
CREATE TABLE public.visit_zone_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  visit_id UUID REFERENCES visits(id),
  zone_id UUID REFERENCES zones_dim(id),

  -- 시간 정보
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  dwell_seconds INTEGER,

  -- 상호작용 정보
  interaction_count INTEGER DEFAULT 0,

  -- 방문 경로 순서
  path_sequence INTEGER,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_visit_zone_events_store ON visit_zone_events(store_id);
CREATE INDEX idx_visit_zone_events_visit ON visit_zone_events(visit_id);
CREATE INDEX idx_visit_zone_events_zone ON visit_zone_events(zone_id);
```

#### 6.3.7 inventory_movements

재고 이동 Fact 테이블

```sql
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  product_id UUID REFERENCES products(id),

  -- 외부 ID (API 연동용)
  external_id TEXT,

  -- 이동 유형
  movement_type TEXT NOT NULL,      -- 'in', 'out', 'adjustment', 'transfer'

  -- 수량 정보
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,

  -- 사유 및 참조
  reason TEXT,
  reference_id TEXT,                -- purchase_id, transfer_id 등
  created_by TEXT,

  -- 시간 정보
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_inventory_movements_store ON inventory_movements(store_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_moved_at ON inventory_movements(moved_at);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_external_id ON inventory_movements(external_id);
```

### 6.4 L3: Aggregate 테이블

#### 6.4.1 daily_kpis_agg

일별 KPI 집계 테이블

```sql
CREATE TABLE public.daily_kpis_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  date DATE NOT NULL,

  -- Traffic KPIs
  total_visitors INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  avg_visit_duration_seconds INTEGER,

  -- Sales KPIs
  total_transactions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  avg_basket_size NUMERIC,
  avg_transaction_value NUMERIC,

  -- Conversion KPIs
  conversion_rate NUMERIC,          -- (구매 수 / 방문 수) × 100
  browse_to_engage_rate NUMERIC,    -- (Engage / Browse) × 100
  engage_to_purchase_rate NUMERIC,  -- (Purchase / Engage) × 100

  -- Efficiency KPIs
  sales_per_sqm NUMERIC,            -- 총매출 / 매장면적
  sales_per_visitor NUMERIC,        -- 총매출 / 방문자수
  labor_hours NUMERIC,
  sales_per_labor_hour NUMERIC,     -- 총매출 / 근무시간

  -- External Factors
  weather_condition TEXT,
  temperature NUMERIC,
  is_holiday BOOLEAN DEFAULT false,
  special_event TEXT,

  -- Lineage Tracking
  source_trace JSONB DEFAULT '{}'::jsonb,
  /*
    source_trace 예시:
    {
      "raw_import_ids": ["uuid1", "uuid2"],
      "source_tables": ["transactions", "zone_events"],
      "etl_run_id": "uuid",
      "calculated_at": "2026-01-14T10:00:00Z"
    }
  */

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, date)
);

-- 인덱스
CREATE INDEX idx_daily_kpis_agg_store_date ON daily_kpis_agg(store_id, date);
CREATE INDEX idx_daily_kpis_agg_date ON daily_kpis_agg(date DESC);
```

#### 6.4.2 hourly_metrics

시간별 메트릭 집계 테이블

```sql
CREATE TABLE public.hourly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),

  -- Traffic
  visitor_count INTEGER DEFAULT 0,
  entry_count INTEGER DEFAULT 0,
  exit_count INTEGER DEFAULT 0,

  -- Sales
  transaction_count INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  units_sold INTEGER DEFAULT 0,

  -- Occupancy
  avg_occupancy INTEGER,
  peak_occupancy INTEGER,

  -- Conversion
  conversion_rate NUMERIC,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, date, hour)
);

-- 인덱스
CREATE INDEX idx_hourly_metrics_store_date ON hourly_metrics(store_id, date);
CREATE INDEX idx_hourly_metrics_date_hour ON hourly_metrics(date, hour);
```

#### 6.4.3 zone_daily_metrics

구역별 일간 메트릭 집계 테이블

```sql
CREATE TABLE public.zone_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  zone_id UUID REFERENCES zones_dim(id),
  date DATE NOT NULL,

  -- Traffic
  total_visitors INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  entry_count INTEGER DEFAULT 0,
  exit_count INTEGER DEFAULT 0,

  -- Engagement
  avg_dwell_seconds INTEGER,
  total_dwell_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0,

  -- Performance
  conversion_count INTEGER DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,

  -- Heatmap Data
  heatmap_intensity NUMERIC,        -- 0-1 normalized value
  peak_hour INTEGER,
  peak_occupancy INTEGER,

  -- Lineage Tracking
  source_trace JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, zone_id, date)
);

-- 인덱스
CREATE INDEX idx_zone_daily_metrics_store_zone ON zone_daily_metrics(store_id, zone_id);
CREATE INDEX idx_zone_daily_metrics_date ON zone_daily_metrics(date);
CREATE INDEX idx_zone_daily_metrics_zone_date ON zone_daily_metrics(zone_id, date);
```

#### 6.4.4 customer_segments_agg

고객 세그먼트 집계 테이블

```sql
CREATE TABLE public.customer_segments_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  date DATE NOT NULL,

  -- 세그먼트 정보
  segment_type TEXT NOT NULL,       -- 'rfm', 'behavioral', 'demographic'
  segment_name TEXT NOT NULL,       -- 'VIP', 'Champion', 'At-risk', etc.

  -- 세그먼트 통계
  customer_count INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_transaction_value NUMERIC,
  visit_frequency NUMERIC,
  avg_basket_size NUMERIC,

  -- 예측 지표
  churn_risk_score NUMERIC,         -- 0-1 probability
  ltv_estimate NUMERIC,             -- Lifetime Value 추정치

  metadata JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, date, segment_type, segment_name)
);

-- 인덱스
CREATE INDEX idx_customer_segments_agg_store_date ON customer_segments_agg(store_id, date);
CREATE INDEX idx_customer_segments_agg_segment ON customer_segments_agg(segment_type, segment_name);
```

#### 6.4.5 product_performance_agg

상품 성과 집계 테이블

```sql
CREATE TABLE public.product_performance_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,

  -- Sales Metrics
  units_sold INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  transactions INTEGER DEFAULT 0,

  -- Performance Metrics
  conversion_rate NUMERIC,          -- 조회 대비 구매율
  avg_selling_price NUMERIC,
  discount_rate NUMERIC,            -- 할인 적용률
  return_rate NUMERIC,              -- 반품률

  -- Inventory Metrics
  stock_level INTEGER,
  stockout_hours INTEGER DEFAULT 0,

  -- Ranking
  category_rank INTEGER,            -- 카테고리 내 순위
  store_rank INTEGER,               -- 매장 내 순위

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, product_id, date)
);

-- 인덱스
CREATE INDEX idx_product_performance_agg_store_date ON product_performance_agg(store_id, date);
CREATE INDEX idx_product_performance_agg_product ON product_performance_agg(product_id);
CREATE INDEX idx_product_performance_agg_category_rank ON product_performance_agg(store_id, date, category_rank);
```

#### 6.4.6 product_sales_daily

상품별 일별 판매 집계 테이블

```sql
CREATE TABLE public.product_sales_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,

  -- 판매 지표
  units_sold INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,         -- revenue - cost

  -- 가격 지표
  avg_price NUMERIC,
  discount_amount NUMERIC DEFAULT 0,

  -- 반품 지표
  return_units INTEGER DEFAULT 0,
  return_amount NUMERIC DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, product_id, date)
);

-- 인덱스
CREATE INDEX idx_product_sales_daily_store_date ON product_sales_daily(store_id, date);
CREATE INDEX idx_product_sales_daily_product ON product_sales_daily(product_id);
```

### 6.5 API Connector 테이블

#### 6.5.1 api_connections

API 연결 설정 테이블

```sql
CREATE TABLE public.api_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  user_id UUID NOT NULL,

  -- 연결 정보
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  headers JSONB DEFAULT '{}'::jsonb,

  -- 인증 정보
  auth_type TEXT NOT NULL,          -- 'none', 'api_key', 'bearer', 'basic', 'oauth2'
  auth_config JSONB,
  /*
    auth_config 예시:
    - api_key: {"api_key": "xxx", "header_name": "X-API-Key"}
    - bearer: {"token": "xxx"}
    - basic: {"username": "xxx", "password": "xxx"}
    - oauth2: {"access_token": "xxx", "refresh_token": "xxx", "expires_at": "2026-01-15T00:00:00Z"}
  */

  -- Provider 및 카테고리
  provider TEXT,                    -- 'toast', 'square', 'shopify', 'hubspot', 'generic', etc.
  data_category TEXT,               -- 'pos', 'crm', 'erp', 'sensor', 'ecommerce'

  -- 매핑 설정
  field_mappings JSONB,
  /*
    field_mappings 예시:
    [
      {"source": "transactionId", "target": "external_id", "transform": "to_string", "required": true},
      {"source": "amount", "target": "total_amount", "transform": "cents_to_decimal"},
      {"source": "createdAt", "target": "transaction_date", "transform": "to_date"}
    ]
  */
  target_table TEXT,                -- 'transactions', 'customers', 'products', etc.
  response_data_path TEXT,          -- JSON path to data array (e.g., 'data', 'results')

  -- 페이지네이션
  pagination_type TEXT,             -- 'none', 'offset', 'cursor', 'page', 'link'
  pagination_config JSONB,

  -- 동기화 설정
  sync_frequency TEXT,              -- 'manual', 'hourly', 'daily', 'weekly', 'realtime'
  sync_cron TEXT,
  sync_config JSONB,

  -- 상태
  status TEXT DEFAULT 'inactive',   -- 'active', 'inactive', 'error', 'testing'
  is_active BOOLEAN DEFAULT true,

  -- 동기화 이력
  last_sync TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  total_records_synced INTEGER DEFAULT 0,
  last_sync_duration_ms INTEGER,
  next_scheduled_sync TIMESTAMPTZ,

  -- 보안
  is_credentials_encrypted BOOLEAN DEFAULT false,

  -- 재시도 설정
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_api_connections_org ON api_connections(org_id);
CREATE INDEX idx_api_connections_store ON api_connections(store_id);
CREATE INDEX idx_api_connections_provider ON api_connections(provider);
CREATE INDEX idx_api_connections_category ON api_connections(data_category);
CREATE INDEX idx_api_connections_status ON api_connections(status);
```

#### 6.5.2 api_mapping_templates

API 매핑 템플릿 테이블

```sql
CREATE TABLE public.api_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 템플릿 식별
  provider TEXT NOT NULL,           -- 'toast', 'square', 'generic', etc.
  data_category TEXT NOT NULL,      -- 'pos', 'crm', 'erp', 'sensor'
  target_table TEXT NOT NULL,       -- 'transactions', 'customers', etc.

  -- 템플릿 정보
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',

  -- 기본 설정
  default_endpoint TEXT,
  default_method TEXT DEFAULT 'GET',
  default_headers JSONB,
  response_data_path TEXT,

  -- 필드 매핑
  field_mappings JSONB NOT NULL,
  /*
    field_mappings 예시:
    [
      {
        "source": "transactionKey",
        "target": "external_id",
        "transform": "to_string",
        "required": true
      },
      {
        "source": "amount",
        "target": "total_amount",
        "transform": "cents_to_decimal"
      }
    ]
  */

  -- 페이지네이션
  pagination_type TEXT,
  pagination_config JSONB,

  -- 인증
  suggested_auth_type TEXT,
  auth_config_hints JSONB,

  -- 관리
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(provider, data_category, target_table, version)
);
```

#### 6.5.3 api_sync_logs

API 동기화 로그 테이블

```sql
CREATE TABLE public.api_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_connection_id UUID REFERENCES api_connections(id),
  sync_endpoint_id UUID,
  org_id UUID REFERENCES organizations(id),

  -- 동기화 유형
  sync_type TEXT NOT NULL,          -- 'scheduled', 'manual', 'retry'

  -- 시간 정보
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  fetch_completed_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- 결과
  status TEXT NOT NULL,             -- 'running', 'success', 'partial', 'failed'
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- 오류 정보
  error_type TEXT,
  error_message TEXT,
  error_details JSONB,

  -- 요청/응답 정보
  request_url TEXT,
  request_headers JSONB,
  response_status INTEGER,
  response_headers JSONB,
  response_size_bytes INTEGER,

  -- Lineage 연결
  raw_import_id UUID REFERENCES raw_imports(id),
  etl_run_id UUID REFERENCES etl_runs(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_api_sync_logs_connection ON api_sync_logs(api_connection_id);
CREATE INDEX idx_api_sync_logs_status ON api_sync_logs(status);
CREATE INDEX idx_api_sync_logs_started_at ON api_sync_logs(started_at DESC);
```

### 6.6 Inventory 테이블

#### 6.6.1 inventory_levels

재고 수준 테이블

```sql
CREATE TABLE public.inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id),
  product_id UUID REFERENCES products(id) NOT NULL,

  -- 외부 ID (API 연동용)
  product_sku TEXT,

  -- 재고 수준
  current_stock INTEGER DEFAULT 0 NOT NULL,
  optimal_stock INTEGER NOT NULL,
  minimum_stock INTEGER NOT NULL,

  -- 수요 예측
  weekly_demand INTEGER DEFAULT 0 NOT NULL,

  -- 위치 정보
  warehouse_id TEXT,
  location TEXT,

  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_inventory_levels_product ON inventory_levels(product_id);
CREATE INDEX idx_inventory_levels_org ON inventory_levels(org_id);
CREATE INDEX idx_inventory_levels_sku ON inventory_levels(product_sku);
```

---

## 7. RPC 함수 목록

### 7.1 Data Control Tower RPC 함수

| 함수명 | 파라미터 | 반환값 | 설명 |
|-------|---------|-------|------|
| `calculate_data_quality_score` | store_id, date | JSONB | 데이터 품질 점수 계산 |
| `get_data_control_tower_status` | store_id, limit | JSONB | 전체 상태 조회 |
| `get_kpi_lineage` | kpi_table, kpi_id, store_id, date | JSONB | KPI Lineage 추적 |

### 7.2 Insight Hub RPC 함수

| 함수명 | 파라미터 | 반환값 | 설명 |
|-------|---------|-------|------|
| `get_store_overview_kpis` | store_id, date_range | JSONB | 매장 KPI 조회 |
| `get_hourly_entry_counts` | store_id, date | JSONB | 시간별 입장 수 |
| `get_funnel_summary` | store_id, date_range | JSONB | 퍼널 요약 |
| `get_zone_performance` | store_id, date_range | JSONB | 구역 성과 |

### 7.3 Digital Twin Studio RPC 함수

| 함수명 | 파라미터 | 반환값 | 설명 |
|-------|---------|-------|------|
| `get_store_scene` | store_id | JSONB | 3D 씬 데이터 |
| `get_heatmap_data` | store_id, date, hour | JSONB | 히트맵 데이터 |
| `run_simulation` | scenario_id | JSONB | 시뮬레이션 실행 |

---

## 8. 데이터 품질 관리

### 8.1 품질 점수 산출 공식

```
Overall Score = Σ (Coverage Score × Weight) / Σ Weight

각 카테고리별 Weight:
- POS: 0.25 (25%)
- Sensor: 0.30 (30%)
- CRM: 0.15 (15%)
- Product: 0.15 (15%)
- Zone: 0.15 (15%)

Coverage Score 계산:
- POS: MIN(transactions.COUNT / 1000, 1)
- Sensor: MIN(zone_events.COUNT / 5000, 1)
- CRM: customers.COUNT > 0 ? 1 : 0
- Product: products.COUNT > 0 ? 1 : 0
- Zone: zones_dim.COUNT > 0 ? 1 : 0
```

### 8.2 Confidence Level 기준

| Level | Score 범위 | 의미 |
|-------|-----------|------|
| High | ≥ 80% | 신뢰할 수 있는 분석 가능 |
| Medium | 50% - 79% | 부분적 분석 가능, 일부 데이터 보완 필요 |
| Low | < 50% | 분석 신뢰도 낮음, 데이터 수집 필요 |

### 8.3 Warning 유형

| Type | Severity | 설명 |
|------|----------|------|
| missing | high | 필수 데이터 누락 |
| stale | medium | 데이터 업데이트 지연 |
| anomaly | medium | 이상치 감지 |

---

## 부록: Transform Type 목록

| Transform | 설명 | 예시 |
|-----------|------|------|
| `direct` | 변환 없이 그대로 사용 | - |
| `to_string` | 문자열로 변환 | 123 → "123" |
| `to_integer` | 정수로 변환 | "123" → 123 |
| `to_decimal` | 소수로 변환 | "123.45" → 123.45 |
| `to_boolean` | 불리언으로 변환 | "true" → true |
| `to_date` | 날짜로 변환 | "2026-01-14" → DATE |
| `to_timestamp` | 타임스탬프로 변환 | ISO string → TIMESTAMPTZ |
| `to_lowercase` | 소문자로 변환 | "ABC" → "abc" |
| `to_uppercase` | 대문자로 변환 | "abc" → "ABC" |
| `to_array` | 배열로 변환 | "a,b,c" → ["a","b","c"] |
| `cents_to_decimal` | 센트를 달러로 변환 | 1234 → 12.34 |
| `unix_to_date` | Unix timestamp를 날짜로 | 1705248000 → 2026-01-14 |
| `unix_to_timestamp` | Unix timestamp를 시간으로 | 1705248000 → 2026-01-14T12:00:00Z |

---

## 문서 변경 이력

| 버전 | 날짜 | 변경 내용 |
|-----|------|----------|
| 1.0.0 | 2026-01-14 | 초기 문서 작성 |
