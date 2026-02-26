-- Fix login 404/403 errors: Add RLS policies for tables accessed during login flow
-- Tables affected: organization_members, stores, subscriptions, onboarding_progress, sample_data_templates

-- ============================================================
-- 1. organization_members — Enable RLS + policies
-- ============================================================

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can read their own membership
CREATE POLICY "Users can read own membership"
  ON public.organization_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own membership (limited fields)
CREATE POLICY "Users can update own membership"
  ON public.organization_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. stores — Enable RLS + policies
-- ============================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Users can read stores they own
CREATE POLICY "Users can read own stores"
  ON public.stores
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- Users can insert stores for their org
CREATE POLICY "Users can insert stores for own org"
  ON public.stores
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- Users can update their own stores
CREATE POLICY "Users can update own stores"
  ON public.stores
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- Users can delete their own stores
CREATE POLICY "Users can delete own stores"
  ON public.stores
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. subscriptions — Enable RLS + policies
-- ============================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read subscriptions for their org
CREATE POLICY "Users can read own org subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. onboarding_progress — Enable RLS + policies
-- ============================================================

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own onboarding progress
CREATE POLICY "Users can read own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding progress
CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. sample_data_templates — Enable RLS + read-only for authenticated
-- ============================================================

ALTER TABLE public.sample_data_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active templates
CREATE POLICY "Authenticated users can read templates"
  ON public.sample_data_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. user_activity_logs — Enable RLS + policies (used during login/logout)
-- ============================================================

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own activity logs
CREATE POLICY "Users can read own activity logs"
  ON public.user_activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. quickstart_guides — Enable RLS + read-only for authenticated
-- ============================================================

ALTER TABLE public.quickstart_guides ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read guides
CREATE POLICY "Authenticated users can read guides"
  ON public.quickstart_guides
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. user_guide_completions — Enable RLS + policies
-- ============================================================

ALTER TABLE public.user_guide_completions ENABLE ROW LEVEL SECURITY;

-- Users can read their own guide completions
CREATE POLICY "Users can read own guide completions"
  ON public.user_guide_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/upsert their own guide completions
CREATE POLICY "Users can insert own guide completions"
  ON public.user_guide_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own guide completions
CREATE POLICY "Users can update own guide completions"
  ON public.user_guide_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
