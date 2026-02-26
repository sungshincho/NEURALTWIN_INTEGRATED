# Phase 5 — Edge Function Traffic Report (사용 현황 최종 확인)

> Phase 5 Sprint A, Step 3 | 작성일: 2026-02-26 | **라이브 트래픽 반영: 2026-02-26 05:37 UTC**
> 방법론: 코드 정적 분석 + **Supabase MCP `get_logs` 프로덕션 로그 검증**
> 라이브 데이터: 최근 24시간 (MCP API 제약으로 7/30일 조회 불가, 24h 기준)

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| **EF 디렉토리 (functions/)** | **47** (+_shared) |
| ✅ ACTIVE (프론트엔드 .invoke() 확인) | **21** |
| ✅ ACTIVE (EF-to-EF 호출만) | **1** |
| ⚠️ ENDPOINT (HTTP/cron/webhook, .invoke() 미사용) | **23** |
| 🔴 DEAD — 코드 참조 없음 + 트래픽 0 (확정) | **2** |
| 🟡 PHANTOM — 디렉토리 미존재 + 트래픽 0 (확정) | **10** (+1 주석) |

### 🚨 Critical Finding

**11개 Phantom EF** — 프론트엔드 코드가 호출하지만 **실제 EF가 존재하지 않는** 함수들이 발견됨. 이 기능들은 런타임에 반드시 실패합니다.

### 📊 라이브 트래픽 검증 결과 (2026-02-26 05:37 UTC, 24h)

| 항목 | 결과 |
|------|------|
| **활성 EF (트래픽 있음)** | **2개**: `environment-proxy` (55 POST), `retail-chatbot` (7 POST) |
| **Dead EF 확정** | `generate-template` (0호출), `upscale-image` (0호출) — **삭제 확정** |
| **Phantom EF 확정** | 10개 모두 24h 내 호출 기록 없음 — 런타임 에러 가능성 재확인 |
| **에러 발견** | `retail-chatbot` 401 에러 1건 (14.3% 에러율) |
| **성능 이슈** | `retail-chatbot` 평균 응답 18.7초 (AI 호출 포함) |
| **burst 패턴** | `environment-proxy` 단일 시점 20+ 동시 호출 |

> 상세 로그: [EF_LIVE_TRAFFIC.md](./EF_LIVE_TRAFFIC.md)

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

### 🔴 DEAD (확정) — 코드 참조 없음 + 프로덕션 트래픽 0 (2개)

| # | Edge Function | 코드 참조 | 24h 트래픽 | 판정 |
|---|--------------|----------|-----------|------|
| 46 | `generate-template` | 없음 | **0** | ✅ 삭제 대상 확정 |
| 47 | `upscale-image` | 없음 (EF_USAGE_MAP에 "unused" 표기) | **0** | ✅ 삭제 대상 확정 |

> ✅ **라이브 트래픽 검증 완료** (2026-02-26 05:37 UTC). 24시간 내 두 함수 모두 호출 기록 전무.
> 외부 시스템 호출 가능성도 낮음 (24h 제약이나, 코드 참조가 전혀 없으므로 삭제 안전).

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

## 6. 라이브 트래픽 검증 결과 (Supabase MCP `get_logs`)

> 검증 시각: 2026-02-26 05:37:27 UTC | 도구: Supabase MCP `get_logs`
> 데이터 범위: 최근 24시간 (MCP API 제약)

### 6.1 전체 EF 트래픽 (24시간)

| EF명 | Function ID | 호출 수 (POST) | 평균 응답시간(ms) | 에러 수 | 에러율 |
|------|------------|---------------|-----------------|--------|-------|
| **environment-proxy** | `39dd2418` | 55 | 887 | 0 | 0.0% |
| **retail-chatbot** | `df39cc4b` | 7 | 18,725 | 1 (401) | 14.3% |
| **합계** | — | **62** | **3,458** | **1** | **1.6%** |

**나머지 45개 EF: 24시간 내 POST 트래픽 0**

#### 발견 사항
- `retail-chatbot`: 401 에러 1건 — 인증 토큰 만료 또는 미인증 접근 시도
- `retail-chatbot`: 응답시간 5.5~28초 — Gemini API 호출 포함이므로 예상 범위이나, 스트리밍 전환 검토 권장
- `environment-proxy`: 단일 시점 20+ 동시 호출 burst 패턴 — 프론트엔드 중복 호출 여부 확인 필요

### 6.2 Dead EF 확인 — ✅ 확정

| EF명 | 24h 트래픽 | 코드 참조 | 판정 |
|------|-----------|----------|------|
| `generate-template` | **0** | 없음 | ✅ Dead 확정 — 삭제 |
| `upscale-image` | **0** | 없음 (EF_USAGE_MAP "unused") | ✅ Dead 확정 — 삭제 |

### 6.3 Phantom EF 확인 — ✅ 확정

| EF명 | 24h 호출 시도 | 에러 | 판정 |
|------|-------------|------|------|
| `fetch-db-schema` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `apply-sample-data` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `pos-oauth-start` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `pos-oauth-callback` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `sync-pos-data` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `auto-fix-data` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `validate-batch-files` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `generate-ai-recommendations` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `link-3d-models` | 0 | — | Phantom 확정 (디렉토리 미존재) |
| `validate-and-fix-csv` | 0 | — | Phantom 확정 (디렉토리 미존재, EF-to-EF) |

> **해석**: 10개 Phantom EF 모두 24시간 내 호출 시도조차 없음.
> 이는 해당 UI 기능이 아직 사용자에게 노출되지 않았거나 접근 빈도가 극히 낮다는 의미.
> 그러나 코드 참조가 존재하므로 사용자가 해당 기능에 접근하면 **즉시 런타임 에러 발생**.

---

## 7. Sprint B Action Items (라이브 트래픽 검증 반영)

### 7.1 🚨 P0 — 즉시 조치 (Phantom EFs — 확정)

> ✅ 라이브 트래픽 검증 완료. 조사 단계 종료, 수정 단계로 전환.

| Action | Target | Description | Severity |
|--------|--------|-------------|----------|
| **신규 생성 또는 대체** | `validate-and-fix-csv` | integrated-data-pipeline Step 1 차단 — `validate-data`로 라우팅 또는 신규 생성 | 🔴 Critical |
| **신규 생성 또는 대체** | `apply-sample-data` | 온보딩 플로우 차단 — 신규 생성 또는 대체 로직 | 🔴 Critical |
| **신규 생성 또는 대체** | `fetch-db-schema` | 스키마 메타데이터 로딩 실패 — useSchemaMetadata.ts 호출 | 🔴 High |
| **프론트엔드 수정** | 나머지 7개 Phantom | 미존재 EF 호출 코드에 에러 핸들링/fallback 추가 또는 UI 비활성화 | 🟠 Medium |

### 7.2 P0 — 활성 EF 이슈 수정 (신규)

| Action | Target | Description | Severity |
|--------|--------|-------------|----------|
| **인증 조사** | `retail-chatbot` | 401 에러 1건 (14.3%) — 토큰 갱신 로직 점검 | 🟠 Medium |
| **burst 조사** | `environment-proxy` | 단일 시점 20+ 동시 호출 — 프론트엔드 debounce 필요 여부 확인 | 🟡 Low |
| **성능 검토** | `retail-chatbot` | 평균 18.7초 응답 — SSE 스트리밍 전환 검토 | 🟡 Low |

### 7.3 P1 — Dead EF 삭제 (확정)

> ✅ 라이브 트래픽 0 확인 완료. 조건부 삭제 → **즉시 삭제**로 격상.

| Action | Target | Status |
|--------|--------|--------|
| **삭제** | `generate-template` | 코드 참조 0 + 트래픽 0 → 삭제 확정 |
| **삭제** | `upscale-image` | 코드 참조 0 + 트래픽 0 → 삭제 확정 |

### 7.4 P2 — ENDPOINT EFs 트래픽 확인

> ⚠️ 24시간 데이터로는 cron/scheduled EF 활성 여부 판단 불가 (실행 주기가 24h 이상일 수 있음).
> Supabase Dashboard > Logs에서 7일 범위로 재확인 필요.

| Category | Count | Action |
|----------|-------|--------|
| Cron/Scheduled | 6 | 24h 내 트래픽 없음 — 실행 주기 확인 필요 |
| Upload/Import Pipeline | 7 | 24h 내 트래픽 없음 — 사용 빈도 낮을 수 있음 |
| Data Processing | 5 | 24h 내 트래픽 없음 — IoT 데이터 흐름 확인 필요 |
| Feature-Specific | 5 | 24h 내 `retail-chatbot`만 활성 확인 |

### 7.5 P3 — 프론트엔드 정리

| Action | Target | Description |
|--------|--------|-------------|
| **비활성화** | POS Integration UI | pos-oauth-*, sync-pos-data 미존재 + 트래픽 0 → UI 숨김 |
| **정리** | create-checkout (commented) | 주석 코드 제거 또는 TODO 명시 |
| **매핑** | validate-batch-files, generate-ai-recommendations | 기존 EF로 이름 변경 가능한지 확인 |

---

## 8. 사용자 확인 요청 사항 (라이브 트래픽 검증 후 업데이트)

1. ~~**Phantom EF 우선순위**~~ → **확정**: `validate-and-fix-csv` (파이프라인 차단) + `apply-sample-data` (온보딩 차단) + `fetch-db-schema` (스키마 로딩 실패) — 3개 P0
2. **POS Integration**: pos-oauth-*, sync-pos-data는 향후 구현 예정인가요, 아니면 UI를 숨겨야 하나요? (24h 트래픽 0 확인)
3. ~~**generate-template / upscale-image 삭제 여부**~~ → **확정**: 24h 트래픽 0 + 코드 참조 0 → 삭제 진행
4. **retail-chatbot 401 에러**: 인증 실패 원인 조사 필요 — 프론트엔드 토큰 갱신 타이밍 문제 가능성
5. **environment-proxy burst**: 단일 시점 20+ 동시 호출 — OS Dashboard에서 debounce 적용 여부 결정 필요

---

> **Next Step**: Sprint A Step 4 — Storage 버킷 분석
