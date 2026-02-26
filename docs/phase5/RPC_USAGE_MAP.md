# Phase 5 — RPC Function Usage Map (완전 매핑)

> Phase 5 Sprint A, Step 2 | 작성일: 2026-02-26
> 방법론: 코드 정적 분석 (`.rpc()` 호출) + migration SQL 분석 (RLS/트리거) + database.types.ts
> 전제: schema.sql에는 CREATE TABLE만 존재, RPC 함수/트리거/RLS 정책 소스는 프로덕션 DB에만 존재

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| **database.types.ts 등록 RPC** | **83** |
| **DB에만 존재 (types 미등록)** | **2** |
| **Total RPC Functions** | **85** |
| ✅ ACTIVE (코드에서 직접 호출) | **33** |
| 🔵 INTERNAL (RLS/Policy 내부 사용 추정) | **8** |
| 🔴 UNUSED (어디에서도 참조 없음) | **44** |

### 호출 출처별 분류

| Source | Unique RPCs Called | Call Sites |
|--------|-------------------|------------|
| Edge Functions (6개 EF) | 22 | 29 |
| OS Dashboard (8개 파일) | 18 | 18 |
| Website | 0 | 0 |
| NeuralSense | 0 | 0 |
| **Shared (EF + OS)** | **7** | — |

---

## 2. Methodology

### 분석 소스
1. **database.types.ts** `Functions: {}` 섹션 — 83개 RPC 시그니처
2. **EF 코드** (`supabase/supabase/functions/`) — `.rpc()` 패턴 검색 (22개 발견)
3. **OS Dashboard** (`apps/os-dashboard/src/`) — `.rpc()` 패턴 검색 (18개 발견)
4. **Website** (`apps/website/src/`) — `.rpc()` 패턴 검색 (0개 발견)
5. **Migration SQL** (`apps/os-dashboard/scripts/migrations/`) — CREATE POLICY / CREATE TRIGGER 검색

### 한계점
- **schema.sql에 RPC 함수 소스코드 미포함** — 프로덕션 DB에만 존재
- **RLS 정책 소스 미포함** — migration 파일에서 일부만 확인 가능
- **함수 간 내부 호출 확인 불가** — `execute_api_sync`이 `create_sync_log`를 내부 호출하는지 등
- **pg_cron 스케줄 작업 미확인** — cleanup 함수 등이 스케줄로 실행될 수 있음

---

## 3. Complete RPC Matrix (85 Functions)

### ✅ ACTIVE — Shared (EF + OS 양쪽 호출) — 7개

| # | RPC Function | EF Caller | OS Caller | Purpose |
|---|-------------|-----------|-----------|---------|
| 1 | `calculate_confidence_adjustment` | advanced-ai-inference (`learning.ts:225`) | useLearningFeedback.ts (`:438`) | 전략별 신뢰도 조정 계산 |
| 2 | `compute_all_retail_concepts` | retail-ai-inference (`index.ts:261`) | useRetailOntology.ts (`:244`) | 리테일 개념 전체 계산 |
| 3 | `get_data_control_tower_status` | neuraltwin-assistant (`controlTowerQueries.ts:43,92,185`) | useDataControlTower.ts (`:38`) | 데이터 컨트롤 타워 현황 |
| 4 | `get_failure_patterns` | advanced-ai-inference (`learning.ts:218`) | useLearningFeedback.ts (`:417`) | 전략 실패 패턴 분석 |
| 5 | `get_hourly_entry_counts` | neuraltwin-assistant (`rpcHelpers.ts:77`) | InsightDataContext.tsx (`:344`) | 시간대별 입장 수 |
| 6 | `get_success_patterns` | advanced-ai-inference (`learning.ts:211`) | useLearningFeedback.ts (`:400`) | 전략 성공 패턴 분석 |
| 7 | `graph_n_hop_query` | graph-query (`index.ts:65`) | useOntologyData.ts (`:126`) | 온톨로지 N-hop 그래프 탐색 |

### ✅ ACTIVE — EF Only (EF에서만 호출) — 15개

| # | RPC Function | EF Caller | Location | Purpose |
|---|-------------|-----------|----------|---------|
| 8 | `get_applied_strategies` | neuraltwin-assistant | rpcHelpers.ts:102 | 적용된 전략 목록 |
| 9 | `get_customer_segments` | neuraltwin-assistant | rpcHelpers.ts:37 | 고객 세그먼트 조회 |
| 10 | `get_inventory_movements` | neuraltwin-assistant | rpcHelpers.ts:115 | 재고 이동 이력 |
| 11 | `get_inventory_status` | neuraltwin-assistant | rpcHelpers.ts:58 | 재고 현황 |
| 12 | `get_overview_kpis` | neuraltwin-assistant | rpcHelpers.ts:13 | KPI 개요 |
| 13 | `get_product_performance` | neuraltwin-assistant | rpcHelpers.ts:49 | 상품 성과 |
| 14 | `get_store_goals` | neuraltwin-assistant | rpcHelpers.ts:66 | 매장 목표 |
| 15 | `get_zone_metrics` | neuraltwin-assistant | rpcHelpers.ts:25 | 존 메트릭 |
| 16 | `get_zones_dim_list` | neuraltwin-assistant | rpcHelpers.ts:87 | 존 차원 목록 |
| 17 | `graph_shortest_path` | graph-query | index.ts:83 | 온톨로지 최단 경로 |
| 18 | `handover_chat_session` | retail-chatbot, _shared/chatLogger | chatLogger.ts:346, index.ts:1212 | 채팅 세션 핸드오버 |
| 19 | `search_knowledge` | retail-chatbot | vectorStore.ts:49 | 벡터 유사도 지식 검색 |
| 20 | `search_knowledge_trgm` | retail-chatbot | vectorStore.ts:84 | 트라이그램 텍스트 검색 |
| 21 | `get_store_persona_context` ⚠️ | _shared/persona | storePersonaLoader.ts:202 | 매장 페르소나 컨텍스트 |
| 22 | `increment_chat_message_count` ⚠️ | _shared/chatLogger, retail-chatbot | chatLogger.ts:176, index.ts:797 | 대화 메시지 수 증가 |

> ⚠️ `get_store_persona_context`와 `increment_chat_message_count`는 **database.types.ts에 미등록** — DB에 직접 정의되었지만 타입 재생성 시 누락된 것으로 추정

### ✅ ACTIVE — OS Only (OS Dashboard에서만 호출) — 11개

| # | RPC Function | OS File | Hook/Component | Purpose |
|---|-------------|---------|---------------|---------|
| 23 | `aggregate_ai_performance` | useLearningFeedback.ts:211 | useModelPerformance() | AI 모델 성과 집계 |
| 24 | `calculate_data_quality_score` | useDataControlTower.ts:526 | useDataQualityScore() | 데이터 품질 점수 |
| 25 | `compute_cross_sell_affinity` | useRetailOntology.ts:295 | useCrossSellAffinity() | 교차 판매 친화도 |
| 26 | `compute_inventory_turnover` | useRetailOntology.ts:318 | useInventoryTurnover() | 재고 회전율 |
| 27 | `compute_zone_conversion_funnel` | useRetailOntology.ts:272 | useZoneConversionFunnel() | 존 전환 퍼널 |
| 28 | `compute_zone_heatmap` | useRetailOntology.ts:341 | useZoneHeatmap() | 존 히트맵 |
| 29 | `create_api_connection` | useApiConnector.ts:183 | useCreateConnection() | API 연결 생성 |
| 30 | `get_api_connections_dashboard` | useApiConnector.ts:97 | useApiConnectionsDashboard() | API 연결 대시보드 |
| 31 | `get_kpi_lineage` | useDataControlTower.ts:782 | useKPILineage() | KPI 계보 추적 |
| 32 | `get_sync_history` | SyncHistoryTable.tsx:294 | SyncHistoryTable | 싱크 이력 조회 |
| 33 | `migrate_user_to_organization` | useAuth.tsx:48 | ensureOrganization() | 사용자→조직 마이그레이션 |

---

### 🔵 INTERNAL — RLS/Policy 내부 사용 추정 — 8개

| # | RPC Function | Evidence | Purpose |
|---|-------------|----------|---------|
| 34 | `is_org_member` | ✅ **확인됨**: migration 001, 002의 RLS USING 절에서 사용 | 조직 멤버 확인 (RLS 핵심) |
| 35 | `is_org_admin` | 🔶 추정: 표준 RLS 패턴 | 조직 관리자 확인 |
| 36 | `is_org_owner` | 🔶 추정: 표준 RLS 패턴 | 조직 소유자 확인 |
| 37 | `can_access_membership` | 🔶 추정: 멤버십 접근 제어 | 멤버십 레코드 접근 권한 |
| 38 | `has_valid_license` | 🔶 추정: 라이선스 기반 접근 제어 | 유효 라이선스 확인 |
| 39 | `is_org_member_simple` | 🔶 추정: is_org_member 경량 버전 | 조직 멤버 확인 (간소) |
| 40 | `is_org_member_with_license` | 🔶 추정: 멤버+라이선스 복합 확인 | 조직 멤버 + 라이선스 |
| 41 | `get_user_role` | 🔶 추정: RLS 또는 뷰에서 사용 | 사용자 역할 조회 |

> **⚠️ 경고**: 이 8개 함수는 **삭제 절대 금지**. 프로덕션 RLS 정책에서 사용 중일 가능성이 매우 높음.
> Sprint B에서 Supabase MCP `pg_policies` 조회로 정확한 의존성 확인 필요.

#### 확인된 RLS 정책 (migration 파일 기반)

| Policy Name | Table | Function Used |
|-------------|-------|---------------|
| "View master and own entity types" | `ontology_entity_types` | `is_org_member(auth.uid(), org_id)` |
| "View master and own relation types" | `ontology_relation_types` | `is_org_member(auth.uid(), org_id)` |
| "store_personas_select_policy" | `store_personas` | (USING true — 미사용) |
| "layout_optimization_results_*" | `layout_optimization_results` | (USING true — 미사용) |
| "vmd_rulesets_select_policy" | `vmd_rulesets` | (USING true — 미사용) |

---

### 🔴 UNUSED — 코드에서 호출 없음 — 44개

#### Sync/Import RPCs (14개) — ⚠️ 함수 간 내부 호출 가능성

| # | RPC Function | Signature (key params) | Notes |
|---|-------------|----------------------|-------|
| 42 | `calculate_next_sync_time` | (p_sync_frequency, p_last_sync?, p_sync_cron?) → timestamp | 다음 싱크 시간 계산 |
| 43 | `create_import_session` | (p_org_id, p_store_id, p_file_name, ...) → uuid | 임포트 세션 생성 |
| 44 | `create_sync_log` | (p_connection_id, p_sync_type?, ...) → json | 싱크 로그 생성 |
| 45 | `execute_api_sync` | (p_connection_id) → json | API 싱크 실행 |
| 46 | `get_active_import_sessions` | (p_user_id, p_store_id?) → record[] | 활성 임포트 세션 |
| 47 | `get_connection_settings` | → json | 연결 설정 조회 |
| 48 | `get_connections_due_for_sync` | → json | 싱크 예정 연결 |
| 49 | `get_import_schema` | → json | 임포트 스키마 |
| 50 | `get_import_target_table` | → text | 임포트 대상 테이블 |
| 51 | `record_sync_result` | (p_connection_id, p_sync_log_id, ...) → json | 싱크 결과 기록 |
| 52 | `update_connection_after_sync` | (p_connection_id, ...) → json | 싱크 후 연결 업데이트 |
| 53 | `update_connection_settings` | (p_connection_id, ...) → json | 연결 설정 업데이트 |
| 54 | `update_import_session_status` | (p_session_id, ...) → void | 세션 상태 업데이트 |
| 55 | `update_sync_log` | (p_sync_log_id, ...) → void | 싱크 로그 업데이트 |

> ⚠️ **주의**: `execute_api_sync`은 내부적으로 `create_sync_log`, `record_sync_result`, `update_connection_after_sync`를 호출할 수 있음. EF인 `sync-api-data`가 이 RPC들을 직접 호출하는 대신 자체 로직으로 구현했을 가능성이 높음 → **중복 코드 가능성**

#### Analytics/Reporting RPCs (9개) — 대시보드 UI 미연결

| # | RPC Function | Signature (key params) | Notes |
|---|-------------|----------------------|-------|
| 56 | `get_daily_kpis_summary` | (p_store_id, p_start_date, ...) → json | KPI 일별 요약 |
| 57 | `get_funnel_stats` | (p_store_id, ...) → record[] | 퍼널 통계 |
| 58 | `get_hourly_traffic` | (p_store_id, ...) → record[] | 시간대별 트래픽 |
| 59 | `get_product_associations` | (p_store_id, ...) → record[] | 상품 연관 분석 |
| 60 | `get_roi_by_category` | (p_org_id, ...) → json | 카테고리별 ROI |
| 61 | `get_roi_summary` | (p_org_id, ...) → json | ROI 요약 |
| 62 | `get_strategy_roi_trend` | (p_org_id, ...) → record[] | 전략 ROI 추세 |
| 63 | `get_visit_statistics` | (p_store_id, ...) → record[] | 방문 통계 |
| 64 | `get_category_affinities` | (p_store_id, ...) → record[] | 카테고리 친화도 |

> 💡 이 9개는 유용한 함수이나 현재 어떤 UI에서도 호출하지 않음. 향후 대시보드 확장 시 활용 가능.

#### VMD/Furniture RPCs (6개) — VMD 기능 미완성

| # | RPC Function | Notes |
|---|-------------|-------|
| 65 | `calculate_furniture_visibility` | 가구 가시성 계산 |
| 66 | `check_slot_display_compatibility` | 슬롯-디스플레이 호환성 |
| 67 | `check_slot_product_compatibility` | 슬롯-상품 호환성 |
| 68 | `get_applicable_vmd_rules` | 적용 가능한 VMD 규칙 |
| 69 | `get_available_slots_for_display_type` | 디스플레이별 가용 슬롯 |
| 70 | `get_compatible_slots_for_product` | 상품별 호환 슬롯 |

> 💡 VMD (Visual Merchandising Display) 기능이 EF의 `_shared/vmd/` 수준까지 구현되어 있으나, 이 RPC들은 OS Dashboard에서 호출하지 않음. D팀 확장 대상.

#### Data Management RPCs (5개)

| # | RPC Function | Notes |
|---|-------------|-------|
| 71 | `ensure_system_context_connections` | 시스템 컨텍스트 연결 초기화 |
| 72 | `get_all_data_sources` | 전체 데이터소스 목록 |
| 73 | `get_context_data_sources` | 컨텍스트 데이터소스 |
| 74 | `get_sync_statistics` | 싱크 통계 |
| 75 | `get_sync_status` | 싱크 상태 |

> ⚠️ `ensure_system_context_connections`와 `get_all_data_sources`는 이전 분석에서 OS Dashboard 호출로 보고되었으나, 정밀 코드 검색 결과 실제 `.rpc()` 호출 없음 확인. 과거 코드에서 제거된 것으로 추정.

#### Utility RPCs (6개)

| # | RPC Function | Notes |
|---|-------------|-------|
| 76 | `cleanup_old_ai_response_logs` | AI 응답 로그 정리 (days_to_keep) |
| 77 | `cleanup_old_batch_test_results` | 배치 테스트 결과 정리 (days_to_keep) |
| 78 | `ensure_store_persona` | 매장 페르소나 초기화 |
| 79 | `export_public_schema` | 퍼블릭 스키마 내보내기 |
| 80 | `generate_sample_sales_data` | 샘플 매출 데이터 생성 |
| 81 | `generate_sample_visit_data` | 샘플 방문 데이터 생성 |

> 💡 `cleanup_*` 함수들은 pg_cron 스케줄 작업으로 실행될 수 있음 — Supabase Dashboard에서 cron 설정 확인 필요.
> 💡 `generate_sample_*` 함수들은 개발/데모용으로, 프로덕션에서는 불필요.

#### Cache/Concept RPCs (3개)

| # | RPC Function | Notes |
|---|-------------|-------|
| 82 | `get_api_mapping_template` | API 매핑 템플릿 조회 |
| 83 | `get_cached_concept_value` | 캐시된 개념 값 조회 |
| 84 | `save_concept_value` | 개념 값 저장 |

#### User RPCs (1개)

| # | RPC Function | Notes |
|---|-------------|-------|
| 85 | `get_user_orgs` | 사용자 조직 목록 (v_user_orgs 뷰로 대체 가능) |

---

## 4. RPC Dependency Map by Edge Function

```
neuraltwin-assistant (11 RPCs — 최다 호출)
├── get_overview_kpis
├── get_zone_metrics
├── get_customer_segments
├── get_product_performance
├── get_inventory_status
├── get_store_goals
├── get_hourly_entry_counts
├── get_zones_dim_list
├── get_applied_strategies
├── get_inventory_movements
└── get_data_control_tower_status (×3 call sites)

advanced-ai-inference (3 RPCs)
├── get_success_patterns
├── get_failure_patterns
└── calculate_confidence_adjustment

retail-chatbot (4 RPCs)
├── search_knowledge
├── search_knowledge_trgm
├── handover_chat_session
└── increment_chat_message_count ⚠️

retail-ai-inference (1 RPC)
└── compute_all_retail_concepts

graph-query (2 RPCs)
├── graph_n_hop_query
└── graph_shortest_path

_shared/persona (1 RPC)
└── get_store_persona_context ⚠️

_shared/chatLogger (2 RPCs)
├── handover_chat_session
└── increment_chat_message_count ⚠️
```

## 5. RPC Dependency Map by OS Dashboard Hook

```
useDataControlTower.ts (3 RPCs)
├── get_data_control_tower_status
├── calculate_data_quality_score
└── get_kpi_lineage

useRetailOntology.ts (5 RPCs — 최다 OS 호출)
├── compute_all_retail_concepts
├── compute_zone_conversion_funnel
├── compute_cross_sell_affinity
├── compute_inventory_turnover
└── compute_zone_heatmap

useLearningFeedback.ts (4 RPCs)
├── aggregate_ai_performance
├── get_success_patterns
├── get_failure_patterns
└── calculate_confidence_adjustment

useApiConnector.ts (2 RPCs)
├── get_api_connections_dashboard
└── create_api_connection

useOntologyData.ts (1 RPC)
└── graph_n_hop_query

InsightDataContext.tsx (1 RPC)
└── get_hourly_entry_counts

SyncHistoryTable.tsx (1 RPC)
└── get_sync_history

useAuth.tsx (1 RPC)
└── migrate_user_to_organization
```

---

## 6. Triggers & Policies Summary

### Triggers
**schema.sql 및 migration 파일에서 CREATE TRIGGER 발견: 0건**

> ⚠️ 트리거가 프로덕션 DB에 존재할 수 있으나 로컬 스키마 덤프에 미포함.
> Sprint B에서 Supabase MCP `information_schema.triggers` 조회 필요.

### RLS Policies (확인된 것만)

| # | Table | Policy | Function Used |
|---|-------|--------|---------------|
| 1 | `ontology_entity_types` | "View master and own entity types" | `is_org_member(auth.uid(), org_id)` |
| 2 | `ontology_relation_types` | "View master and own relation types" | `is_org_member(auth.uid(), org_id)` |
| 3 | `store_personas` | "*_select/insert/update_policy" | USING (true) — 함수 미사용 |
| 4 | `layout_optimization_results` | "*_select/insert/update_policy" | USING (true) — 함수 미사용 |
| 5 | `vmd_rulesets` | "vmd_rulesets_select_policy" | USING (true) — 함수 미사용 |

> **⚠️ 이것은 migration 파일에서 확인된 것만임.** 프로덕션 DB에는 153개 테이블 × 4~5개 정책 = 수백 개의 RLS 정책이 존재할 수 있음. 대부분 `is_org_member()`, `is_org_admin()` 등 Auth RPC를 사용할 것으로 추정.

---

## 7. Classification Summary

### 판정 분포

```
85 RPC Functions
├── ✅ ACTIVE: 33 (38.8%)
│   ├── Shared (EF + OS): 7
│   ├── EF Only: 15 (neuraltwin-assistant: 11, retail-chatbot: 4)
│   └── OS Only: 11
├── 🔵 INTERNAL: 8 (9.4%)
│   └── Auth/RLS: 8 (is_org_*, can_access_*, has_valid_*)
└── 🔴 UNUSED: 44 (51.8%)
    ├── Sync/Import: 14
    ├── Analytics/Reporting: 9
    ├── VMD/Furniture: 6
    ├── Data Management: 5
    ├── Utility: 6
    ├── Cache/Concept: 3
    └── User: 1
```

### 핵심 호출 패턴

| 패턴 | 설명 |
|------|------|
| **neuraltwin-assistant 집중** | EF RPC 호출의 50%가 neuraltwin-assistant에서 발생 (11/22) |
| **useRetailOntology 집중** | OS RPC 호출의 28%가 useRetailOntology.ts에서 발생 (5/18) |
| **Website 미사용** | 웹사이트는 RPC를 전혀 사용하지 않음 (EF invoke만 사용) |
| **Sync RPCs 고립** | 14개 Sync RPC가 모두 미호출 — EF가 직접 SQL로 구현 |

---

## 8. Sprint B Action Items

### 8.1 즉시 확인 필요

| Priority | Action | Target | Method |
|----------|--------|--------|--------|
| **P0** | RLS 정책 전수 조회 | 8개 Auth RPCs | `SELECT * FROM pg_policies WHERE qual LIKE '%is_org_%'` |
| **P0** | pg_cron 스케줄 확인 | cleanup_* 함수 | `SELECT * FROM cron.job` |
| **P0** | 함수 간 내부 호출 확인 | 14개 Sync RPCs | 함수 소스코드 조회 |
| **P1** | database.types.ts 갱신 | 2개 미등록 RPC | `pnpm supabase:gen-types` 재실행 |

### 8.2 삭제 후보 (P0 확인 후)

| Category | Count | Condition |
|----------|-------|-----------|
| Analytics/Reporting RPCs | 9 | UI 확장 계획 없으면 삭제 |
| VMD/Furniture RPCs | 6 | D팀 VMD 확장 계획 확인 |
| Utility (sample/export) | 4 | 개발용 확인 후 삭제 |
| Cache/Concept RPCs | 3 | 다른 RPC에서 미호출 확인 후 삭제 |
| User RPCs | 1 | v_user_orgs 뷰로 대체 확인 |

### 8.3 Sync RPC 중복 코드 정리

현재 **14개 Sync/Import RPC**가 DB에 정의되어 있으나, EF들(`sync-api-data`, `execute-import` 등)이 이 RPC를 호출하지 않고 **자체 로직으로 동일 기능을 구현**하고 있음.

두 가지 접근:
1. **RPC 삭제**: EF의 자체 구현을 유지, 중복 RPC 삭제
2. **EF 리팩토링**: EF가 RPC를 호출하도록 변경 (DB 레벨 트랜잭션 보장)

> 💡 권장: Sprint C에서 결정. 현재는 분석만.

---

## 9. 사용자 확인 요청 사항

1. **pg_cron 스케줄**: `cleanup_old_ai_response_logs`, `cleanup_old_batch_test_results`가 pg_cron으로 실행 중인지?
2. **VMD 확장 계획**: 6개 VMD RPC를 D팀에서 향후 사용할 예정인지?
3. **Analytics RPC 활용**: 9개 미사용 Analytics RPC 중 향후 대시보드에 연결할 계획인지?
4. **Sync RPC 전략**: EF 자체 구현 vs DB RPC 중 어떤 방향을 선호하는지?

---

> **Next Step**: Sprint A Step 3 — Edge Function 사용 현황 최종 확인
