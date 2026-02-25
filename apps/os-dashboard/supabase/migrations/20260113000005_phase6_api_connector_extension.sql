-- ============================================================================
-- Phase 6: API Connector 확장 마이그레이션
-- ============================================================================
-- 1. api_connections 테이블 확장 (store_id, provider, 고급 설정)
-- 2. sync_endpoints 테이블 생성 (엔드포인트별 동기화 설정)
-- 3. field_transform_rules 테이블 생성 (필드 변환 규칙)
-- ============================================================================

-- ============================================================================
-- Phase 6-1: api_connections 테이블 확장
-- ============================================================================

-- store_id 컬럼 추가 (매장별 API 연결)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_api_connections_store_id ON api_connections(store_id);
  END IF;
END $$;

-- provider 컬럼 추가 (POS, CRM, ERP 등 공급자 유형)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'provider'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN provider text;
    COMMENT ON COLUMN api_connections.provider IS 'API 공급자 유형: pos, crm, erp, sensor, custom';
  END IF;
END $$;

-- auth_config 컬럼 추가 (복잡한 인증 설정을 위한 JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'auth_config'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN auth_config jsonb DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN api_connections.auth_config IS '인증 설정: {oauth: {...}, refresh_token: ..., expires_at: ...}';
  END IF;
END $$;

-- request_config 컬럼 추가 (요청 설정)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'request_config'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN request_config jsonb
      DEFAULT '{"timeout_ms": 30000, "retry_count": 3, "retry_delay_ms": 1000}'::jsonb;
    COMMENT ON COLUMN api_connections.request_config IS '요청 설정: timeout, retry, headers 등';
  END IF;
END $$;

-- rate_limit_config 컬럼 추가 (속도 제한 설정)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'rate_limit_config'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN rate_limit_config jsonb
      DEFAULT '{"requests_per_minute": 60, "requests_per_hour": 1000}'::jsonb;
    COMMENT ON COLUMN api_connections.rate_limit_config IS '속도 제한: requests_per_minute, requests_per_hour';
  END IF;
END $$;

-- last_tested_at 컬럼 추가 (마지막 테스트 시간)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'last_tested_at'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN last_tested_at timestamp with time zone;
  END IF;
END $$;

-- last_error 컬럼 추가 (마지막 오류)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'last_error'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN last_error text;
  END IF;
END $$;

-- status 컬럼 추가 (상태: active, inactive, error, testing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'status'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN status text DEFAULT 'inactive'
      CHECK (status IN ('active', 'inactive', 'error', 'testing'));
  END IF;
END $$;

-- ============================================================================
-- Phase 6-2: sync_endpoints 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_connection_id uuid NOT NULL REFERENCES api_connections(id) ON DELETE CASCADE,

  -- 엔드포인트 기본 정보
  name text NOT NULL,
  description text,
  endpoint_path text NOT NULL,  -- /api/v1/sales, /api/v1/customers 등
  http_method text DEFAULT 'GET' CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),

  -- 데이터 매핑
  target_table text NOT NULL,   -- L1 테이블: purchases, customers, products 등
  data_path text,               -- 응답에서 데이터 위치: data.items, results 등

  -- 동기화 설정
  sync_mode text DEFAULT 'incremental' CHECK (sync_mode IN ('full', 'incremental', 'append')),
  sync_frequency text DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  last_sync_at timestamp with time zone,
  last_sync_status text CHECK (last_sync_status IN ('success', 'partial', 'failed', 'running')),
  last_sync_record_count integer DEFAULT 0,
  last_sync_error text,

  -- 페이지네이션 설정
  pagination_config jsonb DEFAULT '{
    "type": "offset",
    "page_param": "page",
    "limit_param": "limit",
    "default_limit": 100
  }'::jsonb,

  -- 필터링/쿼리 파라미터
  query_params jsonb DEFAULT '{}'::jsonb,

  -- 증분 동기화 설정
  incremental_key text,         -- updated_at, created_at 등
  incremental_value text,       -- 마지막 동기화 시점 값

  -- 활성화 상태
  is_active boolean DEFAULT true,

  -- 메타데이터
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- 조직/사용자
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
);

-- sync_endpoints 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_endpoints_api_connection_id ON sync_endpoints(api_connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_endpoints_target_table ON sync_endpoints(target_table);
CREATE INDEX IF NOT EXISTS idx_sync_endpoints_is_active ON sync_endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_endpoints_org_id ON sync_endpoints(org_id);
CREATE INDEX IF NOT EXISTS idx_sync_endpoints_last_sync_at ON sync_endpoints(last_sync_at);

-- sync_endpoints 트리거
DROP TRIGGER IF EXISTS update_sync_endpoints_updated_at ON sync_endpoints;
CREATE TRIGGER update_sync_endpoints_updated_at
  BEFORE UPDATE ON sync_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- sync_endpoints RLS
ALTER TABLE sync_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org sync endpoints" ON sync_endpoints
  FOR SELECT TO authenticated
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can create org sync endpoints" ON sync_endpoints
  FOR INSERT TO authenticated
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can update org sync endpoints" ON sync_endpoints
  FOR UPDATE TO authenticated
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org sync endpoints" ON sync_endpoints
  FOR DELETE TO authenticated
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- ============================================================================
-- Phase 6-3: field_transform_rules 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS field_transform_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_endpoint_id uuid NOT NULL REFERENCES sync_endpoints(id) ON DELETE CASCADE,

  -- 필드 매핑
  source_field text NOT NULL,   -- API 응답의 필드 경로: item.product_name
  target_field text NOT NULL,   -- 대상 테이블의 컬럼: name

  -- 변환 규칙
  transform_type text DEFAULT 'direct' CHECK (transform_type IN (
    'direct',      -- 직접 매핑
    'rename',      -- 이름 변경
    'cast',        -- 타입 변환
    'format',      -- 포맷 변환 (날짜 등)
    'lookup',      -- 룩업 테이블 참조
    'expression',  -- 사용자 정의 표현식
    'default',     -- 기본값 설정
    'concat',      -- 여러 필드 결합
    'split'        -- 필드 분리
  )),

  -- 변환 설정
  transform_config jsonb DEFAULT '{}'::jsonb,
  -- cast: {"target_type": "integer"}
  -- format: {"input_format": "YYYY-MM-DD", "output_format": "ISO8601"}
  -- lookup: {"table": "products", "key_field": "sku", "value_field": "id"}
  -- expression: {"expr": "field1 + field2"}
  -- default: {"value": "unknown"}
  -- concat: {"fields": ["first_name", "last_name"], "separator": " "}
  -- split: {"delimiter": ",", "index": 0}

  -- 유효성 검사
  validation_rules jsonb DEFAULT '[]'::jsonb,
  -- [{"type": "required"}, {"type": "min_length", "value": 1}, {"type": "regex", "pattern": "^[A-Z]"}]

  -- 오류 처리
  on_error text DEFAULT 'skip' CHECK (on_error IN ('skip', 'null', 'default', 'fail')),
  default_value text,

  -- 우선순위 (낮을수록 먼저 실행)
  priority integer DEFAULT 100,

  -- 활성화 상태
  is_active boolean DEFAULT true,

  -- 메타데이터
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- field_transform_rules 인덱스
CREATE INDEX IF NOT EXISTS idx_field_transform_rules_sync_endpoint_id ON field_transform_rules(sync_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_field_transform_rules_target_field ON field_transform_rules(target_field);
CREATE INDEX IF NOT EXISTS idx_field_transform_rules_is_active ON field_transform_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_field_transform_rules_priority ON field_transform_rules(priority);

-- field_transform_rules 트리거
DROP TRIGGER IF EXISTS update_field_transform_rules_updated_at ON field_transform_rules;
CREATE TRIGGER update_field_transform_rules_updated_at
  BEFORE UPDATE ON field_transform_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- field_transform_rules RLS (sync_endpoints를 통한 접근 제어)
ALTER TABLE field_transform_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transform rules for their endpoints" ON field_transform_rules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sync_endpoints se
      WHERE se.id = field_transform_rules.sync_endpoint_id
      AND (
        (se.org_id IS NULL AND auth.uid() = se.user_id) OR
        (se.org_id IS NOT NULL AND is_org_member(auth.uid(), se.org_id))
      )
    )
  );

CREATE POLICY "Users can create transform rules for their endpoints" ON field_transform_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sync_endpoints se
      WHERE se.id = field_transform_rules.sync_endpoint_id
      AND (
        (se.org_id IS NULL AND auth.uid() = se.user_id) OR
        (se.org_id IS NOT NULL AND is_org_admin(auth.uid(), se.org_id))
      )
    )
  );

CREATE POLICY "Users can update transform rules for their endpoints" ON field_transform_rules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sync_endpoints se
      WHERE se.id = field_transform_rules.sync_endpoint_id
      AND (
        (se.org_id IS NULL AND auth.uid() = se.user_id) OR
        (se.org_id IS NOT NULL AND is_org_admin(auth.uid(), se.org_id))
      )
    )
  );

CREATE POLICY "Users can delete transform rules for their endpoints" ON field_transform_rules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sync_endpoints se
      WHERE se.id = field_transform_rules.sync_endpoint_id
      AND (
        (se.org_id IS NULL AND auth.uid() = se.user_id) OR
        (se.org_id IS NOT NULL AND is_org_admin(auth.uid(), se.org_id))
      )
    )
  );

-- ============================================================================
-- Phase 6-4: sync_logs 테이블 생성 (동기화 로그)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_endpoint_id uuid NOT NULL REFERENCES sync_endpoints(id) ON DELETE CASCADE,
  api_connection_id uuid REFERENCES api_connections(id) ON DELETE SET NULL,

  -- 실행 정보
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,

  -- 결과
  status text NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  records_fetched integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,

  -- 오류 정보
  error_message text,
  error_details jsonb,

  -- 요청/응답 정보 (디버깅용)
  request_url text,
  request_headers jsonb,
  response_status integer,
  response_headers jsonb,

  -- 메타데이터
  created_at timestamp with time zone DEFAULT now(),

  -- 조직
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE
);

-- api_sync_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_sync_endpoint_id ON api_sync_logs(sync_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_api_connection_id ON api_sync_logs(api_connection_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_status ON api_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_started_at ON api_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_org_id ON api_sync_logs(org_id);

-- api_sync_logs RLS
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org sync logs" ON api_sync_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sync_endpoints se
      WHERE se.id = api_sync_logs.sync_endpoint_id
      AND (
        (se.org_id IS NULL AND auth.uid() = se.user_id) OR
        (se.org_id IS NOT NULL AND is_org_member(auth.uid(), se.org_id))
      )
    )
  );

-- ============================================================================
-- Phase 6-5: RPC 함수 - API 연결 테스트
-- ============================================================================

CREATE OR REPLACE FUNCTION test_api_connection(
  p_connection_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_result jsonb;
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

  -- 테스트 시간 업데이트
  UPDATE api_connections
  SET
    last_tested_at = now(),
    status = 'testing'
  WHERE id = p_connection_id;

  -- 실제 API 호출은 Edge Function에서 수행
  -- 여기서는 메타데이터만 반환
  RETURN jsonb_build_object(
    'success', true,
    'connection_id', p_connection_id,
    'url', v_connection.url,
    'method', v_connection.method,
    'auth_type', v_connection.auth_type,
    'provider', v_connection.provider,
    'message', 'Connection ready for testing'
  );
END;
$$;

-- ============================================================================
-- Phase 6-6: RPC 함수 - 동기화 상태 조회
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sync_status(
  p_org_id uuid DEFAULT NULL,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_connections jsonb;
  v_endpoints jsonb;
  v_recent_logs jsonb;
BEGIN
  -- API 연결 상태 조회
  SELECT jsonb_agg(jsonb_build_object(
    'id', ac.id,
    'name', ac.name,
    'provider', ac.provider,
    'status', ac.status,
    'last_sync', ac.last_sync,
    'last_tested_at', ac.last_tested_at,
    'last_error', ac.last_error,
    'endpoint_count', (SELECT COUNT(*) FROM sync_endpoints WHERE api_connection_id = ac.id),
    'active_endpoints', (SELECT COUNT(*) FROM sync_endpoints WHERE api_connection_id = ac.id AND is_active = true)
  ))
  INTO v_connections
  FROM api_connections ac
  WHERE ac.is_active = true
    AND (p_org_id IS NULL OR ac.org_id = p_org_id)
    AND (p_store_id IS NULL OR ac.store_id = p_store_id);

  -- 엔드포인트 동기화 상태
  SELECT jsonb_agg(jsonb_build_object(
    'id', se.id,
    'name', se.name,
    'target_table', se.target_table,
    'sync_mode', se.sync_mode,
    'sync_frequency', se.sync_frequency,
    'last_sync_at', se.last_sync_at,
    'last_sync_status', se.last_sync_status,
    'last_sync_record_count', se.last_sync_record_count
  ))
  INTO v_endpoints
  FROM sync_endpoints se
  JOIN api_connections ac ON ac.id = se.api_connection_id
  WHERE se.is_active = true
    AND (p_org_id IS NULL OR se.org_id = p_org_id)
    AND (p_store_id IS NULL OR ac.store_id = p_store_id);

  -- 최근 동기화 로그
  SELECT jsonb_agg(logs)
  INTO v_recent_logs
  FROM (
    SELECT jsonb_build_object(
      'id', asl.id,
      'endpoint_name', se.name,
      'status', asl.status,
      'started_at', asl.started_at,
      'duration_ms', asl.duration_ms,
      'records_fetched', asl.records_fetched,
      'records_created', asl.records_created,
      'error_message', asl.error_message
    ) as logs
    FROM api_sync_logs asl
    JOIN sync_endpoints se ON se.id = asl.sync_endpoint_id
    WHERE (p_org_id IS NULL OR asl.org_id = p_org_id)
    ORDER BY asl.started_at DESC
    LIMIT 20
  ) sub;

  RETURN jsonb_build_object(
    'connections', COALESCE(v_connections, '[]'::jsonb),
    'endpoints', COALESCE(v_endpoints, '[]'::jsonb),
    'recent_logs', COALESCE(v_recent_logs, '[]'::jsonb),
    'summary', jsonb_build_object(
      'total_connections', COALESCE(jsonb_array_length(v_connections), 0),
      'total_endpoints', COALESCE(jsonb_array_length(v_endpoints), 0),
      'active_syncs', (
        SELECT COUNT(*) FROM api_sync_logs
        WHERE status = 'running'
        AND (p_org_id IS NULL OR org_id = p_org_id)
      )
    )
  );
END;
$$;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Phase 6 API Connector Extension migration completed successfully';
  RAISE NOTICE 'Tables created/modified: api_connections (extended), sync_endpoints, field_transform_rules, api_sync_logs';
  RAISE NOTICE 'RPC functions: test_api_connection, get_sync_status';
END $$;
