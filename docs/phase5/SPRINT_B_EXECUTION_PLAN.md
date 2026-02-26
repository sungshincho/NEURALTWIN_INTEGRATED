# Phase 5 Sprint B — 실행 계획서

> 작성일: 2026-02-26 | 사용자 승인 완료
> 전제: Sprint A 분석 완료, 사용자 검토 완료
> 실행 도구: Supabase MCP (execute_sql)

---

## 사용자 승인 내역

| 항목 | 승인 범위 | 수량 |
|------|----------|------|
| **테이블 아카이브** | 전체 48개 UNUSED 테이블 → `_archive` 스키마 이동 | 48 |
| **RPC 삭제** | 안전한 것만: Utility 6 + Cache 3 + User 1 + Sync 14 + Data 1 | 25 |
| **RPC 보존** | Analytics 9 + VMD 6 + 나머지 4 | 19 |
| **Auth RPC** | INTERNAL 8개 — 삭제 금지 (RLS 의존) | 보존 |

---

## 사전 체크리스트

```
□ Supabase Dashboard에서 DB 백업 확인 (Settings → Database → Backups)
□ .mcp.json에 SUPABASE_ACCESS_TOKEN 설정 완료
□ Claude Code 새 세션에서 MCP 연결 확인
```

---

## Step 6-A: UNUSED 테이블 아카이브 (48개)

### 실행 순서: 5개씩 배치, 매 배치 후 검증

### 배치 1: Deprecated/Replaced (10개) — 대체 테이블 확인됨

```sql
-- 배치 1-1 (5개)
CREATE SCHEMA IF NOT EXISTS _archive;

ALTER TABLE public.alerts SET SCHEMA _archive;           -- → user_alerts
ALTER TABLE public.customer_segments SET SCHEMA _archive; -- → customer_segments_agg
ALTER TABLE public.daily_sales SET SCHEMA _archive;       -- → daily_kpis_agg / dashboard_kpis
ALTER TABLE public.inventory SET SCHEMA _archive;         -- → inventory_levels
ALTER TABLE public.kpis SET SCHEMA _archive;              -- → dashboard_kpis
```

```sql
-- 배치 1-2 (5개)
ALTER TABLE public.models SET SCHEMA _archive;               -- → model_3d_files
ALTER TABLE public.ontology_schemas SET SCHEMA _archive;     -- → ontology_schema_versions
ALTER TABLE public.retail_concept_values SET SCHEMA _archive; -- → retail_concepts
ALTER TABLE public.sync_endpoints SET SCHEMA _archive;        -- → data_sources / api_connections
ALTER TABLE public.zone_metrics SET SCHEMA _archive;          -- → zone_daily_metrics
```

### 배치 2: Unimplemented Features (22개) — 미구현 기능

```sql
-- 배치 2-1 (5개)
ALTER TABLE public.beacon_events SET SCHEMA _archive;
ALTER TABLE public.beacons SET SCHEMA _archive;
ALTER TABLE public.camera_events SET SCHEMA _archive;
ALTER TABLE public.chat_daily_analytics SET SCHEMA _archive;
ALTER TABLE public.furniture_facings SET SCHEMA _archive;
```

```sql
-- 배치 2-2 (5개)
ALTER TABLE public.furniture_height_zones SET SCHEMA _archive;
ALTER TABLE public.hq_guidelines SET SCHEMA _archive;
ALTER TABLE public.hq_notifications SET SCHEMA _archive;
ALTER TABLE public.hq_store_messages SET SCHEMA _archive;
ALTER TABLE public.onboarding_progress SET SCHEMA _archive;
```

```sql
-- 배치 2-3 (5개)
ALTER TABLE public.push_subscriptions SET SCHEMA _archive;
ALTER TABLE public.quickstart_guides SET SCHEMA _archive;
ALTER TABLE public.shift_schedules SET SCHEMA _archive;
ALTER TABLE public.strategy_daily_metrics SET SCHEMA _archive;
ALTER TABLE public.vmd_zone_types SET SCHEMA _archive;
```

```sql
-- 배치 2-4 (5개)
ALTER TABLE public.web_events SET SCHEMA _archive;
ALTER TABLE public.wifi_events SET SCHEMA _archive;
ALTER TABLE public.zone_performance SET SCHEMA _archive;
ALTER TABLE public.assistant_command_cache SET SCHEMA _archive;
ALTER TABLE public.ai_scene_analysis SET SCHEMA _archive;
```

```sql
-- 배치 2-5 (2개)
ALTER TABLE public.ai_insights SET SCHEMA _archive;
ALTER TABLE public.ai_inference_logs SET SCHEMA _archive;
```

### 배치 3: Partial/Legacy (10개)

```sql
-- 배치 3-1 (5개)
ALTER TABLE public.column_mappings SET SCHEMA _archive;
ALTER TABLE public.field_transform_rules SET SCHEMA _archive;
ALTER TABLE public.import_type_schemas SET SCHEMA _archive;
ALTER TABLE public.inventory_history SET SCHEMA _archive;
ALTER TABLE public.kpi_snapshots SET SCHEMA _archive;
```

```sql
-- 배치 3-2 (5개)
ALTER TABLE public.license_billing_history SET SCHEMA _archive;
ALTER TABLE public.ontology_relation_inference_queue SET SCHEMA _archive;
ALTER TABLE public.realtime_transactions SET SCHEMA _archive;
ALTER TABLE public.report_schedules SET SCHEMA _archive;
ALTER TABLE public.sample_data_templates SET SCHEMA _archive;
```

### 배치 4: Fully Unused (6개)

```sql
-- 배치 4 (6개)
ALTER TABLE public.scenarios SET SCHEMA _archive;
ALTER TABLE public.simulation_configs SET SCHEMA _archive;
ALTER TABLE public.store_comments SET SCHEMA _archive;
ALTER TABLE public.sync_logs SET SCHEMA _archive;
ALTER TABLE public.tasks SET SCHEMA _archive;
ALTER TABLE public.user_guide_completions SET SCHEMA _archive;
```

### 배치별 검증 SQL

```sql
-- 각 배치 후 실행
SELECT schemaname, count(*)
FROM pg_tables
WHERE schemaname IN ('public', '_archive')
GROUP BY schemaname;

-- FK 에러 확인
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid::regclass::text LIKE '_archive.%';
```

---

## Step 6-B: UNUSED RPC 삭제 (25개)

### 삭제 대상 (사용자 승인: 안전한 것만)

#### Sync/Import RPCs (14개) — EF가 자체 구현, RPC 미호출 확인

```sql
-- 배치 B-1 (7개)
DROP FUNCTION IF EXISTS public.calculate_next_sync_time;
DROP FUNCTION IF EXISTS public.create_import_session;
DROP FUNCTION IF EXISTS public.create_sync_log;
DROP FUNCTION IF EXISTS public.execute_api_sync;
DROP FUNCTION IF EXISTS public.get_active_import_sessions;
DROP FUNCTION IF EXISTS public.get_connection_settings;
DROP FUNCTION IF EXISTS public.get_connections_due_for_sync;
```

```sql
-- 배치 B-2 (7개)
DROP FUNCTION IF EXISTS public.get_import_schema;
DROP FUNCTION IF EXISTS public.get_import_target_table;
DROP FUNCTION IF EXISTS public.record_sync_result;
DROP FUNCTION IF EXISTS public.update_connection_after_sync;
DROP FUNCTION IF EXISTS public.update_connection_settings;
DROP FUNCTION IF EXISTS public.update_import_session_status;
DROP FUNCTION IF EXISTS public.update_sync_log;
```

#### Utility RPCs (6개)

```sql
-- 배치 B-3 (6개)
DROP FUNCTION IF EXISTS public.cleanup_old_ai_response_logs;
DROP FUNCTION IF EXISTS public.cleanup_old_batch_test_results;
DROP FUNCTION IF EXISTS public.ensure_store_persona;
DROP FUNCTION IF EXISTS public.export_public_schema;
DROP FUNCTION IF EXISTS public.generate_sample_sales_data;
DROP FUNCTION IF EXISTS public.generate_sample_visit_data;
```

> ⚠️ 주의: cleanup_* 함수가 pg_cron에 등록되어 있을 수 있음. 삭제 전 확인:
> `SELECT * FROM cron.job;`

#### Cache/Concept RPCs (3개)

```sql
-- 배치 B-4 (3개)
DROP FUNCTION IF EXISTS public.get_api_mapping_template;
DROP FUNCTION IF EXISTS public.get_cached_concept_value;
DROP FUNCTION IF EXISTS public.save_concept_value;
```

#### User RPCs (1개)

```sql
-- 배치 B-4 (계속)
DROP FUNCTION IF EXISTS public.get_user_orgs;
```

#### Data Management (1개 — get_sync_status만)

```sql
DROP FUNCTION IF EXISTS public.get_sync_status;
```

### 보존 대상 (삭제하지 않음)

| Category | Count | Reason |
|----------|-------|--------|
| Analytics/Reporting | 9 | 향후 대시보드 확장 가능 |
| VMD/Furniture | 6 | D팀 확장 예정 |
| Data Management (4개) | 4 | ensure_system_context_connections 등 |
| INTERNAL Auth | 8 | RLS 정책 의존 — 삭제 금지 |

---

## Step 6-C: Storage 정리

### 최소 정리 (고아 파일 0건, 중복만)

```sql
-- user-imports 중복 products.csv 3건 삭제
-- (원본 1768796214559 보존, 나머지 3건 삭제)
DELETE FROM storage.objects
WHERE bucket_id = 'user-imports'
  AND name LIKE '%products.csv%'
  AND name NOT LIKE '%1768796214559%'
  AND name != 'products_template_ko.csv';
```

### Storage 버킷 보안 강화

```sql
-- avatars 버킷 보안 강화
UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- chat-attachments 버킷 보안 강화
UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
WHERE id = 'chat-attachments';
```

---

## 완료 후 검증

### 1. 타입 재생성

```bash
npx supabase gen types typescript --project-id bdrvowacecxnraaivlhr > packages/types/src/database.types.ts
```

### 2. 빌드 확인

```bash
pnpm type-check    # 타입 에러 확인
pnpm build          # 전체 빌드
pnpm lint           # 린트
```

### 3. 최종 현황 확인

```sql
-- 정리 후 현황
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as public_tables,
  (SELECT count(*) FROM pg_tables WHERE schemaname = '_archive') as archived_tables,
  (SELECT count(*) FROM information_schema.routines WHERE routine_schema = 'public') as rpc_count;
```

---

## 복원 절차 (문제 발생 시)

```sql
-- 테이블 복원 (개별)
ALTER TABLE _archive.{table_name} SET SCHEMA public;

-- RPC 복원: Supabase 일일 백업에서 함수 소스 추출 후 재생성
-- 또는 migration 파일에서 CREATE FUNCTION 재실행
```

---

## 예상 결과

| 항목 | 정리 전 | 정리 후 | 변화 |
|------|---------|---------|------|
| public 테이블 | 153 | ~105 | -48 |
| _archive 테이블 | 0 | 48 | +48 |
| RPC 함수 | 85 | ~60 | -25 |
| Storage 중복 | 4건 | 1건 | -3 |

---

> 작성일: 2026-02-26 | 사용자 승인: 테이블 48개 전체, RPC 25개 안전 범위
> 다음 단계: MCP 연결 후 배치 순서대로 실행
