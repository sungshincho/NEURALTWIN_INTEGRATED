# NEURALTWIN 플랫폼 구현 현황 체크포인트

**작성일**: 2026-01-14
**버전**: 1.0.0

---

## 요약

| 영역 | 구현율 | 상태 |
|-----|-------|------|
| Data Control Tower | 95% | 대부분 구현 완료 |
| Insight Hub | 85% | 주요 기능 구현, 일부 RPC 폴백 처리 |
| Digital Twin Studio | 90% | 3D 렌더링 및 시뮬레이션 완료 |
| Database Layer | 98% | L1/L2/L3 테이블 완전 구현 |
| Edge Functions | 80% | 핵심 함수 구현, 일부 미배포 |

---

## 1. Data Control Tower

### 1.1 컴포넌트 구현 현황

| 컴포넌트 | 상태 | 파일 경로 | 비고 |
|---------|------|----------|------|
| DataControlTowerPage | ✅ 구현 완료 | `src/features/data-control/DataControlTowerPage.tsx` | 메인 페이지 |
| LineageExplorerPage | ✅ 구현 완료 | `src/features/data-control/LineageExplorerPage.tsx` | KPI Lineage 추적 |
| ConnectorSettingsPage | ✅ 구현 완료 | `src/features/data-control/ConnectorSettingsPage.tsx` | API 연결 설정 |
| DataQualityScoreCard | ✅ 구현 완료 | `src/features/data-control/components/DataQualityScore.tsx` | 품질 점수 카드 |
| DataSourceCards | ✅ 구현 완료 | `src/features/data-control/components/DataSourceCards.tsx` | 데이터 소스 상태 |
| PipelineTimeline | ✅ 구현 완료 | `src/features/data-control/components/PipelineTimeline.tsx` | ETL 파이프라인 |
| RecentImportsList | ✅ 구현 완료 | `src/features/data-control/components/RecentImportsList.tsx` | 최근 Import |
| ApiConnectionsList | ✅ 구현 완료 | `src/features/data-control/components/ApiConnectionsList.tsx` | API 연결 목록 |
| AddConnectorDialog | ✅ 구현 완료 | `src/features/data-control/components/AddConnectorDialog.tsx` | 커넥터 추가 |
| FieldMappingEditor | ✅ 구현 완료 | `src/features/data-control/components/FieldMappingEditor.tsx` | 필드 매핑 편집 |
| AuthConfigForm | ✅ 구현 완료 | `src/features/data-control/components/AuthConfigForm.tsx` | 인증 설정 |
| SyncHistoryTable | ✅ 구현 완료 | `src/features/data-control/components/connectors/SyncHistoryTable.tsx` | 동기화 이력 |

### 1.2 Hooks 구현 현황

| Hook | 상태 | 데이터 소스 | 비고 |
|------|------|-----------|------|
| useDataControlTowerStatus | ✅ 구현 완료 | RPC + Fallback | RPC 실패 시 직접 쿼리 폴백 |
| useDataQualityScore | ✅ 구현 완료 | RPC + Fallback | 품질 점수 산출 |
| useKPILineage | ✅ 구현 완료 | RPC + Fallback | Lineage 추적 |
| useRecentImports | ✅ 구현 완료 | raw_imports | 최근 Import 조회 |
| useETLHistory | ✅ 구현 완료 | etl_runs | ETL 실행 이력 |
| useReplayImport | ✅ 구현 완료 | Edge Function | Import 재처리 |
| useETLHealth | ✅ 구현 완료 | Edge Function + Fallback | ETL 헬스체크 |
| useApiConnections | ✅ 구현 완료 | api_connections | API 연결 목록 |
| useApiConnection | ✅ 구현 완료 | api_connections | 단일 연결 조회 |
| useApiMappingTemplates | ✅ 구현 완료 | api_mapping_templates | 매핑 템플릿 |
| useApiSyncLogs | ✅ 구현 완료 | api_sync_logs | 동기화 로그 |
| useCreateConnection | ✅ 구현 완료 | RPC | 연결 생성 |
| useUpdateConnection | ✅ 구현 완료 | api_connections | 연결 수정 |
| useDeleteConnection | ✅ 구현 완료 | api_connections | 연결 삭제 |
| useTestConnection | ✅ 구현 완료 | Edge Function | 연결 테스트 |
| useSyncConnection | ✅ 구현 완료 | Edge Function | 동기화 실행 |
| usePreviewMapping | ✅ 구현 완료 | Edge Function | 매핑 미리보기 |
| useApplyTemplate | ✅ 구현 완료 | Edge Function | 템플릿 적용 |

### 1.3 미구현/개선 필요 사항

| 항목 | 상태 | 우선순위 | 설명 |
|-----|------|---------|------|
| 실시간 동기화 스케줄러 | ⚠️ 부분 구현 | 중 | Cron 기반 자동 동기화 |
| 암호화 자격증명 저장 | 🚧 미구현 | 높 | `is_credentials_encrypted` 필드만 존재 |
| OAuth2 토큰 갱신 | 🚧 미구현 | 중 | Refresh token 자동 갱신 로직 |
| 웹훅 수신 기능 | 🚧 미구현 | 낮 | 외부 시스템 웹훅 처리 |

---

## 2. Insight Hub

### 2.1 탭별 구현 현황

| 탭 | 상태 | 파일 경로 | 데이터 소스 |
|---|------|----------|-----------|
| Overview | ✅ 구현 완료 | `src/features/insights/tabs/OverviewTab.tsx` | daily_kpis_agg, funnel_events |
| Store | ✅ 구현 완료 | `src/features/insights/tabs/StoreTab.tsx` | stores, zone_daily_metrics, zone_transitions |
| Customer | ✅ 구현 완료 | `src/features/insights/tabs/CustomerTab.tsx` | customer_segments_agg, customers |
| Product | ✅ 구현 완료 | `src/features/insights/tabs/ProductTab.tsx` | product_performance_agg, products |
| Prediction | ✅ 구현 완료 | `src/features/insights/tabs/PredictionTab.tsx` | retail-ai-inference Edge Function |
| AI Recommend | ✅ 구현 완료 | `src/features/insights/tabs/AIRecommendationTab.tsx` | ai_recommendations |

### 2.2 Context 및 Hooks 구현 현황

| Hook/Context | 상태 | 데이터 소스 | 비고 |
|-------------|------|-----------|------|
| InsightDataProvider | ✅ 구현 완료 | - | 통합 Context Provider |
| useInsightMetrics | ✅ 구현 완료 | daily_kpis_agg, funnel_events, transactions, store_visits | 서버사이드 COUNT 사용 |
| useIntegratedMetrics | ✅ 구현 완료 | baseKPIs + funnelData | 기존 호환용 훅 |
| useBaseKPIs | ✅ 구현 완료 | daily_kpis_agg | 항상 로드 |
| useFunnelData | ✅ 구현 완료 | funnel_events | 서버사이드 COUNT |
| useZoneMetricsData | ✅ 구현 완료 | zone_daily_metrics, zone_transitions | Store 탭 진입 시 Lazy Load |
| useCustomerSegmentsData | ✅ 구현 완료 | customer_segments_agg | Customer 탭 진입 시 Lazy Load |
| useProductPerformanceData | ✅ 구현 완료 | product_performance_agg | Product 탭 진입 시 Lazy Load |
| useHourlyVisitors | ✅ 구현 완료 | RPC: get_hourly_entry_counts | 시간별 데이터 |
| useAIPrediction | ✅ 구현 완료 | Edge Function + Fallback | AI 예측 (Gemini 2.5 Flash) |
| useAIRecommendations | ✅ 구현 완료 | ai_recommendations | AI 추천 목록 |

### 2.3 데이터 흐름 검증

| 검증 항목 | 상태 | 비고 |
|----------|------|------|
| KPI 캐시 vs Fact 일관성 | ⚠️ 경고 로깅 | daily_kpis_agg vs funnel_events 불일치 시 경고 |
| FOOTFALL 단일 소스 | ✅ 해결됨 | funnel_events.entry 사용으로 통일 |
| Conversion Rate 계산 | ✅ 해결됨 | funnel.purchase / funnel.entry 기준 |
| 서버사이드 COUNT | ✅ 구현 완료 | RLS 통과 후 정확한 COUNT |

### 2.4 미구현/개선 필요 사항

| 항목 | 상태 | 우선순위 | 설명 |
|-----|------|---------|------|
| get_store_overview_kpis RPC | 🚧 미구현 | 중 | 현재 클라이언트 집계 사용 |
| get_funnel_summary RPC | 🚧 미구현 | 중 | 현재 개별 COUNT 쿼리 사용 |
| avgDwellTime 계산 | 🚧 미구현 | 낮 | 기본값 0 반환 중 |
| trackedVisitors 계산 | 🚧 미구현 | 낮 | 기본값 0 반환 중 |
| trackingCoverage 계산 | 🚧 미구현 | 낮 | 기본값 0 반환 중 |

---

## 3. Digital Twin Studio

### 3.1 Core 컴포넌트 구현 현황

| 컴포넌트 | 상태 | 파일 경로 | 비고 |
|---------|------|----------|------|
| DigitalTwinStudioPage | ✅ 구현 완료 | `src/features/studio/DigitalTwinStudioPage.tsx` | 메인 페이지 |
| Canvas3D | ✅ 구현 완료 | `src/features/studio/core/Canvas3D.tsx` | Three.js Canvas |
| SceneProvider | ✅ 구현 완료 | `src/features/studio/core/SceneProvider.tsx` | 씬 Context |
| SelectionManager | ✅ 구현 완료 | `src/features/studio/core/SelectionManager.tsx` | 선택 관리 |
| PostProcessing | ✅ 구현 완료 | `src/features/studio/core/PostProcessing.tsx` | 후처리 효과 |
| SceneEnvironment | ✅ 구현 완료 | `src/features/studio/core/SceneEnvironment.tsx` | 환경 설정 |
| TransformControls | ✅ 구현 완료 | `src/features/studio/core/TransformControls.tsx` | 변환 컨트롤 |
| ModelLoader | ✅ 구현 완료 | `src/features/studio/core/ModelLoader.tsx` | 3D 모델 로더 |

### 3.2 Overlay 컴포넌트 구현 현황

| Overlay | 상태 | 용도 |
|---------|------|-----|
| HeatmapOverlay | ✅ 구현 완료 | 히트맵 시각화 |
| CustomerFlowOverlay | ✅ 구현 완료 | 고객 흐름 |
| CustomerFlowOverlayEnhanced | ✅ 구현 완료 | 강화된 고객 흐름 |
| LayoutOptimizationOverlay | ✅ 구현 완료 | 레이아웃 최적화 |
| FlowOptimizationOverlay | ✅ 구현 완료 | 흐름 최적화 |
| CongestionOverlay | ✅ 구현 완료 | 혼잡도 |
| StaffingOverlay | ✅ 구현 완료 | 직원 배치 |
| StaffAvatarsOverlay | ✅ 구현 완료 | 직원 아바타 |
| StaffReallocationOverlay | ✅ 구현 완료 | 직원 재배치 |
| ZoneBoundaryOverlay | ✅ 구현 완료 | 구역 경계 |
| ZonesFloorOverlay | ✅ 구현 완료 | 바닥 구역 |
| SlotVisualizerOverlay | ✅ 구현 완료 | 슬롯 시각화 |
| CustomerAvatarOverlay | ✅ 구현 완료 | 고객 아바타 |
| CustomerAvatarsOverlay | ✅ 구현 완료 | 고객 아바타 (복수) |
| EnvironmentEffectsOverlay | ✅ 구현 완료 | 환경 효과 |

### 3.3 Panel 컴포넌트 구현 현황

| Panel | 상태 | 용도 |
|-------|------|-----|
| LayerPanel | ✅ 구현 완료 | 레이어 관리 |
| ToolPanel | ✅ 구현 완료 | 도구 모음 |
| SceneSavePanel | ✅ 구현 완료 | 씬 저장 |
| OverlayControlPanel | ✅ 구현 완료 | 오버레이 제어 |
| PropertyPanel | ✅ 구현 완료 | 속성 편집 |
| ResultReportPanel | ✅ 구현 완료 | 결과 리포트 |
| UltimateAnalysisPanel | ✅ 구현 완료 | 분석 패널 |

### 3.4 Simulation Hooks 구현 현황

| Hook | 상태 | 데이터 소스 | 비고 |
|------|------|-----------|------|
| useStudioMode | ✅ 구현 완료 | - | 모드 관리 (view/edit) |
| useOverlayVisibility | ✅ 구현 완료 | - | 오버레이 표시 관리 |
| useScenePersistence | ✅ 구현 완료 | store_scenes | 씬 저장/불러오기 |
| useSceneSimulation | ✅ 구현 완료 | - | As-is/To-be 비교 |
| useStoreBounds | ✅ 구현 완료 | zones_dim | 매장 경계 |
| useStaffData | ✅ 구현 완료 | staff | 직원 데이터 |
| useEnvironmentContext | ✅ 구현 완료 | - | 환경 컨텍스트 |
| useSceneRecipe | ✅ 구현 완료 | - | 씬 레시피 |
| usePlacement | ✅ 구현 완료 | - | 배치 관리 |
| useFurnitureSlots | ✅ 구현 완료 | - | 가구 슬롯 |
| useCustomerSimulation | ✅ 구현 완료 | - | 고객 시뮬레이션 |
| useLayoutSimulation | ✅ 구현 완료 | - | 레이아웃 시뮬레이션 |
| useFlowSimulation | ✅ 구현 완료 | - | 흐름 시뮬레이션 |
| useCongestionSimulation | ✅ 구현 완료 | - | 혼잡도 시뮬레이션 |
| useStaffingSimulation | ✅ 구현 완료 | - | 인력 시뮬레이션 |
| useOptimization | ✅ 구현 완료 | - | 최적화 |
| useOptimizationFeedback | ✅ 구현 완료 | - | 최적화 피드백 |
| useZoneHeatmapData | ✅ 구현 완료 | zone_daily_metrics | 히트맵 데이터 |

### 3.5 미구현/개선 필요 사항

| 항목 | 상태 | 우선순위 | 설명 |
|-----|------|---------|------|
| WiFi 실시간 추적 | ⚠️ 부분 구현 | 중 | wifi_tracking 테이블 연동 필요 |
| 실시간 위치 계산 | 🚧 미구현 | 중 | Trilateration 알고리즘 |
| 시뮬레이션 저장 | ✅ 구현 완료 | - | scenarios 테이블 |
| 시나리오 비교 | ✅ 구현 완료 | - | As-is/To-be |

---

## 4. Database Layer

### 4.1 L1: Raw Layer 테이블

| 테이블 | 상태 | 용도 |
|-------|------|-----|
| raw_imports | ✅ 존재 | Import 이력 |
| etl_runs | ✅ 존재 | ETL 실행 로그 |
| user_data_imports | ✅ 존재 | 사용자 데이터 Import |

### 4.2 L2: Dimension 테이블

| 테이블 | 상태 | 용도 |
|-------|------|-----|
| stores | ✅ 존재 | 매장 마스터 |
| zones_dim | ✅ 존재 | 구역 마스터 |
| products | ✅ 존재 | 상품 마스터 |
| customers | ✅ 존재 | 고객 마스터 |
| staff | ✅ 존재 | 직원 마스터 |
| organizations | ✅ 존재 | 조직 마스터 |

### 4.3 L2: Fact 테이블

| 테이블 | 상태 | 용도 | 데이터 소스 |
|-------|------|-----|-----------|
| transactions | ✅ 존재 | 거래 Fact | POS API |
| line_items | ✅ 존재 | 거래 상세 | POS API |
| purchases | ✅ 존재 | 구매 Fact | 레거시 |
| zone_events | ✅ 존재 | 구역 이벤트 | NEURALSENSE |
| funnel_events | ✅ 존재 | 퍼널 이벤트 | 센서/POS |
| visits | ✅ 존재 | 방문 Fact | 센서 |
| store_visits | ✅ 존재 | 매장 방문 | 센서 |
| visit_zone_events | ✅ 존재 | 방문-구역 연계 | 센서 |
| zone_transitions | ✅ 존재 | 구역 이동 | 센서 |
| inventory_levels | ✅ 존재 | 재고 수준 | ERP |
| inventory_movements | ✅ 존재 | 재고 이동 | ERP |

### 4.4 L3: Aggregate 테이블

| 테이블 | 상태 | 용도 | 집계 주기 |
|-------|------|-----|----------|
| daily_kpis_agg | ✅ 존재 | 일별 KPI 집계 | 일간 |
| hourly_metrics | ✅ 존재 | 시간별 메트릭 | 시간 |
| zone_daily_metrics | ✅ 존재 | 구역별 일간 | 일간 |
| customer_segments_agg | ✅ 존재 | 고객 세그먼트 | 일간 |
| product_performance_agg | ✅ 존재 | 상품 성과 | 일간 |

### 4.5 API Connector 테이블

| 테이블 | 상태 | 용도 |
|-------|------|-----|
| api_connections | ✅ 존재 | API 연결 설정 |
| api_mapping_templates | ✅ 존재 | 매핑 템플릿 |
| api_sync_logs | ✅ 존재 | 동기화 로그 |

### 4.6 누락된 테이블 (문서 대비)

| 테이블 | 상태 | 비고 |
|-------|------|-----|
| product_sales_daily | ❌ 미존재 | 문서에 명시, 실제 미구현 |

---

## 5. RPC Functions

### 5.1 구현 완료

| RPC 함수 | 상태 | 파라미터 | 비고 |
|---------|------|---------|------|
| calculate_data_quality_score | ✅ 존재 | p_store_id, p_date | 품질 점수 계산 |
| get_data_control_tower_status | ✅ 존재 | p_store_id, p_limit | 컨트롤타워 상태 |
| get_kpi_lineage | ✅ 존재 | p_kpi_table, p_kpi_id, p_store_id, p_date | Lineage 추적 |
| get_hourly_entry_counts | ✅ 존재 | p_org_id, p_store_id, p_start_date, p_end_date | 시간별 입장 |
| create_api_connection | ✅ 존재 | 다수 파라미터 | 연결 생성 |
| get_api_connections_dashboard | ✅ 존재 | p_org_id, p_store_id | 대시보드 |

### 5.2 미구현 (폴백 처리됨)

| RPC 함수 | 상태 | 현재 처리 방식 |
|---------|------|---------------|
| get_store_overview_kpis | ❌ 미존재 | daily_kpis_agg 직접 쿼리 |
| get_funnel_summary | ❌ 미존재 | funnel_events COUNT 쿼리 |
| get_zone_performance | ❌ 미존재 | zone_daily_metrics 직접 쿼리 |

---

## 6. Edge Functions

### 6.1 구현 완료

| Edge Function | 상태 | 용도 |
|--------------|------|-----|
| api-connector | ✅ 배포됨 | API 테스트/동기화/미리보기 |
| replay-import | ✅ 배포됨 | Import 재처리 |
| etl-health | ✅ 배포됨 | ETL 헬스체크 |
| retail-ai-inference | ✅ 배포됨 | AI 예측 (Gemini 2.5 Flash) |
| unified-etl | ✅ 배포됨 | 통합 ETL |
| aggregate-all-kpis | ✅ 배포됨 | KPI 집계 |
| aggregate-dashboard-kpis | ✅ 배포됨 | 대시보드 KPI |
| run-simulation | ✅ 배포됨 | 시뮬레이션 실행 |
| process-neuralsense-data | ✅ 배포됨 | NEURALSENSE 데이터 처리 |
| process-wifi-data | ✅ 배포됨 | WiFi 데이터 처리 |
| unified-ai | ✅ 배포됨 | 통합 AI |
| generate-optimization | ✅ 배포됨 | 최적화 생성 |
| inventory-monitor | ✅ 배포됨 | 재고 모니터링 |

### 6.2 추가 Edge Functions

| Edge Function | 용도 |
|--------------|-----|
| graph-query | 그래프 쿼리 |
| smart-ontology-mapping | 온톨로지 매핑 |
| ai-batch-qa-test | AI 배치 테스트 |
| import-with-ontology | 온톨로지 기반 Import |
| auto-map-etl | 자동 ETL 매핑 |
| trigger-learning | 학습 트리거 |
| etl-scheduler | ETL 스케줄러 |
| auto-process-3d-models | 3D 모델 자동 처리 |
| datasource-mapper | 데이터소스 매퍼 |
| sync-api-data | API 데이터 동기화 |

---

## 7. 데이터 흐름 연결성 검증

### 7.1 Data Control Tower → DB

```
✅ DataControlTowerPage
   └── useDataControlTowerStatus
       ├── RPC: get_data_control_tower_status → ✅ 존재
       └── Fallback: raw_imports, etl_runs, transactions, zone_events, customers, products, zones_dim, daily_kpis_agg → ✅ 모두 존재

✅ LineageExplorerPage
   └── useKPILineage
       ├── RPC: get_kpi_lineage → ✅ 존재
       └── Fallback: daily_kpis_agg, zone_daily_metrics, raw_imports → ✅ 모두 존재

✅ ApiConnectionsList
   └── useApiConnections → api_connections → ✅ 존재
   └── useSyncConnection → Edge Function: api-connector → ✅ 배포됨
```

### 7.2 Insight Hub → DB

```
✅ OverviewTab
   └── useIntegratedMetrics
       ├── useBaseKPIs → daily_kpis_agg → ✅ 존재
       └── useFunnelData → funnel_events → ✅ 존재

✅ StoreTab
   └── useZoneMetricsData → zone_daily_metrics, zone_transitions, zones_dim → ✅ 모두 존재

✅ CustomerTab
   └── useCustomerSegmentsData → customer_segments_agg → ✅ 존재

✅ ProductTab
   └── useProductPerformanceData → product_performance_agg, products → ✅ 존재

✅ PredictionTab
   └── useAIPrediction → Edge Function: retail-ai-inference → ✅ 배포됨
                       → Fallback: daily_kpis_agg → ✅ 존재

✅ AIRecommendationTab
   └── useAIRecommendations → ai_recommendations → ✅ 존재
```

### 7.3 Digital Twin Studio → DB

```
✅ DigitalTwinStudioPage
   ├── useStoreBounds → zones_dim → ✅ 존재
   ├── useStaffData → staff → ✅ 존재
   ├── useScenePersistence → store_scenes → ✅ 존재
   ├── useZoneHeatmapData → zone_daily_metrics → ✅ 존재
   └── useEnhancedAIInference → Edge Function: unified-ai → ✅ 배포됨
```

---

## 8. 미구현 기능 목록

### 8.1 높은 우선순위

| 기능 | 영역 | 현재 상태 | 필요 작업 |
|-----|------|----------|----------|
| 자격증명 암호화 | Data Control Tower | 미구현 | 암호화 로직 구현, KMS 연동 |
| OAuth2 토큰 갱신 | Data Control Tower | 미구현 | Refresh token 자동 갱신 |
| avgDwellTime 계산 | Insight Hub | 미구현 | zone_events 체류시간 집계 |

### 8.2 중간 우선순위

| 기능 | 영역 | 현재 상태 | 필요 작업 |
|-----|------|----------|----------|
| get_store_overview_kpis RPC | Insight Hub | 폴백 처리 | 서버사이드 집계 RPC 생성 |
| get_funnel_summary RPC | Insight Hub | 폴백 처리 | 서버사이드 집계 RPC 생성 |
| 실시간 동기화 스케줄러 | Data Control Tower | 부분 구현 | Cron 기반 자동화 |
| WiFi 실시간 추적 | Digital Twin Studio | 부분 구현 | wifi_tracking 연동 |
| product_sales_daily 테이블 | Database | 미존재 | 마이그레이션 생성 |

### 8.3 낮은 우선순위

| 기능 | 영역 | 현재 상태 | 필요 작업 |
|-----|------|----------|----------|
| 웹훅 수신 | Data Control Tower | 미구현 | 웹훅 엔드포인트 생성 |
| trackedVisitors 계산 | Insight Hub | 미구현 | WiFi tracking 기반 집계 |
| trackingCoverage 계산 | Insight Hub | 미구현 | 센서 커버리지 계산 |

---

## 9. 권장 작업 순서

1. **자격증명 암호화 구현** (보안)
2. **product_sales_daily 테이블 생성** (데이터 완전성)
3. **RPC 함수 추가** (get_store_overview_kpis, get_funnel_summary)
4. **avgDwellTime 계산 로직 구현**
5. **OAuth2 토큰 자동 갱신**
6. **실시간 동기화 스케줄러 완성**
7. **WiFi 실시간 추적 연동**

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|-----|------|----------|
| 1.0.0 | 2026-01-14 | 초기 체크포인트 문서 작성 |
