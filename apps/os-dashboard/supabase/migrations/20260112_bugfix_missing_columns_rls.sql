-- ============================================================================
-- 버그 수정 마이그레이션
-- 작성일: 2026-01-12
-- ============================================================================

-- ============================================================================
-- 0. weather_data / holidays_events 테이블 user_id NULL 허용
-- ============================================================================

-- weather_data: user_id NULL 허용 (Edge Function에서 API 호출 시 user_id 없음)
ALTER TABLE weather_data ALTER COLUMN user_id DROP NOT NULL;

-- holidays_events: user_id NULL 허용 (글로벌 공휴일은 user_id 없음)
ALTER TABLE holidays_events ALTER COLUMN user_id DROP NOT NULL;

-- graph_entities: user_id NULL 허용
-- (weather_data 트리거가 graph_entities에 동기화 시 user_id가 NULL일 수 있음)
ALTER TABLE graph_entities ALTER COLUMN user_id DROP NOT NULL;

-- ontology_relation_inference_queue: user_id NULL 허용
-- (graph_entities INSERT 시 queue_relation_inference 트리거가 실행됨)
ALTER TABLE ontology_relation_inference_queue ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================================
-- 1. layout_optimization_results 테이블에 누락된 컬럼 추가
-- ============================================================================

-- parameters 컬럼 추가 (최적화 파라미터 저장)
ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN layout_optimization_results.parameters IS '최적화 요청 파라미터';

-- feedback 관련 컬럼 추가
ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS feedback_action TEXT CHECK (feedback_action IN ('accept', 'reject', 'modify'));

ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS feedback_reason TEXT;

ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS feedback_note TEXT;

ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS applied_changes JSONB DEFAULT '[]'::jsonb;

-- summary 컬럼 추가 (AI 응답 요약)
ALTER TABLE layout_optimization_results
ADD COLUMN IF NOT EXISTS summary JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN layout_optimization_results.summary IS 'AI 최적화 응답 요약 (vmd_rules, store_persona 등)';

-- status 값 확장 (pending, partial 추가)
ALTER TABLE layout_optimization_results
DROP CONSTRAINT IF EXISTS layout_optimization_results_status_check;

ALTER TABLE layout_optimization_results
ADD CONSTRAINT layout_optimization_results_status_check
CHECK (status IN ('pending', 'generated', 'reviewing', 'approved', 'applied', 'rejected', 'partial'));

-- ============================================================================
-- 2. ai_response_logs 테이블에 누락된 컬럼 추가
-- ============================================================================

-- parse_attempts 컬럼 추가 (JSON 파싱 시도 횟수)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS parse_attempts INTEGER DEFAULT 1;

COMMENT ON COLUMN ai_response_logs.parse_attempts IS 'JSON 파싱 시도 횟수';

-- parse_success 컬럼 추가 (파싱 성공 여부)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS parse_success BOOLEAN DEFAULT true;

COMMENT ON COLUMN ai_response_logs.parse_success IS 'JSON 파싱 성공 여부';

-- error_message 컬럼 추가 (에러 메시지)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN ai_response_logs.error_message IS '에러 발생 시 메시지';

-- raw_response_length 컬럼 추가 (원본 응답 길이)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS raw_response_length INTEGER;

COMMENT ON COLUMN ai_response_logs.raw_response_length IS 'AI 원본 응답 문자열 길이';

-- used_fallback 컬럼 추가 (폴백 사용 여부)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;

COMMENT ON COLUMN ai_response_logs.used_fallback IS 'AI 응답 실패 시 폴백 사용 여부';

-- ============================================================================
-- 3. learning_sessions RLS 정책 수정 (service_role 허용)
-- ============================================================================

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "learning_sessions_insert_policy" ON learning_sessions;
DROP POLICY IF EXISTS "learning_sessions_select_policy" ON learning_sessions;
DROP POLICY IF EXISTS "learning_sessions_update_policy" ON learning_sessions;
DROP POLICY IF EXISTS "learning_sessions_all_policy" ON learning_sessions;

-- 모든 작업 허용 (Edge Function은 service_role 사용)
CREATE POLICY "learning_sessions_all_policy" ON learning_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. learning_adjustments RLS 정책 수정 (service_role 허용)
-- ============================================================================

DROP POLICY IF EXISTS "learning_adjustments_insert_policy" ON learning_adjustments;
DROP POLICY IF EXISTS "learning_adjustments_select_policy" ON learning_adjustments;
DROP POLICY IF EXISTS "learning_adjustments_update_policy" ON learning_adjustments;
DROP POLICY IF EXISTS "learning_adjustments_all_policy" ON learning_adjustments;

CREATE POLICY "learning_adjustments_all_policy" ON learning_adjustments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. stored_model_parameters RLS 정책 수정 (service_role 허용)
-- ============================================================================

DROP POLICY IF EXISTS "stored_model_parameters_insert_policy" ON stored_model_parameters;
DROP POLICY IF EXISTS "stored_model_parameters_select_policy" ON stored_model_parameters;
DROP POLICY IF EXISTS "stored_model_parameters_update_policy" ON stored_model_parameters;
DROP POLICY IF EXISTS "stored_model_parameters_all_policy" ON stored_model_parameters;

CREATE POLICY "stored_model_parameters_all_policy" ON stored_model_parameters
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. prediction_records RLS 정책 수정 (service_role 허용)
-- ============================================================================

DROP POLICY IF EXISTS "prediction_records_insert_policy" ON prediction_records;
DROP POLICY IF EXISTS "prediction_records_select_policy" ON prediction_records;
DROP POLICY IF EXISTS "prediction_records_update_policy" ON prediction_records;
DROP POLICY IF EXISTS "prediction_records_all_policy" ON prediction_records;

CREATE POLICY "prediction_records_all_policy" ON prediction_records
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 완료
-- ============================================================================
