-- ============================================================================
-- NEURALTWIN v8.6 SEED_05: 그래프/AI 데이터
-- ============================================================================
-- 실행 순서: SEED_04 이후
-- 목적: graph_entities(~120), graph_relations(~200), data_source_tables(15),
--       ontology_entity_mappings(30), applied_strategies(10),
--       strategy_daily_metrics(90), strategy_feedback(10),
--       ai_recommendations(20), ai_inference_results(10) 시딩
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
  v_furniture_ids UUID[];
  v_entity_type_ids UUID[];
  v_relation_type_ids UUID[];
  v_data_source_ids UUID[];
  v_entity_id UUID;
  v_source_entity_id UUID;
  v_target_entity_id UUID;
  v_strategy_id UUID;
  v_strategy_ids UUID[] := ARRAY[]::UUID[];
  v_i INT;
  v_day INT;
  v_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_05: 그래프/AI 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  -- 필요한 ID 배열들 가져오기
  SELECT ARRAY_AGG(id ORDER BY zone_code) INTO v_zone_ids FROM zones_dim WHERE store_id = v_store_id;
  SELECT ARRAY_AGG(id) INTO v_product_ids FROM products WHERE store_id = v_store_id;
  SELECT ARRAY_AGG(id) INTO v_customer_ids FROM (SELECT id FROM customers WHERE store_id = v_store_id LIMIT 100) sub;
  SELECT ARRAY_AGG(id) INTO v_furniture_ids FROM (SELECT id FROM furniture WHERE store_id = v_store_id LIMIT 50) sub;
  SELECT ARRAY_AGG(id) INTO v_entity_type_ids FROM ontology_entity_types LIMIT 10;
  SELECT ARRAY_AGG(id) INTO v_relation_type_ids FROM ontology_relation_types LIMIT 10;
  SELECT ARRAY_AGG(id) INTO v_data_source_ids FROM data_sources WHERE store_id = v_store_id;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 10.1: graph_entities (~120개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 10.1] graph_entities 시딩 (~120개)...';

  -- Store 엔티티 (1개)
  INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id,
          v_entity_type_ids[1], 'STORE-001', 'NeuralTwin Demo Store',
          '{"type":"retail_store","size":"medium","floor_count":1}'::jsonb, true, NOW(), NOW());

  -- Zone 엔티티 (7개)
  FOR v_i IN 1..7 LOOP
    INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id,
            v_entity_type_ids[LEAST(2, ARRAY_LENGTH(v_entity_type_ids, 1))],
            'ZONE-' || LPAD(v_i::TEXT, 3, '0'),
            (ARRAY['입구','메인홀','의류존','액세서리존','피팅룸','계산대','휴식공간'])[v_i],
            jsonb_build_object('zone_id', v_zone_ids[v_i], 'index', v_i),
            true, NOW(), NOW());
  END LOOP;

  -- Product 엔티티 (25개)
  FOR v_i IN 1..ARRAY_LENGTH(v_product_ids, 1) LOOP
    INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at)
    SELECT gen_random_uuid(), v_store_id, v_org_id, v_user_id,
           v_entity_type_ids[LEAST(3, ARRAY_LENGTH(v_entity_type_ids, 1))],
           'PROD-' || LPAD(v_i::TEXT, 3, '0'),
           p.product_name,
           jsonb_build_object('sku', p.sku, 'category', p.category, 'price', p.price),
           true, NOW(), NOW()
    FROM products p WHERE p.id = v_product_ids[v_i];
  END LOOP;

  -- Furniture 엔티티 (50개)
  FOR v_i IN 1..LEAST(50, COALESCE(ARRAY_LENGTH(v_furniture_ids, 1), 0)) LOOP
    INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at)
    SELECT gen_random_uuid(), v_store_id, v_org_id, v_user_id,
           v_entity_type_ids[LEAST(4, ARRAY_LENGTH(v_entity_type_ids, 1))],
           'FURN-' || LPAD(v_i::TEXT, 3, '0'),
           f.furniture_name,
           jsonb_build_object('furniture_type', f.furniture_type, 'category', f.category),
           true, NOW(), NOW()
    FROM furniture f WHERE f.id = v_furniture_ids[v_i];
  END LOOP;

  -- Customer Segment 엔티티 (4개)
  INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_entity_type_ids[LEAST(5, ARRAY_LENGTH(v_entity_type_ids, 1))], 'SEG-VIP', 'VIP 고객', '{"tier":"PLATINUM","min_spent":2000000}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_entity_type_ids[LEAST(5, ARRAY_LENGTH(v_entity_type_ids, 1))], 'SEG-REG', '일반 고객', '{"tier":"GOLD","min_spent":300000}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_entity_type_ids[LEAST(5, ARRAY_LENGTH(v_entity_type_ids, 1))], 'SEG-NEW', '신규 고객', '{"tier":"SILVER","max_visits":3}'::jsonb, true, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_entity_type_ids[LEAST(5, ARRAY_LENGTH(v_entity_type_ids, 1))], 'SEG-DOR', '휴면 고객', '{"tier":"BRONZE","inactive_days":90}'::jsonb, true, NOW(), NOW());

  -- Sample Customer 엔티티 (30개)
  FOR v_i IN 1..LEAST(30, COALESCE(ARRAY_LENGTH(v_customer_ids, 1), 0)) LOOP
    INSERT INTO graph_entities (id, store_id, org_id, user_id, entity_type_id, entity_code, entity_name, properties, is_active, created_at, updated_at)
    SELECT gen_random_uuid(), v_store_id, v_org_id, v_user_id,
           v_entity_type_ids[LEAST(6, ARRAY_LENGTH(v_entity_type_ids, 1))],
           'CUST-' || LPAD(v_i::TEXT, 4, '0'),
           c.customer_name,
           jsonb_build_object('segment', c.segment, 'tier', c.tier, 'total_spent', c.total_spent),
           true, NOW(), NOW()
    FROM customers c WHERE c.id = v_customer_ids[v_i];
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM graph_entities WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ graph_entities: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 10.2: graph_relations (~200개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 10.2] graph_relations 시딩 (~200개)...';

  -- Store - contains -> Zone 관계 (7개)
  FOR v_source_entity_id IN SELECT id FROM graph_entities WHERE store_id = v_store_id AND entity_code = 'STORE-001' LOOP
    FOR v_target_entity_id IN SELECT id FROM graph_entities WHERE store_id = v_store_id AND entity_code LIKE 'ZONE-%' LOOP
      INSERT INTO graph_relations (id, store_id, org_id, user_id, source_entity_id, target_entity_id, relation_type_id, relation_name, properties, weight, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_source_entity_id, v_target_entity_id,
              v_relation_type_ids[1], 'contains', '{"spatial":true}'::jsonb, 1.0, true, NOW(), NOW());
    END LOOP;
  END LOOP;

  -- Zone - displays -> Product 관계 (~50개)
  FOR v_source_entity_id IN SELECT id FROM graph_entities WHERE store_id = v_store_id AND entity_code IN ('ZONE-003', 'ZONE-004') LOOP
    FOR v_target_entity_id IN SELECT id FROM graph_entities WHERE store_id = v_store_id AND entity_code LIKE 'PROD-%' LIMIT 25 LOOP
      IF RANDOM() < 0.4 THEN
        INSERT INTO graph_relations (id, store_id, org_id, user_id, source_entity_id, target_entity_id, relation_type_id, relation_name, properties, weight, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_source_entity_id, v_target_entity_id,
                v_relation_type_ids[LEAST(2, ARRAY_LENGTH(v_relation_type_ids, 1))], 'displays', '{"visible":true}'::jsonb, 0.8 + RANDOM() * 0.2, true, NOW(), NOW());
      END IF;
    END LOOP;
  END LOOP;

  -- Zone - has_furniture -> Furniture 관계 (~50개)
  FOR v_i IN 1..LEAST(50, COALESCE(ARRAY_LENGTH(v_furniture_ids, 1), 0)) LOOP
    SELECT id INTO v_source_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code LIKE 'ZONE-%' LIMIT 1 OFFSET (v_i % 7);
    SELECT id INTO v_target_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code = 'FURN-' || LPAD(v_i::TEXT, 3, '0');
    IF v_source_entity_id IS NOT NULL AND v_target_entity_id IS NOT NULL THEN
      INSERT INTO graph_relations (id, store_id, org_id, user_id, source_entity_id, target_entity_id, relation_type_id, relation_name, properties, weight, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_source_entity_id, v_target_entity_id,
              v_relation_type_ids[LEAST(3, ARRAY_LENGTH(v_relation_type_ids, 1))], 'has_furniture', '{}'::jsonb, 1.0, true, NOW(), NOW());
    END IF;
  END LOOP;

  -- Customer - belongs_to -> Segment 관계 (~30개)
  FOR v_i IN 1..30 LOOP
    SELECT id INTO v_source_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code = 'CUST-' || LPAD(v_i::TEXT, 4, '0');
    SELECT id INTO v_target_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code IN ('SEG-VIP', 'SEG-REG', 'SEG-NEW', 'SEG-DOR') LIMIT 1 OFFSET (v_i % 4);
    IF v_source_entity_id IS NOT NULL AND v_target_entity_id IS NOT NULL THEN
      INSERT INTO graph_relations (id, store_id, org_id, user_id, source_entity_id, target_entity_id, relation_type_id, relation_name, properties, weight, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_source_entity_id, v_target_entity_id,
              v_relation_type_ids[LEAST(4, ARRAY_LENGTH(v_relation_type_ids, 1))], 'belongs_to', '{}'::jsonb, 1.0, true, NOW(), NOW());
    END IF;
  END LOOP;

  -- Product - similar_to -> Product 관계 (~40개)
  FOR v_i IN 1..40 LOOP
    SELECT id INTO v_source_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code LIKE 'PROD-%' LIMIT 1 OFFSET (v_i % 25);
    SELECT id INTO v_target_entity_id FROM graph_entities WHERE store_id = v_store_id AND entity_code LIKE 'PROD-%' LIMIT 1 OFFSET ((v_i + 5) % 25);
    IF v_source_entity_id IS NOT NULL AND v_target_entity_id IS NOT NULL AND v_source_entity_id != v_target_entity_id THEN
      INSERT INTO graph_relations (id, store_id, org_id, user_id, source_entity_id, target_entity_id, relation_type_id, relation_name, properties, weight, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_source_entity_id, v_target_entity_id,
              v_relation_type_ids[LEAST(5, ARRAY_LENGTH(v_relation_type_ids, 1))], 'similar_to', '{"category_match":true}'::jsonb, 0.5 + RANDOM() * 0.5, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM graph_relations WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ graph_relations: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 11.1: data_source_tables (15개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 11.1] data_source_tables 시딩 (15개)...';

  IF v_data_source_ids IS NOT NULL AND ARRAY_LENGTH(v_data_source_ids, 1) > 0 THEN
    INSERT INTO data_source_tables (id, org_id, data_source_id, table_name, schema_info, row_count, last_updated, created_at) VALUES
    -- POS 시스템 테이블들
    (gen_random_uuid(), v_org_id, v_data_source_ids[1], 'pos_transactions', '{"columns":["id","amount","timestamp","product_id"]}'::jsonb, 50000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[1], 'pos_line_items', '{"columns":["id","transaction_id","product_id","quantity","price"]}'::jsonb, 120000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[1], 'pos_refunds', '{"columns":["id","transaction_id","reason","amount"]}'::jsonb, 2000, NOW(), NOW()),
    -- WiFi 트래킹 테이블들
    (gen_random_uuid(), v_org_id, v_data_source_ids[2], 'wifi_sessions', '{"columns":["id","mac_hash","start_time","end_time","zone_id"]}'::jsonb, 80000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[2], 'wifi_zone_events', '{"columns":["id","session_id","zone_id","event_type","timestamp"]}'::jsonb, 200000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[2], 'wifi_heatmap', '{"columns":["id","zone_id","hour","density"]}'::jsonb, 5000, NOW(), NOW()),
    -- 비콘 시스템 테이블들
    (gen_random_uuid(), v_org_id, v_data_source_ids[3], 'beacon_detections', '{"columns":["id","beacon_id","device_id","rssi","timestamp"]}'::jsonb, 150000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[3], 'beacon_zones', '{"columns":["id","beacon_id","zone_id","position"]}'::jsonb, 50, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[3], 'beacon_interactions', '{"columns":["id","detection_id","interaction_type","duration"]}'::jsonb, 30000, NOW(), NOW()),
    -- CCTV 분석 테이블들
    (gen_random_uuid(), v_org_id, v_data_source_ids[4], 'camera_counts', '{"columns":["id","camera_id","timestamp","in_count","out_count"]}'::jsonb, 10000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[4], 'camera_demographics', '{"columns":["id","timestamp","zone_id","age_group","gender"]}'::jsonb, 50000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[4], 'camera_heatmap', '{"columns":["id","timestamp","zone_id","density_map"]}'::jsonb, 8000, NOW(), NOW()),
    -- CRM 시스템 테이블들
    (gen_random_uuid(), v_org_id, v_data_source_ids[5], 'crm_customers', '{"columns":["id","name","email","segment","lifetime_value"]}'::jsonb, 5000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[5], 'crm_interactions', '{"columns":["id","customer_id","channel","type","timestamp"]}'::jsonb, 25000, NOW(), NOW()),
    (gen_random_uuid(), v_org_id, v_data_source_ids[5], 'crm_campaigns', '{"columns":["id","name","segment_target","start_date","end_date"]}'::jsonb, 100, NOW(), NOW());
  END IF;

  SELECT COUNT(*) INTO v_count FROM data_source_tables WHERE org_id = v_org_id;
  RAISE NOTICE '    ✓ data_source_tables: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 12.1: applied_strategies (10개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 12.1] applied_strategies 시딩 (10개)...';

  INSERT INTO applied_strategies (id, store_id, org_id, user_id, source, source_module, name, description, settings, start_date, end_date, expected_roi, target_roi, current_roi, baseline_metrics, status, result, created_at, updated_at)
  VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'layout_optimizer', '의류존 레이아웃 최적화', '의류존 행거 배치 최적화를 통한 동선 개선', '{"zone":"Z003","furniture_changes":3}'::jsonb, CURRENT_DATE - 60, CURRENT_DATE - 30, 12.5, 15.0, 11.8, '{"baseline_conversion":45.2,"baseline_dwell":8.5}'::jsonb, 'completed', 'success', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'product_placement', '신상품 전면 배치', '신상품을 입구 근처로 이동하여 노출 증가', '{"products":["SKU-OUT-003","SKU-TOP-002"]}'::jsonb, CURRENT_DATE - 45, CURRENT_DATE - 15, 8.0, 10.0, 9.2, '{"baseline_views":120,"baseline_sales":15}'::jsonb, 'completed', 'success', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'cross_sell', '악세서리 크로스셀링', '의류 구매 고객에게 악세서리 추천', '{"trigger_zone":"Z003","recommend_zone":"Z004"}'::jsonb, CURRENT_DATE - 30, CURRENT_DATE, 15.0, 18.0, 14.2, '{"baseline_basket_size":1.8}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'manual', 'promotion', 'VIP 전용 프로모션', 'VIP 고객 대상 10% 추가 할인', '{"discount":10,"segment":"VIP"}'::jsonb, CURRENT_DATE - 14, CURRENT_DATE + 16, 20.0, 25.0, 18.5, '{"baseline_vip_spend":250000}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'staff_scheduling', '피크타임 인력 배치', '피크 시간대 계산대 인력 증원', '{"peak_hours":[14,15,16,17],"additional_staff":1}'::jsonb, CURRENT_DATE - 21, CURRENT_DATE - 7, 5.0, 8.0, 6.5, '{"baseline_wait_time":4.2}'::jsonb, 'completed', 'partial', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'inventory', '재고 자동 발주', '판매 예측 기반 자동 재고 발주', '{"products":["SKU-TOP-001","SKU-BTM-001"],"threshold":10}'::jsonb, CURRENT_DATE - 7, CURRENT_DATE + 23, 10.0, 12.0, 8.5, '{"baseline_stockout_rate":5.2}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'pricing', '동적 가격 조정', '수요 기반 동적 가격 조정', '{"category":"아우터","adjustment_range":[-10,10]}'::jsonb, CURRENT_DATE - 10, CURRENT_DATE + 20, 8.0, 10.0, 7.2, '{"baseline_margin":35.5}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'manual', 'display', '시즌 디스플레이 변경', '겨울 시즌 아우터 전면 디스플레이', '{"season":"winter","zone":"Z002"}'::jsonb, CURRENT_DATE - 5, CURRENT_DATE + 25, 12.0, 15.0, 10.0, '{"baseline_outerwear_sales":85}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'customer_flow', '동선 유도 개선', '입구에서 의류존 직행 동선 유도', '{"from_zone":"Z001","to_zone":"Z003"}'::jsonb, CURRENT_DATE - 3, CURRENT_DATE + 27, 6.0, 8.0, 5.5, '{"baseline_z003_traffic":65}'::jsonb, 'active', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'ai', 'upsell', '업셀링 캠페인', '기본 상품 구매자에게 프리미엄 상품 추천', '{"base_price_max":100000,"premium_price_min":150000}'::jsonb, CURRENT_DATE - 2, CURRENT_DATE + 28, 18.0, 22.0, 15.0, '{"baseline_aov":145000}'::jsonb, 'active', NULL, NOW(), NOW());

  SELECT ARRAY_AGG(id) INTO v_strategy_ids FROM applied_strategies WHERE store_id = v_store_id;
  RAISE NOTICE '    ✓ applied_strategies: 10건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 12.2: strategy_daily_metrics (90일 × 10 전략 = 샘플)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 12.2] strategy_daily_metrics 시딩...';

  FOR v_day IN 0..89 LOOP
    FOR v_i IN 1..LEAST(10, COALESCE(ARRAY_LENGTH(v_strategy_ids, 1), 0)) LOOP
      -- 해당 전략이 해당 날짜에 활성화되어 있었는지 확인하고 삽입
      INSERT INTO strategy_daily_metrics (
        id, strategy_id, metric_date, impressions, conversions, revenue_impact,
        roi_contribution, created_at
      )
      SELECT
        gen_random_uuid(),
        v_strategy_ids[v_i],
        CURRENT_DATE - v_day,
        100 + FLOOR(RANDOM() * 200)::INT,
        10 + FLOOR(RANDOM() * 40)::INT,
        50000 + FLOOR(RANDOM() * 100000)::NUMERIC,
        0.5 + RANDOM() * 2.0,
        NOW()
      WHERE CURRENT_DATE - v_day BETWEEN
            (SELECT start_date FROM applied_strategies WHERE id = v_strategy_ids[v_i]) AND
            COALESCE((SELECT end_date FROM applied_strategies WHERE id = v_strategy_ids[v_i]), CURRENT_DATE);
    END LOOP;
  END LOOP;

  SELECT COUNT(*) INTO v_count FROM strategy_daily_metrics;
  RAISE NOTICE '    ✓ strategy_daily_metrics: % 건 삽입', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 12.3: strategy_feedback (10개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 12.3] strategy_feedback 시딩 (10개)...';

  FOR v_i IN 1..LEAST(10, COALESCE(ARRAY_LENGTH(v_strategy_ids, 1), 0)) LOOP
    INSERT INTO strategy_feedback (
      id, store_id, org_id, user_id, strategy_id, feedback_type, rating,
      feedback_text, actual_results, expected_vs_actual, suggestions,
      created_by, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_store_id, v_org_id, v_user_id, v_strategy_ids[v_i],
      (ARRAY['positive', 'neutral', 'negative'])[1 + FLOOR(RANDOM() * 3)::INT],
      3 + FLOOR(RANDOM() * 3)::INT,
      '전략 실행 결과에 대한 피드백입니다. 전반적으로 ' ||
      (ARRAY['만족스러운', '보통의', '개선이 필요한'])[1 + FLOOR(RANDOM() * 3)::INT] || ' 결과를 보였습니다.',
      jsonb_build_object('revenue_change', (5 + FLOOR(RANDOM() * 20))::NUMERIC, 'conversion_change', (2 + FLOOR(RANDOM() * 10))::NUMERIC),
      jsonb_build_object('expected_roi', 10 + FLOOR(RANDOM() * 15)::NUMERIC, 'actual_roi', 8 + FLOOR(RANDOM() * 18)::NUMERIC),
      '{"improvements":["타겟팅 개선","실행 기간 조정","세그먼트 세분화"]}'::jsonb,
      v_user_id,
      NOW(), NOW()
    );
  END LOOP;

  RAISE NOTICE '    ✓ strategy_feedback: 10건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 12.4: ai_recommendations (20개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 12.4] ai_recommendations 시딩 (20개)...';

  INSERT INTO ai_recommendations (id, store_id, org_id, user_id, recommendation_type, title, description, priority, status, expected_impact, evidence, action_category, data_source, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'layout', '의류 행거 재배치', '고객 동선 분석 결과 RACK-002를 입구 방향으로 1m 이동 권장', 'high', 'pending', '{"conversion_lift":8,"dwell_time_increase":2}'::jsonb, '{"heatmap_analysis":true,"a_b_test":false}'::jsonb, 'store_layout', 'wifi_tracking', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'product', '신상품 전면 배치', '다운 패딩(SKU-OUT-003)을 메인홀 중앙에 배치 권장', 'high', 'pending', '{"sales_lift":15,"visibility_increase":50}'::jsonb, '{"seasonal_trend":true,"competitor_analysis":true}'::jsonb, 'product_placement', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'inventory', '재고 보충 필요', '캐시미어 코트(SKU-OUT-001) 재고 부족 예상, 7일 내 발주 권장', 'high', 'accepted', '{"stockout_prevention":true,"revenue_protection":500000}'::jsonb, '{"sales_velocity":2.5,"current_stock":5}'::jsonb, 'inventory', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'pricing', '가격 조정 제안', '니트 스웨터(SKU-TOP-002) 경쟁사 대비 높은 가격, 5% 인하 권장', 'medium', 'pending', '{"sales_lift":12,"margin_impact":-3}'::jsonb, '{"competitor_price":93000,"our_price":98000}'::jsonb, 'pricing', 'crm', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'staff', '피크타임 인력 배치', '토요일 14-17시 계산대 대기시간 증가, 추가 인력 배치 권장', 'medium', 'accepted', '{"wait_time_reduction":40,"customer_satisfaction_increase":10}'::jsonb, '{"avg_wait_time":5.2,"peak_hour_traffic":45}'::jsonb, 'operations', 'camera', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'promotion', 'VIP 타겟 프로모션', 'VIP 고객 재방문율 감소, 전용 할인 쿠폰 발송 권장', 'high', 'pending', '{"return_visit_increase":25,"revenue_lift":8}'::jsonb, '{"vip_return_rate":35,"industry_avg":45}'::jsonb, 'marketing', 'crm', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'cross_sell', '크로스셀링 기회', '블라우스 구매 고객에게 스카프 추천 시 구매율 높음', 'medium', 'pending', '{"basket_size_increase":1.3,"revenue_lift":12}'::jsonb, '{"correlation_score":0.72,"sample_size":150}'::jsonb, 'sales', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'layout', '피팅룸 동선 개선', '피팅룸 대기 공간 확보를 위한 의자 배치 권장', 'low', 'dismissed', '{"customer_satisfaction_increase":5,"dwell_time_increase":3}'::jsonb, '{"current_wait_time":8,"target_wait_time":5}'::jsonb, 'store_layout', 'beacon', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'product', '카테고리 믹스 조정', '액세서리존 쥬얼리 비중 증가 권장 (현재 15% → 25%)', 'medium', 'pending', '{"margin_increase":8,"sales_lift":5}'::jsonb, '{"jewelry_margin":65,"accessory_margin":45}'::jsonb, 'product_mix', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'inventory', '시즌 재고 정리', '여름 상품 10종 마크다운 판매 권장', 'high', 'pending', '{"inventory_turnover_increase":30,"storage_cost_reduction":200000}'::jsonb, '{"aging_items":10,"total_value":1500000}'::jsonb, 'inventory', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'upsell', '업셀링 기회', '로퍼 구매 고객에게 프리미엄 케어 키트 추천', 'medium', 'pending', '{"aov_increase":8,"attach_rate":15}'::jsonb, '{"care_kit_margin":70,"loafer_buyers":120}'::jsonb, 'sales', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'layout', '진열대 조명 개선', 'SHOWCASE-001 조명 밝기 20% 증가 권장', 'low', 'pending', '{"attention_increase":15,"sales_lift":5}'::jsonb, '{"current_lux":500,"recommended_lux":600}'::jsonb, 'store_layout', 'camera', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'staff', '전문 교육 제안', '신상품 출시에 따른 직원 제품 교육 권장', 'medium', 'accepted', '{"conversion_increase":8,"customer_satisfaction_increase":10}'::jsonb, '{"new_products":5,"training_hours":4}'::jsonb, 'operations', 'crm', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'promotion', '번들 프로모션', '코트+스카프 세트 10% 할인 프로모션 권장', 'high', 'pending', '{"basket_size_increase":1.5,"revenue_lift":10}'::jsonb, '{"bundle_affinity":0.65,"avg_discount":8}'::jsonb, 'marketing', 'pos', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'customer', '휴면고객 재활성화', '90일 이상 미방문 고객 대상 리마인더 발송 권장', 'medium', 'pending', '{"return_rate":15,"revenue_per_return":85000}'::jsonb, '{"dormant_customers":250,"avg_ltv":350000}'::jsonb, 'marketing', 'crm', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'pricing', '시간대별 프로모션', '오전 시간대(10-12시) 5% 추가 할인으로 트래픽 분산', 'low', 'pending', '{"traffic_distribution_improvement":20,"off_peak_sales_lift":15}'::jsonb, '{"morning_traffic_ratio":15,"target_ratio":25}'::jsonb, 'pricing', 'wifi', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'layout', '시즌 디스플레이', '겨울 시즌 메인홀 디스플레이 변경 권장', 'high', 'accepted', '{"seasonal_sales_lift":20,"brand_perception_increase":10}'::jsonb, '{"current_season":"winter","display_freshness_days":45}'::jsonb, 'store_layout', 'camera', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'product', '신상품 도입 제안', '경쟁사 인기 상품 카테고리 분석 기반 신상품 도입 권장', 'medium', 'pending', '{"market_share_increase":5,"new_customer_acquisition":100}'::jsonb, '{"competitor_trending":["cardigan","boots"]}'::jsonb, 'product_mix', 'crm', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'staff', '고객 응대 개선', '액세서리존 상주 직원 배치로 전환율 향상 예상', 'medium', 'pending', '{"conversion_lift":12,"customer_assistance_rate":40}'::jsonb, '{"current_assistance_rate":20,"zone_conversion":35}'::jsonb, 'operations', 'beacon', NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'inventory', '자동 발주 설정', '고회전 상품 5종 자동 발주 임계값 설정 권장', 'medium', 'pending', '{"stockout_reduction":80,"order_efficiency_increase":30}'::jsonb, '{"high_turnover_items":5,"avg_stockout_days":3}'::jsonb, 'inventory', 'pos', NOW(), NOW());

  RAISE NOTICE '    ✓ ai_recommendations: 20건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 12.5: ai_inference_results (10개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 12.5] ai_inference_results 시딩 (10개)...';

  INSERT INTO ai_inference_results (id, store_id, org_id, user_id, inference_type, result, parameters, processing_time_ms, model_used, created_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'demand_forecast', '{"next_7_days":{"SKU-OUT-001":12,"SKU-OUT-002":8,"SKU-TOP-001":15},"confidence":0.85}'::jsonb, '{"horizon_days":7,"category":"all"}'::jsonb, 1250, 'prophet-v2', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'customer_segmentation', '{"segments":{"VIP":250,"Regular":1250,"New":750,"Dormant":250},"model_accuracy":0.92}'::jsonb, '{"features":["recency","frequency","monetary"]}'::jsonb, 3500, 'kmeans-rfm', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'layout_optimization', '{"recommended_changes":[{"furniture_id":"RACK-001","action":"move","delta":{"x":0.5,"z":0}}],"expected_improvement":8.5}'::jsonb, '{"zone":"Z003","objective":"conversion"}'::jsonb, 8200, 'genetic-algo-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'price_optimization', '{"recommendations":[{"sku":"SKU-TOP-002","current":98000,"optimal":93000,"elasticity":-1.8}]}'::jsonb, '{"category":"상의","constraint":"margin>30"}'::jsonb, 2100, 'price-elasticity-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'churn_prediction', '{"at_risk_customers":45,"high_value_at_risk":12,"churn_probability_avg":0.35}'::jsonb, '{"lookback_days":90,"threshold":0.5}'::jsonb, 1800, 'xgboost-churn-v2', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'basket_analysis', '{"frequent_pairs":[["SKU-TOP-001","SKU-SCA-001"],["SKU-OUT-001","SKU-BLT-001"]],"lift_scores":[2.3,1.8]}'::jsonb, '{"min_support":0.01,"min_confidence":0.3}'::jsonb, 950, 'apriori-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'traffic_forecast', '{"tomorrow":{"hourly":[15,20,35,45,55,60,58,52,48,42,30,20],"peak_hour":14}}'::jsonb, '{"model":"seasonal_arima"}'::jsonb, 650, 'sarima-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'zone_affinity', '{"zone_pairs":[{"from":"Z002","to":"Z003","affinity":0.72},{"from":"Z003","to":"Z005","affinity":0.45}]}'::jsonb, '{"min_transitions":100}'::jsonb, 1100, 'markov-chain-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'inventory_optimization', '{"reorder_suggestions":[{"sku":"SKU-OUT-001","quantity":20,"urgency":"high"},{"sku":"SKU-SHO-001","quantity":15,"urgency":"medium"}]}'::jsonb, '{"service_level":0.95}'::jsonb, 1450, 'inventory-opt-v1', NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'sentiment_analysis', '{"overall_sentiment":0.72,"by_category":{"product":0.78,"service":0.68,"price":0.65},"sample_size":500}'::jsonb, '{"source":"reviews","period_days":30}'::jsonb, 2800, 'bert-sentiment-v1', NOW());

  RAISE NOTICE '    ✓ ai_inference_results: 10건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_05 완료: 그래프/AI 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  SELECT COUNT(*) INTO v_count FROM graph_entities WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ graph_entities: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM graph_relations WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ graph_relations: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM data_source_tables WHERE org_id = v_org_id;
  RAISE NOTICE '  ✓ data_source_tables: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM applied_strategies WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ applied_strategies: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM strategy_daily_metrics;
  RAISE NOTICE '  ✓ strategy_daily_metrics: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM strategy_feedback WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ strategy_feedback: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM ai_recommendations WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ ai_recommendations: % 건', v_count;
  SELECT COUNT(*) INTO v_count FROM ai_inference_results WHERE store_id = v_store_id;
  RAISE NOTICE '  ✓ ai_inference_results: % 건', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'graph_entities' as table_name, COUNT(*) as row_count FROM graph_entities
UNION ALL SELECT 'graph_relations', COUNT(*) FROM graph_relations
UNION ALL SELECT 'data_source_tables', COUNT(*) FROM data_source_tables
UNION ALL SELECT 'applied_strategies', COUNT(*) FROM applied_strategies
UNION ALL SELECT 'strategy_daily_metrics', COUNT(*) FROM strategy_daily_metrics
UNION ALL SELECT 'strategy_feedback', COUNT(*) FROM strategy_feedback
UNION ALL SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations
UNION ALL SELECT 'ai_inference_results', COUNT(*) FROM ai_inference_results
ORDER BY table_name;
