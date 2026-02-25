-- ============================================================================
-- Fix: create_api_connection RPC 함수에 type 컬럼 추가
-- ============================================================================
-- 문제: api_connections 테이블의 type 컬럼이 NOT NULL이지만
--       create_api_connection 함수에서 값을 설정하지 않아 에러 발생
-- 해결: type 컬럼에 기본값 'rest' 추가
-- ============================================================================

CREATE OR REPLACE FUNCTION create_api_connection(
  p_org_id uuid,
  p_store_id uuid,
  p_name text,
  p_provider text,
  p_data_category text,
  p_url text,
  p_auth_type text,
  p_auth_config jsonb DEFAULT '{}'::jsonb,
  p_field_mappings jsonb DEFAULT '[]'::jsonb,
  p_target_table text DEFAULT NULL,
  p_response_data_path text DEFAULT 'data'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection_id uuid;
  v_template record;
BEGIN
  -- 입력 유효성 검사
  IF p_name IS NULL OR p_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Name is required');
  END IF;

  IF p_url IS NULL OR p_url = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'URL is required');
  END IF;

  -- 매핑 템플릿 조회 (있으면 기본값 적용)
  IF p_field_mappings = '[]'::jsonb AND p_provider IS NOT NULL AND p_data_category IS NOT NULL THEN
    SELECT * INTO v_template
    FROM api_mapping_templates
    WHERE provider = p_provider
      AND data_category = p_data_category
      AND target_table = COALESCE(p_target_table, target_table)
      AND is_active = true
    ORDER BY is_official DESC, created_at DESC
    LIMIT 1;

    IF FOUND THEN
      p_field_mappings := v_template.field_mappings;
      p_target_table := COALESCE(p_target_table, v_template.target_table);
      p_response_data_path := COALESCE(p_response_data_path, v_template.response_data_path, 'data');
    END IF;
  END IF;

  -- API 연결 생성 (type 컬럼 추가)
  INSERT INTO api_connections (
    org_id,
    store_id,
    user_id,
    name,
    provider,
    data_category,
    url,
    method,
    type,  -- 추가: type 컬럼
    auth_type,
    auth_config,
    field_mappings,
    target_table,
    response_data_path,
    is_active,
    status
  ) VALUES (
    p_org_id,
    p_store_id,
    auth.uid(),
    p_name,
    p_provider,
    p_data_category,
    p_url,
    'GET',
    'rest',  -- 기본값: REST API
    COALESCE(p_auth_type, 'none'),
    p_auth_config,
    p_field_mappings,
    p_target_table,
    p_response_data_path,
    true,
    'inactive'
  )
  RETURNING id INTO v_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'connection_id', v_connection_id,
    'message', 'API connection created successfully',
    'has_template', v_template IS NOT NULL
  );
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION create_api_connection TO authenticated;
