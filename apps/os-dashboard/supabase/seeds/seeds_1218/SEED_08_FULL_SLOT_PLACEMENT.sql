-- ════════════════════════════════════════════════════════════════════════════
-- NEURALTWIN v8.6 SEED_08_FULL_SLOT_PLACEMENT.sql
-- 176개 슬롯 전체에 상품 모델 배치 (중복 허용)
-- 실행 순서: SEED_00, SEED_03 이후
-- ════════════════════════════════════════════════════════════════════════════
--
-- 목적:
-- - 25개 제품의 60개 모델 파일을 176개 슬롯에 배치
-- - 슬롯의 compatible_display_types와 상품의 display_type 매칭
-- - 라운드 로빈 방식으로 상품 순환 배치
--
-- 스키마 (SEED_00 기준):
-- - product_placements.slot_id → furniture_slots.id (UUID FK)
-- - product_placements.display_type
-- - product_placements.is_active
--
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_slot RECORD;
  v_product_index INT := 0;
  v_products_array UUID[];
  v_products_count INT;
  v_matched_product_id UUID;
  v_matched_model_url TEXT;
  v_matched_display_type TEXT;
  v_placement_count INT := 0;
  v_base_url TEXT := 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_08: 176개 슬롯 전체 배치';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'stores 테이블에 데이터가 없습니다.';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 1: 기존 product_placements 초기화
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 1] 기존 배치 데이터 초기화...';

  DELETE FROM product_placements WHERE store_id = v_store_id;

  UPDATE furniture_slots SET
    is_occupied = false,
    updated_at = NOW()
  WHERE store_id = v_store_id;

  UPDATE products SET
    initial_furniture_id = NULL,
    slot_id = NULL,
    model_3d_position = '{"x":0,"y":0,"z":0}'::jsonb,
    updated_at = NOW()
  WHERE store_id = v_store_id;

  RAISE NOTICE '    ✓ 초기화 완료';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2: 상품 ID 배열 생성 (라운드 로빈용)
  -- ══════════════════════════════════════════════════════════════════════════
  SELECT array_agg(id ORDER BY sku) INTO v_products_array
  FROM products WHERE store_id = v_store_id;

  v_products_count := array_length(v_products_array, 1);
  RAISE NOTICE '  [STEP 2] 상품 수: %개', v_products_count;

  IF v_products_count IS NULL OR v_products_count = 0 THEN
    RAISE EXCEPTION 'products 테이블에 데이터가 없습니다.';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3: 모든 슬롯에 상품 배치
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3] 176개 슬롯 전체 배치 시작...';

  FOR v_slot IN
    SELECT
      fs.id AS slot_uuid,
      fs.furniture_id,
      fs.slot_id AS slot_code,
      fs.slot_type,
      fs.slot_position,
      fs.slot_rotation,
      fs.compatible_display_types,
      fs.properties,  -- 마네킹 allowed_categories 접근용
      f.furniture_code,
      f.furniture_name,
      f.zone_id,
      f.position_x AS furn_x,
      f.position_y AS furn_y,
      f.position_z AS furn_z
    FROM furniture_slots fs
    JOIN furniture f ON f.id = fs.furniture_id
    WHERE fs.store_id = v_store_id
      AND fs.compatible_display_types IS NOT NULL
      AND array_length(fs.compatible_display_types, 1) > 0
    ORDER BY f.furniture_code, fs.slot_id
  LOOP
    -- ────────────────────────────────────────────────────────────────────────
    -- 호환되는 상품 찾기 (라운드 로빈 + display_type + 카테고리 매칭)
    -- 마네킹 슬롯의 경우 properties.allowed_categories 확인
    -- ────────────────────────────────────────────────────────────────────────
    v_matched_product_id := NULL;
    v_matched_model_url := NULL;
    v_matched_display_type := NULL;

    -- 마네킹 슬롯 특별 처리: properties.allowed_categories 기반 매칭
    IF v_slot.slot_type IN ('mannequin_top', 'mannequin_bottom', 'mannequin_shoes') THEN
      DECLARE
        v_allowed_categories TEXT[];
        v_category_product RECORD;
      BEGIN
        -- properties에서 allowed_categories 직접 추출
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(
            COALESCE(v_slot.properties->'allowed_categories', '[]'::jsonb)
          )
        ) INTO v_allowed_categories;

        -- 해당 카테고리의 제품 중 standing 모델이 있는 것 찾기
        IF array_length(v_allowed_categories, 1) > 0 THEN
          FOR v_category_product IN
            SELECT
              p.id AS product_id,
              pm.model_3d_url,
              pm.display_type
            FROM products p
            JOIN product_models pm ON pm.product_id = p.id
            WHERE p.store_id = v_store_id
              AND p.category = ANY(v_allowed_categories)
              AND pm.display_type = 'standing'
            ORDER BY RANDOM()
            LIMIT 1
          LOOP
            v_matched_product_id := v_category_product.product_id;
            v_matched_model_url := v_category_product.model_3d_url;
            v_matched_display_type := v_category_product.display_type;
          END LOOP;
        END IF;
      END;
    END IF;

    -- 일반 슬롯 또는 마네킹 폴백: 라운드 로빈으로 상품 선택 시도 (최대 products_count번)
    IF v_matched_product_id IS NULL THEN
      FOR i IN 0..v_products_count-1 LOOP
        DECLARE
          v_try_index INT := ((v_product_index + i) % v_products_count) + 1;
          v_try_product_id UUID := v_products_array[v_try_index];
        BEGIN
          -- product_models에서 슬롯 호환 display_type 찾기
          SELECT
            pm.product_id,
            pm.model_3d_url,
            pm.display_type
          INTO v_matched_product_id, v_matched_model_url, v_matched_display_type
          FROM product_models pm
          WHERE pm.product_id = v_try_product_id
            AND pm.display_type = ANY(v_slot.compatible_display_types)
          ORDER BY pm.is_default DESC
          LIMIT 1;

          IF v_matched_product_id IS NOT NULL THEN
            EXIT;
          END IF;
        END;
      END LOOP;
    END IF;

    -- product_models에서 못 찾으면 products.model_3d_url 사용
    IF v_matched_product_id IS NULL THEN
      DECLARE
        v_try_index INT := ((v_product_index) % v_products_count) + 1;
        v_try_product_id UUID := v_products_array[v_try_index];
      BEGIN
        SELECT
          p.id,
          p.model_3d_url,
          p.display_type
        INTO v_matched_product_id, v_matched_model_url, v_matched_display_type
        FROM products p
        WHERE p.id = v_try_product_id
          AND p.model_3d_url IS NOT NULL
          AND p.display_type = ANY(v_slot.compatible_display_types);
      END;
    END IF;

    -- 호환되는 상품이 없으면 아무 상품이나 배치 (display_type 무시)
    IF v_matched_product_id IS NULL THEN
      DECLARE
        v_try_index INT := ((v_product_index) % v_products_count) + 1;
        v_try_product_id UUID := v_products_array[v_try_index];
      BEGIN
        SELECT
          p.id,
          p.model_3d_url,
          COALESCE(v_slot.compatible_display_types[1], 'standing')
        INTO v_matched_product_id, v_matched_model_url, v_matched_display_type
        FROM products p
        WHERE p.id = v_try_product_id
          AND p.model_3d_url IS NOT NULL;
      END;
    END IF;

    IF v_matched_product_id IS NULL THEN
      RAISE NOTICE '    ⚠ 슬롯 %/% 스킵', v_slot.furniture_code, v_slot.slot_code;
      CONTINUE;
    END IF;

    -- ────────────────────────────────────────────────────────────────────────
    -- product_placements에 배치 레코드 생성 (SEED_00 스키마)
    -- ────────────────────────────────────────────────────────────────────────
    INSERT INTO product_placements (
      id,
      slot_id,
      product_id,
      store_id,
      user_id,
      org_id,
      display_type,
      position_offset,
      rotation_offset,
      scale,
      quantity,
      is_active,
      placed_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_slot.slot_uuid,  -- furniture_slots.id (UUID FK)
      v_matched_product_id,
      v_store_id,
      v_user_id,
      v_org_id,
      v_matched_display_type,
      '{"x":0,"y":0,"z":0}'::jsonb,
      '{"x":0,"y":0,"z":0}'::jsonb,
      '{"x":1,"y":1,"z":1}'::jsonb,
      1,
      true,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (slot_id, product_id) DO UPDATE SET
      display_type = EXCLUDED.display_type,
      is_active = true,
      updated_at = NOW();

    -- ────────────────────────────────────────────────────────────────────────
    -- furniture_slots 점유 상태 업데이트
    -- ────────────────────────────────────────────────────────────────────────
    UPDATE furniture_slots SET
      is_occupied = true,
      updated_at = NOW()
    WHERE id = v_slot.slot_uuid;

    v_placement_count := v_placement_count + 1;
    v_product_index := v_product_index + 1;

    IF v_placement_count % 20 = 0 THEN
      RAISE NOTICE '    ... %건 배치 완료', v_placement_count;
    END IF;

  END LOOP;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 4: 결과 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  배치 완료 리포트';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ 총 배치 수: %건', v_placement_count;

  DECLARE
    v_stat RECORD;
  BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '  [display_type별 배치 통계]';
    FOR v_stat IN
      SELECT display_type, COUNT(*) as cnt
      FROM product_placements
      WHERE store_id = v_store_id AND is_active = true
      GROUP BY display_type
      ORDER BY cnt DESC
    LOOP
      RAISE NOTICE '    - %: %건', v_stat.display_type, v_stat.cnt;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '  [상품별 배치 수]';
    FOR v_stat IN
      SELECT p.product_name, COUNT(*) as cnt
      FROM product_placements pp
      JOIN products p ON p.id = pp.product_id
      WHERE pp.store_id = v_store_id AND pp.is_active = true
      GROUP BY p.product_name
      ORDER BY cnt DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '    - %: %건', v_stat.product_name, v_stat.cnt;
    END LOOP;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_08 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- 검증 쿼리 (참고용)
-- ════════════════════════════════════════════════════════════════════════════

/*
-- 배치 현황 확인 (월드 좌표 포함)
SELECT
  f.furniture_code,
  fs.slot_id,
  p.product_name,
  pp.display_type,
  jsonb_build_object(
    'x', f.position_x + (fs.slot_position->>'x')::NUMERIC,
    'y', f.position_y + (fs.slot_position->>'y')::NUMERIC,
    'z', f.position_z + (fs.slot_position->>'z')::NUMERIC
  ) as world_position
FROM product_placements pp
JOIN furniture_slots fs ON fs.id = pp.slot_id
JOIN furniture f ON f.id = fs.furniture_id
JOIN products p ON p.id = pp.product_id
WHERE pp.is_active = true
ORDER BY f.furniture_code, fs.slot_id;

-- 슬롯 점유 현황
SELECT
  f.furniture_code,
  COUNT(*) FILTER (WHERE fs.is_occupied = true) as occupied,
  COUNT(*) FILTER (WHERE fs.is_occupied = false) as empty,
  COUNT(*) as total
FROM furniture_slots fs
JOIN furniture f ON f.id = fs.furniture_id
GROUP BY f.furniture_code
ORDER BY f.furniture_code;

-- display_type별 배치 수
SELECT display_type, COUNT(*) as cnt
FROM product_placements
WHERE is_active = true
GROUP BY display_type
ORDER BY cnt DESC;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- End of SEED_08_FULL_SLOT_PLACEMENT.sql
-- ════════════════════════════════════════════════════════════════════════════
