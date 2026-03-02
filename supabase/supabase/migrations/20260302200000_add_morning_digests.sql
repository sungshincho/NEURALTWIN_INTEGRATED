-- =============================================================================
-- Migration: Create morning_digests table
-- AI-generated daily morning digest for retail store managers
-- 2026-03-02
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: morning_digests
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.morning_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kpi_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_insight TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  weekly_trend JSONB,
  upcoming_context JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, digest_date)
);

-- Add table comment
COMMENT ON TABLE public.morning_digests IS
  'AI-generated daily morning digest for store managers. One per store per day.';
COMMENT ON COLUMN public.morning_digests.kpi_summary IS
  'Top 3 KPI snapshot: visitors, conversion_rate, avg_dwell_time with change_pct';
COMMENT ON COLUMN public.morning_digests.ai_insight IS
  'Most important AI-generated insight based on 4-layer framework (What/Why/So What/Now What)';
COMMENT ON COLUMN public.morning_digests.action_items IS
  'Array of 3 prioritized action items with title, description, category';
COMMENT ON COLUMN public.morning_digests.weekly_trend IS
  'Week-over-week comparison, only populated on Mondays';
COMMENT ON COLUMN public.morning_digests.upcoming_context IS
  'Weather forecast and upcoming events context with recommendations';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Primary lookup: store + date (covered by UNIQUE constraint, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_morning_digests_store_date
  ON public.morning_digests (store_id, digest_date DESC);

-- Org-level queries (list all digests for an org)
CREATE INDEX IF NOT EXISTS idx_morning_digests_org_id
  ON public.morning_digests (org_id);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_morning_digests_digest_date
  ON public.morning_digests (digest_date DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.morning_digests ENABLE ROW LEVEL SECURITY;

-- Org members can read their own organization's digests
-- Uses the existing rls_user_org_ids() helper from 20260302000000_add_missing_rls_policies.sql
CREATE POLICY "rls_morning_digests_select"
  ON public.morning_digests
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.rls_user_org_ids()));

-- Only service_role (Edge Functions) can insert/update/delete
-- No explicit INSERT/UPDATE/DELETE policies for authenticated role;
-- the EF uses createSupabaseAdmin() which bypasses RLS with service_role.
