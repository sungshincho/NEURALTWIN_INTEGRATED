-- ============================================================================
-- weather_data, holidays_events 테이블 unique 제약조건 추가
-- environment-proxy Edge Function의 upsert를 위한 제약조건
-- ============================================================================

-- 1. weather_data 테이블: store_id + date 복합 unique 제약조건
DO $$
BEGIN
  -- 기존 제약조건 확인 후 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'weather_data_store_date_unique'
  ) THEN
    -- 중복 데이터 정리 (가장 최근 데이터만 유지)
    DELETE FROM weather_data w1
    WHERE EXISTS (
      SELECT 1 FROM weather_data w2
      WHERE w1.store_id = w2.store_id
        AND w1.date = w2.date
        AND w1.id < w2.id
    );

    ALTER TABLE weather_data
    ADD CONSTRAINT weather_data_store_date_unique
    UNIQUE (store_id, date);

    RAISE NOTICE 'weather_data_store_date_unique 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'weather_data_store_date_unique 제약조건 이미 존재';
  END IF;
END $$;

-- 2. holidays_events 테이블: date + event_name 복합 unique 제약조건
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'holidays_events_date_name_unique'
  ) THEN
    -- 중복 데이터 정리 (가장 최근 데이터만 유지)
    DELETE FROM holidays_events h1
    WHERE EXISTS (
      SELECT 1 FROM holidays_events h2
      WHERE h1.date = h2.date
        AND h1.event_name = h2.event_name
        AND h1.id < h2.id
    );

    ALTER TABLE holidays_events
    ADD CONSTRAINT holidays_events_date_name_unique
    UNIQUE (date, event_name);

    RAISE NOTICE 'holidays_events_date_name_unique 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'holidays_events_date_name_unique 제약조건 이미 존재';
  END IF;
END $$;

-- 3. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_weather_data_store_date
ON weather_data (store_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_holidays_events_date
ON holidays_events (date);

-- 검증
DO $$
DECLARE
  v_weather_constraint BOOLEAN;
  v_holidays_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weather_data_store_date_unique'
  ) INTO v_weather_constraint;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'holidays_events_date_name_unique'
  ) INTO v_holidays_constraint;

  RAISE NOTICE '=== 제약조건 검증 ===';
  RAISE NOTICE 'weather_data_store_date_unique: %', v_weather_constraint;
  RAISE NOTICE 'holidays_events_date_name_unique: %', v_holidays_constraint;
END $$;
