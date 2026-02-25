-- ════════════════════════════════════════════════════════════════════════════
-- NEURALTWIN v8.6 SEED_03A_PRODUCT_BINDING.sql
-- 상품-슬롯 명시적 좌표 기반 바인딩
-- 실행 순서: SEED_03 이후
-- ════════════════════════════════════════════════════════════════════════════
-- 월드 좌표 계산: 가구 position + 슬롯 slot_position
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      MVP Product-Slot Assignment (v8.6 명시적 좌표)            ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z003 의류존 - 아우터 (5개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-OUT-001 (코트) → RACK-001 / H1-1
  -- 가구: (-8.5, 0, -2) + 슬롯: (-0.328, 1.38, 0.5) = (-8.828, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H1-1',
    model_3d_position = '{"x": -8.828, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-OUT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000001-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H1-1';

  RAISE NOTICE '  ✓ SKU-OUT-001 (코트) → RACK-001 / H1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-OUT-002 (울 재킷) → RACK-001 / H1-2
  -- 가구: (-8.5, 0, -2) + 슬롯: (0.328, 1.38, 0.5) = (-8.172, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H1-2',
    model_3d_position = '{"x": -8.172, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-OUT-002';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000002-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H1-2';

  RAISE NOTICE '  ✓ SKU-OUT-002 (울 재킷) → RACK-001 / H1-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-OUT-003 (다운 패딩) → RACK-001 / H2-1
  -- 가구: (-8.5, 0, -2) + 슬롯: (-0.328, 1.38, 0) = (-8.828, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H2-1',
    model_3d_position = '{"x": -8.828, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-OUT-003';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000003-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H2-1';

  RAISE NOTICE '  ✓ SKU-OUT-003 (다운 패딩) → RACK-001 / H2-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-OUT-004 (트렌치 코트) → RACK-001 / H2-2
  -- 가구: (-8.5, 0, -2) + 슬롯: (0.328, 1.38, 0) = (-8.172, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H2-2',
    model_3d_position = '{"x": -8.172, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-OUT-004';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000004-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H2-2';

  RAISE NOTICE '  ✓ SKU-OUT-004 (트렌치 코트) → RACK-001 / H2-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-OUT-005 (레더 재킷) → RACK-001 / H3-1
  -- 가구: (-8.5, 0, -2) + 슬롯: (-0.328, 1.38, -0.5) = (-8.828, 1.38, -2.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H3-1',
    model_3d_position = '{"x": -8.828, "y": 1.38, "z": -2.5}'::jsonb
  WHERE sku = 'SKU-OUT-005';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000005-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H3-1';

  RAISE NOTICE '  ✓ SKU-OUT-005 (레더 재킷) → RACK-001 / H3-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z003 의류존 - 상의 (5개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-TOP-001 (실크 블라우스) → RACK-002 / H1-1
  -- 가구: (-7.4, 0, -2) + 슬롯: (-0.328, 1.38, 0.5) = (-7.728, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID,
    slot_id = 'H1-1',
    model_3d_position = '{"x": -7.728, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-TOP-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000006-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID AND slot_id = 'H1-1';

  RAISE NOTICE '  ✓ SKU-TOP-001 (실크 블라우스) → RACK-002 / H1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-TOP-002 (캐주얼 니트) → RACK-002 / H1-2
  -- 가구: (-7.4, 0, -2) + 슬롯: (0.328, 1.38, 0.5) = (-7.072, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID,
    slot_id = 'H1-2',
    model_3d_position = '{"x": -7.072, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-TOP-002';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000007-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID AND slot_id = 'H1-2';

  RAISE NOTICE '  ✓ SKU-TOP-002 (캐주얼 니트) → RACK-002 / H1-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-TOP-003 (옥스포드 셔츠) → RACK-002 / H2-1
  -- 가구: (-7.4, 0, -2) + 슬롯: (-0.328, 1.38, 0) = (-7.728, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID,
    slot_id = 'H2-1',
    model_3d_position = '{"x": -7.728, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-TOP-003';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000008-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID AND slot_id = 'H2-1';

  RAISE NOTICE '  ✓ SKU-TOP-003 (옥스포드 셔츠) → RACK-002 / H2-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-TOP-004 (린넨 탑) → RACK-002 / H2-2
  -- 가구: (-7.4, 0, -2) + 슬롯: (0.328, 1.38, 0) = (-7.072, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID,
    slot_id = 'H2-2',
    model_3d_position = '{"x": -7.072, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-TOP-004';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000009-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID AND slot_id = 'H2-2';

  RAISE NOTICE '  ✓ SKU-TOP-004 (린넨 탑) → RACK-002 / H2-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-TOP-005 (폴로 셔츠) → RACK-002 / H3-1
  -- 가구: (-7.4, 0, -2) + 슬롯: (-0.328, 1.38, -0.5) = (-7.728, 1.38, -2.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID,
    slot_id = 'H3-1',
    model_3d_position = '{"x": -7.728, "y": 1.38, "z": -2.5}'::jsonb
  WHERE sku = 'SKU-TOP-005';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000010-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030002-0000-0000-0000-000000000002'::UUID AND slot_id = 'H3-1';

  RAISE NOTICE '  ✓ SKU-TOP-005 (폴로 셔츠) → RACK-002 / H3-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z003 의류존 - 하의 (4개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BTM-001 (리넨 와이드 팬츠) → RACK-003 / H1-1
  -- 가구: (-6.3, 0, -2) + 슬롯: (-0.328, 1.38, 0.5) = (-6.628, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID,
    slot_id = 'H1-1',
    model_3d_position = '{"x": -6.628, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-BTM-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000011-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID AND slot_id = 'H1-1';

  RAISE NOTICE '  ✓ SKU-BTM-001 (리넨 와이드 팬츠) → RACK-003 / H1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BTM-002 (슬림핏 데님) → RACK-003 / H1-2
  -- 가구: (-6.3, 0, -2) + 슬롯: (0.328, 1.38, 0.5) = (-5.972, 1.38, -1.5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID,
    slot_id = 'H1-2',
    model_3d_position = '{"x": -5.972, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-BTM-002';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000012-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID AND slot_id = 'H1-2';

  RAISE NOTICE '  ✓ SKU-BTM-002 (슬림핏 데님) → RACK-003 / H1-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BTM-003 (치노 팬츠) → RACK-003 / H2-1
  -- 가구: (-6.3, 0, -2) + 슬롯: (-0.328, 1.38, 0) = (-6.628, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID,
    slot_id = 'H2-1',
    model_3d_position = '{"x": -6.628, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-BTM-003';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000013-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID AND slot_id = 'H2-1';

  RAISE NOTICE '  ✓ SKU-BTM-003 (치노 팬츠) → RACK-003 / H2-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BTM-004 (조거 팬츠) → RACK-003 / H2-2
  -- 가구: (-6.3, 0, -2) + 슬롯: (0.328, 1.38, 0) = (-5.972, 1.38, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID,
    slot_id = 'H2-2',
    model_3d_position = '{"x": -5.972, "y": 1.38, "z": -2}'::jsonb
  WHERE sku = 'SKU-BTM-004';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000014-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0030003-0000-0000-0000-000000000003'::UUID AND slot_id = 'H2-2';

  RAISE NOTICE '  ✓ SKU-BTM-004 (조거 팬츠) → RACK-003 / H2-2';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z004 액세서리존 - 신발 (3개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-SHO-001 (프리미엄 로퍼) → SHOE-001 / R1-1
  -- 가구: (5.8, 0, -5) + 슬롯: (-0.15, 0.2, 0) = (5.65, 0.2, -5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID,
    slot_id = 'R1-1',
    model_3d_position = '{"x": 5.65, "y": 0.2, "z": -5}'::jsonb
  WHERE sku = 'SKU-SHO-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000015-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND slot_id = 'R1-1';

  RAISE NOTICE '  ✓ SKU-SHO-001 (프리미엄 로퍼) → SHOE-001 / R1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-SHO-002 (하이힐 펌프스) → SHOE-001 / R1-2
  -- 가구: (5.8, 0, -5) + 슬롯: (0.15, 0.2, 0) = (5.95, 0.2, -5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID,
    slot_id = 'R1-2',
    model_3d_position = '{"x": 5.95, "y": 0.2, "z": -5}'::jsonb
  WHERE sku = 'SKU-SHO-002';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000016-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND slot_id = 'R1-2';

  RAISE NOTICE '  ✓ SKU-SHO-002 (하이힐 펌프스) → SHOE-001 / R1-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-SHO-003 (프리미엄 스니커즈) → SHOE-001 / R2-1
  -- 가구: (5.8, 0, -5) + 슬롯: (-0.15, 0.5, 0) = (5.65, 0.5, -5)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID,
    slot_id = 'R2-1',
    model_3d_position = '{"x": 5.65, "y": 0.5, "z": -5}'::jsonb
  WHERE sku = 'SKU-SHO-003';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000017-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND slot_id = 'R2-1';

  RAISE NOTICE '  ✓ SKU-SHO-003 (프리미엄 스니커즈) → SHOE-001 / R2-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z004 액세서리존 - 가방/스카프/머플러 (3개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BAG-001 (가죽 토트백) → BAG-001 / D1-1
  -- 가구: (5.8, 0, -3.7) + 슬롯: (-0.4, 0.04, 0) = (5.4, 0.04, -3.7)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0040005-0000-0000-0000-000000000005'::UUID,
    slot_id = 'D1-1',
    model_3d_position = '{"x": 5.4, "y": 0.04, "z": -3.7}'::jsonb
  WHERE sku = 'SKU-BAG-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000018-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0040005-0000-0000-0000-000000000005'::UUID AND slot_id = 'D1-1';

  RAISE NOTICE '  ✓ SKU-BAG-001 (가죽 토트백) → BAG-001 / D1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-MUF-001 (울 머플러) → BAG-001 / D2-1
  -- 가구: (5.8, 0, -3.7) + 슬롯: (-0.4, 0.42, 0) = (5.4, 0.42, -3.7)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0040005-0000-0000-0000-000000000005'::UUID,
    slot_id = 'D2-1',
    model_3d_position = '{"x": 5.4, "y": 0.42, "z": -3.7}'::jsonb
  WHERE sku = 'SKU-MUF-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000019-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0040005-0000-0000-0000-000000000005'::UUID AND slot_id = 'D2-1';

  RAISE NOTICE '  ✓ SKU-MUF-001 (울 머플러) → BAG-001 / D2-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-SCA-001 (실크 스카프) → SHELF-001 / S1-1 (의류존 선반)
  -- 가구: (-8.5, 0, -4.8) + 슬롯: (-0.3, 0.96, 0) = (-8.8, 0.96, -4.8)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID,
    slot_id = 'S1-1',
    model_3d_position = '{"x": -8.8, "y": 0.96, "z": -4.8}'::jsonb
  WHERE sku = 'SKU-SCA-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000020-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID AND slot_id = 'S1-1';

  RAISE NOTICE '  ✓ SKU-SCA-001 (실크 스카프) → SHELF-001 / S1-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z004 액세서리존 - 쥬얼리/벨트 (2개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-BLT-001 (가죽 벨트) → CASE-001 / S1
  -- 가구: (5.8, 0, -2) + 슬롯: (0, 0.45, 0) = (5.8, 0.45, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0040001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'S1',
    model_3d_position = '{"x": 5.8, "y": 0.45, "z": -2}'::jsonb
  WHERE sku = 'SKU-BLT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000021-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0040001-0000-0000-0000-000000000001'::UUID AND slot_id = 'S1';

  RAISE NOTICE '  ✓ SKU-BLT-001 (가죽 벨트) → CASE-001 / S1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-JWL-001 (실버 목걸이) → CASE-001 / S2
  -- 가구: (5.8, 0, -2) + 슬롯: (0, 0.711, 0) = (5.8, 0.711, -2)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0040001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'S2',
    model_3d_position = '{"x": 5.8, "y": 0.711, "z": -2}'::jsonb
  WHERE sku = 'SKU-JWL-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000022-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0040001-0000-0000-0000-000000000001'::UUID AND slot_id = 'S2';

  RAISE NOTICE '  ✓ SKU-JWL-001 (실버 목걸이) → CASE-001 / S2';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Z003 의류존 - 화장품/선물세트 (3개) → TABLE-001
  -- ═══════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-SKI-001 (스킨케어 세트) → TABLE-001 / T1-1
  -- 가구: (-8.5, 0, -5.7) + 슬롯: (-0.5, 0.76, 0.3) = (-9.0, 0.76, -5.4)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-1',
    model_3d_position = '{"x": -9.0, "y": 0.76, "z": -5.4}'::jsonb
  WHERE sku = 'SKU-SKI-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000023-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-1';

  RAISE NOTICE '  ✓ SKU-SKI-001 (스킨케어 세트) → TABLE-001 / T1-1';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-LIP-001 (립스틱 컬렉션) → TABLE-001 / T1-2
  -- 가구: (-8.5, 0, -5.7) + 슬롯: (0, 0.76, 0.3) = (-8.5, 0.76, -5.4)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-2',
    model_3d_position = '{"x": -8.5, "y": 0.76, "z": -5.4}'::jsonb
  WHERE sku = 'SKU-LIP-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000024-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-2';

  RAISE NOTICE '  ✓ SKU-LIP-001 (립스틱 컬렉션) → TABLE-001 / T1-2';

  -- ─────────────────────────────────────────────────────────────────────────
  -- SKU-GFT-001 (프리미엄 선물 세트) → TABLE-001 / T1-3
  -- 가구: (-8.5, 0, -5.7) + 슬롯: (0.5, 0.76, 0.3) = (-8.0, 0.76, -5.4)
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-3',
    model_3d_position = '{"x": -8.0, "y": 0.76, "z": -5.4}'::jsonb
  WHERE sku = 'SKU-GFT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000025-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-3';

  RAISE NOTICE '  ✓ SKU-GFT-001 (프리미엄 선물 세트) → TABLE-001 / T1-3';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 바인딩 결과 검증
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      바인딩 완료 검증                                          ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 바인딩된 상품 수 확인
  SELECT COUNT(*) INTO v_count
  FROM products
  WHERE initial_furniture_id IS NOT NULL AND slot_id IS NOT NULL;
  RAISE NOTICE '  바인딩된 상품: %/25 건', v_count;

  -- 점유된 슬롯 수 확인
  SELECT COUNT(*) INTO v_count
  FROM furniture_slots
  WHERE is_occupied = true;
  RAISE NOTICE '  점유된 슬롯: % 건', v_count;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      SEED_03A_PRODUCT_BINDING 완료!                            ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리 (참고용)
-- ============================================================================

/*
-- 바인딩된 상품 목록 확인
SELECT
  p.sku,
  p.product_name,
  f.furniture_code,
  p.slot_id,
  p.model_3d_position
FROM products p
JOIN furniture f ON f.id = p.initial_furniture_id
WHERE p.initial_furniture_id IS NOT NULL
ORDER BY p.sku;

-- 점유된 슬롯 상세
SELECT
  f.furniture_code,
  fs.slot_id,
  fs.is_occupied,
  p.sku,
  p.product_name
FROM furniture_slots fs
JOIN furniture f ON f.id = fs.furniture_id
LEFT JOIN products p ON p.id = fs.occupied_by_product_id
WHERE fs.is_occupied = true
ORDER BY f.furniture_code, fs.slot_id;

-- 월드 좌표 검증 (가구 + 슬롯 = 상품 위치)
SELECT
  p.sku,
  f.furniture_code,
  p.slot_id,
  jsonb_build_object(
    'furniture', jsonb_build_object('x', f.position_x, 'y', f.position_y, 'z', f.position_z),
    'slot', fs.slot_position,
    'product', p.model_3d_position
  ) as positions
FROM products p
JOIN furniture f ON f.id = p.initial_furniture_id
JOIN furniture_slots fs ON fs.furniture_id = f.id AND fs.slot_id = p.slot_id
WHERE p.initial_furniture_id IS NOT NULL;
*/

-- ============================================================================
-- End of SEED_03A_PRODUCT_BINDING.sql
-- ============================================================================
