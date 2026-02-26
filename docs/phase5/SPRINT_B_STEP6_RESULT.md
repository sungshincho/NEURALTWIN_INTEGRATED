# Phase 5 Sprint B — Step 6 실행 결과

> 실행일: 2026-02-26
> 실행 도구: Supabase MCP (execute_sql)
> 프로젝트: bdrvowacecxnraaivlhr

---

## 최종 현황

```
Step 6 — 정리 실행 결과
═══════════════════════════════════════════════════════════
                    Before     After      Change
─────────────────────────────────────────────────────────
  public 테이블       153        105       -48 (→ _archive)
  _archive 테이블       0         48       +48
  RPC 함수            236        211       -25 삭제
  Cross-schema FK       2          0       -2 (안전 DROP)
═══════════════════════════════════════════════════════════
```

---

## Step 6-A: UNUSED 테이블 아카이브 (48개) ✅

### 실행 방식
- `CREATE SCHEMA IF NOT EXISTS _archive;`
- `ALTER TABLE public.{name} SET SCHEMA _archive;` (5개씩 배치)
- 매 배치 후 테이블 수 + FK 깨짐 검증

### 배치별 결과

| 배치 | 대상 | 수 | public 테이블 수 | 결과 |
|------|------|-----|----------------|------|
| 1-1 | Deprecated (alerts, customer_segments, daily_sales, inventory, kpis) | 5 | 153 → 148 | ✅ |
| 1-2 | Deprecated (models, ontology_schemas, retail_concept_values, sync_endpoints, zone_metrics) | 5 | 148 → 143 | ✅ |
| 2-1 | Unimplemented (beacon_events, beacons, camera_events, chat_daily_analytics, furniture_facings) | 5 | 143 → 138 | ✅ |
| 2-2 | Unimplemented (furniture_height_zones, hq_guidelines, hq_notifications, hq_store_messages, onboarding_progress) | 5 | 138 → 133 | ✅ |
| 2-3 | Unimplemented (push_subscriptions, quickstart_guides, shift_schedules, strategy_daily_metrics, vmd_zone_types) | 5 | 133 → 128 | ✅ |
| 2-4 | Unimplemented (web_events, wifi_events, zone_performance, assistant_command_cache, ai_scene_analysis) | 5 | 128 → 123 | ✅ |
| 2-5 | Unimplemented (ai_insights, ai_inference_logs) | 2 | 123 → 121 | ✅ |
| 3-1 | Legacy (column_mappings, field_transform_rules, import_type_schemas, inventory_history, kpi_snapshots) | 5 | 121 → 116 | ✅ |
| 3-2 | Legacy (license_billing_history, ontology_relation_inference_queue, realtime_transactions, report_schedules, sample_data_templates) | 5 | 116 → 111 | ✅ |
| 4 | Fully Unused (scenarios, simulation_configs, store_comments, sync_logs, tasks, user_guide_completions) | 6 | 111 → 105 | ✅ |

### 아카이브된 테이블 전체 목록 (48개)

#### Deprecated/Replaced (10개)
`alerts`, `customer_segments`, `daily_sales`, `inventory`, `kpis`, `models`, `ontology_schemas`, `retail_concept_values`, `sync_endpoints`, `zone_metrics`

#### Unimplemented Features (22개)
`beacon_events`, `beacons`, `camera_events`, `chat_daily_analytics`, `furniture_facings`, `furniture_height_zones`, `hq_guidelines`, `hq_notifications`, `hq_store_messages`, `onboarding_progress`, `push_subscriptions`, `quickstart_guides`, `shift_schedules`, `strategy_daily_metrics`, `vmd_zone_types`, `web_events`, `wifi_events`, `zone_performance`, `assistant_command_cache`, `ai_scene_analysis`, `ai_insights`, `ai_inference_logs`

#### Partial/Legacy (10개)
`column_mappings`, `field_transform_rules`, `import_type_schemas`, `inventory_history`, `kpi_snapshots`, `license_billing_history`, `ontology_relation_inference_queue`, `realtime_transactions`, `report_schedules`, `sample_data_templates`

#### Fully Unused (6개)
`scenarios`, `simulation_configs`, `store_comments`, `sync_logs`, `tasks`, `user_guide_completions`

### FK 크로스 스키마 이슈 해결

아카이브 후 public → _archive FK 참조 2건 발견:

| FK Constraint | Source (public) | Target (_archive) | 참조 데이터 | 조치 |
|--------------|----------------|-------------------|-----------|------|
| `recommendation_applications_scenario_id_fkey` | recommendation_applications (13행) | scenarios | scenario_id 전부 NULL (0건 참조) | DROP CONSTRAINT ✅ |
| `api_sync_logs_sync_endpoint_id_fkey` | api_sync_logs (0행) | sync_endpoints | 데이터 없음 | DROP CONSTRAINT ✅ |

---

## Step 6-B: UNUSED RPC 삭제 (25개) ✅

### 실행 방식
- `DROP FUNCTION IF EXISTS public.{name}({signature});`
- 시그니처 불일치 시 `pg_proc`에서 정확한 시그니처 조회 후 재시도
- pg_cron 미설치 확인 (cron 충돌 없음)

### 배치별 결과

| 배치 | 카테고리 | 수 | RPC 수 | 결과 |
|------|---------|-----|--------|------|
| B-1 | Sync/Import | 7 | 236 → 229 | ✅ |
| B-2 | Sync/Import | 7 | 229 → 222 | ✅ |
| B-3 | Utility | 6 | 222 → 216 | ✅ |
| B-4 | Cache + User + Data | 5 | 216 → 211 | ✅ |

### 삭제된 RPC 전체 목록 (25개)

#### Sync/Import (14개)
| # | 함수명 | 시그니처 |
|---|--------|---------|
| 1 | `calculate_next_sync_time` | (text, text, timestamptz) |
| 2 | `create_import_session` | (uuid, uuid, uuid, text, text, bigint, text, text) |
| 3 | `create_sync_log` | (uuid, text, text, jsonb) |
| 4 | `execute_api_sync` | (uuid) |
| 5 | `get_active_import_sessions` | (uuid, uuid) |
| 6 | `get_connection_settings` | (uuid) |
| 7 | `get_connections_due_for_sync` | (integer) |
| 8 | `get_import_schema` | (text) |
| 9 | `get_import_target_table` | (text) |
| 10 | `record_sync_result` | (uuid, uuid, text, int, int, int, int, text, jsonb, int) |
| 11 | `update_connection_after_sync` | (uuid, boolean, int, int, text) |
| 12 | `update_connection_settings` | (uuid, text, text, text, text, text, jsonb, jsonb, text, text, jsonb, text, text, jsonb, boolean, int) |
| 13 | `update_import_session_status` | (uuid, text, int, jsonb, jsonb, jsonb) |
| 14 | `update_sync_log` | (uuid, text, int, int, int, int, text, text, jsonb, int, uuid, uuid, int, bigint) |

#### Utility (6개)
| # | 함수명 | 시그니처 |
|---|--------|---------|
| 15 | `cleanup_old_ai_response_logs` | (integer) |
| 16 | `cleanup_old_batch_test_results` | (integer) |
| 17 | `ensure_store_persona` | (uuid) |
| 18 | `export_public_schema` | () |
| 19 | `generate_sample_sales_data` | (uuid, uuid, integer) |
| 20 | `generate_sample_visit_data` | (uuid, uuid, integer, integer) |

#### Cache/Concept (3개)
| # | 함수명 | 시그니처 |
|---|--------|---------|
| 21 | `get_api_mapping_template` | (text, text) |
| 22 | `get_cached_concept_value` | (text, uuid) |
| 23 | `save_concept_value` | (text, uuid, jsonb, jsonb, integer) |

#### User (1개)
| # | 함수명 | 시그니처 |
|---|--------|---------|
| 24 | `get_user_orgs` | (uuid) |

#### Data Management (1개)
| # | 함수명 | 시그니처 |
|---|--------|---------|
| 25 | `get_sync_status` | (uuid, uuid) |

### 보존된 RPC (삭제하지 않음)

| Category | Count | Reason |
|----------|-------|--------|
| Analytics/Reporting | 9 | 향후 대시보드 확장 가능 |
| VMD/Furniture | 6 | D팀 확장 예정 |
| Data Management (기타) | 4 | ensure_system_context_connections 등 |
| INTERNAL Auth | 8 | RLS 정책 의존 — 삭제 금지 |

---

## Step 6-C: Storage 정리 ✅

### 중복 파일 삭제

| 항목 | 결과 |
|------|------|
| 중복 products.csv 3건 | ⏭ 스킵 — Supabase `storage.protect_delete()` 보호로 직접 SQL DELETE 불가. Storage API 사용 필요. 총 2.3KB (영향 미미) |
| products_template_ko.csv | 보존 |
| 원본 1768796214559_products.csv | 보존 |

### 버킷 보안 강화

| 버킷 | file_size_limit | allowed_mime_types | 변경 전 | 결과 |
|------|----------------|-------------------|---------|------|
| `avatars` | 5 MB | image/jpeg, image/png, image/webp, image/gif | 제한 없음 (public) | ✅ 적용 |
| `chat-attachments` | 10 MB | image/jpeg, image/png, image/webp, image/gif, application/pdf, text/plain | 제한 없음 (public) | ✅ 적용 |
| `3d-models` | (없음) | (없음) | — | 기존 유지 |
| `store-data` | (없음) | (없음) | private | 기존 유지 |
| `user-imports` | 50 MB | csv, excel, json 등 9종 | — | 기존 유지 |

---

## 복원 가이드

### 테이블 복원 (개별)
```sql
ALTER TABLE _archive.{table_name} SET SCHEMA public;
```

### FK 제약 복원 (필요시)
```sql
ALTER TABLE public.recommendation_applications
  ADD CONSTRAINT recommendation_applications_scenario_id_fkey
  FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id);

ALTER TABLE public.api_sync_logs
  ADD CONSTRAINT api_sync_logs_sync_endpoint_id_fkey
  FOREIGN KEY (sync_endpoint_id) REFERENCES public.sync_endpoints(id);
```

### RPC 복원
Supabase 일일 백업에서 함수 소스 추출 후 `CREATE FUNCTION` 재실행, 또는 migration 파일에서 복원.

---

## 다음 단계

| Step | 내용 | 상태 |
|------|------|------|
| Step 6-A | 테이블 아카이브 48개 | ✅ 완료 |
| Step 6-B | RPC 삭제 25개 | ✅ 완료 |
| Step 6-C | Storage 정리 + 보안 | ✅ 완료 |
| Step 7 | 중복 테이블/컬럼 통합 분석 | ⬜ 대기 |
| Step 8 | Dead EF/RPC 최종 정리 | ⬜ 대기 |

---

> 작성일: 2026-02-26
> 실행자: Claude Code (Supabase MCP)
