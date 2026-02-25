-- ============================================================================
-- NEURALTWIN 완전 일관성 샘플 데이터셋 v5.0
-- ============================================================================
-- 모든 테이블 간 수학적 일관성 및 참조 관계 보장
--
-- 보존하는 데이터 (마스터):
--   - stores, zones_dim, products
--   - ontology_entity_types, ontology_relation_types
--   - graph_entities, graph_relations
--   - store_scenes
--
-- 재생성하는 데이터 (트랜잭션/메트릭):
--   - customers → store_visits → daily_kpis_agg
--   - store_visits → funnel_events, zone_events
--   - zone_events → zone_daily_metrics
--   - store_visits → purchases → line_items
--   - line_items → product_performance_agg
--   - customers → customer_segments_agg
--   - hourly_metrics (store_visits 기반)
-- ============================================================================

-- ============================================================================
-- STEP 0: 트랜잭션/메트릭 데이터만 정리 (마스터 데이터 보존)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 0: 기존 트랜잭션/메트릭 데이터 정리 (마스터 보존)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 메트릭/집계 데이터 삭제
  DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  DELETE FROM hourly_metrics WHERE store_id = v_store_id;
  DELETE FROM product_performance_agg WHERE store_id = v_store_id;
  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;

  -- 이벤트 데이터 삭제
  DELETE FROM zone_events WHERE store_id = v_store_id;
  DELETE FROM funnel_events WHERE store_id = v_store_id;

  -- 트랜잭션 데이터 삭제
  DELETE FROM line_items WHERE store_id = v_store_id;
  DELETE FROM purchases WHERE store_id = v_store_id;

  -- 방문 및 고객 삭제
  DELETE FROM store_visits WHERE store_id = v_store_id;
  DELETE FROM customers WHERE store_id = v_store_id;

  -- 전략 관련 삭제
  DELETE FROM strategy_daily_metrics WHERE strategy_id IN (SELECT id FROM applied_strategies WHERE store_id = v_store_id);
  DELETE FROM applied_strategies WHERE store_id = v_store_id;
  DELETE FROM ai_recommendations WHERE store_id = v_store_id;

  RAISE NOTICE '  ✓ 기존 트랜잭션/메트릭 데이터 삭제 완료';
  RAISE NOTICE '  ✓ 마스터 데이터 보존 (stores, zones_dim, products, ontology, graph)';
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
  v_segment TEXT;
  v_total_purchases INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: 고객 2,500명 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..2500 LOOP
    -- 세그먼트 결정: VIP 5%, Regular 20%, New 75%
    IF i <= 125 THEN
      v_segment := 'vip';
      v_total_purchases := 3000000 + floor(random() * 2000000)::INT;
    ELSIF i <= 625 THEN
      v_segment := 'regular';
      v_total_purchases := 500000 + floor(random() * 1000000)::INT;
    ELSE
      v_segment := 'new';
      v_total_purchases := floor(random() * 300000)::INT;
    END IF;

    INSERT INTO customers (id, store_id, user_id, org_id, customer_name, email, phone, segment, total_purchases, created_at)
    VALUES (
      ('c' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      (ARRAY['김','이','박','최','정','강','조','윤','장','임'])[1+floor(random()*10)::INT] ||
      (ARRAY['민수','지영','현우','수진','준호','예진','도윤','서연','시우','하윤'])[1+floor(random()*10)::INT],
      'customer' || i || '@example.com',
      '010-' || LPAD(floor(random()*9000+1000)::TEXT, 4, '0') || '-' || LPAD(floor(random()*9000+1000)::TEXT, 4, '0'),
      v_segment,
      v_total_purchases,
      NOW() - ((random() * 365) || ' days')::INTERVAL
    );
  END LOOP;

  RAISE NOTICE '  ✓ VIP: 125명 (5%%)';
  RAISE NOTICE '  ✓ Regular: 500명 (20%%)';
  RAISE NOTICE '  ✓ New: 1,875명 (75%%)';
END $$;

-- ============================================================================
-- STEP 2: store_visits 생성 (재방문 분포 포함, ~3,500건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[];
  v_customer_idx INT := 1;
  v_visit_date TIMESTAMPTZ;
  v_duration INT;
  v_path UUID[];
  v_made_purchase BOOLEAN;
  v_day_offset INT;
  i INT;
  j INT;
  k INT;

  -- 방문 분포 설정
  v_single_count INT := 1875;  -- 1회 방문: 75%
  v_double_count INT := 375;   -- 2회 방문: 15%
  v_triple_count INT := 175;   -- 3회 방문: 7%
  v_multi_count INT := 75;     -- 4회+ 방문: 3%
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  -- zones_dim에서 존 ID 가져오기
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zone_ids
  FROM zones_dim WHERE store_id = v_store_id;

  IF v_zone_ids IS NULL OR array_length(v_zone_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'zones_dim 데이터가 없습니다. 마스터 데이터를 먼저 시딩하세요.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: store_visits 생성 (재방문 패턴 포함)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 1회 방문 고객 (1,875명 × 1 = 1,875건)
  FOR i IN 1..v_single_count LOOP
    v_day_offset := floor(random() * 90)::INT;
    v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
    v_duration := 5 + floor(random() * 55)::INT;
    v_made_purchase := random() < 0.10;  -- 10% 구매율

    -- 존 방문 경로 생성 (입구부터 시작)
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
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  ✓ 1회 방문: %명 (%건)', v_single_count, v_single_count;

  -- 2회 방문 고객 (375명 × 2 = 750건)
  FOR i IN 1..v_double_count LOOP
    FOR j IN 1..2 LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 8 + floor(random() * 52)::INT;
      v_made_purchase := random() < 0.15;  -- 15% 구매율 (재방문 고객)

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(2 + floor(random() * 5)::INT) LOOP
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

  RAISE NOTICE '  ✓ 2회 방문: %명 (%건)', v_double_count, v_double_count * 2;

  -- 3회 방문 고객 (175명 × 3 = 525건)
  FOR i IN 1..v_triple_count LOOP
    FOR j IN 1..3 LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 10 + floor(random() * 50)::INT;
      v_made_purchase := random() < 0.18;

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(3 + floor(random() * 4)::INT) LOOP
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

  RAISE NOTICE '  ✓ 3회 방문: %명 (%건)', v_triple_count, v_triple_count * 3;

  -- 4회+ 방문 고객 (75명 × 평균 5 = ~375건)
  FOR i IN 1..v_multi_count LOOP
    FOR j IN 1..(4 + floor(random() * 3)::INT) LOOP
      v_day_offset := floor(random() * 90)::INT;
      v_visit_date := (CURRENT_DATE - v_day_offset) + (10 + floor(random() * 11))::INT * INTERVAL '1 hour' + floor(random() * 60)::INT * INTERVAL '1 minute';
      v_duration := 12 + floor(random() * 48)::INT;
      v_made_purchase := random() < 0.22;  -- 22% 구매율 (충성 고객)

      v_path := ARRAY[v_zone_ids[1]];
      FOR k IN 2..(3 + floor(random() * 5)::INT) LOOP
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

  RAISE NOTICE '  ✓ 4회+ 방문: %명', v_multi_count;
END $$;

-- ============================================================================
-- STEP 3: purchases & line_items 생성 (store_visits.made_purchase=true 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_visit RECORD;
  v_purchase_id UUID;
  v_product_ids UUID[];
  v_product RECORD;
  v_item_count INT;
  v_total_amount NUMERIC := 0;
  i INT;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  -- 상품 ID 목록 가져오기
  SELECT ARRAY_AGG(id) INTO v_product_ids FROM products WHERE store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: purchases & line_items 생성 (store_visits 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN SELECT * FROM store_visits WHERE store_id = v_store_id AND made_purchase = true LOOP
    v_purchase_id := gen_random_uuid();
    v_total_amount := 0;
    v_item_count := 1 + floor(random() * 3)::INT;

    -- purchases 생성
    INSERT INTO purchases (id, store_id, org_id, customer_id, purchase_date, total_amount, payment_method, created_at)
    VALUES (
      v_purchase_id,
      v_store_id,
      v_org_id,
      v_visit.customer_id,
      v_visit.visit_date + (v_visit.duration_minutes * 0.8 || ' minutes')::INTERVAL,
      0,  -- 나중에 업데이트
      (ARRAY['card', 'cash', 'mobile'])[1 + floor(random() * 3)::INT],
      v_visit.visit_date
    );

    -- line_items 생성
    FOR i IN 1..v_item_count LOOP
      SELECT id, price INTO v_product FROM products
      WHERE store_id = v_store_id
      ORDER BY random() LIMIT 1;

      INSERT INTO line_items (id, store_id, org_id, purchase_id, transaction_id, product_id, quantity, unit_price, line_total, discount_amount, transaction_date, transaction_hour, created_at)
      VALUES (
        gen_random_uuid(),
        v_store_id,
        v_org_id,
        v_purchase_id,
        'TX-' || TO_CHAR(v_visit.visit_date, 'YYYYMMDD') || '-' || LPAD(floor(random() * 9999)::TEXT, 4, '0'),
        v_product.id,
        1 + floor(random() * 2)::INT,
        v_product.price,
        v_product.price * (1 + floor(random() * 2)::INT),
        floor(v_product.price * random() * 0.1),
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        v_visit.visit_date
      );

      v_total_amount := v_total_amount + v_product.price * (1 + floor(random() * 2)::INT);
    END LOOP;

    -- purchases.total_amount 업데이트
    UPDATE purchases SET total_amount = v_total_amount WHERE id = v_purchase_id;
  END LOOP;

  RAISE NOTICE '  ✓ purchases 생성 완료 (store_visits.made_purchase=true 기반)';
  RAISE NOTICE '  ✓ line_items 생성 완료 (purchase당 1-3개 상품)';
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

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: funnel_events 생성 (store_visits 1:1 매핑)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN SELECT * FROM store_visits WHERE store_id = v_store_id LOOP
    v_session_id := 'session-' || v_visit.id::TEXT;
    v_ts := v_visit.visit_date;

    -- 퍼널 진행 단계 결정 (체류시간 및 구매 여부 기반)
    v_funnel_stage := CASE
      WHEN v_visit.made_purchase THEN 5                     -- 구매
      WHEN v_visit.duration_minutes >= 30 THEN 4            -- 피팅/시착
      WHEN v_visit.duration_minutes >= 20 THEN 3            -- 관심/상호작용
      WHEN v_visit.duration_minutes >= 10 THEN 2            -- 탐색
      ELSE 1                                                 -- 방문만
    END;

    -- visit (모든 방문자)
    INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
    VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'visit', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 0, '{"source":"store_visits"}'::jsonb, v_ts);

    -- browse
    IF v_funnel_stage >= 2 THEN
      v_ts := v_ts + INTERVAL '2 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'browse', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 120 + floor(random()*180)::INT, '{}'::jsonb, v_ts);
    END IF;

    -- interest
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

    -- purchase
    IF v_funnel_stage >= 5 THEN
      v_ts := v_ts + INTERVAL '10 minutes';
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session_id, v_visit.customer_id::TEXT, 'purchase', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, 180 + floor(random()*120)::INT, '{}'::jsonb, v_ts);
    END IF;
  END LOOP;

  RAISE NOTICE '  ✓ funnel_events 생성 완료 (visit → browse → interest → try → purchase)';
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

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: zone_events 생성 (zones_visited 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN SELECT * FROM store_visits WHERE store_id = v_store_id AND zones_visited IS NOT NULL AND array_length(zones_visited, 1) > 0 LOOP
    v_ts := v_visit.visit_date;

    FOR i IN 1..array_length(v_visit.zones_visited, 1) LOOP
      v_zone_id := v_visit.zones_visited[i];
      v_duration := 30 + floor(random() * 180)::INT;

      -- enter
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'enter', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, NULL, '{"source":"sensor"}'::jsonb, v_ts);

      -- dwell
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'dwell', v_ts + INTERVAL '5 seconds', v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, v_duration, '{"source":"sensor"}'::jsonb, v_ts);

      -- exit
      v_ts := v_ts + (v_duration || ' seconds')::INTERVAL;
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, v_visit.customer_id::TEXT, 'exit', v_ts, v_ts::DATE, EXTRACT(HOUR FROM v_ts)::INT, NULL, '{"source":"sensor"}'::jsonb, v_ts);
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_events 생성 완료 (enter → dwell → exit 패턴)';
END $$;

-- ============================================================================
-- STEP 6: daily_kpis_agg 생성 (store_visits 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_stats RECORD;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6: daily_kpis_agg 생성 (store_visits 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_date IN SELECT DISTINCT visit_date::DATE FROM store_visits WHERE store_id = v_store_id ORDER BY 1 LOOP
    -- 해당 일자의 실제 방문 데이터 집계
    SELECT
      COUNT(*) as total_visitors,
      COUNT(DISTINCT customer_id) as unique_visitors,
      COUNT(*) FILTER (WHERE customer_id IN (
        SELECT customer_id FROM store_visits sv2
        WHERE sv2.store_id = v_store_id AND sv2.visit_date::DATE < v_date
        GROUP BY customer_id
      )) as returning_visitors,
      COUNT(*) FILTER (WHERE made_purchase) as purchases,
      COALESCE(SUM(duration_minutes), 0) as total_duration
    INTO v_stats
    FROM store_visits
    WHERE store_id = v_store_id AND visit_date::DATE = v_date;

    INSERT INTO daily_kpis_agg (
      id, store_id, org_id, date,
      total_visitors, unique_visitors, returning_visitors,
      total_revenue, total_transactions, avg_transaction_value,
      conversion_rate, avg_visit_duration_seconds,
      total_units_sold, avg_basket_size,
      labor_hours, sales_per_labor_hour, sales_per_visitor,
      calculated_at, created_at
    )
    SELECT
      gen_random_uuid(), v_store_id, v_org_id, v_date,
      v_stats.total_visitors,
      v_stats.unique_visitors,
      v_stats.returning_visitors,
      COALESCE(SUM(p.total_amount), 0),
      COUNT(p.id),
      CASE WHEN COUNT(p.id) > 0 THEN SUM(p.total_amount) / COUNT(p.id) ELSE 0 END,
      CASE WHEN v_stats.total_visitors > 0 THEN (v_stats.purchases::NUMERIC / v_stats.total_visitors * 100) ELSE 0 END,
      CASE WHEN v_stats.total_visitors > 0 THEN (v_stats.total_duration * 60 / v_stats.total_visitors) ELSE 0 END,
      COALESCE((SELECT SUM(quantity) FROM line_items WHERE store_id = v_store_id AND transaction_date = v_date), 0),
      CASE WHEN COUNT(p.id) > 0 THEN (SELECT SUM(quantity)::NUMERIC FROM line_items WHERE store_id = v_store_id AND transaction_date = v_date) / COUNT(p.id) ELSE 0 END,
      CASE WHEN EXTRACT(DOW FROM v_date) IN (0, 6) THEN 64 ELSE 48 END,
      COALESCE(SUM(p.total_amount), 0) / CASE WHEN EXTRACT(DOW FROM v_date) IN (0, 6) THEN 64 ELSE 48 END,
      CASE WHEN v_stats.total_visitors > 0 THEN COALESCE(SUM(p.total_amount), 0) / v_stats.total_visitors ELSE 0 END,
      NOW(), NOW()
    FROM purchases p
    WHERE p.store_id = v_store_id AND p.purchase_date::DATE = v_date;
  END LOOP;

  RAISE NOTICE '  ✓ daily_kpis_agg 생성 완료 (store_visits + purchases 집계)';
END $$;

-- ============================================================================
-- STEP 7: zone_daily_metrics 생성 (zone_events 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_zone RECORD;
  v_date DATE;
  v_stats RECORD;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 7: zone_daily_metrics 생성 (zone_events 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_zone IN SELECT * FROM zones_dim WHERE store_id = v_store_id LOOP
    FOR v_date IN SELECT DISTINCT event_date FROM zone_events WHERE store_id = v_store_id AND zone_id = v_zone.id ORDER BY 1 LOOP
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'enter') as total_visitors,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COALESCE(AVG(duration_seconds) FILTER (WHERE event_type = 'dwell'), 60)::INT as avg_dwell,
        COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'dwell' AND duration_seconds >= 180) as conversions
      INTO v_stats
      FROM zone_events
      WHERE store_id = v_store_id AND zone_id = v_zone.id AND event_date = v_date;

      INSERT INTO zone_daily_metrics (
        id, store_id, org_id, zone_id, date,
        total_visitors, unique_visitors, avg_dwell_seconds,
        peak_hour, peak_occupancy, conversion_count,
        heatmap_intensity, calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone.id, v_date,
        v_stats.total_visitors,
        v_stats.unique_visitors,
        v_stats.avg_dwell,
        (SELECT event_hour FROM zone_events WHERE store_id = v_store_id AND zone_id = v_zone.id AND event_date = v_date GROUP BY event_hour ORDER BY COUNT(*) DESC LIMIT 1),
        GREATEST(1, floor(v_stats.total_visitors * 0.15)::INT),
        v_stats.conversions,
        LEAST(1.0, v_stats.total_visitors::NUMERIC / 50 * 0.8 + 0.1),
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_daily_metrics 생성 완료 (zone_events 집계)';
END $$;

-- ============================================================================
-- STEP 8: hourly_metrics 생성 (store_visits 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_hour INT;
  v_stats RECORD;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 8: hourly_metrics 생성 (store_visits 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_date IN SELECT DISTINCT visit_date::DATE FROM store_visits WHERE store_id = v_store_id ORDER BY 1 LOOP
    FOR v_hour IN 10..21 LOOP
      SELECT
        COUNT(*) as visitors,
        COUNT(*) FILTER (WHERE made_purchase) as transactions
      INTO v_stats
      FROM store_visits
      WHERE store_id = v_store_id
        AND visit_date::DATE = v_date
        AND EXTRACT(HOUR FROM visit_date) = v_hour;

      IF v_stats.visitors > 0 THEN
        INSERT INTO hourly_metrics (id, store_id, org_id, date, hour, visitor_count, transaction_count, revenue, conversion_rate, created_at)
        SELECT
          gen_random_uuid(), v_store_id, v_org_id, v_date, v_hour,
          v_stats.visitors,
          v_stats.transactions,
          COALESCE(SUM(p.total_amount), 0),
          CASE WHEN v_stats.visitors > 0 THEN (v_stats.transactions::NUMERIC / v_stats.visitors * 100) ELSE 0 END,
          NOW()
        FROM purchases p
        WHERE p.store_id = v_store_id
          AND p.purchase_date::DATE = v_date
          AND EXTRACT(HOUR FROM p.purchase_date) = v_hour;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ hourly_metrics 생성 완료';
END $$;

-- ============================================================================
-- STEP 9: product_performance_agg 생성 (line_items 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_product RECORD;
  v_date DATE;
  v_stats RECORD;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 9: product_performance_agg 생성 (line_items 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_product IN SELECT * FROM products WHERE store_id = v_store_id LOOP
    FOR v_date IN SELECT DISTINCT transaction_date FROM line_items WHERE store_id = v_store_id AND product_id = v_product.id ORDER BY 1 LOOP
      SELECT
        COALESCE(SUM(quantity), 0) as units_sold,
        COUNT(DISTINCT purchase_id) as transactions,
        COALESCE(SUM(line_total), 0) as revenue
      INTO v_stats
      FROM line_items
      WHERE store_id = v_store_id AND product_id = v_product.id AND transaction_date = v_date;

      INSERT INTO product_performance_agg (
        id, store_id, org_id, product_id, date,
        units_sold, transactions, revenue,
        conversion_rate, avg_selling_price, return_rate,
        stock_level, category_rank, store_rank,
        calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_product.id, v_date,
        v_stats.units_sold,
        v_stats.transactions,
        v_stats.revenue,
        8 + floor(random() * 7),  -- 추정 전환율
        v_product.price,
        floor(random() * 5),  -- 반품율
        v_product.stock,
        1 + floor(random() * 10)::INT,
        1 + floor(random() * 25)::INT,
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ product_performance_agg 생성 완료';
END $$;

-- ============================================================================
-- STEP 10: customer_segments_agg 생성 (customers 집계)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_seg RECORD;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 10: customer_segments_agg 생성 (customers 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_date IN SELECT DISTINCT visit_date::DATE FROM store_visits WHERE store_id = v_store_id ORDER BY 1 LOOP
    FOR v_seg IN
      SELECT
        segment,
        COUNT(*) as cnt,
        SUM(total_purchases) as total_revenue,
        AVG(total_purchases) as avg_value
      FROM customers
      WHERE store_id = v_store_id
      GROUP BY segment
    LOOP
      INSERT INTO customer_segments_agg (
        id, store_id, org_id, date, segment_name, segment_type,
        customer_count, total_revenue, avg_transaction_value,
        avg_basket_size, visit_frequency, ltv_estimate, churn_risk_score,
        calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date,
        v_seg.segment,
        CASE v_seg.segment WHEN 'vip' THEN 'value' WHEN 'regular' THEN 'frequency' ELSE 'lifecycle' END,
        v_seg.cnt,
        v_seg.total_revenue,
        CASE v_seg.segment WHEN 'vip' THEN 350000 WHEN 'regular' THEN 180000 ELSE 80000 END,
        CASE v_seg.segment WHEN 'vip' THEN 3.2 WHEN 'regular' THEN 2.1 ELSE 1.5 END,
        CASE v_seg.segment WHEN 'vip' THEN 8 WHEN 'regular' THEN 4 ELSE 1.5 END,
        CASE v_seg.segment WHEN 'vip' THEN 5000000 WHEN 'regular' THEN 2000000 ELSE 500000 END,
        CASE v_seg.segment WHEN 'vip' THEN 5 WHEN 'regular' THEN 25 ELSE 50 END + floor(random()*10),
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ customer_segments_agg 생성 완료';
END $$;

-- ============================================================================
-- STEP 11: ai_recommendations 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 11: ai_recommendations 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ai_recommendations (id, store_id, user_id, org_id, title, description,
    recommendation_type, priority, action_category, data_source, expected_impact, evidence,
    status, is_displayed, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '재방문 고객 유지 전략',
   '재방문률 25%를 35%로 높이기 위한 VIP 프로그램 강화를 권장합니다.',
   'promotion', 'high', 'customer_retention', 'store_visits',
   '{"potential_increase": 1500000, "confidence": 85}'::jsonb,
   '{"current_repeat_rate": 25, "target_rate": 35}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '피크타임 인력 최적화',
   '14-18시 방문자 집중 시간대에 직원 배치를 강화하세요.',
   'staffing', 'high', 'operational_efficiency', 'hourly_metrics',
   '{"service_improvement": 25, "confidence": 82}'::jsonb,
   '{"peak_hours": "14-18", "visitor_concentration": 45}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '의류존 동선 개선',
   '의류존 체류시간 대비 전환율이 낮습니다. 디스플레이 재배치를 권장합니다.',
   'layout', 'medium', 'revenue_increase', 'zone_daily_metrics',
   '{"potential_increase": 800000, "confidence": 75}'::jsonb,
   '{"zone": "의류존", "dwell_time": 180, "conversion_rate": 8}'::jsonb,
   'active', true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id,
   '고객 세그먼트 타겟 마케팅',
   'New 고객 75%를 Regular로 전환하기 위한 첫 구매 프로모션을 추천합니다.',
   'promotion', 'medium', 'customer_acquisition', 'customer_segments_agg',
   '{"conversion_potential": 500, "confidence": 78}'::jsonb,
   '{"new_customers": 1875, "target_conversion": "20%"}'::jsonb,
   'active', true, NOW(), NOW());

  RAISE NOTICE '  ✓ ai_recommendations 4건 생성 완료';
END $$;

-- ============================================================================
-- 최종 검증
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_customers INT;
  v_total_visits INT;
  v_unique_visitors INT;
  v_returning INT;
  v_repeat_rate NUMERIC;
  v_purchases INT;
  v_kpi_footfall INT;
  v_kpi_unique INT;
  v_funnel_visit INT;
  v_funnel_purchase INT;
BEGIN
  -- 고객 수
  SELECT COUNT(*) INTO v_customers FROM customers WHERE store_id = v_store_id;

  -- 방문 통계
  SELECT COUNT(*), COUNT(DISTINCT customer_id) INTO v_total_visits, v_unique_visitors
  FROM store_visits WHERE store_id = v_store_id;

  -- 재방문 고객 수
  SELECT COUNT(*) INTO v_returning FROM (
    SELECT customer_id FROM store_visits WHERE store_id = v_store_id
    GROUP BY customer_id HAVING COUNT(*) >= 2
  ) t;

  v_repeat_rate := CASE WHEN v_unique_visitors > 0 THEN (v_returning::NUMERIC / v_unique_visitors * 100) ELSE 0 END;

  -- 구매 수
  SELECT COUNT(*) INTO v_purchases FROM purchases WHERE store_id = v_store_id;

  -- KPI 집계
  SELECT SUM(total_visitors), SUM(unique_visitors) INTO v_kpi_footfall, v_kpi_unique
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  -- 퍼널 이벤트
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'visit'),
    COUNT(*) FILTER (WHERE event_type = 'purchase')
  INTO v_funnel_visit, v_funnel_purchase
  FROM funnel_events WHERE store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ 완전 일관성 샘플 데이터셋 시딩 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 생성된 데이터:';
  RAISE NOTICE '  customers:        % 명', v_customers;
  RAISE NOTICE '  store_visits:     % 건', v_total_visits;
  RAISE NOTICE '  unique_visitors:  % 명', v_unique_visitors;
  RAISE NOTICE '  returning:        % 명 (%.1f%%)', v_returning, v_repeat_rate;
  RAISE NOTICE '  purchases:        % 건', v_purchases;
  RAISE NOTICE '';
  RAISE NOTICE '📈 일관성 검증:';
  RAISE NOTICE '  store_visits = kpi_footfall:    % = % %',
    v_total_visits, v_kpi_footfall,
    CASE WHEN v_total_visits = v_kpi_footfall THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  store_visits = funnel_visit:    % = % %',
    v_total_visits, v_funnel_visit,
    CASE WHEN v_total_visits = v_funnel_visit THEN '✓' ELSE '✗' END;
  RAISE NOTICE '  purchases = funnel_purchase:    % = % %',
    v_purchases, v_funnel_purchase,
    CASE WHEN v_purchases = v_funnel_purchase THEN '✓' ELSE '✗' END;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
