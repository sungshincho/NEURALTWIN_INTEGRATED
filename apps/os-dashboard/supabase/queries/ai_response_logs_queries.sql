-- ============================================================================
-- AI 응답 로그 쿼리 모음
--
-- 목적:
-- 1. 로그 검증 쿼리
-- 2. 파인튜닝 데이터 추출 쿼리
-- 3. 통계 및 분석 쿼리
-- ============================================================================

-- ============================================================================
-- Part 5: 테스트 및 검증 쿼리
-- ============================================================================

-- 1. 최근 로그 확인 (기본 검증)
SELECT
  id,
  function_name,
  simulation_type,
  input_variables->>'optimization_type' as optimization_type,
  response_summary->>'furnitureChangesCount' as furniture_changes,
  response_summary->>'productChangesCount' as product_changes,
  response_summary->>'expectedRevenueIncrease' as revenue_increase,
  execution_time_ms,
  had_error,
  created_at
FROM ai_response_logs
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY created_at DESC
LIMIT 10;

-- 2. 함수별 로그 수 확인
SELECT
  function_name,
  simulation_type,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE had_error = true) as error_count,
  AVG(execution_time_ms) as avg_execution_ms,
  MAX(created_at) as last_log_at
FROM ai_response_logs
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
GROUP BY function_name, simulation_type
ORDER BY function_name, simulation_type;

-- 3. 컨텍스트 메타데이터 확인 (입력 데이터 크기)
SELECT
  id,
  function_name,
  context_metadata->>'furnitureCount' as furniture,
  context_metadata->>'productCount' as products,
  context_metadata->>'zoneCount' as zones,
  context_metadata->>'slotCount' as slots,
  context_metadata->>'hasFlowData' as has_flow,
  context_metadata->>'hasVMDData' as has_vmd,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY created_at DESC
LIMIT 20;

-- 4. AI 응답 요약 확인
SELECT
  id,
  simulation_type,
  response_summary->>'furnitureChangesCount' as furniture_changes,
  response_summary->>'productChangesCount' as product_changes,
  response_summary->>'vmdScore' as vmd_score,
  response_summary->>'flowHealthScore' as flow_health,
  response_summary->>'confidence' as confidence,
  model_used,
  created_at
FROM ai_response_logs
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND function_name = 'generate-optimization'
ORDER BY created_at DESC
LIMIT 10;

-- 5. 에러 로그 확인
SELECT
  id,
  function_name,
  simulation_type,
  error_message,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE had_error = true
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- Part 6: 파인튜닝 데이터 추출 쿼리
-- ============================================================================

-- 6. 좋은 예시 전체 추출 (파인튜닝용)
SELECT
  id,
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

-- 7. 특정 시뮬레이션 유형의 좋은 예시 추출
SELECT
  input_variables,
  ai_response
FROM ai_response_logs
WHERE is_good_example = true
  AND quality_score >= 4
  AND simulation_type IN ('both', 'product', 'furniture')
  AND had_error = false
ORDER BY created_at DESC
LIMIT 100;

-- 8. JSON Lines 형식으로 파인튜닝 데이터 추출 (OpenAI 형식)
SELECT
  json_build_object(
    'messages', json_build_array(
      json_build_object(
        'role', 'system',
        'content', 'You are a retail store layout optimization expert. Analyze the store data and provide optimization recommendations.'
      ),
      json_build_object(
        'role', 'user',
        'content', input_variables::text
      ),
      json_build_object(
        'role', 'assistant',
        'content', ai_response::text
      )
    )
  ) as training_example
FROM ai_response_logs
WHERE is_good_example = true
  AND quality_score >= 4
  AND had_error = false
ORDER BY created_at DESC;

-- 9. 함수별 통계 (v_ai_response_stats 뷰 사용)
SELECT * FROM v_ai_response_stats;

-- 10. 파인튜닝 데이터셋 뷰 사용
SELECT * FROM v_finetuning_dataset LIMIT 50;

-- ============================================================================
-- 품질 평가 쿼리
-- ============================================================================

-- 11. 미평가 로그 목록 (평가 대기)
SELECT
  id,
  function_name,
  simulation_type,
  response_summary->>'totalChangesCount' as changes,
  response_summary->>'expectedRevenueIncrease' as revenue_increase,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE quality_score IS NULL
  AND had_error = false
ORDER BY created_at DESC
LIMIT 50;

-- 12. 품질 점수 업데이트 (예시)
-- UPDATE ai_response_logs
-- SET
--   quality_score = 5,
--   quality_notes = '정확한 추천, 실제 적용 후 매출 10% 증가',
--   is_good_example = true,
--   updated_at = NOW()
-- WHERE id = 'target-log-id';

-- ============================================================================
-- 분석 쿼리
-- ============================================================================

-- 13. 일별 로그 통계
SELECT
  DATE(created_at) as log_date,
  COUNT(*) as total_logs,
  COUNT(DISTINCT store_id) as stores,
  AVG(execution_time_ms) as avg_execution_ms,
  COUNT(*) FILTER (WHERE had_error = true) as errors
FROM ai_response_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY log_date DESC;

-- 14. 모델별 성능 비교
SELECT
  model_used,
  COUNT(*) as total,
  AVG(execution_time_ms) as avg_execution_ms,
  AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality,
  COUNT(*) FILTER (WHERE had_error = true) as errors
FROM ai_response_logs
GROUP BY model_used
ORDER BY total DESC;

-- 15. 시뮬레이션 유형별 품질 분석
SELECT
  simulation_type,
  COUNT(*) as total,
  AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality,
  COUNT(*) FILTER (WHERE is_good_example = true) as good_examples,
  AVG((response_summary->>'confidence')::numeric) FILTER (
    WHERE response_summary->>'confidence' IS NOT NULL
  ) as avg_confidence
FROM ai_response_logs
WHERE had_error = false
GROUP BY simulation_type
ORDER BY total DESC;

-- ============================================================================
-- 데이터 관리 쿼리
-- ============================================================================

-- 16. 오래된 미평가 로그 정리 (90일 이상)
-- SELECT cleanup_old_ai_response_logs(90);

-- 17. 스토리지 사용량 확인
SELECT
  pg_size_pretty(pg_total_relation_size('ai_response_logs')) as total_size,
  pg_size_pretty(pg_table_size('ai_response_logs')) as table_size,
  pg_size_pretty(pg_indexes_size('ai_response_logs')) as index_size,
  COUNT(*) as total_rows
FROM ai_response_logs;

-- 18. 매장별 로그 수
SELECT
  store_id,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE is_good_example = true) as good_examples,
  MAX(created_at) as last_log
FROM ai_response_logs
GROUP BY store_id
ORDER BY total_logs DESC
LIMIT 20;
