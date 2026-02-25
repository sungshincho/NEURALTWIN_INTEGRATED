-- Fix sync_store_to_ontology to use existing area_sqm column instead of nonexistent size_sqm
CREATE OR REPLACE FUNCTION public.sync_store_to_ontology()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
          'area_sqm', NEW.area_sqm,
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
      'area_sqm', NEW.area_sqm,
      'source_table', 'stores',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$;