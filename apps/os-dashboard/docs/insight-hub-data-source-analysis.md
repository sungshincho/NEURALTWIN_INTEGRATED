# Insight Hub 페이지 - 탭별 카드 데이터 소스 분석 리포트

> 분석 대상: `src/features/insights/` 디렉토리
> 데이터 Provider: `InsightDataContext.tsx`
> 백엔드: Supabase (PostgreSQL)
> 캐싱: TanStack React Query (staleTime: 5분, gcTime: 10분)

---

## 목차

1. [Overview 탭 (개요)](#1-overview-탭-개요)
2. [Store 탭 (매장)](#2-store-탭-매장)
3. [Customer 탭 (고객)](#3-customer-탭-고객)
4. [Product 탭 (상품)](#4-product-탭-상품)
5. [Inventory 탭 (재고)](#5-inventory-탭-재고)
6. [Prediction 탭 (AI 예측)](#6-prediction-탭-ai-예측)
7. [AI Recommendation 탭 (AI 추천)](#7-ai-recommendation-탭-ai-추천)
8. [전체 테이블 종합 맵](#8-전체-테이블-종합-맵)

---

## 1. Overview 탭 (개요)

**파일**: `tabs/OverviewTab.tsx`
**데이터 로딩**: 항상 로드 (Eager Loading)
**훅**: `useIntegratedMetrics()` → 내부적으로 `baseKPIs` + `funnelData` 결합

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|------------|-----------|-----------|
| 1 | **FOOTFALL** | 총 입장 | 총 입장 횟수 + 전기 대비 변화율(%) | `funnel_events` | `event_type='entry'`, `event_date`, `org_id`, `store_id` | 서버사이드 COUNT (`select('*', {count:'exact', head:true})`) |
| 2 | **UNIQUE VISITORS** | 순 방문객 | 고유 방문자 수 + 평균 방문 빈도 | `daily_kpis_agg` | `unique_visitors`, `date`, `org_id`, `store_id` | SUM(unique_visitors), 부가: footfall/unique_visitors로 방문빈도 계산 |
| 3 | **REVENUE** | 총 매출 | 총 매출 금액 + 객단가(ATV) | `daily_kpis_agg` | `total_revenue`, `total_transactions`, `date`, `org_id`, `store_id` | SUM(total_revenue), 부가: revenue/transactions로 ATV 계산 |
| 4 | **CONVERSION** | 구매 전환율 | 평균 전환율(%) + 거래 건수 | `daily_kpis_agg` | `conversion_rate`, `total_transactions`, `date`, `org_id`, `store_id` | AVG(conversion_rate), SUM(total_transactions) |

> **변화율 계산**: 현재 기간과 동일 길이의 이전 기간을 비교하여 `changes.footfall`, `changes.uniqueVisitors`, `changes.revenue`, `changes.conversionRate` 산출 (InsightDataContext에서 처리)

### 차트 및 위젯

| # | 카드명 | 표시 지표 | 소스 테이블 | 사용 컬럼 |
|---|--------|-----------|------------|-----------|
| 5 | **퍼널 차트** | Entry→Browse→Engage→Fitting→Purchase 단계별 수, 드롭오프율, 전환율 | `funnel_events` | `event_type` ('entry','browse','engage','fitting','purchase'), `event_date`, `org_id`, `store_id` |
| 6 | **시간대별 방문 분포** | 24시간 시간대별 입장 수 | `funnel_events` (via RPC) | RPC `get_hourly_entry_counts(p_org_id, p_store_id, p_start_date, p_end_date)` |
| 7 | **AI 인사이트 카드** | AI 추천 요약 (우선순위별) | `ai_recommendations` | `title`, `description`, `priority`, `status`, `is_displayed`, `user_id`, `org_id`, `store_id` |
| 8 | **목표 진행 위젯** | 스토어 목표 달성 현황 | `store_goals` | (GoalProgressWidget 컴포넌트) |
| 9 | **AI 추천 효과 위젯** | AI 적용 전략 효과 | `applied_strategies` + `roi_tracking` | (AIRecommendationEffectWidget 컴포넌트) |

**쿼리 패턴**:
```
daily_kpis_agg: .eq('org_id').eq('store_id').gte('date', startDate).lte('date', endDate)
funnel_events: .select('*', {count:'exact', head:true}).eq('event_type', type) (서버사이드 COUNT)
```

---

## 2. Store 탭 (매장)

**파일**: `tabs/StoreTab.tsx`
**데이터 로딩**: Lazy Loading (Store 탭 진입 시) + Eager (`useIntegratedMetrics`, `useHourlyVisitors`)
**훅**: `useIntegratedMetrics()`, `useHourlyVisitors()`, `useZoneMetricsByDateRange()`, `useZonesDim()`

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|------------|-----------|-----------|
| 1 | **PEAK TIME** | 피크타임 | 피크 시간대 + 해당 시간 방문자 수 | `funnel_events` (via RPC) | RPC `get_hourly_entry_counts` → `{hour, count}[]` | hourlyData에서 `visitors` 최대값인 시간대 추출 (`reduce(max)`) |
| 2 | **POPULAR ZONE** | 인기 존 | 1위 존 이름 + 방문자 수 | `zone_daily_metrics` + `zones_dim` | `zone_id`, `total_visitors` + `zone_name` | zone_id별 SUM(total_visitors) → 방문자 수 기준 정렬 → 1위 |
| 3 | **AVG DWELL TIME** | 평균 체류시간 | 전체 존 평균 체류시간(분) | `zone_daily_metrics` (또는 `useIntegratedMetrics`) | `avg_dwell_seconds` | `metrics.avgDwellTime / 60` 또는 zoneData 평균 체류시간 |
| 4 | **TRACKING COVERAGE** | 센서 커버율 | 추적 비율(%) + 추적 방문자 수 | `daily_kpis_agg` + `funnel_events` | `unique_visitors`, `funnel_events(entry count)` | `useIntegratedMetrics()` → `trackedVisitors / uniqueVisitors * 100` |

### 차트 및 테이블

| # | 카드명 | 표시 지표 | 소스 테이블 | 사용 컬럼 |
|---|--------|-----------|------------|-----------|
| 5 | **시간대별 방문 패턴** | 24시간 시간대별 입장 수 (바 차트) | `funnel_events` (via RPC) | RPC `get_hourly_entry_counts` |
| 6 | **존별 체류시간 분석** | 존별 평균 체류시간 (바 차트) | `zone_daily_metrics` + `zones_dim` | `zone_id`, `avg_dwell_seconds`, `zone_name` |
| 7 | **존별 방문자 비중** | 존별 방문자 분포 (도넛 차트) | `zone_daily_metrics` + `zones_dim` | `zone_id`, `total_visitors`, `zone_name` |
| 8 | **존별 성과 비교 테이블** | 존명, 방문자수, 평균체류, 전환율 | `zone_daily_metrics` + `zones_dim` | `zone_id`, `total_visitors`, `avg_dwell_seconds`, `conversion_count`, `zone_name` |

**쿼리 패턴**:
```
zone_daily_metrics: .select('zone_id, total_visitors, avg_dwell_seconds, revenue_attributed')
                    .eq('org_id').eq('store_id').gte('date').lte('date').limit(10000)
zones_dim:          .select('id, zone_name, zone_type').eq('org_id').eq('store_id').eq('is_active', true)
```

**데이터 가공**: 프론트엔드에서 zone_id 기준으로 zone_daily_metrics를 집계(SUM visitors, AVG dwell, SUM revenue)한 뒤 zones_dim과 조인하여 존 이름 매핑

---

## 3. Customer 탭 (고객)

**파일**: `tabs/CustomerTab.tsx`
**데이터 로딩**: Lazy Loading (Customer 탭 진입 시) + Eager (`useIntegratedMetrics`)
**훅**: `useIntegratedMetrics()`, 자체 `useQuery` (customer_segments_agg, return-visits)

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|------------|-----------|-----------|
| 1 | **UNIQUE VISITORS** | 순 방문객 | 고유 방문자 수(명) | `daily_kpis_agg` | `unique_visitors`, `date`, `org_id`, `store_id` | `useIntegratedMetrics()` → `metrics.uniqueVisitors` |
| 2 | **REPEAT RATE** | 재방문율 | 재방문율(%) | `daily_kpis_agg` | `returning_visitors`, `unique_visitors` | `metrics.repeatRate` 또는 폴백: SUM(returning_visitors) / SUM(unique_visitors) * 100 |
| 3 | **TOP SEGMENT** | 주요 세그먼트 | 최다 세그먼트명 + 고객 수 | `customer_segments_agg` | `segment_name`, `customer_count`, `date`, `org_id`, `store_id` | customer_count 기준 내림차순 정렬 → 1위 세그먼트 |
| 4 | **LOYAL CUSTOMERS** | 충성 고객 | VIP/충성 세그먼트 고객 수(명) | `customer_segments_agg` | `segment_name`, `customer_count` | `segment_name`에 'VIP', '충성', 'loyal' 포함 여부 필터 |

### 차트 및 테이블

| # | 카드명 | 표시 지표 | 소스 테이블 | 사용 컬럼 |
|---|--------|-----------|------------|-----------|
| 5 | **고객 세그먼트 분포** | 세그먼트별 고객 수 (도넛 차트) | `customer_segments_agg` | `segment_name`, `customer_count` |
| 6 | **세그먼트별 평균 구매** | 세그먼트별 평균 거래 금액 (바 차트) | `customer_segments_agg` | `segment_name`, `avg_transaction_value` |
| 7 | **재방문 추이** | 일별 신규/재방문 방문자 추이 (영역 차트) | `daily_kpis_agg` | `date`, `unique_visitors`, `returning_visitors` |
| 8 | **세그먼트 상세 테이블** | 세그먼트명, 고객수, 매출, LTV, 이탈위험 | `customer_segments_agg` | `segment_name`, `customer_count`, `total_revenue`, `ltv_estimate`, `churn_risk_score` |

**쿼리 패턴**:
```
customer_segments_agg: .select('segment_name, customer_count, total_revenue, avg_transaction_value, visit_frequency, ltv_estimate, churn_risk_score')
                       .eq('org_id').eq('store_id').eq('date', endDate)
daily_kpis_agg (재방문): .select('date, unique_visitors, returning_visitors')
                         .eq('org_id').eq('store_id').gte('date').lte('date').order('date')
```

**참고**: `customer_segments_agg`는 최신 날짜(endDate) 기준 단일 조회. 재방문율은 `useIntegratedMetrics()`에서 제공되며, 재방문 추이 차트는 별도 `useQuery`로 기간 전체 일별 데이터를 조회.

---

## 4. Product 탭 (상품)

**파일**: `tabs/ProductTab.tsx`
**데이터 로딩**: Lazy Loading (Product 탭 진입 시) + Eager (`useIntegratedMetrics`)
**훅**: `useIntegratedMetrics()`, 자체 `useQuery` (product-performance)

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|------------|-----------|-----------|
| 1 | **REVENUE** | 총 매출 | 분석 기간 총 매출 금액 | `daily_kpis_agg` | `total_revenue`, `date`, `org_id`, `store_id` | `useIntegratedMetrics()` → `metrics.revenue` (Overview탭과 동일 소스) |
| 2 | **UNITS SOLD** | 총 판매량 | 총 판매 수량(개) | `product_performance_agg` | `product_id`, `units_sold`, `date`, `org_id`, `store_id` | product_id별 SUM(units_sold) → 전체 합계 |
| 3 | **BESTSELLER** | 베스트셀러 | 1위 상품명 + 매출 금액 | `product_performance_agg` + `products` | `product_id`, `revenue` + `product_name` | product_id별 SUM(revenue) → 매출 기준 정렬 → 1위 상품, 하이브리드 정규화 적용 |
| 4 | **LOW STOCK** | 재고 부족 | 재고 부족 상품 수(개) | `product_performance_agg` | `product_id`, `stock_level` | `stock_level >= 0 && stock_level < 10` 조건 필터 → COUNT |

> **하이브리드 정규화**: `product_performance_agg`의 상품별 매출 비율을 `daily_kpis_agg.total_revenue`에 적용하여 데이터 일관성 확보 (`revenueRatio = kpiTotalRevenue / productPerfTotal`)

### 차트 및 테이블

| # | 카드명 | 표시 지표 | 소스 테이블 | 사용 컬럼 |
|---|--------|-----------|------------|-----------|
| 5 | **상품별 매출 TOP 10** | 매출 기준 상위 10개 상품 (가로 바 차트) | `product_performance_agg` + `products` | `product_id`, `revenue`, `units_sold` + `product_name`, `category` |
| 6 | **카테고리별 매출 비중** | 카테고리별 매출 분포 (도넛 차트) | `product_performance_agg` + `products` | `revenue` (카테고리별 집계) + `category` |
| 7 | **카테고리별 판매량** | 카테고리별 판매 수량 (바 차트) | `product_performance_agg` + `products` | `units_sold` (카테고리별 집계) + `category` |
| 8 | **상세 상품 테이블** | 순위, 상품명, 카테고리, 판매량, 매출 | `product_performance_agg` + `products` | `product_id`, `revenue`, `units_sold` + `product_name`, `category` |

**쿼리 패턴**:
```
product_performance_agg: .select('product_id, units_sold, revenue, stock_level')
                         .eq('org_id').eq('store_id').gte('date').lte('date').limit(10000)
products:                .select('id, product_name, category').in('id', productIds)
```

**데이터 가공**: 프론트엔드에서 product_id별 집계(SUM revenue, SUM units_sold, 최신 stock_level) → products 테이블과 조인 → 매출 기준 정렬 → 카테고리별 재집계. 하이브리드 정규화로 `daily_kpis_agg` 총액 기준 비율 적용.

---

## 5. Inventory 탭 (재고)

**파일**: `tabs/InventoryTab.tsx`
**데이터 로딩**: Lazy Loading (Inventory 탭 진입 시)
**훅**: `useInventoryMetricsData()`

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|------------|-----------|-----------|
| 1 | **TOTAL ITEMS** | 총 상품 수 | 관리 중인 SKU 수 | `inventory_levels` | 전체 행 | COUNT(*) |
| 2 | **LOW STOCK** | 재고 부족 | 부족+위험 상품 수 | `inventory_levels` | `current_stock`, `optimal_stock`, `minimum_stock` | current ≤ minimum → critical, current < optimal×0.5 → low, 합산 COUNT |
| 3 | **OVERSTOCK** | 과잉 재고 | 과잉 재고 상품 수 | `inventory_levels` | `current_stock`, `optimal_stock` | current > optimal×1.5 → overstock COUNT |
| 4 | **HEALTHY** | 정상 재고 | 정상 재고 상품 수 + 비율(%) | `inventory_levels` | `current_stock`, `optimal_stock`, `minimum_stock` | critical/low/overstock 아닌 나머지 → normal COUNT, (normal/total×100)% |

### 차트 및 테이블

| # | 카드명 | 표시 지표 | 소스 테이블 | 사용 컬럼 |
|---|--------|-----------|------------|-----------|
| 5 | **재고 상태 분포 (도넛 차트)** | critical/low/normal/overstock 분포 | `inventory_levels` | `current_stock`, `optimal_stock`, `minimum_stock` (상태별 COUNT) |
| 6 | **카테고리별 재고 현황 (바 차트)** | 카테고리별 총 재고, 부족/과잉 건수 | `inventory_levels` + `products` | **inventory_levels**: `product_id`, `current_stock`, `optimal_stock`, `minimum_stock` / **products**: `id`, `category` |
| 7 | **재고 부족 경고** | 위험 상품 목록 (상품명, 현재고/적정재고, 품절 예상일, 긴급도) | `inventory_levels` + `products` | **inventory_levels**: `product_id`, `current_stock`, `optimal_stock`, `minimum_stock`, `weekly_demand` / **products**: `id`, `product_name` |
| 8 | **최근 입출고 내역** | 입출고 이력 (상품명, 유형, 수량, 잔여, 일자) | `inventory_movements` + `products` | **inventory_movements**: `id`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `new_stock`, `reason`, `moved_at`, `org_id` / **products**: `id`, `product_name` |
| 9 | **상세 재고 테이블** | 전체 상품 재고 상세 (상품명, SKU, 카테고리, 현재고, 적정재고, 최소재고, 상태, 품절예상) | `inventory_levels` + `products` | **inventory_levels**: `id`, `product_id`, `current_stock`, `optimal_stock`, `minimum_stock`, `weekly_demand`, `last_updated` / **products**: `id`, `product_name`, `sku`, `category`, `price` |

**쿼리 패턴**:
```
inventory_levels:    .select('id, product_id, current_stock, optimal_stock, minimum_stock, weekly_demand, last_updated')
                     .eq('org_id').limit(1000)
products:            .select('id, product_name, sku, category, price').in('id', productIds)
inventory_movements: .select('id, product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id, moved_at')
                     .eq('org_id').gte('moved_at', startDate).lte('moved_at', endDate)
                     .order('moved_at', {ascending: false}).limit(100)
```

**데이터 가공**:
- 재고 상태 계산: `current <= minimum` → critical, `current < optimal*0.5` → low, `current > optimal*1.5` → overstock, 나머지 → normal
- 품절 예상일: `Math.floor(current_stock / (weekly_demand / 7))`
- 긴급도: 품절 예상일 ≤3 → critical, ≤7 → high, ≤14 → medium, 그 외 → low

---

## 6. Prediction 탭 (AI 예측)

**파일**: `tabs/PredictionTab.tsx`
**데이터 로딩**: 독립 훅 (탭 진입 시)
**훅**: `useAIPrediction()`

### KPI 요약 카드 (4개)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 테이블 / API | 사용 컬럼 | 계산 로직 |
|---|--------|-----------|---------|-------------------|-----------|-----------|
| 1 | **향후 7일 예상 매출** | - | 예측 매출 합계 + 전주 대비 변화율(%) | `daily_kpis_agg` → Edge Function `retail-ai-inference` | `total_revenue`, `date` | 과거 14~30일 데이터 → AI 예측 또는 통계적 폴백(이동평균+트렌드+요일패턴) |
| 2 | **예상 방문자** | - | 7일 누적 예상 방문자 수 | 동일 | `total_visitors`, `date` | 동일 파이프라인 |
| 3 | **예상 전환율** | - | 7일 평균 예측 전환율(%) | 동일 | `conversion_rate`, `date` | 동일 파이프라인 |
| 4 | **예측 신뢰도** | - | 전체 신뢰도 (높음/보통/낮음) + % | 내부 계산 | - | AI 모델 confidence 또는 통계적 신뢰구간(±1.96σ) |

### 차트 및 테이블

| # | 카드명 | 표시 지표 | 소스 테이블 / API | 사용 컬럼 |
|---|--------|-----------|-------------------|-----------|
| 5 | **매출 예측 차트** | 과거 14일 실적 + 향후 7일 예측 라인 차트 | `daily_kpis_agg` | `total_revenue`, `date` (과거 14~30일) |
| 6 | **방문자 예측 차트** | 일별 방문자 추이 | 동일 | `total_visitors`, `date` |
| 7 | **전환율 예측 차트** | 일별 전환율 추이 | 동일 | `conversion_rate`, `date` |
| 8 | **일별 예측 상세 테이블** | 날짜, 예상매출, 신뢰구간, 방문자, 전환율, 신뢰도(%) | 동일 | 예측 결과값 |
| 9 | **예측 모델 정보** | 데이터 일수, 트렌드 방향, 요일 패턴, 업데이트 시간 | 내부 분석 결과 | 메타데이터 |

**데이터 파이프라인**:
```
1. daily_kpis_agg에서 과거 14~30일 데이터 조회
   .select('date, total_revenue, total_visitors, conversion_rate')
   .eq('org_id').eq('store_id').gte('date', 30일전).lte('date', 오늘)

2. Edge Function 호출 (Gemini 2.5 Flash)
   supabase.functions.invoke('retail-ai-inference', {body: {historical_data, prediction_days: 7}})

3. 폴백 (AI 실패 시): 통계적 예측
   - 이동평균 (7일 MA)
   - 선형 트렌드 분석
   - 요일 패턴 보정 (요일별 매출 비율)
   - 신뢰구간: ±(표준편차 * 1.96)
```

---

## 7. AI Recommendation 탭 (AI 추천)

**파일**: `tabs/AIRecommendationTab.tsx`
**데이터 로딩**: 독립 훅
**훅**: `useAIRecommendations(storeId)`

### KPI 예측 카드 (4개) — 1단계: 예측 (Predict)

| # | 카드명 | 한글 라벨 | 표시 값 | 소스 | 계산 로직 |
|---|--------|-----------|---------|------|-----------|
| 1 | **수요 예측** | - | 다음 7일 예상 매출 + 전주 대비 변화(%) | **Mock 데이터** | 향후 `daily_kpis_agg` + AI 연동 예정 |
| 2 | **방문자 예측** | - | 다음 7일 예상 방문자 + 변화율(%) | **Mock 데이터** | 향후 연동 예정 |
| 3 | **시즌 트렌드** | - | 계절성 분석 + 피크 시기 | **Mock 데이터** | 향후 연동 예정 |
| 4 | **리스크 예측** | - | 위험 요소 건수 + 재고 부족 위험 품목 | **Mock 데이터** | 향후 연동 예정 |

### 섹션별 데이터 소스

| # | 섹션/카드명 | 표시 지표 | 소스 테이블 / API | 사용 컬럼 |
|---|------------|-----------|-------------------|-----------|
| **진행 중인 전략** | | | | |
| 5 | ActiveStrategy 카드 | 전략명, 상태, 진행일, 예상/현재 ROI, 진행률 | Mock 데이터 (향후 `applied_strategies` 연동 예정) | - |
| **2단계: 최적화 (Optimize)** | | | | |
| 6 | 가격 최적화 | 분석 대상/최적화 가능 상품 수, 잠재 수익 증가(%) | Mock 데이터 | - |
| 7 | 재고 최적화 | 분석 대상, 발주 추천 건수, 품절 방지 건수 | Mock 데이터 | - |
| **3단계: 추천 (Recommend)** | | | | |
| 8 | 추천 전략 카드 (최대 3개) | 순위, 제목, 설명, 신뢰도, 대상고객, 기간, 추가매출/전환율/ROI | `ai_recommendations` | `id`, `title`, `description`, `priority`, `status`, `expected_impact` (→`revenue_increase`), `is_displayed`, `user_id`, `org_id`, `store_id`, `created_at` |
| **4단계: 실행/측정** | | | | |
| 9 | ROI 측정 바로가기 | ROI 대시보드 링크 | 라우팅 (/roi) | - |

**쿼리 패턴**:
```
ai_recommendations: .select('*')
                    .eq('user_id').eq('org_id').eq('store_id')
                    .eq('is_displayed', true)
                    .order('created_at', {ascending: false}).limit(10)
```

**참고**: 이 탭의 1~2단계(예측/최적화)는 현재 Mock 데이터를 사용하며, 3단계(추천)만 `ai_recommendations` 테이블에서 실제 데이터를 로드합니다. 전략 적용 시 `ApplyStrategyModal`을 통해 `applied_strategies` 테이블에 기록됩니다.

---

## 8. 전체 테이블 종합 맵

### 핵심 데이터 테이블 → 탭 매핑

| 테이블명 | 주요 컬럼 | 사용 탭 | 로딩 방식 |
|----------|-----------|---------|-----------|
| `daily_kpis_agg` | `date`, `total_visitors`, `unique_visitors`, `returning_visitors`, `total_revenue`, `total_transactions`, `conversion_rate`, `avg_transaction_value`, `org_id`, `store_id` | Overview, Store(커버율), Customer(재방문율), Product(매출), Prediction(과거데이터) | Eager |
| `funnel_events` | `event_type`, `event_date`, `org_id`, `store_id` | Overview, Store(피크타임·커버율) | Eager |
| `zone_daily_metrics` | `zone_id`, `date`, `total_visitors`, `avg_dwell_seconds`, `revenue_attributed`, `org_id`, `store_id` | Store | Lazy |
| `zones_dim` | `id`, `zone_name`, `zone_type`, `is_active`, `org_id`, `store_id` | Store | Lazy |
| `zone_transitions` | `from_zone_id`, `to_zone_id`, `transition_count`, `transition_date`, `org_id`, `store_id` | Store | Lazy |
| `customer_segments_agg` | `segment_name`, `customer_count`, `total_revenue`, `ltv_estimate`, `churn_risk_score`, `date`, `org_id`, `store_id` | Customer | Lazy |
| `product_performance_agg` | `product_id`, `revenue`, `units_sold`, `date`, `org_id`, `store_id` | Product | Lazy |
| `products` | `id`, `product_name`, `sku`, `category`, `price` | Product, Inventory | Lazy |
| `inventory_levels` | `id`, `product_id`, `current_stock`, `optimal_stock`, `minimum_stock`, `weekly_demand`, `last_updated`, `org_id` | Inventory | Lazy |
| `inventory_movements` | `id`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `new_stock`, `reason`, `moved_at`, `org_id` | Inventory | Lazy |
| `ai_recommendations` | `id`, `title`, `description`, `priority`, `status`, `expected_impact`, `is_displayed`, `user_id`, `org_id`, `store_id`, `created_at` | Overview, AI Recommendation | Eager/Lazy |

### RPC 함수

| 함수명 | 파라미터 | 반환값 | 사용 탭 |
|--------|----------|--------|---------|
| `get_hourly_entry_counts` | `p_org_id`, `p_store_id`, `p_start_date`, `p_end_date` | `{hour, count}[]` | Overview, Store(피크타임) |

### Edge Function

| 함수명 | 입력 | 모델 | 사용 탭 |
|--------|------|------|---------|
| `retail-ai-inference` | `historical_data[]`, `prediction_days` | Gemini 2.5 Flash | Prediction |

### 공통 필터 조건

모든 쿼리에 적용되는 기본 필터:
- `org_id`: 사용자 소속 조직 ID (`useAuth()`)
- `store_id`: 선택된 매장 ID (`useSelectedStore()`)
- `date` 범위: 시작일~종료일 (`useDateFilterStore()`)

---

## 데이터 아키텍처 다이어그램

```
                    ┌──────────────────────────────────────┐
                    │        InsightDataProvider            │
                    │     (InsightDataContext.tsx)           │
                    └───────┬──────────┬───────────────────┘
                            │          │
                  Eager Loading    Lazy Loading (탭 진입 시)
                  ┌─────────┘          └──────────────┐
                  │                                    │
          ┌───────┴───────┐              ┌─────────────┴──────────────┐
          │               │              │         │         │        │
    daily_kpis_agg  funnel_events   zone_*    customer   product  inventory
          │               │          tables   segments    perf     levels
          │               │              │       agg       agg    movements
          ▼               ▼              ▼        ▼         ▼        ▼
      Overview         Overview       Store    Customer  Product  Inventory
      Customer         (funnel)        Tab       Tab      Tab       Tab
      Prediction       (hourly)
        Tab
```
