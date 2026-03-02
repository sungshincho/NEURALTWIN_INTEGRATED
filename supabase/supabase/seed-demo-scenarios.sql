-- =============================================================================
-- NeuralTwin Demo Scenario Seed Data
-- =============================================================================
-- Version: 1.0 | Sprint 4.2 | 2026-03-02
-- Purpose: 3 guided-demo retail scenarios for potential customer presentations
-- Scenarios:
--   1. Fashion Boutique (패션 부티크)    — 강남역, 500sqm
--   2. Beauty Flagship (뷰티 플래그십)   — 성수동, 330sqm
--   3. Department Store F&B (백화점 식품관) — 여의도 더현대, 1000sqm
-- Usage:  psql -f seed-demo-scenarios.sql  OR  include after seed.sql
-- Idempotency: All INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Deterministic UUIDs for Demo Scenarios
-- ─────────────────────────────────────────────────────────────────────────────
-- We use fixed UUIDs so FK relationships are always satisfied and re-runs
-- are idempotent.

-- Organizations
-- org_fashion:     d1000000-0001-4000-a000-000000000001  (모드니크 패션)
-- org_beauty:      d1000000-0002-4000-a000-000000000001  (글로우랩 뷰티)
-- org_department:  d1000000-0003-4000-a000-000000000001  (더현대 식품관)

-- Stores
-- store_fashion:     d2000000-0001-4000-a000-000000000001  (모드니크 강남 플래그십)
-- store_beauty:      d2000000-0002-4000-a000-000000000001  (글로우랩 성수 플래그십)
-- store_department:  d2000000-0003-4000-a000-000000000001  (더현대 여의도 식품관)

-- Demo user (same as base seed)
-- user_demo: dddddddd-dddd-dddd-dddd-dddddddddddd


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. DEMO ORGANIZATIONS
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organizations (id, org_name, created_at, updated_at, metadata, member_count)
VALUES
  (
    'd1000000-0001-4000-a000-000000000001',
    '모드니크 패션',
    now(), now(),
    '{"tier": "professional", "description": "프리미엄 패션 부티크 — 데모 시나리오 1", "industry": "fashion_retail", "demo_scenario": "fashion_boutique"}'::jsonb,
    3
  ),
  (
    'd1000000-0002-4000-a000-000000000001',
    '글로우랩 뷰티',
    now(), now(),
    '{"tier": "professional", "description": "K-뷰티 플래그십 — 데모 시나리오 2", "industry": "beauty_retail", "demo_scenario": "beauty_flagship"}'::jsonb,
    4
  ),
  (
    'd1000000-0003-4000-a000-000000000001',
    '더현대 식품관',
    now(), now(),
    '{"tier": "enterprise", "description": "백화점 프리미엄 식품관 — 데모 시나리오 3", "industry": "department_store", "demo_scenario": "department_fb"}'::jsonb,
    6
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1.1 ORGANIZATION SETTINGS
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organization_settings (id, org_id, timezone, currency, default_kpi_set, brand_color, email_notifications, metadata)
VALUES
  (
    'd1100000-0001-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'Asia/Seoul', 'KRW', 'standard', '#1a1a2e', true,
    '{"language": "ko", "date_format": "YYYY-MM-DD", "demo_scenario": "fashion_boutique"}'::jsonb
  ),
  (
    'd1100000-0002-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'Asia/Seoul', 'KRW', 'standard', '#ff6b9d', true,
    '{"language": "ko", "date_format": "YYYY-MM-DD", "demo_scenario": "beauty_flagship"}'::jsonb
  ),
  (
    'd1100000-0003-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'Asia/Seoul', 'KRW', 'standard', '#2d5016', true,
    '{"language": "ko", "date_format": "YYYY-MM-DD", "demo_scenario": "department_fb"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1.2 ORGANIZATION MEMBERS (demo user in all 3 orgs)
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organization_members (id, org_id, user_id, role, joined_at)
VALUES
  ('d1200000-0001-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001',
   'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ORG_ADMIN', now()),
  ('d1200000-0002-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001',
   'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ORG_ADMIN', now()),
  ('d1200000-0003-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001',
   'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ORG_ADMIN', now())
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1.3 SUBSCRIPTIONS (Professional / Enterprise tiers)
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.subscriptions (
  id, org_id, plan_type, status, store_quota, subscription_type,
  billing_cycle, monthly_cost, start_date, end_date,
  tier, stripe_customer_id, stripe_subscription_id,
  ai_queries_used, ai_queries_reset_at
)
VALUES
  ('d1300000-0001-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001',
   'professional', 'active', 3, 'LICENSE_BASED', 'monthly', 299000,
   now() - INTERVAL '60 days', now() + INTERVAL '305 days',
   'professional', 'cus_demo_fashion_2026', 'sub_demo_fashion_pro',
   42, now()),
  ('d1300000-0002-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001',
   'professional', 'active', 5, 'LICENSE_BASED', 'monthly', 299000,
   now() - INTERVAL '45 days', now() + INTERVAL '320 days',
   'professional', 'cus_demo_beauty_2026', 'sub_demo_beauty_pro',
   67, now()),
  ('d1300000-0003-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001',
   'enterprise', 'active', 20, 'LICENSE_BASED', 'annual', 990000,
   now() - INTERVAL '90 days', now() + INTERVAL '275 days',
   'enterprise', 'cus_demo_dept_2026', 'sub_demo_dept_ent',
   153, now())
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. STORES
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.stores (
  id, user_id, org_id, store_name, location, store_type,
  status, region, district, area_sqm, floor_area_sqm,
  opening_date, store_format, address, city, country, timezone,
  max_capacity, staff_count, opening_hour, closing_hour, is_active, metadata
)
VALUES
  -- ── 시나리오 1: 패션 부티크 (500sqm, ~150평, 강남) ──
  (
    'd2000000-0001-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0001-4000-a000-000000000001',
    '모드니크 강남 플래그십', '서울 강남구 강남역', 'fashion',
    'active', '서울', '강남구', 500, 500.00,
    '2025-03-01', 'flagship',
    '서울특별시 강남구 강남대로 396', '서울', 'KR', 'Asia/Seoul',
    120, 8, 11, 22, true,
    '{"demo": true, "demo_scenario": "fashion_boutique", "floor_count": 2, "parking": true, "nearby_subway": "강남역 11번출구", "brand_tier": "premium", "target_age": "25-40", "avg_price_range": "80,000-350,000원"}'::jsonb
  ),
  -- ── 시나리오 2: 뷰티 플래그십 (330sqm, ~100평, 성수) ──
  (
    'd2000000-0002-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0002-4000-a000-000000000001',
    '글로우랩 성수 플래그십', '서울 성동구 성수동', 'beauty',
    'active', '서울', '성동구', 330, 330.00,
    '2025-06-15', 'flagship',
    '서울특별시 성동구 서울숲2길 44-13', '서울', 'KR', 'Asia/Seoul',
    80, 6, 10, 22, true,
    '{"demo": true, "demo_scenario": "beauty_flagship", "floor_count": 1, "parking": false, "nearby_subway": "뚝섬역 3번출구", "brand_tier": "premium", "target_age": "20-35", "avg_price_range": "15,000-120,000원", "has_experience_zone": true}'::jsonb
  ),
  -- ── 시나리오 3: 백화점 식품관 (1000sqm, ~300평, 여의도 더현대) ──
  (
    'd2000000-0003-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0003-4000-a000-000000000001',
    '더현대 여의도 식품관', '서울 영등포구 여의도동', 'department_store',
    'active', '서울', '영등포구', 1000, 1000.00,
    '2024-09-01', 'department',
    '서울특별시 영등포구 여의대로 108 B1', '서울', 'KR', 'Asia/Seoul',
    300, 25, 10, 22, true,
    '{"demo": true, "demo_scenario": "department_fb", "floor_count": 1, "floor": "B1", "parking": true, "nearby_subway": "여의도역 1번출구", "brand_tier": "luxury", "tenant_count": 42, "daily_foot_traffic_estimate": "8000+"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. ZONES (zones_dim) — scenario-specific zone layouts
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.1 패션 부티크 — 6 zones (25m x 20m = 500sqm)
-- Layout:
--   [입구/윈도우]  [여성복 존]     [남성복 존]
--                [액세서리 존]   [피팅룸]     [캐셔]
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zones_dim (
  id, org_id, store_id, zone_code, zone_name, zone_type,
  position_x, position_y, position_z,
  size_width, size_depth, size_height,
  area_sqm, capacity, is_active, metadata
)
VALUES
  -- 입구/윈도우 디스플레이
  (
    'd3010000-0001-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ01', '입구/윈도우', 'entrance',
    0, 0, 0, 6.0, 5.0, 4.0,
    30, 20, true,
    '{"description": "메인 입구 + 윈도우 디스플레이 — 시즌 비주얼 머천다이징", "traffic_level": "very_high", "has_mannequin": true, "mannequin_count": 4, "display_theme": "S/S 2026 컬렉션"}'::jsonb
  ),
  -- 여성복 존
  (
    'd3010000-0002-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ02', '여성복 존', 'display',
    7, 0, 0, 8.0, 10.0, 4.0,
    80, 35, true,
    '{"description": "여성복 메인 존 — 아우터, 원피스, 블라우스", "product_category": "women_apparel", "sku_count": 280, "display_racks": 12, "highlight": "S/S 신상 컬렉션 집중 배치"}'::jsonb
  ),
  -- 남성복 존
  (
    'd3010000-0003-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ03', '남성복 존', 'display',
    16, 0, 0, 7.0, 10.0, 4.0,
    70, 30, true,
    '{"description": "남성복 존 — 캐주얼, 비즈캐주얼, 아우터", "product_category": "men_apparel", "sku_count": 220, "display_racks": 10, "highlight": "리넨 컬렉션 + 골프웨어"}'::jsonb
  ),
  -- 액세서리 존
  (
    'd3010000-0004-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ04', '액세서리 존', 'display',
    7, 0, 11, 8.0, 5.0, 4.0,
    40, 15, true,
    '{"description": "가방, 슈즈, 주얼리, 벨트 — 크로스셀링 핵심 존", "product_category": "accessories", "sku_count": 180, "avg_unit_price": 95000, "cross_sell_target": true}'::jsonb
  ),
  -- 피팅룸
  -- AI INSIGHT TRIGGER: 피팅룸 전환율 하락 → 대기시간 관리 추천
  (
    'd3010000-0005-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ05', '피팅룸', 'fitting_room',
    16, 0, 11, 5.0, 5.0, 4.0,
    25, 10, true,
    '{"description": "피팅룸 6칸 — 전환율 핵심 터치포인트", "booth_count": 6, "has_mirror": true, "has_lighting": "studio", "ai_insight_trigger": "fitting_room_conversion_drop", "insight_message": "피팅룸 전환율 하락 → 대기시간 관리 추천"}'::jsonb
  ),
  -- 캐셔
  (
    'd3010000-0006-4000-a000-000000000001',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'FZ06', '캐셔', 'checkout',
    22, 0, 11, 3.0, 5.0, 4.0,
    15, 8, true,
    '{"description": "계산대 3대 + 포장/CRM 가입 구역", "register_count": 3, "has_packaging_area": true, "crm_signup_prompt": true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.2 뷰티 플래그십 — 7 zones (22m x 15m = 330sqm)
-- Layout:
--   [입구/테스터]  [스킨케어]  [메이크업]
--   [헤어/바디]   [카운슬링]  [체험존]  [캐셔]
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zones_dim (
  id, org_id, store_id, zone_code, zone_name, zone_type,
  position_x, position_y, position_z,
  size_width, size_depth, size_height,
  area_sqm, capacity, is_active, metadata
)
VALUES
  -- 입구/테스터 바
  (
    'd3020000-0001-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ01', '입구/테스터 바', 'entrance',
    0, 0, 0, 5.0, 5.0, 3.5,
    25, 15, true,
    '{"description": "입구 + 신제품 테스터 바 — 첫인상 체험 존", "traffic_level": "very_high", "has_tester_bar": true, "tester_count": 20, "feature_product": "글로우 세럼 2.0"}'::jsonb
  ),
  -- 스킨케어 존
  (
    'd3020000-0002-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ02', '스킨케어 존', 'display',
    6, 0, 0, 6.0, 7.0, 3.5,
    42, 18, true,
    '{"description": "클렌저, 토너, 세럼, 크림 — 루틴별 진열", "product_category": "skincare", "sku_count": 150, "display_style": "routine_journey", "best_seller": "하이드라 앰플"}'::jsonb
  ),
  -- 메이크업 존
  (
    'd3020000-0003-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ03', '메이크업 존', 'display',
    13, 0, 0, 6.0, 7.0, 3.5,
    42, 18, true,
    '{"description": "립, 아이, 베이스 — 컬러 테스팅 거울 비치", "product_category": "makeup", "sku_count": 200, "mirror_stations": 8, "has_lighting": "daylight_simulation"}'::jsonb
  ),
  -- 헤어/바디 존
  (
    'd3020000-0004-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ04', '헤어/바디 존', 'display',
    0, 0, 6, 5.0, 6.0, 3.5,
    30, 12, true,
    '{"description": "샴푸, 바디워시, 향수 — 향기 체험 특화", "product_category": "hair_body", "sku_count": 120, "scent_tester": true, "fragrance_bar": true}'::jsonb
  ),
  -- 카운슬링 존
  -- AI INSIGHT TRIGGER: 카운슬링존 체류시간 증가 → 상담원 배치 추천
  (
    'd3020000-0005-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ05', '카운슬링 존', 'tester_zone',
    6, 0, 8, 5.0, 5.0, 3.5,
    25, 8, true,
    '{"description": "1:1 피부 상담 + 디바이스 측정 — 고객 전환 핵심 존", "has_skin_analyzer": true, "has_consultation_desk": 3, "avg_consultation_minutes": 15, "ai_insight_trigger": "counseling_dwell_increase", "insight_message": "카운슬링존 체류시간 증가 → 상담원 배치 추천"}'::jsonb
  ),
  -- 체험존 (Experience Zone)
  (
    'd3020000-0006-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ06', '체험존', 'tester_zone',
    12, 0, 8, 6.0, 5.0, 3.5,
    30, 10, true,
    '{"description": "메이크오버 체험 + AR 거울 + 셀피 포토존", "has_ar_mirror": true, "has_photo_zone": true, "has_makeover_service": true, "instagram_hashtag": "#글로우랩성수"}'::jsonb
  ),
  -- 캐셔
  (
    'd3020000-0007-4000-a000-000000000001',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'BZ07', '캐셔', 'checkout',
    19, 0, 8, 3.0, 5.0, 3.5,
    15, 6, true,
    '{"description": "계산대 2대 + 샘플 키트 증정 + 멤버십 가입", "register_count": 2, "sample_kit_promo": true, "membership_signup": true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.3 백화점 식품관 — 8 zones (40m x 25m = 1000sqm)
-- Layout:
--   [메인 통로]                                  [캐셔]
--   [베이커리]  [델리]  [수산]  [정육]  [와인/주류]
--   [시식/체험]
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zones_dim (
  id, org_id, store_id, zone_code, zone_name, zone_type,
  position_x, position_y, position_z,
  size_width, size_depth, size_height,
  area_sqm, capacity, is_active, metadata
)
VALUES
  -- 메인 통로
  (
    'd3030000-0001-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ01', '메인 통로', 'entrance',
    0, 0, 0, 40.0, 4.0, 4.5,
    160, 80, true,
    '{"description": "B1 메인 통로 — 에스컬레이터 하차 후 주동선", "traffic_level": "very_high", "has_signage": true, "direction_flow": "east_to_west"}'::jsonb
  ),
  -- 베이커리
  (
    'd3030000-0002-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ02', '베이커리', 'display',
    0, 0, 5, 8.0, 8.0, 4.5,
    64, 25, true,
    '{"description": "아르티장 베이커리 — 매장 내 오븐 직접 제빵", "product_category": "bakery", "tenant": "메종블레", "has_oven": true, "aroma_marketing": true, "best_seller": "크루아상 세트"}'::jsonb
  ),
  -- 델리
  (
    'd3030000-0003-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ03', '델리', 'display',
    9, 0, 5, 8.0, 8.0, 4.5,
    64, 25, true,
    '{"description": "프리미엄 델리 — 샐러드, 샌드위치, 도시락", "product_category": "deli", "tenant": "그린키친", "has_fresh_counter": true, "lunch_rush_zone": true}'::jsonb
  ),
  -- 수산
  (
    'd3030000-0004-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ04', '수산', 'display',
    18, 0, 5, 8.0, 8.0, 4.5,
    64, 20, true,
    '{"description": "프리미엄 수산물 — 활어, 회, 초밥 코너", "product_category": "seafood", "has_live_tank": true, "has_sashimi_counter": true, "temp_controlled": true}'::jsonb
  ),
  -- 정육
  (
    'd3030000-0005-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ05', '정육', 'display',
    27, 0, 5, 7.0, 8.0, 4.5,
    56, 20, true,
    '{"description": "프리미엄 정육 — 한우, 와규, 숙성육", "product_category": "meat", "has_aging_room": true, "has_butcher_counter": true, "premium_grade": "1++등급 한우"}'::jsonb
  ),
  -- 와인/주류
  (
    'd3030000-0006-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ06', '와인/주류', 'display',
    35, 0, 5, 5.0, 8.0, 4.5,
    40, 15, true,
    '{"description": "와인 셀러 + 위스키 바 — 시음 이벤트 상시", "product_category": "wine_spirits", "wine_cellar_capacity": 800, "has_tasting_bar": true, "sommelier_service": true, "temp_controlled": true}'::jsonb
  ),
  -- 시식/체험 존
  -- AI INSIGHT TRIGGER: 시식 체험존 동선 병목 → 레이아웃 변경 추천
  (
    'd3030000-0007-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ07', '시식/체험', 'tester_zone',
    0, 0, 14, 25.0, 8.0, 4.5,
    200, 60, true,
    '{"description": "시식 체험 코너 — 쿠킹 클래스, 시식 이벤트, 식문화 체험", "has_cooking_class": true, "has_tasting_stations": 8, "event_capacity": 40, "ai_insight_trigger": "tasting_zone_bottleneck", "insight_message": "시식 체험존 동선 병목 → 레이아웃 변경 추천"}'::jsonb
  ),
  -- 캐셔
  (
    'd3030000-0008-4000-a000-000000000001',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'DZ08', '캐셔', 'checkout',
    35, 0, 14, 5.0, 8.0, 4.5,
    40, 20, true,
    '{"description": "통합 계산대 6대 + 셀프 계산대 4대 — 대기열 관리 시스템", "register_count": 6, "self_checkout": 4, "queue_management": true, "avg_wait_minutes": 3.5}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. WIFI ZONES — sensor coverage per demo store
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.wifi_zones (
  id, user_id, org_id, store_id, zone_name, zone_type, coordinates
)
VALUES
  -- 패션 부티크: 4 sensors
  ('d4010000-0001-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'AP-FASH-ENT', 'wifi_probe',
   '{"x": 3.0, "y": 3.0, "z": 2.5, "radius": 10.0, "mac_hash": "sha256:demo_f1"}'::jsonb),
  ('d4010000-0002-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'AP-FASH-WOMEN', 'wifi_probe',
   '{"x": 11.0, "y": 3.0, "z": 5.0, "radius": 12.0, "mac_hash": "sha256:demo_f2"}'::jsonb),
  ('d4010000-0003-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'AP-FASH-MEN', 'wifi_probe',
   '{"x": 19.0, "y": 3.0, "z": 5.0, "radius": 10.0, "mac_hash": "sha256:demo_f3"}'::jsonb),
  ('d4010000-0004-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'AP-FASH-FIT', 'wifi_probe',
   '{"x": 18.0, "y": 3.0, "z": 13.0, "radius": 8.0, "mac_hash": "sha256:demo_f4"}'::jsonb),

  -- 뷰티 플래그십: 3 sensors
  ('d4020000-0001-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'AP-BEAUTY-ENT', 'wifi_probe',
   '{"x": 2.5, "y": 2.5, "z": 2.5, "radius": 8.0, "mac_hash": "sha256:demo_b1"}'::jsonb),
  ('d4020000-0002-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'AP-BEAUTY-MID', 'wifi_probe',
   '{"x": 11.0, "y": 2.5, "z": 5.0, "radius": 12.0, "mac_hash": "sha256:demo_b2"}'::jsonb),
  ('d4020000-0003-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'AP-BEAUTY-EXP', 'wifi_probe',
   '{"x": 15.0, "y": 2.5, "z": 10.0, "radius": 10.0, "mac_hash": "sha256:demo_b3"}'::jsonb),

  -- 백화점 식품관: 5 sensors
  ('d4030000-0001-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'AP-DEPT-MAIN', 'wifi_probe',
   '{"x": 20.0, "y": 3.0, "z": 2.0, "radius": 20.0, "mac_hash": "sha256:demo_d1"}'::jsonb),
  ('d4030000-0002-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'AP-DEPT-WEST', 'wifi_probe',
   '{"x": 8.0, "y": 3.0, "z": 9.0, "radius": 15.0, "mac_hash": "sha256:demo_d2"}'::jsonb),
  ('d4030000-0003-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'AP-DEPT-EAST', 'wifi_probe',
   '{"x": 32.0, "y": 3.0, "z": 9.0, "radius": 15.0, "mac_hash": "sha256:demo_d3"}'::jsonb),
  ('d4030000-0004-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'AP-DEPT-TASTE', 'wifi_probe',
   '{"x": 12.0, "y": 3.0, "z": 18.0, "radius": 15.0, "mac_hash": "sha256:demo_d4"}'::jsonb),
  ('d4030000-0005-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'AP-DEPT-CHK', 'wifi_probe',
   '{"x": 37.0, "y": 3.0, "z": 18.0, "radius": 8.0, "mac_hash": "sha256:demo_d5"}'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. STAFF — demo store employees
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.staff (
  id, org_id, store_id, staff_code, staff_name, role, department,
  hire_date, hourly_rate, is_active
)
VALUES
  -- 패션 부티크 (8명)
  ('d5010000-0001-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'MF-001', '김태현', 'store_manager', '매장관리', '2024-06-01', 28000, true),
  ('d5010000-0002-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'MF-002', '이수진', 'sales_associate', '여성복', '2024-09-15', 15000, true),
  ('d5010000-0003-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'MF-003', '박준형', 'sales_associate', '남성복', '2025-01-10', 14000, true),
  ('d5010000-0004-4000-a000-000000000001', 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'MF-004', '최예린', 'sales_associate', '액세서리', '2025-03-01', 14000, true),

  -- 뷰티 플래그십 (6명)
  ('d5020000-0001-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'GL-001', '서민아', 'store_manager', '매장관리', '2025-05-01', 26000, true),
  ('d5020000-0002-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'GL-002', '윤지혜', 'sales_associate', '뷰티카운슬러', '2025-06-15', 16000, true),
  ('d5020000-0003-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'GL-003', '강민서', 'sales_associate', '스킨케어', '2025-07-01', 14000, true),
  ('d5020000-0004-4000-a000-000000000001', 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'GL-004', '임수아', 'sales_associate', '메이크업', '2025-08-10', 14000, true),

  -- 백화점 식품관 (6 key staff — 25명 중 대표)
  ('d5030000-0001-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-001', '오승환', 'store_manager', '식품관 총괄', '2023-09-01', 35000, true),
  ('d5030000-0002-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-002', '장미란', 'sales_associate', '베이커리', '2024-01-15', 16000, true),
  ('d5030000-0003-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-003', '김동우', 'sales_associate', '수산', '2024-03-01', 18000, true),
  ('d5030000-0004-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-004', '이소연', 'sales_associate', '와인소믈리에', '2024-06-01', 22000, true),
  ('d5030000-0005-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-005', '정우석', 'sales_associate', '정육', '2024-08-15', 18000, true),
  ('d5030000-0006-4000-a000-000000000001', 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'TH-006', '한채원', 'sales_associate', '시식/체험', '2025-01-10', 15000, true)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. DAILY KPI DATA (daily_kpis_agg) — 30 days per demo store
-- ═════════════════════════════════════════════════════════════════════════════
-- Each scenario tells a different data story:
--   Fashion: steady growth, weekends strong, fitting room bottleneck emerging
--   Beauty: Friday/weekend spikes, high conversion, counseling zone impact
--   Department: massive traffic, lunch rush patterns, seasonal event effects

-- ─────────────────────────────────────────────────────────────────────────────
-- 6.1 패션 부티크 KPIs (500sqm, ~1800-2600 visitors/day, premium pricing)
-- Story: S/S 컬렉션 론칭 → 트래픽 증가 but 피팅룸 병목으로 전환율 하락 추세
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.daily_kpis_agg (
  id, org_id, store_id, date,
  total_visitors, unique_visitors, returning_visitors,
  avg_visit_duration_seconds,
  total_transactions, total_revenue, total_units_sold,
  avg_basket_size, avg_transaction_value, conversion_rate,
  browse_to_engage_rate, engage_to_purchase_rate,
  sales_per_sqm, sales_per_visitor,
  weather_condition, temperature, is_holiday, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0001-4000-a000-000000000001',
  'd2000000-0001-4000-a000-000000000001',
  d::date,
  -- total_visitors: base 1800, weekend +500, trend +5/day (S/S 론칭 효과)
  (
    1800
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
    + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END  -- Saturday extra
    + (ROW_NUMBER() OVER (ORDER BY d) * 5)
    + (random() * 200 - 100)::int
  )::int AS total_visitors,
  -- unique: 75% (premium = more new visitors exploring)
  (
    (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 5) + (random() * 200 - 100)::int
    ) * 0.75
  )::int,
  -- returning: 25%
  (
    (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 5) + (random() * 200 - 100)::int
    ) * 0.25
  )::int,
  -- avg_visit_duration: 300-400s (longer in fashion flagship)
  (300 + (random() * 100))::int,
  -- STORY: conversion declining over 30 days (4.2% → 3.6%) — fitting room bottleneck
  (
    (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 5) + (random() * 200 - 100)::int
    ) * GREATEST(0.034, 0.042 - (ROW_NUMBER() OVER (ORDER BY d)) * 0.0003 + random() * 0.003)
  )::int,
  -- revenue: premium pricing 120,000-180,000원 avg ticket
  ROUND(
    (
      (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 5) + (random() * 200 - 100)::int
      ) * GREATEST(0.034, 0.042 - (ROW_NUMBER() OVER (ORDER BY d)) * 0.0003 + random() * 0.003)
    ) * (120000 + random() * 60000), 0
  ),
  -- units: 1.4 items per transaction (fashion = fewer items, higher value)
  (
    (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 5) + (random() * 200 - 100)::int
    ) * GREATEST(0.034, 0.042 - (ROW_NUMBER() OVER (ORDER BY d)) * 0.0003 + random() * 0.003) * 1.4
  )::int,
  ROUND(1.2 + random() * 0.4, 2),
  ROUND(120000 + random() * 60000, 0),
  -- conversion_rate: declining trend 4.2% → 3.6%
  ROUND(GREATEST(3.4, 4.2 - (ROW_NUMBER() OVER (ORDER BY d)) * 0.03 + random() * 0.3)::numeric, 2),
  ROUND((38 + random() * 15)::numeric, 1),
  ROUND((9 + random() * 5)::numeric, 1),
  NULL, NULL,
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny' WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy' WHEN 3 THEN 'rain' ELSE 'snow'
  END,
  ROUND((4 + random() * 12)::numeric, 1),
  EXTRACT(dow FROM d) IN (0, 6),
  '{"source": "demo_seed", "scenario": "fashion_boutique", "version": "1.0"}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6.2 뷰티 플래그십 KPIs (330sqm, ~1200-2000 visitors/day)
-- Story: 카운슬링존 체류시간 증가 → 높은 전환율 but 상담원 부족 시그널
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.daily_kpis_agg (
  id, org_id, store_id, date,
  total_visitors, unique_visitors, returning_visitors,
  avg_visit_duration_seconds,
  total_transactions, total_revenue, total_units_sold,
  avg_basket_size, avg_transaction_value, conversion_rate,
  browse_to_engage_rate, engage_to_purchase_rate,
  sales_per_sqm, sales_per_visitor,
  weather_condition, temperature, is_holiday, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0002-4000-a000-000000000001',
  'd2000000-0002-4000-a000-000000000001',
  d::date,
  -- Beauty: lower visitor count but highly engaged. Friday/weekend spikes.
  (
    1200
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
    + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END  -- Friday beauty rush
    + (ROW_NUMBER() OVER (ORDER BY d) * 3)
    + (random() * 160 - 80)::int
  )::int,
  -- unique: 68% (beauty = higher return rate for repurchase)
  (
    (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 160 - 80)::int
    ) * 0.68
  )::int,
  -- returning: 32%
  (
    (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 160 - 80)::int
    ) * 0.32
  )::int,
  -- STORY: dwell time increasing over 30 days (360s → 480s) — counseling zone popular
  (360 + (ROW_NUMBER() OVER (ORDER BY d) * 4) + (random() * 60)::int)::int,
  -- Beauty: higher conversion 5.0-6.5%, stable
  (
    (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 160 - 80)::int
    ) * (0.050 + random() * 0.015)
  )::int,
  -- revenue: beauty avg ticket 42,000-68,000원
  ROUND(
    (
      (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 160 - 80)::int
      ) * (0.050 + random() * 0.015)
    ) * (42000 + random() * 26000), 0
  ),
  -- units: 2.3 items per basket (beauty = multi-step routine purchases)
  (
    (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 160 - 80)::int
    ) * (0.050 + random() * 0.015) * 2.3
  )::int,
  ROUND(2.0 + random() * 0.6, 2),
  ROUND(42000 + random() * 26000, 0),
  ROUND((5.0 + random() * 1.5)::numeric, 2),
  ROUND((45 + random() * 15)::numeric, 1),
  ROUND((12 + random() * 8)::numeric, 1),
  NULL, NULL,
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny' WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy' WHEN 3 THEN 'rain' ELSE 'snow'
  END,
  ROUND((4 + random() * 12)::numeric, 1),
  EXTRACT(dow FROM d) IN (0, 6),
  '{"source": "demo_seed", "scenario": "beauty_flagship", "version": "1.0"}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6.3 백화점 식품관 KPIs (1000sqm, ~5000-8500 visitors/day, massive traffic)
-- Story: 시식 체험존 트래픽 폭발 → 동선 병목 발생, 주말 정체 심화
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.daily_kpis_agg (
  id, org_id, store_id, date,
  total_visitors, unique_visitors, returning_visitors,
  avg_visit_duration_seconds,
  total_transactions, total_revenue, total_units_sold,
  avg_basket_size, avg_transaction_value, conversion_rate,
  browse_to_engage_rate, engage_to_purchase_rate,
  sales_per_sqm, sales_per_visitor,
  weather_condition, temperature, is_holiday, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0003-4000-a000-000000000001',
  'd2000000-0003-4000-a000-000000000001',
  d::date,
  -- Department food hall: massive traffic. Weekends 1.6x.
  (
    5000
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
    + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END  -- Saturday peak
    + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END  -- Friday pre-weekend
    + (ROW_NUMBER() OVER (ORDER BY d) * 8)                    -- spring trend up
    + (random() * 600 - 300)::int
  )::int,
  -- unique: 60% (food hall = high repeat, regular lunch crowd)
  (
    (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 8) + (random() * 600 - 300)::int
    ) * 0.60
  )::int,
  -- returning: 40% (office workers, regulars)
  (
    (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 8) + (random() * 600 - 300)::int
    ) * 0.40
  )::int,
  -- avg dwell: 180-260s (food hall = browse and buy quickly, except tasting zone)
  (180 + (random() * 80))::int,
  -- conversion: 8-12% (food = impulse buy, high conversion)
  (
    (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 8) + (random() * 600 - 300)::int
    ) * (0.08 + random() * 0.04)
  )::int,
  -- revenue: avg ticket 35,000-65,000원 (food hall, moderate ticket)
  ROUND(
    (
      (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 8) + (random() * 600 - 300)::int
      ) * (0.08 + random() * 0.04)
    ) * (35000 + random() * 30000), 0
  ),
  -- units: 2.8 items per basket (food = multiple items)
  (
    (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 8) + (random() * 600 - 300)::int
    ) * (0.08 + random() * 0.04) * 2.8
  )::int,
  ROUND(2.5 + random() * 0.6, 2),
  ROUND(35000 + random() * 30000, 0),
  ROUND((8.0 + random() * 4.0)::numeric, 2),
  ROUND((55 + random() * 15)::numeric, 1),
  ROUND((15 + random() * 8)::numeric, 1),
  NULL, NULL,
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny' WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy' WHEN 3 THEN 'rain' ELSE 'snow'
  END,
  ROUND((4 + random() * 12)::numeric, 1),
  EXTRACT(dow FROM d) IN (0, 6),
  '{"source": "demo_seed", "scenario": "department_fb", "version": "1.0"}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;


-- ── Backfill computed columns: sales_per_sqm, sales_per_visitor ──
UPDATE public.daily_kpis_agg
SET
  sales_per_sqm = CASE
    WHEN store_id = 'd2000000-0001-4000-a000-000000000001' THEN ROUND(total_revenue / 500.0, 0)
    WHEN store_id = 'd2000000-0002-4000-a000-000000000001' THEN ROUND(total_revenue / 330.0, 0)
    WHEN store_id = 'd2000000-0003-4000-a000-000000000001' THEN ROUND(total_revenue / 1000.0, 0)
  END,
  sales_per_visitor = CASE
    WHEN total_visitors > 0 THEN ROUND(total_revenue / total_visitors, 0)
    ELSE 0
  END
WHERE metadata->>'source' = 'demo_seed'
  AND sales_per_sqm IS NULL;


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. ZONE DAILY METRICS — per-zone analytics for 14 days
-- ═════════════════════════════════════════════════════════════════════════════
-- Each zone has a unique traffic profile and data story.

-- ─────────────────────────────────────────────────────────────────────────────
-- 7.1 패션 부티크 zone metrics (6 zones × 14 days = 84 rows)
-- Story: 피팅룸(FZ05) 전환율 하락 — 대기시간 증가, 여성복(FZ02) 체류 증가
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0001-4000-a000-000000000001',
  'd2000000-0001-4000-a000-000000000001',
  zone_id, d::date,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.75)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.95)::int,
  -- STORY: fitting room dwell increasing over time (wait time growing)
  CASE WHEN zone_id = 'd3010000-0005-4000-a000-000000000001'
    THEN (avg_dwell + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 15)::int
    ELSE avg_dwell
  END,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  -- STORY: fitting room conversion_count declining
  CASE WHEN zone_id = 'd3010000-0005-4000-a000-000000000001'
    THEN GREATEST(1, (base_visitors * traffic_ratio * GREATEST(0.04, conv_ratio - (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 0.003))::int)
    ELSE (base_visitors * traffic_ratio * conv_ratio)::int
  END,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 150000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 14 + (random() * 4)::int
    ELSE 12 + (random() * 3)::int
  END,
  (base_visitors * traffic_ratio / 10)::int,
  ('{"source": "demo_seed", "scenario": "fashion_boutique"}'::jsonb ||
   CASE WHEN zone_id = 'd3010000-0005-4000-a000-000000000001'
     THEN '{"ai_flag": "fitting_room_conversion_declining", "alert": "피팅룸 전환율 하락 추세 감지 — 대기시간 증가 원인 분석 필요"}'::jsonb
     ELSE '{}'::jsonb
   END
  )
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT (
      1800
      + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 500 ELSE 0 END
      + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 200 ELSE 0 END
      + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 5
    ) AS base_visitors
  ) AS bv,
  (VALUES
    -- zone_id, traffic_ratio, avg_dwell (sec), interaction_ratio, conv_ratio
    -- 입구/윈도우: nearly all visitors, brief stop at window display
    ('d3010000-0001-4000-a000-000000000001'::uuid, 0.97,   55, 0.15, 0.00),
    -- 여성복: 60% traffic, high engagement, moderate conversion
    ('d3010000-0002-4000-a000-000000000001'::uuid, 0.60,  240, 0.42, 0.025),
    -- 남성복: 40% traffic
    ('d3010000-0003-4000-a000-000000000001'::uuid, 0.40,  200, 0.35, 0.020),
    -- 액세서리: 35% traffic, cross-sell zone
    ('d3010000-0004-4000-a000-000000000001'::uuid, 0.35,  150, 0.28, 0.015),
    -- 피팅룸: 20% traffic, very high dwell, conversion declining (story)
    ('d3010000-0005-4000-a000-000000000001'::uuid, 0.20,  480, 0.72, 0.08),
    -- 캐셔: only converters
    ('d3010000-0006-4000-a000-000000000001'::uuid, 0.04,  100, 0.95, 0.95)
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7.2 뷰티 플래그십 zone metrics (7 zones × 14 days = 98 rows)
-- Story: 카운슬링존(BZ05) 체류시간 급증 → 고객 대기열, 상담원 추가 필요
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0002-4000-a000-000000000001',
  'd2000000-0002-4000-a000-000000000001',
  zone_id, d::date,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.68)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.94)::int,
  -- STORY: counseling zone dwell time surging (popularity > capacity)
  CASE WHEN zone_id = 'd3020000-0005-4000-a000-000000000001'
    THEN (avg_dwell + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 30)::int
    ELSE avg_dwell
  END,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  (base_visitors * traffic_ratio * conv_ratio)::int,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 55000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 15 + (random() * 3)::int
    WHEN EXTRACT(dow FROM d) = 5 THEN 17 + (random() * 2)::int  -- Friday evening peak
    ELSE 13 + (random() * 3)::int
  END,
  (base_visitors * traffic_ratio / 10)::int,
  ('{"source": "demo_seed", "scenario": "beauty_flagship"}'::jsonb ||
   CASE WHEN zone_id = 'd3020000-0005-4000-a000-000000000001'
     THEN '{"ai_flag": "counseling_dwell_surging", "alert": "카운슬링존 체류시간 14일간 +420초 증가 — 상담원 추가 배치 추천"}'::jsonb
     ELSE '{}'::jsonb
   END
  )
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT (
      1200
      + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
      + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END
      + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 3
    ) AS base_visitors
  ) AS bv,
  (VALUES
    -- 입구/테스터 바: high traffic, brief tester interaction
    ('d3020000-0001-4000-a000-000000000001'::uuid, 0.96,   60, 0.30, 0.00),
    -- 스킨케어: 55%, routine browsing
    ('d3020000-0002-4000-a000-000000000001'::uuid, 0.55,  220, 0.45, 0.030),
    -- 메이크업: 48%, color testing
    ('d3020000-0003-4000-a000-000000000001'::uuid, 0.48,  200, 0.40, 0.025),
    -- 헤어/바디: 30%, scent exploration
    ('d3020000-0004-4000-a000-000000000001'::uuid, 0.30,  180, 0.35, 0.020),
    -- 카운슬링: 25%, very high dwell (story: increasing), high conversion
    ('d3020000-0005-4000-a000-000000000001'::uuid, 0.25,  600, 0.80, 0.12),
    -- 체험존: 35%, AR mirror / photo zone, moderate conversion
    ('d3020000-0006-4000-a000-000000000001'::uuid, 0.35,  360, 0.55, 0.04),
    -- 캐셔: converters only
    ('d3020000-0007-4000-a000-000000000001'::uuid, 0.055, 90,  0.93, 0.93)
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7.3 백화점 식품관 zone metrics (8 zones × 14 days = 112 rows)
-- Story: 시식/체험존(DZ07) 동선 병목 — 주말 peak_occupancy 한계 초과
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0003-4000-a000-000000000001',
  'd2000000-0003-4000-a000-000000000001',
  zone_id, d::date,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.60)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.92)::int,
  avg_dwell,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  (base_visitors * traffic_ratio * conv_ratio)::int,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 50000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  -- Department store: lunch rush 12-13, weekend afternoon 14-16
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 14 + (random() * 2)::int
    ELSE 12 + (random() * 1)::int   -- weekday lunch rush
  END,
  -- STORY: tasting zone peak_occupancy exceeds capacity on weekends
  CASE WHEN zone_id = 'd3030000-0007-4000-a000-000000000001'
       AND EXTRACT(dow FROM d) IN (0, 6)
    THEN (capacity_hint * 1.3 + random() * 10)::int  -- 130% of capacity!
    ELSE (base_visitors * traffic_ratio / 12)::int
  END,
  ('{"source": "demo_seed", "scenario": "department_fb"}'::jsonb ||
   CASE WHEN zone_id = 'd3030000-0007-4000-a000-000000000001'
     THEN '{"ai_flag": "tasting_zone_bottleneck", "alert": "주말 시식존 수용인원 130% 초과 — 동선 분산 또는 레이아웃 변경 추천"}'::jsonb
     ELSE '{}'::jsonb
   END
  )
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT (
      5000
      + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 2500 ELSE 0 END
      + CASE WHEN EXTRACT(dow FROM d) = 6 THEN 800 ELSE 0 END
      + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END
      + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '14 days'))::int / 86400) * 8
    ) AS base_visitors
  ) AS bv,
  (VALUES
    -- zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio, capacity_hint
    -- 메인 통로: nearly everyone passes through, very brief
    ('d3030000-0001-4000-a000-000000000001'::uuid, 0.95,   30, 0.05, 0.00, 80),
    -- 베이커리: high traffic (aroma effect), impulse buys
    ('d3030000-0002-4000-a000-000000000001'::uuid, 0.55,  120, 0.40, 0.15, 25),
    -- 델리: lunch rush critical, weekday peak
    ('d3030000-0003-4000-a000-000000000001'::uuid, 0.45,  150, 0.35, 0.12, 25),
    -- 수산: moderate traffic, premium purchases
    ('d3030000-0004-4000-a000-000000000001'::uuid, 0.30,  180, 0.30, 0.08, 20),
    -- 정육: lower traffic but high value
    ('d3030000-0005-4000-a000-000000000001'::uuid, 0.25,  200, 0.28, 0.06, 20),
    -- 와인/주류: niche traffic, very high dwell, expert consultation
    ('d3030000-0006-4000-a000-000000000001'::uuid, 0.15,  300, 0.50, 0.10, 15),
    -- 시식/체험: BOTTLENECK — high traffic + high dwell = overflow
    ('d3030000-0007-4000-a000-000000000001'::uuid, 0.40,  420, 0.65, 0.18, 60),
    -- 캐셔: all paying customers
    ('d3030000-0008-4000-a000-000000000001'::uuid, 0.10,   80, 0.95, 0.95, 20)
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio, capacity_hint);


-- ═════════════════════════════════════════════════════════════════════════════
-- 8. STORE GOALS — monthly targets per demo store
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.store_goals (
  id, org_id, store_id,
  goal_type, period_type, target_value,
  period_start, period_end, is_active
)
VALUES
  -- 패션 부티크 goals
  (gen_random_uuid(), 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'monthly_revenue', 'monthly', 350000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'conversion_rate', 'monthly', 4.5,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), 'd1000000-0001-4000-a000-000000000001', 'd2000000-0001-4000-a000-000000000001',
   'avg_dwell_time', 'monthly', 5.5,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),

  -- 뷰티 플래그십 goals
  (gen_random_uuid(), 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'monthly_revenue', 'monthly', 180000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), 'd1000000-0002-4000-a000-000000000001', 'd2000000-0002-4000-a000-000000000001',
   'conversion_rate', 'monthly', 6.0,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),

  -- 백화점 식품관 goals
  (gen_random_uuid(), 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'monthly_revenue', 'monthly', 950000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'conversion_rate', 'monthly', 10.0,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), 'd1000000-0003-4000-a000-000000000001', 'd2000000-0003-4000-a000-000000000001',
   'avg_dwell_time', 'monthly', 4.0,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 9. STORE VISITS — sample visit journeys (50 per scenario = 150 total)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 9.1 패션 부티크 visits ──
INSERT INTO public.store_visits (
  id, store_id, org_id,
  visit_date, exit_date, duration_minutes,
  zones_visited, zone_durations,
  made_purchase, purchase_amount,
  entry_point, device_type, data_source
)
SELECT
  gen_random_uuid(),
  'd2000000-0001-4000-a000-000000000001',
  'd1000000-0001-4000-a000-000000000001',
  visit_start,
  visit_start + (duration_min * INTERVAL '1 minute'),
  duration_min,
  zones, zone_dur, purchased,
  CASE WHEN purchased THEN ROUND((80000 + random() * 200000)::numeric, 0) ELSE NULL END,
  'entrance', 'mobile', 'wifi_probe'
FROM (
  SELECT
    (CURRENT_DATE - INTERVAL '3 days' + (random() * INTERVAL '72 hours')) AS visit_start,
    (10 + (random() * 45))::int AS duration_min,
    CASE (random() * 5)::int
      WHEN 0 THEN ARRAY['입구/윈도우', '여성복 존', '캐셔']
      WHEN 1 THEN ARRAY['입구/윈도우', '남성복 존', '액세서리 존', '캐셔']
      WHEN 2 THEN ARRAY['입구/윈도우', '여성복 존', '피팅룸', '캐셔']
      WHEN 3 THEN ARRAY['입구/윈도우', '여성복 존', '액세서리 존', '피팅룸', '캐셔']
      WHEN 4 THEN ARRAY['입구/윈도우', '여성복 존', '남성복 존']
      ELSE ARRAY['입구/윈도우', '여성복 존']
    END AS zones,
    CASE (random() * 5)::int
      WHEN 0 THEN '{"입구/윈도우": 40, "여성복 존": 300, "캐셔": 80}'::jsonb
      WHEN 1 THEN '{"입구/윈도우": 35, "남성복 존": 250, "액세서리 존": 120, "캐셔": 90}'::jsonb
      WHEN 2 THEN '{"입구/윈도우": 30, "여성복 존": 280, "피팅룸": 540, "캐셔": 100}'::jsonb
      WHEN 3 THEN '{"입구/윈도우": 45, "여성복 존": 260, "액세서리 존": 150, "피팅룸": 480, "캐셔": 85}'::jsonb
      WHEN 4 THEN '{"입구/윈도우": 50, "여성복 존": 200, "남성복 존": 180}'::jsonb
      ELSE '{"입구/윈도우": 60, "여성복 존": 240}'::jsonb
    END AS zone_dur,
    random() < 0.04 AS purchased
  FROM generate_series(1, 50) AS n
) AS visits;


-- ── 9.2 뷰티 플래그십 visits ──
INSERT INTO public.store_visits (
  id, store_id, org_id,
  visit_date, exit_date, duration_minutes,
  zones_visited, zone_durations,
  made_purchase, purchase_amount,
  entry_point, device_type, data_source
)
SELECT
  gen_random_uuid(),
  'd2000000-0002-4000-a000-000000000001',
  'd1000000-0002-4000-a000-000000000001',
  visit_start,
  visit_start + (duration_min * INTERVAL '1 minute'),
  duration_min,
  zones, zone_dur, purchased,
  CASE WHEN purchased THEN ROUND((25000 + random() * 100000)::numeric, 0) ELSE NULL END,
  'entrance', 'mobile', 'wifi_probe'
FROM (
  SELECT
    (CURRENT_DATE - INTERVAL '3 days' + (random() * INTERVAL '72 hours')) AS visit_start,
    (12 + (random() * 50))::int AS duration_min,
    CASE (random() * 5)::int
      WHEN 0 THEN ARRAY['입구/테스터 바', '스킨케어 존', '캐셔']
      WHEN 1 THEN ARRAY['입구/테스터 바', '메이크업 존', '체험존', '캐셔']
      WHEN 2 THEN ARRAY['입구/테스터 바', '스킨케어 존', '카운슬링 존', '캐셔']
      WHEN 3 THEN ARRAY['입구/테스터 바', '스킨케어 존', '메이크업 존', '헤어/바디 존']
      WHEN 4 THEN ARRAY['입구/테스터 바', '체험존']
      ELSE ARRAY['입구/테스터 바', '스킨케어 존', '메이크업 존', '카운슬링 존', '캐셔']
    END AS zones,
    CASE (random() * 5)::int
      WHEN 0 THEN '{"입구/테스터 바": 50, "스킨케어 존": 240, "캐셔": 70}'::jsonb
      WHEN 1 THEN '{"입구/테스터 바": 40, "메이크업 존": 200, "체험존": 360, "캐셔": 80}'::jsonb
      WHEN 2 THEN '{"입구/테스터 바": 45, "스킨케어 존": 220, "카운슬링 존": 720, "캐셔": 90}'::jsonb
      WHEN 3 THEN '{"입구/테스터 바": 55, "스킨케어 존": 180, "메이크업 존": 200, "헤어/바디 존": 150}'::jsonb
      WHEN 4 THEN '{"입구/테스터 바": 60, "체험존": 420}'::jsonb
      ELSE '{"입구/테스터 바": 35, "스킨케어 존": 200, "메이크업 존": 180, "카운슬링 존": 600, "캐셔": 85}'::jsonb
    END AS zone_dur,
    random() < 0.055 AS purchased
  FROM generate_series(1, 50) AS n
) AS visits;


-- ── 9.3 백화점 식품관 visits ──
INSERT INTO public.store_visits (
  id, store_id, org_id,
  visit_date, exit_date, duration_minutes,
  zones_visited, zone_durations,
  made_purchase, purchase_amount,
  entry_point, device_type, data_source
)
SELECT
  gen_random_uuid(),
  'd2000000-0003-4000-a000-000000000001',
  'd1000000-0003-4000-a000-000000000001',
  visit_start,
  visit_start + (duration_min * INTERVAL '1 minute'),
  duration_min,
  zones, zone_dur, purchased,
  CASE WHEN purchased THEN ROUND((15000 + random() * 80000)::numeric, 0) ELSE NULL END,
  'entrance', 'mobile', 'wifi_probe'
FROM (
  SELECT
    (CURRENT_DATE - INTERVAL '3 days' + (random() * INTERVAL '72 hours')) AS visit_start,
    (5 + (random() * 35))::int AS duration_min,
    CASE (random() * 6)::int
      WHEN 0 THEN ARRAY['메인 통로', '베이커리', '캐셔']
      WHEN 1 THEN ARRAY['메인 통로', '델리', '캐셔']
      WHEN 2 THEN ARRAY['메인 통로', '수산', '정육', '캐셔']
      WHEN 3 THEN ARRAY['메인 통로', '시식/체험', '베이커리', '캐셔']
      WHEN 4 THEN ARRAY['메인 통로', '와인/주류']
      WHEN 5 THEN ARRAY['메인 통로', '시식/체험', '델리', '수산', '캐셔']
      ELSE ARRAY['메인 통로', '베이커리']
    END AS zones,
    CASE (random() * 6)::int
      WHEN 0 THEN '{"메인 통로": 20, "베이커리": 120, "캐셔": 60}'::jsonb
      WHEN 1 THEN '{"메인 통로": 15, "델리": 150, "캐셔": 70}'::jsonb
      WHEN 2 THEN '{"메인 통로": 25, "수산": 200, "정육": 180, "캐셔": 80}'::jsonb
      WHEN 3 THEN '{"메인 통로": 20, "시식/체험": 420, "베이커리": 100, "캐셔": 65}'::jsonb
      WHEN 4 THEN '{"메인 통로": 30, "와인/주류": 360}'::jsonb
      WHEN 5 THEN '{"메인 통로": 15, "시식/체험": 300, "델리": 120, "수산": 180, "캐셔": 90}'::jsonb
      ELSE '{"메인 통로": 25, "베이커리": 90}'::jsonb
    END AS zone_dur,
    random() < 0.10 AS purchased
  FROM generate_series(1, 50) AS n
) AS visits;


-- ═════════════════════════════════════════════════════════════════════════════
-- 10. HOURLY METRICS — sample data for most recent 3 days (all 3 demo stores)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 10.1 패션 부티크 hourly (11:00-22:00, 11 hours) ──
INSERT INTO public.hourly_metrics (
  id, org_id, store_id, date, hour,
  visitor_count, entry_count, exit_count,
  transaction_count, revenue, units_sold,
  avg_occupancy, peak_occupancy, conversion_rate, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0001-4000-a000-000000000001',
  'd2000000-0001-4000-a000-000000000001',
  d::date, h,
  GREATEST(1, (daily_base * hour_weight)::int),
  GREATEST(1, (daily_base * hour_weight * 0.55)::int),
  GREATEST(1, (daily_base * hour_weight * 0.50)::int),
  GREATEST(0, (daily_base * hour_weight * 0.04)::int),
  ROUND(GREATEST(0, daily_base * hour_weight * 0.04) * 150000, 0),
  GREATEST(0, (daily_base * hour_weight * 0.04 * 1.4)::int),
  GREATEST(1, (daily_base * hour_weight / 4)::int),
  GREATEST(1, (daily_base * hour_weight / 2.5)::int),
  ROUND((3.5 + random() * 1.0)::numeric, 2),
  '{"source": "demo_seed", "scenario": "fashion_boutique"}'::jsonb
FROM
  generate_series(CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d,
  LATERAL (
    SELECT (1800 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 700 ELSE 0 END) AS daily_base
  ) AS db,
  (VALUES
    (11, 0.05), (12, 0.08), (13, 0.10), (14, 0.12), (15, 0.12),
    (16, 0.10), (17, 0.09), (18, 0.11), (19, 0.10), (20, 0.08), (21, 0.05)
  ) AS hours(h, hour_weight);

-- ── 10.2 뷰티 플래그십 hourly (10:00-22:00, 12 hours) ──
INSERT INTO public.hourly_metrics (
  id, org_id, store_id, date, hour,
  visitor_count, entry_count, exit_count,
  transaction_count, revenue, units_sold,
  avg_occupancy, peak_occupancy, conversion_rate, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0002-4000-a000-000000000001',
  'd2000000-0002-4000-a000-000000000001',
  d::date, h,
  GREATEST(1, (daily_base * hour_weight)::int),
  GREATEST(1, (daily_base * hour_weight * 0.50)::int),
  GREATEST(1, (daily_base * hour_weight * 0.48)::int),
  GREATEST(0, (daily_base * hour_weight * 0.055)::int),
  ROUND(GREATEST(0, daily_base * hour_weight * 0.055) * 55000, 0),
  GREATEST(0, (daily_base * hour_weight * 0.055 * 2.3)::int),
  GREATEST(1, (daily_base * hour_weight / 4)::int),
  GREATEST(1, (daily_base * hour_weight / 2.5)::int),
  ROUND((5.0 + random() * 1.5)::numeric, 2),
  '{"source": "demo_seed", "scenario": "beauty_flagship"}'::jsonb
FROM
  generate_series(CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d,
  LATERAL (
    SELECT (1200 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 450 ELSE 0 END
            + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 200 ELSE 0 END) AS daily_base
  ) AS db,
  (VALUES
    (10, 0.04), (11, 0.06), (12, 0.08), (13, 0.09), (14, 0.10), (15, 0.10),
    (16, 0.09), (17, 0.08), (18, 0.11), (19, 0.10), (20, 0.09), (21, 0.06)
  ) AS hours(h, hour_weight);

-- ── 10.3 백화점 식품관 hourly (10:00-22:00, 12 hours, lunch rush) ──
INSERT INTO public.hourly_metrics (
  id, org_id, store_id, date, hour,
  visitor_count, entry_count, exit_count,
  transaction_count, revenue, units_sold,
  avg_occupancy, peak_occupancy, conversion_rate, metadata
)
SELECT
  gen_random_uuid(),
  'd1000000-0003-4000-a000-000000000001',
  'd2000000-0003-4000-a000-000000000001',
  d::date, h,
  GREATEST(1, (daily_base * hour_weight)::int),
  GREATEST(1, (daily_base * hour_weight * 0.50)::int),
  GREATEST(1, (daily_base * hour_weight * 0.48)::int),
  GREATEST(0, (daily_base * hour_weight * 0.10)::int),
  ROUND(GREATEST(0, daily_base * hour_weight * 0.10) * 50000, 0),
  GREATEST(0, (daily_base * hour_weight * 0.10 * 2.8)::int),
  GREATEST(1, (daily_base * hour_weight / 3)::int),
  GREATEST(1, (daily_base * hour_weight / 1.8)::int),
  ROUND((8.0 + random() * 4.0)::numeric, 2),
  '{"source": "demo_seed", "scenario": "department_fb"}'::jsonb
FROM
  generate_series(CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d,
  LATERAL (
    SELECT (5000 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 3300 ELSE 0 END
            + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 500 ELSE 0 END) AS daily_base
  ) AS db,
  (VALUES
    -- Department store food hall: strong lunch rush (12-13), evening rush (18-19)
    (10, 0.04), (11, 0.07), (12, 0.14), (13, 0.13), (14, 0.09), (15, 0.08),
    (16, 0.07), (17, 0.08), (18, 0.12), (19, 0.09), (20, 0.06), (21, 0.03)
  ) AS hours(h, hour_weight);


-- ═════════════════════════════════════════════════════════════════════════════
-- 11. AI RECOMMENDATIONS — pre-seeded insights for demo
-- ═════════════════════════════════════════════════════════════════════════════
-- These represent the AI-generated insights that would appear in the dashboard.

INSERT INTO public.ai_recommendations (
  id, user_id, org_id, store_id,
  recommendation_type, title, description, priority, status,
  expected_impact, evidence, action_category, data_source,
  created_at, is_displayed
)
VALUES
  -- ── Fashion Boutique: 피팅룸 전환율 하락 ──
  (
    'd6010000-0001-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'operational', '피팅룸 대기시간 관리 시스템 도입',
    '최근 14일간 피팅룸 평균 체류시간이 480초에서 690초로 44% 증가했습니다. 동시에 피팅룸 전환율은 8%에서 5.8%로 하락했습니다. 대기시간 증가로 인한 이탈이 원인으로 분석됩니다. 번호표 시스템 도입과 피팅룸 앞 액세서리 크로스셀 존 배치를 추천합니다.',
    'high', 'pending',
    '{"revenue_increase_pct": 8.5, "conversion_lift": 1.2, "estimated_monthly_revenue_gain": 29750000}'::jsonb,
    '{"fitting_room_dwell_increase": "44%", "conversion_drop": "8% → 5.8%", "peak_wait_time_minutes": 12, "abandoned_visits": 45}'::jsonb,
    'layout_optimization', 'zone_daily_metrics',
    now() - INTERVAL '1 day', true
  ),
  (
    'd6010000-0002-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0001-4000-a000-000000000001',
    'd2000000-0001-4000-a000-000000000001',
    'merchandising', '여성복 존 S/S 컬렉션 재배치',
    '여성복 존 체류시간이 240초로 높은 관심을 보이지만, 신상 컬렉션 구역(좌측 3번 랙)의 인터랙션이 타 구역 대비 60% 낮습니다. 동선 흐름상 사각지대가 발생하고 있습니다. 입구 방향에서 시야가 확보되도록 좌측 랙을 15도 회전 배치하면 노출도가 개선될 것으로 예상됩니다.',
    'medium', 'pending',
    '{"engagement_increase_pct": 25, "estimated_monthly_revenue_gain": 12000000}'::jsonb,
    '{"zone_dwell": 240, "blind_spot_racks": [3], "interaction_gap_pct": 60}'::jsonb,
    'visual_merchandising', 'zone_daily_metrics',
    now() - INTERVAL '2 days', true
  ),

  -- ── Beauty Flagship: 카운슬링존 상담원 부족 ──
  (
    'd6020000-0001-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'staffing', '카운슬링존 상담원 추가 배치 권고',
    '카운슬링존 평균 체류시간이 14일간 600초에서 1020초로 70% 증가했습니다. 이는 상담 대기시간 포함으로, 실제 상담 시간(~15분) 대비 대기시간이 7분 추가된 것입니다. 현재 상담석 3석에 상담원 2명 배치 중입니다. 금토일 피크타임(15-19시)에 상담원 1명 추가 투입 시 대기시간 55% 감소, 전환율 15% 상승이 예상됩니다.',
    'high', 'pending',
    '{"conversion_lift": 1.8, "revenue_increase_pct": 12, "estimated_monthly_revenue_gain": 21600000, "customer_satisfaction_improvement": "높음"}'::jsonb,
    '{"counseling_dwell_increase": "70%", "avg_wait_minutes": 7, "current_counselors": 2, "counselor_utilization": "94%", "peak_queue_depth": 8}'::jsonb,
    'staff_optimization', 'zone_daily_metrics',
    now() - INTERVAL '1 day', true
  ),
  (
    'd6020000-0002-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0002-4000-a000-000000000001',
    'd2000000-0002-4000-a000-000000000001',
    'marketing', '체험존 → 구매 전환 퍼널 최적화',
    '체험존(AR 거울/포토존) 방문자의 구매 전환율은 4%로 스킨케어 존(3%) 보다 높지만, 체험존 방문 후 캐셔로 바로 이동하는 비율은 12%에 불과합니다. 체험 후 추천 루틴 안내 POP을 설치하고, 체험 제품 바로 구매 QR코드를 부착하면 전환율 6%까지 상승 가능합니다.',
    'medium', 'pending',
    '{"conversion_lift": 2.0, "estimated_monthly_revenue_gain": 8500000}'::jsonb,
    '{"experience_to_purchase_rate": "12%", "experience_zone_conversion": "4%", "avg_experience_duration_seconds": 360}'::jsonb,
    'conversion_optimization', 'zone_daily_metrics',
    now() - INTERVAL '3 days', true
  ),

  -- ── Department Store: 시식존 동선 병목 ──
  (
    'd6030000-0001-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'operational', '시식/체험존 동선 분산 레이아웃 변경',
    '주말 시식/체험존 피크 수용 인원이 정원(60명)의 130%인 78명을 기록했습니다. 병목으로 인해 인접한 베이커리-델리 통로 흐름이 35% 감소하고, 해당 구역 매출이 평일 대비 주말 비례 성장 미달(-15%)입니다. 시식 스테이션을 현재 집중 배치에서 분산 배치(3개 클러스터)로 변경하고, 메인 통로 쪽에 유도 안내를 설치하면 병목이 해소될 것으로 예상됩니다.',
    'critical', 'pending',
    '{"traffic_flow_improvement": "35%", "revenue_increase_pct": 15, "estimated_monthly_revenue_gain": 142500000, "customer_experience_score_lift": 0.8}'::jsonb,
    '{"peak_occupancy_pct": 130, "bottleneck_impact_zones": ["베이커리", "델리"], "weekend_revenue_gap_pct": -15, "avg_wait_minutes": 8}'::jsonb,
    'layout_optimization', 'zone_daily_metrics',
    now() - INTERVAL '1 day', true
  ),
  (
    'd6030000-0002-4000-a000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'd1000000-0003-4000-a000-000000000001',
    'd2000000-0003-4000-a000-000000000001',
    'staffing', '점심 러시(12-13시) 델리 인력 집중 배치',
    '평일 12-13시 델리 존 트래픽이 전체의 14%를 차지하며, 이 시간대 계산대 대기시간이 평균 6분으로 비피크 대비 3배입니다. 주문-결제 프로세스를 사전 주문 앱과 연동하고, 12-13시 셀프 계산대를 델리 전용으로 전환하면 대기시간 50% 감소가 예상됩니다.',
    'high', 'pending',
    '{"wait_time_reduction": "50%", "revenue_increase_pct": 8, "estimated_monthly_revenue_gain": 76000000}'::jsonb,
    '{"lunch_rush_traffic_share": "14%", "avg_wait_minutes_peak": 6, "avg_wait_minutes_off_peak": 2, "lost_sales_estimate": 850000}'::jsonb,
    'staff_optimization', 'zone_daily_metrics',
    now() - INTERVAL '2 days', true
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- DEMO SCENARIO SEED COMPLETE
-- ═════════════════════════════════════════════════════════════════════════════
-- Summary:
--   Organizations: 3 (패션 부티크, 뷰티 플래그십, 백화점 식품관)
--   Organization Settings: 3
--   Organization Members: 3 (demo user in all 3)
--   Subscriptions: 3 (2 professional + 1 enterprise)
--   Stores: 3 (fashion 500sqm, beauty 330sqm, department 1000sqm)
--   Zones: 21 (6 + 7 + 8)
--   WiFi Zones: 12 (4 + 3 + 5)
--   Staff: 14 (4 + 4 + 6)
--   Daily KPIs: 90 rows (30 days x 3 stores)
--   Zone Daily Metrics: 294 rows (14 days x 21 zones)
--   Store Goals: 8 monthly targets
--   Store Visits: 150 (50 per scenario)
--   Hourly Metrics: ~105 rows (3 days x 11-12 hours x 3 stores)
--   AI Recommendations: 6 pre-seeded insights
--
-- Data Stories:
--   1. Fashion: S/S 론칭 → 트래픽 UP, 피팅룸 병목 → 전환율 DOWN
--      → AI 인사이트: "피팅룸 대기시간 관리 시스템 도입"
--   2. Beauty: 카운슬링존 인기 → 체류시간 급증, 상담원 부족
--      → AI 인사이트: "상담원 추가 배치 권고"
--   3. Department: 시식존 주말 폭발 → 동선 병목, 인접 구역 매출 하락
--      → AI 인사이트: "시식존 분산 레이아웃 변경"
-- ═════════════════════════════════════════════════════════════════════════════

COMMIT;
