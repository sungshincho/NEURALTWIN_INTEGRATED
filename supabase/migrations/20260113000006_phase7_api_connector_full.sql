-- ============================================================================
-- Phase 7: API Connector 전체 구현 - 스키마 확장
-- ============================================================================
-- 1. api_connections 테이블 추가 확장 (data_category, field_mappings, target_table)
-- 2. api_mapping_templates 테이블 생성 (공급자별 기본 매핑 템플릿)
-- 3. raw_imports 테이블 API 연동 컬럼 추가
-- 4. ETL 파이프라인 지원 RPC 함수
-- ============================================================================

-- ============================================================================
-- Part 0: 기존 함수 삭제 (재생성 위해)
-- ============================================================================

DROP FUNCTION IF EXISTS create_api_connection(uuid, uuid, text, text, text, text, text, jsonb, jsonb, text, text);
DROP FUNCTION IF EXISTS execute_api_sync(uuid);
DROP FUNCTION IF EXISTS get_api_mapping_template(text, text);

-- ============================================================================
-- Phase 7-1: api_connections 테이블 추가 확장
-- ============================================================================

-- data_category 컬럼 추가 (pos, crm, erp, ecommerce, analytics, sensor, custom)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'data_category'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN data_category text
      CHECK (data_category IN ('pos', 'crm', 'erp', 'ecommerce', 'analytics', 'sensor', 'custom'));
    COMMENT ON COLUMN api_connections.data_category IS '데이터 카테고리: pos, crm, erp, ecommerce, analytics, sensor, custom';
  END IF;
END $$;

-- field_mappings 컬럼 추가 (소스→타겟 필드 매핑)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'field_mappings'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN field_mappings jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN api_connections.field_mappings IS '필드 매핑: [{source: "api_field", target: "db_column", transform: "type"}]';
  END IF;
END $$;

-- target_table 컬럼 추가 (ETL 대상 테이블)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'target_table'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN target_table text;
    COMMENT ON COLUMN api_connections.target_table IS 'ETL 대상 테이블: transactions, customers, products, visits 등';
  END IF;
END $$;

-- response_data_path 컬럼 추가 (응답에서 데이터 배열 경로)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'response_data_path'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN response_data_path text DEFAULT 'data';
    COMMENT ON COLUMN api_connections.response_data_path IS '응답 데이터 경로: data, results, items, data.records 등';
  END IF;
END $$;

-- pagination_type 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'pagination_type'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN pagination_type text DEFAULT 'none'
      CHECK (pagination_type IN ('none', 'offset', 'cursor', 'page', 'link'));
    COMMENT ON COLUMN api_connections.pagination_type IS '페이지네이션 타입: none, offset, cursor, page, link';
  END IF;
END $$;

-- pagination_config 컬럼 추가 (이미 존재할 수 있음 - Phase 6의 sync_endpoints에서)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'pagination_config'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN pagination_config jsonb DEFAULT '{
      "page_param": "page",
      "limit_param": "limit",
      "default_limit": 100
    }'::jsonb;
    COMMENT ON COLUMN api_connections.pagination_config IS '페이지네이션 설정';
  END IF;
END $$;

-- sync_frequency 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'sync_frequency'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN sync_frequency text DEFAULT 'manual'
      CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual'));
    COMMENT ON COLUMN api_connections.sync_frequency IS '동기화 주기: realtime, hourly, daily, weekly, manual';
  END IF;
END $$;

-- sync_config 컬럼 추가 (동기화 상세 설정)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'sync_config'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN sync_config jsonb DEFAULT '{
      "mode": "incremental",
      "incremental_key": "updated_at",
      "batch_size": 100
    }'::jsonb;
    COMMENT ON COLUMN api_connections.sync_config IS '동기화 설정: mode, incremental_key, batch_size';
  END IF;
END $$;

-- total_records_synced 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'total_records_synced'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN total_records_synced integer DEFAULT 0;
    COMMENT ON COLUMN api_connections.total_records_synced IS '총 동기화된 레코드 수';
  END IF;
END $$;

-- last_sync_duration_ms 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_connections' AND column_name = 'last_sync_duration_ms'
  ) THEN
    ALTER TABLE api_connections ADD COLUMN last_sync_duration_ms integer;
    COMMENT ON COLUMN api_connections.last_sync_duration_ms IS '마지막 동기화 소요 시간 (ms)';
  END IF;
END $$;

-- 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_api_connections_data_category ON api_connections(data_category);
CREATE INDEX IF NOT EXISTS idx_api_connections_target_table ON api_connections(target_table);
CREATE INDEX IF NOT EXISTS idx_api_connections_sync_frequency ON api_connections(sync_frequency);

-- ============================================================================
-- Phase 7-2: api_mapping_templates 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_mapping_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 템플릿 식별
  provider text NOT NULL,           -- toast, square, shopify, stripe, etc.
  data_category text NOT NULL       -- pos, crm, erp, ecommerce
    CHECK (data_category IN ('pos', 'crm', 'erp', 'ecommerce', 'analytics', 'sensor', 'custom')),
  target_table text NOT NULL,       -- transactions, customers, products

  -- 템플릿 정보
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0',

  -- API 설정 기본값
  default_endpoint text,            -- /api/v1/orders
  default_method text DEFAULT 'GET',
  default_headers jsonb DEFAULT '{}'::jsonb,

  -- 응답 처리
  response_data_path text,          -- data.orders, results

  -- 필드 매핑 (기본 템플릿)
  field_mappings jsonb NOT NULL,    -- [{source, target, transform, required}]
  -- 예: [
  --   {"source": "order_id", "target": "external_id", "transform": "to_string", "required": true},
  --   {"source": "total", "target": "total_amount", "transform": "to_decimal"},
  --   {"source": "created_at", "target": "transaction_date", "transform": "to_timestamp"}
  -- ]

  -- 페이지네이션 기본값
  pagination_type text DEFAULT 'offset',
  pagination_config jsonb DEFAULT '{}'::jsonb,

  -- 인증 타입 힌트
  suggested_auth_type text DEFAULT 'api_key',
  auth_config_hints jsonb DEFAULT '{}'::jsonb,

  -- 메타데이터
  is_official boolean DEFAULT false,  -- 공식 템플릿 여부
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- 고유 제약
  UNIQUE(provider, data_category, target_table, version)
);

-- api_mapping_templates 인덱스
CREATE INDEX IF NOT EXISTS idx_api_mapping_templates_provider ON api_mapping_templates(provider);
CREATE INDEX IF NOT EXISTS idx_api_mapping_templates_data_category ON api_mapping_templates(data_category);
CREATE INDEX IF NOT EXISTS idx_api_mapping_templates_target_table ON api_mapping_templates(target_table);
CREATE INDEX IF NOT EXISTS idx_api_mapping_templates_is_official ON api_mapping_templates(is_official);

-- api_mapping_templates 트리거
DROP TRIGGER IF EXISTS update_api_mapping_templates_updated_at ON api_mapping_templates;
CREATE TRIGGER update_api_mapping_templates_updated_at
  BEFORE UPDATE ON api_mapping_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- api_mapping_templates 코멘트
COMMENT ON TABLE api_mapping_templates IS '공급자별 API 필드 매핑 템플릿 - 자동 매핑 지원';

-- ============================================================================
-- Phase 7-3: 기본 매핑 템플릿 삽입
-- ============================================================================

-- Toast POS - 거래 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'toast', 'pos', 'transactions',
  'Toast POS - Orders', 'Toast POS 주문 데이터 기본 매핑',
  '/orders/v2/orders', 'orders',
  '[
    {"source": "guid", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "businessDate", "target": "transaction_date", "transform": "to_date", "required": true},
    {"source": "openedDate", "target": "transaction_time", "transform": "to_timestamp"},
    {"source": "totalAmount", "target": "total_amount", "transform": "to_decimal"},
    {"source": "netAmount", "target": "net_amount", "transform": "to_decimal"},
    {"source": "taxAmount", "target": "tax_amount", "transform": "to_decimal"},
    {"source": "discountAmount", "target": "discount_amount", "transform": "to_decimal"},
    {"source": "paymentStatus", "target": "payment_status", "transform": "to_string"},
    {"source": "customer.guid", "target": "customer_external_id", "transform": "to_string"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "startDate", "cursor_format": "YYYY-MM-DD"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- Square POS - 거래 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'square', 'pos', 'transactions',
  'Square - Payments', 'Square 결제 데이터 기본 매핑',
  '/v2/payments', 'payments',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "created_at", "target": "transaction_date", "transform": "to_date", "required": true},
    {"source": "created_at", "target": "transaction_time", "transform": "to_timestamp"},
    {"source": "amount_money.amount", "target": "total_amount", "transform": "cents_to_decimal"},
    {"source": "tip_money.amount", "target": "tip_amount", "transform": "cents_to_decimal"},
    {"source": "processing_fee[0].amount_money.amount", "target": "processing_fee", "transform": "cents_to_decimal"},
    {"source": "status", "target": "payment_status", "transform": "to_string"},
    {"source": "customer_id", "target": "customer_external_id", "transform": "to_string"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "cursor", "cursor_field": "cursor"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- Shopify - 주문 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'shopify', 'ecommerce', 'transactions',
  'Shopify - Orders', 'Shopify 주문 데이터 기본 매핑',
  '/admin/api/2024-01/orders.json', 'orders',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "created_at", "target": "transaction_date", "transform": "to_date", "required": true},
    {"source": "created_at", "target": "transaction_time", "transform": "to_timestamp"},
    {"source": "total_price", "target": "total_amount", "transform": "to_decimal"},
    {"source": "subtotal_price", "target": "subtotal_amount", "transform": "to_decimal"},
    {"source": "total_tax", "target": "tax_amount", "transform": "to_decimal"},
    {"source": "total_discounts", "target": "discount_amount", "transform": "to_decimal"},
    {"source": "financial_status", "target": "payment_status", "transform": "to_string"},
    {"source": "customer.id", "target": "customer_external_id", "transform": "to_string"}
  ]'::jsonb,
  'link', '{"link_header": "Link", "rel": "next"}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- Stripe - 결제 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'stripe', 'pos', 'transactions',
  'Stripe - Charges', 'Stripe 결제 데이터 기본 매핑',
  '/v1/charges', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "created", "target": "transaction_date", "transform": "unix_to_date", "required": true},
    {"source": "created", "target": "transaction_time", "transform": "unix_to_timestamp"},
    {"source": "amount", "target": "total_amount", "transform": "cents_to_decimal"},
    {"source": "amount_refunded", "target": "refund_amount", "transform": "cents_to_decimal"},
    {"source": "status", "target": "payment_status", "transform": "to_string"},
    {"source": "customer", "target": "customer_external_id", "transform": "to_string"},
    {"source": "currency", "target": "currency", "transform": "to_uppercase"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "starting_after", "cursor_field": "id", "limit_param": "limit"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- Generic CRM - 고객 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'crm', 'customers',
  'Generic CRM - Customers', '일반 CRM 고객 데이터 기본 매핑',
  '/api/customers', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "email", "target": "email", "transform": "to_lowercase"},
    {"source": "first_name", "target": "first_name", "transform": "to_string"},
    {"source": "last_name", "target": "last_name", "transform": "to_string"},
    {"source": "phone", "target": "phone_number", "transform": "to_string"},
    {"source": "created_at", "target": "registered_date", "transform": "to_date"},
    {"source": "total_spent", "target": "lifetime_value", "transform": "to_decimal"},
    {"source": "visit_count", "target": "total_visits", "transform": "to_integer"},
    {"source": "tags", "target": "customer_tags", "transform": "to_array"}
  ]'::jsonb,
  'offset', '{"page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- Generic POS - 상품 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'pos', 'products',
  'Generic POS - Products', '일반 POS 상품 데이터 기본 매핑',
  '/api/products', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "sku", "target": "sku", "transform": "to_string", "required": true},
    {"source": "name", "target": "name", "transform": "to_string", "required": true},
    {"source": "description", "target": "description", "transform": "to_string"},
    {"source": "price", "target": "price", "transform": "to_decimal"},
    {"source": "cost", "target": "cost", "transform": "to_decimal"},
    {"source": "category", "target": "category_name", "transform": "to_string"},
    {"source": "brand", "target": "brand_name", "transform": "to_string"},
    {"source": "stock_quantity", "target": "stock_count", "transform": "to_integer"},
    {"source": "is_active", "target": "is_active", "transform": "to_boolean"}
  ]'::jsonb,
  'offset', '{"page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- Phase 7-4: raw_imports 테이블 API 연동 컬럼 추가
-- ============================================================================

-- api_connection_id 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_imports' AND column_name = 'api_connection_id'
  ) THEN
    ALTER TABLE raw_imports ADD COLUMN api_connection_id uuid REFERENCES api_connections(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_raw_imports_api_connection_id ON raw_imports(api_connection_id);
    COMMENT ON COLUMN raw_imports.api_connection_id IS 'API 연결 ID (API 동기화로 생성된 경우)';
  END IF;
END $$;

-- api_response_meta 컬럼 추가 (API 응답 메타데이터)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_imports' AND column_name = 'api_response_meta'
  ) THEN
    ALTER TABLE raw_imports ADD COLUMN api_response_meta jsonb DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN raw_imports.api_response_meta IS 'API 응답 메타데이터: {status_code, headers, pagination_info}';
  END IF;
END $$;

-- sync_batch_id 컬럼 추가 (동기화 배치 ID)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_imports' AND column_name = 'sync_batch_id'
  ) THEN
    ALTER TABLE raw_imports ADD COLUMN sync_batch_id uuid;
    CREATE INDEX IF NOT EXISTS idx_raw_imports_sync_batch_id ON raw_imports(sync_batch_id);
    COMMENT ON COLUMN raw_imports.sync_batch_id IS '동기화 배치 ID (같은 동기화 작업의 여러 페이지)';
  END IF;
END $$;

-- ============================================================================
-- Phase 7-5: RPC 함수 - API 연결 생성
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

  -- API 연결 생성
  INSERT INTO api_connections (
    org_id,
    store_id,
    user_id,
    name,
    provider,
    data_category,
    url,
    method,
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

-- ============================================================================
-- Phase 7-6: RPC 함수 - API 매핑 템플릿 조회
-- ============================================================================

CREATE OR REPLACE FUNCTION get_api_mapping_template(
  p_provider text,
  p_data_category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_templates jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'provider', provider,
    'data_category', data_category,
    'target_table', target_table,
    'name', name,
    'description', description,
    'default_endpoint', default_endpoint,
    'response_data_path', response_data_path,
    'field_mappings', field_mappings,
    'pagination_type', pagination_type,
    'pagination_config', pagination_config,
    'suggested_auth_type', suggested_auth_type,
    'is_official', is_official
  ))
  INTO v_templates
  FROM api_mapping_templates
  WHERE (p_provider IS NULL OR provider = p_provider)
    AND (p_data_category IS NULL OR data_category = p_data_category)
    AND is_active = true
  ORDER BY is_official DESC, provider, data_category;

  RETURN jsonb_build_object(
    'success', true,
    'templates', COALESCE(v_templates, '[]'::jsonb),
    'count', COALESCE(jsonb_array_length(v_templates), 0)
  );
END;
$$;

-- ============================================================================
-- Phase 7-7: RPC 함수 - API 동기화 실행 (메타데이터 준비)
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_api_sync(
  p_connection_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connection record;
  v_batch_id uuid;
  v_log_id uuid;
BEGIN
  -- 연결 정보 조회
  SELECT * INTO v_connection
  FROM api_connections
  WHERE id = p_connection_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Connection not found or inactive'
    );
  END IF;

  -- 배치 ID 생성
  v_batch_id := gen_random_uuid();

  -- 동기화 로그 생성
  INSERT INTO api_sync_logs (
    api_connection_id,
    sync_endpoint_id,
    status,
    org_id
  )
  SELECT
    p_connection_id,
    se.id,
    'running',
    v_connection.org_id
  FROM sync_endpoints se
  WHERE se.api_connection_id = p_connection_id
    AND se.is_active = true
  RETURNING id INTO v_log_id;

  -- 연결 상태 업데이트
  UPDATE api_connections
  SET status = 'testing'
  WHERE id = p_connection_id;

  -- Edge Function에서 실제 API 호출 수행
  -- 여기서는 메타데이터만 반환
  RETURN jsonb_build_object(
    'success', true,
    'connection_id', p_connection_id,
    'batch_id', v_batch_id,
    'log_id', v_log_id,
    'connection', jsonb_build_object(
      'name', v_connection.name,
      'url', v_connection.url,
      'method', v_connection.method,
      'auth_type', v_connection.auth_type,
      'auth_config', v_connection.auth_config,
      'field_mappings', v_connection.field_mappings,
      'target_table', v_connection.target_table,
      'response_data_path', v_connection.response_data_path,
      'pagination_type', v_connection.pagination_type,
      'pagination_config', v_connection.pagination_config
    ),
    'message', 'Sync initiated, proceed with Edge Function call'
  );
END;
$$;

-- ============================================================================
-- Phase 7-8: RPC 함수 - 동기화 결과 기록
-- ============================================================================

CREATE OR REPLACE FUNCTION record_sync_result(
  p_connection_id uuid,
  p_batch_id uuid,
  p_status text,
  p_records_fetched integer DEFAULT 0,
  p_records_created integer DEFAULT 0,
  p_records_updated integer DEFAULT 0,
  p_records_failed integer DEFAULT 0,
  p_error_message text DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 동기화 로그 업데이트
  UPDATE api_sync_logs
  SET
    completed_at = now(),
    status = p_status,
    records_fetched = p_records_fetched,
    records_created = p_records_created,
    records_updated = p_records_updated,
    records_failed = p_records_failed,
    error_message = p_error_message,
    error_details = p_error_details,
    duration_ms = p_duration_ms
  WHERE api_connection_id = p_connection_id
    AND status = 'running';

  -- API 연결 상태 업데이트
  UPDATE api_connections
  SET
    status = CASE
      WHEN p_status = 'success' THEN 'active'
      WHEN p_status = 'failed' THEN 'error'
      ELSE 'inactive'
    END,
    last_sync = now(),
    last_error = p_error_message,
    total_records_synced = total_records_synced + p_records_created + p_records_updated,
    last_sync_duration_ms = p_duration_ms
  WHERE id = p_connection_id;

  RETURN jsonb_build_object(
    'success', true,
    'connection_id', p_connection_id,
    'batch_id', p_batch_id,
    'status', p_status,
    'message', 'Sync result recorded'
  );
END;
$$;

-- ============================================================================
-- Phase 7-9: RPC 함수 - 연결 목록 조회 (대시보드용)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_api_connections_dashboard(
  p_org_id uuid DEFAULT NULL,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connections jsonb;
  v_summary jsonb;
BEGIN
  -- 연결 목록 조회
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ac.id,
      'name', ac.name,
      'provider', ac.provider,
      'data_category', ac.data_category,
      'url', ac.url,
      'auth_type', ac.auth_type,
      'status', ac.status,
      'target_table', ac.target_table,
      'sync_frequency', ac.sync_frequency,
      'last_sync', ac.last_sync,
      'last_tested_at', ac.last_tested_at,
      'last_error', ac.last_error,
      'total_records_synced', ac.total_records_synced,
      'last_sync_duration_ms', ac.last_sync_duration_ms,
      'is_active', ac.is_active,
      'created_at', ac.created_at
    )
    ORDER BY ac.created_at DESC
  )
  INTO v_connections
  FROM api_connections ac
  WHERE (p_org_id IS NULL OR ac.org_id = p_org_id)
    AND (p_store_id IS NULL OR ac.store_id = p_store_id);

  -- 요약 정보
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'error', COUNT(*) FILTER (WHERE status = 'error'),
    'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
    'by_category', jsonb_object_agg(
      COALESCE(data_category, 'unknown'),
      category_count
    )
  )
  INTO v_summary
  FROM (
    SELECT
      data_category,
      COUNT(*) as category_count
    FROM api_connections
    WHERE (p_org_id IS NULL OR org_id = p_org_id)
      AND (p_store_id IS NULL OR store_id = p_store_id)
    GROUP BY data_category
  ) sub
  CROSS JOIN (
    SELECT COUNT(*) as total
    FROM api_connections
    WHERE (p_org_id IS NULL OR org_id = p_org_id)
      AND (p_store_id IS NULL OR store_id = p_store_id)
  ) totals;

  RETURN jsonb_build_object(
    'success', true,
    'connections', COALESCE(v_connections, '[]'::jsonb),
    'summary', COALESCE(v_summary, '{}'::jsonb)
  );
END;
$$;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Phase 7 API Connector Full Implementation - Schema Extension completed';
  RAISE NOTICE 'Tables: api_connections (extended), api_mapping_templates (new)';
  RAISE NOTICE 'Templates: toast, square, shopify, stripe, generic (pos/crm/products)';
  RAISE NOTICE 'RPC Functions: create_api_connection, get_api_mapping_template, execute_api_sync, record_sync_result, get_api_connections_dashboard';
END $$;
