-- ============================================================================
-- NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터 (스키마 수정본)
-- ============================================================================
-- 실행 순서: SEED_01 이후
-- 목적: zones_dim, retail_concepts, data_sources, customers, staff,
--       store_goals, store_scenes, customer_segments 시딩
-- 수정: zones_dim 컬럼 실제 스키마에 맞게 수정
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_entrance UUID;
  v_zone_main UUID;
  v_zone_clothing UUID;
  v_zone_accessory UUID;
  v_zone_fitting UUID;
  v_zone_checkout UUID;
  v_zone_lounge UUID;
  v_count INT;
  i INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_02: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';

  -- Store/User/Org 정보 가져오기
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store가 없습니다. stores 테이블에 데이터가 필요합니다.';
  END IF;

  RAISE NOTICE '  Store ID: %', v_store_id;
  RAISE NOTICE '  User ID: %', v_user_id;
  RAISE NOTICE '  Org ID: %', v_org_id;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.1: zones_dim (7개 존) - 실제 스키마에 맞게 수정
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.1] zones_dim 시딩 (7개)...';

  INSERT INTO zones_dim (
    id, store_id, user_id, org_id, 
    zone_code, zone_name, zone_type,
    floor_level, area_sqm, capacity, 
    position_x, position_y, position_z,
    size_width, size_depth, size_height,
    color, coordinates, properties, metadata,
    is_active, created_at, updated_at
  ) VALUES
  -- Z001: 입구
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z001', '입구', 'entrance',
    1, 40.0, 30, 
    0, 0, -8,
    8, 4, 3,
    '#FFC107',
    '{"min":{"x":-4,"y":0,"z":-10},"max":{"x":4,"y":3,"z":-6}}'::jsonb,
    '{"description":"매장 입구 및 환영 공간","furnitureCount":4}'::jsonb,
    '{"priority":1}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z002: 메인홀
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z002', '메인홀', 'main',
    1, 100.0, 60, 
    0, 0, 0,
    10, 10, 3,
    '#FF5722',
    '{"min":{"x":-5,"y":0,"z":-6},"max":{"x":5,"y":3,"z":4}}'::jsonb,
    '{"description":"중앙 디스플레이 및 프로모션 공간","furnitureCount":13}'::jsonb,
    '{"priority":2}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z003: 의류존
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z003', '의류존', 'clothing',
    1, 80.0, 50, 
    -7, 0, -2,
    6, 8, 3,
    '#E91E63',
    '{"min":{"x":-10,"y":0,"z":-6},"max":{"x":-4,"y":3,"z":2}}'::jsonb,
    '{"description":"의류 전문 진열 공간","furnitureCount":26}'::jsonb,
    '{"priority":3}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z004: 액세서리존
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z004', '액세서리존', 'accessory',
    1, 60.0, 40, 
    7, 0, -2,
    6, 8, 3,
    '#FF9800',
    '{"min":{"x":4,"y":0,"z":-6},"max":{"x":10,"y":3,"z":2}}'::jsonb,
    '{"description":"액세서리 및 신발 전문 공간","furnitureCount":11}'::jsonb,
    '{"priority":4}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z005: 피팅룸
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z005', '피팅룸', 'fitting',
    1, 24.0, 8, 
    -7, 0, 7,
    6, 5, 3,
    '#9C27B0',
    '{"min":{"x":-10,"y":0,"z":5},"max":{"x":-4,"y":3,"z":10}}'::jsonb,
    '{"description":"피팅룸 공간","furnitureCount":4,"fittingRooms":4}'::jsonb,
    '{"priority":5}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z006: 계산대
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z006', '계산대', 'checkout',
    1, 24.0, 15, 
    7, 0, 7,
    6, 5, 3,
    '#FF9800',
    '{"min":{"x":4,"y":0,"z":5},"max":{"x":10,"y":3,"z":10}}'::jsonb,
    '{"description":"결제 및 포장 공간","furnitureCount":4,"posCount":2}'::jsonb,
    '{"priority":6}'::jsonb,
    true, NOW(), NOW()
  ),
  
  -- Z007: 휴식공간
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id, 
    'Z007', '휴식공간', 'lounge',
    1, 32.0, 20, 
    0, 0, 8,
    8, 5, 3,
    '#4CAF50',
    '{"min":{"x":-4,"y":0,"z":5},"max":{"x":4,"y":3,"z":10}}'::jsonb,
    '{"description":"고객 휴식 및 대기 공간","furnitureCount":6}'::jsonb,
    '{"priority":7}'::jsonb,
    true, NOW(), NOW()
  );

  -- Zone ID 가져오기
  SELECT id INTO v_zone_entrance FROM zones_dim WHERE zone_code = 'Z001' AND store_id = v_store_id;
  SELECT id INTO v_zone_main FROM zones_dim WHERE zone_code = 'Z002' AND store_id = v_store_id;
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;
  SELECT id INTO v_zone_fitting FROM zones_dim WHERE zone_code = 'Z005' AND store_id = v_store_id;
  SELECT id INTO v_zone_checkout FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id;
  SELECT id INTO v_zone_lounge FROM zones_dim WHERE zone_code = 'Z007' AND store_id = v_store_id;

  RAISE NOTICE '    ✓ zones_dim: 7건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.2: retail_concepts (12개) - 실제 스키마에 맞게 수정
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.2] retail_concepts 시딩 (12개)...';

  INSERT INTO retail_concepts (id, store_id, name, display_name, category, description, involved_entity_types, involved_relation_types, computation, ai_context, is_system, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), v_store_id, 'promo_season', '시즌 프로모션', 'rule', '계절별 시즌 상품 프로모션 전략', ARRAY['product','zone'], ARRAY['displayed_in'], '{"method":"aggregate","target_increase":15}', '{"priority":"high","duration_days":30}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'launch_new', '신상품 론칭', 'rule', '신상품 출시 집중 노출 전략', ARRAY['product'], ARRAY['displayed_in'], '{"method":"spotlight","visibility_boost":200}', '{"featured_days":14}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'vip_care', 'VIP 고객 케어', 'behavior', 'VIP 고객 전용 서비스 및 혜택', ARRAY['customer','staff'], ARRAY['served_by'], '{"method":"segment_filter","discount_rate":10}', '{"priority_service":true}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'cross_sell', '크로스셀링', 'pattern', '관련 상품 교차 판매 전략', ARRAY['product','purchase'], ARRAY['purchased_with'], '{"method":"association","recommendation_count":3}', '{"bundle_discount":5}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'up_sell', '업셀링', 'pattern', '상위 상품 업그레이드 판매 전략', ARRAY['product'], ARRAY['upgrades_to'], '{"method":"tier_upgrade","upgrade_threshold":20}', '{"bonus_points":100}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'stock_opt', '재고 최적화', 'metric', '재고 회전율 최적화 전략', ARRAY['product','inventory'], ARRAY['stocked_at'], '{"method":"turnover","target_turnover":4}', '{"reorder_point_days":7}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'flow_opt', '동선 최적화', 'pattern', '고객 동선 최적화 배치 전략', ARRAY['zone','furniture'], ARRAY['connected_to'], '{"method":"path_analysis","heat_map_analysis":true}', '{"zone_sequence":["Z001","Z002","Z003","Z004","Z005","Z006"]}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'dwell_time', '체류시간 증가', 'metric', '존별 체류시간 증가 전략', ARRAY['zone','customer'], ARRAY['visited'], '{"method":"dwell_analysis","target_dwell_minutes":8}', '{"engagement_activities":3}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'conv_boost', '전환율 향상', 'kpi', '방문-구매 전환율 향상 전략', ARRAY['customer','purchase'], ARRAY['made_purchase'], '{"method":"funnel","target_rate":55}', '{"touchpoint_count":4}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'aov_boost', '객단가 향상', 'kpi', '평균 객단가 향상 전략', ARRAY['purchase','product'], ARRAY['contains'], '{"method":"basket_analysis","target_aov":180000}', '{"bundle_count":2}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'retention', '재방문 유도', 'behavior', '고객 재방문율 향상 전략', ARRAY['customer','visit'], ARRAY['visited'], '{"method":"cohort","target_return_rate":40}', '{"reward_program":true}', false, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, 'peak_mgmt', '피크타임 관리', 'rule', '피크 시간대 효율적 운영 전략', ARRAY['staff','zone'], ARRAY['assigned_to'], '{"method":"scheduling","staff_ratio":1.5}', '{"queue_management":true}', false, true, NOW(), NOW());
  RAISE NOTICE '    ✓ retail_concepts: 12건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 2.3: data_sources (5개) - 실제 스키마에 맞게 수정
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 2.3] data_sources 시딩 (5개)...';

  INSERT INTO data_sources (id, store_id, org_id, source_id_code, source_name, source_type, description, config, is_active, last_sync_at, last_sync_status, created_at, updated_at) VALUES
(gen_random_uuid(), v_store_id, v_org_id, 'POS-001', 'POS 시스템', 'pos', 'POS 거래 데이터', '{"host":"pos.internal","port":5432}', true, NOW() - INTERVAL '5 minutes', 'success', NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, 'WIFI-001', 'WiFi 트래킹', 'wifi', 'WiFi 기반 고객 동선 추적', '{"host":"wifi.internal"}', true, NOW() - INTERVAL '1 hour', 'success', NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, 'BEACON-001', '비콘 시스템', 'beacon', '비콘 근접 감지', '{"host":"beacon.internal"}', true, NOW() - INTERVAL '2 minutes', 'success', NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, 'CCTV-001', 'CCTV 분석', 'camera', 'CCTV 영상 분석', '{"stream_count":12}', true, NOW() - INTERVAL '30 minutes', 'success', NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, 'CRM-001', 'CRM 시스템', 'crm', '고객 관계 관리', '{"api_endpoint":"/api/v1"}', true, NOW() - INTERVAL '6 hours', 'success', NOW(), NOW());

  RAISE NOTICE '    ✓ data_sources: 5건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.1: customers (2,500명)
  -- VIP 250, Regular 1250, New 750, Dormant 250
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.1] customers 시딩 (2,500명)...';

  -- VIP 고객 (250명)
  FOR i IN 1..250 LOOP
  INSERT INTO customers (id, store_id, org_id, user_id, customer_name, email, phone, segment, total_purchases, last_visit_date, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    '고객 VIP-' || i,
    'vip' || i || '@example.com',
    '010-' || LPAD((1000 + i)::TEXT, 4, '0') || '-' || LPAD((1000 + i)::TEXT, 4, '0'),
    'VIP',
    (2000000 + FLOOR(RANDOM() * 3000000))::NUMERIC,
    CURRENT_DATE - (FLOOR(RANDOM() * 14))::INT,
    NOW(), NOW()
  );
END LOOP;
  RAISE NOTICE '    - VIP: 250명';

  -- Regular 고객 (1,250명)
  FOR i IN 1..1250 LOOP
  INSERT INTO customers (id, store_id, org_id, user_id, customer_name, email, phone, segment, total_purchases, last_visit_date, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    '고객 REG-' || i,
    'regular' || i || '@example.com',
    '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((2000 + i)::TEXT, 4, '0'),
    'Regular',
    (300000 + FLOOR(RANDOM() * 700000))::NUMERIC,
    CURRENT_DATE - (FLOOR(RANDOM() * 30))::INT,
    NOW(), NOW()
  );
END LOOP;
  RAISE NOTICE '    - Regular: 1,250명';

  -- New 고객 (750명)
  FOR i IN 1..750 LOOP
  INSERT INTO customers (id, store_id, org_id, user_id, customer_name, email, phone, segment, total_purchases, last_visit_date, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    '고객 NEW-' || i,
    'new' || i || '@example.com',
    '010-' || LPAD((4000 + i)::TEXT, 4, '0') || '-' || LPAD((4000 + i)::TEXT, 4, '0'),
    'New',
    (0 + FLOOR(RANDOM() * 200000))::NUMERIC,
    CURRENT_DATE - (FLOOR(RANDOM() * 30))::INT,
    NOW(), NOW()
  );
  END LOOP;
  RAISE NOTICE '    - New: 750명';

  -- Dormant 고객 (250명)
  FOR i IN 1..250 LOOP
  INSERT INTO customers (id, store_id, org_id, user_id, customer_name, email, phone, segment, total_purchases, last_visit_date, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    '고객 DOR-' || i,
    'dormant' || i || '@example.com',
    '010-' || LPAD((5000 + i)::TEXT, 4, '0') || '-' || LPAD((5000 + i)::TEXT, 4, '0'),
    'Dormant',
    (200000 + FLOOR(RANDOM() * 400000))::NUMERIC,
    CURRENT_DATE - (90 + FLOOR(RANDOM() * 180))::INT,
    NOW(), NOW()
  );
END LOOP;
  RAISE NOTICE '    - Dormant: 250명';
  RAISE NOTICE '    ✓ customers: 2,500건 삽입';

-- ══════════════════════════════════════════════════════════════════════════
-- STEP 3.2: staff (8명) - avatar 컬럼 직접 설정
-- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.2] staff 시딩 (8명)...';

  INSERT INTO staff (
    id, store_id, org_id, user_id, 
    staff_code, staff_name, role, email, phone, department,
    avatar_url, avatar_position, assigned_zone_id,
    is_active, metadata, created_at, updated_at
  ) VALUES
  -- 매니저 - Z002 메인홀
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP001', '매니저', 'manager', 'manager@store.com', '010-1111-0001', '관리',
    'avatar_manager_01.glb',
    '{"x":0,"y":0,"z":0.5}'::jsonb,
    v_zone_main,
    true, '{"zone":"Z002"}', NOW(), NOW()
  ),
  -- 판매직원 1 - Z003 의류존
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP002', '판매직원 1', 'sales', 'sales1@store.com', '010-1111-0002', '판매',
    'avatar_sales_01.glb',
    '{"x":-7.5,"y":0,"z":-3}'::jsonb,
    v_zone_clothing,
    true, '{"zone":"Z003"}', NOW(), NOW()
  ),
  -- 판매직원 2 - Z004 액세서리존
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP003', '판매직원 2', 'sales', 'sales2@store.com', '010-1111-0003', '판매',
    'avatar_sales_02.glb',
    '{"x":6.5,"y":0,"z":-3.5}'::jsonb,
    v_zone_accessory,
    true, '{"zone":"Z004"}', NOW(), NOW()
  ),
  -- 계산원 1 - Z006 계산대
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP004', '계산원 1', 'cashier', 'cashier1@store.com', '010-1111-0004', '계산',
    'avatar_cashier_01.glb',
    '{"x":7,"y":0,"z":6.7}'::jsonb,
    v_zone_checkout,
    true, '{"zone":"Z006"}', NOW(), NOW()
  ),
  -- 계산원 2 - Z006 계산대
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP005', '계산원 2', 'cashier', 'cashier2@store.com', '010-1111-0005', '계산',
    'avatar_cashier_02.glb',
    '{"x":7,"y":0,"z":5.7}'::jsonb,
    v_zone_checkout,
    true, '{"zone":"Z006"}', NOW(), NOW()
  ),
  -- 보안요원 - Z001 입구
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP006', '보안요원', 'security', 'security@store.com', '010-1111-0006', '보안',
    'avatar_security_01.glb',
    '{"x":-1,"y":0,"z":-8.5}'::jsonb,
    v_zone_entrance,
    true, '{"zone":"Z001"}', NOW(), NOW()
  ),
  -- 피팅룸 담당 - Z005 피팅룸
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP007', '피팅룸 담당', 'fitting', 'fitting@store.com', '010-1111-0007', '피팅',
    'avatar_fitting_01.glb',
    '{"x":-7,"y":0,"z":5.5}'::jsonb,
    v_zone_fitting,
    true, '{"zone":"Z005"}', NOW(), NOW()
  ),
  -- 안내직원 - Z001 입구
  (
    gen_random_uuid(), v_store_id, v_org_id, v_user_id,
    'EMP008', '안내직원', 'greeter', 'greeter@store.com', '010-1111-0008', '안내',
    'avatar_greeter_01.glb',
    '{"x":1,"y":0,"z":-8.5}'::jsonb,
    v_zone_entrance,
    true, '{"zone":"Z001"}', NOW(), NOW()
  );

  RAISE NOTICE '    ✓ staff: 8건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.2.1: staff_assignments (8명 배치)
  -- staff 테이블 데이터 기반으로 자동 생성
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.2.1] staff_assignments 시딩 (8명 배치)...';

  INSERT INTO staff_assignments (
    id, store_id, user_id, org_id,
    staff_name, staff_role, zone_id,
    position_x, position_y, position_z,
    shift_start, shift_end, assigned_date,
    status, is_ai_suggested, efficiency_score,
    properties, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    s.store_id,
    s.user_id,
    s.org_id,
    s.staff_name,
    s.role,
    s.assigned_zone_id,
    (s.avatar_position->>'x')::NUMERIC,
    (s.avatar_position->>'y')::NUMERIC,
    (s.avatar_position->>'z')::NUMERIC,
    '09:00'::TIME,
    '18:00'::TIME,
    CURRENT_DATE,
    'active',
    false,
    85.0 + (random() * 10),
    jsonb_build_object(
      'staff_id', s.id,
      'avatar_url', s.avatar_url,
      'assigned_zone_code', s.metadata->>'zone'
    ),
    NOW(),
    NOW()
  FROM staff s
  WHERE s.store_id = v_store_id AND s.is_active = true;

  RAISE NOTICE '    ✓ staff_assignments: 8건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.3: store_goals (6개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.3] store_goals 시딩 (6개)...';

  INSERT INTO store_goals (id, store_id, org_id, created_by, goal_type, period_type, period_start, period_end, target_value, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'revenue', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 500000000, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'traffic', 'daily', CURRENT_DATE, CURRENT_DATE, 100, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'conversion', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 55, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'aov', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 180000, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'vip_visits', 'weekly', DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' - INTERVAL '1 day', 50, true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, 'inventory_turnover', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 4, true, NOW(), NOW());

  RAISE NOTICE '    ✓ store_goals: 6건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.4: store_scenes (2개: As-Is, To-Be)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.4] store_scenes 시딩 (2개)...';

  INSERT INTO store_scenes (id, store_id, org_id, user_id, scene_name, scene_type, recipe_data, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, '현재 레이아웃 (As-Is)', 'as_is', 
 '{"zones":7,"furniture_count":68,"last_optimized":null,"optimization_score":72,"description":"현재 매장 레이아웃 및 가구 배치"}', true, NOW(), NOW()),
(gen_random_uuid(), v_store_id, v_org_id, v_user_id, '최적화 레이아웃 (To-Be)', 'to_be', 
 '{"zones":7,"furniture_count":68,"last_optimized":"2024-12-15","optimization_score":89,"description":"AI 추천 최적화 레이아웃","changes":[{"type":"move","furniture_id":"RACK-001","from":{"x":-8.5,"z":-2},"to":{"x":-8.0,"z":-2.5}}]}', true, NOW(), NOW());

  RAISE NOTICE '    ✓ store_scenes: 2건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- STEP 3.5: customer_segments (4개)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [STEP 3.5] customer_segments 시딩 (4개)...';

  INSERT INTO customer_segments (id, store_id, org_id, segment_name, segment_code, description, criteria, customer_count, avg_ltv, avg_purchase_frequency, created_at, updated_at) VALUES
  (gen_random_uuid(), v_store_id, v_org_id, 'VIP 고객', 'VIP', '최상위 고객 세그먼트 - 높은 구매력과 충성도',
   '{"min_total_spent":2000000,"min_visits":20,"tier":"PLATINUM"}', 250, 3500000, 12.5, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '일반 고객', 'REGULAR', '정기적으로 방문하는 일반 고객',
   '{"min_total_spent":300000,"min_visits":5,"tier":"GOLD"}', 1250, 650000, 6.2, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '신규 고객', 'NEW', '최근 3개월 내 신규 가입 고객',
   '{"max_visits":3,"first_visit_within_days":90,"tier":"SILVER"}', 750, 95000, 1.5, NOW(), NOW()),
  (gen_random_uuid(), v_store_id, v_org_id, '휴면 고객', 'DORMANT', '90일 이상 방문하지 않은 고객',
   '{"last_visit_over_days":90,"tier":"BRONZE"}', 250, 350000, 0.5, NOW(), NOW());

  RAISE NOTICE '    ✓ customer_segments: 4건 삽입';

  -- ══════════════════════════════════════════════════════════════════════════
  -- 완료 리포트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_02 완료: 마스터/기준 데이터';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ zones_dim: 7건';
  RAISE NOTICE '  ✓ retail_concepts: 12건';
  RAISE NOTICE '  ✓ data_sources: 5건';
  RAISE NOTICE '  ✓ customers: 2,500건 (VIP:250, Regular:1250, New:750, Dormant:250)';
  RAISE NOTICE '  ✓ staff: 8건';
  RAISE NOTICE '  ✓ store_goals: 6건';
  RAISE NOTICE '  ✓ store_scenes: 2건';
  RAISE NOTICE '  ✓ customer_segments: 4건';
  RAISE NOTICE '  총 삽입: ~2,544건';
  RAISE NOTICE '';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';

END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'zones_dim' as table_name, COUNT(*) as row_count FROM zones_dim
UNION ALL SELECT 'retail_concepts', COUNT(*) FROM retail_concepts
UNION ALL SELECT 'data_sources', COUNT(*) FROM data_sources
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'store_goals', COUNT(*) FROM store_goals
UNION ALL SELECT 'store_scenes', COUNT(*) FROM store_scenes
UNION ALL SELECT 'customer_segments', COUNT(*) FROM customer_segments
ORDER BY table_name;
