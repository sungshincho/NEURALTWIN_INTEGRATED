# Phase 5 Sprint B — Step 7: 중복 테이블/컬럼 통합 분석

> 분석일: 2026-02-26
> 방법론: DB 스키마 비교 + 코드 참조 분석 (apps/, supabase/) + 데이터 샘플 검증
> 결론: **5개 그룹 모두 통합 불필요 — 의도적 역할 분리 확인**

---

## 분석 요약

| 그룹 | 테이블 | 통합 판단 | 근거 |
|------|--------|----------|------|
| 1. KPI | daily_kpis_agg, dashboard_kpis | **통합 불가** | 스키마 상이 (29 vs 22 cols), 데이터 겹침 0, L3 집계 vs 유저별 퍼널 |
| 2. Inventory | inventory_levels, inventory_movements, realtime_inventory | **통합 불가** | 현재 수량 / 이동 이력 / POS 연동 — 역할 완전 분리 |
| 3. Zone Metrics | zone_daily_metrics, hourly_metrics | **통합 불가** | 존별 일간 vs 매장별 시간별 — 집계 단위 상이 |
| 4. Sync Logs | data_sync_logs, api_sync_logs | **통합 보류** | 다른 EF가 사용, 스키마 크게 상이. 두 테이블 모두 0행 — 향후 재검토 |
| 5. Ontology | 6개 테이블 | **통합 불가** | 스키마 정의 시스템의 정규화된 구조, 모두 활발히 사용 |

---

## 그룹 1: KPI 관련

### 테이블 현황

| 테이블 | 행 수 | 컬럼 수 | 고유 날짜 | 고유 매장 | 날짜 범위 |
|--------|-------|---------|----------|----------|----------|
| `daily_kpis_agg` | 90 | 29 | 90 | 1 | 2025-10-11 ~ 2026-01-08 |
| `dashboard_kpis` | 90 | 22 | 90 | 0 (NULL) | 2025-09-14 ~ 2025-12-12 |

### 컬럼 유사도 매트릭스

| 공통 컬럼 | daily_kpis_agg | dashboard_kpis |
|-----------|---------------|----------------|
| id, org_id, store_id, date | ✅ | ✅ |
| total_revenue, conversion_rate, sales_per_sqm | ✅ | ✅ |
| weather_condition, is_holiday, special_event | ✅ | ✅ |
| labor_hours | ✅ | ✅ |
| created_at, updated_at | ✅ | ✅ |

| daily_kpis_agg 전용 (12개) | dashboard_kpis 전용 (5개) |
|---------------------------|--------------------------|
| total_visitors, unique_visitors, returning_visitors | user_id (유저별 데이터) |
| avg_visit_duration_seconds | funnel_entry, funnel_browse, funnel_fitting |
| total_transactions, total_units_sold | funnel_purchase, funnel_return |
| avg_basket_size, avg_transaction_value | consumer_sentiment_index |
| browse_to_engage_rate, engage_to_purchase_rate | |
| sales_per_visitor, temperature | |
| calculated_at, metadata, source_trace | |

### 데이터 겹침

- **JOIN 결과: 0건** (store_id + date 기준)
- `dashboard_kpis`의 store_id가 전부 NULL
- 날짜 범위도 부분적으로만 겹침 (2025-10-11 ~ 2025-12-12)

### 코드 참조

| 테이블 | EF 참조 | OS Dashboard 참조 | 역할 |
|--------|--------|-------------------|------|
| `daily_kpis_agg` | 8개 EF (R/W) | useDashboardKPI.ts (주 데이터 소스) | **L3 집계 테이블** — ETL 파이프라인 결과 |
| `dashboard_kpis` | 3개 EF (R/W) | 간접 참조 | **유저별 KPI** — 사용자 생성/집계 |

### 판단: **통합 불가 (의도적 분리)**

- `daily_kpis_agg`: ETL 파이프라인(unified-etl)이 자동 생성하는 L3 집계 데이터. 방문자 상세 (unique/returning), 구매 상세 (basket size, transaction value) 포함
- `dashboard_kpis`: 사용자별(user_id) 대시보드용 데이터. 퍼널 단계(entry→browse→fitting→purchase→return) + 소비자 심리지수 포함
- 스키마가 근본적으로 다름 (L3 자동 집계 vs 유저별 퍼널 분석)
- 데이터 겹침 0건

---

## 그룹 2: 인벤토리 관련

### 테이블 현황

| 테이블 | 행 수 | 컬럼 수 | 역할 |
|--------|-------|---------|------|
| `inventory_levels` | 25 | 10 | 현재 재고 수준 (product별 stock/optimal/minimum) |
| `inventory_movements` | 0 | 13 | 재고 이동 이력 (입출고, 반품, 조정) |
| `realtime_inventory` | 0 | 19 | POS 연동 실시간 재고 (외부 시스템) |

### 컬럼 비교

```
inventory_levels:    id, user_id, org_id, product_id, current_stock, optimal_stock,
                     minimum_stock, weekly_demand, created_at, last_updated
                     → "현재 상태" 스냅샷

inventory_movements: id, org_id, store_id, product_id, movement_type, quantity,
                     previous_stock, new_stock, reason, reference_id, moved_at,
                     created_at, metadata
                     → "이벤트 로그" (append-only)

realtime_inventory:  id, org_id, store_id, pos_integration_id, external_product_id,
                     product_name, sku, barcode, category, quantity_on_hand,
                     quantity_reserved, quantity_available, reorder_point,
                     reorder_quantity, is_low_stock, unit_cost, unit_price,
                     last_updated_at, last_sale_at, created_at
                     → "POS 외부 연동" (external ID 기반)
```

### 코드 참조

| 테이블 | EF 참조 | OS Dashboard 참조 |
|--------|--------|-------------------|
| `inventory_levels` | 4개 EF (dynamic-responder, execute-import, inventory-monitor, quick-handler) | useRealtimeInventory, useInventoryMetrics, useDataSourceMapping |
| `inventory_movements` | 0 EF | useDataControlTower, useInventoryMetrics |
| `realtime_inventory` | 0 EF (POS 외부 연동) | usePOSIntegration |

### 판단: **통합 불가 (의도적 역할 분리)**

- **State vs Event vs External** 패턴
  - `inventory_levels`: 현재 상태 (UPSERT)
  - `inventory_movements`: 이력 이벤트 (INSERT only)
  - `realtime_inventory`: 외부 POS 시스템 연동 (별도 ID 체계)
- 3개 테이블이 서로 다른 데이터 모델 (현재값 / 변경이력 / 외부연동)
- OS Dashboard에서도 서로 다른 hook에서 사용

---

## 그룹 3: 존 메트릭 관련

### 테이블 현황

| 테이블 | 행 수 | 컬럼 수 | 집계 단위 |
|--------|-------|---------|----------|
| `zone_daily_metrics` | 630 | 18 | **존(zone) × 일(day)** |
| `hourly_metrics` | 1,057 | 17 | **매장(store) × 일(day) × 시간(hour)** |

### 컬럼 비교

| 공통 컬럼 | zone_daily_metrics | hourly_metrics |
|-----------|-------------------|----------------|
| id, org_id, store_id, date | ✅ | ✅ |
| conversion_rate, peak_occupancy | ✅ | ✅ |
| calculated_at, metadata, created_at | ✅ | ✅ |

| zone_daily_metrics 전용 | hourly_metrics 전용 |
|------------------------|-------------------|
| **zone_id** (핵심 차이) | **hour** (시간 차원) |
| total_visitors, unique_visitors | visitor_count |
| entry_count, exit_count | entry_count, exit_count |
| avg_dwell_seconds, total_dwell_seconds | — |
| interaction_count, conversion_count | transaction_count |
| revenue_attributed | revenue, units_sold |
| heatmap_intensity | avg_occupancy |
| peak_hour | — |
| source_trace | — |

### 코드 참조

| 테이블 | EF 참조 | OS Dashboard 참조 |
|--------|--------|-------------------|
| `zone_daily_metrics` | 5개 EF (retail-ai-inference, generate-optimization, run-simulation, unified-etl, flowAnalyzer) | useZoneMetrics (5+ hooks), DigitalTwinStudioPage, InsightDataContext |
| `hourly_metrics` | 1개 EF (retail-ai-inference) | 제한적 (시간별 분석) |

### 판단: **통합 불가 (집계 차원 상이)**

- `zone_daily_metrics`: **공간(zone)** 차원 — 존별 방문자/체류/히트맵
- `hourly_metrics`: **시간(hour)** 차원 — 시간대별 방문/매출 패턴
- 핵심 차이: zone_id vs hour 컬럼
- EF에서 `retail-ai-inference`가 두 테이블을 **함께** 사용 (존별 일간 데이터 + 시간별 패턴 = AI 인사이트)
- 통합하면 오히려 쿼리 복잡도 증가 (zone × hour 조합 폭증)

---

## 그룹 4: 동기화 로그 관련

### 테이블 현황

| 테이블 | 행 수 | 컬럼 수 | 용도 |
|--------|-------|---------|------|
| `data_sync_logs` | 0 | 10 | 환경 데이터 동기화 로그 (holidays, POI, trends) |
| `api_sync_logs` | 0 | 26 | API 커넥터 동기화 로그 (외부 API 연결) |

### 컬럼 비교

| 공통 컬럼 | data_sync_logs | api_sync_logs |
|-----------|---------------|---------------|
| id, org_id, status, created_at | ✅ | ✅ |
| error_message | ✅ | ✅ |
| started_at, completed_at | ✅ (started_at) | ✅ |

| data_sync_logs 전용 (5개) | api_sync_logs 전용 (20개) |
|--------------------------|--------------------------|
| user_id, schedule_id | sync_endpoint_id, api_connection_id |
| records_synced | records_fetched, records_created, records_updated, records_failed |
| metadata | duration_ms, error_details, error_type |
| | request_url, request_headers |
| | response_status, response_headers, response_size_bytes |
| | sync_type, raw_import_id, etl_run_id |
| | fetch_completed_at, processing_completed_at |

### 코드 참조

| 테이블 | EF 참조 | OS Dashboard 참조 |
|--------|--------|-------------------|
| `data_sync_logs` | 4개 EF — WRITE (sync-api-data, sync-holidays, sync-poi-context, sync-trend-signals) | 없음 |
| `api_sync_logs` | 1개 EF — WRITE (api-connector) | useApiConnector (READ) |

### 판단: **통합 보류 (현재 불필요, 향후 재검토)**

- 두 테이블 모두 **0행** — 아직 프로덕션 데이터 없음
- 스키마 크기 차이가 큼 (10 vs 26 컬럼) — `api_sync_logs`가 훨씬 상세
- 다른 EF 그룹이 사용 (환경 동기화 EF vs API 커넥터 EF)
- 통합 시 `data_sync_logs`의 단순 구조에 불필요한 NULL 컬럼 다수 추가
- **권장**: 데이터 축적 후 사용 패턴 기반으로 재검토

---

## 그룹 5: 온톨로지 관련

### 테이블 현황

| 테이블 | 행 수 | 컬럼 수 | 역할 |
|--------|-------|---------|------|
| `ontology_entity_types` | 219 | 17 | 엔티티 타입 정의 (Store, Product, Zone 등) |
| `ontology_relation_types` | 126 | 12 | 관계 타입 정의 (HAS_ZONE, SOLD_AT 등) |
| `ontology_entity_mappings` | 0 | 11 | 데이터소스 → 엔티티 매핑 규칙 |
| `ontology_relation_mappings` | 0 | 8 | 데이터소스 → 관계 매핑 규칙 |
| `ontology_mapping_cache` | 0 | 12 | 매핑 캐시 (성능 최적화) |
| `ontology_schema_versions` | 6 | 7 | 스키마 버전 이력 |

### 구조 분석

```
                  ontology_schema_versions (버전 관리)
                          │
          ┌───────────────┴───────────────┐
  ontology_entity_types          ontology_relation_types
  (엔티티 타입 정의)              (관계 타입 정의)
          │                               │
          │                               │
  ontology_entity_mappings       ontology_relation_mappings
  (데이터→엔티티 매핑)           (데이터→관계 매핑)
          │                               │
          └───────────────┬───────────────┘
                          │
                  ontology_mapping_cache
                  (매핑 캐시)
```

### 코드 참조

| 테이블 | EF 참조 | OS Dashboard 참조 |
|--------|--------|-------------------|
| `ontology_entity_types` | **8개 EF** (aggregate-*, analyze-3d-model, auto-map-etl, import-with-ontology, run-simulation, smart-ontology-mapping, unified-etl) | useOntologySchema, EntityTypeManager, SchemaValidator |
| `ontology_relation_types` | **6개 EF** (auto-map-etl, graph-query, import-with-ontology, run-simulation, unified-ai, unified-etl) | useOntologySchema, RelationTypeManager |
| `ontology_entity_mappings` | 1개 EF (datasource-mapper) | 없음 |
| `ontology_relation_mappings` | 1개 EF (datasource-mapper) | 없음 |
| `ontology_mapping_cache` | 1개 EF (integrated-data-pipeline) | 없음 |
| `ontology_schema_versions` | 0 EF | SchemaVersionManager, MasterSchemaSync |

### 판단: **통합 불가 (정규화된 스키마 시스템)**

- 6개 테이블이 **정규화된 관계형 구조** (타입 정의 → 매핑 규칙 → 캐시 → 버전)
- `entity_types`와 `relation_types`는 NeuralTwin 온톨로지 시스템의 핵심 (8+6 EF 참조)
- 매핑/캐시 테이블은 별도 역할 (데이터 import 파이프라인)
- 통합하면 정규화 깨짐 → 데이터 무결성 저하

---

## 최종 결론

### 통합 대상: 없음

5개 그룹 모두 분석 결과, **의도적 역할 분리가 확인**되었습니다.

| 그룹 | 분리 패턴 | 통합 불가 사유 |
|------|----------|--------------|
| KPI | L3 자동 집계 vs 유저별 퍼널 | 스키마 근본 상이, 데이터 겹침 0 |
| Inventory | State vs Event vs External | 3가지 데이터 모델 (현재값/이력/POS) |
| Zone Metrics | 공간 차원 vs 시간 차원 | zone_id vs hour 축, 통합 시 쿼리 복잡도 증가 |
| Sync Logs | 환경 동기화 vs API 커넥터 | 스키마 크기 2.6배 차이, 다른 EF 그룹 |
| Ontology | 정규화된 6테이블 구조 | 타입→매핑→캐시→버전 계층 구조 |

### 권장 사항

1. **그룹 4 (Sync Logs)**: 두 테이블 모두 0행. 데이터 축적 후 사용 패턴 확인하여 Sprint C에서 재검토
2. **archived 테이블 (kpis, kpi_snapshots, inventory, inventory_history, zone_metrics, zone_performance, sync_logs, ontology_schemas, ontology_relation_inference_queue)**: Step 6-A에서 이미 아카이브 완료 — 정리 효과 달성

---

> 작성일: 2026-02-26
> 분석 도구: Supabase MCP (execute_sql) + 코드 정적 분석
> 결론: 5개 그룹 모두 통합 불필요 — 의도적 역할 분리 확인
