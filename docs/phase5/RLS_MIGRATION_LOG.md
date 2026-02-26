# Phase 5 Sprint C — Step 9 RLS Migration Log

> 실행일: 2026-02-26
> 실행 도구: Supabase MCP (execute_sql, get_advisors)
> 프로젝트: bdrvowacecxnraaivlhr

---

## 실행 요약

```
Step 9 — RLS 정책 적용 확대
═══════════════════════════════════════════════════════════
                        Before     After      Change
─────────────────────────────────────────────────────────
  RLS 미적용 테이블        2          0        -2 (활성화)
  정책 0개 테이블          4          1        -3 (v_org_id 의도적 유지)
  항상-TRUE 정책          17          9        -8 → 적절한 조건 적용
  Security ERROR          2          0        -2 (rls_disabled 해소)
═══════════════════════════════════════════════════════════
```

---

## 9-A: RLS 미적용 테이블 활성화 (2개 → 0개)

### 9-A-1: chat_context_memory ✅

**사전 확인**: retail-chatbot EF → `createSupabaseAdmin()` (service_role) 사용 확인 → RLS 영향 없음

```sql
ALTER TABLE chat_context_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data_select" ON chat_context_memory
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_data_insert" ON chat_context_memory
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_data_update" ON chat_context_memory
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "own_data_delete" ON chat_context_memory
  FOR DELETE USING (user_id = auth.uid());
```

- 패턴: B (사용자 본인 데이터)
- 행 수: 107
- service_role 우회: 자동 (EF에서 service_role 사용)

### 9-A-2: retail_knowledge_chunks ✅

**사전 확인**: retail-chatbot + knowledge-admin EF → 모두 `createSupabaseAdmin()` (service_role) 사용 확인

```sql
ALTER TABLE retail_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON retail_knowledge_chunks
  FOR SELECT TO authenticated USING (true);
```

- 패턴: 공유 데이터 (인증된 사용자 읽기 전용)
- 행 수: 141
- 쓰기: service_role만 가능 (INSERT/UPDATE/DELETE 정책 없음)

---

## 9-B: 정책 0개 테이블 (4개 → 1개)

### ai_batch_test_results ✅

```sql
CREATE POLICY "authenticated_select" ON ai_batch_test_results
  FOR SELECT TO authenticated USING (true);
```

- 행 수: 17
- 근거: org_id 컬럼 있으나 테스트 결과 데이터 → 인증된 사용자 읽기 허용

### vmd_rulesets ✅

```sql
CREATE POLICY "authenticated_select" ON vmd_rulesets
  FOR SELECT TO authenticated USING (true);
```

- 행 수: 10
- 근거: 공유 규칙셋 데이터 → 인증된 사용자 읽기 허용

### vmd_rule_applications ✅

```sql
CREATE POLICY "org_isolation" ON vmd_rule_applications
  FOR ALL USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.org_id = get_user_org_id(auth.uid()))
  );
```

- 행 수: 0 (향후 사용 시 org 격리 적용)
- 패턴: C (store_id → stores.org_id 조인)

### v_org_id — 의도적 유지 ⏭️

- 행 수: 1
- 근거: 헬퍼 뷰, service_role 전용. 정책 없음 = anon 접근 차단

---

## 9-C: 항상-TRUE 정책 수정 (12건 수정 + 5건 의도적 유지)

### 수정 완료 (12건)

| # | 테이블 | 기존 정책 | 수정 내용 | 격리 방식 |
|---|--------|----------|----------|----------|
| 1 | `organization_members` | Authenticated users can view (SELECT true) | org_id = get_user_org_id(auth.uid()) | org_id 직접 |
| 2 | `learning_adjustments` | all_policy (ALL true) | org_id = get_user_org_id(auth.uid()) | org_id 직접 |
| 3 | `optimization_feedback` | insert_all (INSERT true) | store_id → stores.org_id 격리 | store → org |
| 4 | `optimization_feedback` | select_all (SELECT true) | store_id → stores.org_id 격리 | store → org |
| 5 | `prediction_records` | all_policy (ALL true) | store_id → stores.org_id 격리 | store → org |
| 6 | `store_personas` | select_all (SELECT true) | store_id → stores.org_id 격리 | store → org |
| 7 | `stored_model_parameters` | all_policy (ALL true) | store_id → stores.org_id 격리 | store → org |
| 8 | `data_source_sync_logs` | Authenticated users can manage (ALL true) | data_source_id → data_sources.org_id 격리 | data_source → org |
| 9 | `data_source_tables` | Authenticated users can manage (ALL true) | data_source_id → data_sources.org_id 격리 | data_source → org |
| 10 | `ontology_entity_mappings` | manage entity mappings (ALL true) | data_source_id → data_sources.org_id 격리 | data_source → org |
| 11 | `ontology_relation_mappings` | manage relation mappings (ALL true) | data_source_id → data_sources.org_id 격리 | data_source → org |
| 12 | `store_personas` | (추가) INSERT/UPDATE/DELETE | store_id → stores.org_id 격리 | store → org |

### 의도적 유지 (5건)

| 테이블 | 정책 | cmd | 유지 근거 |
|--------|------|-----|----------|
| `contact_submissions` | Anyone can submit contact form | INSERT | 공개 문의 폼 |
| `feedback_reason_codes` | select_all | SELECT | 시스템 코드 (공유 읽기) |
| `ontology_relation_types` | Users can view | SELECT | 공유 스키마 정의 |
| `retail_concepts` | manage / view concepts | ALL/SELECT | 공유 리테일 개념 DB |
| `user_activity_logs` | System can insert | INSERT | 시스템 로그 기록 |

---

## 검증 결과

### RLS 상태 확인

```sql
-- RLS 미적용 (DISABLED)
SELECT count(*) FROM pg_tables WHERE schemaname = 'public'
  AND tablename NOT IN (SELECT tablename FROM pg_tables WHERE rowsecurity = true);
-- 결과: 0 ✅
```

### 정책 현황

| 카테고리 | Before | After |
|----------|--------|-------|
| RLS 미적용 | 2 | **0** |
| RLS 활성 + 정책 0개 | 4 | **1** (v_org_id, 의도적) |
| 항상-TRUE 정책 | 17 | **9** (전부 의도적) |

### 항상-TRUE 잔여 9건 (전부 의도적)

| 테이블 | 정책명 | cmd | 근거 |
|--------|-------|-----|------|
| `contact_submissions` | Anyone can submit | INSERT | 공개 폼 |
| `feedback_reason_codes` | select_all | SELECT | 시스템 코드 |
| `ontology_relation_types` | Users can view | SELECT | 공유 스키마 |
| `retail_concepts` | manage concepts | ALL | 공유 개념 |
| `retail_concepts` | view concepts | SELECT | 공유 개념 |
| `retail_knowledge_chunks` | authenticated_read | SELECT | 공유 지식 |
| `user_activity_logs` | System can insert | INSERT | 시스템 로그 |
| `ai_batch_test_results` | authenticated_select | SELECT | 테스트 결과 |
| `vmd_rulesets` | authenticated_select | SELECT | 공유 규칙 |

### Supabase Security Advisors

```
ERROR level: 0건 ✅ (이전: 2건 rls_disabled)
WARN level:
  - function_search_path_mutable: ~52개 (기존, Sprint C 범위 외)
  - extension_in_public: 2개 (pg_graphql, pg_stat_statements)
  - rls_policy_always_true: 4개 (3개 의도적 public + 1개 _archive 스키마)
```

---

## 사용된 RLS 패턴

### 패턴 A: org_id 직접 격리
```sql
USING (org_id = get_user_org_id(auth.uid()))
```
적용: organization_members, learning_adjustments

### 패턴 B: user_id 본인 데이터
```sql
USING (user_id = auth.uid())
```
적용: chat_context_memory

### 패턴 C: store_id → org 조인 격리
```sql
USING (store_id IN (SELECT s.id FROM stores s WHERE s.org_id = get_user_org_id(auth.uid())))
```
적용: optimization_feedback, prediction_records, store_personas, stored_model_parameters, vmd_rule_applications

### 패턴 D: data_source_id → org 조인 격리
```sql
USING (data_source_id IN (SELECT ds.id FROM data_sources ds WHERE ds.org_id = get_user_org_id(auth.uid())))
```
적용: data_source_sync_logs, data_source_tables, ontology_entity_mappings, ontology_relation_mappings

---

## 복원 가이드

```sql
-- RLS 비활성화 (긴급 시)
ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY;

-- 정책 제거
DROP POLICY "{policy_name}" ON {table_name};

-- 항상-TRUE로 복원
CREATE POLICY "{policy_name}" ON {table_name}
  FOR {cmd} USING (true);
```

---

> 실행일: 2026-02-26
> 상태: **Step 9 완료** — Security ERROR 0건 달성
> 다음: Step 10 인덱스 최적화
