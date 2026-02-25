-- ========================================
-- Phase 2: 실시간 동기화 - Database 트리거
-- ========================================

-- 1. 트리거 함수: customers → graph_entities 자동 생성
CREATE OR REPLACE FUNCTION sync_customer_to_ontology()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  entity_type_id uuid;
  existing_entity_id uuid;
BEGIN
  -- Customer 엔티티 타입 찾기 또는 생성
  SELECT id INTO entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Customer'
  LIMIT 1;

  IF entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Customer',
      'Customer',
      'Auto-created customer entity type',
      '#3b82f6'
    )
    RETURNING id INTO entity_type_id;
  END IF;

  -- 기존 엔티티 확인 (customer_id 기준)
  IF TG_OP = 'UPDATE' THEN
    SELECT id INTO existing_entity_id
    FROM graph_entities
    WHERE user_id = NEW.user_id
      AND entity_type_id = entity_type_id
      AND properties->>'customer_id' = OLD.id::text
    LIMIT 1;

    IF existing_entity_id IS NOT NULL THEN
      -- 업데이트
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.customer_name, 'Customer ' || NEW.id),
        properties = jsonb_build_object(
          'customer_id', NEW.id,
          'customer_name', NEW.customer_name,
          'email', NEW.email,
          'phone', NEW.phone,
          'segment', NEW.segment,
          'total_purchases', NEW.total_purchases,
          'last_visit_date', NEW.last_visit_date,
          'source_table', 'customers',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- 신규 엔티티 생성
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    entity_type_id,
    COALESCE(NEW.customer_name, 'Customer ' || NEW.id),
    jsonb_build_object(
      'customer_id', NEW.id,
      'customer_name', NEW.customer_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'segment', NEW.segment,
      'total_purchases', NEW.total_purchases,
      'last_visit_date', NEW.last_visit_date,
      'source_table', 'customers',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- 2. 트리거 함수: products → graph_entities 자동 생성
CREATE OR REPLACE FUNCTION sync_product_to_ontology()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  entity_type_id uuid;
  existing_entity_id uuid;
BEGIN
  -- Product 엔티티 타입 찾기 또는 생성
  SELECT id INTO entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Product'
  LIMIT 1;

  IF entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Product',
      'Product',
      'Auto-created product entity type',
      '#10b981'
    )
    RETURNING id INTO entity_type_id;
  END IF;

  -- 기존 엔티티 확인
  IF TG_OP = 'UPDATE' THEN
    SELECT id INTO existing_entity_id
    FROM graph_entities
    WHERE user_id = NEW.user_id
      AND entity_type_id = entity_type_id
      AND properties->>'product_id' = OLD.id::text
    LIMIT 1;

    IF existing_entity_id IS NOT NULL THEN
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.product_name, 'Product ' || NEW.id),
        properties = jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.product_name,
          'category', NEW.category,
          'brand', NEW.brand,
          'price', NEW.price,
          'stock', NEW.stock,
          'source_table', 'products',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- 신규 엔티티 생성
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    entity_type_id,
    COALESCE(NEW.product_name, 'Product ' || NEW.id),
    jsonb_build_object(
      'product_id', NEW.id,
      'product_name', NEW.product_name,
      'category', NEW.category,
      'brand', NEW.brand,
      'price', NEW.price,
      'stock', NEW.stock,
      'source_table', 'products',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- 3. 트리거 함수: purchases → graph_entities + 관계 생성
CREATE OR REPLACE FUNCTION sync_purchase_to_ontology()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  entity_type_id uuid;
  purchase_entity_id uuid;
  customer_entity_id uuid;
  product_entity_id uuid;
  purchased_relation_type_id uuid;
BEGIN
  -- Purchase 엔티티 타입 찾기 또는 생성
  SELECT id INTO entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Purchase'
  LIMIT 1;

  IF entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Purchase',
      'Purchase',
      'Auto-created purchase entity type',
      '#f59e0b'
    )
    RETURNING id INTO entity_type_id;
  END IF;

  -- Purchase 엔티티 생성
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    entity_type_id,
    'Purchase ' || NEW.id,
    jsonb_build_object(
      'purchase_id', NEW.id,
      'customer_id', NEW.customer_id,
      'product_id', NEW.product_id,
      'quantity', NEW.quantity,
      'price', NEW.price,
      'total_amount', NEW.total_amount,
      'purchase_date', NEW.purchase_date,
      'source_table', 'purchases',
      'synced_at', now()
    )
  )
  RETURNING id INTO purchase_entity_id;

  -- Customer 엔티티 찾기
  SELECT ge.id INTO customer_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Customer'
    AND ge.properties->>'customer_id' = NEW.customer_id::text
  LIMIT 1;

  -- Product 엔티티 찾기
  SELECT ge.id INTO product_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Product'
    AND ge.properties->>'product_id' = NEW.product_id::text
  LIMIT 1;

  -- 'purchased' 관계 타입 찾기 또는 생성
  SELECT id INTO purchased_relation_type_id
  FROM ontology_relation_types
  WHERE user_id = NEW.user_id
    AND name = 'purchased'
  LIMIT 1;

  IF purchased_relation_type_id IS NULL THEN
    INSERT INTO ontology_relation_types (
      user_id,
      org_id,
      name,
      label,
      source_entity_type,
      target_entity_type,
      description
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'purchased',
      'purchased',
      'Customer',
      'Product',
      'Customer purchased a product'
    )
    RETURNING id INTO purchased_relation_type_id;
  END IF;

  -- Customer -> Product 관계 생성
  IF customer_entity_id IS NOT NULL AND product_entity_id IS NOT NULL THEN
    INSERT INTO graph_relations (
      user_id,
      org_id,
      store_id,
      relation_type_id,
      source_entity_id,
      target_entity_id,
      properties,
      weight
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      NEW.store_id,
      purchased_relation_type_id,
      customer_entity_id,
      product_entity_id,
      jsonb_build_object(
        'purchase_id', NEW.id,
        'quantity', NEW.quantity,
        'price', NEW.price,
        'total_amount', NEW.total_amount,
        'purchase_date', NEW.purchase_date,
        'synced_at', now()
      ),
      1.0
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. 트리거 함수: stores → graph_entities 자동 생성
CREATE OR REPLACE FUNCTION sync_store_to_ontology()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  entity_type_id uuid;
  existing_entity_id uuid;
BEGIN
  -- Store 엔티티 타입 찾기 또는 생성
  SELECT id INTO entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Store'
  LIMIT 1;

  IF entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Store',
      'Store',
      'Auto-created store entity type',
      '#8b5cf6'
    )
    RETURNING id INTO entity_type_id;
  END IF;

  -- 기존 엔티티 확인
  IF TG_OP = 'UPDATE' THEN
    SELECT id INTO existing_entity_id
    FROM graph_entities
    WHERE user_id = NEW.user_id
      AND entity_type_id = entity_type_id
      AND properties->>'store_id' = OLD.id::text
    LIMIT 1;

    IF existing_entity_id IS NOT NULL THEN
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.store_name, 'Store ' || NEW.id),
        properties = jsonb_build_object(
          'store_id', NEW.id,
          'store_name', NEW.store_name,
          'location', NEW.location,
          'store_type', NEW.store_type,
          'size_sqm', NEW.size_sqm,
          'source_table', 'stores',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- 신규 엔티티 생성
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.id,
    entity_type_id,
    COALESCE(NEW.store_name, 'Store ' || NEW.id),
    jsonb_build_object(
      'store_id', NEW.id,
      'store_name', NEW.store_name,
      'location', NEW.location,
      'store_type', NEW.store_type,
      'size_sqm', NEW.size_sqm,
      'source_table', 'stores',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS trigger_sync_customer_to_ontology ON customers;
CREATE TRIGGER trigger_sync_customer_to_ontology
  AFTER INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_to_ontology();

DROP TRIGGER IF EXISTS trigger_sync_product_to_ontology ON products;
CREATE TRIGGER trigger_sync_product_to_ontology
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_ontology();

DROP TRIGGER IF EXISTS trigger_sync_purchase_to_ontology ON purchases;
CREATE TRIGGER trigger_sync_purchase_to_ontology
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION sync_purchase_to_ontology();

DROP TRIGGER IF EXISTS trigger_sync_store_to_ontology ON stores;
CREATE TRIGGER trigger_sync_store_to_ontology
  AFTER INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION sync_store_to_ontology();

-- 6. 관계 추론 요청 테이블
CREATE TABLE IF NOT EXISTS ontology_relation_inference_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  entity_id uuid NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(entity_id, status)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_relation_inference_queue_status 
  ON ontology_relation_inference_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_relation_inference_queue_user 
  ON ontology_relation_inference_queue(user_id);

-- RLS 정책
ALTER TABLE ontology_relation_inference_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their inference queue" ON ontology_relation_inference_queue;
CREATE POLICY "Users can view their inference queue"
  ON ontology_relation_inference_queue
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage inference queue" ON ontology_relation_inference_queue;
CREATE POLICY "Service role can manage inference queue"
  ON ontology_relation_inference_queue
  FOR ALL
  USING (true);

-- 7. 트리거 함수: 새 엔티티 생성 시 관계 추론 큐에 추가
CREATE OR REPLACE FUNCTION queue_relation_inference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- 관계 추론 큐에 추가
  INSERT INTO ontology_relation_inference_queue (
    user_id,
    org_id,
    entity_id,
    status
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.id,
    'pending'
  )
  ON CONFLICT (entity_id, status) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_queue_relation_inference ON graph_entities;
CREATE TRIGGER trigger_queue_relation_inference
  AFTER INSERT ON graph_entities
  FOR EACH ROW
  EXECUTE FUNCTION queue_relation_inference();

COMMENT ON TABLE ontology_relation_inference_queue IS 'Queue for AI-based entity relation inference';
COMMENT ON FUNCTION sync_customer_to_ontology() IS 'Auto-sync customers table to graph_entities';
COMMENT ON FUNCTION sync_product_to_ontology() IS 'Auto-sync products table to graph_entities';
COMMENT ON FUNCTION sync_purchase_to_ontology() IS 'Auto-sync purchases table to graph_entities and create relations';
COMMENT ON FUNCTION sync_store_to_ontology() IS 'Auto-sync stores table to graph_entities';
COMMENT ON FUNCTION queue_relation_inference() IS 'Queue new entities for AI relation inference';