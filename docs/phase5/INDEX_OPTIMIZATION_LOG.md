# Phase 5 Sprint C — Step 10 Index Optimization Log

> 실행일: 2026-02-26
> 실행 도구: Supabase MCP (execute_sql, get_advisors)
> 프로젝트: bdrvowacecxnraaivlhr

---

## 실행 요약

```
Step 10 — 인덱스 최적화
═══════════════════════════════════════════════════════════
                        Created    Dropped    Net
─────────────────────────────────────────────────────────
  10-A: FK 인덱스 추가      14         —        +14
  10-B: 미사용 인덱스 삭제    —         7        -7  (~22 MB 절약)
  10-C: 중복 인덱스 삭제      —        10        -10 (~160 KB 절약)
─────────────────────────────────────────────────────────
  합계                      14        17        -3
═══════════════════════════════════════════════════════════
```

---

## 10-A: FK 인덱스 추가 (14개) ✅

모든 인덱스 `CREATE INDEX CONCURRENTLY` 사용 (테이블 락 방지)

### 배치 1: Critical (37K+ rows)

| # | 인덱스 | 테이블 | 컬럼 | 크기 |
|---|--------|--------|------|------|
| 1 | `idx_zone_events_customer_id` | zone_events (37K) | customer_id | 280 kB |
| 2 | `idx_zone_events_org_id` | zone_events (37K) | org_id | 272 kB |
| 3 | `idx_funnel_events_zone_id` | funnel_events (26K) | zone_id | 200 kB |
| 4 | `idx_funnel_events_customer_id` | funnel_events (26K) | customer_id | 208 kB |
| 5 | `idx_funnel_events_org_id` | funnel_events (26K) | org_id | 200 kB |

### 배치 2: High (8K-25K rows)

| # | 인덱스 | 테이블 | 컬럼 | 크기 |
|---|--------|--------|------|------|
| 6 | `idx_visit_zone_events_org_id` | visit_zone_events (24K) | org_id | 184 kB |
| 7 | `idx_line_items_org_id` | line_items (8K) | org_id | 72 kB |
| 8 | `idx_line_items_purchase_id` | line_items (8K) | purchase_id | 72 kB |
| 9 | `idx_transactions_org_id` | transactions (4K) | org_id | 48 kB |
| 10 | `idx_transactions_visit_id` | transactions (4K) | visit_id | 48 kB |
| 11 | `idx_transactions_user_id` | transactions (4K) | user_id | 48 kB |
| 12 | `idx_customers_store_id` | customers (2.5K) | store_id | 40 kB |

### 배치 3: Medium (1K-2.5K rows)

| # | 인덱스 | 테이블 | 컬럼 | 크기 |
|---|--------|--------|------|------|
| 13 | `idx_product_performance_agg_org_id` | product_performance_agg (2K) | org_id | 32 kB |
| 14 | `idx_hourly_metrics_org_id` | hourly_metrics (1K) | org_id | 16 kB |

**총 추가 인덱스 크기**: ~1.72 MB

---

## 10-B: 미사용 인덱스 삭제 (7개) ✅

선정 기준: idx_scan = 0, PK/UNIQUE 아님, 크기순

| # | 인덱스 | 테이블 | 크기 | idx_scan | 근거 |
|---|--------|--------|------|----------|------|
| 1 | `idx_graph_entities_properties` | graph_entities | 13 MB | 0 | GIN(jsonb) — 사용되지 않는 properties 검색 |
| 2 | `idx_graph_entities_label_search` | graph_entities | 4.5 MB | 0 | trgm — 사용되지 않는 라벨 검색 |
| 3 | `idx_graph_relations_properties` | graph_relations | 2.3 MB | 0 | GIN(jsonb) — 사용되지 않는 properties 검색 |
| 4 | `idx_store_visits_zones` | store_visits | 1.3 MB | 0 | GIN(array) — 사용되지 않는 zones 검색 |
| 5 | `idx_user_activity_logs_org_created` | user_activity_logs | 592 kB | 0 | composite — user_created 인덱스가 대체 |
| 6 | `idx_ontology_entity_types_properties` | ontology_entity_types | 200 kB | 0 | GIN(jsonb) — 사용되지 않는 properties 검색 |
| 7 | `idx_msg_channel_data` | chat_messages | 136 kB | 0 | composite — channel/data 검색 미사용 |

**총 절약**: ~22 MB

### 보존된 인덱스 (삭제하지 않음)
- `idx_knowledge_trgm_content` — 검색용 trigram (active)
- `idx_knowledge_embedding` — 벡터 검색용 (active)
- `idx_knowledge_trgm_title` — 검색용 trigram (active)

---

## 10-C: 중복 인덱스 삭제 (10개) ✅

선정 기준: 선행 컬럼이 동일한 커버링 인덱스 존재, idx_scan 낮음

| # | 삭제 인덱스 | 커버링 인덱스 | idx_scan | 크기 |
|---|-----------|-------------|----------|------|
| 1 | `idx_stores_org_id` (org_id) | `stores_org_id_store_code_key` (org_id, store_code) | 0 | 16 kB |
| 2 | `idx_zones_dim_store` (store_id) | `zones_dim_store_code_uk` (store_id, zone_code) | 0 | 16 kB |
| 3 | `idx_product_associations_store` (store_id) | `idx_product_associations_store_antecedent` (store_id, antecedent_product_id) | 0 | 16 kB |
| 4 | `idx_raw_imports_status` (status) | `idx_raw_imports_status_created` (status, created_at) | 0 | 16 kB |
| 5 | `idx_recommendation_applications_org` (org_id) | `idx_rec_applications_org_date` (org_id, baseline_date) | 0 | 16 kB |
| 6 | `idx_ai_response_logs_store_id` (store_id) | `idx_ai_response_logs_store_function_created` (store_id, function_name, created_at) | 0 | 16 kB |
| 7 | `idx_ai_response_logs_function_name` (function_name) | `idx_ai_response_logs_function_parse` (function_name, parse_success) | 3 | 16 kB |
| 8 | `idx_ai_inference_results_store` (store_id) | `idx_ai_inference_results_store_type` (store_id, inference_type) | 0 | 16 kB |
| 9 | `idx_realtime_inventory_low_stock` (store_id) | `realtime_inventory_store_id_external_product_id_key` (store_id, external_product_id) | 0 | 8 kB |
| 10 | `idx_invitations_email` (email) | `invitations_email_org_unique` (email, org_id, status) | 1 | 16 kB |

**총 절약**: ~160 kB

### 보존된 중복 후보 (높은 사용량)
- `idx_transactions_store` (7,109 scans) — 빈번한 store_id 단독 조회에 효율적
- `idx_graph_relations_source_entity` (24,551 scans) — 빈번한 source_entity_id 조회
- `idx_graph_relations_target_entity` (7,123 scans) — 빈번한 target_entity_id 조회
- `idx_user_activity_logs_user_id` (325 scans) — user_id 단독 조회 활발
- `idx_hourly_metrics_store_date` (316 scans) — store+date 조회 활발

---

## 복원 가이드

```sql
-- 미사용 인덱스 복원 (필요시)
CREATE INDEX CONCURRENTLY idx_graph_entities_properties ON graph_entities USING gin(properties);
CREATE INDEX CONCURRENTLY idx_graph_entities_label_search ON graph_entities USING gin(label gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_graph_relations_properties ON graph_relations USING gin(properties);
CREATE INDEX CONCURRENTLY idx_store_visits_zones ON store_visits USING gin(visited_zones);
CREATE INDEX CONCURRENTLY idx_user_activity_logs_org_created ON user_activity_logs(org_id, created_at);
CREATE INDEX CONCURRENTLY idx_ontology_entity_types_properties ON ontology_entity_types USING gin(properties);
CREATE INDEX CONCURRENTLY idx_msg_channel_data ON chat_messages(channel, metadata);

-- 중복 인덱스 복원 (필요시)
CREATE INDEX CONCURRENTLY idx_stores_org_id ON stores(org_id);
CREATE INDEX CONCURRENTLY idx_zones_dim_store ON zones_dim(store_id);
-- ... (단일 컬럼 인덱스이므로 간단히 재생성 가능)
```

---

> 실행일: 2026-02-26
> 상태: **Step 10 완료** — FK 인덱스 14개 추가, 미사용 7개 + 중복 10개 삭제
> 다음: Step 11 쿼리 성능 튜닝
