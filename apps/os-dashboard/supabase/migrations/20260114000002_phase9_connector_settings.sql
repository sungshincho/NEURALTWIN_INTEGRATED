-- ============================================================================
-- Phase 9: Connector Settings Extension
-- ============================================================================
-- 1. sync_cron 컬럼 추가 (커스텀 cron 표현식)
-- 2. next_scheduled_sync 컬럼 추가 (다음 예정 동기화 시간)
-- 3. sync_frequency 옵션 확장
-- 4. 암호화된 자격증명 지원
-- ============================================================================

-- ============================================================================
-- Part 1: api_connections 테이블 확장
-- ============================================================================

-- sync_cron 컬럼 추가 (커스텀 cron 표현식)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'sync_cron'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN sync_cron text;
    COMMENT ON COLUMN api_connections.sync_cron IS '커스텀 cron 표현식: */15 * * * * (15분마다)';
  END IF;
END $$;

-- next_scheduled_sync 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'next_scheduled_sync'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN next_scheduled_sync timestamptz;
    COMMENT ON COLUMN api_connections.next_scheduled_sync IS '다음 예정 동기화 시간';
  END IF;
END $$;

-- is_credentials_encrypted 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'is_credentials_encrypted'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN is_credentials_encrypted boolean DEFAULT false;
    COMMENT ON COLUMN api_connections.is_credentials_encrypted IS '자격증명 암호화 여부';
  END IF;
END $$;

-- retry_count 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN retry_count integer DEFAULT 0;
    COMMENT ON COLUMN api_connections.retry_count IS '연속 실패 후 재시도 횟수';
  END IF;
END $$;

-- max_retries 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'max_retries'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN max_retries integer DEFAULT 3;
    COMMENT ON COLUMN api_connections.max_retries IS '최대 재시도 횟수';
  END IF;
END $$;

-- sync_frequency CHECK 제약조건 업데이트 (더 많은 옵션 추가)
-- 기존 제약조건 제거 후 재생성
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- 기존 CHECK 제약조건 이름 찾기
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'api_connections'
    AND a.attname = 'sync_frequency'
    AND c.contype = 'c'
  LIMIT 1;

  -- 제약조건이 있으면 삭제
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE api_connections DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 새로운 CHECK 제약조건 추가 (확장된 옵션)
DO $$
BEGIN
  -- 제약조건이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'api_connections'
      AND a.attname = 'sync_frequency'
      AND c.contype = 'c'
  ) THEN
    ALTER TABLE api_connections ADD CONSTRAINT api_connections_sync_frequency_check
      CHECK (sync_frequency IN (
        'manual', 'realtime', 'every_5_min', 'every_15_min', 'every_30_min',
        'hourly', 'every_6_hours', 'daily', 'weekly', 'custom'
      ));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- 제약조건이 이미 존재하면 무시
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_api_connections_next_scheduled_sync
  ON api_connections(next_scheduled_sync) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_connections_sync_cron
  ON api_connections(sync_cron) WHERE sync_cron IS NOT NULL;

-- ============================================================================
-- Part 2: 동기화 스케줄링 RPC 함수
-- ============================================================================

-- 다음 동기화 시간 계산 함수
CREATE OR REPLACE FUNCTION calculate_next_sync_time(
  p_sync_frequency text,
  p_sync_cron text DEFAULT NULL,
  p_last_sync timestamptz DEFAULT NULL
) RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_time timestamptz;
  v_next_sync timestamptz;
BEGIN
  v_base_time := COALESCE(p_last_sync, NOW());

  -- 수동 또는 실시간은 NULL 반환
  IF p_sync_frequency IN ('manual', 'realtime') THEN
    RETURN NULL;
  END IF;

  -- 사전 정의된 주기
  CASE p_sync_frequency
    WHEN 'every_5_min' THEN
      v_next_sync := date_trunc('minute', v_base_time) + interval '5 minutes' *
        ceil(extract(minute from v_base_time)::numeric / 5);
      IF v_next_sync <= NOW() THEN
        v_next_sync := v_next_sync + interval '5 minutes';
      END IF;
    WHEN 'every_15_min' THEN
      v_next_sync := date_trunc('minute', v_base_time) + interval '15 minutes' *
        ceil(extract(minute from v_base_time)::numeric / 15);
      IF v_next_sync <= NOW() THEN
        v_next_sync := v_next_sync + interval '15 minutes';
      END IF;
    WHEN 'every_30_min' THEN
      v_next_sync := date_trunc('minute', v_base_time) + interval '30 minutes' *
        ceil(extract(minute from v_base_time)::numeric / 30);
      IF v_next_sync <= NOW() THEN
        v_next_sync := v_next_sync + interval '30 minutes';
      END IF;
    WHEN 'hourly' THEN
      v_next_sync := date_trunc('hour', v_base_time) + interval '1 hour';
    WHEN 'every_6_hours' THEN
      v_next_sync := date_trunc('hour', v_base_time) + interval '6 hours' *
        ceil(extract(hour from v_base_time)::numeric / 6);
      IF v_next_sync <= NOW() THEN
        v_next_sync := v_next_sync + interval '6 hours';
      END IF;
    WHEN 'daily' THEN
      v_next_sync := date_trunc('day', v_base_time) + interval '1 day';
    WHEN 'weekly' THEN
      v_next_sync := date_trunc('week', v_base_time) + interval '1 week';
    WHEN 'custom' THEN
      -- cron 표현식이 있으면 다음 실행 시간 계산 (단순화된 버전)
      -- 실제 cron 파싱은 애플리케이션 레벨에서 수행
      v_next_sync := v_base_time + interval '1 hour'; -- 기본값
    ELSE
      v_next_sync := NULL;
  END CASE;

  RETURN v_next_sync;
END;
$$;

-- 동기화 대상 연결 조회 함수
CREATE OR REPLACE FUNCTION get_connections_due_for_sync(
  p_limit integer DEFAULT 100
) RETURNS TABLE (
  id uuid,
  name text,
  url text,
  auth_type text,
  auth_config jsonb,
  field_mappings jsonb,
  target_table text,
  response_data_path text,
  sync_frequency text,
  sync_cron text,
  next_scheduled_sync timestamptz,
  last_sync timestamptz,
  retry_count integer,
  max_retries integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.url,
    ac.auth_type,
    ac.auth_config,
    ac.field_mappings,
    ac.target_table,
    ac.response_data_path,
    ac.sync_frequency,
    ac.sync_cron,
    ac.next_scheduled_sync,
    ac.last_sync,
    ac.retry_count,
    ac.max_retries
  FROM api_connections ac
  WHERE ac.is_active = true
    AND ac.sync_frequency NOT IN ('manual', 'realtime')
    AND ac.status != 'error'
    AND (
      ac.next_scheduled_sync IS NULL
      OR ac.next_scheduled_sync <= NOW()
    )
  ORDER BY ac.next_scheduled_sync NULLS FIRST
  LIMIT p_limit;
END;
$$;

-- 동기화 완료 후 다음 스케줄 업데이트 함수
CREATE OR REPLACE FUNCTION update_connection_after_sync(
  p_connection_id uuid,
  p_success boolean,
  p_records_synced integer DEFAULT 0,
  p_duration_ms integer DEFAULT NULL,
  p_error_message text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_next_sync timestamptz;
  v_new_status text;
  v_new_retry_count integer;
BEGIN
  -- 연결 정보 조회
  SELECT * INTO v_connection FROM api_connections WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Connection not found');
  END IF;

  IF p_success THEN
    -- 성공 시
    v_new_status := 'active';
    v_new_retry_count := 0;
    v_next_sync := calculate_next_sync_time(
      v_connection.sync_frequency,
      v_connection.sync_cron,
      NOW()
    );
  ELSE
    -- 실패 시
    v_new_retry_count := COALESCE(v_connection.retry_count, 0) + 1;

    IF v_new_retry_count >= COALESCE(v_connection.max_retries, 3) THEN
      v_new_status := 'error';
      v_next_sync := NULL;
    ELSE
      v_new_status := 'inactive';
      -- 재시도는 지수 백오프로 스케줄
      v_next_sync := NOW() + (power(2, v_new_retry_count) * interval '1 minute');
    END IF;
  END IF;

  -- 연결 업데이트
  UPDATE api_connections
  SET
    status = v_new_status,
    last_sync = NOW(),
    last_sync_duration_ms = p_duration_ms,
    total_records_synced = COALESCE(total_records_synced, 0) + COALESCE(p_records_synced, 0),
    retry_count = v_new_retry_count,
    next_scheduled_sync = v_next_sync,
    last_error = CASE WHEN p_success THEN NULL ELSE p_error_message END,
    updated_at = NOW()
  WHERE id = p_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_new_status,
    'next_scheduled_sync', v_next_sync,
    'retry_count', v_new_retry_count
  );
END;
$$;

-- ============================================================================
-- Part 3: 연결 설정 조회/수정 RPC
-- ============================================================================

-- 연결 상세 설정 조회
CREATE OR REPLACE FUNCTION get_connection_settings(
  p_connection_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_sync_stats record;
BEGIN
  -- 연결 정보 조회
  SELECT * INTO v_connection FROM api_connections WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Connection not found');
  END IF;

  -- 동기화 통계 조회
  SELECT
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'success') as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
    AVG(duration_ms) as avg_duration_ms,
    SUM(records_created + records_updated) as total_records_processed
  INTO v_sync_stats
  FROM api_sync_logs
  WHERE api_connection_id = p_connection_id
    AND started_at > NOW() - interval '30 days';

  RETURN jsonb_build_object(
    'success', true,
    'connection', jsonb_build_object(
      'id', v_connection.id,
      'name', v_connection.name,
      'description', v_connection.description,
      'url', v_connection.url,
      'method', v_connection.method,
      'provider', v_connection.provider,
      'data_category', v_connection.data_category,
      'auth_type', v_connection.auth_type,
      'auth_config', CASE
        WHEN v_connection.is_credentials_encrypted THEN '{"encrypted": true}'::jsonb
        ELSE v_connection.auth_config
      END,
      'headers', v_connection.headers,
      'target_table', v_connection.target_table,
      'response_data_path', v_connection.response_data_path,
      'field_mappings', v_connection.field_mappings,
      'pagination_type', v_connection.pagination_type,
      'pagination_config', v_connection.pagination_config,
      'sync_frequency', v_connection.sync_frequency,
      'sync_cron', v_connection.sync_cron,
      'sync_config', v_connection.sync_config,
      'status', v_connection.status,
      'is_active', v_connection.is_active,
      'last_sync', v_connection.last_sync,
      'next_scheduled_sync', v_connection.next_scheduled_sync,
      'last_error', v_connection.last_error,
      'total_records_synced', v_connection.total_records_synced,
      'retry_count', v_connection.retry_count,
      'max_retries', v_connection.max_retries,
      'created_at', v_connection.created_at,
      'updated_at', v_connection.updated_at
    ),
    'statistics', jsonb_build_object(
      'total_syncs', COALESCE(v_sync_stats.total_syncs, 0),
      'successful_syncs', COALESCE(v_sync_stats.successful_syncs, 0),
      'failed_syncs', COALESCE(v_sync_stats.failed_syncs, 0),
      'avg_duration_ms', v_sync_stats.avg_duration_ms,
      'total_records_processed', COALESCE(v_sync_stats.total_records_processed, 0)
    )
  );
END;
$$;

-- 연결 설정 업데이트
CREATE OR REPLACE FUNCTION update_connection_settings(
  p_connection_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_method text DEFAULT NULL,
  p_auth_type text DEFAULT NULL,
  p_auth_config jsonb DEFAULT NULL,
  p_headers jsonb DEFAULT NULL,
  p_target_table text DEFAULT NULL,
  p_response_data_path text DEFAULT NULL,
  p_field_mappings jsonb DEFAULT NULL,
  p_sync_frequency text DEFAULT NULL,
  p_sync_cron text DEFAULT NULL,
  p_sync_config jsonb DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_max_retries integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_next_sync timestamptz;
BEGIN
  -- 연결 확인
  SELECT * INTO v_connection FROM api_connections WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Connection not found');
  END IF;

  -- 다음 동기화 시간 계산 (주기가 변경된 경우)
  IF p_sync_frequency IS NOT NULL THEN
    v_next_sync := calculate_next_sync_time(
      COALESCE(p_sync_frequency, v_connection.sync_frequency),
      COALESCE(p_sync_cron, v_connection.sync_cron),
      NOW()
    );
  END IF;

  -- 업데이트 수행
  UPDATE api_connections
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    url = COALESCE(p_url, url),
    method = COALESCE(p_method, method),
    auth_type = COALESCE(p_auth_type, auth_type),
    auth_config = COALESCE(p_auth_config, auth_config),
    headers = COALESCE(p_headers, headers),
    target_table = COALESCE(p_target_table, target_table),
    response_data_path = COALESCE(p_response_data_path, response_data_path),
    field_mappings = COALESCE(p_field_mappings, field_mappings),
    sync_frequency = COALESCE(p_sync_frequency, sync_frequency),
    sync_cron = COALESCE(p_sync_cron, sync_cron),
    sync_config = COALESCE(p_sync_config, sync_config),
    is_active = COALESCE(p_is_active, is_active),
    max_retries = COALESCE(p_max_retries, max_retries),
    next_scheduled_sync = COALESCE(v_next_sync, next_scheduled_sync),
    updated_at = NOW()
  WHERE id = p_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Connection settings updated',
    'next_scheduled_sync', v_next_sync
  );
END;
$$;

-- ============================================================================
-- Part 4: 권한 설정
-- ============================================================================

-- RPC 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION calculate_next_sync_time TO authenticated;
GRANT EXECUTE ON FUNCTION get_connections_due_for_sync TO service_role;
GRANT EXECUTE ON FUNCTION update_connection_after_sync TO service_role;
GRANT EXECUTE ON FUNCTION get_connection_settings TO authenticated;
GRANT EXECUTE ON FUNCTION update_connection_settings TO authenticated;
