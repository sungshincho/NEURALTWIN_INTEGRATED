# Phase 5 Sprint C — 보안/성능 강화 실행 계획서

> 작성일: 2026-02-26
> 전제: Sprint A (전수 조사) + Sprint B (정리) 완료
> 실행 도구: Supabase MCP (execute_sql)
> 원칙: **RLS 1개씩 적용 → 확인 → 다음. CONCURRENTLY 필수. PK/UNIQUE 삭제 금지.**

---

## 현재 상태 (Sprint B 완료 후)

```
public 테이블: 105 | _archive: 48 | RPC: 211 | EF: 45
RLS 미적용: 2개 (chat_context_memory, retail_knowledge_chunks)
RLS 활성 + 정책 0개: 4개 (ai_batch_test_results, v_org_id, vmd_rule_applications, vmd_rulesets)
RLS 항상-TRUE 정책: 17건 (13개 테이블)
FK 인덱스 누락 (1K+ 행): 13개 컬럼
헬퍼 함수: get_user_org_id(uuid) ✅ 존재
```

---

## Step 9: RLS 정책 적용 확대

### 9-A: RLS 미적용 테이블 활성화 (P0 — 2개)

#### chat_context_memory (107행, user_id 있음)

```sql
-- 1. RLS 활성화
ALTER TABLE chat_context_memory ENABLE ROW LEVEL SECURITY;

-- 2. 정책 추가 (패턴 B: 사용자 본인 데이터)
CREATE POLICY "own_data_select" ON chat_context_memory
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_data_insert" ON chat_context_memory
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_data_update" ON chat_context_memory
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "own_data_delete" ON chat_context_memory
  FOR DELETE USING (user_id = auth.uid());

-- 3. service_role은 자동 우회 (EF에서 service_role 사용 시 영향 없음)
```

#### retail_knowledge_chunks (141행, user_id/org_id 없음 — 공유 데이터)

```sql
-- 1. RLS 활성화
ALTER TABLE retail_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 2. 정책 추가 (공유 데이터 — 인증된 사용자 읽기 전용)
CREATE POLICY "authenticated_read" ON retail_knowledge_chunks
  FOR SELECT TO authenticated USING (true);

-- 3. 쓰기는 service_role만 (EF에서 임베딩 생성)
-- INSERT/UPDATE/DELETE 정책 없음 → service_role만 쓰기 가능
```

### 9-B: RLS 활성 + 정책 0개 테이블 (4개)

| 테이블 | 행 수 | 권장 정책 |
|--------|-------|----------|
| `ai_batch_test_results` | 17 | org_id 기반 격리 |
| `v_org_id` | 1 | 헬퍼 뷰 — service_role 전용 유지 |
| `vmd_rule_applications` | 0 | org_id 기반 격리 (향후 사용 시) |
| `vmd_rulesets` | 10 | org_id 기반 격리 |

```sql
-- ai_batch_test_results (패턴 A: org 격리)
CREATE POLICY "org_isolation" ON ai_batch_test_results
  FOR ALL USING (org_id = get_user_org_id(auth.uid()));

-- vmd_rulesets (패턴 A: org 격리)
CREATE POLICY "org_isolation" ON vmd_rulesets
  FOR ALL USING (org_id = get_user_org_id(auth.uid()));

-- vmd_rule_applications: store_id 기반
CREATE POLICY "org_isolation" ON vmd_rule_applications
  FOR ALL USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.org_id = get_user_org_id(auth.uid()))
  );

-- v_org_id: 헬퍼 뷰 — 현재 상태 유지 (service_role만 접근)
```

### 9-C: 항상-TRUE 정책 수정 (17건 → 적절한 조건으로)

| 테이블 | 정책명 | cmd | 현재 | 수정 방향 |
|--------|-------|-----|------|----------|
| `contact_submissions` | Anyone can submit contact form | INSERT | WITH CHECK (true) | ✅ 유지 (공개 폼) |
| `data_source_sync_logs` | Authenticated users can manage | ALL | USING (true) | org_id 격리 |
| `data_source_tables` | Authenticated users can manage | ALL | USING (true) | org_id 격리 |
| `feedback_reason_codes` | select_all | SELECT | USING (true) | ✅ 유지 (시스템 코드) |
| `learning_adjustments` | all_policy | ALL | USING (true) | org_id 격리 |
| `ontology_entity_mappings` | manage entity mappings | ALL | USING (true) | org_id 또는 user_id 격리 |
| `ontology_relation_mappings` | manage relation mappings | ALL | USING (true) | org_id 또는 user_id 격리 |
| `ontology_relation_types` | Users can view | SELECT | USING (true) | ✅ 유지 (공유 스키마) |
| `optimization_feedback` | insert_all / select_all | INSERT/SELECT | (true) | org_id 격리 |
| `organization_members` | Authenticated users can view | SELECT | USING (true) | org_id 격리 |
| `prediction_records` | all_policy | ALL | USING (true) | org_id 격리 |
| `retail_concepts` | manage / view concepts | ALL/SELECT | (true) | ✅ 유지 (공유 개념) |
| `store_personas` | select_all | SELECT | USING (true) | store → org 격리 |
| `stored_model_parameters` | all_policy | ALL | USING (true) | org_id 격리 |
| `user_activity_logs` | System can insert | INSERT | WITH CHECK (true) | ✅ 유지 (시스템 로그) |

**유지 대상 (의도적 public)**: contact_submissions, feedback_reason_codes, ontology_relation_types, retail_concepts, user_activity_logs INSERT = 5건
**수정 대상**: 12건 → org_id/store_id 기반 격리

### 실행 순서

```
9-A-1: chat_context_memory RLS 활성화 + user_id 정책
9-A-2: retail_knowledge_chunks RLS 활성화 + SELECT 정책
9-B:   정책 0개 테이블 3개에 정책 추가 (v_org_id 제외)
9-C:   항상-TRUE 정책 12건 수정 (5건 의도적 유지)
```

---

## Step 10: 인덱스 최적화

### 10-A: Critical FK 인덱스 추가 (행 1,000+)

```sql
-- Critical (37K+ rows)
CREATE INDEX CONCURRENTLY idx_zone_events_customer_id ON zone_events(customer_id);
CREATE INDEX CONCURRENTLY idx_zone_events_org_id ON zone_events(org_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_zone_id ON funnel_events(zone_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_customer_id ON funnel_events(customer_id);
CREATE INDEX CONCURRENTLY idx_funnel_events_org_id ON funnel_events(org_id);

-- High (8K-25K rows)
CREATE INDEX CONCURRENTLY idx_visit_zone_events_org_id ON visit_zone_events(org_id);
CREATE INDEX CONCURRENTLY idx_line_items_org_id ON line_items(org_id);
CREATE INDEX CONCURRENTLY idx_line_items_purchase_id ON line_items(purchase_id);
CREATE INDEX CONCURRENTLY idx_transactions_org_id ON transactions(org_id);
CREATE INDEX CONCURRENTLY idx_transactions_visit_id ON transactions(visit_id);
CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY idx_customers_store_id ON customers(store_id);

-- Medium (1K-2.5K rows)
CREATE INDEX CONCURRENTLY idx_product_performance_agg_org_id ON product_performance_agg(org_id);
CREATE INDEX CONCURRENTLY idx_hourly_metrics_org_id ON hourly_metrics(org_id);
```

### 10-B: 미사용 인덱스 정리 (상위 대형)

```sql
-- PK/UNIQUE 제외, idx_scan = 0, 크기순 상위
DROP INDEX CONCURRENTLY IF EXISTS idx_graph_entities_properties;      -- 13.0 MB
DROP INDEX CONCURRENTLY IF EXISTS idx_graph_entities_label_search;    -- 4.4 MB
DROP INDEX CONCURRENTLY IF EXISTS idx_graph_relations_properties;     -- 2.3 MB
DROP INDEX CONCURRENTLY IF EXISTS idx_store_visits_zones;             -- 1.3 MB
DROP INDEX CONCURRENTLY IF EXISTS idx_user_activity_logs_org_created; -- 606 KB
DROP INDEX CONCURRENTLY IF EXISTS idx_ontology_entity_types_properties; -- 205 KB
DROP INDEX CONCURRENTLY IF EXISTS idx_msg_channel_data;               -- 139 KB
-- 유지: idx_knowledge_trgm_content, idx_knowledge_embedding, idx_knowledge_trgm_title (검색용)
```

### 10-C: 중복 인덱스 정리

Supabase Performance Advisors 감지 10건 → 확인 후 DROP

---

## Step 11: 쿼리 성능 튜닝

### 11-A: 느린 쿼리 분석

```sql
SELECT query, calls, total_exec_time, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 11-B: RPC 함수 실행 계획 검토
- ACTIVE 판정 RPC 중 느린 함수 식별
- EXPLAIN ANALYZE로 실행 계획 확인
- Sequential Scan → Index Scan 전환

### 11-C: 산출물
- QUERY_OPTIMIZATION_REPORT.md

---

## Sprint C 완료 기준

```
✅ RLS 정책: 우선순위 1 테이블 전체 적용
✅ RLS 정책: 우선순위 2 테이블 최소 50% 적용
✅ 항상-TRUE 정책 수정 대상 12건 중 최소 8건 수정 (12/12 완료)
✅ 누락 FK 인덱스 추가 완료 (14개)
✅ 미사용 인덱스 상위 7개 DROP 완료
✅ 중복 인덱스 정리 완료 (10개)
✅ Supabase Advisors 보안 ERROR 0건
✅ RLS_MIGRATION_LOG.md 생성
✅ INDEX_OPTIMIZATION_LOG.md 생성
✅ QUERY_OPTIMIZATION_REPORT.md 생성
```

---

## 위험 관리

| 상황 | 즉시 복원 |
|------|----------|
| RLS로 서비스 장애 | `ALTER TABLE {name} DISABLE ROW LEVEL SECURITY;` |
| 인덱스 삭제 후 성능 저하 | `CREATE INDEX CONCURRENTLY` 재생성 |
| 잘못된 정책으로 데이터 접근 차단 | `DROP POLICY "{name}" ON {table};` |

```
❌ RLS 활성화 후 확인 없이 다음 테이블 진행
❌ CONCURRENTLY 없이 대형 테이블 인덱스 생성
❌ PK/UNIQUE 인덱스 삭제
❌ 한 번에 5개 이상 정책 동시 변경
```

---

> 작성일: 2026-02-26 | 최종 업데이트: 2026-02-26
> 상태: **Sprint C 완료** — Step 9, 10, 11 전체 실행 완료
