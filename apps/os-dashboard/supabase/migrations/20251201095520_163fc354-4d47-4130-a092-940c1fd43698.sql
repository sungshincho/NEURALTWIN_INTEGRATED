-- ============================================
-- NEURALTWIN 온톨로지 스키마 v3.0 업데이트
-- 62개 엔티티 (25 CRITICAL, 19 HIGH, 13 MEDIUM, 5 LOW)
-- 86개 관계 (32 CRITICAL, 27 HIGH, 17 MEDIUM, 10 LOW)
-- ============================================

-- v2.2 → v3.0 차이:
-- 엔티티: 43개 → 62개 (+19개)
-- 관계: 83개 → 86개 (+3개)

-- 신규 CRITICAL 엔티티 (8개):
-- 1. DataSource, DataSourceTable, ColumnMapping (데이터 파이프라인)
-- 2. BaseEvent, CustomerEvent, SensorEvent (이벤트 정규화)
-- 3. Scenario, SimulationResult (시뮬레이션)

-- 신규 HIGH 엔티티 (7개):
-- 4. Model, ModelRun, ZoneMetrics, ProductMetrics, StoreMetrics, EntityEmbedding, AIInsight (AI 모델)

-- 신규 MEDIUM 엔티티 (4개):
-- 5. KPI, KPIValue, RetailConcept, BusinessRule (비즈니스 룰)

-- v3.0은 자동 적용되므로 별도 마이그레이션 불필요
-- applyRetailSchemaPreset() 함수가 스키마를 자동으로 데이터베이스에 적용합니다

-- 참고: 마스터 계정 (neuraltwin.hq@neuraltwin.io)으로 실행 필요
-- User ID: af316ab2-ffb5-4509-bd37-13aa31feb5ad
-- Org ID: e738e7b1-e4bd-49f1-bd96-6de4c257b5a0

SELECT 1; -- 마이그레이션 파일 생성용 더미 쿼리