-- ============================================================================
-- Context Data Sources Extension for Data Control Tower
-- ============================================================================
-- 1. api_connections 테이블 확장 (connection_category, is_system_managed 등)
-- 2. 시스템 기본 연결 시딩 함수 추가 (날씨, 공휴일)
-- 3. 컨텍스트 데이터 조회 RPC 함수
-- ============================================================================

-- ============================================================================
-- Part 1: api_connections 테이블 확장
-- ============================================================================

-- connection_category 컬럼 추가 (business | context | analytics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'connection_category'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN connection_category text DEFAULT 'business'
      CHECK (connection_category IN ('business', 'context', 'analytics'));
    COMMENT ON COLUMN api_connections.connection_category IS '연결 카테고리: business(비즈니스), context(컨텍스트/환경), analytics(분석)';
  END IF;
END $$;

-- is_system_managed 컬럼 추가 (시스템 관리 여부)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'is_system_managed'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN is_system_managed boolean DEFAULT false;
    COMMENT ON COLUMN api_connections.is_system_managed IS '시스템 관리 연결 여부 (true: 삭제/비활성화 불가)';
  END IF;
END $$;

-- display_order 컬럼 추가 (UI 표시 순서)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN display_order integer DEFAULT 100;
    COMMENT ON COLUMN api_connections.display_order IS 'UI 표시 순서 (낮을수록 먼저 표시)';
  END IF;
END $$;

-- icon_name 컬럼 추가 (UI 아이콘)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN icon_name text;
    COMMENT ON COLUMN api_connections.icon_name IS 'UI 표시용 아이콘 이름 (lucide-react)';
  END IF;
END $$;

-- description 컬럼 추가 (설명)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'description'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN description text;
    COMMENT ON COLUMN api_connections.description IS '연결 설명';
  END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_api_connections_category ON api_connections(connection_category);
CREATE INDEX IF NOT EXISTS idx_api_connections_system_managed ON api_connections(is_system_managed);
CREATE INDEX IF NOT EXISTS idx_api_connections_display_order ON api_connections(display_order);

-- ============================================================================
-- Part 2: 시스템 기본 연결 시딩 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_system_context_connections(
  p_org_id uuid,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weather_id uuid;
  v_holiday_id uuid;
  v_user_id uuid;
  v_created_count integer := 0;
BEGIN
  -- 기본 user_id 조회 (org_id의 첫 번째 사용자)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE raw_user_meta_data->>'org_id' = p_org_id::text
  LIMIT 1;

  -- user_id가 없으면 시스템 계정 사용하거나 에러
  IF v_user_id IS NULL THEN
    -- org_members에서 조회
    SELECT user_id INTO v_user_id
    FROM org_members
    WHERE org_id = p_org_id
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No user found for organization'
    );
  END IF;

  -- =========================================================================
  -- 날씨 API 연결 (OpenWeatherMap)
  -- =========================================================================
  SELECT id INTO v_weather_id
  FROM api_connections
  WHERE org_id = p_org_id
    AND is_system_managed = true
    AND data_category = 'weather'
  LIMIT 1;

  IF v_weather_id IS NULL THEN
    INSERT INTO api_connections (
      name,
      type,
      provider,
      url,
      method,
      data_category,
      connection_category,
      is_system_managed,
      is_active,
      status,
      display_order,
      icon_name,
      description,
      org_id,
      store_id,
      user_id,
      target_table,
      response_data_path,
      sync_frequency,
      field_mappings
    ) VALUES (
      '날씨 데이터',
      'weather',
      'openweathermap',
      'https://api.openweathermap.org/data/2.5/forecast',
      'GET',
      'weather',
      'context',
      true,
      true,
      'active',
      10,
      'CloudSun',
      '기상청/OpenWeatherMap API를 통한 날씨 예보 데이터',
      p_org_id,
      p_store_id,
      v_user_id,
      'weather_data',
      'list',
      'hourly',
      jsonb_build_object(
        'date', 'dt_txt',
        'temperature', 'main.temp',
        'humidity', 'main.humidity',
        'weather_condition', 'weather[0].main',
        'precipitation', 'pop'
      )
    )
    RETURNING id INTO v_weather_id;
    v_created_count := v_created_count + 1;
  END IF;

  -- =========================================================================
  -- 공휴일/이벤트 API 연결
  -- =========================================================================
  SELECT id INTO v_holiday_id
  FROM api_connections
  WHERE org_id = p_org_id
    AND is_system_managed = true
    AND data_category = 'holidays'
  LIMIT 1;

  IF v_holiday_id IS NULL THEN
    INSERT INTO api_connections (
      name,
      type,
      provider,
      url,
      method,
      data_category,
      connection_category,
      is_system_managed,
      is_active,
      status,
      display_order,
      icon_name,
      description,
      org_id,
      store_id,
      user_id,
      target_table,
      response_data_path,
      sync_frequency,
      field_mappings
    ) VALUES (
      '공휴일/이벤트',
      'events',
      'korean_holidays',
      'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo',
      'GET',
      'holidays',
      'context',
      true,
      true,
      'active',
      20,
      'Calendar',
      '공공데이터포털 공휴일 정보 및 지역 이벤트',
      p_org_id,
      p_store_id,
      v_user_id,
      'holidays_events',
      'response.body.items.item',
      'daily',
      jsonb_build_object(
        'date', 'locdate',
        'event_name', 'dateName',
        'event_type', 'isHoliday'
      )
    )
    RETURNING id INTO v_holiday_id;
    v_created_count := v_created_count + 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'created_count', v_created_count,
    'weather_connection_id', v_weather_id,
    'holiday_connection_id', v_holiday_id
  );
END;
$$;

-- ============================================================================
-- Part 3: 컨텍스트 데이터 소스 조회 RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION get_context_data_sources(
  p_org_id uuid,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connections jsonb;
  v_weather_data jsonb;
  v_event_data jsonb;
BEGIN
  -- 컨텍스트 연결 조회
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ac.id,
      'name', ac.name,
      'type', ac.type,
      'provider', ac.provider,
      'data_category', ac.data_category,
      'connection_category', ac.connection_category,
      'is_system_managed', ac.is_system_managed,
      'is_active', ac.is_active,
      'status', ac.status,
      'icon_name', ac.icon_name,
      'description', ac.description,
      'last_sync', ac.last_sync,
      'total_records_synced', COALESCE(ac.total_records_synced, 0),
      'display_order', COALESCE(ac.display_order, 100)
    )
    ORDER BY ac.display_order, ac.name
  )
  INTO v_connections
  FROM api_connections ac
  WHERE ac.org_id = p_org_id
    AND ac.connection_category = 'context'
    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);

  -- 최근 날씨 데이터 요약 (선택적)
  SELECT jsonb_build_object(
    'latest_date', MAX(date),
    'record_count', COUNT(*),
    'avg_temperature', ROUND(AVG(temperature)::numeric, 1)
  )
  INTO v_weather_data
  FROM weather_data
  WHERE org_id = p_org_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND date >= CURRENT_DATE - INTERVAL '7 days';

  -- 최근 이벤트 데이터 요약 (선택적)
  SELECT jsonb_build_object(
    'latest_date', MAX(date),
    'record_count', COUNT(*),
    'upcoming_events', COUNT(*) FILTER (WHERE date >= CURRENT_DATE)
  )
  INTO v_event_data
  FROM holidays_events
  WHERE org_id = p_org_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND date >= CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'success', true,
    'connections', COALESCE(v_connections, '[]'::jsonb),
    'weather_summary', COALESCE(v_weather_data, '{}'::jsonb),
    'events_summary', COALESCE(v_event_data, '{}'::jsonb)
  );
END;
$$;

-- ============================================================================
-- Part 4: 모든 데이터 소스 조회 (비즈니스 + 컨텍스트)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_data_sources(
  p_org_id uuid,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business jsonb;
  v_context jsonb;
BEGIN
  -- 비즈니스 데이터 소스
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ac.id,
      'name', ac.name,
      'type', ac.type,
      'provider', ac.provider,
      'data_category', ac.data_category,
      'connection_category', 'business',
      'is_system_managed', COALESCE(ac.is_system_managed, false),
      'is_active', ac.is_active,
      'status', ac.status,
      'icon_name', ac.icon_name,
      'description', ac.description,
      'last_sync', ac.last_sync,
      'total_records_synced', COALESCE(ac.total_records_synced, 0),
      'display_order', COALESCE(ac.display_order, 100)
    )
    ORDER BY COALESCE(ac.display_order, 100), ac.name
  )
  INTO v_business
  FROM api_connections ac
  WHERE ac.org_id = p_org_id
    AND (ac.connection_category = 'business' OR ac.connection_category IS NULL)
    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);

  -- 컨텍스트 데이터 소스
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ac.id,
      'name', ac.name,
      'type', ac.type,
      'provider', ac.provider,
      'data_category', ac.data_category,
      'connection_category', 'context',
      'is_system_managed', COALESCE(ac.is_system_managed, false),
      'is_active', ac.is_active,
      'status', ac.status,
      'icon_name', ac.icon_name,
      'description', ac.description,
      'last_sync', ac.last_sync,
      'total_records_synced', COALESCE(ac.total_records_synced, 0),
      'display_order', COALESCE(ac.display_order, 100)
    )
    ORDER BY COALESCE(ac.display_order, 100), ac.name
  )
  INTO v_context
  FROM api_connections ac
  WHERE ac.org_id = p_org_id
    AND ac.connection_category = 'context'
    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);

  RETURN jsonb_build_object(
    'success', true,
    'business', COALESCE(v_business, '[]'::jsonb),
    'context', COALESCE(v_context, '[]'::jsonb),
    'business_count', jsonb_array_length(COALESCE(v_business, '[]'::jsonb)),
    'context_count', jsonb_array_length(COALESCE(v_context, '[]'::jsonb))
  );
END;
$$;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Context Data Sources Migration completed';
  RAISE NOTICE 'Added: api_connections.connection_category column';
  RAISE NOTICE 'Added: api_connections.is_system_managed column';
  RAISE NOTICE 'Added: api_connections.display_order column';
  RAISE NOTICE 'Added: api_connections.icon_name column';
  RAISE NOTICE 'Added: api_connections.description column';
  RAISE NOTICE 'Added: ensure_system_context_connections RPC function';
  RAISE NOTICE 'Added: get_context_data_sources RPC function';
  RAISE NOTICE 'Added: get_all_data_sources RPC function';
END $$;
