-- ============================================================================
-- NEURALTWIN v8.6 SEED_07: 3D 모델 URL 및 아바타 자동 매칭
-- ============================================================================
-- 실행 순서: SEED_06 이후 (또는 독립 실행 가능)
-- 목적:
--   1. Supabase Storage에 실제 존재하는 GLB 파일만 매칭
--   2. Furniture model_url 업데이트 (naming 차이 처리)
--   3. Products model_3d_url 업데이트 (디스플레이 타입별)
--   4. Staff avatar_url 자동 매칭 (역할 기반)
--   5. Customers avatar_url 자동 매칭 (세그먼트 기반 - 시뮬레이션용)
-- ============================================================================
--
-- 📁 Supabase Storage 경로:
-- https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/
--   e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/
--     ├── customers/avatar_customer_{segment}_{gender}.glb
--     ├── furniture/{type}.glb
--     ├── products/{category}/{product}_{display_type}.glb
--     ├── space/{space}.glb
--     └── staff/avatar_{role}_{num}.glb
--
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_base_url TEXT := 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models';

  -- 작업 변수
  v_count INT := 0;
  v_updated INT := 0;
  v_customer RECORD;
  v_idx INT;

BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_07: 3D 모델 URL 및 아바타 자동 매칭';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '  📁 실제 Supabase Storage 파일 기반 매칭';
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store가 없습니다. 기본 시드를 먼저 실행하세요.';
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.1: Furniture model_url 업데이트
  -- ⚠️ SEED_03의 furniture_type과 Storage 파일명 차이 처리
  --    SEED_03: clothing_rack_double_01 → Storage: rack_clothing_double_01
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.1] Furniture model_url 업데이트...';

  -- 1) 직접 매칭되는 가구 (파일명 = furniture_type)
  UPDATE furniture SET model_url = v_base_url || '/furniture/' || furniture_type || '.glb'
  WHERE store_id = v_store_id AND furniture_type IN (
    'gate_entrance_01',
    'sign_welcome_01',
    'kiosk_info_01',
    'cart_stand_01',
    'stand_promo_01', 'stand_promo_02', 'stand_promo_03', 'stand_promo_04',
    'table_display_center_01', 'table_display_center_02',
    'display_round_01',
    'mannequin_full_01', 'mannequin_full_02', 'mannequin_full_03', 'mannequin_full_04',
    'banner_hanger_01', 'banner_hanger_02',
    'shelf_display_01', 'shelf_display_02',
    'table_display_01', 'table_display_02',
    'mannequin_torso_01', 'mannequin_torso_02', 'mannequin_torso_03', 'mannequin_torso_04',
    'mirror_full_01', 'mirror_full_02',
    'sign_size_01', 'sign_size_02', 'sign_size_03', 'sign_size_04',
    'sign_size_05', 'sign_size_06', 'sign_size_07', 'sign_size_08',
    'showcase_locked_01', 'showcase_locked_02',
    'showcase_open_01', 'showcase_open_02',
    'display_bag_01', 'display_bag_02',
    'stand_accessory_01', 'stand_accessory_02',
    'shelf_shoes_01', 'shelf_shoes_02', 'shelf_shoes_03',
    'fitting_booth_01', 'fitting_booth_02', 'fitting_booth_03', 'fitting_booth_04',
    'counter_checkout_01', 'counter_checkout_02',
    'pos_terminal_01', 'pos_terminal_02',
    'sofa_2seat_01', 'sofa_2seat_02',
    'chair_lounge_01', 'chair_lounge_02',
    'table_coffee_01', 'table_coffee_02'
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '    - 직접 매칭: %건', v_updated;

  -- 2) 명명 규칙 변환이 필요한 가구 (clothing_rack → rack_clothing)
  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_double_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_01';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_double_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_02';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_double_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_03';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_double_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_04';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_single_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_01';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_single_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_02';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_single_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_03';

  UPDATE furniture SET model_url = v_base_url || '/furniture/rack_clothing_single_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_04';

  RAISE NOTICE '    - 명명 변환: clothing_rack → rack_clothing (8건)';

  SELECT COUNT(*) INTO v_count FROM furniture WHERE store_id = v_store_id AND model_url IS NOT NULL;
  RAISE NOTICE '    ✓ furniture model_url: 총 %건 설정됨', v_count;

  -- 매칭되지 않은 가구 경고
  SELECT COUNT(*) INTO v_count FROM furniture WHERE store_id = v_store_id AND model_url IS NULL;
  IF v_count > 0 THEN
    RAISE NOTICE '    ⚠ 매칭되지 않은 가구: %건', v_count;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.2: Products model_3d_url 업데이트 (실제 파일 경로 반영)
  -- 상품별 디스플레이 타입에 따라 다른 GLB 파일 매칭
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.2] Products model_3d_url 업데이트...';

  -- 아우터 (outwear/) - hanging 타입
  UPDATE products SET model_3d_url = v_base_url || '/products/outwear/product_coat_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-OUT-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/outwear/product_jacket_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-OUT-002';

  UPDATE products SET model_3d_url = v_base_url || '/products/outwear/product_padding_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-OUT-003';

  -- 상의 (tops/) - display_type에 따라
  UPDATE products SET model_3d_url = v_base_url || '/products/tops/product_blouse_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-TOP-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/tops/product_sweater_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-TOP-002';

  UPDATE products SET model_3d_url = v_base_url || '/products/tops/product_shirts_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-TOP-003';

  UPDATE products SET model_3d_url = v_base_url || '/products/tops/product_top_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-TOP-004';

  -- 하의 (bottoms/) - display_type에 따라
  UPDATE products SET model_3d_url = v_base_url || '/products/bottoms/product_jeans_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-BTM-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/bottoms/product_pants_01_hanging.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-BTM-002';

  UPDATE products SET model_3d_url = v_base_url || '/products/bottoms/product_pants_02_folded.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-BTM-003';

  -- 신발 (shoes/) - located 타입
  UPDATE products SET model_3d_url = v_base_url || '/products/shoes/product_shoes_loafer_01_located.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-SHO-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/shoes/product_shoes_heels_01_located.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-SHO-002';

  UPDATE products SET model_3d_url = v_base_url || '/products/shoes/product_shoes_sneakers_01_located.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-SHO-003';

  -- 가방/악세서리 (accessories/)
  UPDATE products SET model_3d_url = v_base_url || '/products/accessories/product_bag_tote_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-BAG-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/accessories/product_scarf_set_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-SCA-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/accessories/product_belt_leather_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-BLT-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/accessories/product_necklace_silver_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-JWL-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/accessories/product_muffler_set_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-JWL-002';

  -- 화장품 (cosmetics/)
  UPDATE products SET model_3d_url = v_base_url || '/products/cosmetics/product_skincare_set_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-UND-001';

  UPDATE products SET model_3d_url = v_base_url || '/products/cosmetics/product_lipstick_set_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-SOC-001';

  -- 기프트박스 (giftbox/)
  UPDATE products SET model_3d_url = v_base_url || '/products/giftbox/product_giftbox_01.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-GFT-001';

  -- 적층형 상품 (tops/stacked)
  UPDATE products SET model_3d_url = v_base_url || '/products/tops/product_shirts_01_stacked.glb'
  WHERE store_id = v_store_id AND sku = 'SKU-TSK-001';

  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = v_store_id AND model_3d_url IS NOT NULL;
  RAISE NOTICE '    ✓ products model_3d_url: %건 설정됨', v_count;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.2.1: product_models 테이블 - standing 디스플레이 타입 URL 추가 (17개)
  -- 마네킹 배치용 standing 모델 URL 매칭
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.2.1] product_models standing URL 추가 (17개)...';

  -- 기존 standing 타입 레코드 정리
  DELETE FROM product_models WHERE display_type = 'standing';

  -- 상의 (tops/) - 5개: blouse, sweater, shirts, top, cardigan
  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/tops/product_blouse_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-TOP-001';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/tops/product_sweater_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-TOP-002';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/tops/product_shirts_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-TOP-003';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/tops/product_top_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-TOP-004';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/tops/product_cardigan_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-TOP-005'
  ON CONFLICT (product_id, display_type) DO NOTHING;

  -- 하의 (bottoms/) - 4개: jeans, pants, skirt_a, skirt_f
  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/bottoms/product_jeans_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-BTM-001';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/bottoms/product_pants_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-BTM-002';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/bottoms/product_skirt_a_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-BTM-003';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/bottoms/product_skirt_f_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-BTM-004'
  ON CONFLICT (product_id, display_type) DO NOTHING;

  -- 아우터 (outwear/) - 5개: coat, jacket, padding, vest, trench
  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/outwear/product_coat_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-OUT-001';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/outwear/product_jacket_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-OUT-002';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/outwear/product_padding_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-OUT-003';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/outwear/product_vest_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-OUT-004'
  ON CONFLICT (product_id, display_type) DO NOTHING;

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/outwear/product_trench_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-OUT-005'
  ON CONFLICT (product_id, display_type) DO NOTHING;

  -- 신발 (shoes/) - 3개: loafer, heels, sneakers → _standing (not _located_standing)
  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/shoes/product_shoes_loafer_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-SHO-001';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/shoes/product_shoes_heels_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-SHO-002';

  INSERT INTO product_models (product_id, display_type, model_3d_url, is_default)
  SELECT p.id, 'standing', v_base_url || '/products/shoes/product_shoes_sneakers_01_standing.glb', false
  FROM products p WHERE p.store_id = v_store_id AND p.sku = 'SKU-SHO-003';

  SELECT COUNT(*) INTO v_count FROM product_models WHERE display_type = 'standing';
  RAISE NOTICE '    ✓ product_models standing: %건 추가됨', v_count;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.3: Staff avatar_url 자동 매칭 (실제 파일 기반)
  -- 📁 실제 파일: avatar_manager_01, avatar_sales_01/02, avatar_cashier_01/02,
  --              avatar_security_01, avatar_fitting_01, avatar_greeter_01
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.3] Staff avatar_url 자동 매칭...';

  -- Role 기반 아바타 매칭
  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_manager_01.glb'
  WHERE store_id = v_store_id AND role = 'manager';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_sales_01.glb'
  WHERE store_id = v_store_id AND role = 'sales' AND staff_code = 'EMP002';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_sales_02.glb'
  WHERE store_id = v_store_id AND role = 'sales' AND staff_code = 'EMP003';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_cashier_01.glb'
  WHERE store_id = v_store_id AND role = 'cashier' AND staff_code = 'EMP004';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_cashier_02.glb'
  WHERE store_id = v_store_id AND role = 'cashier' AND staff_code = 'EMP005';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_security_01.glb'
  WHERE store_id = v_store_id AND role = 'security';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_fitting_01.glb'
  WHERE store_id = v_store_id AND role = 'fitting';

  UPDATE staff SET avatar_url = v_base_url || '/staff/avatar_greeter_01.glb'
  WHERE store_id = v_store_id AND role = 'greeter';

  SELECT COUNT(*) INTO v_count FROM staff WHERE store_id = v_store_id AND avatar_url IS NOT NULL;
  RAISE NOTICE '    ✓ staff avatar_url: %건 설정됨', v_count;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.4: Customer avatar_url 자동 매칭 (세그먼트 기반 - 시뮬레이션용)
  -- 📁 실제 파일: avatar_customer_{segment}_{gender}.glb
  --    - vip_male, vip_female
  --    - regular_male, regular_female
  --    - new_male, new_female
  --    - dormant_male, dormant_female
  --    - senior_male, senior_female
  --    - teen_male, teen_female
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.4] Customer avatar_url 자동 매칭 (시뮬레이션용)...';

  v_updated := 0;

-- VIP 고객 → avatar_customer_vip_{gender}.glb
v_idx := 0;
FOR v_customer IN
  SELECT id
  FROM customers
  WHERE store_id = v_store_id AND segment = 'VIP'
  ORDER BY COALESCE(customer_name, '')
LOOP
  IF v_idx % 2 = 0 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_vip_male.glb'
    WHERE id = v_customer.id;
  ELSE
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_vip_female.glb'
    WHERE id = v_customer.id;
  END IF;
  v_idx := v_idx + 1;
  v_updated := v_updated + 1;
END LOOP;
RAISE NOTICE '    - VIP 고객: %건 (vip_male/vip_female)', v_idx;

-- Regular 고객 → avatar_customer_regular_{gender}.glb
v_idx := 0;
FOR v_customer IN
  SELECT id
  FROM customers
  WHERE store_id = v_store_id AND segment = 'Regular'
  ORDER BY COALESCE(customer_name, '')
LOOP
  IF v_idx % 2 = 0 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_regular_male.glb'
    WHERE id = v_customer.id;
  ELSE
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_regular_female.glb'
    WHERE id = v_customer.id;
  END IF;
  v_idx := v_idx + 1;
  v_updated := v_updated + 1;
END LOOP;
RAISE NOTICE '    - Regular 고객: %건 (regular_male/regular_female)', v_idx;

-- New 고객 → avatar_customer_new_{gender}.glb + teen 믹스
v_idx := 0;
FOR v_customer IN
  SELECT id
  FROM customers
  WHERE store_id = v_store_id AND segment = 'New'
  ORDER BY COALESCE(customer_name, '')
LOOP
  -- New 고객 중 일부는 teen 아바타 사용 (젊은 신규 고객 표현)
  IF v_idx % 4 = 0 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_teen_male.glb'
    WHERE id = v_customer.id;
  ELSIF v_idx % 4 = 1 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_teen_female.glb'
    WHERE id = v_customer.id;
  ELSIF v_idx % 4 = 2 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_new_male.glb'
    WHERE id = v_customer.id;
  ELSE
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_new_female.glb'
    WHERE id = v_customer.id;
  END IF;
  v_idx := v_idx + 1;
  v_updated := v_updated + 1;
END LOOP;
RAISE NOTICE '    - New 고객: %건 (new + teen 믹스)', v_idx;

-- Dormant 고객 → avatar_customer_dormant_{gender}.glb + senior 믹스
v_idx := 0;
FOR v_customer IN
  SELECT id
  FROM customers
  WHERE store_id = v_store_id AND segment = 'Dormant'
  ORDER BY COALESCE(customer_name, '')
LOOP
  -- Dormant 고객 중 일부는 senior 아바타 사용 (연령 다양성)
  IF v_idx % 4 = 0 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_senior_male.glb'
    WHERE id = v_customer.id;
  ELSIF v_idx % 4 = 1 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_senior_female.glb'
    WHERE id = v_customer.id;
  ELSIF v_idx % 4 = 2 THEN
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_dormant_male.glb'
    WHERE id = v_customer.id;
  ELSE
    UPDATE customers
      SET avatar_url = v_base_url || '/customers/avatar_customer_dormant_female.glb'
    WHERE id = v_customer.id;
  END IF;
  v_idx := v_idx + 1;
  v_updated := v_updated + 1;
END LOOP;
  RAISE NOTICE '    - Dormant 고객: %건 (dormant + senior 믹스)', v_idx;

  RAISE NOTICE '    ✓ customers avatar_url: 총 %건 설정됨', v_updated;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- STEP 7.5: Space/Zone 모델 URL 업데이트 (stores.metadata, zones_dim.metadata)
  -- 📁 실제 파일: store_simple_10x10_baked.glb (20x20 없음)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 7.5] Space/Zone 모델 URL 업데이트...';

  -- Store 전체 모델 (10x10 버전 사용)
  UPDATE stores SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', v_base_url || '/space/store_simple_10x10_baked.glb'
    )
  WHERE id = v_store_id;
  RAISE NOTICE '    ✓ store model_3d_url: store_simple_10x10_baked.glb';

  -- Zone 모델은 현재 개별 파일 없음 - 향후 업로드 시 활성화
  -- UPDATE zones_dim SET metadata = ...

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_07 완료: 3D 모델 URL 및 아바타 자동 매칭';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

  SELECT COUNT(*) INTO v_count FROM furniture WHERE store_id = v_store_id AND model_url IS NOT NULL;
  RAISE NOTICE '  ✓ furniture model_url: %건', v_count;

  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = v_store_id AND model_3d_url IS NOT NULL;
  RAISE NOTICE '  ✓ products model_3d_url: %건', v_count;

  SELECT COUNT(*) INTO v_count FROM staff WHERE store_id = v_store_id AND avatar_url IS NOT NULL;
  RAISE NOTICE '  ✓ staff avatar_url: %건', v_count;

  SELECT COUNT(*) INTO v_count FROM customers WHERE store_id = v_store_id AND avatar_url IS NOT NULL;
  RAISE NOTICE '  ✓ customers avatar_url: %건', v_count;

  RAISE NOTICE '';
  RAISE NOTICE '  📁 실제 Supabase Storage 파일 기반 매칭:';
  RAISE NOTICE '    - Staff avatars: 8개 (manager, sales×2, cashier×2, security, fitting, greeter)';
  RAISE NOTICE '    - Customer avatars: 12개 (vip/regular/new/dormant/senior/teen × male/female)';
  RAISE NOTICE '    - Furniture models: ~60개 (rack_clothing, shelf, table, etc.)';
  RAISE NOTICE '    - Product models: ~20개 (outwear, tops, bottoms, shoes, accessories)';
  RAISE NOTICE '    - Space models: 1개 (store_simple_10x10_baked.glb)';
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;


-- ════════════════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Furniture 모델 URL 현황
SELECT
  'furniture' as entity,
  COUNT(*) FILTER (WHERE model_url IS NOT NULL) as with_url,
  COUNT(*) FILTER (WHERE model_url IS NULL) as without_url,
  COUNT(*) as total
FROM furniture;

-- 2. Products 모델 URL 현황
SELECT
  'products' as entity,
  COUNT(*) FILTER (WHERE model_3d_url IS NOT NULL) as with_url,
  COUNT(*) FILTER (WHERE model_3d_url IS NULL) as without_url,
  COUNT(*) as total
FROM products;

-- 3. Staff 아바타 URL 현황
SELECT staff_code, staff_name, role, avatar_url
FROM staff
ORDER BY staff_code;

-- 4. Customers 아바타 URL 현황 (세그먼트별)
SELECT
  segment,
  COUNT(*) FILTER (WHERE avatar_url IS NOT NULL) as with_avatar,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE avatar_url IS NOT NULL) / COUNT(*), 1) as pct
FROM customers
GROUP BY segment
ORDER BY segment;

-- 5. 고객 아바타 분포 확인 (시뮬레이션 다양성 검증)
SELECT
  CASE
    WHEN avatar_url LIKE '%vip_male%' THEN 'VIP Male'
    WHEN avatar_url LIKE '%vip_female%' THEN 'VIP Female'
    WHEN avatar_url LIKE '%regular_male%' THEN 'Regular Male'
    WHEN avatar_url LIKE '%regular_female%' THEN 'Regular Female'
    WHEN avatar_url LIKE '%new_male%' THEN 'New Male'
    WHEN avatar_url LIKE '%new_female%' THEN 'New Female'
    WHEN avatar_url LIKE '%teen_male%' THEN 'Teen Male'
    WHEN avatar_url LIKE '%teen_female%' THEN 'Teen Female'
    WHEN avatar_url LIKE '%dormant_male%' THEN 'Dormant Male'
    WHEN avatar_url LIKE '%dormant_female%' THEN 'Dormant Female'
    WHEN avatar_url LIKE '%senior_male%' THEN 'Senior Male'
    WHEN avatar_url LIKE '%senior_female%' THEN 'Senior Female'
    ELSE 'Unknown'
  END as avatar_type,
  COUNT(*) as count
FROM customers
WHERE avatar_url IS NOT NULL
GROUP BY 1
ORDER BY count DESC;

-- 6. 매칭되지 않은 Furniture 목록 (디버깅용)
SELECT furniture_type, furniture_code, furniture_name
FROM furniture
WHERE model_url IS NULL
ORDER BY furniture_type;

-- 7. Store 모델 URL 확인
SELECT id, store_name, metadata->>'model_3d_url' as model_url
FROM stores;
