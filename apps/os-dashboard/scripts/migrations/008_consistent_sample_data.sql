-- ============================================================================
-- NEURALTWIN 일관성 있는 샘플 데이터셋 v5.0
-- ============================================================================
-- 모든 테이블 간 수학적 일관성 보장
--
-- 데이터 흐름:
--   customers (2,500명)
--     → store_visits (3,500건, 재방문 포함)
--       → daily_kpis_agg (store_visits 기반 집계)
--       → funnel_events (store_visits와 1:1 매핑)
--       → zone_events (store_visits 기반)
-- ============================================================================

-- STEP 0: 기존 데이터 정리
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 0: 기존 샘플 데이터 정리';
  RAISE NOTICE '====================================';

  -- 의존성 순서대로 삭제
  DELETE FROM zone_events WHERE store_id = v_store_id;
  DELETE FROM funnel_events WHERE store_id = v_store_id;
  DELETE FROM store_visits WHERE store_id = v_store_id;
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
  DELETE FROM hourly_metrics WHERE store_id = v_store_id;
  DELETE FROM line_items WHERE store_id = v_store_id;
  DELETE FROM product_performance_agg WHERE store_id = v_store_id;
  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;
  DELETE FROM customers WHERE store_id = v_store_id;

  RAISE NOTICE '기존 데이터 삭제 완료';
END $$;

-- ============================================================================
-- STEP 1: 고객 생성 (2,500명)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  i INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 1: 고객 2,500명 생성';
  RAISE NOTICE '====================================';

  FOR i IN 1..2500 LOOP
    INSERT INTO customers (id, store_id, user_id, org_id, customer_name, email, phone, segment, total_purchases, created_at)
    VALUES (
      ('c' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      (ARRAY['김','이','박','최','정','강','조','윤','장','임'])[1+floor(random()*10)::INT] ||
      (ARRAY['민수','지영','현우','수진','준호','예진','도윤','서연','시우','하윤'])[1+floor(random()*10)::INT],
      'customer'||i||'@example.com',
      '010-'||LPAD(floor(random()*9000+1000)::TEXT,4,'0')||'-'||LPAD(floor(random()*9000+1000)::TEXT,4,'0'),
      CASE
        WHEN i <= 125 THEN 'vip'        -- 5% VIP
        WHEN i <= 625 THEN 'regular'    -- 20% Regular
        ELSE 'new'                       -- 75% New
      END,
      CASE
        WHEN i <= 125 THEN 3000000 + floor(random()*2000000)::INT
        WHEN i <= 625 THEN 500000 + floor(random()*1000000)::INT
        ELSE floor(random()*300000)::INT
      END,
      NOW() - ((random()*365)||' days')::INTERVAL
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'STEP 1 완료: 고객 2,500명 생성됨';
END $$;

-- ============================================================================
-- STEP 2: store_visits 생성 (현실적 재방문 분포)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[];

  -- 방문 분포: 총 3,500건, 2,500명
  -- 1회 방문: 75% (1,875명 × 1 = 1,875건)
  -- 2회 방문: 15% (375명 × 2 = 750건)
  -- 3회 방문: 7% (175명 × 3 = 525건)
  -- 4회+ 방문: 3% (75명 × 평균 4.67 = 350건)
  -- 합계: 2,500명, 3,500건, 재방문률 25%

  v_single_count INT := 1875;
  v_double_count INT := 375;
  v_triple_count INT := 175;
  v_multi_count INT := 75;

  v_customer_idx INT := 1;
  v_visit_date TIMESTAMPTZ;
  v_duration INT;
  v_path UUID[];
  v_made_purchase BOOLEAN;
  v_day_offset INT;
  i INT;
  j INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  -- 존 ID 배열
  SELECT ARRAY_AGG(id) INTO v_zone_ids FROM zones_dim WHERE store_id = v_store_id;

  IF v_zone_ids IS NULL OR array_length(v_zone_ids, 1) IS NULL THEN
    v_zone_ids := ARRAY[
      'a0000001-0000-0000-0000-000000000001'::UUID,
      'a0000002-0000-0000-0000-000000000002'::UUID,
      'a0000003-0000-0000-0000-000000000003'::UUID,
      'a0000004-0000-0000-0000-000000000004'::UUID,
      'a0000005-0000-0000-0000-000000000005'::UUID,
      'a0000006-0000-0000-0000-000000000006'::UUID,
      'a0000007-0000-0000-0000-000000000007'::UUID
    ];
  END IF;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 2: store_visits 생성 (재방문 포함)';
  RAISE NOTICE '====================================';

  -- 1회 방문 고객 (1,875명)
  FOR i IN 1..v_single_count LOOP
    v_day_offset := floor(random() * 90)::INT;
    v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
    v_duration := 5 + floor(random() * 55)::INT;
    v_made_purchase := random() < 0.12;

    v_path := ARRAY[v_zone_ids[1]];
    FOR j IN 2..(2 + floor(random() * 4)::INT) LOOP
      v_path := array_append(v_path, v_zone_ids[1 + floor(random() * array_length(v_zone_ids, 1))::INT]);
    END LOOP;

    INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id,
      ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_visit_date,
      v_visit_date + (v_duration || ' minutes')::INTERVAL,
      v_duration,
      v_path,
      '{}'::jsonb,
      v_made_purchase,
      v_visit_date
    );

    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  1회 방문: %명', v_single_count;

  -- 2회 방문 고객 (375명 × 2 = 750건)
  FOR i IN 1..v_double_count LOOP
    FOR j IN 1..2 LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 5 + floor(random() * 55)::INT;
      v_made_purchase := random() < 0.15;

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(2 + floor(random() * 4)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1 + floor(random() * array_length(v_zone_ids, 1))::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id,
        ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
        v_visit_date,
        v_visit_date + (v_duration || ' minutes')::INTERVAL,
        v_duration,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  2회 방문: %명 (%건)', v_double_count, v_double_count * 2;

  -- 3회 방문 고객 (175명 × 3 = 525건)
  FOR i IN 1..v_triple_count LOOP
    FOR j IN 1..3 LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 5 + floor(random() * 55)::INT;
      v_made_purchase := random() < 0.18;

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(2 + floor(random() * 4)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1 + floor(random() * array_length(v_zone_ids, 1))::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id,
        ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
        v_visit_date,
        v_visit_date + (v_duration || ' minutes')::INTERVAL,
        v_duration,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  3회 방문: %명 (%건)', v_triple_count, v_triple_count * 3;

  -- 4회+ 방문 고객 (75명 × 평균 4.67 = ~350건)
  FOR i IN 1..v_multi_count LOOP
    FOR j IN 1..(4 + floor(random() * 3)::INT) LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 5 + floor(random() * 55)::INT;
      v_made_purchase := random() < 0.22;

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(2 + floor(random() * 4)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1 + floor(random() * array_length(v_zone_ids, 1))::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id,
        ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
        v_visit_date,
        v_visit_date + (v_duration || ' minutes')::INTERVAL,
        v_duration,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  4회+ 방문: %명', v_multi_count;
  RAISE NOTICE 'STEP 2 완료';
END $$;

-- ============================================================================
-- STEP 3: daily_kpis_agg 생성 (store_visits 기반 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_total_visitors INT;
  v_unique_visitors INT;
  v_returning_visitors INT;
  v_total_revenue NUMERIC;
  v_purchases INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 3: daily_kpis_agg 생성 (store_visits 기반)';
  RAISE NOTICE '====================================';

  FOR v_date IN SELECT DISTINCT visit_date::DATE FROM store_visits WHERE store_id = v_store_id ORDER BY 1 LOOP
    -- 해당 일자의 실제 방문 데이터 집계
    SELECT
      COUNT(*),
      COUNT(DISTINCT customer_id),
      COUNT(*) FILTER (WHERE customer_id IN (
        SELECT customer_id FROM store_visits
        WHERE store_id = v_store_id AND visit_date::DATE < v_date
        GROUP BY customer_id
      )),
      COUNT(*) FILTER (WHERE made_purchase)
    INTO v_total_visitors, v_unique_visitors, v_returning_visitors, v_purchases
    FROM store_visits
    WHERE store_id = v_store_id AND visit_date::DATE = v_date;

    -- 매출 계산 (구매당 평균 85,000원)
    v_total_revenue := v_purchases * (70000 + floor(random() * 30000));

    INSERT INTO daily_kpis_agg (
      id, store_id, org_id, date,
      total_visitors, unique_visitors, returning_visitors,
      total_revenue, total_transactions, avg_transaction_value,
      conversion_rate, avg_visit_duration_seconds,
      total_units_sold, avg_basket_size,
      labor_hours, sales_per_labor_hour, sales_per_visitor,
      calculated_at, created_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_date,
      v_total_visitors,
      v_unique_visitors,
      v_returning_visitors,
      v_total_revenue,
      v_purchases,
      CASE WHEN v_purchases > 0 THEN v_total_revenue / v_purchases ELSE 0 END,
      CASE WHEN v_total_visitors > 0 THEN (v_purchases::NUMERIC / v_total_visitors * 100) ELSE 0 END,
      1200 + floor(random() * 600)::INT,
      floor(v_purchases * 1.8)::INT,
      1.5 + random() * 1.0,
      CASE WHEN EXTRACT(DOW FROM v_date) IN (0, 6) THEN 64 ELSE 48 END,
      v_total_revenue / CASE WHEN EXTRACT(DOW FROM v_date) IN (0, 6) THEN 64 ELSE 48 END,
      CASE WHEN v_total_visitors > 0 THEN v_total_revenue / v_total_visitors ELSE 0 END,
      NOW(), NOW()
    );
  END LOOP;

  RAISE NOTICE 'STEP 3 완료';
END $$;

-- ============================================================================
-- STEP 4: funnel_events 생성 (store_visits와 1:1 매핑)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_visit RECORD;
  v_session_id TEXT;
  v_funnel_stage INT;
  v_ts TIMESTAMPTZ;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 4: funnel_events 생성 (store_visits 1:1 매핑)';
  RAISE NOTICE '====================================';

  FOR v_visit IN SELECT * FROM store_visits WHERE store_id = v_store_id LOOP
    v_session_id := 'session-' || v_visit.id::TEXT;
    v_ts := v_visit.visit_date;

    -- 모든 방문자: visit (entry)
    INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
    VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'visit', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 0, '{}'::jsonb, v_ts);

    -- 진행률 결정 (체류시간 기반)
    v_funnel_stage := CASE
      WHEN v_visit.made_purchase THEN 5  -- 구매완료
      WHEN v_visit.duration_minutes >= 30 THEN 4  -- 피팅
      WHEN v_visit.duration_minutes >= 20 THEN 3  -- 관심
      WHEN v_visit.duration_minutes >= 10 THEN 2  -- 탐색
      ELSE 1  -- 방문만
    END;

    -- browse (탐색)
    IF v_funnel_stage >= 2 THEN
      v_ts := v_ts + INTERVAL '2 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'browse', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 120 + floor(random()*180)::INT, '{}'::jsonb, v_ts);
    END IF;

    -- interest (관심)
    IF v_funnel_stage >= 3 THEN
      v_ts := v_ts + INTERVAL '5 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'interest', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 180 + floor(random()*240)::INT, '{}'::jsonb, v_ts);
    END IF;

    -- try (피팅)
    IF v_funnel_stage >= 4 THEN
      v_ts := v_ts + INTERVAL '8 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'try', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 300 + floor(random()*300)::INT, '{}'::jsonb, v_ts);
    END IF;

    -- purchase (구매)
    IF v_funnel_stage >= 5 THEN
      v_ts := v_ts + INTERVAL '10 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'purchase', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 180 + floor(random()*120)::INT, '{}'::jsonb, v_ts);
    END IF;
  END LOOP;

  RAISE NOTICE 'STEP 4 완료';
END $$;

-- ============================================================================
-- STEP 5: zone_events 생성 (store_visits.zones_visited 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_visit RECORD;
  v_zone_id UUID;
  v_ts TIMESTAMPTZ;
  v_duration INT;
  i INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 5: zone_events 생성 (zones_visited 기반)';
  RAISE NOTICE '====================================';

  FOR v_visit IN SELECT * FROM store_visits WHERE store_id = v_store_id AND zones_visited IS NOT NULL LOOP
    v_ts := v_visit.visit_date;

    FOR i IN 1..array_length(v_visit.zones_visited, 1) LOOP
      v_zone_id := v_visit.zones_visited[i];
      v_duration := 30 + floor(random() * 180)::INT;

      -- enter 이벤트
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'enter', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, NULL, '{"source":"sensor"}'::jsonb, v_ts);

      -- dwell 이벤트
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'dwell', v_ts + INTERVAL '10 seconds', v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, v_duration, '{"source":"sensor"}'::jsonb, v_ts);

      -- exit 이벤트
      v_ts := v_ts + (v_duration || ' seconds')::INTERVAL;
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'exit', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, NULL, '{"source":"sensor"}'::jsonb, v_ts);
    END LOOP;
  END LOOP;

  RAISE NOTICE 'STEP 5 완료';
END $$;

-- ============================================================================
-- STEP 6: zone_daily_metrics 생성 (zone_events 기반 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_zone RECORD;
  v_date DATE;
  v_total_visitors INT;
  v_unique_visitors INT;
  v_avg_dwell INT;
  v_conversions INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 6: zone_daily_metrics 생성 (zone_events 기반)';
  RAISE NOTICE '====================================';

  FOR v_zone IN SELECT * FROM zones_dim WHERE store_id = v_store_id LOOP
    FOR v_date IN SELECT DISTINCT event_date FROM zone_events WHERE store_id = v_store_id AND zone_id = v_zone.id ORDER BY 1 LOOP
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'enter'),
        COUNT(DISTINCT visitor_id),
        COALESCE(AVG(duration_seconds) FILTER (WHERE event_type = 'dwell'), 60)::INT
      INTO v_total_visitors, v_unique_visitors, v_avg_dwell
      FROM zone_events
      WHERE store_id = v_store_id AND zone_id = v_zone.id AND event_date = v_date;

      -- 전환 수 (체류시간 180초 이상)
      SELECT COUNT(DISTINCT visitor_id)
      INTO v_conversions
      FROM zone_events
      WHERE store_id = v_store_id AND zone_id = v_zone.id AND event_date = v_date
        AND event_type = 'dwell' AND duration_seconds >= 180;

      INSERT INTO zone_daily_metrics (
        id, store_id, org_id, zone_id, date,
        total_visitors, unique_visitors, avg_dwell_seconds,
        peak_hour, peak_occupancy, conversion_count,
        heatmap_intensity, calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone.id, v_date,
        v_total_visitors,
        v_unique_visitors,
        v_avg_dwell,
        12 + floor(random() * 8)::INT,
        floor(v_total_visitors * 0.15)::INT,
        v_conversions,
        LEAST(1.0, v_total_visitors::NUMERIC / 50 * 0.8 + 0.1),
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'STEP 6 완료';
END $$;

-- ============================================================================
-- STEP 7: hourly_metrics 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_hour INT;
  v_visitors INT;
  v_transactions INT;
  v_revenue NUMERIC;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 7: hourly_metrics 생성';
  RAISE NOTICE '====================================';

  FOR v_date IN SELECT DISTINCT visit_date::DATE FROM store_visits WHERE store_id = v_store_id ORDER BY 1 LOOP
    FOR v_hour IN 10..21 LOOP
      SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE made_purchase)
      INTO v_visitors, v_transactions
      FROM store_visits
      WHERE store_id = v_store_id
        AND visit_date::DATE = v_date
        AND EXTRACT(HOUR FROM visit_date) = v_hour;

      v_revenue := v_transactions * (70000 + floor(random() * 30000));

      IF v_visitors > 0 OR v_transactions > 0 THEN
        INSERT INTO hourly_metrics (id, store_id, org_id, date, hour, visitor_count, transaction_count, revenue, conversion_rate, created_at)
        VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_date, v_hour,
          v_visitors,
          v_transactions,
          v_revenue,
          CASE WHEN v_visitors > 0 THEN (v_transactions::NUMERIC / v_visitors * 100) ELSE 0 END,
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'STEP 7 완료';
END $$;

-- ============================================================================
-- 결과 검증
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_total_visits INT;
  v_unique_customers INT;
  v_returning_customers INT;
  v_kpi_footfall INT;
  v_kpi_unique INT;
  v_funnel_entry INT;
  v_funnel_purchase INT;
BEGIN
  -- store_visits 통계
  SELECT COUNT(*), COUNT(DISTINCT customer_id)
  INTO v_total_visits, v_unique_customers
  FROM store_visits WHERE store_id = v_store_id;

  -- 재방문 고객 수
  SELECT COUNT(*) INTO v_returning_customers
  FROM (
    SELECT customer_id, COUNT(*) as cnt
    FROM store_visits WHERE store_id = v_store_id
    GROUP BY customer_id
    HAVING COUNT(*) >= 2
  ) t;

  -- daily_kpis_agg 합계
  SELECT SUM(total_visitors), SUM(unique_visitors)
  INTO v_kpi_footfall, v_kpi_unique
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  -- funnel_events 통계
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'visit'),
    COUNT(*) FILTER (WHERE event_type = 'purchase')
  INTO v_funnel_entry, v_funnel_purchase
  FROM funnel_events WHERE store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ 일관성 있는 샘플 데이터 시딩 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 데이터 일관성 검증:';
  RAISE NOTICE '';
  RAISE NOTICE '  store_visits:';
  RAISE NOTICE '    - 총 방문: % 건', v_total_visits;
  RAISE NOTICE '    - 순 고객: % 명', v_unique_customers;
  RAISE NOTICE '    - 재방문 고객: % 명 (%)', v_returning_customers, ROUND(v_returning_customers::NUMERIC / v_unique_customers * 100, 1);
  RAISE NOTICE '';
  RAISE NOTICE '  daily_kpis_agg (90일 합계):';
  RAISE NOTICE '    - total_visitors: %', v_kpi_footfall;
  RAISE NOTICE '    - unique_visitors: %', v_kpi_unique;
  RAISE NOTICE '';
  RAISE NOTICE '  funnel_events:';
  RAISE NOTICE '    - entry (visit): %', v_funnel_entry;
  RAISE NOTICE '    - purchase: %', v_funnel_purchase;
  RAISE NOTICE '';
  RAISE NOTICE '  일관성 체크:';
  RAISE NOTICE '    - store_visits = kpi_footfall: %', CASE WHEN v_total_visits = v_kpi_footfall THEN '✓ 일치' ELSE '✗ 불일치' END;
  RAISE NOTICE '    - store_visits = funnel_entry: %', CASE WHEN v_total_visits = v_funnel_entry THEN '✓ 일치' ELSE '✗ 불일치' END;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
