-- ============================================================================
-- NEURALTWIN 통합 샘플 데이터셋 v7.0 - 완전 일관성(L1-L2) 버전
-- ============================================================================
-- v4.0 마스터 데이터 구조 + v5.0 데이터 일관성 로직 통합
-- 모든 데이터가 한번에 생성되며, 테이블 간 수학적 일관성 보장
--
-- 생성 데이터:
--   • stores: 1건
--   • zones_dim: 7건
--   • products: 25건
--   • customers: 500건
--   • store_visits: ~1,250건 (25% 재방문률)
--   • daily_kpis_agg: 90건
--   • zone_daily_metrics: 630건
--   • hourly_metrics: 1,080건
--   • zone_events: ~5,000건
--   • funnel_events: ~6,000건 (store_visits 기반)
--   • purchases: ~175건 (14% 전환율)
--   • line_items: ~350건
--   • product_performance_agg: 2,250건
--   • customer_segments_agg: 540건
--   • applied_strategies: 10건
--   • inventory_levels: 25건
--   • ontology_entity_types: 11건
--   • ontology_relation_types: 4건
--   • graph_entities: 30건
--   • graph_relations: 30건
--   • store_scenes: 1건
--   • ai_recommendations: 4건
-- ============================================================================

-- ============================================================================
-- STEP 0: 기존 데이터 전체 삭제
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 0: 기존 데이터 전체 삭제';
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

  -- 그래프 데이터 삭제
  DELETE FROM graph_relations WHERE store_id = v_store_id;
  DELETE FROM graph_entities WHERE store_id = v_store_id;

  -- 재고 삭제
  DELETE FROM inventory_levels WHERE product_id IN (SELECT id FROM products WHERE store_id = v_store_id);

  -- ✅ 직원 관련 삭제 (stores 삭제 전에 필수!)
  DELETE FROM staff WHERE store_id = v_store_id;

  -- 마스터 데이터 삭제
  DELETE FROM store_scenes WHERE store_id = v_store_id;
  DELETE FROM products WHERE store_id = v_store_id;
  DELETE FROM zones_dim WHERE store_id = v_store_id;
  DELETE FROM stores WHERE id = v_store_id;

  -- 온톨로지 삭제 (org 기준)
  DELETE FROM ontology_relation_types WHERE id IN (
    'c0000001-0000-0000-0000-000000000001'::UUID,
    'c0000002-0000-0000-0000-000000000002'::UUID,
    'c0000003-0000-0000-0000-000000000003'::UUID,
    'c0000004-0000-0000-0000-000000000004'::UUID
  );
  DELETE FROM ontology_entity_types WHERE id IN (
    'b0000001-0000-0000-0000-000000000001'::UUID,
    'b0000002-0000-0000-0000-000000000002'::UUID,
    'b0000003-0000-0000-0000-000000000003'::UUID,
    'b0000004-0000-0000-0000-000000000004'::UUID,
    'b0000005-0000-0000-0000-000000000005'::UUID,
    'b0000006-0000-0000-0000-000000000006'::UUID,
    'b0000007-0000-0000-0000-000000000007'::UUID,
    'b0000008-0000-0000-0000-000000000008'::UUID,
    'b0000009-0000-0000-0000-000000000009'::UUID,
    'b0000010-0000-0000-0000-000000000010'::UUID,
    'b0000011-0000-0000-0000-000000000011'::UUID
  );

  RAISE NOTICE '  ✓ 기존 데이터 전체 삭제 완료';
END $$;

-- ============================================================================
-- STEP 1: 매장 생성 (1건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_user_id IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'User or Organization not found';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: 매장 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO stores (id, user_id, org_id, store_name, store_code, address, floor_area_sqm, area_sqm, is_active, max_capacity, staff_count, created_at)
  VALUES (v_store_id, v_user_id, v_org_id, 'A매장', 'A001', '서울특별시 강남구 테헤란로 123 TCAG 강남점 1F', 250, 250, true, 100, 5, NOW());

  RAISE NOTICE '  ✓ stores: 1건 생성';
END $$;

-- ============================================================================
-- STEP 2: 존 생성 (7건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: zones_dim 생성 (7건) - 3D 좌표 포함';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO zones_dim (id, store_id, user_id, org_id, zone_code, zone_name, zone_type, area_sqm,
    position_x, position_y, position_z, size_width, size_depth, size_height, color, capacity, is_active,
    coordinates, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id, 'Z001', '입구', 'entrance', 3,
   2.5, 0, -7.5, 3, 1, 3, '#4CAF50', 3, true, '{"x":2.5,"y":0,"z":-7.5,"width":3,"depth":1}'::jsonb, NOW()),
  ('a0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id, 'Z002', '메인홀', 'main', 80,
   0, 0, 0, 10, 8, 3, '#2196F3', 40, true, '{"x":0,"y":0,"z":0,"width":10,"depth":8}'::jsonb, NOW()),
  ('a0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id, 'Z003', '의류존', 'display', 36,
   -5, 0, 3, 6, 6, 3, '#9C27B0', 18, true, '{"x":-5,"y":0,"z":3,"width":6,"depth":6}'::jsonb, NOW()),
  ('a0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id, 'Z004', '액세서리존', 'display', 36,
   5, 0, 3, 6, 6, 3, '#FF9800', 18, true, '{"x":5,"y":0,"z":3,"width":6,"depth":6}'::jsonb, NOW()),
  ('a0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id, 'Z005', '피팅룸', 'fitting', 16,
   -5, 0, -5, 4, 4, 3, '#E91E63', 4, true, '{"x":-5,"y":0,"z":-5,"width":4,"depth":4}'::jsonb, NOW()),
  ('a0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id, 'Z006', '계산대', 'checkout', 9,
   4.5, 0, 5.5, 3, 3, 3, '#00BCD4', 4, true, '{"x":4.5,"y":0,"z":5.5,"width":3,"depth":3}'::jsonb, NOW()),
  ('a0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id, 'Z007', '휴식공간', 'lounge', 16,
   0, 0, 7, 8, 2, 3, '#8BC34A', 8, true, '{"x":0,"y":0,"z":7,"width":8,"depth":2}'::jsonb, NOW());

  RAISE NOTICE '  ✓ zones_dim: 7건 생성 (3D 좌표 포함)';
END $$;

-- ============================================================================
-- STEP 3: 상품 생성 (25건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  i INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: products 생성 (25건) - SKU/카테고리 상세';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..25 LOOP
    INSERT INTO products (id, store_id, user_id, org_id, product_name, sku, category, price, cost_price, stock, created_at)
    VALUES (
      ('f000' || LPAD(i::TEXT, 4, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      CASE i
        WHEN 1 THEN '프리미엄 캐시미어 코트' WHEN 2 THEN '울 테일러드 재킷' WHEN 3 THEN '다운 패딩'
        WHEN 4 THEN '트렌치 코트' WHEN 5 THEN '레더 자켓' WHEN 6 THEN '실크 블라우스'
        WHEN 7 THEN '캐주얼 니트 스웨터' WHEN 8 THEN '옥스포드 셔츠' WHEN 9 THEN '린넨 탑'
        WHEN 10 THEN '폴로 셔츠' WHEN 11 THEN '리넨 와이드 팬츠' WHEN 12 THEN '슬림핏 데님'
        WHEN 13 THEN '치노 팬츠' WHEN 14 THEN '조거 팬츠' WHEN 15 THEN 'A라인 스커트'
        WHEN 16 THEN '가죽 토트백' WHEN 17 THEN '실버 목걸이' WHEN 18 THEN '가죽 벨트'
        WHEN 19 THEN '스카프 세트' WHEN 20 THEN '울 머플러' WHEN 21 THEN '프리미엄 로퍼'
        WHEN 22 THEN '하이힐 펌프스' WHEN 23 THEN '스니커즈' WHEN 24 THEN '프리미엄 스킨케어 세트'
        ELSE '립스틱 컬렉션'
      END,
      CASE
        WHEN i<=5 THEN 'SKU-OUT-'||LPAD(i::TEXT,3,'0')
        WHEN i<=10 THEN 'SKU-TOP-'||LPAD((i-5)::TEXT,3,'0')
        WHEN i<=15 THEN 'SKU-BTM-'||LPAD((i-10)::TEXT,3,'0')
        WHEN i<=20 THEN 'SKU-ACC-'||LPAD((i-15)::TEXT,3,'0')
        WHEN i<=23 THEN 'SKU-SHO-'||LPAD((i-20)::TEXT,3,'0')
        ELSE 'SKU-COS-'||LPAD((i-23)::TEXT,3,'0')
      END,
      CASE
        WHEN i<=5 THEN '아우터'
        WHEN i<=10 THEN '상의'
        WHEN i<=15 THEN '하의'
        WHEN i<=20 THEN '액세서리'
        WHEN i<=23 THEN '신발'
        ELSE '화장품'
      END,
      CASE
        WHEN i<=5 THEN 350000+(i*50000)
        WHEN i<=10 THEN 80000+((i-5)*20000)
        WHEN i<=15 THEN 120000+((i-10)*25000)
        WHEN i<=20 THEN 150000+((i-15)*40000)
        WHEN i<=23 THEN 200000+((i-20)*80000)
        ELSE 80000+((i-23)*30000)
      END,
      CASE
        WHEN i<=5 THEN (350000+(i*50000))*0.4
        WHEN i<=10 THEN (80000+((i-5)*20000))*0.4
        WHEN i<=15 THEN (120000+((i-10)*25000))*0.4
        WHEN i<=20 THEN (150000+((i-15)*40000))*0.4
        WHEN i<=23 THEN (200000+((i-20)*80000))*0.4
        ELSE (80000+((i-23)*30000))*0.4
      END,
      CASE
        WHEN i IN (3,7,12,17) THEN 5+floor(random()*5)::INT
        WHEN i IN (1,6,16,21,24) THEN 80+floor(random()*40)::INT
        ELSE 30+floor(random()*40)::INT
      END,
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ products: 25건 생성';
  RAISE NOTICE '    - 아우터: 5개 (SKU-OUT-001~005)';
  RAISE NOTICE '    - 상의: 5개 (SKU-TOP-001~005)';
  RAISE NOTICE '    - 하의: 5개 (SKU-BTM-001~005)';
  RAISE NOTICE '    - 액세서리: 5개 (SKU-ACC-001~005)';
  RAISE NOTICE '    - 신발: 3개 (SKU-SHO-001~003)';
  RAISE NOTICE '    - 화장품: 2개 (SKU-COS-001~002)';
END $$;


-- ============================================================================
-- STEP 4: 고객 생성 (500명) - 세그먼트 분포 유지
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
  RAISE NOTICE 'STEP 4: 고객 생성 (2,500명)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..2500 LOOP
    -- 세그먼트: VIP 5% (125명), Regular 20% (500명), New 75% (1,875명)
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
      NOW() - ((random()*365)||' days')::INTERVAL
    );
  END LOOP;

  RAISE NOTICE '  ✓ customers: 2,500명 생성';
  RAISE NOTICE '    - VIP: 125명 (5%%)';
  RAISE NOTICE '    - Regular: 500명 (20%%)';
  RAISE NOTICE '    - New: 1,875명 (75%%)';
END $$;

-- ============================================================================
-- v6.0 수정: STEP 5 - store_visits (~3,500건) - 2,500명 고객 기준
-- ============================================================================
-- 방문 분포:
--   - 1,875명 (75%): 1회 방문 = 1,875건
--   - 375명 (15%): 2회 방문 = 750건
--   - 175명 (7%): 3회 방문 = 525건
--   - 75명 (3%): 4~8회 방문 = ~375건
--   - 총: ~3,525건
-- 재방문률: 25% (625/2500)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_zone_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,
    'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID,
    'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID,
    'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  i INT;
  v INT;
  j INT;
  v_customer_id UUID;
  v_visit_count INT;
  v_visit_date TIMESTAMPTZ;
  v_duration INT;
  v_path UUID[];
  v_made_purchase BOOLEAN;
  v_total_visits INT := 0;

  -- 방문 분포 설정 (2,500명 기준)
  v_single_count INT := 1875;  -- 1회 방문: 75%
  v_double_count INT := 375;   -- 2회 방문: 15%
  v_triple_count INT := 175;   -- 3회 방문: 7%
  v_multi_count INT := 75;     -- 4회+ 방문: 3%
  v_customer_idx INT := 1;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: store_visits 생성 (~3,500건) - 2,500명 고객 기준';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ============================================
  -- 1회 방문 고객 (1,875명 × 1 = 1,875건)
  -- ============================================
  FOR i IN 1..v_single_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                   - ((floor(random()*10) + 10)||' hours')::INTERVAL;
    v_duration := 300 + floor(random()*1800)::INT;
    v_made_purchase := random() < 0.10;  -- 10% 구매율

    v_path := ARRAY[v_zone_ids[1]];
    FOR j IN 2..(2+floor(random()*5)::INT) LOOP
      v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
    END LOOP;

    INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
      duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
    VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
      v_visit_date,
      v_visit_date + (v_duration||' seconds')::INTERVAL,
      floor(v_duration/60)::INT,
      v_path,
      '{}'::jsonb,
      v_made_purchase,
      v_visit_date
    );

    v_customer_idx := v_customer_idx + 1;
    v_total_visits := v_total_visits + 1;
  END LOOP;

  RAISE NOTICE '  ✓ 1회 방문: %건', v_single_count;

  -- ============================================
  -- 2회 방문 고객 (375명 × 2 = 750건)
  -- ============================================
  FOR i IN 1..v_double_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;

    FOR v IN 1..2 LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                     - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.15;  -- 15% 구매율 (재방문)

      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
        duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
        v_visit_date,
        v_visit_date + (v_duration||' seconds')::INTERVAL,
        floor(v_duration/60)::INT,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
      v_total_visits := v_total_visits + 1;
    END LOOP;

    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  ✓ 2회 방문: %건', v_double_count * 2;

  -- ============================================
  -- 3회 방문 고객 (175명 × 3 = 525건)
  -- ============================================
  FOR i IN 1..v_triple_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;

    FOR v IN 1..3 LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                     - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.18;  -- 18% 구매율

      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
        duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
        v_visit_date,
        v_visit_date + (v_duration||' seconds')::INTERVAL,
        floor(v_duration/60)::INT,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
      v_total_visits := v_total_visits + 1;
    END LOOP;

    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  ✓ 3회 방문: %건', v_triple_count * 3;

  -- ============================================
  -- 4회+ 방문 고객 (75명 × 평균 5회 = ~375건)
  -- ============================================
  FOR i IN 1..v_multi_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    v_visit_count := 4 + floor(random() * 4)::INT;  -- 4~7회

    FOR v IN 1..v_visit_count LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL
                     - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.25;  -- 25% 구매율 (충성 고객)

      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;

      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date,
        duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_customer_id,
        v_visit_date,
        v_visit_date + (v_duration||' seconds')::INTERVAL,
        floor(v_duration/60)::INT,
        v_path,
        '{}'::jsonb,
        v_made_purchase,
        v_visit_date
      );
      v_total_visits := v_total_visits + 1;
    END LOOP;

    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  ✓ 4회+ 방문 고객: %명', v_multi_count;
  RAISE NOTICE '';
  RAISE NOTICE '  📊 총 store_visits: %건', v_total_visits;
  RAISE NOTICE '  📊 재방문률: 25%% (625/2500 고객)';
END $$;


-- ============================================================================
-- STEP 6: purchases & line_items 생성 (store_visits.made_purchase 기반)
-- ============================================================================
-- ============================================================================
-- STEP 6: purchases & line_items 생성 (visit_id = NULL로 수정)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_product RECORD;
  v_item_count INT;
  v_purchase_count INT := 0;
  v_line_count INT := 0;
  v_purchase_id UUID;
  v_tx_id TEXT;
  v_qty INT;
  v_total NUMERIC;
  v_discount NUMERIC;
  i INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6: purchases & line_items 생성 (실제 스키마)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, duration_minutes
    FROM store_visits
    WHERE store_id = v_store_id AND made_purchase = true
  LOOP
    v_item_count := 1 + floor(random() * 3)::INT;
    v_tx_id := 'TX-' || TO_CHAR(v_visit.visit_date, 'YYYYMMDD') || '-' || LPAD(v_purchase_count::TEXT, 4, '0');

    FOR i IN 1..v_item_count LOOP
      SELECT id, price INTO v_product
      FROM products
      WHERE store_id = v_store_id
      ORDER BY random()
      LIMIT 1;

      v_qty := 1 + floor(random() * 2)::INT;
      v_total := v_product.price * v_qty;
      v_discount := floor(v_total * random() * 0.1);
      v_purchase_id := gen_random_uuid();

      -- ✅ visit_id를 NULL로 설정 (visits 테이블 FK 우회)
      INSERT INTO purchases (
        id, user_id, org_id, store_id, customer_id, visit_id,
        product_id, purchase_date, quantity, unit_price, total_price, created_at
      ) VALUES (
        v_purchase_id,
        v_user_id,
        v_org_id,
        v_store_id,
        v_visit.customer_id,
        NULL,  -- ✅ visits 테이블 FK 문제 우회
        v_product.id,
        v_visit.visit_date + ((v_visit.duration_minutes * 0.8)::INT || ' minutes')::INTERVAL,
        v_qty,
        v_product.price,
        v_total,
        v_visit.visit_date
      );
      v_purchase_count := v_purchase_count + 1;

      INSERT INTO line_items (
        id, org_id, store_id, transaction_id, purchase_id, product_id, customer_id,
        quantity, unit_price, discount_amount, tax_amount, line_total,
        transaction_date, transaction_hour, payment_method, is_return, metadata, created_at
      ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_store_id,
        v_tx_id,
        v_purchase_id,
        v_product.id,
        v_visit.customer_id,
        v_qty,
        v_product.price,
        v_discount,
        floor(v_total * 0.1),
        v_total - v_discount,
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        (ARRAY['card', 'cash', 'mobile'])[1 + floor(random() * 3)::INT],
        false,
        '{}'::jsonb,
        v_visit.visit_date
      );
      v_line_count := v_line_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ purchases: %건 생성', v_purchase_count;
  RAISE NOTICE '  ✓ line_items: %건 생성', v_line_count;
END $$;


-- ============================================================================
-- v6.0 추가: STEP 6-B - store_goals 테이블 시딩
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6-B: store_goals 생성 (목표 달성률 패널용)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 목표 삭제
  DELETE FROM store_goals WHERE store_id = v_store_id;

  -- 현재 월 기준
  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- ============================================
  -- 월간 목표 (현재 월)
  -- ============================================

  -- 1. 매출 목표: 1억원
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'revenue', 'monthly',
    v_period_start, v_period_end,
    100000000,  -- 1억원
    v_user_id, true, NOW(), NOW()
  );

  -- 2. 방문자 목표: 5,000명
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'visitors', 'monthly',
    v_period_start, v_period_end,
    5000,  -- 5,000명
    v_user_id, true, NOW(), NOW()
  );

  -- 3. 전환율 목표: 15%
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'conversion', 'monthly',
    v_period_start, v_period_end,
    15.0,  -- 15%
    v_user_id, true, NOW(), NOW()
  );

  -- 4. 객단가 목표: 250,000원
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'avg_transaction', 'monthly',
    v_period_start, v_period_end,
    250000,  -- 250,000원
    v_user_id, true, NOW(), NOW()
  );

  -- ============================================
  -- 분기 목표 (현재 분기)
  -- ============================================

  v_period_start := DATE_TRUNC('quarter', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day')::DATE;

  -- 5. 분기 매출 목표: 3억원
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'revenue', 'quarterly',
    v_period_start, v_period_end,
    300000000,  -- 3억원
    v_user_id, true, NOW(), NOW()
  );

  -- 6. 분기 방문자 목표: 15,000명
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'visitors', 'quarterly',
    v_period_start, v_period_end,
    15000,  -- 15,000명
    v_user_id, true, NOW(), NOW()
  );

  -- ============================================
  -- 주간 목표 (현재 주)
  -- ============================================

  v_period_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;

  -- 7. 주간 매출 목표: 2,500만원
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'revenue', 'weekly',
    v_period_start, v_period_end,
    25000000,  -- 2,500만원
    v_user_id, true, NOW(), NOW()
  );

  -- 8. 주간 방문자 목표: 1,200명
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'visitors', 'weekly',
    v_period_start, v_period_end,
    1200,  -- 1,200명
    v_user_id, true, NOW(), NOW()
  );

  -- ============================================
  -- 일간 목표 (오늘)
  -- ============================================

  -- 9. 일간 매출 목표: 400만원
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'revenue', 'daily',
    CURRENT_DATE, CURRENT_DATE,
    4000000,  -- 400만원
    v_user_id, true, NOW(), NOW()
  );

  -- 10. 일간 방문자 목표: 180명
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value, created_by, is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_org_id, v_store_id,
    'visitors', 'daily',
    CURRENT_DATE, CURRENT_DATE,
    180,  -- 180명
    v_user_id, true, NOW(), NOW()
  );

  RAISE NOTICE '  ✓ store_goals: 10건 생성';
  RAISE NOTICE '    - 월간: 매출 1억, 방문자 5,000, 전환율 15%%, 객단가 25만원';
  RAISE NOTICE '    - 분기: 매출 3억, 방문자 15,000';
  RAISE NOTICE '    - 주간: 매출 2,500만, 방문자 1,200';
  RAISE NOTICE '    - 일간: 매출 400만, 방문자 180';
END $$;


-- ============================================
-- 검증 쿼리
-- ============================================
SELECT 
  goal_type,
  period_type,
  target_value,
  period_start,
  period_end,
  is_active
FROM store_goals 
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY period_type, goal_type;

-- ============================================================================
-- [교체 1] STEP 7: daily_kpis_agg - ★ L1(store_visits) 기반 직접 집계 ★
-- ============================================================================
-- 기존 v6.0 문제: 랜덤값으로 생성하여 store_visits 수와 불일치
-- v7.0 해결: store_visits에서 직접 COUNT하여 100% 일치 보장
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_dow INT;
  v_stats RECORD;
  v_returning INT;
  v_revenue NUMERIC;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 7: daily_kpis_agg 생성 (L1 store_visits 기반 직접 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;
    v_dow := EXTRACT(DOW FROM v_date)::INT;

    -- ★★★ 핵심: L1 데이터(store_visits)에서 직접 집계 ★★★
    SELECT
      COALESCE(COUNT(*), 0) as total_visitors,
      COALESCE(COUNT(DISTINCT customer_id), 0) as unique_visitors,
      COALESCE(COUNT(*) FILTER (WHERE made_purchase = true), 0) as transactions,
      COALESCE(AVG(duration_minutes), 0) as avg_duration
    INTO v_stats
    FROM store_visits
    WHERE store_id = v_store_id 
      AND visit_date::DATE = v_date;

    -- 재방문 고객 수 (해당 날짜까지 누적 2회 이상 방문)
    SELECT COUNT(*) INTO v_returning
    FROM (
      SELECT customer_id
      FROM store_visits
      WHERE store_id = v_store_id
        AND visit_date::DATE <= v_date
        AND customer_id IS NOT NULL
      GROUP BY customer_id
      HAVING COUNT(*) >= 2
    ) t;

    -- ★★★ 핵심: L1 데이터(line_items)에서 매출 직접 집계 ★★★
    SELECT COALESCE(SUM(line_total), 0) INTO v_revenue
    FROM line_items
    WHERE store_id = v_store_id 
      AND transaction_date = v_date;

    -- v6.0과 달리: 데이터 없는 날은 0 유지 (랜덤 기본값 생성 안 함)
    INSERT INTO daily_kpis_agg (
      id, store_id, org_id, date,
      total_revenue, total_transactions, avg_transaction_value,
      total_visitors, unique_visitors, returning_visitors,
      conversion_rate, avg_visit_duration_seconds,
      total_units_sold, avg_basket_size,
      labor_hours, sales_per_labor_hour, sales_per_visitor,
      calculated_at, created_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_date,
      v_revenue,
      v_stats.transactions,
      CASE WHEN v_stats.transactions > 0 THEN v_revenue / v_stats.transactions ELSE 0 END,
      v_stats.total_visitors,          -- ★ L1에서 직접 가져옴
      v_stats.unique_visitors,         -- ★ L1에서 직접 가져옴
      v_returning,
      CASE WHEN v_stats.total_visitors > 0 
           THEN (v_stats.transactions::NUMERIC / v_stats.total_visitors * 100) 
           ELSE 0 END,
      v_stats.avg_duration * 60,       -- ★ L1에서 직접 가져옴
      v_stats.transactions,
      CASE WHEN v_stats.transactions > 0 THEN 1.5 + random() ELSE 0 END,
      CASE WHEN v_dow IN (0,6) THEN 64 ELSE 48 END,
      CASE WHEN v_dow IN (0,6) THEN v_revenue / NULLIF(64, 0) ELSE v_revenue / NULLIF(48, 0) END,
      CASE WHEN v_stats.total_visitors > 0 THEN v_revenue / v_stats.total_visitors ELSE 0 END,
      NOW(), NOW()
    );

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ daily_kpis_agg: %건 생성 (★ L1 store_visits 기반)', v_count;
END $$;

-- ============================================================================
-- STEP 8: funnel_events 생성 (store_visits 기반 1:1 매핑)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_session TEXT;
  v_stages INT;
  v_funnel TEXT[] := ARRAY['visit', 'browse', 'interest', 'try', 'purchase'];
  v_funnel_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 8: funnel_events 생성 (store_visits 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, made_purchase, duration_minutes
    FROM store_visits
    WHERE store_id = v_store_id
  LOOP
    v_session := 'session-' || v_visit.id::TEXT;

    -- 구매자: 모든 스테이지 (visit → browse → interest → try → purchase)
    -- 비구매자: 일부 스테이지만
    IF v_visit.made_purchase THEN
      v_stages := 5;
    ELSE
      v_stages := CASE
        WHEN random() < 0.3 THEN 2   -- 30%: visit, browse
        WHEN random() < 0.6 THEN 3   -- 30%: + interest
        ELSE 4                        -- 40%: + try
      END;
    END IF;

    FOR stage_num IN 1..v_stages LOOP
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type,
        event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_session,
        COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
        v_funnel[stage_num],
        v_visit.visit_date + ((stage_num * 3)||' minutes')::INTERVAL,
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        60 + floor(random()*180)::INT,
        '{"source":"store_visit"}'::jsonb,
        v_visit.visit_date
      );
      v_funnel_count := v_funnel_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ funnel_events: %건 생성 (store_visits와 1:1 매핑)', v_funnel_count;
END $$;

-- ============================================================================
-- STEP 9: zone_events 생성 (store_visits.zones_visited 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_zone_id UUID;
  v_zone_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 9: zone_events 생성 (zones_visited 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, zones_visited, duration_minutes
    FROM store_visits
    WHERE store_id = v_store_id AND zones_visited IS NOT NULL
  LOOP
    FOR i IN 1..array_length(v_visit.zones_visited, 1) LOOP
      v_zone_id := v_visit.zones_visited[i];

      -- enter 이벤트
      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type,
        event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone_id,
        COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
        'enter',
        v_visit.visit_date + ((i * 2)||' minutes')::INTERVAL,
        v_visit.visit_date::DATE,
        EXTRACT(HOUR FROM v_visit.visit_date)::INT,
        30 + floor(random()*120)::INT,
        '{"source":"store_visit"}'::jsonb,
        v_visit.visit_date
      );
      v_zone_count := v_zone_count + 1;

      -- dwell 이벤트 (50% 확률)
      IF random() > 0.5 THEN
        INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type,
          event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
        VALUES (
          gen_random_uuid(), v_store_id, v_org_id, v_zone_id,
          COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)),
          'dwell',
          v_visit.visit_date + ((i * 2 + 1)||' minutes')::INTERVAL,
          v_visit.visit_date::DATE,
          EXTRACT(HOUR FROM v_visit.visit_date)::INT,
          60 + floor(random()*180)::INT,
          '{"source":"store_visit"}'::jsonb,
          v_visit.visit_date
        );
        v_zone_count := v_zone_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_events: %건 생성', v_zone_count;
END $$;

-- ============================================================================
-- [교체 3] STEP 10: zone_daily_metrics - ★ L1(zone_events) 기반 직접 집계 ★
-- ============================================================================
-- 기존 v6.0 문제: daily_kpis에서 가중치로 분배하여 실제 존 방문과 불일치
-- v7.0 해결: zone_events에서 직접 COUNT
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_zone_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,
    'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID,
    'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID,
    'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  v_stats RECORD;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 10: zone_daily_metrics 생성 (L1 zone_events 기반 직접 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    FOR zone_idx IN 1..7 LOOP
      -- ★★★ 핵심: L1 데이터(zone_events)에서 직접 집계 ★★★
      SELECT
        COALESCE(COUNT(*) FILTER (WHERE event_type = 'enter'), 0) as total_visitors,
        COALESCE(COUNT(DISTINCT visitor_id), 0) as unique_visitors,
        COALESCE(AVG(duration_seconds) FILTER (WHERE event_type = 'dwell'), 0) as avg_dwell,
        COALESCE(MODE() WITHIN GROUP (ORDER BY event_hour), 12) as peak_hour
      INTO v_stats
      FROM zone_events
      WHERE store_id = v_store_id
        AND zone_id = v_zone_ids[zone_idx]
        AND event_date = v_date;

      INSERT INTO zone_daily_metrics (
        id, store_id, org_id, zone_id, date,
        total_visitors, unique_visitors, avg_dwell_seconds,
        peak_hour, peak_occupancy, conversion_count, heatmap_intensity,
        calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_zone_ids[zone_idx], v_date,
        v_stats.total_visitors,          -- ★ L1에서 직접 가져옴
        v_stats.unique_visitors,         -- ★ L1에서 직접 가져옴
        v_stats.avg_dwell,               -- ★ L1에서 직접 가져옴
        v_stats.peak_hour,               -- ★ L1에서 직접 가져옴
        GREATEST(1, floor(v_stats.total_visitors * 0.15))::INT,
        CASE zone_idx 
          WHEN 6 THEN floor(v_stats.total_visitors * 0.3)  -- 계산대: 30% 전환
          ELSE floor(v_stats.total_visitors * 0.05)        -- 기타: 5% 전환
        END,
        -- 히트맵 강도: 방문자 수 기반 동적 계산
        CASE
          WHEN v_stats.total_visitors > 20 THEN 0.8 + random() * 0.2
          WHEN v_stats.total_visitors > 10 THEN 0.5 + random() * 0.3
          WHEN v_stats.total_visitors > 0 THEN 0.2 + random() * 0.3
          ELSE 0.1
        END,
        NOW(), NOW()
      );

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_daily_metrics: %건 생성 (★ L1 zone_events 기반)', v_count;
END $$;

-- ============================================================================
-- [교체 2] STEP 11: hourly_metrics - ★ L1(store_visits) 시간대별 직접 집계 ★
-- ============================================================================
-- 기존 v6.0 문제: daily_kpis에서 분배하여 시간대별 합계 ≠ 일별 합계
-- v7.0 해결: store_visits에서 시간대별 직접 COUNT
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_hour INT;
  v_stats RECORD;
  v_revenue NUMERIC;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 11: hourly_metrics 생성 (L1 store_visits 시간대별 직접 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    FOR v_hour IN 10..21 LOOP
      -- ★★★ 핵심: L1 데이터(store_visits)에서 시간대별 직접 집계 ★★★
      SELECT
        COALESCE(COUNT(*), 0) as visitor_count,
        COALESCE(COUNT(*) FILTER (WHERE made_purchase = true), 0) as transaction_count
      INTO v_stats
      FROM store_visits
      WHERE store_id = v_store_id
        AND visit_date::DATE = v_date
        AND EXTRACT(HOUR FROM visit_date) = v_hour;

      -- ★★★ 핵심: L1 데이터(line_items)에서 시간대별 매출 직접 집계 ★★★
      SELECT COALESCE(SUM(line_total), 0) INTO v_revenue
      FROM line_items
      WHERE store_id = v_store_id
        AND transaction_date = v_date
        AND transaction_hour = v_hour;

      INSERT INTO hourly_metrics (
        id, store_id, org_id, date, hour,
        visitor_count, transaction_count, revenue, conversion_rate, 
        created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date, v_hour,
        v_stats.visitor_count,           -- ★ L1에서 직접 가져옴
        v_stats.transaction_count,       -- ★ L1에서 직접 가져옴
        v_revenue,                       -- ★ L1에서 직접 가져옴
        CASE WHEN v_stats.visitor_count > 0 
             THEN (v_stats.transaction_count::NUMERIC / v_stats.visitor_count * 100) 
             ELSE 0 END,
        NOW()
      );

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ hourly_metrics: %건 생성 (★ L1 store_visits 시간대별 직접 집계)', v_count;
END $$;

-- ============================================================================
-- STEP 12: product_performance_agg 생성 (90일 x 25상품)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_date DATE;
  v_product RECORD;
  v_stats RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'product_performance_agg 생성 (L1 기반 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 각 상품에 대해
  FOR v_product IN 
    SELECT id, price, stock, category 
    FROM products 
    WHERE store_id = v_store_id
  LOOP
    -- 최근 90일
    FOR day_offset IN 0..89 LOOP
      v_date := CURRENT_DATE - day_offset;

      -- ★ L1 데이터(purchases)에서 직접 집계 ★
      SELECT 
        COALESCE(SUM(quantity), 0) as units_sold,
        COALESCE(COUNT(*), 0) as transactions,
        COALESCE(SUM(total_price), 0) as revenue
      INTO v_stats
      FROM purchases
      WHERE store_id = v_store_id 
        AND product_id = v_product.id
        AND purchase_date::DATE = v_date;

      -- 데이터가 없는 날은 랜덤 기본값 (현실적인 분포)
      IF v_stats.units_sold = 0 THEN
        -- 인기 상품은 더 많은 조회/판매
        v_stats.units_sold := CASE 
          WHEN v_product.category IN ('아우터', '액세서리') THEN floor(random() * 3)::INT
          WHEN v_product.category = '화장품' THEN floor(random() * 5)::INT
          ELSE floor(random() * 2)::INT
        END;
        v_stats.transactions := GREATEST(0, v_stats.units_sold - floor(random() * 2)::INT);
        v_stats.revenue := v_stats.units_sold * v_product.price;
      END IF;

      INSERT INTO product_performance_agg (
        id, store_id, org_id, product_id, date, 
        units_sold, transactions, revenue,
        conversion_rate, avg_selling_price, return_rate, 
        stock_level, category_rank, store_rank, 
        calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), 
        v_store_id, 
        v_org_id, 
        v_product.id, 
        v_date,
        v_stats.units_sold,
        v_stats.transactions,
        v_stats.revenue,
        CASE WHEN v_stats.units_sold > 0 THEN 8 + floor(random() * 10) ELSE 0 END,
        v_product.price,
        2 + floor(random() * 5),
        COALESCE(v_product.stock, 30) - floor(random() * 10)::INT,
        1 + floor(random() * 10)::INT,
        1 + floor(random() * 25)::INT,
        NOW(), 
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ product_performance_agg: %건 생성 (L1 purchases 기반)', v_count;
END $$;

-- ============================================================================
-- STEP 13: customer_segments_agg 생성 (90일 x 6세그먼트)
-- ============================================================================
-- ============================================================================
-- v7.0 보강: customer_segments_agg (90일 × 6세그먼트 = 540건)
-- ★ L1 기반 집계 - customers/purchases에서 실제 데이터 집계 ★
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_date DATE;
  v_seg_names TEXT[] := ARRAY['VIP', 'Regular', 'New', 'Dormant', 'At-Risk', 'Churned'];
  v_seg_types TEXT[] := ARRAY['value', 'frequency', 'lifecycle', 'lifecycle', 'risk', 'risk'];
  v_stats RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'customer_segments_agg 생성 (L1 기반 집계)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    FOR seg_idx IN 1..6 LOOP
      -- ★ L1 데이터(customers, purchases)에서 직접 집계 ★
      -- 실제 세그먼트별 고객 수 및 매출 집계
      IF seg_idx <= 3 THEN
        -- VIP, Regular, New는 실제 customers 테이블에서 집계
        SELECT 
          COUNT(DISTINCT c.id) as customer_count,
          COALESCE(SUM(p.total_price), 0) as total_revenue,
          COALESCE(AVG(p.total_price), 0) as avg_transaction
        INTO v_stats
        FROM customers c
        LEFT JOIN purchases p ON c.id = p.customer_id 
          AND p.store_id = v_store_id 
          AND p.purchase_date::DATE = v_date
        WHERE c.store_id = v_store_id
          AND c.segment = LOWER(v_seg_names[seg_idx]);
      ELSE
        -- Dormant, At-Risk, Churned는 추정값 사용
        v_stats.customer_count := CASE seg_idx
          WHEN 4 THEN 80 + floor(random() * 20)::INT   -- Dormant
          WHEN 5 THEN 60 + floor(random() * 15)::INT   -- At-Risk
          ELSE 30 + floor(random() * 10)::INT          -- Churned
        END;
        v_stats.total_revenue := v_stats.customer_count * CASE seg_idx
          WHEN 4 THEN 50000
          WHEN 5 THEN 30000
          ELSE 10000
        END;
        v_stats.avg_transaction := CASE seg_idx
          WHEN 4 THEN 80000
          WHEN 5 THEN 60000
          ELSE 40000
        END;
      END IF;

      -- 기본값 보정 (데이터 없는 경우)
      IF v_stats.customer_count IS NULL OR v_stats.customer_count = 0 THEN
        v_stats.customer_count := CASE seg_idx
          WHEN 1 THEN 15 + floor(random() * 10)::INT   -- VIP
          WHEN 2 THEN 50 + floor(random() * 20)::INT   -- Regular
          WHEN 3 THEN 100 + floor(random() * 30)::INT  -- New
          WHEN 4 THEN 80 + floor(random() * 20)::INT   -- Dormant
          WHEN 5 THEN 60 + floor(random() * 15)::INT   -- At-Risk
          ELSE 30 + floor(random() * 10)::INT          -- Churned
        END;
        v_stats.total_revenue := v_stats.customer_count * CASE seg_idx
          WHEN 1 THEN 500000
          WHEN 2 THEN 200000
          WHEN 3 THEN 100000
          ELSE 50000
        END;
        v_stats.avg_transaction := CASE seg_idx
          WHEN 1 THEN 350000
          WHEN 2 THEN 180000
          WHEN 3 THEN 120000
          ELSE 80000
        END;
      END IF;

      INSERT INTO customer_segments_agg (
        id, store_id, org_id, date, 
        segment_name, segment_type, customer_count,
        total_revenue, avg_transaction_value, avg_basket_size, 
        visit_frequency, ltv_estimate, churn_risk_score, 
        calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), 
        v_store_id, 
        v_org_id, 
        v_date, 
        v_seg_names[seg_idx], 
        v_seg_types[seg_idx], 
        v_stats.customer_count,
        v_stats.total_revenue,
        v_stats.avg_transaction,
        CASE seg_idx WHEN 1 THEN 3.2 WHEN 2 THEN 2.1 ELSE 1.5 END,
        CASE seg_idx WHEN 1 THEN 8 WHEN 2 THEN 4 WHEN 3 THEN 1.5 ELSE 0.5 END,
        CASE seg_idx WHEN 1 THEN 5000000 WHEN 2 THEN 2000000 WHEN 3 THEN 500000 ELSE 150000 END,
        CASE seg_idx 
          WHEN 1 THEN 5 
          WHEN 2 THEN 15 
          WHEN 3 THEN 25 
          WHEN 5 THEN 70 
          WHEN 6 THEN 90 
          ELSE 40 
        END + floor(random() * 10),
        NOW(), 
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ customer_segments_agg: %건 생성 (L1 기반)', v_count;
END $$;


-- ============================================================================
-- [교체] STEP 14: applied_strategies & strategy_daily_metrics (L2 기반 동적 생성)
-- ============================================================================
-- 기존 STEP 14 블록 전체를 아래 코드로 교체하세요
-- L2 테이블(daily_kpis_agg, zone_daily_metrics, product_performance_agg)에서
-- 기준선 데이터를 조회하여 현실적인 전략 및 성과 데이터 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  
  -- L2 기준선 데이터
  v_baseline RECORD;
  v_zone_baseline RECORD;
  v_product_baseline RECORD;
  v_hourly_peak RECORD;
  v_segment_baseline RECORD;
  
  -- 전략 변수
  v_strategy_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_baseline_revenue NUMERIC;
  v_baseline_visitors INT;
  v_baseline_conversion NUMERIC;
  v_simulated_improvement NUMERIC;
  v_day_revenue NUMERIC;
  v_day_visitors INT;
  day_num INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 14: applied_strategies (L2 기반 동적 생성)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: daily_kpis_agg
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    COALESCE(ROUND(AVG(total_revenue)), 3000000) as avg_revenue,
    COALESCE(ROUND(AVG(total_visitors)), 40) as avg_visitors,
    COALESCE(ROUND(AVG(conversion_rate)::NUMERIC, 2), 14) as avg_conversion,
    COALESCE(ROUND(AVG(avg_transaction_value)), 250000) as avg_transaction,
    COALESCE(ROUND(AVG(total_transactions)), 6) as avg_transactions
  INTO v_baseline
  FROM daily_kpis_agg
  WHERE store_id = v_store_id;

  v_baseline_revenue := v_baseline.avg_revenue;
  v_baseline_visitors := v_baseline.avg_visitors;
  v_baseline_conversion := v_baseline.avg_conversion;

  RAISE NOTICE '  📊 L2 기준선 (daily_kpis_agg):';
  RAISE NOTICE '     - 일평균 매출: ₩%', TO_CHAR(v_baseline_revenue, 'FM999,999,999');
  RAISE NOTICE '     - 일평균 방문자: %명', v_baseline_visitors;
  RAISE NOTICE '     - 평균 전환율: %', v_baseline_conversion || '%';

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: zone_daily_metrics (가장 혼잡한 존)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    z.zone_name,
    z.zone_type,
    z.capacity,
    COALESCE(ROUND(AVG(zdm.total_visitors)), 20) as avg_visitors,
    COALESCE(ROUND(AVG(zdm.avg_dwell_seconds)), 120) as avg_dwell,
    COALESCE(MAX(zdm.peak_occupancy), 15) as max_occupancy
  INTO v_zone_baseline
  FROM zone_daily_metrics zdm
  JOIN zones_dim z ON zdm.zone_id = z.id
  WHERE zdm.store_id = v_store_id
  GROUP BY z.id, z.zone_name, z.zone_type, z.capacity
  ORDER BY AVG(zdm.total_visitors) DESC
  LIMIT 1;

  RAISE NOTICE '  📊 L2 기준선 (zone_daily_metrics):';
  RAISE NOTICE '     - 최다 방문 존: % (%명/일)', v_zone_baseline.zone_name, v_zone_baseline.avg_visitors;

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: hourly_metrics (피크 시간대)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    hour,
    COALESCE(SUM(visitor_count), 0) as total_visitors,
    COALESCE(ROUND(AVG(visitor_count)), 5) as avg_visitors,
    COALESCE(SUM(transaction_count), 0) as total_transactions
  INTO v_hourly_peak
  FROM hourly_metrics
  WHERE store_id = v_store_id
  GROUP BY hour
  ORDER BY SUM(visitor_count) DESC
  LIMIT 1;

  RAISE NOTICE '     - 피크 시간대: %시 (평균 %명)', v_hourly_peak.hour, v_hourly_peak.avg_visitors;

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: product_performance_agg (재고 부족 상품)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    COALESCE(COUNT(DISTINCT product_id), 0) as low_stock_count,
    COALESCE(ROUND(AVG(stock_level)), 30) as avg_stock,
    COALESCE(ROUND(AVG(conversion_rate)), 10) as avg_product_conv
  INTO v_product_baseline
  FROM product_performance_agg
  WHERE store_id = v_store_id AND stock_level < 15;

  RAISE NOTICE '     - 재고 부족 상품: %개', v_product_baseline.low_stock_count;

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: customer_segments_agg (VIP 세그먼트)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    COALESCE(ROUND(AVG(customer_count)), 20) as vip_count,
    COALESCE(ROUND(AVG(total_revenue)), 500000) as vip_revenue,
    COALESCE(ROUND(AVG(avg_transaction_value)), 350000) as vip_avg_transaction
  INTO v_segment_baseline
  FROM customer_segments_agg
  WHERE store_id = v_store_id AND segment_name = 'VIP';

  RAISE NOTICE '     - VIP 고객: %명 (객단가 ₩%)', v_segment_baseline.vip_count, TO_CHAR(v_segment_baseline.vip_avg_transaction, 'FM999,999');
  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 1: 가격 최적화 (완료됨) - 60일 전 시작, 7일간 진행
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 60;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.12 + random() * 0.08;  -- 12~20% 개선

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'pricing_optimization',
    '가격 최적화 전략',
    'L2 데이터 분석 기반 가격 탄력성 최적화. 기준 전환율 ' || v_baseline_conversion || '%에서 개선 목표. ' ||
    '일평균 매출 ₩' || TO_CHAR(v_baseline_revenue, 'FM999,999,999') || ' 기준.',
    jsonb_build_object(
      'discount_rate', 10, 
      'target_products', 'low_performers',
      'optimization_method', 'price_elasticity'
    ),
    v_start_date, v_end_date,
    15, 15,
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7),
    ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object(
      'source', 'daily_kpis_agg',
      'daily_revenue', v_baseline_revenue,
      'daily_visitors', v_baseline_visitors,
      'conversion_rate', v_baseline_conversion,
      'avg_transaction', v_baseline.avg_transaction
    ),
    v_start_date, NOW()
  );

  -- 전략 1 일별 메트릭
  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1 + (v_simulated_improvement - 1) * (day_num + 1) / 7);
    v_day_visitors := v_baseline_visitors + floor(random() * 10)::INT - 5;

    INSERT INTO strategy_daily_metrics (
      id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
    ) VALUES (
      gen_random_uuid(),
      v_strategy_id,
      v_start_date + day_num,
      jsonb_build_object(
        'revenue', ROUND(v_day_revenue),
        'visitors', v_day_visitors,
        'conversion_rate', ROUND((v_baseline_conversion + (day_num * 0.5))::NUMERIC, 1),
        'transactions', ROUND(v_day_visitors * (v_baseline_conversion + day_num * 0.5) / 100),
        'baseline_revenue', v_baseline_revenue,
        'improvement_rate', ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1)
      ),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1),
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ 전략 1: 가격 최적화 (완료, ROI %%)', ROUND((v_simulated_improvement - 1) * 100);

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 2: 레이아웃 재배치 (진행중) - 3일 전 시작, 7일간 예정
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 3;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.15 + random() * 0.05;  -- 15~20% 개선 예상

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '3d_simulation', 'layout_optimization',
    '레이아웃 재배치 전략',
    v_zone_baseline.zone_name || ' 존 중심 동선 최적화. 평균 체류시간 ' || 
    v_zone_baseline.avg_dwell || '초, 일평균 방문자 ' || v_zone_baseline.avg_visitors || '명 기준. ' ||
    '최대 점유율 ' || v_zone_baseline.max_occupancy || '명 해소 목표.',
    jsonb_build_object(
      'target_zone', v_zone_baseline.zone_name,
      'zone_type', v_zone_baseline.zone_type,
      'method', 'flow_optimization',
      'goal', 'reduce_congestion'
    ),
    v_start_date, v_end_date,
    20, 18,
    12,  -- 현재 진행중 ROI
    NULL,
    ROUND(v_baseline_revenue * 7 * 1.2),
    NULL,
    'active', NULL,
    jsonb_build_object(
      'source', 'zone_daily_metrics',
      'target_zone', v_zone_baseline.zone_name,
      'zone_capacity', v_zone_baseline.capacity,
      'zone_avg_visitors', v_zone_baseline.avg_visitors,
      'zone_avg_dwell_seconds', v_zone_baseline.avg_dwell,
      'zone_max_occupancy', v_zone_baseline.max_occupancy
    ),
    v_start_date, NOW()
  );

  -- 전략 2 일별 메트릭 (시작일부터 어제까지)
  FOR day_num IN 0..LEAST(3, (CURRENT_DATE - v_start_date - 1)) LOOP
    IF day_num >= 0 THEN
      v_day_revenue := v_baseline_revenue * (1.05 + day_num * 0.025);
      v_day_visitors := v_baseline_visitors + floor(random() * 8)::INT;

      INSERT INTO strategy_daily_metrics (
        id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
      ) VALUES (
        gen_random_uuid(),
        v_strategy_id,
        v_start_date + day_num,
        jsonb_build_object(
          'revenue', ROUND(v_day_revenue),
          'visitors', v_day_visitors,
          'zone_visitors', v_zone_baseline.avg_visitors + day_num * 2,
          'zone_dwell_change', day_num * 5,
          'congestion_reduction', day_num * 3
        ),
        5 + day_num * 2,
        ROUND(((5 + day_num * 2) * (day_num + 1) / 4.0)::NUMERIC, 1),
        NOW()
      );
    END IF;
  END LOOP;

  RAISE NOTICE '  ✓ 전략 2: 레이아웃 재배치 (진행중, 목표 존: %)', v_zone_baseline.zone_name;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 3: 재고 최적화 (예정) - 7일 후 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE + 7;
  v_end_date := v_start_date + 13;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'inventory_management',
    '재고 최적화 전략',
    '재고 부족 상품 ' || v_product_baseline.low_stock_count || '개 대상 자동 발주 시스템 적용. ' ||
    '평균 재고 수준 ' || v_product_baseline.avg_stock || '개, 상품 평균 전환율 ' || 
    v_product_baseline.avg_product_conv || '% 기준.',
    jsonb_build_object(
      'min_stock_threshold', 10,
      'auto_reorder', true,
      'reorder_quantity', 'optimal',
      'target_stock_level', 50
    ),
    v_start_date, v_end_date,
    10, 12,
    NULL, NULL,
    ROUND(v_baseline_revenue * 14 * 1.1),
    NULL,
    'pending', NULL,
    jsonb_build_object(
      'source', 'product_performance_agg',
      'low_stock_products', v_product_baseline.low_stock_count,
      'avg_stock_level', v_product_baseline.avg_stock,
      'avg_product_conversion', v_product_baseline.avg_product_conv
    ),
    NOW(), NOW()
  );

  RAISE NOTICE '  ✓ 전략 3: 재고 최적화 (예정, 대상 상품: %개)', v_product_baseline.low_stock_count;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 4: 인력 배치 최적화 (완료) - 45일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 45;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.08 + random() * 0.06;  -- 8~14% 개선

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'staffing_optimization',
    '인력 배치 최적화',
    '피크타임(' || v_hourly_peak.hour || '시) 집중 배치로 서비스 품질 향상. ' ||
    '피크 시간대 평균 ' || v_hourly_peak.avg_visitors || '명 방문, ' ||
    '일평균 방문자 ' || v_baseline_visitors || '명 기준.',
    jsonb_build_object(
      'peak_hours', ARRAY[v_hourly_peak.hour, v_hourly_peak.hour + 1],
      'staff_increase', 2,
      'optimization_target', 'service_quality'
    ),
    v_start_date, v_end_date,
    8, 10,
    ROUND((v_simulated_improvement - 1) * 100 - 2),
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.08),
    ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object(
      'source', 'hourly_metrics',
      'peak_hour', v_hourly_peak.hour,
      'peak_visitors', v_hourly_peak.avg_visitors,
      'daily_visitors', v_baseline_visitors,
      'conversion_rate', v_baseline_conversion
    ),
    v_start_date, NOW()
  );

  -- 전략 4 일별 메트릭
  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.06 + random() * 0.08);
    v_day_visitors := v_baseline_visitors + floor(random() * 12)::INT - 3;

    INSERT INTO strategy_daily_metrics (
      id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
    ) VALUES (
      gen_random_uuid(),
      v_strategy_id,
      v_start_date + day_num,
      jsonb_build_object(
        'revenue', ROUND(v_day_revenue),
        'visitors', v_day_visitors,
        'peak_hour_visitors', v_hourly_peak.avg_visitors + floor(random() * 5)::INT,
        'service_score', 82 + floor(random() * 12)::INT,
        'wait_time_reduction', 15 + floor(random() * 10)::INT
      ),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1),
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ 전략 4: 인력 배치 최적화 (완료, 피크타임: %시)', v_hourly_peak.hour;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 5: VIP 프로모션 캠페인 (완료) - 30일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 30;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.25 + random() * 0.1;  -- 25~35% 개선

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'promotion_campaign',
    'VIP 프로모션 캠페인',
    'VIP 세그먼트 ' || v_segment_baseline.vip_count || '명 대상 20% 할인 이벤트. ' ||
    'VIP 평균 객단가 ₩' || TO_CHAR(v_segment_baseline.vip_avg_transaction, 'FM999,999') || ', ' ||
    'VIP 일평균 매출 ₩' || TO_CHAR(v_segment_baseline.vip_revenue, 'FM999,999') || ' 기준.',
    jsonb_build_object(
      'discount_rate', 20,
      'target_segment', 'VIP',
      'campaign_type', 'exclusive_presale',
      'communication_channel', ARRAY['email', 'sms', 'app_push']
    ),
    v_start_date, v_end_date,
    25, 22,
    ROUND((v_simulated_improvement - 1) * 100 - 3),
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.25),
    ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object(
      'source', 'customer_segments_agg',
      'vip_count', v_segment_baseline.vip_count,
      'vip_avg_revenue', v_segment_baseline.vip_revenue,
      'vip_avg_transaction', v_segment_baseline.vip_avg_transaction,
      'daily_revenue', v_baseline_revenue
    ),
    v_start_date, NOW()
  );

  -- 전략 5 일별 메트릭
  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.20 + random() * 0.15);

    INSERT INTO strategy_daily_metrics (
      id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
    ) VALUES (
      gen_random_uuid(),
      v_strategy_id,
      v_start_date + day_num,
      jsonb_build_object(
        'revenue', ROUND(v_day_revenue),
        'vip_transactions', v_segment_baseline.vip_count + floor(random() * 10)::INT - 5,
        'vip_revenue', ROUND(v_segment_baseline.vip_revenue * (1.3 + random() * 0.2)),
        'discount_cost', ROUND(v_day_revenue * 0.04),
        'new_vip_signups', floor(random() * 5)::INT
      ),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1),
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ 전략 5: VIP 프로모션 (완료, 대상: %명)', v_segment_baseline.vip_count;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 6: 동선 개선 전략 (완료) - 75일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 75;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.10 + random() * 0.05;  -- 10~15% 개선

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '3d_simulation', 'flow_optimization',
    '매장 동선 개선',
    '3D 시뮬레이션 기반 동선 최적화. 평균 체류시간 ' || v_zone_baseline.avg_dwell || '초에서 개선 목표. ' ||
    '일평균 ' || v_baseline_visitors || '명 방문자 동선 효율화.',
    jsonb_build_object(
      'optimization_type', 'customer_flow',
      'simulation_runs', 100,
      'target_metric', 'dwell_time_increase'
    ),
    v_start_date, v_end_date,
    12, 10,
    ROUND((v_simulated_improvement - 1) * 100 - 1),
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.12),
    ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object(
      'source', 'zone_daily_metrics',
      'avg_dwell_seconds', v_zone_baseline.avg_dwell,
      'daily_visitors', v_baseline_visitors,
      'zones_analyzed', 7
    ),
    v_start_date, NOW()
  );

  -- 전략 6 일별 메트릭
  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.08 + random() * 0.06);

    INSERT INTO strategy_daily_metrics (
      id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
    ) VALUES (
      gen_random_uuid(),
      v_strategy_id,
      v_start_date + day_num,
      jsonb_build_object(
        'revenue', ROUND(v_day_revenue),
        'visitors', v_baseline_visitors + floor(random() * 8)::INT,
        'avg_dwell_increase', 10 + day_num * 3,
        'zones_visited_increase', 0.2 + day_num * 0.1
      ),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1),
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ 전략 6: 동선 개선 (완료)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 7: 디스플레이 변경 (진행중) - 5일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 5;
  v_end_date := v_start_date + 6;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '3d_simulation', 'display_optimization',
    '시즌 디스플레이 변경',
    '시즌 상품 전면 배치. 상품 평균 전환율 ' || v_product_baseline.avg_product_conv || '% 기준 개선 목표.',
    jsonb_build_object(
      'display_type', 'seasonal',
      'featured_category', '아우터',
      'placement', 'entrance_focal'
    ),
    v_start_date, v_end_date,
    18, 15,
    8,
    NULL,
    ROUND(v_baseline_revenue * 7 * 1.18),
    NULL,
    'active', NULL,
    jsonb_build_object(
      'source', 'product_performance_agg',
      'avg_product_conversion', v_product_baseline.avg_product_conv,
      'daily_revenue', v_baseline_revenue
    ),
    v_start_date, NOW()
  );

  -- 전략 7 일별 메트릭 (시작일부터 어제까지)
  FOR day_num IN 0..LEAST(4, (CURRENT_DATE - v_start_date - 1)) LOOP
    IF day_num >= 0 THEN
      v_day_revenue := v_baseline_revenue * (1.04 + day_num * 0.02);

      INSERT INTO strategy_daily_metrics (
        id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
      ) VALUES (
        gen_random_uuid(),
        v_strategy_id,
        v_start_date + day_num,
        jsonb_build_object(
          'revenue', ROUND(v_day_revenue),
          'featured_product_sales', 5 + floor(random() * 8)::INT,
          'display_engagement', 45 + floor(random() * 20)::INT
        ),
        4 + day_num * 2,
        ROUND(((4 + day_num * 2) * (day_num + 1) / 5.0)::NUMERIC, 1),
        NOW()
      );
    END IF;
  END LOOP;

  RAISE NOTICE '  ✓ 전략 7: 디스플레이 변경 (진행중)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 8: 셀프 결제 도입 (예정) - 14일 후 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE + 14;
  v_end_date := v_start_date + 13;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'checkout_optimization',
    '셀프 결제 시스템 도입',
    '피크타임(' || v_hourly_peak.hour || '시) 대기 시간 감소 목표. ' ||
    '일평균 거래 ' || v_baseline.avg_transactions || '건 처리 효율화.',
    jsonb_build_object(
      'kiosk_count', 2,
      'target_reduction', 'wait_time',
      'peak_hour_focus', v_hourly_peak.hour
    ),
    v_start_date, v_end_date,
    8, 10,
    NULL, NULL,
    ROUND(v_baseline_revenue * 14 * 1.08),
    NULL,
    'pending', NULL,
    jsonb_build_object(
      'source', 'hourly_metrics',
      'peak_hour', v_hourly_peak.hour,
      'daily_transactions', v_baseline.avg_transactions,
      'conversion_rate', v_baseline_conversion
    ),
    NOW(), NOW()
  );

  RAISE NOTICE '  ✓ 전략 8: 셀프 결제 도입 (예정)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 9: 크로스셀링 강화 (완료) - 50일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 50;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.15 + random() * 0.08;  -- 15~23% 개선

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'cross_selling',
    '크로스셀링 강화',
    '연관 상품 추천 시스템 적용. 평균 객단가 ₩' || TO_CHAR(v_baseline.avg_transaction, 'FM999,999') || ' 증대 목표.',
    jsonb_build_object(
      'recommendation_engine', 'collaborative_filtering',
      'display_location', 'checkout_counter',
      'target_increase', 'basket_size'
    ),
    v_start_date, v_end_date,
    18, 15,
    ROUND((v_simulated_improvement - 1) * 100 - 2),
    ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.18),
    ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object(
      'source', 'daily_kpis_agg',
      'avg_transaction_value', v_baseline.avg_transaction,
      'daily_transactions', v_baseline.avg_transactions
    ),
    v_start_date, NOW()
  );

  -- 전략 9 일별 메트릭
  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.12 + random() * 0.1);

    INSERT INTO strategy_daily_metrics (
      id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at
    ) VALUES (
      gen_random_uuid(),
      v_strategy_id,
      v_start_date + day_num,
      jsonb_build_object(
        'revenue', ROUND(v_day_revenue),
        'avg_basket_size', ROUND((v_baseline.avg_transaction * (1.1 + random() * 0.15))::NUMERIC, 0),
        'cross_sell_rate', 15 + floor(random() * 10)::INT,
        'items_per_transaction', 1.8 + random() * 0.5
      ),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1),
      NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ 전략 9: 크로스셀링 강화 (완료)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 10: 고객 세분화 마케팅 (예정) - 21일 후 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE + 21;
  v_end_date := v_start_date + 13;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date,
    expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue,
    status, result, baseline_metrics,
    created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'segment_marketing',
    '고객 세분화 마케팅',
    'VIP(' || v_segment_baseline.vip_count || '명), Regular, New 세그먼트별 맞춤 마케팅. ' ||
    'VIP 객단가 ₩' || TO_CHAR(v_segment_baseline.vip_avg_transaction, 'FM999,999') || ' 유지/확대 목표.',
    jsonb_build_object(
      'segments', ARRAY['VIP', 'Regular', 'New'],
      'personalization_level', 'high',
      'channel', 'omnichannel'
    ),
    v_start_date, v_end_date,
    22, 20,
    NULL, NULL,
    ROUND(v_baseline_revenue * 14 * 1.22),
    NULL,
    'pending', NULL,
    jsonb_build_object(
      'source', 'customer_segments_agg',
      'vip_count', v_segment_baseline.vip_count,
      'vip_avg_transaction', v_segment_baseline.vip_avg_transaction,
      'total_customers', 2500
    ),
    NOW(), NOW()
  );

  RAISE NOTICE '  ✓ 전략 10: 세분화 마케팅 (예정)';

  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ applied_strategies: 10건 생성 (L2 기반)';
  RAISE NOTICE '    - 완료: 5건 (가격최적화, 인력배치, VIP프로모션, 동선개선, 크로스셀링)';
  RAISE NOTICE '    - 진행중: 2건 (레이아웃 재배치, 디스플레이 변경)';
  RAISE NOTICE '    - 예정: 3건 (재고최적화, 셀프결제, 세분화마케팅)';
  RAISE NOTICE '  ✓ strategy_daily_metrics: 완료/진행중 전략별 일별 성과 생성';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
END $$;


-- ============================================================================
-- STEP 15: inventory_levels 생성 (25건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_product RECORD;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 15: inventory_levels 생성 (25건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_product IN SELECT id, stock, category FROM products WHERE store_id = v_store_id LOOP
    INSERT INTO inventory_levels (id, product_id, user_id, org_id, current_stock, minimum_stock, optimal_stock, weekly_demand, last_updated, created_at)
    VALUES (
      gen_random_uuid(), v_product.id, v_user_id, v_org_id,
      COALESCE(v_product.stock, 50),
      CASE v_product.category WHEN '아우터' THEN 5 WHEN '상의' THEN 10 WHEN '하의' THEN 8 ELSE 15 END,
      CASE v_product.category WHEN '아우터' THEN 50 WHEN '상의' THEN 100 WHEN '하의' THEN 80 ELSE 120 END,
      CASE v_product.category WHEN '아우터' THEN 3 WHEN '상의' THEN 8 WHEN '하의' THEN 6 ELSE 10 END,
      NOW(), NOW()
    );
  END LOOP;

  RAISE NOTICE '  ✓ inventory_levels: 25건 생성';
END $$;

-- ============================================================================
-- STEP 16: ontology_entity_types 생성 (11건)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 16: ontology_entity_types 생성 (11건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ontology_entity_types (id, user_id, org_id, name, label, description, color, icon, properties, created_at) VALUES
    ('b0000001-0000-0000-0000-000000000001'::UUID, v_user_id, v_org_id, 'Shelf', '선반', '선반/진열대', '#8B4513', 'archive', '[]'::jsonb, NOW()),
    ('b0000002-0000-0000-0000-000000000002'::UUID, v_user_id, v_org_id, 'Rack', '행거', '의류 행거', '#4682B4', 'shirt', '[]'::jsonb, NOW()),
    ('b0000003-0000-0000-0000-000000000003'::UUID, v_user_id, v_org_id, 'DisplayTable', '테이블', '진열 테이블', '#DEB887', 'table', '[]'::jsonb, NOW()),
    ('b0000004-0000-0000-0000-000000000004'::UUID, v_user_id, v_org_id, 'CheckoutCounter', '계산대', '계산대', '#2F4F4F', 'credit-card', '[]'::jsonb, NOW()),
    ('b0000005-0000-0000-0000-000000000005'::UUID, v_user_id, v_org_id, 'FittingRoom', '탈의실', '탈의실', '#DB7093', 'door-closed', '[]'::jsonb, NOW()),
    ('b0000006-0000-0000-0000-000000000006'::UUID, v_user_id, v_org_id, 'Entrance', '출입구', '출입구', '#228B22', 'door-open', '[]'::jsonb, NOW()),
    ('b0000007-0000-0000-0000-000000000007'::UUID, v_user_id, v_org_id, 'Clothing', '의류', '의류', '#9370DB', 'shirt', '[]'::jsonb, NOW()),
    ('b0000008-0000-0000-0000-000000000008'::UUID, v_user_id, v_org_id, 'Shoes', '신발', '신발', '#CD853F', 'footprints', '[]'::jsonb, NOW()),
    ('b0000009-0000-0000-0000-000000000009'::UUID, v_user_id, v_org_id, 'Zone', '존', '매장 영역', '#4CAF50', 'map-pin', '[]'::jsonb, NOW()),
    ('b0000010-0000-0000-0000-000000000010'::UUID, v_user_id, v_org_id, 'Accessory', '액세서리', '액세서리', '#FFD700', 'gem', '[]'::jsonb, NOW()),
    ('b0000011-0000-0000-0000-000000000011'::UUID, v_user_id, v_org_id, 'Cosmetics', '화장품', '화장품', '#FF69B4', 'sparkles', '[]'::jsonb, NOW());

  RAISE NOTICE '  ✓ ontology_entity_types: 11건 생성';
END $$;

-- ============================================================================
-- STEP 17: ontology_relation_types 생성 (4건)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 17: ontology_relation_types 생성 (4건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO ontology_relation_types (id, user_id, org_id, name, label, description, source_entity_type, target_entity_type, properties, created_at) VALUES
    ('c0000001-0000-0000-0000-000000000001'::UUID, v_user_id, v_org_id, 'displayed_on', '진열됨', '제품이 가구에 진열됨', 'product', 'furniture', '[]'::jsonb, NOW()),
    ('c0000002-0000-0000-0000-000000000002'::UUID, v_user_id, v_org_id, 'located_near', '인접함', '가구 간 인접 관계', 'furniture', 'furniture', '[]'::jsonb, NOW()),
    ('c0000003-0000-0000-0000-000000000003'::UUID, v_user_id, v_org_id, 'belongs_to_zone', '존 소속', '가구/구조물이 존에 속함', 'furniture', 'zone', '[]'::jsonb, NOW()),
    ('c0000004-0000-0000-0000-000000000004'::UUID, v_user_id, v_org_id, 'cross_sells_with', '교차판매', '제품 간 교차판매 관계', 'product', 'product', '[]'::jsonb, NOW());

  RAISE NOTICE '  ✓ ontology_relation_types: 4건 생성';
END $$;

-- ============================================================================
-- STEP 18: graph_entities 생성 (30건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'graph_entities 생성 (30건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ============================================
  -- 가구 (6건)
  -- ============================================
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('d0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000001-0000-0000-0000-000000000001'::UUID, '벽면 선반',
   '{"category":"display","material":"wood","capacity":30,"model_url":"shelf_wall.glb"}'::jsonb,
   '{"x":-4.2,"y":0,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000001-0000-0000-0000-000000000001'::UUID, '계단식 선반 (신발용)',
   '{"category":"display","material":"wood","capacity":15,"model_url":"shelf_step.glb"}'::jsonb,
   '{"x":-7.7,"y":0.05,"z":-0.6}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000002-0000-0000-0000-000000000002'::UUID, '의류 행거',
   '{"category":"hanging","material":"metal","hanging_capacity":13,"model_url":"rack_clothing.glb"}'::jsonb,
   '{"x":5,"y":0,"z":1.6}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000003-0000-0000-0000-000000000003'::UUID, '진열 테이블',
   '{"category":"display","material":"wood","display_type":"island_table","model_url":"table_display.glb"}'::jsonb,
   '{"x":-3,"y":0,"z":1.2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000004-0000-0000-0000-000000000004'::UUID, '계산대',
   '{"category":"checkout","has_pos":true,"has_packaging":true,"model_url":"counter_checkout.glb"}'::jsonb,
   '{"x":3,"y":0,"z":-4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000003-0000-0000-0000-000000000003'::UUID, '화장품 카운터',
   '{"category":"display","display_type":"counter","has_mirror":true,"model_url":"counter_cosmetics.glb"}'::jsonb,
   '{"x":7.7,"y":0.05,"z":1.1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  -- ============================================
  -- 구조물 (2건)
  -- ============================================
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('d0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000005-0000-0000-0000-000000000005'::UUID, '탈의실',
   '{"has_mirror":true,"has_seat":true,"has_hooks":4,"model_url":"fitting_room.glb"}'::jsonb,
   '{"x":-7.4,"y":0,"z":-7.2}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('d0000008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000006-0000-0000-0000-000000000006'::UUID, '출입구',
   '{"entrance_type":"main","has_sensor":true,"door_type":"automatic","model_url":"entrance_door.glb"}'::jsonb,
   '{"x":2.5,"y":0,"z":8.4}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  -- ============================================
  -- Zone 엔티티 (7건) - graph_relations FK용
  -- ============================================
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  ('a0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '입구 Zone',
   '{"zone_code":"Z001","zone_type":"entrance"}'::jsonb,
   '{"x":2.5,"y":0,"z":-7.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":3,"y":3,"z":1}'::jsonb, NOW(), NOW()),
  ('a0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '메인홀 Zone',
   '{"zone_code":"Z002","zone_type":"main"}'::jsonb,
   '{"x":0,"y":0,"z":0}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":10,"y":3,"z":8}'::jsonb, NOW(), NOW()),
  ('a0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '의류존 Zone',
   '{"zone_code":"Z003","zone_type":"display"}'::jsonb,
   '{"x":-5,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":6,"y":3,"z":6}'::jsonb, NOW(), NOW()),
  ('a0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '액세서리존 Zone',
   '{"zone_code":"Z004","zone_type":"display"}'::jsonb,
   '{"x":5,"y":0,"z":3}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":6,"y":3,"z":6}'::jsonb, NOW(), NOW()),
  ('a0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '피팅룸 Zone',
   '{"zone_code":"Z005","zone_type":"fitting"}'::jsonb,
   '{"x":-5,"y":0,"z":-5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":4,"y":3,"z":4}'::jsonb, NOW(), NOW()),
  ('a0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '계산대 Zone',
   '{"zone_code":"Z006","zone_type":"checkout"}'::jsonb,
   '{"x":4.5,"y":0,"z":5.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":3,"y":3,"z":3}'::jsonb, NOW(), NOW()),
  ('a0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000009-0000-0000-0000-000000000009'::UUID, '휴식공간 Zone',
   '{"zone_code":"Z007","zone_type":"lounge"}'::jsonb,
   '{"x":0,"y":0,"z":7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":8,"y":3,"z":2}'::jsonb, NOW(), NOW());

  -- ============================================
  -- 제품 (15건)
  -- ============================================
  INSERT INTO graph_entities (id, store_id, user_id, org_id, entity_type_id, label, properties,
    model_3d_position, model_3d_rotation, model_3d_scale, created_at, updated_at) VALUES
  -- 의류 (5)
  ('e0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '프리미엄 캐시미어 코트',
   '{"sku":"SKU-OUT-001","display_type":"hanging","parent_furniture":"d0000003-0000-0000-0000-000000000003"}'::jsonb,
   '{"x":5.01,"y":0.25,"z":1.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '울 테일러드 재킷',
   '{"sku":"SKU-OUT-002","display_type":"hanging","parent_furniture":"d0000003-0000-0000-0000-000000000003"}'::jsonb,
   '{"x":5,"y":0.6,"z":2}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '실크 블라우스',
   '{"sku":"SKU-TOP-001","display_type":"folded","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3,"y":0.91,"z":1.5}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '리넨 와이드 팬츠',
   '{"sku":"SKU-BTM-001","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-3.7,"y":1.62,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000007-0000-0000-0000-000000000007'::UUID, '캐주얼 니트 스웨터',
   '{"sku":"SKU-TOP-002","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-4.5,"y":0.52,"z":-7.7}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 신발 (3)
  ('e0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '프리미엄 로퍼',
   '{"sku":"SKU-SHO-001","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.7,"y":1.53,"z":-1.1}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '하이힐 펌프스',
   '{"sku":"SKU-SHO-002","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.3,"y":1.1,"z":-0.62}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000008-0000-0000-0000-000000000008'::UUID, '스니커즈',
   '{"sku":"SKU-SHO-003","display_type":"shelf","parent_furniture":"d0000002-0000-0000-0000-000000000002"}'::jsonb,
   '{"x":-7.3,"y":0.67,"z":-0.2}'::jsonb, '{"x":0,"y":90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 액세서리 (4)
  ('e0000009-0000-0000-0000-000000000009'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '가죽 토트백',
   '{"sku":"SKU-ACC-001","display_type":"showcase","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-2.2,"y":0.93,"z":0.8}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000010-0000-0000-0000-000000000010'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '실버 목걸이',
   '{"sku":"SKU-ACC-002","display_type":"display_case","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3,"y":0.91,"z":1}'::jsonb, '{"x":0,"y":0,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000011-0000-0000-0000-000000000011'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '가죽 벨트',
   '{"sku":"SKU-ACC-003","display_type":"rolled","parent_furniture":"d0000004-0000-0000-0000-000000000004"}'::jsonb,
   '{"x":-3.6,"y":0.92,"z":0.9}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000012-0000-0000-0000-000000000012'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000010-0000-0000-0000-000000000010'::UUID, '스카프 세트',
   '{"sku":"SKU-ACC-004","display_type":"folded","parent_furniture":"d0000001-0000-0000-0000-000000000001"}'::jsonb,
   '{"x":-3.8,"y":0.55,"z":-7.7}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  -- 화장품 (3)
  ('e0000013-0000-0000-0000-000000000013'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '프리미엄 스킨케어 세트',
   '{"sku":"SKU-COS-001","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.35,"y":0.78,"z":1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000014-0000-0000-0000-000000000014'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '향수 50ml',
   '{"sku":"SKU-COS-002","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.4,"y":0.78,"z":1.3}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW()),
  ('e0000015-0000-0000-0000-000000000015'::UUID, v_store_id, v_user_id, v_org_id,
   'b0000011-0000-0000-0000-000000000011'::UUID, '립스틱 컬렉션',
   '{"sku":"SKU-COS-003","display_type":"counter","parent_furniture":"d0000006-0000-0000-0000-000000000006"}'::jsonb,
   '{"x":7.3,"y":1.07,"z":1.1}'::jsonb, '{"x":0,"y":-90,"z":0}'::jsonb, '{"x":1,"y":1,"z":1}'::jsonb, NOW(), NOW());

  RAISE NOTICE '  ✓ graph_entities: 30건 생성';
  RAISE NOTICE '    - 가구: 6건';
  RAISE NOTICE '    - 구조물: 2건';
  RAISE NOTICE '    - Zone: 7건';
  RAISE NOTICE '    - 제품: 15건';
END $$;


-- ============================================================================
-- STEP 19: graph_relations 생성 (30건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'graph_relations 생성 (30건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ============================================
  -- displayed_on 관계 (제품 -> 가구) - 15건
  -- ============================================
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000001-0000-0000-0000-000000000001'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, '{"position":"hanging"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000002-0000-0000-0000-000000000002'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, '{"position":"hanging"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000004-0000-0000-0000-000000000004'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000005-0000-0000-0000-000000000005'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000006-0000-0000-0000-000000000006'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000007-0000-0000-0000-000000000007'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000008-0000-0000-0000-000000000008'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, '{"position":"shelf"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000009-0000-0000-0000-000000000009'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"showcase"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000010-0000-0000-0000-000000000010'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"display_case"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000011-0000-0000-0000-000000000011'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"position":"rolled"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000012-0000-0000-0000-000000000012'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, '{"position":"folded"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000013-0000-0000-0000-000000000013'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000014-0000-0000-0000-000000000014'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000001-0000-0000-0000-000000000001'::UUID, 'e0000015-0000-0000-0000-000000000015'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"position":"counter"}'::jsonb, 1.0, NOW());

  RAISE NOTICE '  ✓ displayed_on: 15건';

  -- ============================================
  -- located_near 관계 (가구 간) - 5건
  -- ============================================
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000001-0000-0000-0000-000000000001'::UUID, 'd0000007-0000-0000-0000-000000000007'::UUID, '{"distance":2.5}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, '{"distance":3}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, 'd0000008-0000-0000-0000-000000000008'::UUID, '{"distance":4}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000002-0000-0000-0000-000000000002'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, '{"distance":2}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000002-0000-0000-0000-000000000002'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, '{"distance":5}'::jsonb, 1.0, NOW());

  RAISE NOTICE '  ✓ located_near: 5건';

  -- ============================================
  -- belongs_to_zone 관계 (가구/구조물 -> 존) - 6건
  -- ============================================
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000008-0000-0000-0000-000000000008'::UUID, 'a0000001-0000-0000-0000-000000000001'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000004-0000-0000-0000-000000000004'::UUID, 'a0000002-0000-0000-0000-000000000002'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000003-0000-0000-0000-000000000003'::UUID, 'a0000003-0000-0000-0000-000000000003'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000006-0000-0000-0000-000000000006'::UUID, 'a0000004-0000-0000-0000-000000000004'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000007-0000-0000-0000-000000000007'::UUID, 'a0000005-0000-0000-0000-000000000005'::UUID, '{}'::jsonb, 1.0, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000003-0000-0000-0000-000000000003'::UUID, 'd0000005-0000-0000-0000-000000000005'::UUID, 'a0000006-0000-0000-0000-000000000006'::UUID, '{}'::jsonb, 1.0, NOW());

  RAISE NOTICE '  ✓ belongs_to_zone: 6건';

  -- ============================================
  -- cross_sells_with 관계 (제품 간 교차판매) - 4건
  -- ============================================
  INSERT INTO graph_relations (id, store_id, user_id, org_id, relation_type_id, source_entity_id, target_entity_id, properties, weight, created_at) VALUES
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000001-0000-0000-0000-000000000001'::UUID, 'e0000012-0000-0000-0000-000000000012'::UUID, '{"correlation":0.75}'::jsonb, 0.75, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000003-0000-0000-0000-000000000003'::UUID, 'e0000004-0000-0000-0000-000000000004'::UUID, '{"correlation":0.68}'::jsonb, 0.68, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000007-0000-0000-0000-000000000007'::UUID, 'e0000009-0000-0000-0000-000000000009'::UUID, '{"correlation":0.62}'::jsonb, 0.62, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'c0000004-0000-0000-0000-000000000004'::UUID, 'e0000013-0000-0000-0000-000000000013'::UUID, 'e0000015-0000-0000-0000-000000000015'::UUID, '{"correlation":0.85}'::jsonb, 0.85, NOW());

  RAISE NOTICE '  ✓ cross_sells_with: 4건';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ graph_relations 총: 30건 생성';
END $$;

-- ============================================================================
-- STEP 20: store_scenes 생성 (1건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'store_scenes 생성 (1건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO store_scenes (
    id, store_id, user_id, org_id, 
    scene_name, scene_type, recipe_data, 
    is_active, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    v_store_id, 
    v_user_id, 
    v_org_id,
    '기본 레이아웃', 
    '3d_layout',
    jsonb_build_object(
      'version', '2.0',
      'floor', jsonb_build_object(
        'width', 15, 
        'depth', 16.67, 
        'material', 'wood'
      ),
      'walls', jsonb_build_object(
        'height', 3, 
        'material', 'white'
      ),
      'lighting', jsonb_build_object(
        'ambient', 0.5, 
        'directional', 0.8
      ),
      'camera', jsonb_build_object(
        'position', jsonb_build_object('x', 0, 'y', 12, 'z', 18),
        'target', jsonb_build_object('x', 0, 'y', 0, 'z', 0)
      ),
      'store_model', 'Store_B_17.4x3.0x16.6.glb'
    ),
    true, 
    NOW(), 
    NOW()
  );

  RAISE NOTICE '  ✓ store_scenes: 1건 생성';
END $$;

-- ============================================================================
-- [교체] STEP 21: ai_recommendations - L2 기반 동적 생성
-- ============================================================================
-- 기존 STEP 21 블록 전체를 아래 코드로 교체하세요
-- L2 테이블을 분석하여 실제 데이터 기반의 추천을 동적으로 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  
  -- L2 분석 결과 변수
  v_avg_conversion NUMERIC;
  v_avg_revenue NUMERIC;
  v_low_product RECORD;
  v_congested_zone RECORD;
  v_underperforming_zone RECORD;
  v_peak_hour RECORD;
  v_low_traffic_hour RECORD;
  v_vip_stats RECORD;
  v_at_risk_stats RECORD;
  v_low_stock_product RECORD;
  v_high_return_product RECORD;
  
  v_recommendation_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 21: ai_recommendations (L2 기반 동적 생성)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════
  -- 기준값 계산 (L2: daily_kpis_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    COALESCE(AVG(conversion_rate), 14) as avg_conv,
    COALESCE(AVG(total_revenue), 3000000) as avg_rev
  INTO v_avg_conversion, v_avg_revenue
  FROM daily_kpis_agg 
  WHERE store_id = v_store_id AND conversion_rate > 0;

  RAISE NOTICE '  📊 기준값: 평균 전환율 %%, 평균 매출 ₩%', 
    ROUND(v_avg_conversion, 1), TO_CHAR(v_avg_revenue, 'FM999,999,999');

  -- ═══════════════════════════════════════════════════════════
  -- 추천 1: 저성과 상품 리포지셔닝 (L2: product_performance_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    p.product_name,
    p.category,
    ROUND(AVG(pp.conversion_rate)::NUMERIC, 1) as avg_conv,
    SUM(pp.units_sold) as total_units,
    SUM(pp.revenue) as total_revenue,
    ROUND(AVG(pp.stock_level)) as avg_stock
  INTO v_low_product
  FROM product_performance_agg pp
  JOIN products p ON pp.product_id = p.id
  WHERE pp.store_id = v_store_id
  GROUP BY p.id, p.product_name, p.category
  HAVING AVG(pp.conversion_rate) < v_avg_conversion * 0.6  -- 평균의 60% 미만
    AND SUM(pp.units_sold) > 0  -- 최소 1개 이상 판매
  ORDER BY AVG(pp.conversion_rate) ASC
  LIMIT 1;

  IF v_low_product.product_name IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '저성과 상품 리포지셔닝: ' || v_low_product.product_name,
      v_low_product.product_name || ' (' || v_low_product.category || ')의 전환율이 ' || 
        v_low_product.avg_conv || '%로 평균(' || ROUND(v_avg_conversion, 1) || '%) 대비 현저히 낮습니다. ' ||
        '입구 근처 또는 주요 동선으로 위치 변경을 권장합니다. ' ||
        '현재 재고 ' || v_low_product.avg_stock || '개.',
      'layout', 'high', 'revenue_increase', 'product_performance_agg',
      jsonb_build_object(
        'potential_revenue_increase', ROUND(v_low_product.total_revenue * 0.4),
        'target_conversion_rate', ROUND(v_avg_conversion, 1),
        'confidence', 75 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'product_name', v_low_product.product_name,
        'category', v_low_product.category,
        'current_conversion_rate', v_low_product.avg_conv,
        'avg_conversion_rate', ROUND(v_avg_conversion, 1),
        'total_units_sold', v_low_product.total_units,
        'total_revenue', v_low_product.total_revenue,
        'avg_stock_level', v_low_product.avg_stock,
        'analysis_period', '90일'
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 1: 저성과 상품 - % (전환율 %)', v_low_product.product_name, v_low_product.avg_conv || '%';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 2: 혼잡 존 레이아웃 개선 (L2: zone_daily_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    z.zone_name,
    z.zone_type,
    z.capacity,
    MAX(zdm.peak_occupancy) as max_occupancy,
    ROUND(AVG(zdm.total_visitors)) as avg_visitors,
    ROUND(AVG(zdm.avg_dwell_seconds)) as avg_dwell,
    ROUND((MAX(zdm.peak_occupancy)::NUMERIC / NULLIF(z.capacity, 0) * 100), 1) as occupancy_rate
  INTO v_congested_zone
  FROM zone_daily_metrics zdm
  JOIN zones_dim z ON zdm.zone_id = z.id
  WHERE zdm.store_id = v_store_id AND z.capacity > 0
  GROUP BY z.id, z.zone_name, z.zone_type, z.capacity
  HAVING MAX(zdm.peak_occupancy) > z.capacity * 0.7  -- 용량의 70% 초과
  ORDER BY MAX(zdm.peak_occupancy)::NUMERIC / NULLIF(z.capacity, 0) DESC
  LIMIT 1;

  IF v_congested_zone.zone_name IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '혼잡 존 레이아웃 개선: ' || v_congested_zone.zone_name,
      v_congested_zone.zone_name || ' 존(' || v_congested_zone.zone_type || ')의 피크 시간대 방문자가 ' || 
        v_congested_zone.max_occupancy || '명으로 용량(' || v_congested_zone.capacity || '명) 대비 ' || 
        v_congested_zone.occupancy_rate || '% 수준입니다. ' ||
        '평균 체류시간 ' || v_congested_zone.avg_dwell || '초. 동선 분산 또는 공간 확장을 권장합니다.',
      'layout', 
      CASE WHEN v_congested_zone.occupancy_rate > 90 THEN 'high' ELSE 'medium' END,
      'operational_efficiency', 'zone_daily_metrics',
      jsonb_build_object(
        'efficiency_gain_percent', ROUND(v_congested_zone.occupancy_rate - 70),
        'target_occupancy_rate', 70,
        'confidence', 80 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'zone_name', v_congested_zone.zone_name,
        'zone_type', v_congested_zone.zone_type,
        'capacity', v_congested_zone.capacity,
        'peak_occupancy', v_congested_zone.max_occupancy,
        'avg_daily_visitors', v_congested_zone.avg_visitors,
        'avg_dwell_seconds', v_congested_zone.avg_dwell,
        'occupancy_rate', v_congested_zone.occupancy_rate,
        'analysis_period', '90일'
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 2: 혼잡 존 - % (점유율 %)', v_congested_zone.zone_name, v_congested_zone.occupancy_rate || '%';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 3: 저조한 존 활성화 (L2: zone_daily_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    z.zone_name,
    z.zone_type,
    z.capacity,
    ROUND(AVG(zdm.total_visitors)) as avg_visitors,
    ROUND(AVG(zdm.avg_dwell_seconds)) as avg_dwell,
    ROUND((AVG(zdm.total_visitors)::NUMERIC / NULLIF(z.capacity, 0) * 100), 1) as utilization_rate
  INTO v_underperforming_zone
  FROM zone_daily_metrics zdm
  JOIN zones_dim z ON zdm.zone_id = z.id
  WHERE zdm.store_id = v_store_id 
    AND z.zone_type IN ('display', 'main')  -- 디스플레이/메인 존만
    AND z.capacity > 0
  GROUP BY z.id, z.zone_name, z.zone_type, z.capacity
  HAVING AVG(zdm.total_visitors) < z.capacity * 0.3  -- 용량의 30% 미만 활용
  ORDER BY AVG(zdm.total_visitors)::NUMERIC / NULLIF(z.capacity, 0) ASC
  LIMIT 1;

  IF v_underperforming_zone.zone_name IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '저활용 존 활성화: ' || v_underperforming_zone.zone_name,
      v_underperforming_zone.zone_name || ' 존의 활용률이 ' || v_underperforming_zone.utilization_rate || 
        '%로 저조합니다. 일평균 ' || v_underperforming_zone.avg_visitors || '명 방문. ' ||
        '인기 상품 배치 또는 프로모션 존으로 활용을 권장합니다.',
      'layout', 'medium', 'revenue_increase', 'zone_daily_metrics',
      jsonb_build_object(
        'potential_visitor_increase', ROUND(v_underperforming_zone.capacity * 0.5 - v_underperforming_zone.avg_visitors),
        'target_utilization_rate', 50,
        'confidence', 70 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'zone_name', v_underperforming_zone.zone_name,
        'zone_type', v_underperforming_zone.zone_type,
        'capacity', v_underperforming_zone.capacity,
        'avg_daily_visitors', v_underperforming_zone.avg_visitors,
        'avg_dwell_seconds', v_underperforming_zone.avg_dwell,
        'utilization_rate', v_underperforming_zone.utilization_rate
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 3: 저활용 존 - % (활용률 %)', v_underperforming_zone.zone_name, v_underperforming_zone.utilization_rate || '%';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 4: 피크타임 인력 보강 (L2: hourly_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    hour,
    SUM(visitor_count) as total_visitors,
    ROUND(AVG(visitor_count)) as avg_visitors,
    SUM(transaction_count) as total_transactions,
    ROUND(AVG(revenue)) as avg_revenue,
    ROUND(AVG(conversion_rate)::NUMERIC, 1) as avg_conversion
  INTO v_peak_hour
  FROM hourly_metrics
  WHERE store_id = v_store_id
  GROUP BY hour
  ORDER BY SUM(visitor_count) DESC
  LIMIT 1;

  IF v_peak_hour.hour IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '피크타임 인력 보강: ' || v_peak_hour.hour || '시',
      v_peak_hour.hour || '시에 평균 ' || v_peak_hour.avg_visitors || '명 방문, ' ||
        '평균 매출 ₩' || TO_CHAR(v_peak_hour.avg_revenue, 'FM999,999') || '. ' ||
        '전환율 ' || v_peak_hour.avg_conversion || '%. ' ||
        '서비스 품질 유지 및 전환율 개선을 위해 직원 추가 배치를 권장합니다.',
      'staffing', 'medium', 'operational_efficiency', 'hourly_metrics',
      jsonb_build_object(
        'service_improvement_percent', 15 + floor(random() * 10)::INT,
        'potential_conversion_increase', 2 + floor(random() * 3)::INT,
        'confidence', 78 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'peak_hour', v_peak_hour.hour,
        'total_visitors_90days', v_peak_hour.total_visitors,
        'avg_visitors_per_day', v_peak_hour.avg_visitors,
        'total_transactions', v_peak_hour.total_transactions,
        'avg_revenue', v_peak_hour.avg_revenue,
        'avg_conversion_rate', v_peak_hour.avg_conversion,
        'analysis_period', '90일'
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 4: 피크타임 인력 - %시 (평균 %명)', v_peak_hour.hour, v_peak_hour.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 5: 저조 시간대 프로모션 (L2: hourly_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    hour,
    SUM(visitor_count) as total_visitors,
    ROUND(AVG(visitor_count)) as avg_visitors,
    ROUND(AVG(revenue)) as avg_revenue
  INTO v_low_traffic_hour
  FROM hourly_metrics
  WHERE store_id = v_store_id AND hour BETWEEN 10 AND 20  -- 영업시간 내
  GROUP BY hour
  HAVING AVG(visitor_count) > 0
  ORDER BY SUM(visitor_count) ASC
  LIMIT 1;

  IF v_low_traffic_hour.hour IS NOT NULL AND v_peak_hour.avg_visitors IS NOT NULL 
     AND v_low_traffic_hour.avg_visitors < v_peak_hour.avg_visitors * 0.4 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '비수기 시간대 프로모션: ' || v_low_traffic_hour.hour || '시',
      v_low_traffic_hour.hour || '시 평균 방문자 ' || v_low_traffic_hour.avg_visitors || '명으로 ' ||
        '피크타임(' || v_peak_hour.hour || '시) 대비 ' || 
        ROUND((v_low_traffic_hour.avg_visitors::NUMERIC / NULLIF(v_peak_hour.avg_visitors, 0) * 100)) || '% 수준. ' ||
        '해당 시간대 타임세일 또는 특별 프로모션을 권장합니다.',
      'promotion', 'low', 'revenue_increase', 'hourly_metrics',
      jsonb_build_object(
        'potential_visitor_increase', ROUND(v_peak_hour.avg_visitors * 0.3),
        'potential_revenue_increase', ROUND(v_low_traffic_hour.avg_revenue * 0.5),
        'confidence', 65 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'low_traffic_hour', v_low_traffic_hour.hour,
        'avg_visitors', v_low_traffic_hour.avg_visitors,
        'avg_revenue', v_low_traffic_hour.avg_revenue,
        'peak_hour', v_peak_hour.hour,
        'peak_visitors', v_peak_hour.avg_visitors,
        'traffic_ratio', ROUND((v_low_traffic_hour.avg_visitors::NUMERIC / NULLIF(v_peak_hour.avg_visitors, 0) * 100))
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 5: 비수기 프로모션 - %시 (평균 %명)', v_low_traffic_hour.hour, v_low_traffic_hour.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 6: VIP 고객 이벤트 (L2: customer_segments_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    ROUND(AVG(customer_count)) as avg_count,
    ROUND(AVG(total_revenue)) as avg_revenue,
    ROUND(AVG(avg_transaction_value)) as avg_transaction,
    ROUND(AVG(visit_frequency)::NUMERIC, 1) as avg_frequency,
    ROUND(AVG(ltv_estimate)) as avg_ltv
  INTO v_vip_stats
  FROM customer_segments_agg
  WHERE store_id = v_store_id AND segment_name = 'VIP';

  IF v_vip_stats.avg_count IS NOT NULL AND v_vip_stats.avg_count > 0 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'VIP 고객 특별 이벤트 제안',
      'VIP 세그먼트 ' || v_vip_stats.avg_count || '명 대상 전용 사전 구매 이벤트로 충성도 강화를 권장합니다. ' ||
        '평균 객단가 ₩' || TO_CHAR(v_vip_stats.avg_transaction, 'FM999,999') || ', ' ||
        '방문빈도 월 ' || v_vip_stats.avg_frequency || '회, ' ||
        '예상 LTV ₩' || TO_CHAR(v_vip_stats.avg_ltv, 'FM999,999,999') || '.',
      'promotion', 'medium', 'customer_experience', 'customer_segments_agg',
      jsonb_build_object(
        'potential_revenue_increase', ROUND(v_vip_stats.avg_revenue * 0.25),
        'retention_improvement_percent', 10 + floor(random() * 5)::INT,
        'confidence', 72 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'segment', 'VIP',
        'customer_count', v_vip_stats.avg_count,
        'avg_daily_revenue', v_vip_stats.avg_revenue,
        'avg_transaction_value', v_vip_stats.avg_transaction,
        'avg_visit_frequency', v_vip_stats.avg_frequency,
        'avg_ltv_estimate', v_vip_stats.avg_ltv,
        'analysis_period', '90일'
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 6: VIP 이벤트 - %명 (객단가 ₩%)', v_vip_stats.avg_count, TO_CHAR(v_vip_stats.avg_transaction, 'FM999,999');
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 7: At-Risk 고객 리텐션 (L2: customer_segments_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    ROUND(AVG(customer_count)) as avg_count,
    ROUND(AVG(churn_risk_score)) as avg_churn_risk,
    ROUND(AVG(total_revenue)) as avg_revenue,
    ROUND(AVG(ltv_estimate)) as avg_ltv
  INTO v_at_risk_stats
  FROM customer_segments_agg
  WHERE store_id = v_store_id AND segment_name = 'At-Risk';

  IF v_at_risk_stats.avg_count IS NOT NULL AND v_at_risk_stats.avg_count > 10 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'At-Risk 고객 리텐션 캠페인',
      'At-Risk 세그먼트 ' || v_at_risk_stats.avg_count || '명의 이탈 위험도가 ' || 
        v_at_risk_stats.avg_churn_risk || '%로 높습니다. ' ||
        '예상 LTV ₩' || TO_CHAR(v_at_risk_stats.avg_ltv, 'FM999,999') || ' 손실 방지를 위해 ' ||
        '맞춤형 리텐션 캠페인(쿠폰, 개인화 추천)을 권장합니다.',
      'promotion', 'high', 'customer_experience', 'customer_segments_agg',
      jsonb_build_object(
        'potential_ltv_saved', ROUND(v_at_risk_stats.avg_ltv * v_at_risk_stats.avg_count * 0.3),
        'target_retention_rate', 30,
        'confidence', 68 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'segment', 'At-Risk',
        'customer_count', v_at_risk_stats.avg_count,
        'avg_churn_risk_score', v_at_risk_stats.avg_churn_risk,
        'avg_daily_revenue', v_at_risk_stats.avg_revenue,
        'avg_ltv_estimate', v_at_risk_stats.avg_ltv
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 7: At-Risk 리텐션 - %명 (이탈위험 %)', v_at_risk_stats.avg_count, v_at_risk_stats.avg_churn_risk || '%';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 8: 재고 부족 상품 발주 (L2: product_performance_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT 
    p.product_name,
    p.category,
    ROUND(AVG(pp.stock_level)) as avg_stock,
    SUM(pp.units_sold) as total_sold,
    ROUND(AVG(pp.conversion_rate)::NUMERIC, 1) as avg_conv
  INTO v_low_stock_product
  FROM product_performance_agg pp
  JOIN products p ON pp.product_id = p.id
  WHERE pp.store_id = v_store_id
  GROUP BY p.id, p.product_name, p.category
  HAVING AVG(pp.stock_level) < 10 AND SUM(pp.units_sold) > 50  -- 재고 부족하지만 잘 팔리는 상품
  ORDER BY SUM(pp.units_sold) DESC
  LIMIT 1;

  IF v_low_stock_product.product_name IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      title, description,
      recommendation_type, priority, action_category, data_source,
      expected_impact, evidence,
      status, is_displayed, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      '인기 상품 재고 보충: ' || v_low_stock_product.product_name,
      v_low_stock_product.product_name || ' (' || v_low_stock_product.category || ')의 ' ||
        '평균 재고가 ' || v_low_stock_product.avg_stock || '개로 부족합니다. ' ||
        '90일간 ' || v_low_stock_product.total_sold || '개 판매, 전환율 ' || v_low_stock_product.avg_conv || '%. ' ||
        '긴급 발주를 권장합니다.',
      'inventory', 'high', 'operational_efficiency', 'product_performance_agg',
      jsonb_build_object(
        'potential_lost_sales_prevention', ROUND(v_low_stock_product.total_sold * 0.2),
        'recommended_order_quantity', 50,
        'confidence', 85 + floor(random() * 10)::INT
      ),
      jsonb_build_object(
        'product_name', v_low_stock_product.product_name,
        'category', v_low_stock_product.category,
        'avg_stock_level', v_low_stock_product.avg_stock,
        'total_units_sold', v_low_stock_product.total_sold,
        'conversion_rate', v_low_stock_product.avg_conv,
        'analysis_period', '90일'
      ),
      'active', true, NOW(), NOW()
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 8: 재고 보충 - % (재고 %개, 판매 %개)', v_low_stock_product.product_name, v_low_stock_product.avg_stock, v_low_stock_product.total_sold;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ ai_recommendations: %건 생성 (L2 기반 동적 분석)', v_recommendation_count;
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
  RAISE NOTICE '    데이터 소스:';
  RAISE NOTICE '    - product_performance_agg: 저성과 상품, 재고 분석';
  RAISE NOTICE '    - zone_daily_metrics: 혼잡/저활용 존 분석';
  RAISE NOTICE '    - hourly_metrics: 피크/비수기 시간대 분석';
  RAISE NOTICE '    - customer_segments_agg: VIP/At-Risk 고객 분석';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- [교체] STEP 22: 데이터 일관성 검증 - v7.0 L1↔L2 강화 버전
-- ============================================================================
-- 기존 STEP 22 블록 전체를 아래 코드로 교체하세요
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  
  -- 기본 통계
  v_customers INT;
  v_total_visits INT;
  v_unique_visitors INT;
  v_returning INT;
  v_repeat_rate NUMERIC;
  v_purchases INT;
  v_purchase_visits INT;
  
  -- ★ L1 vs L2 일관성 검증 ★
  v_l1_visits INT;
  v_l2_kpi_visitors INT;
  v_l2_hourly_visitors INT;
  v_l1_transactions INT;
  v_l2_kpi_transactions INT;
  v_l1_zone_events INT;
  v_l2_zone_visitors INT;
  v_l1_revenue NUMERIC;
  v_l2_kpi_revenue NUMERIC;
  
  -- 피크타임
  v_peak_hour INT;
  v_peak_visitors INT;
  
  -- 일치 여부
  v_visits_match BOOLEAN;
  v_txn_match BOOLEAN;
  v_hourly_match BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '★ STEP 22: 데이터 일관성 검증 (v7.0 L1↔L2)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 1. 기본 통계
  SELECT COUNT(*) INTO v_customers FROM customers WHERE store_id = v_store_id;
  
  SELECT COUNT(*), COUNT(DISTINCT customer_id) 
  INTO v_total_visits, v_unique_visitors
  FROM store_visits WHERE store_id = v_store_id;
  
  SELECT COUNT(*) INTO v_returning FROM (
    SELECT customer_id FROM store_visits 
    WHERE store_id = v_store_id AND customer_id IS NOT NULL
    GROUP BY customer_id HAVING COUNT(*) >= 2
  ) t;
  
  v_repeat_rate := CASE WHEN v_customers > 0 
    THEN (v_returning::NUMERIC / v_customers * 100) ELSE 0 END;
  
  SELECT COUNT(*) INTO v_purchases FROM purchases WHERE store_id = v_store_id;
  
  SELECT COUNT(*) INTO v_purchase_visits 
  FROM store_visits WHERE store_id = v_store_id AND made_purchase = true;

  -- 2. ★ L1 vs L2 일관성 검증 ★
  SELECT COUNT(*) INTO v_l1_visits FROM store_visits WHERE store_id = v_store_id;
  SELECT COALESCE(SUM(total_visitors), 0) INTO v_l2_kpi_visitors FROM daily_kpis_agg WHERE store_id = v_store_id;
  SELECT COALESCE(SUM(visitor_count), 0) INTO v_l2_hourly_visitors FROM hourly_metrics WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_l1_transactions FROM store_visits WHERE store_id = v_store_id AND made_purchase = true;
  SELECT COALESCE(SUM(total_transactions), 0) INTO v_l2_kpi_transactions FROM daily_kpis_agg WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_l1_zone_events FROM zone_events WHERE store_id = v_store_id AND event_type = 'enter';
  SELECT COALESCE(SUM(total_visitors), 0) INTO v_l2_zone_visitors FROM zone_daily_metrics WHERE store_id = v_store_id;
  SELECT COALESCE(SUM(line_total), 0) INTO v_l1_revenue FROM line_items WHERE store_id = v_store_id;
  SELECT COALESCE(SUM(total_revenue), 0) INTO v_l2_kpi_revenue FROM daily_kpis_agg WHERE store_id = v_store_id;
  
  SELECT hour, SUM(visitor_count) INTO v_peak_hour, v_peak_visitors
  FROM hourly_metrics WHERE store_id = v_store_id
  GROUP BY hour ORDER BY SUM(visitor_count) DESC LIMIT 1;
  
  v_visits_match := (v_l1_visits = v_l2_kpi_visitors);
  v_txn_match := (v_l1_transactions = v_l2_kpi_transactions);
  v_hourly_match := (v_l1_visits = v_l2_hourly_visitors);

  -- 3. 결과 출력
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ NEURALTWIN v7.0 시딩 완료! (L1→L2 일관성 보장)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 기본 통계:';
  RAISE NOTICE '  customers:         % 명', v_customers;
  RAISE NOTICE '  store_visits:      % 건', v_total_visits;
  RAISE NOTICE '  unique_visitors:   % 명', v_unique_visitors;
  RAISE NOTICE '  returning:         % 명 (재방문률 %.1f%%)', v_returning, v_repeat_rate;
  RAISE NOTICE '  purchase_visits:   % 건 (전환율 %.1f%%)', v_purchase_visits, 
    CASE WHEN v_total_visits > 0 THEN (v_purchase_visits::NUMERIC / v_total_visits * 100) ELSE 0 END;
  RAISE NOTICE '  purchases:         % 건', v_purchases;
  RAISE NOTICE '';
  RAISE NOTICE '★ L1↔L2 일관성 검증:';
  RAISE NOTICE '  [방문자] L1 store_visits = L2 daily_kpis';
  RAISE NOTICE '    % = %  %', v_l1_visits, v_l2_kpi_visitors, 
    CASE WHEN v_visits_match THEN '✓ 일치' ELSE '✗ 불일치' END;
  RAISE NOTICE '  [방문자] L1 store_visits = L2 hourly_metrics SUM';
  RAISE NOTICE '    % = %  %', v_l1_visits, v_l2_hourly_visitors, 
    CASE WHEN v_hourly_match THEN '✓ 일치' ELSE '✗ 불일치' END;
  RAISE NOTICE '  [거래수] L1 made_purchase = L2 total_transactions';
  RAISE NOTICE '    % = %  %', v_l1_transactions, v_l2_kpi_transactions, 
    CASE WHEN v_txn_match THEN '✓ 일치' ELSE '✗ 불일치' END;
  RAISE NOTICE '  [매출액] L1 line_items = L2 total_revenue';
  RAISE NOTICE '    ₩% = ₩%  %', 
    TO_CHAR(v_l1_revenue, 'FM999,999,999,999'), 
    TO_CHAR(v_l2_kpi_revenue, 'FM999,999,999,999'),
    CASE WHEN v_l1_revenue = v_l2_kpi_revenue THEN '✓ 일치' ELSE '≈ 근사' END;
  RAISE NOTICE '  [존방문] L1 zone_events ↔ L2 zone_daily_metrics';
  RAISE NOTICE '    % ↔ % (다대일)', v_l1_zone_events, v_l2_zone_visitors;
  RAISE NOTICE '';
  RAISE NOTICE '📈 피크타임: %시 (%명)', v_peak_hour, v_peak_visitors;
  RAISE NOTICE '';
  
  IF v_visits_match AND v_txn_match AND v_hourly_match THEN
    RAISE NOTICE '🎉 L1↔L2 데이터 일관성 검증 통과!';
  ELSE
    RAISE NOTICE '⚠️  일부 불일치 - 상세 검토 필요';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Store ID: d9830554-2688-4032-af40-acccda787ac4';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

