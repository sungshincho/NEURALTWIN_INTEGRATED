-- ============================================================================
-- MVP 테스트용 3D 모델 URL 연결 스크립트
-- ============================================================================
--
-- 📌 이 파일은 3D 모델 제작 후 직접 수정해야 합니다!
--
-- 사용법:
--   1. 3D 모델 12개 제작 완료
--   2. Supabase Storage에 업로드
--   3. 아래 URL 플레이스홀더를 실제 URL로 교체
--   4. 이 스크립트 실행
--
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 📋 필수 수정 항목 (3D 모델 제작 후)
-- ════════════════════════════════════════════════════════════════════════════

-- Storage URL 기본 경로 (프로젝트에 맞게 수정)
-- 예: https://xxxxx.supabase.co/storage/v1/object/public/3d-models/

DO $$
DECLARE
  -- ⚠️ 아래 URL을 실제 Supabase Storage URL로 변경하세요!
  v_storage_base TEXT := 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/3d-models';

  v_store_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id, user_id INTO v_store_id, v_user_id FROM stores LIMIT 1;

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '           MVP 3D Model URL Update                              ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 1. 공간 모델 URL (zones_dim)
  -- ═══════════════════════════════════════════════════════════════════════
  -- 📁 파일명: store_simple_10x10_baked.glb

  UPDATE zones_dim SET
    model_3d_url = v_storage_base || '/spaces/store_simple_10x10_baked.glb'
  WHERE store_id = v_store_id AND zone_code = 'Z001';  -- 입구/통로

  RAISE NOTICE '  ✓ 공간 모델 URL 설정';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 2. 가구 모델 URL (furniture)
  -- ═══════════════════════════════════════════════════════════════════════
  -- 📁 파일명: rack_hanger_simple.glb, shelf_simple.glb, table_simple.glb, rack_shoes_simple.glb

  -- 의류 행거 (4개 모두 같은 모델 사용)
  UPDATE furniture SET
    model_url = v_storage_base || '/furniture/rack_hanger_simple.glb'
  WHERE store_id = v_store_id AND furniture_type LIKE 'clothing_rack%';

  -- 선반형 진열대
  UPDATE furniture SET
    model_url = v_storage_base || '/furniture/shelf_simple.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_display';

  -- 테이블 디스플레이
  UPDATE furniture SET
    model_url = v_storage_base || '/furniture/table_simple.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_display';

  -- 신발 진열대
  UPDATE furniture SET
    model_url = v_storage_base || '/furniture/rack_shoes_simple.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shoe_rack';

  -- 유리 쇼케이스 (신발 진열대와 유사하게 처리, 또는 별도 모델)
  UPDATE furniture SET
    model_url = v_storage_base || '/furniture/shelf_simple.glb'  -- 또는 showcase_simple.glb
  WHERE store_id = v_store_id AND furniture_type = 'glass_showcase';

  RAISE NOTICE '  ✓ 가구 모델 URL 설정 (12개)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 3. 상품 모델 URL (products) - MVP 5개 상품만 설정
  -- ═══════════════════════════════════════════════════════════════════════
  -- 📁 파일명: product_coat.glb, product_sweater.glb, product_shoes.glb,
  --           product_giftbox.glb, product_tshirt_stack.glb

  -- hanging 대표: 코트
  UPDATE products SET
    model_3d_url = v_storage_base || '/products/product_coat.glb'
  WHERE sku = 'SKU-OUT-001';  -- 프리미엄 캐시미어 코트

  -- folded 대표: 속옷세트 (sweater 모델 사용)
  UPDATE products SET
    model_3d_url = v_storage_base || '/products/product_sweater.glb'
  WHERE sku = 'SKU-UND-001';  -- 프리미엄 속옷 세트

  -- standing 대표: 로퍼
  UPDATE products SET
    model_3d_url = v_storage_base || '/products/product_shoes.glb'
  WHERE sku = 'SKU-SHO-001';  -- 프리미엄 로퍼

  -- boxed 대표: 선물세트
  UPDATE products SET
    model_3d_url = v_storage_base || '/products/product_giftbox.glb'
  WHERE sku = 'SKU-GFT-001';  -- 프리미엄 선물 세트

  -- stacked 대표: 티셔츠 팩
  UPDATE products SET
    model_3d_url = v_storage_base || '/products/product_tshirt_stack.glb'
  WHERE sku = 'SKU-TSK-001';  -- 베이직 티셔츠 3팩

  RAISE NOTICE '  ✓ 상품 모델 URL 설정 (MVP 5개)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 4. 아바타 모델 URL (staff) - 선택사항
  -- ═══════════════════════════════════════════════════════════════════════
  -- 📁 파일명: avatar_staff.glb, avatar_customer.glb

  -- 직원 아바타 (1명만 MVP 테스트)
  UPDATE staff SET
    avatar_url = v_storage_base || '/avatars/avatar_staff.glb',
    avatar_position = '{"x": 0, "y": 0, "z": -3}'::jsonb
  WHERE employee_code = 'EMP001';

  RAISE NOTICE '  ✓ 아바타 모델 URL 설정 (1명)';

  -- ═══════════════════════════════════════════════════════════════════════
  -- 5. Summary
  -- ═══════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  MVP Model URL Update Complete!                                ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '  📦 설정된 모델:';
  RAISE NOTICE '    - 공간: 1개 (store_simple_10x10_baked.glb)';
  RAISE NOTICE '    - 가구: 4종 (rack_hanger, shelf, table, rack_shoes)';
  RAISE NOTICE '    - 상품: 5개 (coat, sweater, shoes, giftbox, tshirt_stack)';
  RAISE NOTICE '    - 아바타: 1개 (avatar_staff)';
  RAISE NOTICE '';
  RAISE NOTICE '  ⚠️ 나머지 상품(20개)은 Primitive Fallback으로 렌더링됩니다.';
  RAISE NOTICE '';
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 📋 MVP 상품-슬롯 배치 (초기 배치)
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '           MVP Product-Slot Assignment                          ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 코트 → RACK-001 첫번째 행거
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H1',
    model_3d_position = '{"x":-6,"y":1.6,"z":2}'::jsonb
  WHERE sku = 'SKU-OUT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000001-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H1';

  -- 속옷세트(folded) → SHELF-001 첫번째 선반
  UPDATE products SET
    initial_furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID,
    slot_id = 'S1-1',
    model_3d_position = '{"x":-3.3,"y":0.2,"z":3}'::jsonb
  WHERE sku = 'SKU-UND-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000020-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID AND slot_id = 'S1-1';

  -- 로퍼(standing) → SHOE-001 첫번째 슬롯
  UPDATE products SET
    initial_furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID,
    slot_id = 'R1-1',
    model_3d_position = '{"x":3.6,"y":0.15,"z":2}'::jsonb
  WHERE sku = 'SKU-SHO-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000010-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND slot_id = 'R1-1';

  -- 선물세트(boxed) → TABLE-001 첫번째 슬롯
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-1',
    model_3d_position = '{"x":-5.35,"y":0.9,"z":-0.2}'::jsonb
  WHERE sku = 'SKU-GFT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000024-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-1';

  -- 티셔츠팩(stacked) → TABLE-001 두번째 슬롯
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-2',
    model_3d_position = '{"x":-5,"y":0.9,"z":-0.2}'::jsonb
  WHERE sku = 'SKU-TSK-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000025-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-2';

  RAISE NOTICE '  ✓ MVP 5개 상품 슬롯 배치 완료';
  RAISE NOTICE '';
  RAISE NOTICE '  배치 현황:';
  RAISE NOTICE '    - SKU-OUT-001 (코트)      → RACK-001 / H1';
  RAISE NOTICE '    - SKU-UND-001 (속옷세트)  → SHELF-001 / S1-1';
  RAISE NOTICE '    - SKU-SHO-001 (로퍼)      → SHOE-001 / R1-1';
  RAISE NOTICE '    - SKU-GFT-001 (선물세트)  → TABLE-001 / T1-1';
  RAISE NOTICE '    - SKU-TSK-001 (티셔츠팩)  → TABLE-001 / T1-2';
  RAISE NOTICE '';
END $$;
