-- ============================================================================
-- Phase 4.2: Auto Learning System Tables
-- 자동 학습 시스템을 위한 테이블 생성
-- ============================================================================

-- 1. stored_model_parameters: 학습된 모델 파라미터 저장
CREATE TABLE IF NOT EXISTS stored_model_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  parameter_key TEXT NOT NULL,
  parameter_value NUMERIC NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('revenue', 'conversion', 'dwell_time', 'flow')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- 복합 유니크 키 (store_id + parameter_key)
  CONSTRAINT stored_model_parameters_store_key_unique UNIQUE (store_id, parameter_key)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_stored_model_parameters_store_id
  ON stored_model_parameters(store_id);
CREATE INDEX IF NOT EXISTS idx_stored_model_parameters_prediction_type
  ON stored_model_parameters(prediction_type);
CREATE INDEX IF NOT EXISTS idx_stored_model_parameters_active
  ON stored_model_parameters(store_id, is_active) WHERE is_active = true;

-- RLS 정책
ALTER TABLE stored_model_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stored_model_parameters_select_policy" ON stored_model_parameters
  FOR SELECT USING (true);

CREATE POLICY "stored_model_parameters_insert_policy" ON stored_model_parameters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "stored_model_parameters_update_policy" ON stored_model_parameters
  FOR UPDATE USING (true);

-- 코멘트
COMMENT ON TABLE stored_model_parameters IS '자동 학습 시스템의 학습된 모델 파라미터 저장';
COMMENT ON COLUMN stored_model_parameters.parameter_key IS '파라미터 경로 (예: revenue.trafficWeight)';
COMMENT ON COLUMN stored_model_parameters.parameter_value IS '파라미터 값';
COMMENT ON COLUMN stored_model_parameters.prediction_type IS '예측 타입: revenue, conversion, dwell_time, flow';
COMMENT ON COLUMN stored_model_parameters.version IS '파라미터 버전 (학습 횟수)';

-- ============================================================================

-- 2. learning_sessions: 학습 세션 기록
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  predictions_evaluated INTEGER DEFAULT 0,
  adjustments_proposed INTEGER DEFAULT 0,
  adjustments_applied INTEGER DEFAULT 0,
  improvement_metrics JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_sessions_store_id
  ON learning_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status
  ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at
  ON learning_sessions(started_at DESC);

-- RLS 정책
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_sessions_select_policy" ON learning_sessions
  FOR SELECT USING (true);

CREATE POLICY "learning_sessions_insert_policy" ON learning_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "learning_sessions_update_policy" ON learning_sessions
  FOR UPDATE USING (true);

-- 코멘트
COMMENT ON TABLE learning_sessions IS '자동 학습 세션 기록';
COMMENT ON COLUMN learning_sessions.predictions_evaluated IS '평가된 예측 수';
COMMENT ON COLUMN learning_sessions.adjustments_proposed IS '제안된 조정 수';
COMMENT ON COLUMN learning_sessions.adjustments_applied IS '적용된 조정 수';
COMMENT ON COLUMN learning_sessions.improvement_metrics IS '개선 메트릭 (before/after MAPE, RMSE, bias)';

-- ============================================================================

-- 3. learning_adjustments: 학습 조정 기록
CREATE TABLE IF NOT EXISTS learning_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('revenue', 'conversion', 'dwell_time', 'flow')),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('weight', 'bias', 'threshold', 'coefficient')),
  parameter_key TEXT NOT NULL,
  old_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  sample_size INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'applied', 'rejected', 'reverted')),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_store_id
  ON learning_adjustments(store_id);
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_session_id
  ON learning_adjustments(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_adjustments_status
  ON learning_adjustments(status);

-- RLS 정책
ALTER TABLE learning_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_adjustments_select_policy" ON learning_adjustments
  FOR SELECT USING (true);

CREATE POLICY "learning_adjustments_insert_policy" ON learning_adjustments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "learning_adjustments_update_policy" ON learning_adjustments
  FOR UPDATE USING (true);

-- 코멘트
COMMENT ON TABLE learning_adjustments IS '모델 파라미터 조정 기록';
COMMENT ON COLUMN learning_adjustments.adjustment_type IS '조정 타입: weight, bias, threshold, coefficient';
COMMENT ON COLUMN learning_adjustments.confidence IS '조정 신뢰도 (0-1)';
COMMENT ON COLUMN learning_adjustments.status IS '상태: proposed, applied, rejected, reverted';

-- ============================================================================

-- 4. prediction_records: 예측 기록 (학습 데이터용)
CREATE TABLE IF NOT EXISTS prediction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('revenue', 'conversion', 'dwell_time', 'flow')),
  predicted_value NUMERIC NOT NULL,
  actual_value NUMERIC,
  prediction_date DATE NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prediction_records_store_id
  ON prediction_records(store_id);
CREATE INDEX IF NOT EXISTS idx_prediction_records_type
  ON prediction_records(prediction_type);
CREATE INDEX IF NOT EXISTS idx_prediction_records_date
  ON prediction_records(prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_records_store_date
  ON prediction_records(store_id, prediction_date DESC);

-- RLS 정책
ALTER TABLE prediction_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prediction_records_select_policy" ON prediction_records
  FOR SELECT USING (true);

CREATE POLICY "prediction_records_insert_policy" ON prediction_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "prediction_records_update_policy" ON prediction_records
  FOR UPDATE USING (true);

-- 코멘트
COMMENT ON TABLE prediction_records IS '예측 vs 실제 결과 기록 (학습 데이터)';
COMMENT ON COLUMN prediction_records.predicted_value IS 'AI 예측값';
COMMENT ON COLUMN prediction_records.actual_value IS '실제 측정값 (나중에 업데이트)';
COMMENT ON COLUMN prediction_records.context IS '예측 당시 컨텍스트 (날씨, 이벤트 등)';

-- ============================================================================
-- 완료
-- ============================================================================
