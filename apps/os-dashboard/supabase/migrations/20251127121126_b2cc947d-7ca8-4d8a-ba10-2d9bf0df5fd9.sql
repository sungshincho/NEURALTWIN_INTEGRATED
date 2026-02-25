-- Create weather to ontology sync trigger function
CREATE OR REPLACE FUNCTION public.sync_weather_to_ontology()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
  v_weather_label text;
BEGIN
  -- Weather 엔티티 타입 찾기
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE name = 'Weather'
  LIMIT 1;

  -- Weather 엔티티 타입이 없으면 에러 (이미 스키마에 정의되어 있어야 함)
  IF v_entity_type_id IS NULL THEN
    RAISE EXCEPTION 'Weather entity type not found in ontology schema';
  END IF;

  -- 날씨 라벨 생성
  v_weather_label := NEW.weather_condition || ' - ' || NEW.date::text;
  IF NEW.store_id IS NOT NULL THEN
    v_weather_label := v_weather_label || ' (Store)';
  ELSE
    v_weather_label := v_weather_label || ' (Global)';
  END IF;

  -- 기존 엔티티 확인 (weather_id 기준)
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'weather_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      -- 기존 엔티티 업데이트
      UPDATE graph_entities
      SET
        label = v_weather_label,
        store_id = NEW.store_id,
        properties = jsonb_build_object(
          'weather_id', NEW.id,
          'date', NEW.date,
          'temperature', NEW.temperature,
          'weather_condition', NEW.weather_condition,
          'humidity', NEW.humidity,
          'precipitation', NEW.precipitation,
          'wind_speed', NEW.wind_speed,
          'is_global', NEW.is_global,
          'metadata', NEW.metadata,
          'source_table', 'weather_data',
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
    v_weather_label,
    jsonb_build_object(
      'weather_id', NEW.id,
      'date', NEW.date,
      'temperature', NEW.temperature,
      'weather_condition', NEW.weather_condition,
      'humidity', NEW.humidity,
      'precipitation', NEW.precipitation,
      'wind_speed', NEW.wind_speed,
      'is_global', NEW.is_global,
      'metadata', NEW.metadata,
      'source_table', 'weather_data',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on weather_data table
DROP TRIGGER IF EXISTS trigger_sync_weather_to_ontology ON weather_data;
CREATE TRIGGER trigger_sync_weather_to_ontology
  AFTER INSERT OR UPDATE ON weather_data
  FOR EACH ROW
  EXECUTE FUNCTION sync_weather_to_ontology();

-- Backfill existing weather data to ontology
DO $$
DECLARE
  v_entity_type_id uuid;
  v_weather_record RECORD;
  v_weather_label text;
BEGIN
  -- Weather 엔티티 타입 찾기
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE name = 'Weather'
  LIMIT 1;

  IF v_entity_type_id IS NOT NULL THEN
    -- 기존 weather_data를 graph_entities로 변환
    FOR v_weather_record IN 
      SELECT * FROM weather_data
    LOOP
      -- 이미 변환된 엔티티가 있는지 확인
      IF NOT EXISTS (
        SELECT 1 FROM graph_entities
        WHERE entity_type_id = v_entity_type_id
        AND properties->>'weather_id' = v_weather_record.id::text
      ) THEN
        -- 날씨 라벨 생성
        v_weather_label := v_weather_record.weather_condition || ' - ' || v_weather_record.date::text;
        IF v_weather_record.store_id IS NOT NULL THEN
          v_weather_label := v_weather_label || ' (Store)';
        ELSE
          v_weather_label := v_weather_label || ' (Global)';
        END IF;

        -- 새 엔티티 생성
        INSERT INTO graph_entities (
          user_id,
          org_id,
          store_id,
          entity_type_id,
          label,
          properties
        ) VALUES (
          v_weather_record.user_id,
          v_weather_record.org_id,
          v_weather_record.store_id,
          v_entity_type_id,
          v_weather_label,
          jsonb_build_object(
            'weather_id', v_weather_record.id,
            'date', v_weather_record.date,
            'temperature', v_weather_record.temperature,
            'weather_condition', v_weather_record.weather_condition,
            'humidity', v_weather_record.humidity,
            'precipitation', v_weather_record.precipitation,
            'wind_speed', v_weather_record.wind_speed,
            'is_global', v_weather_record.is_global,
            'metadata', v_weather_record.metadata,
            'source_table', 'weather_data',
            'synced_at', now()
          )
        );
      END IF;
    END LOOP;
  END IF;
END $$;