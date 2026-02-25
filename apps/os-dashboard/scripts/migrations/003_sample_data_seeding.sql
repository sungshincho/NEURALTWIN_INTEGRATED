-- ============================================================================
-- NEURALTWIN Sample Data Seeding Script v2.0
-- ============================================================================
-- 작성일: 2025-12-14
-- 목적: 마스터 온톨로지를 참조하는 샘플 데이터 시딩
--
-- 핵심 원칙:
-- 1. ontology_entity_types에 새 타입 INSERT하지 않음
-- 2. 마스터 타입(org_id IS NULL, user_id IS NULL)을 참조
-- 3. graph_entities INSERT 시 마스터 타입 ID를 서브쿼리로 조회
-- 4. ON CONFLICT 처리로 중복 시 안전하게 스킵
-- ============================================================================

-- 변수 설정: 실제 환경에 맞게 수정하세요
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '샘플 데이터 시딩 시작';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 헬퍼 함수: 마스터 타입 ID 조회
-- ============================================================================
CREATE OR REPLACE FUNCTION get_master_entity_type_id(p_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM ontology_entity_types
  WHERE name = p_name AND org_id IS NULL AND user_id IS NULL
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_master_relation_type_id(p_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM ontology_relation_types
  WHERE name = p_name AND org_id IS NULL AND user_id IS NULL
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

DO $$ BEGIN RAISE NOTICE '✅ 헬퍼 함수 생성 완료'; END $$;

-- ============================================================================
-- 1. 매장 데이터 (Store)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_entity_type_id UUID;
BEGIN
  -- 첫 번째 사용자 가져오기 (실제 환경에서는 특정 사용자 ID 사용)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ 사용자가 없습니다. 시딩을 건너뜁니다.';
    RETURN;
  END IF;

  -- 첫 번째 매장 가져오기
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE NOTICE '⚠️ 매장이 없습니다. 시딩을 건너뜁니다.';
    RETURN;
  END IF;

  -- 조직 ID (선택적)
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '📍 데이터 시딩: user_id=%, store_id=%', v_user_id, v_store_id;

  -- Store 엔티티 타입 ID
  v_entity_type_id := get_master_entity_type_id('Store');
  IF v_entity_type_id IS NULL THEN
    RAISE NOTICE '⚠️ Store 마스터 타입이 없습니다.';
    RETURN;
  END IF;

  -- Store 엔티티 생성
  INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_store_id,
    v_org_id,
    v_entity_type_id,
    '강남 플래그십 스토어',
    jsonb_build_object(
      'address', '서울시 강남구 테헤란로 123',
      'area_sqm', 500,
      'floor_count', 2,
      'operating_hours', '10:00-22:00',
      'store_type', 'flagship'
    )
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Store 엔티티 생성 완료';
END $$;

-- ============================================================================
-- 2. 구역 데이터 (Zone) - 마스터 타입 참조
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_zone_type_id UUID;
  v_zone_ids UUID[];
  v_zone_labels TEXT[] := ARRAY['입구 구역', '남성복 구역', '여성복 구역', '액세서리 구역', '계산대 구역', '피팅룸 구역'];
  v_zone_names TEXT[] := ARRAY['entrance_zone', 'mens_zone', 'womens_zone', 'accessories_zone', 'checkout_zone', 'fitting_zone'];
  i INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RAISE NOTICE '⚠️ 필수 데이터 없음. Zone 시딩 건너뜀.';
    RETURN;
  END IF;

  -- Zone 마스터 타입 ID 조회
  v_zone_type_id := get_master_entity_type_id('Zone');
  IF v_zone_type_id IS NULL THEN
    RAISE NOTICE '⚠️ Zone 마스터 타입이 없습니다.';
    RETURN;
  END IF;

  -- 6개 구역 생성
  FOR i IN 1..array_length(v_zone_labels, 1) LOOP
    INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_store_id,
      v_org_id,
      v_zone_type_id,
      v_zone_labels[i],
      jsonb_build_object(
        'zone_code', v_zone_names[i],
        'floor', 1,
        'area_sqm', 50 + (i * 10),
        'zone_type', CASE
          WHEN i = 1 THEN 'entrance'
          WHEN i = 5 THEN 'checkout'
          WHEN i = 6 THEN 'fitting_room'
          ELSE 'sales'
        END
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ Zone 엔티티 %개 생성 완료', array_length(v_zone_labels, 1);
END $$;

-- ============================================================================
-- 3. 가구 데이터 (Shelf, Rack, DisplayTable)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_shelf_type_id UUID;
  v_rack_type_id UUID;
  v_display_type_id UUID;
  i INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RETURN;
  END IF;

  v_shelf_type_id := get_master_entity_type_id('Shelf');
  v_rack_type_id := get_master_entity_type_id('Rack');
  v_display_type_id := get_master_entity_type_id('DisplayTable');

  -- 선반 5개 생성
  IF v_shelf_type_id IS NOT NULL THEN
    FOR i IN 1..5 LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_shelf_type_id,
        format('선반 %s', i),
        jsonb_build_object(
          'shelf_code', format('SH-%03s', i),
          'width', 120,
          'height', 180,
          'shelves_count', 5,
          'capacity', 50
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Shelf 엔티티 5개 생성';
  END IF;

  -- 행거 3개 생성
  IF v_rack_type_id IS NOT NULL THEN
    FOR i IN 1..3 LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_rack_type_id,
        format('행거 %s', i),
        jsonb_build_object(
          'rack_code', format('RK-%03s', i),
          'type', 'clothing_rack',
          'capacity', 30
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Rack 엔티티 3개 생성';
  END IF;

  -- 디스플레이 테이블 2개 생성
  IF v_display_type_id IS NOT NULL THEN
    FOR i IN 1..2 LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_display_type_id,
        format('디스플레이 테이블 %s', i),
        jsonb_build_object(
          'table_code', format('DT-%03s', i),
          'type', 'center_display',
          'featured', true
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ DisplayTable 엔티티 2개 생성';
  END IF;
END $$;

-- ============================================================================
-- 4. 상품 데이터 (Product, Category, Brand)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_product_type_id UUID;
  v_category_type_id UUID;
  v_brand_type_id UUID;
  v_products TEXT[][] := ARRAY[
    ARRAY['클래식 화이트 셔츠', 'SH001', '79000', 'clothing'],
    ARRAY['슬림핏 청바지', 'JN001', '89000', 'clothing'],
    ARRAY['캐시미어 스웨터', 'SW001', '159000', 'clothing'],
    ARRAY['가죽 토트백', 'BG001', '299000', 'accessories'],
    ARRAY['실크 스카프', 'SC001', '89000', 'accessories']
  ];
  v_categories TEXT[] := ARRAY['의류', '액세서리', '신발', '가방'];
  v_brands TEXT[] := ARRAY['NEURALTWIN', 'Premium Line', 'Essential'];
  i INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RETURN;
  END IF;

  v_product_type_id := get_master_entity_type_id('Product');
  v_category_type_id := get_master_entity_type_id('Category');
  v_brand_type_id := get_master_entity_type_id('Brand');

  -- 카테고리 생성
  IF v_category_type_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_categories, 1) LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_category_type_id,
        v_categories[i],
        jsonb_build_object(
          'category_code', format('CAT-%03s', i),
          'level', 1,
          'is_active', true
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Category 엔티티 %개 생성', array_length(v_categories, 1);
  END IF;

  -- 브랜드 생성
  IF v_brand_type_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_brands, 1) LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_brand_type_id,
        v_brands[i],
        jsonb_build_object(
          'brand_code', format('BR-%03s', i),
          'origin_country', 'KR',
          'tier', CASE WHEN i = 1 THEN 'flagship' ELSE 'standard' END
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Brand 엔티티 %개 생성', array_length(v_brands, 1);
  END IF;

  -- 상품 생성
  IF v_product_type_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_products, 1) LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_product_type_id,
        v_products[i][1],
        jsonb_build_object(
          'product_code', v_products[i][2],
          'price', v_products[i][3]::INTEGER,
          'category', v_products[i][4],
          'in_stock', true,
          'stock_quantity', 10 + (i * 5)
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Product 엔티티 %개 생성', array_length(v_products, 1);
  END IF;
END $$;

-- ============================================================================
-- 5. 고객 및 방문 데이터 (Customer, Visit)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_customer_type_id UUID;
  v_visit_type_id UUID;
  v_customer_names TEXT[] := ARRAY['김민수', '이영희', '박지훈', '최서연', '정우진'];
  v_customer_id UUID;
  i INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RETURN;
  END IF;

  v_customer_type_id := get_master_entity_type_id('Customer');
  v_visit_type_id := get_master_entity_type_id('Visit');

  -- 고객 생성
  IF v_customer_type_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_customer_names, 1) LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_customer_type_id,
        v_customer_names[i],
        jsonb_build_object(
          'customer_code', format('CUST-%05s', i),
          'age_group', CASE WHEN i <= 2 THEN '20대' WHEN i <= 4 THEN '30대' ELSE '40대' END,
          'gender', CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
          'loyalty_tier', CASE WHEN i = 1 THEN 'VIP' WHEN i <= 3 THEN 'Gold' ELSE 'Silver' END,
          'total_purchases', i * 3
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Customer 엔티티 %개 생성', array_length(v_customer_names, 1);
  END IF;

  -- 방문 생성 (각 고객당 최근 방문 1건)
  IF v_visit_type_id IS NOT NULL AND v_customer_type_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_customer_names, 1) LOOP
      INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type_id, label, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_visit_type_id,
        format('%s의 방문', v_customer_names[i]),
        jsonb_build_object(
          'visit_date', (NOW() - (i || ' days')::INTERVAL)::DATE,
          'entry_time', '14:30',
          'exit_time', '15:45',
          'duration_minutes', 75,
          'zones_visited', ARRAY['입구 구역', '남성복 구역', '계산대 구역'],
          'purchased', i <= 3
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Visit 엔티티 %개 생성', array_length(v_customer_names, 1);
  END IF;
END $$;

-- ============================================================================
-- 6. 관계 데이터 생성 (graph_relations)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_org_id UUID;
  v_store_entity_id UUID;
  v_zone_entity_ids UUID[];
  v_product_entity_ids UUID[];
  v_rel_contains_id UUID;
  v_rel_placed_in_zone_id UUID;
  v_zone_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;

  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RETURN;
  END IF;

  -- 엔티티 ID 조회
  SELECT id INTO v_store_entity_id
  FROM graph_entities
  WHERE store_id = v_store_id
    AND entity_type_id = get_master_entity_type_id('Store')
  LIMIT 1;

  SELECT array_agg(id) INTO v_zone_entity_ids
  FROM graph_entities
  WHERE store_id = v_store_id
    AND entity_type_id = get_master_entity_type_id('Zone');

  SELECT array_agg(id) INTO v_product_entity_ids
  FROM graph_entities
  WHERE store_id = v_store_id
    AND entity_type_id = get_master_entity_type_id('Product');

  -- 관계 타입 ID 조회
  v_rel_contains_id := get_master_relation_type_id('CONTAINS');
  v_rel_placed_in_zone_id := get_master_relation_type_id('PLACED_IN_ZONE');

  -- Store -> Zone 관계 (CONTAINS)
  IF v_store_entity_id IS NOT NULL AND v_zone_entity_ids IS NOT NULL AND v_rel_contains_id IS NOT NULL THEN
    FOREACH v_zone_id IN ARRAY v_zone_entity_ids LOOP
      INSERT INTO graph_relations (id, user_id, store_id, org_id, source_entity_id, target_entity_id, relation_type_id, weight, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_store_entity_id,
        v_zone_id,
        v_rel_contains_id,
        1.0,
        jsonb_build_object('created_at', NOW())
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Store -> Zone 관계 생성 완료';
  END IF;

  -- Product -> Zone 관계 (PLACED_IN_ZONE)
  IF v_product_entity_ids IS NOT NULL AND v_zone_entity_ids IS NOT NULL AND v_rel_placed_in_zone_id IS NOT NULL THEN
    FOR i IN 1..array_length(v_product_entity_ids, 1) LOOP
      INSERT INTO graph_relations (id, user_id, store_id, org_id, source_entity_id, target_entity_id, relation_type_id, weight, properties)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_store_id,
        v_org_id,
        v_product_entity_ids[i],
        v_zone_entity_ids[1 + (i % array_length(v_zone_entity_ids, 1))],  -- 순환 배치
        v_rel_placed_in_zone_id,
        1.0,
        jsonb_build_object('placement_date', NOW()::DATE)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE '✅ Product -> Zone 관계 생성 완료';
  END IF;
END $$;

-- ============================================================================
-- 7. 검증
-- ============================================================================
DO $$
DECLARE
  v_entity_count INTEGER;
  v_relation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_entity_count FROM graph_entities;
  SELECT COUNT(*) INTO v_relation_count FROM graph_relations;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 샘플 데이터 시딩 결과:';
  RAISE NOTICE '   - graph_entities: %개', v_entity_count;
  RAISE NOTICE '   - graph_relations: %개', v_relation_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 샘플 데이터 시딩 완료!';
  RAISE NOTICE '========================================';
END $$;

-- 헬퍼 함수 정리 (선택적)
-- DROP FUNCTION IF EXISTS get_master_entity_type_id(TEXT);
-- DROP FUNCTION IF EXISTS get_master_relation_type_id(TEXT);
