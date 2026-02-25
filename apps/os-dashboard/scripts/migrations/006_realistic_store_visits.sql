-- ============================================================================
-- NEURALTWIN store_visits 현실화 v1.0
-- ============================================================================
-- 목표: 리테일 업계 표준에 맞는 현실적인 방문 데이터
--
-- 현실적 수치 (90일 기준):
--   - 총 입장(Footfall): ~3,500회
--   - 순 방문객(Unique Visitors): ~2,500명
--   - 재방문률: 20-30%
--   - 평균 방문 횟수: 1.3-1.5회/인
--
-- 방문 분포:
--   - 1회 방문: 75% (~1,875명) → 1,875회
--   - 2회 방문: 15% (~375명) → 750회
--   - 3회 방문: 7% (~175명) → 525회
--   - 4회+ 방문: 3% (~75명) → ~350회
--   - 총: ~2,500명, ~3,500회
-- ============================================================================

-- ============================================================================
-- STEP 1: customers 테이블 확장 (500명 → 2,500명)
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_user_id UUID;
  v_existing_count INT;
  v_needed INT;
  v_inserted INT := 0;
  i INT;
BEGIN
  SELECT id, org_id, user_id INTO v_store_id, v_org_id, v_user_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  SELECT COUNT(*) INTO v_existing_count FROM customers WHERE store_id = v_store_id;
  v_needed := 2500 - v_existing_count;

  IF v_needed <= 0 THEN
    RAISE NOTICE 'STEP 1 스킵: customers 이미 % 명 존재', v_existing_count;
  ELSE
    RAISE NOTICE 'STEP 1: customers % 명 → 2,500명 확장 시작...', v_existing_count;

    FOR i IN 1..v_needed LOOP
      INSERT INTO customers (
        id,
        store_id,
        org_id,
        user_id,
        customer_name,
        email,
        phone,
        gender,
        age_group,
        membership_tier,
        first_visit_date,
        total_visits,
        total_spent,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_store_id,
        v_org_id,
        v_user_id,
        '고객 ' || (v_existing_count + i),
        'customer' || (v_existing_count + i) || '@example.com',
        '010-' || LPAD((1000 + (random() * 8999)::INT)::TEXT, 4, '0') || '-' || LPAD((1000 + (random() * 8999)::INT)::TEXT, 4, '0'),
        CASE WHEN random() < 0.5 THEN 'M' ELSE 'F' END,
        CASE
          WHEN random() < 0.15 THEN '10대'
          WHEN random() < 0.35 THEN '20대'
          WHEN random() < 0.60 THEN '30대'
          WHEN random() < 0.80 THEN '40대'
          WHEN random() < 0.95 THEN '50대'
          ELSE '60대+'
        END,
        CASE
          WHEN random() < 0.60 THEN 'bronze'
          WHEN random() < 0.85 THEN 'silver'
          WHEN random() < 0.95 THEN 'gold'
          ELSE 'vip'
        END,
        CURRENT_DATE - (random() * 365)::INT,
        0,
        0,
        NOW()
      );
      v_inserted := v_inserted + 1;
    END LOOP;

    RAISE NOTICE 'STEP 1 완료: customers % 명 추가됨 (총: 2,500명)', v_inserted;
  END IF;
END $$;


-- ============================================================================
-- STEP 2: 기존 store_visits 삭제
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_deleted INT;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;

  DELETE FROM store_visits WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'STEP 2 완료: 기존 store_visits % 건 삭제됨', v_deleted;
END $$;


-- ============================================================================
-- STEP 3: 현실적 방문 분포로 store_visits 재생성
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_customer_ids UUID[];
  v_zone_names TEXT[];
  v_entry_points TEXT[] := ARRAY['main_entrance', 'side_entrance', 'parking_entrance'];
  v_device_types TEXT[] := ARRAY['mobile', 'sensor', 'wifi', 'camera'];

  -- 방문 분포 설정
  v_single_visit_pct FLOAT := 0.75;    -- 1회 방문: 75%
  v_double_visit_pct FLOAT := 0.15;    -- 2회 방문: 15%
  v_triple_visit_pct FLOAT := 0.07;    -- 3회 방문: 7%
  v_multi_visit_pct FLOAT := 0.03;     -- 4회+ 방문: 3%

  v_total_customers INT := 2500;
  v_single_customers INT;
  v_double_customers INT;
  v_triple_customers INT;
  v_multi_customers INT;

  v_customer_id UUID;
  v_visit_count INT;
  v_visit_date DATE;
  v_visit_time TIMESTAMPTZ;
  v_duration INT;
  v_made_purchase BOOLEAN;
  v_zones_to_visit TEXT[];
  v_inserted INT := 0;
  v_customer_idx INT := 0;
  i INT;
  j INT;
BEGIN
  SELECT id, org_id INTO v_store_id, v_org_id
  FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 고객 ID 배열 준비 (셔플된 순서)
  SELECT ARRAY_AGG(id ORDER BY random()) INTO v_customer_ids
  FROM customers WHERE store_id = v_store_id;

  -- 존 이름 배열 준비
  SELECT ARRAY_AGG(zone_name) INTO v_zone_names
  FROM zones_dim WHERE store_id = v_store_id;

  IF v_zone_names IS NULL OR array_length(v_zone_names, 1) IS NULL THEN
    v_zone_names := ARRAY['entrance', 'main_display', 'fitting_room', 'checkout', 'accessories'];
  END IF;

  -- 고객 수 계산
  v_single_customers := (v_total_customers * v_single_visit_pct)::INT;  -- 1,875명
  v_double_customers := (v_total_customers * v_double_visit_pct)::INT;  -- 375명
  v_triple_customers := (v_total_customers * v_triple_visit_pct)::INT;  -- 175명
  v_multi_customers := v_total_customers - v_single_customers - v_double_customers - v_triple_customers;  -- 75명

  RAISE NOTICE 'STEP 3: store_visits 현실화 시작...';
  RAISE NOTICE '  - 1회 방문 고객: % 명', v_single_customers;
  RAISE NOTICE '  - 2회 방문 고객: % 명', v_double_customers;
  RAISE NOTICE '  - 3회 방문 고객: % 명', v_triple_customers;
  RAISE NOTICE '  - 4회+ 방문 고객: % 명', v_multi_customers;

  -- 90일 날짜 범위 (2025-09-16 ~ 2025-12-15)
  -- 1회 방문 고객 처리
  FOR i IN 1..v_single_customers LOOP
    v_customer_idx := v_customer_idx + 1;
    IF v_customer_idx > array_length(v_customer_ids, 1) THEN
      EXIT;
    END IF;
    v_customer_id := v_customer_ids[v_customer_idx];

    -- 랜덤 날짜 선택 (90일 범위)
    v_visit_date := CURRENT_DATE - (random() * 89)::INT;

    -- 시간대 설정 (요일에 따라 다름)
    v_visit_time := (v_visit_date + (TIME '10:00:00' + (random() * INTERVAL '9 hours')))::timestamptz;
    v_duration := 8 + (random() * 45)::INT;  -- 8-53분
    v_made_purchase := random() < 0.18;  -- 18% 구매 확률

    -- 방문 존 선택 (1-4개)
    v_zones_to_visit := ARRAY(
      SELECT DISTINCT v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT]
      FROM generate_series(1, 1 + (random() * 3)::INT)
      LIMIT 4
    );

    INSERT INTO store_visits (
      id, store_id, org_id, customer_id,
      visit_date, exit_date, duration_minutes,
      zones_visited, made_purchase, purchase_amount,
      entry_point, device_type, data_source, created_at
    ) VALUES (
      gen_random_uuid(),
      v_store_id,
      v_org_id,
      v_customer_id,
      v_visit_time,
      v_visit_time + (v_duration * INTERVAL '1 minute'),
      v_duration,
      v_zones_to_visit,
      v_made_purchase,
      CASE WHEN v_made_purchase THEN 50000 + (random() * 300000)::INT ELSE NULL END,
      v_entry_points[1 + (random() * 2)::INT],
      v_device_types[1 + (random() * 3)::INT],
      'realistic_seeding',
      NOW()
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  -- 2회 방문 고객 처리
  FOR i IN 1..v_double_customers LOOP
    v_customer_idx := v_customer_idx + 1;
    IF v_customer_idx > array_length(v_customer_ids, 1) THEN
      EXIT;
    END IF;
    v_customer_id := v_customer_ids[v_customer_idx];

    FOR j IN 1..2 LOOP
      v_visit_date := CURRENT_DATE - (random() * 89)::INT;
      v_visit_time := (v_visit_date + (TIME '10:00:00' + (random() * INTERVAL '9 hours')))::timestamptz;
      v_duration := 10 + (random() * 50)::INT;
      v_made_purchase := random() < 0.22;  -- 재방문자 구매율 높음

      v_zones_to_visit := ARRAY(
        SELECT DISTINCT v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT]
        FROM generate_series(1, 1 + (random() * 3)::INT)
        LIMIT 4
      );

      INSERT INTO store_visits (
        id, store_id, org_id, customer_id,
        visit_date, exit_date, duration_minutes,
        zones_visited, made_purchase, purchase_amount,
        entry_point, device_type, data_source, created_at
      ) VALUES (
        gen_random_uuid(),
        v_store_id,
        v_org_id,
        v_customer_id,
        v_visit_time,
        v_visit_time + (v_duration * INTERVAL '1 minute'),
        v_duration,
        v_zones_to_visit,
        v_made_purchase,
        CASE WHEN v_made_purchase THEN 50000 + (random() * 300000)::INT ELSE NULL END,
        v_entry_points[1 + (random() * 2)::INT],
        v_device_types[1 + (random() * 3)::INT],
        'realistic_seeding',
        NOW()
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  -- 3회 방문 고객 처리
  FOR i IN 1..v_triple_customers LOOP
    v_customer_idx := v_customer_idx + 1;
    IF v_customer_idx > array_length(v_customer_ids, 1) THEN
      EXIT;
    END IF;
    v_customer_id := v_customer_ids[v_customer_idx];

    FOR j IN 1..3 LOOP
      v_visit_date := CURRENT_DATE - (random() * 89)::INT;
      v_visit_time := (v_visit_date + (TIME '10:00:00' + (random() * INTERVAL '9 hours')))::timestamptz;
      v_duration := 12 + (random() * 48)::INT;
      v_made_purchase := random() < 0.25;

      v_zones_to_visit := ARRAY(
        SELECT DISTINCT v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT]
        FROM generate_series(1, 1 + (random() * 3)::INT)
        LIMIT 4
      );

      INSERT INTO store_visits (
        id, store_id, org_id, customer_id,
        visit_date, exit_date, duration_minutes,
        zones_visited, made_purchase, purchase_amount,
        entry_point, device_type, data_source, created_at
      ) VALUES (
        gen_random_uuid(),
        v_store_id,
        v_org_id,
        v_customer_id,
        v_visit_time,
        v_visit_time + (v_duration * INTERVAL '1 minute'),
        v_duration,
        v_zones_to_visit,
        v_made_purchase,
        CASE WHEN v_made_purchase THEN 50000 + (random() * 300000)::INT ELSE NULL END,
        v_entry_points[1 + (random() * 2)::INT],
        v_device_types[1 + (random() * 3)::INT],
        'realistic_seeding',
        NOW()
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  -- 4회+ 방문 고객 처리 (충성 고객)
  FOR i IN 1..v_multi_customers LOOP
    v_customer_idx := v_customer_idx + 1;
    IF v_customer_idx > array_length(v_customer_ids, 1) THEN
      EXIT;
    END IF;
    v_customer_id := v_customer_ids[v_customer_idx];

    v_visit_count := 4 + (random() * 4)::INT;  -- 4-8회
    FOR j IN 1..v_visit_count LOOP
      v_visit_date := CURRENT_DATE - (random() * 89)::INT;
      v_visit_time := (v_visit_date + (TIME '10:00:00' + (random() * INTERVAL '9 hours')))::timestamptz;
      v_duration := 15 + (random() * 45)::INT;
      v_made_purchase := random() < 0.35;  -- VIP 고객 높은 구매율

      v_zones_to_visit := ARRAY(
        SELECT DISTINCT v_zone_names[1 + (random() * (array_length(v_zone_names, 1) - 1))::INT]
        FROM generate_series(1, 1 + (random() * 3)::INT)
        LIMIT 4
      );

      INSERT INTO store_visits (
        id, store_id, org_id, customer_id,
        visit_date, exit_date, duration_minutes,
        zones_visited, made_purchase, purchase_amount,
        entry_point, device_type, data_source, created_at
      ) VALUES (
        gen_random_uuid(),
        v_store_id,
        v_org_id,
        v_customer_id,
        v_visit_time,
        v_visit_time + (v_duration * INTERVAL '1 minute'),
        v_duration,
        v_zones_to_visit,
        v_made_purchase,
        CASE WHEN v_made_purchase THEN 80000 + (random() * 400000)::INT ELSE NULL END,
        v_entry_points[1 + (random() * 2)::INT],
        v_device_types[1 + (random() * 3)::INT],
        'realistic_seeding',
        NOW()
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'STEP 3 완료: store_visits % 건 생성됨', v_inserted;
END $$;


-- ============================================================================
-- STEP 4: daily_kpis_agg 재계산
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_deleted INT;
  v_inserted INT;
  v_floor_area NUMERIC;
BEGIN
  SELECT s.id, s.org_id, COALESCE(s.floor_area_sqm, s.area_sqm, 100)
  INTO v_store_id, v_org_id, v_floor_area
  FROM stores s ORDER BY s.created_at ASC LIMIT 1;

  RAISE NOTICE 'STEP 4: daily_kpis_agg 재계산 시작...';

  -- 기존 데이터 삭제
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '기존 daily_kpis_agg % 건 삭제', v_deleted;

  -- line_items + store_visits 기반으로 재계산
  INSERT INTO daily_kpis_agg (
    date, store_id, org_id,
    total_visitors, unique_visitors, returning_visitors,
    total_transactions, total_revenue, avg_transaction_value,
    conversion_rate, avg_visit_duration_seconds, sales_per_sqm,
    weather_condition, is_holiday
  )
  SELECT
    d.date,
    v_store_id,
    v_org_id,
    COALESCE(vs.total_visitors, 0),
    COALESCE(vs.unique_visitors, 0),
    -- returning_visitors: 해당 일에 방문한 고객 중 이전에 방문한 적 있는 고객 수
    COALESCE(vs.returning_count, 0),
    COALESCE(ls.total_transactions, 0),
    COALESCE(ls.total_revenue, 0),
    CASE WHEN ls.total_transactions > 0
         THEN ls.total_revenue / ls.total_transactions
         ELSE 0 END,
    CASE WHEN vs.total_visitors > 0
         THEN LEAST(100, (COALESCE(ls.total_transactions, 0)::FLOAT / vs.total_visitors * 100))
         ELSE 0 END,
    COALESCE(vs.avg_duration_seconds, 0),
    COALESCE(ls.total_revenue, 0) / NULLIF(v_floor_area, 0),
    CASE WHEN random() < 0.7 THEN 'sunny' ELSE 'cloudy' END,
    EXTRACT(DOW FROM d.date) IN (0, 6)
  FROM (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '90 days',
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as date
  ) d
  LEFT JOIN (
    SELECT
      transaction_date,
      COUNT(DISTINCT transaction_id) as total_transactions,
      SUM(line_total) as total_revenue
    FROM line_items
    WHERE store_id = v_store_id
    GROUP BY transaction_date
  ) ls ON ls.transaction_date = d.date
  LEFT JOIN (
    SELECT
      DATE(visit_date) as visit_date,
      COUNT(*) as total_visitors,
      COUNT(DISTINCT customer_id) as unique_visitors,
      -- 재방문자 = 이전에 방문한 적 있는 고객
      COUNT(DISTINCT CASE
        WHEN EXISTS (
          SELECT 1 FROM store_visits sv2
          WHERE sv2.customer_id = store_visits.customer_id
            AND sv2.store_id = store_visits.store_id
            AND DATE(sv2.visit_date) < DATE(store_visits.visit_date)
        ) THEN store_visits.customer_id
        ELSE NULL
      END) as returning_count,
      AVG(duration_minutes * 60) as avg_duration_seconds
    FROM store_visits
    WHERE store_id = v_store_id
    GROUP BY DATE(visit_date)
  ) vs ON vs.visit_date = d.date
  WHERE COALESCE(ls.total_revenue, 0) > 0 OR COALESCE(vs.total_visitors, 0) > 0;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'STEP 4 완료: daily_kpis_agg % 건 생성됨', v_inserted;
END $$;


-- ============================================================================
-- STEP 5: 검증 및 통계
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_total_visits INT;
  v_unique_visitors INT;
  v_avg_visits_per_customer NUMERIC;
  v_return_rate NUMERIC;
  v_single_visit_customers INT;
  v_multi_visit_customers INT;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 총 방문 수
  SELECT COUNT(*) INTO v_total_visits FROM store_visits WHERE store_id = v_store_id;

  -- 순 방문객 수
  SELECT COUNT(DISTINCT customer_id) INTO v_unique_visitors FROM store_visits WHERE store_id = v_store_id;

  -- 평균 방문 횟수
  v_avg_visits_per_customer := v_total_visits::NUMERIC / NULLIF(v_unique_visitors, 0);

  -- 1회 방문 고객 수
  SELECT COUNT(*) INTO v_single_visit_customers
  FROM (
    SELECT customer_id, COUNT(*) as cnt
    FROM store_visits WHERE store_id = v_store_id
    GROUP BY customer_id
    HAVING COUNT(*) = 1
  ) t;

  -- 2회+ 방문 고객 수
  SELECT COUNT(*) INTO v_multi_visit_customers
  FROM (
    SELECT customer_id, COUNT(*) as cnt
    FROM store_visits WHERE store_id = v_store_id
    GROUP BY customer_id
    HAVING COUNT(*) >= 2
  ) t;

  -- 재방문률
  v_return_rate := (v_multi_visit_customers::NUMERIC / NULLIF(v_unique_visitors, 0)) * 100;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'STEP 5: 최종 검증 결과';
  RAISE NOTICE '====================================';
  RAISE NOTICE '총 방문 수 (Footfall): %', v_total_visits;
  RAISE NOTICE '순 방문객 (Unique Visitors): %', v_unique_visitors;
  RAISE NOTICE '평균 방문 횟수: % 회/인', ROUND(v_avg_visits_per_customer, 2);
  RAISE NOTICE '1회 방문 고객: % 명 (%.1f%%)', v_single_visit_customers, (v_single_visit_customers::NUMERIC / NULLIF(v_unique_visitors, 0)) * 100;
  RAISE NOTICE '재방문 고객 (2회+): % 명 (%.1f%%)', v_multi_visit_customers, v_return_rate;
  RAISE NOTICE '====================================';
  RAISE NOTICE '목표 대비 검증:';
  RAISE NOTICE '  - 총 입장 목표: ~3,500 / 실제: %', v_total_visits;
  RAISE NOTICE '  - 순 방문객 목표: ~2,500 / 실제: %', v_unique_visitors;
  RAISE NOTICE '  - 재방문률 목표: 20-30%% / 실제: %.1f%%', v_return_rate;
  RAISE NOTICE '  - 평균 방문 목표: 1.3-1.5회 / 실제: % 회', ROUND(v_avg_visits_per_customer, 2);
END $$;


-- ============================================================================
-- STEP 6: customers 테이블 통계 업데이트
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_updated INT;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;

  -- 각 고객의 total_visits, total_spent 업데이트
  UPDATE customers c
  SET
    total_visits = COALESCE(stats.visit_count, 0),
    total_spent = COALESCE(stats.total_spent, 0),
    first_visit_date = COALESCE(stats.first_visit, c.first_visit_date)
  FROM (
    SELECT
      customer_id,
      COUNT(*) as visit_count,
      SUM(COALESCE(purchase_amount, 0)) as total_spent,
      MIN(visit_date) as first_visit
    FROM store_visits
    WHERE store_id = v_store_id
    GROUP BY customer_id
  ) stats
  WHERE c.id = stats.customer_id
    AND c.store_id = v_store_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'STEP 6 완료: customers 통계 % 건 업데이트됨', v_updated;
END $$;
