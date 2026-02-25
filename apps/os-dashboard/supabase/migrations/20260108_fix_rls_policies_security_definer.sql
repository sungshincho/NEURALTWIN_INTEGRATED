-- =====================================================
-- FIX RLS POLICIES: Use SECURITY DEFINER functions
--
-- Problem: RLS policies on L2/L3 tables use inline EXISTS queries
-- that are subject to RLS on organization_members table, causing
-- nested RLS evaluation issues.
--
-- Solution: Replace inline EXISTS with is_org_member() function
-- which is a SECURITY DEFINER function that bypasses RLS.
--
-- Date: 2026-01-08
-- =====================================================

-- First, ensure is_org_member function exists and is up to date
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$$;

-- ============================================
-- L2 TABLES: Replace RLS policies
-- ============================================

-- funnel_events
DROP POLICY IF EXISTS "org_rls" ON public.funnel_events;
CREATE POLICY "org_rls" ON public.funnel_events FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- transactions
DROP POLICY IF EXISTS "org_rls" ON public.transactions;
CREATE POLICY "org_rls" ON public.transactions FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- line_items
DROP POLICY IF EXISTS "org_rls" ON public.line_items;
CREATE POLICY "org_rls" ON public.line_items FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- zone_events
DROP POLICY IF EXISTS "org_rls" ON public.zone_events;
CREATE POLICY "org_rls" ON public.zone_events FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- visit_zone_events
DROP POLICY IF EXISTS "org_rls" ON public.visit_zone_events;
CREATE POLICY "org_rls" ON public.visit_zone_events FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- store_visits
DROP POLICY IF EXISTS "org_rls" ON public.store_visits;
CREATE POLICY "org_rls" ON public.store_visits FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- purchases
DROP POLICY IF EXISTS "org_rls" ON public.purchases;
CREATE POLICY "org_rls" ON public.purchases FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- ============================================
-- L3 TABLES: Replace RLS policies
-- ============================================

-- daily_kpis_agg
DROP POLICY IF EXISTS "org_rls" ON public.daily_kpis_agg;
CREATE POLICY "org_rls" ON public.daily_kpis_agg FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- hourly_metrics
DROP POLICY IF EXISTS "org_rls" ON public.hourly_metrics;
CREATE POLICY "org_rls" ON public.hourly_metrics FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- zone_daily_metrics
DROP POLICY IF EXISTS "org_rls" ON public.zone_daily_metrics;
CREATE POLICY "org_rls" ON public.zone_daily_metrics FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- customer_segments_agg
DROP POLICY IF EXISTS "org_rls" ON public.customer_segments_agg;
CREATE POLICY "org_rls" ON public.customer_segments_agg FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- product_performance_agg
DROP POLICY IF EXISTS "org_rls" ON public.product_performance_agg;
CREATE POLICY "org_rls" ON public.product_performance_agg FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- zone_transitions
DROP POLICY IF EXISTS "org_rls" ON public.zone_transitions;
CREATE POLICY "org_rls" ON public.zone_transitions FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- daily_sales
DROP POLICY IF EXISTS "org_rls" ON public.daily_sales;
CREATE POLICY "org_rls" ON public.daily_sales FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- ============================================
-- DIMENSION TABLES: Ensure RLS with function
-- ============================================

-- zones_dim
DROP POLICY IF EXISTS "org_rls" ON public.zones_dim;
CREATE POLICY "org_rls" ON public.zones_dim FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- products
DROP POLICY IF EXISTS "org_rls" ON public.products;
CREATE POLICY "org_rls" ON public.products FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- customers
DROP POLICY IF EXISTS "org_rls" ON public.customers;
CREATE POLICY "org_rls" ON public.customers FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- stores
DROP POLICY IF EXISTS "org_rls" ON public.stores;
CREATE POLICY "org_rls" ON public.stores FOR ALL USING (
  (org_id IS NULL) OR is_org_member(auth.uid(), org_id)
);

-- ============================================
-- Grant execute permission
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO anon;

-- ============================================
-- Verification query (for manual testing)
-- ============================================
-- Run this after migration to verify:
-- SELECT
--   c.relname AS table_name,
--   p.polname AS policy_name,
--   p.polcmd AS command,
--   pg_get_expr(p.polqual, p.polrelid) AS using_expression
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- WHERE c.relname IN ('funnel_events', 'daily_kpis_agg', 'transactions', 'line_items')
-- ORDER BY c.relname, p.polname;
