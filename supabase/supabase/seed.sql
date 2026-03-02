-- =============================================================================
-- NeuralTwin Development Seed Data
-- =============================================================================
-- Version: 1.0 | 2026-03-02
-- Purpose: Populate local/dev environment with realistic Korean retail data
-- Usage:  supabase db reset (runs migrations then this seed)
-- Idempotency: All INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Deterministic UUIDs (used throughout as FK references)
-- ─────────────────────────────────────────────────────────────────────────────
-- We use fixed UUIDs so all foreign keys are satisfied and re-runs are safe.

-- Organizations
-- org_demo:  11111111-1111-1111-1111-111111111111  (NeuralTwin Demo)
-- org_pilot: 22222222-2222-2222-2222-222222222222  (강남 패션스토어)

-- Stores
-- store_demo:    aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  (데모 매장)
-- store_gangnam: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb  (강남점)
-- store_hongdae: cccccccc-cccc-cccc-cccc-cccccccccccc  (홍대점)

-- Demo user (placeholder — in real Supabase, auth.users must exist first)
-- user_demo: dddddddd-dddd-dddd-dddd-dddddddddddd


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. ORGANIZATIONS
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organizations (id, org_name, created_at, updated_at, metadata, member_count)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'NeuralTwin Demo',
    now(), now(),
    '{"tier": "trial", "description": "NeuralTwin 데모 조직 — 제품 시연용", "industry": "retail"}'::jsonb,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '강남 패션스토어',
    now(), now(),
    '{"tier": "starter", "description": "파일럿 고객 — 패션/뷰티 리테일", "industry": "fashion_retail"}'::jsonb,
    2
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. ORGANIZATION SETTINGS
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.organization_settings (id, org_id, timezone, currency, default_kpi_set, brand_color, email_notifications, metadata)
VALUES
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'Asia/Seoul', 'KRW', 'standard', '#6366f1', true,
    '{"language": "ko", "date_format": "YYYY-MM-DD"}'::jsonb
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'Asia/Seoul', 'KRW', 'standard', '#ec4899', true,
    '{"language": "ko", "date_format": "YYYY-MM-DD"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. STORES
-- ═════════════════════════════════════════════════════════════════════════════
-- user_id is required (NOT NULL). We use a fixed demo user UUID.
-- In production, this references auth.users; in dev/seed, it's a placeholder.

INSERT INTO public.stores (
  id, user_id, org_id, store_name, location, store_type,
  status, region, district, area_sqm, floor_area_sqm,
  opening_date, store_format, address, city, country, timezone,
  max_capacity, staff_count, opening_hour, closing_hour, is_active, metadata
)
VALUES
  -- 데모 매장: 패션 매장, 200sqm
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '데모 매장', '서울 강남구', 'fashion',
    'active', '서울', '강남구', 200, 200.00,
    '2025-01-15', 'flagship',
    '서울특별시 강남구 테헤란로 123', '서울', 'KR', 'Asia/Seoul',
    80, 5, 10, 22, true,
    '{"demo": true, "floor_count": 1, "parking": true}'::jsonb
  ),
  -- 강남점: 패션 매장, 150sqm
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    '강남점', '서울 강남구 신사동', 'fashion',
    'active', '서울', '강남구', 150, 150.00,
    '2025-06-01', 'standard',
    '서울특별시 강남구 압구정로 45', '서울', 'KR', 'Asia/Seoul',
    60, 4, 11, 21, true,
    '{"floor_count": 1, "parking": false, "nearby_subway": "신사역"}'::jsonb
  ),
  -- 홍대점: 뷰티 매장, 120sqm
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    '홍대점', '서울 마포구 홍대입구', 'beauty',
    'active', '서울', '마포구', 120, 120.00,
    '2025-09-01', 'standard',
    '서울특별시 마포구 와우산로 67', '서울', 'KR', 'Asia/Seoul',
    45, 3, 11, 22, true,
    '{"floor_count": 1, "parking": false, "nearby_subway": "홍대입구역"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. ZONES (zones_dim) — 4-6 zones per store
-- ═════════════════════════════════════════════════════════════════════════════
-- Zone types: entrance, display, fitting_room, checkout, tester_zone, exit
-- Coordinates: position_x/y/z in meters relative to store origin
-- Size: width (x-axis), depth (z-axis), height (y-axis)

INSERT INTO public.zones_dim (
  id, org_id, store_id, zone_code, zone_name, zone_type,
  position_x, position_y, position_z,
  size_width, size_depth, size_height,
  area_sqm, capacity, is_active, metadata
)
VALUES
  -- ── 데모 매장 (200sqm, 20m x 10m) ──
  (
    'a1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z001', '입구', 'entrance',
    0, 0, 0, 4.0, 3.0, 3.0,
    12, 15, true,
    '{"description": "정문 입구 — 고객 유입 감지 영역", "traffic_level": "high"}'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z002', '디스플레이 A', 'display',
    5, 0, 0, 6.0, 5.0, 3.0,
    30, 20, true,
    '{"description": "메인 디스플레이 — 신상품 진열", "product_category": "outerwear"}'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z003', '디스플레이 B', 'display',
    5, 0, 6, 6.0, 4.0, 3.0,
    24, 15, true,
    '{"description": "서브 디스플레이 — 액세서리/소품", "product_category": "accessories"}'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z004', '피팅룸', 'fitting_room',
    12, 0, 0, 4.0, 3.0, 3.0,
    12, 6, true,
    '{"description": "피팅룸 4칸 — 높은 체류시간 영역", "booth_count": 4}'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z005', '계산대', 'checkout',
    16, 0, 3, 3.0, 4.0, 3.0,
    12, 8, true,
    '{"description": "계산 및 포장 영역", "register_count": 2}'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Z006', '출구', 'exit',
    19, 0, 5, 2.0, 3.0, 3.0,
    6, 10, true,
    '{"description": "출구 영역 — 이탈 감지", "traffic_level": "high"}'::jsonb
  ),

  -- ── 강남점 (150sqm, 15m x 10m) ──
  (
    'b1000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Z001', '입구', 'entrance',
    0, 0, 0, 3.0, 3.0, 3.0,
    9, 12, true,
    '{"description": "매장 입구 — 스트리트 뷰", "traffic_level": "high"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Z002', '여성복 존', 'display',
    4, 0, 0, 5.0, 5.0, 3.0,
    25, 15, true,
    '{"description": "여성복 메인 존", "product_category": "women_apparel"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Z003', '남성복 존', 'display',
    4, 0, 6, 5.0, 4.0, 3.0,
    20, 12, true,
    '{"description": "남성복 디스플레이 존", "product_category": "men_apparel"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Z004', '피팅룸', 'fitting_room',
    10, 0, 0, 3.0, 3.0, 3.0,
    9, 4, true,
    '{"description": "피팅룸 3칸", "booth_count": 3}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Z005', '계산대', 'checkout',
    13, 0, 4, 2.0, 3.0, 3.0,
    6, 6, true,
    '{"description": "계산 영역", "register_count": 1}'::jsonb
  ),

  -- ── 홍대점 (120sqm, 12m x 10m, 뷰티) ──
  (
    'c1000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z001', '입구', 'entrance',
    0, 0, 0, 3.0, 2.5, 3.0,
    7.5, 10, true,
    '{"description": "매장 입구", "traffic_level": "high"}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z002', '스킨케어 존', 'display',
    3, 0, 0, 4.0, 5.0, 3.0,
    20, 12, true,
    '{"description": "스킨케어 제품 진열 존", "product_category": "skincare"}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z003', '메이크업 존', 'display',
    3, 0, 6, 4.0, 4.0, 3.0,
    16, 10, true,
    '{"description": "메이크업 제품 및 거울 테이블", "product_category": "makeup"}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z004', '테스터 존', 'tester_zone',
    8, 0, 0, 3.0, 4.0, 3.0,
    12, 6, true,
    '{"description": "제품 테스트 영역 — 높은 체류시간", "has_mirror": true, "has_sink": true}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z005', '계산대', 'checkout',
    10, 0, 4, 2.0, 3.0, 3.0,
    6, 5, true,
    '{"description": "계산 영역", "register_count": 1}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Z006', '출구', 'exit',
    11, 0, 8, 2.0, 2.0, 3.0,
    4, 8, true,
    '{"description": "출구 영역", "traffic_level": "high"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. WIFI ZONES — sensor coverage areas per store
-- ═════════════════════════════════════════════════════════════════════════════
-- Each wifi_zone maps a physical sensor to a store zone for visitor tracking.
-- user_id is required (NOT NULL), using demo user as sensor administrator.

INSERT INTO public.wifi_zones (
  id, user_id, org_id, store_id, zone_name, zone_type, coordinates
)
VALUES
  -- 데모 매장: 3 sensors
  (
    'e1000000-0000-0000-0000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AP-DEMO-ENT', 'wifi_probe',
    '{"x": 2.0, "y": 2.5, "z": 1.5, "radius": 8.0, "mac_hash": "sha256:a1b2c3d4e5f6"}'::jsonb
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AP-DEMO-MID', 'wifi_probe',
    '{"x": 10.0, "y": 2.5, "z": 5.0, "radius": 10.0, "mac_hash": "sha256:f6e5d4c3b2a1"}'::jsonb
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AP-DEMO-CHK', 'wifi_probe',
    '{"x": 17.0, "y": 2.5, "z": 4.0, "radius": 6.0, "mac_hash": "sha256:1a2b3c4d5e6f"}'::jsonb
  ),
  -- 강남점: 2 sensors
  (
    'e2000000-0000-0000-0000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'AP-GN-FRONT', 'wifi_probe',
    '{"x": 3.0, "y": 2.5, "z": 5.0, "radius": 8.0, "mac_hash": "sha256:aa11bb22cc33"}'::jsonb
  ),
  (
    'e2000000-0000-0000-0000-000000000002',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'AP-GN-BACK', 'wifi_probe',
    '{"x": 11.0, "y": 2.5, "z": 5.0, "radius": 7.0, "mac_hash": "sha256:dd44ee55ff66"}'::jsonb
  ),
  -- 홍대점: 2 sensors
  (
    'e3000000-0000-0000-0000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'AP-HD-MAIN', 'wifi_probe',
    '{"x": 5.0, "y": 2.5, "z": 4.0, "radius": 8.0, "mac_hash": "sha256:77aa88bb99cc"}'::jsonb
  ),
  (
    'e3000000-0000-0000-0000-000000000002',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'AP-HD-TEST', 'wifi_probe',
    '{"x": 9.0, "y": 2.5, "z": 3.0, "radius": 5.0, "mac_hash": "sha256:dd00ee11ff22"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. SUBSCRIPTIONS
-- ═════════════════════════════════════════════════════════════════════════════
-- tier column added by migration 20260302100000_add_subscription_tiers.sql

INSERT INTO public.subscriptions (
  id, org_id, plan_type, status, store_quota, subscription_type,
  billing_cycle, monthly_cost, start_date, end_date,
  tier, stripe_customer_id, stripe_subscription_id,
  ai_queries_used, ai_queries_reset_at
)
VALUES
  -- Demo org: trial tier, no Stripe, 10 free AI queries
  (
    'f1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'trial', 'active', 1, 'LICENSE_BASED',
    'monthly', 0,
    now() - INTERVAL '7 days', now() + INTERVAL '23 days',
    'trial', NULL, NULL,
    3, now()
  ),
  -- Pilot org: starter tier, mock Stripe IDs
  (
    'f1000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'starter', 'active', 3, 'LICENSE_BASED',
    'monthly', 99000,
    now() - INTERVAL '30 days', now() + INTERVAL '335 days',
    'starter', 'cus_mock_gangnam_2026', 'sub_mock_gangnam_starter',
    0, now()
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. DAILY KPI DATA (daily_kpis_agg) — 30 days per store
-- ═════════════════════════════════════════════════════════════════════════════
-- Realistic patterns:
--   * Weekend (Sat/Sun) = 1.3x-1.5x weekday traffic
--   * Gradual upward trend (~1% per week)
--   * Fashion stores: 800-1500 visitors, beauty: 600-1200
--   * Conversion rate: 2.5%-5.5%
--   * Avg dwell time: 180-360 seconds
--   * Revenue correlated with visitors × conversion × avg transaction value

-- Helper: extract day-of-week (0=Sun, 6=Sat in PostgreSQL)
-- Weekend multiplier applied via CASE on EXTRACT(dow)

-- ── 데모 매장 (fashion, 200sqm, ~1000-1400 visitors/day) ──
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
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  d::date,
  -- total_visitors: base 1050 + weekend boost + trend + noise
  (
    1050
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END  -- weekend boost
    + (ROW_NUMBER() OVER (ORDER BY d) * 3)                          -- gradual trend (~+3/day)
    + (random() * 150 - 75)::int                                     -- noise ±75
  )::int AS total_visitors,
  -- unique_visitors: ~80% of total
  (
    (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 150 - 75)::int
    ) * 0.80
  )::int AS unique_visitors,
  -- returning_visitors: ~20% of total
  (
    (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 150 - 75)::int
    ) * 0.20
  )::int AS returning_visitors,
  -- avg_visit_duration: 240-320 seconds (fashion = moderate dwell)
  (240 + (random() * 80))::int AS avg_visit_duration_seconds,
  -- transactions & revenue: conversion 3.5-4.5%
  (
    (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 150 - 75)::int
    ) * (0.035 + random() * 0.010)
  )::int AS total_transactions,
  -- revenue: transactions × avg_txn_value (65,000₩~85,000₩)
  ROUND(
    (
      (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 150 - 75)::int
      ) * (0.035 + random() * 0.010)
    ) * (65000 + random() * 20000), 0
  ) AS total_revenue,
  -- units_sold: transactions × 1.6 avg items per basket
  (
    (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 3) + (random() * 150 - 75)::int
    ) * (0.035 + random() * 0.010) * 1.6
  )::int AS total_units_sold,
  -- avg_basket_size: 1.4~1.8 items
  ROUND(1.4 + random() * 0.4, 2) AS avg_basket_size,
  -- avg_transaction_value: 65,000₩~85,000₩
  ROUND(65000 + random() * 20000, 0) AS avg_transaction_value,
  -- conversion_rate: 3.5-4.5%
  ROUND((3.5 + random() * 1.0)::numeric, 2) AS conversion_rate,
  -- browse_to_engage_rate: 35-50%
  ROUND((35 + random() * 15)::numeric, 1) AS browse_to_engage_rate,
  -- engage_to_purchase_rate: 8-14%
  ROUND((8 + random() * 6)::numeric, 1) AS engage_to_purchase_rate,
  -- sales_per_sqm: revenue / 200
  NULL AS sales_per_sqm,  -- calculated below via UPDATE
  NULL AS sales_per_visitor,
  -- weather (seasonal for late Feb / Mar in Seoul)
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny'
    WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy'
    WHEN 3 THEN 'rain'
    ELSE 'snow'
  END AS weather_condition,
  ROUND((2 + random() * 10)::numeric, 1) AS temperature,  -- 2°C~12°C (Seoul late winter)
  -- holidays: mark weekends as potential
  EXTRACT(dow FROM d) IN (0, 6) AS is_holiday,
  '{"source": "seed", "version": "1.0"}'::jsonb AS metadata
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;

-- ── 강남점 (fashion, 150sqm, ~900-1300 visitors/day) ──
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
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  d::date,
  (
    900
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
    + (ROW_NUMBER() OVER (ORDER BY d) * 2)
    + (random() * 120 - 60)::int
  )::int AS total_visitors,
  (
    (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 120 - 60)::int
    ) * 0.78
  )::int AS unique_visitors,
  (
    (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 120 - 60)::int
    ) * 0.22
  )::int AS returning_visitors,
  (260 + (random() * 100))::int AS avg_visit_duration_seconds,
  (
    (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 120 - 60)::int
    ) * (0.030 + random() * 0.015)
  )::int AS total_transactions,
  ROUND(
    (
      (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 120 - 60)::int
      ) * (0.030 + random() * 0.015)
    ) * (72000 + random() * 18000), 0
  ) AS total_revenue,
  (
    (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 120 - 60)::int
    ) * (0.030 + random() * 0.015) * 1.5
  )::int AS total_units_sold,
  ROUND(1.3 + random() * 0.5, 2) AS avg_basket_size,
  ROUND(72000 + random() * 18000, 0) AS avg_transaction_value,
  ROUND((3.0 + random() * 1.5)::numeric, 2) AS conversion_rate,
  ROUND((32 + random() * 18)::numeric, 1) AS browse_to_engage_rate,
  ROUND((7 + random() * 7)::numeric, 1) AS engage_to_purchase_rate,
  NULL, NULL,
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny' WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy' WHEN 3 THEN 'rain' ELSE 'snow'
  END,
  ROUND((2 + random() * 10)::numeric, 1),
  EXTRACT(dow FROM d) IN (0, 6),
  '{"source": "seed", "version": "1.0"}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;

-- ── 홍대점 (beauty, 120sqm, ~700-1100 visitors/day) ──
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
  '22222222-2222-2222-2222-222222222222',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  d::date,
  -- Beauty stores: lower visitor count but higher conversion
  (
    700
    + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
    + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END  -- Friday boost (beauty shoppers)
    + (ROW_NUMBER() OVER (ORDER BY d) * 2)
    + (random() * 100 - 50)::int
  )::int AS total_visitors,
  (
    (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 100 - 50)::int
    ) * 0.75
  )::int AS unique_visitors,
  (
    (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 100 - 50)::int
    ) * 0.25
  )::int AS returning_visitors,
  -- Beauty = longer dwell (tester zone effect): 280-380 seconds
  (280 + (random() * 100))::int AS avg_visit_duration_seconds,
  -- Beauty = higher conversion: 4.0-5.5%
  (
    (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 100 - 50)::int
    ) * (0.040 + random() * 0.015)
  )::int AS total_transactions,
  -- Beauty avg transaction: 35,000₩~55,000₩ (lower ticket but higher frequency)
  ROUND(
    (
      (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
       + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 100 - 50)::int
      ) * (0.040 + random() * 0.015)
    ) * (35000 + random() * 20000), 0
  ) AS total_revenue,
  (
    (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
     + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
     + (ROW_NUMBER() OVER (ORDER BY d) * 2) + (random() * 100 - 50)::int
    ) * (0.040 + random() * 0.015) * 2.2
  )::int AS total_units_sold,  -- Beauty = more items per basket
  ROUND(2.0 + random() * 0.5, 2) AS avg_basket_size,
  ROUND(35000 + random() * 20000, 0) AS avg_transaction_value,
  ROUND((4.0 + random() * 1.5)::numeric, 2) AS conversion_rate,
  ROUND((40 + random() * 15)::numeric, 1) AS browse_to_engage_rate,
  ROUND((10 + random() * 8)::numeric, 1) AS engage_to_purchase_rate,
  NULL, NULL,
  CASE (random() * 4)::int
    WHEN 0 THEN 'sunny' WHEN 1 THEN 'cloudy'
    WHEN 2 THEN 'partly_cloudy' WHEN 3 THEN 'rain' ELSE 'snow'
  END,
  ROUND((2 + random() * 10)::numeric, 1),
  EXTRACT(dow FROM d) IN (0, 6),
  '{"source": "seed", "version": "1.0"}'::jsonb
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d;

-- ── Backfill computed columns: sales_per_sqm, sales_per_visitor ──
UPDATE public.daily_kpis_agg
SET
  sales_per_sqm = CASE
    WHEN store_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN ROUND(total_revenue / 200.0, 0)
    WHEN store_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN ROUND(total_revenue / 150.0, 0)
    WHEN store_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN ROUND(total_revenue / 120.0, 0)
  END,
  sales_per_visitor = CASE
    WHEN total_visitors > 0 THEN ROUND(total_revenue / total_visitors, 0)
    ELSE 0
  END
WHERE metadata->>'source' = 'seed'
  AND sales_per_sqm IS NULL;


-- ═════════════════════════════════════════════════════════════════════════════
-- 8. ZONE DAILY METRICS — per-zone analytics for 30 days
-- ═════════════════════════════════════════════════════════════════════════════
-- Realistic zone traffic distribution:
--   entrance:     ~100% of store visitors pass through
--   display zones: 40-70% (main), 30-50% (secondary)
--   fitting_room:  15-25% (low traffic but very high dwell)
--   tester_zone:   25-40% (beauty — high dwell)
--   checkout:      conversion-matched, ~3-5.5% of visitors
--   exit:          ~95% of visitors

-- We generate zone metrics for the 데모 매장 (6 zones) as a representative example.
-- The same pattern applies to other stores.

-- 데모 매장 zones
INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  zone_id,
  d::date,
  -- total_visitors per zone = store total × zone traffic ratio
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.80)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.95)::int,
  avg_dwell,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  (base_visitors * traffic_ratio * conv_ratio)::int,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 75000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 14 + (random() * 3)::int  -- weekend peak: 2-5 PM
    ELSE 12 + (random() * 3)::int                                      -- weekday peak: 12-3 PM
  END,
  (base_visitors * traffic_ratio / 12)::int,  -- peak_occupancy ~ 1/12 of daily
  '{"source": "seed"}'::jsonb
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT
      (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END
       + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '30 days'))::int / 86400) * 3
      ) AS base_visitors
  ) AS bv,
  (VALUES
    -- zone_id, traffic_ratio, avg_dwell (sec), interaction_ratio, conv_ratio
    ('a1000000-0000-0000-0000-000000000001'::uuid, 0.98,  45, 0.05, 0.00),   -- 입구: nearly all, low dwell
    ('a1000000-0000-0000-0000-000000000002'::uuid, 0.62, 180, 0.35, 0.02),   -- 디스플레이 A: 62%, moderate dwell
    ('a1000000-0000-0000-0000-000000000003'::uuid, 0.38, 150, 0.30, 0.01),   -- 디스플레이 B: 38%, less traffic
    ('a1000000-0000-0000-0000-000000000004'::uuid, 0.18, 420, 0.70, 0.08),   -- 피팅룸: 18% but very high dwell & conversion
    ('a1000000-0000-0000-0000-000000000005'::uuid, 0.04, 120, 0.90, 0.90),   -- 계산대: only converters, fast
    ('a1000000-0000-0000-0000-000000000006'::uuid, 0.95,  30, 0.02, 0.00)    -- 출구: nearly all, very low dwell
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio);

-- 강남점 zones
INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  zone_id,
  d::date,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.78)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.95)::int,
  avg_dwell,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  (base_visitors * traffic_ratio * conv_ratio)::int,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 80000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 14 + (random() * 3)::int
    ELSE 12 + (random() * 3)::int
  END,
  (base_visitors * traffic_ratio / 10)::int,
  '{"source": "seed"}'::jsonb
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT
      (900 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 250 ELSE 0 END
       + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '30 days'))::int / 86400) * 2
      ) AS base_visitors
  ) AS bv,
  (VALUES
    ('b1000000-0000-0000-0000-000000000001'::uuid, 0.97,  40, 0.04, 0.00),   -- 입구
    ('b1000000-0000-0000-0000-000000000002'::uuid, 0.58, 200, 0.38, 0.02),   -- 여성복 존
    ('b1000000-0000-0000-0000-000000000003'::uuid, 0.42, 170, 0.32, 0.015),  -- 남성복 존
    ('b1000000-0000-0000-0000-000000000004'::uuid, 0.16, 400, 0.65, 0.07),   -- 피팅룸
    ('b1000000-0000-0000-0000-000000000005'::uuid, 0.035,100, 0.92, 0.92)    -- 계산대
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio);

-- 홍대점 zones (beauty store)
INSERT INTO public.zone_daily_metrics (
  id, org_id, store_id, zone_id, date,
  total_visitors, unique_visitors, entry_count, exit_count,
  avg_dwell_seconds, total_dwell_seconds,
  interaction_count, conversion_count, revenue_attributed,
  heatmap_intensity, peak_hour, peak_occupancy, metadata
)
SELECT
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  zone_id,
  d::date,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.75)::int,
  (base_visitors * traffic_ratio)::int,
  (base_visitors * traffic_ratio * 0.94)::int,
  avg_dwell,
  (base_visitors * traffic_ratio * avg_dwell)::int,
  (base_visitors * traffic_ratio * interaction_ratio)::int,
  (base_visitors * traffic_ratio * conv_ratio)::int,
  ROUND(base_visitors * traffic_ratio * conv_ratio * 45000, 0),
  ROUND((traffic_ratio * 100)::numeric, 1),
  CASE
    WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 15 + (random() * 3)::int  -- beauty shoppers later
    ELSE 13 + (random() * 3)::int
  END,
  (base_visitors * traffic_ratio / 10)::int,
  '{"source": "seed"}'::jsonb
FROM
  generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  ) AS d,
  LATERAL (
    SELECT
      (700 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 280 ELSE 0 END
       + CASE WHEN EXTRACT(dow FROM d) = 5 THEN 100 ELSE 0 END
       + (EXTRACT(epoch FROM d - (CURRENT_DATE - INTERVAL '30 days'))::int / 86400) * 2
      ) AS base_visitors
  ) AS bv,
  (VALUES
    ('c1000000-0000-0000-0000-000000000001'::uuid, 0.97,  35, 0.03, 0.00),   -- 입구
    ('c1000000-0000-0000-0000-000000000002'::uuid, 0.55, 200, 0.40, 0.025),  -- 스킨케어 존
    ('c1000000-0000-0000-0000-000000000003'::uuid, 0.48, 180, 0.38, 0.02),   -- 메이크업 존
    ('c1000000-0000-0000-0000-000000000004'::uuid, 0.30, 480, 0.75, 0.10),   -- 테스터 존: high dwell, high conversion
    ('c1000000-0000-0000-0000-000000000005'::uuid, 0.045,100, 0.93, 0.93),   -- 계산대
    ('c1000000-0000-0000-0000-000000000006'::uuid, 0.94,  25, 0.02, 0.00)    -- 출구
  ) AS zones(zone_id, traffic_ratio, avg_dwell, interaction_ratio, conv_ratio);


-- ═════════════════════════════════════════════════════════════════════════════
-- 9. HOURLY METRICS — sample data for most recent 3 days (데모 매장 only)
-- ═════════════════════════════════════════════════════════════════════════════
-- Operating hours: 10-22 (12 hours per day)
-- Traffic pattern: ramps up from 10 AM, peaks at 13-15, secondary peak 18-20

INSERT INTO public.hourly_metrics (
  id, org_id, store_id, date, hour,
  visitor_count, entry_count, exit_count,
  transaction_count, revenue, units_sold,
  avg_occupancy, peak_occupancy, conversion_rate, metadata
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  d::date,
  h,
  -- Visitor distribution by hour (bell curve with afternoon peak)
  GREATEST(1, (daily_base * hour_weight)::int),
  GREATEST(1, (daily_base * hour_weight * 0.55)::int),
  GREATEST(1, (daily_base * hour_weight * 0.50)::int),
  GREATEST(0, (daily_base * hour_weight * 0.04)::int),
  ROUND(GREATEST(0, daily_base * hour_weight * 0.04) * 75000, 0),
  GREATEST(0, (daily_base * hour_weight * 0.04 * 1.6)::int),
  GREATEST(1, (daily_base * hour_weight / 3)::int),
  GREATEST(1, (daily_base * hour_weight / 2)::int),
  ROUND((3.5 + random() * 1.5)::numeric, 2),
  '{"source": "seed"}'::jsonb
FROM
  generate_series(CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') AS d,
  LATERAL (
    SELECT (1050 + CASE WHEN EXTRACT(dow FROM d) IN (0, 6) THEN 300 ELSE 0 END) AS daily_base
  ) AS db,
  (VALUES
    -- hour, weight (fraction of daily total, sums to ~1.0)
    (10, 0.04), (11, 0.07), (12, 0.09), (13, 0.11), (14, 0.12), (15, 0.11),
    (16, 0.09), (17, 0.08), (18, 0.10), (19, 0.09), (20, 0.07), (21, 0.03)
  ) AS hours(h, hour_weight);


-- ═════════════════════════════════════════════════════════════════════════════
-- 10. STORE VISITS — sample recent visits for 데모 매장 (last 3 days)
-- ═════════════════════════════════════════════════════════════════════════════
-- 50 sample visits with zone paths and purchase data

INSERT INTO public.store_visits (
  id, store_id, org_id,
  visit_date, exit_date, duration_minutes,
  zones_visited, zone_durations,
  made_purchase, purchase_amount,
  entry_point, device_type, data_source
)
SELECT
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  visit_start,
  visit_start + (duration_min * INTERVAL '1 minute'),
  duration_min,
  zones,
  zone_dur,
  purchased,
  CASE WHEN purchased THEN ROUND((45000 + random() * 80000)::numeric, 0) ELSE NULL END,
  'entrance', 'mobile',
  'wifi_probe'
FROM (
  SELECT
    (CURRENT_DATE - INTERVAL '2 days' + (random() * INTERVAL '48 hours')) AS visit_start,
    (8 + (random() * 35))::int AS duration_min,
    -- Randomized zone paths
    CASE (random() * 4)::int
      WHEN 0 THEN ARRAY['입구', '디스플레이 A', '출구']
      WHEN 1 THEN ARRAY['입구', '디스플레이 A', '디스플레이 B', '출구']
      WHEN 2 THEN ARRAY['입구', '디스플레이 A', '피팅룸', '계산대', '출구']
      WHEN 3 THEN ARRAY['입구', '디스플레이 B', '디스플레이 A', '피팅룸', '계산대', '출구']
      ELSE ARRAY['입구', '디스플레이 A', '출구']
    END AS zones,
    CASE (random() * 4)::int
      WHEN 0 THEN '{"입구": 30, "디스플레이 A": 180, "출구": 15}'::jsonb
      WHEN 1 THEN '{"입구": 25, "디스플레이 A": 200, "디스플레이 B": 150, "출구": 20}'::jsonb
      WHEN 2 THEN '{"입구": 20, "디스플레이 A": 240, "피팅룸": 420, "계산대": 90, "출구": 15}'::jsonb
      WHEN 3 THEN '{"입구": 30, "디스플레이 B": 180, "디스플레이 A": 210, "피팅룸": 360, "계산대": 100, "출구": 20}'::jsonb
      ELSE '{"입구": 30, "디스플레이 A": 180, "출구": 15}'::jsonb
    END AS zone_dur,
    random() < 0.04 AS purchased  -- ~4% conversion
  FROM generate_series(1, 50) AS n
) AS visits;


-- ═════════════════════════════════════════════════════════════════════════════
-- 11. ORGANIZATION MEMBERS (placeholder)
-- ═════════════════════════════════════════════════════════════════════════════
-- Note: In production, user_id references auth.users.
-- In local dev with `supabase db reset`, you may need to create auth users first.
-- This inserts membership records assuming the demo user UUID exists.

INSERT INTO public.organization_members (id, org_id, user_id, role, joined_at)
VALUES
  (
    'ff000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'ORG_ADMIN',
    now()
  ),
  (
    'ff000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'ORG_ADMIN',
    now()
  )
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 12. PROFILES (placeholder for demo user)
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'NeuralTwin Demo Admin',
  NULL,
  now(), now()
)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 13. STAFF — sample staff for 데모 매장
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.staff (
  id, org_id, store_id, staff_code, staff_name, role, department,
  hire_date, hourly_rate, is_active
)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'STF001', '김민준', 'store_manager', '매장관리',
   '2024-03-15', 22000, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'STF002', '이서윤', 'sales_associate', '판매',
   '2025-01-10', 12500, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'STF003', '박지훈', 'sales_associate', '판매',
   '2025-06-01', 12500, true),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'STF004', '정하은', 'store_manager', '매장관리',
   '2025-05-01', 20000, true),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'STF005', '최유진', 'sales_associate', '판매',
   '2025-07-15', 12000, true),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'STF006', '한소희', 'store_manager', '뷰티카운슬러',
   '2025-08-20', 18000, true),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'STF007', '윤도현', 'sales_associate', '판매',
   '2025-10-01', 12000, true)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- 14. STORE GOALS — monthly targets per store
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.store_goals (
  id, org_id, store_id,
  goal_type, period_type, target_value,
  period_start, period_end, is_active
)
VALUES
  -- 데모 매장 goals
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'monthly_revenue', 'monthly', 120000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'conversion_rate', 'monthly', 4.5,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  -- 강남점 goals
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'monthly_revenue', 'monthly', 90000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true),
  -- 홍대점 goals
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'monthly_revenue', 'monthly', 45000000,
   date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   true)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- SEED COMPLETE
-- ═════════════════════════════════════════════════════════════════════════════
-- Summary:
--   Organizations: 2 (demo trial + pilot starter)
--   Stores: 3 (1 demo + 2 pilot)
--   Zones: 17 (6 + 5 + 6)
--   WiFi Zones: 7 (3 + 2 + 2) sensor coverage areas
--   Subscriptions: 2 (trial + starter with mock Stripe)
--   Daily KPIs: 90 rows (30 days × 3 stores)
--   Zone Daily Metrics: ~510 rows (30 days × 17 zones)
--   Hourly Metrics: ~36 rows (3 days × 12 hours for demo store)
--   Store Visits: 50 sample visits
--   Organization Members: 2 (demo user in both orgs)
--   Staff: 7 employees across 3 stores
--   Store Goals: 4 monthly targets
-- ═════════════════════════════════════════════════════════════════════════════
