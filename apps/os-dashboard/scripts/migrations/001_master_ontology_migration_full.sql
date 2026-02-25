-- ============================================================================
-- NEURALTWIN Master Ontology Migration Script v2.0
-- ============================================================================
-- 작성일: 2025-12-14
-- 목적: 150개 엔티티 타입 + 100개 관계 타입 마스터 온톨로지 적용
--
-- 실행 방법:
--   psql -d your_database -f 001_master_ontology_migration.sql
--   또는 Supabase SQL Editor에서 실행
-- ============================================================================

-- ============================================================================
-- STEP 0: DB 스키마 변경 (user_id NOT NULL 완화, RLS 정책)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 0: DB 스키마 변경 시작';
  RAISE NOTICE '========================================';
END $$;

-- 0.1 user_id NOT NULL 제약조건 완화
ALTER TABLE ontology_entity_types
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE ontology_relation_types
ALTER COLUMN user_id DROP NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ user_id NOT NULL 제약조건 완화 완료'; END $$;

-- 0.2 기존 유니크 제약조건 삭제 및 새 인덱스 생성
ALTER TABLE ontology_entity_types
DROP CONSTRAINT IF EXISTS ontology_entity_types_user_id_name_key;

ALTER TABLE ontology_relation_types
DROP CONSTRAINT IF EXISTS ontology_relation_types_user_id_name_source_target_key;

-- 마스터(NULL) + 사용자별 공존을 위한 유니크 인덱스
DROP INDEX IF EXISTS idx_ontology_entity_types_unique_scope;
CREATE UNIQUE INDEX idx_ontology_entity_types_unique_scope
ON ontology_entity_types (
  COALESCE(org_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
  name
);

DROP INDEX IF EXISTS idx_ontology_relation_types_unique_scope;
CREATE UNIQUE INDEX idx_ontology_relation_types_unique_scope
ON ontology_relation_types (
  COALESCE(org_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
  name,
  source_entity_type,
  target_entity_type
);

DO $$ BEGIN RAISE NOTICE '✅ 유니크 인덱스 재생성 완료'; END $$;

-- 0.3 RLS 정책 변경
DROP POLICY IF EXISTS "Org members can view org entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Org members can view org entity types and master schema" ON ontology_entity_types;

CREATE POLICY "View master and own entity types"
ON ontology_entity_types FOR SELECT USING (
  (user_id IS NULL AND org_id IS NULL)  -- 마스터 타입 (모든 인증 사용자)
  OR auth.uid() = user_id  -- 개인 타입
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))  -- 조직 타입
);

DROP POLICY IF EXISTS "Org members can view org relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Org members can view org relation types and master schema" ON ontology_relation_types;

CREATE POLICY "View master and own relation types"
ON ontology_relation_types FOR SELECT USING (
  (user_id IS NULL AND org_id IS NULL)  -- 마스터 타입
  OR auth.uid() = user_id  -- 개인 타입
  OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))  -- 조직 타입
);

DO $$ BEGIN RAISE NOTICE '✅ RLS 정책 업데이트 완료'; END $$;

-- ============================================================================
-- STEP 1: 백업 테이블 생성
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 1: 백업 테이블 생성';
  RAISE NOTICE '========================================';
END $$;

DROP TABLE IF EXISTS ontology_entity_types_backup_20251214;
CREATE TABLE ontology_entity_types_backup_20251214 AS
SELECT * FROM ontology_entity_types;

DROP TABLE IF EXISTS ontology_relation_types_backup_20251214;
CREATE TABLE ontology_relation_types_backup_20251214 AS
SELECT * FROM ontology_relation_types;

DROP TABLE IF EXISTS graph_entities_type_mapping_20251214;
CREATE TABLE graph_entities_type_mapping_20251214 AS
SELECT ge.id, ge.entity_type_id, oet.name as entity_type_name
FROM graph_entities ge
LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id;

DO $$
DECLARE
  v_entity_count INTEGER;
  v_relation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_entity_count FROM ontology_entity_types_backup_20251214;
  SELECT COUNT(*) INTO v_relation_count FROM ontology_relation_types_backup_20251214;
  RAISE NOTICE '✅ 백업 완료: 엔티티 타입 %개, 관계 타입 %개', v_entity_count, v_relation_count;
END $$;

-- ============================================================================
-- STEP 2: 마스터 엔티티 타입 150개 INSERT
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 2: 마스터 엔티티 타입 150개 INSERT';
  RAISE NOTICE '========================================';
END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 1: PHYSICAL (40개)
-- ---------------------------------------------------------------------------

-- Subcategory: space (12개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0001-4000-8000-000000000001', NULL, NULL, 'Store', '매장', '물리적 리테일 매장', '#10b981', 'Store', '{"category": "physical", "subcategory": "space", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000002', NULL, NULL, 'Zone', '구역', '매장 내 기능 영역', '#8b5cf6', 'BoxSelect', '{"category": "physical", "subcategory": "space", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000003', NULL, NULL, 'SubZone', '세부구역', '구역 내 세부 영역', '#a78bfa', 'Grid3X3', '{"category": "physical", "subcategory": "space", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000004', NULL, NULL, 'Entrance', '출입구', '매장 출입구', '#f59e0b', 'DoorOpen', '{"category": "physical", "subcategory": "space", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000005', NULL, NULL, 'Exit', '비상구', '비상 출구', '#ef4444', 'DoorClosed', '{"category": "physical", "subcategory": "space", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000006', NULL, NULL, 'Aisle', '통로', '고객 이동 통로', '#22c55e', 'MoveHorizontal', '{"category": "physical", "subcategory": "space", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000007', NULL, NULL, 'FittingRoom', '탈의실', '의류 착용 공간', '#a855f7', 'Shirt', '{"category": "physical", "subcategory": "space", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000008', NULL, NULL, 'CheckoutArea', '계산대 구역', '결제 구역', '#ef4444', 'CreditCard', '{"category": "physical", "subcategory": "space", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000009', NULL, NULL, 'StorageRoom', '창고', '재고 보관 공간', '#78716c', 'Warehouse', '{"category": "physical", "subcategory": "space", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000010', NULL, NULL, 'ServiceArea', '서비스 구역', '고객 서비스 공간', '#3b82f6', 'HeadphonesIcon', '{"category": "physical", "subcategory": "space", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000011', NULL, NULL, 'RestArea', '휴식 공간', '고객 휴식 공간', '#14b8a6', 'Coffee', '{"category": "physical", "subcategory": "space", "priority": "low", "3d_model": true}', NOW(), NOW()),
('a0000001-0001-4000-8000-000000000012', NULL, NULL, 'Floor', '층', '건물 층', '#64748b', 'Layers', '{"category": "physical", "subcategory": "space", "priority": "high", "3d_model": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: furniture (12개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0002-4000-8000-000000000001', NULL, NULL, 'Shelf', '선반', '상품 진열 선반', '#3b82f6', 'Layers', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000002', NULL, NULL, 'Rack', '행거', '의류 걸이 랙', '#06b6d4', 'Minimize2', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000003', NULL, NULL, 'DisplayTable', '디스플레이 테이블', '상품 진열 테이블', '#8b5cf6', 'Table', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000004', NULL, NULL, 'Gondola', '곤돌라', '양면 진열대', '#f97316', 'LayoutGrid', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000005', NULL, NULL, 'EndCap', '엔드캡', '진열대 끝 매대', '#ec4899', 'SquareStack', '{"category": "physical", "subcategory": "furniture", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000006', NULL, NULL, 'Showcase', '쇼케이스', '유리 진열장', '#0ea5e9', 'Eye', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000007', NULL, NULL, 'Mannequin', '마네킹', '의류 마네킹', '#f472b6', 'User', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000008', NULL, NULL, 'CheckoutCounter', '계산대', '결제 카운터', '#ef4444', 'Calculator', '{"category": "physical", "subcategory": "furniture", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000009', NULL, NULL, 'ServiceDesk', '서비스 데스크', '고객 서비스 데스크', '#3b82f6', 'Desk', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000010', NULL, NULL, 'DigitalSignage', '디지털 사이니지', '디지털 광고판', '#f97316', 'Monitor', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000011', NULL, NULL, 'Kiosk', '키오스크', '셀프 서비스 단말기', '#6366f1', 'TabletSmartphone', '{"category": "physical", "subcategory": "furniture", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0002-4000-8000-000000000012', NULL, NULL, 'Mirror', '거울', '피팅룸 거울', '#a1a1aa', 'ScanFace', '{"category": "physical", "subcategory": "furniture", "priority": "low", "3d_model": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: infrastructure (8개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0003-4000-8000-000000000001', NULL, NULL, 'HVAC', '공조 시스템', '냉난방 시스템', '#38bdf8', 'Wind', '{"category": "physical", "subcategory": "infrastructure", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000002', NULL, NULL, 'Lighting', '조명', '매장 조명 시스템', '#facc15', 'Lightbulb', '{"category": "physical", "subcategory": "infrastructure", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000003', NULL, NULL, 'SpotLight', '스팟 조명', '포인트 조명', '#fbbf24', 'LampDesk', '{"category": "physical", "subcategory": "infrastructure", "priority": "low", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000004', NULL, NULL, 'AudioSystem', '오디오 시스템', '매장 음향 시스템', '#7c3aed', 'Volume2', '{"category": "physical", "subcategory": "infrastructure", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000005', NULL, NULL, 'Escalator', '에스컬레이터', '층간 이동 설비', '#64748b', 'ArrowUpDown', '{"category": "physical", "subcategory": "infrastructure", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000006', NULL, NULL, 'Elevator', '엘리베이터', '층간 이동 설비', '#475569', 'Square', '{"category": "physical", "subcategory": "infrastructure", "priority": "medium", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000007', NULL, NULL, 'SecurityGate', '보안 게이트', 'EAS 보안 게이트', '#dc2626', 'ShieldAlert', '{"category": "physical", "subcategory": "infrastructure", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0003-4000-8000-000000000008', NULL, NULL, 'PowerSystem', '전력 시스템', '전력 공급 시스템', '#eab308', 'Zap', '{"category": "physical", "subcategory": "infrastructure", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: sensor (8개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000001-0004-4000-8000-000000000001', NULL, NULL, 'Camera', '카메라', 'CCTV 카메라', '#dc2626', 'Video', '{"category": "physical", "subcategory": "sensor", "priority": "high", "3d_model": true}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000002', NULL, NULL, 'PeopleCounter', '인원 카운터', '출입 인원 카운터', '#22c55e', 'Users2', '{"category": "physical", "subcategory": "sensor", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000003', NULL, NULL, 'WiFiSensor', 'WiFi 센서', 'WiFi 신호 감지', '#7c3aed', 'Wifi', '{"category": "physical", "subcategory": "sensor", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000004', NULL, NULL, 'BluetoothBeacon', '블루투스 비콘', 'BLE 비콘', '#2563eb', 'Bluetooth', '{"category": "physical", "subcategory": "sensor", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000005', NULL, NULL, 'RFIDReader', 'RFID 리더', 'RFID 태그 리더', '#0891b2', 'Nfc', '{"category": "physical", "subcategory": "sensor", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000006', NULL, NULL, 'TemperatureSensor', '온도 센서', '온도 측정 센서', '#ef4444', 'Thermometer', '{"category": "physical", "subcategory": "sensor", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000007', NULL, NULL, 'HeatmapSensor', '히트맵 센서', '동선 히트맵 센서', '#f97316', 'Flame', '{"category": "physical", "subcategory": "sensor", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000001-0004-4000-8000-000000000008', NULL, NULL, 'QueueSensor', '대기열 센서', '줄서기 감지 센서', '#8b5cf6', 'AlignVerticalJustifyStart', '{"category": "physical", "subcategory": "sensor", "priority": "medium", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ PHYSICAL 도메인 (40개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 2: HUMAN (30개)
-- ---------------------------------------------------------------------------

-- Subcategory: customer (8개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000002-0001-4000-8000-000000000001', NULL, NULL, 'Customer', '고객', '고객 정보', '#22c55e', 'User', '{"category": "human", "subcategory": "customer", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000002', NULL, NULL, 'CustomerSegment', '고객 세그먼트', '고객 그룹 분류', '#8b5cf6', 'Users', '{"category": "human", "subcategory": "customer", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000003', NULL, NULL, 'CustomerProfile', '고객 프로필', '상세 고객 정보', '#14b8a6', 'UserCircle', '{"category": "human", "subcategory": "customer", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000004', NULL, NULL, 'LoyaltyAccount', '멤버십 계정', '로열티 프로그램', '#f59e0b', 'Award', '{"category": "human", "subcategory": "customer", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000005', NULL, NULL, 'CustomerPreference', '고객 선호도', '고객 취향 정보', '#ec4899', 'Heart', '{"category": "human", "subcategory": "customer", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000006', NULL, NULL, 'CustomerFeedback', '고객 피드백', '고객 의견/평가', '#06b6d4', 'MessageSquare', '{"category": "human", "subcategory": "customer", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000007', NULL, NULL, 'CustomerWishlist', '위시리스트', '고객 관심 상품', '#f472b6', 'Star', '{"category": "human", "subcategory": "customer", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000002-0001-4000-8000-000000000008', NULL, NULL, 'CustomerAddress', '고객 주소', '배송/청구 주소', '#64748b', 'MapPin', '{"category": "human", "subcategory": "customer", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: behavior (12개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000002-0002-4000-8000-000000000001', NULL, NULL, 'Visit', '방문', '고객 매장 방문', '#14b8a6', 'UserCheck', '{"category": "human", "subcategory": "behavior", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000002', NULL, NULL, 'ZoneDwell', '구역 체류', '구역별 체류 시간', '#8b5cf6', 'Clock', '{"category": "human", "subcategory": "behavior", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000003', NULL, NULL, 'CustomerJourney', '고객 여정', '매장 내 이동 경로', '#fb7185', 'Route', '{"category": "human", "subcategory": "behavior", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000004', NULL, NULL, 'PathSegment', '경로 세그먼트', '여정의 개별 구간', '#f97316', 'ArrowRight', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000005', NULL, NULL, 'ProductInteraction', '상품 상호작용', '상품 터치/픽업', '#22c55e', 'Hand', '{"category": "human", "subcategory": "behavior", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000006', NULL, NULL, 'FittingRoomSession', '피팅룸 세션', '탈의실 사용', '#a855f7', 'Shirt', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000007', NULL, NULL, 'QueueEvent', '대기열 이벤트', '줄서기 이벤트', '#ef4444', 'Clock', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000008', NULL, NULL, 'ServiceInteraction', '서비스 상호작용', '직원 상담', '#3b82f6', 'MessageCircle', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000009', NULL, NULL, 'DigitalInteraction', '디지털 상호작용', '키오스크/앱 사용', '#6366f1', 'Smartphone', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000010', NULL, NULL, 'CartActivity', '장바구니 활동', '장바구니 담기/빼기', '#f59e0b', 'ShoppingCart', '{"category": "human", "subcategory": "behavior", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000011', NULL, NULL, 'SearchQuery', '검색 쿼리', '상품 검색', '#0ea5e9', 'Search', '{"category": "human", "subcategory": "behavior", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0002-4000-8000-000000000012', NULL, NULL, 'VisitIntent', '방문 의도', '추론된 방문 목적', '#7c3aed', 'Target', '{"category": "human", "subcategory": "behavior", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: staff (10개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000002-0003-4000-8000-000000000001', NULL, NULL, 'Staff', '직원', '매장 직원', '#6366f1', 'Users', '{"category": "human", "subcategory": "staff", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000002', NULL, NULL, 'StaffRole', '직원 역할', '직원 직책/역할', '#8b5cf6', 'BadgeCheck', '{"category": "human", "subcategory": "staff", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000003', NULL, NULL, 'Shift', '근무 시간', '근무 시프트', '#84cc16', 'Clock', '{"category": "human", "subcategory": "staff", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000004', NULL, NULL, 'StaffSchedule', '직원 스케줄', '근무 스케줄링', '#6366f1', 'Calendar', '{"category": "human", "subcategory": "staff", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000005', NULL, NULL, 'StaffAttendance', '직원 출근', '출퇴근 기록', '#22c55e', 'UserCheck', '{"category": "human", "subcategory": "staff", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000006', NULL, NULL, 'Task', '작업', '직원 작업 태스크', '#f97316', 'CheckSquare', '{"category": "human", "subcategory": "staff", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000007', NULL, NULL, 'TaskAssignment', '작업 할당', '작업 배정', '#f59e0b', 'ClipboardList', '{"category": "human", "subcategory": "staff", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000008', NULL, NULL, 'StaffPerformance', '직원 성과', '성과 지표', '#10b981', 'TrendingUp', '{"category": "human", "subcategory": "staff", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000009', NULL, NULL, 'Training', '교육', '직원 교육 프로그램', '#0ea5e9', 'GraduationCap', '{"category": "human", "subcategory": "staff", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000002-0003-4000-8000-000000000010', NULL, NULL, 'StaffTraining', '직원 교육 이수', '교육 이수 기록', '#06b6d4', 'Award', '{"category": "human", "subcategory": "staff", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ HUMAN 도메인 (30개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 3: COMMERCIAL (35개)
-- ---------------------------------------------------------------------------

-- Subcategory: product (12개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000003-0001-4000-8000-000000000001', NULL, NULL, 'Product', '제품', '판매 제품', '#f97316', 'Package', '{"category": "commercial", "subcategory": "product", "priority": "critical", "3d_model": true}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000002', NULL, NULL, 'ProductVariant', '제품 변형', '색상/사이즈 변형', '#fb923c', 'Palette', '{"category": "commercial", "subcategory": "product", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000003', NULL, NULL, 'Category', '카테고리', '제품 카테고리', '#06b6d4', 'FolderTree', '{"category": "commercial", "subcategory": "product", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000004', NULL, NULL, 'SubCategory', '서브카테고리', '세부 카테고리', '#0891b2', 'Folder', '{"category": "commercial", "subcategory": "product", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000005', NULL, NULL, 'Brand', '브랜드', '제품 브랜드', '#a855f7', 'Award', '{"category": "commercial", "subcategory": "product", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000006', NULL, NULL, 'Supplier', '공급업체', '제품 공급업체', '#059669', 'Truck', '{"category": "commercial", "subcategory": "product", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000007', NULL, NULL, 'ProductBundle', '상품 번들', '묶음 상품', '#f59e0b', 'Package2', '{"category": "commercial", "subcategory": "product", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000008', NULL, NULL, 'ProductAttribute', '상품 속성', '상품 특성 정보', '#64748b', 'List', '{"category": "commercial", "subcategory": "product", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000009', NULL, NULL, 'ProductImage', '상품 이미지', '상품 사진', '#ec4899', 'Image', '{"category": "commercial", "subcategory": "product", "priority": "low", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000010', NULL, NULL, 'ProductReview', '상품 리뷰', '고객 리뷰', '#22c55e', 'MessageSquare', '{"category": "commercial", "subcategory": "product", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000011', NULL, NULL, 'Planogram', '플래노그램', '진열 계획', '#8b5cf6', 'LayoutGrid', '{"category": "commercial", "subcategory": "product", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0001-4000-8000-000000000012', NULL, NULL, 'ProductPlacement', '상품 배치', '상품 진열 위치', '#f59e0b', 'MapPin', '{"category": "commercial", "subcategory": "product", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: inventory (8개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000003-0002-4000-8000-000000000001', NULL, NULL, 'Inventory', '재고', '제품 재고 정보', '#78716c', 'Archive', '{"category": "commercial", "subcategory": "inventory", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000002', NULL, NULL, 'InventoryLocation', '재고 위치', '재고 보관 위치', '#64748b', 'MapPin', '{"category": "commercial", "subcategory": "inventory", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000003', NULL, NULL, 'InventoryMovement', '재고 이동', '입출고 이력', '#0ea5e9', 'ArrowLeftRight', '{"category": "commercial", "subcategory": "inventory", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000004', NULL, NULL, 'StockReceipt', '입고', '재고 입고', '#22c55e', 'PackagePlus', '{"category": "commercial", "subcategory": "inventory", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000005', NULL, NULL, 'StockTransfer', '재고 이전', '매장간 이전', '#3b82f6', 'ArrowRightLeft', '{"category": "commercial", "subcategory": "inventory", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000006', NULL, NULL, 'StockCount', '재고 실사', '재고 조사', '#f59e0b', 'ClipboardCheck', '{"category": "commercial", "subcategory": "inventory", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000007', NULL, NULL, 'PurchaseOrder', '발주', '구매 주문', '#6366f1', 'FileText', '{"category": "commercial", "subcategory": "inventory", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0002-4000-8000-000000000008', NULL, NULL, 'InventoryAlert', '재고 알림', '재고 경고', '#ef4444', 'AlertTriangle', '{"category": "commercial", "subcategory": "inventory", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: transaction (8개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000003-0003-4000-8000-000000000001', NULL, NULL, 'Transaction', '거래', '판매 거래', '#dc2626', 'Receipt', '{"category": "commercial", "subcategory": "transaction", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000002', NULL, NULL, 'TransactionLine', '거래 라인', '개별 구매 항목', '#ef4444', 'ListOrdered', '{"category": "commercial", "subcategory": "transaction", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000003', NULL, NULL, 'Payment', '결제', '결제 정보', '#22c55e', 'CreditCard', '{"category": "commercial", "subcategory": "transaction", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000004', NULL, NULL, 'Discount', '할인', '적용된 할인', '#f59e0b', 'Percent', '{"category": "commercial", "subcategory": "transaction", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000005', NULL, NULL, 'Return', '반품', '상품 반품', '#ef4444', 'RotateCcw', '{"category": "commercial", "subcategory": "transaction", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000006', NULL, NULL, 'Exchange', '교환', '상품 교환', '#f97316', 'ArrowLeftRight', '{"category": "commercial", "subcategory": "transaction", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000007', NULL, NULL, 'GiftCard', '기프트카드', '상품권', '#ec4899', 'Gift', '{"category": "commercial", "subcategory": "transaction", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0003-4000-8000-000000000008', NULL, NULL, 'Basket', '장바구니', '구매 장바구니', '#f59e0b', 'ShoppingBag', '{"category": "commercial", "subcategory": "transaction", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: pricing (7개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000003-0004-4000-8000-000000000001', NULL, NULL, 'Price', '가격', '상품 가격', '#10b981', 'DollarSign', '{"category": "commercial", "subcategory": "pricing", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000002', NULL, NULL, 'PriceHistory', '가격 이력', '가격 변동 이력', '#64748b', 'History', '{"category": "commercial", "subcategory": "pricing", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000003', NULL, NULL, 'Promotion', '프로모션', '마케팅 프로모션', '#ec4899', 'Tag', '{"category": "commercial", "subcategory": "pricing", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000004', NULL, NULL, 'Coupon', '쿠폰', '할인 쿠폰', '#f59e0b', 'Ticket', '{"category": "commercial", "subcategory": "pricing", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000005', NULL, NULL, 'Campaign', '캠페인', '마케팅 캠페인', '#8b5cf6', 'Megaphone', '{"category": "commercial", "subcategory": "pricing", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000006', NULL, NULL, 'DynamicPricing', '동적 가격', '실시간 가격 조정', '#06b6d4', 'TrendingUp', '{"category": "commercial", "subcategory": "pricing", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000003-0004-4000-8000-000000000007', NULL, NULL, 'Markdown', '마크다운', '재고 할인', '#ef4444', 'ArrowDown', '{"category": "commercial", "subcategory": "pricing", "priority": "medium", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ COMMERCIAL 도메인 (35개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 4: ANALYTICS (20개)
-- ---------------------------------------------------------------------------

-- Subcategory: metrics (10개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000004-0001-4000-8000-000000000001', NULL, NULL, 'DailyStoreMetrics', '일간 매장 지표', '일간 매장 집계', '#10b981', 'BarChart3', '{"category": "analytics", "subcategory": "metrics", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000002', NULL, NULL, 'HourlyStoreMetrics', '시간별 매장 지표', '시간별 매장 집계', '#14b8a6', 'Clock', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000003', NULL, NULL, 'ZoneDailyMetrics', '일간 구역 지표', '일간 구역 집계', '#8b5cf6', 'BarChart2', '{"category": "analytics", "subcategory": "metrics", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000004', NULL, NULL, 'ZoneHourlyMetrics', '시간별 구역 지표', '시간별 구역 집계', '#a78bfa', 'Activity', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000005', NULL, NULL, 'ProductDailyMetrics', '일간 상품 지표', '일간 상품 집계', '#f97316', 'TrendingUp', '{"category": "analytics", "subcategory": "metrics", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000006', NULL, NULL, 'CategoryMetrics', '카테고리 지표', '카테고리별 집계', '#06b6d4', 'PieChart', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000007', NULL, NULL, 'TrafficFlow', '동선 흐름', '고객 동선 분석', '#22c55e', 'Route', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000008', NULL, NULL, 'QueueMetrics', '대기열 지표', '대기 시간 분석', '#ef4444', 'Users', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000009', NULL, NULL, 'ConversionFunnel', '전환 퍼널', '구매 전환 분석', '#f59e0b', 'Filter', '{"category": "analytics", "subcategory": "metrics", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000004-0001-4000-8000-000000000010', NULL, NULL, 'BasketAnalysis', '장바구니 분석', '구매 패턴 분석', '#ec4899', 'ShoppingBasket', '{"category": "analytics", "subcategory": "metrics", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: kpi (6개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000004-0002-4000-8000-000000000001', NULL, NULL, 'KPIDefinition', 'KPI 정의', '핵심 성과 지표 정의', '#dc2626', 'Target', '{"category": "analytics", "subcategory": "kpi", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000004-0002-4000-8000-000000000002', NULL, NULL, 'KPITarget', 'KPI 목표', 'KPI 목표치', '#f59e0b', 'Flag', '{"category": "analytics", "subcategory": "kpi", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0002-4000-8000-000000000003', NULL, NULL, 'KPIActual', 'KPI 실적', 'KPI 실제값', '#22c55e', 'CheckCircle', '{"category": "analytics", "subcategory": "kpi", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0002-4000-8000-000000000004', NULL, NULL, 'Scorecard', '스코어카드', '성과 대시보드', '#3b82f6', 'LayoutDashboard', '{"category": "analytics", "subcategory": "kpi", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0002-4000-8000-000000000005', NULL, NULL, 'Benchmark', '벤치마크', '비교 기준', '#64748b', 'Scale', '{"category": "analytics", "subcategory": "kpi", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000004-0002-4000-8000-000000000006', NULL, NULL, 'Goal', '목표', '비즈니스 목표', '#10b981', 'Mountain', '{"category": "analytics", "subcategory": "kpi", "priority": "high", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: report (4개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000004-0003-4000-8000-000000000001', NULL, NULL, 'ReportDefinition', '리포트 정의', '보고서 템플릿', '#6366f1', 'FileBarChart', '{"category": "analytics", "subcategory": "report", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000004-0003-4000-8000-000000000002', NULL, NULL, 'Dashboard', '대시보드', '실시간 대시보드', '#0ea5e9', 'LayoutDashboard', '{"category": "analytics", "subcategory": "report", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0003-4000-8000-000000000003', NULL, NULL, 'Alert', '알림', '시스템 알림', '#f59e0b', 'Bell', '{"category": "analytics", "subcategory": "report", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000004-0003-4000-8000-000000000004', NULL, NULL, 'Annotation', '주석', '데이터 주석', '#64748b', 'StickyNote', '{"category": "analytics", "subcategory": "report", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ ANALYTICS 도메인 (20개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 5: AI/ML (21개)
-- ---------------------------------------------------------------------------

-- Subcategory: prediction (6개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000005-0001-4000-8000-000000000001', NULL, NULL, 'DemandForecast', '수요 예측', 'AI 수요 예측', '#10b981', 'TrendingUp', '{"category": "ai", "subcategory": "prediction", "priority": "critical", "ai_generated": true}', NOW(), NOW()),
('a0000005-0001-4000-8000-000000000002', NULL, NULL, 'TrafficForecast', '방문객 예측', '방문객 수 예측', '#22c55e', 'Users', '{"category": "ai", "subcategory": "prediction", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0001-4000-8000-000000000003', NULL, NULL, 'StaffingForecast', '인력 예측', '필요 인력 예측', '#6366f1', 'UserPlus', '{"category": "ai", "subcategory": "prediction", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0001-4000-8000-000000000004', NULL, NULL, 'ChurnPrediction', '이탈 예측', '고객 이탈 예측', '#ef4444', 'UserMinus', '{"category": "ai", "subcategory": "prediction", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0001-4000-8000-000000000005', NULL, NULL, 'CLVPrediction', 'CLV 예측', '고객 생애 가치 예측', '#f59e0b', 'Gem', '{"category": "ai", "subcategory": "prediction", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0001-4000-8000-000000000006', NULL, NULL, 'AnomalyDetection', '이상 탐지', '이상 패턴 감지', '#dc2626', 'AlertOctagon', '{"category": "ai", "subcategory": "prediction", "priority": "high", "ai_generated": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: optimization (5개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000005-0002-4000-8000-000000000001', NULL, NULL, 'LayoutOptimization', '레이아웃 최적화', '매장 배치 최적화', '#8b5cf6', 'LayoutGrid', '{"category": "ai", "subcategory": "optimization", "priority": "critical", "ai_generated": true}', NOW(), NOW()),
('a0000005-0002-4000-8000-000000000002', NULL, NULL, 'PricingOptimization', '가격 최적화', '동적 가격 최적화', '#10b981', 'DollarSign', '{"category": "ai", "subcategory": "optimization", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0002-4000-8000-000000000003', NULL, NULL, 'StaffScheduleOptimization', '인력 배치 최적화', '근무 스케줄 최적화', '#6366f1', 'Calendar', '{"category": "ai", "subcategory": "optimization", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0002-4000-8000-000000000004', NULL, NULL, 'ReplenishmentOptimization', '재고 보충 최적화', '발주량 최적화', '#f97316', 'Package', '{"category": "ai", "subcategory": "optimization", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0002-4000-8000-000000000005', NULL, NULL, 'TrafficFlowOptimization', '동선 최적화', '고객 동선 최적화', '#22c55e', 'Route', '{"category": "ai", "subcategory": "optimization", "priority": "high", "ai_generated": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: recommendation (5개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000005-0003-4000-8000-000000000001', NULL, NULL, 'ProductRecommendation', '상품 추천', '개인화 상품 추천', '#ec4899', 'Sparkles', '{"category": "ai", "subcategory": "recommendation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0003-4000-8000-000000000002', NULL, NULL, 'CrossSellRecommendation', '교차판매 추천', '연관 상품 추천', '#f97316', 'ArrowRightLeft', '{"category": "ai", "subcategory": "recommendation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0003-4000-8000-000000000003', NULL, NULL, 'NextBestAction', '다음 최적 행동', '직원 행동 가이드', '#3b82f6', 'Navigation', '{"category": "ai", "subcategory": "recommendation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0003-4000-8000-000000000004', NULL, NULL, 'PersonalizedOffer', '개인화 오퍼', '맞춤 프로모션', '#f59e0b', 'Gift', '{"category": "ai", "subcategory": "recommendation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0003-4000-8000-000000000005', NULL, NULL, 'AIInsight', 'AI 인사이트', 'AI 생성 인사이트', '#facc15', 'Lightbulb', '{"category": "ai", "subcategory": "recommendation", "priority": "critical", "ai_generated": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: simulation (5개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000005-0004-4000-8000-000000000001', NULL, NULL, 'SimulationScenario', '시뮬레이션 시나리오', 'What-if 가정', '#7c3aed', 'Wand2', '{"category": "ai", "subcategory": "simulation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0004-4000-8000-000000000002', NULL, NULL, 'SimulationRun', '시뮬레이션 실행', '시나리오 실행', '#8b5cf6', 'Play', '{"category": "ai", "subcategory": "simulation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0004-4000-8000-000000000003', NULL, NULL, 'SimulationResult', '시뮬레이션 결과', '실행 결과', '#22c55e', 'BarChartBig', '{"category": "ai", "subcategory": "simulation", "priority": "high", "ai_generated": true}', NOW(), NOW()),
('a0000005-0004-4000-8000-000000000004', NULL, NULL, 'SimulatedAgent', '시뮬레이션 에이전트', '가상 고객', '#06b6d4', 'Bot', '{"category": "ai", "subcategory": "simulation", "priority": "medium", "ai_generated": true}', NOW(), NOW()),
('a0000005-0004-4000-8000-000000000005', NULL, NULL, 'CustomerPersona', '고객 페르소나', '가상 고객 유형', '#f472b6', 'UserCircle2', '{"category": "ai", "subcategory": "simulation", "priority": "medium", "ai_generated": true}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ AI/ML 도메인 (21개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 6: EXTERNAL (10개)
-- ---------------------------------------------------------------------------

-- Subcategory: environment (5개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000006-0001-4000-8000-000000000001', NULL, NULL, 'Weather', '날씨', '기상 데이터', '#38bdf8', 'Cloud', '{"category": "external", "subcategory": "environment", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000006-0001-4000-8000-000000000002', NULL, NULL, 'Holiday', '공휴일', '휴일 및 이벤트', '#fb923c', 'Calendar', '{"category": "external", "subcategory": "environment", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000006-0001-4000-8000-000000000003', NULL, NULL, 'LocalEvent', '지역 이벤트', '지역 행사', '#a855f7', 'MapPin', '{"category": "external", "subcategory": "environment", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000006-0001-4000-8000-000000000004', NULL, NULL, 'Competitor', '경쟁사', '경쟁 매장', '#ef4444', 'Building2', '{"category": "external", "subcategory": "environment", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000006-0001-4000-8000-000000000005', NULL, NULL, 'EconomicIndicator', '경제 지표', '거시경제 지표', '#10b981', 'LineChart', '{"category": "external", "subcategory": "environment", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subcategory: integration (5개)
INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000006-0002-4000-8000-000000000001', NULL, NULL, 'DataSource', '데이터 소스', '원천 시스템', '#0ea5e9', 'Database', '{"category": "external", "subcategory": "integration", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000006-0002-4000-8000-000000000002', NULL, NULL, 'DataSourceTable', '데이터 테이블', '원천 테이블', '#38bdf8', 'Table2', '{"category": "external", "subcategory": "integration", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000006-0002-4000-8000-000000000003', NULL, NULL, 'EntityMapping', '엔티티 매핑', '온톨로지 매핑', '#22c55e', 'GitBranch', '{"category": "external", "subcategory": "integration", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000006-0002-4000-8000-000000000004', NULL, NULL, 'ETLJob', 'ETL 작업', '데이터 파이프라인', '#6366f1', 'Workflow', '{"category": "external", "subcategory": "integration", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000006-0002-4000-8000-000000000005', NULL, NULL, 'SyncLog', '동기화 로그', '데이터 동기화 이력', '#64748b', 'FileText', '{"category": "external", "subcategory": "integration", "priority": "low", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ EXTERNAL 도메인 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- DOMAIN 7: ORGANIZATION (4개)
-- ---------------------------------------------------------------------------

INSERT INTO ontology_entity_types (id, org_id, user_id, name, label, description, color, icon, properties, created_at, updated_at)
VALUES
('a0000007-0001-4000-8000-000000000001', NULL, NULL, 'Organization', '조직', '리테일 조직', '#3b82f6', 'Building2', '{"category": "organization", "subcategory": "entity", "priority": "critical", "3d_model": false}', NOW(), NOW()),
('a0000007-0001-4000-8000-000000000002', NULL, NULL, 'Department', '부서', '조직 부서', '#6366f1', 'Users', '{"category": "organization", "subcategory": "entity", "priority": "medium", "3d_model": false}', NOW(), NOW()),
('a0000007-0001-4000-8000-000000000003', NULL, NULL, 'Region', '지역', '영업 지역', '#22c55e', 'Map', '{"category": "organization", "subcategory": "entity", "priority": "high", "3d_model": false}', NOW(), NOW()),
('a0000007-0001-4000-8000-000000000004', NULL, NULL, 'StoreCluster', '매장 클러스터', '매장 그룹', '#8b5cf6', 'Layers', '{"category": "organization", "subcategory": "entity", "priority": "medium", "3d_model": false}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ ORGANIZATION 도메인 (4개) 완료'; END $$;

-- 엔티티 타입 개수 확인
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 2 완료: 마스터 엔티티 타입 %개 생성', v_count;
  RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- NEURALTWIN Master Ontology Migration Script v2.0 - Part 2
-- ============================================================================
-- 관계 타입 100개 + 마이그레이션 + 검증
-- ============================================================================

-- ============================================================================
-- STEP 3: 마스터 관계 타입 100개 INSERT
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 3: 마스터 관계 타입 100개 INSERT';
  RAISE NOTICE '========================================';
END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 1: SPATIAL (15개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000001-0001-4000-8000-000000000001', NULL, NULL, 'CONTAINS', '포함', '상위 공간이 하위 공간을 포함', 'Store', 'Zone', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000002', NULL, NULL, 'HAS_ZONE', '구역 보유', '매장이 구역을 보유', 'Store', 'Zone', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000003', NULL, NULL, 'HAS_SUBZONE', '세부구역 보유', '구역이 세부구역을 포함', 'Zone', 'SubZone', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000004', NULL, NULL, 'CONNECTED_TO', '연결됨', '공간 간 연결', 'Zone', 'Zone', 'bidirectional', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000005', NULL, NULL, 'ADJACENT_TO', '인접함', '공간 간 인접', 'Zone', 'Zone', 'undirected', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000006', NULL, NULL, 'HAS_ENTRANCE', '출입구 보유', '매장 출입구', 'Store', 'Entrance', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000007', NULL, NULL, 'HAS_EXIT', '출구 보유', '비상 출구', 'Store', 'Exit', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000008', NULL, NULL, 'LEADS_TO', '통함', '출입구가 구역으로 연결', 'Entrance', 'Zone', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000009', NULL, NULL, 'HAS_FLOOR', '층 보유', '매장이 층을 보유', 'Store', 'Floor', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000010', NULL, NULL, 'ON_FLOOR', '층 위치', '구역의 층 위치', 'Zone', 'Floor', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000011', NULL, NULL, 'HAS_CHECKOUT_AREA', '계산대 구역 보유', '계산대 구역', 'Store', 'CheckoutArea', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000012', NULL, NULL, 'HAS_FITTING_ROOM', '탈의실 보유', '피팅룸 보유', 'Zone', 'FittingRoom', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000013', NULL, NULL, 'HAS_STORAGE', '창고 보유', '창고 공간', 'Store', 'StorageRoom', 'directed', '{"category": "spatial", "priority": "medium"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000014', NULL, NULL, 'HAS_SERVICE_AREA', '서비스 구역 보유', '고객 서비스 공간', 'Store', 'ServiceArea', 'directed', '{"category": "spatial", "priority": "medium"}', NOW(), NOW()),
('b0000001-0001-4000-8000-000000000015', NULL, NULL, 'HAS_AISLE', '통로 보유', '구역 내 통로', 'Zone', 'Aisle', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ SPATIAL 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 2: FURNITURE (12개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000002-0001-4000-8000-000000000001', NULL, NULL, 'LOCATED_IN', '위치함', '가구가 구역에 위치', 'Shelf', 'Zone', 'directed', '{"category": "furniture", "priority": "critical"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000002', NULL, NULL, 'HAS_SHELF', '선반 보유', '구역이 선반 보유', 'Zone', 'Shelf', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000003', NULL, NULL, 'HAS_RACK', '랙 보유', '구역이 행거 보유', 'Zone', 'Rack', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000004', NULL, NULL, 'HAS_DISPLAY_TABLE', '디스플레이 테이블 보유', '진열 테이블', 'Zone', 'DisplayTable', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000005', NULL, NULL, 'HAS_GONDOLA', '곤돌라 보유', '양면 진열대', 'Zone', 'Gondola', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000006', NULL, NULL, 'HAS_ENDCAP', '엔드캡 보유', '진열대 끝 매대', 'Gondola', 'EndCap', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000007', NULL, NULL, 'HAS_SHOWCASE', '쇼케이스 보유', '유리 진열장', 'Zone', 'Showcase', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000008', NULL, NULL, 'HAS_CHECKOUT_COUNTER', '계산대 보유', '결제 카운터', 'CheckoutArea', 'CheckoutCounter', 'directed', '{"category": "furniture", "priority": "critical"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000009', NULL, NULL, 'HAS_KIOSK', '키오스크 보유', '셀프 서비스 단말', 'Zone', 'Kiosk', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000010', NULL, NULL, 'HAS_DIGITAL_SIGNAGE', '사이니지 보유', '디지털 광고판', 'Zone', 'DigitalSignage', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000011', NULL, NULL, 'NEAR_TO', '근접함', '가구 간 근접', '*', '*', 'undirected', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('b0000002-0001-4000-8000-000000000012', NULL, NULL, 'FACES', '마주봄', '가구 배치 방향', '*', '*', 'directed', '{"category": "furniture", "priority": "low"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ FURNITURE 관계 (12개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 3: PRODUCT (15개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000003-0001-4000-8000-000000000001', NULL, NULL, 'BELONGS_TO_CATEGORY', '카테고리 소속', '상품의 카테고리', 'Product', 'Category', 'directed', '{"category": "product", "priority": "critical"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000002', NULL, NULL, 'BELONGS_TO_SUBCATEGORY', '서브카테고리 소속', '상품의 서브카테고리', 'Product', 'SubCategory', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000003', NULL, NULL, 'MANUFACTURED_BY', '제조사', '상품 제조사', 'Product', 'Brand', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000004', NULL, NULL, 'SUPPLIED_BY', '공급됨', '상품 공급업체', 'Product', 'Supplier', 'directed', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000005', NULL, NULL, 'DISPLAYED_ON', '진열됨', '선반에 진열', 'Product', 'Shelf', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000006', NULL, NULL, 'PLACED_ON_RACK', '랙 배치', '행거에 배치', 'Product', 'Rack', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000007', NULL, NULL, 'PLACED_ON_TABLE', '테이블 배치', '테이블에 진열', 'Product', 'DisplayTable', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000008', NULL, NULL, 'PLACED_IN_ZONE', '구역 배치', '상품의 구역 위치', 'Product', 'Zone', 'directed', '{"category": "product", "priority": "critical"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000009', NULL, NULL, 'HAS_VARIANT', '변형 보유', '상품 변형', 'Product', 'ProductVariant', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000010', NULL, NULL, 'PART_OF_BUNDLE', '번들 구성', '묶음 상품 구성', 'Product', 'ProductBundle', 'directed', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000011', NULL, NULL, 'FREQUENTLY_BOUGHT_WITH', '함께 구매', '연관 구매 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000012', NULL, NULL, 'SIMILAR_TO', '유사함', '유사 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000013', NULL, NULL, 'SUBSTITUTE_FOR', '대체품', '대체 가능 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000014', NULL, NULL, 'DEFINED_IN_PLANOGRAM', '플래노그램 정의', '진열 계획', 'Product', 'Planogram', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('b0000003-0001-4000-8000-000000000015', NULL, NULL, 'HAS_PLACEMENT', '배치 정보', '상품 배치', 'Product', 'ProductPlacement', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ PRODUCT 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 4: INVENTORY (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000004-0001-4000-8000-000000000001', NULL, NULL, 'HAS_INVENTORY', '재고 보유', '상품 재고', 'Product', 'Inventory', 'directed', '{"category": "inventory", "priority": "critical"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000002', NULL, NULL, 'STORED_AT', '매장 재고', '재고 매장', 'Inventory', 'Store', 'directed', '{"category": "inventory", "priority": "critical"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000003', NULL, NULL, 'STORED_IN_LOCATION', '위치 재고', '재고 위치', 'Inventory', 'InventoryLocation', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000004', NULL, NULL, 'STORED_IN_STORAGE', '창고 보관', '창고 재고', 'Inventory', 'StorageRoom', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000005', NULL, NULL, 'RECEIVED_FROM', '입고처', '재고 입고', 'StockReceipt', 'Supplier', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000006', NULL, NULL, 'TRANSFERRED_TO', '이전 대상', '재고 이전', 'StockTransfer', 'Store', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000007', NULL, NULL, 'TRANSFERRED_FROM', '이전 출발', '재고 이전 출발', 'StockTransfer', 'Store', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000008', NULL, NULL, 'ORDERED_FROM', '발주처', '발주 공급업체', 'PurchaseOrder', 'Supplier', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000009', NULL, NULL, 'ORDERS_PRODUCT', '발주 상품', '발주 대상 상품', 'PurchaseOrder', 'Product', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('b0000004-0001-4000-8000-000000000010', NULL, NULL, 'TRIGGERS_ALERT', '알림 발생', '재고 알림', 'Inventory', 'InventoryAlert', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ INVENTORY 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 5: CUSTOMER (18개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000005-0001-4000-8000-000000000001', NULL, NULL, 'HAS_VISIT', '방문 보유', '고객 방문 기록', 'Customer', 'Visit', 'directed', '{"category": "customer", "priority": "critical"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000002', NULL, NULL, 'VISITED_STORE', '매장 방문', '방문한 매장', 'Visit', 'Store', 'directed', '{"category": "customer", "priority": "critical"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000003', NULL, NULL, 'ENTERED_THROUGH', '출입구 진입', '진입 출입구', 'Visit', 'Entrance', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000004', NULL, NULL, 'ENTERED_ZONE', '구역 진입', '방문한 구역', 'Visit', 'Zone', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000005', NULL, NULL, 'DWELLED_IN', '체류함', '구역 체류', 'Visit', 'ZoneDwell', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000006', NULL, NULL, 'HAS_JOURNEY', '여정 보유', '고객 동선', 'Visit', 'CustomerJourney', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000007', NULL, NULL, 'HAS_PATH_SEGMENT', '경로 구간', '여정 세그먼트', 'CustomerJourney', 'PathSegment', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000008', NULL, NULL, 'BELONGS_TO_SEGMENT', '세그먼트 소속', '고객 그룹', 'Customer', 'CustomerSegment', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000009', NULL, NULL, 'HAS_PROFILE', '프로필 보유', '고객 상세 정보', 'Customer', 'CustomerProfile', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000010', NULL, NULL, 'HAS_LOYALTY_ACCOUNT', '멤버십 보유', '로열티 계정', 'Customer', 'LoyaltyAccount', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000011', NULL, NULL, 'HAS_PREFERENCE', '선호도 보유', '고객 취향', 'Customer', 'CustomerPreference', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000012', NULL, NULL, 'INTERACTED_WITH_PRODUCT', '상품 상호작용', '상품 터치/픽업', 'Visit', 'ProductInteraction', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000013', NULL, NULL, 'USED_FITTING_ROOM', '탈의실 사용', '피팅룸 세션', 'Visit', 'FittingRoomSession', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000014', NULL, NULL, 'WAITED_IN_QUEUE', '대기열 경험', '줄서기', 'Visit', 'QueueEvent', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000015', NULL, NULL, 'DETECTED_BY_SENSOR', '센서 감지', 'WiFi/비콘 감지', 'Customer', 'WiFiSensor', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000016', NULL, NULL, 'CAPTURED_BY_CAMERA', '카메라 촬영', '영상 캡처', 'Customer', 'Camera', 'directed', '{"category": "customer", "priority": "low"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000017', NULL, NULL, 'INFERRED_INTENT', '의도 추론', '방문 목적 추론', 'Visit', 'VisitIntent', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('b0000005-0001-4000-8000-000000000018', NULL, NULL, 'PROVIDED_FEEDBACK', '피드백 제공', '고객 평가', 'Customer', 'CustomerFeedback', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ CUSTOMER 관계 (18개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 6: TRANSACTION (15개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000006-0001-4000-8000-000000000001', NULL, NULL, 'MADE_TRANSACTION', '거래함', '고객 거래', 'Customer', 'Transaction', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000002', NULL, NULL, 'RESULTED_FROM_VISIT', '방문 결과', '방문 후 거래', 'Transaction', 'Visit', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000003', NULL, NULL, 'HAS_LINE_ITEM', '항목 보유', '거래 라인', 'Transaction', 'TransactionLine', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000004', NULL, NULL, 'PURCHASED_PRODUCT', '제품 구매', '구매 상품', 'TransactionLine', 'Product', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000005', NULL, NULL, 'PAID_WITH', '결제 수단', '결제 방법', 'Transaction', 'Payment', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000006', NULL, NULL, 'APPLIED_DISCOUNT', '할인 적용', '적용된 할인', 'Transaction', 'Discount', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000007', NULL, NULL, 'APPLIED_PROMOTION', '프로모션 적용', '적용된 프로모션', 'Transaction', 'Promotion', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000008', NULL, NULL, 'USED_COUPON', '쿠폰 사용', '사용된 쿠폰', 'Transaction', 'Coupon', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000009', NULL, NULL, 'CHECKED_OUT_AT', '계산대 결제', '결제 위치', 'Transaction', 'CheckoutCounter', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000010', NULL, NULL, 'OCCURRED_AT_STORE', '매장 거래', '거래 매장', 'Transaction', 'Store', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000011', NULL, NULL, 'HAS_RETURN', '반품 발생', '반품 처리', 'Transaction', 'Return', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000012', NULL, NULL, 'HAS_EXCHANGE', '교환 발생', '교환 처리', 'Transaction', 'Exchange', 'directed', '{"category": "transaction", "priority": "medium"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000013', NULL, NULL, 'FROM_BASKET', '장바구니 기반', '장바구니 전환', 'Transaction', 'Basket', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000014', NULL, NULL, 'ADDED_TO_BASKET', '장바구니 추가', '장바구니 담기', 'Product', 'Basket', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('b0000006-0001-4000-8000-000000000015', NULL, NULL, 'USED_GIFT_CARD', '기프트카드 사용', '상품권 결제', 'Transaction', 'GiftCard', 'directed', '{"category": "transaction", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ TRANSACTION 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 7: STAFF (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000007-0001-4000-8000-000000000001', NULL, NULL, 'WORKS_AT', '근무함', '직원 근무 매장', 'Staff', 'Store', 'directed', '{"category": "staff", "priority": "critical"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000002', NULL, NULL, 'HAS_ROLE', '역할 보유', '직원 직책', 'Staff', 'StaffRole', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000003', NULL, NULL, 'SCHEDULED_FOR', '스케줄 배정', '근무 스케줄', 'Staff', 'StaffSchedule', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000004', NULL, NULL, 'ASSIGNED_TO_SHIFT', '시프트 배정', '근무 시간', 'Staff', 'Shift', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000005', NULL, NULL, 'ASSIGNED_TO_ZONE', '구역 배정', '담당 구역', 'Staff', 'Zone', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000006', NULL, NULL, 'ASSIGNED_TO_TASK', '작업 배정', '담당 작업', 'Staff', 'Task', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000007', NULL, NULL, 'COMPLETED_TASK', '작업 완료', '완료한 작업', 'Staff', 'Task', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000008', NULL, NULL, 'HAS_PERFORMANCE', '성과 기록', '성과 지표', 'Staff', 'StaffPerformance', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000009', NULL, NULL, 'PROCESSED_TRANSACTION', '거래 처리', '처리한 거래', 'Staff', 'Transaction', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('b0000007-0001-4000-8000-000000000010', NULL, NULL, 'REPORTS_TO', '보고 관계', '상위 직원', 'Staff', 'Staff', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ STAFF 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 8: AI (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000008-0001-4000-8000-000000000001', NULL, NULL, 'PREDICTED_FOR_PRODUCT', '상품 예측', '수요 예측 대상', 'DemandForecast', 'Product', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000002', NULL, NULL, 'PREDICTED_FOR_STORE', '매장 예측', '방문객 예측 대상', 'TrafficForecast', 'Store', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000003', NULL, NULL, 'OPTIMIZES_LAYOUT', '레이아웃 최적화', '배치 최적화', 'LayoutOptimization', 'Zone', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000004', NULL, NULL, 'OPTIMIZES_PRICE', '가격 최적화', '가격 최적화', 'PricingOptimization', 'Product', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000005', NULL, NULL, 'OPTIMIZES_STAFFING', '인력 최적화', '인력 배치 최적화', 'StaffScheduleOptimization', 'Store', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000006', NULL, NULL, 'RECOMMENDS_TO_CUSTOMER', '고객 추천', '상품 추천', 'ProductRecommendation', 'Customer', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000007', NULL, NULL, 'RECOMMENDS_PRODUCT', '상품 추천', '추천 상품', 'ProductRecommendation', 'Product', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000008', NULL, NULL, 'SUGGESTS_ACTION', '행동 제안', '다음 행동', 'NextBestAction', 'Staff', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000009', NULL, NULL, 'GENERATED_INSIGHT', '인사이트 생성', 'AI 인사이트', 'AIInsight', 'Store', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('b0000008-0001-4000-8000-000000000010', NULL, NULL, 'SIMULATES_SCENARIO', '시나리오 시뮬레이션', '시뮬레이션 실행', 'SimulationRun', 'SimulationScenario', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ AI 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 9: ORGANIZATION (5개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('b0000009-0001-4000-8000-000000000001', NULL, NULL, 'OPERATES', '운영함', '조직의 매장 운영', 'Organization', 'Store', 'directed', '{"category": "organization", "priority": "critical"}', NOW(), NOW()),
('b0000009-0001-4000-8000-000000000002', NULL, NULL, 'HAS_DEPARTMENT', '부서 보유', '조직 부서', 'Organization', 'Department', 'directed', '{"category": "organization", "priority": "medium"}', NOW(), NOW()),
('b0000009-0001-4000-8000-000000000003', NULL, NULL, 'MANAGES_REGION', '지역 관리', '영업 지역', 'Organization', 'Region', 'directed', '{"category": "organization", "priority": "high"}', NOW(), NOW()),
('b0000009-0001-4000-8000-000000000004', NULL, NULL, 'IN_REGION', '지역 소속', '매장 지역', 'Store', 'Region', 'directed', '{"category": "organization", "priority": "high"}', NOW(), NOW()),
('b0000009-0001-4000-8000-000000000005', NULL, NULL, 'BELONGS_TO_CLUSTER', '클러스터 소속', '매장 그룹', 'Store', 'StoreCluster', 'directed', '{"category": "organization", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ ORGANIZATION 관계 (5개) 완료'; END $$;

-- 관계 타입 개수 확인
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 3 완료: 마스터 관계 타입 %개 생성', v_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 4: graph_entities/relations 마이그레이션 (기존 → 마스터 타입 연결)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 4: 기존 데이터 마이그레이션';
  RAISE NOTICE '========================================';
END $$;

-- ---------------------------------------------------------------------------
-- 4-A: 마이그레이션 전 상세 백업 (타입명 포함)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS graph_entities_migration_backup;
CREATE TABLE graph_entities_migration_backup AS
SELECT
  ge.id,
  ge.entity_type_id AS old_entity_type_id,
  oet.name AS old_type_name,
  oet.user_id AS old_type_user_id,
  CASE WHEN oet.org_id IS NULL AND oet.user_id IS NULL THEN 'master' ELSE 'user' END AS old_type_scope
FROM graph_entities ge
LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id;

DROP TABLE IF EXISTS graph_relations_migration_backup;
CREATE TABLE graph_relations_migration_backup AS
SELECT
  gr.id,
  gr.relation_type_id AS old_relation_type_id,
  ort.name AS old_type_name,
  ort.user_id AS old_type_user_id,
  CASE WHEN ort.org_id IS NULL AND ort.user_id IS NULL THEN 'master' ELSE 'user' END AS old_type_scope
FROM graph_relations gr
LEFT JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id;

DO $$
DECLARE
  v_entity_backup_count INTEGER;
  v_relation_backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_entity_backup_count FROM graph_entities_migration_backup;
  SELECT COUNT(*) INTO v_relation_backup_count FROM graph_relations_migration_backup;
  RAISE NOTICE '📦 백업 완료: graph_entities %개, graph_relations %개', v_entity_backup_count, v_relation_backup_count;
END $$;

-- ---------------------------------------------------------------------------
-- 4-B: 마이그레이션 전 통계
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_total_entities INTEGER;
  v_entities_with_type INTEGER;
  v_entities_null_type INTEGER;
  v_entities_master_type INTEGER;
  v_entities_user_type INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_entities FROM graph_entities;
  SELECT COUNT(*) INTO v_entities_with_type FROM graph_entities WHERE entity_type_id IS NOT NULL;
  SELECT COUNT(*) INTO v_entities_null_type FROM graph_entities WHERE entity_type_id IS NULL;

  SELECT COUNT(*) INTO v_entities_master_type
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
  WHERE oet.org_id IS NULL AND oet.user_id IS NULL;

  SELECT COUNT(*) INTO v_entities_user_type
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
  WHERE oet.user_id IS NOT NULL;

  RAISE NOTICE '📊 마이그레이션 전 graph_entities 통계:';
  RAISE NOTICE '   - 총 엔티티: %개', v_total_entities;
  RAISE NOTICE '   - 타입 있음: %개', v_entities_with_type;
  RAISE NOTICE '   - 타입 NULL: %개', v_entities_null_type;
  RAISE NOTICE '   - 마스터 타입 참조: %개', v_entities_master_type;
  RAISE NOTICE '   - 사용자 타입 참조: %개', v_entities_user_type;
END $$;

-- ---------------------------------------------------------------------------
-- 4-C: graph_entities 마이그레이션 (사용자 타입 → 마스터 타입)
-- ---------------------------------------------------------------------------
-- 동일한 이름의 마스터 타입이 존재하는 경우에만 업데이트
UPDATE graph_entities ge
SET entity_type_id = master.id
FROM ontology_entity_types master
WHERE master.org_id IS NULL
  AND master.user_id IS NULL
  AND master.name = (
    SELECT old.name
    FROM ontology_entity_types old
    WHERE old.id = ge.entity_type_id
  )
  AND ge.entity_type_id != master.id;

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ graph_entities 업데이트: %개 행', v_updated;
END $$;

-- ---------------------------------------------------------------------------
-- 4-D: graph_relations 마이그레이션 (사용자 타입 → 마스터 타입)
-- ---------------------------------------------------------------------------
UPDATE graph_relations gr
SET relation_type_id = master.id
FROM ontology_relation_types master
WHERE master.org_id IS NULL
  AND master.user_id IS NULL
  AND master.name = (
    SELECT old.name
    FROM ontology_relation_types old
    WHERE old.id = gr.relation_type_id
  )
  AND gr.relation_type_id != master.id;

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ graph_relations 업데이트: %개 행', v_updated;
END $$;

-- ---------------------------------------------------------------------------
-- 4-E: 마이그레이션 후 검증
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_orphan_entities INTEGER;
  v_orphan_relations INTEGER;
  v_unmapped_entities INTEGER;
  v_unmapped_relations INTEGER;
  v_master_ref_entities INTEGER;
  v_master_ref_relations INTEGER;
BEGIN
  -- NULL entity_type_id를 가진 엔티티 (고아 데이터)
  SELECT COUNT(*) INTO v_orphan_entities
  FROM graph_entities WHERE entity_type_id IS NULL;

  -- NULL relation_type_id를 가진 관계 (고아 데이터)
  SELECT COUNT(*) INTO v_orphan_relations
  FROM graph_relations WHERE relation_type_id IS NULL;

  -- 존재하지 않는 타입 ID를 참조하는 엔티티
  SELECT COUNT(*) INTO v_unmapped_entities
  FROM graph_entities ge
  WHERE ge.entity_type_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM ontology_entity_types oet WHERE oet.id = ge.entity_type_id
    );

  -- 존재하지 않는 타입 ID를 참조하는 관계
  SELECT COUNT(*) INTO v_unmapped_relations
  FROM graph_relations gr
  WHERE gr.relation_type_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM ontology_relation_types ort WHERE ort.id = gr.relation_type_id
    );

  -- 마스터 타입을 참조하는 엔티티
  SELECT COUNT(*) INTO v_master_ref_entities
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
  WHERE oet.org_id IS NULL AND oet.user_id IS NULL;

  -- 마스터 타입을 참조하는 관계
  SELECT COUNT(*) INTO v_master_ref_relations
  FROM graph_relations gr
  JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
  WHERE ort.org_id IS NULL AND ort.user_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 마이그레이션 후 검증 결과:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   [graph_entities]';
  RAISE NOTICE '   - 마스터 타입 참조: %개 ✅', v_master_ref_entities;
  RAISE NOTICE '   - NULL 타입 (고아): %개 %', v_orphan_entities,
    CASE WHEN v_orphan_entities > 0 THEN '⚠️' ELSE '✅' END;
  RAISE NOTICE '   - 존재하지 않는 타입: %개 %', v_unmapped_entities,
    CASE WHEN v_unmapped_entities > 0 THEN '❌' ELSE '✅' END;
  RAISE NOTICE '';
  RAISE NOTICE '   [graph_relations]';
  RAISE NOTICE '   - 마스터 타입 참조: %개 ✅', v_master_ref_relations;
  RAISE NOTICE '   - NULL 타입 (고아): %개 %', v_orphan_relations,
    CASE WHEN v_orphan_relations > 0 THEN '⚠️' ELSE '✅' END;
  RAISE NOTICE '   - 존재하지 않는 타입: %개 %', v_unmapped_relations,
    CASE WHEN v_unmapped_relations > 0 THEN '❌' ELSE '✅' END;
END $$;

-- ---------------------------------------------------------------------------
-- 4-F: 고아 데이터 상세 리포트 (문제 있는 경우만)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_orphan_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM graph_entities ge
  LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
  WHERE oet.id IS NULL AND ge.entity_type_id IS NOT NULL;

  IF v_orphan_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ 매핑 실패 엔티티 상세 (최대 10개):';
    FOR rec IN
      SELECT ge.id, ge.label, ge.entity_type_id, backup.old_type_name
      FROM graph_entities ge
      LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
      LEFT JOIN graph_entities_migration_backup backup ON ge.id = backup.id
      WHERE oet.id IS NULL AND ge.entity_type_id IS NOT NULL
      LIMIT 10
    LOOP
      RAISE NOTICE '   - ID: %, Label: %, OldTypeName: %', rec.id, rec.label, rec.old_type_name;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: 중복 정리 (선택적 - 주석 처리됨)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 5: 중복 정리 (선택적)';
  RAISE NOTICE '========================================';
END $$;

-- 주의: 이 단계는 신중하게 실행하세요
-- 마스터 타입과 동일한 이름의 사용자별 타입 중 참조되지 않는 것만 삭제

/*
DELETE FROM ontology_entity_types dup
WHERE dup.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM ontology_entity_types master
    WHERE master.org_id IS NULL
      AND master.user_id IS NULL
      AND master.name = dup.name
  )
  AND NOT EXISTS (
    SELECT 1 FROM graph_entities ge
    WHERE ge.entity_type_id = dup.id
  );

DELETE FROM ontology_relation_types dup
WHERE dup.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM ontology_relation_types master
    WHERE master.org_id IS NULL
      AND master.user_id IS NULL
      AND master.name = dup.name
  )
  AND NOT EXISTS (
    SELECT 1 FROM graph_relations gr
    WHERE gr.relation_type_id = dup.id
  );
*/

DO $$ BEGIN RAISE NOTICE '⚠️ 중복 정리는 주석 처리됨 - 필요시 수동 실행'; END $$;

-- ============================================================================
-- STEP 6: 검증 쿼리
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 6: 검증';
  RAISE NOTICE '========================================';
END $$;

-- 마스터 엔티티 타입 통계
DO $$
DECLARE
  v_total INTEGER;
  v_physical INTEGER;
  v_human INTEGER;
  v_commercial INTEGER;
  v_analytics INTEGER;
  v_ai INTEGER;
  v_external INTEGER;
  v_organization INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL;
  SELECT COUNT(*) INTO v_physical FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'physical';
  SELECT COUNT(*) INTO v_human FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'human';
  SELECT COUNT(*) INTO v_commercial FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'commercial';
  SELECT COUNT(*) INTO v_analytics FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'analytics';
  SELECT COUNT(*) INTO v_ai FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'ai';
  SELECT COUNT(*) INTO v_external FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'external';
  SELECT COUNT(*) INTO v_organization FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'organization';

  RAISE NOTICE '📊 마스터 엔티티 타입 통계:';
  RAISE NOTICE '   - 총계: %개', v_total;
  RAISE NOTICE '   - PHYSICAL: %개', v_physical;
  RAISE NOTICE '   - HUMAN: %개', v_human;
  RAISE NOTICE '   - COMMERCIAL: %개', v_commercial;
  RAISE NOTICE '   - ANALYTICS: %개', v_analytics;
  RAISE NOTICE '   - AI: %개', v_ai;
  RAISE NOTICE '   - EXTERNAL: %개', v_external;
  RAISE NOTICE '   - ORGANIZATION: %개', v_organization;
END $$;

-- 마스터 관계 타입 통계
DO $$
DECLARE
  v_total INTEGER;
  v_spatial INTEGER;
  v_furniture INTEGER;
  v_product INTEGER;
  v_inventory INTEGER;
  v_customer INTEGER;
  v_transaction INTEGER;
  v_staff INTEGER;
  v_ai INTEGER;
  v_organization INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL;
  SELECT COUNT(*) INTO v_spatial FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'spatial';
  SELECT COUNT(*) INTO v_furniture FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'furniture';
  SELECT COUNT(*) INTO v_product FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'product';
  SELECT COUNT(*) INTO v_inventory FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'inventory';
  SELECT COUNT(*) INTO v_customer FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'customer';
  SELECT COUNT(*) INTO v_transaction FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'transaction';
  SELECT COUNT(*) INTO v_staff FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'staff';
  SELECT COUNT(*) INTO v_ai FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'ai';
  SELECT COUNT(*) INTO v_organization FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL AND properties->>'category' = 'organization';

  RAISE NOTICE '📊 마스터 관계 타입 통계:';
  RAISE NOTICE '   - 총계: %개', v_total;
  RAISE NOTICE '   - SPATIAL: %개', v_spatial;
  RAISE NOTICE '   - FURNITURE: %개', v_furniture;
  RAISE NOTICE '   - PRODUCT: %개', v_product;
  RAISE NOTICE '   - INVENTORY: %개', v_inventory;
  RAISE NOTICE '   - CUSTOMER: %개', v_customer;
  RAISE NOTICE '   - TRANSACTION: %개', v_transaction;
  RAISE NOTICE '   - STAFF: %개', v_staff;
  RAISE NOTICE '   - AI: %개', v_ai;
  RAISE NOTICE '   - ORGANIZATION: %개', v_organization;
END $$;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 마이그레이션 완료!';
  RAISE NOTICE '========================================';
END $$;
