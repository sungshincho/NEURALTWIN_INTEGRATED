# Phase 5 Sprint B — 실행 계획서 (최종)

> 작성일: 2026-02-26 | 최종 업데이트: 2026-02-26
> 전제: Sprint A 분석 완료, 사용자 검토 완료
> 실행 도구: Supabase MCP (execute_sql)
> 원칙: **삭제 전에 반드시 백업. 복원 가능한 상태에서만 삭제. 느리고 안전하게.**

---

## 사용자 승인 내역

| 항목 | 승인 범위 | 수량 |
|------|----------|------|
| **테이블 아카이브** | 전체 48개 UNUSED 테이블 → `_archive` 스키마 이동 | 48 |
| **RPC 삭제** | 안전한 것만: Utility 6 + Cache 3 + User 1 + Sync 14 + Data 1 | 25 |
| **RPC 보존** | Analytics 9 + VMD 6 + 나머지 4 | 19 |
| **Auth RPC** | INTERNAL 8개 — 삭제 금지 (RLS 의존) | 보존 |
| **Dead EF 삭제** | generate-template, upscale-image (트래픽 0, 코드 참조 0) | 2 |

---

## 사전 체크리스트

```
□ Supabase Dashboard에서 DB 백업 확인 (Settings → Database → Backups)
□ .mcp.json에 SUPABASE_ACCESS_TOKEN 설정 완료
□ Claude Code 새 세션에서 MCP 연결 확인
□ pg_cron 등록 작업 확인: SELECT * FROM cron.job;
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

**배치별 검증** (매 배치 완료 후 즉시 실행):

```sql
-- 1) 스키마 테이블 수 확인
SELECT schemaname, count(*)
FROM pg_tables
WHERE schemaname IN ('public', '_archive')
GROUP BY schemaname;

-- 2) FK 깨짐 확인
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid::regclass::text LIKE '_archive.%';

-- 3) 에러 발생 시 즉시 복원
-- ALTER TABLE _archive.{table_name} SET SCHEMA public;
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

---

## Step 6-B: UNUSED RPC 삭제 (25개)

### 사전 확인 — pg_cron 등록 여부

```sql
-- cleanup_* 함수가 pg_cron에 등록되어 있는지 확인
-- 등록되어 있으면 cron 작업 먼저 삭제 후 함수 삭제
SELECT jobid, schedule, command FROM cron.job
WHERE command LIKE '%cleanup%'
   OR command LIKE '%generate_sample%'
   OR command LIKE '%ensure_store%';
```

### 삭제 대상 (사용자 승인: 안전한 것만)

> ⚠️ PostgreSQL에서 오버로드된 함수가 있을 수 있으므로, 시그니처 없이 DROP하면
> "function name is not unique" 에러 발생 가능. 에러 시 `SELECT proname, proargtypes::regtype[]
> FROM pg_proc WHERE proname = '{function_name}';`으로 정확한 시그니처 확인 후 재시도.

#### Sync/Import RPCs (14개) — EF가 자체 구현, RPC 미호출 확인

```sql
-- 배치 B-1 (7개)
DROP FUNCTION IF EXISTS public.calculate_next_sync_time(text, timestamptz, text);
DROP FUNCTION IF EXISTS public.create_import_session(uuid, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_sync_log(uuid, text, text);
DROP FUNCTION IF EXISTS public.execute_api_sync(uuid);
DROP FUNCTION IF EXISTS public.get_active_import_sessions(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_connection_settings();
DROP FUNCTION IF EXISTS public.get_connections_due_for_sync();
```

```sql
-- 배치 B-2 (7개)
DROP FUNCTION IF EXISTS public.get_import_schema();
DROP FUNCTION IF EXISTS public.get_import_target_table();
DROP FUNCTION IF EXISTS public.record_sync_result(uuid, uuid, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.update_connection_after_sync(uuid, text, timestamptz);
DROP FUNCTION IF EXISTS public.update_connection_settings(uuid, jsonb);
DROP FUNCTION IF EXISTS public.update_import_session_status(uuid, text, text);
DROP FUNCTION IF EXISTS public.update_sync_log(uuid, text, text);
```

> ⚠️ 시그니처 불일치로 에러 발생 시, 함수 이름만으로 재시도:
> `DROP FUNCTION IF EXISTS public.{function_name};`
> PostgreSQL 14+에서는 시그니처 없이도 유일한 함수를 삭제 가능

#### Utility RPCs (6개)

```sql
-- 배치 B-3 (6개)
DROP FUNCTION IF EXISTS public.cleanup_old_ai_response_logs(integer);
DROP FUNCTION IF EXISTS public.cleanup_old_batch_test_results(integer);
DROP FUNCTION IF EXISTS public.ensure_store_persona(uuid, uuid);
DROP FUNCTION IF EXISTS public.export_public_schema();
DROP FUNCTION IF EXISTS public.generate_sample_sales_data(uuid, uuid, date, date);
DROP FUNCTION IF EXISTS public.generate_sample_visit_data(uuid, uuid, date, date);
```

#### Cache/Concept RPCs (3개)

```sql
-- 배치 B-4 (3개)
DROP FUNCTION IF EXISTS public.get_api_mapping_template();
DROP FUNCTION IF EXISTS public.get_cached_concept_value();
DROP FUNCTION IF EXISTS public.save_concept_value();
```

#### User RPCs (1개)

```sql
-- 배치 B-4 (계속)
DROP FUNCTION IF EXISTS public.get_user_orgs();
```

#### Data Management (1개 — get_sync_status만)

```sql
DROP FUNCTION IF EXISTS public.get_sync_status();
```

### 배치별 검증

```sql
-- 각 RPC 배치 삭제 후 실행
SELECT count(*) as remaining_rpc_count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
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

## Step 7: 중복 테이블/컬럼 통합 분석

> ⚠️ 이 단계는 **분석만 수행**합니다. 실제 테이블 통합은 Sprint C 또는 별도 승인 후 진행.
> 테이블 통합은 프로덕션 데이터 마이그레이션이 필요하므로, Sprint B에서 가장 신중해야 하는 작업입니다.

### 분석 대상 그룹 (5개)

#### 그룹 1: KPI 관련 (4개 테이블)

| 테이블 | 현재 상태 | 역할 |
|--------|----------|------|
| `daily_kpis_agg` | ✅ ACTIVE | 일별 KPI 집계 데이터 |
| `dashboard_kpis` | ✅ ACTIVE | 대시보드 표시용 KPI |
| `kpis` | 🔴 → _archive | KPI 정의 (deprecated) |
| `kpi_snapshots` | 🔴 → _archive | KPI 스냅샷 (deprecated) |

> kpis, kpi_snapshots는 Step 6-A에서 이미 아카이브 대상. daily_kpis_agg와 dashboard_kpis의 데이터 흐름 중복 여부 확인 필요.

#### 그룹 2: 인벤토리 관련 (5개 테이블)

| 테이블 | 현재 상태 | 역할 |
|--------|----------|------|
| `inventory` | 🔴 → _archive | 기본 재고 (deprecated) |
| `inventory_history` | 🔴 → _archive | 재고 이력 (deprecated) |
| `inventory_levels` | ✅ ACTIVE | 현재 재고 수준 |
| `inventory_movements` | ✅ ACTIVE | 재고 이동 기록 |
| `realtime_inventory` | ✅ ACTIVE | 실시간 재고 (IoT) |

> inventory, inventory_history는 Step 6-A에서 아카이브 대상. 나머지 3개는 역할 분리가 의도적 (수준/이동/실시간).

#### 그룹 3: 존 메트릭 관련 (4개 테이블)

| 테이블 | 현재 상태 | 역할 |
|--------|----------|------|
| `zone_metrics` | 🔴 → _archive | 존 메트릭 (deprecated) |
| `zone_performance` | 🔴 → _archive | 존 성과 (미구현) |
| `zone_daily_metrics` | ✅ ACTIVE | 일별 존 메트릭 |
| `hourly_metrics` | ✅ ACTIVE | 시간별 메트릭 |

> zone_metrics, zone_performance는 Step 6-A에서 아카이브 대상. zone_daily_metrics와 hourly_metrics는 집계 주기별 의도적 분리.

#### 그룹 4: 동기화 로그 관련 (3개 테이블)

| 테이블 | 현재 상태 | 역할 |
|--------|----------|------|
| `data_sync_logs` | ✅ ACTIVE | 데이터 동기화 로그 |
| `sync_logs` | 🔴 → _archive | 싱크 로그 (미사용) |
| `api_sync_logs` | ✅ ACTIVE | API 싱크 로그 |

> sync_logs는 Step 6-A에서 아카이브 대상. data_sync_logs와 api_sync_logs의 통합 가능성 검토 필요.

#### 그룹 5: 온톨로지 관련 (8개 테이블)

| 테이블 | 현재 상태 | 역할 |
|--------|----------|------|
| `ontology_entity_types` | ✅ ACTIVE (8 EF refs) | 엔티티 타입 정의 |
| `ontology_relation_types` | ✅ ACTIVE | 관계 타입 정의 |
| `ontology_entity_mappings` | ✅ ACTIVE | 엔티티 매핑 |
| `ontology_relation_mappings` | ✅ ACTIVE | 관계 매핑 |
| `ontology_mapping_cache` | ✅ ACTIVE | 매핑 캐시 |
| `ontology_relation_inference_queue` | 🔴 → _archive | 추론 큐 (미사용) |
| `ontology_schema_versions` | ✅ ACTIVE | 스키마 버전 관리 |
| `ontology_schemas` | 🔴 → _archive | 스키마 (deprecated) |

> ontology_relation_inference_queue, ontology_schemas는 Step 6-A에서 아카이브 대상. 나머지 6개는 모두 활발히 사용 중 — 통합 불필요.

### 분석 작업 내용

각 그룹에 대해 다음을 수행:

```
1. 실제 데이터 비교:
   - 각 테이블의 행 수, 컬럼 비교
   - 컬럼 이름/타입 유사도 분석
   - 동일 데이터가 양쪽에 존재하는지 샘플 확인

2. 코드 참조 비교:
   - 같은 데이터를 두 테이블에 쓰는 EF가 있는지
   - 프론트엔드에서 어느 테이블을 읽는지

3. 통합 판단:
   - 통합 가능: 마이그레이션 SQL 초안 작성
   - 통합 불가 (의도적 분리): 이유 문서화
   - 판단 보류: 추가 정보 필요
```

### 통합 실행 절차 (통합이 결정된 경우)

> ⚠️ 실제 통합은 사용자 별도 승인 후에만 진행. Sprint B에서는 분석까지만.

```
1. 대상 테이블 구조 비교 → 통합 스키마 설계
2. 마이그레이션 SQL 작성 (INSERT INTO ... SELECT ...)
3. 코드에서 참조하는 테이블명 모두 변경 (코드 먼저!)
4. 브랜치에서 코드 변경 완료 + 빌드 확인
5. 마이그레이션 SQL 실행 (Supabase)
6. 코드 배포 (Vercel + EF deploy)
7. 기존 테이블 → _archive 스키마 이동
```

### 산출물

```
→ docs/phase5/DUPLICATE_ANALYSIS.md 생성
  - 각 그룹별 데이터 비교 결과
  - 컬럼 유사도 매트릭스
  - 통합 가능/불가 판단 + 근거
  - 통합 시 마이그레이션 SQL 초안 (해당 시)
```

---

## Step 8: Dead RPC & Dead EF 최종 정리

### 8-A: Dead EF 삭제 (2개 — 트래픽 0, 코드 참조 0 확정)

**대상**: EF_TRAFFIC_REPORT.md에서 🔴 DEAD 판정, 24h 트래픽 0 확인

| EF Name | 24h Traffic | Code Refs | Status |
|---------|------------|-----------|--------|
| `generate-template` | 0 | 0 (DataImportWidget에 URL 있으나 실제 디렉토리 미존재) | 삭제 |
| `upscale-image` | 0 | 0 (문서에만 존재) | 삭제 |

**실행 순서**:

```bash
# 1. 프론트엔드에서 삭제될 EF를 호출하는 코드 최종 확인
grep -r "generate-template" apps/ --include="*.ts" --include="*.tsx"
grep -r "upscale-image" apps/ --include="*.ts" --include="*.tsx"

# 2. 호출 코드가 있으면 → 해당 코드에서 EF 호출 제거 또는 에러 핸들링 추가
#    (generate-template: DataImportWidget.tsx:815 — fallback 처리 필요)

# 3. Supabase에서 함수 삭제
supabase functions delete generate-template --project-ref bdrvowacecxnraaivlhr
supabase functions delete upscale-image --project-ref bdrvowacecxnraaivlhr

# 4. 코드 디렉토리 삭제 (존재하는 경우)
# ⚠️ 현재 두 EF 모두 디렉토리가 존재하지 않음 (Phantom)
# rm -rf supabase/supabase/functions/generate-template/
# rm -rf supabase/supabase/functions/upscale-image/
```

### 8-B: Step 6에서 미처리된 RPC 잔여 정리

```sql
-- Step 6-B에서 삭제 대상이었으나 에러로 건너뛴 RPC가 있는지 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_next_sync_time', 'create_import_session', 'create_sync_log',
    'execute_api_sync', 'get_active_import_sessions', 'get_connection_settings',
    'get_connections_due_for_sync', 'get_import_schema', 'get_import_target_table',
    'record_sync_result', 'update_connection_after_sync', 'update_connection_settings',
    'update_import_session_status', 'update_sync_log',
    'cleanup_old_ai_response_logs', 'cleanup_old_batch_test_results',
    'ensure_store_persona', 'export_public_schema',
    'generate_sample_sales_data', 'generate_sample_visit_data',
    'get_api_mapping_template', 'get_cached_concept_value', 'save_concept_value',
    'get_user_orgs', 'get_sync_status'
  );

-- 결과가 있으면 → 해당 RPC 재삭제 시도
```

### 8-C: 최종 EF↔프론트엔드 정합성 확인

```bash
# 삭제된 EF를 프론트엔드가 호출하지 않는지 최종 grep
grep -r "functions/v1/generate-template" apps/ supabase/ --include="*.ts" --include="*.tsx"
grep -r "functions/v1/upscale-image" apps/ supabase/ --include="*.ts" --include="*.tsx"
grep -r "'generate-template'" apps/ supabase/ --include="*.ts" --include="*.tsx"
grep -r "'upscale-image'" apps/ supabase/ --include="*.ts" --include="*.tsx"

# 결과가 있으면 → 해당 코드 수정 (dead reference 제거 또는 fallback 추가)
```

---

## 완료 후 검증 (전체)

### 1. 타입 재생성

```bash
npx supabase gen types typescript --project-id bdrvowacecxnraaivlhr > packages/types/src/database.types.ts
```

### 2. 빌드 확인

```bash
pnpm type-check    # 타입 에러 확인
pnpm build          # 전체 빌드 (website + os-dashboard)
pnpm lint           # 린트
```

### 3. EF 정상 동작 확인

```bash
# 로컬 EF 서빙 테스트
pnpm supabase:functions:serve

# 스모크 테스트 (OPTIONS preflight)
./scripts/smoke-test-ef.sh
```

### 4. 프로덕션 사이트 정상 접속 확인

```
□ website: 메인 페이지 로드 확인
□ os-dashboard: 로그인 + 대시보드 로드 확인
□ retail-chatbot: 채팅 응답 확인
□ environment-proxy: 환경 데이터 로드 확인
```

### 5. 최종 현황 확인

```sql
-- 정리 후 현황
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as public_tables,
  (SELECT count(*) FROM pg_tables WHERE schemaname = '_archive') as archived_tables,
  (SELECT count(*) FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as rpc_count;
```

---

## 복원 절차 (문제 발생 시)

```sql
-- 테이블 복원 (개별)
ALTER TABLE _archive.{table_name} SET SCHEMA public;

-- RPC 복원: Supabase 일일 백업에서 함수 소스 추출 후 재생성
-- 또는 migration 파일에서 CREATE FUNCTION 재실행

-- EF 복원: git에서 삭제된 EF 디렉토리 복원 후 재배포
-- git checkout HEAD~1 -- supabase/supabase/functions/{name}/
-- supabase functions deploy {name} --project-ref bdrvowacecxnraaivlhr
```

---

## 작업 진행 방식 — 느리고 안전하게

```
1회차: 테이블 5개씩 이동 → 검증 → 다음 5개
2회차: RPC 7~10개씩 삭제 → 검증 → 다음 배치
3회차: Storage 파일 정리 + 버킷 보안
4회차: 중복 테이블 분석 (DUPLICATE_ANALYSIS.md 생성)
5회차: Dead EF 삭제 + 프론트엔드 정합성 확인

각 회차 사이에 프론트엔드/EF 정상 동작 확인
문제 발생 시 즉시 중단 + 복원
```

---

## Sprint B 완료 기준

```
□ UNUSED 테이블 48개 → _archive 스키마로 이동 완료
□ UNUSED RPC 함수 25개 삭제 완료
□ Storage 고아/중복 파일 정리 완료
□ Storage 버킷 보안 강화 완료
□ 중복 테이블 분석 완료 → DUPLICATE_ANALYSIS.md 생성 (통합은 안전한 것만)
□ Dead EF 2개 삭제 완료 (generate-template, upscale-image)
□ 프론트엔드에서 삭제된 EF/RPC 호출 없음 확인 (grep)
□ supabase gen types typescript 재생성
□ 프론트엔드 빌드 정상 (pnpm type-check + pnpm build)
□ 전체 EF supabase functions serve 정상
□ 프로덕션 사이트 정상 접속 확인
```

---

## 예상 결과

| 항목 | 정리 전 | 정리 후 | 변화 |
|------|---------|---------|------|
| public 테이블 | 153 | ~105 | -48 |
| _archive 테이블 | 0 | 48 | +48 |
| RPC 함수 | 85 | ~60 | -25 |
| Edge Functions | 47 | 45 | -2 |
| Storage 중복 | 4건 | 1건 | -3 |

---

> 작성일: 2026-02-26 | 최종 업데이트: 2026-02-26
> 사용자 승인: 테이블 48개 전체, RPC 25개 안전 범위, Dead EF 2개
> 산출물: DUPLICATE_ANALYSIS.md (Step 7 완료 시)
> 사용자 정지 포인트: Sprint B 완료 후, 정리 결과를 확인하고 Sprint C 진행 여부를 결정합니다.
> 다음 단계: MCP 연결 후 배치 순서대로 실행
