-- ============================================================================
-- NEURALTWIN v8.6 SEED_00: 신규 테이블 생성
-- ============================================================================
-- 실행 순서: 가장 먼저 실행
-- 목적: 스키마에 없는 신규 테이블 생성
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_00: 신규 테이블 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 0.1: product_models 테이블 생성
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '  [STEP 0.1] product_models 테이블 생성...';
END $$;

DROP TABLE IF EXISTS product_models CASCADE;

CREATE TABLE product_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  display_type TEXT NOT NULL CHECK (display_type IN ('hanging', 'standing', 'folded', 'stacked', 'located', 'boxed')),
  model_3d_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_product_models_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT uq_product_models_product_display 
    UNIQUE(product_id, display_type)
);

-- 인덱스
CREATE INDEX idx_product_models_product_id ON product_models(product_id);
CREATE INDEX idx_product_models_display_type ON product_models(display_type);
CREATE INDEX idx_product_models_is_default ON product_models(is_default) WHERE is_default = true;

-- 코멘트
COMMENT ON TABLE product_models IS '상품별 display_type에 따른 3D 모델 URL 매핑';
COMMENT ON COLUMN product_models.display_type IS '진열 타입: hanging, standing, folded, stacked, located, boxed';
COMMENT ON COLUMN product_models.is_default IS '기본 모델 여부 (상품당 하나만 true)';

DO $$
BEGIN
  RAISE NOTICE '    ✓ product_models 테이블 생성 완료';
END $$;

-- ============================================================================
-- STEP 0.2: furniture_slots 테이블 생성
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '  [STEP 0.2] furniture_slots 테이블 생성...';
END $$;

DROP TABLE IF EXISTS furniture_slots CASCADE;

CREATE TABLE furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  org_id UUID,
  
  -- 슬롯 식별
  slot_id TEXT NOT NULL,
  furniture_type TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN (
    'hanger', 'shelf', 'hook', 'stand', 'display', 'bin', 'drawer',
    'table', 'mannequin', 'showcase', 'rack',
    'mannequin_top', 'mannequin_bottom', 'mannequin_shoes'  -- 마네킹 세분화 타입
  )),

  -- 슬롯 위치/회전 (가구 로컬 좌표)
  slot_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,

  -- 🆕 슬롯 추가 속성 (allowed_categories 등)
  properties JSONB DEFAULT '{}'::jsonb,
  
  -- 호환 display_type 및 크기 제한
  compatible_display_types TEXT[] DEFAULT '{}',
  max_product_width NUMERIC,
  max_product_height NUMERIC,
  max_product_depth NUMERIC,
  
  -- 상태
  is_occupied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_furniture_slots_furniture 
    FOREIGN KEY (furniture_id) REFERENCES furniture(id) ON DELETE CASCADE,
  CONSTRAINT fk_furniture_slots_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT uq_furniture_slots_furniture_slot 
    UNIQUE(furniture_id, slot_id)
);

-- 인덱스
CREATE INDEX idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX idx_furniture_slots_store_id ON furniture_slots(store_id);
CREATE INDEX idx_furniture_slots_slot_type ON furniture_slots(slot_type);
CREATE INDEX idx_furniture_slots_is_occupied ON furniture_slots(is_occupied);
CREATE INDEX idx_furniture_slots_compatible_types ON furniture_slots USING GIN(compatible_display_types);

-- 코멘트
COMMENT ON TABLE furniture_slots IS '가구별 상품 배치 슬롯 정의';
COMMENT ON COLUMN furniture_slots.slot_position IS '가구 로컬 좌표 기준 슬롯 위치 {x,y,z}';
COMMENT ON COLUMN furniture_slots.compatible_display_types IS '이 슬롯에 배치 가능한 display_type 배열';
COMMENT ON COLUMN furniture_slots.properties IS '슬롯 추가 속성 (allowed_categories 등)';

DO $$
BEGIN
  RAISE NOTICE '    ✓ furniture_slots 테이블 생성 완료';
END $$;

-- ============================================================================
-- STEP 0.3: product_placements 테이블 생성
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '  [STEP 0.3] product_placements 테이블 생성...';
END $$;

DROP TABLE IF EXISTS product_placements CASCADE;

CREATE TABLE product_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL,
  product_id UUID NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  org_id UUID,
  
  -- 배치 정보
  display_type TEXT NOT NULL CHECK (display_type IN ('hanging', 'standing', 'folded', 'stacked', 'located', 'boxed')),
  
  -- 슬롯 내 오프셋 (미세 조정용)
  position_offset JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  rotation_offset JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb,
  
  -- 수량 및 상태
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  is_active BOOLEAN DEFAULT true,
  
  -- 시간 정보
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_product_placements_slot 
    FOREIGN KEY (slot_id) REFERENCES furniture_slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_placements_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_placements_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT uq_product_placements_slot_product 
    UNIQUE(slot_id, product_id)
);

-- 인덱스
CREATE INDEX idx_product_placements_slot_id ON product_placements(slot_id);
CREATE INDEX idx_product_placements_product_id ON product_placements(product_id);
CREATE INDEX idx_product_placements_store_id ON product_placements(store_id);
CREATE INDEX idx_product_placements_display_type ON product_placements(display_type);
CREATE INDEX idx_product_placements_is_active ON product_placements(is_active) WHERE is_active = true;

-- 코멘트
COMMENT ON TABLE product_placements IS '3D 스튜디오 상품 배치 정보';
COMMENT ON COLUMN product_placements.position_offset IS '슬롯 내 미세 위치 조정 {x,y,z}';
COMMENT ON COLUMN product_placements.display_type IS '배치된 상품의 진열 타입';

DO $$
BEGIN
  RAISE NOTICE '    ✓ product_placements 테이블 생성 완료';
END $$;

-- ============================================================================
-- STEP 0.4: zone_transitions 테이블 생성
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '  [STEP 0.4] zone_transitions 테이블 생성...';
END $$;

DROP TABLE IF EXISTS zone_transitions CASCADE;

CREATE TABLE zone_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  org_id UUID,
  
  -- 전이 정보
  from_zone_id UUID NOT NULL,
  to_zone_id UUID NOT NULL,
  transition_date DATE NOT NULL,
  
  -- 메트릭
  transition_count INTEGER DEFAULT 0 CHECK (transition_count >= 0),
  avg_duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_zone_transitions_store 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_zone_transitions_from_zone 
    FOREIGN KEY (from_zone_id) REFERENCES zones_dim(id) ON DELETE CASCADE,
  CONSTRAINT fk_zone_transitions_to_zone 
    FOREIGN KEY (to_zone_id) REFERENCES zones_dim(id) ON DELETE CASCADE,
  CONSTRAINT uq_zone_transitions_daily 
    UNIQUE(store_id, from_zone_id, to_zone_id, transition_date),
  CONSTRAINT chk_zone_transitions_different 
    CHECK (from_zone_id != to_zone_id)
);

-- 인덱스
CREATE INDEX idx_zone_transitions_store_id ON zone_transitions(store_id);
CREATE INDEX idx_zone_transitions_date ON zone_transitions(transition_date);
CREATE INDEX idx_zone_transitions_from_zone ON zone_transitions(from_zone_id);
CREATE INDEX idx_zone_transitions_to_zone ON zone_transitions(to_zone_id);

-- 코멘트
COMMENT ON TABLE zone_transitions IS '존 간 고객 이동 집계 데이터';
COMMENT ON COLUMN zone_transitions.transition_count IS '해당 날짜의 전이 횟수';
COMMENT ON COLUMN zone_transitions.avg_duration_seconds IS '평균 체류 후 이동 시간(초)';

DO $$
BEGIN
  RAISE NOTICE '    ✓ zone_transitions 테이블 생성 완료';
END $$;

-- ============================================================================
-- STEP 0.5: RLS 정책 설정
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '  [STEP 0.5] RLS 정책 설정...';
END $$;

-- product_models RLS
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_models_select_policy" ON product_models;
CREATE POLICY "product_models_select_policy" ON product_models
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM products WHERE store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid() 
        OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "product_models_all_policy" ON product_models;
CREATE POLICY "product_models_all_policy" ON product_models
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      )
    )
  );

-- furniture_slots RLS
ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "furniture_slots_select_policy" ON furniture_slots;
CREATE POLICY "furniture_slots_select_policy" ON furniture_slots
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid() 
      OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "furniture_slots_all_policy" ON furniture_slots;
CREATE POLICY "furniture_slots_all_policy" ON furniture_slots
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- product_placements RLS
ALTER TABLE product_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_placements_select_policy" ON product_placements;
CREATE POLICY "product_placements_select_policy" ON product_placements
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid() 
      OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "product_placements_all_policy" ON product_placements;
CREATE POLICY "product_placements_all_policy" ON product_placements
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- zone_transitions RLS
ALTER TABLE zone_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zone_transitions_select_policy" ON zone_transitions;
CREATE POLICY "zone_transitions_select_policy" ON zone_transitions
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid() 
      OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "zone_transitions_all_policy" ON zone_transitions;
CREATE POLICY "zone_transitions_all_policy" ON zone_transitions
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

DO $$
BEGIN
  RAISE NOTICE '    ✓ RLS 정책 설정 완료';
END $$;

-- ============================================================================
-- 완료 리포트
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_00 완료: 신규 테이블 4개 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ product_models      - 상품별 3D 모델 URL';
  RAISE NOTICE '  ✓ furniture_slots     - 가구 슬롯 정의';
  RAISE NOTICE '  ✓ product_placements  - 3D 상품 배치';
  RAISE NOTICE '  ✓ zone_transitions    - 존 간 이동 데이터';
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('product_models', 'furniture_slots', 'product_placements', 'zone_transitions')
ORDER BY table_name;
