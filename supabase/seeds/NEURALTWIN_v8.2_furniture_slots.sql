-- =====================================================
-- NEURALTWIN v8.2: Furniture Slots Definition
-- =====================================================
-- Description:
--   Define slots for each furniture type with:
--   - Relative position within furniture
--   - Compatible display types (hanging, folded, standing, etc.)
--   - Size constraints for products
-- =====================================================

-- =====================================================
-- PART 1: Product Display Types Update
-- =====================================================
-- Update existing products with appropriate display_type

-- Outerwear, Tops - hanging on racks
UPDATE products SET display_type = 'hanging'
WHERE sku IN ('SKU-OUT-001', 'SKU-OUT-002', 'SKU-TOP-001', 'SKU-TOP-002', 'SKU-TOP-003', 'SKU-TOP-004');

-- Bottoms - can be hanging or folded
UPDATE products SET display_type = 'hanging'
WHERE sku IN ('SKU-BTM-001', 'SKU-BTM-002', 'SKU-BTM-003');

-- Shoes - standing on racks
UPDATE products SET display_type = 'standing'
WHERE sku IN ('SKU-SHO-001', 'SKU-SHO-002', 'SKU-SHO-003');

-- Accessories (bags, scarves) - can be hanging or standing
UPDATE products SET display_type = 'hanging'
WHERE sku IN ('SKU-BAG-001', 'SKU-BAG-002', 'SKU-SCA-001');

-- Accessories (belts, watches, jewelry) - standing in showcase
UPDATE products SET display_type = 'standing'
WHERE sku IN ('SKU-BLT-001', 'SKU-WAT-001', 'SKU-JWL-001', 'SKU-JWL-002');

-- Underwear, socks - folded on shelves
UPDATE products SET display_type = 'folded'
WHERE sku IN ('SKU-UND-001', 'SKU-SOC-001');

-- Hats - standing
UPDATE products SET display_type = 'standing'
WHERE sku IN ('SKU-HAT-001');

-- Glasses - standing in showcase
UPDATE products SET display_type = 'standing'
WHERE sku IN ('SKU-GLS-001');

-- =====================================================
-- PART 2: Furniture Slots Definition
-- =====================================================
-- Note: furniture_id uses placeholder UUIDs - replace with actual IDs
-- Slot positions are relative to furniture origin (center-bottom)

-- Clear existing slots (for development)
-- DELETE FROM furniture_slots WHERE user_id IS NOT NULL;

-- =====================================================
-- Z003 의류존: 의류 행거 랙 (더블) - 4개, 각 10 슬롯
-- =====================================================

-- Rack 1 (Women's outerwear)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  '11111111-1111-1111-1111-000000000001'::uuid,
  'rack_clothing_double',
  'H' || row_num,
  'hanger',
  jsonb_build_object('x', -0.6 + (row_num - 1) * 0.12, 'y', 1.6, 'z', 0),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.6, 1.2, 0.3,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 10) AS row_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position,
  compatible_display_types = EXCLUDED.compatible_display_types;

-- Rack 2 (Women's tops)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  '11111111-1111-1111-1111-000000000002'::uuid,
  'rack_clothing_double',
  'H' || row_num,
  'hanger',
  jsonb_build_object('x', -0.6 + (row_num - 1) * 0.12, 'y', 1.6, 'z', 0),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.6, 1.2, 0.3,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 10) AS row_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- Rack 3 (Men's outerwear)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  '11111111-1111-1111-1111-000000000003'::uuid,
  'rack_clothing_double',
  'H' || row_num,
  'hanger',
  jsonb_build_object('x', -0.6 + (row_num - 1) * 0.12, 'y', 1.6, 'z', 0),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.6, 1.2, 0.3,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 10) AS row_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- Rack 4 (Men's tops)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  '11111111-1111-1111-1111-000000000004'::uuid,
  'rack_clothing_double',
  'H' || row_num,
  'hanger',
  jsonb_build_object('x', -0.6 + (row_num - 1) * 0.12, 'y', 1.6, 'z', 0),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.6, 1.2, 0.3,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 10) AS row_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z003 의류존: 의류 행거 랙 (싱글) - 4개, 각 8 슬롯 (팬츠/스커트)
-- =====================================================

-- Rack 5-8 (Bottoms - pants, skirts)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-00000000000' || (4 + rack_num))::uuid,
  'rack_clothing_single',
  'H' || slot_num,
  'hanger',
  jsonb_build_object('x', -0.48 + (slot_num - 1) * 0.12, 'y', 1.4, 'z', 0),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.5, 1.0, 0.2,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 4) AS rack_num, generate_series(1, 8) AS slot_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z003 의류존: 선반형 진열대 - 2개, 각 4단 × 3열 = 12 슬롯
-- =====================================================

-- Shelf 1-2 (Folded clothes: underwear, socks, folded tops)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000001' || shelf_num)::uuid,
  'shelf_display',
  'S' || shelf_level || '-' || col_num,
  'shelf',
  jsonb_build_object(
    'x', -0.35 + (col_num - 1) * 0.35,
    'y', 0.3 + (shelf_level - 1) * 0.45,
    'z', 0
  ),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['folded', 'boxed', 'standing'],
  0.35, 0.4, 0.35,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 2) AS shelf_num, generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z003 의류존: 테이블 디스플레이 - 2개, 각 2×3 = 6 슬롯
-- =====================================================

-- Table 1-2 (New arrivals, seasonal items - folded display)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000002' || table_num)::uuid,
  'table_display',
  'T' || row_num || '-' || col_num,
  'table',
  jsonb_build_object(
    'x', -0.35 + (col_num - 1) * 0.35,
    'y', 0.9,
    'z', -0.25 + (row_num - 1) * 0.25
  ),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['folded', 'boxed'],
  0.35, 0.3, 0.25,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 2) AS table_num, generate_series(1, 2) AS row_num, generate_series(1, 3) AS col_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z004 액세서리존: 쇼케이스 (잠금형) - 2개, 각 3단 × 4열 = 12 슬롯
-- =====================================================

-- Showcase 1-2 (Watches, jewelry)
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000003' || case_num)::uuid,
  'showcase_locked',
  'C' || shelf_level || '-' || col_num,
  'shelf',
  jsonb_build_object(
    'x', -0.375 + (col_num - 1) * 0.25,
    'y', 0.3 + (shelf_level - 1) * 0.3,
    'z', 0
  ),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['standing', 'boxed'],
  0.2, 0.25, 0.2,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 2) AS case_num, generate_series(1, 3) AS shelf_level, generate_series(1, 4) AS col_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z004 액세서리존: 신발 진열대 - 3개, 각 4단 × 3열 = 12 슬롯
-- =====================================================

-- Shoe rack 1-3
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000004' || rack_num)::uuid,
  'shelf_shoes',
  'R' || shelf_level || '-' || col_num,
  'rack',
  jsonb_build_object(
    'x', -0.35 + (col_num - 1) * 0.35,
    'y', 0.15 + (shelf_level - 1) * 0.4,
    'z', 0
  ),
  '{"x":0,"y":10,"z":0}'::jsonb,  -- Slight angle for visibility
  ARRAY['standing'],
  0.35, 0.35, 0.35,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 3) AS rack_num, generate_series(1, 4) AS shelf_level, generate_series(1, 3) AS col_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z004 액세서리존: 가방 진열대 - 2개, 각 3단 × 2열 = 6 슬롯
-- =====================================================

-- Bag display 1-2
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000005' || disp_num)::uuid,
  'display_bag',
  'B' || shelf_level || '-' || col_num,
  'shelf',
  jsonb_build_object(
    'x', -0.35 + (col_num - 1) * 0.7,
    'y', 0.2 + (shelf_level - 1) * 0.45,
    'z', 0
  ),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['standing', 'hanging'],
  0.5, 0.4, 0.3,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 2) AS disp_num, generate_series(1, 3) AS shelf_level, generate_series(1, 2) AS col_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- Z004 액세서리존: 스카프 행거 - 2개, 각 8 훅
-- =====================================================

-- Scarf hanger 1-2
INSERT INTO furniture_slots (furniture_id, furniture_type, slot_id, slot_type, slot_position, slot_rotation, compatible_display_types, max_product_width, max_product_height, max_product_depth, store_id)
SELECT
  ('11111111-1111-1111-1111-0000000006' || hanger_num)::uuid,
  'hanger_scarf',
  'SC' || hook_num,
  'hook',
  jsonb_build_object(
    'x', -0.21 + (hook_num - 1) * 0.06,
    'y', 1.4,
    'z', 0
  ),
  '{"x":0,"y":0,"z":0}'::jsonb,
  ARRAY['hanging'],
  0.3, 1.0, 0.1,
  (SELECT id FROM stores LIMIT 1)
FROM generate_series(1, 2) AS hanger_num, generate_series(1, 8) AS hook_num
ON CONFLICT (furniture_id, slot_id) DO UPDATE SET
  slot_position = EXCLUDED.slot_position;

-- =====================================================
-- SUMMARY
-- =====================================================
/*
Total Slots Created:
- Clothing Racks (Double): 4 × 10 = 40 slots (hanging)
- Clothing Racks (Single): 4 × 8 = 32 slots (hanging)
- Shelf Displays: 2 × 12 = 24 slots (folded, boxed, standing)
- Table Displays: 2 × 6 = 12 slots (folded, boxed)
- Showcases: 2 × 12 = 24 slots (standing, boxed)
- Shoe Racks: 3 × 12 = 36 slots (standing)
- Bag Displays: 2 × 6 = 12 slots (standing, hanging)
- Scarf Hangers: 2 × 8 = 16 slots (hanging)

TOTAL: 196 slots

Compatible Display Type Summary:
- hanging: 88 slots (racks, hooks)
- folded: 36 slots (shelves, tables)
- standing: 72 slots (showcases, shoe racks, bag displays)
- boxed: 60 slots (shelves, tables, showcases)
*/
