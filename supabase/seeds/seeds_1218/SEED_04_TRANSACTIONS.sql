-- ============================================================================
-- NEURALTWIN v8.6 SEED_04 (수정본): 트랜잭션/이벤트 데이터
-- 스키마 준수: public.store_visits, public.transactions, public.line_items,
--             public.funnel_events, public.zone_events, public.visit_zone_events,
--             public.zone_transitions
-- 주의: RLS가 활성화되어 있으므로 서비스 롤/관리자 권한으로 실행하거나
--       시드용 완화 정책이 필요합니다.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[];
  v_product_ids UUID[];
  v_customer_ids UUID[];
  v_visit_id UUID;
  v_transaction_id UUID;
  v_visit_date DATE;
  v_entry_time TIMESTAMPTZ;
  v_exit_time TIMESTAMPTZ;
  v_dwell_minutes INT;
  v_converted BOOLEAN;
  v_purchase_amount NUMERIC;
  v_customer_id UUID;
  v_product_id UUID;
  v_day INT;
  v_hour INT;
  v_visit_count INT;
  v_i INT;
  v_j INT;
  v_zone_index INT;
  v_total_visits INT := 0;
  v_total_transactions INT := 0;
  v_total_line_items INT := 0;
  v_total_funnel_events INT := 0;
  v_total_zone_events INT := 0;
  v_total_visit_zone_events INT := 0;
  v_event_types TEXT[] := ARRAY['entry','browse','engage','fitting','purchase'];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_04 (수정본): 스키마 호환';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- Store/User/Org
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM public.stores LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 기존 데이터 삭제 (Idempotent 실행을 위해)
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [CLEANUP] 기존 시드 데이터 삭제 중...';
  
  DELETE FROM public.line_items WHERE store_id = v_store_id;
  DELETE FROM public.transactions WHERE store_id = v_store_id;
  DELETE FROM public.funnel_events WHERE store_id = v_store_id;
  DELETE FROM public.zone_events WHERE store_id = v_store_id;
  DELETE FROM public.visit_zone_events WHERE store_id = v_store_id;
  DELETE FROM public.store_visits WHERE store_id = v_store_id;
  DELETE FROM public.zone_transitions WHERE store_id = v_store_id;
  
  RAISE NOTICE '  [CLEANUP] 완료';

  -- Zones, Products, Customers
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zone_ids
  FROM public.zones_dim WHERE store_id = v_store_id;

  SELECT ARRAY_AGG(id) INTO v_product_ids
  FROM public.products WHERE store_id = v_store_id;

  SELECT ARRAY_AGG(id) INTO v_customer_ids
  FROM (SELECT id FROM public.customers WHERE store_id = v_store_id LIMIT 500) sub;

  IF v_zone_ids IS NULL OR ARRAY_LENGTH(v_zone_ids, 1) = 0 THEN
    RAISE EXCEPTION 'zones_dim 데이터가 없습니다. SEED_02를 먼저 실행하세요.';
  END IF;

  IF v_product_ids IS NULL OR ARRAY_LENGTH(v_product_ids, 1) = 0 THEN
    RAISE EXCEPTION 'products 데이터가 없습니다. SEED_03를 먼저 실행하세요.';
  END IF;

  RAISE NOTICE '  Store ID: %', v_store_id;
  RAISE NOTICE '  Zones: % 개', ARRAY_LENGTH(v_zone_ids, 1);
  RAISE NOTICE '  Products: % 개', ARRAY_LENGTH(v_product_ids, 1);
  RAISE NOTICE '  Customers: % 개', ARRAY_LENGTH(v_customer_ids, 1);

  -- 90일간 생성
  FOR v_day IN 0..89 LOOP
    v_visit_date := CURRENT_DATE - v_day;

    -- 주말 가중치
    IF EXTRACT(DOW FROM v_visit_date) IN (0, 6) THEN
      v_visit_count := 100 + FLOOR(RANDOM() * 30)::INT;
    ELSE
      v_visit_count := 75 + FLOOR(RANDOM() * 20)::INT;
    END IF;

    FOR v_i IN 1..v_visit_count LOOP
      -- 고객
      v_customer_id := v_customer_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_customer_ids, 1))::INT];

      -- 방문 시간 (10~20시 시작, 10~21 범위로 활동)
      v_hour := 10 + FLOOR(RANDOM() * 11)::INT;
      v_entry_time := v_visit_date + (v_hour || ' hours')::INTERVAL + (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL;

      -- 체류 5~45분
      v_dwell_minutes := 5 + FLOOR(RANDOM() * 40)::INT;
      v_exit_time := v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL;

      -- 구매 전환
      v_converted := RANDOM() < 0.5;
      v_visit_id := gen_random_uuid();

      -- 1) store_visits
      INSERT INTO public.store_visits (
        id, store_id, org_id, customer_id, visit_date, exit_date,
        duration_minutes, zones_visited, zone_durations, made_purchase,
        entry_point, device_type, data_source, created_at
      ) VALUES (
        v_visit_id, v_store_id, v_org_id, v_customer_id, v_entry_time, v_exit_time,
        v_dwell_minutes, ARRAY['Z001','Z002','Z003'], '{}'::jsonb, v_converted,
        'main_entrance',
        (ARRAY['mobile','desktop','tablet'])[1 + FLOOR(RANDOM() * 3)::INT],
        'seed_data', NOW()
      );
      v_total_visits := v_total_visits + 1;

      -- 2) funnel_events (확률 기반 퍼널: entry → browse → engage → fitting)
      -- entry (100%)
      INSERT INTO public.funnel_events (
        id, store_id, org_id, customer_id, event_type,
        event_date, event_timestamp, event_hour, zone_id, product_id, metadata, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
        'entry',
        v_visit_date,
        v_entry_time,
        v_hour,
        v_zone_ids[1],
        NULL,
        '{}'::jsonb, NOW()
      );
      v_total_funnel_events := v_total_funnel_events + 1;

      -- browse (87% 확률)
      IF RANDOM() < 0.87 THEN
        INSERT INTO public.funnel_events (
          id, store_id, org_id, customer_id, event_type,
          event_date, event_timestamp, event_hour, zone_id, product_id, metadata, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
          'browse',
          v_visit_date,
          v_entry_time + '3 minutes'::INTERVAL,
          v_hour,
          v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT],
          v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT],
          '{}'::jsonb, NOW()
        );
        v_total_funnel_events := v_total_funnel_events + 1;

        -- engage (browse의 75% = 전체 65%)
        IF RANDOM() < 0.75 THEN
          INSERT INTO public.funnel_events (
            id, store_id, org_id, customer_id, event_type,
            event_date, event_timestamp, event_hour, zone_id, product_id, metadata, created_at
          ) VALUES (
            gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
            'engage',
            v_visit_date,
            v_entry_time + '6 minutes'::INTERVAL,
            v_hour,
            v_zone_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT],
            v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT],
            '{}'::jsonb, NOW()
          );
          v_total_funnel_events := v_total_funnel_events + 1;

          -- fitting (engage의 30% = 전체 19%)
          IF RANDOM() < 0.30 THEN
            INSERT INTO public.funnel_events (
              id, store_id, org_id, customer_id, event_type,
              event_date, event_timestamp, event_hour, zone_id, product_id, metadata, created_at
            ) VALUES (
              gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
              'fitting',
              v_visit_date,
              v_entry_time + '9 minutes'::INTERVAL,
              v_hour,
              v_zone_ids[LEAST(5, ARRAY_LENGTH(v_zone_ids, 1))],
              v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT],
              '{}'::jsonb, NOW()
            );
            v_total_funnel_events := v_total_funnel_events + 1;
          END IF;
        END IF;
      END IF;

      -- 3) zone_events (방문당 3~6개)
      FOR v_j IN 1..(3 + FLOOR(RANDOM() * 4)::INT) LOOP
        v_zone_index := 1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT;
        INSERT INTO public.zone_events (
          id, store_id, org_id, zone_id, event_type, event_date,
          event_timestamp, customer_id, duration_seconds, metadata, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[v_zone_index],
          (ARRAY['enter','dwell','exit'])[1 + FLOOR(RANDOM() * 3)::INT],
          v_visit_date,
          v_entry_time + ((v_j * 5) || ' minutes')::INTERVAL,
          v_customer_id,
          60 + FLOOR(RANDOM() * 300)::INT,
          '{}'::jsonb, NOW()
        );
        v_total_zone_events := v_total_zone_events + 1;
      END LOOP;

      -- 4) visit_zone_events (방문당 2~4개)
      FOR v_j IN 1..(2 + FLOOR(RANDOM() * 3)::INT) LOOP
        v_zone_index := 1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_zone_ids, 1))::INT;
        INSERT INTO public.visit_zone_events (
          id, store_id, org_id, visit_id, zone_id,
          entry_time, exit_time, dwell_seconds, interaction_count, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, NULL, v_zone_ids[v_zone_index],
          v_entry_time + ((v_j * 5) || ' minutes')::INTERVAL,
          v_entry_time + (((v_j * 5) + 3 + FLOOR(RANDOM() * 5)::INT) || ' minutes')::INTERVAL,
          180 + FLOOR(RANDOM() * 300)::INT,
          1 + FLOOR(RANDOM() * 5)::INT,
          NOW()
        );
        v_total_visit_zone_events := v_total_visit_zone_events + 1;
      END LOOP;

      -- 5) transactions + line_items (전환 시)
      IF v_converted THEN
        v_transaction_id := gen_random_uuid();
        v_purchase_amount := 50000 + FLOOR(RANDOM() * 400000)::NUMERIC;

        -- transactions (헤더)
        INSERT INTO public.transactions (
          id, store_id, org_id, user_id, customer_id, visit_id,
          transaction_datetime, channel, payment_method,
          total_amount, discount_amount, net_amount, metadata, created_at
        ) VALUES (
          v_transaction_id, v_store_id, v_org_id, v_user_id, v_customer_id, NULL,
          v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL,
          'in_store',
          (ARRAY['card','cash','mobile'])[1 + FLOOR(RANDOM() * 3)::INT],
          v_purchase_amount,
          FLOOR(v_purchase_amount * 0.05)::NUMERIC,
          v_purchase_amount - FLOOR(v_purchase_amount * 0.05)::NUMERIC,
          jsonb_build_object(
            'receipt_number', 'RCP-' || TO_CHAR(v_visit_date, 'YYYYMMDD') || '-' || LPAD(v_total_transactions::TEXT, 5, '0')
          ),
          NOW()
        );
        v_total_transactions := v_total_transactions + 1;

        -- funnel_events에 purchase 이벤트 동기화 추가
        INSERT INTO public.funnel_events (
          id, store_id, org_id, customer_id, event_type,
          event_date, event_timestamp, event_hour, zone_id, product_id, metadata, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
          'purchase',
          v_visit_date,
          v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL,
          EXTRACT(HOUR FROM (v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL))::INT,
          v_zone_ids[LEAST(6, ARRAY_LENGTH(v_zone_ids, 1))],  -- 계산대 존 (안전한 인덱스)
          v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT],
          jsonb_build_object('transaction_id', v_transaction_id),
          NOW()
        );
        v_total_funnel_events := v_total_funnel_events + 1;

        -- line_items (1~3개)
        FOR v_j IN 1..(1 + FLOOR(RANDOM() * 3)::INT) LOOP
          v_product_id := v_product_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_product_ids, 1))::INT];

          INSERT INTO public.line_items (
            id, store_id, org_id, transaction_id, purchase_id, product_id, customer_id,
            quantity, unit_price, discount_amount, tax_amount, line_total,
            transaction_date, transaction_hour, payment_method, created_at
          ) VALUES (
            gen_random_uuid(), v_store_id, v_org_id, v_transaction_id::text, NULL, v_product_id, v_customer_id,
            1 + FLOOR(RANDOM() * 2)::INT,
            (SELECT price FROM public.products WHERE id = v_product_id),
            FLOOR(RANDOM() * 10000)::NUMERIC,
            0,
            (SELECT price FROM public.products WHERE id = v_product_id) * (1 + FLOOR(RANDOM() * 2)::INT),
            (v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL)::date,
            EXTRACT(HOUR FROM (v_entry_time + (v_dwell_minutes || ' minutes')::INTERVAL))::int,
            (ARRAY['card','cash','mobile'])[1 + FLOOR(RANDOM() * 3)::INT],
            NOW()
          );
          v_total_line_items := v_total_line_items + 1;
        END LOOP;
      END IF;

    END LOOP; -- visits loop

    IF v_day % 10 = 0 THEN
      RAISE NOTICE '    - Day % 진행: visits=%, tx=%, funnel=%', 90 - v_day, v_total_visits, v_total_transactions, v_total_funnel_events;
    END IF;
  END LOOP; -- 90 days

  RAISE NOTICE '';
  RAISE NOTICE '  [STEP 1~5 완료]';
  RAISE NOTICE '    ✓ store_visits: %', v_total_visits;
  RAISE NOTICE '    ✓ transactions: %', v_total_transactions;
  RAISE NOTICE '    ✓ line_items: %', v_total_line_items;
  RAISE NOTICE '    ✓ funnel_events: %', v_total_funnel_events;
  RAISE NOTICE '    ✓ zone_events: %', v_total_zone_events;
  RAISE NOTICE '    ✓ visit_zone_events: %', v_total_visit_zone_events;

  -- 6) zone_transitions (90일 × 17패턴/일)
  RAISE NOTICE '';
  RAISE NOTICE '  [STEP 6] zone_transitions 시딩...';
  
  FOR v_day IN 0..89 LOOP
    v_visit_date := CURRENT_DATE - v_day;

    INSERT INTO public.zone_transitions
    (id, store_id, org_id, from_zone_id, to_zone_id, transition_date, transition_count, avg_duration_seconds, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[1], v_zone_ids[2], v_visit_date, 70 + FLOOR(RANDOM() * 30)::INT, 30 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[3], v_visit_date, 50 + FLOOR(RANDOM() * 25)::INT, 60 + FLOOR(RANDOM() * 120)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[4], v_visit_date, 40 + FLOOR(RANDOM() * 20)::INT, 60 + FLOOR(RANDOM() * 90)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[LEAST(5, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 120 + FLOOR(RANDOM() * 180)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(5, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[3], v_visit_date, 20 + FLOOR(RANDOM() * 15)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[LEAST(6, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 30 + FLOOR(RANDOM() * 15)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[LEAST(6, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[LEAST(7, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 15 + FLOOR(RANDOM() * 10)::INT, 180 + FLOOR(RANDOM() * 120)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(7, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[2], v_visit_date, 12 + FLOOR(RANDOM() * 8)::INT, 120 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(6, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[1], v_visit_date, 35 + FLOOR(RANDOM() * 20)::INT, 30 + FLOOR(RANDOM() * 30)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[2], v_zone_ids[1], v_visit_date, 25 + FLOOR(RANDOM() * 15)::INT, 20 + FLOOR(RANDOM() * 20)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[3], v_zone_ids[4], v_visit_date, 15 + FLOOR(RANDOM() * 10)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[3], v_visit_date, 10 + FLOOR(RANDOM() * 8)::INT, 60 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(5, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[LEAST(6, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 18 + FLOOR(RANDOM() * 12)::INT, 60 + FLOOR(RANDOM() * 30)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(7, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[3], v_visit_date, 8 + FLOOR(RANDOM() * 5)::INT, 120 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[LEAST(7, ARRAY_LENGTH(v_zone_ids, 1))], v_zone_ids[4], v_visit_date, 6 + FLOOR(RANDOM() * 4)::INT, 90 + FLOOR(RANDOM() * 60)::INT, NOW()),
    (gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[4], v_zone_ids[LEAST(5, ARRAY_LENGTH(v_zone_ids, 1))], v_visit_date, 5 + FLOOR(RANDOM() * 5)::INT, 120 + FLOOR(RANDOM() * 90)::INT, NOW());
  END LOOP;

  RAISE NOTICE '    ✓ zone_transitions: % 건', 90 * 17;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_04 완료(스키마 호환)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ store_visits: %', v_total_visits;
  RAISE NOTICE '  ✓ transactions: %', v_total_transactions;
  RAISE NOTICE '  ✓ line_items: %', v_total_line_items;
  RAISE NOTICE '  ✓ funnel_events: %', v_total_funnel_events;
  RAISE NOTICE '  ✓ zone_events: %', v_total_zone_events;
  RAISE NOTICE '  ✓ visit_zone_events: %', v_total_visit_zone_events;
  RAISE NOTICE '  ✓ zone_transitions: %', 90 * 17;
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'store_visits' as table_name, COUNT(*) as row_count FROM public.store_visits
UNION ALL SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL SELECT 'line_items', COUNT(*) FROM public.line_items
UNION ALL SELECT 'funnel_events', COUNT(*) FROM public.funnel_events
UNION ALL SELECT 'zone_events', COUNT(*) FROM public.zone_events
UNION ALL SELECT 'visit_zone_events', COUNT(*) FROM public.visit_zone_events
UNION ALL SELECT 'zone_transitions', COUNT(*) FROM public.zone_transitions
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- 데이터 정합성 검증
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_tx_count INT;
  v_funnel_purchase INT;
  v_funnel_entry INT;
  v_store_visits INT;
  v_event_hour_null INT;
BEGIN
  SELECT COUNT(*) INTO v_tx_count FROM public.transactions;
  SELECT COUNT(*) INTO v_funnel_purchase FROM public.funnel_events WHERE event_type = 'purchase';
  SELECT COUNT(*) INTO v_funnel_entry FROM public.funnel_events WHERE event_type = 'entry';
  SELECT COUNT(*) INTO v_store_visits FROM public.store_visits;
  SELECT COUNT(*) INTO v_event_hour_null FROM public.funnel_events WHERE event_hour IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '  데이터 정합성 검증';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  -- 검증 1: transactions = funnel_events purchase
  IF v_tx_count != v_funnel_purchase THEN
    RAISE WARNING '❌ transactions(%) != funnel_events purchase(%)', v_tx_count, v_funnel_purchase;
  ELSE
    RAISE NOTICE '✅ transactions = funnel_events purchase: %', v_tx_count;
  END IF;
  
  -- 검증 2: store_visits = funnel_events entry
  IF v_store_visits != v_funnel_entry THEN
    RAISE WARNING '⚠️ store_visits(%) != funnel_events entry(%) - 허용 오차', v_store_visits, v_funnel_entry;
  ELSE
    RAISE NOTICE '✅ store_visits = funnel_events entry: %', v_funnel_entry;
  END IF;
  
  -- 검증 3: event_hour NULL 체크
  IF v_event_hour_null > 0 THEN
    RAISE WARNING '❌ event_hour NULL 건수: %', v_event_hour_null;
  ELSE
    RAISE NOTICE '✅ event_hour 모두 채워짐';
  END IF;
  
  -- 검증 4: 퍼널 분포 확인
  RAISE NOTICE '';
  RAISE NOTICE '퍼널 분포:';
  RAISE NOTICE '  - ENTRY: %', (SELECT COUNT(*) FROM public.funnel_events WHERE event_type = 'entry');
  RAISE NOTICE '  - BROWSE: %', (SELECT COUNT(*) FROM public.funnel_events WHERE event_type = 'browse');
  RAISE NOTICE '  - ENGAGE: %', (SELECT COUNT(*) FROM public.funnel_events WHERE event_type = 'engage');
  RAISE NOTICE '  - FITTING: %', (SELECT COUNT(*) FROM public.funnel_events WHERE event_type = 'fitting');
  RAISE NOTICE '  - PURCHASE: %', v_funnel_purchase;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
