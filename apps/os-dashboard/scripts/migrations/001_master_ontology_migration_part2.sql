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
('r0000001-0001-4000-8000-000000000001', NULL, NULL, 'CONTAINS', '포함', '상위 공간이 하위 공간을 포함', 'Store', 'Zone', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000002', NULL, NULL, 'HAS_ZONE', '구역 보유', '매장이 구역을 보유', 'Store', 'Zone', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000003', NULL, NULL, 'HAS_SUBZONE', '세부구역 보유', '구역이 세부구역을 포함', 'Zone', 'SubZone', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000004', NULL, NULL, 'CONNECTED_TO', '연결됨', '공간 간 연결', 'Zone', 'Zone', 'bidirectional', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000005', NULL, NULL, 'ADJACENT_TO', '인접함', '공간 간 인접', 'Zone', 'Zone', 'undirected', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000006', NULL, NULL, 'HAS_ENTRANCE', '출입구 보유', '매장 출입구', 'Store', 'Entrance', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000007', NULL, NULL, 'HAS_EXIT', '출구 보유', '비상 출구', 'Store', 'Exit', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000008', NULL, NULL, 'LEADS_TO', '통함', '출입구가 구역으로 연결', 'Entrance', 'Zone', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000009', NULL, NULL, 'HAS_FLOOR', '층 보유', '매장이 층을 보유', 'Store', 'Floor', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000010', NULL, NULL, 'ON_FLOOR', '층 위치', '구역의 층 위치', 'Zone', 'Floor', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000011', NULL, NULL, 'HAS_CHECKOUT_AREA', '계산대 구역 보유', '계산대 구역', 'Store', 'CheckoutArea', 'directed', '{"category": "spatial", "priority": "critical"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000012', NULL, NULL, 'HAS_FITTING_ROOM', '탈의실 보유', '피팅룸 보유', 'Zone', 'FittingRoom', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000013', NULL, NULL, 'HAS_STORAGE', '창고 보유', '창고 공간', 'Store', 'StorageRoom', 'directed', '{"category": "spatial", "priority": "medium"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000014', NULL, NULL, 'HAS_SERVICE_AREA', '서비스 구역 보유', '고객 서비스 공간', 'Store', 'ServiceArea', 'directed', '{"category": "spatial", "priority": "medium"}', NOW(), NOW()),
('r0000001-0001-4000-8000-000000000015', NULL, NULL, 'HAS_AISLE', '통로 보유', '구역 내 통로', 'Zone', 'Aisle', 'directed', '{"category": "spatial", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ SPATIAL 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 2: FURNITURE (12개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000002-0001-4000-8000-000000000001', NULL, NULL, 'LOCATED_IN', '위치함', '가구가 구역에 위치', 'Shelf', 'Zone', 'directed', '{"category": "furniture", "priority": "critical"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000002', NULL, NULL, 'HAS_SHELF', '선반 보유', '구역이 선반 보유', 'Zone', 'Shelf', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000003', NULL, NULL, 'HAS_RACK', '랙 보유', '구역이 행거 보유', 'Zone', 'Rack', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000004', NULL, NULL, 'HAS_DISPLAY_TABLE', '디스플레이 테이블 보유', '진열 테이블', 'Zone', 'DisplayTable', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000005', NULL, NULL, 'HAS_GONDOLA', '곤돌라 보유', '양면 진열대', 'Zone', 'Gondola', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000006', NULL, NULL, 'HAS_ENDCAP', '엔드캡 보유', '진열대 끝 매대', 'Gondola', 'EndCap', 'directed', '{"category": "furniture", "priority": "high"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000007', NULL, NULL, 'HAS_SHOWCASE', '쇼케이스 보유', '유리 진열장', 'Zone', 'Showcase', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000008', NULL, NULL, 'HAS_CHECKOUT_COUNTER', '계산대 보유', '결제 카운터', 'CheckoutArea', 'CheckoutCounter', 'directed', '{"category": "furniture", "priority": "critical"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000009', NULL, NULL, 'HAS_KIOSK', '키오스크 보유', '셀프 서비스 단말', 'Zone', 'Kiosk', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000010', NULL, NULL, 'HAS_DIGITAL_SIGNAGE', '사이니지 보유', '디지털 광고판', 'Zone', 'DigitalSignage', 'directed', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000011', NULL, NULL, 'NEAR_TO', '근접함', '가구 간 근접', '*', '*', 'undirected', '{"category": "furniture", "priority": "medium"}', NOW(), NOW()),
('r0000002-0001-4000-8000-000000000012', NULL, NULL, 'FACES', '마주봄', '가구 배치 방향', '*', '*', 'directed', '{"category": "furniture", "priority": "low"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ FURNITURE 관계 (12개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 3: PRODUCT (15개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000003-0001-4000-8000-000000000001', NULL, NULL, 'BELONGS_TO_CATEGORY', '카테고리 소속', '상품의 카테고리', 'Product', 'Category', 'directed', '{"category": "product", "priority": "critical"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000002', NULL, NULL, 'BELONGS_TO_SUBCATEGORY', '서브카테고리 소속', '상품의 서브카테고리', 'Product', 'SubCategory', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000003', NULL, NULL, 'MANUFACTURED_BY', '제조사', '상품 제조사', 'Product', 'Brand', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000004', NULL, NULL, 'SUPPLIED_BY', '공급됨', '상품 공급업체', 'Product', 'Supplier', 'directed', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000005', NULL, NULL, 'DISPLAYED_ON', '진열됨', '선반에 진열', 'Product', 'Shelf', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000006', NULL, NULL, 'PLACED_ON_RACK', '랙 배치', '행거에 배치', 'Product', 'Rack', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000007', NULL, NULL, 'PLACED_ON_TABLE', '테이블 배치', '테이블에 진열', 'Product', 'DisplayTable', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000008', NULL, NULL, 'PLACED_IN_ZONE', '구역 배치', '상품의 구역 위치', 'Product', 'Zone', 'directed', '{"category": "product", "priority": "critical"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000009', NULL, NULL, 'HAS_VARIANT', '변형 보유', '상품 변형', 'Product', 'ProductVariant', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000010', NULL, NULL, 'PART_OF_BUNDLE', '번들 구성', '묶음 상품 구성', 'Product', 'ProductBundle', 'directed', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000011', NULL, NULL, 'FREQUENTLY_BOUGHT_WITH', '함께 구매', '연관 구매 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000012', NULL, NULL, 'SIMILAR_TO', '유사함', '유사 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000013', NULL, NULL, 'SUBSTITUTE_FOR', '대체품', '대체 가능 상품', 'Product', 'Product', 'undirected', '{"category": "product", "priority": "medium"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000014', NULL, NULL, 'DEFINED_IN_PLANOGRAM', '플래노그램 정의', '진열 계획', 'Product', 'Planogram', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW()),
('r0000003-0001-4000-8000-000000000015', NULL, NULL, 'HAS_PLACEMENT', '배치 정보', '상품 배치', 'Product', 'ProductPlacement', 'directed', '{"category": "product", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ PRODUCT 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 4: INVENTORY (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000004-0001-4000-8000-000000000001', NULL, NULL, 'HAS_INVENTORY', '재고 보유', '상품 재고', 'Product', 'Inventory', 'directed', '{"category": "inventory", "priority": "critical"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000002', NULL, NULL, 'STORED_AT', '매장 재고', '재고 매장', 'Inventory', 'Store', 'directed', '{"category": "inventory", "priority": "critical"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000003', NULL, NULL, 'STORED_IN_LOCATION', '위치 재고', '재고 위치', 'Inventory', 'InventoryLocation', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000004', NULL, NULL, 'STORED_IN_STORAGE', '창고 보관', '창고 재고', 'Inventory', 'StorageRoom', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000005', NULL, NULL, 'RECEIVED_FROM', '입고처', '재고 입고', 'StockReceipt', 'Supplier', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000006', NULL, NULL, 'TRANSFERRED_TO', '이전 대상', '재고 이전', 'StockTransfer', 'Store', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000007', NULL, NULL, 'TRANSFERRED_FROM', '이전 출발', '재고 이전 출발', 'StockTransfer', 'Store', 'directed', '{"category": "inventory", "priority": "medium"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000008', NULL, NULL, 'ORDERED_FROM', '발주처', '발주 공급업체', 'PurchaseOrder', 'Supplier', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000009', NULL, NULL, 'ORDERS_PRODUCT', '발주 상품', '발주 대상 상품', 'PurchaseOrder', 'Product', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW()),
('r0000004-0001-4000-8000-000000000010', NULL, NULL, 'TRIGGERS_ALERT', '알림 발생', '재고 알림', 'Inventory', 'InventoryAlert', 'directed', '{"category": "inventory", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ INVENTORY 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 5: CUSTOMER (18개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000005-0001-4000-8000-000000000001', NULL, NULL, 'HAS_VISIT', '방문 보유', '고객 방문 기록', 'Customer', 'Visit', 'directed', '{"category": "customer", "priority": "critical"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000002', NULL, NULL, 'VISITED_STORE', '매장 방문', '방문한 매장', 'Visit', 'Store', 'directed', '{"category": "customer", "priority": "critical"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000003', NULL, NULL, 'ENTERED_THROUGH', '출입구 진입', '진입 출입구', 'Visit', 'Entrance', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000004', NULL, NULL, 'ENTERED_ZONE', '구역 진입', '방문한 구역', 'Visit', 'Zone', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000005', NULL, NULL, 'DWELLED_IN', '체류함', '구역 체류', 'Visit', 'ZoneDwell', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000006', NULL, NULL, 'HAS_JOURNEY', '여정 보유', '고객 동선', 'Visit', 'CustomerJourney', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000007', NULL, NULL, 'HAS_PATH_SEGMENT', '경로 구간', '여정 세그먼트', 'CustomerJourney', 'PathSegment', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000008', NULL, NULL, 'BELONGS_TO_SEGMENT', '세그먼트 소속', '고객 그룹', 'Customer', 'CustomerSegment', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000009', NULL, NULL, 'HAS_PROFILE', '프로필 보유', '고객 상세 정보', 'Customer', 'CustomerProfile', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000010', NULL, NULL, 'HAS_LOYALTY_ACCOUNT', '멤버십 보유', '로열티 계정', 'Customer', 'LoyaltyAccount', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000011', NULL, NULL, 'HAS_PREFERENCE', '선호도 보유', '고객 취향', 'Customer', 'CustomerPreference', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000012', NULL, NULL, 'INTERACTED_WITH_PRODUCT', '상품 상호작용', '상품 터치/픽업', 'Visit', 'ProductInteraction', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000013', NULL, NULL, 'USED_FITTING_ROOM', '탈의실 사용', '피팅룸 세션', 'Visit', 'FittingRoomSession', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000014', NULL, NULL, 'WAITED_IN_QUEUE', '대기열 경험', '줄서기', 'Visit', 'QueueEvent', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000015', NULL, NULL, 'DETECTED_BY_SENSOR', '센서 감지', 'WiFi/비콘 감지', 'Customer', 'WiFiSensor', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000016', NULL, NULL, 'CAPTURED_BY_CAMERA', '카메라 촬영', '영상 캡처', 'Customer', 'Camera', 'directed', '{"category": "customer", "priority": "low"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000017', NULL, NULL, 'INFERRED_INTENT', '의도 추론', '방문 목적 추론', 'Visit', 'VisitIntent', 'directed', '{"category": "customer", "priority": "high"}', NOW(), NOW()),
('r0000005-0001-4000-8000-000000000018', NULL, NULL, 'PROVIDED_FEEDBACK', '피드백 제공', '고객 평가', 'Customer', 'CustomerFeedback', 'directed', '{"category": "customer", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ CUSTOMER 관계 (18개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 6: TRANSACTION (15개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000006-0001-4000-8000-000000000001', NULL, NULL, 'MADE_TRANSACTION', '거래함', '고객 거래', 'Customer', 'Transaction', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000002', NULL, NULL, 'RESULTED_FROM_VISIT', '방문 결과', '방문 후 거래', 'Transaction', 'Visit', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000003', NULL, NULL, 'HAS_LINE_ITEM', '항목 보유', '거래 라인', 'Transaction', 'TransactionLine', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000004', NULL, NULL, 'PURCHASED_PRODUCT', '제품 구매', '구매 상품', 'TransactionLine', 'Product', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000005', NULL, NULL, 'PAID_WITH', '결제 수단', '결제 방법', 'Transaction', 'Payment', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000006', NULL, NULL, 'APPLIED_DISCOUNT', '할인 적용', '적용된 할인', 'Transaction', 'Discount', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000007', NULL, NULL, 'APPLIED_PROMOTION', '프로모션 적용', '적용된 프로모션', 'Transaction', 'Promotion', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000008', NULL, NULL, 'USED_COUPON', '쿠폰 사용', '사용된 쿠폰', 'Transaction', 'Coupon', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000009', NULL, NULL, 'CHECKED_OUT_AT', '계산대 결제', '결제 위치', 'Transaction', 'CheckoutCounter', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000010', NULL, NULL, 'OCCURRED_AT_STORE', '매장 거래', '거래 매장', 'Transaction', 'Store', 'directed', '{"category": "transaction", "priority": "critical"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000011', NULL, NULL, 'HAS_RETURN', '반품 발생', '반품 처리', 'Transaction', 'Return', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000012', NULL, NULL, 'HAS_EXCHANGE', '교환 발생', '교환 처리', 'Transaction', 'Exchange', 'directed', '{"category": "transaction", "priority": "medium"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000013', NULL, NULL, 'FROM_BASKET', '장바구니 기반', '장바구니 전환', 'Transaction', 'Basket', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000014', NULL, NULL, 'ADDED_TO_BASKET', '장바구니 추가', '장바구니 담기', 'Product', 'Basket', 'directed', '{"category": "transaction", "priority": "high"}', NOW(), NOW()),
('r0000006-0001-4000-8000-000000000015', NULL, NULL, 'USED_GIFT_CARD', '기프트카드 사용', '상품권 결제', 'Transaction', 'GiftCard', 'directed', '{"category": "transaction", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ TRANSACTION 관계 (15개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 7: STAFF (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000007-0001-4000-8000-000000000001', NULL, NULL, 'WORKS_AT', '근무함', '직원 근무 매장', 'Staff', 'Store', 'directed', '{"category": "staff", "priority": "critical"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000002', NULL, NULL, 'HAS_ROLE', '역할 보유', '직원 직책', 'Staff', 'StaffRole', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000003', NULL, NULL, 'SCHEDULED_FOR', '스케줄 배정', '근무 스케줄', 'Staff', 'StaffSchedule', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000004', NULL, NULL, 'ASSIGNED_TO_SHIFT', '시프트 배정', '근무 시간', 'Staff', 'Shift', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000005', NULL, NULL, 'ASSIGNED_TO_ZONE', '구역 배정', '담당 구역', 'Staff', 'Zone', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000006', NULL, NULL, 'ASSIGNED_TO_TASK', '작업 배정', '담당 작업', 'Staff', 'Task', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000007', NULL, NULL, 'COMPLETED_TASK', '작업 완료', '완료한 작업', 'Staff', 'Task', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000008', NULL, NULL, 'HAS_PERFORMANCE', '성과 기록', '성과 지표', 'Staff', 'StaffPerformance', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000009', NULL, NULL, 'PROCESSED_TRANSACTION', '거래 처리', '처리한 거래', 'Staff', 'Transaction', 'directed', '{"category": "staff", "priority": "high"}', NOW(), NOW()),
('r0000007-0001-4000-8000-000000000010', NULL, NULL, 'REPORTS_TO', '보고 관계', '상위 직원', 'Staff', 'Staff', 'directed', '{"category": "staff", "priority": "medium"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ STAFF 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 8: AI (10개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000008-0001-4000-8000-000000000001', NULL, NULL, 'PREDICTED_FOR_PRODUCT', '상품 예측', '수요 예측 대상', 'DemandForecast', 'Product', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000002', NULL, NULL, 'PREDICTED_FOR_STORE', '매장 예측', '방문객 예측 대상', 'TrafficForecast', 'Store', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000003', NULL, NULL, 'OPTIMIZES_LAYOUT', '레이아웃 최적화', '배치 최적화', 'LayoutOptimization', 'Zone', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000004', NULL, NULL, 'OPTIMIZES_PRICE', '가격 최적화', '가격 최적화', 'PricingOptimization', 'Product', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000005', NULL, NULL, 'OPTIMIZES_STAFFING', '인력 최적화', '인력 배치 최적화', 'StaffScheduleOptimization', 'Store', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000006', NULL, NULL, 'RECOMMENDS_TO_CUSTOMER', '고객 추천', '상품 추천', 'ProductRecommendation', 'Customer', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000007', NULL, NULL, 'RECOMMENDS_PRODUCT', '상품 추천', '추천 상품', 'ProductRecommendation', 'Product', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000008', NULL, NULL, 'SUGGESTS_ACTION', '행동 제안', '다음 행동', 'NextBestAction', 'Staff', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000009', NULL, NULL, 'GENERATED_INSIGHT', '인사이트 생성', 'AI 인사이트', 'AIInsight', 'Store', 'directed', '{"category": "ai", "priority": "critical"}', NOW(), NOW()),
('r0000008-0001-4000-8000-000000000010', NULL, NULL, 'SIMULATES_SCENARIO', '시나리오 시뮬레이션', '시뮬레이션 실행', 'SimulationRun', 'SimulationScenario', 'directed', '{"category": "ai", "priority": "high"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ AI 관계 (10개) 완료'; END $$;

-- ---------------------------------------------------------------------------
-- CATEGORY 9: ORGANIZATION (5개)
-- ---------------------------------------------------------------------------
INSERT INTO ontology_relation_types (id, org_id, user_id, name, label, description, source_entity_type, target_entity_type, directionality, properties, created_at, updated_at)
VALUES
('r0000009-0001-4000-8000-000000000001', NULL, NULL, 'OPERATES', '운영함', '조직의 매장 운영', 'Organization', 'Store', 'directed', '{"category": "organization", "priority": "critical"}', NOW(), NOW()),
('r0000009-0001-4000-8000-000000000002', NULL, NULL, 'HAS_DEPARTMENT', '부서 보유', '조직 부서', 'Organization', 'Department', 'directed', '{"category": "organization", "priority": "medium"}', NOW(), NOW()),
('r0000009-0001-4000-8000-000000000003', NULL, NULL, 'MANAGES_REGION', '지역 관리', '영업 지역', 'Organization', 'Region', 'directed', '{"category": "organization", "priority": "high"}', NOW(), NOW()),
('r0000009-0001-4000-8000-000000000004', NULL, NULL, 'IN_REGION', '지역 소속', '매장 지역', 'Store', 'Region', 'directed', '{"category": "organization", "priority": "high"}', NOW(), NOW()),
('r0000009-0001-4000-8000-000000000005', NULL, NULL, 'BELONGS_TO_CLUSTER', '클러스터 소속', '매장 그룹', 'Store', 'StoreCluster', 'directed', '{"category": "organization", "priority": "medium"}', NOW(), NOW())
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
-- STEP 4: graph_entities 마이그레이션 (기존 → 마스터 타입 연결)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STEP 4: graph_entities 마이그레이션';
  RAISE NOTICE '========================================';
END $$;

-- 기존 entity_type_id를 마스터 타입으로 업데이트
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

-- graph_relations도 마이그레이션
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
