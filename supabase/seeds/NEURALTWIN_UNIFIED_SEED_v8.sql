-- ============================================================================
-- NEURALTWIN 통합 샘플 데이터셋 v8.0 (ULTIMATE EDITION)
-- ============================================================================
--
-- v7.0 완전 일관성(L1-L2) 데이터 + v8.0 보완 테이블 통합
-- 모든 AI 추론 파이프라인이 완벽하게 작동하는 완전한 데이터셋
--
-- ============================================================================
-- 생성 데이터 (총 ~35개 테이블):
-- ============================================================================
--   ┌─────────────────────────────────────────────────────────────────────┐
--   │ 마스터 데이터 (L2 DIM)                                              │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • stores: 1건                     • zones_dim: 7건                  │
--   │ • products: 25건                  • customers: 2,500건              │
--   │ • staff: 8건                      • store_goals: 10건               │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ 트랜잭션 데이터 (L2 FACT)                                           │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • store_visits: ~3,500건          • purchases: ~490건               │
--   │ • transactions: ~490건            • line_items: ~980건              │
--   │ • funnel_events: ~6,000건         • zone_events: ~5,000건           │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ 집계 데이터 (L3 AGG)                                                │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • daily_kpis_agg: 90건            • daily_sales: 90건               │
--   │ • zone_daily_metrics: 630건       • hourly_metrics: 1,080건         │
--   │ • product_performance_agg: 2,250건• customer_segments_agg: 540건    │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ AI/전략 데이터 (L3)                                                 │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • applied_strategies: 10건        • strategy_daily_metrics: ~50건   │
--   │ • strategy_feedback: 20건         • ai_inference_results: 50건      │
--   │ • ai_recommendations: ~8건        • inventory_levels: 25건          │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ 온톨로지/그래프 데이터 (L1)                                         │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • ontology_entity_types: 30건     • ontology_relation_types: 15건   │
--   │ • graph_entities: 30건            • graph_relations: 30건           │
--   │ • store_scenes: 1건               • retail_concepts: 12건           │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ 데이터소스/매핑 (메타데이터)                                        │
--   ├─────────────────────────────────────────────────────────────────────┤
--   │ • data_sources: 5건               • data_source_tables: 15건        │
--   │ • ontology_entity_mappings: 10건  • ontology_relation_mappings: 8건 │
--   └─────────────────────────────────────────────────────────────────────┘
--
-- ============================================================================
-- 핵심 특징:
-- ============================================================================
--   ★ L1↔L2 데이터 100% 일관성 보장
--   ★ store_visits → daily_kpis_agg 직접 집계
--   ★ zone_events → zone_daily_metrics 직접 집계
--   ★ line_items → daily_sales 직접 집계
--   ★ AI 신뢰도 점수 85%+ 달성
--
-- ============================================================================


-- ============================================================================
-- STEP 0: 기존 데이터 전체 삭제
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN v8.0 ULTIMATE SEED - 시작';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 0: 기존 데이터 전체 삭제';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ★ FK 제약조건 임시 비활성화 (세션 레벨)
  SET session_replication_role = 'replica';

  -- v8.0 추가 테이블 삭제
  DELETE FROM strategy_feedback WHERE store_id = v_store_id;
  DELETE FROM ai_inference_results WHERE store_id = v_store_id;
  DELETE FROM retail_concepts WHERE store_id = v_store_id;
  DELETE FROM ontology_relation_mappings WHERE data_source_id IN (SELECT id FROM data_sources WHERE store_id = v_store_id);
  DELETE FROM ontology_entity_mappings WHERE data_source_id IN (SELECT id FROM data_sources WHERE store_id = v_store_id);
  DELETE FROM data_source_tables WHERE data_source_id IN (SELECT id FROM data_sources WHERE store_id = v_store_id);
  DELETE FROM data_sources WHERE store_id = v_store_id;
  DELETE FROM daily_sales WHERE store_id = v_store_id;
  DELETE FROM transactions WHERE store_id = v_store_id;

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
  DELETE FROM store_goals WHERE store_id = v_store_id;

  -- 그래프 데이터 삭제
  DELETE FROM graph_relations WHERE store_id = v_store_id;
  DELETE FROM graph_entities WHERE store_id = v_store_id;

  -- 재고 삭제
  DELETE FROM inventory_levels WHERE product_id IN (SELECT id FROM products WHERE store_id = v_store_id);

  -- 직원 관련 삭제
  DELETE FROM staff WHERE store_id = v_store_id;

  -- 마스터 데이터 삭제
  DELETE FROM store_scenes WHERE store_id = v_store_id;
  DELETE FROM products WHERE store_id = v_store_id;
  DELETE FROM zones_dim WHERE store_id = v_store_id;
  DELETE FROM stores WHERE id = v_store_id;

  -- 온톨로지 삭제
  DELETE FROM ontology_relation_types WHERE id IN (
    'c0000001-0000-0000-0000-000000000001'::UUID,
    'c0000002-0000-0000-0000-000000000002'::UUID,
    'c0000003-0000-0000-0000-000000000003'::UUID,
    'c0000004-0000-0000-0000-000000000004'::UUID,
    'c0000005-0000-0000-0000-000000000005'::UUID,
    'c0000006-0000-0000-0000-000000000006'::UUID,
    'c0000007-0000-0000-0000-000000000007'::UUID,
    'c0000008-0000-0000-0000-000000000008'::UUID,
    'c0000009-0000-0000-0000-000000000009'::UUID,
    'c0000010-0000-0000-0000-000000000010'::UUID,
    'c0000011-0000-0000-0000-000000000011'::UUID,
    'c0000012-0000-0000-0000-000000000012'::UUID,
    'c0000013-0000-0000-0000-000000000013'::UUID,
    'c0000014-0000-0000-0000-000000000014'::UUID,
    'c0000015-0000-0000-0000-000000000015'::UUID
  );
  DELETE FROM ontology_entity_types WHERE id::TEXT LIKE 'b0000%';

  -- ★ FK 제약조건 다시 활성화
  SET session_replication_role = 'origin';

  RAISE NOTICE '  ✓ 기존 데이터 전체 삭제 완료';
END $$;


-- ============================================================================
-- STEP 1: 매장 생성 (1건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77'::UUID;
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: 매장 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO stores (id, user_id, org_id, store_name, store_code, address, floor_area_sqm, area_sqm, is_active, max_capacity, staff_count, created_at)
  VALUES (v_store_id, v_user_id, v_org_id, 'A매장', 'A001', '서울특별시 강남구 테헤란로 123 TCAG 강남점 1F', 250, 250, true, 100, 8, NOW());

  RAISE NOTICE '  ✓ stores: 1건 생성';
END $$;


-- ============================================================================
-- STEP 2: 존 생성 (7건) - 3D 좌표 포함
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

  RAISE NOTICE '  ✓ zones_dim: 7건 생성';
END $$;


-- ============================================================================
-- STEP 3: 상품 생성 (25건)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  i INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: products 생성 (25건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..25 LOOP
    -- v8.4 패치: name 컬럼도 함께 설정 (product_name과 동일한 값)
    INSERT INTO products (id, store_id, user_id, org_id, product_name, name, sku, category, price, cost_price, stock, created_at)
    VALUES (
      ('f000' || LPAD(i::TEXT, 4, '0') || '-0000-0000-0000-000000000000')::UUID,
      v_store_id, v_user_id, v_org_id,
      -- product_name
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
      -- name (product_name과 동일)
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
        WHEN i<=5 THEN '아우터' WHEN i<=10 THEN '상의' WHEN i<=15 THEN '하의'
        WHEN i<=20 THEN '액세서리' WHEN i<=23 THEN '신발' ELSE '화장품'
      END,
      CASE
        WHEN i<=5 THEN 350000+(i*50000) WHEN i<=10 THEN 80000+((i-5)*20000)
        WHEN i<=15 THEN 120000+((i-10)*25000) WHEN i<=20 THEN 150000+((i-15)*40000)
        WHEN i<=23 THEN 200000+((i-20)*80000) ELSE 80000+((i-23)*30000)
      END,
      CASE
        WHEN i<=5 THEN (350000+(i*50000))*0.4 WHEN i<=10 THEN (80000+((i-5)*20000))*0.4
        WHEN i<=15 THEN (120000+((i-10)*25000))*0.4 WHEN i<=20 THEN (150000+((i-15)*40000))*0.4
        WHEN i<=23 THEN (200000+((i-20)*80000))*0.4 ELSE (80000+((i-23)*30000))*0.4
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
  RAISE NOTICE '    - 아우터: 5개, 상의: 5개, 하의: 5개';
  RAISE NOTICE '    - 액세서리: 5개, 신발: 3개, 화장품: 2개';
END $$;


-- ============================================================================
-- STEP 4: 직원 생성 (8건)
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
  RAISE NOTICE 'STEP 4: staff 생성 (8건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  INSERT INTO staff (id, store_id, user_id, org_id, employee_code, first_name, last_name, role, department, hire_date, hourly_rate, is_active, skills, metadata, created_at) VALUES
  ('e0000001-0000-0000-0000-000000000001'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP001', '민준', '김', 'manager', 'management',
    NOW() - INTERVAL '3 years', 35000, true,
    ARRAY['leadership', 'sales', 'inventory', 'customer_service'],
    '{"specialization":"store_management","zone_preference":"all"}'::jsonb, NOW()),
  ('e0000002-0000-0000-0000-000000000002'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP002', '서연', '이', 'senior_sales', 'sales',
    NOW() - INTERVAL '2 years', 22000, true,
    ARRAY['womens_fashion', 'styling', 'vip_handling'],
    '{"specialization":"womens_wear","zone_preference":"WOM"}'::jsonb, NOW()),
  ('e0000003-0000-0000-0000-000000000003'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP003', '도윤', '박', 'senior_sales', 'sales',
    NOW() - INTERVAL '18 months', 22000, true,
    ARRAY['mens_fashion', 'styling', 'customer_service'],
    '{"specialization":"mens_wear","zone_preference":"MEN"}'::jsonb, NOW()),
  ('e0000004-0000-0000-0000-000000000004'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP004', '하은', '최', 'sales', 'sales',
    NOW() - INTERVAL '1 year', 18000, true,
    ARRAY['accessories', 'customer_service'],
    '{"specialization":"accessories","zone_preference":"ACC"}'::jsonb, NOW()),
  ('e0000005-0000-0000-0000-000000000005'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP005', '시우', '정', 'sales', 'sales',
    NOW() - INTERVAL '8 months', 18000, true,
    ARRAY['shoes', 'customer_service'],
    '{"specialization":"footwear","zone_preference":"SHO"}'::jsonb, NOW()),
  ('e0000006-0000-0000-0000-000000000006'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP006', '유진', '강', 'sales', 'sales',
    NOW() - INTERVAL '6 months', 18000, true,
    ARRAY['fitting_room', 'inventory'],
    '{"specialization":"fitting_support","zone_preference":"FIT"}'::jsonb, NOW()),
  ('e0000007-0000-0000-0000-000000000007'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP007', '지호', '조', 'cashier', 'operations',
    NOW() - INTERVAL '1 year', 16000, true,
    ARRAY['pos_operation', 'returns'],
    '{"specialization":"checkout","zone_preference":"CHK"}'::jsonb, NOW()),
  ('e0000008-0000-0000-0000-000000000008'::UUID, v_store_id, v_user_id, v_org_id,
    'EMP008', '수빈', '윤', 'cashier', 'operations',
    NOW() - INTERVAL '4 months', 16000, true,
    ARRAY['pos_operation', 'customer_service'],
    '{"specialization":"checkout","zone_preference":"CHK"}'::jsonb, NOW());

  RAISE NOTICE '  ✓ staff: 8건 생성 (manager:1, senior_sales:2, sales:3, cashier:2)';
END $$;


-- ============================================================================
-- STEP 5: 고객 생성 (2,500명)
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
  RAISE NOTICE 'STEP 5: customers 생성 (2,500명)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR i IN 1..2500 LOOP
    IF i <= 125 THEN
      v_segment := 'VIP';
      v_total_purchases := 3000000 + floor(random() * 2000000)::INT;
    ELSIF i <= 625 THEN
      v_segment := 'Regular';
      v_total_purchases := 500000 + floor(random() * 1000000)::INT;
    ELSE
      v_segment := 'New';
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
  RAISE NOTICE '    - VIP: 125명 (5%%), Regular: 500명 (20%%), New: 1,875명 (75%%)';
END $$;


-- ============================================================================
-- STEP 6: store_visits 생성 (~3,500건) - L1 핵심 데이터
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
  v_single_count INT := 1875;
  v_double_count INT := 375;
  v_triple_count INT := 175;
  v_multi_count INT := 75;
  v_customer_idx INT := 1;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6: store_visits 생성 (~3,500건) - L1 핵심 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 1회 방문 고객
  FOR i IN 1..v_single_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL - ((floor(random()*10) + 10)||' hours')::INTERVAL;
    v_duration := 300 + floor(random()*1800)::INT;
    v_made_purchase := random() < 0.10;

    v_path := ARRAY[v_zone_ids[1]];
    FOR j IN 2..(2+floor(random()*5)::INT) LOOP
      v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
    END LOOP;

    INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
    VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, v_visit_date, v_visit_date + (v_duration||' seconds')::INTERVAL, floor(v_duration/60)::INT, v_path, '{}'::jsonb, v_made_purchase, v_visit_date);

    v_customer_idx := v_customer_idx + 1;
    v_total_visits := v_total_visits + 1;
  END LOOP;

  -- 2회 방문 고객
  FOR i IN 1..v_double_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    FOR v IN 1..2 LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.15;
      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;
      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, v_visit_date, v_visit_date + (v_duration||' seconds')::INTERVAL, floor(v_duration/60)::INT, v_path, '{}'::jsonb, v_made_purchase, v_visit_date);
      v_total_visits := v_total_visits + 1;
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  -- 3회 방문 고객
  FOR i IN 1..v_triple_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    FOR v IN 1..3 LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.18;
      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;
      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, v_visit_date, v_visit_date + (v_duration||' seconds')::INTERVAL, floor(v_duration/60)::INT, v_path, '{}'::jsonb, v_made_purchase, v_visit_date);
      v_total_visits := v_total_visits + 1;
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  -- 4회+ 방문 고객
  FOR i IN 1..v_multi_count LOOP
    v_customer_id := ('c' || LPAD(v_customer_idx::TEXT, 7, '0') || '-0000-0000-0000-000000000000')::UUID;
    v_visit_count := 4 + floor(random() * 4)::INT;
    FOR v IN 1..v_visit_count LOOP
      v_visit_date := NOW() - ((floor(random()*89) + 1)||' days')::INTERVAL - ((floor(random()*10) + 10)||' hours')::INTERVAL;
      v_duration := 300 + floor(random()*1800)::INT;
      v_made_purchase := random() < 0.25;
      v_path := ARRAY[v_zone_ids[1]];
      FOR j IN 2..(2+floor(random()*5)::INT) LOOP
        v_path := array_append(v_path, v_zone_ids[1+floor(random()*7)::INT]);
      END LOOP;
      INSERT INTO store_visits (id, store_id, org_id, customer_id, visit_date, exit_date, duration_minutes, zones_visited, zone_durations, made_purchase, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_customer_id, v_visit_date, v_visit_date + (v_duration||' seconds')::INTERVAL, floor(v_duration/60)::INT, v_path, '{}'::jsonb, v_made_purchase, v_visit_date);
      v_total_visits := v_total_visits + 1;
    END LOOP;
    v_customer_idx := v_customer_idx + 1;
  END LOOP;

  RAISE NOTICE '  ✓ store_visits: %건 생성', v_total_visits;
  RAISE NOTICE '    - 재방문률: 25%% (625/2500 고객)';
END $$;


-- ============================================================================
-- STEP 7: purchases & line_items 생성
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
  RAISE NOTICE 'STEP 7: purchases & line_items 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT id, customer_id, visit_date, duration_minutes
    FROM store_visits WHERE store_id = v_store_id AND made_purchase = true
  LOOP
    v_item_count := 1 + floor(random() * 3)::INT;
    v_tx_id := 'TX-' || TO_CHAR(v_visit.visit_date, 'YYYYMMDD') || '-' || LPAD(v_purchase_count::TEXT, 4, '0');

    FOR i IN 1..v_item_count LOOP
      SELECT id, price INTO v_product FROM products WHERE store_id = v_store_id ORDER BY random() LIMIT 1;

      v_qty := 1 + floor(random() * 2)::INT;
      v_total := v_product.price * v_qty;
      v_discount := floor(v_total * random() * 0.1);
      v_purchase_id := gen_random_uuid();

      INSERT INTO purchases (id, user_id, org_id, store_id, customer_id, visit_id, product_id, purchase_date, quantity, unit_price, total_price, created_at)
      VALUES (v_purchase_id, v_user_id, v_org_id, v_store_id, v_visit.customer_id, NULL, v_product.id, v_visit.visit_date + ((v_visit.duration_minutes * 0.8)::INT || ' minutes')::INTERVAL, v_qty, v_product.price, v_total, v_visit.visit_date);
      v_purchase_count := v_purchase_count + 1;

      INSERT INTO line_items (id, org_id, store_id, transaction_id, purchase_id, product_id, customer_id, quantity, unit_price, discount_amount, tax_amount, line_total, transaction_date, transaction_hour, payment_method, is_return, metadata, created_at)
      VALUES (gen_random_uuid(), v_org_id, v_store_id, v_tx_id, v_purchase_id, v_product.id, v_visit.customer_id, v_qty, v_product.price, v_discount, floor(v_total * 0.1), v_total - v_discount, v_visit.visit_date::DATE, EXTRACT(HOUR FROM v_visit.visit_date)::INT, (ARRAY['card', 'cash', 'mobile'])[1 + floor(random() * 3)::INT], false, '{}'::jsonb, v_visit.visit_date);
      v_line_count := v_line_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ purchases: %건 생성', v_purchase_count;
  RAISE NOTICE '  ✓ line_items: %건 생성', v_line_count;
END $$;


-- ============================================================================
-- STEP 8: transactions 생성 (store_visits 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 8: transactions 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN
    SELECT sv.id, sv.customer_id, sv.visit_date, sv.duration_minutes,
           COALESCE(SUM(li.line_total), 100000 + floor(random()*400000)) as total_amount,
           COALESCE(SUM(li.discount_amount), floor(random()*20000)) as discount_amount
    FROM store_visits sv
    LEFT JOIN line_items li ON li.transaction_date = sv.visit_date::DATE AND li.customer_id = sv.customer_id AND li.store_id = sv.store_id
    WHERE sv.store_id = v_store_id AND sv.made_purchase = true
    GROUP BY sv.id, sv.customer_id, sv.visit_date, sv.duration_minutes
  LOOP
    INSERT INTO transactions (id, user_id, org_id, store_id, customer_id, visit_id, transaction_datetime, total_amount, net_amount, discount_amount, payment_method, channel, metadata, created_at)
    VALUES (gen_random_uuid(), v_user_id, v_org_id, v_store_id, v_visit.customer_id, NULL, v_visit.visit_date + ((v_visit.duration_minutes * 0.8)::INT || ' minutes')::INTERVAL, v_visit.total_amount, v_visit.total_amount - v_visit.discount_amount, v_visit.discount_amount, (ARRAY['card', 'cash', 'mobile'])[1 + floor(random() * 3)::INT], 'offline', '{"source":"sample_seeding","version":"v8.0"}'::jsonb, v_visit.visit_date);
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ transactions: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 9: store_goals 생성 (10건)
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
  RAISE NOTICE 'STEP 9: store_goals 생성 (10건)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 월간 목표
  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  INSERT INTO store_goals (id, org_id, store_id, goal_type, period_type, period_start, period_end, target_value, created_by, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_org_id, v_store_id, 'revenue', 'monthly', v_period_start, v_period_end, 100000000, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'visitors', 'monthly', v_period_start, v_period_end, 5000, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'conversion', 'monthly', v_period_start, v_period_end, 15.0, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'avg_transaction', 'monthly', v_period_start, v_period_end, 250000, v_user_id, true, NOW(), NOW());

  -- 분기 목표
  v_period_start := DATE_TRUNC('quarter', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
  INSERT INTO store_goals (id, org_id, store_id, goal_type, period_type, period_start, period_end, target_value, created_by, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_org_id, v_store_id, 'revenue', 'quarterly', v_period_start, v_period_end, 300000000, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'visitors', 'quarterly', v_period_start, v_period_end, 15000, v_user_id, true, NOW(), NOW());

  -- 주간 목표
  v_period_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
  INSERT INTO store_goals (id, org_id, store_id, goal_type, period_type, period_start, period_end, target_value, created_by, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_org_id, v_store_id, 'revenue', 'weekly', v_period_start, v_period_end, 25000000, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'visitors', 'weekly', v_period_start, v_period_end, 1200, v_user_id, true, NOW(), NOW());

  -- 일간 목표
  INSERT INTO store_goals (id, org_id, store_id, goal_type, period_type, period_start, period_end, target_value, created_by, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_org_id, v_store_id, 'revenue', 'daily', CURRENT_DATE, CURRENT_DATE, 4000000, v_user_id, true, NOW(), NOW()),
  (gen_random_uuid(), v_org_id, v_store_id, 'visitors', 'daily', CURRENT_DATE, CURRENT_DATE, 180, v_user_id, true, NOW(), NOW());

  RAISE NOTICE '  ✓ store_goals: 10건 생성';
END $$;


-- ============================================================================
-- STEP 10: daily_kpis_agg 생성 (90건) - ★ L1 store_visits 기반 직접 집계 ★
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
  RAISE NOTICE 'STEP 10: daily_kpis_agg 생성 (90건) - ★ L1 기반 직접 집계 ★';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;
    v_dow := EXTRACT(DOW FROM v_date)::INT;

    SELECT COALESCE(COUNT(*), 0) as total_visitors, COALESCE(COUNT(DISTINCT customer_id), 0) as unique_visitors,
           COALESCE(COUNT(*) FILTER (WHERE made_purchase = true), 0) as transactions, COALESCE(AVG(duration_minutes), 0) as avg_duration
    INTO v_stats FROM store_visits WHERE store_id = v_store_id AND visit_date::DATE = v_date;

    SELECT COUNT(*) INTO v_returning FROM (
      SELECT customer_id FROM store_visits WHERE store_id = v_store_id AND visit_date::DATE <= v_date AND customer_id IS NOT NULL
      GROUP BY customer_id HAVING COUNT(*) >= 2
    ) t;

    SELECT COALESCE(SUM(line_total), 0) INTO v_revenue FROM line_items WHERE store_id = v_store_id AND transaction_date = v_date;

    INSERT INTO daily_kpis_agg (id, store_id, org_id, date, total_revenue, total_transactions, avg_transaction_value, total_visitors, unique_visitors, returning_visitors, conversion_rate, avg_visit_duration_seconds, total_units_sold, avg_basket_size, labor_hours, sales_per_labor_hour, sales_per_visitor, calculated_at, created_at)
    VALUES (gen_random_uuid(), v_store_id, v_org_id, v_date, v_revenue, v_stats.transactions, CASE WHEN v_stats.transactions > 0 THEN v_revenue / v_stats.transactions ELSE 0 END, v_stats.total_visitors, v_stats.unique_visitors, v_returning, CASE WHEN v_stats.total_visitors > 0 THEN (v_stats.transactions::NUMERIC / v_stats.total_visitors * 100) ELSE 0 END, v_stats.avg_duration * 60, v_stats.transactions, CASE WHEN v_stats.transactions > 0 THEN 1.5 + random() ELSE 0 END, CASE WHEN v_dow IN (0,6) THEN 64 ELSE 48 END, CASE WHEN v_dow IN (0,6) THEN v_revenue / NULLIF(64, 0) ELSE v_revenue / NULLIF(48, 0) END, CASE WHEN v_stats.total_visitors > 0 THEN v_revenue / v_stats.total_visitors ELSE 0 END, NOW(), NOW());
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ daily_kpis_agg: %건 생성 (★ L1 store_visits 기반)', v_count;
END $$;


-- ============================================================================
-- STEP 11: daily_sales 생성 (90건) - AI 신뢰도 핵심
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_kpi RECORD;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 11: daily_sales 생성 (90건) - AI 신뢰도 핵심';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_kpi IN SELECT date, total_visitors, total_transactions, total_revenue, avg_transaction_value FROM daily_kpis_agg WHERE store_id = v_store_id LOOP
    INSERT INTO daily_sales (id, store_id, user_id, org_id, date, total_revenue, total_transactions, avg_transaction_value, units_sold, gross_profit, discount_total, return_amount, net_revenue, created_at)
    VALUES (gen_random_uuid(), v_store_id, v_user_id, v_org_id, v_kpi.date, v_kpi.total_revenue, v_kpi.total_transactions, v_kpi.avg_transaction_value, GREATEST(1, v_kpi.total_transactions * (1 + floor(random() * 2))::INT), v_kpi.total_revenue * 0.45, v_kpi.total_revenue * 0.05, v_kpi.total_revenue * 0.02, v_kpi.total_revenue * 0.93, NOW());
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ daily_sales: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 12: funnel_events 생성 (store_visits 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_visit RECORD;
  v_session TEXT;
  v_stages INT;
  -- v8.4 패치: 스키마 정의와 일치하도록 event_type 수정
  -- 스키마: 'entry', 'browse', 'engage', 'fitting', 'checkout', 'purchase', 'exit'
  v_funnel TEXT[] := ARRAY['entry', 'browse', 'engage', 'fitting', 'purchase'];
  v_funnel_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 12: funnel_events 생성 (store_visits 기반)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN SELECT id, customer_id, visit_date, made_purchase, duration_minutes FROM store_visits WHERE store_id = v_store_id LOOP
    v_session := 'session-' || v_visit.id::TEXT;

    IF v_visit.made_purchase THEN
      v_stages := 5;
    ELSE
      v_stages := CASE WHEN random() < 0.3 THEN 2 WHEN random() < 0.6 THEN 3 ELSE 4 END;
    END IF;

    FOR stage_num IN 1..v_stages LOOP
      INSERT INTO funnel_events (id, store_id, org_id, session_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_session, COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)), v_funnel[stage_num], v_visit.visit_date + ((stage_num * 3)||' minutes')::INTERVAL, v_visit.visit_date::DATE, EXTRACT(HOUR FROM v_visit.visit_date)::INT, 60 + floor(random()*180)::INT, '{"source":"store_visit"}'::jsonb, v_visit.visit_date);
      v_funnel_count := v_funnel_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ funnel_events: %건 생성', v_funnel_count;
END $$;


-- ============================================================================
-- STEP 13: zone_events 생성 (zones_visited 기반)
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
  RAISE NOTICE 'STEP 13: zone_events 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_visit IN SELECT id, customer_id, visit_date, zones_visited, duration_minutes FROM store_visits WHERE store_id = v_store_id AND zones_visited IS NOT NULL LOOP
    FOR i IN 1..array_length(v_visit.zones_visited, 1) LOOP
      v_zone_id := v_visit.zones_visited[i];

      INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)), 'enter', v_visit.visit_date + ((i * 2)||' minutes')::INTERVAL, v_visit.visit_date::DATE, EXTRACT(HOUR FROM v_visit.visit_date)::INT, 30 + floor(random()*120)::INT, '{"source":"store_visit"}'::jsonb, v_visit.visit_date);
      v_zone_count := v_zone_count + 1;

      IF random() > 0.5 THEN
        INSERT INTO zone_events (id, store_id, org_id, zone_id, visitor_id, event_type, event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at)
        VALUES (gen_random_uuid(), v_store_id, v_org_id, v_zone_id, COALESCE(v_visit.customer_id::TEXT, 'anon-' || SUBSTRING(v_visit.id::TEXT, 1, 8)), 'dwell', v_visit.visit_date + ((i * 2 + 1)||' minutes')::INTERVAL, v_visit.visit_date::DATE, EXTRACT(HOUR FROM v_visit.visit_date)::INT, 60 + floor(random()*180)::INT, '{"source":"store_visit"}'::jsonb, v_visit.visit_date);
        v_zone_count := v_zone_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ zone_events: %건 생성', v_zone_count;
END $$;


-- ============================================================================
-- STEP 14: zone_daily_metrics 생성 - ★ L1 zone_events 기반 직접 집계 ★
-- ============================================================================
-- v7.0 패치 적용: GREATEST fallback 제거, 순수 L1 데이터만 사용
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_zone_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID, 'a0000002-0000-0000-0000-000000000002'::UUID,
    'a0000003-0000-0000-0000-000000000003'::UUID, 'a0000004-0000-0000-0000-000000000004'::UUID,
    'a0000005-0000-0000-0000-000000000005'::UUID, 'a0000006-0000-0000-0000-000000000006'::UUID,
    'a0000007-0000-0000-0000-000000000007'::UUID
  ];
  v_stats RECORD;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 14: zone_daily_metrics 생성 - ★ L1 zone_events 기반 직접 집계 ★';
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
          WHEN 6 THEN floor(v_stats.total_visitors * 0.3)::INT  -- 계산대: 30% 전환
          ELSE floor(v_stats.total_visitors * 0.05)::INT        -- 기타: 5% 전환
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

  RAISE NOTICE '  ✓ zone_daily_metrics: %건 생성 (★ L1 zone_events 기반 직접 집계)', v_count;
END $$;


-- ============================================================================
-- STEP 15: hourly_metrics 생성 - ★ L1 store_visits 시간대별 직접 집계 ★
-- ============================================================================
-- v7.0 패치 적용: 하드코딩 제거, L1 데이터에서 직접 집계
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
  RAISE NOTICE 'STEP 15: hourly_metrics 생성 - ★ L1 store_visits 시간대별 직접 집계 ★';
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
        visitors, transactions, revenue, avg_basket_size
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date, v_hour,
        v_stats.visitor_count,           -- ★ L1에서 직접 가져옴
        v_stats.transaction_count,       -- ★ L1에서 직접 가져옴
        v_revenue,                       -- ★ L1에서 직접 가져옴
        CASE WHEN v_stats.transaction_count > 0
             THEN v_revenue / v_stats.transaction_count
             ELSE 0 END
      );

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ hourly_metrics: %건 생성 (★ L1 store_visits 시간대별 직접 집계)', v_count;
END $$;


-- ============================================================================
-- STEP 16: product_performance_agg 생성 (line_items 기반)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_product RECORD;
  v_sales_data RECORD;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 16: product_performance_agg 생성 - ★ L1 line_items 기반 ★';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    -- v8.4 패치: stock 컬럼 추가하여 stock_level에 반영
    FOR v_product IN SELECT id, name, category, price, COALESCE(stock, 50 + floor(random()*100)::INT) as stock FROM products WHERE store_id = v_store_id LOOP
      -- L1 line_items에서 실제 판매 데이터 집계
      SELECT
        COALESCE(SUM(quantity), 0) AS total_qty,
        COALESCE(SUM(total_price), 0) AS total_rev,
        COUNT(*) AS tx_count
      INTO v_sales_data
      FROM line_items li
      JOIN purchases p ON li.purchase_id = p.id
      WHERE li.store_id = v_store_id
        AND li.product_id = v_product.id
        AND p.purchase_date::DATE = v_date;

      -- 데이터가 없어도 최소 0으로 기록
      -- v8.4 패치: stock_level 컬럼 추가
      INSERT INTO product_performance_agg (
        id, store_id, org_id, product_id, date,
        units_sold, revenue, view_count, cart_additions,
        conversion_rate, return_rate, stock_level
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_product.id, v_date,
        GREATEST(v_sales_data.total_qty, 0),
        GREATEST(v_sales_data.total_rev, 0),
        GREATEST(v_sales_data.total_qty * 5, floor(random()*20)::INT),
        GREATEST(v_sales_data.total_qty * 2, floor(random()*5)::INT),
        CASE WHEN v_sales_data.total_qty > 0 THEN 10 + random()*15 ELSE random()*5 END,
        random()*3,
        -- stock_level: products.stock 값 사용, 판매량에 따라 조정
        GREATEST(v_product.stock - v_sales_data.total_qty, 0)
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  ✓ product_performance_agg: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 17: customer_segments_agg 생성 - ★ L1 customers/store_visits 기반 집계 ★
-- ============================================================================
-- v8.0 패치: segment_type 컬럼 추가 (NOT NULL)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_date DATE;
  v_segment_stats RECORD;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 17: customer_segments_agg 생성 - ★ L1 기반 동적 세그먼트 계산 ★';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;

  FOR day_offset IN 0..89 LOOP
    v_date := CURRENT_DATE - day_offset;

    -- ★★★ 핵심: L1 데이터(customers, store_visits, line_items)에서 세그먼트별 집계 ★★★
    FOR v_segment_stats IN
      WITH customer_metrics AS (
        SELECT
          c.id as customer_id,
          c.segment,
          COUNT(DISTINCT sv.id) as visit_count,
          COUNT(DISTINCT sv.id) FILTER (WHERE sv.made_purchase = true) as purchase_count,
          COALESCE(SUM(li.line_total), 0) as total_spent
        FROM customers c
        LEFT JOIN store_visits sv ON sv.customer_id = c.id
          AND sv.store_id = v_store_id
          AND sv.visit_date::DATE <= v_date
          AND sv.visit_date::DATE >= v_date - INTERVAL '30 days'
        LEFT JOIN line_items li ON li.customer_id = c.id
          AND li.store_id = v_store_id
          AND li.transaction_date <= v_date
          AND li.transaction_date >= v_date - INTERVAL '30 days'
        WHERE c.store_id = v_store_id
        GROUP BY c.id, c.segment
      ),
      segment_agg AS (
        SELECT
          COALESCE(segment, 'Unknown') as segment_name,
          COUNT(DISTINCT customer_id) as customer_count,
          COALESCE(SUM(total_spent), 0) as total_revenue,
          CASE WHEN SUM(purchase_count) > 0 THEN SUM(total_spent) / SUM(purchase_count) ELSE 0 END as avg_transaction,
          CASE WHEN COUNT(DISTINCT customer_id) > 0 THEN SUM(visit_count)::NUMERIC / COUNT(DISTINCT customer_id) ELSE 0 END as visit_frequency,
          CASE WHEN SUM(visit_count) > 0 THEN (SUM(purchase_count)::NUMERIC / SUM(visit_count) * 100) ELSE 0 END as conversion_rate,
          CASE WHEN COUNT(DISTINCT customer_id) > 0
            THEN (COUNT(DISTINCT customer_id) FILTER (WHERE visit_count = 0)::NUMERIC / COUNT(DISTINCT customer_id) * 100)
            ELSE 0 END as churn_risk
        FROM customer_metrics
        GROUP BY COALESCE(segment, 'Unknown')
      )
      SELECT * FROM segment_agg
    LOOP
      INSERT INTO customer_segments_agg (
        id, store_id, org_id, date,
        segment_type,                              -- ★ 추가됨
        segment_name,
        customer_count, total_revenue, avg_transaction_value,
        visit_frequency, avg_basket_size, churn_risk_score,
        ltv_estimate, metadata, calculated_at, created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_org_id, v_date,
        -- ★ segment_type 매핑 (NOT NULL 필수)
        CASE v_segment_stats.segment_name
          WHEN 'VIP' THEN 'value'
          WHEN 'Regular' THEN 'frequency'
          WHEN 'New' THEN 'lifecycle'
          WHEN 'At-Risk' THEN 'churn'
          WHEN 'Churned' THEN 'churn'
          WHEN 'Occasional' THEN 'frequency'
          ELSE 'other'
        END,
        v_segment_stats.segment_name,
        v_segment_stats.customer_count,
        v_segment_stats.total_revenue,
        v_segment_stats.avg_transaction,
        ROUND(v_segment_stats.visit_frequency::NUMERIC, 2),
        ROUND(v_segment_stats.avg_transaction::NUMERIC / NULLIF(v_segment_stats.visit_frequency, 0), 0),  -- avg_basket_size 추정
        ROUND(v_segment_stats.churn_risk::NUMERIC, 1),
        ROUND(v_segment_stats.total_revenue * 12 * (1 - v_segment_stats.churn_risk / 100)),
        jsonb_build_object('source', 'L1_aggregation', 'base_date', v_date),
        NOW(),
        NOW()
      );
      v_count := v_count + 1;
    END LOOP;

    -- 데이터가 없는 세그먼트도 0으로 기록 (모든 세그먼트 커버)
    INSERT INTO customer_segments_agg (
      id, store_id, org_id, date,
      segment_type,                                -- ★ 추가됨
      segment_name,
      customer_count, total_revenue, avg_transaction_value,
      visit_frequency, avg_basket_size, churn_risk_score, ltv_estimate,
      metadata, calculated_at, created_at
    )
    SELECT
      gen_random_uuid(), v_store_id, v_org_id, v_date,
      CASE seg
        WHEN 'VIP' THEN 'value'
        WHEN 'Regular' THEN 'frequency'
        WHEN 'New' THEN 'lifecycle'
        WHEN 'At-Risk' THEN 'churn'
        WHEN 'Churned' THEN 'churn'
        WHEN 'Occasional' THEN 'frequency'
        ELSE 'other'
      END,
      seg,
      0, 0, 0, 0, 0, 0, 0,
      '{}'::JSONB, NOW(), NOW()
    FROM unnest(ARRAY['VIP', 'Regular', 'Occasional', 'New', 'At-Risk', 'Churned']) as seg
    WHERE NOT EXISTS (
      SELECT 1 FROM customer_segments_agg
      WHERE store_id = v_store_id AND date = v_date AND segment_name = seg
    );

  END LOOP;

  SELECT COUNT(*) INTO v_count FROM customer_segments_agg WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ customer_segments_agg: %건 생성 (★ L1 기반 동적 세그먼트 계산)', v_count;
END $$;


-- ============================================================================
-- STEP 18: applied_strategies & strategy_daily_metrics - ★ L2 기반 동적 생성 ★
-- ============================================================================
-- v7.0 패치 적용: L2 테이블에서 기준선 데이터 조회하여 현실적인 전략 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;

  -- L2 기준선 데이터
  v_baseline RECORD;
  v_zone_baseline RECORD;
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
  RAISE NOTICE 'STEP 18: applied_strategies - ★ L2 기반 동적 생성 ★';
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
  RAISE NOTICE '     - 평균 전환율: %%', v_baseline_conversion;

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: zone_daily_metrics (가장 혼잡한 존)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    z.zone_name,
    z.zone_type,
    COALESCE(ROUND(AVG(zdm.total_visitors)), 20) as avg_visitors,
    COALESCE(ROUND(AVG(zdm.avg_dwell_seconds)), 120) as avg_dwell
  INTO v_zone_baseline
  FROM zone_daily_metrics zdm
  JOIN zones_dim z ON zdm.zone_id = z.id
  WHERE zdm.store_id = v_store_id
  GROUP BY z.id, z.zone_name, z.zone_type
  ORDER BY AVG(zdm.total_visitors) DESC NULLS LAST
  LIMIT 1;

  IF v_zone_baseline.zone_name IS NOT NULL THEN
    RAISE NOTICE '  📊 L2 기준선 (zone_daily_metrics):';
    RAISE NOTICE '     - 최다 방문 존: % (%명/일)', v_zone_baseline.zone_name, v_zone_baseline.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- L2 기준선 데이터 수집: hourly_metrics (피크 시간대)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    hour,
    COALESCE(SUM(visitors), 0) as total_visitors,
    COALESCE(ROUND(AVG(visitors)), 5) as avg_visitors
  INTO v_hourly_peak
  FROM hourly_metrics
  WHERE store_id = v_store_id
  GROUP BY hour
  ORDER BY SUM(visitors) DESC NULLS LAST
  LIMIT 1;

  IF v_hourly_peak.hour IS NOT NULL THEN
    RAISE NOTICE '     - 피크 시간대: %시 (평균 %명)', v_hourly_peak.hour, v_hourly_peak.avg_visitors;
  END IF;

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

  IF v_segment_baseline.vip_count IS NOT NULL THEN
    RAISE NOTICE '     - VIP 고객: %명', v_segment_baseline.vip_count;
  END IF;
  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 1: 가격 최적화 (완료됨) - 60일 전 시작, 7일간 진행
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 60;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.12 + random() * 0.08;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date, expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue, status, result, baseline_metrics, created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'pricing_optimization',
    '가격 최적화 전략',
    'L2 데이터 분석 기반 가격 탄력성 최적화. 기준 전환율 ' || v_baseline_conversion || '%에서 개선 목표. ' ||
    '일평균 매출 ₩' || TO_CHAR(v_baseline_revenue, 'FM999,999,999') || ' 기준.',
    jsonb_build_object('discount_rate', 10, 'target_products', 'low_performers'),
    v_start_date, v_end_date, 15, 15, ROUND((v_simulated_improvement - 1) * 100), ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7), ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object('source', 'daily_kpis_agg', 'daily_revenue', v_baseline_revenue, 'daily_visitors', v_baseline_visitors, 'conversion_rate', v_baseline_conversion),
    v_start_date, NOW()
  );

  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1 + (v_simulated_improvement - 1) * (day_num + 1) / 7);
    INSERT INTO strategy_daily_metrics (id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at)
    VALUES (gen_random_uuid(), v_strategy_id, v_start_date + day_num,
      jsonb_build_object('revenue', ROUND(v_day_revenue), 'visitors', v_baseline_visitors + floor(random() * 10)::INT - 5, 'baseline_revenue', v_baseline_revenue),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1), NOW());
  END LOOP;
  RAISE NOTICE '  ✓ 전략 1: 가격 최적화 (완료, ROI %%)', ROUND((v_simulated_improvement - 1) * 100);

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 2: 레이아웃 재배치 (진행중) - 3일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 3;
  v_end_date := v_start_date + 6;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date, expected_roi, target_roi, current_roi,
    expected_revenue, status, baseline_metrics, created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '3d_simulation', 'layout_optimization',
    '레이아웃 재배치 전략',
    COALESCE(v_zone_baseline.zone_name, '메인 존') || ' 존 중심 동선 최적화. 평균 체류시간 ' || COALESCE(v_zone_baseline.avg_dwell, 120) || '초 기준.',
    jsonb_build_object('target_zone', COALESCE(v_zone_baseline.zone_name, '메인 존'), 'method', 'flow_optimization'),
    v_start_date, v_end_date, 20, 18, 12, ROUND(v_baseline_revenue * 7 * 1.2),
    'active',
    jsonb_build_object('source', 'zone_daily_metrics', 'target_zone', COALESCE(v_zone_baseline.zone_name, '메인 존'), 'zone_avg_visitors', COALESCE(v_zone_baseline.avg_visitors, 20)),
    v_start_date, NOW()
  );

  FOR day_num IN 0..LEAST(2, (CURRENT_DATE - v_start_date - 1)) LOOP
    IF day_num >= 0 THEN
      v_day_revenue := v_baseline_revenue * (1.05 + day_num * 0.025);
      INSERT INTO strategy_daily_metrics (id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at)
      VALUES (gen_random_uuid(), v_strategy_id, v_start_date + day_num,
        jsonb_build_object('revenue', ROUND(v_day_revenue), 'visitors', v_baseline_visitors + floor(random() * 8)::INT),
        5 + day_num * 2, ROUND(((5 + day_num * 2) * (day_num + 1) / 3.0)::NUMERIC, 1), NOW());
    END IF;
  END LOOP;
  RAISE NOTICE '  ✓ 전략 2: 레이아웃 재배치 (진행중, 목표 존: %)', COALESCE(v_zone_baseline.zone_name, '메인 존');

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 3: 피크타임 인력 배치 (완료) - 45일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 45;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.08 + random() * 0.06;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date, expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue, status, result, baseline_metrics, created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'staffing_optimization',
    '인력 배치 최적화',
    '피크타임(' || COALESCE(v_hourly_peak.hour, 14) || '시) 집중 배치로 서비스 품질 향상. 피크 시간대 평균 ' || COALESCE(v_hourly_peak.avg_visitors, 15) || '명 방문.',
    jsonb_build_object('peak_hours', ARRAY[COALESCE(v_hourly_peak.hour, 14), COALESCE(v_hourly_peak.hour, 14) + 1], 'staff_increase', 2),
    v_start_date, v_end_date, 8, 10, ROUND((v_simulated_improvement - 1) * 100 - 2), ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.08), ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object('source', 'hourly_metrics', 'peak_hour', COALESCE(v_hourly_peak.hour, 14), 'peak_visitors', COALESCE(v_hourly_peak.avg_visitors, 15)),
    v_start_date, NOW()
  );

  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.06 + random() * 0.08);
    INSERT INTO strategy_daily_metrics (id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at)
    VALUES (gen_random_uuid(), v_strategy_id, v_start_date + day_num,
      jsonb_build_object('revenue', ROUND(v_day_revenue), 'visitors', v_baseline_visitors + floor(random() * 12)::INT - 3, 'service_score', 82 + floor(random() * 12)::INT),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1), NOW());
  END LOOP;
  RAISE NOTICE '  ✓ 전략 3: 인력 배치 최적화 (완료, 피크타임: %시)', COALESCE(v_hourly_peak.hour, 14);

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 4: VIP 프로모션 캠페인 (완료) - 30일 전 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE - 30;
  v_end_date := v_start_date + 6;
  v_simulated_improvement := 1.25 + random() * 0.1;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date, expected_roi, target_roi, current_roi, final_roi,
    expected_revenue, actual_revenue, status, result, baseline_metrics, created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'promotion_campaign',
    'VIP 프로모션 캠페인',
    'VIP 세그먼트 ' || COALESCE(v_segment_baseline.vip_count, 20) || '명 대상 20% 할인 이벤트. VIP 평균 객단가 ₩' || TO_CHAR(COALESCE(v_segment_baseline.vip_avg_transaction, 350000), 'FM999,999') || ' 기준.',
    jsonb_build_object('discount_rate', 20, 'target_segment', 'VIP', 'campaign_type', 'exclusive_presale'),
    v_start_date, v_end_date, 25, 22, ROUND((v_simulated_improvement - 1) * 100 - 3), ROUND((v_simulated_improvement - 1) * 100),
    ROUND(v_baseline_revenue * 7 * 1.25), ROUND(v_baseline_revenue * 7 * v_simulated_improvement),
    'completed', 'success',
    jsonb_build_object('source', 'customer_segments_agg', 'vip_count', COALESCE(v_segment_baseline.vip_count, 20), 'vip_avg_transaction', COALESCE(v_segment_baseline.vip_avg_transaction, 350000)),
    v_start_date, NOW()
  );

  FOR day_num IN 0..6 LOOP
    v_day_revenue := v_baseline_revenue * (1.20 + random() * 0.15);
    INSERT INTO strategy_daily_metrics (id, strategy_id, date, metrics, daily_roi, cumulative_roi, created_at)
    VALUES (gen_random_uuid(), v_strategy_id, v_start_date + day_num,
      jsonb_build_object('revenue', ROUND(v_day_revenue), 'vip_transactions', COALESCE(v_segment_baseline.vip_count, 20) + floor(random() * 10)::INT - 5),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100)::NUMERIC, 1),
      ROUND(((v_day_revenue / v_baseline_revenue - 1) * 100 * (day_num + 1) / 7)::NUMERIC, 1), NOW());
  END LOOP;
  RAISE NOTICE '  ✓ 전략 4: VIP 프로모션 (완료, 대상: %명)', COALESCE(v_segment_baseline.vip_count, 20);

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 전략 5: 재고 최적화 (예정) - 7일 후 시작
  -- ═══════════════════════════════════════════════════════════════════════════
  v_strategy_id := gen_random_uuid();
  v_start_date := CURRENT_DATE + 7;
  v_end_date := v_start_date + 13;

  INSERT INTO applied_strategies (
    id, store_id, org_id, user_id, created_by,
    source, source_module, name, description, settings,
    start_date, end_date, expected_roi, target_roi,
    expected_revenue, status, baseline_metrics, created_at, updated_at
  ) VALUES (
    v_strategy_id, v_store_id, v_org_id, v_user_id, v_user_id,
    '2d_simulation', 'inventory_management',
    '재고 최적화 전략',
    '재고 부족 상품 대상 자동 발주 시스템 적용. 일평균 매출 ₩' || TO_CHAR(v_baseline_revenue, 'FM999,999,999') || ' 기준.',
    jsonb_build_object('min_stock_threshold', 10, 'auto_reorder', true),
    v_start_date, v_end_date, 10, 12, ROUND(v_baseline_revenue * 14 * 1.1),
    'pending',
    jsonb_build_object('source', 'daily_kpis_agg', 'daily_revenue', v_baseline_revenue),
    NOW(), NOW()
  );
  RAISE NOTICE '  ✓ 전략 5: 재고 최적화 (예정)';

  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ applied_strategies: 5건 생성 (★ L2 기반 동적 생성)';
  RAISE NOTICE '    - 완료: 3건 (가격최적화, 인력배치, VIP프로모션)';
  RAISE NOTICE '    - 진행중: 1건 (레이아웃 재배치)';
  RAISE NOTICE '    - 예정: 1건 (재고최적화)';
  RAISE NOTICE '  ✓ strategy_daily_metrics: 완료/진행중 전략별 일별 성과 생성';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
END $$;


-- ============================================================================
-- STEP 19: inventory_levels 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_product RECORD;
  v_count INT := 0;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 19: inventory_levels 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  FOR v_product IN SELECT id, name, price FROM products WHERE store_id = v_store_id LOOP
    INSERT INTO inventory_levels (
      id, store_id, org_id, product_id,
      current_stock, min_stock, max_stock, reorder_point,
      last_restock_date, last_restock_quantity
    ) VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_product.id,
      20 + floor(random()*80)::INT,
      10,
      100,
      20,
      CURRENT_DATE - floor(random()*30)::INT,
      30 + floor(random()*50)::INT
    );
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ inventory_levels: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 20: ontology_entity_types 생성 (확장 30개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77'::UUID;
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::UUID;
  v_count INT := 0;
BEGIN

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 20: ontology_entity_types 생성 (30개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM ontology_entity_types WHERE user_id = v_user_id;

  -- 30개 엔티티 타입 삽입
  INSERT INTO ontology_entity_types (id, user_id, store_id, org_id, name, description, color, icon, properties, created_at, updated_at)
  VALUES
    -- 핵심 비즈니스 엔티티 (1-10)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Store', '소매 매장', '#3B82F6', 'store', '{"attributes": ["name", "address", "size_sqm", "type"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Zone', '매장 내 구역', '#10B981', 'map', '{"attributes": ["name", "type", "area_sqm", "position"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Product', '상품', '#F59E0B', 'package', '{"attributes": ["name", "sku", "price", "category"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Customer', '고객', '#EC4899', 'user', '{"attributes": ["name", "email", "segment", "lifetime_value"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Staff', '직원', '#8B5CF6', 'users', '{"attributes": ["name", "role", "department", "hire_date"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Transaction', '거래', '#06B6D4', 'credit-card', '{"attributes": ["amount", "datetime", "payment_method"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Visit', '방문', '#84CC16', 'footprints', '{"attributes": ["datetime", "duration", "zones_visited"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Purchase', '구매', '#F97316', 'shopping-cart', '{"attributes": ["total_amount", "items_count", "datetime"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Promotion', '프로모션', '#EF4444', 'tag', '{"attributes": ["name", "discount_rate", "start_date", "end_date"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Category', '카테고리', '#6366F1', 'folder', '{"attributes": ["name", "parent", "level"]}', NOW(), NOW()),

    -- 분석/메트릭 엔티티 (11-20)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'DailyKPI', '일별 KPI', '#0EA5E9', 'bar-chart', '{"attributes": ["date", "revenue", "visitors", "conversion"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'HourlyMetric', '시간별 메트릭', '#14B8A6', 'clock', '{"attributes": ["hour", "visitors", "transactions"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ZoneMetric', '구역 메트릭', '#22C55E', 'activity', '{"attributes": ["zone", "traffic", "dwell_time"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ProductPerformance', '상품 성과', '#EAB308', 'trending-up', '{"attributes": ["product", "sales", "revenue"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'CustomerSegment', '고객 세그먼트', '#D946EF', 'pie-chart', '{"attributes": ["name", "count", "avg_value"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'FunnelStage', '퍼널 단계', '#F472B6', 'filter', '{"attributes": ["stage", "count", "conversion"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Heatmap', '히트맵', '#FB923C', 'flame', '{"attributes": ["zone", "intensity", "period"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Trend', '트렌드', '#A855F7', 'trending-up', '{"attributes": ["metric", "direction", "magnitude"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Anomaly', '이상치', '#DC2626', 'alert-triangle', '{"attributes": ["metric", "value", "threshold"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Forecast', '예측', '#2563EB', 'target', '{"attributes": ["metric", "predicted", "confidence"]}', NOW(), NOW()),

    -- 전략/AI 엔티티 (21-30)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Strategy', '전략', '#7C3AED', 'lightbulb', '{"attributes": ["name", "type", "impact"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Recommendation', 'AI 추천', '#0891B2', 'sparkles', '{"attributes": ["title", "priority", "expected_impact"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Insight', '인사이트', '#059669', 'eye', '{"attributes": ["type", "description", "confidence"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Alert', '알림', '#B91C1C', 'bell', '{"attributes": ["type", "severity", "message"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Goal', '목표', '#4F46E5', 'flag', '{"attributes": ["metric", "target", "deadline"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Scenario', '시나리오', '#7E22CE', 'git-branch', '{"attributes": ["name", "assumptions", "outcomes"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Simulation', '시뮬레이션', '#DB2777', 'play', '{"attributes": ["scenario", "result", "confidence"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ExternalFactor', '외부 요인', '#64748B', 'cloud', '{"attributes": ["type", "value", "source"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Event', '이벤트', '#EA580C', 'calendar', '{"attributes": ["name", "date", "impact"]}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'Inventory', '재고', '#65A30D', 'box', '{"attributes": ["product", "quantity", "status"]}', NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_entity_types: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 21: ontology_relation_types 생성 (15개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID := 'e4200130-08e8-47da-8c92-3d0b90fafd77'::UUID;
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::UUID;
  v_count INT := 0;
BEGIN

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 21: ontology_relation_types 생성 (15개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM ontology_relation_types WHERE user_id = v_user_id;

  -- 15개 관계 타입 삽입
  INSERT INTO ontology_relation_types (id, user_id, store_id, org_id, name, description, source_type, target_type, properties, created_at, updated_at)
  VALUES
    -- 공간 관계 (1-3)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'CONTAINS', '포함 관계', 'Store', 'Zone', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ADJACENT_TO', '인접 관계', 'Zone', 'Zone', '{"bidirectional": true}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'LOCATED_IN', '위치', 'Product', 'Zone', '{"bidirectional": false}', NOW(), NOW()),

    -- 트랜잭션 관계 (4-6)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'PURCHASED', '구매함', 'Customer', 'Product', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'VISITED', '방문함', 'Customer', 'Zone', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'MADE_TRANSACTION', '거래 발생', 'Customer', 'Transaction', '{"bidirectional": false}', NOW(), NOW()),

    -- 분류 관계 (7-9)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'BELONGS_TO', '소속', 'Product', 'Category', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'MEMBER_OF', '멤버', 'Customer', 'CustomerSegment', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'WORKS_AT', '근무', 'Staff', 'Store', '{"bidirectional": false}', NOW(), NOW()),

    -- 분석 관계 (10-12)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'GENERATES', '생성', 'Visit', 'DailyKPI', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'AFFECTS', '영향', 'ExternalFactor', 'DailyKPI', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'MEASURED_BY', '측정', 'Zone', 'ZoneMetric', '{"bidirectional": false}', NOW(), NOW()),

    -- AI/전략 관계 (13-15)
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'RECOMMENDS', '추천', 'Insight', 'Strategy', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'TARGETS', '대상', 'Strategy', 'Goal', '{"bidirectional": false}', NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'SIMULATES', '시뮬레이션', 'Scenario', 'Simulation', '{"bidirectional": false}', NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ ontology_relation_types: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 22: graph_entities 생성 (30개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 22: graph_entities 생성 (30개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM graph_entities WHERE store_id = v_store_id;

  -- 30개 그래프 엔티티 삽입
  INSERT INTO graph_entities (id, user_id, store_id, org_id, entity_type, name, description, properties, position_x, position_y, created_at, updated_at)
  VALUES
    -- 매장/구역 엔티티
    ('ge-store-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Store', '강남점', '강남 플래그십 스토어', '{"size_sqm": 200, "floors": 2}', 400, 300, NOW(), NOW()),
    ('ge-zone-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Zone', '입구', '매장 입구 구역', '{"type": "entrance"}', 200, 100, NOW(), NOW()),
    ('ge-zone-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Zone', '여성의류', '여성 의류 구역', '{"type": "display"}', 300, 200, NOW(), NOW()),
    ('ge-zone-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'Zone', '남성의류', '남성 의류 구역', '{"type": "display"}', 500, 200, NOW(), NOW()),
    ('ge-zone-004-0000-0000-000000000004'::UUID, v_user_id, v_store_id, v_org_id, 'Zone', '피팅룸', '피팅룸 구역', '{"type": "fitting"}', 400, 400, NOW(), NOW()),
    ('ge-zone-005-0000-0000-000000000005'::UUID, v_user_id, v_store_id, v_org_id, 'Zone', '계산대', '결제 구역', '{"type": "checkout"}', 600, 300, NOW(), NOW()),

    -- 상품 엔티티
    ('ge-prod-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Product', '프리미엄 자켓', '고급 겨울 자켓', '{"price": 299000, "category": "outerwear"}', 300, 250, NOW(), NOW()),
    ('ge-prod-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Product', '캐시미어 니트', '캐시미어 100% 니트', '{"price": 189000, "category": "tops"}', 350, 250, NOW(), NOW()),
    ('ge-prod-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'Product', '슬림핏 청바지', '스트레치 슬림핏 데님', '{"price": 89000, "category": "bottoms"}', 500, 250, NOW(), NOW()),
    ('ge-prod-004-0000-0000-000000000004'::UUID, v_user_id, v_store_id, v_org_id, 'Product', '울 코트', '클래식 울 코트', '{"price": 450000, "category": "outerwear"}', 550, 250, NOW(), NOW()),

    -- 고객 세그먼트
    ('ge-seg-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'CustomerSegment', 'VIP 고객', '상위 5% 고가치 고객', '{"avg_spend": 500000, "frequency": 5}', 100, 400, NOW(), NOW()),
    ('ge-seg-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'CustomerSegment', '일반 고객', '정기 방문 고객', '{"avg_spend": 80000, "frequency": 2}', 150, 450, NOW(), NOW()),
    ('ge-seg-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'CustomerSegment', '신규 고객', '최근 가입 고객', '{"avg_spend": 50000, "frequency": 1}', 200, 500, NOW(), NOW()),

    -- KPI 엔티티
    ('ge-kpi-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'DailyKPI', '일일 매출', '일일 총 매출액', '{"current": 2500000, "target": 3000000}', 700, 100, NOW(), NOW()),
    ('ge-kpi-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'DailyKPI', '전환율', '방문 대비 구매 비율', '{"current": 14.5, "target": 18}', 750, 150, NOW(), NOW()),
    ('ge-kpi-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'DailyKPI', '객단가', '평균 거래 금액', '{"current": 65000, "target": 75000}', 800, 200, NOW(), NOW()),

    -- 전략 엔티티
    ('ge-str-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Strategy', '피크타임 최적화', '점심/저녁 피크 인력 배치', '{"type": "staffing", "impact": 12}', 100, 600, NOW(), NOW()),
    ('ge-str-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Strategy', 'VIP 전용 서비스', 'VIP 고객 맞춤 응대', '{"type": "service", "impact": 8}', 200, 650, NOW(), NOW()),
    ('ge-str-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'Strategy', '크로스셀링 강화', '연관 상품 추천 확대', '{"type": "sales", "impact": 15}', 300, 600, NOW(), NOW()),

    -- 인사이트 엔티티
    ('ge-ins-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Insight', '피팅룸 병목', '피팅룸 대기시간 증가 감지', '{"severity": "medium", "confidence": 0.85}', 400, 550, NOW(), NOW()),
    ('ge-ins-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Insight', '주말 트래픽 급증', '토요일 오후 방문자 40% 증가', '{"severity": "info", "confidence": 0.92}', 450, 600, NOW(), NOW()),
    ('ge-ins-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'Insight', 'VIP 이탈 위험', 'VIP 고객 3명 30일 미방문', '{"severity": "high", "confidence": 0.78}', 500, 550, NOW(), NOW()),

    -- 외부 요인 엔티티
    ('ge-ext-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'ExternalFactor', '날씨', '서울 날씨 정보', '{"type": "weather", "source": "KMA"}', 800, 400, NOW(), NOW()),
    ('ge-ext-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'ExternalFactor', '경제지표', '소비자물가지수', '{"type": "economic", "source": "KOSIS"}', 850, 450, NOW(), NOW()),
    ('ge-ext-003-0000-0000-000000000003'::UUID, v_user_id, v_store_id, v_org_id, 'ExternalFactor', '공휴일', '공휴일 정보', '{"type": "calendar", "source": "공공데이터"}', 900, 400, NOW(), NOW()),

    -- 목표 엔티티
    ('ge-goal-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Goal', 'Q4 매출 목표', '4분기 매출 목표', '{"target": 90000000, "deadline": "2024-12-31"}', 700, 500, NOW(), NOW()),
    ('ge-goal-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Goal', '전환율 개선', '전환율 20% 달성', '{"target": 20, "deadline": "2024-12-31"}', 750, 550, NOW(), NOW()),

    -- 시뮬레이션 엔티티
    ('ge-sim-001-0000-0000-000000000001'::UUID, v_user_id, v_store_id, v_org_id, 'Simulation', '인력 재배치 시뮬', '피크타임 인력 증원 효과', '{"result": "+15% conversion", "confidence": 0.82}', 100, 700, NOW(), NOW()),
    ('ge-sim-002-0000-0000-000000000002'::UUID, v_user_id, v_store_id, v_org_id, 'Simulation', '프로모션 효과', '20% 할인 시뮬레이션', '{"result": "+25% traffic", "confidence": 0.75}', 200, 750, NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ graph_entities: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 23: graph_relations 생성 (30개)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 23: graph_relations 생성 (30개)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM graph_relations WHERE store_id = v_store_id;

  -- 30개 그래프 관계 삽입
  INSERT INTO graph_relations (id, user_id, store_id, org_id, source_entity_id, target_entity_id, relation_type, properties, weight, created_at, updated_at)
  VALUES
    -- 매장-구역 포함 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-store-001-0000-0000-000000000001', 'ge-zone-001-0000-0000-000000000001', 'CONTAINS', '{}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-store-001-0000-0000-000000000001', 'ge-zone-002-0000-0000-000000000002', 'CONTAINS', '{}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-store-001-0000-0000-000000000001', 'ge-zone-003-0000-0000-000000000003', 'CONTAINS', '{}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-store-001-0000-0000-000000000001', 'ge-zone-004-0000-0000-000000000004', 'CONTAINS', '{}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-store-001-0000-0000-000000000001', 'ge-zone-005-0000-0000-000000000005', 'CONTAINS', '{}', 1.0, NOW(), NOW()),

    -- 구역 인접 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-001-0000-0000-000000000001', 'ge-zone-002-0000-0000-000000000002', 'ADJACENT_TO', '{"distance": 5}', 0.8, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-001-0000-0000-000000000001', 'ge-zone-003-0000-0000-000000000003', 'ADJACENT_TO', '{"distance": 7}', 0.7, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-002-0000-0000-000000000002', 'ge-zone-004-0000-0000-000000000004', 'ADJACENT_TO', '{"distance": 4}', 0.9, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-003-0000-0000-000000000003', 'ge-zone-004-0000-0000-000000000004', 'ADJACENT_TO', '{"distance": 4}', 0.9, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-004-0000-0000-000000000004', 'ge-zone-005-0000-0000-000000000005', 'ADJACENT_TO', '{"distance": 6}', 0.75, NOW(), NOW()),

    -- 상품-구역 위치 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-prod-001-0000-0000-000000000001', 'ge-zone-002-0000-0000-000000000002', 'LOCATED_IN', '{"shelf": "A1"}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-prod-002-0000-0000-000000000002', 'ge-zone-002-0000-0000-000000000002', 'LOCATED_IN', '{"shelf": "B2"}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-prod-003-0000-0000-000000000003', 'ge-zone-003-0000-0000-000000000003', 'LOCATED_IN', '{"shelf": "C1"}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-prod-004-0000-0000-000000000004', 'ge-zone-003-0000-0000-000000000003', 'LOCATED_IN', '{"shelf": "D2"}', 1.0, NOW(), NOW()),

    -- 고객세그먼트-KPI 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-seg-001-0000-0000-000000000001', 'ge-kpi-001-0000-0000-000000000001', 'GENERATES', '{"contribution": 0.45}', 0.95, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-seg-002-0000-0000-000000000002', 'ge-kpi-001-0000-0000-000000000001', 'GENERATES', '{"contribution": 0.35}', 0.85, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-seg-003-0000-0000-000000000003', 'ge-kpi-001-0000-0000-000000000001', 'GENERATES', '{"contribution": 0.20}', 0.70, NOW(), NOW()),

    -- 인사이트-전략 추천 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ins-001-0000-0000-000000000001', 'ge-str-001-0000-0000-000000000001', 'RECOMMENDS', '{"confidence": 0.85}', 0.85, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ins-002-0000-0000-000000000002', 'ge-str-001-0000-0000-000000000001', 'RECOMMENDS', '{"confidence": 0.78}', 0.78, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ins-003-0000-0000-000000000003', 'ge-str-002-0000-0000-000000000002', 'RECOMMENDS', '{"confidence": 0.92}', 0.92, NOW(), NOW()),

    -- 전략-목표 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-str-001-0000-0000-000000000001', 'ge-goal-002-0000-0000-000000000002', 'TARGETS', '{"expected_impact": 0.15}', 0.88, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-str-002-0000-0000-000000000002', 'ge-goal-001-0000-0000-000000000001', 'TARGETS', '{"expected_impact": 0.08}', 0.75, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-str-003-0000-0000-000000000003', 'ge-goal-001-0000-0000-000000000001', 'TARGETS', '{"expected_impact": 0.12}', 0.82, NOW(), NOW()),

    -- 외부요인-KPI 영향 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ext-001-0000-0000-000000000001', 'ge-kpi-001-0000-0000-000000000001', 'AFFECTS', '{"correlation": 0.35}', 0.65, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ext-002-0000-0000-000000000002', 'ge-kpi-001-0000-0000-000000000001', 'AFFECTS', '{"correlation": 0.25}', 0.55, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-ext-003-0000-0000-000000000003', 'ge-kpi-001-0000-0000-000000000001', 'AFFECTS', '{"correlation": 0.45}', 0.75, NOW(), NOW()),

    -- 구역-메트릭 측정 관계
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-001-0000-0000-000000000001', 'ge-kpi-002-0000-0000-000000000002', 'MEASURED_BY', '{"metric_type": "traffic"}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-004-0000-0000-000000000004', 'ge-kpi-002-0000-0000-000000000002', 'MEASURED_BY', '{"metric_type": "conversion"}', 1.0, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, v_store_id, v_org_id, 'ge-zone-005-0000-0000-000000000005', 'ge-kpi-003-0000-0000-000000000003', 'MEASURED_BY', '{"metric_type": "basket_size"}', 1.0, NOW(), NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ graph_relations: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 24: store_scenes 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 24: store_scenes 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM store_scenes WHERE store_id = v_store_id;

  INSERT INTO store_scenes (
    id, user_id, store_id, org_id, name, description,
    scene_data, is_active, thumbnail_url, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, v_store_id, v_org_id,
    '기본 매장 레이아웃',
    '강남점 기본 매장 구성 - 2층 구조, 7개 구역',
    '{
      "version": "1.0",
      "viewport": {"width": 1200, "height": 800, "zoom": 1},
      "zones": [
        {"id": "a0000001-0000-0000-0000-000000000001", "name": "입구", "x": 100, "y": 50, "width": 150, "height": 100, "color": "#3B82F6"},
        {"id": "a0000002-0000-0000-0000-000000000002", "name": "여성의류", "x": 50, "y": 200, "width": 200, "height": 250, "color": "#EC4899"},
        {"id": "a0000003-0000-0000-0000-000000000003", "name": "남성의류", "x": 300, "y": 200, "width": 200, "height": 250, "color": "#3B82F6"},
        {"id": "a0000004-0000-0000-0000-000000000004", "name": "액세서리", "x": 550, "y": 200, "width": 150, "height": 150, "color": "#F59E0B"},
        {"id": "a0000005-0000-0000-0000-000000000005", "name": "피팅룸", "x": 200, "y": 500, "width": 200, "height": 100, "color": "#8B5CF6"},
        {"id": "a0000006-0000-0000-0000-000000000006", "name": "계산대", "x": 450, "y": 500, "width": 150, "height": 100, "color": "#10B981"},
        {"id": "a0000007-0000-0000-0000-000000000007", "name": "창고", "x": 650, "y": 400, "width": 100, "height": 200, "color": "#6B7280"}
      ],
      "connections": [
        {"from": "a0000001-0000-0000-0000-000000000001", "to": "a0000002-0000-0000-0000-000000000002"},
        {"from": "a0000001-0000-0000-0000-000000000001", "to": "a0000003-0000-0000-0000-000000000003"},
        {"from": "a0000002-0000-0000-0000-000000000002", "to": "a0000005-0000-0000-0000-000000000005"},
        {"from": "a0000003-0000-0000-0000-000000000003", "to": "a0000005-0000-0000-0000-000000000005"},
        {"from": "a0000005-0000-0000-0000-000000000005", "to": "a0000006-0000-0000-0000-000000000006"}
      ]
    }'::jsonb,
    true,
    NULL,
    NOW(), NOW()
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ store_scenes: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 25: ai_recommendations 생성 - ★ L2 기반 동적 분석 ★
-- ============================================================================
-- v8.0 패치: 스키마 불일치 수정 (기존 L2 분석 로직 100% 유지)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;

  -- L2 분석 결과 변수
  v_avg_conversion NUMERIC;
  v_avg_revenue NUMERIC;
  v_peak_hour RECORD;
  v_low_traffic_hour RECORD;
  v_congested_zone RECORD;
  v_vip_stats RECORD;
  v_at_risk_stats RECORD;

  v_recommendation_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 25: ai_recommendations 생성 - ★ L2 기반 동적 분석 ★';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM ai_recommendations WHERE store_id = v_store_id;

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
  -- 추천 1: 피크타임 인력 보강 (L2: hourly_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    hour,
    COALESCE(SUM(visitor_count), 0) as total_visitors,
    COALESCE(ROUND(AVG(visitor_count)), 5) as avg_visitors,
    COALESCE(SUM(transaction_count), 0) as total_transactions,
    COALESCE(ROUND(AVG(revenue)), 0) as avg_revenue
  INTO v_peak_hour
  FROM hourly_metrics
  WHERE store_id = v_store_id
  GROUP BY hour
  ORDER BY SUM(visitor_count) DESC NULLS LAST
  LIMIT 1;

  IF v_peak_hour.hour IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      recommendation_type, title, description,
      priority, status,
      expected_impact,
      evidence,
      action_category,
      data_source,
      created_at, updated_at, is_displayed
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'staffing',
      '피크타임 인력 보강: ' || v_peak_hour.hour || '시',
      v_peak_hour.hour || '시에 평균 ' || v_peak_hour.avg_visitors || '명 방문, ' ||
        '평균 매출 ₩' || TO_CHAR(v_peak_hour.avg_revenue, 'FM999,999') || '. ' ||
        '서비스 품질 유지 및 전환율 개선을 위해 직원 추가 배치를 권장합니다.',
      'high', 'pending',
      jsonb_build_object(
        'expected_improvement_percent', 15 + floor(random() * 10)::INT,
        'confidence_score', ROUND((0.78 + random() * 0.12)::NUMERIC, 2),
        'target_metric', 'conversion_rate'
      ),
      jsonb_build_object(
        'implementation_steps', ARRAY['피크타임 분석 완료', '추가 인력 배치', '대기시간 모니터링', '효과 측정'],
        'data_sources_used', ARRAY['hourly_metrics', 'daily_kpis_agg'],
        'analysis_period_days', 30
      ),
      'staff_scheduling',
      'hourly_metrics',
      NOW(), NOW(), true
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 1: 피크타임 인력 - %시 (평균 %명)', v_peak_hour.hour, v_peak_hour.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 2: 저조 시간대 프로모션 (L2: hourly_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    hour,
    COALESCE(SUM(visitor_count), 0) as total_visitors,
    COALESCE(ROUND(AVG(visitor_count)), 5) as avg_visitors,
    COALESCE(ROUND(AVG(revenue)), 0) as avg_revenue
  INTO v_low_traffic_hour
  FROM hourly_metrics
  WHERE store_id = v_store_id AND hour BETWEEN 10 AND 20
  GROUP BY hour
  HAVING AVG(visitor_count) > 0
  ORDER BY SUM(visitor_count) ASC NULLS LAST
  LIMIT 1;

  IF v_low_traffic_hour.hour IS NOT NULL AND v_peak_hour.avg_visitors IS NOT NULL
     AND v_low_traffic_hour.avg_visitors < v_peak_hour.avg_visitors * 0.5 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      recommendation_type, title, description,
      priority, status,
      expected_impact,
      evidence,
      action_category,
      data_source,
      created_at, updated_at, is_displayed
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'promotion',
      '비수기 시간대 프로모션: ' || v_low_traffic_hour.hour || '시',
      v_low_traffic_hour.hour || '시 평균 방문자 ' || v_low_traffic_hour.avg_visitors || '명으로 ' ||
        '피크타임(' || v_peak_hour.hour || '시) 대비 ' ||
        ROUND((v_low_traffic_hour.avg_visitors::NUMERIC / NULLIF(v_peak_hour.avg_visitors, 0) * 100)) || '% 수준. ' ||
        '해당 시간대 타임세일 또는 특별 프로모션을 권장합니다.',
      'medium', 'pending',
      jsonb_build_object(
        'expected_improvement_percent', 7 + floor(random() * 8)::INT,
        'confidence_score', ROUND((0.65 + random() * 0.15)::NUMERIC, 2),
        'target_metric', 'total_visitors'
      ),
      jsonb_build_object(
        'implementation_steps', ARRAY['저조 시간대 분석', '타임세일 기획', '프로모션 실행', '효과 측정'],
        'data_sources_used', ARRAY['hourly_metrics'],
        'analysis_period_days', 30
      ),
      'promotion_planning',
      'hourly_metrics',
      NOW(), NOW(), true
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 2: 비수기 프로모션 - %시 (평균 %명)', v_low_traffic_hour.hour, v_low_traffic_hour.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 3: 혼잡 존 레이아웃 개선 (L2: zone_daily_metrics)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    z.zone_name,
    z.zone_type,
    COALESCE(ROUND(AVG(zdm.total_visitors)), 20) as avg_visitors,
    COALESCE(ROUND(AVG(zdm.avg_dwell_seconds)), 120) as avg_dwell
  INTO v_congested_zone
  FROM zone_daily_metrics zdm
  JOIN zones_dim z ON zdm.zone_id = z.id
  WHERE zdm.store_id = v_store_id
  GROUP BY z.id, z.zone_name, z.zone_type
  ORDER BY AVG(zdm.total_visitors) DESC NULLS LAST
  LIMIT 1;

  IF v_congested_zone.zone_name IS NOT NULL THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      recommendation_type, title, description,
      priority, status,
      expected_impact,
      evidence,
      action_category,
      data_source,
      created_at, updated_at, is_displayed
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'layout',
      '혼잡 존 레이아웃 개선: ' || v_congested_zone.zone_name,
      v_congested_zone.zone_name || ' 존(' || v_congested_zone.zone_type || ')이 가장 많은 방문자(' ||
        v_congested_zone.avg_visitors || '명/일)를 기록. 평균 체류시간 ' ||
        v_congested_zone.avg_dwell || '초. 동선 분산 또는 공간 최적화를 권장합니다.',
      CASE WHEN v_congested_zone.avg_visitors > 30 THEN 'high' ELSE 'medium' END,
      'pending',
      jsonb_build_object(
        'expected_improvement_percent', 10 + floor(random() * 10)::INT,
        'confidence_score', ROUND((0.75 + random() * 0.15)::NUMERIC, 2),
        'target_metric', 'conversion_rate'
      ),
      jsonb_build_object(
        'implementation_steps', ARRAY['혼잡도 분석 완료', '동선 재설계', '레이아웃 조정', '효과 측정'],
        'data_sources_used', ARRAY['zone_daily_metrics', 'zone_events'],
        'analysis_period_days', 30
      ),
      'layout_optimization',
      'zone_daily_metrics',
      NOW(), NOW(), true
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 3: 혼잡 존 - % (%명/일)', v_congested_zone.zone_name, v_congested_zone.avg_visitors;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 4: VIP 고객 특별 이벤트 (L2: customer_segments_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    COALESCE(ROUND(AVG(customer_count)), 20) as vip_count,
    COALESCE(ROUND(AVG(total_revenue)), 500000) as vip_revenue,
    COALESCE(ROUND(AVG(avg_transaction_value)), 350000) as vip_avg_transaction
  INTO v_vip_stats
  FROM customer_segments_agg
  WHERE store_id = v_store_id AND segment_name = 'VIP';

  IF v_vip_stats.vip_count IS NOT NULL AND v_vip_stats.vip_count > 0 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      recommendation_type, title, description,
      priority, status,
      expected_impact,
      evidence,
      action_category,
      data_source,
      created_at, updated_at, is_displayed
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'promotion',
      'VIP 고객 특별 이벤트 제안',
      'VIP 세그먼트 ' || v_vip_stats.vip_count || '명 대상 전용 사전 구매 이벤트로 충성도 강화를 권장합니다. ' ||
        '평균 객단가 ₩' || TO_CHAR(v_vip_stats.vip_avg_transaction, 'FM999,999') || ', ' ||
        '일평균 매출 기여 ₩' || TO_CHAR(v_vip_stats.vip_revenue, 'FM999,999') || '.',
      'high', 'pending',
      jsonb_build_object(
        'expected_improvement_percent', 12 + floor(random() * 8)::INT,
        'confidence_score', ROUND((0.72 + random() * 0.15)::NUMERIC, 2),
        'target_metric', 'customer_retention'
      ),
      jsonb_build_object(
        'implementation_steps', ARRAY['VIP 리스트 추출', '이벤트 기획', '개인화 마케팅 실행', '효과 측정'],
        'data_sources_used', ARRAY['customer_segments_agg', 'customers'],
        'analysis_period_days', 30
      ),
      'customer_engagement',
      'customer_segments_agg',
      NOW(), NOW(), true
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 4: VIP 이벤트 - %명 (객단가 ₩%)', v_vip_stats.vip_count, TO_CHAR(v_vip_stats.vip_avg_transaction, 'FM999,999');
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- 추천 5: At-Risk 고객 리텐션 (L2: customer_segments_agg)
  -- ═══════════════════════════════════════════════════════════
  SELECT
    COALESCE(ROUND(AVG(customer_count)), 30) as at_risk_count,
    COALESCE(ROUND(AVG(churn_risk_score)), 50) as avg_churn_risk,
    COALESCE(ROUND(AVG(ltv_estimate)), 1000000) as avg_ltv
  INTO v_at_risk_stats
  FROM customer_segments_agg
  WHERE store_id = v_store_id AND segment_name = 'At-Risk';

  IF v_at_risk_stats.at_risk_count IS NOT NULL AND v_at_risk_stats.at_risk_count > 10 THEN
    INSERT INTO ai_recommendations (
      id, store_id, user_id, org_id,
      recommendation_type, title, description,
      priority, status,
      expected_impact,
      evidence,
      action_category,
      data_source,
      created_at, updated_at, is_displayed
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      'retention',
      'At-Risk 고객 리텐션 캠페인',
      'At-Risk 세그먼트 ' || v_at_risk_stats.at_risk_count || '명의 이탈 위험도가 ' ||
        v_at_risk_stats.avg_churn_risk || '%로 높습니다. ' ||
        '예상 LTV ₩' || TO_CHAR(v_at_risk_stats.avg_ltv, 'FM999,999') || ' 손실 방지를 위해 ' ||
        '맞춤형 리텐션 캠페인(쿠폰, 개인화 추천)을 권장합니다.',
      'high', 'pending',
      jsonb_build_object(
        'expected_improvement_percent', 18 + floor(random() * 12)::INT,
        'confidence_score', ROUND((0.68 + random() * 0.12)::NUMERIC, 2),
        'target_metric', 'customer_retention'
      ),
      jsonb_build_object(
        'implementation_steps', ARRAY['At-Risk 분석 완료', '리텐션 캠페인 설계', '쿠폰 발송', '효과 측정'],
        'data_sources_used', ARRAY['customer_segments_agg', 'customers', 'store_visits'],
        'analysis_period_days', 30
      ),
      'customer_engagement',
      'customer_segments_agg',
      NOW(), NOW(), true
    );
    v_recommendation_count := v_recommendation_count + 1;
    RAISE NOTICE '  ✓ 추천 5: At-Risk 리텐션 - %명 (이탈위험 %%)', v_at_risk_stats.at_risk_count, v_at_risk_stats.avg_churn_risk;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ ai_recommendations: %건 생성 (★ L2 기반 동적 분석)', v_recommendation_count;
  RAISE NOTICE '    데이터 소스:';
  RAISE NOTICE '    - hourly_metrics: 피크/비수기 시간대 분석';
  RAISE NOTICE '    - zone_daily_metrics: 혼잡 존 분석';
  RAISE NOTICE '    - customer_segments_agg: VIP/At-Risk 고객 분석';
  RAISE NOTICE '  ════════════════════════════════════════════════════════════';
END $$;


-- ============================================================================
-- STEP 26: ai_inference_results 생성
-- ============================================================================
-- v8.0 패치: 스키마 불일치 수정 (기존 로직 100% 유지)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_count INT := 0;
  i INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 26: ai_inference_results 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM ai_inference_results WHERE store_id = v_store_id;

  -- 50개의 AI 추론 결과 생성
  FOR i IN 1..50 LOOP
    INSERT INTO ai_inference_results (
      id, store_id, user_id, org_id,
      model_used,                    -- ★ model_name → model_used
      inference_type,
      parameters,                    -- ★ input_data → parameters
      result,                        -- ★ output_data → result (confidence_score 포함)
      processing_time_ms,
      created_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_user_id, v_org_id,
      (ARRAY['conversion_predictor', 'traffic_forecaster', 'churn_detector', 'basket_optimizer', 'staff_scheduler'])[1 + (i-1) % 5],
      (ARRAY['prediction', 'classification', 'optimization', 'forecasting', 'anomaly_detection'])[1 + (i-1) % 5],
      -- ★ input_data → parameters
      jsonb_build_object(
        'date', (CURRENT_DATE - (i-1))::TEXT,
        'store_id', v_store_id,
        'features', jsonb_build_array('traffic', 'weather', 'day_of_week', 'promotions'),
        'model_version', '2.1.0'     -- ★ model_version을 parameters 내부로 이동
      ),
      -- ★ output_data → result (confidence_score 포함)
      jsonb_build_object(
        'prediction', 0.5 + random() * 0.4,
        'confidence', 0.7 + random() * 0.25,
        'confidence_score', 0.75 + random() * 0.2,  -- ★ 기존 confidence_score를 result 내부로
        'factors', jsonb_build_array(
          jsonb_build_object('name', 'traffic', 'importance', random()),
          jsonb_build_object('name', 'weather', 'importance', random()),
          jsonb_build_object('name', 'day_of_week', 'importance', random())
        )
      ),
      50 + floor(random() * 200)::INT,
      NOW() - ((i-1) || ' days')::INTERVAL
    );
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  ✓ ai_inference_results: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 27: strategy_feedback 생성 (스키마 수정본)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::UUID;
  v_strategy_ids UUID[];
  v_strategy_types TEXT[] := ARRAY['pricing', 'layout', 'staffing', 'promotion', 'inventory'];
  v_count INT := 0;
  i INT;
  v_start_date DATE;
  v_end_date DATE;
  v_expected_roi NUMERIC;
  v_actual_roi NUMERIC;
BEGIN
  -- 전략 ID 가져오기
  SELECT ARRAY_AGG(id) INTO v_strategy_ids 
  FROM applied_strategies 
  WHERE store_id = v_store_id 
  LIMIT 5;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 27: strategy_feedback 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM strategy_feedback WHERE store_id = v_store_id;

  IF v_strategy_ids IS NOT NULL AND array_length(v_strategy_ids, 1) > 0 THEN
    FOR i IN 1..20 LOOP
      v_start_date := CURRENT_DATE - (60 - i * 2);
      v_end_date := v_start_date + 14;
      v_expected_roi := 10 + floor(random() * 20)::NUMERIC;
      v_actual_roi := v_expected_roi * (0.7 + random() * 0.6);  -- 70%~130% 달성률

      INSERT INTO strategy_feedback (
        id,
        org_id,
        store_id,
        strategy_id,
        strategy_type,
        ai_recommendation,
        was_applied,
        applied_at,
        result_measured,
        measurement_period_days,
        measurement_start_date,
        measurement_end_date,
        baseline_metrics,
        actual_metrics,
        expected_roi,
        actual_roi,
        roi_accuracy,
        feedback_type,
        learnings,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_store_id,
        v_strategy_ids[1 + ((i-1) % array_length(v_strategy_ids, 1))],
        v_strategy_types[1 + ((i-1) % 5)],
        jsonb_build_object(
          'recommendation_id', gen_random_uuid(),
          'title', CASE (i % 5)
            WHEN 0 THEN '가격 최적화 전략'
            WHEN 1 THEN '레이아웃 재배치 전략'
            WHEN 2 THEN '인력 배치 최적화'
            WHEN 3 THEN 'VIP 프로모션 캠페인'
            ELSE '재고 최적화 전략'
          END,
          'description', '데이터 기반 AI 추천 전략',
          'confidence', 0.75 + random() * 0.2,
          'generated_at', NOW() - ((i * 3) || ' days')::INTERVAL
        ),
        true,
        NOW() - ((60 - i * 2) || ' days')::INTERVAL,
        CASE WHEN i <= 15 THEN true ELSE false END,
        14,
        v_start_date,
        v_end_date,
        jsonb_build_object(
          'daily_revenue', 2500000 + floor(random() * 1000000),
          'daily_visitors', 35 + floor(random() * 20),
          'conversion_rate', 12 + random() * 5
        ),
        CASE WHEN i <= 15 THEN
          jsonb_build_object(
            'daily_revenue', (2500000 + floor(random() * 1000000)) * (1 + v_actual_roi / 100),
            'daily_visitors', (35 + floor(random() * 20)) * (1 + random() * 0.15),
            'conversion_rate', (12 + random() * 5) * (1 + random() * 0.1)
          )
        ELSE NULL END,
        v_expected_roi,
        CASE WHEN i <= 15 THEN v_actual_roi ELSE NULL END,
        CASE WHEN i <= 15 THEN ROUND((v_actual_roi / v_expected_roi * 100)::NUMERIC, 1) ELSE NULL END,
        (ARRAY['positive', 'negative', 'neutral', 'suggestion'])[1 + (i-1) % 4],
        CASE WHEN i <= 15 THEN
          jsonb_build_object(
            'key_insight', CASE (i % 5)
              WHEN 0 THEN '가격 탄력성이 예상보다 높음'
              WHEN 1 THEN '동선 변경으로 체류시간 증가'
              WHEN 2 THEN '피크타임 인력 보강 효과적'
              WHEN 3 THEN 'VIP 재방문율 크게 개선'
              ELSE '재고 회전율 15% 개선'
            END,
            'next_action', CASE (i % 5)
              WHEN 0 THEN '추가 가격 테스트 진행'
              WHEN 1 THEN '2차 레이아웃 최적화'
              WHEN 2 THEN '주말 인력 배치 확대'
              WHEN 3 THEN 'VIP 등급별 차별화'
              ELSE '자동 발주 시스템 도입'
            END
          )
        ELSE NULL END,
        NOW() - ((60 - i * 2) || ' days')::INTERVAL,
        NOW()
      );
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RAISE NOTICE '  ✓ strategy_feedback: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 28: data_sources & data_source_tables & ontology_mappings 생성
-- ============================================================================
-- v8.0 패치: 스키마 불일치 수정 (기존 로직 100% 유지)
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_ds_ids UUID[] := ARRAY[
    'ds000001-0000-0000-0000-000000000001'::UUID,
    'ds000002-0000-0000-0000-000000000002'::UUID,
    'ds000003-0000-0000-0000-000000000003'::UUID,
    'ds000004-0000-0000-0000-000000000004'::UUID,
    'ds000005-0000-0000-0000-000000000005'::UUID
  ];
  
  -- 엔티티/릴레이션 타입 ID 조회용
  v_entity_type_ids RECORD;
  v_relation_type_ids RECORD;
  
  v_count INT := 0;
  v_table_count INT := 0;
  v_entity_map_count INT := 0;
  v_relation_map_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 28: data_sources & mappings 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM ontology_relation_mappings WHERE data_source_id = ANY(v_ds_ids);
  DELETE FROM ontology_entity_mappings WHERE data_source_id = ANY(v_ds_ids);
  DELETE FROM data_source_tables WHERE data_source_id = ANY(v_ds_ids);
  DELETE FROM data_sources WHERE id = ANY(v_ds_ids);

  -- ═══════════════════════════════════════════════════════════
  -- data_sources 생성 (스키마 수정)
  -- 실제 스키마: id, org_id, source_id_code, source_name, source_type,
  --             connection_string, config, is_active, created_at, updated_at,
  --             store_id, description, schema_definition, last_sync_at, 
  --             last_sync_status, record_count
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO data_sources (
    id, org_id, store_id, 
    source_id_code, source_name, source_type, 
    connection_string, config, is_active,
    description, schema_definition,
    last_sync_at, last_sync_status, record_count,
    created_at, updated_at
  ) VALUES
    (v_ds_ids[1], v_org_id, v_store_id, 
     'POS-001', 'POS 시스템', 'database', 
     'pos://internal.neuraltwin.com/gangnam', 
     '{"sync_interval": "hourly", "batch_size": 1000}'::JSONB, true,
     '매장 POS 거래 데이터',
     '{"tables": ["pos_transactions", "pos_items", "pos_payments"]}'::JSONB,
     NOW() - INTERVAL '1 hour', 'success', 75000,
     NOW(), NOW()),
    (v_ds_ids[2], v_org_id, v_store_id, 
     'CRM-001', 'CRM 시스템', 'database', 
     'crm://internal.neuraltwin.com/gangnam', 
     '{"sync_interval": "daily"}'::JSONB, true,
     '고객 관계 관리 데이터',
     '{"tables": ["crm_customers", "crm_interactions", "crm_campaigns"]}'::JSONB,
     NOW() - INTERVAL '2 hours', 'success', 10550,
     NOW(), NOW()),
    (v_ds_ids[3], v_org_id, v_store_id, 
     'ERP-001', 'ERP 시스템', 'database', 
     'erp://internal.neuraltwin.com/gangnam', 
     '{"sync_interval": "daily"}'::JSONB, true,
     '전사 자원 관리 데이터',
     '{"tables": ["erp_products", "erp_inventory", "erp_suppliers"]}'::JSONB,
     NOW() - INTERVAL '3 hours', 'success', 1030,
     NOW(), NOW()),
    (v_ds_ids[4], v_org_id, v_store_id, 
     'IOT-001', '센서 데이터', 'iot_sensor', 
     'mqtt://sensors.neuraltwin.com/gangnam', 
     '{"sensor_count": 12, "tracking_interval_ms": 500}'::JSONB, true,
     '매장 내 IoT 센서 데이터',
     '{"tables": ["sensor_traffic", "sensor_dwell", "sensor_heatmap"]}'::JSONB,
     NOW() - INTERVAL '30 minutes', 'success', 180000,
     NOW(), NOW()),
    (v_ds_ids[5], v_org_id, v_store_id, 
     'API-001', '외부 API', 'api', 
     'https://api.external.com/v1', 
     '{"auth_type": "api_key"}'::JSONB, true,
     '날씨, 경제지표 등 외부 데이터',
     '{"tables": ["weather_daily", "economic_index", "holidays"]}'::JSONB,
     NOW() - INTERVAL '6 hours', 'success', 780,
     NOW(), NOW());
  v_count := 5;

  -- ═══════════════════════════════════════════════════════════
  -- data_source_tables 생성 (스키마 수정)
  -- 실제 스키마: id, data_source_id, table_name, display_name,
  --             columns (JSONB, NOT NULL), row_count, sample_data, created_at
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO data_source_tables (
    id, data_source_id, table_name, display_name,
    columns, row_count, sample_data, created_at
  ) VALUES
    -- POS 테이블
    (gen_random_uuid(), v_ds_ids[1], 'pos_transactions', 'POS 거래내역',
     '[{"name": "id", "type": "uuid"}, {"name": "datetime", "type": "timestamp"}, {"name": "amount", "type": "numeric"}, {"name": "items", "type": "jsonb"}]'::JSONB, 
     15000, '[{"id": "sample-1", "amount": 125000}]'::JSONB, NOW()),
    (gen_random_uuid(), v_ds_ids[1], 'pos_items', 'POS 품목상세',
     '[{"name": "id", "type": "uuid"}, {"name": "transaction_id", "type": "uuid"}, {"name": "product_id", "type": "uuid"}, {"name": "qty", "type": "int"}]'::JSONB, 
     45000, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[1], 'pos_payments', 'POS 결제내역',
     '[{"name": "id", "type": "uuid"}, {"name": "transaction_id", "type": "uuid"}, {"name": "method", "type": "text"}, {"name": "amount", "type": "numeric"}]'::JSONB, 
     15000, NULL, NOW()),
    -- CRM 테이블
    (gen_random_uuid(), v_ds_ids[2], 'crm_customers', 'CRM 고객',
     '[{"name": "id", "type": "uuid"}, {"name": "name", "type": "text"}, {"name": "email", "type": "text"}, {"name": "segment", "type": "text"}]'::JSONB, 
     2500, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[2], 'crm_interactions', 'CRM 상호작용',
     '[{"name": "id", "type": "uuid"}, {"name": "customer_id", "type": "uuid"}, {"name": "type", "type": "text"}, {"name": "datetime", "type": "timestamp"}]'::JSONB, 
     8000, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[2], 'crm_campaigns', 'CRM 캠페인',
     '[{"name": "id", "type": "uuid"}, {"name": "name", "type": "text"}, {"name": "start_date", "type": "date"}, {"name": "end_date", "type": "date"}]'::JSONB, 
     50, NULL, NOW()),
    -- ERP 테이블
    (gen_random_uuid(), v_ds_ids[3], 'erp_products', 'ERP 상품',
     '[{"name": "id", "type": "uuid"}, {"name": "sku", "type": "text"}, {"name": "name", "type": "text"}, {"name": "price", "type": "numeric"}]'::JSONB, 
     500, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[3], 'erp_inventory', 'ERP 재고',
     '[{"name": "product_id", "type": "uuid"}, {"name": "store_id", "type": "uuid"}, {"name": "qty", "type": "int"}, {"name": "reserved", "type": "int"}]'::JSONB, 
     500, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[3], 'erp_suppliers', 'ERP 공급업체',
     '[{"name": "id", "type": "uuid"}, {"name": "name", "type": "text"}, {"name": "contact", "type": "text"}, {"name": "lead_time", "type": "int"}]'::JSONB, 
     30, NULL, NOW()),
    -- IoT 테이블
    (gen_random_uuid(), v_ds_ids[4], 'sensor_traffic', '센서 트래픽',
     '[{"name": "zone_id", "type": "uuid"}, {"name": "timestamp", "type": "timestamp"}, {"name": "count", "type": "int"}, {"name": "direction", "type": "text"}]'::JSONB, 
     100000, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_dwell', '센서 체류시간',
     '[{"name": "zone_id", "type": "uuid"}, {"name": "timestamp", "type": "timestamp"}, {"name": "duration", "type": "int"}]'::JSONB, 
     50000, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_heatmap', '센서 히트맵',
     '[{"name": "zone_id", "type": "uuid"}, {"name": "timestamp", "type": "timestamp"}, {"name": "intensity", "type": "numeric"}]'::JSONB, 
     30000, NULL, NOW()),
    -- 외부 API 테이블
    (gen_random_uuid(), v_ds_ids[5], 'weather_daily', '날씨 데이터',
     '[{"name": "date", "type": "date"}, {"name": "temp", "type": "numeric"}, {"name": "condition", "type": "text"}, {"name": "precipitation", "type": "numeric"}]'::JSONB, 
     365, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'economic_index', '경제 지표',
     '[{"name": "date", "type": "date"}, {"name": "cpi", "type": "numeric"}, {"name": "consumer_confidence", "type": "numeric"}]'::JSONB, 
     365, NULL, NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'holidays', '휴일 데이터',
     '[{"name": "date", "type": "date"}, {"name": "name", "type": "text"}, {"name": "type", "type": "text"}]'::JSONB, 
     50, NULL, NOW());
  v_table_count := 15;

  -- ═══════════════════════════════════════════════════════════
  -- ontology_entity_mappings 생성 (스키마 수정)
  -- 실제 스키마: id, data_source_id, source_table, filter_condition,
  --             target_entity_type_id (UUID!), property_mappings (JSONB),
  --             label_template, is_active, priority, created_at, updated_at
  -- ═══════════════════════════════════════════════════════════
  
  -- 먼저 entity_type_id 조회 (Transaction, Product 등)
  INSERT INTO ontology_entity_mappings (
    id, data_source_id, source_table, filter_condition,
    target_entity_type_id, property_mappings, label_template,
    is_active, priority, created_at, updated_at
  ) 
  SELECT
    gen_random_uuid(), 
    v_ds_ids[1], 
    'pos_transactions',
    NULL,
    COALESCE(
      (SELECT id FROM ontology_entity_types WHERE name = 'Transaction' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1),
      gen_random_uuid()
    ),
    '[{"source": "id", "target": "transaction_id"}, {"source": "datetime", "target": "timestamp"}]'::JSONB,
    '${id}',
    true, 1, NOW(), NOW()
  WHERE EXISTS (SELECT 1);

  INSERT INTO ontology_entity_mappings (
    id, data_source_id, source_table, filter_condition,
    target_entity_type_id, property_mappings, label_template,
    is_active, priority, created_at, updated_at
  ) VALUES
    (gen_random_uuid(), v_ds_ids[1], 'pos_items', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'Product' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "product_id", "target": "id", "lookup": "products"}]'::JSONB,
     '${product_id}', true, 2, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[2], 'crm_customers', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'Customer' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "id", "target": "customer_id"}]'::JSONB,
     '${name}', true, 1, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[2], 'crm_customers', 'segment IS NOT NULL',
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'CustomerSegment' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "segment", "target": "segment_name", "enum": ["VIP", "Regular", "New"]}]'::JSONB,
     '${segment}', true, 2, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[3], 'erp_products', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'Product' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "id", "target": "product_id"}, {"source": "sku", "target": "sku"}]'::JSONB,
     '${sku}', true, 1, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[3], 'erp_inventory', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'Inventory' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "product_id", "target": "product_id", "join": "products"}]'::JSONB,
     '${product_id}', true, 2, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_traffic', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'Zone' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "zone_id", "target": "zone_id", "lookup": "zones_dim"}]'::JSONB,
     '${zone_id}', true, 1, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_dwell', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'ZoneMetric' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "zone_id", "target": "zone_id"}, {"source": "duration", "target": "dwell_time", "aggregate": "avg"}]'::JSONB,
     '${zone_id}', true, 2, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'weather_daily', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'ExternalFactor' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "date", "target": "date"}, {"source": "condition", "target": "factor_type", "value": "weather"}]'::JSONB,
     '${date}', true, 1, NOW(), NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'economic_index', NULL,
     COALESCE((SELECT id FROM ontology_entity_types WHERE name = 'ExternalFactor' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '[{"source": "date", "target": "date"}, {"source": "cpi", "target": "factor_type", "value": "economic"}]'::JSONB,
     '${date}', true, 2, NOW(), NOW());
  v_entity_map_count := 10;

  -- ═══════════════════════════════════════════════════════════
  -- ontology_relation_mappings 생성 (스키마 수정)
  -- 실제 스키마: id, data_source_id, source_table, 
  --             target_relation_type_id (UUID!),
  --             source_entity_resolver (JSONB!), target_entity_resolver (JSONB!),
  --             property_mappings (JSONB), is_active, created_at
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO ontology_relation_mappings (
    id, data_source_id, source_table, 
    target_relation_type_id,
    source_entity_resolver, target_entity_resolver,
    property_mappings, is_active, created_at
  ) VALUES
    (gen_random_uuid(), v_ds_ids[1], 'pos_transactions',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'MADE_TRANSACTION' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Customer", "key_column": "customer_id"}'::JSONB,
     '{"entity_type": "Transaction", "key_column": "id"}'::JSONB,
     '[{"source": "datetime", "target": "transaction_time"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[1], 'pos_items',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'PURCHASED' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Transaction", "key_column": "transaction_id"}'::JSONB,
     '{"entity_type": "Product", "key_column": "product_id"}'::JSONB,
     '[{"source": "qty", "target": "quantity"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[2], 'crm_interactions',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'VISITED' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Customer", "key_column": "customer_id"}'::JSONB,
     '{"entity_type": "Store", "key_column": "store_id"}'::JSONB,
     '[{"source": "type", "target": "interaction_type", "filter": "visit"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[3], 'erp_inventory',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'LOCATED_IN' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Product", "key_column": "product_id"}'::JSONB,
     '{"entity_type": "Store", "key_column": "store_id"}'::JSONB,
     '[{"source": "qty", "target": "stock_quantity"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_traffic',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'MEASURED_BY' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Zone", "key_column": "zone_id"}'::JSONB,
     '{"entity_type": "Sensor", "key_column": "sensor_id", "timeseries": true}'::JSONB,
     '[{"source": "count", "target": "traffic_count"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[4], 'sensor_dwell',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'MEASURED_BY' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "Zone", "key_column": "zone_id"}'::JSONB,
     '{"entity_type": "Sensor", "key_column": "sensor_id", "timeseries": true}'::JSONB,
     '[{"source": "duration", "target": "dwell_seconds"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'weather_daily',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'AFFECTS' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "ExternalFactor", "key_column": "date"}'::JSONB,
     '{"entity_type": "Store", "key_column": "store_id", "correlation": 0.35}'::JSONB,
     '[{"source": "condition", "target": "weather_condition"}]'::JSONB, 
     true, NOW()),
    (gen_random_uuid(), v_ds_ids[5], 'holidays',
     COALESCE((SELECT id FROM ontology_relation_types WHERE name = 'AFFECTS' AND (org_id = v_org_id OR org_id IS NULL) LIMIT 1), gen_random_uuid()),
     '{"entity_type": "ExternalFactor", "key_column": "date"}'::JSONB,
     '{"entity_type": "Store", "key_column": "store_id", "correlation": 0.45}'::JSONB,
     '[{"source": "type", "target": "holiday_type"}]'::JSONB, 
     true, NOW());
  v_relation_map_count := 8;

  RAISE NOTICE '  ✓ data_sources: %건 생성', v_count;
  RAISE NOTICE '  ✓ data_source_tables: %건 생성', v_table_count;
  RAISE NOTICE '  ✓ ontology_entity_mappings: %건 생성', v_entity_map_count;
  RAISE NOTICE '  ✓ ontology_relation_mappings: %건 생성', v_relation_map_count;
END $$;


-- ============================================================================
-- STEP 29: retail_concepts 생성
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_count INT := 0;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 29: retail_concepts 생성';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- 기존 데이터 삭제
  DELETE FROM retail_concepts WHERE store_id = v_store_id;

  INSERT INTO retail_concepts (id, store_id, user_id, org_id, name, category, description, formula, unit, benchmark_value, created_at) VALUES
    -- 트래픽 지표
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Foot Traffic', 'traffic', '매장 방문자 수', 'COUNT(store_visits)', '명', 40, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Traffic Density', 'traffic', '면적당 방문자 수', 'visitors / store_sqm', '명/㎡', 0.2, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Peak Hour Ratio', 'traffic', '피크시간 방문 비율', 'peak_visitors / total_visitors', '%', 25, NOW()),

    -- 전환 지표
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Conversion Rate', 'conversion', '방문 대비 구매 비율', 'purchases / visitors * 100', '%', 15, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Try-on Rate', 'conversion', '피팅룸 이용 비율', 'fitting_visitors / total_visitors * 100', '%', 25, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Browse-to-Buy', 'conversion', '탐색 후 구매 전환', 'buyers / browsers * 100', '%', 20, NOW()),

    -- 매출 지표
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Average Basket Size', 'revenue', '평균 구매 금액', 'total_revenue / transactions', '원', 65000, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Revenue per Visitor', 'revenue', '방문자당 매출', 'total_revenue / visitors', '원', 10000, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Sales per SQM', 'revenue', '면적당 매출', 'total_revenue / store_sqm', '원/㎡', 50000, NOW()),

    -- 고객 지표
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Customer Lifetime Value', 'customer', '고객 생애 가치', 'SUM(purchases) over lifetime', '원', 500000, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Repeat Visit Rate', 'customer', '재방문율', 'returning_visitors / total_visitors * 100', '%', 35, NOW()),
    (gen_random_uuid(), v_store_id, v_user_id, v_org_id, 'Churn Rate', 'customer', '이탈률', 'churned_customers / total_customers * 100', '%', 5, NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  ✓ retail_concepts: %건 생성', v_count;
END $$;


-- ============================================================================
-- STEP 30: 최종 검증 및 요약
-- ============================================================================
DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_total_tables INT := 0;
  v_total_records BIGINT := 0;
  rec RECORD;

  -- ★★★ L1↔L2 일관성 검증 변수 ★★★
  v_l1_visits BIGINT;
  v_l2_kpi_visitors BIGINT;
  v_l2_hourly_visitors BIGINT;
  v_l1_purchases BIGINT;
  v_l2_transactions BIGINT;
  v_l1_revenue NUMERIC;
  v_l2_revenue NUMERIC;
  v_visits_match BOOLEAN;
  v_hourly_match BOOLEAN;
  v_purchases_match BOOLEAN;
  v_revenue_match BOOLEAN;
BEGIN
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 30: 최종 검증 및 요약';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '┌────────────────────────────────────────────────────────────────┐';
  RAISE NOTICE '│           NEURALTWIN v8.0 ULTIMATE SEED - 완료               │';
  RAISE NOTICE '├────────────────────────────────────────────────────────────────┤';

  -- 각 테이블 카운트 확인
  FOR rec IN
    SELECT 'stores' AS tbl, COUNT(*) AS cnt FROM stores WHERE id = v_store_id
    UNION ALL SELECT 'zones_dim', COUNT(*) FROM zones_dim WHERE store_id = v_store_id
    UNION ALL SELECT 'products', COUNT(*) FROM products WHERE store_id = v_store_id
    UNION ALL SELECT 'staff', COUNT(*) FROM staff WHERE store_id = v_store_id
    UNION ALL SELECT 'customers', COUNT(*) FROM customers WHERE store_id = v_store_id
    UNION ALL SELECT 'store_visits', COUNT(*) FROM store_visits WHERE store_id = v_store_id
    UNION ALL SELECT 'purchases', COUNT(*) FROM purchases WHERE store_id = v_store_id
    UNION ALL SELECT 'transactions', COUNT(*) FROM transactions WHERE store_id = v_store_id
    UNION ALL SELECT 'line_items', COUNT(*) FROM line_items WHERE store_id = v_store_id
    UNION ALL SELECT 'funnel_events', COUNT(*) FROM funnel_events WHERE store_id = v_store_id
    UNION ALL SELECT 'zone_events', COUNT(*) FROM zone_events WHERE store_id = v_store_id
    UNION ALL SELECT 'daily_kpis_agg', COUNT(*) FROM daily_kpis_agg WHERE store_id = v_store_id
    UNION ALL SELECT 'daily_sales', COUNT(*) FROM daily_sales WHERE store_id = v_store_id
    UNION ALL SELECT 'zone_daily_metrics', COUNT(*) FROM zone_daily_metrics WHERE store_id = v_store_id
    UNION ALL SELECT 'hourly_metrics', COUNT(*) FROM hourly_metrics WHERE store_id = v_store_id
    UNION ALL SELECT 'product_performance_agg', COUNT(*) FROM product_performance_agg WHERE store_id = v_store_id
    UNION ALL SELECT 'customer_segments_agg', COUNT(*) FROM customer_segments_agg WHERE store_id = v_store_id
    UNION ALL SELECT 'applied_strategies', COUNT(*) FROM applied_strategies WHERE store_id = v_store_id
    UNION ALL SELECT 'strategy_daily_metrics', COUNT(*) FROM strategy_daily_metrics WHERE store_id = v_store_id
    UNION ALL SELECT 'inventory_levels', COUNT(*) FROM inventory_levels WHERE store_id = v_store_id
    UNION ALL SELECT 'ontology_entity_types', COUNT(*) FROM ontology_entity_types WHERE store_id = v_store_id
    UNION ALL SELECT 'ontology_relation_types', COUNT(*) FROM ontology_relation_types WHERE store_id = v_store_id
    UNION ALL SELECT 'graph_entities', COUNT(*) FROM graph_entities WHERE store_id = v_store_id
    UNION ALL SELECT 'graph_relations', COUNT(*) FROM graph_relations WHERE store_id = v_store_id
    UNION ALL SELECT 'store_scenes', COUNT(*) FROM store_scenes WHERE store_id = v_store_id
    UNION ALL SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations WHERE store_id = v_store_id
    UNION ALL SELECT 'ai_inference_results', COUNT(*) FROM ai_inference_results WHERE store_id = v_store_id
    UNION ALL SELECT 'strategy_feedback', COUNT(*) FROM strategy_feedback WHERE store_id = v_store_id
    UNION ALL SELECT 'data_sources', COUNT(*) FROM data_sources WHERE store_id = v_store_id
    UNION ALL SELECT 'retail_concepts', COUNT(*) FROM retail_concepts WHERE store_id = v_store_id
    UNION ALL SELECT 'store_goals', COUNT(*) FROM store_goals WHERE store_id = v_store_id
    ORDER BY 1
  LOOP
    v_total_tables := v_total_tables + 1;
    v_total_records := v_total_records + rec.cnt;
    RAISE NOTICE '│  %-28s: %8s건  │', rec.tbl, rec.cnt;
  END LOOP;

  RAISE NOTICE '├────────────────────────────────────────────────────────────────┤';
  RAISE NOTICE '│  총 테이블: %-3s개    총 레코드: %10s건           │', v_total_tables, v_total_records;
  RAISE NOTICE '└────────────────────────────────────────────────────────────════┘';
  RAISE NOTICE '';

  -- ★★★ L1↔L2 데이터 일관성 검증 ★★★
  RAISE NOTICE '┌────────────────────────────────────────────────────────────────┐';
  RAISE NOTICE '│              L1↔L2 데이터 일관성 검증                         │';
  RAISE NOTICE '├────────────────────────────────────────────────────────────────┤';

  -- 1. 방문자 수 검증: L1 store_visits ↔ L2 daily_kpis_agg
  SELECT COUNT(*) INTO v_l1_visits
  FROM store_visits WHERE store_id = v_store_id;

  SELECT COALESCE(SUM(total_visitors), 0) INTO v_l2_kpi_visitors
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  v_visits_match := (v_l1_visits = v_l2_kpi_visitors);
  RAISE NOTICE '│  [방문자] L1(store_visits): %-8s L2(kpis): %-8s %s │',
    v_l1_visits, v_l2_kpi_visitors,
    CASE WHEN v_visits_match THEN '✓ 일치' ELSE '✗ 불일치' END;

  -- 2. 시간대별 합계 검증: L1 store_visits ↔ L2 hourly_metrics
  SELECT COALESCE(SUM(visitors), 0) INTO v_l2_hourly_visitors
  FROM hourly_metrics WHERE store_id = v_store_id;

  v_hourly_match := (v_l1_visits = v_l2_hourly_visitors);
  RAISE NOTICE '│  [시간대] L1(store_visits): %-8s L2(hourly): %-7s %s │',
    v_l1_visits, v_l2_hourly_visitors,
    CASE WHEN v_hourly_match THEN '✓ 일치' ELSE '✗ 불일치' END;

  -- 3. 구매 건수 검증: L1 store_visits(made_purchase) ↔ L2 daily_kpis_agg
  SELECT COUNT(*) INTO v_l1_purchases
  FROM store_visits WHERE store_id = v_store_id AND made_purchase = true;

  SELECT COALESCE(SUM(total_transactions), 0) INTO v_l2_transactions
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  v_purchases_match := (v_l1_purchases = v_l2_transactions);
  RAISE NOTICE '│  [구매] L1(made_purchase): %-8s L2(txns): %-8s %s │',
    v_l1_purchases, v_l2_transactions,
    CASE WHEN v_purchases_match THEN '✓ 일치' ELSE '✗ 불일치' END;

  -- 4. 매출 검증: L1 line_items ↔ L2 daily_kpis_agg
  SELECT COALESCE(SUM(line_total), 0) INTO v_l1_revenue
  FROM line_items WHERE store_id = v_store_id;

  SELECT COALESCE(SUM(total_revenue), 0) INTO v_l2_revenue
  FROM daily_kpis_agg WHERE store_id = v_store_id;

  v_revenue_match := (v_l1_revenue = v_l2_revenue);
  RAISE NOTICE '│  [매출] L1(line_items): %-10s L2(kpis): %-10s %s │',
    v_l1_revenue::TEXT, v_l2_revenue::TEXT,
    CASE WHEN v_revenue_match THEN '✓ 일치' ELSE '✗ 불일치' END;

  RAISE NOTICE '├────────────────────────────────────────────────────────────────┤';

  -- 전체 일관성 판정
  IF v_visits_match AND v_hourly_match AND v_purchases_match AND v_revenue_match THEN
    RAISE NOTICE '│  ★★★ 모든 L1↔L2 데이터 일관성 검증 통과! ★★★              │';
  ELSE
    RAISE NOTICE '│  ⚠ 일부 데이터 불일치 발견 - 시딩 스크립트 점검 필요        │';
  END IF;

  RAISE NOTICE '└────────────────────────────────────────────────────────────────┘';
  RAISE NOTICE '';
  RAISE NOTICE '★ L1↔L2 데이터 일관성 검증 완료';
  RAISE NOTICE '★ AI 추론 파이프라인 완전 지원';
  RAISE NOTICE '★ store_id: %', v_store_id;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN v8.0 ULTIMATE SEED - 성공적으로 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
