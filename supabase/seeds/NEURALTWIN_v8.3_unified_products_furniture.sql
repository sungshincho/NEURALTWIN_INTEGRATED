-- ============================================================================
-- NEURALTWIN v8.3: Unified Products & Furniture Seed (Mannequin System)
-- ============================================================================
-- Description:
--   1. Update products with consistent SKUs and compatible_display_types
--   2. Add display_type (current state) and compatible_display_types (possible states)
--   3. Create furniture entities including mannequins
--   4. Link furniture_slots to actual furniture IDs with correct compatibility
--
-- Display Types (6):
--   - hanging  : 행거에 걸린 상태
--   - standing : 마네킨 착용 상태
--   - folded   : 접힌 상태
--   - located  : 선반/테이블에 올려진 상태
--   - boxed    : 박스 포장 상태
--   - stacked  : 쌓인 상태
--
-- Prerequisites:
--   - Run NEURALTWIN_UNIFIED_SEED_v8.sql first (base data)
--   - Run 20251216_furniture_table.sql migration
--   - Run 20251216_product_placement_and_avatars.sql migration
--   - Run 20251216_display_type_and_slots.sql migration
--
-- Execution Order:
--   1. NEURALTWIN_UNIFIED_SEED_v8.sql
--   2. 20251216_furniture_table.sql
--   3. 20251216_product_placement_and_avatars.sql
--   4. 20251216_display_type_and_slots.sql
--   5. THIS FILE (v8.3)
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete and Recreate Products with Compatible Display Types (25개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get IDs from existing store
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Run NEURALTWIN_UNIFIED_SEED_v8.sql first.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Updating Products with Compatible Display Types (25개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing products (cascade will handle related records)
  DELETE FROM products WHERE store_id = v_store_id;

  -- Insert products with display_type and compatible_display_types
  INSERT INTO products (
    id, store_id, user_id, org_id,
    product_name, sku, category, price, cost_price, stock,
    display_type, compatible_display_types, created_at
  ) VALUES
  -- ═══════════════════════════════════════════════════════════════════════════
  -- 아우터 (2개) - compatible: hanging, standing, folded
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000001-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 캐시미어 코트', 'SKU-OUT-001', '아우터', 450000, 180000, 15,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000002-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '울 테일러드 재킷', 'SKU-OUT-002', '아우터', 380000, 152000, 20,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 상의 (4개) - compatible: hanging, standing, folded
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000003-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실크 블라우스', 'SKU-TOP-001', '상의', 120000, 48000, 25,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000004-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '캐주얼 니트 스웨터', 'SKU-TOP-002', '상의', 98000, 39200, 30,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000005-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '옥스포드 셔츠', 'SKU-TOP-003', '상의', 85000, 34000, 35,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000006-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '린넨 탑', 'SKU-TOP-004', '상의', 75000, 30000, 28,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 하의 (3개) - compatible: hanging, standing, folded
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000007-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '슬림핏 데님', 'SKU-BTM-001', '하의', 128000, 51200, 40,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000008-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '치노 팬츠', 'SKU-BTM-002', '하의', 95000, 38000, 35,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),
  ('f0000009-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   'A라인 스커트', 'SKU-BTM-003', '하의', 88000, 35200, 25,
   'hanging', ARRAY['hanging', 'standing', 'folded'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 신발 (3개) - compatible: standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000010-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 로퍼', 'SKU-SHO-001', '신발', 280000, 112000, 18,
   'located', ARRAY['standing', 'located'], NOW()),
  ('f0000011-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '하이힐 펌프스', 'SKU-SHO-002', '신발', 320000, 128000, 12,
   'located', ARRAY['standing', 'located'], NOW()),
  ('f0000012-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 스니커즈', 'SKU-SHO-003', '신발', 198000, 79200, 25,
   'located', ARRAY['standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 가방 (2개) - compatible: hanging, standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000013-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '가죽 토트백', 'SKU-BAG-001', '가방', 350000, 140000, 10,
   'hanging', ARRAY['hanging', 'standing', 'located'], NOW()),
  ('f0000014-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '크로스바디백', 'SKU-BAG-002', '가방', 180000, 72000, 15,
   'hanging', ARRAY['hanging', 'standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 스카프 (1개) - compatible: hanging, standing, folded, stacked
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000015-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실크 스카프', 'SKU-SCA-001', '스카프', 85000, 34000, 20,
   'hanging', ARRAY['hanging', 'standing', 'folded', 'stacked'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 벨트 (1개) - compatible: located, standing
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000016-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '가죽 벨트', 'SKU-BLT-001', '벨트', 120000, 48000, 30,
   'located', ARRAY['located', 'standing'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 시계 (1개) - compatible: standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000017-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '클래식 손목시계', 'SKU-WAT-001', '시계', 450000, 180000, 8,
   'located', ARRAY['standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 쥬얼리 (2개) - compatible: standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000018-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '실버 목걸이', 'SKU-JWL-001', '쥬얼리', 180000, 72000, 12,
   'located', ARRAY['standing', 'located'], NOW()),
  ('f0000019-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '골드 귀걸이', 'SKU-JWL-002', '쥬얼리', 220000, 88000, 10,
   'located', ARRAY['standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 속옷 (1개) - compatible: boxed, located, standing, stacked
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000020-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 속옷 세트', 'SKU-UND-001', '속옷', 65000, 26000, 40,
   'boxed', ARRAY['boxed', 'located', 'standing', 'stacked'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 양말 (1개) - compatible: boxed, located, standing, stacked
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000021-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 양말 팩', 'SKU-SOC-001', '양말', 25000, 10000, 60,
   'stacked', ARRAY['boxed', 'located', 'standing', 'stacked'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 모자 (1개) - compatible: standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000022-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '페도라 모자', 'SKU-HAT-001', '모자', 95000, 38000, 15,
   'located', ARRAY['standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 안경 (1개) - compatible: standing, located
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000023-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 선글라스', 'SKU-GLS-001', '안경', 280000, 112000, 10,
   'located', ARRAY['standing', 'located'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 선물세트 (1개) - compatible: boxed
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000024-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '프리미엄 선물 세트', 'SKU-GFT-001', '선물세트', 150000, 60000, 20,
   'boxed', ARRAY['boxed'], NOW()),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 티셔츠팩 (1개) - compatible: stacked
  -- ═══════════════════════════════════════════════════════════════════════════
  ('f0000025-0000-0000-0000-000000000000'::UUID, v_store_id, v_user_id, v_org_id,
   '베이직 티셔츠 3팩', 'SKU-TSK-001', '티셔츠', 55000, 22000, 50,
   'stacked', ARRAY['stacked'], NOW());

  RAISE NOTICE '  ✓ products: 25건 생성';
  RAISE NOTICE '    - 아우터/상의/하의: 9개 (hanging, standing, folded)';
  RAISE NOTICE '    - 신발: 3개 (standing, located)';
  RAISE NOTICE '    - 가방: 2개 (hanging, standing, located)';
  RAISE NOTICE '    - 스카프: 1개 (hanging, standing, folded, stacked)';
  RAISE NOTICE '    - 벨트/시계/쥬얼리/모자/안경: 6개 (standing, located)';
  RAISE NOTICE '    - 속옷/양말: 2개 (boxed, located, standing, stacked)';
  RAISE NOTICE '    - 선물세트: 1개 (boxed)';
  RAISE NOTICE '    - 티셔츠팩: 1개 (stacked)';
END $$;

-- ============================================================================
-- STEP 2: Create Furniture Entities (행거 4개 + 마네킹 4개 + 선반/테이블/랙 6개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_clothing UUID;
  v_zone_accessory UUID;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id
  FROM stores LIMIT 1;

  -- Get zone IDs
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;

  IF v_zone_clothing IS NULL THEN
    SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_type = 'display' AND store_id = v_store_id LIMIT 1;
  END IF;

  IF v_zone_accessory IS NULL THEN
    v_zone_accessory := v_zone_clothing;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Creating Furniture Entities (14개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing furniture
  DELETE FROM furniture WHERE store_id = v_store_id;

  INSERT INTO furniture (
    id, store_id, user_id, org_id, zone_id,
    furniture_code, furniture_name, furniture_type,
    width, height, depth,
    position, rotation, scale,
    movable, is_active
  ) VALUES
  -- ═══════════════════════════════════════════════════════════════════════════
  -- 의류 행거 (더블) - 4개 (hanging 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-001', '의류 행거 (더블) #1', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-6,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-002', '의류 행거 (더블) #2', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-4,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-003', '의류 행거 (더블) #3', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-6,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'RACK-004', '의류 행거 (더블) #4', 'clothing_rack_double',
   1.2, 1.8, 0.5, '{"x":-4,"y":0,"z":4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 마네킹 - 4개 (standing 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b0000051-0000-0000-0000-000000000051'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'MANNEQUIN-001', '전신 마네킹 #1', 'mannequin_full',
   0.5, 1.8, 0.3, '{"x":-2,"y":0,"z":1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000052-0000-0000-0000-000000000052'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'MANNEQUIN-002', '전신 마네킹 #2', 'mannequin_full',
   0.5, 1.8, 0.3, '{"x":0,"y":0,"z":1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000053-0000-0000-0000-000000000053'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'MANNEQUIN-003', '상반신 마네킹 #1', 'mannequin_half',
   0.4, 1.0, 0.25, '{"x":2,"y":0,"z":1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000054-0000-0000-0000-000000000054'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'MANNEQUIN-004', '두상 마네킹 #1', 'mannequin_head',
   0.25, 0.35, 0.25, '{"x":5,"y":0.9,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 선반형 진열대 - 2개 (folded, located, boxed 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'SHELF-001', '선반형 진열대 #1', 'shelf_display',
   1.0, 1.8, 0.4, '{"x":-3,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'SHELF-002', '선반형 진열대 #2', 'shelf_display',
   1.0, 1.8, 0.4, '{"x":-2,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 테이블 디스플레이 - 2개 (folded, located, boxed, stacked 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b0000021-0000-0000-0000-000000000021'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'TABLE-001', '테이블 디스플레이 #1', 'table_display',
   1.2, 0.9, 0.8, '{"x":-5,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),
  ('b0000022-0000-0000-0000-000000000022'::UUID, v_store_id, v_user_id, v_org_id, v_zone_clothing,
   'TABLE-002', '테이블 디스플레이 #2', 'table_display',
   1.2, 0.9, 0.8, '{"x":-3,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 신발 진열대 - 2개 (located, standing 슬롯)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b0000031-0000-0000-0000-000000000031'::UUID, v_store_id, v_user_id, v_org_id, v_zone_accessory,
   'SHOE-001', '신발 진열대 #1', 'shoe_rack',
   1.2, 1.5, 0.4, '{"x":4,"y":0,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb,
   true, true);

  RAISE NOTICE '  ✓ furniture: 14건 생성';
  RAISE NOTICE '    - clothing_rack_double: 4개';
  RAISE NOTICE '    - mannequin_full: 2개';
  RAISE NOTICE '    - mannequin_half: 1개';
  RAISE NOTICE '    - mannequin_head: 1개';
  RAISE NOTICE '    - shelf_display: 2개';
  RAISE NOTICE '    - table_display: 2개';
  RAISE NOTICE '    - shoe_rack: 1개';
END $$;

-- ============================================================================
-- STEP 3: Create Furniture Slots (행거/마네킹/선반/테이블/랙 슬롯)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Creating Furniture Slots';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Delete existing slots
  DELETE FROM furniture_slots WHERE store_id = v_store_id;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 의류 행거 슬롯 (각 랙당 10개 행거 슬롯) - compatible: hanging
  -- ═══════════════════════════════════════════════════════════════════════════

  -- RACK-001 ~ RACK-004 행거 슬롯 (H1~H10)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    ('b000000' || rack_num || '-0000-0000-0000-00000000000' || rack_num)::uuid,
    'clothing_rack_double',
    'H' || slot_num,
    'hanger',
    jsonb_build_object('x', -0.5 + (slot_num - 1) * 0.11, 'y', 1.6, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['hanging'],
    0.6, 1.2, 0.3,
    v_store_id
  FROM generate_series(1, 4) AS rack_num, generate_series(1, 10) AS slot_num;

  RAISE NOTICE '  ✓ 의류 행거 슬롯: 40개 (4랙 × 10슬롯) - compatible: hanging';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 마네킹 슬롯 - compatible: standing
  -- ═══════════════════════════════════════════════════════════════════════════

  -- MANNEQUIN-001 전신 마네킹 슬롯 (M-TOP, M-BTM, M-SHOE, M-ACC)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  VALUES
  ('b0000051-0000-0000-0000-000000000051'::uuid, 'mannequin_full', 'M-TOP', 'mannequin', '{"x":0,"y":1.3,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.6, 0.8, 0.3, v_store_id),
  ('b0000051-0000-0000-0000-000000000051'::uuid, 'mannequin_full', 'M-BTM', 'mannequin', '{"x":0,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.5, 1.0, 0.3, v_store_id),
  ('b0000051-0000-0000-0000-000000000051'::uuid, 'mannequin_full', 'M-SHOE', 'mannequin', '{"x":0,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.15, 0.35, v_store_id),
  ('b0000051-0000-0000-0000-000000000051'::uuid, 'mannequin_full', 'M-ACC', 'mannequin', '{"x":0,"y":1.2,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.3, 0.2, v_store_id);

  -- MANNEQUIN-002 전신 마네킹 슬롯 (M-TOP, M-BTM, M-SHOE, M-ACC)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  VALUES
  ('b0000052-0000-0000-0000-000000000052'::uuid, 'mannequin_full', 'M-TOP', 'mannequin', '{"x":0,"y":1.3,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.6, 0.8, 0.3, v_store_id),
  ('b0000052-0000-0000-0000-000000000052'::uuid, 'mannequin_full', 'M-BTM', 'mannequin', '{"x":0,"y":0.8,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.5, 1.0, 0.3, v_store_id),
  ('b0000052-0000-0000-0000-000000000052'::uuid, 'mannequin_full', 'M-SHOE', 'mannequin', '{"x":0,"y":0.05,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.15, 0.35, v_store_id),
  ('b0000052-0000-0000-0000-000000000052'::uuid, 'mannequin_full', 'M-ACC', 'mannequin', '{"x":0,"y":1.2,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.3, 0.2, v_store_id);

  -- MANNEQUIN-003 상반신 마네킹 슬롯 (M-TOP, M-ACC)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  VALUES
  ('b0000053-0000-0000-0000-000000000053'::uuid, 'mannequin_half', 'M-TOP', 'mannequin', '{"x":0,"y":0.7,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.5, 0.7, 0.25, v_store_id),
  ('b0000053-0000-0000-0000-000000000053'::uuid, 'mannequin_half', 'M-ACC', 'mannequin', '{"x":0,"y":0.6,"z":0.1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.3, 0.2, v_store_id);

  -- MANNEQUIN-004 두상 마네킹 슬롯 (M-HAT, M-GLASS, M-EARRING)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  VALUES
  ('b0000054-0000-0000-0000-000000000054'::uuid, 'mannequin_head', 'M-HAT', 'mannequin', '{"x":0,"y":0.25,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.3, 0.15, 0.3, v_store_id),
  ('b0000054-0000-0000-0000-000000000054'::uuid, 'mannequin_head', 'M-GLASS', 'mannequin', '{"x":0,"y":0.15,"z":0.08}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.15, 0.05, 0.15, v_store_id),
  ('b0000054-0000-0000-0000-000000000054'::uuid, 'mannequin_head', 'M-EARRING', 'mannequin', '{"x":0.08,"y":0.12,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, ARRAY['standing'], 0.05, 0.05, 0.02, v_store_id);

  RAISE NOTICE '  ✓ 마네킹 슬롯: 13개 - compatible: standing';
  RAISE NOTICE '    - mannequin_full x2: 8슬롯 (M-TOP, M-BTM, M-SHOE, M-ACC)';
  RAISE NOTICE '    - mannequin_half x1: 2슬롯 (M-TOP, M-ACC)';
  RAISE NOTICE '    - mannequin_head x1: 3슬롯 (M-HAT, M-GLASS, M-EARRING)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 선반형 진열대 슬롯 (각 선반당 4단 × 3열 = 12슬롯) - compatible: folded, located, boxed
  -- ═══════════════════════════════════════════════════════════════════════════

  -- SHELF-001 슬롯 (S1-1 ~ S4-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000011-0000-0000-0000-000000000011'::uuid,
    'shelf_display',
    'S' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.3 + (col_num - 1) * 0.3, 'y', 0.2 + (shelf_level - 1) * 0.4, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'located', 'boxed'],
    0.3, 0.35, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num;

  -- SHELF-002 슬롯 (S1-1 ~ S4-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000012-0000-0000-0000-000000000012'::uuid,
    'shelf_display',
    'S' || shelf_level || '-' || col_num,
    'shelf',
    jsonb_build_object('x', -0.3 + (col_num - 1) * 0.3, 'y', 0.2 + (shelf_level - 1) * 0.4, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'located', 'boxed'],
    0.3, 0.35, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num;

  RAISE NOTICE '  ✓ 선반 슬롯: 24개 (2선반 × 12슬롯) - compatible: folded, located, boxed';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 테이블 디스플레이 슬롯 (각 테이블당 2×3 = 6슬롯) - compatible: folded, located, boxed, stacked
  -- ═══════════════════════════════════════════════════════════════════════════

  -- TABLE-001 슬롯 (T1-1 ~ T2-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000021-0000-0000-0000-000000000021'::uuid,
    'table_display',
    'T' || row_num || '-' || col_num,
    'table',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.35, 'y', 0.9, 'z', -0.2 + (row_num - 1) * 0.4),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'located', 'boxed', 'stacked'],
    0.35, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 2) AS row_num, generate_series(1, 3) AS col_num;

  -- TABLE-002 슬롯 (T1-1 ~ T2-3)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000022-0000-0000-0000-000000000022'::uuid,
    'table_display',
    'T' || row_num || '-' || col_num,
    'table',
    jsonb_build_object('x', -0.35 + (col_num - 1) * 0.35, 'y', 0.9, 'z', -0.2 + (row_num - 1) * 0.4),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['folded', 'located', 'boxed', 'stacked'],
    0.35, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 2) AS row_num, generate_series(1, 3) AS col_num;

  RAISE NOTICE '  ✓ 테이블 슬롯: 12개 (2테이블 × 6슬롯) - compatible: folded, located, boxed, stacked';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 신발 진열대 슬롯 (4단 × 4열 = 16슬롯) - compatible: located, standing
  -- ═══════════════════════════════════════════════════════════════════════════

  -- SHOE-001 슬롯 (R1-1 ~ R4-4)
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
  SELECT
    'b0000031-0000-0000-0000-000000000031'::uuid,
    'shoe_rack',
    'R' || shelf_level || '-' || col_num,
    'rack',
    jsonb_build_object('x', -0.4 + (col_num - 1) * 0.27, 'y', 0.15 + (shelf_level - 1) * 0.35, 'z', 0),
    '{"x":0,"y":0,"z":0}'::jsonb,
    ARRAY['located', 'standing'],
    0.25, 0.3, 0.35,
    v_store_id
  FROM generate_series(1, 4) AS shelf_level, generate_series(1, 4) AS col_num;

  RAISE NOTICE '  ✓ 신발 진열대 슬롯: 16개 (1랙 × 16슬롯) - compatible: located, standing';
  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  총 슬롯: 105개';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 4: Summary & Verification
-- ============================================================================
DO $$
DECLARE
  v_product_count INT;
  v_furniture_count INT;
  v_slot_count INT;
  v_mannequin_count INT;
BEGIN
  SELECT COUNT(*) INTO v_product_count FROM products;
  SELECT COUNT(*) INTO v_furniture_count FROM furniture;
  SELECT COUNT(*) INTO v_slot_count FROM furniture_slots;
  SELECT COUNT(*) INTO v_mannequin_count FROM furniture WHERE furniture_type LIKE 'mannequin%';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '                    v8.3 SEED COMPLETE                          ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '  Products:   %건 (with compatible_display_types)', v_product_count;
  RAISE NOTICE '  Furniture:  %건 (including % mannequins)', v_furniture_count, v_mannequin_count;
  RAISE NOTICE '  Slots:      %건', v_slot_count;
  RAISE NOTICE '';
  RAISE NOTICE '  ══════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Display Type 호환성 요약:';
  RAISE NOTICE '  ══════════════════════════════════════════════════════════════';
  RAISE NOTICE '  hanging  → hanger 슬롯 (40개)';
  RAISE NOTICE '  standing → mannequin 슬롯 (13개), shoe_rack (16개)';
  RAISE NOTICE '  folded   → shelf 슬롯 (24개), table 슬롯 (12개)';
  RAISE NOTICE '  located  → shelf 슬롯 (24개), table 슬롯 (12개), shoe_rack (16개)';
  RAISE NOTICE '  boxed    → shelf 슬롯 (24개), table 슬롯 (12개)';
  RAISE NOTICE '  stacked  → table 슬롯 (12개)';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
