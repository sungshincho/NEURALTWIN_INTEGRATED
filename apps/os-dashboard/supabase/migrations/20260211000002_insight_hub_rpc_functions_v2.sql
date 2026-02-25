-- =====================================================
-- RPC 함수 v2: 기존 5개 수정 + 신규 4개 생성
--
-- [수정] get_overview_kpis     - avg_dwell_minutes 추가
-- [수정] get_zone_metrics      - conversion_count 추가
-- [수정] get_customer_segments - AVG→SUM/COUNT 프론트엔드 일치
-- [수정] get_inventory_status  - sku, price, days_until_stockout 추가, stock_status 통일
-- [신규] get_store_goals       - store_goals 테이블
-- [신규] get_zones_dim_list    - zones_dim 테이블
-- [신규] get_applied_strategies - applied_strategies 테이블
-- [신규] get_inventory_movements - inventory_movements 테이블
-- [제거] get_hourly_visitors   - 프론트엔드와 동일한 기존 get_hourly_entry_counts RPC 사용
--
-- 목적: 챗봇의 직접 테이블 쿼리를 RPC로 전환하여
--       프론트엔드와 동일한 결과값 보장
-- Date: 2026-02-11
-- =====================================================


-- =====================================================
-- 1. get_overview_kpis (수정)
-- 추가: avg_dwell_minutes (가중평균 체류시간)
-- daily_kpis_agg 직접 쿼리 제거를 위해 체류시간 포함
-- =====================================================

DROP FUNCTION IF EXISTS public.get_overview_kpis(uuid, uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_overview_kpis(
  p_org_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_visitors bigint,
  unique_visitors bigint,
  returning_visitors bigint,
  total_revenue numeric,
  total_transactions bigint,
  avg_conversion_rate numeric,
  avg_transaction_value numeric,
  avg_dwell_minutes numeric,
  funnel_entry bigint,
  funnel_browse bigint,
  funnel_engage bigint,
  funnel_fitting bigint,
  funnel_purchase bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH kpis AS (
    SELECT
      COALESCE(SUM(k.total_visitors), 0)::bigint AS total_visitors,
      COALESCE(SUM(k.unique_visitors), 0)::bigint AS unique_visitors,
      COALESCE(SUM(k.returning_visitors), 0)::bigint AS returning_visitors,
      COALESCE(SUM(k.total_revenue), 0)::numeric AS total_revenue,
      COALESCE(SUM(k.total_transactions), 0)::bigint AS total_transactions,
      COALESCE(AVG(k.conversion_rate), 0)::numeric AS avg_conversion_rate,
      CASE WHEN SUM(k.total_transactions) > 0
           THEN (SUM(k.total_revenue) / SUM(k.total_transactions))::numeric
           ELSE 0 END AS avg_transaction_value,
      CASE WHEN SUM(k.total_visitors) > 0
           THEN ROUND(
             SUM(COALESCE(k.avg_visit_duration_seconds, 0) * COALESCE(k.total_visitors, 0))
             / SUM(k.total_visitors) / 60.0, 1
           )::numeric
           ELSE 0 END AS avg_dwell_minutes
    FROM daily_kpis_agg k
    WHERE k.org_id = p_org_id
      AND k.store_id = p_store_id
      AND k.date >= p_start_date
      AND k.date <= p_end_date
  ),
  funnel AS (
    SELECT
      event_type,
      COUNT(*)::bigint AS cnt
    FROM funnel_events
    WHERE org_id = p_org_id
      AND store_id = p_store_id
      AND event_date >= p_start_date
      AND event_date <= p_end_date
      AND event_type IN ('entry', 'browse', 'engage', 'fitting', 'purchase')
    GROUP BY event_type
  )
  SELECT
    kpis.total_visitors,
    kpis.unique_visitors,
    kpis.returning_visitors,
    kpis.total_revenue,
    kpis.total_transactions,
    kpis.avg_conversion_rate,
    kpis.avg_transaction_value,
    kpis.avg_dwell_minutes,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'entry'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'browse'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'engage'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'fitting'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'purchase'), 0)::bigint
  FROM kpis;
$$;

GRANT EXECUTE ON FUNCTION public.get_overview_kpis(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_overview_kpis(uuid, uuid, date, date) TO service_role;

COMMENT ON FUNCTION public.get_overview_kpis IS '개요탭 KPI 집계 + 퍼널 + 체류시간(가중평균) 통합';


-- =====================================================
-- 2. get_zone_metrics (수정)
-- 추가: conversion_count (프론트엔드 StoreTab.tsx와 일치)
-- 프론트엔드: SUM(conversion_count) / SUM(total_visitors) * 100
-- =====================================================

DROP FUNCTION IF EXISTS public.get_zone_metrics(uuid, uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_zone_metrics(
  p_org_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  zone_id uuid,
  zone_name text,
  zone_type text,
  visitors bigint,
  avg_dwell_seconds numeric,
  revenue numeric,
  conversion_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    zdm.zone_id,
    COALESCE(zd.zone_name, zdm.zone_id::text) AS zone_name,
    COALESCE(zd.zone_type, 'unknown') AS zone_type,
    COALESCE(SUM(zdm.total_visitors), 0)::bigint AS visitors,
    COALESCE(AVG(zdm.avg_dwell_seconds), 0)::numeric AS avg_dwell_seconds,
    COALESCE(SUM(zdm.revenue_attributed), 0)::numeric AS revenue,
    COALESCE(SUM(zdm.conversion_count), 0)::bigint AS conversion_count
  FROM zone_daily_metrics zdm
  LEFT JOIN zones_dim zd
    ON zd.id = zdm.zone_id
    AND zd.org_id = p_org_id
    AND zd.store_id = p_store_id
  WHERE zdm.org_id = p_org_id
    AND zdm.store_id = p_store_id
    AND zdm.date >= p_start_date
    AND zdm.date <= p_end_date
  GROUP BY zdm.zone_id, zd.zone_name, zd.zone_type
  ORDER BY SUM(zdm.total_visitors) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_metrics(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_zone_metrics(uuid, uuid, date, date) TO service_role;

COMMENT ON FUNCTION public.get_zone_metrics IS '존별 방문자/체류시간/매출/전환수 집계 - conversion_count 추가로 프론트엔드와 일치';


-- =====================================================
-- 3. get_customer_segments (수정)
-- 변경: AVG → SUM/COUNT 방식으로 프론트엔드 CustomerTab.tsx와 일치
-- 프론트엔드: SUM(avg_transaction_value) / COUNT(records)
-- 프론트엔드: SUM(visit_frequency) / COUNT(records)
-- =====================================================

DROP FUNCTION IF EXISTS public.get_customer_segments(uuid, uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_customer_segments(
  p_org_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  segment_name text,
  customer_count bigint,
  avg_transaction_value numeric,
  visit_frequency numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cs.segment_name,
    COALESCE(SUM(cs.customer_count), 0)::bigint AS customer_count,
    CASE WHEN COUNT(*) > 0
         THEN ROUND(COALESCE(SUM(cs.avg_transaction_value), 0) / COUNT(*), 0)::numeric
         ELSE 0 END AS avg_transaction_value,
    CASE WHEN COUNT(*) > 0
         THEN ROUND(COALESCE(SUM(cs.visit_frequency), 0)::numeric / COUNT(*), 1)
         ELSE 0 END AS visit_frequency
  FROM customer_segments_agg cs
  WHERE cs.org_id = p_org_id
    AND cs.store_id = p_store_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
  GROUP BY cs.segment_name
  ORDER BY SUM(cs.customer_count) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_segments(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_segments(uuid, uuid, date, date) TO service_role;

COMMENT ON FUNCTION public.get_customer_segments IS '세그먼트별 고객수/객단가/방문빈도 - SUM/COUNT 방식으로 프론트엔드 CustomerTab.tsx와 동일';


-- =====================================================
-- 4. get_inventory_status (수정)
-- 추가: sku, price, days_until_stockout
-- 변경: stock_status - optimal_stock>0 체크 제거 (프론트엔드 JS 로직과 일치)
-- 프론트엔드 calculateStockStatus:
--   critical: current <= minimum
--   low:      current < optimal * 0.5
--   overstock: current > optimal * 1.5
--   normal: else
-- 프론트엔드 calculateDaysUntilStockout:
--   floor(current * 7 / weekly_demand), null if weekly_demand <= 0
-- =====================================================

DROP FUNCTION IF EXISTS public.get_inventory_status(uuid);

CREATE OR REPLACE FUNCTION public.get_inventory_status(
  p_org_id uuid
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  category text,
  price numeric,
  current_stock integer,
  minimum_stock integer,
  optimal_stock integer,
  weekly_demand numeric,
  stock_status text,
  days_until_stockout integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    il.product_id,
    COALESCE(pr.product_name, 'Unknown') AS product_name,
    COALESCE(pr.sku, '') AS sku,
    COALESCE(pr.category, '기타') AS category,
    pr.price,
    il.current_stock,
    il.minimum_stock,
    il.optimal_stock,
    il.weekly_demand,
    CASE
      WHEN il.current_stock <= il.minimum_stock THEN 'critical'
      WHEN il.current_stock < (il.optimal_stock * 0.5)::integer THEN 'low'
      WHEN il.current_stock > (il.optimal_stock * 1.5)::integer THEN 'overstock'
      ELSE 'normal'
    END AS stock_status,
    CASE
      WHEN il.weekly_demand IS NOT NULL AND il.weekly_demand > 0
        THEN FLOOR(il.current_stock * 7.0 / il.weekly_demand)::integer
      ELSE NULL
    END AS days_until_stockout
  FROM inventory_levels il
  LEFT JOIN products pr ON pr.id = il.product_id
  WHERE il.org_id = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid) TO service_role;

COMMENT ON FUNCTION public.get_inventory_status IS '재고 현황 + sku/price/소진예상일수 - 프론트엔드 calculateStockStatus/calculateDaysUntilStockout와 동일 로직';


-- =====================================================
-- 5. get_store_goals (신규)
-- store_goals 테이블 직접 쿼리 대체
-- 프론트엔드 useGoals.ts와 동일 (org_id + store_id 필터)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_store_goals(
  p_org_id uuid,
  p_store_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id uuid,
  goal_type text,
  period_type text,
  target_value numeric,
  period_start date,
  period_end date
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    sg.id,
    sg.goal_type,
    sg.period_type,
    sg.target_value,
    sg.period_start,
    sg.period_end
  FROM store_goals sg
  WHERE sg.org_id = p_org_id
    AND sg.store_id = p_store_id
    AND sg.is_active = true
    AND sg.period_start <= p_date
    AND sg.period_end >= p_date
  ORDER BY sg.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_goals(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_goals(uuid, uuid, date) TO service_role;

COMMENT ON FUNCTION public.get_store_goals IS '활성 목표 조회 - 프론트엔드 useGoals.ts와 동일 (org_id + store_id 필터)';


-- =====================================================
-- 6. get_hourly_visitors — 제거
-- 프론트엔드와 동일한 기존 get_hourly_entry_counts RPC를 사용
-- (20260108_get_hourly_entry_counts_rpc.sql에서 정의됨)
-- =====================================================


-- =====================================================
-- 7. get_zones_dim_list (신규)
-- zones_dim 테이블 직접 쿼리 대체
-- 프론트엔드 useZonesDim()과 동일 (org_id + store_id + is_active 필터)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_zones_dim_list(
  p_org_id uuid,
  p_store_id uuid
)
RETURNS TABLE (
  id uuid,
  zone_name text,
  zone_type text,
  is_active boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    zd.id,
    COALESCE(zd.zone_name, zd.id::text) AS zone_name,
    COALESCE(zd.zone_type, 'unknown') AS zone_type,
    zd.is_active
  FROM zones_dim zd
  WHERE zd.org_id = p_org_id
    AND zd.store_id = p_store_id
    AND zd.is_active = true
  ORDER BY zd.zone_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_zones_dim_list(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_zones_dim_list(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.get_zones_dim_list IS '활성 존 목록 조회 - 프론트엔드 useZonesDim()과 동일 (org_id + store_id + is_active 필터)';


-- =====================================================
-- 8. get_applied_strategies (신규)
-- applied_strategies 테이블 직접 쿼리 대체
-- 프론트엔드 useAppliedStrategies.ts와 동일 (created_at 기준 날짜 필터)
-- 날짜 필터 선택적 (NULL이면 전체)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_applied_strategies(
  p_store_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  source text,
  source_module text,
  status text,
  result text,
  final_roi numeric,
  current_roi numeric,
  expected_roi numeric,
  actual_revenue numeric,
  expected_revenue numeric,
  start_date date,
  end_date date,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id,
    s.name,
    s.source,
    s.source_module,
    s.status,
    s.result,
    s.final_roi,
    s.current_roi,
    s.expected_roi,
    s.actual_revenue,
    s.expected_revenue,
    s.start_date,
    s.end_date,
    s.created_at
  FROM applied_strategies s
  WHERE s.store_id = p_store_id
    AND (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date IS NULL OR s.created_at <= p_end_date)
  ORDER BY s.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_applied_strategies(uuid, timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_applied_strategies(uuid, timestamptz, timestamptz, integer) TO service_role;

COMMENT ON FUNCTION public.get_applied_strategies IS '적용된 전략 이력 조회 - 프론트엔드와 동일 (created_at 기준 날짜 필터)';


-- =====================================================
-- 9. get_inventory_movements (신규)
-- inventory_movements 테이블 직접 쿼리 대체
-- 프론트엔드 useInventoryMetrics.ts와 동일 (moved_at 기준, products JOIN)
-- 챗봇 queryStockMovement()에서 사용
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_inventory_movements(
  p_org_id uuid,
  p_start_date date,
  p_end_date date,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_name text,
  movement_type text,
  quantity integer,
  previous_stock integer,
  new_stock integer,
  reason text,
  moved_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    im.id,
    im.product_id,
    COALESCE(pr.product_name, 'Unknown') AS product_name,
    im.movement_type,
    im.quantity,
    im.previous_stock,
    im.new_stock,
    im.reason,
    im.moved_at
  FROM inventory_movements im
  LEFT JOIN products pr ON pr.id = im.product_id
  WHERE im.org_id = p_org_id
    AND im.moved_at >= p_start_date::timestamptz
    AND im.moved_at < (p_end_date + interval '1 day')::timestamptz
  ORDER BY im.moved_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_movements(uuid, date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_movements(uuid, date, date, integer) TO service_role;

COMMENT ON FUNCTION public.get_inventory_movements IS '입출고 내역 조회 + 상품명 JOIN - inventory_movements 직접 쿼리 대체, moved_at 기준 (프론트엔드 일치)';
