-- ============================================================================
-- Sprint 2: Zone VMD 속성 확장
-- Task: S2-1
-- 작성일: 2026-01-12
-- ============================================================================

-- Zone VMD 속성 확장
ALTER TABLE zones_dim
ADD COLUMN IF NOT EXISTS vmd_attributes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN zones_dim.vmd_attributes IS 'VMD 관련 확장 속성 (vmd_zone_type, is_golden_zone, sightline_score 등)';

-- 기존 Zone에 기본 VMD 속성 추가
UPDATE zones_dim SET vmd_attributes = jsonb_build_object(
  'vmd_zone_type',
    CASE zone_type
      WHEN 'entrance' THEN 'decompression'
      WHEN 'main' THEN 'power_aisle'
      WHEN 'display' THEN 'discovery'
      WHEN 'checkout' THEN 'impulse'
      WHEN 'fitting' THEN 'service'
      WHEN 'storage' THEN 'back_of_house'
      ELSE 'standard'
    END,
  'is_golden_zone', zone_type IN ('main', 'display'),
  'is_dead_space', false,
  'sightline_score', 0.7,
  'traffic_weight',
    CASE zone_type
      WHEN 'entrance' THEN 1.5
      WHEN 'main' THEN 1.2
      WHEN 'display' THEN 1.0
      WHEN 'checkout' THEN 0.8
      WHEN 'fitting' THEN 0.5
      ELSE 0.6
    END,
  'customer_dwell_target_seconds',
    CASE zone_type
      WHEN 'entrance' THEN 30
      WHEN 'main' THEN 120
      WHEN 'display' THEN 180
      WHEN 'checkout' THEN 60
      WHEN 'fitting' THEN 300
      ELSE 90
    END,
  'recommended_fixture_density',
    CASE zone_type
      WHEN 'entrance' THEN 0.1
      WHEN 'main' THEN 0.2
      WHEN 'display' THEN 0.3
      WHEN 'checkout' THEN 0.15
      WHEN 'fitting' THEN 0.1
      ELSE 0.2
    END
) WHERE vmd_attributes = '{}'::jsonb OR vmd_attributes IS NULL;

-- VMD Zone Type 인덱스
CREATE INDEX IF NOT EXISTS idx_zones_vmd_type
ON zones_dim ((vmd_attributes->>'vmd_zone_type'));

-- Golden Zone 인덱스
CREATE INDEX IF NOT EXISTS idx_zones_golden_zone
ON zones_dim ((vmd_attributes->>'is_golden_zone'))
WHERE (vmd_attributes->>'is_golden_zone')::boolean = true;

-- Dead Space 인덱스
CREATE INDEX IF NOT EXISTS idx_zones_dead_space
ON zones_dim ((vmd_attributes->>'is_dead_space'))
WHERE (vmd_attributes->>'is_dead_space')::boolean = true;

-- ============================================================================
-- VMD Zone Type Enum 참조 테이블 (선택적)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vmd_zone_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  typical_dwell_seconds INTEGER,
  traffic_weight NUMERIC,
  color_code TEXT
);

INSERT INTO vmd_zone_types (code, name, description, typical_dwell_seconds, traffic_weight, color_code)
VALUES
  ('decompression', '감압 구역', '입구 직후 고객이 매장에 적응하는 구간 (3-4m)', 30, 1.5, '#E8F5E9'),
  ('power_aisle', '파워 통로', '주요 동선, 고객 유동량이 가장 높은 구역', 120, 1.2, '#FFF3E0'),
  ('discovery', '발견 구역', '상품 탐색이 주로 이루어지는 디스플레이 구역', 180, 1.0, '#E3F2FD'),
  ('impulse', '충동구매 구역', '계산대 주변, 저가/소모품 배치 구역', 60, 0.8, '#FCE4EC'),
  ('service', '서비스 구역', '피팅룸, 상담 등 서비스가 제공되는 구역', 300, 0.5, '#F3E5F5'),
  ('destination', '목적지 구역', '특정 목적을 가진 고객이 찾는 구역', 240, 0.7, '#E0F7FA'),
  ('back_of_house', '후방 구역', '창고, 직원 전용 구역', 0, 0.1, '#ECEFF1'),
  ('standard', '표준 구역', '일반 매장 구역', 90, 0.6, '#FAFAFA')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 뷰: Zone VMD 요약
-- ============================================================================
CREATE OR REPLACE VIEW v_zone_vmd_summary AS
SELECT
  z.id,
  z.store_id,
  z.zone_name,
  z.zone_type,
  z.vmd_attributes->>'vmd_zone_type' AS vmd_zone_type,
  (z.vmd_attributes->>'is_golden_zone')::boolean AS is_golden_zone,
  (z.vmd_attributes->>'is_dead_space')::boolean AS is_dead_space,
  (z.vmd_attributes->>'sightline_score')::numeric AS sightline_score,
  (z.vmd_attributes->>'traffic_weight')::numeric AS traffic_weight,
  (z.vmd_attributes->>'customer_dwell_target_seconds')::integer AS dwell_target_seconds,
  (z.vmd_attributes->>'recommended_fixture_density')::numeric AS fixture_density,
  vt.description AS vmd_type_description,
  vt.color_code
FROM zones_dim z
LEFT JOIN vmd_zone_types vt ON vt.code = z.vmd_attributes->>'vmd_zone_type';

COMMENT ON VIEW v_zone_vmd_summary IS 'Zone의 VMD 속성 요약 뷰';
