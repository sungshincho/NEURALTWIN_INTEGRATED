-- ============================================================================
-- IMMEDIATE_FIXES.sql
-- Sprint 0에서 필요한 DB 스키마 수정
--
-- 작성일: 2026-01-12
-- 프로젝트: NEURALTWIN - AI 고도화 스프린트
-- ============================================================================

-- ============================================================================
-- 1. Zone VMD 속성 확장
-- ============================================================================

-- Zone에 VMD 관련 확장 속성 추가
ALTER TABLE zones_dim
ADD COLUMN IF NOT EXISTS vmd_attributes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN zones_dim.vmd_attributes IS 'VMD(Visual Merchandising) 관련 확장 속성';

-- 기존 Zone에 기본 VMD 속성 설정
UPDATE zones_dim
SET vmd_attributes = jsonb_build_object(
  'vmd_zone_type',
    CASE zone_type
      WHEN 'entrance' THEN 'decompression'
      WHEN 'main' THEN 'power_aisle'
      WHEN 'display' THEN 'discovery'
      WHEN 'checkout' THEN 'impulse'
      WHEN 'fitting' THEN 'service'
      ELSE 'standard'
    END,
  'is_golden_zone', zone_type IN ('main', 'display'),
  'is_dead_space', false,
  'sightline_score',
    CASE zone_type
      WHEN 'entrance' THEN 1.0
      WHEN 'main' THEN 0.9
      WHEN 'display' THEN 0.7
      ELSE 0.5
    END,
  'traffic_weight',
    CASE zone_type
      WHEN 'entrance' THEN 1.5
      WHEN 'main' THEN 1.2
      WHEN 'display' THEN 1.0
      WHEN 'checkout' THEN 0.8
      ELSE 0.6
    END
)
WHERE vmd_attributes = '{}'::jsonb OR vmd_attributes IS NULL;

-- ============================================================================
-- 2. AI 응답 로그 테이블 확장
-- ============================================================================

-- 파싱 성공 여부 컬럼 추가
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS parse_success BOOLEAN DEFAULT true;

ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false;

ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS schema_validation_errors JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN ai_response_logs.parse_success IS 'JSON 파싱 성공 여부';
COMMENT ON COLUMN ai_response_logs.fallback_used IS '폴백 응답 사용 여부';
COMMENT ON COLUMN ai_response_logs.schema_validation_errors IS '스키마 검증 오류 목록';

-- 파싱 성공률 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_parse_success
ON ai_response_logs(parse_success);

CREATE INDEX IF NOT EXISTS idx_ai_response_logs_function_parse
ON ai_response_logs(function_name, parse_success);

-- ============================================================================
-- 3. Layout Optimization Results 테이블 확장
-- ============================================================================

-- 테이블 존재 확인 후 생성
CREATE TABLE IF NOT EXISTS layout_optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID,
  org_id UUID,

  -- 최적화 유형
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('furniture', 'product', 'both', 'staffing')),

  -- 결과 데이터
  result JSONB NOT NULL,

  -- 요약 정보
  summary JSONB,

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'partial', 'expired')),

  -- 적용 정보
  applied_at TIMESTAMPTZ,
  applied_changes TEXT[],
  rejected_changes TEXT[],

  -- 피드백
  feedback_reason TEXT,
  feedback_text TEXT,

  -- 성과 추적
  actual_results JSONB,

  -- 메타데이터
  parameters JSONB,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_store_id
ON layout_optimization_results(store_id);

CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_status
ON layout_optimization_results(status);

CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_created_at
ON layout_optimization_results(created_at DESC);

-- RLS
ALTER TABLE layout_optimization_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "layout_optimization_results_select_policy" ON layout_optimization_results;
CREATE POLICY "layout_optimization_results_select_policy" ON layout_optimization_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "layout_optimization_results_insert_policy" ON layout_optimization_results;
CREATE POLICY "layout_optimization_results_insert_policy" ON layout_optimization_results
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "layout_optimization_results_update_policy" ON layout_optimization_results;
CREATE POLICY "layout_optimization_results_update_policy" ON layout_optimization_results
  FOR UPDATE USING (true);

-- ============================================================================
-- 4. Furniture 속성 확장
-- ============================================================================

-- 선반 레벨 (VMD 골든존 분석용)
ALTER TABLE furniture_slots
ADD COLUMN IF NOT EXISTS height_zone TEXT CHECK (height_zone IN ('floor', 'bottom', 'middle', 'eye_level', 'top'));

-- 페이싱 수 (상품 노출 면적)
ALTER TABLE furniture_slots
ADD COLUMN IF NOT EXISTS facing_count INTEGER DEFAULT 1;

-- 슬롯 높이 (cm)
ALTER TABLE furniture_slots
ADD COLUMN IF NOT EXISTS slot_height_cm NUMERIC;

COMMENT ON COLUMN furniture_slots.height_zone IS '선반 높이 구역 (VMD 골든존 분석용)';
COMMENT ON COLUMN furniture_slots.facing_count IS '페이싱 수 (상품 노출 면적)';
COMMENT ON COLUMN furniture_slots.slot_height_cm IS '슬롯 높이 (cm)';

-- 기존 슬롯에 height_zone 자동 설정
UPDATE furniture_slots
SET height_zone =
  CASE
    WHEN (slot_position->>'y')::NUMERIC < 0.3 THEN 'floor'
    WHEN (slot_position->>'y')::NUMERIC < 0.6 THEN 'bottom'
    WHEN (slot_position->>'y')::NUMERIC < 1.2 THEN 'middle'
    WHEN (slot_position->>'y')::NUMERIC < 1.5 THEN 'eye_level'
    ELSE 'top'
  END
WHERE height_zone IS NULL
  AND slot_position IS NOT NULL
  AND slot_position->>'y' IS NOT NULL;

-- ============================================================================
-- 5. Products 속성 확장 (마진, 회전율)
-- ============================================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS margin_rate NUMERIC CHECK (margin_rate BETWEEN 0 AND 1);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS turnover_rate NUMERIC;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS cross_sell_product_ids UUID[];

COMMENT ON COLUMN products.margin_rate IS '마진율 (0-1)';
COMMENT ON COLUMN products.turnover_rate IS '회전율 (연간 판매량 / 평균 재고)';
COMMENT ON COLUMN products.cross_sell_product_ids IS '연관 판매 상품 ID 배열';

-- 기본값 설정 (임시)
UPDATE products
SET margin_rate = 0.35  -- 기본 마진 35%
WHERE margin_rate IS NULL;

-- ============================================================================
-- 6. AI 파싱 성공률 집계 뷰 (수정됨)
-- ============================================================================

CREATE OR REPLACE VIEW ai_parse_success_stats AS
SELECT
  function_name,
  DATE(created_at) as date,
  COUNT(*) as total_calls,
  SUM(CASE WHEN parse_success THEN 1 ELSE 0 END) as successful_parses,
  SUM(CASE WHEN fallback_used THEN 1 ELSE 0 END) as fallback_uses,
  ROUND(
    100.0 * SUM(CASE WHEN parse_success THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent,
  AVG(execution_time_ms) as avg_execution_time_ms  -- ✅ 수정: response_time_ms → execution_time_ms
FROM ai_response_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY function_name, DATE(created_at)
ORDER BY date DESC, function_name;

COMMENT ON VIEW ai_parse_success_stats IS 'AI 응답 파싱 성공률 일별 집계';

-- ============================================================================
-- 7. VMD 룰셋 테이블 (Sprint 2 선행 준비)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vmd_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  rule_category TEXT NOT NULL CHECK (rule_category IN (
    'traffic_flow', 'product_placement', 'visual_merchandising', 'customer_psychology'
  )),
  description TEXT NOT NULL,

  -- 적용 조건
  trigger_conditions JSONB NOT NULL DEFAULT '{}',

  -- 권장 액션
  recommended_action TEXT NOT NULL,
  action_parameters JSONB DEFAULT '{}',

  -- 예상 효과
  expected_impact JSONB DEFAULT '{}',

  -- 근거
  evidence_source TEXT,
  confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 1),

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_category ON vmd_rulesets(rule_category);
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_active ON vmd_rulesets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_priority ON vmd_rulesets(priority DESC);

-- RLS
ALTER TABLE vmd_rulesets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vmd_rulesets_select_policy" ON vmd_rulesets;
CREATE POLICY "vmd_rulesets_select_policy" ON vmd_rulesets
  FOR SELECT USING (true);

-- 기본 VMD 룰셋 시딩 (없으면 추가)
INSERT INTO vmd_rulesets (rule_code, rule_name, rule_category, description, trigger_conditions, recommended_action, expected_impact, evidence_source, confidence_level, priority)
SELECT * FROM (VALUES
  ('VMD-001', 'Butt-Brush Effect', 'traffic_flow',
   '통로가 좁으면 고객이 상품을 만지다가 다른 사람과 부딪힐 때 불편함을 느껴 이탈합니다.',
   '{"aisle_width": {"<": 0.9}}'::jsonb,
   '통로 폭 90cm 이상 확보',
   '{"abandonment_reduction": 0.15}'::jsonb,
   'Paco Underhill - Why We Buy', 0.85, 80),

  ('VMD-002', 'Right-Turn Bias', 'traffic_flow',
   '대부분의 고객(약 70%)은 매장 진입 후 우측으로 이동하는 경향이 있습니다.',
   '{"zone_position": "right_side"}'::jsonb,
   '고마진/신상품을 우측 벽면에 배치',
   '{"visibility_increase": 0.25}'::jsonb,
   'Environmental Psychology Research', 0.80, 75),

  ('VMD-003', 'Golden Zone Placement', 'product_placement',
   '눈높이(120-150cm)에 배치된 상품은 가장 높은 가시성과 판매율을 보입니다.',
   '{"shelf_level": "eye_level"}'::jsonb,
   '고마진 상품을 눈높이 선반에 배치',
   '{"sales_lift": 0.35}'::jsonb,
   'Retail Industry Standards', 0.90, 90),

  ('VMD-004', 'Dead Zone Activation', 'visual_merchandising',
   '방문율이 낮은 구역(Dead Zone)에 포컬 포인트를 만들어 고객을 유도합니다.',
   '{"visit_rate": {"<": 0.2}}'::jsonb,
   '프로모션 디스플레이 또는 조명 강조',
   '{"traffic_increase": 0.30}'::jsonb,
   'Store Layout Optimization Studies', 0.75, 60),

  ('VMD-005', 'Cross-Sell Proximity', 'product_placement',
   '연관 상품을 인접 배치하면 장바구니 크기가 증가합니다.',
   '{"association_lift": {">": 1.5}}'::jsonb,
   '연관 상품을 동일 Zone 또는 인접 선반에 배치',
   '{"basket_size_increase": 0.18}'::jsonb,
   'Market Basket Analysis Best Practices', 0.82, 70)
) AS v(rule_code, rule_name, rule_category, description, trigger_conditions, recommended_action, expected_impact, evidence_source, confidence_level, priority)
WHERE NOT EXISTS (SELECT 1 FROM vmd_rulesets WHERE vmd_rulesets.rule_code = v.rule_code);

-- ============================================================================
-- 8. Store Persona 테이블 (Sprint 3 선행 준비)
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- 기본 특성
  store_type TEXT DEFAULT 'standard' CHECK (store_type IN (
    'flagship', 'standard', 'outlet', 'pop_up', 'department_store'
  )),
  target_customer TEXT DEFAULT 'mass_market' CHECK (target_customer IN (
    'luxury', 'premium', 'mass_market', 'budget', 'mixed'
  )),

  -- AI 행동 조정
  optimization_style TEXT DEFAULT 'balanced' CHECK (optimization_style IN (
    'aggressive', 'balanced', 'conservative'
  )),
  risk_tolerance NUMERIC DEFAULT 0.5 CHECK (risk_tolerance BETWEEN 0 AND 1),

  -- System Prompt 컴포넌트
  custom_context TEXT,
  priority_rules TEXT[],
  excluded_rules TEXT[],

  -- 학습된 선호도
  learned_preferences JSONB DEFAULT '{}',

  -- 성과 기록
  total_recommendations INTEGER DEFAULT 0,
  accepted_recommendations INTEGER DEFAULT 0,

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_store_personas_store_id ON store_personas(store_id);

-- RLS
ALTER TABLE store_personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_personas_select_policy" ON store_personas;
CREATE POLICY "store_personas_select_policy" ON store_personas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_personas_insert_policy" ON store_personas;
CREATE POLICY "store_personas_insert_policy" ON store_personas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "store_personas_update_policy" ON store_personas;
CREATE POLICY "store_personas_update_policy" ON store_personas
  FOR UPDATE USING (true);

-- 기존 Store에 기본 Persona 생성
INSERT INTO store_personas (store_id, store_type, target_customer, optimization_style)
SELECT id, 'standard', 'mass_market', 'balanced'
FROM stores
WHERE NOT EXISTS (SELECT 1 FROM store_personas WHERE store_personas.store_id = stores.id)
ON CONFLICT (store_id) DO NOTHING;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================

SELECT
  'zones_dim.vmd_attributes' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zones_dim' AND column_name = 'vmd_attributes'
  ) THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT
  'ai_response_logs.parse_success',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'parse_success'
  ) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT
  'furniture_slots.height_zone',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'furniture_slots' AND column_name = 'height_zone'
  ) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT
  'products.margin_rate',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'margin_rate'
  ) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT
  'vmd_rulesets table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'vmd_rulesets'
  ) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT
  'store_personas table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'store_personas'
  ) THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT
  'layout_optimization_results table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'layout_optimization_results'
  ) THEN 'OK' ELSE 'MISSING' END;

-- ============================================================================
-- 완료
-- ============================================================================
SELECT '✅ IMMEDIATE_FIXES.sql 적용 완료' as message;
