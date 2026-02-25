-- ============================================================================
-- Sprint 3: Store Persona 시스템
-- Task: S3-4
-- 작성일: 2026-01-12
-- ============================================================================

-- Store Persona 테이블
-- 매장별 AI 학습 컨텍스트 및 선호도 저장
CREATE TABLE IF NOT EXISTS store_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- 매장 특성
  store_style TEXT DEFAULT 'standard'
    CHECK (store_style IN ('premium', 'standard', 'budget', 'outlet', 'flagship', 'pop_up')),
  target_demographic TEXT DEFAULT 'general'
    CHECK (target_demographic IN ('young', 'family', 'senior', 'professional', 'general')),

  -- 최적화 선호도 (0-1)
  preference_weights JSONB DEFAULT '{
    "revenue": 0.4,
    "conversion": 0.25,
    "dwell_time": 0.2,
    "traffic_flow": 0.15
  }'::jsonb,

  -- VMD 선호도
  vmd_preferences JSONB DEFAULT '{
    "prefer_rules": [],
    "avoid_rules": [],
    "custom_thresholds": {}
  }'::jsonb,

  -- 학습된 컨텍스트 (AI 프롬프트에 주입)
  learned_context JSONB DEFAULT '{
    "success_patterns": [],
    "failure_patterns": [],
    "seasonal_adjustments": {},
    "custom_instructions": ""
  }'::jsonb,

  -- AI 신뢰도 조정값
  confidence_adjustments JSONB DEFAULT '{
    "layout": 0,
    "flow": 0,
    "staffing": 0,
    "pricing": 0
  }'::jsonb,

  -- 피드백 통계
  feedback_stats JSONB DEFAULT '{
    "total_recommendations": 0,
    "accepted": 0,
    "rejected": 0,
    "modified": 0,
    "acceptance_rate": 0
  }'::jsonb,

  -- 마지막 학습 시점
  last_learning_at TIMESTAMPTZ,
  learning_version INTEGER DEFAULT 1,

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 스토어당 하나의 페르소나만 존재
  CONSTRAINT store_persona_unique UNIQUE (store_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_store_personas_store_id ON store_personas(store_id);
CREATE INDEX IF NOT EXISTS idx_store_personas_style ON store_personas(store_style);
CREATE INDEX IF NOT EXISTS idx_store_personas_active ON store_personas(is_active) WHERE is_active = true;

-- ============================================================================
-- AI 추천 피드백 상세 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS optimization_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  optimization_id UUID,  -- 연관된 최적화 결과 ID

  -- 피드백 대상
  feedback_target_type TEXT NOT NULL
    CHECK (feedback_target_type IN ('furniture_move', 'product_placement', 'zone_change', 'overall')),
  target_id TEXT,  -- furniture_id, product_id, zone_id, 또는 null (overall)

  -- 피드백 내용
  action TEXT NOT NULL
    CHECK (action IN ('accept', 'reject', 'modify')),
  reason_code TEXT,  -- 정형화된 사유 코드
  reason_text TEXT,  -- 자유 입력 사유

  -- 수정된 경우 원본/수정 내용
  original_suggestion JSONB,
  modified_suggestion JSONB,

  -- AI 추천 컨텍스트 (학습용)
  ai_confidence NUMERIC,
  vmd_rules_applied TEXT[],  -- 적용된 VMD 룰 코드 목록

  -- 메타데이터
  feedback_by TEXT,  -- user_id 또는 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_store ON optimization_feedback(store_id);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_optimization ON optimization_feedback(optimization_id);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_action ON optimization_feedback(action);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_created ON optimization_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_target ON optimization_feedback(feedback_target_type, target_id);

-- ============================================================================
-- 피드백 사유 코드 참조 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_reason_codes (
  code TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('accept', 'reject', 'modify')),
  label_ko TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 50
);

-- 기본 사유 코드 시딩
INSERT INTO feedback_reason_codes (code, category, label_ko, label_en, description, display_order)
VALUES
  -- Accept 사유
  ('accept_helpful', 'accept', '도움이 됨', 'Helpful suggestion', '추천이 유용함', 10),
  ('accept_accurate', 'accept', '분석이 정확함', 'Accurate analysis', 'AI 분석이 정확함', 20),
  ('accept_innovative', 'accept', '새로운 인사이트', 'New insight', '새로운 관점 제공', 30),

  -- Reject 사유
  ('reject_impractical', 'reject', '실현 불가능', 'Impractical', '물리적 또는 운영상 실현 어려움', 10),
  ('reject_brand_policy', 'reject', '브랜드 정책 위반', 'Brand policy conflict', '브랜드 가이드라인에 맞지 않음', 20),
  ('reject_already_tried', 'reject', '이미 시도함', 'Already tried', '과거에 시도했으나 효과 없음', 30),
  ('reject_customer_pref', 'reject', '고객 선호 고려 안됨', 'Customer preference not considered', '해당 매장 고객 특성에 맞지 않음', 40),
  ('reject_cost_high', 'reject', '비용 대비 효과 낮음', 'Cost prohibitive', '변경 비용이 기대 효과보다 큼', 50),
  ('reject_wrong_analysis', 'reject', '분석 오류', 'Wrong analysis', 'AI 분석이 부정확함', 60),

  -- Modify 사유
  ('modify_partial_agree', 'modify', '부분 동의', 'Partial agreement', '일부만 적용 가능', 10),
  ('modify_constraints', 'modify', '제약 조건 추가', 'Additional constraints', '추가 제약 조건 고려 필요', 20),
  ('modify_timing', 'modify', '시점 조정', 'Timing adjustment', '적용 시점 조정 필요', 30),
  ('modify_scale', 'modify', '규모 조정', 'Scale adjustment', '변경 범위 조정 필요', 40)
ON CONFLICT (code) DO UPDATE SET
  label_ko = EXCLUDED.label_ko,
  label_en = EXCLUDED.label_en,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 함수: Store Persona 생성/갱신
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_store_persona(p_store_id UUID)
RETURNS UUID AS $$
DECLARE
  v_persona_id UUID;
BEGIN
  -- 기존 페르소나 확인
  SELECT id INTO v_persona_id
  FROM store_personas
  WHERE store_id = p_store_id AND is_active = true;

  -- 없으면 생성
  IF v_persona_id IS NULL THEN
    INSERT INTO store_personas (store_id)
    VALUES (p_store_id)
    RETURNING id INTO v_persona_id;
  END IF;

  RETURN v_persona_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 함수: 피드백 통계 업데이트
-- ============================================================================

CREATE OR REPLACE FUNCTION update_persona_feedback_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- 피드백 통계 집계
  SELECT jsonb_build_object(
    'total_recommendations', COUNT(*),
    'accepted', COUNT(*) FILTER (WHERE action = 'accept'),
    'rejected', COUNT(*) FILTER (WHERE action = 'reject'),
    'modified', COUNT(*) FILTER (WHERE action = 'modify'),
    'acceptance_rate', CASE
      WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE action = 'accept')::NUMERIC / COUNT(*) * 100, 1)
      ELSE 0
    END
  ) INTO v_stats
  FROM optimization_feedback
  WHERE store_id = NEW.store_id;

  -- Store Persona 업데이트
  UPDATE store_personas
  SET
    feedback_stats = v_stats,
    updated_at = NOW()
  WHERE store_id = NEW.store_id;

  -- 페르소나 없으면 생성
  IF NOT FOUND THEN
    PERFORM ensure_store_persona(NEW.store_id);
    UPDATE store_personas
    SET feedback_stats = v_stats
    WHERE store_id = NEW.store_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_persona_feedback_stats
AFTER INSERT ON optimization_feedback
FOR EACH ROW
EXECUTE FUNCTION update_persona_feedback_stats();

-- ============================================================================
-- 함수: Store Persona 프롬프트 컨텍스트 조회
-- ============================================================================

CREATE OR REPLACE FUNCTION get_store_persona_context(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_persona RECORD;
  v_success_patterns JSONB;
  v_failure_patterns JSONB;
  v_context JSONB;
BEGIN
  -- Store Persona 조회
  SELECT * INTO v_persona
  FROM store_personas
  WHERE store_id = p_store_id AND is_active = true;

  -- 없으면 기본값 반환
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_persona', false,
      'store_style', 'standard',
      'target_demographic', 'general',
      'preference_weights', '{"revenue": 0.4, "conversion": 0.25, "dwell_time": 0.2, "traffic_flow": 0.15}'::jsonb,
      'confidence_adjustments', '{"layout": 0, "flow": 0, "staffing": 0}'::jsonb,
      'custom_instructions', ''
    );
  END IF;

  -- 최근 성공 패턴 조회 (최근 5개)
  SELECT COALESCE(json_agg(pattern), '[]'::json)::jsonb INTO v_success_patterns
  FROM (
    SELECT jsonb_build_object(
      'target_type', feedback_target_type,
      'vmd_rules', vmd_rules_applied,
      'confidence', ai_confidence
    ) AS pattern
    FROM optimization_feedback
    WHERE store_id = p_store_id
      AND action = 'accept'
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- 최근 실패 패턴 조회 (최근 3개)
  SELECT COALESCE(json_agg(pattern), '[]'::json)::jsonb INTO v_failure_patterns
  FROM (
    SELECT jsonb_build_object(
      'target_type', feedback_target_type,
      'vmd_rules', vmd_rules_applied,
      'reason', reason_code
    ) AS pattern
    FROM optimization_feedback
    WHERE store_id = p_store_id
      AND action = 'reject'
    ORDER BY created_at DESC
    LIMIT 3
  ) t;

  -- 컨텍스트 구성
  v_context := jsonb_build_object(
    'has_persona', true,
    'store_style', v_persona.store_style,
    'target_demographic', v_persona.target_demographic,
    'preference_weights', v_persona.preference_weights,
    'vmd_preferences', v_persona.vmd_preferences,
    'confidence_adjustments', v_persona.confidence_adjustments,
    'feedback_stats', v_persona.feedback_stats,
    'success_patterns', v_success_patterns,
    'failure_patterns', v_failure_patterns,
    'custom_instructions', COALESCE(v_persona.learned_context->>'custom_instructions', ''),
    'learning_version', v_persona.learning_version
  );

  RETURN v_context;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS 정책
-- ============================================================================

ALTER TABLE store_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reason_codes ENABLE ROW LEVEL SECURITY;

-- store_personas RLS
CREATE POLICY "store_personas_select_all" ON store_personas
  FOR SELECT USING (true);

CREATE POLICY "store_personas_service_role" ON store_personas
  FOR ALL USING (auth.role() = 'service_role');

-- optimization_feedback RLS
CREATE POLICY "optimization_feedback_select_all" ON optimization_feedback
  FOR SELECT USING (true);

CREATE POLICY "optimization_feedback_insert_all" ON optimization_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "optimization_feedback_service_role" ON optimization_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- feedback_reason_codes RLS
CREATE POLICY "feedback_reason_codes_select_all" ON feedback_reason_codes
  FOR SELECT USING (true);

-- ============================================================================
-- 코멘트
-- ============================================================================

COMMENT ON TABLE store_personas IS '매장별 AI 학습 페르소나 - 선호도, 학습 컨텍스트, 신뢰도 조정값';
COMMENT ON TABLE optimization_feedback IS 'AI 최적화 추천에 대한 사용자 피드백 상세';
COMMENT ON TABLE feedback_reason_codes IS '피드백 사유 코드 참조 테이블';
COMMENT ON FUNCTION get_store_persona_context IS 'AI 프롬프트에 주입할 Store Persona 컨텍스트 조회';
