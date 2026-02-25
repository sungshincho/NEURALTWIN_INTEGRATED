-- ============================================================================
-- Sprint 0 Task S0-5: AI 응답 파싱 성공률 추적
-- 작성일: 2026-01-12
-- ============================================================================

-- ai_response_logs 테이블에 파싱 성공률 추적 컬럼 추가
-- 기존 테이블이 있다고 가정하고 ALTER TABLE 사용

-- 파싱 성공 여부
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS parse_success BOOLEAN DEFAULT true;

-- 폴백 데이터 사용 여부
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;

-- 파싱 시도 내역 (JSON 배열)
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS parse_attempts JSONB DEFAULT NULL;

-- 원본 응답 길이
ALTER TABLE ai_response_logs
ADD COLUMN IF NOT EXISTS raw_response_length INTEGER DEFAULT NULL;

-- 인덱스 추가 (성공률 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_parse_success
ON ai_response_logs (parse_success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_response_logs_used_fallback
ON ai_response_logs (used_fallback, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_response_logs_function_parse
ON ai_response_logs (function_name, parse_success, used_fallback);

-- 함수별 파싱 성공률 뷰 생성
CREATE OR REPLACE VIEW v_ai_parse_success_stats AS
SELECT
    function_name,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE parse_success = true AND used_fallback = false) as success_count,
    COUNT(*) FILTER (WHERE parse_success = false) as failure_count,
    COUNT(*) FILTER (WHERE used_fallback = true) as fallback_count,
    ROUND(
        (COUNT(*) FILTER (WHERE parse_success = true AND used_fallback = false)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100), 2
    ) as success_rate,
    ROUND(
        (COUNT(*) FILTER (WHERE used_fallback = true)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100), 2
    ) as fallback_rate,
    ROUND(AVG(execution_time_ms)::NUMERIC, 0) as avg_response_time_ms,
    MAX(created_at) as last_request_at
FROM ai_response_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY function_name
ORDER BY total_requests DESC;

-- 일별 파싱 성공률 뷰 생성
CREATE OR REPLACE VIEW v_ai_parse_success_daily AS
SELECT
    DATE(created_at) as date,
    function_name,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE parse_success = true AND used_fallback = false) as success_count,
    COUNT(*) FILTER (WHERE used_fallback = true) as fallback_count,
    ROUND(
        (COUNT(*) FILTER (WHERE parse_success = true AND used_fallback = false)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100), 2
    ) as success_rate
FROM ai_response_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), function_name
ORDER BY date DESC, function_name;

-- 코멘트 추가
COMMENT ON COLUMN ai_response_logs.parse_success IS 'AI 응답 JSON 파싱 성공 여부';
COMMENT ON COLUMN ai_response_logs.used_fallback IS '파싱 실패로 인한 폴백 데이터 사용 여부';
COMMENT ON COLUMN ai_response_logs.parse_attempts IS 'safeJsonParse의 파싱 시도 내역 (method, success, error)';
COMMENT ON COLUMN ai_response_logs.raw_response_length IS 'AI 원본 응답 문자열 길이';

COMMENT ON VIEW v_ai_parse_success_stats IS 'AI 응답 파싱 성공률 통계 (최근 7일)';
COMMENT ON VIEW v_ai_parse_success_daily IS 'AI 응답 파싱 성공률 일별 추이 (최근 30일)';

-- ============================================================================
-- 샘플 쿼리 (참고용)
-- ============================================================================

-- 전체 성공률 조회
-- SELECT * FROM v_ai_parse_success_stats;

-- 일별 추이 조회
-- SELECT * FROM v_ai_parse_success_daily WHERE function_name = 'run-simulation';

-- 최근 실패 로그 조회
-- SELECT created_at, function_name, error_message, parse_attempts
-- FROM ai_response_logs
-- WHERE parse_success = false OR used_fallback = true
-- ORDER BY created_at DESC
-- LIMIT 20;

-- 성공률 0% 목표 달성 여부 확인 (Demo Day 기준)
-- SELECT
--     function_name,
--     success_rate,
--     fallback_rate,
--     CASE
--         WHEN success_rate >= 99 AND fallback_rate <= 1 THEN '✅ 목표 달성'
--         WHEN success_rate >= 95 THEN '⚠️ 거의 달성'
--         ELSE '❌ 미달성'
--     END as status
-- FROM v_ai_parse_success_stats;
