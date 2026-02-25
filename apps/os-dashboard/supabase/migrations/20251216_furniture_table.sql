-- =====================================================
-- NEURALTWIN: Furniture & Slots Migration - FINAL VERSION
-- =====================================================
-- Version: 1.1.0 (with Mannequin Support)
-- Date: 2024-12-16
-- Description:
--   furniture 테이블이 이미 존재하는 환경과 새로 생성하는 환경
--   모두에서 안전하게 동작하는 통합 마이그레이션 스크립트
--
-- 포함 내용:
--   1. furniture 테이블 생성 또는 컬럼 추가
--   2. furniture_slots 테이블 생성 (mannequin 슬롯 타입 포함)
--   3. RLS 정책 설정
--   4. Helper 함수
--   5. 트리거 설정
--
-- 실행 순서:
--   1. 이 스크립트 실행 (스키마 생성)
--   2. v8.2 시딩 스크립트 실행 (데이터 삽입)
-- =====================================================


-- =====================================================
-- PART 1: furniture 테이블 생성 또는 컬럼 추가
-- =====================================================

DO $$
BEGIN
  -- 테이블이 존재하지 않으면 전체 생성
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'furniture') THEN
    CREATE TABLE furniture (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      zone_id UUID REFERENCES zones_dim(id) ON DELETE SET NULL,

      -- Furniture identification
      furniture_code TEXT NOT NULL,  -- e.g., 'RACK-001', 'MANNEQUIN-001'
      furniture_name TEXT NOT NULL,  -- e.g., '의류 행거 (더블)', '전신 마네킹'
      furniture_type TEXT NOT NULL,  -- e.g., 'clothing_rack', 'mannequin_full'

      -- Physical properties
      width NUMERIC(6,3),
      height NUMERIC(6,3),
      depth NUMERIC(6,3),

      -- 3D Model
      model_url TEXT,
      thumbnail_url TEXT,

      -- 3D Transform (world coordinates)
      position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
      rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
      scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb,

      -- Behavior
      movable BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,

      -- Metadata
      properties JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      CONSTRAINT furniture_code_unique UNIQUE (store_id, furniture_code)
    );

    RAISE NOTICE '✓ furniture 테이블 생성 완료';
  ELSE
    -- 테이블이 존재하면 누락된 컬럼만 추가
    RAISE NOTICE '  furniture 테이블이 이미 존재합니다. 누락된 컬럼을 추가합니다...';

    -- zone_id 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'zone_id') THEN
      ALTER TABLE furniture ADD COLUMN zone_id UUID;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zones_dim') THEN
        BEGIN
          ALTER TABLE furniture ADD CONSTRAINT furniture_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES zones_dim(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END;
      END IF;
      RAISE NOTICE '    + zone_id 컬럼 추가됨';
    END IF;

    -- furniture_code 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'furniture_code') THEN
      ALTER TABLE furniture ADD COLUMN furniture_code TEXT;
      UPDATE furniture SET furniture_code = 'FURN-' || UPPER(SUBSTRING(id::TEXT, 1, 8)) WHERE furniture_code IS NULL;
      RAISE NOTICE '    + furniture_code 컬럼 추가됨';
    END IF;

    -- furniture_name 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'furniture_name') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'name') THEN
        ALTER TABLE furniture ADD COLUMN furniture_name TEXT;
        UPDATE furniture SET furniture_name = name WHERE furniture_name IS NULL;
        RAISE NOTICE '    + furniture_name 컬럼 추가됨 (name에서 복사)';
      ELSE
        ALTER TABLE furniture ADD COLUMN furniture_name TEXT;
        RAISE NOTICE '    + furniture_name 컬럼 추가됨';
      END IF;
    END IF;

    -- thumbnail_url 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'thumbnail_url') THEN
      ALTER TABLE furniture ADD COLUMN thumbnail_url TEXT;
      RAISE NOTICE '    + thumbnail_url 컬럼 추가됨';
    END IF;

    -- movable 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'movable') THEN
      ALTER TABLE furniture ADD COLUMN movable BOOLEAN DEFAULT false;
      RAISE NOTICE '    + movable 컬럼 추가됨';
    END IF;

    -- position JSONB 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'position') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'position_x') THEN
        ALTER TABLE furniture ADD COLUMN position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
        RAISE NOTICE '    + position (JSONB) 컬럼 추가됨';
      ELSE
        RAISE NOTICE '    - position 스킵 (position_x/y/z 개별 컬럼 존재)';
      END IF;
    END IF;

    -- rotation JSONB 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'rotation') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'rotation_x') THEN
        ALTER TABLE furniture ADD COLUMN rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
        RAISE NOTICE '    + rotation (JSONB) 컬럼 추가됨';
      ELSE
        RAISE NOTICE '    - rotation 스킵 (rotation_x/y/z 개별 컬럼 존재)';
      END IF;
    END IF;

    -- scale JSONB 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'scale') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'furniture' AND column_name = 'scale_x') THEN
        ALTER TABLE furniture ADD COLUMN scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
        RAISE NOTICE '    + scale (JSONB) 컬럼 추가됨';
      ELSE
        RAISE NOTICE '    - scale 스킵 (scale_x/y/z 개별 컬럼 존재)';
      END IF;
    END IF;

    RAISE NOTICE '✓ furniture 테이블 컬럼 업데이트 완료';
  END IF;
END $$;


-- =====================================================
-- PART 2: furniture 테이블 인덱스
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_furniture_store_id ON furniture(store_id);
CREATE INDEX IF NOT EXISTS idx_furniture_zone_id ON furniture(zone_id);
CREATE INDEX IF NOT EXISTS idx_furniture_type ON furniture(furniture_type);


-- =====================================================
-- PART 3: furniture 테이블 RLS
-- =====================================================

ALTER TABLE furniture ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view furniture in their stores" ON furniture;
DROP POLICY IF EXISTS "Users can insert furniture in their stores" ON furniture;
DROP POLICY IF EXISTS "Users can update furniture in their stores" ON furniture;
DROP POLICY IF EXISTS "Users can delete furniture in their stores" ON furniture;

CREATE POLICY "Users can view furniture in their stores" ON furniture
  FOR SELECT USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert furniture in their stores" ON furniture
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update furniture in their stores" ON furniture
  FOR UPDATE USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete furniture in their stores" ON furniture
  FOR DELETE USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );


-- =====================================================
-- PART 4: furniture_slots 테이블 생성
-- =====================================================

DROP TABLE IF EXISTS furniture_slots CASCADE;

CREATE TABLE furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Slot identification
  slot_id TEXT NOT NULL,  -- e.g., 'H1', 'S1-1', 'M-TOP', 'M-BTM'
  furniture_type TEXT NOT NULL,
  slot_type TEXT DEFAULT 'shelf' CHECK (slot_type IN ('hanger', 'shelf', 'table', 'rack', 'hook', 'drawer', 'mannequin')),

  -- Slot position (relative to furniture origin)
  slot_position JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,

  -- Compatibility (6 display types)
  compatible_display_types TEXT[] DEFAULT ARRAY['standing'],

  -- Size constraints (meters)
  max_product_width NUMERIC(5,3),
  max_product_height NUMERIC(5,3),
  max_product_depth NUMERIC(5,3),

  -- Occupancy
  is_occupied BOOLEAN DEFAULT false,
  occupied_by_product_id UUID,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT furniture_slots_unique UNIQUE (furniture_id, slot_id)
);


-- =====================================================
-- PART 5: furniture_slots 인덱스
-- =====================================================

CREATE INDEX idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX idx_furniture_slots_store_id ON furniture_slots(store_id);
CREATE INDEX idx_furniture_slots_slot_type ON furniture_slots(slot_type);
CREATE INDEX idx_furniture_slots_is_occupied ON furniture_slots(is_occupied);


-- =====================================================
-- PART 6: furniture_slots RLS
-- =====================================================

ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slots in their stores" ON furniture_slots
  FOR SELECT USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage slots in their stores" ON furniture_slots
  FOR ALL USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );


-- =====================================================
-- PART 7: Helper Functions
-- =====================================================

CREATE OR REPLACE FUNCTION check_slot_product_compatibility(
  p_slot_id UUID,
  p_product_display_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_compatible_types TEXT[];
BEGIN
  SELECT compatible_display_types INTO v_compatible_types
  FROM furniture_slots
  WHERE id = p_slot_id;

  IF v_compatible_types IS NULL THEN
    RETURN false;
  END IF;

  RETURN p_product_display_type = ANY(v_compatible_types);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_slots_for_display_type(
  p_store_id UUID,
  p_display_type TEXT
) RETURNS TABLE (
  slot_id UUID,
  furniture_id UUID,
  slot_code TEXT,
  slot_type TEXT,
  slot_position JSONB,
  furniture_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.id,
    fs.furniture_id,
    fs.slot_id,
    fs.slot_type,
    fs.slot_position,
    fs.furniture_type
  FROM furniture_slots fs
  WHERE fs.store_id = p_store_id
    AND fs.is_occupied = false
    AND p_display_type = ANY(fs.compatible_display_types);
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- PART 8: Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_furniture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS furniture_updated_at ON furniture;
CREATE TRIGGER furniture_updated_at
  BEFORE UPDATE ON furniture
  FOR EACH ROW
  EXECUTE FUNCTION update_furniture_updated_at();

CREATE OR REPLACE FUNCTION update_furniture_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS furniture_slots_updated_at ON furniture_slots;
CREATE TRIGGER furniture_slots_updated_at
  BEFORE UPDATE ON furniture_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_furniture_slots_updated_at();


-- =====================================================
-- PART 9: Comments - Furniture Types
-- =====================================================

COMMENT ON TABLE furniture IS 'Store furniture assets for 3D digital twin visualization';
COMMENT ON COLUMN furniture.furniture_type IS
'Furniture type categories:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
행거류 (Racks) - slot_type: hanger
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- clothing_rack: 의류 행거 (hanging)
- clothing_rack_double: 의류 행거 더블 (hanging x2)
- clothing_rack_single: 의류 행거 싱글 (hanging)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
마네킹류 (Mannequins) - slot_type: mannequin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- mannequin_full: 전신 마네킹 (상의+하의+신발+액세서리)
- mannequin_half: 상반신 마네킹 (상의+액세서리)
- mannequin_head: 두상 마네킹 (모자+안경+귀걸이)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
선반/테이블류 (Shelves/Tables) - slot_type: shelf, table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- shelf_display: 선반 진열대 (folded, standing, boxed)
- table_display: 테이블 진열대 (folded, standing, boxed, stacked)
- glass_showcase: 유리 쇼케이스 (standing, boxed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
랙류 (Racks) - slot_type: rack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- shoe_rack: 신발 진열대 (standing)
- accessory_stand: 액세서리 스탠드 (hanging, standing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
특수 (Special)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- checkout_counter: 계산대
- fitting_room: 피팅룸';


-- =====================================================
-- PART 10: Comments - Slot Types
-- =====================================================

COMMENT ON TABLE furniture_slots IS 'Furniture slot definitions for product placement in 3D space';
COMMENT ON COLUMN furniture_slots.slot_type IS
'Slot type categories:
- hanger: 행거 슬롯 (의류 걸이) - compatible: hanging
- shelf: 선반 슬롯 (평면 진열) - compatible: folded, standing, boxed
- table: 테이블 슬롯 (테이블 위) - compatible: folded, standing, boxed, stacked
- rack: 랙 슬롯 (신발 등) - compatible: standing
- hook: 훅 슬롯 (액세서리) - compatible: hanging
- drawer: 서랍 슬롯 (접힌 의류) - compatible: folded
- mannequin: 마네킹 슬롯 (착장) - compatible: standing';


-- =====================================================
-- PART 11: Mannequin Slot Reference (Comment Block)
-- =====================================================

/*
═══════════════════════════════════════════════════════════════════════════════
MANNEQUIN SLOT REFERENCE
═══════════════════════════════════════════════════════════════════════════════

Mannequin Types & Slot IDs:
┌──────────────────┬─────────────────────────────────┬────────────────────────┐
│ Mannequin Type   │ Slot IDs                        │ Description            │
├──────────────────┼─────────────────────────────────┼────────────────────────┤
│ mannequin_full   │ M-TOP, M-BTM, M-SHOE, M-ACC    │ 상의, 하의, 신발, 액세서리│
│ mannequin_half   │ M-TOP, M-ACC                    │ 상의, 액세서리           │
│ mannequin_head   │ M-HAT, M-GLASS, M-EARRING      │ 모자, 안경, 귀걸이       │
└──────────────────┴─────────────────────────────────┴────────────────────────┘

Mannequin Slot Positions (relative to mannequin origin):
┌────────────┬─────────────────────────────┬──────────────────────┐
│ Slot ID    │ Position (approx)           │ Description          │
├────────────┼─────────────────────────────┼──────────────────────┤
│ M-TOP      │ {"x":0, "y":1.3, "z":0}    │ 상의 위치 (가슴 높이)  │
│ M-BTM      │ {"x":0, "y":0.8, "z":0}    │ 하의 위치 (허리 높이)  │
│ M-SHOE     │ {"x":0, "y":0.05, "z":0}   │ 신발 위치 (발 높이)    │
│ M-ACC      │ {"x":0, "y":1.2, "z":0.1}  │ 액세서리 위치 (목/손목) │
│ M-HAT      │ {"x":0, "y":0.25, "z":0}   │ 모자 위치 (머리 위)    │
│ M-GLASS    │ {"x":0, "y":0.15, "z":0.08}│ 안경 위치 (눈 높이)    │
│ M-EARRING  │ {"x":0.08, "y":0.12, "z":0}│ 귀걸이 위치 (귀 높이)  │
└────────────┴─────────────────────────────┴──────────────────────┘

Compatible Product Categories per Slot:
┌────────────┬────────────────────────────────────────────────────┐
│ Slot ID    │ Compatible Categories                              │
├────────────┼────────────────────────────────────────────────────┤
│ M-TOP      │ tops, jackets, coats, shirts, blouses             │
│ M-BTM      │ pants, skirts, shorts                              │
│ M-SHOE     │ shoes, sneakers, boots, heels                     │
│ M-ACC      │ bags, scarves, belts, watches, bracelets          │
│ M-HAT      │ hats, caps, beanies                                │
│ M-GLASS    │ sunglasses, glasses                                │
│ M-EARRING  │ earrings, ear_cuffs                                │
└────────────┴────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
*/


-- =====================================================
-- PART 12: Summary
-- =====================================================

DO $$
DECLARE
  v_furniture_cols INT;
  v_slots_cols INT;
BEGIN
  SELECT COUNT(*) INTO v_furniture_cols FROM information_schema.columns WHERE table_name = 'furniture';
  SELECT COUNT(*) INTO v_slots_cols FROM information_schema.columns WHERE table_name = 'furniture_slots';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN Furniture Migration v1.1 (with Mannequin) - 완료';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ furniture 테이블: % 컬럼', v_furniture_cols;
  RAISE NOTICE '✓ furniture_slots 테이블: % 컬럼 (mannequin slot_type 포함)', v_slots_cols;
  RAISE NOTICE '✓ RLS 정책: 적용됨';
  RAISE NOTICE '✓ Helper 함수: 2개 생성됨';
  RAISE NOTICE '✓ 트리거: 2개 생성됨';
  RAISE NOTICE '';
  RAISE NOTICE '지원 마네킹 타입: mannequin_full, mannequin_half, mannequin_head';
  RAISE NOTICE '다음 단계: v8.2 시딩 스크립트 실행하여 데이터 삽입';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
