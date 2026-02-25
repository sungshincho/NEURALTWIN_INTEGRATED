-- ============================================================================
-- Create Missing Tables for Settings and Reports
-- ============================================================================

-- 1. Create organization_settings table
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  default_kpi_set TEXT DEFAULT 'standard',
  logo_url TEXT,
  brand_color TEXT DEFAULT '#3b82f6',
  email_notifications BOOLEAN DEFAULT true,
  slack_notifications BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(org_id)
);

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view org settings"
ON public.organization_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.org_id = organization_settings.org_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can update org settings"
ON public.organization_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.org_id = organization_settings.org_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('ORG_HQ', 'ORG_ADMIN')
  )
);

CREATE POLICY "Org admins can insert org settings"
ON public.organization_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.org_id = organization_settings.org_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('ORG_HQ', 'ORG_ADMIN')
  )
);

-- 2. Create report_schedules table
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  recipients TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view org report schedules"
ON public.report_schedules FOR SELECT
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can create org report schedules"
ON public.report_schedules FOR INSERT
WITH CHECK (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can update org report schedules"
ON public.report_schedules FOR UPDATE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org admins can delete org report schedules"
ON public.report_schedules FOR DELETE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

-- 3. Create triggers
CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
BEFORE UPDATE ON public.report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_settings_org ON public.organization_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_org ON public.report_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_user ON public.report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON public.report_schedules(next_run_at) WHERE is_enabled = true;