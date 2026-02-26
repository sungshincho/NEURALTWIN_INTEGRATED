# Phase 5 — Table Usage Map (완전 매핑)

> Phase 5 Sprint A, Step 1 | 작성일: 2026-02-26
> 방법론: 코드 정적 분석 (`.from()`, `.rpc()`, EF invoke) + schema.sql + database.types.ts
> 이전 버전: Phase 4 TABLE_USAGE_MAP.md (2026-02-25) — 이 문서는 완전 대체판

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| **Total tables (schema.sql)** | **153** |
| ✅ ACTIVE (1개 이상 서비스에서 직접 참조) | **100** |
| ⚠️ STALE (테스트/RPC-only, 직접 참조 없음) | **3** |
| 🔴 UNUSED (어떤 코드에서도 참조 없음) | **48** |
| 🔵 SYSTEM (내부 헬퍼/뷰 테이블) | **2** |
| **DB Views** | **12** |
| **RPC Functions** | **83** |
| RPC — 코드에서 호출됨 | 30 |
| RPC — 미호출 (Dead 후보) | 53 |

### 서비스별 참조 수

| Service | Tables Referenced | Storage Buckets | EF Invocations |
|---------|-------------------|----------------|----------------|
| Edge Functions (47개) | 75 | — | — |
| OS Dashboard | 73 | 2 (3d-models, store-data) | 다수 |
| Website | 5 | 2 (avatars, chat-attachments) | 1 (submit-contact) |
| NeuralSense (IoT) | 0 (MQTT only) | — | — |

---

## 2. Methodology

### 분석 방법
1. **schema.sql** (2026-02-24 생성) — 153개 CREATE TABLE 문 추출
2. **database.types.ts** (11,603줄) — 테이블, 뷰, RPC 함수 정의 확인
3. **Edge Functions** (`supabase/supabase/functions/`) — 47개 EF의 모든 `.from()`, `.rpc()` 호출 수집
4. **OS Dashboard** (`apps/os-dashboard/src/`) — 95+ 파일의 `.from()`, `.rpc()` 호출 수집
5. **Website** (`apps/website/src/`) — 10개 파일의 `.from()`, `.rpc()`, `.functions.invoke()` 수집
6. **NeuralSense** (`apps/neuralsense/`) — Supabase 참조 없음 확인 (MQTT 전용)

### 판정 기준
- ✅ **ACTIVE**: 1개 이상 서비스(EF/OS/Web)에서 `.from('table')` 직접 참조
- ⚠️ **STALE**: 테스트 전용이거나 RPC 내부에서만 간접 참조 (직접 `.from()` 없음)
- 🔴 **UNUSED**: 어떤 코드에서도 참조 없음
- 🔵 **SYSTEM**: Supabase 내부 헬퍼 테이블 / materialized view

---

## 3. Complete Table Matrix (153 Tables)

> **범례**: EF = Edge Functions, OS = OS Dashboard, Web = Website
> **참조 수**: 해당 서비스에서 이 테이블을 사용하는 파일/함수 수

### ✅ ACTIVE Tables (100)

| # | Table | EF | OS | Web | Primary EFs | Classification |
|---|-------|----|----|-----|-------------|---------------|
| 1 | `ai_inference_results` | ✓(1) | ✓ | — | retail-ai-inference | ✅ AI Analytics |
| 2 | `ai_recommendations` | ✓(1) | ✓ | — | unified-ai | ✅ AI Analytics |
| 3 | `ai_response_logs` | ✓(1) | — | — | _shared/aiResponseLogger | ✅ AI Logging |
| 4 | `analysis_history` | — | ✓ | — | — | ✅ Analytics |
| 5 | `api_connections` | ✓(5) | ✓ | — | api-connector, sync-api-data, sync-preset-data, dynamic-responder, simulation-data-mapping | ✅ Integration |
| 6 | `api_mapping_templates` | ✓(1) | ✓ | — | api-connector | ✅ Integration |
| 7 | `api_sync_logs` | ✓(1) | ✓ | — | api-connector | ✅ Integration |
| 8 | `applied_strategies` | — | ✓ | — | — (RPC: get_applied_strategies) | ✅ Optimization |
| 9 | `auto_order_suggestions` | ✓(1) | ✓ | — | inventory-monitor | ✅ Inventory |
| 10 | `chat_context_memory` | ✓(1) | — | — | retail-chatbot | ✅ Chat |
| 11 | `chat_conversations` | ✓(2) | — | — | _shared/chatLogger, retail-chatbot | ✅ Chat |
| 12 | `chat_events` | ✓(3) | — | — | _shared/chatLogger, _shared/chatEventLogger, retail-chatbot | ✅ Chat |
| 13 | `chat_leads` | ✓(1) | — | — | retail-chatbot | ✅ Chat |
| 14 | `chat_messages` | ✓(2) | — | — | _shared/chatLogger, retail-chatbot | ✅ Chat |
| 15 | `contact_submissions` | ✓(1) | — | ✓(EF) | submit-contact | ✅ Communication |
| 16 | `customer_segments_agg` | — | ✓ | — | — (RPC: get_customer_segments) | ✅ Analytics |
| 17 | `customers` | ✓(3) | ✓ | — | dynamic-responder, simulation-data-mapping, unified-etl | ✅ Core Retail |
| 18 | `daily_kpis_agg` | ✓(6) | ✓ | — | etl-health, retail-ai-inference, unified-ai, unified-etl, run-simulation, generate-optimization | ✅ Analytics Core |
| 19 | `dashboard_kpis` | ✓(3) | ✓ | — | aggregate-all-kpis, aggregate-dashboard-kpis, dynamic-responder | ✅ Analytics |
| 20 | `data_source_sync_logs` | ✓(1) | — | — | datasource-mapper | ✅ ETL |
| 21 | `data_source_tables` | ✓(1) | — | — | datasource-mapper | ✅ ETL |
| 22 | `data_sources` | ✓(1) | ✓ | — | datasource-mapper | ✅ ETL |
| 23 | `data_sync_logs` | ✓(4) | — | — | sync-api-data, sync-holidays, sync-poi-context, sync-trend-signals | ✅ ETL |
| 24 | `data_sync_schedules` | ✓(1) | — | — | sync-api-data | ✅ ETL |
| 25 | `economic_indicators` | ✓(1) | ✓ | — | sync-preset-data | ✅ Context Data |
| 26 | `etl_runs` | ✓(4) | ✓ | — | etl-health, replay-import, process-neuralsense-data, unified-etl | ✅ ETL Core |
| 27 | `external_data_sources` | ✓(3) | — | — | sync-holidays, sync-poi-context, sync-trend-signals | ✅ Context Data |
| 28 | `feedback_reason_codes` | — | ✓ | — | — | ✅ Optimization |
| 29 | `funnel_events` | ✓(3) | ✓ | — | etl-health, process-neuralsense-data, unified-etl | ✅ Analytics |
| 30 | `funnel_metrics` | — | ✓ | — | — | ✅ Analytics |
| 31 | `furniture` | ✓(3) | ✓ | — | advanced-ai-inference, generate-optimization, run-simulation | ✅ 3D/Layout |
| 32 | `furniture_slots` | ✓(2) | ✓ | — | advanced-ai-inference, generate-optimization | ✅ 3D/Layout |
| 33 | `graph_entities` | ✓(12) | ✓ | — | aggregate-*, auto-process-3d-models, dynamic-responder, graph-query, import-with-ontology, integrated-data-pipeline, retail-ai-inference, run-simulation, simulation-data-mapping, unified-ai, unified-etl | ✅ Ontology Core |
| 34 | `graph_relations` | ✓(9) | ✓ | — | dynamic-responder, graph-query, import-with-ontology, integrated-data-pipeline, retail-ai-inference, run-simulation, simulation-data-mapping, unified-ai, unified-etl | ✅ Ontology Core |
| 35 | `holidays_events` | ✓(3) | ✓ | — | environment-proxy, sync-holidays, sync-preset-data | ✅ Context Data |
| 36 | `hourly_metrics` | ✓(1) | ✓ | — | retail-ai-inference | ✅ Analytics |
| 37 | `inventory_levels` | ✓(4) | ✓ | — | dynamic-responder, execute-import, inventory-monitor, quick-handler | ✅ Inventory |
| 38 | `inventory_movements` | — | ✓ | — | — (RPC: get_inventory_movements) | ✅ Inventory |
| 39 | `invitations` | — | ✓ | — | — | ✅ Auth |
| 40 | `layout_optimization_results` | ✓(1) | ✓ | — | generate-optimization | ✅ Optimization |
| 41 | `learning_adjustments` | ✓(1) | — | — | generate-optimization (feedback) | ✅ ML Learning |
| 42 | `learning_sessions` | ✓(2) | — | — | generate-optimization, trigger-learning | ✅ ML Learning |
| 43 | `licenses` | — | ✓ | ✓ | — | ✅ Auth/Billing |
| 44 | `line_items` | ✓(5) | ✓ | — | execute-import, quick-handler, rollback-import, unified-etl, generate-optimization | ✅ Transactions |
| 45 | `model_3d_files` | — | ✓ | — | — | ✅ 3D Models |
| 46 | `notification_settings` | — | ✓ | — | — | ✅ User Settings |
| 47 | `ontology_entity_mappings` | ✓(1) | — | — | datasource-mapper | ✅ Ontology |
| 48 | `ontology_entity_types` | ✓(8) | ✓ | — | aggregate-*, analyze-3d-model, auto-map-etl, auto-process-3d-models, import-with-ontology, run-simulation, smart-ontology-mapping, unified-etl | ✅ Ontology |
| 49 | `ontology_mapping_cache` | ✓(1) | — | — | integrated-data-pipeline | ✅ Ontology |
| 50 | `ontology_relation_mappings` | ✓(1) | — | — | datasource-mapper | ✅ Ontology |
| 51 | `ontology_relation_types` | ✓(6) | ✓ | — | auto-map-etl, graph-query, import-with-ontology, run-simulation, unified-ai, unified-etl | ✅ Ontology |
| 52 | `ontology_schema_versions` | — | ✓ | — | — | ✅ Ontology |
| 53 | `optimization_feedback` | ✓(1) | ✓ | — | trigger-learning | ✅ Optimization |
| 54 | `optimization_tasks` | — | ✓ | — | — | ✅ Optimization |
| 55 | `organization_members` | ✓(5) | ✓ | ✓ | neuraltwin-assistant, sync-holidays, sync-poi-context, sync-preset-data, sync-trend-signals | ✅ Auth Core |
| 56 | `organization_settings` | — | ✓ | — | — | ✅ Settings |
| 57 | `organizations` | ✓(1) | — | ✓ | etl-scheduler | ✅ Auth Core |
| 58 | `pos_integrations` | — | ✓ | — | — | ✅ Integration |
| 59 | `prediction_records` | ✓(1) | — | — | generate-optimization (feedback) | ✅ ML Learning |
| 60 | `product_associations` | ✓(1) | — | — | generate-optimization | ✅ Analytics |
| 61 | `product_models` | — | ✓ | — | — | ✅ 3D Models |
| 62 | `product_performance_agg` | ✓(1) | ✓ | — | generate-optimization | ✅ Analytics |
| 63 | `product_placements` | ✓(1) | ✓ | — | generate-optimization | ✅ 3D/Layout |
| 64 | `products` | ✓(7) | ✓ | — | advanced-ai-inference, dynamic-responder, execute-import, generate-optimization, quick-handler, sync-trend-signals, unified-etl | ✅ Core Retail |
| 65 | `profiles` | — | — | ✓ | — | ✅ Auth |
| 66 | `purchases` | ✓(3) | ✓ | — | dynamic-responder, simulation-data-mapping, unified-etl | ✅ Core Retail |
| 67 | `raw_imports` | ✓(14) | ✓ | — | api-connector, bright-processor, etl-health, execute-import, hyper-task, import-with-ontology, parse-file, process-neuralsense-data, quick-handler, replay-import, rollback-import, sync-api-data, unified-etl, validate-data | ✅ ETL Core |
| 68 | `realtime_inventory` | — | ✓ | — | — | ✅ Inventory |
| 69 | `recommendation_applications` | — | ✓ | — | — | ✅ Optimization |
| 70 | `regional_data` | ✓(1) | ✓ | — | sync-preset-data | ✅ Context Data |
| 71 | `retail_concepts` | — | ✓ | — | — | ✅ Ontology |
| 72 | `retail_knowledge_chunks` | ✓(2) | — | — | knowledge-admin, retail-chatbot | ✅ Chat/Knowledge |
| 73 | `simulation_history` | ✓(1) | ✓ | — | run-simulation | ✅ Simulation |
| 74 | `staff` | ✓(2) | ✓ | — | advanced-ai-inference, generate-optimization | ✅ Core Retail |
| 75 | `staff_assignments` | — | ✓ | — | — | ✅ Staff Mgmt |
| 76 | `store_goals` | — | ✓ | — | — (RPC: get_store_goals) | ✅ Goals |
| 77 | `store_personas` | ✓(2) | ✓ | — | _shared/persona/storePersonaLoader, trigger-learning | ✅ AI Persona |
| 78 | `store_scenes` | — | ✓ | — | — | ✅ 3D/Layout |
| 79 | `store_trade_area_context` | ✓(1) | — | — | sync-poi-context | ✅ Context Data |
| 80 | `store_visits` | ✓(1) | ✓ | — | retail-ai-inference | ✅ Analytics |
| 81 | `stored_model_parameters` | ✓(1) | — | — | generate-optimization (feedback) | ✅ ML Learning |
| 82 | `stores` | ✓(7) | ✓ | — | aggregate-*, generate-optimization, neuraltwin-assistant, process-wifi-data, sync-poi-context, unified-etl | ✅ Core Retail |
| 83 | `strategy_feedback` | ✓(1) | ✓ | — | advanced-ai-inference (learning) | ✅ Optimization |
| 84 | `subscriptions` | — | ✓ | ✓ | — | ✅ Auth/Billing |
| 85 | `transactions` | ✓(3) | ✓ | — | execute-import, quick-handler, unified-etl | ✅ Transactions |
| 86 | `trend_signals` | ✓(1) | — | — | sync-trend-signals | ✅ Context Data |
| 87 | `upload_sessions` | ✓(9) | ✓ | — | bright-processor, dynamic-handler, execute-import, hyper-task, parse-file, quick-handler, rollback-import, upload-file, validate-data | ✅ ETL Core |
| 88 | `user_activity_logs` | — | ✓ | — | — | ✅ Audit |
| 89 | `user_alerts` | — | ✓ | — | — | ✅ Alerts |
| 90 | `user_data_imports` | ✓(8) | ✓ | — | execute-import, import-with-ontology, integrated-data-pipeline, quick-handler, rollback-import, smart-ontology-mapping, sync-api-data, unified-etl | ✅ ETL Core |
| 91 | `visits` | ✓(4) | — | — | process-neuralsense-data, unified-etl, dynamic-responder, simulation-data-mapping | ✅ Analytics |
| 92 | `vmd_rule_applications` | ✓(1) | — | — | _shared/vmd/vmdRulesetLoader | ✅ VMD |
| 93 | `vmd_rulesets` | ✓(1) | — | — | _shared/vmd/vmdRulesetLoader | ✅ VMD |
| 94 | `weather_data` | ✓(3) | ✓ | — | environment-proxy, sync-preset-data, generate-optimization | ✅ Context Data |
| 95 | `wifi_tracking` | ✓(2) | ✓ | — | dynamic-responder/simulation-data-mapping, process-wifi-data | ✅ IoT Data |
| 96 | `wifi_zones` | ✓(1) | ✓ | — | process-wifi-data | ✅ IoT Config |
| 97 | `zone_daily_metrics` | ✓(4) | ✓ | — | generate-optimization, retail-ai-inference, run-simulation, unified-etl | ✅ Analytics Core |
| 98 | `zone_events` | ✓(3) | ✓ | — | etl-health, process-neuralsense-data, unified-etl | ✅ IoT Events |
| 99 | `zone_transitions` | ✓(3) | ✓ | — | generate-optimization, run-simulation, unified-etl | ✅ Analytics |
| 100 | `zones_dim` | ✓(6) | ✓ | — | advanced-ai-inference, generate-optimization, process-neuralsense-data, retail-ai-inference, run-simulation, unified-etl | ✅ Core Retail |

---

### ⚠️ STALE Tables (3)

| # | Table | Reason | Notes |
|---|-------|--------|-------|
| 1 | `ai_batch_test_results` | Test 인프라 전용 | ai-batch-qa-test EF에서만 사용, 프로덕션 비즈니스 로직 아님 |
| 2 | `ai_model_performance` | RPC-only 간접 참조 | `aggregate_ai_performance` RPC 내부에서 사용 가능성, 직접 `.from()` 없음 |
| 3 | `roi_measurements` | RPC-only 간접 참조 | `get_roi_summary`, `get_roi_by_category` RPC 내부에서 사용 가능성, 직접 `.from()` 없음 |

---

### 🔴 UNUSED Tables (48)

#### Deprecated/Replaced (10) — 신규 테이블이 대체

| # | Unused Table | Replacement | Notes |
|---|-------------|-------------|-------|
| 1 | `alerts` | `user_alerts` | 일반 알림 → 사용자별 알림 |
| 2 | `customer_segments` | `customer_segments_agg` | 세그먼트 정의 → 집계 세그먼트 |
| 3 | `daily_sales` | `daily_kpis_agg` / `dashboard_kpis` | 단순 매출 → KPI 집계 |
| 4 | `inventory` | `inventory_levels` | 재고 원본 → 현재 재고 수준 |
| 5 | `kpis` | `dashboard_kpis` | KPI 정의 → 대시보드 KPI |
| 6 | `models` | `model_3d_files` | 모델 일반 → 3D 파일 전용 |
| 7 | `ontology_schemas` | `ontology_schema_versions` | 스키마 정의 → 버전 관리형 |
| 8 | `retail_concept_values` | `retail_concepts` | 개념 값 → 통합 개념 |
| 9 | `sync_endpoints` | `data_sources` / `api_connections` | 싱크 엔드포인트 → 통합 데이터소스 |
| 10 | `zone_metrics` | `zone_daily_metrics` | 존 메트릭 → 일별 집계 |

#### Unimplemented Features (22) — 기능 미구현 상태

| # | Table | Planned Feature | Notes |
|---|-------|----------------|-------|
| 11 | `beacon_events` | 블루투스 비콘 이벤트 | B팀 IoT 확장 예정 |
| 12 | `beacons` | 비콘 디바이스 레지스트리 | B팀 IoT 확장 예정 |
| 13 | `camera_events` | 카메라/영상 이벤트 | 향후 비전 AI |
| 14 | `chat_daily_analytics` | 챗봇 일별 통계 | 미구현 |
| 15 | `furniture_facings` | 진열면 관리 | VMD 확장 예정 |
| 16 | `furniture_height_zones` | 높이별 진열 존 | VMD 확장 예정 |
| 17 | `hq_guidelines` | 본사 가이드라인 | 멀티매장 관리 미구현 |
| 18 | `hq_notifications` | 본사 알림 | 멀티매장 관리 미구현 |
| 19 | `hq_store_messages` | 본사↔매장 메시지 | 멀티매장 관리 미구현 |
| 20 | `onboarding_progress` | 온보딩 진행 추적 | 미구현 |
| 21 | `push_subscriptions` | 푸시 알림 구독 | 미구현 |
| 22 | `quickstart_guides` | 퀵스타트 가이드 | 미구현 |
| 23 | `shift_schedules` | 근무 스케줄 | 스태프 관리 확장 |
| 24 | `strategy_daily_metrics` | 전략 일별 메트릭 | 미구현 |
| 25 | `vmd_zone_types` | VMD 존 유형 | VMD 확장 예정 |
| 26 | `web_events` | 웹 이벤트 추적 | 웹 애널리틱스 미구현 |
| 27 | `wifi_events` | WiFi 이벤트 원시 데이터 | wifi_tracking으로 대체 |
| 28 | `zone_performance` | 존 성과 종합 | zone_daily_metrics으로 충분 |
| 29 | `assistant_command_cache` | AI 어시스턴트 캐시 | 미구현 |
| 30 | `ai_scene_analysis` | 씬 분석 결과 | 비전 AI 미구현 |
| 31 | `ai_insights` | AI 인사이트 | 직접 참조 없음 (UI 미연결) |
| 32 | `ai_inference_logs` | 추론 로그 | ai_response_logs로 대체 |

#### Partial/Legacy (10) — 레거시 또는 부분 구현

| # | Table | Notes |
|---|-------|-------|
| 33 | `column_mappings` | ETL 매핑 레거시 — ontology_entity_mappings로 대체 |
| 34 | `field_transform_rules` | ETL 변환 레거시 — ontology 기반으로 대체 |
| 35 | `import_type_schemas` | 임포트 스키마 — RPC get_import_schema로 대체 |
| 36 | `inventory_history` | 재고 이력 — inventory_movements로 대체 |
| 37 | `kpi_snapshots` | KPI 스냅샷 — daily_kpis_agg로 대체 |
| 38 | `license_billing_history` | 빌링 이력 — 미구현 결제 시스템 |
| 39 | `ontology_relation_inference_queue` | 온톨로지 추론 큐 — 미구현 |
| 40 | `realtime_transactions` | 실시간 트랜잭션 — transactions으로 충분 |
| 41 | `report_schedules` | 리포트 스케줄 — 미구현 |
| 42 | `sample_data_templates` | 샘플 데이터 — 개발용 |

#### Fully Unused (6) — 용도 불명

| # | Table | Notes |
|---|-------|-------|
| 43 | `scenarios` | 시나리오 정의 — simulation_history가 대체 |
| 44 | `simulation_configs` | 시뮬레이션 설정 — simulation_history.parameters로 통합 |
| 45 | `store_comments` | 매장 코멘트 — 미사용 |
| 46 | `sync_logs` | 싱크 로그 — data_sync_logs로 대체 |
| 47 | `tasks` | 태스크 — optimization_tasks로 대체 |
| 48 | `user_guide_completions` | 가이드 완료 추적 — 미구현 |

---

### 🔵 SYSTEM Tables (2)

| # | Table | Purpose |
|---|-------|---------|
| 1 | `v_org_id` | RLS 정책용 org_id 헬퍼 테이블 |
| 2 | `visit_zone_events` | 방문-존 매핑 헬퍼 테이블 (내부 ETL) |

---

## 4. DB Views (12)

| View | Purpose | Used in Code |
|------|---------|-------------|
| `ai_parse_success_stats` | AI 파싱 성공률 | ⚠️ 미확인 |
| `v_ai_response_stats` | AI 응답 통계 | ⚠️ 미확인 |
| `v_batch_test_failures` | 배치 테스트 실패 분석 | ⚠️ 테스트 전용 |
| `v_batch_test_linked_analysis` | 배치 테스트 링크 분석 | ⚠️ 테스트 전용 |
| `v_batch_test_scenario_stats` | 시나리오별 배치 통계 | ⚠️ 테스트 전용 |
| `v_batch_test_summary` | 배치 테스트 요약 | ⚠️ 테스트 전용 |
| `v_finetuning_dataset` | AI 파인튜닝 데이터셋 | ⚠️ 미확인 |
| `v_furniture_vmd_summary` | 가구 VMD 요약 | ✅ OS Dashboard |
| `v_user_orgs` | 사용자 조직 매핑 | ✅ Auth |
| `v_vmd_rules_summary` | VMD 규칙 요약 | ✅ OS Dashboard |
| `v_zone_vmd_summary` | 존 VMD 요약 | ✅ OS Dashboard |
| `zones` | 존 정보 뷰 | ✅ OS Dashboard |

---

## 5. RPC Functions Analysis (83 Total)

### 5.1 Active RPCs — 코드에서 직접 호출 (30)

#### Edge Functions에서 호출

| RPC | Calling EF | Purpose |
|-----|-----------|---------|
| `compute_all_retail_concepts` | retail-ai-inference | 리테일 개념 계산 |
| `get_data_control_tower_status` | neuraltwin-assistant | 데이터 컨트롤 타워 |
| `get_overview_kpis` | neuraltwin-assistant | KPI 개요 |
| `get_zone_metrics` | neuraltwin-assistant | 존 메트릭 |
| `get_customer_segments` | neuraltwin-assistant | 고객 세그먼트 |
| `get_product_performance` | neuraltwin-assistant | 상품 성과 |
| `get_inventory_status` | neuraltwin-assistant | 재고 현황 |
| `get_store_goals` | neuraltwin-assistant | 매장 목표 |
| `get_hourly_entry_counts` | neuraltwin-assistant | 시간별 입장 |
| `get_zones_dim_list` | neuraltwin-assistant | 존 목록 |
| `get_applied_strategies` | neuraltwin-assistant | 적용된 전략 |
| `get_inventory_movements` | neuraltwin-assistant | 재고 이동 |
| `get_success_patterns` | advanced-ai-inference | 성공 패턴 |
| `get_failure_patterns` | advanced-ai-inference | 실패 패턴 |
| `calculate_confidence_adjustment` | advanced-ai-inference | 신뢰도 조정 |
| `graph_n_hop_query` | graph-query | 그래프 N-hop 탐색 |
| `graph_shortest_path` | graph-query | 최단 경로 |
| `handover_chat_session` | retail-chatbot | 채팅 핸드오버 |
| `search_knowledge` | retail-chatbot | 지식 벡터 검색 |
| `search_knowledge_trgm` | retail-chatbot | 지식 트라이그램 검색 |

#### OS Dashboard에서 호출

| RPC | Feature Area | Purpose |
|-----|-------------|---------|
| `migrate_user_to_organization` | Auth | 사용자 조직 이전 |
| `calculate_data_quality_score` | Data Control | 데이터 품질 점수 |
| `get_kpi_lineage` | Data Control | KPI 리니지 |
| `get_context_data_sources` | Data Control | 컨텍스트 데이터소스 |
| `ensure_system_context_connections` | Data Control | 시스템 컨텍스트 초기화 |
| `get_all_data_sources` | Data Control | 전체 데이터소스 |
| `get_api_connections_dashboard` | API Connector | API 연결 대시보드 |
| `create_api_connection` | API Connector | API 연결 생성 |
| `get_sync_history` | API Connector | 싱크 이력 |
| `aggregate_ai_performance` | AI Prediction | AI 성과 집계 |
| `compute_zone_conversion_funnel` | Simulation | 존 전환 퍼널 |
| `compute_cross_sell_affinity` | Simulation | 교차 판매 친화도 |
| `compute_inventory_turnover` | Simulation | 재고 회전율 |

> Note: 일부 RPC는 EF와 OS 양쪽에서 호출 (get_success_patterns, get_failure_patterns, calculate_confidence_adjustment, graph_n_hop_query, get_hourly_entry_counts, compute_all_retail_concepts, get_data_control_tower_status)

### 5.2 Dead RPC Candidates (53) — 코드에서 호출 없음

#### Auth/Permission RPCs (7)
`can_access_membership`, `has_valid_license`, `is_org_admin`, `is_org_member`, `is_org_member_simple`, `is_org_member_with_license`, `is_org_owner`

> ⚠️ 이들은 RLS 정책에서 내부적으로 사용될 수 있음. 삭제 전 RLS 의존성 확인 필수.

#### Sync/Import RPCs (13)
`calculate_next_sync_time`, `create_import_session`, `create_sync_log`, `execute_api_sync`, `get_active_import_sessions`, `get_connection_settings`, `get_connections_due_for_sync`, `get_import_schema`, `get_import_target_table`, `record_sync_result`, `update_connection_after_sync`, `update_connection_settings`, `update_import_session_status`, `update_sync_log`

> ⚠️ sync-api-data, execute-import 등 EF 내부에서 SQL로 직접 호출 가능성.

#### Analytics/Compute RPCs (10)
`compute_zone_heatmap`, `get_daily_kpis_summary`, `get_funnel_stats`, `get_hourly_traffic`, `get_product_associations`, `get_roi_by_category`, `get_roi_summary`, `get_strategy_roi_trend`, `get_visit_statistics`, `get_user_role`

#### VMD/Furniture RPCs (6)
`calculate_furniture_visibility`, `check_slot_display_compatibility`, `check_slot_product_compatibility`, `get_applicable_vmd_rules`, `get_available_slots_for_display_type`, `get_compatible_slots_for_product`

#### Utility RPCs (6)
`cleanup_old_ai_response_logs`, `cleanup_old_batch_test_results`, `ensure_store_persona`, `export_public_schema`, `generate_sample_sales_data`, `generate_sample_visit_data`

#### Data RPCs (5)
`get_api_mapping_template`, `get_cached_concept_value`, `get_category_affinities`, `get_sync_statistics`, `get_sync_status`

#### Misc RPCs (6)
`get_user_orgs`, `save_concept_value`, `get_zone_metrics` (already listed as active — skip)

> **총 Dead RPC 후보: ~53개** (단, RLS 정책/트리거 내부 사용 가능성으로 삭제 전 DB 의존성 확인 필수)

---

## 6. Cross-Reference Patterns

### 6.1 Top 10 Most Referenced Tables

| Rank | Table | EF Refs | OS | Web | Total |
|------|-------|---------|----|----|-------|
| 1 | `raw_imports` | 14 | ✓ | — | **15+** |
| 2 | `graph_entities` | 12 | ✓ | — | **13+** |
| 3 | `upload_sessions` | 9 | ✓ | — | **10+** |
| 4 | `graph_relations` | 9 | ✓ | — | **10+** |
| 5 | `ontology_entity_types` | 8 | ✓ | — | **9+** |
| 6 | `user_data_imports` | 8 | ✓ | — | **9+** |
| 7 | `products` | 7 | ✓ | — | **8+** |
| 8 | `stores` | 7 | ✓ | — | **8+** |
| 9 | `daily_kpis_agg` | 6 | ✓ | — | **7+** |
| 10 | `ontology_relation_types` | 6 | ✓ | — | **7+** |

### 6.2 Cross-Layer Tables (EF + OS + Web)

| Table | EF | OS | Web | Role |
|-------|----|----|-----|------|
| `organization_members` | ✓ | ✓ | ✓ | Auth 백본 |
| `organizations` | ✓ | — | ✓ | 조직 관리 |
| `licenses` | — | ✓ | ✓ | 라이선스 |
| `subscriptions` | — | ✓ | ✓ | 구독 관리 |
| `contact_submissions` | ✓ | — | ✓(EF) | 문의 접수 |

### 6.3 EF-Only Tables (코드에서 EF만 참조)

`ai_response_logs`, `chat_context_memory`, `chat_conversations`, `chat_events`, `chat_leads`, `chat_messages`, `data_source_sync_logs`, `data_source_tables`, `data_sync_logs`, `data_sync_schedules`, `external_data_sources`, `learning_adjustments`, `learning_sessions`, `ontology_entity_mappings`, `ontology_mapping_cache`, `ontology_relation_mappings`, `prediction_records`, `product_associations`, `retail_knowledge_chunks`, `store_trade_area_context`, `stored_model_parameters`, `trend_signals`, `visits`, `vmd_rule_applications`, `vmd_rulesets`

> **25개 테이블** — 백엔드 ETL/AI 처리 전용

### 6.4 OS-Only Tables (OS Dashboard에서만 참조)

`analysis_history`, `applied_strategies`, `customer_segments_agg`, `feedback_reason_codes`, `funnel_metrics`, `inventory_movements`, `invitations`, `model_3d_files`, `notification_settings`, `optimization_tasks`, `organization_settings`, `pos_integrations`, `product_models`, `realtime_inventory`, `recommendation_applications`, `retail_concepts`, `staff_assignments`, `store_goals`, `store_scenes`, `user_activity_logs`, `user_alerts`, `ontology_schema_versions`

> **22개 테이블** — 대시보드 UI 전용

### 6.5 Web-Only Tables

`profiles`

> **1개 테이블** — 웹사이트 프로필 전용

---

## 7. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  L0 (Raw Input)                                                  │
│  ├── upload_sessions → parse-file → raw_imports                  │
│  ├── wifi_tracking ← process-wifi-data ← NeuralSense (MQTT)     │
│  └── api_connections → sync-api-data → raw_imports               │
│                                                                  │
│  L1 (Processed)                                                  │
│  ├── unified-etl: raw_imports → customers, products, purchases   │
│  ├── unified-etl: raw_imports → visits, zone_events, line_items  │
│  └── import-with-ontology: raw_imports → graph_entities/relations│
│                                                                  │
│  L2 (Aggregated)                                                 │
│  ├── daily_kpis_agg ← aggregate-dashboard-kpis                  │
│  ├── zone_daily_metrics ← unified-etl                            │
│  ├── product_performance_agg ← generate-optimization             │
│  └── dashboard_kpis ← aggregate-all-kpis                         │
│                                                                  │
│  L3 (AI/Insights)                                                │
│  ├── ai_inference_results ← retail-ai-inference                  │
│  ├── ai_recommendations ← unified-ai                             │
│  ├── layout_optimization_results ← generate-optimization         │
│  └── simulation_history ← run-simulation                         │
│                                                                  │
│  L4 (Presentation)                                               │
│  ├── OS Dashboard: 73 tables (READ-heavy, 2 REALTIME)            │
│  ├── Website: 5 tables (auth-only)                               │
│  └── NeuralTwin Assistant: via RPC (10+ functions)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Sprint B Action Items (Preview)

### 8.1 🔴 삭제 후보: UNUSED Tables (48개)

| Priority | Category | Count | Action |
|----------|---------|-------|--------|
| P1 (즉시) | Deprecated/Replaced | 10 | FK 의존성 확인 후 DROP |
| P2 (검토 후) | Fully Unused | 6 | 비즈니스 확인 후 DROP |
| P3 (보류) | Unimplemented Features | 22 | 로드맵 확인 — beacon/camera는 B팀 확인 필요 |
| P4 (정리) | Partial/Legacy | 10 | 데이터 마이그레이션 후 DROP |

### 8.2 ⚠️ STALE Tables (3개)

| Table | Action |
|-------|--------|
| `ai_batch_test_results` | 테스트 인프라로 유지 또는 아카이브 |
| `ai_model_performance` | RPC 내부 사용 확인 후 판정 |
| `roi_measurements` | RPC 내부 사용 확인 후 판정 |

### 8.3 Dead RPC 후보 (53개)

| Priority | Category | Count | Action |
|----------|---------|-------|--------|
| P1 | RLS 의존성 확인 필요 | 7 | Auth RPCs — RLS에서 사용 가능 |
| P2 | EF 내부 SQL 참조 확인 | 13 | Sync/Import RPCs |
| P3 | 미사용 확정 시 DROP | 33 | Analytics, VMD, Utility RPCs |

---

## 9. 사용자 확인 요청 사항

### ❓ UNUSED 판정 테이블 중 "향후 사용 예정" 확인 필요

1. **IoT 확장**: `beacon_events`, `beacons`, `camera_events` — B팀 로드맵에 있는지?
2. **HQ 기능**: `hq_guidelines`, `hq_notifications`, `hq_store_messages` — 멀티매장 관리 계획?
3. **VMD 확장**: `furniture_facings`, `furniture_height_zones`, `vmd_zone_types` — D팀 사용 예정?
4. **온보딩**: `onboarding_progress`, `quickstart_guides`, `user_guide_completions` — E팀 구현 예정?
5. **리포팅**: `report_schedules` — 예약 리포트 기능 계획?

### ❓ STALE RPC 중 RLS 의존성 확인 필요

- `is_org_member`, `is_org_admin`, `is_org_owner`, `has_valid_license`, `can_access_membership` 등 7개 Auth RPC는 RLS 정책에서 사용될 가능성이 높으므로, DB의 RLS 정책 소스를 확인한 후에만 삭제를 진행해야 합니다.

---

> **Next Step**: Sprint A Step 2 — RPC 함수 사용 현황 완전 매핑 (RLS 의존성 포함)
