-- =====================================================
-- NEURALTWIN v8.2: Display Type & Slot Compatibility
-- =====================================================
-- Description:
--   1. Add display_type to products (hanging, folded, standing, located, boxed, stacked)
--   2. Add compatible_display_types to products (what display types this product supports)
--   3. Add compatible_display_types to furniture_slots
--   4. Add slot compatibility validation
-- =====================================================

-- =====================================================
-- PART 1: Product Display Type
-- =====================================================

-- Display type enum-like check (6 types)
-- hanging  : 행거에 걸린 상태
-- standing : 마네킨 착용 상태
-- folded   : 접힌 상태
-- located  : 선반/테이블에 올려진 상태
-- boxed    : 박스 포장 상태
-- stacked  : 쌓인 상태
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_type TEXT
  DEFAULT 'hanging'
  CHECK (display_type IN ('hanging', 'standing', 'folded', 'located', 'boxed', 'stacked'));

-- Compatible display types for the product (what display methods are possible)
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_display_types TEXT[]
  DEFAULT ARRAY['hanging'];

COMMENT ON COLUMN products.display_type IS 'Current display state: hanging(행거), standing(마네킨), folded(접힘), located(올려짐), boxed(박스), stacked(적층)';
COMMENT ON COLUMN products.compatible_display_types IS 'Array of possible display types for this product based on category';

-- =====================================================
-- PART 2: Slot Compatibility Extension
-- =====================================================

-- Add compatible display types to furniture_slots
ALTER TABLE furniture_slots ADD COLUMN IF NOT EXISTS compatible_display_types TEXT[]
  DEFAULT ARRAY['located'];

-- Add slot type for better categorization (7 types including mannequin)
ALTER TABLE furniture_slots ADD COLUMN IF NOT EXISTS slot_type TEXT
  DEFAULT 'shelf'
  CHECK (slot_type IN ('hanger', 'shelf', 'table', 'rack', 'hook', 'drawer', 'mannequin'));

COMMENT ON COLUMN furniture_slots.compatible_display_types IS 'Array of compatible display types for this slot';
COMMENT ON COLUMN furniture_slots.slot_type IS 'Physical slot type: hanger, shelf, table, rack, hook, drawer, mannequin';

-- =====================================================
-- PART 3: Category → Display Type Compatibility Reference
-- =====================================================

/*
Product Category → Compatible Display Types:

| Category (카테고리)   | Compatible Display Types                    |
|----------------------|---------------------------------------------|
| 아우터 (Outerwear)   | hanging, standing, folded                   |
| 상의 (Tops)          | hanging, standing, folded                   |
| 하의 (Bottoms)       | hanging, standing, folded                   |
| 신발 (Shoes)         | standing, located                           |
| 가방 (Bags)          | hanging, standing, located                  |
| 스카프 (Scarves)     | hanging, standing, folded, stacked          |
| 벨트 (Belts)         | located, standing                           |
| 시계/쥬얼리 (Watch/Jewelry) | standing, located                     |
| 모자/안경 (Hat/Glasses)     | standing, located                     |
| 속옷/양말 (Underwear/Socks) | boxed, located, standing, stacked     |
| 선물세트 (Gift Sets) | boxed                                       |
| 티셔츠팩 (T-shirt Pack)| stacked                                   |
*/

-- =====================================================
-- PART 4: Slot Type → Compatible Display Types Reference
-- =====================================================

/*
Slot Type → Compatible Display Types:

| Slot Type   | Compatible Display Types       | Description              |
|-------------|--------------------------------|--------------------------|
| hanger      | hanging                        | 행거 - 걸이형 상품        |
| mannequin   | standing                       | 마네킨 - 착용 상품        |
| shelf       | folded, located, boxed         | 선반 - 접힘/올려짐/박스   |
| table       | folded, located, boxed, stacked| 테이블 - 다양한 진열      |
| rack        | located, standing              | 랙 - 신발/액세서리 진열   |
| hook        | hanging                        | 훅 - 걸이형 상품          |
| drawer      | folded, boxed                  | 서랍 - 접힘/박스          |
*/

-- =====================================================
-- PART 5: Furniture Type → Default Slots Reference
-- =====================================================

/*
Furniture Type → Default Slot Configuration:

| Furniture Type        | Slot Type  | Compatible Display Types       |
|-----------------------|------------|--------------------------------|
| clothing_rack         | hanger     | hanging                        |
| clothing_rack_double  | hanger     | hanging                        |
| mannequin_full        | mannequin  | standing                       |
| mannequin_half        | mannequin  | standing                       |
| mannequin_head        | mannequin  | standing                       |
| shelf_display         | shelf      | folded, located, boxed         |
| table_display         | table      | folded, located, boxed, stacked|
| shoe_rack             | rack       | located, standing              |
| glass_showcase        | shelf      | located, boxed                 |
| accessory_stand       | hook       | hanging                        |
| checkout_counter      | table      | boxed                          |
*/

-- =====================================================
-- PART 6: Validation Function
-- =====================================================

CREATE OR REPLACE FUNCTION check_slot_display_compatibility(
  p_slot_id UUID,
  p_product_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_slot_display_types TEXT[];
  v_product_display_type TEXT;
  v_product_compatible_types TEXT[];
BEGIN
  -- Get slot compatible types
  SELECT compatible_display_types INTO v_slot_display_types
  FROM furniture_slots WHERE id = p_slot_id;

  -- Get product display type and compatible types
  SELECT display_type, compatible_display_types
  INTO v_product_display_type, v_product_compatible_types
  FROM products WHERE id = p_product_id;

  -- Check if product's current display type is compatible with slot
  IF v_product_display_type = ANY(v_slot_display_types) THEN
    RETURN true;
  END IF;

  -- Check if any of product's compatible types match slot
  IF v_product_compatible_types IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM unnest(v_product_compatible_types) pct
      WHERE pct = ANY(v_slot_display_types)
    );
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_slot_display_compatibility IS 'Check if product display type is compatible with slot';

-- =====================================================
-- PART 7: Get Compatible Slots Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_compatible_slots_for_product(
  p_store_id UUID,
  p_product_id UUID
) RETURNS TABLE (
  slot_uuid UUID,
  furniture_id UUID,
  slot_code TEXT,
  slot_type TEXT,
  slot_position JSONB,
  furniture_type TEXT,
  compatible_display_types TEXT[]
) AS $$
DECLARE
  v_product_compatible_types TEXT[];
BEGIN
  -- Get product's compatible display types
  SELECT p.compatible_display_types INTO v_product_compatible_types
  FROM products p WHERE p.id = p_product_id;

  RETURN QUERY
  SELECT
    fs.id,
    fs.furniture_id,
    fs.slot_id,
    fs.slot_type,
    fs.slot_position,
    fs.furniture_type,
    fs.compatible_display_types
  FROM furniture_slots fs
  WHERE fs.store_id = p_store_id
    AND fs.is_occupied = false
    AND EXISTS (
      SELECT 1 FROM unnest(v_product_compatible_types) pct
      WHERE pct = ANY(fs.compatible_display_types)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_compatible_slots_for_product IS 'Get all compatible empty slots for a product based on its display types';
