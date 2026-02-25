-- ============================================================================
-- AI 배치 QA 테스트 결과 테이블
--
-- 목적: AI 시뮬레이션/최적화 함수의 모든 변수 조합을 자동으로 테스트하고
-- 파인튜닝용 데이터셋 품질을 검증
-- ============================================================================

-- 1. 배치 테스트 결과 테이블 생성
CREATE TABLE IF NOT EXISTS ai_batch_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 테스트 분류
  test_type TEXT NOT NULL CHECK (test_type IN ('simulation', 'optimization', 'linked')),
  test_batch_id UUID NOT NULL,  -- 배치 실행 그룹 ID

  -- 입력 조합 정보
  combination_id TEXT,  -- 예: 'christmas_morning_100'
  combination_variables JSONB NOT NULL DEFAULT '{}',  -- 테스트 변수 조합

  -- 호출 정보
  function_name TEXT NOT NULL,  -- 'run-simulation', 'generate-optimization'
  request_body JSONB NOT NULL DEFAULT '{}',

  -- 결과
  success BOOLEAN NOT NULL DEFAULT false,
  response_data JSONB,  -- 성공 시 응답 데이터
  error_message TEXT,   -- 실패 시 에러 메시지

  -- 품질 지표 (자동 계산)
  execution_time_ms INTEGER,
  response_quality_score INTEGER CHECK (response_quality_score BETWEEN 0 AND 100),

  -- 연결 테스트용 (simulation → optimization)
  linked_simulation_id UUID REFERENCES ai_batch_test_results(id) ON DELETE SET NULL,
  diagnostic_issues_passed JSONB,  -- 시뮬레이션에서 전달된 진단 이슈

  -- 응답 상세 지표 (품질 분석용)
  response_metrics JSONB DEFAULT '{}',  -- { kpis_count, insights_count, changes_count, etc. }

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
-- 배치 ID 기반 조회
CREATE INDEX IF NOT EXISTS idx_batch_test_results_batch_id
  ON ai_batch_test_results(test_batch_id);

-- 테스트 타입 + 성공 여부 조회
CREATE INDEX IF NOT EXISTS idx_batch_test_results_type_success
  ON ai_batch_test_results(test_type, success);

-- 함수명 + 생성일 조회
CREATE INDEX IF NOT EXISTS idx_batch_test_results_function_created
  ON ai_batch_test_results(function_name, created_at DESC);

-- 품질 점수 기반 조회
CREATE INDEX IF NOT EXISTS idx_batch_test_results_quality
  ON ai_batch_test_results(response_quality_score)
  WHERE response_quality_score IS NOT NULL;

-- 연결 테스트 조회
CREATE INDEX IF NOT EXISTS idx_batch_test_results_linked
  ON ai_batch_test_results(linked_simulation_id)
  WHERE linked_simulation_id IS NOT NULL;

-- 3. RLS 비활성화 (Edge Function에서만 접근)
-- 이 테이블은 service_role 키로만 접근하므로 RLS 불필요
ALTER TABLE ai_batch_test_results DISABLE ROW LEVEL SECURITY;

-- 4. 배치 요약 뷰
CREATE OR REPLACE VIEW v_batch_test_summary AS
SELECT
  test_batch_id,
  test_type,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE success) as success_count,
  COUNT(*) FILTER (WHERE NOT success) as failure_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success) / NULLIF(COUNT(*), 0), 1) as success_rate,
  ROUND(AVG(execution_time_ms)) as avg_time_ms,
  MIN(execution_time_ms) as min_time_ms,
  MAX(execution_time_ms) as max_time_ms,
  ROUND(AVG(response_quality_score), 1) as avg_quality_score,
  MIN(created_at) as started_at,
  MAX(created_at) as completed_at
FROM ai_batch_test_results
GROUP BY test_batch_id, test_type
ORDER BY MAX(created_at) DESC;

COMMENT ON VIEW v_batch_test_summary IS '배치 테스트 요약 뷰';

-- 5. 실패 분석 뷰
CREATE OR REPLACE VIEW v_batch_test_failures AS
SELECT
  test_batch_id,
  test_type,
  combination_id,
  function_name,
  combination_variables,
  error_message,
  execution_time_ms,
  created_at
FROM ai_batch_test_results
WHERE NOT success
ORDER BY created_at DESC;

COMMENT ON VIEW v_batch_test_failures IS '배치 테스트 실패 케이스 뷰';

-- 6. 시나리오별 성공률 뷰
CREATE OR REPLACE VIEW v_batch_test_scenario_stats AS
SELECT
  test_batch_id,
  test_type,
  combination_variables->>'preset_scenario' as preset_scenario,
  combination_variables->>'optimization_type' as optimization_type,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE success) as success_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success) / NULLIF(COUNT(*), 0), 1) as success_rate,
  ROUND(AVG(response_quality_score), 1) as avg_quality
FROM ai_batch_test_results
GROUP BY
  test_batch_id,
  test_type,
  combination_variables->>'preset_scenario',
  combination_variables->>'optimization_type'
HAVING COUNT(*) > 0
ORDER BY MAX(created_at) DESC, preset_scenario, optimization_type;

COMMENT ON VIEW v_batch_test_scenario_stats IS '시나리오별 테스트 통계 뷰';

-- 7. 연결 테스트 분석 뷰
CREATE OR REPLACE VIEW v_batch_test_linked_analysis AS
SELECT
  sim.test_batch_id,
  sim.combination_id as simulation_combination,
  opt.combination_id as optimization_combination,
  sim.success as simulation_success,
  opt.success as optimization_success,
  sim.success AND opt.success as both_success,
  sim.response_quality_score as simulation_quality,
  opt.response_quality_score as optimization_quality,
  opt.diagnostic_issues_passed->>'issue_count' as issues_passed,
  sim.execution_time_ms as simulation_time_ms,
  opt.execution_time_ms as optimization_time_ms,
  sim.created_at
FROM ai_batch_test_results sim
JOIN ai_batch_test_results opt ON opt.linked_simulation_id = sim.id
WHERE sim.test_type = 'simulation'
  AND opt.test_type = 'linked'
ORDER BY sim.created_at DESC;

COMMENT ON VIEW v_batch_test_linked_analysis IS '연결 테스트 (시뮬레이션→최적화) 분석 뷰';

-- 8. 코멘트 추가
COMMENT ON TABLE ai_batch_test_results IS 'AI 배치 QA 테스트 결과 (자동화된 변수 조합 테스트)';

COMMENT ON COLUMN ai_batch_test_results.test_type IS '테스트 유형: simulation, optimization, linked';
COMMENT ON COLUMN ai_batch_test_results.test_batch_id IS '배치 실행 그룹 ID (같은 배치 실행에서 생성된 결과들)';
COMMENT ON COLUMN ai_batch_test_results.combination_id IS '변수 조합 식별자 (예: christmas_morning_100)';
COMMENT ON COLUMN ai_batch_test_results.combination_variables IS '테스트 변수 조합 (프리셋, 날씨, 시간대 등)';
COMMENT ON COLUMN ai_batch_test_results.response_quality_score IS '자동 계산된 응답 품질 점수 (0-100)';
COMMENT ON COLUMN ai_batch_test_results.linked_simulation_id IS '연결 테스트 시 원본 시뮬레이션 결과 ID';
COMMENT ON COLUMN ai_batch_test_results.diagnostic_issues_passed IS '시뮬레이션에서 최적화로 전달된 진단 이슈';
COMMENT ON COLUMN ai_batch_test_results.response_metrics IS '응답 상세 지표 (KPI 수, 인사이트 수, 변경 수 등)';

-- 9. 오래된 테스트 결과 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_batch_test_results(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_batch_test_results
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_batch_test_results IS '오래된 배치 테스트 결과 정리 (기본 30일 보존)';
