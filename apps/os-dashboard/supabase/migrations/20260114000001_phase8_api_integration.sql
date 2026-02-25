-- ============================================================================
-- Phase 8: API 연동 확장 - sync_type 컬럼 및 추가 기능
-- ============================================================================
-- 1. api_sync_logs 테이블에 sync_type 컬럼 추가
-- 2. raw_imports 테이블에 추가 컬럼 확장
-- 3. 관련 인덱스 및 RPC 함수 추가
-- ============================================================================

-- ============================================================================
-- Part 1: api_sync_logs 테이블에 sync_type 컬럼 추가
-- ============================================================================

-- sync_type 컬럼 추가 (scheduled, manual, retry)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'sync_type'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN sync_type text DEFAULT 'manual'
      CHECK (sync_type IN ('scheduled', 'manual', 'retry'));
    COMMENT ON COLUMN api_sync_logs.sync_type IS '동기화 유형: scheduled(스케줄), manual(수동), retry(재시도)';
  END IF;
END $$;

-- raw_import_id 컬럼 추가 (raw_imports 참조)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'raw_import_id'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN raw_import_id uuid REFERENCES raw_imports(id) ON DELETE SET NULL;
    COMMENT ON COLUMN api_sync_logs.raw_import_id IS '생성된 raw_import 레코드 ID';
  END IF;
END $$;

-- etl_run_id 컬럼 추가 (etl_runs 참조)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'etl_run_id'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN etl_run_id uuid REFERENCES etl_runs(id) ON DELETE SET NULL;
    COMMENT ON COLUMN api_sync_logs.etl_run_id IS '연관된 ETL 실행 ID';
  END IF;
END $$;

-- fetch_completed_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'fetch_completed_at'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN fetch_completed_at timestamp with time zone;
    COMMENT ON COLUMN api_sync_logs.fetch_completed_at IS 'API 데이터 가져오기 완료 시간';
  END IF;
END $$;

-- processing_completed_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'processing_completed_at'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN processing_completed_at timestamp with time zone;
    COMMENT ON COLUMN api_sync_logs.processing_completed_at IS 'ETL 처리 완료 시간';
  END IF;
END $$;

-- response_size_bytes 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'response_size_bytes'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN response_size_bytes bigint;
    COMMENT ON COLUMN api_sync_logs.response_size_bytes IS 'API 응답 크기 (바이트)';
  END IF;
END $$;

-- error_type 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_sync_logs' AND column_name = 'error_type'
  ) THEN
    ALTER TABLE api_sync_logs ADD COLUMN error_type text;
    COMMENT ON COLUMN api_sync_logs.error_type IS '오류 유형: network, auth, parse, transform, database';
  END IF;
END $$;

-- 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_sync_type ON api_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_raw_import_id ON api_sync_logs(raw_import_id);

-- ============================================================================
-- Part 2: api_connections 테이블 추가 확장
-- ============================================================================

-- successful_syncs 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'successful_syncs'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN successful_syncs integer DEFAULT 0;
    COMMENT ON COLUMN api_connections.successful_syncs IS '성공한 동기화 횟수';
  END IF;
END $$;

-- error_count 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'error_count'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN error_count integer DEFAULT 0;
    COMMENT ON COLUMN api_connections.error_count IS '연속 오류 횟수';
  END IF;
END $$;

-- next_sync_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'next_sync_at'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN next_sync_at timestamp with time zone;
    COMMENT ON COLUMN api_connections.next_sync_at IS '다음 예정 동기화 시간';
  END IF;
END $$;

-- api_body_template 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'api_body_template'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN api_body_template jsonb;
    COMMENT ON COLUMN api_connections.api_body_template IS 'POST 요청 시 body 템플릿';
  END IF;
END $$;

-- 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_api_connections_next_sync_at
  ON api_connections(next_sync_at)
  WHERE is_active = true AND status = 'active';

-- ============================================================================
-- Part 3: RPC 함수 - 동기화 이력 조회
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sync_history(
  p_connection_id uuid DEFAULT NULL,
  p_org_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_logs jsonb;
  v_total integer;
BEGIN
  -- 로그 조회
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', asl.id,
      'api_connection_id', asl.api_connection_id,
      'connection_name', ac.name,
      'provider', ac.provider,
      'data_category', ac.data_category,
      'sync_type', COALESCE(asl.sync_type, 'manual'),
      'status', asl.status,
      'started_at', asl.started_at,
      'completed_at', asl.completed_at,
      'duration_ms', asl.duration_ms,
      'records_fetched', asl.records_fetched,
      'records_created', asl.records_created,
      'records_updated', asl.records_updated,
      'records_failed', asl.records_failed,
      'error_type', asl.error_type,
      'error_message', asl.error_message,
      'raw_import_id', asl.raw_import_id,
      'etl_run_id', asl.etl_run_id
    )
    ORDER BY asl.started_at DESC
  )
  INTO v_logs
  FROM api_sync_logs asl
  LEFT JOIN api_connections ac ON ac.id = asl.api_connection_id
  WHERE (p_connection_id IS NULL OR asl.api_connection_id = p_connection_id)
    AND (p_org_id IS NULL OR asl.org_id = p_org_id)
  LIMIT p_limit
  OFFSET p_offset;

  -- 총 개수 조회
  SELECT COUNT(*)
  INTO v_total
  FROM api_sync_logs asl
  WHERE (p_connection_id IS NULL OR asl.api_connection_id = p_connection_id)
    AND (p_org_id IS NULL OR asl.org_id = p_org_id);

  RETURN jsonb_build_object(
    'success', true,
    'logs', COALESCE(v_logs, '[]'::jsonb),
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;

-- ============================================================================
-- Part 4: RPC 함수 - 동기화 통계 조회
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sync_statistics(
  p_connection_id uuid DEFAULT NULL,
  p_org_id uuid DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
  v_daily jsonb;
BEGIN
  -- 전체 통계
  SELECT jsonb_build_object(
    'total_syncs', COUNT(*),
    'successful_syncs', COUNT(*) FILTER (WHERE status = 'success'),
    'failed_syncs', COUNT(*) FILTER (WHERE status = 'failed'),
    'partial_syncs', COUNT(*) FILTER (WHERE status = 'partial'),
    'total_records_fetched', COALESCE(SUM(records_fetched), 0),
    'total_records_created', COALESCE(SUM(records_created), 0),
    'total_records_updated', COALESCE(SUM(records_updated), 0),
    'total_records_failed', COALESCE(SUM(records_failed), 0),
    'avg_duration_ms', ROUND(AVG(duration_ms)),
    'success_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'success')::decimal /
      NULLIF(COUNT(*), 0) * 100, 2
    )
  )
  INTO v_stats
  FROM api_sync_logs
  WHERE (p_connection_id IS NULL OR api_connection_id = p_connection_id)
    AND (p_org_id IS NULL OR org_id = p_org_id)
    AND started_at >= NOW() - (p_days || ' days')::interval;

  -- 일별 통계
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'syncs', syncs,
      'success', success,
      'failed', failed,
      'records', records
    )
    ORDER BY date DESC
  )
  INTO v_daily
  FROM (
    SELECT
      DATE(started_at) as date,
      COUNT(*) as syncs,
      COUNT(*) FILTER (WHERE status = 'success') as success,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COALESCE(SUM(records_created + records_updated), 0) as records
    FROM api_sync_logs
    WHERE (p_connection_id IS NULL OR api_connection_id = p_connection_id)
      AND (p_org_id IS NULL OR org_id = p_org_id)
      AND started_at >= NOW() - (p_days || ' days')::interval
    GROUP BY DATE(started_at)
  ) daily;

  RETURN jsonb_build_object(
    'success', true,
    'period_days', p_days,
    'statistics', COALESCE(v_stats, '{}'::jsonb),
    'daily', COALESCE(v_daily, '[]'::jsonb)
  );
END;
$$;

-- ============================================================================
-- Part 5: 동기화 로그 생성 함수 (Edge Function에서 사용)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_sync_log(
  p_connection_id uuid,
  p_sync_type text DEFAULT 'manual',
  p_request_url text DEFAULT NULL,
  p_request_headers jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_log_id uuid;
BEGIN
  -- 연결 정보 조회
  SELECT * INTO v_connection
  FROM api_connections
  WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Connection not found'
    );
  END IF;

  -- 로그 생성
  INSERT INTO api_sync_logs (
    api_connection_id,
    sync_type,
    status,
    request_url,
    request_headers,
    org_id
  ) VALUES (
    p_connection_id,
    p_sync_type,
    'running',
    COALESCE(p_request_url, v_connection.url),
    p_request_headers,
    v_connection.org_id
  )
  RETURNING id INTO v_log_id;

  -- 연결 상태 업데이트
  UPDATE api_connections
  SET status = 'testing'
  WHERE id = p_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'connection_id', p_connection_id
  );
END;
$$;

-- ============================================================================
-- Part 6: 동기화 로그 업데이트 함수 (확장)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sync_log(
  p_log_id uuid,
  p_status text,
  p_records_fetched integer DEFAULT 0,
  p_records_created integer DEFAULT 0,
  p_records_updated integer DEFAULT 0,
  p_records_failed integer DEFAULT 0,
  p_error_type text DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL,
  p_raw_import_id uuid DEFAULT NULL,
  p_etl_run_id uuid DEFAULT NULL,
  p_response_status integer DEFAULT NULL,
  p_response_size_bytes bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log record;
  v_connection_id uuid;
BEGIN
  -- 로그 조회
  SELECT * INTO v_log
  FROM api_sync_logs
  WHERE id = p_log_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sync log not found'
    );
  END IF;

  v_connection_id := v_log.api_connection_id;

  -- 로그 업데이트
  UPDATE api_sync_logs
  SET
    completed_at = NOW(),
    status = p_status,
    records_fetched = p_records_fetched,
    records_created = p_records_created,
    records_updated = p_records_updated,
    records_failed = p_records_failed,
    error_type = p_error_type,
    error_message = p_error_message,
    error_details = p_error_details,
    duration_ms = p_duration_ms,
    raw_import_id = p_raw_import_id,
    etl_run_id = p_etl_run_id,
    response_status = p_response_status,
    response_size_bytes = p_response_size_bytes
  WHERE id = p_log_id;

  -- 연결 상태 업데이트
  UPDATE api_connections
  SET
    status = CASE
      WHEN p_status = 'success' THEN 'active'
      WHEN p_status = 'failed' THEN 'error'
      ELSE 'inactive'
    END,
    last_sync = NOW(),
    last_error = p_error_message,
    total_records_synced = total_records_synced + p_records_created + p_records_updated,
    last_sync_duration_ms = p_duration_ms,
    successful_syncs = CASE WHEN p_status = 'success' THEN successful_syncs + 1 ELSE successful_syncs END,
    error_count = CASE WHEN p_status = 'failed' THEN error_count + 1 ELSE 0 END
  WHERE id = v_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', p_log_id,
    'connection_id', v_connection_id,
    'status', p_status
  );
END;
$$;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Phase 8 API Integration - Migration completed';
  RAISE NOTICE 'Added: api_sync_logs.sync_type column';
  RAISE NOTICE 'Added: api_connections additional columns';
  RAISE NOTICE 'Added: get_sync_history, get_sync_statistics RPC functions';
  RAISE NOTICE 'Added: create_sync_log, update_sync_log RPC functions';
END $$;
