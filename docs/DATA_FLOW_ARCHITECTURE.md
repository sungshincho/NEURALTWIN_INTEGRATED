# 데이터 흐름 아키텍처 문서

> 대시보드, 매장현황분석, 시뮬레이션 기능의 데이터 소스 및 테이블 연결 구조  
> (NEURALTWIN 3-Layer 데이터 아키텍처 기준으로 업데이트된 버전)

---

## 목차
1. [대시보드 (Dashboard)](#1-대시보드-dashboard)
2. [매장현황분석 (Store Analysis)](#2-매장현황분석-store-analysis)
3. [시뮬레이션 (Simulation)](#3-시뮬레이션-simulation)
4. [데이터 흐름 다이어그램](#4-데이터-흐름-다이어그램)
5. [테이블 참조 요약](#5-테이블-참조-요약)
6. [개선 필요 항목](#6-개선-필요-항목)

---

## 1. 대시보드 (Dashboard)

### 1.1 주요 기능
- 일별/기간별 KPI 표시 (매출, 방문, 전환율, 평당 매출)
- 퍼널 메트릭 시각화 (Entry → Browse → Fitting → Purchase → Return)
- AI 추천 카드 표시

> **레이어 기준 요약**
> - 표시되는 값들은 모두 **Layer 3 (KPI / AI Outputs)** 에서 읽어옴  
> - 계산/집계는 **Layer 1 (Graph)** 및 **Layer 2 (Facts & Dimensions)** 기반으로 수행  
> - 그래프/온톨로지는 주로 레이아웃·관계·3D 컨텍스트로 사용

---

### 1.2 데이터 소스

| 데이터 | Hook | 테이블 | 비고 |
|--------|------|--------|------|
| KPI 데이터 | `useDashboardKPI` | `dashboard_kpis` | **L3** · 일별 KPI 집계 (매출·방문·전환율·평당 매출·퍼널·외부요인) |
| AI 추천 | `useAIRecommendations` | `ai_recommendations` | **L3** · AI 기반 운영/전략 추천 카드 |
| 매장 정보 | `useSelectedStore` | `stores` | **L2 (DIM)** · 선택된 매장 메타데이터 (면적, 위치, 속성 등) |

---

### 1.3 KPI 계산 로직

**Edge Function**: `aggregate-dashboard-kpis`  
**계산 기준**: 현재는 Layer 1(Graph) 기반 집계 → Layer 3(`dashboard_kpis`)에 저장

#### 1.3.1 KPI 계산 플로우 (현재 구현)

```text
Layer 1: graph_entities (visit/purchase 엔티티)
        │
        ├── ontology_entity_types (타입 매칭)
        │
        ▼
Edge Function: aggregate-dashboard-kpis
        │
        ├── stores.metadata (매장 면적)
        │
        ▼
Layer 3: dashboard_kpis (일별/매장별 KPI 최종 저장)
```

#### 1.3.2 KPI 필드 계산 방식

| KPI 필드 | 계산 방식 | 원본 데이터 |
|----------|----------|-------------|
| `total_visits` | visit 엔티티 카운트 | `graph_entities` (entity_type = 'visit') |
| `total_purchases` | purchase 엔티티 카운트 | `graph_entities` (entity_type = 'purchase') |
| `total_revenue` | purchase.total_amount 합계 | `graph_entities.properties.total_amount` |
| `conversion_rate` | total_purchases / total_visits | 계산값 |
| `sales_per_sqm` | total_revenue / store.area_sqm | `stores.metadata.area` |
| `funnel_entry` ~ `funnel_return` | 고정 비율 기반 추정 | 계산값 (실제 funnel_events 미연동) |
| `weather_condition` | null | `weather_data` (연동 필요) |
| `is_holiday` | false | `holidays_events` (연동 필요) |

> **참고**: 향후 Layer 2(Facts) 테이블 기반으로 집계 방식을 개선할 예정  
> (visits, transactions 등 정규화된 테이블 사용)

---

### 1.4 현재 제한사항 및 개선 상태

* **Funnel Metrics**
  * 현재: 고정 비율로 추정 (80%, 40%, 20%)
  * 목표: `funnel_events` 테이블 기반 실제 단계별 이벤트 집계

* **Weather / Holiday**
  * 현재: `weather_condition`, `is_holiday` 필드가 null/false
  * 목표: `weather_data`, `holidays_events` 테이블을 join하여 반영

* **Labor Hours**
  * 현재: 미연동 상태
  * 목표: `staff`, `shifts` 스키마 정의 및 ETL 구현

---

## 2. 매장현황분석 (Store Analysis)

### 2.1 섹션별 분석 기능

> **현재 구현**: Layer 1(Graph/Raw) + Layer 2(Facts/Dimension) 혼합 사용  
> **목표**: 정규화된 Fact/Dimension 레이어(Layer 2) + 집계/지표 레이어(Layer 3) 우선 사용

---

#### A. 매장 분석 (StoreAnalysisPage)

| 기능 | Hook | 실제 데이터 소스 | 목표 데이터 소스 |
|------|------|-----------------|-----------------|
| 방문자 통계 | `useFootfallAnalysis` | `wifi_tracking` (L1), `graph_entities` (L1), `weather_data` (L2), `holidays_events` (L2) | `visits` (L2), `dashboard_kpis` (L3) |
| 트래픽 히트맵 | `useTrafficHeatmap` | `wifi_tracking` (L1 Raw), `stores.metadata` (L2) | `zone_metrics` (L3) |
| 존별 통계 | `useZoneStatistics` | `stores.metadata.zones` (L2) | `zones_dim` (L2), `zone_metrics` (L3) |
| 컨텍스트 인사이트 | `useTrafficContext` | `weather_data` (L2), `holidays_events` (L2), `regional_data` (L2) | `ai_insights` (L3) |

---

#### B. 고객 분석 (CustomerAnalysisPage)

| 기능 | Hook | 실제 데이터 소스 | 목표 데이터 소스 |
|------|------|-----------------|-----------------|
| 고객 세그먼트 | `useCustomerSegments` | `customers` (L2), `purchases` (L2) | `customer_segments` (L3 뷰) |
| 고객 여정 | `useCustomerJourney` | `wifi_tracking` (L1) | `visits`, `transactions`, `visit_zone_events` (L2) |
| 구매 패턴 | `usePurchasePatterns` | `purchases` (L2), `products` (L2) | `transactions`, `line_items` (L2) |
| 체류 시간 | `useDwellTime` | `wifi_tracking` (L1 Raw) | `zone_events`, `zone_metrics` (L2/L3) |

---

#### C. 상품 분석 (ProductAnalysisPage)

| 기능 | Hook | 실제 데이터 소스 | 목표 데이터 소스 |
|------|------|-----------------|-----------------|
| 상품 성과 | `useOntologyData` | `graph_entities` (L1), `products` (L2) | `product_sales_daily` (L3) |
| 재고 현황 | `useRealtimeInventory` | `inventory_levels` (L3), `products` (L2) | (동일) |
| 연관 상품 | `useOntologyInference` | `graph_relations` (L1 Graph, co-purchase) | (동일) |

---

### 2.2 주요 테이블 연결

> **현재 구현**: 정규화 모델(L2) + 그래프(L1) 혼합

```text
┌─────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│    customers    │────▶│      visits        │────▶│     purchases      │
└─────────────────┘     └────────────────────┘     └────────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌────────────────────┐     ┌────────────────────┐
                        │   wifi_tracking    │     │      products      │
                        └────────────────────┘     └────────────────────┘

(온톨로지 / 연관 그래프 - Layer 1)

┌─────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ graph_entities  │────▶│   graph_relations  │◀────│   products (노드)  │
└─────────────────┘     └────────────────────┘     └────────────────────┘
```

---

## 3. 시뮬레이션 (Simulation)

### 3.1 시뮬레이션 유형

| 유형 | 기능 | Edge Function |
|------|------|---------------|
| Layout | 레이아웃 변경 영향 예측 | `performLayoutSimulation` |
| Demand | 수요 예측 | `performDemandForecast` |
| Inventory | 재고 최적화 | `performInventoryOptimization` |
| Pricing | 가격 최적화 | `performPricingOptimization` |
| Recommendation | 추천 전략 | `performRecommendationStrategy` |

---

### 3.2 데이터 흐름

**Hook**: `useAIInference`  
**Edge Function**: `advanced-ai-inference`

```text
Frontend (useAIInference.infer)
        │
        ▼
advanced-ai-inference Edge Function
        │
        ├── Store / Data Context 로딩 (useStoreContext)
        │   ├── L2: stores (매장 정보, DIM)
        │   ├── L2: products (상품 목록, DIM)
        │   ├── L3: dashboard_kpis (최근 KPI 히스토리)
        │   ├── L3: inventory_levels (재고 수준)
        │   └── L1: graph_entities (zone/sensor/product 엔티티)
        │
        ├── Lovable AI Gateway 호출
        │   └── google/gemini-2.5-pro (또는 flash)
        │
        └── 예측/최적화 결과 반환
            ├── predictedKpi / demand / inventory / price
            ├── confidenceScore
            ├── aiInsights
            └── recommendations
```

---

### 3.3 시뮬레이션별 데이터 소스

#### Layout Simulation

| 입력 데이터 | 테이블/소스 | 상태 |
|-------------|-------------|------|
| 매장 정보 | `stores` (L2) | ✓ 구현됨 |
| 현재 레이아웃 | `stores.metadata.storeSpaceMetadata`, `graph_entities` (L1) | ✓ 구현됨 |
| 최근 KPI | `dashboard_kpis` (L3) | ✓ 구현됨 |
| 상품/재고 배치 | `products` (L2), `inventory_levels` (L3) | ✓ 구현됨 |

---

#### Demand Forecast

| 입력 데이터 | 테이블/소스 | 상태 |
|-------------|-------------|------|
| 과거 판매 | `daily_sales` (L3), `purchases` (L2) | ✓ 구현됨 |
| 방문 이력 | `visits` (L2), `graph_entities` (L1) | ✓ 구현됨 |
| 외부 요인 | `weather_data`, `holidays_events` (L2) | △ 일부 연동 |
| 경제 지표 | `economic_indicators` (L2) | △ 일부 연동 |

---

#### Inventory Optimization

| 입력 데이터 | 테이블/소스 | 상태 |
|-------------|-------------|------|
| 현재 재고 | `inventory_levels` (L3) | ✓ 구현됨 |
| 재고 이력 | `inventory_history` (L3) | ✓ 구현됨 |
| 판매 속도 | `purchases` (L2), `daily_sales` (L3) | ✓ 구현됨 |
| 리드타임 | `products.metadata` (L2) | △ 일부 연동 |

---

#### Pricing Optimization

| 입력 데이터 | 테이블/소스 | 상태 |
|-------------|-------------|------|
| 상품 가격 | `products.price` (L2) | ✓ 구현됨 |
| 판매 데이터 | `purchases` (L2) | ✓ 구현됨 |
| 경쟁사 가격 | `products.metadata.competitor_price` (L2) | ✗ 미구현 |
| 프로모션 | `graph_entities` (promotions) (L1) | △ 일부 연동 |

---

#### Recommendation Strategy

| 입력 데이터 | 테이블/소스 | 상태 |
|-------------|-------------|------|
| 고객 세그먼트 | `customers.segment` (L2) | ✓ 구현됨 |
| 구매 이력 | `purchases` (L2) | ✓ 구현됨 |
| 상품 연관성 | `graph_relations` (co-purchase) (L1) | ✓ 구현됨 |
| 고객 선호 | `graph_entities` (customer 노드) (L1) | ✓ 구현됨 |

---

### 3.4 AI 모델 사용

| 모델 | 용도 | API |
|------|------|-----|
| `google/gemini-2.5-pro` | 복잡한 예측/최적화/전략 생성 | Lovable AI Gateway |
| `google/gemini-2.5-flash` | 경량 분석/설명/요약 | Lovable AI Gateway |

---

## 4. 데이터 흐름 다이어그램

### 4.1 전체 아키텍처 (3-Layer 구조 반영)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard Page  │  Store Analysis  │ Customer/Product │ Simulation│
│  (KPI/AI Cards)  │  Pages           │ Analysis Pages    │   Hub     │
└────────┬─────────┴──────────┬────────┴──────────┬───────┴──────┬───┘
         │                    │                   │              │
         ▼                    ▼                   ▼              ▼
┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ ┌────────────────┐
│ useDashboardKPI │  │ useFootfall...  │  │ useOntology*   │ │ useAIInference │
│ useAIRecommend  │  │ useTraffic...   │  │ useCustomer*   │ │ useStoreContext│
└────────┬────────┘  └────────┬────────┘  └────────┬───────┘ └────────┬──────┘
         │                    │                   │                   │
         ▼                    ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase Client                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
           ┌────────────────────┼────────────────────┬────────────────┐
           ▼                    ▼                    ▼                ▼
┌──────────────────┐   ┌──────────────────┐  ┌────────────────┐ ┌────────────┐
│  Database Tables  │   │  Edge Functions │  │   Storage      │ │  Lovable   │
│  (Layer 1/2/3)    │   │  (ETL / AI)     │  │  (3D/Assets)   │ │  AI GW     │
├──────────────────┤   ├──────────────────┤  ├────────────────┤ ├────────────┤
│ **Layer 3 (KPI/AI)** │   │ • aggregate-     │  │ • store-data   │ │ • gemini-* │
│  • dashboard_kpis │   │   dashboard-kpis  │  │ • 3d-models    │ │ (pro/flash) │
│  • daily_sales    │   │ • advanced-ai-   │  │                │ └────────────┘
│  • inventory_lvl  │   │   inference      │  │                │
│  • zone_metrics   │   │ • ontology-ai-   │  │                │
│  • ai_recommend*  │   │   inference      │  └────────────────┘
│  • ai_insights    │   │ • infer-entity-  │
│  • inventory_hist │   │   relations      │
│                   │   └──────────────────┘
│ **Layer 2 (Facts/DIM)**                                       
│  • stores, products, customers (DIM)                    
│  • visits, purchases, transactions (FACT)             
│  • wifi_tracking (Raw)
│  • weather_data, holidays_events, economic_indicators
│                                                             
│ **Layer 1 (Graph & Raw)**                                   
│  • graph_entities, graph_relations                         
│  • wifi_tracking, sensor_events                            
│  • ontology_entity_types, ontology_relation_types          
└──────────────────┘
```

> 이 다이어그램에서:
> * **Frontend**는 동일한 Hook/페이지 구조를 사용
> * **Database**는 Layer 1/2/3로 논리적으로 분리
> * **Edge Functions**는 L1→L2 ETL, L2→L3 집계, AI Inference를 담당

---

### 4.2 데이터 동기화 흐름 (Raw → Graph → Facts → KPI)

```text
[운영/외부 데이터 입력]
    │
    ▼
┌───────────────────────────────────────┐
│      Raw & Trigger Layer (L1)        │
│ • Database Triggers                  │
│   - sync_customer_to_ontology        │
│   - sync_product_to_ontology         │
│   - sync_purchase_to_ontology        │
│   - sync_store_to_ontology           │
│   - sync_weather_to_ontology         │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│        graph_entities 생성 (L1)       │
│  (자동 온톨로지 엔티티 변환)           │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ ontology_relation_inference_queue (L1)│
│ (관계 추론 대기열)                     │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ infer-entity-relations Edge Fn (L1)   │
│ (AI 기반 관계 추론 → graph_relations) │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│   Aggregation: Graph → KPI (L3)       │
│  - aggregate-dashboard-kpis           │
│  (현재: graph_entities 기반 집계)     │
└───────────────────────────────────────┘
```

---

## 5. 테이블 참조 요약

### 5.1 핵심 테이블 (레이어 기준)

| 테이블 | 레이어 | 역할 | 사용처 | 상태 |
|--------|--------|------|--------|------|
| `stores` | L2 (DIM) | 매장 마스터 데이터 | 전체 | ✓ |
| `products` | L2 (DIM) | 상품 마스터 | Product Analysis, Simulation | ✓ |
| `customers` | L2 (DIM) | 고객 마스터 | Customer Analysis | ✓ |
| `visits` | L2 (FACT) | 방문 세션 데이터 | Store/Customer Analysis | ✓ |
| `purchases` | L2 (FACT) | 거래(영수증) 데이터 | KPI, Simulation | ✓ |
| `transactions` | L2 (FACT) | 거래(영수증) 데이터 | KPI, Simulation | ✓ |
| `dashboard_kpis` | L3 | 일별/매장별 KPI 집계 | Dashboard, Simulation | ✓ |
| `daily_sales` | L3 | 일별 매출 집계 | Demand, KPI | ✓ |
| `inventory_levels` | L3 | 시점별 재고 수준 스냅샷 | Product Analysis, Inventory Sim | ✓ |
| `inventory_history` | L3 | 재고 변동 이력 | Inventory 최적화 | ✓ |
| `zone_metrics` | L3 | 존별 방문/체류 집계 | Store Analysis, Layout Sim | ✓ |
| `graph_entities` | L1 | 온톨로지 엔티티 | 3D/온톨로지/AI 추론 전체 | ✓ |
| `graph_relations` | L1 | 엔티티 간 관계 | 연관 분석, 추천, 시뮬레이션 | ✓ |

---

### 5.2 보조 테이블

| 테이블 | 레이어 | 역할 | 상태 |
|--------|--------|------|------|
| `wifi_tracking` | L1 Raw | WiFi 기반 동선/세션 추적 | ✓ |
| `sensor_events` | L1 Raw | 센서 이벤트 (probe, enter, exit 등) | ✓ |
| `weather_data` | L2 | 날짜/지역별 날씨 정보 | ✓ |
| `holidays_events` | L2 | 공휴일/이벤트/프로모션 캘린더 | ✓ |
| `economic_indicators` | L2 | 외부 경제 지표 | ✓ |
| `regional_data` | L2 | 상권 유동인구 데이터 | ✓ |
| `store_scenes` | L1 | 3D 씬 데이터 | ✓ |
| `ai_recommendations` | L3 | AI 생성 운영/전략/시뮬레이션 추천 | ✓ |
| `ai_insights` | L3 | AI 생성 인사이트 | ✓ |

---

### 5.3 미구현 테이블 (향후 구현 필요)

| 테이블 | 레이어 | 역할 | 우선순위 |
|--------|--------|------|---------|
| `line_items` | L2 (FACT) | SKU 단위 판매 상세 | 높음 |
| `funnel_events` | L2 | 퍼널 단계별 이벤트 로그 | 높음 |
| `zone_events` | L2 | 존 단위 이벤트 로그 | 중간 |
| `visit_zone_events` | L2 | 방문-존 이벤트 연결 | 중간 |
| `product_sales_daily` | L3 | 상품별 일별 매출/마진 | 높음 |
| `zones_dim` | L2 (DIM) | 존 마스터 데이터 | 중간 |
| `customer_segments` | L3 | 고객 세그먼트 뷰/테이블 | 낮음 |
| `staff` | L2 (DIM) | 직원 마스터 | 낮음 |
| `shift_schedules` | L2 | 근무 스케줄 | 낮음 |
| `inventory_movements` | L2 | 재고 이동 이력 | 중간 |

---

## 6. 개선 필요 항목

### 6.1 데이터 정확도

| 항목 | 현재 상태 | 개선 방향 | 우선순위 |
|------|----------|----------|---------|
| Funnel Metrics | 고정 비율 (80/40/20%) | `funnel_events` 테이블 구현 및 실제 이벤트 집계 | 높음 |
| Weather | 일부 매장/기간만 연동 | `weather_data`를 모든 매장/기간으로 확대 | 중간 |
| Holiday/Events | 주요 공휴일 중심 | 로컬 이벤트/프로모션/캠페인까지 확대 | 중간 |
| Labor Hours | 미연동 | `staff`, `shift_schedules` 스키마 정의 및 구현 | 낮음 |
| ~~KPI 테이블 통합~~ | ~~dashboard_kpis + daily_kpis_agg 중복~~ | ~~daily_kpis_agg로 통합~~ | ~~✅ 완료~~ |

---

### 6.2 성능 / 아키텍처 최적화

| 항목 | 권장 사항 |
|------|----------|
| KPI 집계 | `aggregate-dashboard-kpis`를 주기적 Cron Job으로 실행, 프론트는 항상 L3 만 조회 |
| 히트맵/존 메트릭 | `wifi_tracking`/`sensor_events`를 기반으로 `zone_metrics`를 사전 집계 후 조회 |
| AI 추론 | 시뮬레이션/AI 인퍼런스 결과를 `ai_insights`, `ai_recommendations`에 캐싱 (5~15분 단위) |
| Graph ETL | Raw → Graph → Facts ETL을 모듈화하여, 스키마 변경 시 영향 범위를 최소화 |

---

### 6.3 실제 구현 vs 목표 아키텍처 갭

| 영역 | 현재 구현 | 목표 아키텍처 |
|------|----------|--------------|
| ~~KPI 조회~~ | ~~dashboard_kpis / daily_kpis_agg 혼용~~ | ~~daily_kpis_agg (L3) 단일 사용~~ | ✅ 완료 |
| 고객 여정 | `wifi_tracking` (L1) | `visits` + `visit_zone_events` (L2) |
| 구매 패턴 | `purchases` (L2) | `transactions` + `line_items` (L2) |
| 존 통계 | `stores.metadata.zones` | `zones_dim` (L2) + `zone_metrics` (L3) |
| ~~방문 데이터~~ | ~~visits / store_visits 혼용~~ | ~~store_visits (L2) 단일 사용~~ | ✅ 완료 |

---

### 6.4 완료된 개선 사항 (2025-12-16)

#### KPI 테이블 통합 (dashboard_kpis → daily_kpis_agg)

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useROITracking.ts` | fetchCurrentKPIs → daily_kpis_agg 사용 |
| `src/features/simulation/hooks/useStoreContext.ts` | dashboard_kpis fallback 제거, daily_kpis_agg만 사용 |
| `src/features/simulation/hooks/useDataSourceMapping.ts` | KPI 소스를 daily_kpis_agg로 변경 |
| `src/features/data-management/import/components/IntegratedImportStatus.tsx` | daily_kpis_agg 삭제 로직 추가 |

#### 방문 데이터 테이블 통합 (visits → store_visits)

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useStoreData.ts` | visits 쿼리 → store_visits로 변경 |
| `src/features/simulation/hooks/useDataSourceMapping.ts` | 방문 데이터 소스를 store_visits로 변경 |

---

*문서 버전: 2.2*
*최종 업데이트: 2025-12-16 (KPI 테이블 통합, visits 마이그레이션 완료)*
