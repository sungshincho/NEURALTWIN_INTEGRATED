-- ============================================================================
-- AI 응답 로깅 및 파인튜닝 데이터셋 시스템
--
-- 목적: AI 시뮬레이션/최적화 응답을 자동으로 기록하여 파인튜닝용 학습 데이터 수집
-- 대상: generate-optimization, advanced-ai-inference Edge Functions
-- ============================================================================

-- 1. ai_response_logs 테이블 생성
CREATE TABLE IF NOT EXISTS ai_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 식별 정보
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 함수 및 시뮬레이션 정보
  function_name TEXT NOT NULL,  -- 'generate-optimization', 'advanced-ai-inference' 등
  simulation_type TEXT NOT NULL, -- 'layout', 'flow', 'congestion', 'staffing', 'ultimate' 등

  -- 입력 및 응답 데이터 (파인튜닝 핵심 데이터)
  input_variables JSONB NOT NULL DEFAULT '{}',  -- 입력 조건 전체
  ai_response JSONB NOT NULL DEFAULT '{}',      -- AI 응답 전체

  -- 요약 데이터 (빠른 조회용)
  response_summary JSONB DEFAULT '{}',  -- 주요 지표 요약

  -- 품질 평가 (수동)
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),  -- 1-5점 평가
  quality_notes TEXT,  -- 평가 메모
  is_good_example BOOLEAN DEFAULT false,  -- 파인튜닝용 좋은 예시 마킹

  -- 메타데이터
  execution_time_ms INTEGER,  -- 실행 시간
  model_used TEXT,  -- 사용된 AI 모델 (예: 'gemini-2.5-flash')
  prompt_tokens INTEGER,  -- 프롬프트 토큰 수 (추정)
  completion_tokens INTEGER,  -- 응답 토큰 수 (추정)

  -- 컨텍스트 메타데이터 (입력 크기 요약)
  context_metadata JSONB DEFAULT '{}',  -- 가구 수, 상품 수, 존 수 등

  -- 에러 정보
  had_error BOOLEAN DEFAULT false,
  error_message TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
-- store_id 기반 조회
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_store_id
  ON ai_response_logs(store_id);

-- function_name 기반 조회
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_function_name
  ON ai_response_logs(function_name);

-- simulation_type 기반 조회
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_simulation_type
  ON ai_response_logs(simulation_type);

-- 생성일 기반 조회 (최신순)
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_created_at
  ON ai_response_logs(created_at DESC);

-- 복합 인덱스: 매장 + 함수명 + 생성일
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_store_function_created
  ON ai_response_logs(store_id, function_name, created_at DESC);

-- 복합 인덱스: 매장 + 시뮬레이션 유형 + 생성일
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_store_type_created
  ON ai_response_logs(store_id, simulation_type, created_at DESC);

-- 파인튜닝용 좋은 예시 조회
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_good_examples
  ON ai_response_logs(is_good_example, quality_score)
  WHERE is_good_example = true;

-- 품질 점수 기반 조회
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_quality
  ON ai_response_logs(quality_score)
  WHERE quality_score IS NOT NULL;

-- 3. RLS 활성화
ALTER TABLE ai_response_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 기존 정책 삭제 (있으면)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own store logs" ON ai_response_logs;
  DROP POLICY IF EXISTS "Users can insert own store logs" ON ai_response_logs;
  DROP POLICY IF EXISTS "Users can update own store logs" ON ai_response_logs;
  DROP POLICY IF EXISTS "Service role can manage all logs" ON ai_response_logs;
END $$;

-- 매장 소속 사용자 조회 권한
CREATE POLICY "Users can view own store logs"
  ON ai_response_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN organization_members om ON om.org_id = s.org_id
      WHERE s.id = ai_response_logs.store_id
      AND om.user_id = auth.uid()
    )
  );

-- 매장 소속 사용자 삽입 권한
CREATE POLICY "Users can insert own store logs"
  ON ai_response_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN organization_members om ON om.org_id = s.org_id
      WHERE s.id = ai_response_logs.store_id
      AND om.user_id = auth.uid()
    )
  );

-- 매장 소속 사용자 업데이트 권한 (품질 평가용)
CREATE POLICY "Users can update own store logs"
  ON ai_response_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN organization_members om ON om.org_id = s.org_id
      WHERE s.id = ai_response_logs.store_id
      AND om.user_id = auth.uid()
    )
  );

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ai_response_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_response_logs_updated_at ON ai_response_logs;
CREATE TRIGGER trigger_ai_response_logs_updated_at
  BEFORE UPDATE ON ai_response_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_response_logs_updated_at();

-- 6. 코멘트 추가
COMMENT ON TABLE ai_response_logs IS 'AI 시뮬레이션/최적화 응답 로깅 (파인튜닝 학습 데이터 수집용)';

COMMENT ON COLUMN ai_response_logs.function_name IS 'Edge Function 이름 (generate-optimization, advanced-ai-inference 등)';
COMMENT ON COLUMN ai_response_logs.simulation_type IS '시뮬레이션 유형 (layout, flow, congestion, staffing, ultimate 등)';
COMMENT ON COLUMN ai_response_logs.input_variables IS '입력 조건 전체 (가구, 상품, 동선, 환경 등)';
COMMENT ON COLUMN ai_response_logs.ai_response IS 'AI 응답 전체 (파인튜닝 타겟 데이터)';
COMMENT ON COLUMN ai_response_logs.response_summary IS '주요 지표 요약 (빠른 조회용)';
COMMENT ON COLUMN ai_response_logs.quality_score IS '수동 품질 평가 (1-5점)';
COMMENT ON COLUMN ai_response_logs.quality_notes IS '품질 평가 메모';
COMMENT ON COLUMN ai_response_logs.is_good_example IS '파인튜닝용 좋은 예시 마킹';
COMMENT ON COLUMN ai_response_logs.execution_time_ms IS '함수 실행 시간 (밀리초)';
COMMENT ON COLUMN ai_response_logs.context_metadata IS '입력 컨텍스트 메타데이터 (가구 수, 상품 수 등)';

-- 7. 헬퍼 뷰: 파인튜닝 데이터셋 추출용
CREATE OR REPLACE VIEW v_finetuning_dataset AS
SELECT
  id,
  store_id,
  function_name,
  simulation_type,
  input_variables,
  ai_response,
  quality_score,
  quality_notes,
  context_metadata,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE is_good_example = true
  AND quality_score >= 4
  AND had_error = false
ORDER BY created_at DESC;

COMMENT ON VIEW v_finetuning_dataset IS '파인튜닝용 고품질 데이터셋 추출 뷰';

-- 8. 통계 뷰: 함수별/유형별 통계
CREATE OR REPLACE VIEW v_ai_response_stats AS
SELECT
  function_name,
  simulation_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE quality_score IS NOT NULL) as rated_count,
  AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
  COUNT(*) FILTER (WHERE is_good_example = true) as good_example_count,
  AVG(execution_time_ms) as avg_execution_time_ms,
  COUNT(*) FILTER (WHERE had_error = true) as error_count,
  MIN(created_at) as first_log_at,
  MAX(created_at) as last_log_at
FROM ai_response_logs
GROUP BY function_name, simulation_type
ORDER BY function_name, simulation_type;

COMMENT ON VIEW v_ai_response_stats IS 'AI 응답 로그 통계 뷰';

-- 9. 서비스 역할을 위한 추가 정책 (Edge Function에서 사용)
-- Note: Edge Function은 service_role 키를 사용하므로 RLS 우회됨
-- 하지만 명시적으로 정책을 추가하면 관리가 더 쉬움

-- 10. 데이터 보존 정책용 함수 (선택적 - 오래된 로그 정리)
CREATE OR REPLACE FUNCTION cleanup_old_ai_response_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 좋은 예시는 보존, 평가되지 않은 오래된 로그만 삭제
  DELETE FROM ai_response_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND is_good_example = false
    AND quality_score IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_ai_response_logs IS '오래된 미평가 로그 정리 (좋은 예시는 보존)';
