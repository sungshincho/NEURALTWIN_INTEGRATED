-- ============================================================================
-- Sprint 2: Furniture VMD 속성 확장
-- Task: S2-2
-- 작성일: 2026-01-12
-- 수정: fixtures_dim → furniture (실제 테이블명)
-- ============================================================================

-- Furniture에 height_zone 컬럼 추가 (선반 높이 구역)
ALTER TABLE furniture
ADD COLUMN IF NOT EXISTS height_zone TEXT DEFAULT 'eye_level'
CHECK (height_zone IN ('floor', 'bend', 'reach', 'eye_level', 'top'));

COMMENT ON COLUMN furniture.height_zone IS '선반 높이 구역: floor(바닥), bend(허리), reach(손닿는), eye_level(눈높이), top(최상단)';

-- Furniture에 facing 컬럼 추가 (상품 진열 방향)
ALTER TABLE furniture
ADD COLUMN IF NOT EXISTS facing TEXT DEFAULT 'front'
CHECK (facing IN ('front', 'side', 'back', 'island', 'corner'));

COMMENT ON COLUMN furniture.facing IS '진열 방향: front(전면), side(측면), back(후면), island(섬형), corner(코너)';

-- Furniture에 VMD 속성 JSONB 추가
ALTER TABLE furniture
ADD COLUMN IF NOT EXISTS vmd_properties JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN furniture.vmd_properties IS 'VMD 관련 확장 속성';

-- 기존 Furniture에 기본 VMD 속성 추가
UPDATE furniture SET vmd_properties = jsonb_build_object(
  'visibility_score',
    CASE height_zone
      WHEN 'eye_level' THEN 1.0
      WHEN 'reach' THEN 0.8
      WHEN 'bend' THEN 0.6
      WHEN 'floor' THEN 0.4
      WHEN 'top' THEN 0.3
      ELSE 0.7
    END,
  'accessibility_score',
    CASE height_zone
      WHEN 'reach' THEN 1.0
      WHEN 'eye_level' THEN 0.9
      WHEN 'bend' THEN 0.7
      WHEN 'floor' THEN 0.5
      WHEN 'top' THEN 0.3
      ELSE 0.7
    END,
  'is_focal_point', false,
  'is_endcap', false,
  'lighting_enhanced', false,
  'signage_present', false,
  'recommended_product_category', null,
  'max_products',
    CASE furniture_type
      WHEN 'shelf' THEN 20
      WHEN 'rack' THEN 30
      WHEN 'clothing_rack' THEN 25
      WHEN 'table' THEN 15
      WHEN 'mannequin' THEN 1
      WHEN 'mannequin_full' THEN 1
      WHEN 'mannequin_half' THEN 1
      WHEN 'display' THEN 10
      ELSE 15
    END
) WHERE vmd_properties = '{}'::jsonb OR vmd_properties IS NULL;

-- ============================================================================
-- Height Zone 참조 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS furniture_height_zones (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  height_range_cm TEXT NOT NULL,
  visibility_multiplier NUMERIC NOT NULL,
  accessibility_multiplier NUMERIC NOT NULL,
  recommended_products TEXT,
  description TEXT
);

INSERT INTO furniture_height_zones (code, name, height_range_cm, visibility_multiplier, accessibility_multiplier, recommended_products, description)
VALUES
  ('floor', '바닥', '0-60cm', 0.4, 0.5, '대용량, 무거운 상품', '바닥 근처, 가시성 낮음'),
  ('bend', '허리', '60-90cm', 0.6, 0.7, '중간 가격대, 일반 상품', '허리 높이, 약간 숙여야 함'),
  ('reach', '손닿는 높이', '90-120cm', 0.8, 1.0, '베스트셀러, 신상품', '편하게 손이 닿는 높이'),
  ('eye_level', '눈높이', '120-150cm', 1.0, 0.9, '고마진, 프리미엄 상품', '가장 높은 가시성, 골든존'),
  ('top', '최상단', '150cm 이상', 0.3, 0.3, '재고, 대형 포장', '손이 닿기 어려움, POP 디스플레이용')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Facing 참조 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS furniture_facings (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  traffic_exposure NUMERIC NOT NULL,
  description TEXT
);

INSERT INTO furniture_facings (code, name, traffic_exposure, description)
VALUES
  ('front', '전면', 1.0, '주 동선에서 정면으로 보이는 위치'),
  ('side', '측면', 0.7, '동선 옆에서 측면으로 보이는 위치'),
  ('back', '후면', 0.4, '동선 반대편, 가시성 낮음'),
  ('island', '섬형', 1.2, '사방에서 접근 가능한 중앙 위치'),
  ('corner', '코너', 0.5, '모서리 위치, 접근성 제한적')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 인덱스
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_furniture_height_zone ON furniture(height_zone);
CREATE INDEX IF NOT EXISTS idx_furniture_facing ON furniture(facing);
CREATE INDEX IF NOT EXISTS idx_furniture_focal_point
ON furniture ((vmd_properties->>'is_focal_point'))
WHERE (vmd_properties->>'is_focal_point')::boolean = true;
CREATE INDEX IF NOT EXISTS idx_furniture_endcap
ON furniture ((vmd_properties->>'is_endcap'))
WHERE (vmd_properties->>'is_endcap')::boolean = true;

-- ============================================================================
-- 뷰: Furniture VMD 요약
-- ============================================================================
CREATE OR REPLACE VIEW v_furniture_vmd_summary AS
SELECT
  f.id,
  f.store_id,
  f.zone_id,
  f.furniture_name,
  f.furniture_type,
  f.height_zone,
  f.facing,
  hz.height_range_cm,
  hz.visibility_multiplier,
  hz.accessibility_multiplier,
  ff.traffic_exposure,
  (f.vmd_properties->>'visibility_score')::numeric AS visibility_score,
  (f.vmd_properties->>'accessibility_score')::numeric AS accessibility_score,
  (f.vmd_properties->>'is_focal_point')::boolean AS is_focal_point,
  (f.vmd_properties->>'is_endcap')::boolean AS is_endcap,
  (f.vmd_properties->>'lighting_enhanced')::boolean AS lighting_enhanced,
  (f.vmd_properties->>'max_products')::integer AS max_products
FROM furniture f
LEFT JOIN furniture_height_zones hz ON hz.code = f.height_zone
LEFT JOIN furniture_facings ff ON ff.code = f.facing;

COMMENT ON VIEW v_furniture_vmd_summary IS 'Furniture의 VMD 속성 요약 뷰';

-- ============================================================================
-- 함수: Furniture 가시성 점수 계산
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_furniture_visibility(
  p_height_zone TEXT,
  p_facing TEXT,
  p_is_focal_point BOOLEAN DEFAULT false,
  p_lighting_enhanced BOOLEAN DEFAULT false
)
RETURNS NUMERIC AS $$
DECLARE
  v_base_score NUMERIC;
  v_facing_multiplier NUMERIC;
  v_bonus NUMERIC := 0;
BEGIN
  -- 높이별 기본 점수
  SELECT visibility_multiplier INTO v_base_score
  FROM furniture_height_zones
  WHERE code = p_height_zone;

  IF v_base_score IS NULL THEN
    v_base_score := 0.7;
  END IF;

  -- Facing 가중치
  SELECT traffic_exposure INTO v_facing_multiplier
  FROM furniture_facings
  WHERE code = p_facing;

  IF v_facing_multiplier IS NULL THEN
    v_facing_multiplier := 1.0;
  END IF;

  -- 보너스
  IF p_is_focal_point THEN
    v_bonus := v_bonus + 0.15;
  END IF;

  IF p_lighting_enhanced THEN
    v_bonus := v_bonus + 0.1;
  END IF;

  RETURN LEAST(1.0, v_base_score * v_facing_multiplier + v_bonus);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_furniture_visibility IS 'Furniture 가시성 점수 계산 (0-1)';
