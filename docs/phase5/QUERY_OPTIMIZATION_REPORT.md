# Phase 5 Sprint C — Step 11 Query Optimization Report

> 실행일: 2026-02-26
> 실행 도구: Supabase MCP (execute_sql)
> 프로젝트: bdrvowacecxnraaivlhr

---

## 11-A: 느린 쿼리 분석 (pg_stat_statements)

### Mean Execution Time 상위 (서비스 영향 쿼리만)

| 순위 | 쿼리 | 호출수 | Mean (ms) | Total (ms) | 분류 |
|------|------|--------|-----------|------------|------|
| 1 | `get_schema_metadata()` | 42 | 5,078 | 213,276 | **서비스 RPC** |
| 2 | `zone_events SELECT * LIMIT/OFFSET` | 320 | 1,233 | 394,692 | **Supabase REST** |
| 3 | `funnel_events SELECT * LIMIT/OFFSET` | 312 | 1,052 | 328,327 | **Supabase REST** |
| 4 | `visit_zone_events SELECT * LIMIT/OFFSET` | 322 | 862 | 277,541 | **Supabase REST** |
| 5 | `zone_events WHERE store_id + date` | 504 | 411 | 207,377 | **서비스 쿼리** |
| 6 | `funnel_events WHERE org_id + date` | 13,820 | 110 | 1,519,773 | **서비스 쿼리** |
| 7 | `graph_entities SELECT` | 7,246 | 63 | 459,964 | **서비스 쿼리** |

### Total Execution Time 상위

| 순위 | 쿼리 | 호출수 | Total (s) | 분류 |
|------|------|--------|-----------|------|
| 1 | WAL replication (Realtime) | 4.4M | 23,859 | 시스템 (최적화 불가) |
| 2 | WAL replication (Realtime) | 1.4M | 8,766 | 시스템 (최적화 불가) |
| 3 | `funnel_events WHERE org_id` | 13.8K | 1,520 | **Step 10에서 인덱스 추가** |
| 4 | `table_info CTE` (schema inspection) | 1.6K | 970 | Supabase Studio |
| 5 | `functions CTE` (function listing) | 1.2K | 601 | Supabase Studio |

---

## 11-B: RPC 함수 실행 계획 검토

### get_schema_metadata() — 평균 5,078ms

**문제**: N+1 쿼리 패턴
- 105개 public 테이블을 FOR LOOP로 순회
- 각 테이블마다 3개 서브쿼리 실행 (columns, foreign_keys, primary_keys)
- 총 ~315개 information_schema 쿼리 실행

**현재 구조**:
```
FOR table IN (SELECT table_name FROM information_schema.tables)
  LOOP
    FOR column IN (SELECT ... FROM information_schema.columns WHERE table_name = ?)  -- 쿼리 1
    FOR fk IN (SELECT ... FROM information_schema.table_constraints WHERE ...)         -- 쿼리 2
    FOR pk IN (SELECT ... FROM information_schema.table_constraints WHERE ...)         -- 쿼리 3
  END LOOP
```

**권장 최적화** (P1 — 향후 구현):
```sql
-- 단일 쿼리로 모든 테이블+컬럼+FK+PK 정보를 수집
-- jsonb_agg + LEFT JOIN으로 N+1 → 1 쿼리 변환
-- 예상 성능 개선: 5,078ms → ~200ms (25x 개선)
```

**리스크**: 함수 시그니처 변경 없음 (반환 타입 동일), 프론트엔드 영향 없음
**우선순위**: P1 — 42회 호출이지만 1회당 5초로 사용자 경험 저하

### zone_events / funnel_events LIMIT/OFFSET 쿼리 — 862~1,233ms

**문제**: `SELECT * FROM {table} LIMIT 1000 OFFSET 0` + COUNT 서브쿼리
- Supabase REST API의 기본 테이블 조회 패턴
- 대형 테이블(26K~37K rows)에서 COUNT(*)가 병목

**원인**: Supabase Dashboard/REST에서 테이블 브라우징 시 발생
**권장**: 서비스 코드에서는 항상 WHERE 조건 사용 (이미 적용됨)
**조치**: 별도 조치 불필요 (Dashboard 내부 동작)

### funnel_events WHERE org_id — 110ms, 13,820 calls

**이전**: Sequential Scan (org_id 인덱스 없음)
**이후**: Index Scan using idx_funnel_events_org_id ✅

```
EXPLAIN 결과:
  Index Scan using idx_funnel_events_org_id on funnel_events
    Index Cond: (org_id = ?)
    Filter: (event_date >= ?)
```

**예상 개선**: 110ms → ~10ms (인덱스 추가 효과)

### zone_events WHERE store_id + date — 411ms, 504 calls

**현재**: `idx_zone_events_store_date` (store_id, event_date) 복합 인덱스 이미 존재
**분석**: 411ms는 데이터 양 대비 정상 범위, 추가 최적화 불필요

---

## EXPLAIN 검증 결과

### Step 10 인덱스 추가 후 효과

| 테이블 | 쿼리 패턴 | Before | After |
|--------|----------|--------|-------|
| funnel_events | WHERE org_id = ? | Seq Scan | **Index Scan** (idx_funnel_events_org_id) ✅ |
| zone_events | WHERE org_id = ? | Seq Scan | **Index Scan** (idx_zone_events_org_id) ✅ |
| visit_zone_events | WHERE org_id = ? | Seq Scan | **Index Scan** (idx_visit_zone_events_org_id) ✅ |
| transactions | WHERE org_id = ? | Seq Scan | **Index Scan** (idx_transactions_org_id) ✅ |

---

## 최적화 권장 사항

| # | 항목 | 현재 성능 | 예상 개선 | 우선순위 | 난이도 |
|---|------|----------|----------|---------|--------|
| 1 | `get_schema_metadata()` 리팩토링 | 5,078ms | ~200ms | P1 | 중 |
| 2 | funnel_events org_id 쿼리 | 110ms | ~10ms | **완료** (인덱스 추가) | — |
| 3 | zone_events org_id 쿼리 | Seq Scan | Index Scan | **완료** (인덱스 추가) | — |
| 4 | 대형 테이블 LIMIT/OFFSET | 862~1,233ms | — | 조치 불필요 (Dashboard 내부) | — |
| 5 | WAL replication 부하 | 23.8s total | — | Supabase 시스템 (조치 불가) | — |

---

## 요약

```
Step 11 — 쿼리 성능 튜닝
═══════════════════════════════════════════════════════════
  분석 범위: pg_stat_statements 상위 20 쿼리

  즉시 효과 (Step 10 인덱스):
    - funnel_events org_id 쿼리: Seq Scan → Index Scan
    - zone_events org_id 쿼리: Seq Scan → Index Scan
    - 기타 6개 테이블의 org_id/FK 쿼리 개선

  향후 최적화 권장:
    - get_schema_metadata() N+1 → Set-based 리팩토링 (P1)

  조치 불필요:
    - Dashboard LIMIT/OFFSET 쿼리 (Supabase 내부)
    - WAL Realtime 부하 (시스템 레벨)
═══════════════════════════════════════════════════════════
```

---

> 실행일: 2026-02-26
> 상태: **Step 11 완료**
> 다음: Sprint C 완료 검증 및 문서화
