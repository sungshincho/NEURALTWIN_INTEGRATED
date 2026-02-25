-- ============================================================================
-- Continuous Learning 테이블 마이그레이션
-- NEURALTWIN 핵심 가치 루프: 데이터 분석 → 시뮬레이션 → ROI → Continuous Learning
-- ============================================================================

-- ============================================================================
-- 1. strategy_feedback (전략 피드백 테이블)
-- 목적: AI 추천 → 적용 → 결과 측정 → 학습 데이터 축적
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- 전략 정보
  strategy_id UUID REFERENCES applied_strategies(id) ON DELETE SET NULL,
  strategy_type VARCHAR(50) NOT NULL,
  -- 가능한 값: 'layout', 'pricing', 'inventory', 'promotion', 'demand', 'flow', 'congestion', 'staffing'

  -- AI 추천 스냅샷 (원본 보존)
  ai_recommendation JSONB NOT NULL,
  -- 예: { "type": "layout", "changes": [...], "expectedROI": 15, "confidence": 72 }

  -- 적용 여부
  was_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,

  -- 결과 측정 상태
  result_measured BOOLEAN DEFAULT FALSE,
  measurement_period_days INTEGER DEFAULT 14,
  measurement_start_date DATE,
  measurement_end_date DATE,

  -- 적용 전 기준 메트릭
  baseline_metrics JSONB,
  -- 예: { "revenue": 3200000, "visitors": 120, "conversion": 14.2, "avg_transaction": 89000 }

  -- 적용 후 실제 메트릭
  actual_metrics JSONB,
  -- 예: { "revenue": 3680000, "visitors": 138, "conversion": 16.1, "avg_transaction": 91000 }

  -- ROI 계산 결과
  expected_roi DECIMAL(10,2),
  actual_roi DECIMAL(10,2),
  roi_accuracy DECIMAL(5,2), -- 예측 정확도 (%) = 100 - |actual - expected| / expected * 100

  -- 피드백 분류
  feedback_type VARCHAR(20),
  -- 'success': 실제 ROI >= 예상 ROI * 0.8
  -- 'partial': 실제 ROI 50-80% 예상 ROI
  -- 'failure': 실제 ROI < 50% 예상 ROI
  -- 'negative': 실제 ROI < 0

  -- AI 학습용 메타데이터
  learnings JSONB,
  -- 예: {
  --   "success_factors": ["weekend_boost", "seasonal_trend"],
  --   "failure_factors": ["weather_impact", "competitor_promo"],
  --   "adjustments": { "confidence_modifier": 0.05, "roi_adjustment": -2 },
  --   "context": { "day_of_week": "saturday", "weather": "sunny", "events": ["holiday"] }
  -- }

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_store ON strategy_feedback(store_id);
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_org ON strategy_feedback(org_id);
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_type ON strategy_feedback(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_result ON strategy_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_created ON strategy_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_feedback_measured ON strategy_feedback(result_measured) WHERE result_measured = TRUE;

-- ============================================================================
-- 2. ai_model_performance (AI 모델 성능 추적 테이블)
-- 목적: 기간별 AI 모델 성능 집계 및 신뢰도 조정 근거 제공
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL이면 org 전체

  -- 모델 정보
  model_type VARCHAR(50) NOT NULL,
  -- 가능한 값: 'layout_simulation', 'demand_forecast', 'pricing_optimization',
  -- 'inventory_optimization', 'flow_optimization', 'congestion_simulation', 'staffing_optimization'

  -- 집계 기간
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 성능 지표
  total_predictions INTEGER DEFAULT 0,     -- 총 예측 수
  applied_count INTEGER DEFAULT 0,          -- 적용된 수
  success_count INTEGER DEFAULT 0,          -- 성공 (feedback_type = 'success')
  partial_count INTEGER DEFAULT 0,          -- 부분 성공
  failure_count INTEGER DEFAULT 0,          -- 실패

  -- 정확도 지표
  avg_confidence DECIMAL(5,2),             -- 평균 예측 신뢰도
  avg_actual_roi DECIMAL(10,2),            -- 평균 실제 ROI
  avg_predicted_roi DECIMAL(10,2),         -- 평균 예측 ROI
  prediction_accuracy DECIMAL(5,2),        -- MAPE 기반 정확도 (100 - MAPE)

  -- 학습 조정값
  confidence_adjustment DECIMAL(5,2) DEFAULT 0,
  -- 양수: 신뢰도 상향 필요 (과소 예측), 음수: 신뢰도 하향 필요 (과대 예측)

  roi_adjustment DECIMAL(5,2) DEFAULT 0,
  -- ROI 예측 조정값 (실제 ROI가 예측보다 높으면 양수)

  -- 프롬프트 개선 사항
  prompt_adjustments JSONB,
  -- 예: {
  --   "add_context": ["weekend_pattern", "seasonal_adjustment"],
  --   "remove_context": ["obsolete_rule"],
  --   "emphasis": ["foot_traffic_correlation"],
  --   "reduce_weight": ["historical_avg"]
  -- }

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_org ON ai_model_performance(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_store ON ai_model_performance(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_type ON ai_model_performance(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_period ON ai_model_performance(period_start, period_end);

-- ============================================================================
-- 3. learning_adjustments (학습 조정 이력 테이블)
-- 목적: 모든 학습 조정 내역 기록 (감사/롤백용)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- 조정 대상
  model_type VARCHAR(50) NOT NULL,
  adjustment_type VARCHAR(30) NOT NULL,
  -- 가능한 값: 'confidence_weight', 'prompt_context', 'threshold', 'rule_priority', 'roi_calibration'

  -- 조정 내용
  previous_value JSONB,
  new_value JSONB,

  -- 조정 근거
  trigger_reason VARCHAR(100),
  -- 가능한 값: 'low_accuracy', 'high_success_rate', 'user_feedback', 'seasonal_pattern',
  -- 'consistent_over_prediction', 'consistent_under_prediction', 'manual_override'

  supporting_data JSONB,
  -- 조정 결정에 사용된 데이터
  -- 예: { "sample_size": 20, "success_rate": 0.85, "avg_roi_diff": 3.2, "period": "2024-01-01~2024-01-31" }

  -- 적용
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by VARCHAR(20) DEFAULT 'system',
  -- 가능한 값: 'system' (자동), 'admin' (관리자), 'user' (사용자 피드백)

  -- 효과 측정
  effectiveness_measured BOOLEAN DEFAULT FALSE,
  effectiveness_score DECIMAL(5,2),
  -- 조정 후 정확도 개선 정도 (%)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_org ON learning_adjustments(org_id);
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_model ON learning_adjustments(model_type);
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_type ON learning_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_created ON learning_adjustments(created_at DESC);

-- ============================================================================
-- RLS 정책 설정
-- ============================================================================

-- strategy_feedback RLS
ALTER TABLE strategy_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org feedback"
ON strategy_feedback FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org feedback"
ON strategy_feedback FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org feedback"
ON strategy_feedback FOR UPDATE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all feedback"
ON strategy_feedback FOR ALL
USING (auth.role() = 'service_role');

-- ai_model_performance RLS
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org model performance"
ON ai_model_performance FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all model performance"
ON ai_model_performance FOR ALL
USING (auth.role() = 'service_role');

-- learning_adjustments RLS
ALTER TABLE learning_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org adjustments"
ON learning_adjustments FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all adjustments"
ON learning_adjustments FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- Updated At 트리거
-- ============================================================================

CREATE OR REPLACE FUNCTION update_strategy_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_strategy_feedback_updated_at
BEFORE UPDATE ON strategy_feedback
FOR EACH ROW
EXECUTE FUNCTION update_strategy_feedback_updated_at();

-- ============================================================================
-- RPC 함수: AI 모델 성능 집계
-- ============================================================================

CREATE OR REPLACE FUNCTION aggregate_ai_performance(
  p_org_id UUID,
  p_store_id UUID DEFAULT NULL,
  p_model_type VARCHAR DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  result JSON;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- 기본값: 최근 90일
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '90 days');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  SELECT json_build_object(
    'totalPredictions', COUNT(*),
    'appliedCount', COUNT(*) FILTER (WHERE was_applied),
    'measuredCount', COUNT(*) FILTER (WHERE result_measured),
    'successCount', COUNT(*) FILTER (WHERE feedback_type = 'success'),
    'partialCount', COUNT(*) FILTER (WHERE feedback_type = 'partial'),
    'failureCount', COUNT(*) FILTER (WHERE feedback_type IN ('failure', 'negative')),
    'successRate', CASE
      WHEN COUNT(*) FILTER (WHERE result_measured) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC /
           COUNT(*) FILTER (WHERE result_measured) * 100, 1)
      ELSE 0
    END,
    'applyRate', CASE
      WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE was_applied)::NUMERIC / COUNT(*) * 100, 1)
      ELSE 0
    END,
    'avgConfidence', ROUND(AVG((ai_recommendation->>'confidence')::NUMERIC), 1),
    'avgActualROI', ROUND(AVG(actual_roi), 1),
    'avgPredictedROI', ROUND(AVG(expected_roi), 1),
    'predictionAccuracy', CASE
      WHEN COUNT(*) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL AND expected_roi != 0) > 0
      THEN ROUND(100 - AVG(ABS(actual_roi - expected_roi) / NULLIF(ABS(expected_roi), 0) * 100) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL AND expected_roi != 0), 1)
      ELSE NULL
    END,
    'confidenceAdjustment', CASE
      WHEN COUNT(*) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL) >= 5
      THEN ROUND(AVG(actual_roi - expected_roi) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL) / 10, 2)
      ELSE 0
    END,
    'periodStart', v_start_date,
    'periodEnd', v_end_date,
    'byType', (
      SELECT COALESCE(json_object_agg(strategy_type, type_stats), '{}'::json)
      FROM (
        SELECT
          strategy_type,
          json_build_object(
            'count', COUNT(*),
            'successRate', CASE
              WHEN COUNT(*) FILTER (WHERE result_measured) > 0
              THEN ROUND(COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC /
                   COUNT(*) FILTER (WHERE result_measured) * 100, 1)
              ELSE 0
            END,
            'avgROI', ROUND(AVG(actual_roi), 1)
          ) as type_stats
        FROM strategy_feedback sf2
        WHERE sf2.org_id = p_org_id
          AND (p_store_id IS NULL OR sf2.store_id = p_store_id)
          AND sf2.created_at BETWEEN v_start_date AND v_end_date + INTERVAL '1 day'
        GROUP BY strategy_type
      ) type_agg
    )
  ) INTO result
  FROM strategy_feedback
  WHERE org_id = p_org_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND (p_model_type IS NULL OR strategy_type = p_model_type)
    AND created_at BETWEEN v_start_date AND v_end_date + INTERVAL '1 day';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC 함수: 과거 성공 패턴 조회 (AI 프롬프트용)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_success_patterns(
  p_store_id UUID,
  p_strategy_type VARCHAR,
  p_limit INTEGER DEFAULT 5
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(pattern_data), '[]'::json) INTO result
  FROM (
    SELECT
      json_build_object(
        'id', id,
        'recommendation', ai_recommendation,
        'actualROI', actual_roi,
        'expectedROI', expected_roi,
        'accuracy', roi_accuracy,
        'learnings', learnings,
        'baselineMetrics', baseline_metrics,
        'actualMetrics', actual_metrics,
        'appliedAt', applied_at
      ) as pattern_data
    FROM strategy_feedback
    WHERE store_id = p_store_id
      AND strategy_type = p_strategy_type
      AND feedback_type = 'success'
      AND result_measured = TRUE
    ORDER BY actual_roi DESC, created_at DESC
    LIMIT p_limit
  ) success_patterns;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC 함수: 실패 패턴 조회 (AI가 피해야 할 패턴)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_failure_patterns(
  p_store_id UUID,
  p_strategy_type VARCHAR,
  p_limit INTEGER DEFAULT 3
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(pattern_data), '[]'::json) INTO result
  FROM (
    SELECT
      json_build_object(
        'id', id,
        'recommendation', ai_recommendation,
        'actualROI', actual_roi,
        'expectedROI', expected_roi,
        'learnings', learnings,
        'appliedAt', applied_at
      ) as pattern_data
    FROM strategy_feedback
    WHERE store_id = p_store_id
      AND strategy_type = p_strategy_type
      AND feedback_type IN ('failure', 'negative')
      AND result_measured = TRUE
    ORDER BY created_at DESC
    LIMIT p_limit
  ) failure_patterns;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC 함수: 신뢰도 조정값 계산
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_confidence_adjustment(
  p_store_id UUID,
  p_strategy_type VARCHAR,
  p_days INTEGER DEFAULT 90
) RETURNS JSON AS $$
DECLARE
  result JSON;
  v_sample_size INTEGER;
  v_success_rate NUMERIC;
  v_avg_diff NUMERIC;
  v_adjustment NUMERIC;
BEGIN
  SELECT
    COUNT(*),
    CASE WHEN COUNT(*) FILTER (WHERE result_measured) > 0
         THEN COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC / COUNT(*) FILTER (WHERE result_measured)
         ELSE 0 END,
    AVG(actual_roi - expected_roi) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL)
  INTO v_sample_size, v_success_rate, v_avg_diff
  FROM strategy_feedback
  WHERE store_id = p_store_id
    AND strategy_type = p_strategy_type
    AND result_measured = TRUE
    AND created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;

  -- 조정값 계산:
  -- 성공률 높으면 신뢰도 상향 (최대 +10)
  -- ROI 예측 오차 반영 (오차의 10%를 조정값으로)
  v_adjustment := 0;

  IF v_sample_size >= 5 THEN
    -- 성공률 기반 조정
    IF v_success_rate >= 0.8 THEN
      v_adjustment := v_adjustment + 5;
    ELSIF v_success_rate >= 0.6 THEN
      v_adjustment := v_adjustment + 2;
    ELSIF v_success_rate < 0.4 THEN
      v_adjustment := v_adjustment - 5;
    END IF;

    -- ROI 오차 기반 조정
    IF v_avg_diff IS NOT NULL THEN
      v_adjustment := v_adjustment + LEAST(GREATEST(v_avg_diff / 10, -5), 5);
    END IF;
  END IF;

  SELECT json_build_object(
    'sampleSize', v_sample_size,
    'successRate', ROUND(v_success_rate * 100, 1),
    'avgROIDifference', ROUND(v_avg_diff, 1),
    'recommendedAdjustment', ROUND(v_adjustment, 1),
    'hasEnoughData', v_sample_size >= 5
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 코멘트 추가
-- ============================================================================

COMMENT ON TABLE strategy_feedback IS 'AI 전략 추천에 대한 피드백 저장 - Continuous Learning의 핵심 데이터';
COMMENT ON TABLE ai_model_performance IS 'AI 모델의 기간별 성능 집계 - 신뢰도 조정 근거';
COMMENT ON TABLE learning_adjustments IS '학습 조정 이력 - 감사 및 롤백용';

COMMENT ON FUNCTION aggregate_ai_performance IS 'AI 모델 성능 통계를 집계하여 반환';
COMMENT ON FUNCTION get_success_patterns IS 'AI 프롬프트에 포함할 성공 패턴 조회';
COMMENT ON FUNCTION get_failure_patterns IS 'AI가 피해야 할 실패 패턴 조회';
COMMENT ON FUNCTION calculate_confidence_adjustment IS '과거 성과 기반 신뢰도 조정값 계산';
