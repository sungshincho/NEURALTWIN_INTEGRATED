-- Fix all sync_*_to_ontology functions to eliminate column ambiguity
-- All functions updated to use table aliases and explicit variable references

-- 1. Fix sync_store_to_ontology
CREATE OR REPLACE FUNCTION public.sync_store_to_ontology()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Store 엔티티 타입 찾기 또는 생성
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Store'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
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
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 기존 엔티티 확인
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'store_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.store_name, 'Store ' || NEW.id),
        properties = jsonb_build_object(
          'store_id', NEW.id,
          'store_name', NEW.store_name,
          'location', NEW.location,
          'store_type', NEW.store_type,
          'area_sqm', NEW.area_sqm,
          'source_table', 'stores',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = v_existing_entity_id;
      
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
    v_entity_type_id,
    COALESCE(NEW.store_name, 'Store ' || NEW.id),
    jsonb_build_object(
      'store_id', NEW.id,
      'store_name', NEW.store_name,
      'location', NEW.location,
      'store_type', NEW.store_type,
      'area_sqm', NEW.area_sqm,
      'source_table', 'stores',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$;

-- 2. Fix sync_customer_to_ontology
CREATE OR REPLACE FUNCTION public.sync_customer_to_ontology()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Customer 엔티티 타입 찾기 또는 생성
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Customer'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
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
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 기존 엔티티 확인 (customer_id 기준)
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'customer_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
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
      WHERE id = v_existing_entity_id;
      
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
    v_entity_type_id,
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
$function$;

-- 3. Fix sync_product_to_ontology
CREATE OR REPLACE FUNCTION public.sync_product_to_ontology()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Product 엔티티 타입 찾기 또는 생성
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Product'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
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
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 기존 엔티티 확인
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'product_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
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
      WHERE id = v_existing_entity_id;
      
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
    v_entity_type_id,
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
$function$;

-- 4. Fix sync_purchase_to_ontology (preventive fix for consistency)
CREATE OR REPLACE FUNCTION public.sync_purchase_to_ontology()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_purchase_entity_id uuid;
  v_customer_entity_id uuid;
  v_product_entity_id uuid;
  v_purchased_relation_type_id uuid;
BEGIN
  -- Purchase 엔티티 타입 찾기 또는 생성
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Purchase'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
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
    RETURNING id INTO v_entity_type_id;
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
    v_entity_type_id,
    'Purchase ' || NEW.id,
    jsonb_build_object(
      'purchase_id', NEW.id,
      'customer_id', NEW.customer_id,
      'product_id', NEW.product_id,
      'quantity', NEW.quantity,
      'unit_price', NEW.unit_price,
      'total_price', NEW.total_price,
      'purchase_date', NEW.purchase_date,
      'source_table', 'purchases',
      'synced_at', now()
    )
  )
  RETURNING id INTO v_purchase_entity_id;

  -- Customer 엔티티 찾기
  SELECT ge.id INTO v_customer_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Customer'
    AND ge.properties->>'customer_id' = NEW.customer_id::text
  LIMIT 1;

  -- Product 엔티티 찾기
  SELECT ge.id INTO v_product_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Product'
    AND ge.properties->>'product_id' = NEW.product_id::text
  LIMIT 1;

  -- 'purchased' 관계 타입 찾기 또는 생성
  SELECT id INTO v_purchased_relation_type_id
  FROM ontology_relation_types
  WHERE user_id = NEW.user_id
    AND name = 'purchased'
  LIMIT 1;

  IF v_purchased_relation_type_id IS NULL THEN
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
    RETURNING id INTO v_purchased_relation_type_id;
  END IF;

  -- Customer -> Product 관계 생성
  IF v_customer_entity_id IS NOT NULL AND v_product_entity_id IS NOT NULL THEN
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
      v_purchased_relation_type_id,
      v_customer_entity_id,
      v_product_entity_id,
      jsonb_build_object(
        'purchase_id', NEW.id,
        'quantity', NEW.quantity,
        'unit_price', NEW.unit_price,
        'total_price', NEW.total_price,
        'purchase_date', NEW.purchase_date,
        'synced_at', now()
      ),
      1.0
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;