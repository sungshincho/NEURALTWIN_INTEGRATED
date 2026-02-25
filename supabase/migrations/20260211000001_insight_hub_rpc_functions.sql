-- =====================================================
-- RPC 함수: 인사이트 허브 데이터 조회 (5개)
-- 프론트엔드 쿼리 로직과 동일한 결과를 반환
--
-- SECURITY DEFINER로 RLS 우회
-- Date: 2026-02-11
-- =====================================================

-- =====================================================
-- 1. get_overview_kpis
-- 개요탭 KPI 집계 + 퍼널 5단계 카운트 통합
-- 참조: InsightDataContext.tsx baseKPIs + funnelData
-- =====================================================

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
           ELSE 0 END AS avg_transaction_value
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
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'entry'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'browse'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'engage'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'fitting'), 0)::bigint,
    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'purchase'), 0)::bigint
  FROM kpis;
$$;

GRANT EXECUTE ON FUNCTION public.get_overview_kpis(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_overview_kpis(uuid, uuid, date, date) TO service_role;

COMMENT ON FUNCTION public.get_overview_kpis IS '개요탭 KPI 집계 + 퍼널 카운트 통합 - 프론트엔드 InsightDataContext.tsx baseKPIs/funnelData와 동일 로직';


-- =====================================================
-- 2. get_zone_metrics
-- 존별 방문자, 체류시간, 매출 집계 (zone_name 포함)
-- 참조: InsightDataContext.tsx zoneMetrics
-- =====================================================

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
  revenue numeric
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
    COALESCE(SUM(zdm.revenue_attributed), 0)::numeric AS revenue
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

COMMENT ON FUNCTION public.get_zone_metrics IS '존별 방문자/체류시간/매출 집계 - zones_dim JOIN으로 zone_name 포함';


-- =====================================================
-- 3. get_customer_segments
-- 세그먼트별 고객수, 평균객단가, 방문빈도 집계
-- 참조: CustomerTab.tsx 인라인 useQuery (세그먼트)
-- =====================================================

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
    COALESCE(AVG(cs.avg_transaction_value), 0)::numeric AS avg_transaction_value,
    COALESCE(AVG(cs.visit_frequency), 0)::numeric AS visit_frequency
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

COMMENT ON FUNCTION public.get_customer_segments IS '세그먼트별 고객수/객단가/방문빈도 집계 - CustomerTab.tsx와 동일 로직';


-- =====================================================
-- 4. get_product_performance
-- 상품별 판매량, 매출, 재고 집계 + 상품명/카테고리
-- 참조: ProductTab.tsx 인라인 useQuery
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_product_performance(
  p_org_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category text,
  revenue numeric,
  units_sold bigint,
  stock_level integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.product_id,
    COALESCE(pr.product_name, 'Unknown') AS product_name,
    COALESCE(pr.category, '기타') AS category,
    COALESCE(SUM(p.revenue), 0)::numeric AS revenue,
    COALESCE(SUM(p.units_sold), 0)::bigint AS units_sold,
    (SELECT pp.stock_level
     FROM product_performance_agg pp
     WHERE pp.product_id = p.product_id
       AND pp.org_id = p_org_id
       AND pp.store_id = p_store_id
       AND pp.date >= p_start_date
       AND pp.date <= p_end_date
       AND pp.stock_level IS NOT NULL
     ORDER BY pp.date DESC
     LIMIT 1) AS stock_level
  FROM product_performance_agg p
  LEFT JOIN products pr ON pr.id = p.product_id
  WHERE p.org_id = p_org_id
    AND p.store_id = p_store_id
    AND p.date >= p_start_date
    AND p.date <= p_end_date
  GROUP BY p.product_id, pr.product_name, pr.category
  ORDER BY SUM(p.revenue) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_performance(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_performance(uuid, uuid, date, date) TO service_role;

COMMENT ON FUNCTION public.get_product_performance IS '상품별 매출/판매량/재고 집계 - products JOIN으로 상품명 포함';


-- =====================================================
-- 5. get_inventory_status
-- 재고 현황 (현재 재고, 최소/적정 재고, 상태 분류) + 상품명
-- 참조: InsightDataContext.tsx inventoryMetrics
-- 주의: org_id만 사용 (store_id, 날짜 필터 없음)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_inventory_status(
  p_org_id uuid
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category text,
  current_stock integer,
  minimum_stock integer,
  optimal_stock integer,
  weekly_demand numeric,
  stock_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    il.product_id,
    COALESCE(pr.product_name, 'Unknown') AS product_name,
    COALESCE(pr.category, '기타') AS category,
    il.current_stock,
    il.minimum_stock,
    il.optimal_stock,
    il.weekly_demand,
    CASE
      WHEN il.current_stock <= il.minimum_stock THEN 'critical'
      WHEN il.optimal_stock > 0 AND il.current_stock < (il.optimal_stock * 0.5)::integer THEN 'low'
      WHEN il.optimal_stock > 0 AND il.current_stock > (il.optimal_stock * 1.5)::integer THEN 'overstock'
      ELSE 'normal'
    END AS stock_status
  FROM inventory_levels il
  LEFT JOIN products pr ON pr.id = il.product_id
  WHERE il.org_id = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid) TO service_role;

COMMENT ON FUNCTION public.get_inventory_status IS '재고 현황 + 상태 분류 - org_id만 사용, 프론트엔드 InsightDataContext.tsx와 동일 로직';
