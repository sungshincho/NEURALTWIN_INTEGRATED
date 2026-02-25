-- =====================================================
-- NEURALTWIN v8.1: Avatar & Product Placement Sample Data
-- =====================================================
-- Description:
--   Update existing v8.0 data with:
--   1. Staff avatar URLs and positions
--   2. Product placement (furniture/slot) information
--   3. Customer avatar type assignments
--
-- Prerequisites:
--   - Run 20251216_product_placement_and_avatars.sql migration first
--   - Run NEURALTWIN_UNIFIED_SEED_v8.sql first
-- =====================================================

-- ============================================================================
-- STEP 1: Update Staff with Avatar Information
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_storage_base TEXT;
BEGIN
  -- Get user and store IDs from existing data
  SELECT user_id, store_id INTO v_user_id, v_store_id
  FROM staff LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No staff data found. Run NEURALTWIN_UNIFIED_SEED_v8.sql first.';
  END IF;

  -- Base storage URL (placeholder - replace with actual storage URL)
  v_storage_base := 'https://storage.example.com/3d-models/' || v_user_id::TEXT || '/' || v_store_id::TEXT || '/staff/';

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE ' STEP 1: Updating Staff Avatars';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Update staff with avatar URLs and positions
  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_manager_male_01.glb',
    avatar_position = '{"x": 0, "y": 0, "z": -5}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z002' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP001';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_senior_female_01.glb',
    avatar_position = '{"x": -5, "y": 0, "z": 3}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 1.57, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP002';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_senior_male_01.glb',
    avatar_position = '{"x": -4, "y": 0, "z": 4}'::jsonb,
    avatar_rotation = '{"x": 0, "y": -1.57, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP003';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_sales_female_01.glb',
    avatar_position = '{"x": 5, "y": 0, "z": 2}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 3.14, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP004';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_sales_male_01.glb',
    avatar_position = '{"x": 5.5, "y": 0, "z": 4}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 3.14, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP005';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_sales_female_02.glb',
    avatar_position = '{"x": -5, "y": 0, "z": -5}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z005' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP006';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_cashier_male_01.glb',
    avatar_position = '{"x": 4, "y": 0, "z": 5.5}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP007';

  UPDATE staff SET
    avatar_url = v_storage_base || 'staff_cashier_female_01.glb',
    avatar_position = '{"x": 5, "y": 0, "z": 5.5}'::jsonb,
    avatar_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    avatar_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    assigned_zone_id = (SELECT id FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id LIMIT 1)
  WHERE employee_code = 'EMP008';

  RAISE NOTICE '  ✓ 8 staff members updated with avatar data';
END $$;

-- ============================================================================
-- STEP 2: Update Products with Placement Information
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_storage_base TEXT;
BEGIN
  -- Get user and store IDs from existing data
  SELECT user_id, store_id INTO v_user_id, v_store_id
  FROM products LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No product data found. Run NEURALTWIN_UNIFIED_SEED_v8.sql first.';
  END IF;

  v_storage_base := 'https://storage.example.com/3d-models/' || v_user_id::TEXT || '/' || v_store_id::TEXT || '/products/';

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE ' STEP 2: Updating Product Placements';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Outerwear (1-5) - Zone Z003
  UPDATE products SET
    model_3d_url = v_storage_base || 'outerwear/product_coat_cashmere_01.glb',
    model_3d_position = '{"x": -6.0, "y": 1.2, "z": 1.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'A1',
    movable = true
  WHERE sku = 'SKU-OUT-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'outerwear/product_jacket_tailored_01.glb',
    model_3d_position = '{"x": -6.0, "y": 1.2, "z": 1.3}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'A2',
    movable = true
  WHERE sku = 'SKU-OUT-002';

  UPDATE products SET
    model_3d_url = v_storage_base || 'outerwear/product_padding_down_01.glb',
    model_3d_position = '{"x": -6.0, "y": 1.2, "z": 2.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'A1',
    movable = true
  WHERE sku = 'SKU-OUT-003';

  UPDATE products SET
    model_3d_url = v_storage_base || 'outerwear/product_coat_trench_01.glb',
    model_3d_position = '{"x": -6.0, "y": 1.2, "z": 2.3}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'A2',
    movable = true
  WHERE sku = 'SKU-OUT-004';

  UPDATE products SET
    model_3d_url = v_storage_base || 'outerwear/product_jacket_leather_01.glb',
    model_3d_position = '{"x": -4.5, "y": 1.2, "z": 1.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'A1',
    movable = true
  WHERE sku = 'SKU-OUT-005';

  -- Tops (6-10) - Zone Z003
  UPDATE products SET
    model_3d_url = v_storage_base || 'tops/product_blouse_silk_01.glb',
    model_3d_position = '{"x": -4.5, "y": 1.0, "z": 2.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'B1',
    movable = true
  WHERE sku = 'SKU-TOP-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'tops/product_sweater_knit_01.glb',
    model_3d_position = '{"x": -5.5, "y": 1.5, "z": 3.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'C1',
    movable = true
  WHERE sku = 'SKU-TOP-002';

  UPDATE products SET
    model_3d_url = v_storage_base || 'tops/product_shirt_oxford_01.glb',
    model_3d_position = '{"x": -4.0, "y": 1.0, "z": 3.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'B1',
    movable = true
  WHERE sku = 'SKU-TOP-003';

  UPDATE products SET
    model_3d_url = v_storage_base || 'tops/product_top_linen_01.glb',
    model_3d_position = '{"x": -5.0, "y": 0.95, "z": 4.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'D1',
    movable = true
  WHERE sku = 'SKU-TOP-004';

  UPDATE products SET
    model_3d_url = v_storage_base || 'tops/product_shirt_polo_01.glb',
    model_3d_position = '{"x": -5.5, "y": 1.2, "z": 3.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'C2',
    movable = true
  WHERE sku = 'SKU-TOP-005';

  -- Bottoms (11-15) - Zone Z003
  UPDATE products SET
    model_3d_url = v_storage_base || 'bottoms/product_pants_wide_01.glb',
    model_3d_position = '{"x": -4.0, "y": 1.0, "z": 4.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'B1',
    movable = true
  WHERE sku = 'SKU-BTM-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'bottoms/product_jeans_slim_01.glb',
    model_3d_position = '{"x": -4.0, "y": 1.0, "z": 4.8}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'B2',
    movable = true
  WHERE sku = 'SKU-BTM-002';

  UPDATE products SET
    model_3d_url = v_storage_base || 'bottoms/product_pants_chino_01.glb',
    model_3d_position = '{"x": -3.5, "y": 1.0, "z": 5.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'B1',
    movable = true
  WHERE sku = 'SKU-BTM-003';

  UPDATE products SET
    model_3d_url = v_storage_base || 'bottoms/product_pants_jogger_01.glb',
    model_3d_position = '{"x": -5.0, "y": 1.5, "z": 5.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'C1',
    movable = true
  WHERE sku = 'SKU-BTM-004';

  UPDATE products SET
    model_3d_url = v_storage_base || 'bottoms/product_skirt_aline_01.glb',
    model_3d_position = '{"x": -4.5, "y": 0.95, "z": 5.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'D1',
    movable = true
  WHERE sku = 'SKU-BTM-005';

  -- Accessories (16-20) - Zone Z004
  UPDATE products SET
    model_3d_url = v_storage_base || 'accessories/product_bag_tote_01.glb',
    model_3d_position = '{"x": 5.0, "y": 1.2, "z": 1.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'E1',
    movable = true
  WHERE sku = 'SKU-ACC-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'accessories/product_necklace_silver_01.glb',
    model_3d_position = '{"x": 4.5, "y": 1.0, "z": 2.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'F1',
    movable = true
  WHERE sku = 'SKU-ACC-002';

  UPDATE products SET
    model_3d_url = v_storage_base || 'accessories/product_belt_leather_01.glb',
    model_3d_position = '{"x": 5.5, "y": 1.1, "z": 2.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'G1',
    movable = true
  WHERE sku = 'SKU-ACC-003';

  UPDATE products SET
    model_3d_url = v_storage_base || 'accessories/product_scarf_set_01.glb',
    model_3d_position = '{"x": 6.0, "y": 1.3, "z": 3.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'H1',
    movable = true
  WHERE sku = 'SKU-ACC-004';

  UPDATE products SET
    model_3d_url = v_storage_base || 'accessories/product_muffler_wool_01.glb',
    model_3d_position = '{"x": 6.0, "y": 1.3, "z": 3.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'H2',
    movable = true
  WHERE sku = 'SKU-ACC-005';

  -- Shoes (21-23) - Zone Z004
  UPDATE products SET
    model_3d_url = v_storage_base || 'shoes/product_shoes_loafer_01.glb',
    model_3d_position = '{"x": 5.5, "y": 0.8, "z": 4.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'I1',
    movable = true
  WHERE sku = 'SKU-SHO-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'shoes/product_shoes_heels_01.glb',
    model_3d_position = '{"x": 5.5, "y": 0.5, "z": 4.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'I2',
    movable = true
  WHERE sku = 'SKU-SHO-002';

  UPDATE products SET
    model_3d_url = v_storage_base || 'shoes/product_shoes_sneakers_01.glb',
    model_3d_position = '{"x": 5.5, "y": 0.8, "z": 4.5}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'I1',
    movable = true
  WHERE sku = 'SKU-SHO-003';

  -- Cosmetics (24-25) - Zone Z004
  UPDATE products SET
    model_3d_url = v_storage_base || 'cosmetics/product_skincare_set_01.glb',
    model_3d_position = '{"x": 4.0, "y": 0.9, "z": 5.0}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'J1',
    movable = true
  WHERE sku = 'SKU-COS-001';

  UPDATE products SET
    model_3d_url = v_storage_base || 'cosmetics/product_lipstick_set_01.glb',
    model_3d_position = '{"x": 4.0, "y": 0.9, "z": 5.2}'::jsonb,
    model_3d_rotation = '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale = '{"x": 1, "y": 1, "z": 1}'::jsonb,
    slot_id = 'J2',
    movable = true
  WHERE sku = 'SKU-COS-002';

  RAISE NOTICE '  ✓ 25 products updated with placement data';
END $$;

-- ============================================================================
-- STEP 3: Update Customers with Avatar Type
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE ' STEP 3: Updating Customer Avatar Types';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Update VIP customers (segment = 'vip')
  UPDATE customers SET avatar_type = 'vip'
  WHERE segment = 'vip' OR total_spent > 1000000;

  -- Update new customers (created within last 30 days or segment = 'new')
  UPDATE customers SET avatar_type = 'new'
  WHERE (created_at > NOW() - INTERVAL '30 days' OR segment = 'new')
    AND avatar_type IS NULL;

  -- Update regular customers (everyone else)
  UPDATE customers SET avatar_type = 'regular'
  WHERE avatar_type IS NULL;

  RAISE NOTICE '  ✓ Customer avatar types assigned based on segment';
END $$;

-- ============================================================================
-- STEP 4: Create Sample Furniture Slots
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
BEGIN
  SELECT user_id, store_id INTO v_user_id, v_store_id
  FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE 'Skipping furniture slots - no store found';
    RETURN;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE ' STEP 4: Creating Furniture Slot Definitions';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Insert slot definitions for clothing racks
  INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_position, max_product_width, max_product_height, max_product_depth, store_id, user_id)
  VALUES
    -- Double clothing rack slots (A1-A8)
    (gen_random_uuid(), 'rack_clothing_double', 'A1', '{"x": 0, "y": 1.2, "z": 0}'::jsonb, 0.6, 0.8, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'rack_clothing_double', 'A2', '{"x": 0.3, "y": 1.2, "z": 0}'::jsonb, 0.6, 0.8, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'rack_clothing_double', 'A3', '{"x": 0.6, "y": 1.2, "z": 0}'::jsonb, 0.6, 0.8, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'rack_clothing_double', 'A4', '{"x": 0.9, "y": 1.2, "z": 0}'::jsonb, 0.6, 0.8, 0.3, v_store_id, v_user_id),

    -- Single clothing rack slots (B1-B6)
    (gen_random_uuid(), 'rack_clothing_single', 'B1', '{"x": 0, "y": 1.0, "z": 0}'::jsonb, 0.5, 0.7, 0.25, v_store_id, v_user_id),
    (gen_random_uuid(), 'rack_clothing_single', 'B2', '{"x": 0.25, "y": 1.0, "z": 0}'::jsonb, 0.5, 0.7, 0.25, v_store_id, v_user_id),
    (gen_random_uuid(), 'rack_clothing_single', 'B3', '{"x": 0.5, "y": 1.0, "z": 0}'::jsonb, 0.5, 0.7, 0.25, v_store_id, v_user_id),

    -- Shelf display slots (C1-C12)
    (gen_random_uuid(), 'shelf_display', 'C1', '{"x": 0, "y": 1.5, "z": 0}'::jsonb, 0.4, 0.5, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'shelf_display', 'C2', '{"x": 0, "y": 1.2, "z": 0}'::jsonb, 0.4, 0.5, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'shelf_display', 'C3', '{"x": 0, "y": 0.9, "z": 0}'::jsonb, 0.4, 0.5, 0.3, v_store_id, v_user_id),

    -- Table display slots (D1-D4)
    (gen_random_uuid(), 'table_display', 'D1', '{"x": -0.25, "y": 0.95, "z": -0.2}'::jsonb, 0.4, 0.3, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'table_display', 'D2', '{"x": 0.25, "y": 0.95, "z": -0.2}'::jsonb, 0.4, 0.3, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'table_display', 'D3', '{"x": -0.25, "y": 0.95, "z": 0.2}'::jsonb, 0.4, 0.3, 0.3, v_store_id, v_user_id),
    (gen_random_uuid(), 'table_display', 'D4', '{"x": 0.25, "y": 0.95, "z": 0.2}'::jsonb, 0.4, 0.3, 0.3, v_store_id, v_user_id),

    -- Bag display slots (E1-E6)
    (gen_random_uuid(), 'display_bag', 'E1', '{"x": 0, "y": 1.2, "z": 0}'::jsonb, 0.4, 0.35, 0.2, v_store_id, v_user_id),
    (gen_random_uuid(), 'display_bag', 'E2', '{"x": 0.4, "y": 1.2, "z": 0}'::jsonb, 0.4, 0.35, 0.2, v_store_id, v_user_id),

    -- Showcase slots (F1-F9)
    (gen_random_uuid(), 'showcase_locked', 'F1', '{"x": 0, "y": 1.0, "z": 0}'::jsonb, 0.25, 0.25, 0.1, v_store_id, v_user_id),
    (gen_random_uuid(), 'showcase_locked', 'F2', '{"x": 0.25, "y": 1.0, "z": 0}'::jsonb, 0.25, 0.25, 0.1, v_store_id, v_user_id),

    -- Accessory stand slots (G1-G4)
    (gen_random_uuid(), 'stand_accessory', 'G1', '{"x": 0, "y": 1.1, "z": 0}'::jsonb, 0.15, 0.2, 0.1, v_store_id, v_user_id),
    (gen_random_uuid(), 'stand_accessory', 'G2', '{"x": 0, "y": 0.9, "z": 0}'::jsonb, 0.15, 0.2, 0.1, v_store_id, v_user_id),

    -- Scarf hanger slots (H1-H6)
    (gen_random_uuid(), 'hanger_scarf', 'H1', '{"x": 0, "y": 1.3, "z": 0}'::jsonb, 0.3, 0.3, 0.15, v_store_id, v_user_id),
    (gen_random_uuid(), 'hanger_scarf', 'H2', '{"x": 0.15, "y": 1.3, "z": 0}'::jsonb, 0.3, 0.3, 0.15, v_store_id, v_user_id),

    -- Shoe shelf slots (I1-I12)
    (gen_random_uuid(), 'shelf_shoes', 'I1', '{"x": 0, "y": 0.8, "z": 0}'::jsonb, 0.3, 0.15, 0.15, v_store_id, v_user_id),
    (gen_random_uuid(), 'shelf_shoes', 'I2', '{"x": 0, "y": 0.5, "z": 0}'::jsonb, 0.3, 0.15, 0.15, v_store_id, v_user_id),
    (gen_random_uuid(), 'shelf_shoes', 'I3', '{"x": 0, "y": 0.2, "z": 0}'::jsonb, 0.3, 0.15, 0.15, v_store_id, v_user_id),

    -- Open showcase slots (J1-J6)
    (gen_random_uuid(), 'showcase_open', 'J1', '{"x": 0, "y": 0.9, "z": 0}'::jsonb, 0.25, 0.2, 0.15, v_store_id, v_user_id),
    (gen_random_uuid(), 'showcase_open', 'J2', '{"x": 0.25, "y": 0.9, "z": 0}'::jsonb, 0.25, 0.2, 0.15, v_store_id, v_user_id)
  ON CONFLICT (furniture_id, slot_id) DO NOTHING;

  RAISE NOTICE '  ✓ Furniture slot definitions created';
END $$;

-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE ' NEURALTWIN v8.1 Avatar & Placement Data Update Complete';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE ' Summary:';
  RAISE NOTICE '   ✓ 8 staff members with avatar data';
  RAISE NOTICE '   ✓ 25 products with placement data';
  RAISE NOTICE '   ✓ Customer avatar types assigned';
  RAISE NOTICE '   ✓ Furniture slot definitions created';
  RAISE NOTICE '';
  RAISE NOTICE ' Next Steps:';
  RAISE NOTICE '   1. Upload actual GLB model files to Supabase Storage';
  RAISE NOTICE '   2. Update URLs in staff.avatar_url and products.model_3d_url';
  RAISE NOTICE '   3. Use generateSceneRecipeForStore() to render 3D scene';
  RAISE NOTICE '';
END $$;
