# RLS 정책 & 인덱스 현황 감사 보고서

> 조회 시각: 2026-02-26 05:45 UTC
> 프로젝트: bdrvowacecxnraaivlhr
> 총 테이블 수: 152개 (public 스키마)

---

## 1. RLS 미적용 테이블 (rls_enabled = false)

| 테이블명 | 행 수 | 위험도 | 설명 |
|---------|-------|--------|------|
| `chat_context_memory` | 107 | **ERROR** | 채팅 컨텍스트 메모리 — 사용자 데이터 노출 위험 |
| `retail_knowledge_chunks` | 141 | **ERROR** | 리테일 지식 청크 (임베딩 포함) — 공유 데이터이므로 의도적 가능 |

## 2. RLS 활성화 + 정책 0개 (접근 차단 상태)

> RLS가 켜져 있지만 정책이 없어 **모든 anon/authenticated 접근이 차단**됩니다.
> service_role만 접근 가능합니다.

| 테이블명 | 행 수 | 위험도 | 권장 조치 |
|---------|-------|--------|----------|
| `ai_batch_test_results` | 17 | Medium | org_id 기반 정책 추가 필요 |
| `furniture_facings` | 5 | Medium | store_id 기반 정책 추가 필요 |
| `furniture_height_zones` | 5 | Medium | store_id 기반 정책 추가 필요 |
| `v_org_id` | 1 | Low | 헬퍼 뷰 — 현재 상태 유지 가능 |
| `vmd_rule_applications` | 0 | Low | store_id 기반 정책 추가 필요 |
| `vmd_rulesets` | 10 | Medium | org_id 기반 정책 추가 필요 |
| `vmd_zone_types` | 8 | Low | 시스템 설정 — SELECT 공개 정책 검토 |

## 3. Supabase Security Advisors 요약

| 이슈 유형 | 심각도 | 건수 | 설명 |
|----------|--------|------|------|
| `rls_disabled_in_public` | **ERROR** | 2 | RLS 비활성화 테이블 |
| `sensitive_columns_exposed` | **ERROR** | 1 | 민감한 컬럼이 노출됨 |
| `function_search_path_mutable` | WARN | 77 | 함수의 search_path가 변경 가능 |
| `rls_policy_always_true` | WARN | 12 | 항상 true를 반환하는 RLS 정책 |
| `extension_in_public` | WARN | 2 | public 스키마에 설치된 확장 |
| `rls_enabled_no_policy` | INFO | 7 | RLS 활성화, 정책 없음 |

### RLS 항상-TRUE 정책 (보안 허점)

12개 정책이 `USING (true)` 또는 `WITH CHECK (true)`로 설정되어 RLS가 실질적으로 무효화됩니다.

## 4. Supabase Performance Advisors 요약

| 이슈 유형 | 심각도 | 건수 | 설명 |
|----------|--------|------|------|
| `multiple_permissive_policies` | WARN | 1,020 | 다중 permissive 정책 (OR 결합 → 느린 쿼리) |
| `auth_rls_initplan` | WARN | 393 | RLS에서 current_setting 반복 평가 |
| `unused_index` | INFO | 147 | 미사용 인덱스 |
| `unindexed_foreign_keys` | INFO | 125 | 인덱스 없는 FK |
| `duplicate_index` | WARN | 10 | 중복 인덱스 |
| `no_primary_key` | INFO | 1 | PK 없는 테이블 |

---

## 5. 인덱스 누락 — FK 컬럼 (고영향)

> 행 수 1,000 이상인 테이블의 인덱스 없는 FK 컬럼. JOIN/WHERE 성능에 직접 영향.

| 테이블명 | 행 수 | FK 컬럼 | 참조 테이블 | 우선순위 |
|---------|-------|---------|-----------|---------|
| `zone_events` | 37,109 | `customer_id` | customers | **Critical** |
| `zone_events` | 37,109 | `org_id` | organizations | **Critical** |
| `funnel_events` | 26,588 | `zone_id` | zones_dim | **Critical** |
| `funnel_events` | 26,588 | `customer_id` | customers | **Critical** |
| `funnel_events` | 26,588 | `org_id` | organizations | **Critical** |
| `visit_zone_events` | 24,626 | `org_id` | organizations | **High** |
| `line_items` | 8,194 | `org_id` | organizations | **High** |
| `line_items` | 8,194 | `purchase_id` | purchases | **High** |
| `transactions` | 4,109 | `org_id` | organizations | **High** |
| `transactions` | 4,109 | `visit_id` | visits | **High** |
| `customers` | 2,500 | `store_id` | stores | **High** |
| `zone_transitions` | 1,705 | — | (인덱스 있음) | OK |
| `hourly_metrics` | 1,057 | `org_id` | organizations | Medium |

### 인덱스 누락 — FK 컬럼 (저영향, 행 <1,000)

| 테이블명 | 행 수 | FK 컬럼 (인덱스 없음) |
|---------|-------|--------------------|
| `chat_conversations` | 474 | `store_id` |
| `customer_segments_agg` | 360 | `org_id` |
| `learning_sessions` | 289 | `store_id` |
| `product_performance_agg` | — | `org_id` |
| `daily_kpis_agg` | 90 | `org_id` |
| `daily_sales` | 90 | `org_id` |
| `furniture` | 68 | `org_id` |
| `product_associations` | 20 | `org_id` |
| `inventory_levels` | 25 | `product_id`, `org_id` |
| `upload_sessions` | 5 | `store_id` |
| `purchases` | 0 | `customer_id`, `visit_id`, `store_id`, `product_id` |
| `visits` | 0 | `store_id`, `customer_id` |
| `wifi_tracking` | 0 | `store_id`, `org_id`, `zone_id` |
| `zones_dim` | 7 | `parent_zone_id`, `org_id` |

---

## 6. 미사용 인덱스 (idx_scan = 0)

> PK 인덱스 제외, 한 번도 스캔되지 않은 인덱스. 총 **147개**, 총 크기 약 **23.5 MB**.

### 상위 10개 (크기순)

| 인덱스명 | 테이블 | 크기 | 권장 |
|---------|-------|------|------|
| `idx_graph_entities_properties` | graph_entities | 13.0 MB | DROP 검토 (GIN 인덱스) |
| `idx_graph_entities_label_search` | graph_entities | 4.4 MB | DROP 검토 |
| `idx_graph_relations_properties` | graph_relations | 2.3 MB | DROP 검토 (GIN 인덱스) |
| `idx_store_visits_zones` | store_visits | 1.3 MB | DROP 검토 |
| `idx_knowledge_trgm_content` | retail_knowledge_chunks | 1.2 MB | 유지 (검색용, 미래 사용) |
| `idx_knowledge_embedding` | retail_knowledge_chunks | 754 KB | 유지 (벡터 검색용) |
| `idx_user_activity_logs_org_created` | user_activity_logs | 606 KB | DROP 검토 |
| `idx_ontology_entity_types_properties` | ontology_entity_types | 205 KB | DROP 검토 |
| `idx_msg_channel_data` | chat_messages | 139 KB | DROP 검토 |
| `idx_knowledge_trgm_title` | retail_knowledge_chunks | 123 KB | 유지 (검색용) |

### 중복 인덱스 (Advisors 감지: 10건)

성능 Advisors가 10개의 중복 인덱스를 감지했습니다. 동일 컬럼에 대한 중복 인덱스를 제거하면 쓰기 성능이 개선됩니다.

---

## 7. RLS 정책 분포

### 정책 수별 테이블 분포

| 정책 수 | 테이블 수 | 예시 |
|--------|---------|------|
| 0 (없음) | 9 | chat_context_memory, retail_knowledge_chunks + 7개 |
| 1 | 57 | zone_events, funnel_events, transactions ... |
| 2 | 14 | profiles, chat_messages, furniture_slots ... |
| 3 | 18 | store_visits, zone_performance, ai_response_logs ... |
| 4 | 13 | applied_strategies, invitations, layout_optimization ... |
| 5+ | 41 | organizations(13), upload_sessions(9), weather_data(8) ... |

### `ALL` 커맨드 정책 사용 현황

57개 테이블이 `cmd = 'ALL'` 정책을 사용합니다. 이는 SELECT/INSERT/UPDATE/DELETE 모두에 적용되어 세밀한 권한 제어가 어렵습니다.

---

## 8. 분석 요약 및 권장 조치

### 보안 이슈 (즉시 조치)

| # | 이슈 | 심각도 | 조치 |
|---|------|--------|------|
| 1 | `chat_context_memory` RLS 미적용 | **Critical** | RLS 활성화 + user_id 기반 정책 추가 |
| 2 | `retail_knowledge_chunks` RLS 미적용 | **High** | 의도적 공개라면 SELECT ONLY 정책 추가, 아니면 RLS 활성화 |
| 3 | 민감한 컬럼 노출 1건 | **High** | Advisors 상세 확인 후 컬럼 접근 제한 |
| 4 | RLS 항상-TRUE 정책 12건 | **Medium** | org_id/user_id 기반 조건으로 교체 |
| 5 | 정책 없는 RLS 테이블 7개 | **Medium** | 적절한 정책 추가 (현재 service_role만 접근 가능) |
| 6 | search_path 변경 가능 함수 77개 | **Medium** | `SET search_path = ''` 추가 |

### 성능 이슈 (단계적 조치)

| # | 이슈 | 영향도 | 조치 |
|---|------|--------|------|
| 1 | FK 인덱스 누락 (Critical 5건) | **High** | zone_events, funnel_events의 customer_id, org_id, zone_id 인덱스 생성 |
| 2 | auth_rls_initplan 393건 | **High** | RLS 정책에서 `current_setting()` 호출을 `auth.uid()` 직접 사용으로 변환 |
| 3 | 미사용 인덱스 147개 (23.5 MB) | **Medium** | 상위 10개 대형 인덱스부터 단계적 DROP |
| 4 | 다중 permissive 정책 1,020건 | **Medium** | 정책 통합 — 테이블당 cmd별 1개 정책으로 |
| 5 | 중복 인덱스 10개 | **Low** | 중복 제거 |

### 즉시 실행 가능한 마이그레이션 SQL

```sql
-- 1. Critical FK 인덱스 생성
CREATE INDEX CONCURRENTLY idx_zone_events_customer_id ON zone_events(customer_id);
CREATE INDEX CONCURRENTLY idx_zone_events_org_id ON zone_events(org_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_zone_id ON funnel_events(zone_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_customer_id ON funnel_events(customer_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_org_id ON funnel_events(org_id);
CREATE INDEX CONCURRENTLY idx_visit_zone_events_org_id ON visit_zone_events(org_id);
CREATE INDEX CONCURRENTLY idx_line_items_org_id ON line_items(org_id);
CREATE INDEX CONCURRENTLY idx_line_items_purchase_id ON line_items(purchase_id);
CREATE INDEX CONCURRENTLY idx_transactions_org_id ON transactions(org_id);
CREATE INDEX CONCURRENTLY idx_transactions_visit_id ON transactions(visit_id);
CREATE INDEX CONCURRENTLY idx_customers_store_id ON customers(store_id);

-- 2. RLS 활성화 (chat_context_memory)
ALTER TABLE chat_context_memory ENABLE ROW LEVEL SECURITY;
-- 정책은 비즈니스 로직에 맞게 추가 필요
```
