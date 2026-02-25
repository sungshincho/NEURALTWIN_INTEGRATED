-- ============================================================================
-- Sprint 2: VMD 룰셋 테이블 생성
-- Task: S2-3
-- 작성일: 2026-01-12
-- ============================================================================

-- VMD 룰셋 테이블
CREATE TABLE IF NOT EXISTS vmd_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  rule_name_ko TEXT,  -- 한국어 이름
  rule_category TEXT NOT NULL CHECK (rule_category IN (
    'traffic_flow', 'product_placement', 'visual_merchandising', 'customer_psychology', 'space_optimization'
  )),
  description TEXT NOT NULL,
  description_ko TEXT,  -- 한국어 설명

  -- 적용 조건 (JSONB)
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  -- 예: {"zone_type": ["display"], "congestion_score": {">": 0.7}}

  -- 권장 액션
  recommended_action TEXT NOT NULL,
  recommended_action_ko TEXT,  -- 한국어 권장 액션
  action_parameters JSONB DEFAULT '{}',

  -- 예상 효과 (JSONB)
  expected_impact JSONB DEFAULT '{}',
  -- 예: {"traffic_lift": 0.15, "conversion_lift": 0.10}

  -- 근거 및 참조
  evidence_source TEXT,  -- 연구 논문, 업계 보고서 등
  evidence_url TEXT,     -- 참조 URL
  confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 1),

  -- 적용 범위
  applicable_store_types TEXT[] DEFAULT ARRAY['all'],  -- flagship, standard, outlet 등
  applicable_industries TEXT[] DEFAULT ARRAY['retail'],  -- retail, fashion, grocery 등

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,  -- 높을수록 우선 적용 (1-100)
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- ============================================================================
-- 기본 VMD 룰셋 시딩 (8개 핵심 규칙)
-- ============================================================================

INSERT INTO vmd_rulesets (
  rule_code, rule_name, rule_name_ko, rule_category,
  description, description_ko,
  trigger_conditions, recommended_action, recommended_action_ko,
  expected_impact, evidence_source, confidence_level, priority
) VALUES
-- 1. Butt-Brush Effect
('VMD-001', 'Butt-Brush Effect', '부딪힘 효과', 'traffic_flow',
  'When aisles are narrow, customers feel uncomfortable when brushed by other shoppers while examining products, leading to abandonment.',
  '통로가 좁으면 고객이 상품을 만지다가 다른 사람과 부딪힐 때 불편함을 느껴 이탈합니다. 최소 통로 폭 90cm 이상 확보 권장.',
  '{"aisle_width": {"<": 0.9}, "zone_type": ["display", "main"]}',
  'Rearrange furniture to ensure minimum 90cm aisle width',
  '통로 폭 확보를 위해 가구 재배치',
  '{"abandonment_reduction": 0.15, "dwell_time_increase": 0.10, "customer_comfort": 0.20}',
  'Paco Underhill - Why We Buy', 0.85, 80),

-- 2. Right-Turn Bias
('VMD-002', 'Right-Turn Bias', '우회전 편향', 'traffic_flow',
  'Approximately 70% of customers tend to turn right upon entering a store. High-margin products should be placed on the right side.',
  '대부분의 고객(약 70%)은 매장 진입 후 우측으로 이동하는 경향이 있습니다. 고마진 상품을 우측 동선에 배치하세요.',
  '{"zone_position": "right_side", "is_entrance_adjacent": true}',
  'Place high-margin/new products on right-side walls',
  '고마진/신상품을 우측 벽면에 배치',
  '{"visibility_increase": 0.25, "sales_lift": 0.12, "discovery_rate": 0.18}',
  'Environmental Psychology Research', 0.80, 75),

-- 3. Golden Zone Placement
('VMD-003', 'Golden Zone Placement', '골든존 배치', 'product_placement',
  'Products placed at eye level (120-150cm) have the highest visibility and sales rates.',
  '눈높이(120-150cm)에 배치된 상품은 가장 높은 가시성과 판매율을 보입니다.',
  '{"height_zone": "eye_level", "product_margin": {">": 0.3}}',
  'Place high-margin products on eye-level shelves',
  '고마진 상품을 눈높이 선반에 배치',
  '{"sales_lift": 0.35, "visibility_increase": 0.40, "conversion_lift": 0.25}',
  'Retail Industry Standards', 0.90, 90),

-- 4. Dead Zone Activation
('VMD-004', 'Dead Zone Activation', '데드존 활성화', 'visual_merchandising',
  'Create focal points in low-traffic areas to draw customers deeper into the store.',
  '방문율이 낮은 구역(Dead Zone)에 포컬 포인트를 만들어 고객을 유도합니다.',
  '{"visit_rate": {"<": 0.2}, "zone_type": ["corner", "back"]}',
  'Add promotional display or enhanced lighting',
  '프로모션 디스플레이 또는 조명 강조',
  '{"traffic_increase": 0.30, "zone_discovery": 0.25, "store_penetration": 0.15}',
  'Store Layout Optimization Studies', 0.75, 60),

-- 5. Cross-Sell Proximity
('VMD-005', 'Cross-Sell Proximity', '교차판매 인접배치', 'product_placement',
  'Placing associated products nearby increases basket size.',
  '연관 상품을 인접 배치하면 장바구니 크기가 증가합니다.',
  '{"association_lift": {">": 1.5}, "association_confidence": {">": 0.3}}',
  'Place associated products in same zone or adjacent shelf',
  '연관 상품을 동일 Zone 또는 인접 선반에 배치',
  '{"basket_size_increase": 0.18, "cross_sell_rate": 0.22, "transaction_value": 0.15}',
  'Market Basket Analysis Best Practices', 0.82, 70),

-- 6. Decompression Zone
('VMD-006', 'Decompression Zone', '감압 구역', 'customer_psychology',
  'The first 3-4 meters after entrance is where customers adjust to the store. Key products should be placed after this zone.',
  '입구 직후 3-4m는 고객이 매장에 적응하는 구간입니다. 주요 상품은 이 구역 이후에 배치하세요.',
  '{"zone_type": ["entrance"], "distance_from_door": {"<": 4}}',
  'Place only welcome displays near entrance, key products after 4m',
  '입구 직후는 환영 디스플레이만 배치, 주력 상품은 4m 이후',
  '{"first_impression": 0.20, "browse_rate_increase": 0.15, "stress_reduction": 0.25}',
  'Paco Underhill - Why We Buy', 0.78, 85),

-- 7. Impulse Buy Zone
('VMD-007', 'Impulse Buy Zone', '충동구매 구역', 'product_placement',
  'Place low-cost consumables near checkout and traffic intersections to trigger impulse purchases.',
  '계산대 주변과 동선 교차점에 저가/소모품을 배치하여 충동구매를 유도합니다.',
  '{"zone_type": ["checkout"], "product_price": {"<": 30000}}',
  'Place low-cost accessories/consumables near checkout',
  '저가 악세서리/소모품을 계산대 근처에 배치',
  '{"add_on_sales": 0.12, "transaction_value_increase": 0.08, "impulse_conversion": 0.20}',
  'Point of Sale Research', 0.85, 75),

-- 8. Sightline Optimization
('VMD-008', 'Sightline Optimization', '시야선 최적화', 'visual_merchandising',
  'Clear sightlines from entrance to the back of the store increase exploration willingness.',
  '입구에서 매장 깊숙한 곳까지 시야가 확보되면 탐색 의욕이 증가합니다.',
  '{"sightline_blocked": true, "zone_type": ["main", "entrance"]}',
  'Relocate tall fixtures blocking sightlines',
  '시야를 막는 높은 집기 재배치',
  '{"store_penetration": 0.20, "dwell_time_increase": 0.12, "exploration_rate": 0.18}',
  'Store Design Principles', 0.80, 70),

-- 9. Speed Bump Effect (추가)
('VMD-009', 'Speed Bump Effect', '속도 감속 효과', 'traffic_flow',
  'Strategic placement of displays to slow down customer movement and increase product exposure.',
  '고객의 이동 속도를 늦추는 전략적 디스플레이 배치로 상품 노출을 증가시킵니다.',
  '{"flow_rate": {">": 2.0}, "zone_type": ["main", "power_aisle"]}',
  'Add island display or promotional table in high-traffic path',
  '고객 동선에 아일랜드 디스플레이 또는 프로모션 테이블 추가',
  '{"dwell_time_increase": 0.25, "product_discovery": 0.20, "engagement_rate": 0.15}',
  'Retail Traffic Flow Studies', 0.75, 65),

-- 10. Vertical Blocking (추가)
('VMD-010', 'Vertical Blocking', '수직 블로킹', 'product_placement',
  'Group same-category products vertically so customers can compare while moving horizontally.',
  '동일 카테고리 상품을 수직으로 배치하여 고객이 수평 이동하며 비교할 수 있게 합니다.',
  '{"fixture_type": ["shelf", "rack"], "category_count": {">": 3}}',
  'Arrange products vertically by category, horizontally by brand/price',
  '카테고리별 수직 배열, 브랜드/가격별 수평 배열',
  '{"comparison_shopping": 0.30, "decision_speed": 0.20, "category_sales": 0.15}',
  'Merchandising Best Practices', 0.80, 68)

ON CONFLICT (rule_code) DO UPDATE SET
  rule_name = EXCLUDED.rule_name,
  rule_name_ko = EXCLUDED.rule_name_ko,
  description = EXCLUDED.description,
  description_ko = EXCLUDED.description_ko,
  trigger_conditions = EXCLUDED.trigger_conditions,
  recommended_action = EXCLUDED.recommended_action,
  recommended_action_ko = EXCLUDED.recommended_action_ko,
  expected_impact = EXCLUDED.expected_impact,
  evidence_source = EXCLUDED.evidence_source,
  confidence_level = EXCLUDED.confidence_level,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- ============================================================================
-- 인덱스
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_category ON vmd_rulesets(rule_category);
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_active ON vmd_rulesets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_priority ON vmd_rulesets(priority DESC);
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_confidence ON vmd_rulesets(confidence_level DESC);
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_trigger ON vmd_rulesets USING GIN (trigger_conditions);

-- ============================================================================
-- 룰 적용 이력 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS vmd_rule_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES vmd_rulesets(id),
  store_id UUID NOT NULL,
  optimization_id UUID,  -- 연관 최적화 ID (있는 경우)

  -- 적용 컨텍스트
  applied_to_zone_id UUID,
  applied_to_fixture_id UUID,
  applied_to_product_id UUID,

  -- 적용 결과
  was_accepted BOOLEAN,
  user_feedback TEXT,
  actual_impact JSONB,  -- 실제 효과 (있는 경우)

  -- 메타데이터
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_rule_applications_rule ON vmd_rule_applications(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_applications_store ON vmd_rule_applications(store_id);
CREATE INDEX IF NOT EXISTS idx_rule_applications_date ON vmd_rule_applications(applied_at DESC);

-- ============================================================================
-- 함수: 조건에 맞는 룰셋 조회
-- ============================================================================
CREATE OR REPLACE FUNCTION get_applicable_vmd_rules(
  p_zone_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_confidence NUMERIC DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rule_code TEXT,
  rule_name TEXT,
  rule_name_ko TEXT,
  rule_category TEXT,
  description_ko TEXT,
  recommended_action_ko TEXT,
  expected_impact JSONB,
  confidence_level NUMERIC,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.rule_code,
    r.rule_name,
    r.rule_name_ko,
    r.rule_category,
    r.description_ko,
    r.recommended_action_ko,
    r.expected_impact,
    r.confidence_level,
    r.priority
  FROM vmd_rulesets r
  WHERE r.is_active = true
    AND r.confidence_level >= p_min_confidence
    AND (p_category IS NULL OR r.rule_category = p_category)
    AND (p_zone_type IS NULL OR
         r.trigger_conditions->'zone_type' IS NULL OR
         r.trigger_conditions->'zone_type' ? p_zone_type)
  ORDER BY r.priority DESC, r.confidence_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_applicable_vmd_rules IS '조건에 맞는 VMD 룰셋 조회';

-- ============================================================================
-- 뷰: VMD 룰셋 요약
-- ============================================================================
CREATE OR REPLACE VIEW v_vmd_rules_summary AS
SELECT
  rule_code,
  rule_name_ko AS name,
  rule_category,
  description_ko AS description,
  recommended_action_ko AS action,
  expected_impact,
  confidence_level,
  priority,
  is_active,
  (
    SELECT COUNT(*)
    FROM vmd_rule_applications ra
    WHERE ra.rule_id = vmd_rulesets.id
      AND ra.was_accepted = true
  ) AS times_accepted,
  (
    SELECT COUNT(*)
    FROM vmd_rule_applications ra
    WHERE ra.rule_id = vmd_rulesets.id
  ) AS times_applied
FROM vmd_rulesets
ORDER BY priority DESC;

COMMENT ON VIEW v_vmd_rules_summary IS 'VMD 룰셋 요약 및 적용 통계';
