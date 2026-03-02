-- =============================================================================
-- Migration: SaaS Subscription Tier System
-- Sprint 2.1 | 2026-03-02
-- =============================================================================
-- Adds tier-based access control for Starter/Growth/Enterprise plans
-- NT_Master Playbook: Starter ₩99K, Growth ₩299K, Enterprise ₩599K+
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Subscription tier enum
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.subscription_tier AS ENUM ('trial', 'starter', 'growth', 'enterprise');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Alter subscriptions table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier public.subscription_tier NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS ai_queries_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_queries_reset_at timestamp with time zone DEFAULT now();

-- Index for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Backfill existing active subscriptions as starter
UPDATE public.subscriptions
  SET tier = 'starter'
  WHERE status = 'active' AND tier = 'trial';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tier feature limits table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tier_limits (
  tier public.subscription_tier PRIMARY KEY,
  max_stores integer NOT NULL,
  max_ai_queries_per_month integer,  -- NULL = unlimited
  kpi_report_levels text[] NOT NULL DEFAULT '{daily}',
  realtime_heatmap boolean NOT NULL DEFAULT false,
  pos_integration boolean NOT NULL DEFAULT false,
  anomaly_alerts boolean NOT NULL DEFAULT false,
  digital_twin_3d boolean NOT NULL DEFAULT false,
  layout_simulation boolean NOT NULL DEFAULT false,
  api_connector boolean NOT NULL DEFAULT false,
  sla_percent numeric(4,1),
  annual_discount_percent integer NOT NULL DEFAULT 0,
  monthly_price_krw integer NOT NULL
);

ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read tier limits (pricing page)
CREATE POLICY "rls_tier_limits_select" ON public.tier_limits
  FOR SELECT TO authenticated USING (true);
-- Anon can also read (for public pricing page)
CREATE POLICY "rls_tier_limits_anon_select" ON public.tier_limits
  FOR SELECT TO anon USING (true);

INSERT INTO public.tier_limits VALUES
  ('trial',      1,   10,   '{daily}',                    false, false, false, false, false, false, NULL, 0,  0),
  ('starter',    3,   0,    '{daily}',                    false, false, false, false, false, false, NULL, 10, 99000),
  ('growth',     50,  100,  '{daily,weekly}',             true,  true,  true,  false, false, false, 99.5, 15, 299000),
  ('enterprise', 999, NULL, '{daily,weekly,monthly}',     true,  true,  true,  true,  true,  true,  99.9, 20, 599000)
ON CONFLICT (tier) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DB helper functions for tier checks
-- ─────────────────────────────────────────────────────────────────────────────

-- Get the active tier for an organization
CREATE OR REPLACE FUNCTION public.get_org_tier(p_org_id uuid)
RETURNS public.subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT s.tier
     FROM public.subscriptions s
     WHERE s.org_id = p_org_id
       AND s.status = 'active'
     ORDER BY s.created_at DESC
     LIMIT 1),
    'trial'::public.subscription_tier
  )
$$;

-- Check if a specific feature is available for an organization
CREATE OR REPLACE FUNCTION public.check_feature_access(p_org_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT CASE p_feature
      WHEN 'realtime_heatmap' THEN tl.realtime_heatmap
      WHEN 'pos_integration' THEN tl.pos_integration
      WHEN 'anomaly_alerts' THEN tl.anomaly_alerts
      WHEN 'digital_twin_3d' THEN tl.digital_twin_3d
      WHEN 'layout_simulation' THEN tl.layout_simulation
      WHEN 'api_connector' THEN tl.api_connector
      ELSE false
    END
    FROM public.subscriptions s
    JOIN public.tier_limits tl ON tl.tier = s.tier
    WHERE s.org_id = p_org_id AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1),
    false
  )
$$;

-- Check and increment AI query count (returns true if within limit)
CREATE OR REPLACE FUNCTION public.use_ai_query(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_limit integer;
  v_used integer;
  v_reset_at timestamptz;
BEGIN
  -- Get limit and current usage
  SELECT tl.max_ai_queries_per_month, s.ai_queries_used, s.ai_queries_reset_at
  INTO v_limit, v_used, v_reset_at
  FROM public.subscriptions s
  JOIN public.tier_limits tl ON tl.tier = s.tier
  WHERE s.org_id = p_org_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Unlimited (NULL limit)
  IF v_limit IS NULL THEN RETURN true; END IF;

  -- No AI queries for this tier (0 limit)
  IF v_limit = 0 THEN RETURN false; END IF;

  -- Monthly reset check
  IF v_reset_at IS NULL OR v_reset_at < date_trunc('month', now()) THEN
    UPDATE public.subscriptions
    SET ai_queries_used = 1, ai_queries_reset_at = now()
    WHERE org_id = p_org_id AND status = 'active';
    RETURN true;
  END IF;

  -- Check within limit
  IF v_used < v_limit THEN
    UPDATE public.subscriptions
    SET ai_queries_used = ai_queries_used + 1
    WHERE org_id = p_org_id AND status = 'active';
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Stripe webhook events log (for idempotency)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,  -- Stripe event ID
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Service role only (webhook handler)
CREATE POLICY "rls_stripe_events_deny" ON public.stripe_events
  FOR SELECT TO authenticated USING (false);
