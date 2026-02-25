-- ============================================================================
-- NEURALTWIN ETL Phase 1: User Import Infrastructure
-- 유저 직접 임포트 ETL 인프라 구축
-- ============================================================================

-- 1. upload_sessions 테이블 확장
-- 기존 테이블에 문서 스펙에 맞는 컬럼 추가

-- 파일 정보 컬럼 추가
ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS file_path TEXT;

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS file_type TEXT; -- csv, xlsx, json, glb

-- 임포트 설정 컬럼 추가
ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS import_type TEXT; -- products, customers, transactions, staff, inventory, layout, 3d_models

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS target_table TEXT; -- 대상 테이블명

-- 메타데이터 컬럼 추가
ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS row_count INTEGER;

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS parsed_preview JSONB; -- 처음 10행 프리뷰

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS column_mapping JSONB; -- 사용자 정의 필드 매핑

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS validation_errors JSONB; -- 검증 에러

ALTER TABLE upload_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_upload_sessions_import_type ON upload_sessions(import_type);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_org ON upload_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_file_type ON upload_sessions(file_type);

-- 3. raw_imports 테이블에 session_id 컬럼 추가 (없는 경우)
ALTER TABLE raw_imports
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL;

ALTER TABLE raw_imports
ADD COLUMN IF NOT EXISTS file_path TEXT;

CREATE INDEX IF NOT EXISTS idx_raw_imports_session ON raw_imports(session_id);

-- 4. user_data_imports 테이블 확장
ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS import_type TEXT;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS target_table TEXT;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS total_rows INTEGER;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS imported_rows INTEGER DEFAULT 0;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS failed_rows INTEGER DEFAULT 0;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS progress JSONB; -- {"current": 500, "total": 1000, "percentage": 50}

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS error_details JSONB; -- 행별 에러 상세

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS can_resume BOOLEAN DEFAULT FALSE;

ALTER TABLE user_data_imports
ADD COLUMN IF NOT EXISTS can_pause BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_data_imports_import_type ON user_data_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_user_data_imports_target_table ON user_data_imports(target_table);

-- 5. Storage bucket 'user-imports' 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-imports',
  'user-imports',
  false,
  52428800, -- 50MB
  ARRAY[
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain',
    'text/tab-separated-values',
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. Storage RLS 정책
-- 사용자별 폴더 접근 제어
DROP POLICY IF EXISTS "Users can upload to their import folder" ON storage.objects;
CREATE POLICY "Users can upload to their import folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-imports' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'imports'
);

DROP POLICY IF EXISTS "Users can view their import files" ON storage.objects;
CREATE POLICY "Users can view their import files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-imports' AND
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can delete their import files" ON storage.objects;
CREATE POLICY "Users can delete their import files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-imports' AND
  auth.uid() IS NOT NULL
);

-- 7. upload_sessions 추가 RLS 정책 (org 기반)
DROP POLICY IF EXISTS "Org members can view upload sessions" ON upload_sessions;
CREATE POLICY "Org members can view upload sessions" ON upload_sessions
FOR SELECT USING (
  auth.uid() = user_id OR
  (org_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.org_id = upload_sessions.org_id
    AND organization_members.user_id = auth.uid()
  ))
);

-- 8. 임포트 타입별 타겟 테이블 매핑 함수
CREATE OR REPLACE FUNCTION get_import_target_table(p_import_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_import_type
    WHEN 'products' THEN 'products'
    WHEN 'customers' THEN 'customers'
    WHEN 'transactions' THEN 'transactions'
    WHEN 'staff' THEN 'staff'
    WHEN 'inventory' THEN 'inventory_levels'
    WHEN 'layout' THEN 'zones_dim,furniture'
    WHEN '3d_models' THEN 'product_models'
    ELSE p_import_type
  END;
END;
$$;

-- 9. 임포트 세션 생성 헬퍼 함수
CREATE OR REPLACE FUNCTION create_import_session(
  p_user_id UUID,
  p_store_id UUID,
  p_org_id UUID,
  p_file_name TEXT,
  p_file_path TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_import_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_target_table TEXT;
BEGIN
  v_target_table := get_import_target_table(p_import_type);

  INSERT INTO upload_sessions (
    user_id, store_id, org_id,
    file_name, file_path, file_size, file_type,
    import_type, target_table,
    status, created_at, updated_at
  )
  VALUES (
    p_user_id, p_store_id, p_org_id,
    p_file_name, p_file_path, p_file_size, p_file_type,
    p_import_type, v_target_table,
    'uploaded', NOW(), NOW()
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- 10. 세션 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_import_session_status(
  p_session_id UUID,
  p_status TEXT,
  p_row_count INTEGER DEFAULT NULL,
  p_parsed_preview JSONB DEFAULT NULL,
  p_column_mapping JSONB DEFAULT NULL,
  p_validation_errors JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE upload_sessions
  SET
    status = p_status,
    row_count = COALESCE(p_row_count, row_count),
    parsed_preview = COALESCE(p_parsed_preview, parsed_preview),
    column_mapping = COALESCE(p_column_mapping, column_mapping),
    validation_errors = COALESCE(p_validation_errors, validation_errors),
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$$;

-- 11. 임포트 타입별 필수 필드 정의 테이블
CREATE TABLE IF NOT EXISTS import_type_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type TEXT UNIQUE NOT NULL,
  target_table TEXT NOT NULL,
  required_fields JSONB NOT NULL, -- [{"name": "sku", "type": "string", "label": "상품코드"}]
  optional_fields JSONB, -- [{"name": "stock", "type": "number", "label": "재고"}]
  validation_rules JSONB, -- [{"field": "price", "rule": "min", "value": 0}]
  sample_data JSONB, -- 샘플 CSV/JSON 데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 기본 임포트 타입 스키마 삽입
INSERT INTO import_type_schemas (import_type, target_table, required_fields, optional_fields, validation_rules, sample_data)
VALUES
  -- Products
  ('products', 'products',
   '[{"name": "product_name", "type": "string", "label": "상품명"},
     {"name": "sku", "type": "string", "label": "상품코드", "unique": true},
     {"name": "category", "type": "string", "label": "카테고리"},
     {"name": "price", "type": "number", "label": "가격"}]'::jsonb,
   '[{"name": "cost_price", "type": "number", "label": "원가"},
     {"name": "stock", "type": "number", "label": "재고"},
     {"name": "display_type", "type": "enum", "label": "진열타입", "options": ["hanging", "standing", "folded", "located", "boxed", "stacked"]},
     {"name": "image_url", "type": "string", "label": "이미지URL"},
     {"name": "description", "type": "text", "label": "설명"}]'::jsonb,
   '[{"field": "sku", "rule": "unique"},
     {"field": "price", "rule": "min", "value": 0},
     {"field": "stock", "rule": "min", "value": 0}]'::jsonb,
   '{"csv": "product_name,sku,category,price,stock,display_type\n프리미엄 캐시미어 코트,SKU-OUT-001,아우터,450000,15,hanging\n실크 블라우스,SKU-TOP-001,상의,120000,25,hanging"}'::jsonb
  ),
  -- Customers
  ('customers', 'customers',
   '[{"name": "customer_name", "type": "string", "label": "고객명"}]'::jsonb,
   '[{"name": "email", "type": "email", "label": "이메일", "unique": true},
     {"name": "phone", "type": "phone", "label": "전화번호"},
     {"name": "segment", "type": "enum", "label": "등급", "options": ["VIP", "Regular", "New", "Dormant"]},
     {"name": "total_purchases", "type": "number", "label": "총구매액"},
     {"name": "last_visit_date", "type": "date", "label": "마지막방문일"}]'::jsonb,
   '[{"field": "email", "rule": "email_format"},
     {"field": "phone", "rule": "phone_format"}]'::jsonb,
   '{"csv": "customer_name,email,phone,segment,total_purchases\n김철수,kim@example.com,010-1234-5678,VIP,2500000\n이영희,lee@example.com,010-2345-6789,Regular,450000"}'::jsonb
  ),
  -- Staff
  ('staff', 'staff',
   '[{"name": "staff_name", "type": "string", "label": "직원명"},
     {"name": "staff_code", "type": "string", "label": "직원코드", "unique": true},
     {"name": "role", "type": "enum", "label": "역할", "options": ["manager", "sales", "cashier", "security", "fitting", "greeter"]}]'::jsonb,
   '[{"name": "email", "type": "email", "label": "이메일"},
     {"name": "phone", "type": "phone", "label": "전화번호"},
     {"name": "department", "type": "string", "label": "부서"},
     {"name": "assigned_zone", "type": "string", "label": "담당구역"}]'::jsonb,
   '[{"field": "staff_code", "rule": "unique"}]'::jsonb,
   '{"csv": "staff_code,staff_name,role,department,email,assigned_zone\nEMP001,매니저,manager,관리,manager@store.com,Z002\nEMP002,판매직원 1,sales,판매,sales1@store.com,Z003"}'::jsonb
  ),
  -- Inventory
  ('inventory', 'inventory_levels',
   '[{"name": "product_sku", "type": "string", "label": "상품코드"},
     {"name": "quantity", "type": "number", "label": "수량"}]'::jsonb,
   '[{"name": "min_stock", "type": "number", "label": "최소재고"},
     {"name": "max_stock", "type": "number", "label": "최대재고"},
     {"name": "reorder_point", "type": "number", "label": "재주문점"},
     {"name": "location", "type": "string", "label": "위치"}]'::jsonb,
   '[{"field": "quantity", "rule": "min", "value": 0}]'::jsonb,
   '{"csv": "product_sku,quantity,min_stock,max_stock,reorder_point\nSKU-OUT-001,15,5,30,10\nSKU-TOP-001,25,10,50,15"}'::jsonb
  ),
  -- Transactions
  ('transactions', 'transactions',
   '[{"name": "transaction_date", "type": "date", "label": "거래일"},
     {"name": "total_amount", "type": "number", "label": "총금액"}]'::jsonb,
   '[{"name": "customer_email", "type": "email", "label": "고객이메일"},
     {"name": "payment_method", "type": "string", "label": "결제수단"},
     {"name": "item_sku", "type": "string", "label": "상품코드"},
     {"name": "quantity", "type": "number", "label": "수량"},
     {"name": "unit_price", "type": "number", "label": "단가"}]'::jsonb,
   '[{"field": "total_amount", "rule": "min", "value": 0},
     {"field": "transaction_date", "rule": "date_not_future"}]'::jsonb,
   '{"csv": "transaction_date,total_amount,payment_method,customer_email,item_sku,quantity,unit_price\n2025-01-10,450000,card,kim@example.com,SKU-OUT-001,1,450000"}'::jsonb
  )
ON CONFLICT (import_type) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  optional_fields = EXCLUDED.optional_fields,
  validation_rules = EXCLUDED.validation_rules,
  sample_data = EXCLUDED.sample_data,
  updated_at = NOW();

-- 13. 임포트 스키마 조회 함수
CREATE OR REPLACE FUNCTION get_import_schema(p_import_type TEXT)
RETURNS TABLE (
  import_type TEXT,
  target_table TEXT,
  required_fields JSONB,
  optional_fields JSONB,
  validation_rules JSONB,
  sample_data JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    its.import_type,
    its.target_table,
    its.required_fields,
    its.optional_fields,
    its.validation_rules,
    its.sample_data
  FROM import_type_schemas its
  WHERE its.import_type = p_import_type;
END;
$$;

-- 14. 활성 임포트 세션 조회 함수
CREATE OR REPLACE FUNCTION get_active_import_sessions(
  p_user_id UUID,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  import_type TEXT,
  target_table TEXT,
  status TEXT,
  row_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    us.file_name,
    us.import_type,
    us.target_table,
    us.status,
    us.row_count,
    us.created_at,
    us.updated_at
  FROM upload_sessions us
  WHERE us.user_id = p_user_id
    AND (p_store_id IS NULL OR us.store_id = p_store_id)
    AND us.status NOT IN ('completed', 'failed')
  ORDER BY us.updated_at DESC;
END;
$$;

COMMENT ON TABLE import_type_schemas IS '임포트 타입별 스키마 정의 - 필수/선택 필드, 검증 규칙, 샘플 데이터';
COMMENT ON FUNCTION create_import_session IS '새 임포트 세션 생성';
COMMENT ON FUNCTION update_import_session_status IS '임포트 세션 상태 업데이트';
COMMENT ON FUNCTION get_import_schema IS '임포트 타입별 스키마 조회';
COMMENT ON FUNCTION get_active_import_sessions IS '활성 임포트 세션 목록 조회';
