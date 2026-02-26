# Phase 5 — Edge Function Traffic Report (사용 현황 최종 확인)

> Phase 5 Sprint A, Step 3 | 작성일: 2026-02-26
> 방법론: 코드 정적 분석 (`.functions.invoke()`, `fetch(/functions/)`, EF-to-EF 호출)
> 한계: 프로덕션 로그 미확인 — 라이브 트래픽 검증은 Supabase MCP `get_logs` 필요

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| **EF 디렉토리 (functions/)** | **47** (+_shared) |
| ✅ ACTIVE (프론트엔드 .invoke() 확인) | **21** |
| ✅ ACTIVE (EF-to-EF 호출만) | **1** |
| ⚠️ ENDPOINT (HTTP/cron/webhook, .invoke() 미사용) | **23** |
| 🔴 DEAD CANDIDATE (어디에서도 참조 없음) | **2** |
| 🟡 PHANTOM (프론트엔드에서 참조하나 디렉토리 미존재) | **11** |

### 🚨 Critical Finding

**11개 Phantom EF** — 프론트엔드 코드가 호출하지만 **실제 EF가 존재하지 않는** 함수들이 발견됨. 이 기능들은 런타임에 반드시 실패합니다.

---

## 2. EF Invocation Sources

### 2.1 OS Dashboard → EF (53 call sites, 27 unique EFs 참조)

| Rank | Edge Function | Call Sites | Key Files |
|------|--------------|------------|-----------|
| 1 | `unified-ai` | 10+ | useUnifiedAI.ts, useOntologyInference.ts, useAIRecommendations.ts, useEnhancedAIInference.ts, useDataSourceMapping.ts |
| 2 | `retail-ai-inference` | 9+ | useRetailAI.ts, useRetailOntology.ts, useSimulationAI.ts, useAIPrediction.ts |
| 3 | `generate-optimization` | 7+ | useSceneSimulation.ts, useLayoutSimulation.ts, useOptimization.ts, useStaffingSimulation.ts |
| 4 | `advanced-ai-inference` | 6+ | useEnhancedAIInference.ts, useCongestionSimulation.ts, useFlowSimulation.ts, useSceneSimulation.ts |
| 5 | `datasource-mapper` | 5 | useRetailOntology.ts (register, sync, infer, mappings, create) |
| 6 | `api-connector` | 4 | useApiConnector.ts (test, sync, preview, apply) |
| 7 | `auto-process-3d-models` | 3 | StorageManager.tsx, UnifiedDataUpload.tsx, ModelLayerManager.tsx |
| 8 | `run-simulation` | 3 | useAIInference.ts, useDataSourceMapping.ts, simulationStore.ts |
| 9 | `auto-map-etl` | 2 | SchemaMapper.tsx, UnifiedDataUpload.tsx |
| 10 | `unified-etl` | 2 | OntologyDataManagement.tsx, SchemaMapper.tsx |
| 11 | `analyze-3d-model` | 2 | StorageManager.tsx, ModelUploader.tsx |
| 12 | `environment-proxy` | 2 | environmentDataService.ts |
| 13 | `neuraltwin-assistant` | 1 | useAssistantChat.ts |
| 14 | `inventory-monitor` | 1 | useRealtimeInventory.ts |
| 15 | `replay-import` | 1 | useDataControlTower.ts |
| 16 | `etl-health` | 1 | useDataControlTower.ts |
| 17 | `aggregate-all-kpis` | 1 | UnifiedDataUpload.tsx |
| 18 | `process-wifi-data` | 1 | UnifiedDataUpload.tsx |
| 19 | `graph-query` | 1 | GraphQueryBuilder.tsx |
| 20 | `integrated-data-pipeline` | 1 | UnifiedDataUpload.tsx |

#### 🟡 OS Dashboard에서 참조하지만 EF 미존재 (9개 Phantom)

| Phantom EF | Call Site | Feature | Impact |
|------------|----------|---------|--------|
| `fetch-db-schema` | useSchemaMetadata.ts:33 | 스키마 메타데이터 | ❌ 런타임 실패 |
| `apply-sample-data` | useOnboarding.ts:324 | 온보딩 샘플 데이터 | ❌ 런타임 실패 |
| `pos-oauth-start` | usePOSIntegration.ts:276 | POS OAuth 시작 | ❌ 런타임 실패 |
| `pos-oauth-callback` | usePOSIntegration.ts:320 | POS OAuth 콜백 | ❌ 런타임 실패 |
| `sync-pos-data` | usePOSIntegration.ts:399 | POS 데이터 싱크 | ❌ 런타임 실패 |
| `auto-fix-data` | DataValidation.tsx:227 | 데이터 자동 수정 | ❌ 런타임 실패 |
| `validate-batch-files` | UnifiedDataUpload.tsx:379 | 배치 파일 검증 | ❌ 런타임 실패 |
| `generate-ai-recommendations` | UnifiedDataUpload.tsx:846 | AI 추천 생성 | ❌ 런타임 실패 |
| `link-3d-models` | ModelUploader.tsx:283 | 3D 모델 연결 | ❌ 런타임 실패 |

### 2.2 Website → EF (1 active + 1 commented)

| Edge Function | File | Status |
|--------------|------|--------|
| `submit-contact` | Contact.tsx:75 | ✅ Active |
| `create-checkout` | Subscribe.tsx:138 | 🟡 Commented out (Stripe 미구현) |

### 2.3 EF-to-EF Invocations (7 call sites, 3 caller EFs)

```
sync-api-data ──────→ api-connector          (invoke, line 131)
sync-api-data ──────→ integrated-data-pipeline (invoke, line 390)

integrated-data-pipeline ──→ validate-and-fix-csv 🟡    (invoke, line 95)
integrated-data-pipeline ──→ smart-ontology-mapping     (invoke, line 178)
integrated-data-pipeline ──→ unified-etl                (invoke, line 221)

etl-scheduler ──────→ unified-etl            (fetch, line 32)
replay-import ──────→ unified-etl            (fetch, line 197)
```

#### 🟡 EF-to-EF Phantom (1개)

| Phantom EF | Caller | Impact |
|------------|--------|--------|
| `validate-and-fix-csv` | integrated-data-pipeline:95 | ❌ 파이프라인 Step 1 실패 (validate-data와 다른 이름) |

---

## 3. Complete EF Classification (47개)

### ✅ ACTIVE — Frontend .invoke() 확인 (21개)

| # | Edge Function | OS Calls | Web Calls | EF-to-EF Target | Primary Purpose |
|---|--------------|----------|-----------|-----------------|-----------------|
| 1 | `unified-ai` | 10+ | — | — | AI 추론/추천 통합 게이트웨이 |
| 2 | `retail-ai-inference` | 9+ | — | — | 리테일 특화 AI 추론 |
| 3 | `generate-optimization` | 7+ | — | — | 매장 레이아웃/운영 최적화 |
| 4 | `advanced-ai-inference` | 6+ | — | — | 고급 AI 추론 (시뮬레이션) |
| 5 | `datasource-mapper` | 5 | — | — | 데이터소스 온톨로지 매핑 |
| 6 | `api-connector` | 4 | — | ← sync-api-data | API 연결/싱크 |
| 7 | `auto-process-3d-models` | 3 | — | — | 3D 모델 자동 처리 |
| 8 | `run-simulation` | 3 | — | — | 시뮬레이션 실행 |
| 9 | `auto-map-etl` | 2 | — | — | ETL 자동 매핑 |
| 10 | `unified-etl` | 2 | — | ← integrated-data-pipeline, etl-scheduler, replay-import | ETL 파이프라인 핵심 |
| 11 | `analyze-3d-model` | 2 | — | — | 3D 모델 분석 |
| 12 | `environment-proxy` | 2 | — | — | 날씨/환경 데이터 프록시 |
| 13 | `neuraltwin-assistant` | 1 | — | — | AI 어시스턴트 채팅 |
| 14 | `inventory-monitor` | 1 | — | — | 실시간 재고 모니터링 |
| 15 | `replay-import` | 1 | — | → unified-etl | 임포트 재실행 |
| 16 | `etl-health` | 1 | — | — | ETL 상태 체크 |
| 17 | `aggregate-all-kpis` | 1 | — | — | KPI 전체 집계 |
| 18 | `process-wifi-data` | 1 | — | — | WiFi 센서 데이터 처리 |
| 19 | `graph-query` | 1 | — | — | 온톨로지 그래프 쿼리 |
| 20 | `integrated-data-pipeline` | 1 | — | → smart-ontology-mapping, unified-etl, ~~validate-and-fix-csv~~ | 통합 데이터 파이프라인 |
| 21 | `submit-contact` | — | 1 | — | 문의 양식 제출 |

### ✅ ACTIVE — EF-to-EF Only (1개)

| # | Edge Function | Caller | Purpose |
|---|--------------|--------|---------|
| 22 | `smart-ontology-mapping` | integrated-data-pipeline:178 | AI 온톨로지 매핑 (캐시 사용) |

### ⚠️ ENDPOINT — .invoke() 미발견, HTTP/cron/webhook 추정 (23개)

#### Cron/Scheduled 추정 (6개)

| # | Edge Function | Trigger Type | Evidence |
|---|--------------|-------------|---------|
| 23 | `etl-scheduler` | Cron (→ unified-etl 호출) | 코드 내 cron 패턴, EF-to-EF 호출 확인 |
| 24 | `sync-api-data` | Cron/Schedule (→ api-connector, integrated-data-pipeline 호출) | data_sync_schedules 테이블 참조 |
| 25 | `sync-holidays` | Cron | external_data_sources + holidays_events 업데이트 |
| 26 | `sync-poi-context` | Cron | store_trade_area_context 업데이트 |
| 27 | `sync-preset-data` | Cron | economic_indicators, weather_data, regional_data 업데이트 |
| 28 | `sync-trend-signals` | Cron | trend_signals 업데이트 |

#### Upload/Import Pipeline 추정 (7개)

| # | Edge Function | Pipeline Role | Evidence |
|---|--------------|--------------|---------|
| 29 | `upload-file` | 파일 업로드 → Storage | upload_sessions 테이블 참조 |
| 30 | `parse-file` | 파일 파싱 → raw_imports | raw_imports 테이블 참조 |
| 31 | `validate-data` | 데이터 검증 | raw_imports 검증 |
| 32 | `execute-import` | 임포트 실행 | transactions, line_items, inventory_levels 생성 |
| 33 | `quick-handler` | 빠른 임포트 (단일 파일) | upload → parse → validate → import 통합 |
| 34 | `rollback-import` | 임포트 롤백 | raw_imports, upload_sessions 정리 |
| 35 | `bright-processor` | 고급 파일 처리 | raw_imports, upload_sessions 처리 |

> 💡 이 EF들은 OS Dashboard의 upload/import UI에서 **직접 fetch()** 또는 **파이프라인 내부 호출**로 사용될 가능성이 높음. `.functions.invoke()` 패턴이 아닌 다른 호출 방식 사용 추정.

#### Data Processing 추정 (5개)

| # | Edge Function | Purpose | Evidence |
|---|--------------|---------|---------|
| 36 | `process-neuralsense-data` | NeuralSense IoT 데이터 처리 | visits, zone_events, funnel_events 생성 |
| 37 | `dynamic-responder` | 동적 데이터 쿼리 응답 | 다수 테이블 조회 (Step 1에서 확인) |
| 38 | `dynamic-handler` | 동적 요청 핸들러 | upload_sessions 참조 |
| 39 | `simulation-data-mapping` | 시뮬레이션 데이터 매핑 | 다수 테이블 조회 |
| 40 | `aggregate-dashboard-kpis` | 대시보드 KPI 집계 | dashboard_kpis, graph_entities 참조 |

#### Feature-Specific (5개)

| # | Edge Function | Purpose | Evidence |
|---|--------------|---------|---------|
| 41 | `retail-chatbot` | 웹사이트 채팅봇 (SSE 스트리밍) | chat_* 테이블 5개 참조 |
| 42 | `trigger-learning` | ML 학습 트리거 | learning_sessions, optimization_feedback 참조 |
| 43 | `import-with-ontology` | 온톨로지 기반 임포트 | graph_entities, user_data_imports 참조 |
| 44 | `knowledge-admin` | 지식 베이스 관리 | retail_knowledge_chunks 참조 |
| 45 | `hyper-task` | 태스크 오케스트레이터 | raw_imports, upload_sessions 참조 |

### 🔴 DEAD CANDIDATE — 어디에서도 참조 없음 (2개)

| # | Edge Function | Notes |
|---|--------------|-------|
| 46 | `generate-template` | 코드에서 어떤 참조도 발견되지 않음 |
| 47 | `upscale-image` | 코드에서 어떤 참조도 발견되지 않음 |

> ⚠️ 라이브 트래픽 로그로 최종 확인 필요. 외부 시스템에서 직접 호출하는 경우 코드 분석으로는 감지 불가.

---

## 4. 🟡 Phantom EFs — Critical Issue (11개)

**프론트엔드 코드가 호출하지만 EF 디렉토리가 존재하지 않는 함수들.**
이 기능들은 **사용자가 해당 UI를 사용하면 반드시 에러가 발생**합니다.

| # | Phantom EF | Caller | Feature | Severity |
|---|-----------|--------|---------|----------|
| 1 | `fetch-db-schema` | useSchemaMetadata.ts:33 | 스키마 메타데이터 뷰어 | 🟠 Medium |
| 2 | `apply-sample-data` | useOnboarding.ts:324 | 신규 매장 온보딩 | 🔴 High (온보딩 차단) |
| 3 | `pos-oauth-start` | usePOSIntegration.ts:276 | POS 시스템 연동 시작 | 🟠 Medium (미출시 기능) |
| 4 | `pos-oauth-callback` | usePOSIntegration.ts:320 | POS OAuth 콜백 | 🟠 Medium (미출시 기능) |
| 5 | `sync-pos-data` | usePOSIntegration.ts:399 | POS 데이터 동기화 | 🟠 Medium (미출시 기능) |
| 6 | `auto-fix-data` | DataValidation.tsx:227 | 데이터 자동 수정 | 🟠 Medium |
| 7 | `validate-batch-files` | UnifiedDataUpload.tsx:379 | 배치 파일 검증 | 🟡 Low (fallback 있을 수 있음) |
| 8 | `generate-ai-recommendations` | UnifiedDataUpload.tsx:846 | 업로드 후 AI 추천 생성 | 🟡 Low (후처리) |
| 9 | `link-3d-models` | ModelUploader.tsx:283 | 3D 모델 연결 | 🟠 Medium |
| 10 | `create-checkout` | Subscribe.tsx:138 (commented) | Stripe 결제 | ⚪ None (주석 처리) |
| 11 | `validate-and-fix-csv` | integrated-data-pipeline:95 (EF-to-EF) | CSV 검증+수정 | 🔴 High (파이프라인 Step 1 차단) |

### Phantom EF 조치 방안

| Action | Target | Description |
|--------|--------|-------------|
| **A. EF 신규 생성** | apply-sample-data, validate-and-fix-csv | 핵심 기능이므로 구현 필요 |
| **B. 프론트엔드 코드 정리** | pos-oauth-*, create-checkout | 미출시 기능 — UI에서 비활성화 또는 제거 |
| **C. 기존 EF로 라우팅** | validate-batch-files → validate-data, generate-ai-recommendations → unified-ai | 이름만 다른 중복 가능성 |
| **D. 추가 조사** | fetch-db-schema, auto-fix-data, link-3d-models | 기존 EF의 엔드포인트로 대체 가능한지 확인 |

---

## 5. EF Dependency Graph

```
                    ┌─────────────────────────────────────────────┐
                    │           FRONTEND LAYER                     │
                    │                                              │
                    │  OS Dashboard (53 call sites → 20 EFs)       │
                    │  Website (1 call site → 1 EF)                │
                    └───────────┬─────────────────────────────────┘
                                │ .functions.invoke()
                    ┌───────────▼─────────────────────────────────┐
                    │           EF LAYER (47 functions)             │
                    │                                              │
    AI Tier         │  unified-ai ←──── 10+ calls (최다 호출)       │
                    │  retail-ai-inference ←── 9+ calls            │
                    │  advanced-ai-inference ←── 6+ calls          │
                    │  generate-optimization ←── 7+ calls          │
                    │  neuraltwin-assistant ←── 1 call (SSE)       │
                    │                                              │
    Data Tier       │  ┌──── sync-api-data ────┐                   │
    (Pipeline)      │  │         │              │                   │
                    │  │  api-connector   integrated-data-pipeline  │
                    │  │                    │    │    │              │
                    │  │        validate-and-fix-csv 🟡              │
                    │  │              smart-ontology-mapping         │
                    │  │                         │                   │
                    │  │  etl-scheduler ──→ unified-etl ←── replay  │
                    │  │                                            │
                    │  └── upload-file → parse-file → validate      │
                    │       → execute-import / quick-handler         │
                    │                                              │
    Sync Tier       │  sync-holidays, sync-poi-context              │
    (Cron)          │  sync-preset-data, sync-trend-signals         │
                    │                                              │
    IoT Tier        │  process-neuralsense-data, process-wifi-data  │
                    │                                              │
    Query Tier      │  graph-query, dynamic-responder               │
                    │  simulation-data-mapping                      │
                    │                                              │
    Dead?           │  generate-template 🔴, upscale-image 🔴       │
                    └─────────────────────────────────────────────┘
```

---

## 6. Supabase MCP 라이브 트래픽 검증 명령

아래 명령으로 프로덕션 로그를 확인하여 코드 분석을 검증할 수 있습니다:

### 6.1 전체 EF 호출 수 확인 (최근 24시간)

```sql
-- Supabase MCP get_logs 또는 execute_sql 사용
-- Edge Function 로그 조회
SELECT
  metadata->>'function_name' as ef_name,
  count(*) as call_count,
  avg((metadata->>'execution_time_ms')::int) as avg_ms,
  count(*) FILTER (WHERE metadata->>'status_code' != '200') as error_count
FROM edge_logs
WHERE timestamp > now() - interval '24 hours'
GROUP BY ef_name
ORDER BY call_count DESC;
```

### 6.2 Dead EF 확인 (호출 0 검증)

```sql
-- generate-template, upscale-image이 정말 호출 0인지
SELECT
  metadata->>'function_name' as ef_name,
  count(*) as call_count
FROM edge_logs
WHERE metadata->>'function_name' IN ('generate-template', 'upscale-image')
  AND timestamp > now() - interval '7 days'
GROUP BY ef_name;
```

### 6.3 Phantom EF 에러 확인

```sql
-- Phantom EF 호출 시도 → 404 에러 발생 확인
SELECT
  metadata->>'function_name' as ef_name,
  metadata->>'status_code' as status,
  count(*) as error_count
FROM edge_logs
WHERE metadata->>'function_name' IN (
  'fetch-db-schema', 'apply-sample-data', 'pos-oauth-start',
  'pos-oauth-callback', 'sync-pos-data', 'auto-fix-data',
  'validate-batch-files', 'generate-ai-recommendations',
  'link-3d-models', 'validate-and-fix-csv'
)
  AND timestamp > now() - interval '7 days'
GROUP BY ef_name, status;
```

---

## 7. Sprint B Action Items

### 7.1 🚨 P0 — 즉시 조치 (Phantom EFs)

| Action | Target | Description |
|--------|--------|-------------|
| **조사** | 11개 Phantom EFs | 라이브 트래픽 로그로 실제 에러 발생 여부 확인 |
| **수정** | `validate-and-fix-csv` | integrated-data-pipeline이 호출하는 Step 1 — `validate-data`로 라우팅 또는 신규 생성 |
| **수정** | `apply-sample-data` | 온보딩 플로우 차단 — 신규 생성 또는 대체 로직 |

### 7.2 P1 — Dead EF 확인 및 삭제

| Action | Target | Condition |
|--------|--------|-----------|
| **로그 확인** | generate-template | 7일간 호출 0이면 삭제 |
| **로그 확인** | upscale-image | 7일간 호출 0이면 삭제 |

### 7.3 P2 — ENDPOINT EFs 트래픽 확인

| Category | Count | Action |
|----------|-------|--------|
| Cron/Scheduled | 6 | Supabase Dashboard에서 cron 설정 확인 |
| Upload/Import Pipeline | 7 | 호출 패턴 확인 (fetch vs invoke) |
| Data Processing | 5 | 트래픽 유무 확인 |
| Feature-Specific | 5 | 트래픽 유무 확인 |

### 7.4 P3 — 프론트엔드 정리

| Action | Target | Description |
|--------|--------|-------------|
| **비활성화** | POS Integration UI | pos-oauth-*, sync-pos-data 미존재 → UI 숨김 |
| **정리** | create-checkout (commented) | 주석 코드 제거 또는 TODO 명시 |
| **매핑** | validate-batch-files, generate-ai-recommendations | 기존 EF로 이름 변경 가능한지 확인 |

---

## 8. 사용자 확인 요청 사항

1. **Phantom EF 우선순위**: 11개 중 어떤 것을 먼저 수정해야 하나요?
   - `apply-sample-data` (온보딩) vs `validate-and-fix-csv` (데이터 파이프라인)
2. **POS Integration**: pos-oauth-*, sync-pos-data는 향후 구현 예정인가요, 아니면 UI를 숨겨야 하나요?
3. **generate-template / upscale-image**: 이 EF들의 용도를 아시나요? 프로덕션 로그 확인 전에 삭제해도 되나요?
4. **retail-chatbot**: 웹사이트 채팅에서 이 EF를 호출하는 경로가 있나요? (SSE/WebSocket 등 .invoke() 외 방식)

---

> **Next Step**: Sprint A Step 4 — Storage 버킷 분석
