-- ============================================================================
-- NEURALTWIN Master Schema Expansion v1.1
-- ============================================================================
-- 작성일: 2025-12-15
-- 목적:
--   1. 범용적인 커스텀 타입을 마스터 스키마에 추가
--   2. 중복/불필요한 커스텀 타입 삭제
--   3. 특화된 커스텀 타입은 유지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Master Schema Expansion v1.1 시작';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 1: 마스터 스키마에 범용 타입 추가 (24개)
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'STEP 1: 마스터 스키마 확장 (24개 타입 추가)'; END $$;

-- ---------------------------------------------------------------------------
-- 1-A: 분석/지표 타입 (8개) - ANALYTICS 도메인 보완
-- ---------------------------------------------------------------------------
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000004-0004-4000-8000-000000000001', NULL, NULL, 'Sale', '매출', '매출 거래 기록', '#10b981', 'DollarSign', '{"category": "analytics", "subcategory": "metrics", "priority": "critical"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000002', NULL, NULL, 'DailySales', '일간 매출', '일별 매출 집계', '#22c55e', 'Calendar', '{"category": "analytics", "subcategory": "metrics", "priority": "high"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000003', NULL, NULL, 'StoreMetrics', '매장 메트릭', '매장 성과 지표', '#3b82f6', 'BarChart3', '{"category": "analytics", "subcategory": "metrics", "priority": "critical"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000004', NULL, NULL, 'ZoneMetrics', '구역 메트릭', '구역별 성과 지표', '#8b5cf6', 'BarChart2', '{"category": "analytics", "subcategory": "metrics", "priority": "high"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000005', NULL, NULL, 'ProductMetrics', '상품 메트릭', '상품별 성과 지표', '#f97316', 'TrendingUp', '{"category": "analytics", "subcategory": "metrics", "priority": "high"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000006', NULL, NULL, 'ZonePerformance', '구역 성과', '구역 성과 분석', '#6366f1', 'Activity', '{"category": "analytics", "subcategory": "metrics", "priority": "high"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000007', NULL, NULL, 'ZoneAnalysis', '구역 분석', '구역 상세 분석', '#7c3aed', 'PieChart', '{"category": "analytics", "subcategory": "metrics", "priority": "medium"}', NOW(), NOW()),
('a0000004-0004-4000-8000-000000000008', NULL, NULL, 'PurchaseConversion', '구매 전환', '방문→구매 전환 분석', '#f59e0b', 'ArrowRight', '{"category": "analytics", "subcategory": "metrics", "priority": "critical"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1-B: 물리/가구 타입 (6개) - PHYSICAL 도메인 보완
-- ---------------------------------------------------------------------------
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0005-4000-8000-000000000001', NULL, NULL, 'Display', '디스플레이', '상품 디스플레이', '#0ea5e9', 'Monitor', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0005-4000-8000-000000000002', NULL, NULL, 'Wall', '벽면', '매장 벽면', '#64748b', 'Square', '{"category": "physical", "subcategory": "space", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0005-4000-8000-000000000003', NULL, NULL, 'Window', '창문', '매장 창문/쇼윈도', '#38bdf8', 'Maximize2', '{"category": "physical", "subcategory": "space", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0005-4000-8000-000000000004', NULL, NULL, 'ClothingRack', '의류 행거', '의류 전용 행거', '#a855f7', 'Shirt', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0005-4000-8000-000000000005', NULL, NULL, 'WallShelf', '벽면 선반', '벽면 부착 선반', '#06b6d4', 'Layers', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0005-4000-8000-000000000006', NULL, NULL, 'CosmeticsCounter', '화장품 카운터', '화장품 전용 카운터', '#ec4899', 'Sparkles', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1-C: 센서 타입 (6개) - PHYSICAL/SENSOR 도메인 보완
-- ---------------------------------------------------------------------------
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0004-4000-8000-000000000009', NULL, NULL, 'Sensor', '센서', '일반 센서', '#14b8a6', 'Radio', '{"category": "physical", "subcategory": "sensor", "priority": "medium"}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000010', NULL, NULL, 'Beacon', '비콘', 'BLE 비콘 장치', '#2563eb', 'Bluetooth', '{"category": "physical", "subcategory": "sensor", "priority": "high"}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000011', NULL, NULL, 'WiFiProbe', 'WiFi 프로브', 'WiFi 신호 감지 장치', '#7c3aed', 'Wifi', '{"category": "physical", "subcategory": "sensor", "priority": "high"}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000012', NULL, NULL, 'DoorSensor', '도어 센서', '출입문 감지 센서', '#f59e0b', 'DoorOpen', '{"category": "physical", "subcategory": "sensor", "priority": "high"}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000013', NULL, NULL, 'HumiditySensor', '습도 센서', '습도 측정 센서', '#06b6d4', 'Droplets', '{"category": "physical", "subcategory": "sensor", "priority": "low"}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000014', NULL, NULL, 'SensorEvent', '센서 이벤트', '센서 발생 이벤트', '#8b5cf6', 'Zap', '{"category": "physical", "subcategory": "sensor", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1-D: 인프라/경험 타입 (4개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0003-4000-8000-000000000009', NULL, NULL, 'ScentDiffuser', '향기 디퓨저', '매장 향기 연출 장치', '#f472b6', 'Wind', '{"category": "physical", "subcategory": "infrastructure", "priority": "low", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000010', NULL, NULL, 'SmartMirror', '스마트 미러', '디지털 스마트 거울', '#3b82f6', 'ScanFace', '{"category": "physical", "subcategory": "infrastructure", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000011', NULL, NULL, 'MusicPlaylist', '음악 재생목록', '매장 BGM 재생목록', '#a855f7', 'Music', '{"category": "physical", "subcategory": "infrastructure", "priority": "low"}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000012', NULL, NULL, 'POS', 'POS 단말기', '판매시점 관리 단말기', '#ef4444', 'CreditCard', '{"category": "physical", "subcategory": "infrastructure", "priority": "critical", "3d_model": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL;
  RAISE NOTICE '✅ 마스터 엔티티 타입 총 %개', v_count;
END $$;

-- ============================================================================
-- STEP 2: 중복/불필요한 커스텀 타입 삭제 (7개)
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'STEP 2: 중복 커스텀 타입 삭제'; END $$;

-- 삭제 대상 백업
DROP TABLE IF EXISTS deleted_custom_types_backup;
CREATE TABLE deleted_custom_types_backup AS
SELECT * FROM ontology_entity_types
WHERE user_id IS NOT NULL
  AND name IN (
    'CheckoutCounterCustom',  -- CheckoutCounter 중복
    'DisplayTableCustom',      -- DisplayTable 중복
    'Purchase',                -- Transaction 중복
    'CustomerEvent',           -- Visit/ProductInteraction 중복
    'Clothing',                -- Category 중복
    'Shoes',                   -- Category 중복
    'Accessory',               -- Category 중복
    'MarketingCampaign',       -- Campaign 중복
    'StaffZone'                -- Staff + Zone 조합으로 대체
  );

-- graph_entities에서 참조되지 않는 중복 타입만 삭제
DELETE FROM ontology_entity_types
WHERE user_id IS NOT NULL
  AND name IN (
    'CheckoutCounterCustom',
    'DisplayTableCustom',
    'Purchase',
    'CustomerEvent',
    'Clothing',
    'Shoes',
    'Accessory',
    'MarketingCampaign',
    'StaffZone'
  )
  AND id NOT IN (SELECT DISTINCT entity_type_id FROM graph_entities WHERE entity_type_id IS NOT NULL);

DO $$
DECLARE
  v_deleted INTEGER;
BEGIN
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '✅ 중복 커스텀 엔티티 타입 %개 삭제', v_deleted;
END $$;

-- 관계 타입도 동일하게 처리
DELETE FROM ontology_relation_types
WHERE user_id IS NOT NULL
  AND name IN (
    SELECT ort.name
    FROM ontology_relation_types ort
    WHERE ort.user_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM ontology_relation_types master
        WHERE master.org_id IS NULL
          AND master.user_id IS NULL
          AND master.name = ort.name
      )
      AND ort.id NOT IN (SELECT DISTINCT relation_type_id FROM graph_relations WHERE relation_type_id IS NOT NULL)
  );

DO $$
DECLARE
  v_deleted INTEGER;
BEGIN
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '✅ 중복 커스텀 관계 타입 %개 삭제', v_deleted;
END $$;

-- ============================================================================
-- STEP 3: 마스터에 추가된 타입과 동일한 커스텀 타입 정리
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'STEP 3: 신규 마스터 타입과 중복되는 커스텀 타입 정리'; END $$;

-- 신규 마스터 타입과 이름이 같은 커스텀 타입 삭제 (참조되지 않는 것만)
DELETE FROM ontology_entity_types custom
WHERE custom.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM ontology_entity_types master
    WHERE master.org_id IS NULL
      AND master.user_id IS NULL
      AND master.name = custom.name
  )
  AND custom.id NOT IN (SELECT DISTINCT entity_type_id FROM graph_entities WHERE entity_type_id IS NOT NULL);

DO $$
DECLARE
  v_deleted INTEGER;
BEGIN
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '✅ 신규 마스터와 중복된 커스텀 타입 %개 삭제', v_deleted;
END $$;

-- ============================================================================
-- STEP 4: 검증 및 결과 출력
-- ============================================================================

DO $$
DECLARE
  v_master_entity INTEGER;
  v_master_relation INTEGER;
  v_custom_entity INTEGER;
  v_custom_relation INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_master_entity FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL;
  SELECT COUNT(*) INTO v_master_relation FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL;
  SELECT COUNT(*) INTO v_custom_entity FROM ontology_entity_types WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO v_custom_relation FROM ontology_relation_types WHERE user_id IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 최종 결과:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   마스터 엔티티 타입: %개', v_master_entity;
  RAISE NOTICE '   마스터 관계 타입: %개', v_master_relation;
  RAISE NOTICE '   커스텀 엔티티 타입: %개', v_custom_entity;
  RAISE NOTICE '   커스텀 관계 타입: %개', v_custom_relation;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Master Schema Expansion 완료!';
  RAISE NOTICE '========================================';
END $$;
